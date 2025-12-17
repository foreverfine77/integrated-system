@echo off
chcp 65001 >nul
echo ======================================================================
echo 多通道系统测试软件 - EXE 打包脚本
echo ======================================================================
echo.
echo 请选择打包模式:
echo   [1] 完整打包（首次或依赖变更时使用）
echo   [2] 快速更新（仅更新 EXE，依赖不变时使用）
echo.
set /p mode="请输入选项 (1 或 2): "

if "%mode%"=="2" goto quick_build
goto full_build

:quick_build
echo.
echo ======================================================================
echo 快速更新模式 - 仅重新编译 EXE
echo ======================================================================
echo.

:: 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python 环境
    pause
    exit /b 1
)

echo [步骤 1/3] 构建前端...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] 前端构建完成

echo.
echo [步骤 2/3] 复制前端到后端...
xcopy "frontend\dist\" "backend\dist\" /E /I /Y >nul
echo [OK] 前端文件已更新

echo.
echo [步骤 3/3] 重新打包 EXE...
cd backend
pyinstaller app_with_console.spec --clean > build_log1.txt 2>&1
if %errorlevel% neq 0 (
    echo [错误] 打包失败
    powershell -Command "Get-Content build_log1.txt -Tail 10"
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] EXE 打包完成

:: 复制到 integrated_system 目录
echo.
echo [复制] 将 EXE 复制到项目根目录...
if not exist "output\" mkdir "output"
copy /Y "backend\dist\多通道测试系统_带终端\多通道测试系统_带终端.exe" "output\" >nul
echo [OK] EXE 已复制到: output\多通道测试系统_带终端.exe

echo.
echo ======================================================================
echo 快速更新完成！
echo.
echo 输出文件: output\多通道测试系统_带终端.exe
echo.
echo [提示] 只需将此 EXE 复制到目标电脑覆盖即可
echo        （前提：目标电脑已有完整的 _internal 目录）
echo ======================================================================
pause
exit /b 0

:full_build
echo.
echo ======================================================================
echo 完整打包模式
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

echo [步骤 1/8] 构建前端...
cd frontend
if not exist "node_modules\" (
    echo [警告] 未找到 node_modules，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] npm install 失败
        cd ..
        pause
        exit /b 1
    )
)
echo 正在构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] 前端构建完成

echo.
echo [步骤 2/8] 检查前端构建...
if not exist "frontend\dist\" (
    echo [错误] 前端构建失败，未找到 dist 目录
    pause
    exit /b 1
)
echo [OK] 前端构建目录存在

echo.
echo [步骤 3/8] 复制前端文件到后端...
if exist "backend\dist\" (
    echo 删除旧的 dist 目录...
    rmdir /s /q "backend\dist\"
)
echo 复制文件...
xcopy "frontend\dist\" "backend\dist\" /E /I /Y >nul
echo [OK] 前端文件已复制到后端

echo.
echo [步骤 4/8] 安装打包依赖...
cd backend
pip install -r requirements_build.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成

echo.
echo [步骤 5/8] 清理旧的打包输出...
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
echo [步骤 6/8] 打包版本 A - 带终端版本...
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
echo [步骤 7/8] 打包版本 B - 无终端版本...
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
echo [步骤 8/8] 复制输出到项目根目录...
cd ..

:: 创建 output 目录
if not exist "output\" mkdir "output"

:: 复制完整的带终端版本
if exist "output\多通道测试系统_带终端\" rmdir /s /q "output\多通道测试系统_带终端\"
xcopy "backend\dist\多通道测试系统_带终端\" "output\多通道测试系统_带终端\" /E /I /Y >nul

:: 复制完整的无终端版本
if exist "output\多通道测试系统\" rmdir /s /q "output\多通道测试系统\"
xcopy "backend\dist\多通道测试系统\" "output\多通道测试系统\" /E /I /Y >nul

:: 复制使用说明
if exist "使用说明.txt" (
    copy /Y "使用说明.txt" "output\多通道测试系统_带终端\" >nul
    copy /Y "使用说明.txt" "output\多通道测试系统\" >nul
    echo [OK] 使用说明已添加
)

echo.
echo ======================================================================
echo 打包完成！
echo.
echo 输出目录: output\
echo   ├─ 多通道测试系统_带终端\  (带终端版，可查看日志)
echo   └─ 多通道测试系统\        (无终端版，适合最终用户)
echo.
echo [下一步] 
echo   - 首次部署: 复制整个文件夹到目标电脑
echo   - 后续更新: 运行此脚本选择模式 2，只复制 EXE 文件
echo ======================================================================
pause