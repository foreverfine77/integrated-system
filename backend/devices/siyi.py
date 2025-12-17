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
            measurement_count: 测量次数（该参数被忽略，硬件层面始终单次测量，软件层面循环实现多次测量）
            
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
            
            # 删除所有旧轨迹，避免"该轨迹已存在"错误
            print(f"[SCPI] 删除旧轨迹")
            print(f"  >> :CALC:PAR:DEL:ALL")
            self.write(":CALC:PAR:DEL:ALL")
            
            # 根据参数类型配置测量
            if param in ['S11', 'S21', 'S12', 'S22']:
                print(f"[SCPI] 配置标准S参数测量")
                # 标准S参数使用 PAR:DEF:EXT（不需要指定测量类）
                meas_name = f"Trc_{param}"
                cmd1 = f":CALC1:PAR:DEF:EXT '{meas_name}', '{param}'"
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f":DISP:WIND1:TRAC1:FEED '{meas_name}'"
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f":CALC1:PAR:SEL '{meas_name}'"
                print(f"  >> {cmd3}")
                self.write(cmd3)
                
            elif param in ['SC11', 'SC21', 'SC12', 'SC22']:
                print(f"[SCPI] 配置变频S参数测量 (Scalar Mixer/Converter)")
                # 变频S参数使用 CUST:DEF 命令
                # 注意：SC11实际用'S11'，SC22实际用'S22'，SC21/SC12用原名
                scpi_param_map = {
                    'SC11': 'S11',   # 混频器输入反射
                    'SC21': 'SC21',  # 正向传输/转换增益
                    'SC12': 'SC12',  # 反向传输
                    'SC22': 'S22',   # 混频器输出反射
                }
                scpi_param = scpi_param_map[param]
                meas_name = f"Trc_{param}"
                
                cmd1 = f":CALC1:CUST:DEF '{meas_name}', 'Scalar Mixer/Converter', '{scpi_param}'"
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f":DISP:WIND1:TRAC1:FEED '{meas_name}'"
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹（用于后续混频器配置）
                cmd3 = f":CALC1:PAR:SEL '{meas_name}'"
                print(f"  >> {cmd3}")
                self.write(cmd3)
                
            elif param in ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']:
                print(f"[SCPI] 配置混频器功率测量 (Scalar Mixer/Converter)")
                # 功率测量也使用 CUST:DEF，参数为 Ipwr/Opwr/RevIPwr/RevOPwr
                scpi_param_map = {
                    'IPWR': 'Ipwr',       # 输入功率
                    'OPWR': 'Opwr',       # 输出功率
                    'REVIPWR': 'RevIPwr', # 反向输入功率
                    'REVOPWR': 'RevOPwr', # 反向输出功率
                }
                scpi_param = scpi_param_map[param]
                meas_name = f"Trc_{param}"
                
                cmd1 = f":CALC1:CUST:DEF '{meas_name}', 'Scalar Mixer/Converter', '{scpi_param}'"
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f":DISP:WIND1:TRAC1:FEED '{meas_name}'"
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f":CALC1:PAR:SEL '{meas_name}'"
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
            
            # 等待配置命令执行完成
            print(f"\n[SCPI] 等待配置完成")
            print(f"  >> *OPC?")
            try:
                self.query("*OPC?", timeout=5)
                print(f"  [OK] 配置完成")
            except Exception as e:
                print(f"  [警告] 等待配置完成超时: {e}")
            
            # 触发单次扫描
            print(f"\n[SCPI] 触发单次扫描")
            print(f"  >> :SENS1:SWE:MODE SING")
            self.write(":SENS1:SWE:MODE SING")
            
            print(f"  >> :INIT:IMM")
            self.write(":INIT:IMM")
            
            print(f"\n[SCPI] 等待测量完成")
            print(f"  >> *OPC?")
            self.wait_for_sweep()
            
            # 获取频率数据
            cmd_freq = ":CALC:X?"
            print(f"\n[SCPI] 获取频率数据")
            print(f"  >> {cmd_freq}")
            freq_str = self.query(cmd_freq, timeout=30)  # 30秒足够
            print(f"  << 收到: {len(freq_str)} 字节数据")
            
            # 解析频率数据
            frequencies = [float(x) for x in freq_str.split(',') if x.strip()]
            print(f"  [解析] 解析到 {len(frequencies)} 个频率点")
            
            # 验证频率数据有效性
            if len(frequencies) < 2:
                print(f"  [错误] 频率数据无效！期望多个点，实际只有 {len(frequencies)} 个")
                print(f"  [提示] 可能原因：轨迹未正确创建或设备处于错误状态")
                return None, f"频率数据无效：只返回了 {len(frequencies)} 个点"
            
            # 获取测量数据
            print(f"\n[SCPI] 获取测量数据")
            cmd_data = ":CALC1:DATA? FDATA"
            print(f"  >> {cmd_data}")
            data_str = self.query(cmd_data, timeout=30)
            print(f"  << 收到: {len(data_str)} 字节数据")
            
            # 解析测量数据
            data = [float(x) for x in data_str.split(',') if x.strip()]
            print(f"  [解析] 解析到 {len(data)} 个数值")
            
            # 验证测量数据有效性
            if len(data) < 2:
                print(f"  [错误] 测量数据无效！期望多个点，实际只有 {len(data)} 个")
                print(f"  [提示] 可能原因：扫描未完成或设备处于错误状态")
                return None, f"测量数据无效：只返回了 {len(data)} 个点"
            
            # FDATA 返回 dB 幅度
            magnitude = data
            phase = None
            
            print(f"  [数据] 幅度点数: {len(magnitude)}")
            if len(magnitude) > 0:
                print(f"  [范围] 幅度范围: {min(magnitude):.2f} ~ {max(magnitude):.2f} dB")
            
            # 检查频点数是否匹配
            if len(frequencies) != len(magnitude):
                print(f"  [警告] 频率点数({len(frequencies)})与幅度点数({len(magnitude)})不匹配!")
            
            print(f"\n[成功] 测量完成 - {param} 数据获取成功")
            print(f"{'='*70}\n")
            
            return {
                'frequencies': frequencies,
                'magnitude': magnitude,
                'phase': phase
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
        import time
        
        max_retries = 3  # 最多重试3次
        query_timeout = 10  # 每次查询10秒超时
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                opc = int(self.query("*OPC?", timeout=query_timeout))
                if opc == 1:
                    print(f"  [完成] 扫描完成")
                    return  # 成功
            except Exception as e:
                error_str = str(e)
                retry_count += 1
                
                # 区分不同类型的错误
                if "IO" in error_str or "I/O" in error_str:
                    print(f"  [连接中断] 设备网络连接已断开")
                    raise Exception("设备连接已断开，请检查网线或设备电源")
                elif "TMO" in error_str or "Timeout" in error_str:
                    print(f"  [超时] 等待设备响应... ({retry_count}/{max_retries})")
                else:
                    print(f"  [异常] {error_str}")
                    raise Exception(f"测量异常: {error_str}")
            
            time.sleep(0.5)
        
        # 超过重试次数，直接失败
        raise Exception("扫描超时：设备未响应，请检查矢网是否正在扫描")
    
    def configure_mixer_mode(self, mixer_config: Dict) -> Tuple[bool, str]:
        """配置混频器模式（Scalar Mixer/Converter）
        
        参考C代码 MixerMeaSettings_Full() 实现完整配置流程。
        
        Args:
            mixer_config: 混频器配置字典，包含：
                - input_start_freq: RF起始频率 (Hz)
                - input_stop_freq: RF终止频率 (Hz)
                - input_port: RF端口号 (1-4)，默认1
                - output_port: IF端口号 (1-4)，默认2
                - lo_port: LO端口号 (1-4)，默认3
                - lo_freq: LO固定频率 (Hz)
                - lo_power: LO功率 (dBm)
                - sideband: 边带选择 ('LOW' 或 'HIGH')，默认 'LOW'
                
        Returns:
            (success, message): 配置是否成功和消息
        """
        if not self.connected:
            return False, "设备未连接"
        
        try:
            print(f"\n{'='*70}")
            print(f"[混频器] 思仪3674L - 配置混频器模式")
            print(f"{'='*70}\n")
            
            # --- 步骤 1: 初始化 ---
            print(f"[SCPI] 步骤1: 初始化")
            
            # 删除旧测量
            print(f"  >> :CALC:PAR:DEL:ALL")
            self.write(":CALC:PAR:DEL:ALL")
            
            # --- 步骤 2: 创建测量轨迹 ---
            print(f"\n[SCPI] 步骤2: 创建测量轨迹 (SC21, Ipwr, Opwr)")
            
            # 创建 SC21 测量
            print(f"  >> :CALC1:CUST:DEF 'My_SC21', 'Scalar Mixer/Converter', 'SC21'")
            self.write(":CALC1:CUST:DEF 'My_SC21', 'Scalar Mixer/Converter', 'SC21'")
            print(f"  >> :DISP:WIND1:TRAC1:FEED 'My_SC21'")
            self.write(":DISP:WIND1:TRAC1:FEED 'My_SC21'")
            
            # 创建 Ipwr (输入功率) 测量
            print(f"  >> :CALC1:CUST:DEF 'My_Ipwr', 'Scalar Mixer/Converter', 'Ipwr'")
            self.write(":CALC1:CUST:DEF 'My_Ipwr', 'Scalar Mixer/Converter', 'Ipwr'")
            print(f"  >> :DISP:WIND1:TRAC2:FEED 'My_Ipwr'")
            self.write(":DISP:WIND1:TRAC2:FEED 'My_Ipwr'")
            
            # 创建 Opwr (输出功率) 测量
            print(f"  >> :CALC1:CUST:DEF 'My_Opwr', 'Scalar Mixer/Converter', 'Opwr'")
            self.write(":CALC1:CUST:DEF 'My_Opwr', 'Scalar Mixer/Converter', 'Opwr'")
            print(f"  >> :DISP:WIND1:TRAC3:FEED 'My_Opwr'")
            self.write(":DISP:WIND1:TRAC3:FEED 'My_Opwr'")
            
            # 选中主测量来承载设置
            print(f"  >> :CALC1:PAR:SEL 'My_SC21'")
            self.write(":CALC1:PAR:SEL 'My_SC21'")
            
            # --- 步骤 3: 端口配置 ---
            print(f"\n[SCPI] 步骤3: 端口配置 (RF=1, IF=2, LO=3)")
            
            input_port = mixer_config.get('input_port', 1)
            output_port = mixer_config.get('output_port', 2)
            lo_port = mixer_config.get('lo_port', 3)
            
            print(f"  >> :SENS:MIX:PORT:INP {input_port}")
            self.write(f":SENS:MIX:PORT:INP {input_port}")
            print(f"  >> :SENS:MIX:PORT:OUTP {output_port}")
            self.write(f":SENS:MIX:PORT:OUTP {output_port}")
            print(f"  >> :SENS:MIX:LO:NAME 'Port {lo_port}'")
            self.write(f":SENS:MIX:LO:NAME 'Port {lo_port}'")
            
            # --- 步骤 4: 频率与模式配置 ---
            print(f"\n[SCPI] 步骤4: 频率与模式配置")
            
            # RF 起始/终止频率
            input_start = mixer_config.get('input_start_freq', 1e9)
            input_stop = mixer_config.get('input_stop_freq', 4e9)
            print(f"  >> :SENS:MIX:INP:FREQ:STAR {input_start}")
            self.write(f":SENS:MIX:INP:FREQ:STAR {input_start}")
            print(f"  >> :SENS:MIX:INP:FREQ:STOP {input_stop}")
            self.write(f":SENS:MIX:INP:FREQ:STOP {input_stop}")
            
            # RF 模式为扫频
            print(f"  >> :SENS:MIX:INP:FREQ:MODE SWEPT")
            self.write(":SENS:MIX:INP:FREQ:MODE SWEPT")
            
            # LO 模式为固定
            print(f"  >> :SENS:MIX:LO:FREQ:MODE FIXED")
            self.write(":SENS:MIX:LO:FREQ:MODE FIXED")
            
            # LO 频率
            lo_freq = mixer_config['lo_freq']
            print(f"  >> :SENS:MIX:LO:FREQ:FIX {lo_freq}")
            self.write(f":SENS:MIX:LO:FREQ:FIX {lo_freq}")
            
            # --- 步骤 5: 功率配置 ---
            print(f"\n[SCPI] 步骤5: 功率配置")
            
            lo_power = mixer_config['lo_power']
            print(f"  >> :SENS:MIX:LO:POW {lo_power}")
            self.write(f":SENS:MIX:LO:POW {lo_power}")
            
            # --- 步骤 6: 转换模式（边带选择）---
            print(f"\n[SCPI] 步骤6: 转换模式 (边带选择)")
            
            # LOW = |RF - LO| (差频/下变频)
            # HIGH = RF + LO (和频/上变频)
            sideband = mixer_config.get('sideband', 'LOW')
            print(f"  >> :SENS:MIX:OUTP:FREQ:SID {sideband}")
            self.write(f":SENS:MIX:OUTP:FREQ:SID {sideband}")
            
            # --- 步骤 7: 计算与应用 ---
            print(f"\n[SCPI] 步骤7: 计算与应用")
            
            # 计算输出频率 (IF)
            print(f"  >> :SENS:MIX:CALC Output")
            self.write(":SENS:MIX:CALC Output")
            
            # 应用设置（核心！不执行则上述配置不生效）
            print(f"  >> :SENS:MIX:APPLY")
            self.write(":SENS:MIX:APPLY")
            
            # 检查错误
            print(f"\n[SCPI] 检查设备错误")
            try:
                err_code, err_msg = self.get_error()
                if err_code != 0:
                    print(f"  [警告] 设备报告错误: [{err_code}] {err_msg}")
                    if "编码问题" not in err_msg and "UnicodeDecodeError" not in err_msg:
                        return False, f"混频器配置失败: {err_msg}"
                else:
                    print(f"  [OK] 无错误")
            except Exception as e:
                print(f"  [警告] 无法查询错误: {str(e)}")
            
            print(f"\n[成功] 混频器模式配置完成")
            print(f"  RF (Input): Port {input_port} - 扫频 {input_start/1e9:.3f}-{input_stop/1e9:.3f} GHz")
            print(f"  LO: Port {lo_port} - {lo_freq/1e6:.1f} MHz @ {lo_power} dBm (固定)")
            print(f"  IF (Output): Port {output_port} - 自动计算 ({sideband} sideband)")
            print(f"{'='*70}\n")
            
            return True, "混频器配置成功"
            
        except Exception as e:
            print(f"\n[错误] 混频器配置失败: {str(e)}")
            print(f"{'='*70}\n")
            import traceback
            traceback.print_exc()
            return False, f"混频器配置失败: {str(e)}"

