# 创建便携版 ZIP 压缩包
# PowerShell 脚本

param(
    [string]$SourceDir = "portable",
    [string]$ZipName = "多通道测试系统_v1.0_便携版.zip"
)

# 设置 UTF-8 编码，避免乱码
try {
    $OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
}
catch {
    # 如果设置失败，使用默认编码
    $OutputEncoding = [System.Text.Encoding]::Default
}

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Write-Host "[ZIP] 正在创建压缩包..." -ForegroundColor Cyan

try {
    # 删除旧的 ZIP 文件
    if (Test-Path $ZipName) {
        Remove-Item $ZipName -Force
        Write-Host "[OK] 已删除旧的 ZIP 文件" -ForegroundColor Green
    }

    # 创建 ZIP 压缩包
    Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $SourceDir, 
        $ZipName, 
        [System.IO.Compression.CompressionLevel]::Optimal, 
        $false
    )
    
    # 显示文件大小
    $size = (Get-Item $ZipName).Length
    $sizeMB = [math]::Round($size / 1MB, 2)
    
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "[成功] 便携版已创建: $ZipName" -ForegroundColor Green
    Write-Host "[大小] $sizeMB MB" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""
    
    exit 0
    
}
catch {
    Write-Host ""
    Write-Host "[错误] ZIP 创建失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "[可能原因]" -ForegroundColor Yellow
    Write-Host "  1. 程序正在运行（请关闭后重试）" -ForegroundColor Yellow
    Write-Host "  2. 杀毒软件正在扫描文件" -ForegroundColor Yellow
    Write-Host "  3. 文件被其他程序占用" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
