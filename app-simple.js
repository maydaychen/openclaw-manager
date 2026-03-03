// Simple vanilla JS version
const API_URL = 'http://localhost:3456/api';

// State
let status = null;
let files = [];
let crons = [];

// Format size
function formatSize(bytes) {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Fetch status
async function fetchStatus() {
    try {
        console.log('Fetching status...');
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        console.log('Status data:', data);
        if (data.success) {
            status = data.data;
            updateDashboard();
        }
    } catch (error) {
        console.error('Failed to fetch status:', error);
        document.getElementById('error-msg').textContent = '获取状态失败: ' + error.message;
    }
}

// Fetch files
async function fetchFiles() {
    try {
        const response = await fetch(`${API_URL}/files`);
        const data = await response.json();
        if (data.success) {
            files = data.files;
            renderFiles();
        }
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Fetch crons
async function fetchCrons() {
    try {
        const response = await fetch(`${API_URL}/crons`);
        const data = await response.json();
        if (data.success) {
            crons = data.crons;
            renderCrons();
        }
    } catch (error) {
        console.error('Failed to fetch crons:', error);
    }
}

// Update dashboard
function updateDashboard() {
    if (!status) return;
    
    document.getElementById('sessions-active').textContent = status.sessions.active;
    document.getElementById('sessions-total').textContent = `总计 ${status.sessions.count} 个会话`;
    
    document.getElementById('crons-count').textContent = status.crons.count;
    
    document.getElementById('gateway-status').innerHTML = 
        status.gateway === 'running' 
            ? '<span style="color: #107C10">运行中</span>' 
            : '<span style="color: #D13438">已停止</span>';
    
    document.getElementById('disk-percent').textContent = status.disk.percent || '-';
    document.getElementById('disk-detail').textContent = 
        status.disk ? `${status.disk.used} / ${status.disk.total}` : '';
    
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString('zh-CN');
}

// Render files
function renderFiles() {
    const container = document.getElementById('files-list');
    container.innerHTML = renderFileTree(files, 0);
}

function renderFileTree(fileList, level) {
    if (!fileList || fileList.length === 0) return '<p>暂无文件</p>';
    
    let html = '';
    for (const file of fileList) {
        const icon = file.type === 'directory' ? '📁' : '📄';
        const padding = 12 + level * 20;
        
        html += `
            <div class="file-item" style="padding-left: ${padding}px">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-meta">${file.type === 'file' ? formatSize(file.size) : ''}</span>
                <span class="file-meta">${formatDate(file.modified)}</span>
                <div class="file-actions">
                    ${file.type === 'file' ? `<button class="action-btn" onclick="deleteFile('${file.path}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
        
        if (file.type === 'directory' && file.children) {
            html += `<div class="directory-children">${renderFileTree(file.children, level + 1)}</div>`;
        }
    }
    return html;
}

// Render crons
function renderCrons() {
    const container = document.getElementById('crons-list');
    if (!crons || crons.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">⏰</div><p>暂无定时任务</p></div>';
        return;
    }
    
    let html = '<div class="cron-list">';
    for (const cron of crons) {
        html += `
            <div class="cron-item">
                <div class="cron-info">
                    <div class="cron-name">${cron.name || cron.id}</div>
                    <span class="cron-schedule">${cron.schedule}</span>
                </div>
                <span class="cron-status ${cron.enabled ? 'status-enabled' : 'status-disabled'}">
                    ${cron.enabled ? '已启用' : '已禁用'}
                </span>
                <div class="cron-actions">
                    <button class="btn btn-secondary" onclick="toggleCron('${cron.id}', ${!cron.enabled})">
                        ${cron.enabled ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteCron('${cron.id}')">删除</button>
                </div>
            </div>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}

// Delete file
async function deleteFile(filepath) {
    if (!confirm(`确定要删除 "${filepath}" 吗？`)) return;
    
    try {
        const response = await fetch(`${API_URL}/files/${encodeURIComponent(filepath)}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            fetchFiles();
        }
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// Toggle cron
async function toggleCron(id, enabled) {
    try {
        await fetch(`${API_URL}/crons/${id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
        fetchCrons();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

// Delete cron
async function deleteCron(id) {
    if (!confirm('确定要删除这个定时任务吗？')) return;
    
    try {
        await fetch(`${API_URL}/crons/${id}`, { method: 'DELETE' });
        fetchCrons();
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    fetchStatus();
    fetchFiles();
    fetchCrons();
    
    // Auto refresh every 30 seconds
    setInterval(() => {
        fetchStatus();
        fetchCrons();
    }, 30000);
});
