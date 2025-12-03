"""
罗德与施瓦茨 ZNA26 网络分析仪设备类
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

class RohdeZNA26(NetworkAnalyzerBase):
    """罗德 ZNA26 网络分析仪"""
    
    def load_device_config(self):
        """加载设备配置"""
        # 从配置文件加载，这里先硬编码
        self.freq_range = (10e6, 26.5e9)  # 10MHz - 26.5GHz
        self.max_points = 100001
        self.min_if_bandwidth = 1
        self.max_if_bandwidth = 1e6
        self.min_power = -70
        self.max_power = 10
    
    def _open_resource(self, resource_name: str):
        """打开VISA资源"""
        rm = pyvisa.ResourceManager()
        return rm.open_resource(resource_name)
    
    def validate_idn_response(self, response: str) -> bool:
        """验证*IDN?响应"""
        return any(x in response for x in ["Rohde", "Rohde&Schwarz"])
    
    def initialize(self):
        """设备初始化配置"""
        try:
            print(f"\n{'='*70}")
            print(f"[罗德ZNA26] 设备初始化")
            print(f"{'='*70}\n")
            
            # 复位到默认状态
            print(f"[SCPI] 设备复位")
            print(f"  >> *RST")
            self.write("*RST")
            
            # 清除状态
            print(f"  >> *CLS")
            self.write("*CLS")
            
            # 等待操作完成
            print(f"  >> *OPC")
            self.write("*OPC")
            
            # 设置触发为单次
            print(f"\n[SCPI] 设置触发模式")
            print(f"  >> INIT:CONT OFF (单次触发)")
            self.write("INIT:CONT OFF")
            
            # 设置默认参数
            print(f"\n[SCPI] 设置默认参数")
            print(f"  >> SENS:BAND 1000 (IF带宽 1kHz)")
            self.set_if_bandwidth(1000)  # 1kHz IF带宽
            
            print(f"  >> SOUR:POW -10 (源功率 -10dBm)")
            self.set_power_level(-10)    # -10dBm功率
            
            # 设置数据格式为ASCII
            print(f"  >> FORM:DATA ASCII (数据格式)")
            self.write("FORM:DATA ASCII")
            
            print(f"\n[完成] 罗德 ZNA26 设备初始化完成")
            print(f"{'='*70}\n")
        except Exception as e:
            print(f"\n[警告] 设备初始化警告: {e}")
            print(f"{'='*70}\n")
            # 即使初始化失败也继续，因为某些命令可能不支持
    
    def _configure_vmix_mode(self):
        """配置VMIX混频器测量模式
        
        根据用户提供的ZNA26实机测量指令序列配置混频器模式。
        此配置包括：
        - 设置通道类型为VMIX
        - 配置混频器端口（RF=Port1, IF=Port2, LO=Port3）
        - 设置LO频率（固定300MHz）和功率（10dBm）
        - 配置转换模式（DC-UP：下变频，上边带）
        - 设置端口衰减
        """
        try:
            print(f"\n{'='*70}")
            print(f"[罗德ZNA26] 配置VMIX混频器测量模式")
            print(f"{'='*70}\n")
            
            # 基本配置
            print(f"[SCPI] 基本配置")
            print(f"  >> SOURce1:COMBiner NOC")
            self.write("SOURce1:COMBiner NOC")
            
            print(f"  >> SENSe1:SWEep:TYPE LINear")
            self.write("SENSe1:SWEep:TYPE LINear")
            
            # 设置通道类型为VMIX（混频器模式）
            print(f"\n[SCPI] 设置通道类型为VMIX")
            print(f"  >> CONFigure:CHANnel1:GUI:TYPE VMIX")
            self.write("CONFigure:CHANnel1:GUI:TYPE VMIX")
            
            # 相位模式和SLA模式
            print(f"\n[SCPI] 配置相位和SLA模式")
            print(f"  >> SENSe1:PHASe:MODE COH (相干模式)")
            self.write("SENSe1:PHASe:MODE COH")
            
            print(f"  >> SENSe1:SLAMode OPT (优化模式)")
            self.write("SENSe1:SLAMode OPT")
            
            # 配置混频器参数
            print(f"\n[SCPI] 配置混频器参数")
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:STAGes 1 (单级混频)")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:STAGes 1")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:RFPort 1")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:RFPort 1")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:IFPort 2")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:IFPort 2")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:LOPort1 PORT, 3")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:LOPort1 PORT, 3")
            
            # 配置倍频器
            print(f"\n[SCPI] 配置倍频器（基频工作）")
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:RFMultiplier 1, 1")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:RFMultiplier 1, 1")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:LOMultiplier1 1, 1")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:LOMultiplier1 1, 1")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:FUNDamental RF")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:FUNDamental RF")
            
            # 配置LO固定频率
            print(f"\n[SCPI] 配置LO固定频率 (300 MHz)")
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:FIXed1 LO1")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:FIXed1 LO1")
            
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:MFFixed LO1, 300000000.0")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:MFFixed LO1, 300000000.0")
            
            # 配置功率模式
            print(f"\n[SCPI] 配置各端口功率模式")
            print(f"  >> SOURce1:FREQuency:CONVersion:MIXer:PMODe RF, FUND")
            self.write("SOURce1:FREQuency:CONVersion:MIXer:PMODe RF, FUND")
            
            print(f"  >> SOURce1:FREQuency:CONVersion:MIXer:PMODe LO1, FIX")
            self.write("SOURce1:FREQuency:CONVersion:MIXer:PMODe LO1, FIX")
            
            print(f"  >> SOURce1:FREQuency:CONVersion:MIXer:PMODe IF, FUND")
            self.write("SOURce1:FREQuency:CONVersion:MIXer:PMODe IF, FUND")
            
            print(f"  >> SOURce1:FREQuency:CONVersion:MIXer:PMFixed LO1, 10.0 (LO功率10dBm)")
            self.write("SOURce1:FREQuency:CONVersion:MIXer:PMFixed LO1, 10.0")
            
            # 配置转换频率模式
            print(f"\n[SCPI] 配置转换频率 (DC-UP: 下变频上边带)")
            print(f"  >> SENSe1:FREQuency:CONVersion:MIXer:TFrequency1 DCUP")
            self.write("SENSe1:FREQuency:CONVersion:MIXer:TFrequency1 DCUP")
            
            print(f"  >> SENSe1:FREQuency:CONVersion MIX")
            self.write("SENSe1:FREQuency:CONVersion MIX")
            
            # 配置任意频率转换
            print(f"\n[SCPI] 配置任意频率转换")
            print(f"  >> SOURce1:FREQuency1:CONVersion:ARBitrary:IFRequency 1, 1, 0.0, SWE, 1, 1")
            self.write("SOURce1:FREQuency1:CONVersion:ARBitrary:IFRequency 1, 1, 0.0, SWE, 1, 1")
            
            print(f"  >> SENSe1:FREQuency1:CONVersion:ARBitrary 1, 1, 0.0, SWE, 1, 1")
            self.write("SENSe1:FREQuency1:CONVersion:ARBitrary 1, 1, 0.0, SWE, 1, 1")
            
            print(f"  >> SOURce1:FREQuency3:CONVersion:ARBitrary:IFRequency 1, 1, 300000000.0, CW, 1, 1")
            self.write("SOURce1:FREQuency3:CONVersion:ARBitrary:IFRequency 1, 1, 300000000.0, CW, 1, 1")
            
            print(f"  >> SENSe1:FREQuency3:CONVersion:ARBitrary 1, 1, 300000000.0, CW, 1, 1")
            self.write("SENSe1:FREQuency3:CONVersion:ARBitrary 1, 1, 300000000.0, CW, 1, 1")
            
            print(f"  >> SOURce1:FREQuency2:CONVersion:ARBitrary:IFRequency 1, 1, -300000000.0, SWE, 1, 1")
            self.write("SOURce1:FREQuency2:CONVersion:ARBitrary:IFRequency 1, 1, -300000000.0, SWE, 1, 1")
            
            print(f"  >> SENSe1:FREQuency2:CONVersion:ARBitrary 1, 1, -300000000.0, SWE, 1, 1")
            self.write("SENSe1:FREQuency2:CONVersion:ARBitrary 1, 1, -300000000.0, SWE, 1, 1")
            
            # 配置参考LO
            print(f"\n[SCPI] 配置参考LO")
            print(f"  >> SOURce1:RLO:FREQuency 1, 1, 0.0, FB, 1, 1")
            self.write("SOURce1:RLO:FREQuency 1, 1, 0.0, FB, 1, 1")
            
            print(f"  >> SOURce1:RLO:PERMenable OFF")
            self.write("SOURce1:RLO:PERMenable OFF")
            
            print(f"  >> SOURce1:RLO:PABSolut OFF")
            self.write("SOURce1:RLO:PABSolut OFF")
            
            # 配置互调参数
            print(f"\n[SCPI] 配置互调参数")
            print(f"  >> SENSe1:FREQuency:IMODulation:LTONe PORT, 1")
            self.write("SENSe1:FREQuency:IMODulation:LTONe PORT, 1")
            
            print(f"  >> SENSe1:FREQuency:IMODulation:RECeiver 2")
            self.write("SENSe1:FREQuency:IMODulation:RECeiver 2")
            
            # 配置端口衰减
            print(f"\n[SCPI] 配置端口衰减")
            for port in range(1, 5):
                print(f"  >> SOURce1:POWer{port}:ATTenuation 0.0")
                self.write(f"SOURce1:POWer{port}:ATTenuation 0.0")
                
                print(f"  >> SOURce1:PATH{port}:DIRectAccess NONE")
                self.write(f"SOURce1:PATH{port}:DIRectAccess NONE")
                
                print(f"  >> SENSe1:POWer:ATTenuation {port}, 10.0")
                self.write(f"SENSe1:POWer:ATTenuation {port}, 10.0")
            
            # 配置噪声系数（如果需要）
            print(f"\n[SCPI] 配置噪声系数参数")
            print(f"  >> SENSe1:NFIGure:DESCription1:EXTPreamp:STATe OFF")
            self.write("SENSe1:NFIGure:DESCription1:EXTPreamp:STATe OFF")
            
            print(f"  >> SENSe1:NFIGure:DESCription1:EXTPreamp:EGAin 20.0")
            self.write("SENSe1:NFIGure:DESCription1:EXTPreamp:EGAin 20.0")
            
            print(f"  >> SENSe1:NFIGure:DESCription1:EXTPreamp:ECOMpression -20.0")
            self.write("SENSe1:NFIGure:DESCription1:EXTPreamp:ECOMpression -20.0")
            
            print(f"  >> SENSe1:NFIGure:DESCription1:EXTPreamp:CONFig SPOF")
            self.write("SENSe1:NFIGure:DESCription1:EXTPreamp:CONFig SPOF")
            
            # LO跟踪
            print(f"\n[SCPI] 配置LO跟踪")
            print(f"  >> SOURce1:LOTRack:STATe OFF")
            self.write("SOURce1:LOTRack:STATe OFF")
            
            print(f"\n[完成] VMIX混频器模式配置完成")
            print(f"  RF端口: Port 1")
            print(f"  IF端口: Port 2")
            print(f"  LO端口: Port 3")
            print(f"  LO频率: 300 MHz (固定)")
            print(f"  LO功率: 10 dBm")
            print(f"  转换模式: DC-UP (下变频上边带)")
            print(f"{'='*70}\n")
            
        except Exception as e:
            print(f"\n[警告] VMIX模式配置警告: {e}")
            print(f"{'='*70}\n")
            # 继续执行，某些命令可能不支持
    
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
            print(f"[罗德ZNA26] 开始测量")
            print(f"   参数: {parameter.upper()}")
            print(f"   频点数: {frequency_points}")
            print(f"   测量次数: {measurement_count}")
            print(f"   设备连接状态: {self.connected}")
            print(f"{'='*70}\n")
            
            # 选择测量参数
            param = parameter.upper()
            
            # 根据参数类型配置测量
            # 罗德ZNA26使用正确的指令格式（参考用户提供的权威指令）
            if param in ['S11', 'S21', 'S12', 'S22']:
                print(f"[SCPI] 配置S参数测量")
                trc_name = f"Trc_{param}"
                cmd1 = f':CALC1:PAR:SDEF "{trc_name}", "{param}"'
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f':DISP:WIND1:TRAC1:FEED "{trc_name}"'
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f':CALC1:PAR:SEL "{trc_name}"'
                print(f"  >> {cmd3}")
                self.write(cmd3)
                
            elif param in ['SC11', 'SC21', 'SC12', 'SC22']:
                print(f"[SCPI] 配置VMIX混频器S参数测量")
                print(f"  [说明] 测量类型: {param}")
                
                # 自动配置VMIX模式
                self._configure_vmix_mode()
                
                # 映射SC参数到轨迹名称和测量参数
                trace_mapping = {
                    'SC11': ('RF_Refl', 'S11'),   # RF端口反射
                    'SC22': ('IF_Refl', 'S22'),   # IF端口反射
                    'SC21': ('RF_Conv', 'S21'),   # RF到IF转换增益/损耗
                    'SC12': ('IF_Conv', 'S12')    # IF到RF转换增益/损耗
                }
                
                trc_name, s_param = trace_mapping[param]
                
                print(f"\n[SCPI] 配置轨迹和测量")
                print(f"  [映射] {param} → 轨迹'{trc_name}' 测量'{s_param}'")
                
                # 使用CONFigure命令重命名轨迹
                cmd1 = f":CONFigure:CHANnel1:TRACe:REName '{trc_name}'"
                print(f"  >> {cmd1}")
                self.write(cmd1)
                
                # 使用CALCulate命令配置测量参数
                cmd2 = f":CALCulate1:PARameter:MEASure '{trc_name}', '{s_param}'"
                print(f"  >> {cmd2}")
                self.write(cmd2)

                
            elif param in ['IPWR', 'OPWR', 'REVIPWR', 'REVOPWR']:
                print(f"[SCPI] 配置功率测量（绝对波量）")
                
                # 确保设备处于标准测量模式（退出VMIX模式）
                print(f"\n[SCPI] 恢复标准测量模式")
                print(f"  >> SENSe1:FREQuency:CONVersion FUND (基频模式)")
                self.write("SENSe1:FREQuency:CONVersion FUND")
                
                # 功率参数用波名称：a1, b2, a2, b1
                wave_map = {
                    'IPWR': 'a1',      # 端口1参考波
                    'OPWR': 'b2',      # 端口2测量波
                    'REVIPWR': 'a2',   # 端口2参考波
                    'REVOPWR': 'b1'    # 端口1测量波
                }
                wave = wave_map[param]
                
                trc_name = f"Trc_{param}"
                cmd1 = f':CALC1:PAR:SDEF "{trc_name}", "{wave}"'
                print(f"  >> {cmd1} (波: {wave})")
                self.write(cmd1)
                
                # 显示轨迹到窗口
                cmd2 = f':DISP:WIND1:TRAC1:FEED "{trc_name}"'
                print(f"  >> {cmd2}")
                self.write(cmd2)
                
                # 选择轨迹
                cmd3 = f':CALC1:PAR:SEL "{trc_name}"'
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
                else:
                    print(f"  [OK] 无错误")
            except Exception as e:
                print(f"  [警告] 无法查询错误: {str(e)}")
            
            # 注意：频率点数已在 set_frequency_range() 中设置，无需重复
            
            # ⭐ 设置测量次数
            cmd_count = f"SENS:SWE:COUNt {measurement_count}"
            print(f"\n[SCPI] 设置测量次数")
            print(f"  >> {cmd_count}")
            print(f"  [说明] VNA将自动进行{measurement_count}次测量并平均")
            self.write(cmd_count)
            
            # 触发测量
            print(f"\n[SCPI] 触发测量")
            print(f"  >> INIT:IMM")
            print(f"  [说明] VNA开始连续测量{measurement_count}次...")
            self.trigger_sweep()
            
            print(f"[SCPI] 等待测量完成")
            print(f"  >> *WAI 和 *OPC?")
            self.wait_for_sweep()
            
            # 获取频率数据
            # 使用 CALC1 而不是 CALC
            cmd_freq = "CALC1:DATA:STIM?"
            print(f"\n[SCPI] 获取频率数据")
            print(f"  >> {cmd_freq}")
            print(f"  [超时] 数据查询超时设置: 30秒")
            freq_str = self.query(cmd_freq, timeout=30)
            print(f"  << 收到: {len(freq_str)} 字节数据")
            frequencies = [float(x) for x in freq_str.split(',') if x.strip()]
            print(f"  [解析] 解析到 {len(frequencies)} 个频率点")
            
            # 获取测量数据
            # 统一使用 CALC1:DATA? FDATA 格式（参考用户提供的权威指令）
            print(f"\n[SCPI] 获取测量数据")
            cmd_data = "CALC1:DATA? FDATA"
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
        print(f"  >> SENS:FREQ:STAR {start_freq}")
        self.write(f"SENS:FREQ:STAR {start_freq}")
        print(f"  >> SENS:FREQ:STOP {stop_freq}")
        self.write(f"SENS:FREQ:STOP {stop_freq}")
        print(f"  >> SENS:SWE:POIN {points}")
        self.write(f"SENS:SWE:POIN {points}")
    
    def set_power_level(self, power: float):
        """设置源功率"""
        if not (self.min_power <= power <= self.max_power):
            raise ValueError(f"功率超出范围: {self.min_power}dBm - {self.max_power}dBm")
        print(f"[SCPI] 设置源功率")
        print(f"  >> SOUR:POW {power}")
        self.write(f"SOUR:POW {power}")
    
    def set_if_bandwidth(self, bandwidth: float):
        """设置IF带宽"""
        if not (self.min_if_bandwidth <= bandwidth <= self.max_if_bandwidth):
            raise ValueError(f"IF带宽超出范围: {self.min_if_bandwidth}Hz - {self.max_if_bandwidth}Hz")
        print(f"[SCPI] 设置IF带宽")
        print(f"  >> SENS:BAND {bandwidth}")
        self.write(f"SENS:BAND {bandwidth}")
    
    def trigger_sweep(self):
        """触发扫描"""
        self.write("INIT:IMM")
    
    def wait_for_sweep(self):
        """等待扫描完成"""
        self.write("*WAI")
        # 查询操作完成状态
        import time
        max_wait = 180  # 最多等待180秒（3分钟）
        query_timeout = 30  # 每次查询30秒超时（增加到30秒）
        retry_interval = 1.0  # 重试间隔1秒
        start_time = time.time()
        
        print(f"  [等待] 最大等待时间: {max_wait}秒, 查询超时: {query_timeout}秒")
        
        while True:
            try:
                opc = int(self.query("*OPC?", timeout=query_timeout))
                if opc == 1:
                    elapsed = time.time() - start_time
                    print(f"  [完成] 测量完成，耗时: {elapsed:.1f}秒")
                    break
            except Exception as e:
                elapsed = time.time() - start_time
                error_str = str(e)
                
                # 检查是否是超时错误
                if "TMO" in error_str or "Timeout" in error_str:
                    print(f"  [超时] 查询超时({elapsed:.1f}s)，继续等待...")
                else:
                    print(f"  [警告] 等待测量时出现异常: {e}")
            
            # 检查是否超过最大等待时间
            if time.time() - start_time > max_wait:
                print(f"  [警告] 等待测量超时（{max_wait}秒），继续尝试获取数据")
                break
            
            # 短暂休息再查询
            time.sleep(retry_interval)

