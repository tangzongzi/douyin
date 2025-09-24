# 飞书数据看板

基于 Next.js + 飞书 API 的轻量化数据看板，支持实时数据监控和可视化展示。

## 功能特性

- 📊 **核心指标监控**: 今日盈利、当月净利润、累计净现金流、当月总赔付申请
- 📈 **趋势分析**: 日盈利趋势折线图、月度净利润与赔付申请对比
- 🥧 **结构分析**: 月度支出构成饼图、平台服务费趋势对比
- 🔄 **实时刷新**: 支持手动刷新和自动数据更新
- 📱 **响应式设计**: 适配桌面端和移动端设备
- 🎨 **现代化UI**: 基于 Ant Design 的专业界面设计

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **UI组件库**: Ant Design 5.x
- **图表库**: Recharts
- **样式方案**: Tailwind CSS
- **数据源**: 飞书表格 API
- **部署平台**: 腾讯 EdgeOne (免费版)

## 快速开始

### 1. 环境准备

确保已安装 Node.js 16+ 版本。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env.local`，并填入你的飞书应用凭证：

```bash
# 飞书应用凭证
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret

# 表格访问配置
NEXT_PUBLIC_FEISHU_APP_TOKEN=your_app_token
NEXT_PUBLIC_FEISHU_TABLE_BASE_DAILY=your_daily_table_id
NEXT_PUBLIC_FEISHU_TABLE_MONTH_SUMMARY=your_monthly_table_id
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 飞书表格配置

### 每日基础表 (base_daily)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| date | 日期 | 日期 |
| daily_profit | 数字 | 每日盈利 |
| payment_expense | 数字 | 货款支出 |
| other_expense | 数字 | 其他支出 |
| withdraw_amount | 数字 | 提现金额 |

### 月度汇总表 (month_summary)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| month | 文本 | 月份 |
| month_profit | 数字 | 月净利润 |
| net_cashflow | 数字 | 净现金流 |
| claim_amount_sum | 数字 | 总赔付申请金额 |
| pdd_service_fee | 数字 | 拼多多技术服务费 |
| douyin_service_fee | 数字 | 抖音技术服务费 |
| payment_expense_sum | 数字 | 总货款支出 |
| other_expense_sum | 数字 | 总其他支出 |
| shipping_insurance | 数字 | 运费保险 |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── StatCard.tsx       # 统计卡片
│   ├── OverviewCards.tsx  # 概览卡片组
│   ├── DailyProfitChart.tsx      # 日盈利趋势图
│   ├── MonthlyComparisonChart.tsx # 月度对比图
│   ├── ExpensePieChart.tsx       # 支出饼图
│   ├── PlatformFeeChart.tsx      # 平台费用图
│   └── TimeFilter.tsx     # 时间筛选器
└── lib/                   # 工具库
    └── feishu-api.ts      # 飞书 API 封装
```

## 部署说明

### 腾讯 EdgeOne 部署

1. 构建生产版本：
```bash
npm run build
```

2. 将 `out` 目录上传到 EdgeOne 静态站点

3. 配置环境变量在 EdgeOne 控制台

### 其他平台部署

项目支持部署到 Vercel、Netlify 等平台，只需配置相应的环境变量即可。

## 开发说明

### 添加新图表

1. 在 `src/components/` 目录下创建新的图表组件
2. 使用 Recharts 库实现图表逻辑
3. 在主页面中引入并使用组件

### 修改数据源

1. 编辑 `src/lib/feishu-api.ts` 文件
2. 修改 API 调用逻辑
3. 更新数据类型定义

## 常见问题

### Q: 无法获取飞书数据？
A: 请检查环境变量配置是否正确，确保飞书应用有相应表格的访问权限。

### Q: 图表显示异常？
A: 请检查数据格式是否符合组件要求，确保数值字段为数字类型。

### Q: 样式显示不正确？
A: 请确保已正确安装所有依赖，并重启开发服务器。

## 许可证

MIT License