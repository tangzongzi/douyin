# 飞书数据中心 - PowerShell启动脚本
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   飞书数据中心 - 本地启动脚本" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到Node.js" -ForegroundColor Red
    Write-Host "请先安装Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""

# 检查是否在正确目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 未找到package.json文件" -ForegroundColor Red
    Write-Host "请确保在feishu-dashboard目录下运行此脚本" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

# 检查依赖是否安装
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按任意键退出"
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 清理可能的端口占用
Write-Host "🔧 清理端口占用..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    # 忽略错误，继续执行
}

# 启动开发服务器
Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 本地访问地址: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "🌐 网络访问地址: " -NoNewline -ForegroundColor White  
Write-Host "http://198.18.0.1:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 启动服务器
npm run dev
