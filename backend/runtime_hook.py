# -*- coding: utf-8 -*-
"""
PyInstaller Runtime Hook
用于确保 Python DLL 正确加载

这个文件会在打包的 EXE 启动时首先执行，
确保 Python 运行时环境正确初始化
"""

import os
import sys

# 获取当前可执行文件的目录
if getattr(sys, 'frozen', False):
    # 运行在 PyInstaller 打包后的环境
    application_path = sys._MEIPASS
    
    # 确保 DLL 搜索路径包含可执行文件目录
    exe_dir = os.path.dirname(sys.executable)
    if exe_dir not in os.environ.get('PATH', '').split(os.pathsep):
        os.environ['PATH'] = exe_dir + os.pathsep + os.environ.get('PATH', '')
    
    # 添加 _internal 目录到搜索路径（PyInstaller 6.x 的新结构）
    internal_dir = os.path.join(exe_dir, '_internal')
    if os.path.exists(internal_dir):
        if internal_dir not in os.environ.get('PATH', '').split(os.pathsep):
            os.environ['PATH'] = internal_dir + os.pathsep + os.environ.get('PATH', '')
