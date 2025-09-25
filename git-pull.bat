@echo off
echo ================================
echo Git 拉取更新脚本
echo ================================
echo.

:: 检查是否有远程仓库
git remote get-url origin > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未设置远程仓库
    echo 请先运行 git-setup-remote.bat 设置远程仓库
    pause
    exit /b 1
)

:: 显示当前状态
echo 📍 当前分支:
git branch -v
echo.

:: 获取远程更新
echo 📡 获取远程更新...
git fetch origin

:: 检查是否有更新
git status -uno
echo.

:: 询问是否拉取
set /p pull_confirm="是否拉取远程更新? (y/N): "
if /i not "%pull_confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

:: 拉取更新
echo 📥 拉取远程更新...
git pull origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 更新完成！
) else (
    echo.
    echo ❌ 拉取失败，可能有冲突需要解决
)

echo.
pause
