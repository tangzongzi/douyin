@echo off
echo 正在创建桌面快捷方式...

set "current_dir=%~dp0"
set "desktop=%USERPROFILE%\Desktop"
set "shortcut_name=Git代码管理工具"

:: 创建VBS脚本来生成快捷方式
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%desktop%\%shortcut_name%.lnk") >> "%temp%\shortcut.vbs"
echo Shortcut.TargetPath = "%current_dir%git工具.bat" >> "%temp%\shortcut.vbs"
echo Shortcut.WorkingDirectory = "%current_dir%" >> "%temp%\shortcut.vbs"
echo Shortcut.Description = "Git代码管理工具" >> "%temp%\shortcut.vbs"
echo Shortcut.Save >> "%temp%\shortcut.vbs"

:: 执行VBS脚本
cscript //nologo "%temp%\shortcut.vbs"

:: 清理临时文件
del "%temp%\shortcut.vbs"

echo.
echo 桌面快捷方式创建成功！
echo 快捷方式名称: %shortcut_name%
echo 位置: %desktop%\%shortcut_name%.lnk
echo.
echo 现在可以双击桌面的快捷方式来使用Git工具了！
echo.
pause
