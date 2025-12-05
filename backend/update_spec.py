import re

# 读取spec文件
for spec_file in ['app_with_console.spec', 'app_no_console.spec']:
    try:
        with open(spec_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否已经包含logger_config
        if 'logger_config' in content:
            print(f'{spec_file}: logger_config already exists')
            continue
        
        # 在hiddenimports中添加logger_config
        pattern = r"(hiddenimports=\['devices', 'devices\.rohde', 'devices\.siyi', 'devices\.keysight',)"
        replacement = r"\1\n        'logger_config',  # 日志配置模块"
        
        new_content = re.sub(pattern, replacement, content)
        
        if new_content != content:
            with open(spec_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'{spec_file}: Updated successfully')
        else:
            print(f'{spec_file}: Pattern not found')
            
    except Exception as e:
        print(f'{spec_file}: Error - {e}')

print('Done!')
