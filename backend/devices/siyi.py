"""
思仪 3674L 网络分析仪设备类
实现设备特定的通信逻辑
"""

from typing import Dict, Optional, Tuple
import math
from .base import NetworkAnalyzerBase

# 尝试导入PyVISA，如果失败则使用模拟版本
try:
    import pyvisa
except ImportError:
    from ..mock_visa import MockResourceManager
    import sys
    pyvisa = type(sys)('pyvisa')
    pyvisa.ResourceManager = MockResourceManager

class Siyi3674L(NetworkAnalyzerBase):
    """思仪 3674L 网络分析仪"""
    
    def load_device_config(self):
        """加载设备配置"""
        # 思仪 3674L 频率范围: 10 MHz - 67 GHz
        self.freq_range = (10e6, 67e9)  # 10MHz - 67GHz
        self.max_points = 16001
        self.min_if_bandwidth = 1
        self.max_if_bandwidth = 3e6
        self.min_power = -55
        self.max_power = 10
    
    def _open_resource(self, resource_name: str):
        """打开VISA资源"""
        rm = pyvisa.ResourceManager()
        return rm.open_resource(resource_name)
    
    def validate_idn_response(self, response: str) -> bool:
        """验证*IDN?响应"""
        return "Ceyear" in response
    
    def initialize(self):
        """设备初始化配置"""
        try:
            # 复位到默认状态
            self.write("*RST")
            # 清除状态
            self.write("*CLS")
            # 等待操作完成
            self.write("*OPC")
            
            # 设置触发为单次
            self.write(":INIT:CONT OFF")
            
            # 设置默认参数
            self.set_if_bandwidth(1000)  # 1kHz IF带宽
            self.set_power_level(-10)    # -10dBm功率
            
            print(f"[成功] 思仪 3674L 设备初始化完成")
        except Exception as e:
            print(f"[警告] 设备初始化警告: {e}")
            # 即使初始化失败也继续，因为某些命令可能不支持
    
    def get_measurement_data(self, parameter: str, frequency_points: int = 201, measurement_count: int = 1) -> Tuple[Optional[Dict], str]:
        """获取测量数据
        
        Args:
            parameter: 测量参数（S11/S21/SC21等）
            frequency_points: 频率点数
            measurement_count: 测量次数
            
        Returns:
            (data_dict, error_msg): 测量数据字典和错误信息
        """
        if not self.connected:
            print(f"[错误] 测量失败 - 设备未连接状态: self.connected = {self.connected}")
            return None, "设备未连接"
        
        try:
            print(f"\n{'='*70}")
            print(f"[测量] 思仪3674L - 开始测量")
            print(f"  参数: {parameter.upper()}")
            print(f"  频点数: {frequency_points}")
            print(f"  测量次数: {measurement_count}")
            print(f"  设备连接状态: {self.connected}")
            print(f"{'='*70}\n")
            
            # 选择测量参数
            param = parameter.upper()
            
            # 根据参数类型配置测量
            if param in ['S11', 'S21', 'S12', 'S22']:
                print(f"[SCPI] 配置S参数测量")
                # S参数配置
                meas_name = f"Trc_{param}"
                cmd1 = f':CALC1:PAR:DEF:EXT "{meas_name}", "{param}"'
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f':DISP:WIND1:TRAC1:FEED "{meas_name}"'
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f':CALC1:PAR:SEL "{meas_name}"'
                print(f"  >> {cmd3}")
                self.write(cmd3)
                
            elif param in ['SC11', 'SC21', 'SC12', 'SC22']:
                print(f"[SCPI] 配置变频S参数测量")
                # 变频S参数直接用 SC11/SC21/SC12/SC22
                meas_name = f"Trc_{param}"
                cmd1 = f':CALC1:PAR:DEF:EXT "{meas_name}", "{param}"'
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f':DISP:WIND1:TRAC1:FEED "{meas_name}"'
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f':CALC1:PAR:SEL "{meas_name}"'
                print(f"  >> {cmd3}")
                self.write(cmd3)
                
            elif param in ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']:
                print(f"[SCPI] 配置功率测量（绝对波量）")
                # 功率参数用接收机名称：R1, B, R2, A
                receiver_map = {
                    'IPWR': 'R1',      # 端口1参考接收机
                    'OPWR': 'B',       # 端口2测试接收机
                    'REVIPWR': 'R2',   # 端口2参考接收机
                    'REVOPWR': 'A'     # 端口1测试接收机
                }
                receiver = receiver_map[param]
                
                meas_name = f"Trc_{param}"
                cmd1 = f':CALC1:PAR:DEF:EXT "{meas_name}", "{receiver}"'
                print(f"  >> {cmd1} (接收机: {receiver})")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f':DISP:WIND1:TRAC1:FEED "{meas_name}"'
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f':CALC1:PAR:SEL "{meas_name}"'
                print(f"  >> {cmd3}")
                self.write(cmd3)
            else:
                print(f"[错误] 不支持的参数: {parameter}")
                return None, f"不支持的参数: {parameter}"
            
            # 检查配置是否成功
            print(f"\n[SCPI] 检查设备错误")
            try:
                err_code, err_msg = self.get_error()
                if err_code != 0:
                    print(f"  [警告] 设备报告错误: [{err_code}] {err_msg}")
                    # 如果是编码错误，提示用户但继续执行
                    if "编码问题" in err_msg or "UnicodeDecodeError" in err_msg:
                        print(f"  [提示] 设备返回了中文错误信息，已自动处理编码")
                else:
                    print(f"  [OK] 无错误")
            except Exception as e:
                print(f"  [警告] 无法查询错误: {str(e)}")
                # 错误查询失败不影响测量，继续执行
            
            # 注意：频率点数已在 set_frequency_range() 中设置，无需重复
            
            # ⭐ 设置测量次数
            cmd_count = f":SENS:SWE:COUNt {measurement_count}"
            print(f"\n[SCPI] 设置测量次数")
            print(f"  >> {cmd_count}")
            print(f"  [说明] VNA将自动进行{measurement_count}次测量并平均")
            self.write(cmd_count)
            
            # 触发测量
            print(f"\n[SCPI] 触发测量")
            print(f"  >> :INIT:IMM")
            print(f"  [说明] VNA开始连续测量{measurement_count}次...")
            self.trigger_sweep()
            
            print(f"[SCPI] 等待测量完成")
            print(f"  >> *WAI 和 *OPC?")
            self.wait_for_sweep()
            
            # 获取频率数据（使用:CALC:X?命令，思仪3674L专用）
            # 注意：思仪3674L不支持:SENS:FREQ:DATA?，需要使用:CALC:X?
            cmd_freq = ":CALC:X?"
            print(f"\n[SCPI] 获取频率数据")
            print(f"  >> {cmd_freq} (思仪3674L使用X轴命令)")
            print(f"  [超时] 数据查询超时设置: 30秒")
            freq_str = self.query(cmd_freq, timeout=30)  # 30秒足够
            print(f"  << 收到: {len(freq_str)} 字节数据")
            frequencies = [float(x) for x in freq_str.split(',') if x.strip()]
            print(f"  [解析] 解析到 {len(frequencies)} 个频率点")
            
            # 获取测量数据
            # 统一使用 CALC1:DATA? FDATA 格式（参考用户提供的权威指令）
            print(f"\n[SCPI] 获取测量数据")
            cmd_data = ":CALC1:DATA? FDATA"
            print(f"  >> {cmd_data}")
            print(f"  [超时] 数据查询超时设置: 30秒")
            data_str = self.query(cmd_data, timeout=30)
            print(f"  << 收到: {len(data_str)} 字节数据")
            data = [float(x) for x in data_str.split(',') if x.strip()]
            print(f"  [解析] 解析到 {len(data)} 个数值")
            
            # 根据参数类型解析数据
            if param in ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']:
                # 功率数据：FDATA返回的是实际功率值（dBm）
                magnitude = data
                print(f"  [数据] 功率点数: {len(magnitude)}")
                print(f"  [范围] 功率范围: {magnitude.min():.2f} ~ {magnitude.max():.2f} dBm")
                phase = None
            else:
                # S参数：FDATA返回的是实部和虚部
                # 实部在偶数位，虚部在奇数位
                real = data[::2]
                imag = data[1::2]
                print(f"  [数据] 实部: {len(real)} 个点")
                print(f"  [数据] 虚部: {len(imag)} 个点")
                
                # 转换为幅度和相位
                magnitude = [20 * math.log10(math.sqrt(r**2 + i**2)) for r, i in zip(real, imag)]
                phase = [math.degrees(math.atan2(i, r)) for r, i in zip(real, imag)]
                print(f"  [范围] 幅度范围: {min(magnitude):.2f} ~ {max(magnitude):.2f} dB")
                print(f"  [范围] 相位范围: {min(phase):.2f} ~ {max(phase):.2f} °")
            
            print(f"\n[成功] 测量完成 - {param} 数据获取成功")
            print(f"{'='*70}\n")
            
            return {
                'frequencies': frequencies,
                'magnitude': magnitude if isinstance(magnitude, list) else list(magnitude),
                'phase': phase if isinstance(phase, list) else list(phase) if phase is not None else None
            }, "数据获取成功"
            
        except Exception as e:
            print(f"\n[错误] 测量失败 - 异常: {str(e)}")
            print(f"{'='*70}\n")
            import traceback
            traceback.print_exc()
            return None, f"获取数据失败: {str(e)}"
    
    def set_frequency_range(self, start_freq: float, stop_freq: float, points: int = 201):
        """设置频率范围"""
        if not (self.freq_range[0] <= start_freq <= self.freq_range[1]):
            raise ValueError(f"起始频率超出范围: {self.freq_range[0]}Hz - {self.freq_range[1]}Hz")
        if not (self.freq_range[0] <= stop_freq <= self.freq_range[1]):
            raise ValueError(f"终止频率超出范围: {self.freq_range[0]}Hz - {self.freq_range[1]}Hz")
        if not (2 <= points <= self.max_points):
            raise ValueError(f"频点数超出范围: 2 - {self.max_points}")
        
            print(f"\n[SCPI] 设置频率范围")
            print(f"  >> :SENS:FREQ:STAR {start_freq}")
            self.write(f":SENS:FREQ:STAR {start_freq}")
            print(f"  >> :SENS:FREQ:STOP {stop_freq}")
            self.write(f":SENS:FREQ:STOP {stop_freq}")
            print(f"  >> :SENS:SWE:POIN {points}")
        self.write(f":SENS:SWE:POIN {points}")
    
    def set_power_level(self, power: float):
        """设置源功率"""
        if not (self.min_power <= power <= self.max_power):
            raise ValueError(f"功率超出范围: {self.min_power}dBm - {self.max_power}dBm")
        print(f"[SCPI] 设置源功率")
        print(f"  >> :SOUR:POW {power}")
        self.write(f":SOUR:POW {power}")
    
    def set_if_bandwidth(self, bandwidth: float):
        """设置IF带宽"""
        if not (self.min_if_bandwidth <= bandwidth <= self.max_if_bandwidth):
            raise ValueError(f"IF带宽超出范围: {self.min_if_bandwidth}Hz - {self.max_if_bandwidth}Hz")
        print(f"[SCPI] 设置IF带宽")
        print(f"  >> :SENS:BAND {bandwidth}")
        self.write(f":SENS:BAND {bandwidth}")
    
    def trigger_sweep(self):
        """触发扫描"""
        self.write(":INIT:IMM")
    
    def wait_for_sweep(self):
        """等待扫描完成"""
        self.write("*WAI")
        # 查询操作完成状态，使用较长超时等待测量
        import time
        max_wait = 120  # 最多等待120秒
        start_time = time.time()
        
        while True:
            try:
                opc = int(self.query("*OPC?", timeout=10))  # 每次查询10秒超时
                if opc == 1:
                    break
            except Exception as e:
                print(f"  [警告] 等待测量时出现异常: {e}")
            
            # 检查是否超过最大等待时间
            if time.time() - start_time > max_wait:
                print(f"  [警告] 等待测量超时（{max_wait}秒），继续尝试获取数据")
                break
            
            time.sleep(0.5)  # 短暂休息再查询

