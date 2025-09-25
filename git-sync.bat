@echo off
echo ================================
echo Git 同步脚本
echo ================================
echo.

:: 检查是否有更改
git status --porcelain > nul
if %ERRORLEVEL% EQU 0 (
    echo 检查项目状态...
    git status
    echo.
) else (
    echo 错误: 无法检查Git状态
    pause
    exit /b 1
)

:: 显示当前状态
echo 当前分支信息:
git branch -v
echo.

:: 询问用户是否继续
set /p continue="是否继续提交并推送? (y/N): "
if /i not "%continue%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

:: 添加所有更改
echo 添加所有更改...
git add .

:: 获取提交信息
set /p commit_msg="请输入提交信息 (默认: 更新代码): "
if "%commit_msg%"=="" set commit_msg=更新代码

:: 提交更改
echo 提交更改: %commit_msg%
git commit -m "%commit_msg%"

:: 推送到远程仓库
echo 推送到远程仓库...
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 同步完成！
) else (
    echo.
    echo ❌ 推送失败，请检查网络连接或远程仓库设置
    echo 您可能需要先设置远程仓库，运行: git-setup-remote.bat
)

echo.
pause
