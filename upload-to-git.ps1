# 抖音电商数据看板 - Git上传脚本
# 作者: Assistant
# 日期: 2025-09-24

Write-Host "🚀 开始上传抖音电商数据看板到GitHub..." -ForegroundColor Green

# 检查Git状态
function Check-GitStatus {
    Write-Host "📋 检查Git状态..." -ForegroundColor Yellow
    git status
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Git仓库未初始化" -ForegroundColor Red
        return $false
    }
    return $true
}

# 添加和提交文件
function Add-AndCommit {
    Write-Host "📦 添加文件到Git..." -ForegroundColor Yellow
    git add .
    
    $commitMessage = "更新抖音电商数据看板 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

✨ 功能特性:
- 飞书API数据同步
- Supabase数据库集成
- 年度总利润统计
- 现代化Ant Design Pro UI
- 每日盈利趋势图表
- 自动数据同步(每3小时)
- 响应式设计和数据可视化

🔧 技术栈:
- Next.js 15 + TypeScript
- Ant Design Pro Components
- Recharts 数据可视化
- Supabase 后端服务
- 飞书开放API"

    Write-Host "💾 提交更改..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 文件提交成功" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️ 没有新的更改需要提交" -ForegroundColor Yellow
        return $true
    }
}

# 推送到GitHub (带重试)
function Push-ToGitHub {
    param(
        [int]$MaxRetries = 3,
        [int]$DelaySeconds = 5
    )
    
    Write-Host "🌐 推送到GitHub仓库..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        Write-Host "📤 尝试推送 ($i/$MaxRetries)..." -ForegroundColor Cyan
        
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 推送成功！" -ForegroundColor Green
            Write-Host "🔗 仓库地址: https://github.com/tangzongzi/douyin" -ForegroundColor Blue
            return $true
        } else {
            Write-Host "❌ 推送失败 (尝试 $i/$MaxRetries)" -ForegroundColor Red
            if ($i -lt $MaxRetries) {
                Write-Host "⏳ ${DelaySeconds}秒后重试..." -ForegroundColor Yellow
                Start-Sleep -Seconds $DelaySeconds
            }
        }
    }
    
    return $false
}

# 设置代理 (如果需要)
function Set-GitProxy {
    param([string]$ProxyUrl)
    
    if ($ProxyUrl) {
        Write-Host "🔧 设置Git代理: $ProxyUrl" -ForegroundColor Yellow
        git config --global http.proxy $ProxyUrl
        git config --global https.proxy $ProxyUrl
    }
}

# 清除代理
function Clear-GitProxy {
    Write-Host "🧹 清除Git代理设置..." -ForegroundColor Yellow
    git config --global --unset http.proxy 2>$null
    git config --global --unset https.proxy 2>$null
}

# 创建备份压缩包
function Create-BackupZip {
    Write-Host "📦 创建备份压缩包..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "douyin-dashboard-backup-$timestamp.zip"
    
    $excludeItems = @(".git", ".next", "node_modules", "*.zip")
    
    $filesToZip = Get-ChildItem -Path . | Where-Object { 
        $item = $_
        -not ($excludeItems | Where-Object { $item.Name -like $_ })
    }
    
    try {
        $filesToZip | Compress-Archive -DestinationPath $backupName -Force
        Write-Host "✅ 备份已创建: $backupName" -ForegroundColor Green
        return $backupName
    } catch {
        Write-Host "❌ 创建备份失败: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 主函数
function Main {
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                    🚀 Git 上传脚本                           ║
║                 抖音电商数据看板项目                          ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    # 检查Git状态
    if (-not (Check-GitStatus)) {
        Write-Host "❌ Git检查失败，退出" -ForegroundColor Red
        return
    }

    # 询问是否使用代理
    $useProxy = Read-Host "🤔 是否需要使用代理? (y/N)"
    if ($useProxy -eq "y" -or $useProxy -eq "Y") {
        $proxyUrl = Read-Host "🔧 请输入代理地址 (例如: http://127.0.0.1:7890)"
        Set-GitProxy -ProxyUrl $proxyUrl
    }

    try {
        # 添加和提交
        if (-not (Add-AndCommit)) {
            Write-Host "❌ 提交失败，退出" -ForegroundColor Red
            return
        }

        # 推送到GitHub
        if (Push-ToGitHub -MaxRetries 5 -DelaySeconds 3) {
            Write-Host @"

🎉 上传成功！
🔗 GitHub仓库: https://github.com/tangzongzi/douyin
📱 现在可以在GitHub上查看你的抖音电商数据看板项目了！

"@ -ForegroundColor Green
        } else {
            Write-Host @"

❌ 推送失败，但代码已本地提交。请尝试:
1. 检查网络连接
2. 使用VPN或代理
3. 稍后手动执行: git push -u origin main
4. 或使用GitHub Desktop客户端

"@ -ForegroundColor Yellow
            
            # 创建备份
            $backup = Create-BackupZip
            if ($backup) {
                Write-Host "💾 已创建备份文件，可以手动上传到GitHub: $backup" -ForegroundColor Blue
            }
        }
    }
    finally {
        # 清理代理设置
        if ($useProxy -eq "y" -or $useProxy -eq "Y") {
            Clear-GitProxy
        }
    }

    Write-Host @"

📋 手动上传方式:
1. 网页上传: 访问 https://github.com/tangzongzi/douyin
2. 拖拽文件到GitHub网页界面
3. 使用GitHub Desktop客户端
4. 配置SSH密钥后重试

"@ -ForegroundColor Cyan

    Read-Host "按任意键退出..."
}

# 运行主函数
Main
