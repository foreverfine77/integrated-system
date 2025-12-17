# PyInstaller 排除配置
# 在打包时使用此文件排除不必要的大型库

# 可以排除的大型库（按大小排序）
EXCLUDES = [
    # --- 科学计算库（如果不用可排除）---
    # 'scipy',           # ~150MB - 科学计算
    # 'matplotlib',      # ~30MB - 图表绑制
    # 'pandas',          # ~50MB - 数据分析
    # 'numpy.testing',   # ~10MB - 测试模块
    
    # --- GUI 相关（如果只用 webview）---
    # 'PySide6',         # ~100MB - Qt GUI
    # 'shiboken6',       # ~8MB - PySide6 依赖
    
    # --- 其他可选 ---
    'tkinter',           # Tk GUI（不用）
    'test',              # 测试模块
    'unittest',          # 测试模块
    'pytest',            # 测试模块
    'doctest',           # 文档测试
    'pdb',               # 调试器
    'lib2to3',           # 代码转换工具
]

# 可以排除的大型二进制
EXCLUDE_BINARIES = [
    # 'libopenblas*.dll',  # ~35MB - 但 numpy 需要
]

# 使用方法：
# 在 .spec 文件中添加：
# a = Analysis(
#     ...
#     excludes=EXCLUDES,
#     ...
# )
