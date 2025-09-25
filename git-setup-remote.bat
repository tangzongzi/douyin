@echo off
echo ================================
echo Git 远程仓库设置脚本
echo ================================
echo.

echo 请选择Git平台:
echo 1. GitHub
echo 2. Gitee (码云)
echo 3. 自定义远程仓库
echo.

set /p choice="请选择 (1-3): "

if "%choice%"=="1" goto github
if "%choice%"=="2" goto gitee  
if "%choice%"=="3" goto custom
echo 无效选择，退出...
pause
exit /b 1

:github
echo.
echo GitHub 设置:
echo 1. 请先在 https://github.com 创建一个新仓库
echo 2. 仓库名建议: feishu-dashboard
set /p repo_url="请输入GitHub仓库URL (例如: https://github.com/username/feishu-dashboard.git): "
goto setup_remote

:gitee
echo.
echo Gitee 设置:
echo 1. 请先在 https://gitee.com 创建一个新仓库
echo 2. 仓库名建议: feishu-dashboard
set /p repo_url="请输入Gitee仓库URL (例如: https://gitee.com/username/feishu-dashboard.git): "
goto setup_remote

:custom
echo.
echo 自定义远程仓库:
set /p repo_url="请输入远程仓库URL: "
goto setup_remote

:setup_remote
if "%repo_url%"=="" (
    echo 错误: 仓库URL不能为空
    pause
    exit /b 1
)

echo.
echo 设置远程仓库: %repo_url%

:: 检查是否已存在origin
git remote get-url origin > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 删除现有的origin...
    git remote remove origin
)

:: 添加新的远程仓库
git remote add origin %repo_url%

:: 验证设置
echo.
echo 验证远程仓库设置:
git remote -v

:: 设置默认分支
echo.
echo 设置默认分支为 main...
git branch -M main

echo.
echo ✅ 远程仓库设置完成！
echo 现在您可以运行 git-sync.bat 来同步代码了

echo.
pause
