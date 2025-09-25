@echo off
echo ================================
echo 创建桌面快捷方式
echo ================================
echo.

:: 获取当前目录
set "current_dir=%~dp0"
set "desktop=%USERPROFILE%\Desktop"

:: 创建快捷方式的VBS脚本
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%temp%\create_shortcut.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%desktop%\Git同步管理.lnk") >> "%temp%\create_shortcut.vbs"
echo Shortcut.TargetPath = "%current_dir%git-menu.bat" >> "%temp%\create_shortcut.vbs"
echo Shortcut.WorkingDirectory = "%current_dir%" >> "%temp%\create_shortcut.vbs"
echo Shortcut.Description = "飞书仪表板 Git 同步管理工具" >> "%temp%\create_shortcut.vbs"
echo Shortcut.Save >> "%temp%\create_shortcut.vbs"

:: 执行VBS脚本
cscript //nologo "%temp%\create_shortcut.vbs"

:: 清理临时文件
del "%temp%\create_shortcut.vbs"

echo ✅ 桌面快捷方式创建成功！
echo 📍 快捷方式位置: %desktop%\Git同步管理.lnk
echo.
echo 现在您可以直接从桌面双击"Git同步管理"来使用Git功能了！
echo.
pause
