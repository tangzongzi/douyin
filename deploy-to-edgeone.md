# 🚀 EdgeOne部署操作指南

## 立即部署步骤

### 1️⃣ 注册EdgeOne账号
1. 访问：https://console.cloud.tencent.com/edgeone
2. 注册/登录腾讯云账号
3. 开通EdgeOne服务

### 2️⃣ 创建Pages项目
1. 进入EdgeOne控制台
2. 点击"Pages" -> "创建项目"
3. 选择"从Git仓库导入"
4. 连接GitHub仓库：`https://github.com/tangzongzi/douyin.git`
5. 设置：
   - **项目名称**: feishu-dashboard
   - **根目录**: feishu-dashboard
   - **构建命令**: npm run build
   - **输出目录**: .next

### 3️⃣ 配置环境变量
在项目设置 -> 环境变量中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://gayywaplwsilukawgwpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNTEsImV4cCI6MjA3NDI2MjA1MX0.HTWNBuOto7nMk4nQ_M9yRt0TDpdrBBinn-JuB_Z2qho
FEISHU_APP_ID=cli_a85bf6b4153bd013
FEISHU_APP_SECRET=AhOGT0tl2pkjXlynQ2Qb3gFXyXmbE2aP
NEXT_PUBLIC_FEISHU_APP_TOKEN=R8XfbOXZ2a4fJjsWdpmc1rJOnbm
NEXT_PUBLIC_FEISHU_TABLE_BASE_DAILY=tbla2p0tHEBb6Xnj
NEXT_PUBLIC_FEISHU_TABLE_MONTH_SUMMARY=tbl5hVlzM1gNVCT2
NEXT_PUBLIC_FEISHU_TABLE_YEAR_PROFIT=tblyVcenmVYBHTxK
```

### 4️⃣ 开通边缘AI服务
1. 在EdgeOne控制台中找到"边缘AI"
2. 开通DeepSeek AI服务
3. 确认可以使用 `@tx/deepseek-ai/deepseek-v3-0324` 模型

### 5️⃣ 验证部署
部署完成后：
1. 访问你的EdgeOne域名
2. 进入 `/reports` 页面
3. 点击"生成AI分析"测试

## 🎯 AI分析功能特点

- **模型**: DeepSeek-V3 (每日50次调用)
- **分析内容**: 财务健康度、风险提醒、优化建议
- **响应时间**: 毫秒级（边缘节点）
- **缓存机制**: 当月分析结果自动缓存

## ⚡ 部署优势

1. **零成本** - Beta期间免费
2. **高性能** - 全球边缘节点
3. **AI增强** - 真正的DeepSeek模型分析
4. **自动扩容** - 无需管理服务器

---

准备好了就开始部署吧！🎉
