@echo off
echo ================================
echo Git 状态检查
echo ================================
echo.

:: 显示当前分支
echo 📍 当前分支:
git branch -v
echo.

:: 显示远程仓库
echo 🌐 远程仓库:
git remote -v
echo.

:: 显示文件状态
echo 📁 文件状态:
git status
echo.

:: 显示最近的提交
echo 📝 最近5次提交:
git log --oneline -5
echo.

:: 显示未推送的提交
echo 🚀 未推送的提交:
git log origin/main..HEAD --oneline 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 无法检查未推送的提交 (可能未设置远程仓库)
)

echo.
pause
