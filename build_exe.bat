@echo off
chcp 65001 >nul
echo ======================================================================
echo 多通道系统测试软件 - EXE 打包脚本
echo ======================================================================
echo.

:: 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python 环境
    echo 请先安装 Python 3.8 或更高版本
    pause
    exit /b 1
)

echo [步骤 1/7] 检查前端构建...
if not exist "frontend\dist\" (
    echo [错误] 未找到前端构建目录
    echo 请先构建前端:
    echo   cd frontend
    echo   npm run build
    pause
    exit /b 1
)
echo [OK] 前端构建目录存在

echo.
echo [步骤 2/7] 复制前端文件到后端...
if exist "backend\dist\" (
    echo 删除旧的 dist 目录...
    rmdir /s /q "backend\dist\"
)
echo 复制文件...
xcopy "frontend\dist\" "backend\dist\" /E /I /Y >nul
echo [OK] 前端文件已复制到后端

echo.
echo [步骤 3/7] 安装打包依赖...
cd backend
pip install -r requirements_build.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成

echo.
echo [步骤 4/7] 清理旧的打包输出...
:: 只删除 PyInstaller 的输出子目录，保留前端静态文件
if exist "dist\多通道测试系统_带终端\" (
    echo 删除旧的带终端版本...
    rmdir /s /q "dist\多通道测试系统_带终端\"
)
if exist "dist\多通道测试系统\" (
    echo 删除旧的无终端版本...
    rmdir /s /q "dist\多通道测试系统\"
)
if exist "build\" (
    echo 删除构建缓存...
    rmdir /s /q "build\"
)
echo [OK] 清理完成

echo.
echo [步骤 5/7] 打包版本 A - 带终端版本...
echo 这个版本可以看到 SCPI 指令日志
echo 正在打包... (日志保存到 build_log1.txt)
pyinstaller app_with_console.spec --clean > build_log1.txt 2>&1
if %errorlevel% neq 0 (
    echo [错误] 带终端版本打包失败
    echo.
    echo 显示最后 20 行错误日志:
    echo ----------------------------------------
    powershell -Command "Get-Content build_log1.txt -Tail 20"
    echo ----------------------------------------
    pause
    exit /b 1
)
echo [OK] 带终端版本打包完成

echo.
echo [步骤 6/7] 打包版本 B - 无终端版本...
echo 这个版本静默运行，无后台终端
echo 正在打包... (日志保存到 build_log2.txt)
pyinstaller app_no_console.spec --clean > build_log2.txt 2>&1
if %errorlevel% neq 0 (
    echo [错误] 无终端版本打包失败
    echo.
    echo 显示最后 20 行错误日志:
    echo ----------------------------------------
    powershell -Command "Get-Content build_log2.txt -Tail 20"
    echo ----------------------------------------
    pause
    exit /b 1
)
echo [OK] 无终端版本打包完成

echo.
echo [步骤 7/7] 准备便携版打包...
:: 复制使用说明到两个版本
cd ..
if exist "使用说明.txt" (
    copy /Y "使用说明.txt" "backend\dist\多通道测试系统_带终端\" >nul
    copy /Y "使用说明.txt" "backend\dist\多通道测试系统\" >nul
    echo [OK] 使用说明已添加
)

echo.
echo ======================================================================
echo 打包完成！
echo 生成的文件位于:
echo   backend\dist\多通道测试系统_带终端\  (带终端版，可查看日志)
echo   backend\dist\多通道测试系统\        (无终端版，适合最终用户)
echo.
echo [下一步] 运行 create_portable.bat 创建便携 ZIP 包，便于分发
echo ======================================================================
pause