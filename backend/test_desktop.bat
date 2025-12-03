@echo off
chcp 65001 >nul
echo ======================================================================
echo 测试桌面版应用（开发模式）
echo ======================================================================
echo.

echo 检查依赖...
pip show pywebview >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装 pywebview...
    pip install pywebview
)

pip show waitress >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装 waitress...
    pip install waitress
)

echo.
echo 启动桌面应用...
echo （按 Ctrl+C 或关闭窗口停止）
echo.

python app_desktop.py

pause
