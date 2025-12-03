@echo off
chcp 65001 >nul
echo ======================================================================
echo 创建便携版打包
echo ======================================================================
echo.

set "APP_NAME=多通道测试系统_带终端"
set "SOURCE_DIR=backend\dist\%APP_NAME%"
set "PORTABLE_DIR=portable"
set "ZIP_NAME=多通道测试系统_v1.0_便携版.zip"

:: 检查源目录是否存在
if not exist "%SOURCE_DIR%" (
    echo [错误] 未找到打包好的程序目录
    echo 请先运行 build_exe.bat 完成打包
    pause
    exit /b 1
)

echo [步骤 1/4] 检查程序是否在运行...
tasklist | find /i "多通道测试系统" >nul 2>nul
if %errorlevel% == 0 (
    echo [警告] 检测到程序正在运行，尝试关闭...
    taskkill /f /im "多通道测试系统_带终端.exe" 2>nul
    taskkill /f /im "多通道测试系统.exe" 2>nul
    timeout /t 2 /nobreak >nul
)
echo [OK] 程序未运行

echo.
echo [步骤 2/4] 创建便携版目录...
if exist "%PORTABLE_DIR%" (
    rmdir /s /q "%PORTABLE_DIR%"
)
mkdir "%PORTABLE_DIR%"

echo.
echo [步骤 3/4] 复制文件...
xcopy "%SOURCE_DIR%" "%PORTABLE_DIR%" /E /I /Y /Q >nul
if %errorlevel% neq 0 (
    echo [错误] 文件复制失败
    pause
    exit /b 1
)
echo [OK] 文件复制完成

echo.
echo [步骤 4/4] 创建 ZIP 压缩包...

:: 使用 PowerShell 脚本压缩
echo [使用 PowerShell 压缩...]
powershell -NoProfile -ExecutionPolicy Bypass -File "create_zip.ps1" -SourceDir "%PORTABLE_DIR%" -ZipName "%ZIP_NAME%"

:zip_success
for %%A in ("%ZIP_NAME%") do set "size=%%~zA"
set /a "size_mb=size / 1048576"

echo.
echo [使用说明]
echo 1. 将 %ZIP_NAME% 发送给用户
echo 2. 用户解压到任意目录
echo 3. 双击 %APP_NAME%.exe 即可运行
echo.
echo [提示] 整个文件夹可以放在 U 盘或移动硬盘中使用
echo.

:: 询问是否清理临时目录
set /p cleanup="是否删除临时 portable 文件夹？(Y/N): "
if /i "%cleanup%"=="Y" (
    rmdir /s /q "%PORTABLE_DIR%"
    echo [OK] 临时文件已清理
)

echo.
pause
