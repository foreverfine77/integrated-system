"""
矢量网络分析仪控制器
封装VNA设备的连接、测量等功能
"""

import logging
import threading
import time
import os
import io
import zipfile
import csv
import math
from datetime import datetime
from flask import jsonify, send_file

try:
    from devices.siyi import Siyi3674L
    from devices.rohde import RohdeZNA26
    from devices.keysight import KeysightE5071C
except ImportError as e:
    print(f"警告: 无法导入设备驱动: {e}")
    Siyi3674L = RohdeZNA26 = KeysightE5071C = None

# 使用主logger（将在app.py中配置）
logger = logging.getLogger('multi_channel_system')

# 模拟的设备配置
SUPPORTED_DEVICES = [
    {
        'id': 'siyi-3674l',
        'name': '思仪 3674L',
        'manufacturer': '思仪',
        'model': '3674L',
        'frequency_range': '10 MHz - 67 GHz'
    },
    {
        'id': 'rohde-zna26',
        'name': '罗德 ZNA26',
        'manufacturer': '罗德',
        'model': 'ZNA26',
        'frequency_range': '10 MHz - 26.5 GHz'
    },
    {
        'id': 'keysight-e5071c',
        'name': '是德 E5071C',
        'manufacturer': '是德',
        'model': 'E5071C',
        'frequency_range': '100 kHz - 8.5 GHz'
    }
]

