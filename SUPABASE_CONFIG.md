# Supabase 配置完成 ✅

## 环境变量配置

请在项目根目录 `feishu-dashboard` 下创建 `.env.local` 文件，内容如下：

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_a85bf6b4153bd013
FEISHU_APP_SECRET=AhOGT0tl2pkjXlynQ2Qb3gFXyXmbE2aP

# 飞书表格配置
NEXT_PUBLIC_FEISHU_APP_TOKEN=R8XfbOXZ2a4fJjsWdpmc1rJOnbm
NEXT_PUBLIC_FEISHU_TABLE_BASE_DAILY=tbla2p0tHEBb6Xnj
NEXT_PUBLIC_FEISHU_TABLE_MONTH_SUMMARY=tbl5hVlzM1gNVCT2

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://gayywaplwsilukawgwpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNTEsImV4cCI6MjA3NDI2MjA1MX0.HTWNBuOto7nMk4nQ_M9yRt0TDpdrBBinn-JuB_Z2qho
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheXl3YXBsd3NpbHVrYXdnd3B0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA1MSwiZXhwIjoyMDc0MjYyMDUxfQ.M2qIf4PruFAA1-ABDLIZTTmjFkFNn4oMNdC4UZ64teA
```

## 📝 创建步骤：

1. **在VS Code中右键项目根目录** `feishu-dashboard` 
2. **选择"新建文件"** 
3. **文件名输入**: `.env.local`
4. **复制上面的内容** 粘贴到文件中
5. **保存文件** (Ctrl+S)

## 🚀 测试步骤：

创建好 `.env.local` 文件后：

1. **重启开发服务器** (Ctrl+C 停止，然后 `npm run dev` 重启)
2. **访问同步页面**: http://localhost:3000/sync
3. **点击"完整同步"** 进行首次数据同步
4. **查看同步结果** 

## ✅ 配置验证：

同步成功后，你可以：
- 在Supabase的Table Editor中查看数据
- 前端图表应该能正常显示数据
- 访问速度会显著提升

请先创建 `.env.local` 文件，然后告诉我是否创建成功！
