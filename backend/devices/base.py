"""
网络分析仪设备基类
定义通用接口与行为
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Union
import socket
import re
import logging

logger = logging.getLogger('multi_channel_system')

class NetworkAnalyzerBase(ABC):
    """网络分析仪基类"""
    
    def __init__(self, device_type: str, resource_name: str):
        """
        初始化网络分析仪
        
        Args:
            device_type: 设备类型标识符
            resource_name: VISA资源名称
        """
        self.device_type = device_type
        self.resource_name = resource_name
        self.instrument = None
        self.tcp_socket = None  # TCP直连socket
        self.connected = False
        self.idn = None  # 设备标识字符串
        self.timeout = 10000  # 默认超时时间（毫秒）
        
        # 从配置加载设备参数
        self.load_device_config()
    
    @abstractmethod
    def load_device_config(self):
        """从配置文件加载设备特定参数"""
        pass
    
    def connect(self) -> Tuple[bool, str]:
        """
        连接设备
        
        Returns:
            (success, message) 元组
        """
        try:
            # 提取IP地址用于日志显示
            ip_match = re.search(r'TCPIP[0-9]*::([^:]+)', self.resource_name)
            ip_display = ip_match.group(1) if ip_match else "设备"
            
            logger.info(f"Connecting to {ip_display}...")
            
            # 尝试不同的VISA资源格式
            resource_formats = [
                self.resource_name,  # 原始格式
            ]
            
            # 根据原始格式添加SOCKET变体
            if '::INSTR' in self.resource_name:
                # 思仪格式: ::INSTR → ::SOCKET
                resource_formats.append(self.resource_name.replace('::INSTR', '::SOCKET'))
            elif self.resource_name.endswith('::INST'):
                # 罗德格式: ::INST → ::SOCKET 
                resource_formats.append(self.resource_name[:-6] + '::SOCKET')
            
            # 去重（避免重复尝试相同格式）
            unique_formats = []
            for fmt in resource_formats:
                if fmt not in unique_formats:
                    unique_formats.append(fmt)
            
            for idx, resource_format in enumerate(unique_formats, 1):
                try:
                    logger.info(f"[格式 {idx}/{len(unique_formats)}] {resource_format}")
                    self.instrument = self._open_resource(resource_format)
                    self.instrument.timeout = self.timeout
                    
                    # 测试连接
                    logger.debug("Querying device ID (*IDN?)")
                    self.idn = self.query('*IDN?')
                    logger.debug(f"Device response: {self.idn}")
                    
                    self.connected = True
                    self.resource_name = resource_format  # 更新为成功的格式
                    
                    # 设备特定的初始化
                    self.initialize()
                    
                    logger.info(f"[成功] Connected to {ip_display}")
                    return True, f"设备连接成功"
                    
                except Exception as e:
                    logger.debug(f"Format {resource_format} failed: {e}")
                    if self.instrument:
                        try:
                            self.instrument.close()
                        except:
                            pass
                        self.instrument = None
                    
                    # 如果不是最后一次尝试，继续下一个格式
                    if idx < len(unique_formats):
                        continue
            
            # 如果所有VISA格式都失败，尝试直接TCP连接
            logger.debug("All VISA formats failed, trying direct TCP connection")
            return self._try_direct_tcp_connection()
            
        except Exception as e:
            self.connected = False
            error_msg = str(e)
            logger.error(f"设备连接失败: {error_msg}")
            
            if "timeout" in error_msg.lower():
                return False, f"连接超时，请检查IP地址和端口是否正确: {error_msg}"
            elif "resource not found" in error_msg.lower():
                return False, f"VISA资源未找到，请检查设备是否开启: {error_msg}"
            else:
                return False, f"设备连接失败: {error_msg}"
    
    @abstractmethod
    def _open_resource(self, resource_name: str):
        """打开VISA资源（由子类实现具体逻辑）"""
        pass
    
    def _try_direct_tcp_connection(self) -> Tuple[bool, str]:
        """
        尝试直接TCP连接
        
        Returns:
            (success, message) 元组
        """
        try:
            # 从资源名称中提取IP和端口
            match = re.search(r'TCPIP[0-9]*::([^:]+)::([^:]+)', self.resource_name)
            if not match:
                return False, "无法解析IP地址和端口"
            
            ip = match.group(1)
            port_str = match.group(2)
            
            # 尝试解析端口号
            try:
                # 如果端口是 "inst0" 或 "INST" 这样的字符串，使用默认端口 5025
                if not port_str.isdigit():
                    port = 5025
                    logger.debug(f"Using default port {port} (original: {port_str})")
                else:
                    port = int(port_str)
            except:
                port = 5025
            
            logger.debug(f"Attempting TCP connection to {ip}:{port}")
            
            # 创建TCP连接（使用较短超时，快速检测失败）
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)  # 连接超时3秒
            sock.connect((ip, port))
            
            # 端口连接成功，但还需要验证设备
            logger.debug(f"Port {port} connected, verifying device...")
            
            # 发送*IDN?命令测试（使用较短超时）
            sock.send(b"*IDN?\n")
            
            # 设置接收超时为5秒（给设备足够时间响应）
            sock.settimeout(5)
            response = sock.recv(1024).decode('utf-8').strip()
            
            if not response:
                sock.close()
                logger.error(f"Port {port} open but no device response")
                return False, f"端口{port}开放但无设备响应，可能是其他服务或网络设备"
            
            logger.debug(f"Device response: {response}")
            
            # 验证设备响应
            if self.validate_idn_response(response):
                self.tcp_socket = sock
                self.connected = True
                self.idn = response
                
                # 恢复正常超时
                sock.settimeout(max(60, self.timeout / 1000))
                
                # 调用设备初始化
                self.initialize()
                
                logger.info(f"[成功] Connected to {ip} via TCP")
                return True, f"TCP连接成功"
            else:
                sock.close()
                logger.error(f"Invalid device response: {response}")
                return False, f"端口响应异常，可能不是VNA设备"
                
        except socket.timeout:
            logger.error("Connection timeout")
            return False, "网络连接失败"
        except ConnectionRefusedError:
            logger.error(f"Connection refused on port {port}")
            return False, "网络连接失败"
        except OSError as e:
            # Windows网络错误（如WinError 10051）
            error_code = getattr(e, 'winerror', None) or getattr(e, 'errno', None)
            
            # 针对常见Windows错误码提供友好提示
            if error_code == 10051:  # 网络不可达
                logger.error(f"Network unreachable (WinError {error_code})")
                return False, "网络连接失败"
            elif error_code == 10060:  # 连接超时
                logger.error(f"Connection timeout (WinError {error_code})")
                return False, "网络连接失败"
            elif error_code == 10061:  # 连接被拒绝
                logger.error(f"Connection refused (WinError {error_code})")
                return False, "网络连接失败"
            else:
                logger.error(f"Network error (code {error_code}): {str(e)}")
                return False, "网络连接失败"
        except Exception as e:
            logger.error(f"TCP connection failed: {str(e)}")
            return False, "设备连接失败，请检查IP地址和端口设置"
    
    @abstractmethod
    def validate_idn_response(self, response: str) -> bool:
        """验证*IDN?响应是否来自预期的设备"""
        pass
    
    @abstractmethod
    def initialize(self):
        """设备特定的初始化配置"""
        pass
    
    def disconnect(self) -> Tuple[bool, str]:
        """
        断开设备连接
        
        Returns:
            (success, message) 元组
        """
        try:
            if self.instrument:
                self.instrument.close()
            if self.tcp_socket:
                self.tcp_socket.close()
            self.connected = False
            self.instrument = None
            self.tcp_socket = None
            self.idn = None
            return True, "设备已断开连接"
        except Exception as e:
            return False, f"断开连接失败: {str(e)}"
    
    def write(self, command: str):
        """
        发送SCPI命令（支持VISA和TCP）
        
        Args:
            command: SCPI命令字符串
        """
        if self.tcp_socket:
            # 使用TCP socket
            if not command.endswith('\n'):
                command += '\n'
            self.tcp_socket.send(command.encode('utf-8'))
        elif self.instrument:
            # 使用VISA
            logger.debug(f"发送命令: {command}")
            self.instrument.write(command)
        else:
            raise RuntimeError("设备未连接")
    
    def query(self, command: str, timeout: Optional[float] = None) -> str:
        """
        发送查询命令并获取响应（支持VISA和TCP）
        
        Args:
            command: SCPI查询命令
            timeout: 可选的超时时间（秒），如果不指定则使用默认值
            
        Returns:
            设备响应字符串
        """
        if self.tcp_socket:
            # 使用TCP socket
            if not command.endswith('\n'):
                command += '\n'
            
            # 如果指定了timeout，临时调整Socket超时
            original_timeout = None
            if timeout is not None:
                original_timeout = self.tcp_socket.gettimeout()
                self.tcp_socket.settimeout(timeout)
                logger.debug(f"临时设置超时: {timeout}秒")
            
            try:
                self.tcp_socket.send(command.encode('utf-8'))
                
                # 接收数据，可能需要多次接收（增大缓冲区并改进接收逻辑）
                response_parts = []
                total_bytes = 0
                max_chunks = 100  # 最多接收100个chunk（防止无限循环）
                chunk_count = 0
                
                # 设置一个较短的超时用于检测数据接收完成
                self.tcp_socket.settimeout(0.5)
                
                while chunk_count < max_chunks:
                    try:
                        # 使用更大的缓冲区（256KB）
                        chunk_bytes = self.tcp_socket.recv(262144)
                        if not chunk_bytes:
                            break
                        
                        total_bytes += len(chunk_bytes)
                        chunk_count += 1
                        
                        # 尝试多种编码方式解码
                        try:
                            chunk = chunk_bytes.decode('utf-8')
                        except UnicodeDecodeError:
                            try:
                                chunk = chunk_bytes.decode('gbk')
                            except UnicodeDecodeError:
                                chunk = chunk_bytes.decode('latin-1')
                        
                        response_parts.append(chunk)
                        
                        # 如果收到换行符，认为数据接收完成
                        if '\n' in chunk:
                            break
                            
                    except socket.timeout as e:
                        # 超时，检查是否已经接收到数据
                        if response_parts:
                            # 已接收到数据，认为接收完成
                            logger.debug(f"Socket超时但已接收到数据: {total_bytes}字节, {chunk_count}个chunk")
                            break
                        elif chunk_count == 0:
                            # 第一个chunk就超时，真正的超时错误
                            # 提供详细的诊断信息
                            error_details = (
                                f"[网络超时错误] 设备未响应查询命令\n"
                                f"命令: {command.strip()}\n"
                                f"超时时间: {timeout if timeout else '默认'}秒\n"
                                f"已接收数据: {total_bytes} 字节 ({chunk_count} 个数据块)\n"
                                f"设备地址: {self.resource_name}\n"
                            )
                            logger.error(error_details)
                            raise TimeoutError(
                                f"设备响应超时 - 命令: {command.strip()} | "
                                f"超时: {timeout if timeout else '默认'}秒 | "
                                f"已接收: {total_bytes}字节"
                            )
                        else:
                            # 中间超时，可能数据已接收完毕
                            logger.debug(f"数据接收中途超时，已接收: {total_bytes}字节, {chunk_count}个chunk")
                            break
                
                response = ''.join(response_parts).strip()
                
                # 记录接收的数据量
                if total_bytes > 10000:
                    logger.debug(f"接收大数据: {total_bytes} 字节, {chunk_count} 个chunk")
                
                return response
            finally:
                # 恢复原始超时设置
                if original_timeout is not None:
                    self.tcp_socket.settimeout(original_timeout)
                    logger.debug(f"恢复超时设置: {original_timeout}秒")
                    
        elif self.instrument:
            # 使用VISA
            if timeout is not None:
                original_timeout = self.instrument.timeout
                self.instrument.timeout = int(timeout * 1000)  # VISA用毫秒
            
            try:
                logger.debug(f"发送查询: {command}")
                response = self.instrument.query(command).strip()
                logger.debug(f"收到响应: {response}")
                return response
            finally:
                if timeout is not None:
                    self.instrument.timeout = original_timeout
        else:
            raise RuntimeError("设备未连接")
    
    def get_error(self) -> Tuple[int, str]:
        """
        获取设备错误状态
        
        Returns:
            (错误码, 错误信息) 元组
        """
        try:
            response = self.query("SYST:ERR?")
            # 处理可能的中文错误信息
            if ',' in response:
                code, msg = response.split(',', 1)
                return int(code), msg.strip('"').strip("'")
            else:
                # 如果格式不对，返回原始响应
                return -1, f"错误响应格式异常: {response}"
        except UnicodeDecodeError as e:
            return -1, f"错误信息编码问题（设备返回中文）: {str(e)}"
        except Exception as e:
            return -1, f"获取错误状态失败: {str(e)}"
    
    @abstractmethod
    def get_measurement_data(self, parameter: str, frequency_points: int = 201) -> Tuple[Optional[Dict], str]:
        """
        获取测量数据
        
        Args:
            parameter: 测量参数（如 S11, SC21 等）
            frequency_points: 频率点数
            
        Returns:
            (data_dict, message) 元组，其中 data_dict 包含：
            - frequencies: 频率点列表
            - magnitude: 幅度列表
            - phase: 相位列表（对于矢量参数）
        """
        pass
    
    @abstractmethod
    def set_frequency_range(self, start_freq: float, stop_freq: float, points: int = 201):
        """
        设置频率扫描范围
        
        Args:
            start_freq: 起始频率（Hz）
            stop_freq: 终止频率（Hz）
            points: 频率点数
        """
        pass
    
    @abstractmethod
    def set_power_level(self, power: float):
        """
        设置源功率电平
        
        Args:
            power: 功率电平（dBm）
        """
        pass
    
    @abstractmethod
    def set_if_bandwidth(self, bandwidth: float):
        """
        设置IF带宽
        
        Args:
            bandwidth: IF带宽（Hz）
        """
        pass
    
    @abstractmethod
    def trigger_sweep(self):
        """触发一次扫描"""
        pass
    
    @abstractmethod
    def wait_for_sweep(self):
        """等待扫描完成"""
        pass

