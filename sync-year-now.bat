@echo off
echo ========================================
echo 立即同步年度数据
echo ========================================
echo.

echo 正在启动开发服务器检查...
netstat -an | findstr :3000 > nul
if errorlevel 1 (
    echo 错误: 开发服务器未运行
    echo 请先运行: npm run dev
    pause
    exit /b 1
)

echo 开发服务器已运行，开始同步年度数据...
echo.

echo 步骤1: 测试年度数据源
echo ----------------------------------------
curl -s "http://localhost:3000/api/test-year-sync" > temp_year_test.json
if errorlevel 1 (
    echo 测试失败
) else (
    echo 测试完成，结果保存到 temp_year_test.json
    type temp_year_test.json
)

echo.
echo 步骤2: 执行年度数据同步
echo ----------------------------------------
curl -s -X POST "http://localhost:3000/api/sync?type=yearly" > temp_year_sync.json
if errorlevel 1 (
    echo 同步失败
) else (
    echo 同步完成，结果保存到 temp_year_sync.json
    type temp_year_sync.json
)

echo.
echo 步骤3: 检查同步结果
echo ----------------------------------------
curl -s "http://localhost:3000/api/data?type=overview" > temp_overview.json
if errorlevel 1 (
    echo 检查失败
) else (
    echo 检查完成，结果保存到 temp_overview.json
    type temp_overview.json
)

echo.
echo ========================================
echo 同步完成！请检查仪表板显示是否更新
echo ========================================
pause

:: 清理临时文件
del temp_year_test.json 2>nul
del temp_year_sync.json 2>nul
del temp_overview.json 2>nul
