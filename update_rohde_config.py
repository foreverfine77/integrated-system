"""
修改rohde.py以支持动态VMIX配置
"""
import re

print("[修改rohde.py] 更新_configure_vmix_mode以使用动态配置...")

with open('backend/devices/rohde.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新方法签名（如果还没更新）
if 'def _configure_vmix_mode(self):' in content:
    content = content.replace(
        'def _configure_vmix_mode(self):',
        'def _configure_vmix_mode(self, config=None):'
    )
    print("  [OK] 已更新方法签名")

# 2. 在方法开头添加默认配置
default_config_code = '''        # 默认配置（如果未传入）
        if config is None:
            config = {
                'rfPort': 1,
                'ifPort': 2,
                'loPort': 3,
                'loFrequency': 300.0,
                'loPower': 10.0,
                'conversionMode': 'DCUP'
            }
        '''

if '如果未传入' not in content:
    # 在try:之后插入
    pattern = r'(def _configure_vmix_mode\(self, config=None\):.*?try:)'
    replacement = lambda m: m.group(1) + '\n' + default_config_code
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("  [OK] 已添加默认配置")

# 3. 替换硬编码的端口号和参数
replacements = [
    # 端口配置
    (r'self\.write\("SENSe1:FREQuency:CONVersion:MIXer:RFPort 1"\)',
     r'self.write(f"SENSe1:FREQuency:CONVersion:MIXer:RFPort {config[\'rfPort\']}")'),
    
    (r'self\.write\("SENSe1:FREQuency:CONVersion:MIXer:IFPort 2"\)',
     r'self.write(f"SENSe1:FREQuency:CONVersion:MIXer:IFPort {config[\'ifPort\']}")'),
    
    (r'self\.write\("SENSe1:FREQuency:CONVersion:MIXer:LOPort1 PORT, 3"\)',
     r'self.write(f"SENSe1:FREQuency:CONVersion:MIXer:LOPort1 PORT, {config[\'loPort\']}")'),
    
    # LO频率 (300 MHz 硬编码)
    (r'self\.write\("SENSe1:FREQuency:CONVersion:MIXer:MFFixed LO1, 300000000\.0"\)',
     r'lo_freq_hz = config[\'loFrequency\'] * 1e6\n            self.write(f"SENSe1:FREQuency:CONVersion:MIXer:MFFixed LO1, {lo_freq_hz}")'),
    
    # LO功率 (10 dBm 硬编码)
    (r'self\.write\("SOURce1:FREQuency:CONVersion:MIXer:PMFixed LO1, 10\.0"\)',
     r'self.write(f"SOURce1:FREQuency:CONVersion:MIXer:PMFixed LO1, {config[\'loPower\']}")'),
    
    # 转换模式
    (r'self\.write\("SENSe1:FREQuency:CONVersion:MIXer:TFrequency1 DCUP"\)',
     r'self.write(f"SENSe1:FREQuency:CONVersion:MIXer:TFrequency1 {config[\'conversionMode\']}")'),
]

for old, new in replacements:
    if re.search(old, content):
        content = re.sub(old, new, content)
        print(f"  [OK] 已替换: {old[:50]}...")

# 4. 在get_measurement_data中传入config
# 查找调用_configure_vmix_mode的地方
if 'self._configure_vmix_mode()' in content:
    # 需要从controller获取config
    # 临时方案：使用默认配置（完整方案需要从controller传入）
    print("  [提示] _configure_vmix_mode()调用保持不变，将使用默认配置")
    print("        完整方案需要在测量时从vna_controller传入mixer_config")

with open('backend/devices/rohde.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n[完成] rohde.py已更新为支持动态配置")
print("注意：需要在vna_controller.py的_measurement_worker中传入mixer_config")
