"""
矩阵开关控制器
封装矩阵开关设备的连接、命令发送等功能
"""

import serial
import serial.tools.list_ports
import socket
import time
import logging
import re
from datetime import datetime
from flask import jsonify
from typing import Tuple, Union

# 使用主logger（将在app.py中配置）
logger = logging.getLogger('multi_channel_system')

# 定义通道集合
COM1_CHANNELS = set(range(0, 73))
COM2_CHANNELS = set(range(73, 77))

class MatrixController:
    """矩阵开关控制器类"""
    
    def __init__(self):
        """初始化控制器"""
        self.connection = None
        self.connection_type = None  # 'serial' 或 'network'
        self.device_ip = '192.168.2.11'
        self.device_port = 5025
        self.current_ip = self.device_ip
        self.current_port = self.device_port
        self.last_handshake = None
    
    def is_connected(self):
        """内部方法：检查连接对象是否有效且可用"""
        return self.connection is not None
    
    def get_ports(self):
        """获取系统可用的串口列表"""
        try:
            ports = serial.tools.list_ports.comports()
            port_list = [port.device for port in ports]
            
            logger.info(f"获取端口列表成功: {len(port_list)} 个端口")
            
            return jsonify({
                'success': True,
                'ports': port_list,
                'count': len(port_list)
            })
        except Exception as e:
            logger.error(f"获取端口列表失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': str(e),
                'ports': []
            }), 500
    
    def connect(self, data):
        """连接到矩阵开关设备"""
        try:
            conn_type = data.get('type', 'network')
            
            # 关闭现有连接
            self._cleanup_connection()
            
            if conn_type == 'network':
                # 网络连接
                ip = data.get('ip', self.device_ip)
                port = data.get('port', self.device_port)
                
                logger.info(f"尝试连接到 {ip}:{port}")
                
                self.connection = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.connection.settimeout(5)
                self.connection.connect((ip, port))
                self.connection.settimeout(2)
                self.connection_type = 'network'
                self.current_ip = ip
                self.current_port = port
                
                handshake_info = self._perform_handshake()
                
                logger.info(f"网络连接成功: {ip}:{port}")
                
                return jsonify({
                    'success': True,
                    'message': f'成功连接到 {ip}:{port}',
                    'type': 'network',
                    'ip': ip,
                    'port': port,
                    'handshake': handshake_info
                })
            else:
                # 串口连接
                port = data.get('port')
                baudrate = data.get('baudrate', 9600)
                
                if not port:
                    return jsonify({
                        'success': False,
                        'message': '请指定串口名称'
                    }), 400
                
                logger.info(f"尝试连接到串口 {port}")
                
                self.connection = serial.Serial(
                    port=port,
                    baudrate=baudrate,
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=1
                )
                self.connection_type = 'serial'
                self.current_port = port
                handshake_info = self._perform_handshake()
                
                time.sleep(0.5)
                
                logger.info(f"串口连接成功: {port} @ {baudrate} bps")
                
                return jsonify({
                    'success': True,
                    'message': f'成功连接到 {port}',
                    'type': 'serial',
                    'port': port,
                    'baudrate': baudrate,
                    'handshake': handshake_info
                })
                
        except socket.timeout:
            logger.error("网络连接超时")
            return jsonify({
                'success': False,
                'message': '连接超时，请检查设备IP和端口是否正确'
            }), 400
        except socket.error as e:
            logger.error(f"网络连接失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'网络连接失败'
            }), 400
        except serial.SerialException as e:
            logger.error(f"串口连接失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'串口连接失败'
            }), 400
        except Exception as e:
            logger.error(f"连接错误: {str(e)}")
            self._cleanup_connection()
            return jsonify({
                'success': False,
                'message': f'连接失败'
            }), 400
    
    def disconnect(self):
        """断开连接"""
        try:
            if self.connection:
                self._cleanup_connection()
                logger.info("断开连接成功")
                return jsonify({
                    'success': True,
                    'message': '已断开连接'
                })
            else:
                return jsonify({
                    'success': True,
                    'message': '当前没有活动连接'
                })
                
        except Exception as e:
            logger.error(f"断开连接失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'断开连接失败'
            }), 500
    
    def get_status(self):
        """获取连接状态"""
        is_connected = self._connection_alive()
        
        if self.connection and not is_connected:
            self._cleanup_connection()
        
        status_info = {
            'connected': is_connected,
            'connection_type': self.connection_type,
            'timestamp': datetime.now().isoformat(),
            'last_handshake': self.last_handshake.isoformat() if self.last_handshake else None
        }
        
        if is_connected:
            if self.connection_type == 'serial' and hasattr(self.connection, 'port'):
                status_info['port'] = self.connection.port
                status_info['baudrate'] = self.connection.baudrate
            elif self.connection_type == 'network':
                status_info['device_ip'] = self.current_ip
                status_info['device_port'] = self.current_port
        else:
            status_info['message'] = '连接未建立或已断开'
        
        return jsonify(status_info)
    
    
    def send_command(self, data):
        """发送命令到设备"""
        try:
            if not self._connection_alive():
                self._cleanup_connection()
                return jsonify({
                    'success': False,
                    'message': '设备未连接'
                }), 400
            
            command = data.get('command', '').strip()
            
            if not command:
                return jsonify({
                    'success': False,
                    'message': '命令不能为空'
                }), 400
            
            # 验证命令格式
            if not self._validate_command(command):
                return jsonify({
                    'success': False,
                    'message': '命令格式不正确'
                }), 400
            
            logger.info(f"发送命令 ({self.connection_type}): {command}")
            
            command_bytes = (command + '\n').encode('utf-8')
            response = ""
            
            if self.connection_type == 'network':
                try:
                    self.connection.sendall(command_bytes)
                    time.sleep(0.1)
                    response = self.connection.recv(1024).decode('utf-8').strip()
                except socket.timeout:
                    logger.warning("等待设备响应超时")
                    response = "超时：设备未响应"
                except socket.error as e:
                    logger.error(f"网络通信错误: {str(e)}")
                    self._cleanup_connection()
                    return jsonify({
                        'success': False,
                        'message': f'网络通信错误'
                    }), 400
            else:
                try:
                    self.connection.reset_input_buffer()
                    self.connection.write(command_bytes)
                    time.sleep(0.2)
                    
                    if self.connection.in_waiting > 0:
                        response = self.connection.readline().decode('utf-8').strip()
                except serial.SerialException as e:
                    logger.error(f"串口通信错误: {str(e)}")
                    self._cleanup_connection()
                    return jsonify({
                        'success': False,
                        'message': f'串口通信错误'
                    }), 400
            
            logger.info(f"命令响应: {response}")
            
            # 解析设备响应，提供更清晰的状态信息
            parsed_response = self._parse_device_response(response, command)
            
            return jsonify({
                'success': parsed_response['success'],
                'command': command,
                'response': response if response else '设备无响应（可能正常执行）',
                'message': parsed_response['message'],
                'status': parsed_response['status'],
                'connection_type': self.connection_type,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"命令执行错误: {str(e)}")
            self._cleanup_connection()
            return jsonify({
                'success': False,
                'message': f'命令执行错误'
            }), 400
    
    def set_route(self, data):
        """设置射频通道路由"""
        if not self._connection_alive():
            self._cleanup_connection()
            return jsonify({'success': False, 'message': '设备未连接'}), 400
        
        from_port = data.get('from_port', '').strip()
        to_port = data.get('to_port', '').strip()
        
        if not from_port or not to_port:
            return jsonify({'success': False, 'message': 'from_port 和 to_port 不能为空'}), 400
        
        try:
            cmd_str = self._path_to_cmd(from_port, to_port)
            ok, resp = self._execute_route_commands(cmd_str)
            if ok:
                return jsonify({'success': True, 'sent': cmd_str.splitlines(), 'response': resp})
            return jsonify({'success': False, 'message': resp}), 400
        except ValueError as ve:
            return jsonify({'success': False, 'message': str(ve)}), 400
        except Exception as e:
            logger.exception("set_route 异常")
            return jsonify({'success': False, 'message': str(e)}), 400
    
    def set_switch(self, data):
        """设置开关端口"""
        if not self._connection_alive():
            self._cleanup_connection()
            return jsonify({'success': False, 'message': '设备未连接'}), 400
        
        sw_id = data.get('sw_id')
        target = data.get('target')
        
        if sw_id is None or target is None:
            return jsonify({'success': False, 'message': 'sw_id 和 target 不能为空'}), 400
        
        try:
            cmd_str = self._sw_cmd(int(sw_id), int(target))
            ok, resp = self._execute_route_commands(cmd_str)
            if ok:
                return jsonify({'success': True, 'sent': cmd_str, 'response': resp})
            return jsonify({'success': False, 'message': resp}), 400
        except ValueError as ve:
            return jsonify({'success': False, 'message': str(ve)}), 400
        except Exception as e:
            logger.exception("set_switch 异常")
            return jsonify({'success': False, 'message': str(e)}), 400
    
    def _path_to_cmd(self, from_port: str, to_port: str) -> str:
        """根据逻辑路径生成ROUTE指令"""
        left_type, left_val = self._parse_port(from_port)
        right_type, right_val = self._parse_port(to_port)
        
        if left_type == "COM" and right_type == "COM":
            raise ValueError("不能连接两个COM端口")
        if left_type == "CH" and right_type == "CH":
            raise ValueError("不能连接两个CH端口")
        
        # 统一成 COM 在左，CH 在右
        if left_type == "CH" and right_type == "COM":
            left_type, right_type = right_type, left_type
            left_val, right_val = right_val, left_val
        
        if left_type != "COM" or right_type != "CH":
            raise ValueError("无效的端口组合")
        
        if left_val == "COM1":
            if right_val not in COM1_CHANNELS:
                raise ValueError(f"CH{right_val} 不能连接到 COM1")
            clear_cmd = f"ROUTE:CHANGETO:{right_val}:0"
            build_cmd = f"ROUTE:PATHSWITCH:{right_val}:0"
            return f"{clear_cmd}\n{build_cmd}"
        
        if left_val == "COM2":
            if right_val not in COM2_CHANNELS:
                raise ValueError(f"CH{right_val} 不能连接到 COM2")
            clear_cmd = f"ROUTE:CHANGETO:{right_val}:0"
            build_cmd = f"ROUTE:PATHSWITCH:{right_val}:{right_val}"
            return f"{clear_cmd}\n{build_cmd}"
        
        raise ValueError("无效的端口组合")
    
    def _sw_cmd(self, sw_id: int, target: int) -> str:
        """生成开关命令"""
        if 1 <= sw_id <= 72:
            if target not in (1, 2):
                raise ValueError(f"开关 {sw_id} 只能切换到状态 1 或 2")
            return f"ROUTE:CHANGETO:{sw_id}:{target}"
        if 73 <= sw_id <= 81:
            if not (0 <= target <= 8):
                raise ValueError(f"开关 {sw_id} 目标值范围为 0-8")
            return f"ROUTE:CHANGETO:{sw_id}:{target}"
        if sw_id == 82:
            if not (0 <= target <= 9):
                raise ValueError(f"开关 82 目标值范围为 0-9")
            return f"ROUTE:CHANGETO:{sw_id}:{target}"
        if sw_id == 83:
            if not (0 <= target <= 4):
                raise ValueError(f"开关 83 目标值范围为 0-4")
            return f"ROUTE:CHANGETO:{sw_id}:{target}"
        raise ValueError(f"不支持的开关编号: {sw_id}")
    
    def _parse_port(self, s: str) -> Tuple[str, Union[int, str]]:
        """解析端口名称"""
        if s == "COM1":
            return "COM", "COM1"
        if s == "COM2":
            return "COM", "COM2"
        if s.startswith("CH"):
            try:
                n = int(s[2:])
            except Exception:
                raise ValueError(f"无效的通道号: {s}")
            if not (0 <= n <= 76):
                raise ValueError(f"通道号超出范围: {n}")
            return "CH", n
        raise ValueError(f"无法识别的端口: {s}")
    
    def _execute_route_commands(self, commands: str) -> Tuple[bool, str]:
        """执行路由命令"""
        lines = [ln.strip() for ln in commands.splitlines() if ln.strip()]
        full_resp = []
        try:
            for line in lines:
                logger.info(f"发送矩阵指令 ({self.connection_type}): {line}")
                cmd_bytes = (line + '\n').encode('utf-8')
                if self.connection_type == 'network':
                    self.connection.sendall(cmd_bytes)
                    resp = self.connection.recv(1024).decode('utf-8').strip()
                    full_resp.append(resp)
                else:  # serial
                    if hasattr(self.connection, 'reset_input_buffer'):
                        self.connection.reset_input_buffer()
                    self.connection.write(cmd_bytes)
                    if hasattr(self.connection, 'in_waiting') and self.connection.in_waiting:
                        resp = self.connection.readline().decode('utf-8').strip()
                        full_resp.append(resp)
            return True, '\n'.join(full_resp) if full_resp else 'OK'
        except Exception as e:
            logger.exception("_execute_route_commands 失败")
            self._cleanup_connection()
            return False, str(e)

    def _connection_alive(self) -> bool:
        """检测当前连接是否仍然可用"""
        if not self.connection:
            return False
        
        try:
            if self.connection_type == 'network':
                try:
                    self.connection.send(b'')
                except BlockingIOError:
                    return True
                except OSError:
                    return False
                return True
            
            if self.connection_type == 'serial':
                return bool(getattr(self.connection, 'is_open', False))
        except Exception as exc:
            logger.warning(f"连接探活失败: {exc}")
            return False
        
        return False

    def _cleanup_connection(self):
        """统一清理连接资源"""
        if not self.connection:
            return
        
        try:
            if self.connection_type == 'network':
                try:
                    self.connection.shutdown(socket.SHUT_RDWR)
                except OSError:
                    pass
                self.connection.close()
            elif self.connection_type == 'serial':
                if hasattr(self.connection, 'is_open') and self.connection.is_open:
                    self.connection.close()
        except Exception as exc:
            logger.warning(f"清理连接时出错: {exc}")
        finally:
            self.connection = None
            self.connection_type = None
            self.last_handshake = None

    def _perform_handshake(self) -> str:
        """向设备发送握手命令，确保连接真实可用"""
        if not self.connection:
            raise ConnectionError("握手失败：没有可用连接")
        
        handshake_cmd = '*IDN?\n'
        response = ''
        
        try:
            if self.connection_type == 'network':
                self.connection.sendall(handshake_cmd.encode('utf-8'))
                response = self.connection.recv(1024).decode('utf-8').strip()
            elif self.connection_type == 'serial':
                if hasattr(self.connection, 'reset_input_buffer'):
                    self.connection.reset_input_buffer()
                self.connection.write(handshake_cmd.encode('utf-8'))
                time.sleep(0.2)
                response = self.connection.readline().decode('utf-8').strip() if hasattr(self.connection, 'readline') else ''
            else:
                raise ConnectionError("未知的连接类型，无法握手")
        except Exception as exc:
            self._cleanup_connection()
            raise ConnectionError(f"握手失败: {exc}")
        
        if not response:
            self._cleanup_connection()
            raise ConnectionError("握手失败：设备未响应 *IDN?")
        
        self.last_handshake = datetime.now()
        logger.info(f"握手成功: {response}")
        return response
    
    def _validate_command(self, command: str) -> bool:
        """验证命令格式"""
        s = (command or '').strip()
        if not s:
            return False
        
        if s == '*IDN?':
            return True
        if s.lower() == 'ifconfig':
            return True
        if re.match(r'^ROUTE:COUNT[\?？]$', s):
            return True
        if re.match(r'^ROUTE:PATHSWITCH[\?？]$', s):
            return True
        if re.match(r'^ROUTE:PATHSWITCH:(\d+):(\d+)$', s):
            return True
        if re.match(r'^ROUTE:CHANGETO:(\d+):(\d+)$', s):
            return True
        if re.match(r'^ROUTE:CHANGETO:(\d+)[\?？]$', s):
            return True
        if re.match(r'^SetIP:(.+)$', s):
            return True
        if re.match(r'^SetNetMask:(.+)$', s):
            return True
        # 支持正确拼写 SetGateway 和错误拼写 SetGetway（向后兼容）
        if re.match(r'^Set(Gateway|Getway):(.+)$', s):
            return True
        if re.match(r'^TcpPort:(\d+)$', s):
            return True
        # 支持多种MAC地址格式: 00:11:22:33:44:55 或 00-11-22-33-44-55 或 001122334455
        if re.match(r'^SetMac:([0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5}|[0-9A-Fa-f]{12})$', s):
            return True
        
        return False

    def _parse_device_response(self, response: str, command: str) -> dict:
        """
        解析设备响应，返回统一的状态信息
        
        Args:
            response: 设备原始响应
            command: 发送的命令
            
        Returns:
            dict: 包含 success, status, message 的字典
        """
        if not response:
            return {
                'success': True,
                'status': '[OK]',
                'message': '命令已发送，设备无响应（可能正常执行）'
            }
        
        response_upper = response.upper().strip()
        
        # 错误响应代码映射
        error_codes = {
            'NAK': '命令被拒绝（Negative Acknowledgement）',
            'NUB_RANG': '参数范围错误（Number Range Error）',
            'NUM_RANG': '参数范围错误（Number Range Error）',
            'ERR': '执行错误',
            'ERROR': '执行错误',
            'INVALID': '无效命令',
            'FAIL': '执行失败',
            'TIMEOUT': '执行超时',
            'BUSY': '设备忙碌'
        }
        
        # 成功响应标识
        success_indicators = ['OK', 'ACK', 'SUCCESS']
        
        # 检查是否包含错误代码
        for error_code, error_msg in error_codes.items():
            if error_code in response_upper:
                return {
                    'success': False,
                    'status': '[ERR]',
                    'message': f'{error_msg} - {response}'
                }
        
        # 检查是否包含成功标识
        for success_word in success_indicators:
            if success_word in response_upper:
                return {
                    'success': True,
                    'status': '[OK]',
                    'message': f'命令执行成功 - {response}'
                }
        
        # 对于查询命令（以?结尾），返回的数据视为成功
        if command.strip().endswith('?'):
            return {
                'success': True,
                'status': '[OK]',
                'message': f'查询成功 - {response}'
            }
        
        # 默认情况：包含冒号的响应通常是成功的（如 IP:xxx, COUNT:xxx）
        if ':' in response:
            return {
                'success': True,
                'status': '[OK]',
                'message': f'命令执行成功 - {response}'
            }
        
        # 其他情况，保守处理为成功但带警告
        return {
            'success': True,
            'status': '[WARN]',
            'message': f'设备响应未知格式 - {response}'
        }
