# Workspace 选择器更新

**更新日期**: 2026-03-04  
**问题**: Workspace 选择器只显示 2 个选项  
**解决**: 动态从 OpenClaw 获取所有 workspace

---

## ✅ 修改内容

### server.js
1. **添加动态 workspace 加载**
   - `loadDynamicWorkspaces()` - 从 `openclaw agents list` 解析 workspace
   - `getAllWorkspaces()` - 合并静态和动态 workspace

2. **更新 API**
   - `GET /api/workspaces` - 返回所有 workspace（静态 + 动态）
   - `POST /api/workspaces/refresh` - 手动刷新 workspace 列表

3. **修复引用**
   - `WORKSPACES` → `STATIC_WORKSPACES`
   - `WORKSPACE_PATH` 使用 `STATIC_WORKSPACES.default.path`

---

## 🎯 现在的功能

### 自动检测 workspace
Manager 会自动从 `openclaw agents list` 命令中提取所有 workspace：
- `default` → `~/workspace`
- `workspace-mom-creator` → `~/workspace-mom-creator`
- `workspace-infra-manager` → `~/workspace-infra-manager`
- 以及其他任何 agent 使用的 workspace

### Workspace 选择器
侧边栏的 Workspace 下拉框现在会显示：
- Default Workspace
- Mom Creator
- Infra Manager
- 其他动态检测到的 workspace

---

## 🔄 刷新 Workspace 列表

如果添加了新的 agent/workspace，可以：

**方法 1: 刷新页面**
- 页面加载时会自动获取最新列表

**方法 2: API 刷新**
```bash
curl -X POST http://localhost:3456/api/workspaces/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 测试

访问 http://localhost:3456

查看侧边栏顶部的 Workspace 选择器，现在应该显示所有可用的 workspace！

---

**修改者**: Haro 🤖  
**状态**: ✅ 完成
