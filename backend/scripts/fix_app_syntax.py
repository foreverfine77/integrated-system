"""修复app.py中的转义字符错误"""
with open('../app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 修复第165和177行的转义docstring
for i in range(len(lines)):
    if '\\\"\\\"\\\"' in lines[i]:
        lines[i] = lines[i].replace('\\\"\\\"\\\"', '\"\"\"')
        print(f'[修复] 第{i+1}行: 转义docstring -> 正常docstring')

with open('../app.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('[OK] app.py语法错误已修复!')
