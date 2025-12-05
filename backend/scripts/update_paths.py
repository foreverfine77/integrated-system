"""更新backend/scripts/目录下所有脚本的路径引用"""
import os
import re

scripts_dir = '.'
files_to_update = [
    'add_mixer_backend.py',
    'final_integration.py', 
    'fix_s_param.py',
    'update_rohde_config.py'
]

print('[更新脚本路径引用]')
print('='*50)

for filename in files_to_update:
    filepath = os.path.join(scripts_dir, filename)
    if not os.path.exists(filepath):
        print(f'[SKIP] {filename} - 文件不存在')
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 更新路径：backend/ -> ../
    # frontend/ -> ../../frontend/
    updates = 0
    
    # 替换 'backend/xxx' -> '../xxx'
    pattern1 = r"'backend/([^']+)'"
    replacement1 = r"'../\1'"
    new_content = re.sub(pattern1, replacement1, content)
    if new_content != content:
        updates += new_content.count("'../") - content.count("'../")
        content = new_content
    
    # 替换 "backend/xxx" -> "../xxx"
    pattern2 = r'"backend/([^"]+)"'
    replacement2 = r'"../\1"'
    new_content = re.sub(pattern2, replacement2, content)
    if new_content != content:
        updates += new_content.count('"../') - content.count('"../')
        content = new_content
    
    # 替换 'frontend/xxx' -> '../../frontend/xxx'
    pattern3 = r"'frontend/([^']+)'"
    replacement3 = r"'../../frontend/\1'"
    new_content = re.sub(pattern3, replacement3, content)
    if new_content != content:
        updates += new_content.count("'../../frontend/") - content.count("'../../frontend/")
        content = new_content
    
    # 替换 "frontend/xxx" -> "../../frontend/xxx"
    pattern4 = r'"frontend/([^"]+)"'
    replacement4 = r'"../../frontend/\1"'
    new_content = re.sub(pattern4, replacement4, content)
    if new_content != content:
        updates += new_content.count('"../../frontend/') - content.count('"../../frontend/')
        content = new_content
    
    if updates > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'[更新] {filename} - {updates}处路径引用')
    else:
        print(f'[跳过] {filename} - 无需更新')

print('='*50)
print('[完成] 所有脚本路径已更新')
print('\n提示: 现在可以从backend/scripts/目录运行这些脚本')
