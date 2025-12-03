"""
更新PyInstaller spec文件以包含设备驱动模块
"""
import os
import re

spec_files = ['../app_no_console.spec', '../app_with_console.spec']

for spec_file in spec_files:
    if not os.path.exists(spec_file):
        print(f"[SKIP] {spec_file} 不存在")
        continue
        
    print(f"[处理] {spec_file}...")
    
    with open(spec_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找hiddenimports
    # 可能是 hiddenimports=[], 或 hiddenimports=['xxx'],
    
    # 我们要确保包含 devices.rohde, devices.siyi, devices.keysight
    required_imports = "'devices', 'devices.rohde', 'devices.siyi', 'devices.keysight'"
    
    if "devices.rohde" in content:
        print(f"  [OK] 已包含设备驱动")
    else:
        # 尝试替换 hiddenimports=[]
        if "hiddenimports=[]" in content:
            content = content.replace("hiddenimports=[]", f"hiddenimports=[{required_imports}]")
            print(f"  [更新] 添加了设备驱动到hiddenimports")
        # 尝试替换 hiddenimports=[...
        elif "hiddenimports=[" in content:
            # 在列表开头添加
            content = content.replace("hiddenimports=[", f"hiddenimports=[{required_imports}, ")
            print(f"  [更新] 追加了设备驱动到hiddenimports")
        else:
            print(f"  [警告] 未找到hiddenimports定义")
            
    with open(spec_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("[完成] Spec文件更新完毕")
