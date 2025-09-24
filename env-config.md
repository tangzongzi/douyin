# 环境变量配置说明

## 需要配置的环境变量

创建 `.env.local` 文件，添加以下配置：

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_a85bf6b4153bd013
FEISHU_APP_SECRET=AhOGT0tl2pkjXlynQ2Qb3gFXyXmbE2aP

# 飞书表格配置
NEXT_PUBLIC_FEISHU_APP_TOKEN=R8XfbOXZ2a4fJjsWdpmc1rJOnbm
NEXT_PUBLIC_FEISHU_TABLE_BASE_DAILY=tbla2p0tHEBb6Xnj
NEXT_PUBLIC_FEISHU_TABLE_MONTH_SUMMARY=tbl5hVlzM1gNVCT2

# Supabase 配置（需要替换为你的实际值）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 获取Supabase配置步骤

1. 访问 [supabase.com](https://supabase.com) 注册账户
2. 创建新项目
3. 在项目设置中找到：
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

## 数据库初始化

在Supabase SQL编辑器中执行 `supabase-schema.sql` 文件中的SQL语句。
