@echo off
echo Creating desktop shortcut...

set "current_dir=%~dp0"
set "desktop=%USERPROFILE%\Desktop"
set "shortcut_name=Git Code Manager"

:: Create VBS script to generate shortcut
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%temp%\shortcut.vbs"
echo Set Shortcut = WshShell.CreateShortcut("%desktop%\%shortcut_name%.lnk") >> "%temp%\shortcut.vbs"
echo Shortcut.TargetPath = "%current_dir%git-tool.bat" >> "%temp%\shortcut.vbs"
echo Shortcut.WorkingDirectory = "%current_dir%" >> "%temp%\shortcut.vbs"
echo Shortcut.Description = "Git Code Manager Tool" >> "%temp%\shortcut.vbs"
echo Shortcut.Save >> "%temp%\shortcut.vbs"

:: Execute VBS script
cscript //nologo "%temp%\shortcut.vbs"

:: Clean up temporary file
del "%temp%\shortcut.vbs"

echo.
echo Desktop shortcut created successfully!
echo Shortcut name: %shortcut_name%
echo Location: %desktop%\%shortcut_name%.lnk
echo.
echo You can now double-click the desktop shortcut to use Git tool!
echo.
pause
