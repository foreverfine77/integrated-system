@echo off
chcp 65001 > nul
echo ==========================================
echo      清理构建文件...
echo ==========================================

echo [1/3] 删除 build 目录...
if exist "build" (
    rmdir /s /q "build"
    echo    ✓ 已删除 build
) else (
    echo    - build 不存在
)

echo [2/3] 删除 dist 目录...
if exist "dist" (
    rmdir /s /q "dist"
    echo    ✓ 已删除 dist
) else (
    echo    - dist 不存在
)

echo [3/3] 删除 __pycache__ 目录...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
echo    ✓ 已删除 __pycache__

echo.
echo ==========================================
echo      清理完成！
echo ==========================================
