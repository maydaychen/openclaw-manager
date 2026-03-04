const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const execAsync = util.promisify(exec);
const app = express();
const PORT = 3456;

// Database Configuration - from environment variables or config file
let DB_CONFIG;
try {
    const configPath = path.join(__dirname, 'config.json');
    const configFile = require('fs').readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);
    DB_CONFIG = config.database;
} catch (e) {
    // Fallback to environment variables
    DB_CONFIG = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'openclaw',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'openclaw_manager',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Create database connection pool
const dbPool = mysql.createPool(DB_CONFIG);

// Helper function to query database
async function dbQuery(sql, params) {
    const [results] = await dbPool.execute(sql, params);
    return results;
}

// Get the directory where server.js is located
const SERVER_DIR = __dirname;

// Static files
app.use(express.static(path.join(__dirname)));

// SPA fallback - serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Multiple Workspaces Configuration
// Static workspaces (fallback)
const STATIC_WORKSPACES = {
    'default': {
        name: 'Default Workspace',
        path: '/home/chenyi/.openclaw/workspace',
        description: 'Main OpenClaw workspace'
    },
    'workspace-mom-creator': {
        name: 'Mom Creator',
        path: '/home/chenyi/.openclaw/workspace-mom-creator',
        description: 'Workspace for mom content creation'
    }
};

// Dynamic workspaces - will be populated from openclaw agents list
let DYNAMIC_WORKSPACES = {};

// Load workspaces from openclaw agents list
async function loadDynamicWorkspaces() {
    try {
        const { exec } = require('child_process');
        const { stdout } = await new Promise((resolve, reject) => {
            exec('/home/chenyi/.npm-global/bin/openclaw agents list 2>/dev/null', (error, stdout) => {
                if (error) reject(error);
                else resolve({ stdout });
            });
        });
        
        // Parse agents list to extract workspaces
        const lines = stdout.split('\n');
        const workspaces = {};
        let currentWorkspace = null;
        
        for (const line of lines) {
            if (line.startsWith('- ')) {
                // New agent found
                const agentName = line.substring(2).split(' ')[0];
                currentWorkspace = agentName;
            } else if (currentWorkspace && line.includes('Workspace:')) {
                let wsPath = line.split('Workspace:')[1].trim();
                
                // Expand ~ to home directory
                if (wsPath.startsWith('~')) {
                    wsPath = wsPath.replace('~', '/home/chenyi');
                }
                
                if (wsPath && wsPath !== '-' && !workspaces[wsPath]) {
                    // Extract workspace folder name from path
                    let wsName = wsPath.replace('/home/chenyi/.openclaw/', '');
                    
                    // Special case: 'workspace' should be 'default'
                    if (wsName === 'workspace') {
                        wsName = 'default';
                    }
                    
                    workspaces[wsName] = {
                        name: wsName === 'default' ? 'Default Workspace' : wsName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        path: wsPath,
                        description: `Workspace for ${currentWorkspace} agent`,
                        agent: currentWorkspace
                    };
                }
            }
        }
        
        DYNAMIC_WORKSPACES = workspaces;
        console.log('✅ Loaded dynamic workspaces:', Object.keys(DYNAMIC_WORKSPACES));
        console.log('📂 Total workspaces:', Object.keys(getAllWorkspaces()).length);
    } catch (error) {
        console.error('❌ Failed to load dynamic workspaces:', error.message);
    }
}

// Get all workspaces (static + dynamic)
function getAllWorkspaces() {
    return { ...STATIC_WORKSPACES, ...DYNAMIC_WORKSPACES };
}

// Initialize dynamic workspaces on startup
loadDynamicWorkspaces();

// Default workspace
const DEFAULT_WORKSPACE = 'default';

// Helper to get current workspace path
function getWorkspacePath(workspaceId) {
    const workspaces = getAllWorkspaces();
    const ws = workspaces[workspaceId] || workspaces[DEFAULT_WORKSPACE];
    return ws.path;
}

// Helper to get data path for a workspace
function getDataPath(workspaceId) {
    return path.join(getWorkspacePath(workspaceId), 'openclaw-manager', 'data');
}

// Helper to get users file path for a workspace
function getUsersFile(workspaceId) {
    return path.join(getDataPath(workspaceId), 'users.json');
}

// Legacy support - default workspace paths
const WORKSPACE_PATH = STATIC_WORKSPACES.default.path;
const DATA_PATH = path.join(WORKSPACE_PATH, 'openclaw-manager', 'data');
const USERS_FILE = path.join(DATA_PATH, 'users.json');

// Cache
let statusCache = null;
let statusCacheTime = 0;
const CACHE_TTL = 15000; // 15 seconds

// Ensure data directory exists for a workspace
async function ensureDataDir(workspaceId = DEFAULT_WORKSPACE) {
    try {
        await fs.mkdir(getDataPath(workspaceId), { recursive: true });
    } catch (e) {}
}

// Initialize default user for a workspace
async function initUsers(workspaceId = DEFAULT_WORKSPACE) {
    await ensureDataDir(workspaceId);
    const usersFile = getUsersFile(workspaceId);
    try {
        await fs.access(usersFile);
    } catch {
        const defaultUser = {
            username: 'maydaychen',
            passwordHash: hashPassword('AB2!REKj4bm7dcQECTdh'),
            createdAt: new Date().toISOString(),
            isAdmin: true
        };
        await fs.writeFile(usersFile, JSON.stringify([defaultUser], null, 2));
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function getUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        return users.map(u => ({ username: u.username, createdAt: u.createdAt, isAdmin: u.isAdmin || false }));
    } catch {
        return [];
    }
}

async function verifyUser(username, password) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);
        if (user && user.passwordHash === hashPassword(password)) {
            return { username: user.username, isAdmin: user.isAdmin };
        }
        return null;
    } catch {
        return null;
    }
}

