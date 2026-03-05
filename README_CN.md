# OpenClaw Manager

🤖 **OpenClaw 多工作空间管理平台** - 基于 Web 的会话、文件、技能和定时任务管理工具

---

## ✨ 特性亮点

### 🎯 核心功能

- **📊 会话管理** - 实时查看和管理所有 OpenClaw 会话
- **📁 文件浏览器** - 在线浏览和管理工作空间文件
- **🛠️ 技能市场** - 全局/工作空间技能管理，支持作者标识
- **⏰ 定时任务** - Cron 任务配置和监控
- **👥 多工作空间** - 支持多个 Agent/工作空间切换
- **📈 实时监控** - 会话状态、资源使用、日志查看

### 🚀 新增特性 (v2.0)

- ✅ **动态工作空间加载** - 自动从 `openclaw agents list` 加载所有可用工作空间
- ✅ **技能作用域管理** - 清晰标识全局技能 (~/.openclaw/skills) 和工作空间技能
- ✅ **作者字段显示** - 区分自研技能 (maydaychen) 和第三方技能
- ✅ **智能描述提取** - 从 SKILL.md YAML front matter 自动提取描述
- ✅ **工作空间切换器** - 顶部导航栏快速切换不同工作空间
- ✅ **卡片布局优化** - 修复技能卡片底部位置，视觉更统一

---

## 📸 界面预览

### 仪表盘
![Dashboard](./screenshots/dashboard.png)
*实时查看所有会话状态和资源使用情况*

### 技能管理
![Skills](./screenshots/skills.png)
*全局/工作空间技能管理，支持作者标识和作用域 badges*

### 文件浏览器
![Files](./screenshots/files.png)
*在线浏览和编辑工作空间文件*

### 定时任务
![Crons](./screenshots/crons.png)
*配置和监控 Cron 定时任务*

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- OpenClaw >= 1.0.0
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/maydaychen/openclaw-manager.git
cd openclaw-manager

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 访问管理界面
# 浏览器打开：http://localhost:3000
```

### 生产环境部署

```bash
# 使用 PM2 守护进程
npm install -g pm2
pm2 start npm --name "openclaw-manager" -- start
pm2 save
pm2 startup
```

---

## 📖 使用指南

### 工作空间切换

1. 点击顶部导航栏的 **工作空间选择器**
2. 从下拉列表选择目标工作空间
3. 页面自动刷新，显示该工作空间的数据

### 技能管理

#### 查看技能

- **全局技能** - 显示紫色 `全局` 标签，优先级更高
- **工作空间技能** - 显示蓝色 `工作空间` 标签
- **作者标识** - 显示 `by maydaychen` 或 `by 第三方`

#### 技能描述

描述自动从 `SKILL.md` 的 YAML front matter 提取：

```yaml
---
name: skill-name
author: maydaychen
description: 技能描述内容
---
```

### 会话管理

- **查看日志** - 点击会话卡片查看实时日志
- **终止会话** - 点击删除按钮终止会话
- **筛选会话** - 按状态、类型筛选会话列表

### 文件浏览器

- **浏览文件** - 点击文件夹导航
- **编辑文件** - 点击文件在线编辑
- **上传文件** - 拖拽文件到浏览器上传

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Vue 3 | 3.4.x |
| 前端 | Tailwind CSS | 3.4.x |
| 前端 | Vue Router | 4.3.x |
| 后端 | Node.js | 18+ |
| 后端 | Express | 4.18.x |
| 构建 | Vite | 5.2.x |

### 项目结构

```
openclaw-manager/
├── app.js              # 前端 Vue 应用
├── server.js           # 后端 Express 服务器
├── index.html          # 主页面
├── style.css           # 全局样式
├── package.json        # 依赖配置
├── vite.config.js      # Vite 配置
└── screenshots/        # 界面截图
```

### API 接口

#### 工作空间
```
GET  /api/workspaces          # 获取所有工作空间
GET  /api/workspaces/:id      # 获取工作空间详情
```

#### 会话
```
GET  /api/sessions            # 获取会话列表
GET  /api/sessions/:key       # 获取会话详情
POST /api/sessions/:key/kill  # 终止会话
```

#### 技能
```
GET  /api/skills              # 获取技能列表
GET  /api/skills/:name        # 获取技能详情
POST /api/skills              # 安装新技能
DELETE /api/skills/:name      # 删除技能
```

#### 文件
```
GET  /api/files?path=...      # 获取文件/目录列表
GET  /api/files/read?path=... # 读取文件内容
POST /api/files/write         # 写入文件
POST /api/files/upload        # 上传文件
DELETE /api/files?path=...    # 删除文件
```

#### 定时任务
```
GET  /api/crons               # 获取 Cron 任务列表
POST /api/crons               # 创建 Cron 任务
DELETE /api/crons/:id         # 删除 Cron 任务
```

---

## 🛠️ 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (热重载)
npm run dev

# 访问 http://localhost:5173
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint
```

---

## 📝 更新日志

### v2.0.0 (2026-03-05)

**重大更新**

- 🎉 多工作空间支持
- 🛠️ 技能作用域管理 (全局/工作空间)
- 👤 技能作者字段显示
- 📄 智能描述提取 (YAML front matter)
- 🎨 UI 优化 (卡片布局、工作空间选择器)

**技术改进**

- 重构技能渲染逻辑 (+317 行)
- 多工作空间 API 支持 (+316 行)
- 工作空间切换器 UI (+197 行)

### v1.0.0 (2026-02-28)

**初始版本**

- 基础会话管理
- 文件浏览器
- 技能管理
- 定时任务配置

---

## 🔒 安全说明

### 认证

- 当前版本为内部工具，无用户认证
- 建议部署在内网或通过反向代理添加认证

### 权限

- 需要 OpenClaw 完整访问权限
- 可执行文件读写、会话管理、技能安装等操作
- 建议仅在可信环境部署

### 最佳实践

1. **内网部署** - 仅允许内网访问
2. **反向代理** - 使用 Nginx 添加 HTTPS 和基本认证
3. **定期更新** - 保持 OpenClaw 和依赖最新
4. **监控日志** - 定期检查操作日志

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 2 空格缩进
- 使用单引号
- 遵循 ESLint 规则
- 编写清晰的注释

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - 强大的 AI 助手框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Express](https://expressjs.com/) - Node.js Web 框架

---

**🎉 Happy Coding!**
