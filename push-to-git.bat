@echo off
echo ========================================
echo 推送代码到GitHub
echo ========================================
echo.

echo 仓库地址: https://github.com/tangzongzi/douyin.git
echo.

echo 正在推送代码...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ 代码推送成功！
    echo 您的代码已上传到: https://github.com/tangzongzi/douyin
    echo.
) else (
    echo.
    echo ✗ 推送失败，可能的原因:
    echo 1. 网络连接问题 - 请检查网络连接
    echo 2. GitHub访问受限 - 可能需要代理或VPN
    echo 3. 仓库权限问题 - 确保有推送权限
    echo.
    echo 解决方案:
    echo 1. 稍后重试此脚本
    echo 2. 检查网络连接
    echo 3. 使用代理或VPN
    echo.
    echo 如果网络正常，您可以手动运行:
    echo git push -u origin main
)

echo.
pause