async function addUser(username, password, isAdmin = false) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        if (users.find(u => u.username === username)) {
            return { success: false, error: '用户名已存在' };
        }
        users.push({ username, passwordHash: hashPassword(password), createdAt: new Date().toISOString(), isAdmin });
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updatePassword(username, newPassword) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);
        if (!user) return { success: false, error: '用户不存在' };
        user.passwordHash = hashPassword(newPassword);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteUser(username) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        let users = JSON.parse(data);
        const admins = users.filter(u => u.isAdmin);
        const targetUser = users.find(u => u.username === username);
        if (targetUser?.isAdmin && admins.length <= 1) {
            return { success: false, error: '不能删除最后一个管理员' };
        }
        users = users.filter(u => u.username !== username);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

initUsers();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未授权' });
    }
    const sessionToken = token.slice(7);
    if (!sessionToken.includes(':')) {
        return res.status(401).json({ success: false, error: '无效的令牌' });
    }
    req.user = { username: sessionToken.split(':')[0] };
    next();
};

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    const user = await verifyUser(username, password);
    if (user) {
        const timestamp = Date.now();
        const token = `${username}:${timestamp}:${crypto.createHash('md5').update(username + timestamp).digest('hex')}`;
        res.json({ success: true, token, user: { username: user.username, isAdmin: user.isAdmin } });
    } else {
        res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
});

app.get('/api/users', authMiddleware, async (req, res) => {
    const users = await getUsers();
    res.json({ success: true, users });
});

app.post('/api/users', authMiddleware, async (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: '密码至少需要6个字符' });
    }
    const result = await addUser(username, password, isAdmin);
    res.json(result);
});

app.put('/api/users/:username/password', authMiddleware, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: '新密码至少需要6个字符' });
    }
    const result = await updatePassword(req.params.username, newPassword);
    res.json(result);
});

app.delete('/api/users/:username', authMiddleware, async (req, res) => {
    if (req.params.username === req.user.username) {
        return res.status(400).json({ success: false, error: '不能删除当前登录的用户' });
    }
    const result = await deleteUser(req.params.username);
    res.json(result);
});

// Get available workspaces
app.get('/api/workspaces', authMiddleware, (req, res) => {
    const workspaces = Object.entries(getAllWorkspaces()).map(([id, ws]) => ({
        id,
        name: ws.name,
        description: ws.description,
        path: ws.path,
        agent: ws.agent || null
    }));
    res.json({ success: true, workspaces });
});

