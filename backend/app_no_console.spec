# -*- mode: python ; coding: utf-8 -*-
# PyInstaller Spec 文件 - 无终端版本（优化版）
# 用于生成静默运行的 EXE

import os
import sys

block_cipher = None

# 获取当前目录
current_dir = os.path.dirname(os.path.abspath(SPEC))

# 前端静态文件目录
dist_dir = os.path.join(current_dir, 'dist')

# 数据文件列表
datas = []

# 添加前端 dist 目录
if os.path.exists(dist_dir):
    datas.append((dist_dir, 'dist'))
    print(f"[OK] 找到前端目录: {dist_dir}")
else:
    print(f"[X] 警告: 未找到前端目录 {dist_dir}")

# 添加配置文件
config_dir = os.path.join(current_dir, 'config')
if os.path.exists(config_dir):
    datas.append((config_dir, 'config'))

# 查找并添加 Python DLL
binaries = []
python_dll = None
for dll_name in ['python39.dll', 'python38.dll', 'python310.dll', 'python311.dll', 'python312.dll']:
    dll_path = os.path.join(sys.base_prefix, dll_name)
    if os.path.exists(dll_path):
        python_dll = dll_path
        binaries.append((dll_path, '.'))
        print(f"[OK] 找到 Python DLL: {dll_path}")
        break

if not python_dll:
    print("[!] 警告: 未找到 Python DLL")

# 排除不必要的模块（减小体积约200MB+）
excludes = [
    # 机器学习库
    'torch', 'torchvision', 'torchaudio',
    'tensorflow', 'tensorflow_core',
    'keras',
    
    # 科学计算库（完整排除）
    'scipy', 'scipy.sparse', 'scipy.spatial', 'scipy.optimize',
    'scipy.stats', 'scipy.integrate', 'scipy.interpolate',
    
    # 绘图库（完整排除）
    'matplotlib', 'matplotlib.pyplot', 'matplotlib.backends',
    'mpl_toolkits',
    
    # UI 框架
    'PyQt5', 'PyQt6', 
    'PySide2', 'PySide6', 'shiboken6',
    'tkinter', 'tk', 'tcl',
    'wx', 'wxPython',
    
    # 图像处理
    'cv2', 'PIL.ImageQt',
    
    # 开发工具
    'IPython', 'jupyter', 'notebook',
    'pytest', 'unittest', 'doctest',
    'pydoc', 'pydoc_data',
    'lib2to3', 'pdb',
    
    # 测试模块
    'matplotlib.tests', 'pandas.tests', 'numpy.testing',
    'test', 'tests',
    
    # 打包工具
    'setuptools', 'pip', 'wheel', 'pkg_resources',
]

a = Analysis(
    ['app_desktop.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=['devices', 'devices.rohde', 'devices.siyi', 'devices.keysight',
        'logger_config',  # 日志配置模块 
        'waitress',
        'flask',
        'flask.json',
        'werkzeug.security',
        'serial',
        'pandas',
        'numpy',
        'openpyxl',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,  # ← 关键：排除不需要的模块
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='多通道测试系统',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,  # 无终端窗口
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../frontend/public/app_icon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='多通道测试系统',
)
