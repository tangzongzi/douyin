@echo off
chcp 65001 > nul
title Git 同步管理

:menu
cls
echo ╔══════════════════════════════════════╗
echo ║          Git 同步管理菜单            ║
echo ╠══════════════════════════════════════╣
echo ║                                      ║
echo ║  1. 📊 查看Git状态                   ║
echo ║  2. 🔧 设置远程仓库                  ║
echo ║  3. 📤 同步代码到远程仓库            ║
echo ║  4. 📥 从远程仓库拉取更新            ║
echo ║  5. 📝 快速提交 (添加+提交+推送)     ║
echo ║  6. 🗂️  打开项目文件夹               ║
echo ║  0. 🚪 退出                          ║
echo ║                                      ║
echo ╚══════════════════════════════════════╝
echo.

set /p choice="请选择操作 (0-6): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto setup
if "%choice%"=="3" goto sync
if "%choice%"=="4" goto pull
if "%choice%"=="5" goto quick_commit
if "%choice%"=="6" goto open_folder
if "%choice%"=="0" goto exit

echo.
echo ❌ 无效选择，请重试...
timeout /t 2 > nul
goto menu

:status
cls
call git-status.bat
goto menu

:setup
cls
call git-setup-remote.bat
goto menu

:sync
cls
call git-sync.bat
goto menu

:pull
cls
call git-pull.bat
goto menu

:quick_commit
cls
echo ================================
echo 快速提交
echo ================================
echo.

:: 显示当前状态
git status --short
echo.

set /p msg="请输入提交信息: "
if "%msg%"=="" (
    echo ❌ 提交信息不能为空
    pause
    goto menu
)

echo.
echo 正在提交...
git add .
git commit -m "%msg%"
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo ✅ 快速提交完成！
) else (
    echo ❌ 提交失败
)
pause
goto menu

:open_folder
cls
echo 📂 打开项目文件夹...
start .
goto menu

:exit
echo.
echo 👋 再见！
timeout /t 1 > nul
exit