// Refresh workspaces from openclaw
app.post('/api/workspaces/refresh', authMiddleware, async (req, res) => {
    await loadDynamicWorkspaces();
    res.json({ 
        success: true, 
        workspaces: Object.keys(getAllWorkspaces()),
        message: 'Workspace list refreshed'
    });
});

// Optimized status endpoint with caching and parallel execution
app.get('/api/status', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        
        const now = Date.now();
        const cacheKey = `${workspaceId}_${Math.floor(now / CACHE_TTL)}`;
        if (statusCache && statusCache.key === cacheKey && (now - statusCacheTime) < CACHE_TTL) {
            return res.json({ success: true, data: statusCache.data });
        }

        // Run all commands in parallel with timeout
        const timeoutMs = 15000; // Increased to 15 seconds
        const execWithTimeout = (cmd) => Promise.race([
            execAsync(cmd),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
        ]).catch(() => ({ stdout: '' }));

        const openclawPath = '/home/chenyi/.npm-global/bin/openclaw';
        const [sessionsRes, cronRes, gatewayRes, diskRes] = await Promise.all([
            execWithTimeout(`${openclawPath} sessions --json`),
            execWithTimeout(`${openclawPath} cron list --json`),
            execWithTimeout(`${openclawPath} gateway status`),
            execWithTimeout(`df -h ${workspacePath}`)
        ]);

        let sessionCount = 0, activeCount = 0;
        try {
            console.log('Sessions stdout:', sessionsRes.stdout.substring(0, 200));
            const data = JSON.parse(sessionsRes.stdout);
            if (data?.sessions) {
                sessionCount = data.sessions.length;
                activeCount = data.sessions.filter(s => s.ageMs < 300000).length;
            }
        } catch (e) {
            console.error('Sessions parse error:', e.message);
        }

        let cronCount = 0;
        try {
            console.log('Cron stdout:', cronRes.stdout.substring(0, 200));
            const data = JSON.parse(cronRes.stdout);
            if (data?.jobs) cronCount = data.jobs.length;
            else if (Array.isArray(data)) cronCount = data.length;
        } catch (e) {
            console.error('Cron parse error:', e.message);
        }

        let gatewayStatus = 'unknown';
        try {
            console.log('Gateway stdout:', gatewayRes.stdout.substring(0, 200));
            // Check for various running indicators
            const isRunning = gatewayRes.stdout.includes('Runtime: running') || 
                              gatewayRes.stdout.includes('state active') ||
                              gatewayRes.stdout.includes('RPC probe: ok');
            gatewayStatus = isRunning ? 'running' : 'stopped';
        } catch (e) {
            console.error('Gateway parse error:', e.message);
        }

        let diskUsage = {};
        try {
            const lines = diskRes.stdout.trim().split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                diskUsage = { total: parts[1], used: parts[2], available: parts[3], percent: parts[4] };
            }
        } catch (e) {}

        const cacheData = {
            sessions: { count: sessionCount, active: activeCount },
            crons: { count: cronCount },
            gateway: gatewayStatus,
            disk: diskUsage,
            workspace: workspaceId,
            timestamp: new Date().toISOString()
        };
        statusCache = { key: cacheKey, data: cacheData };
        statusCacheTime = now;

        res.json({ success: true, data: cacheData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/files', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const files = await listFilesRecursive(workspacePath, '', workspacePath);
        res.json({ success: true, files, workspace: workspaceId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

async function listFilesRecursive(dirPath, relativePath, basePath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'openclaw-manager') continue;
            const children = await listFilesRecursive(fullPath, relPath, basePath);
            files.push({ name: entry.name, path: relPath, type: 'directory', size: 0, modified: (await fs.stat(fullPath)).mtime, children });
        } else {
            const stats = await fs.stat(fullPath);
            files.push({ name: entry.name, path: relPath, type: 'file', size: stats.size, modified: stats.mtime });
        }
    }
    return files.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1);
}

