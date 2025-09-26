# 🚀 飞书数据中心 - 本地启动指南

## 快速启动

### Windows 用户

#### 方法1：双击启动脚本
```bash
# 双击运行
start.bat
```

#### 方法2：PowerShell启动
```powershell
# 右键"以管理员身份运行PowerShell"，然后执行
.\start.ps1
```

#### 方法3：命令行启动
```bash
# 在项目目录下执行
npm run dev
```

### 启动后访问

- 🖥️ **本地访问**: http://localhost:3000
- 🌐 **网络访问**: http://198.18.0.1:3000

## 功能说明

### 📊 数据同步功能
- **自动同步**: 每3小时自动执行
- **手动同步**: 点击右上角设置图标
- **智能同步**: 避免重复同步，推荐使用
- **强制同步**: 完全重新同步所有数据

### 📈 图表功能
- **当月日盈利趋势**: 蓝色主线，重点关注
- **上月对比数据**: 灰色虚线，背景参考
- **悬停详情**: 显示多赞利润和当日总利润
- **极简交互**: 无黑框干扰，符合Ant Design Pro标准

### 💾 数据源
- **飞书多维表格**: 实时数据源
- **Supabase数据库**: 本地缓存和计算
- **自动字段映射**: 已固定配置，无需修改

## 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 终止占用进程
   taskkill /f /im node.exe
   ```

2. **依赖问题**
   ```bash
   # 重新安装依赖
   npm install
   ```

3. **缓存问题**
   ```bash
   # 清理缓存
   Remove-Item -Recurse -Force .next
   ```

4. **数据同步失败**
   - 检查网络连接
   - 验证飞书表格权限
   - 使用强制同步功能

### 开发调试

```bash
# 查看实时日志
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 📁 项目结构

```
feishu-dashboard/
├── src/
│   ├── app/                 # Next.js页面
│   ├── components/          # React组件
│   ├── config/             # 配置文件
│   │   ├── env.ts          # 环境变量
│   │   └── field-mapping.ts # 字段映射(已固定)
│   └── lib/                # 工具库
│       ├── feishu-sync.ts  # 飞书同步逻辑
│       └── supabase.ts     # 数据库操作
├── start.bat               # Windows启动脚本
├── start.ps1               # PowerShell启动脚本
└── package.json            # 项目配置
```

---

**🎨 设计标准**: 完全符合Ant Design Pro设计规范
**📊 数据同步**: 所有字段映射已验证并固定  
**🔧 功能状态**: 生产就绪，稳定可靠
