"""
更新 .spec 文件，确保 devices 目录被包含到打包中
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
    
    # 查找 datas = [ 的位置，并在其中添加 devices 目录
    # 格式: datas = [('source', 'dest'), ...]
    
    # 检查是否已经包含 devices
    if "('devices', 'devices')" in content or "(os.path.join(current_dir, 'devices'), 'devices')" in content:
        print(f"  [OK] 已包含 devices 目录")
    else:
        # 在 datas 列表中添加 devices
        # 查找 datas = [...] 的模式
        # 我们要在列表开头添加 devices
        
        # 方法1：查找 datas = [ 并在后面添加
        pattern1 = r"(datas\s*=\s*\[)"
        if re.search(pattern1, content):
            # 添加到列表开头
            devices_entry = "    (os.path.join(current_dir, 'devices'), 'devices'),\n    "
            content = re.sub(pattern1, r"\1\n" + devices_entry, content)
            print(f"  [更新] 已添加 devices 目录到 datas")
        else:
            print(f"  [警告] 未找到 datas 定义")
    
    with open(spec_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("[完成] Spec 文件更新完毕")
print("\n重要提示：")
print("1. 确保 spec 文件开头定义了 current_dir 变量")
print("2. 重新运行打包脚本")