// Download file
app.get('/api/files/:filepath(*)/download', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const filePath = path.join(workspacePath, req.params.filepath);
        if (!filePath.startsWith(workspacePath)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/files/:filepath(*)', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const filePath = path.join(workspacePath, req.params.filepath);
        if (!filePath.startsWith(workspacePath)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        // Delete asynchronously, respond immediately
        fs.unlink(filePath).catch(err => console.error('Delete error:', err));
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const OPENCLAW_PATH = '/home/chenyi/.npm-global/bin/openclaw';

app.get('/api/crons', authMiddleware, async (req, res) => {
    try {
        const { stdout } = await execAsync(`${OPENCLAW_PATH} cron list --json --all`);
        const data = JSON.parse(stdout);
        res.json({ success: true, crons: data.jobs || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/crons/:id', authMiddleware, async (req, res) => {
    try {
        await execAsync(`${OPENCLAW_PATH} cron delete ${req.params.id}`);
        res.json({ success: true, message: 'Cron job deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/crons/:id/toggle', authMiddleware, async (req, res) => {
    try {
        const { enabled } = req.body;
        const action = enabled ? 'enable' : 'disable';
        await execAsync(`${OPENCLAW_PATH} cron ${action} ${req.params.id}`);
        res.json({ success: true, message: `Cron job ${action}d` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Skills management API
app.get('/api/skills', authMiddleware, async (req, res) => {
    try {
        const skillMap = new Map(); // To track unique skills by name
        const workspaces = getAllWorkspaces();
        
        // 1. First scan global skills directory: /home/chenyi/.openclaw/skills
        const globalSkillsPath = '/home/chenyi/.openclaw/skills';
        try {
            const entries = await fs.readdir(globalSkillsPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                
                const skillName = entry.name;
                const skillMdPath = path.join(globalSkillsPath, skillName, 'SKILL.md');
                
                let description = '暂无描述';
                let version = '-';
                let author = '-';
                
                try {
                    const content = await fs.readFile(skillMdPath, 'utf8');
                    
                    // Try to extract from YAML front matter first
                    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
                    if (frontMatterMatch) {
                        const frontMatter = frontMatterMatch[1];
                        
                        // Extract description from front matter
                        const descMatch = frontMatter.match(/description[:\s]+(.+)/i);
                        if (descMatch) {
                            description = descMatch[1].trim().replace(/^["']|["']$/g, '');
                        }
                        
                        // Extract version
                        const versionMatch = frontMatter.match(/version[:\s]+([\d.]+)/i);
                        if (versionMatch) version = versionMatch[1];
                        
                        // Extract author
                        const authorMatch = frontMatter.match(/author[:\s]+(.+)/i);
                        if (authorMatch) author = authorMatch[1].trim().replace(/^["']|["']$/g, '');
                    }
                    
                    // Fallback: extract from markdown content if no front matter
                    if (description === '暂无描述') {
                        const contentDescMatch = content.match(/#\s+.+\n+([^#\n].*?)(?=\n#{1,2}\s|\n*$)/s);
                        if (contentDescMatch) {
                            description = contentDescMatch[1].trim().substring(0, 200);
                        }
                    }
                } catch (e) {
                    // SKILL.md not found or error reading
                }
                
                // Global skills from ~/.openclaw/skills have highest priority
                skillMap.set(skillName, {
                    name: skillName,
                    description,
                    version,
                    author,
                    path: `~/.openclaw/skills/${skillName}`,
                    scope: 'global',
                    scopeName: '全局 (~/.openclaw)',
                    workspace: 'global'
                });
            }
        } catch (error) {
            console.error('Failed to scan global skills:', error.message);
        }
        
        // 2. Then scan workspace skills
        for (const [workspaceId, workspace] of Object.entries(workspaces)) {
            const skillsPath = path.join(workspace.path, 'skills');
            
            try {
                const entries = await fs.readdir(skillsPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;
                    
                    const skillName = entry.name;
                    const skillMdPath = path.join(skillsPath, skillName, 'SKILL.md');
                    
                    let description = '暂无描述';
                    let version = '-';
                    let author = '-';
                    
                    try {
                        const content = await fs.readFile(skillMdPath, 'utf8');
                        const descMatch = content.match(/#\s+.+\n+([^#\n].*?)(?=\n#{1,2}\s|\n*$)/s);
                        if (descMatch) description = descMatch[1].trim().substring(0, 200);
                        
                        const versionMatch = content.match(/version[:\s]+([\d.]+)/i);
                        if (versionMatch) version = versionMatch[1];
                        
                        const authorMatch = content.match(/author[:\s]+(.+)/i);
                        if (authorMatch) author = authorMatch[1].trim();
                    } catch (e) {}
                    
                    // Only add if not already in global skills
                    if (!skillMap.has(skillName)) {
                        const scope = workspaceId === 'default' ? 'workspace' : 'workspace';
                        const scopeName = workspaceId === 'default' ? 'Default Workspace' : workspace.name;
                        
                        skillMap.set(skillName, {
                            name: skillName,
                            description,
                            version,
                            author,
                            path: `skills/${skillName}`,
                            scope,
                            scopeName,
                            workspace: workspaceId
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to scan skills in workspace ${workspaceId}:`, error.message);
            }
        }
        
        const skills = Array.from(skillMap.values());
        res.json({ success: true, skills: skills.sort((a, b) => a.name.localeCompare(b.name)) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete skill
app.delete('/api/skills/:skillName', authMiddleware, async (req, res) => {
    try {
        const skillName = decodeURIComponent(req.params.skillName);
        const skillPath = path.join(WORKSPACE_PATH, 'skills', skillName);
        
        // Security check
        if (!skillPath.startsWith(path.join(WORKSPACE_PATH, 'skills'))) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        // Remove directory recursively
        await fs.rm(skillPath, { recursive: true, force: true });
        
        res.json({ success: true, message: 'Skill deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logs API
app.get('/api/logs', authMiddleware, async (req, res) => {
    try {
        const { lines = 100, level = 'all' } = req.query;
        
        // Try multiple possible log paths
        const possiblePaths = [
            path.join(WORKSPACE_PATH, '..', 'openclaw.log'),
            path.join(WORKSPACE_PATH, '..', '..', 'openclaw.log'),
            '/var/log/openclaw.log',
            path.join(require('os').homedir(), '.openclaw', 'openclaw.log')
        ];
        
        let content = '';
        let found = false;
        
        for (const logPath of possiblePaths) {
            try {
                await fs.access(logPath);
                const { stdout } = await execAsync(`tail -n ${lines} "${logPath}"`);
                content = stdout;
                found = true;
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!found) {
            content = 'Log file not found. Tried paths:\n' + possiblePaths.join('\n');
        }
        
        let logs = content.split('\n').filter(line => line.trim());
        if (level !== 'all') {
            const levelPattern = new RegExp(level, 'i');
            logs = logs.filter(line => levelPattern.test(line));
        }
        
        res.json({ success: true, logs: logs.slice(-100) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Config API - workspace specific
app.get('/api/config', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        // Look for openclaw.json in parent directory of workspace
        const configPath = path.join(workspacePath, '..', 'openclaw.json');
        let config = {};
        try {
            const content = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(content);
        } catch (e) {
            config = { error: 'Config file not found', workspace: workspaceId };
        }
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/config', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const configPath = path.join(workspacePath, '..', 'openclaw.json');
        const backupPath = `${configPath}.backup.${Date.now()}`;
        
        try {
            await fs.copyFile(configPath, backupPath);
        } catch (e) {}
        
        await fs.writeFile(configPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Config saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Backup API - workspace specific
app.get('/api/backups', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const backupDir = path.join(workspacePath, 'backups');
        await fs.mkdir(backupDir, { recursive: true });
        
        const entries = await fs.readdir(backupDir, { withFileTypes: true });
        const backups = [];
        for (const e of entries) {
            if (e.isFile()) {
                const stat = await fs.stat(path.join(backupDir, e.name));
                backups.push({ name: e.name, created: stat.mtime, size: stat.size });
            }
        }
        
        res.json({ success: true, backups: backups.sort((a, b) => new Date(b.created) - new Date(a.created)) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/backups/create', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const backupDir = path.join(workspacePath, 'backups');
        const uploadToDrive = req.query.drive === 'true';
        await fs.mkdir(backupDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `openclaw-backup-${workspaceId}-${timestamp}.tar.gz`;
        const backupPath = path.join(backupDir, backupName);
        const wsFolderName = path.basename(workspacePath);
        
        // Create backup with exclusions
        await execAsync(`cd "${path.dirname(workspacePath)}" && tar -czf "${backupPath}" --exclude='node_modules' --exclude='.git' --exclude='__pycache__' ${wsFolderName}/ openclaw.json 2>/dev/null`);
        
        let driveInfo = null;
        
        // Upload to Google Drive if requested
        if (uploadToDrive) {
            try {
                const scriptPath = '/home/chenyi/.openclaw/workspace/scripts/python/backup_to_drive.py';
                const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" ${workspaceId}`);
                
                // Parse output for file ID
                const match = stdout.match(/Drive ID: ([\w-]+)/);
                if (match) {
                    driveInfo = {
                        fileId: match[1],
                        url: `https://drive.google.com/file/d/${match[1]}/view`
                    };
                }
            } catch (driveError) {
                console.error('Google Drive upload failed:', driveError);
                // Continue without failing - local backup still created
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Backup created', 
            name: backupName,
            drive: driveInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agents API - get available agents (from openclaw agents list)
app.get('/api/agents/list', authMiddleware, async (req, res) => {
    try {
        const { stdout } = await execAsync('/home/chenyi/.npm-global/bin/openclaw agents list 2>/dev/null || echo ""');
        
        // Parse the text output to extract agent info
        const agents = [];
        const lines = stdout.split('\n');
        let currentAgent = null;
        
        for (const line of lines) {
            if (line.startsWith('- ')) {
                // New agent found
                if (currentAgent) {
                    agents.push(currentAgent);
                }
                const name = line.substring(2).split(' ')[0];
                currentAgent = {
                    id: name,
                    name: name,
                    isDefault: line.includes('(default)'),
                    model: '',
                    workspace: '',
                    status: 'unknown'
                };
            } else if (currentAgent && line.includes('Identity:')) {
                currentAgent.identity = line.split('Identity:')[1].trim();
            } else if (currentAgent && line.includes('Workspace:')) {
                currentAgent.workspace = line.split('Workspace:')[1].trim();
            } else if (currentAgent && line.includes('Model:')) {
                currentAgent.model = line.split('Model:')[1].trim();
            } else if (currentAgent && line.includes('Routing rules:')) {
                currentAgent.routingRules = parseInt(line.split('Routing rules:')[1].trim());
            }
        }
        
        // Don't forget the last agent
        if (currentAgent) {
            agents.push(currentAgent);
        }
        
        res.json({ success: true, agents });
    } catch (error) {
        console.error('Agents list API error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agents API - get active sessions
app.get('/api/agents', authMiddleware, async (req, res) => {
    try {
        // Get sessions list from openclaw
        let sessions = [];
        try {
            const { stdout } = await execAsync('/home/chenyi/.npm-global/bin/openclaw sessions --json 2>/dev/null || echo "{\"sessions\":[]}"');
            const data = JSON.parse(stdout);
            sessions = data.sessions || [];
        } catch (e) {
            console.error('Agents API error:', e.message);
        }
        
        // Format agent info
        const agents = sessions.map(s => {
            const parts = s.key.split(':');
            const channel = parts[2] || 'unknown';
            return {
                id: s.key,
                name: parts[parts.length - 1] || s.key,
                kind: s.kind,
                channel: channel,
                model: s.model || '-',
                status: s.ageMs < 300000 ? 'active' : 'idle',
                ageMs: s.ageMs,
                contextTokens: s.contextTokens || 0,
                totalTokens: s.totalTokens || 0,
                updatedAt: new Date(s.updatedAt).toLocaleString('zh-CN')
            };
        });
        
        res.json({ success: true, agents });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Spawn new session with specific agent
app.post('/api/agents/spawn', authMiddleware, async (req, res) => {
    try {
        const { agentId, task, mode = 'run', runtime = 'subagent' } = req.body;
        
        if (!agentId || !task) {
            return res.status(400).json({ success: false, error: 'agentId and task are required' });
        }
        
        const command = `${OPENCLAW_PATH} sessions spawn --agent "${agentId}" --mode "${mode}" --runtime "${runtime}" "${task.replace(/"/g, '\\"')}"`;
        const { stdout } = await execAsync(command);
        
        res.json({ 
            success: true, 
            message: 'Session spawned successfully',
            output: stdout
        });
    } catch (error) {
        console.error('Spawn session error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send message to agent
app.post('/api/agents/:agentId/message', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const agentId = decodeURIComponent(req.params.agentId);
        
        // Use openclaw to send message to session
        await execAsync(`${OPENCLAW_PATH} sessions send "${agentId}" "${message}"`);
        
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get real-time messages from a session
app.get('/api/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
    try {
        const sessionId = decodeURIComponent(req.params.sessionId);
        const { lines = 50 } = req.query;
        
        // Try multiple possible paths for session files
        const possiblePaths = [
            path.join(WORKSPACE_PATH, '..', '.openclaw', 'agents', 'main', 'sessions', `${sessionId}.jsonl`),
            path.join(WORKSPACE_PATH, '..', 'agents', 'main', 'sessions', `${sessionId}.jsonl`),
            path.join(require('os').homedir(), '.openclaw', 'agents', 'main', 'sessions', `${sessionId}.jsonl`),
            path.join(WORKSPACE_PATH, 'memory', 'sessions', `${sessionId}.json`)
        ];
        
        let messages = [];
        let found = false;
        
        for (const sessionPath of possiblePaths) {
            try {
                await fs.access(sessionPath);
                const content = await fs.readFile(sessionPath, 'utf8');
                
                // Parse JSONL format (one JSON object per line)
                const lines = content.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    try {
                        const msg = JSON.parse(line);
                        if (msg.role && msg.content) {
                            messages.push({
                                role: msg.role,
                                content: msg.content,
                                timestamp: msg.timestamp || new Date().toISOString()
                            });
                        }
                    } catch (e) {}
                }
                found = true;
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!found) {
            return res.json({ 
                success: true, 
                messages: [],
                note: 'Session file not found'
            });
        }
        
        // Return last N messages
        res.json({ 
            success: true, 
            messages: messages.slice(-parseInt(lines)).map(m => ({
                role: m.role,
                content: m.content?.substring(0, 500) + (m.content?.length > 500 ? '...' : '') || '',
                timestamp: m.timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restart gateway
app.post('/api/gateway/restart', authMiddleware, async (req, res) => {
    try {
        // Execute restart command
        await execAsync(`${OPENCLAW_PATH} gateway restart`);
        res.json({ success: true, message: 'Gateway restart initiated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get file content for editing - workspace specific
app.get('/api/files/:filepath(*)/content', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const filePath = path.join(workspacePath, req.params.filepath);
        if (!filePath.startsWith(workspacePath)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        const content = await fs.readFile(filePath, 'utf8');
        res.type('text/plain').send(content);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update file content - workspace specific
app.put('/api/files/:filepath(*)/content', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const workspacePath = getWorkspacePath(workspaceId);
        const filePath = path.join(workspacePath, req.params.filepath);
        if (!filePath.startsWith(workspacePath)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        // Backup existing file
        const backupPath = `${filePath}.backup.${Date.now()}`;
        try {
            await fs.copyFile(filePath, backupPath);
        } catch (e) {}
        
        // Write new content
        let content = req.body;
        if (typeof content === 'object') {
            content = JSON.stringify(content);
        }
        await fs.writeFile(filePath, content);
        res.json({ success: true, message: 'File saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Gateway info API
app.get('/api/gateway/info', authMiddleware, async (req, res) => {
    try {
        const { stdout } = await execAsync(`${OPENCLAW_PATH} gateway status --json 2>/dev/null || echo "{}"`);
        const data = JSON.parse(stdout);
        res.json({ success: true, gateway: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Token Usage APIs (Database) ====================

// Record token usage
app.post('/api/tokens/record', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const { totalTokens } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        await dbQuery(
            `INSERT INTO token_usage (workspace, date, total_tokens) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE total_tokens = GREATEST(total_tokens, VALUES(total_tokens))`,
            [workspaceId, today, totalTokens]
        );
        
        res.json({ success: true, message: 'Token usage recorded' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get token usage stats
app.get('/api/tokens/stats', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's usage
        const todayRow = await dbQuery(
            'SELECT total_tokens FROM token_usage WHERE workspace = ? AND date = ?',
            [workspaceId, today]
        );
        
        // Get yesterday's total for calculating daily increase
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const yesterdayRow = await dbQuery(
            'SELECT total_tokens FROM token_usage WHERE workspace = ? AND date <= ? ORDER BY date DESC LIMIT 1',
            [workspaceId, yesterdayStr]
        );
        
        // Get 7 days ago for weekly stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const weekRow = await dbQuery(
            'SELECT total_tokens FROM token_usage WHERE workspace = ? AND date <= ? ORDER BY date DESC LIMIT 1',
            [workspaceId, weekAgoStr]
        );
        
        // Get 30 days ago for monthly stats
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        
        const monthRow = await dbQuery(
            'SELECT total_tokens FROM token_usage WHERE workspace = ? AND date <= ? ORDER BY date DESC LIMIT 1',
            [workspaceId, monthAgoStr]
        );
        
        const currentTotal = todayRow[0]?.total_tokens || 0;
        const yesterdayTotal = yesterdayRow[0]?.total_tokens || 0;
        const weekStartTotal = weekRow[0]?.total_tokens || 0;
        const monthStartTotal = monthRow[0]?.total_tokens || 0;
        
        res.json({
            success: true,
            stats: {
                today: Math.max(0, currentTotal - yesterdayTotal),
                week: Math.max(0, currentTotal - weekStartTotal),
                month: Math.max(0, currentTotal - monthStartTotal),
                total: currentTotal
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get token usage history
app.get('/api/tokens/history', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const days = parseInt(req.query.days) || 30;
        
        const history = await dbQuery(
            `SELECT date, total_tokens 
             FROM token_usage 
             WHERE workspace = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             ORDER BY date ASC`,
            [workspaceId, days]
        );
        
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get daily usage ranking (with daily increment)
app.get('/api/tokens/daily-ranking', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Get all records for the month
        const records = await dbQuery(
            `SELECT date, total_tokens, created_at
             FROM token_usage
             WHERE workspace = ? AND DATE_FORMAT(date, '%Y-%m') = ?
             ORDER BY date ASC`,
            [workspaceId, month]
        );
        
        // Calculate daily usage in JavaScript
        let prevTotal = 0;
        const ranking = records.map((record, index) => {
            const dailyUsage = index === 0 ? record.total_tokens : record.total_tokens - prevTotal;
            prevTotal = record.total_tokens;
            return {
                ...record,
                daily_usage: dailyUsage
            };
        });
        
        // Reverse to show newest first
        ranking.reverse();
        
        res.json({ success: true, ranking });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get detailed usage for a specific date
app.get('/api/tokens/date/:date', authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.query.workspace || DEFAULT_WORKSPACE;
        const { date } = req.params;
        
        const dayData = await dbQuery(
            `SELECT date, total_tokens, created_at
             FROM token_usage
             WHERE workspace = ? AND date = ?`,
            [workspaceId, date]
        );
        
        if (dayData.length === 0) {
            return res.json({ success: false, error: 'No data for this date' });
        }
        
        // Get previous day's data to calculate daily usage
        const prevDay = await dbQuery(
            `SELECT total_tokens
             FROM token_usage
             WHERE workspace = ? AND date < ?
             ORDER BY date DESC
             LIMIT 1`,
            [workspaceId, date]
        );
        
        const prevTotal = prevDay.length > 0 ? prevDay[0].total_tokens : 0;
        const dailyUsage = dayData[0].total_tokens - prevTotal;
        
        res.json({ 
            success: true, 
            data: {
                ...dayData[0],
                daily_usage: dailyUsage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpenClaw Manager API running on http://0.0.0.0:${PORT}`);
    console.log(`Database connected: ${DB_CONFIG.host}`);
});
