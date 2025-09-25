@echo off
title Git Manager

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

set /p "choice=请选择功能 (0-6): "

if "%choice%"=="1" goto check_status
if "%choice%"=="2" goto setup_remote
if "%choice%"=="3" goto upload_code
if "%choice%"=="4" goto download_update
if "%choice%"=="5" goto open_folder
if "%choice%"=="6" goto show_help
if "%choice%"=="0" goto exit_program

echo.
echo 输入错误，请重新选择...
timeout /t 2 >nul
goto main

:check_status
cls
echo ==========================================
echo            查看当前状态
echo ==========================================
echo.

echo [当前分支信息]
git branch -v 2>nul
if errorlevel 1 (
    echo 错误: 当前目录不是Git仓库
    echo.
    pause
    goto main
)
echo.

echo [远程仓库信息]
git remote -v 2>nul
if errorlevel 1 (
    echo 未设置远程仓库
) else (
    echo.
)

echo [文件状态]
git status 2>nul
echo.

echo [最近5次提交]
git log --oneline -5 2>nul
echo.

pause
goto main

:setup_remote
cls
echo ==========================================
echo            设置远程仓库
echo ==========================================
echo.

echo 请选择代码托管平台:
echo   1. GitHub
echo   2. Gitee (码云)  
echo   3. 其他平台
echo.

set /p "platform=请选择平台 (1-3): "

if "%platform%"=="1" (
    echo.
    echo GitHub 仓库设置说明:
    echo 1. 访问 https://github.com
    echo 2. 点击右上角 + 号，选择 New repository
    echo 3. 输入仓库名称，建议使用: feishu-dashboard
    echo 4. 创建后复制仓库地址
    echo.
    echo 仓库地址格式示例:
    echo https://github.com/你的用户名/feishu-dashboard.git
    echo.
) else if "%platform%"=="2" (
    echo.
    echo Gitee 仓库设置说明:
    echo 1. 访问 https://gitee.com
    echo 2. 点击右上角 + 号，选择 新建仓库
    echo 3. 输入仓库名称，建议使用: feishu-dashboard
    echo 4. 创建后复制仓库地址
    echo.
    echo 仓库地址格式示例:
    echo https://gitee.com/你的用户名/feishu-dashboard.git
    echo.
) else if "%platform%"=="3" (
    echo.
    echo 其他平台仓库设置:
    echo 请确保仓库地址格式正确
    echo.
) else (
    echo 选择错误，返回主菜单...
    timeout /t 2 >nul
    goto main
)

set /p "repo_url=请输入完整的仓库地址: "

if "%repo_url%"=="" (
    echo.
    echo 错误: 仓库地址不能为空
    pause
    goto main
)

echo.
echo 正在配置远程仓库...

:: 删除现有的远程仓库配置
git remote remove origin >nul 2>&1

:: 添加新的远程仓库
git remote add origin "%repo_url%"
if errorlevel 1 (
    echo 错误: 无法添加远程仓库，请检查地址格式
    pause
    goto main
)

:: 设置主分支
git branch -M main >nul 2>&1

echo 远程仓库配置成功！
echo 仓库地址: %repo_url%
echo.
echo 现在可以使用 "提交并上传代码" 功能了
pause
goto main

:upload_code
cls
echo ==========================================
echo           提交并上传代码
echo ==========================================
echo.

:: 检查是否设置了远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 错误: 未设置远程仓库
    echo 请先使用 "设置远程仓库" 功能
    pause
    goto main
)

echo [待提交的文件]
git status --short 2>nul
echo.

set /p "confirm=确认提交以上文件吗？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    goto main
)

echo.
set /p "commit_msg=请输入提交说明 (默认: 更新代码): "
if "%commit_msg%"=="" set "commit_msg=更新代码"

echo.
echo 正在添加文件...
git add . 2>nul
if errorlevel 1 (
    echo 错误: 无法添加文件
    pause
    goto main
)

echo 正在提交更改...
git commit -m "%commit_msg%" 2>nul
if errorlevel 1 (
    echo 提示: 没有需要提交的更改
    pause
    goto main
)

echo 正在上传到远程仓库...
git push origin main 2>nul
if errorlevel 1 (
    echo.
    echo 上传失败，可能的原因:
    echo 1. 网络连接问题
    echo 2. 仓库权限不足
    echo 3. 需要先下载远程更新
    echo.
    echo 建议先尝试 "从远程下载更新" 功能
    pause
    goto main
)

echo.
echo 代码上传成功！
echo 提交说明: %commit_msg%
pause
goto main

:download_update
cls
echo ==========================================
echo          从远程下载更新
echo ==========================================
echo.

:: 检查是否设置了远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 错误: 未设置远程仓库
    echo 请先使用 "设置远程仓库" 功能
    pause
    goto main
)

echo 正在检查远程更新...
git fetch origin 2>nul
if errorlevel 1 (
    echo 错误: 无法连接到远程仓库
    echo 请检查网络连接和仓库地址
    pause
    goto main
)

echo.
echo [本地与远程的差异]
git status -uno 2>nul
echo.

set /p "pull_confirm=下载远程更新吗？(y/N): "
if /i not "%pull_confirm%"=="y" (
    echo 操作已取消
    pause
    goto main
)

echo.
echo 正在下载更新...
git pull origin main 2>nul
if errorlevel 1 (
    echo.
    echo 下载更新失败，可能存在冲突
    echo 建议手动解决冲突后再试
    pause
    goto main
)

echo.
echo 更新下载完成！
pause
goto main

:open_folder
cls
echo 正在打开项目文件夹...
start . 2>nul
if errorlevel 1 (
    echo 错误: 无法打开文件夹
    pause
)
goto main

:show_help
cls
echo ==========================================
echo            使用帮助说明
echo ==========================================
echo.
echo [首次使用步骤]
echo 1. 选择 "设置远程仓库"
echo 2. 根据提示在GitHub或Gitee创建仓库
echo 3. 输入完整的仓库地址
echo 4. 使用 "提交并上传代码" 上传项目
echo.
echo [日常使用]
echo - 查看当前状态: 了解代码修改情况
echo - 提交并上传: 保存并同步代码到远程
echo - 下载更新: 获取其他人的代码更改
echo.
echo [仓库地址格式]
echo GitHub: https://github.com/用户名/仓库名.git
echo Gitee:  https://gitee.com/用户名/仓库名.git
echo.
echo [常见问题]
echo Q: 上传失败怎么办？
echo A: 检查网络连接，确认仓库地址正确，尝试先下载更新
echo.
echo Q: 如何修改仓库地址？
echo A: 重新运行 "设置远程仓库" 功能即可
echo.
echo [注意事项]
echo - 提交说明要清晰明了
echo - 敏感信息不要上传到公开仓库
echo - 定期备份重要代码
echo - 遇到冲突及时解决
echo.
pause
goto main

:exit_program
cls
echo.
echo 感谢使用Git代码管理工具！
echo 再见！
echo.
timeout /t 2 >nul
exit

endlocal
