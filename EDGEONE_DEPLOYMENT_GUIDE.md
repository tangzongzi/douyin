# 🚀 EdgeOne AI分析功能部署指南

## 📋 部署前准备

### 1. EdgeOne账号准备
- 注册腾讯云EdgeOne账号
- 开通Pages Functions服务
- 确认边缘AI服务可用

### 2. 数据库表创建
在Supabase SQL Editor中执行：
```sql
-- 执行 create-ai-analysis-table.sql 中的所有SQL语句
```

## 🔧 EdgeOne部署步骤

### 步骤1: 创建EdgeOne Pages项目
1. 登录EdgeOne控制台
2. 点击"创建项目" 
3. 选择"从Git仓库导入"
4. 连接你的GitHub仓库：`https://github.com/tangzongzi/douyin.git`
5. 设置根目录为：`feishu-dashboard`

### 步骤2: 配置环境变量
在EdgeOne项目设置中添加：
```
NEXT_PUBLIC_SUPABASE_URL=https://gayywaplwsilukawgwpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FEISHU_APP_ID=cli_a85bf6b4153bd013
FEISHU_APP_SECRET=AhOGT0tl2pkjXlynQ2Qb3gFXyXmbE2aP
NEXT_PUBLIC_FEISHU_APP_TOKEN=R8XfbOXZ2a4fJjsWdpmc1rJOnbm
```

### 步骤3: 配置Edge Functions
EdgeOne会自动识别 `edge-functions/` 目录下的函数

### 步骤4: 部署验证
1. 部署完成后访问你的EdgeOne域名
2. 测试AI分析功能：访问 `/reports` 页面
3. 点击"生成AI分析"按钮测试

## 📊 AI分析功能特性

### 🎯 分析内容
- **简单分析**: 趋势判断、风险提醒、关键指标解读
- **深度分析**: 财务健康度评估、预测建议、优化策略
- **AI增强**: EdgeOne DeepSeek-R1模型提供专业洞察

### 🔄 触发机制
- **手动分析**: 报表页面点击"生成AI分析"按钮
- **智能缓存**: 当月已有分析时直接显示，避免重复调用
- **定期分析**: 每月1号自动生成（需要配置定时任务）

### 💾 数据存储
- 分析结果保存到 `ai_analysis_reports` 表
- 包含分析快照，支持历史查看
- 支持强制重新生成

## 🎛️ 使用说明

### 报表页面操作
1. 访问 `/reports` 页面
2. 选择要分析的月份
3. 点击"生成AI分析"按钮
4. 查看AI分析结果

### API接口
```
POST /api/ai-analysis?month=2025-09&force=false
GET /api/ai-analysis?month=2025-09
```

## ⚡ 性能和限制

### EdgeOne AI限制
- DeepSeek-R1模型：每日20次调用
- 建议合理使用，避免频繁重新生成

### 优化建议
- 优先使用缓存结果
- 只在数据更新后重新生成分析
- 定期分析可以在低峰时段执行

## 🚨 故障排除

### 常见问题
1. **AI分析失败**: 检查EdgeOne AI服务状态和调用次数
2. **数据库错误**: 确认ai_analysis_reports表已创建
3. **权限问题**: 检查Supabase权限配置

### 备用方案
- AI服务不可用时，系统会自动使用本地分析逻辑
- 确保基础分析功能始终可用

---

部署完成后，你的飞书数据同步项目将具备专业的AI财务分析能力！🎉
