@echo off
echo ========================================
echo Git远程仓库设置助手
echo ========================================
echo.
echo 请先完成以下步骤:
echo.
echo 方法1 - GitHub:
echo 1. 访问 https://github.com
echo 2. 点击右上角 + 号，选择 New repository
echo 3. 仓库名称填写: feishu-dashboard
echo 4. 点击 Create repository
echo 5. 复制仓库地址 (格式如: https://github.com/用户名/feishu-dashboard.git)
echo.
echo 方法2 - Gitee码云:
echo 1. 访问 https://gitee.com
echo 2. 点击右上角 + 号，选择 新建仓库
echo 3. 仓库名称填写: feishu-dashboard
echo 4. 点击 创建
echo 5. 复制仓库地址 (格式如: https://gitee.com/用户名/feishu-dashboard.git)
echo.
echo ========================================
echo.

set /p repo_url="请粘贴您的仓库地址: "

if "%repo_url%"=="" (
    echo 错误: 仓库地址不能为空
    pause
    exit /b 1
)

echo.
echo 正在设置远程仓库...

git remote remove origin
git remote add origin "%repo_url%"
git branch -M main

echo.
echo 远程仓库设置完成!
echo 仓库地址: %repo_url%
echo.
echo 现在开始推送代码...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ 代码已成功上传到Git仓库!
    echo 您可以访问仓库地址查看上传的代码
) else (
    echo.
    echo ✗ 上传失败，可能的原因:
    echo 1. 网络连接问题
    echo 2. 仓库地址不正确
    echo 3. 没有权限访问仓库
    echo.
    echo 请检查后重新运行此脚本
)

echo.
pause
