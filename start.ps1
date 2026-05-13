Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OPC OS - AI 一人公司操作系统" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
try {
    $nodeVersion = node -v
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  错误: 未找到 Node.js" -ForegroundColor Red
    Write-Host "  请先安装: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "按回车退出"
    exit 1
}

$npmVersion = npm -v
Write-Host "  npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# 复制到无中文路径
$target = "C:\opc-os"
if (-not (Test-Path "$target\package.json")) {
    Write-Host "  复制项目到 $target ..." -ForegroundColor Yellow
    Copy-Item -Path "$PSScriptRoot\*" -Destination $target -Recurse -Force
}

Set-Location $target

Write-Host "  [1/2] 安装依赖..." -ForegroundColor Yellow
Write-Host ""
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  npm install 失败!" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}

Write-Host ""
Write-Host "  [2/2] 启动开发服务器..." -ForegroundColor Green
Write-Host ""
Write-Host "  浏览器打开: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  按 Ctrl+C 停止" -ForegroundColor Gray
Write-Host ""

npm run dev
