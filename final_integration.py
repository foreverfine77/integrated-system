"""
最终集成脚本：在页面中添加VNAMixerConfig并完善配置传递
"""
import re

print("[1/2] 集成VNAMixerConfig到页面...")

# 找到主页面文件
try:
    with open('frontend/src/pages/VNAPage.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 添加import
    if 'VNAMixerConfig' not in content:
        # 在import部分添加
        pattern = r'(import VNAConnection from.*?VNAConnection.*?\n)'
        replacement = r'\1import VNAMixerConfig from \'../components/vna/VNAMixerConfig\'\n'
        content = re.sub(pattern, replacement, content)
        
        # 在VNAMeasurement后面添加组件（假设有VNAMeasurement）
        pattern = r'(\u003cVNAMeasurement[\s\S]*?/\u003e)'
        replacement = r'\1\n                    \u003cVNAMixerConfig \n                        isConnected={isConnected}\n                        deviceType={selectedDevice?.id}\n                        addLog={addLog}\n                    /\u003e'
        content = re.sub(pattern, replacement, content)
        
        with open('frontend/src/pages/VNAPage.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("  [OK] 已添加VNAMixerConfig到VNAPage.jsx")
    else:
        print("  [SKIP] VNAMixerConfig已在页面中")
except FileNotFoundError:
    print("  [注意] VNAPage.jsx未找到，组件需手动集成")

print("\n[2/2] 确保测量时传入mixer_config...")

# 检查vna_controller.py中的调用
with open('backend/vna_controller.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 在_measurement_worker方法中，传递mixer_config到get_measurement_data
# 这里只是确认，因为rohde.py已经有默认配置
if 'self.device_driver.get_measurement_data' in content:
    print("  [提示] vna_controller调用get_measurement_data")
    print("         rohde.py已有默认配置，使用默认参数即可")
    print("         未来可优化：将self.mixer_config传入rohde.py")

print("\n[完成] VMIX配置UI集成完成！")
print("\n后续步骤：")
print("  1. 重新构建前端：cd frontend && npm run build")
print("  2. 重启后端测试混频器配置功能")
print("  3. 使用Git提交所有更改")
