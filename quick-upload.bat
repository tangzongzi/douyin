@echo off
chcp 65001 >nul
echo.
echo ============================================
echo      🚀 快速上传到GitHub
echo      抖音电商数据看板项目
echo ============================================
echo.

echo 📋 检查Git状态...
git status
if errorlevel 1 (
    echo ❌ Git仓库未初始化
    pause
    exit /b 1
)

echo.
echo 📦 添加所有文件...
git add .

echo.
echo 💾 提交更改...
git commit -m "更新抖音电商数据看板 - %date% %time%"

echo.
echo 🌐 推送到GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！可能的解决方案：
    echo 1. 检查网络连接
    echo 2. 使用VPN或代理
    echo 3. 稍后重试
    echo 4. 手动上传到 https://github.com/tangzongzi/douyin
    echo.
) else (
    echo.
    echo 🎉 上传成功！
    echo 🔗 查看项目: https://github.com/tangzongzi/douyin
    echo.
)

pause
