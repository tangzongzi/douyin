@echo off
title Git Code Manager

:main
cls
echo.
echo ==========================================
echo            Git Code Manager
echo ==========================================
echo.
echo   1. Check Status
echo   2. Setup Remote Repository
echo   3. Commit and Upload Code
echo   4. Download Updates
echo   5. Open Project Folder
echo   6. Show Help
echo   0. Exit
echo.
echo ==========================================
echo.

set /p "choice=Please select (0-6): "

if "%choice%"=="1" goto check_status
if "%choice%"=="2" goto setup_remote
if "%choice%"=="3" goto upload_code
if "%choice%"=="4" goto download_update
if "%choice%"=="5" goto open_folder
if "%choice%"=="6" goto show_help
if "%choice%"=="0" goto exit_program

echo.
echo Invalid input, please try again...
timeout /t 2 >nul
goto main

:check_status
cls
echo ==========================================
echo            Check Current Status
echo ==========================================
echo.

echo [Current Branch Info]
git branch -v 2>nul
if errorlevel 1 (
    echo Error: Current directory is not a Git repository
    echo.
    pause
    goto main
)
echo.

echo [Remote Repository Info]
git remote -v 2>nul
if errorlevel 1 (
    echo No remote repository configured
) else (
    echo.
)

echo [File Status]
git status 2>nul
echo.

echo [Recent 5 Commits]
git log --oneline -5 2>nul
echo.

pause
goto main

:setup_remote
cls
echo ==========================================
echo          Setup Remote Repository
echo ==========================================
echo.

echo Please select code hosting platform:
echo   1. GitHub
echo   2. Gitee (China)
echo   3. Other Platform
echo.

set /p "platform=Please select platform (1-3): "

if "%platform%"=="1" (
    echo.
    echo GitHub Repository Setup:
    echo 1. Visit https://github.com
    echo 2. Click + in top right, select New repository
    echo 3. Enter repository name: feishu-dashboard
    echo 4. Copy repository URL after creation
    echo.
    echo Repository URL format example:
    echo https://github.com/yourusername/feishu-dashboard.git
    echo.
) else if "%platform%"=="2" (
    echo.
    echo Gitee Repository Setup:
    echo 1. Visit https://gitee.com
    echo 2. Click + in top right, select New Repository
    echo 3. Enter repository name: feishu-dashboard
    echo 4. Copy repository URL after creation
    echo.
    echo Repository URL format example:
    echo https://gitee.com/yourusername/feishu-dashboard.git
    echo.
) else if "%platform%"=="3" (
    echo.
    echo Other Platform Repository Setup:
    echo Please ensure repository URL format is correct
    echo.
) else (
    echo Invalid selection, returning to main menu...
    timeout /t 2 >nul
    goto main
)

set /p "repo_url=Please enter complete repository URL: "

if "%repo_url%"=="" (
    echo.
    echo Error: Repository URL cannot be empty
    pause
    goto main
)

echo.
echo Configuring remote repository...

:: Remove existing remote repository configuration
git remote remove origin >nul 2>&1

:: Add new remote repository
git remote add origin "%repo_url%"
if errorlevel 1 (
    echo Error: Cannot add remote repository, please check URL format
    pause
    goto main
)

:: Set main branch
git branch -M main >nul 2>&1

echo Remote repository configured successfully!
echo Repository URL: %repo_url%
echo.
echo You can now use "Commit and Upload Code" feature
pause
goto main

:upload_code
cls
echo ==========================================
echo         Commit and Upload Code
echo ==========================================
echo.

:: Check if remote repository is configured
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Error: No remote repository configured
    echo Please use "Setup Remote Repository" first
    pause
    goto main
)

echo [Files to be committed]
git status --short 2>nul
echo.

set /p "confirm=Confirm to commit above files? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    goto main
)

echo.
set /p "commit_msg=Enter commit message (default: Update code): "
if "%commit_msg%"=="" set "commit_msg=Update code"

echo.
echo Adding files...
git add . 2>nul
if errorlevel 1 (
    echo Error: Cannot add files
    pause
    goto main
)

echo Committing changes...
git commit -m "%commit_msg%" 2>nul
if errorlevel 1 (
    echo Notice: No changes to commit
    pause
    goto main
)

echo Uploading to remote repository...
git push origin main 2>nul
if errorlevel 1 (
    echo.
    echo Upload failed, possible reasons:
    echo 1. Network connection issue
    echo 2. Repository permission insufficient
    echo 3. Need to download remote updates first
    echo.
    echo Try "Download Updates" feature first
    pause
    goto main
)

echo.
echo Code uploaded successfully!
echo Commit message: %commit_msg%
pause
goto main

:download_update
cls
echo ==========================================
echo        Download Updates from Remote
echo ==========================================
echo.

:: Check if remote repository is configured
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Error: No remote repository configured
    echo Please use "Setup Remote Repository" first
    pause
    goto main
)

echo Checking remote updates...
git fetch origin 2>nul
if errorlevel 1 (
    echo Error: Cannot connect to remote repository
    echo Please check network connection and repository URL
    pause
    goto main
)

echo.
echo [Differences between local and remote]
git status -uno 2>nul
echo.

set /p "pull_confirm=Download remote updates? (y/N): "
if /i not "%pull_confirm%"=="y" (
    echo Operation cancelled
    pause
    goto main
)

echo.
echo Downloading updates...
git pull origin main 2>nul
if errorlevel 1 (
    echo.
    echo Download failed, conflicts may exist
    echo Please resolve conflicts manually and try again
    pause
    goto main
)

echo.
echo Updates downloaded successfully!
pause
goto main

:open_folder
cls
echo Opening project folder...
start . 2>nul
if errorlevel 1 (
    echo Error: Cannot open folder
    pause
)
goto main

:show_help
cls
echo ==========================================
echo            Usage Help
echo ==========================================
echo.
echo [First Time Setup]
echo 1. Select "Setup Remote Repository"
echo 2. Create repository on GitHub or Gitee as prompted
echo 3. Enter complete repository URL
echo 4. Use "Commit and Upload Code" to upload project
echo.
echo [Daily Usage]
echo - Check Status: View code modification status
echo - Commit and Upload: Save and sync code to remote
echo - Download Updates: Get code changes from others
echo.
echo [Repository URL Format]
echo GitHub: https://github.com/username/reponame.git
echo Gitee:  https://gitee.com/username/reponame.git
echo.
echo [Common Issues]
echo Q: Upload failed?
echo A: Check network, verify repository URL, try download updates first
echo.
echo Q: How to change repository URL?
echo A: Run "Setup Remote Repository" again
echo.
echo [Important Notes]
echo - Write clear commit messages
echo - Don't upload sensitive information to public repos
echo - Backup important code regularly
echo - Resolve conflicts promptly
echo.
pause
goto main

:exit_program
cls
echo.
echo Thank you for using Git Code Manager!
echo Goodbye!
echo.
timeout /t 2 >nul
exit
