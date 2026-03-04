# 全局技能目录支持

**更新日期**: 2026-03-04  
**功能**: 添加 `/home/chenyi/.openclaw/skills` 全局技能目录支持

---

## ✅ 修改内容

### 技能目录优先级

现在 Manager 会扫描以下目录的技能（按优先级排序）：

1. **最高优先级**: `/home/chenyi/.openclaw/skills/`
   - 全局技能目录
   - 所有 agent 共享
   - 标签：🌍 全局 (~/.openclaw)

2. **中等优先级**: `/home/chenyi/.openclaw/workspace/skills/`
   - Default workspace 的技能
   - 标签：📂 Default Workspace

3. **低优先级**: 其他 workspace 的 skills/
   - `workspace-mom-creator/skills/`
   - `workspace-infra-manager/skills/`
   - 标签：📂 Workspace 名称

---

## 📊 技能统计

### 🌍 全局技能 (6 个)
位于 `~/.openclaw/skills/`:
- Humanizer-zh
- calendar
- find-skills
- self-improving-agent
- session-manager
- ui-ux-pro-max-skill

### 📂 Workspace 技能 (10 个)

**Default Workspace** (1 个):
- format-converter-skill

**Mom Creator** (4 个):
- mom-blogger-platform
- mother-baby-trends
- wechat-creator
- wechat-screenshot

**Infra Manager** (5 个):
- aliyun-cli
- aws-health-monitor
- homeassistant-skill
- n8n
- n8n-workflow-automation

---

## 🔍 去重逻辑

如果同一个技能在多个目录存在：
1. **全局技能优先** - `~/.openclaw/skills/` 中的技能会覆盖 workspace 中的同名技能
2. **显示全局版本** - 在技能列表中标记为"🌍 全局 (~/.openclaw)"
3. **保留 workspace 版本** - 只有在全局目录不存在时才显示 workspace 版本

---

## 🎯 显示效果

访问 **http://localhost:3456** → **技能管理**

按 **Ctrl + Shift + R** 强制刷新

```
┌─────────────────────────────────────────┐
│ 刷新  共 16 个技能（全局 6 个，工作空间 10 个）│
├─────────────────────────────────────────┤
│                                         │
│ 🌍 全局技能 (6 个)                       │
│ ┌───────────┬───────────┬───────────┐  │
│ │ calendar  │ find-...  │ Humanizer │  │
│ │ 🌍 全局   │ 🌍 全局   │ 🌍 全局   │  │
│ │           │           │           │  │
│ └───────────┴───────────┴───────────┘  │
│                                         │
│ 📂 工作空间技能 (10 个)                  │
│ ┌───────────┬───────────┬───────────┐  │
│ │ format-.. │ mom-...   │ aliyun-.. │  │
│ │ 📂 Default│ 📂 Mom    │ 📂 Infra  │  │
│ └───────────┴───────────┴───────────┘  │
└─────────────────────────────────────────┘
```

---

## 📝 Author 字段

从 SKILL.md 的 YAML front matter 中提取：

```markdown
---
name: calendar
author: maydaychen
version: 1.0.0
---
```

如果 SKILL.md 没有 author 字段，则不显示作者标签。

---

## 🔄 刷新技能列表

技能列表在每次访问页面时自动刷新。

也可以点击"刷新"按钮手动刷新。

---

**修改者**: Haro 🤖  
**状态**: ✅ 完成
