# OpenClaw Manager - Agent 管理功能增强

## 修改内容

### 1. 后端 API (server.js) ✅ 已完成

已添加两个新 API：

```javascript
// 获取所有可用 Agent
GET /api/agents/list

// 创建新会话
POST /api/agents/spawn
{
  "agentId": "mom-creator",
  "task": "写一篇关于宝宝辅食的文章",
  "mode": "run",
  "runtime": "subagent"
}
```

### 2. 前端修改 (index.html)

#### 位置 1: 在 Agents 页面添加"可用 Agent"标签页

找到 `agents-grid` 所在位置，在其上方添加：

```html
<!-- 可用 Agent 选择器 -->
<div class="available-agents-section" style="margin-bottom: 30px;">
    <h3 style="margin-bottom: 16px;">🤖 可用 Agent</h3>
    <div class="agents-filter" style="display: flex; gap: 12px; margin-bottom: 20px;">
        <select id="agent-select" class="form-select" style="flex: 1;">
            <option value="">选择 Agent...</option>
        </select>
        <button onclick="loadAgentInfo()" class="btn btn-primary">查看信息</button>
    </div>
    
    <div id="agent-info-card" class="glass-card" style="padding: 20px; display: none;">
        <div id="agent-info-content"></div>
        <div style="margin-top: 20px;">
            <h4 style="margin-bottom: 12px;">创建新会话</h4>
            <textarea id="spawn-task" class="form-textarea" rows="3" 
                placeholder="输入任务描述..." style="width: 100%; margin-bottom: 12px;"></textarea>
            <div style="display: flex; gap: 12px;">
                <select id="spawn-mode" class="form-select">
                    <option value="run">一次性运行</option>
                    <option value="session">持久会话</option>
                </select>
                <select id="spawn-runtime" class="form-select">
                    <option value="subagent">Subagent</option>
                    <option value="acp">ACP</option>
                </select>
                <button onclick="spawnSession()" class="btn btn-success">创建会话</button>
            </div>
        </div>
    </div>
</div>
```

#### 位置 2: 添加 JavaScript 函数

在 `</script>` 标签前添加：

```javascript
// 加载可用 Agent 列表
async function loadAvailableAgents() {
    try {
        const response = await fetch('/api/agents/list');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('agent-select');
            select.innerHTML = '<option value="">选择 Agent...</option>';
            
            data.agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = `${agent.name} ${agent.isDefault ? '(默认)' : ''} - ${agent.identity || ''}`;
                option.dataset.agent = JSON.stringify(agent);
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载 Agent 列表失败:', error);
    }
}

// 加载 Agent 信息
function loadAgentInfo() {
    const select = document.getElementById('agent-select');
    const selectedOption = select.options[select.selectedIndex];
    
    if (!selectedOption.value) {
        alert('请先选择一个 Agent');
        return;
    }
    
    const agent = JSON.parse(selectedOption.dataset.agent);
    const infoCard = document.getElementById('agent-info-card');
    const infoContent = document.getElementById('agent-info-content');
    
    infoContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
                <div class="detail-label">Agent ID</div>
                <div class="detail-value">${agent.id}</div>
            </div>
            <div>
                <div class="detail-label">工作空间</div>
                <div class="detail-value">${agent.workspace || '-'}</div>
            </div>
            <div>
                <div class="detail-label">默认模型</div>
                <div class="detail-value">${agent.model || '-'}</div>
            </div>
            <div>
                <div class="detail-label">路由规则</div>
                <div class="detail-value">${agent.routingRules || 0} 条</div>
            </div>
        </div>
    `;
    
    infoCard.style.display = 'block';
}

// 创建会话
async function spawnSession() {
    const select = document.getElementById('agent-select');
    const agentId = select.value;
    const task = document.getElementById('spawn-task').value;
    const mode = document.getElementById('spawn-mode').value;
    const runtime = document.getElementById('spawn-runtime').value;
    
    if (!agentId) {
        alert('请选择 Agent');
        return;
    }
    
    if (!task.trim()) {
        alert('请输入任务描述');
        return;
    }
    
    try {
        const response = await fetch('/api/agents/spawn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, task, mode, runtime })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('会话创建成功！');
            document.getElementById('spawn-task').value = '';
            // 刷新会话列表
            if (typeof loadAgents === 'function') {
                loadAgents();
            }
        } else {
            alert('创建失败：' + data.error);
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果当前在 Agents 页面，加载可用 Agent 列表
    if (window.location.hash === '#agents' || window.location.hash === '') {
        loadAvailableAgents();
    }
});
```

### 3. 添加 CSS 样式

在 `</style>` 标签前添加：

```css
/* 可用 Agent 选择器样式 */
.form-select {
    padding: 10px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
}

[data-theme="dark"] .form-select {
    background: #2d2d30;
}

.form-textarea {
    padding: 12px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
}

[data-theme="dark"] .form-textarea {
    background: #2d2d30;
}

.agents-filter {
    background: var(--bg-elevated);
    padding: 16px;
    border-radius: 12px;
}

.glass-card {
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: var(--shadow);
}
```

## 使用方法

1. **重启 Manager 服务**:
   ```bash
   cd /home/chenyi/.openclaw/workspace/projects/openclaw-manager
   pkill -f "node server.js"
   nohup node server.js > server.log 2>&1 &
   ```

2. **访问 Manager**: http://localhost:3456

3. **使用新功能**:
   - 在 Agents 页面顶部选择可用 Agent
   - 点击"查看信息"查看 Agent 详情
   - 输入任务描述，选择运行模式
   - 点击"创建会话"

## 功能说明

- **可用 Agent 列表**: 显示所有已配置的 Agent（main, mom-creator, infra-manager 等）
- **Agent 信息**: 显示工作空间、默认模型、路由规则等
- **创建会话**: 支持选择任意 Agent 创建新会话
- **运行模式**: 
  - `run`: 一次性运行，完成后自动结束
  - `session`: 持久会话，可以持续交互
- **运行时**:
  - `subagent`: OpenClaw 原生 subagent
  - `acp`: ACP 编码会话

---

**修改完成时间**: 2026-03-04  
**修改者**: Haro 🤖
