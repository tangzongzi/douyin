@echo off
echo ================================
echo    飞书数据中心 - 本地启动脚本
echo ================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示Node版本
echo ✅ Node.js版本:
node --version
echo.

:: 检查是否在正确目录
if not exist "package.json" (
    echo ❌ 错误: 未找到package.json文件
    echo 请确保在feishu-dashboard目录下运行此脚本
    pause
    exit /b 1
)

:: 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

:: 清理可能的端口占用
echo 🔧 清理端口占用...
taskkill /f /im node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

:: 启动开发服务器
echo 🚀 启动开发服务器...
echo.
echo 📱 本地访问地址: http://localhost:3000
echo 🌐 网络访问地址: http://198.18.0.1:3000
echo.
echo 💡 提示: 按 Ctrl+C 停止服务器
echo ================================
echo.

npm run dev