class VNAController:
    """矢量网络分析仪控制器类"""
    
    def __init__(self):
        """初始化控制器"""
        self.current_device = None
        self.device_type = None
        self.device_info = {}
        self.connection_history = []
        self.device_driver = None 
        
        self.measurement_thread = None
        self.measurement_status = {
            'is_running': False,
            'progress': 0,
            'current_measurement': 0,
            'total_measurements': 0,
            'results': []
        }
        
        # 混频器配置（支持多种设备）
        self.mixer_config = {
            # 罗德ZNA26 VMIX模式参数
            'rfPort': 1,
            'ifPort': 2,
            'loPort': 3,
            'loFrequency': 300.0,  # MHz
            'loPower': 10.0,       # dBm
            'conversionMode': 'DCUP',
            
            # 思仪3674L Scalar Mixer模式参数
            'input_start_freq': 3e9,     # Hz (3 GHz)
            'input_stop_freq': 4e9,      # Hz (4 GHz)
            'input_power': -10.0,        # dBm
            'lo_port': 3,                # Port 1-4
            'lo_freq': 2e9,              # Hz (2 GHz)
            'lo_power': 10.0,            # dBm
            'sideband': 'LOW'            # LOW/HIGH
        }
        
        # 创建结果目录
        os.makedirs('results', exist_ok=True)
    
    def is_connected(self):
        """检查是否已连接"""
        return self.current_device is not None
    
    def get_devices(self):
        """获取可用的VNA设备列表"""
        devices = SUPPORTED_DEVICES.copy()
        
        # 添加连接状态
        for device in devices:
            if self.current_device and self.device_type == device['id']:
                device['status'] = 'connected'
            else:
                device['status'] = 'disconnected'
        
        return jsonify(devices)
    
    def connect(self, data):
        """连接VNA设备"""
        device_type = data.get('device_type')
        ip_address = data.get('ip_address', '192.168.1.100')
        port = int(data.get('port', 5025))
        
        if not device_type:
            return jsonify({'success': False, 'message': '设备类型不能为空'}), 400
        
        if device_type not in [d['id'] for d in SUPPORTED_DEVICES]:
            return jsonify({'success': False, 'message': f'不支持的设备类型: {device_type}'}), 400
        
        if not ip_address:
            return jsonify({'success': False, 'message': 'IP地址不能为空'}), 400
        
        try:
            logger.info(f"尝试连接设备: {device_type} @ {ip_address}:{port}")
            
            # 根据设备类型创建正确的VISA资源名称
            # 参考官方文档：思仪和罗德使用不同的VISA地址格式
            if device_type == 'siyi-3674l':
                from devices.siyi import Siyi3674L
                # 思仪格式：TCPIP::{ip}::inst0::INSTR
                resource_name = f"TCPIP::{ip_address}::inst0::INSTR"
                self.device_driver = Siyi3674L(device_type, resource_name)
                logger.info("[OK] 创建思仪3674L设备驱动实例")
                logger.info(f"[格式] 使用思仪标准VISA格式: {resource_name}")
            elif device_type == 'rohde-zna26':
                from devices.rohde import RohdeZNA26
                # 罗德格式：TCPIP::{ip}::INST 
                resource_name = f"TCPIP::{ip_address}::INST"
                self.device_driver = RohdeZNA26(device_type, resource_name)
                logger.info("[OK] 创建罗德ZNA26设备驱动实例")
                logger.info(f"[格式] 使用罗德标准VISA格式: {resource_name}")
            elif device_type == 'keysight-e5071c':
                from devices.keysight import KeysightE5071C
                # 是德格式：TCPIP::{ip}::{port}::SOCKET (使用 Socket 通信)
                resource_name = f"TCPIP::{ip_address}::{port}::SOCKET"
                self.device_driver = KeysightE5071C(device_type, resource_name)
                logger.info("[OK] 创建是德E5071C设备驱动实例")
                logger.info(f"[格式] 使用是德Socket VISA格式: {resource_name}")
            else:
                raise ValueError(f"未知的设备类型: {device_type}")
            
            # 尝试连接设备
            logger.info(f"[连接] 尝试连接到: {resource_name}")
            success, message = self.device_driver.connect()  
            
            if not success:
                logger.error(f"[错误] 设备连接失败: {message}")
                self.device_driver = None
                return jsonify({
                    'success': False,
                    'message': f'设备连接失败: {message}'
                }), 400
            
            # 连接成功
            self.current_device = {
                'connected': True,
                'ip_address': ip_address,
                'port': port
            }
            self.device_type = device_type
            self.device_info = {
                'type': device_type,
                'ip_address': ip_address,
                'port': port,
                'resource_name': resource_name,
                'idn': message  # 使用设备返回的IDN信息
            }
            
            # 添加到历史记录
            history_entry = {
                'device_type': device_type,
                'ip_address': ip_address,
                'port': port,
                'timestamp': datetime.now().isoformat()
            }
            
            # 避免重复
            existing = [h for h in self.connection_history 
                       if h['ip_address'] == ip_address and h['port'] == port]
            if not existing:
                self.connection_history.append(history_entry)
            
            logger.info(f"[成功] 设备连接成功: {device_type}")
            logger.info(f"[信息] 设备信息: {message}")
            
            return jsonify({
                'success': True,
                'message': f'{device_type} 设备连接成功',
                'device_info': {
                    **self.device_info,
                    'connected': True,
                    'timestamp': datetime.now().isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"[错误] 连接失败: {str(e)}")
            import traceback
            traceback.print_exc()
            self.device_driver = None
            
            # 将技术错误转换为用户友好的提示
            error_msg = str(e)
            user_friendly_msg = self._translate_error_message(error_msg, device_type, ip_address, port)
            
            return jsonify({
                'success': False,
                'message': user_friendly_msg
            }), 400
    
    def _translate_error_message(self, error_msg: str, device_type: str, ip_address: str, port: int) -> str:
        """
        将技术错误消息转换为用户友好的中文提示
        """
        # 常见错误模式匹配
        error_patterns = {
            'timeout': '设备连接超时，请检查：\n1. 设备是否开机\n2. 网络是否连通\n3. IP地址是否正确',
            'refused': f'无法连接到设备（端口{port}被拒绝），请检查：\n1. 设备网络功能是否启用\n2. 端口号是否正确\n3. 防火墙设置',
            'unreachable': '网络不可达，请检查：\n1. 设备和电脑是否在同一网段\n2. 网线是否连接\n3. IP地址是否正确',
            'VisaIOError': 'VISA通信错误，请检查：\n1. 是否安装了VISA驱动\n2. 设备是否支持VISA协议\n3. VISA资源地址是否正确',
            'No such file': '找不到VISA资源，请检查：\n1. 设备IP地址是否正确\n2. 设备网络功能是否启用\n3. VISA格式是否匹配设备型号',
            'missing.*arguments': '程序内部错误，请联系技术支持',
            'permission': '权限不足，请以管理员身份运行程序',
        }
        
        # 匹配错误模式
        import re
        for pattern, friendly_msg in error_patterns.items():
            if re.search(pattern, error_msg, re.IGNORECASE):
                return f"{friendly_msg}\n\n当前配置：\n设备型号：{device_type}\nIP地址：{ip_address}\n端口：{port}"
        
        # 如果没有匹配到特定模式，返回通用提示
        device_name_map = {
            "siyi-3674l": "思仪3674L",
            "rohde-zna26": "罗德ZNA26",
            "keysight-e5071c": "是德E5071C"
        }
        device_name = device_name_map.get(device_type, device_type)
        return f"连接{device_name}失败，请检查：\n1. 设备是否开机并已初始化\n2. 网络连接是否正常\n3. IP地址 {ip_address} 是否正确\n4. 端口 {port} 是否正确\n"
    
    def disconnect(self):
        """断开VNA连接"""
        if self.current_device:
            try:
                logger.info("断开VNA设备连接")
                
                # 断开设备驱动连接
                if self.device_driver:
                    try:
                        self.device_driver.disconnect()
                        logger.info("[OK] 设备驱动已断开")
                    except Exception as e:
                        logger.warning(f"[警告] 断开设备驱动时出错: {str(e)}")
                    self.device_driver = None
                
                self.current_device = None
                self.device_type = None
                
                return jsonify({
                    'success': True,
                    'message': '设备已断开连接'
                })
            except Exception as e:
                logger.error(f"断开连接失败: {str(e)}")
                return jsonify({
                    'success': False,
                    'message': f'断开连接时出现错误'
                }), 400
        else:
            return jsonify({
                'success': False,
                'message': '没有已连接的设备'
            }), 400
    
    def get_status(self):
        """获取VNA连接状态"""
        if self.current_device:
            return jsonify({
                'connected': True,
                **self.device_info,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'connected': False,
                'message': '设备未连接'
            })
    
    def start_measurement(self, data):
        """开始VNA测量"""
        if self.measurement_status['is_running']:
            return jsonify({'success': False, 'message': '测量正在进行中'}), 400
        
        # 检查设备连接状态
        if not self.is_connected():
            logger.error("测量失败：设备未连接")
            return jsonify({
                'success': False, 
                'message': '请先连接VNA设备'
            }), 400
        
        # 检查设备驱动是否正常
        if not self.device_driver or not self.device_driver.connected:
            logger.error("测量失败：设备驱动未就绪")
            return jsonify({
                'success': False, 
                'message': 'VNA设备驱动未就绪，请重新连接'
            }), 400
        
        device_info = data.get('device', {})
        parameters = data.get('parameters', [])
        measurement_count = data.get('measurementCount', 50)
        frequency_points = data.get('frequencyPoints', 201)
        start_frequency = data.get('startFrequency', 500) * 1e6
        stop_frequency = data.get('stopFrequency', 2500) * 1e6
        
        if not parameters:
            return jsonify({'success': False, 'message': '参数不能为空'}), 400
        
        # 启动测量线程
        self.measurement_thread = threading.Thread(
            target=self._measurement_worker,
            args=(parameters, measurement_count, frequency_points, 
                  start_frequency, stop_frequency),
            daemon=True
        )
        self.measurement_thread.start()
        
        return jsonify({
            'success': True,
            'message': '测量已开始',
            'total_measurements': len(parameters) * measurement_count
        })
    
    def stop_measurement(self):
        """停止VNA测量"""
        self.measurement_status['is_running'] = False
        
        return jsonify({
            'success': True,
            'message': '测量已停止'
        })
    
    def get_measurement_status(self):
        """获取VNA测量状态"""
        return jsonify(self.measurement_status)
    
    def export_data(self, data):
        """导出VNA测量数据"""
        results = data.get('results', [])
        
        if not results:
            return jsonify({'success': False, 'message': '没有可导出的数据'}), 400
        
        # 收集文件列表
        file_paths = []
        for item in results:
            path = item.get('filename')
            if not path:
                continue
            if not path.startswith('results'):
                continue
            if os.path.isfile(path):
                file_paths.append(path)
        
        if not file_paths:
            return jsonify({'success': False, 'message': '未找到可导出的CSV文件'}), 404
        
        # 创建内存ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for fp in file_paths:
                arcname = os.path.relpath(fp, start='results')
                zf.write(fp, arcname)
        zip_buffer.seek(0)
        
        zip_name = f"measurement_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_name
        )
    
    def open_results_folder(self, data):
        """直接打开结果文件夹"""
        import subprocess
        import platform
        
        results = data.get('results', [])
        
        if not results:
            return jsonify({'success': False, 'message': '没有可打开的结果文件夹'}), 400
        
        # 获取第一个结果的文件夹路径
        first_file = results[0].get('filename')
        if not first_file:
            return jsonify({'success': False, 'message': '无法找到结果文件路径'}), 400
        
        # 提取文件夹路径 (results/YYYY-MM-DD_HH-MM-SS/)
        folder_path = os.path.dirname(first_file)
        abs_folder_path = os.path.abspath(folder_path)
        
        if not os.path.exists(abs_folder_path):
            return jsonify({'success': False, 'message': f'文件夹不存在: {abs_folder_path}'}), 404
        
        try:
            # 根据操作系统打开文件夹
            system = platform.system()
            logger.info(f"打开结果文件夹: {abs_folder_path}")
            
            if system == "Windows":
                # Windows explorer 有时会返回非零退出码，即使成功打开
                subprocess.run(['explorer', abs_folder_path])
            elif system == "Darwin":  # macOS
                subprocess.run(['open', abs_folder_path])
            else:  # Linux
                subprocess.run(['xdg-open', abs_folder_path])
            
            return jsonify({
                'success': True,
                'message': '已打开结果文件夹',
                'path': abs_folder_path
            })
        except Exception as e:
            logger.error(f"打开文件夹失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'打开文件夹失败: {str(e)}',
                'path': abs_folder_path
            }), 500
    
    def get_connection_history(self):
        """获取历史连接记录"""
        try:
            return jsonify({
                'success': True,
                'history': self.connection_history,
                'count': len(self.connection_history)
            })
        except Exception as e:
            logger.error(f"获取历史记录失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'获取历史记录失败: {str(e)}',
                'history': []
            }), 500
    
    def remove_from_history(self, ip_address, port):
        """从历史记录中移除连接"""
        try:
            original_count = len(self.connection_history)
            self.connection_history = [
                h for h in self.connection_history 
                if not (h['ip_address'] == ip_address and h['port'] == port)
            ]
            
            if len(self.connection_history) < original_count:
                return jsonify({
                    'success': True,
                    'message': f'已从历史记录中移除 {ip_address}:{port}'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': f'历史记录中未找到 {ip_address}:{port}'
                }), 404
        except Exception as e:
            logger.error(f"移除历史记录失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'移除历史记录失败: {str(e)}'
            }), 500
    
    def clear_connection_history(self):
        """清除所有历史连接记录"""
        try:
            self.connection_history = []
            return jsonify({
                'success': True,
                'message': '已清除所有历史连接记录'
            })
        except Exception as e:
            logger.error(f"清除历史记录失败: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'清除历史记录时出现错误: {str(e)}'
            }), 500
    
    def _measurement_worker(self, parameters, measurement_count, frequency_points, 
                           start_frequency, stop_frequency):
        """测量工作线程 - 软件循环多次测量"""
        self.measurement_status['is_running'] = True
        self.measurement_status['progress'] = 0
        self.measurement_status['current_measurement'] = 0
        self.measurement_status['total_measurements'] = len(parameters) * measurement_count
        self.measurement_status['results'] = []
        
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        try:
            logger.info(f"开始测量任务: {len(parameters)}个参数, 每个{measurement_count}次")
            logger.info(f"使用软件循环模式 - 每次单独测量并保存原始数据")
            
            total_count = 0
            
            for param_idx, parameter in enumerate(parameters):
                if not self.measurement_status['is_running']:
                    logger.info("测量已停止")
                    break
                
                logger.info(f"\n{'='*60}")
                logger.info(f"参数 {param_idx + 1}/{len(parameters)}: {parameter.upper()}")
                logger.info(f"{'='*60}")
                
                # 检查设备连接状态（防止测量过程中断开）
                if not self.device_driver or not self.device_driver.connected:
                    logger.error(f"[错误] 设备连接已断开，测量中止")
                    self.measurement_status['is_running'] = False
                    self.measurement_status['error'] = '设备连接已断开'
                    break
                
                # 设置频率范围（只需设置一次）
                try:
                    self.device_driver.set_frequency_range(
                        start_frequency, stop_frequency, frequency_points
                    )
                except Exception as e:
                    logger.error(f"[错误] 设置频率范围失败: {e}")
                    self.measurement_status['is_running'] = False
                    self.measurement_status['error'] = f'设置频率范围失败: {str(e)}'
                    break
                
                # 循环测量 measurement_count 次
                for measurement_idx in range(1, measurement_count + 1):
                    if not self.measurement_status['is_running']:
                        logger.info("测量已停止")
                        break
                    
                    logger.info(f"\n[{parameter.upper()}] 第 {measurement_idx}/{measurement_count} 次测量")
                    
                    # 单次测量（count=1，不使用硬件平均）
                    data, error_msg = self.device_driver.get_measurement_data(
                        parameter, frequency_points, measurement_count=1
                    )
                    
                    if data is None:
                        logger.error(f"[错误] 第 {measurement_idx} 次测量失败: {error_msg}")
                        self.measurement_status['is_running'] = False
                        self.measurement_status['error'] = f'测量失败: {error_msg}'
                        break
                    
                    # 保存每次测量的数据
                    success, filename = self._save_measurement_data(
                        data, parameter, measurement_idx, timestamp, do_excel=False
                    )
                    
                    if not success:
                        logger.error(f"[错误] 保存第 {measurement_idx} 次测量数据失败")
                    
                    # 更新进度
                    total_count += 1
                    self.measurement_status['current_measurement'] = total_count
                    self.measurement_status['progress'] = (
                        total_count / self.measurement_status['total_measurements'] * 100
                    )
                    
                    # 短暂延迟，避免设备过载
                    time.sleep(0.1)
                
                # 所有测量完成后，记录结果
                if self.measurement_status['is_running']:
                    # 使用第一次测量的文件名作为代表
                    representative_filename = f"results/{timestamp}/{parameter.upper()}.csv"
                    self.measurement_status['results'].append({
                        'parameter': parameter.upper(),
                        'measurements': measurement_count,
                        'filename': representative_filename,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    logger.info(f"参数 {parameter.upper()} 测量完成 ({measurement_count}次单独测量)")
            
            logger.info("\n所有测量完成")
            logger.info(f"共测量 {len(parameters)} 个参数，每个{measurement_count}次单独测量")
            logger.info(f"总计 {total_count} 次测量")
            
        except Exception as e:
            logger.error(f"测量过程中出现错误: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            self.measurement_status['is_running'] = False
    
    def _average_measurement_data(self, all_data):
        """对多次测量的数据进行软件平均"""
        if not all_data:
            return None

        # 假设所有测量都有相同的频率点
        frequencies = all_data[0]['frequencies']
        num_points = len(frequencies)
        num_measurements = len(all_data)

        # 初始化累加器
        sum_magnitude = [0.0] * num_points
        sum_phase = [0.0] * num_points # 仅用于S参数

        # 检查是否是功率参数
        is_power = 'Power(dBm)' in all_data[0].get('headers2', []) # Assuming headers2 might be present or infer from keys
        if 'magnitude' in all_data[0] and 'phase' not in all_data[0]:
            is_power = True # More robust check

        for data_item in all_data:
            for i in range(num_points):
                sum_magnitude[i] += data_item['magnitude'][i]
                if not is_power and data_item.get('phase'):
                    sum_phase[i] += data_item['phase'][i]

        # 计算平均值
        avg_magnitude = [s / num_measurements for s in sum_magnitude]
        avg_phase = [s / num_measurements for s in sum_phase] if not is_power else None

        averaged_result = {
            'frequencies': frequencies,
            'magnitude': avg_magnitude,
        }
        if not is_power:
            averaged_result['phase'] = avg_phase
        
        return averaged_result
    
    def _save_measurement_data(self, data, parameter, measurement_idx, timestamp, do_excel=False):
        """保存测量数据（仅CSV格式）"""
        try:
            results_dir = f"results/{timestamp}"
            os.makedirs(results_dir, exist_ok=True)
            
            filename = f"{results_dir}/{parameter.upper()}.csv"
            
            # 判断参数类型
            power_params = {"IPWR", "OPWR", "REVIPWR", "REVOPWR"}
            is_power = parameter.upper() in power_params
            
            # 准备当前测量的数据行
            frequencies = data["frequencies"]
            magnitude = data["magnitude"]
            phase = data.get("phase")
            
            # 构建CSV数据
            if is_power:
                # 功率数据：频率 + 功率
                headers1 = [str(measurement_idx), str(measurement_idx)]
                headers2 = ["Freq(Hz)", "Power(dBm)"]
                rows = [[f, m] for f, m in zip(frequencies, magnitude)]
            else:
                # S参数数据：频率 + 幅度 + 相位
                headers1 = [str(measurement_idx), str(measurement_idx), str(measurement_idx)]
                headers2 = ["Freq(Hz)", "Mag(dB)", "Phase(deg)"]
                rows = [[f, m, p] for f, m, p in zip(frequencies, magnitude, phase or [0]*len(frequencies))]
            
            # 如果文件已存在，读取并追加列
            if os.path.exists(filename):
                with open(filename, 'r', newline='', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    existing_data = list(reader)
                
                # 扩展标题行
                if len(existing_data) >= 2:
                    existing_data[0].extend(headers1)
                    existing_data[1].extend(headers2)

                    
                    # 扩展数据行
                    for i, row_data in enumerate(rows):
                        if i + 2 < len(existing_data):
                            existing_data[i + 2].extend(row_data)
                        else:
                            # 补齐前面的空列
                            new_row = [''] * (len(existing_data[0]) - len(row_data)) + row_data
                            existing_data.append(new_row)
                    
                    # 写入完整数据
                    with open(filename, 'w', newline='', encoding='utf-8') as f:
                        writer = csv.writer(f)
                        writer.writerows(existing_data)
            else:
                # 新文件：直接写入
                with open(filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(headers1)
                    writer.writerow(headers2)
                    writer.writerows(rows)
            
            logger.info(f"数据已保存到: {filename}")
            return True, filename
        except Exception as e:
            logger.error(f"保存数据失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"保存失败: {str(e)}"

