# 临时脚本：在S参数测量前添加FUND模式恢复
import re

with open('backend/devices/rohde.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找并替换S参数配置部分
pattern = r'(            if param in \[\'S11\', \'S21\', \'S12\', \'S22\'\]:\n                print\(f"\[SCPI\] 配置S参数测量"\))\n(                trc_name = f"Trc_\{param\}")'

replacement = r'''\1

                # 确保设备处于标准测量模式（如果之前测量了SC参数）
                print(f"\n[SCPI] 恢复标准测量模式")
                print(f"  >> SENSe1:FREQuency:CONVersion FUND (基频模式)")
                self.write("SENSe1:FREQuency:CONVersion FUND")

\2'''

content_new = re.sub(pattern, replacement, content)

if content != content_new:
    with open('backend/devices/rohde.py', 'w', encoding='utf-8') as f:
        f.write(content_new)
    print("[OK] 修改成功！")
else:
    print("[FAIL] 未找到匹配的代码")
