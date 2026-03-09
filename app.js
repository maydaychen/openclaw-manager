// OpenClaw Manager - With Authentication & User Management
// Auto-detect API URL based on current host
const API_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3456/api'
    : '/api';

// State
let currentPage = 'dashboard';
let currentUser = null;
let authToken = localStorage.getItem('ocm_token');
let currentWorkspace = localStorage.getItem('ocm_workspace') || 'default';
let workspaces = [];
let availableWorkspaces = [];
let status = null;
let files = [];
let crons = [];
let users = [];
let skills = [];
let logs = [];
let config = {};
let backups = [];
let agents = [];
let expandedDirs = {};
let darkMode = localStorage.getItem('ocm_darkmode') !== 'false'; // Default to dark mode

// Flat Icons (SVG)
const IconSvgs = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    cron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    sessions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    disk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    gateway: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    skills: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    logs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    backup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    agent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>'
};

// Helper to render icon
function icon(name, size = 20) {
    const svg = IconSvgs[name] || IconSvgs['file'] || '';
    return `<span class="icon" style="width:${size}px;height:${size}px">${svg}</span>`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Apply dark mode
    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Initialize mobile gestures
    initMobileGestures();
    
    if (authToken) {
        validateToken();
    } else {
        showLoginPage();
    }
});

// Toggle dark mode
function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('ocm_darkmode', darkMode);
    
    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Update button icon
    const btn = document.getElementById('darkmode-toggle');
    if (btn) {
        btn.innerHTML = darkMode ? icon('sun', 20) : icon('moon', 20);
    }
}

// Validate stored token
async function validateToken() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            initApp();
        } else {
            logout();
        }
    } catch {
        logout();
    }
}

// Show login page
function showLoginPage() {
    document.body.innerHTML = `
        <div class="login-page">
            <div class="login-bg"></div>
            <div class="login-box">
                <div class="login-header">
                    <div class="login-logo-icon">🦞</div>
                    <h2>OpenClaw Manager</h2>
                    <p>请登录您的账户以继续</p>
                </div>
                <form id="login-form" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" id="username" required placeholder="请输入用户名" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <div class="password-input">
                            <input type="password" id="password" required placeholder="请输入密码" autocomplete="off">
                            <button type="button" class="toggle-password" onclick="togglePassword(this)">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div id="login-error" class="error-text"></div>
                    <button type="submit" class="btn-login">登 录</button>
                </form>
            </div>
        </div>
    `;
}

// Toggle password visibility
function togglePassword(btn) {
    const input = document.getElementById('password');
    const isVisible = input.type === 'text';
    
    input.type = isVisible ? 'password' : 'text';
    
    // Update icon
    btn.innerHTML = isVisible ? 
        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>` :
        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`;
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('ocm_token', authToken);
            initApp();
        } else {
            errorEl.textContent = data.error || '登录失败';
        }
    } catch (error) {
        errorEl.textContent = '网络错误，请重试';
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('ocm_token');
    showLoginPage();
}

// Initialize app after login
function initApp() {
    const isMobile = window.innerWidth <= 768;
    
    document.body.innerHTML = `
        <button class="menu-toggle" id="menu-toggle" onclick="toggleMobileMenu()" aria-label="打开菜单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;color:var(--text-primary)">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
        <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeMobileMenu()"></div>
        <aside class="sidebar" id="sidebar"></aside>
        <main class="main-content" id="main-content"></main>
        ${isMobile ? `
        <nav class="mobile-bottom-nav" id="mobile-bottom-nav">
            <a href="#" class="mobile-nav-item active" onclick="loadPage('dashboard'); return false;" data-page="dashboard">
                <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span class="mobile-nav-label">概览</span>
            </a>
            <a href="#" class="mobile-nav-item" onclick="loadPage('files'); return false;" data-page="files">
                <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span class="mobile-nav-label">文件</span>
            </a>
            <a href="#" class="mobile-nav-item mobile-nav-add" onclick="showQuickActions(); return false;">
                <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </a>
            <a href="#" class="mobile-nav-item" onclick="loadPage('cron'); return false;" data-page="cron">
                <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span class="mobile-nav-label">任务</span>
            </a>
            <a href="#" class="mobile-nav-item" onclick="loadPage('souleditor'); return false;" data-page="souleditor">
                <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span class="mobile-nav-label">人格</span>
            </a>
        </nav>
        ` : ''}
    `;
    
    // Desktop: ensure sidebar is always visible, hide overlay
    if (!isMobile) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
    
    // Fetch workspaces first, then render sidebar
    fetchWorkspaces().then(() => {
        renderSidebar();
        loadPage('dashboard');
        fetchStatus();
        setInterval(fetchStatus, 30000);
    });
}

// Update mobile bottom nav active state
function updateMobileNav(page) {
    const mobileNav = document.getElementById('mobile-bottom-nav');
    if (!mobileNav) return;
    
    mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
}

// Show quick actions menu
function showQuickActions() {
    showNotification('快速操作：新建任务、上传文件等功能即将上线', 'info');
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when sidebar is open
    if (isOpen) {
        document.body.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
    } else {
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    }
}

// Close mobile menu
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
}

// Initialize mobile swipe gestures
function initMobileGestures() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 80;
    
    // Swipe to close sidebar
    sidebar.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    sidebar.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    // Swipe to open sidebar from edge
    document.addEventListener('touchstart', (e) => {
        if (e.changedTouches[0].screenX < 20) {
            touchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (touchStartX < 20) {
            touchEndX = e.changedTouches[0].screenX;
            handleEdgeSwipe();
        }
    }, { passive: true });
    
    function handleSwipe() {
        const distance = touchEndX - touchStartX;
        if (distance < -minSwipeDistance && sidebar.classList.contains('open')) {
            closeMobileMenu();
        }
    }
    
    function handleEdgeSwipe() {
        const distance = touchEndX - touchStartX;
        if (distance > minSwipeDistance && !sidebar.classList.contains('open')) {
            toggleMobileMenu();
        }
    }
}

// API helper with auth
async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        }
    });
    if (response.status === 401) {
        logout();
        return null;
    }
    return response;
}

// Fetch available workspaces
async function fetchWorkspaces() {
    const response = await apiFetch(`${API_URL}/workspaces`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        availableWorkspaces = data.workspaces;
        renderSidebar();
    }
}

// Switch workspace
function switchWorkspace(workspaceId) {
    currentWorkspace = workspaceId;
    localStorage.setItem('ocm_workspace', workspaceId);
    // Reload current page data
    loadPage(currentPage);
}

// Fetch status
async function fetchStatus() {
    const response = await apiFetch(`${API_URL}/status?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        status = data.data;
        if (currentPage === 'dashboard') renderDashboard();
        updateLastRefresh();
    }
}

// Fetch files
async function fetchFiles() {
    showLoading('files-content');
    const response = await apiFetch(`${API_URL}/files?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        files = data.files;
        renderFilesPage();
    }
}

// Fetch crons
async function fetchCrons() {
    showLoading('cron-content');
    const response = await apiFetch(`${API_URL}/crons?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        crons = data.crons || [];
        renderCronPage();
    }
}

// Fetch users
async function fetchUsers() {
    showLoading('users-content');
    const response = await apiFetch(`${API_URL}/users?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        users = data.users;
        renderUsersPage();
    }
}

// Fetch skills
async function fetchSkills() {
    showLoading('skills-content');
    const response = await apiFetch(`${API_URL}/skills?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        skills = data.skills || [];
        renderSkillsPage();
    }
}

// Fetch logs
async function fetchLogs(lines = 100, level = 'all') {
    showLoading('logs-content');
    const response = await apiFetch(`${API_URL}/logs?lines=${lines}&level=${level}&workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        logs = data.logs || [];
        renderLogsPage();
    }
}

// Fetch config
async function fetchConfig() {
    showLoading('config-content');
    const response = await apiFetch(`${API_URL}/config?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        config = data.config || {};
        renderConfigPage();
    }
}

// Save config
async function saveConfig(newConfig) {
    const response = await apiFetch(`${API_URL}/config?workspace=${currentWorkspace}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
    });
    if (response) {
        showToast('配置已保存', 'success');
    }
}

// Fetch backups
async function fetchBackups() {
    showLoading('backups-content');
    const response = await apiFetch(`${API_URL}/backups?workspace=${currentWorkspace}`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        backups = data.backups || [];
        renderBackupsPage();
    }
}

// Create backup
async function createBackup(uploadToDrive = false) {
    const btnId = uploadToDrive ? 'create-drive-backup-btn' : 'create-backup-btn';
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = uploadToDrive ? 
            '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span>上传中...' : 
            '创建中...';
    }
    
    const url = `${API_URL}/backups/create?workspace=${currentWorkspace}${uploadToDrive ? '&drive=true' : ''}`;
    const response = await apiFetch(url, { method: 'POST' });
    
    if (response) {
        const data = await response.json();
        if (data.success) {
            let message = `备份创建成功: ${data.name}`;
            if (data.drive && data.drive.url) {
                message += `\n\n已上传到 Google Drive，点击查看: ${data.drive.url}`;
            }
            showNotification(message, 'success');
            fetchBackups();
        } else {
            showNotification('备份失败: ' + (data.error || '未知错误'), 'error');
        }
    }
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = uploadToDrive ? 
            `${icon('cloud', 16)} 备份到 Google Drive` : 
            `${icon('backup', 16)} 创建本地备份`;
    }
}

// Delete backup
async function deleteBackup(backupName) {
    showConfirm(
        '删除备份',
        `确定要删除备份 "${backupName}" 吗？此操作不可恢复。`,
        async () => {
            const response = await apiFetch(
                `${API_URL}/backups/${encodeURIComponent(backupName)}?workspace=${currentWorkspace}`,
                { method: 'DELETE' }
            );
            
            if (response) {
                const data = await response.json();
                if (data.success) {
                    showToast('备份已删除', 'success');
                    fetchBackups();
                } else {
                    showToast('删除失败: ' + (data.error || '未知错误'), 'error');
                }
            }
        },
        '删除',
        '取消',
        'danger'
    );
}

// Export backup to NAS
async function exportBackupToNas(backupName) {
    showConfirm(
        '导出到 NAS',
        `确定要将 "${backupName}" 导出到 NAS 吗？`,
        async () => {
            const response = await apiFetch(
                `${API_URL}/backups/${encodeURIComponent(backupName)}/export-nas?workspace=${currentWorkspace}`,
                { method: 'POST' }
            );
            
            if (response) {
                const data = await response.json();
                if (data.success) {
                    showToast('已导出到 NAS: ' + data.nasPath, 'success');
                } else {
                    showToast('导出失败: ' + (data.error || '未知错误'), 'error');
                }
            }
        },
        '导出',
        '取消',
        'primary'
    );
}

// ==================== Unified Dialog System ====================

// Show custom confirm dialog
function showConfirm(title, message, onConfirm, confirmText = '确认', cancelText = '取消', type = 'danger') {
    closeAllDialogs();
    
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
        <div class="dialog dialog-confirm">
            <div class="dialog-header">
                <div class="dialog-icon dialog-icon-${type}">${type === 'danger' ? '⚠️' : type === 'warning' ? '⚡' : '💡'}</div>
                <h3 class="dialog-title">${title}</h3>
                <button class="dialog-close" onclick="closeAllDialogs()">✕</button>
            </div>
            <div class="dialog-body">
                <p class="dialog-message">${message}</p>
            </div>
            <div class="dialog-actions">
                <button class="btn btn-secondary" onclick="closeAllDialogs()">${cancelText}</button>
                <button class="btn btn-${type}" id="dialog-confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('dialog-confirm-btn').addEventListener('click', async () => {
        closeAllDialogs();
        await onConfirm();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllDialogs();
    });
}

// Show alert dialog
function showAlert(title, message, type = 'info') {
    closeAllDialogs();
    
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
        <div class="dialog dialog-alert">
            <div class="dialog-header">
                <div class="dialog-icon dialog-icon-${type}">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                <h3 class="dialog-title">${title}</h3>
                <button class="dialog-close" onclick="closeAllDialogs()">✕</button>
            </div>
            <div class="dialog-body">
                <p class="dialog-message">${message}</p>
            </div>
            <div class="dialog-actions">
                <button class="btn btn-primary" onclick="closeAllDialogs()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllDialogs();
    });
}

// Close all dialogs
function closeAllDialogs() {
    document.querySelectorAll('.dialog-overlay, .confirm-dialog-overlay, .modal-overlay').forEach(el => el.remove());
}

// Legacy compatibility
function showConfirmDialog(title, message, onConfirm) {
    showConfirm(title, message, onConfirm, '确认重启', '取消', 'danger');
}

function closeConfirmDialog() {
    closeAllDialogs();
}

// Restart gateway
async function restartGateway() {
    showConfirmDialog(
        '重启 Gateway',
        '确定要重启 OpenClaw Gateway 吗？<br><br><strong>警告：</strong>这将断开所有正在进行的会话，可能导致数据丢失。',
        async () => {
            const response = await apiFetch(`${API_URL}/gateway/restart`, { method: 'POST' });
            if (response) {
                const data = await response.json();
                if (data.success) {
                    showNotification('Gateway 重启命令已发送，请等待几秒钟后刷新页面。', 'success');
                }
            }
        }
    );
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fetch agents
async function fetchAgents() {
    showLoading('agents-content');
    const response = await apiFetch(`${API_URL}/agents`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        agents = data.agents || [];
        renderAgentsPage();
    }
}

// Send message to agent
async function sendMessageToAgent(agentId) {
    const message = prompt(`发送消息给 ${agentId}:`);
    if (!message) return;
    
    const response = await apiFetch(`${API_URL}/agents/${encodeURIComponent(agentId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    
    if (response) {
        showToast('消息已发送', 'success');
    }
}

// Load page
function loadPage(page) {
    currentPage = page;
    renderMainContent();
    updateActiveNav();
    updateMobileNav(page);
    
    // Close mobile menu after navigation
    if (window.innerWidth <= 768) {
        closeMobileMenu();
    }
    
    if (page === 'dashboard') fetchStatus();
    else if (page === 'files') fetchFiles();
    else if (page === 'cron') fetchCrons();
    else if (page === 'users') fetchUsers();
    else if (page === 'skills') fetchSkills();
    else if (page === 'logs') fetchLogs();
    else if (page === 'config') fetchConfig();
    else if (page === 'backups') fetchBackups();
    else if (page === 'agents') fetchAgents();
    else if (page === 'conversations') fetchConversations();
    else if (page === 'analytics') fetchAnalytics();
    else if (page === 'souleditor') fetchSoulEditor();
    else if (page === 'gateway') fetchGatewayInfo();
}

// Render sidebar
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    // Build workspace selector options
    const workspaceOptions = availableWorkspaces.map(ws => 
        `<option value="${ws.id}" ${currentWorkspace === ws.id ? 'selected' : ''}>${ws.name}</option>`
    ).join('');
    
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="logo">
                <span class="logo-icon">🦞</span>
                <span class="logo-text">OpenClaw</span>
            </div>
            <button class="menu-close" onclick="closeMobileMenu()" style="display: none; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); padding: 4px; margin-left: auto;">✕</button>
        </div>
        <div class="workspace-selector-wrapper">
            <div class="workspace-selector-label">
                <span>🗂️</span>
                <span>Workspace</span>
            </div>
            <select id="workspace-select" class="workspace-selector" onchange="switchWorkspace(this.value)">
                ${workspaceOptions}
            </select>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" onclick="loadPage('dashboard'); return false;" data-page="dashboard">
                ${icon('dashboard', 20)}
                <span class="nav-text">概览</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'files' ? 'active' : ''}" onclick="loadPage('files'); return false;" data-page="files">
                ${icon('files', 20)}
                <span class="nav-text">文件管理</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'cron' ? 'active' : ''}" onclick="loadPage('cron'); return false;" data-page="cron">
                ${icon('cron', 20)}
                <span class="nav-text">定时任务</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'users' ? 'active' : ''}" onclick="loadPage('users'); return false;" data-page="users">
                ${icon('users', 20)}
                <span class="nav-text">用户管理</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'skills' ? 'active' : ''}" onclick="loadPage('skills'); return false;" data-page="skills">
                ${icon('skills', 20)}
                <span class="nav-text">技能管理</span>
            </a>
        </nav>
        <div class="sidebar-section-title">系统设置</div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item ${currentPage === 'logs' ? 'active' : ''}" onclick="loadPage('logs'); return false;" data-page="logs">
                ${icon('logs', 20)}
                <span class="nav-text">日志查看器</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'config' ? 'active' : ''}" onclick="loadPage('config'); return false;" data-page="config">
                ${icon('settings', 20)}
                <span class="nav-text">系统配置</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'backups' ? 'active' : ''}" onclick="loadPage('backups'); return false;" data-page="backups">
                ${icon('backup', 20)}
                <span class="nav-text">备份管理</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'agents' ? 'active' : ''}" onclick="loadPage('agents'); return false;" data-page="agents">
                ${icon('agent', 20)}
                <span class="nav-text">Agent 监控</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'gateway' ? 'active' : ''}" onclick="loadPage('gateway'); return false;" data-page="gateway">
                ${icon('gateway', 20)}
                <span class="nav-text">Gateway 管理</span>
            </a>
        </nav>
        <div class="sidebar-section-title">高级功能</div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item ${currentPage === 'analytics' ? 'active' : ''}" onclick="loadPage('analytics'); return false;" data-page="analytics">
                ${icon('chart', 20)}
                <span class="nav-text">性能分析</span>
            </a>
            <a href="#" class="nav-item ${currentPage === 'souleditor' ? 'active' : ''}" onclick="loadPage('souleditor'); return false;" data-page="souleditor">
                ${icon('brain', 20)}
                <span class="nav-text">人格编辑器</span>
            </a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                ${icon('user', 18)}
                <span class="user-name">${currentUser?.username || 'User'}</span>
            </div>
            <button class="logout-btn" onclick="logout()">退出登录</button>
            <button class="darkmode-btn" id="darkmode-toggle" onclick="toggleDarkMode()">
                ${darkMode ? icon('sun', 18) : icon('moon', 18)}
                <span>${darkMode ? '浅色模式' : '深色模式'}</span>
            </button>
            <div class="last-refresh" id="last-refresh">--:--:--</div>
        </div>
    `;
}

// Render main content
function renderMainContent() {
    const main = document.getElementById('main-content');
    const titles = {
        dashboard: ['仪表盘', '系统概览与实时监控'],
        files: ['文件管理', '浏览和管理 Workspace 文件'],
        cron: ['定时任务', '管理 OpenClaw 定时任务'],
        users: ['用户管理', '管理系统用户和权限'],
        skills: ['技能管理', '查看已安装的 Agent Skills'],
        logs: ['日志查看器', '查看系统运行日志'],
        config: ['系统配置', '管理 OpenClaw 配置文件'],
        backups: ['备份管理', '创建和恢复系统备份'],
        agents: ['Agent 监控', '查看所有 Agent 运行状态'],
        analytics: ['性能分析', 'Token 使用统计和趋势'],
        souleditor: ['人格与配置', '编辑 SOUL、MEMORY、USER、IDENTITY'],
        gateway: ['Gateway 管理', '查看 Gateway 状态和配置']
    };
    
    main.innerHTML = `
        <button class="menu-toggle" onclick="toggleMobileMenu()" aria-label="打开菜单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeMobileMenu()"></div>
        <header class="page-header">
            <div class="page-header-left">
                <h1>${titles[currentPage][0]}</h1>
                <p class="page-subtitle">${titles[currentPage][1]}</p>
            </div>
            <button class="btn btn-danger restart-btn" onclick="restartGateway()" title="重启 Gateway">
                ${icon('refresh', 16)} 重启 Gateway
            </button>
        </header>
        <div id="${currentPage}-content">
            ${currentPage === 'dashboard' ? 
                '<div class="dashboard-grid">' + renderStatCardsSkeleton() + '</div>' :
                '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>'
            }
        </div>
    `;
}

// Render stat cards skeleton
function renderStatCardsSkeleton() {
    return Array(4).fill('<div class="stat-card"><div class="skeleton" style="height: 100px;"></div></div>').join('');
}

// Render dashboard - optimized
function renderDashboard() {
    if (!status) return;
    
    const container = document.getElementById('dashboard-content');
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">活跃会话</span>
                    <div class="stat-icon icon-blue">${icon('sessions', 24)}</div>
                </div>
                <div class="stat-value">${status.sessions.active}</div>
                <div class="stat-subtitle">总计 ${status.sessions.count} 个会话</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">定时任务</span>
                    <div class="stat-icon icon-purple">${icon('cron', 24)}</div>
                </div>
                <div class="stat-value">${status.crons.count}</div>
                <div class="stat-subtitle">已配置的任务数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">网关状态</span>
                    <div class="stat-icon icon-green">${icon('gateway', 24)}</div>
                </div>
                <div class="stat-value" style="font-size: 24px; margin-top: 12px;">
                    ${status.gateway === 'running' ? '<span class="text-success">运行中</span>' : '<span class="text-danger">已停止</span>'}
                </div>
                <div class="stat-subtitle">Gateway 服务状态</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">磁盘使用</span>
                    <div class="stat-icon icon-orange">${icon('disk', 24)}</div>
                </div>
                <div class="stat-value" style="font-size: 24px; margin-top: 12px;">${status.disk.percent || '-'}</div>
                <div class="stat-subtitle">${status.disk ? `${status.disk.used} / ${status.disk.total}` : ''}</div>
            </div>
        </div>
        <div class="quick-actions">
            <h3>快速操作</h3>
            <div class="action-buttons">
                <button class="action-btn-large" onclick="loadPage('files')">
                    ${icon('files', 24)}
                    <span>管理文件</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('cron')">
                    ${icon('cron', 24)}
                    <span>管理定时任务</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('users')">
                    ${icon('users', 24)}
                    <span>管理用户</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('skills')">
                    ${icon('skills', 24)}
                    <span>管理技能</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('agents')">
                    ${icon('agent', 24)}
                    <span>监控 Agent</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('logs')">
                    ${icon('logs', 24)}
                    <span>查看日志</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('config')">
                    ${icon('settings', 24)}
                    <span>系统配置</span>
                </button>
                <button class="action-btn-large" onclick="loadPage('backups')">
                    ${icon('backup', 24)}
                    <span>备份管理</span>
                </button>
            </div>
        </div>
    `;
}

// Render files page
function renderFilesPage() {
    const container = document.getElementById('files-content');
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchFiles()">${icon('refresh', 16)} 刷新</button>
            <span class="file-count">共 ${countFiles(files)} 个项目</span>
        </div>
        <div class="file-browser">
            <div class="file-list-header">
                <span class="col-name">名称</span>
                <span class="col-size">大小</span>
                <span class="col-date">修改时间</span>
                <span class="col-action">操作</span>
            </div>
            <div class="file-list">${renderFileTree(files, 0)}</div>
        </div>
    `;
}

// Count files
function countFiles(fileList) {
    let count = 0;
    for (const f of fileList || []) {
        count++;
        if (f.children) count += countFiles(f.children);
    }
    return count;
}

// Render file tree
function renderFileTree(fileList, level) {
    if (!fileList?.length) return '<div class="empty-state"><p>暂无文件</p></div>';
    
    return fileList.map(file => {
        const isDir = file.type === 'directory';
        const isExpanded = expandedDirs[file.path];
        const paddingLeft = 16 + level * 24;
        const rowId = 'file-' + btoa(file.path).replace(/[^a-zA-Z0-9]/g, '');
        
        let html = `
            <div class="file-row ${isDir ? 'directory' : 'file'}" id="${rowId}" style="padding-left: ${paddingLeft}px">
                <span class="col-name">
                    ${isDir ? `<span class="expand-btn" onclick="toggleDir('${file.path}')">${isExpanded ? icon('arrowDown', 14) : icon('arrowRight', 14)}</span>` : '<span class="expand-placeholder"></span>'}
                    ${icon(isDir ? 'folder' : 'file', 18)}
                    <span class="file-name-text">${file.name}</span>
                </span>
                <span class="col-size">${isDir ? '--' : formatSize(file.size)}</span>
                <span class="col-date">${formatDate(file.modified)}</span>
                <span class="col-action">
                    ${!isDir ? `
                        <button class="btn-icon" onclick="downloadFile('${file.path}')" title="下载">${icon('download', 16)}</button>
                        <button class="btn-icon danger" onclick="deleteFile('${file.path}', '${rowId}')" title="删除">${icon('delete', 16)}</button>
                    ` : ''}
                </span>
            </div>
        `;
        
        if (isDir && isExpanded && file.children) {
            html += renderFileTree(file.children, level + 1);
        }
        return html;
    }).join('');
}

// Toggle directory
function toggleDir(path) {
    expandedDirs[path] = !expandedDirs[path];
    renderFilesPage();
}

// Format schedule for display
function formatSchedule(schedule) {
    if (!schedule) return '未知';
    if (typeof schedule === 'string') return schedule;
    
    switch (schedule.kind) {
        case 'every':
            const minutes = Math.floor(schedule.everyMs / 60000);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                return `每 ${hours} 小时`;
            }
            return `每 ${minutes} 分钟`;
        case 'cron':
            return `Cron: ${schedule.expr}`;
        case 'at':
            return `一次性: ${new Date(schedule.at).toLocaleString('zh-CN')}`;
        default:
            return JSON.stringify(schedule);
    }
}

// Format payload for display
function formatPayload(payload) {
    if (!payload) return '无';
    if (payload.kind === 'systemEvent') {
        return `系统事件: ${payload.text?.substring(0, 50)}...`;
    }
    if (payload.kind === 'agentTurn') {
        return `Agent 执行: ${payload.message?.substring(0, 50)}...`;
    }
    return JSON.stringify(payload, null, 2);
}

// Render cron page
function renderCronPage() {
    const container = document.getElementById('cron-content');
    if (!crons?.length) {
        container.innerHTML = `
            <div class="toolbar">
                <button class="btn btn-secondary" onclick="fetchCrons()">${Icons.refresh} 刷新</button>
            </div>
            <div class="empty-state large">
                <div class="empty-icon">⏰</div>
                <h3>暂无定时任务</h3>
                <p>当前没有配置任何定时任务</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchCrons()">${icon('refresh', 16)} 刷新</button>
            <span class="cron-count">共 ${crons.length} 个任务</span>
        </div>
        <div class="cron-list">
            ${crons.map(cron => `
                <div class="cron-card" data-cron-id="${cron.id}">
                    <div class="cron-info">
                        <div class="cron-name">${cron.name || cron.id}</div>
                        <div class="cron-meta">
                            <span class="cron-schedule">${formatSchedule(cron.schedule)}</span>
                            <span class="cron-id">ID: ${cron.id}</span>
                        </div>
                    </div>
                    <div class="cron-status-badge ${cron.enabled ? 'enabled' : 'disabled'}">${cron.enabled ? '● 已启用' : '○ 已禁用'}</div>
                    <div class="cron-actions">
                        <button class="btn btn-sm btn-secondary" onclick="showCronDetail('${cron.id}')">详情</button>
                        <button class="btn btn-sm ${cron.enabled ? 'btn-secondary' : 'btn-primary'}" onclick="toggleCron('${cron.id}', ${!cron.enabled})">${cron.enabled ? '禁用' : '启用'}</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCron('${cron.id}')">删除</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show cron detail modal
function showCronDetail(cronId) {
    const cron = crons.find(c => c.id === cronId);
    if (!cron) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal cron-detail-modal" style="max-width: 720px;">
            <div class="modal-header">
                <h3>定时任务详情</h3>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>任务名称</label>
                    <input type="text" id="edit-cron-name" value="${escapeHtml(cron.name || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>调度类型</label>
                        <select  id="edit-cron-schedule-kind" onchange="onScheduleKindChange()">
                            <option value="every" ${cron.schedule?.kind === 'every' ? 'selected' : ''}>周期性 (every)</option>
                            <option value="cron" ${cron.schedule?.kind === 'cron' ? 'selected' : ''}>Cron 表达式</option>
                            <option value="at" ${cron.schedule?.kind === 'at' ? 'selected' : ''}>一次性 (at)</option>
                        </select>
                    </div>
                    <div class="form-group" id="schedule-value-container">
                        ${renderScheduleValueInput(cron.schedule)}
                    </div>
                </div>
                <div class="form-group">
                    <label>执行目标</label>
                    <select  id="edit-cron-target">
                        <option value="main" ${cron.sessionTarget === 'main' ? 'selected' : ''}>主会话 (main)</option>
                        <option value="isolated" ${cron.sessionTarget === 'isolated' ? 'selected' : ''}>独立会话 (isolated)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>唤醒模式</label>
                    <select  id="edit-cron-wake">
                        <option value="now" ${cron.wakeMode === 'now' ? 'selected' : ''}>立即 (now)</option>
                        <option value="next-heartbeat" ${cron.wakeMode === 'next-heartbeat' ? 'selected' : ''}>下次心跳 (next-heartbeat)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Payload 类型</label>
                    <select  id="edit-cron-payload-kind" onchange="onPayloadKindChange()">
                        <option value="systemEvent" ${cron.payload?.kind === 'systemEvent' ? 'selected' : ''}>系统事件</option>
                        <option value="agentTurn" ${cron.payload?.kind === 'agentTurn' ? 'selected' : ''}>Agent 执行</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>内容/消息</label>
                    <textarea  id="edit-cron-payload-text" rows="4">${escapeHtml(cron.payload?.text || cron.payload?.message || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>状态信息</label>
                    <div class="info-box">
                        <p><strong>下次运行:</strong> ${cron.state?.nextRunAtMs ? new Date(cron.state.nextRunAtMs).toLocaleString('zh-CN') : '未知'}</p>
                        <p><strong>上次运行:</strong> ${cron.state?.lastRunAtMs ? new Date(cron.state.lastRunAtMs).toLocaleString('zh-CN') : '从未'}</p>
                        <p><strong>上次状态:</strong> ${cron.state?.lastStatus || '未知'}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-glass" onclick="closeModal()">取消</button>
                <button class="btn btn-primary" onclick="saveCronEdit('${cron.id}')">保存修改</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Render schedule value input based on kind
function renderScheduleValueInput(schedule) {
    if (!schedule) return '<input type="text"  id="edit-cron-schedule-value" placeholder="请输入值">';
    
    switch (schedule.kind) {
        case 'every':
            const minutes = Math.floor((schedule.everyMs || 0) / 60000);
            return `
                <label>间隔 (分钟)</label>
                <input type="number"  id="edit-cron-schedule-value" value="${minutes}" min="1">
            `;
        case 'cron':
            return `
                <label>Cron 表达式</label>
                <input type="text"  id="edit-cron-schedule-value" value="${escapeHtml(schedule.expr || '')}" placeholder="0 9 * * *">
            `;
        case 'at':
            return `
                <label>执行时间</label>
                <input type="datetime-local"  id="edit-cron-schedule-value" value="${schedule.at ? new Date(schedule.at).toISOString().slice(0, 16) : ''}">
            `;
        default:
            return '<input type="text"  id="edit-cron-schedule-value">';
    }
}

// Handle schedule kind change
function onScheduleKindChange() {
    const kind = document.getElementById('edit-cron-schedule-kind').value;
    const container = document.getElementById('schedule-value-container');
    container.innerHTML = renderScheduleValueInput({ kind });
}

// Handle payload kind change
function onPayloadKindChange() {
    // Could update placeholder or help text based on selection
}

// Save cron edit
async function saveCronEdit(cronId) {
    try {
        const name = document.getElementById('edit-cron-name').value;
        const scheduleKind = document.getElementById('edit-cron-schedule-kind').value;
        const scheduleValue = document.getElementById('edit-cron-schedule-value').value;
        const sessionTarget = document.getElementById('edit-cron-target').value;
        const wakeMode = document.getElementById('edit-cron-wake').value;
        const payloadKind = document.getElementById('edit-cron-payload-kind').value;
        const payloadText = document.getElementById('edit-cron-payload-text').value;
        
        // Build schedule object
        let schedule;
        switch (scheduleKind) {
            case 'every':
                schedule = { kind: 'every', everyMs: parseInt(scheduleValue) * 60000 };
                break;
            case 'cron':
                schedule = { kind: 'cron', expr: scheduleValue, tz: 'Asia/Shanghai' };
                break;
            case 'at':
                schedule = { kind: 'at', at: new Date(scheduleValue).toISOString() };
                break;
        }
        
        // Build payload
        const payload = {
            kind: payloadKind,
            [payloadKind === 'systemEvent' ? 'text' : 'message']: payloadText
        };
        
        const response = await apiFetch(`${API_URL}/crons/${cronId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, schedule, sessionTarget, wakeMode, payload })
        });
        
        if (response.success) {
            showToast('定时任务更新成功', 'success');
            closeModal();
            fetchCrons();
        } else {
            showToast('更新失败: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('保存定时任务失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// Render users page
function renderUsersPage() {
    const container = document.getElementById('users-content');
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-primary" onclick="showAddUserModal()">${icon('add', 16)} 添加用户</button>
            <span class="user-count">共 ${users.length} 个用户</span>
        </div>
        <div class="users-list">
            ${users.map(user => `
                <div class="user-card">
                    <div class="user-info">
                        <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <div class="user-name">${user.username} ${user.isAdmin ? '<span class="admin-badge">管理员</span>' : ''}</div>
                            <div class="user-meta">创建于 ${formatDate(user.createdAt)}</div>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-sm btn-secondary" onclick="showChangePasswordModal('${user.username}')">${Icons.lock} 修改密码</button>
                        ${user.username !== currentUser?.username ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.username}')">${Icons.delete} 删除</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show add user modal
function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>添加新用户</h3>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <form onsubmit="handleAddUser(event)">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="new-username" required placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="new-password" required placeholder="至少6个字符">
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="new-is-admin">
                        <span>设为管理员</span>
                    </label>
                </div>
                <div id="add-user-error" class="error-text"></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">添加</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show change password modal
function showChangePasswordModal(username) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>修改密码 - ${username}</h3>
                <button class="modal-close" onclick="closeModal()">${Icons.close}</button>
            </div>
            <form onsubmit="handleChangePassword(event, '${username}')">
                <div class="form-group">
                    <label>新密码</label>
                    <input type="password" id="new-password" required placeholder="至少6个字符">
                </div>
                <div id="change-password-error" class="error-text"></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Handle add user
async function handleAddUser(e) {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const isAdmin = document.getElementById('new-is-admin').checked;
    const errorEl = document.getElementById('add-user-error');
    
    const response = await apiFetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, isAdmin })
    });
    if (!response) return;
    
    const data = await response.json();
    if (data.success) {
        closeModal();
        fetchUsers();
    } else {
        errorEl.textContent = data.error;
    }
}

// Handle change password
async function handleChangePassword(e, username) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const errorEl = document.getElementById('change-password-error');
    
    const response = await apiFetch(`${API_URL}/users/${username}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
    });
    if (!response) return;
    
    const data = await response.json();
    if (data.success) {
        closeModal();
        showToast('密码修改成功', 'success');
    } else {
        errorEl.textContent = data.error;
    }
}

// Delete user
async function deleteUser(username) {
    showConfirm('确认删除', `确定要删除用户 "${username}" 吗？`, async () => {
        const response = await apiFetch(`${API_URL}/users/${username}`, { method: 'DELETE' });
        if (!response) return;
        
        const data = await response.json();
        if (data.success) {
            fetchUsers();
        } else {
            showToast(data.error, 'error');
        }
    }, '删除', '取消', 'danger');
}

// Download file
async function downloadFile(filepath) {
    try {
        const response = await apiFetch(`${API_URL}/files/${encodeURIComponent(filepath)}/download`);
        if (!response) return;
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filepath.split('/').pop();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        showNotification('下载失败: ' + error.message, 'error');
    }
}

// Delete file - frontend only, async backend
async function deleteFile(filepath, rowId) {
    showConfirm('确认删除', `确定要删除 "${filepath}" 吗？`, () => {
        // Remove from UI immediately
        const row = document.getElementById(rowId);
        if (row) {
            row.style.opacity = '0.5';
            row.style.textDecoration = 'line-through';
            setTimeout(() => row.remove(), 300);
        }
        
        // Send delete request in background
        apiFetch(`${API_URL}/files/${encodeURIComponent(filepath)}`, { method: 'DELETE' }).catch(() => {});
    }, '删除', '取消', 'danger');
}

// Toggle cron
async function toggleCron(id, enabled) {
    const response = await apiFetch(`${API_URL}/crons/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
    });
    if (response) fetchCrons();
}

// Delete cron
async function deleteCron(id) {
    showConfirm('确认删除', '确定要删除这个定时任务吗？', async () => {
        const response = await apiFetch(`${API_URL}/crons/${id}`, { method: 'DELETE' });
        if (response) fetchCrons();
    }, '删除', '取消', 'danger');
}

// Delete skill
async function deleteSkill(skillName) {
    showConfirm(
        '删除技能',
        `确定要删除技能 "${skillName}" 吗？<br><br><strong>此操作不可恢复。</strong>`,
        async () => {
            const response = await apiFetch(`${API_URL}/skills/${encodeURIComponent(skillName)}`, { method: 'DELETE' });
            if (response) {
                showNotification(`技能 "${skillName}" 已删除`, 'success');
                fetchSkills();
            }
        },
        '删除',
        '取消',
        'danger'
    );
}

// Render skills page
// Render individual skill card
function renderSkillCard(skill) {
    const scopeBadge = skill.scope === 'global' 
        ? '<span class="scope-badge global">🌍 全局</span>'
        : `<span class="scope-badge workspace">📂 ${skill.scopeName}</span>`;
    
    const authorBadge = skill.author && skill.author !== '-' 
        ? `<span class="skill-author-badge" title="作者：${skill.author}">✍️ ${skill.author}</span>`
        : '';
    
    return `
        <div class="skill-card">
            <div class="skill-header">
                <div class="skill-icon">🧩</div>
                <div class="skill-info">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div class="skill-name">${skill.name}</div>
                        ${scopeBadge}
                    </div>
                    <div class="skill-meta">
                        ${skill.version !== '-' ? `<span class="skill-version">v${skill.version}</span>` : ''}
                        ${authorBadge}
                    </div>
                </div>
            </div>
            <div class="skill-description">${skill.description}</div>
            <div class="skill-footer">
                <div class="skill-path" title="${skill.workspace}">📍 ${skill.workspace}</div>
                <button class="btn-icon danger" onclick="deleteSkill('${skill.name}')" title="删除技能">${icon('delete', 16)}</button>
            </div>
        </div>
    `;
}

function renderSkillsPage() {
    const container = document.getElementById('skills-content');
    
    if (!skills || skills.length === 0) {
        container.innerHTML = `
            <div class="toolbar">
                <button class="btn btn-secondary" onclick="fetchSkills()">${icon('refresh', 16)} 刷新</button>
            </div>
            <div class="empty-state large">
                <div class="empty-icon">🧩</div>
                <h3>暂无技能</h3>
                <p>当前没有安装任何技能</p>
            </div>
        `;
        return;
    }
    
    // Group skills by scope
    const globalSkills = skills.filter(s => s.scope === 'global');
    const workspaceSkills = skills.filter(s => s.scope === 'workspace');
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchSkills()">${icon('refresh', 16)} 刷新</button>
            <span class="skill-count">共 ${skills.length} 个技能（全局 ${globalSkills.length} 个，工作空间 ${workspaceSkills.length} 个）</span>
        </div>
        
        ${globalSkills.length > 0 ? `
        <div class="skills-section">
            <h3 class="skills-section-title">🌍 全局技能 <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(${globalSkills.length} 个)</span></h3>
            <div class="skills-grid">
                ${globalSkills.map(skill => renderSkillCard(skill)).join('')}
            </div>
        </div>
        ` : ''}
        
        ${workspaceSkills.length > 0 ? `
        <div class="skills-section">
            <h3 class="skills-section-title">📂 工作空间技能 <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">(${workspaceSkills.length} 个)</span></h3>
            <div class="skills-grid">
                ${workspaceSkills.map(skill => renderSkillCard(skill)).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

// Render logs page
function renderLogsPage() {
    const container = document.getElementById('logs-content');
    
    const logContent = logs.length > 0 
        ? logs.map(line => `<div class="log-line">${escapeHtml(line)}</div>`).join('')
        : '<div class="empty-state"><p>暂无日志</p></div>';
    
    container.innerHTML = `
        <div class="toolbar">
            <div class="log-filters">
                <select id="log-level" onchange="fetchLogs(100, this.value)">
                    <option value="all">全部级别</option>
                    <option value="error">错误</option>
                    <option value="warn">警告</option>
                    <option value="info">信息</option>
                </select>
                <select id="log-lines" onchange="fetchLogs(this.value, document.getElementById('log-level').value)">
                    <option value="50">最近 50 行</option>
                    <option value="100" selected>最近 100 行</option>
                    <option value="200">最近 200 行</option>
                    <option value="500">最近 500 行</option>
                </select>
            </div>
            <button class="btn btn-secondary" onclick="fetchLogs()">${icon('refresh', 16)} 刷新</button>
        </div>
        <div class="log-container">${logContent}</div>
    `;
}

// Render config page
function renderConfigPage() {
    const container = document.getElementById('config-content');
    
    if (config.error) {
        container.innerHTML = `<div class="error-message">无法加载配置: ${config.error}</div>`;
        return;
    }
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-primary" onclick="saveConfigFromEditor()">${icon('save', 16)} 保存配置</button>
        </div>
        <div class="config-editor">
            <textarea id="config-textarea" class="config-textarea">${JSON.stringify(config, null, 2)}</textarea>
        </div>
        <div class="config-hint">
            <p>提示：修改配置前会自动创建备份。保存后需要重启 OpenClaw 服务才能生效。</p>
        </div>
    `;
}

// Save config from editor
async function saveConfigFromEditor() {
    const textarea = document.getElementById('config-textarea');
    try {
        const newConfig = JSON.parse(textarea.value);
        await saveConfig(newConfig);
    } catch (e) {
        showToast('JSON 格式错误: ' + e.message, 'error');
    }
}

// Render backups page
function renderBackupsPage() {
    const container = document.getElementById('backups-content');
    
    const backupListHtml = backups && backups.length > 0 ? `
        <div class="backups-list">
            ${backups.map(backup => `
                <div class="backup-card" style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
                    <div style="display: flex; align-items: center; flex: 1;">
                        <div class="backup-icon" style="margin-right: 12px;">
                            ${backup.driveUrl ? icon('cloud', 20) : icon('backup', 20)}
                        </div>
                        <div class="backup-info">
                            <div class="backup-name">${escapeHtml(backup.name)}</div>
                            <div class="backup-meta" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                <span>${formatDate(backup.created)} · ${formatFileSize(backup.size)}</span>
                                ${backup.driveUrl ? `<a href="${backup.driveUrl}" target="_blank" style="margin-left: 8px; color: var(--theme-primary);">查看云端备份</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-secondary btn-sm" onclick="exportBackupToNas('${escapeHtml(backup.name)}')" title="导出到 NAS">
                            ${icon('upload', 16)} NAS
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBackup('${escapeHtml(backup.name)}')" title="删除备份">
                            ${icon('trash', 16)}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="empty-state large">
            <div class="empty-icon">${icon('backup', 48)}</div>
            <h3>暂无备份</h3>
            <p>点击下方按钮创建第一个备份</p>
        </div>
    `;
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-primary" id="create-backup-btn" onclick="createBackup()">${icon('backup', 16)} 创建本地备份</button>
            <button class="btn btn-secondary" id="create-drive-backup-btn" onclick="createBackup(true)">${icon('cloud', 16)} 备份到 Google Drive</button>
            ${backups && backups.length > 0 ? `<span class="backup-count">共 ${backups.length} 个备份</span>` : ''}
        </div>
        ${backupListHtml}
    `;
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#38ef7d' : type === 'error' ? '#f45c43' : '#4facfe'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Agent name mapping for better display
const agentNameMap = {
    '-5250830344': '代码专家',
    '-4946527554': 'AI工具分享',
    '-5037849780': '写作专家',
    '-5108590635': '服务器管理大师',
    '-5289908426': '资讯收集平台',
    '-1003615302810': '未命名群组',
    '-5177621418': '另一个群组',
    '7277102044': 'Chin Yaku (私聊)',
    'main': '主会话 (Main)'
};

// Format agent name
function formatAgentName(agent) {
    // Check mapped names first
    if (agentNameMap[agent.name]) {
        return agentNameMap[agent.name];
    }
    
    // For cron jobs, show a shortened ID
    if (agent.channel === 'cron') {
        return '定时任务 (' + agent.name.substring(0, 8) + '...)';
    }
    
    // For other cases, return the original name
    return agent.name;
}

// Available agents list
let availableAgents = [];

// Fetch available agents from openclaw agents list
async function fetchAvailableAgents() {
    try {
        const response = await apiFetch(`${API_URL}/agents/list`);
        if (response && response.ok) {
            const data = await response.json();
            if (data.success) {
                availableAgents = data.agents || [];
                console.log('Loaded available agents:', availableAgents);
            }
        }
    } catch (error) {
        console.error('Failed to fetch available agents:', error);
    }
}

// Spawn new session with selected agent
async function spawnAgentSession() {
    const agentId = document.getElementById('agent-select')?.value;
    const task = document.getElementById('spawn-task')?.value;
    const mode = document.getElementById('spawn-mode')?.value;
    const runtime = document.getElementById('spawn-runtime')?.value;
    
    if (!agentId) {
        showToast('请选择一个 Agent', 'warning');
        return;
    }
    
    if (!task || !task.trim()) {
        showToast('请输入任务描述', 'warning');
        return;
    }
    
    try {
        const response = await apiFetch(`${API_URL}/agents/spawn`, {
            method: 'POST',
            body: JSON.stringify({ agentId, task, mode, runtime })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('会话创建成功', 'success');
            document.getElementById('spawn-task').value = '';
            // Refresh agents list
            fetchAgents();
        } else {
            showToast('创建失败: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('请求失败: ' + error.message, 'error');
    }
}

// Render agents page
function renderAgentsPage() {
    const container = document.getElementById('agents-content');
    
    console.log('Rendering agents:', agents);
    
    // Fetch available agents if not loaded
    if (availableAgents.length === 0) {
        fetchAvailableAgents();
    }
    
    container.innerHTML = `
        <!-- Available Agents Section -->
        <div class="available-agents-section" style="margin-bottom: 30px;">
            <div class="glass-card" style="padding: 20px;">
                <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    🤖 可用 Agent
                    <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">
                        (选择 Agent 创建新会话)
                    </span>
                </h3>
                
                <div style="display: grid; gap: 16px;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <select id="agent-select"  style="flex: 1;">
                            <option value="">选择一个 Agent...</option>
                            ${availableAgents.map(agent => `
                                <option value="${agent.id}" 
                                    data-workspace="${agent.workspace || ''}" 
                                    data-model="${agent.model || ''}"
                                    data-rules="${agent.routingRules || 0}">
                                    ${agent.name} ${agent.isDefault ? '(默认)' : ''} - ${agent.identity || '无描述'}
                                </option>
                            `).join('')}
                        </select>
                        <button onclick="showAgentInfo()" class="btn btn-secondary">
                            ${icon('info', 16)} 查看信息
                        </button>
                    </div>
                    
                    <div id="agent-info-panel" style="display: none;" class="info-panel">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
                            <div>
                                <div class="detail-label">工作空间</div>
                                <div class="detail-value" id="agent-workspace">-</div>
                            </div>
                            <div>
                                <div class="detail-label">默认模型</div>
                                <div class="detail-value" id="agent-model">-</div>
                            </div>
                            <div>
                                <div class="detail-label">路由规则</div>
                                <div class="detail-value" id="agent-rules">-</div>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--border); padding-top: 20px;">
                            <h4 style="margin-bottom: 12px;">🚀 创建新会话</h4>
                            <textarea id="spawn-task"  rows="2" 
                                placeholder="输入任务描述，例如：写一篇关于宝宝辅食的文章..." 
                                style="width: 100%; margin-bottom: 12px;"></textarea>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <select id="spawn-mode"  style="width: 150px;">
                                    <option value="run">一次性运行</option>
                                    <option value="session">持久会话</option>
                                </select>
                                <select id="spawn-runtime"  style="width: 120px;">
                                    <option value="subagent">Subagent</option>
                                    <option value="acp">ACP</option>
                                </select>
                                <button onclick="spawnAgentSession()" class="btn btn-success">
                                    ${icon('plus', 16)} 创建会话
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Active Agents Section -->
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchAgents()">${icon('refresh', 16)} 刷新</button>
            <span class="agent-count">共 ${agents.length} 个活跃 Agent</span>
        </div>
        ${agents && agents.length > 0 ? `
        <div class="agents-grid">
            ${agents.map(agent => `
                <div class="agent-card ${agent.status}">
                    <div class="agent-header">
                        <div class="agent-icon">🤖</div>
                        <div class="agent-info">
                            <div class="agent-name" title="ID: ${agent.id}">${formatAgentName(agent)}</div>
                            <div class="agent-meta">
                                <span class="agent-status ${agent.status}">${agent.status === 'active' ? '● 活跃' : '○ 空闲'}</span>
                                <span class="agent-channel">${agent.channel}</span>
                            </div>
                        </div>
                    </div>
                    <div class="agent-details">
                        <div class="agent-detail-row">
                            <span class="detail-label">类型:</span>
                            <span class="detail-value">${agent.kind}</span>
                        </div>
                        <div class="agent-detail-row">
                            <span class="detail-label">模型:</span>
                            <span class="detail-value">${agent.model}</span>
                        </div>
                        <div class="agent-detail-row">
                            <span class="detail-label">Token:</span>
                            <span class="detail-value">${agent.totalTokens.toLocaleString()}</span>
                        </div>
                        <div class="agent-detail-row">
                            <span class="detail-label">更新:</span>
                            <span class="detail-value">${agent.updatedAt}</span>
                        </div>
                    </div>
                    <div class="agent-actions">
                        <button class="btn btn-sm btn-primary" onclick="sendMessageToAgent('${agent.id}')">
                            ${icon('send', 14)} 发送消息
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state large">
            <div class="empty-icon">🤖</div>
            <h3>暂无活跃 Agent</h3>
            <p>可以使用上方的 Agent 选择器创建新会话</p>
        </div>
        `}
    `;
}

// Show agent info panel
function showAgentInfo() {
    const select = document.getElementById('agent-select');
    const selectedOption = select.options[select.selectedIndex];
    const panel = document.getElementById('agent-info-panel');
    
    if (!selectedOption.value) {
        showToast('请先选择一个 Agent', 'warning');
        return;
    }
    
    // Update info panel
    document.getElementById('agent-workspace').textContent = selectedOption.dataset.workspace || '-';
    document.getElementById('agent-model').textContent = selectedOption.dataset.model || '-';
    document.getElementById('agent-rules').textContent = (selectedOption.dataset.rules || '0') + ' 条';
    
    panel.style.display = 'block';
}

// Update active nav
function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === currentPage);
    });
}

// Update last refresh
function updateLastRefresh() {
    const el = document.getElementById('last-refresh');
    if (el) el.textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
}

// Show loading
function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>';
}

// Format size
function formatSize(bytes) {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== 新功能: 会话监控 ====================

let conversations = [];
let selectedConversation = null;

async function fetchConversations() {
    showLoading('conversations-content');
    // Get agents first to populate conversation list
    const response = await apiFetch(`${API_URL}/agents`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        conversations = data.agents || [];
        renderConversationsPage();
    }
}

function renderConversationsPage() {
    const container = document.getElementById('conversations-content');
    
    if (!conversations || conversations.length === 0) {
        container.innerHTML = `
            <div class="toolbar">
                <button class="btn btn-secondary" onclick="fetchConversations()">${icon('refresh', 16)} 刷新</button>
            </div>
            <div class="empty-state large">
                <div class="empty-icon">💬</div>
                <h3>暂无活跃会话</h3>
                <p>当前没有正在进行的对话</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchConversations()">${icon('refresh', 16)} 刷新</button>
            <span class="conversation-count">共 ${conversations.length} 个会话</span>
        </div>
        <div class="conversations-layout">
            <div class="conversations-list">
                ${conversations.map(conv => `
                    <div class="conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}" onclick="selectConversation('${conv.id}')">
                        <div class="conversation-name">${formatAgentName(conv)}</div>
                        <div class="conversation-meta">${conv.channel} · ${conv.status === 'active' ? '活跃' : '空闲'}</div>
                    </div>
                `).join('')}
            </div>
            <div class="conversation-detail" id="conversation-detail">
                ${selectedConversation ? renderConversationDetail(selectedConversation) : '<div class="empty-state"><p>选择一个会话查看详情</p></div>'}
            </div>
        </div>
    `;
}

function selectConversation(id) {
    selectedConversation = conversations.find(c => c.id === id);
    renderConversationsPage();
    if (selectedConversation) {
        loadConversationMessages(selectedConversation.id);
    }
}

function renderConversationDetail(conv) {
    return `
        <div class="conversation-header">
            <h3>${formatAgentName(conv)}</h3>
            <div class="conversation-stats">
                <span>Token: ${conv.totalTokens.toLocaleString()}</span>
                <span>模型: ${conv.model}</span>
            </div>
        </div>
        <div class="conversation-messages" id="conversation-messages">
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载消息中...</p>
            </div>
        </div>
        <div class="conversation-input">
            <input type="text" id="test-message" placeholder="输入测试消息..." />
            <button class="btn btn-primary" onclick="sendTestMessage('${conv.id}')">${icon('send', 16)} 发送</button>
        </div>
    `;
}

async function loadConversationMessages(sessionId) {
    const container = document.getElementById('conversation-messages');
    if (!container) return;
    
    const response = await apiFetch(`${API_URL}/sessions/${encodeURIComponent(sessionId)}/messages?lines=50`);
    if (!response) {
        container.innerHTML = '<div class="empty-state"><p>无法加载消息</p></div>';
        return;
    }
    
    const data = await response.json();
    if (data.success && data.messages.length > 0) {
        container.innerHTML = data.messages.map(m => `
            <div class="message-item ${m.role}">
                <div class="message-role">${m.role === 'user' ? '用户' : m.role === 'assistant' ? 'AI' : '系统'}</div>
                <div class="message-content">${escapeHtml(m.content)}</div>
                <div class="message-time">${new Date(m.timestamp).toLocaleTimeString('zh-CN')}</div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="empty-state"><p>暂无消息</p></div>';
    }
}

async function sendTestMessage(sessionId) {
    const input = document.getElementById('test-message');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    const response = await apiFetch(`${API_URL}/agents/${encodeURIComponent(sessionId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    
    if (response) {
        showNotification('消息已发送', 'success');
        // Reload messages after a short delay
        setTimeout(() => loadConversationMessages(sessionId), 1000);
    }
}

// ==================== 新功能: 性能分析 (Database) ====================

// Record token usage to database
async function recordTokenUsage(totalTokens) {
    try {
        await apiFetch(`${API_URL}/tokens/record?workspace=${currentWorkspace}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalTokens })
        });
    } catch (e) {
        console.error('Failed to record token usage:', e);
    }
}

// Fetch token stats from database
async function fetchTokenStats() {
    try {
        const response = await apiFetch(`${API_URL}/tokens/stats?workspace=${currentWorkspace}`);
        if (!response) return null;
        const data = await response.json();
        return data.success ? data.stats : null;
    } catch (e) {
        console.error('Failed to fetch token stats:', e);
        return null;
    }
}

// Fetch token history from database
async function fetchTokenHistory(days = 30) {
    try {
        const response = await apiFetch(`${API_URL}/tokens/history?workspace=${currentWorkspace}&days=${days}`);
        if (!response) return [];
        const data = await response.json();
        return data.success ? data.history : [];
    } catch (e) {
        console.error('Failed to fetch token history:', e);
        return [];
    }
}

async function fetchAnalytics() {
    showLoading('analytics-content');
    
    // Load agents data
    if (!agents || agents.length === 0) {
        const response = await apiFetch(`${API_URL}/agents`);
        if (response) {
            const data = await response.json();
            if (data.success) {
                agents = data.agents || [];
            }
        }
    }
    
    // Record current token usage to database
    const totalTokens = agents.reduce((sum, a) => sum + (a.totalTokens || 0), 0);
    await recordTokenUsage(totalTokens);
    
    // Fetch stats from database
    const periodStats = await fetchTokenStats();
    
    renderAnalyticsPage(periodStats);
}

function renderAnalyticsPage(periodStats) {
    const container = document.getElementById('analytics-content');
    
    const activeAgents = agents.filter(a => a.status === 'active').length;
    
    // Default values if no stats
    const stats = periodStats || { today: 0, week: 0, month: 0, total: 0 };
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchAnalytics();">${icon('refresh', 16)} 刷新数据</button>
        </div>
        <div class="analytics-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">今日 Token 使用</span>
                    <div class="stat-icon icon-purple">${icon('chart', 24)}</div>
                </div>
                <div class="stat-value">${stats.today.toLocaleString()}</div>
                <div class="stat-subtitle">较昨日新增</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">本周 Token 使用</span>
                    <div class="stat-icon icon-blue">${icon('chart', 24)}</div>
                </div>
                <div class="stat-value">${stats.week.toLocaleString()}</div>
                <div class="stat-subtitle">近 7 天累计</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">本月 Token 使用</span>
                    <div class="stat-icon icon-orange">${icon('chart', 24)}</div>
                </div>
                <div class="stat-value">${stats.month.toLocaleString()}</div>
                <div class="stat-subtitle">近 30 天累计</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">总 Token 使用量</span>
                    <div class="stat-icon icon-green">${icon('chart', 24)}</div>
                </div>
                <div class="stat-value">${stats.total.toLocaleString()}</div>
                <div class="stat-subtitle">所有 Agent 累计</div>
            </div>
        </div>
        
        <!-- Daily Usage Ranking -->
        <div class="analytics-section">
            <div class="section-header">
                <h3>📅 每日 Token 使用排行</h3>
                <select id="month-selector" onchange="loadDailyRanking(this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:14px;cursor:pointer;">
                    ${generateMonthOptions(currentMonth)}
                </select>
            </div>
            <div id="daily-ranking-content">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>加载中...</p>
                </div>
            </div>
        </div>
        
        <div class="analytics-section">
            <h3>Agent Token 使用排行</h3>
            <div class="token-ranking">
                ${agents.sort((a, b) => b.totalTokens - a.totalTokens).map((agent, index) => `
                    <div class="ranking-item">
                        <span class="ranking-number">${index + 1}</span>
                        <span class="ranking-name">${formatAgentName(agent)}</span>
                        <div class="ranking-bar">
                            <div class="ranking-fill" style="width: ${Math.min(100, (agent.totalTokens / Math.max(...agents.map(a => a.totalTokens))) * 100)}%"></div>
                        </div>
                        <span class="ranking-value">${agent.totalTokens.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Load daily ranking
    loadDailyRanking(currentMonth);
}

// Generate month options for select dropdown
function generateMonthOptions(currentMonth) {
    const months = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const value = `${year}-${month}`;
        const label = `${year}年${month}月`;
        const selected = value === currentMonth ? 'selected' : '';
        months.push(`<option value="${value}" ${selected}>${label}</option>`);
    }
    
    return months.join('');
}

// Load daily usage ranking
async function loadDailyRanking(month) {
    const container = document.getElementById('daily-ranking-content');
    if (!container) return;
    
    showLoading('daily-ranking-content');
    
    try {
        const response = await apiFetch(`${API_URL}/tokens/daily-ranking?workspace=${currentWorkspace}&month=${month}`);
        if (!response) return;
        
        const data = await response.json();
        if (!data.success || !data.ranking) {
            container.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
            return;
        }
        
        const ranking = data.ranking;
        
        if (ranking.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>该月份暂无数据</p></div>';
            return;
        }
        
        const maxUsage = Math.max(...ranking.map(r => r.daily_usage || 0));
        
        container.innerHTML = `
            <div class="daily-ranking-table">
                <div class="ranking-header">
                    <span>日期</span>
                    <span>当日使用量</span>
                    <span>累计总量</span>
                    <span>趋势</span>
                </div>
                ${ranking.map((day, index) => {
                    // Fix date format (remove time part)
                    const dateStr = day.date.split('T')[0];
                    const usage = day.daily_usage || 0;
                    const percentage = maxUsage > 0 ? (usage / maxUsage * 100) : 0;
                    const trend = usage > 0 ? '📈' : (usage < 0 ? '📉' : '➖');
                    
                    return `
                        <div class="ranking-row" onclick="showDayDetail('${dateStr}')" style="cursor:pointer;">
                            <span class="ranking-date">${dateStr}</span>
                            <span class="ranking-usage">${usage.toLocaleString()}</span>
                            <span class="ranking-total">${day.total_tokens.toLocaleString()}</span>
                            <span class="ranking-trend">
                                <div class="trend-bar" style="width:${percentage}%"></div>
                                ${trend}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
    }
}

// Show detail for a specific day
async function showDayDetail(date) {
    try {
        const response = await apiFetch(`${API_URL}/tokens/date/${date}?workspace=${currentWorkspace}`);
        if (!response) return;
        
        const data = await response.json();
        if (!data.success) {
            showNotification('该日期无数据', 'info');
            return;
        }
        
        const day = data.data;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>📊 ${date} 使用详情</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body" style="padding:24px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                        <div style="background:var(--bg-elevated);padding:16px;border-radius:8px;">
                            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">当日使用量</div>
                            <div style="font-size:24px;font-weight:600;color:var(--primary);">${(day.daily_usage || 0).toLocaleString()}</div>
                        </div>
                        <div style="background:var(--bg-elevated);padding:16px;border-radius:8px;">
                            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">累计总量</div>
                            <div style="font-size:24px;font-weight:600;color:var(--success);">${day.total_tokens.toLocaleString()}</div>
                        </div>
                    </div>
                    <div style="background:var(--bg-elevated);padding:16px;border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">更新时间</div>
                        <div style="font-size:14px;">${new Date(day.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        showNotification('加载失败', 'error');
    }
}

// ==================== 新功能: 人格与配置编辑器 ====================

const PERSONA_FILES = [
    { id: 'soul', name: 'SOUL.md', label: '人格定义', description: 'Agent 的核心人格和行为准则' },
    { id: 'memory', name: 'MEMORY.md', label: '长期记忆', description: '需要记住的重要信息和决策' },
    { id: 'user', name: 'USER.md', label: '用户档案', description: '关于用户的信息和偏好' },
    { id: 'identity', name: 'IDENTITY.md', label: '身份设定', description: 'Agent 的身份和基本信息' },
    { id: 'tools', name: 'TOOLS.md', label: '工具配置', description: '本地工具配置和环境信息' },
    { id: 'agents', name: 'AGENTS.md', label: '代理配置', description: '代理配置和身份设定' }
];

let personaContents = {};
let currentPersonaFile = 'soul';

async function fetchSoulEditor() {
    showLoading('souleditor-content');
    
    // Load all persona files
    for (const file of PERSONA_FILES) {
        try {
            const response = await apiFetch(`${API_URL}/files/${file.name}/content?workspace=${currentWorkspace}`);
            if (response && response.ok) {
                personaContents[file.id] = await response.text();
            } else {
                personaContents[file.id] = `# ${file.name}\n\n文件不存在或无法加载`;
            }
        } catch (e) {
            personaContents[file.id] = `# ${file.name}\n\n加载失败: ${e.message}`;
        }
    }
    
    renderSoulEditorPage();
}

function renderSoulEditorPage() {
    const container = document.getElementById('souleditor-content');
    const currentFile = PERSONA_FILES.find(f => f.id === currentPersonaFile);
    const content = personaContents[currentPersonaFile] || '';
    
    container.innerHTML = `
        <div class="persona-editor">
            <div class="persona-tabs">
                ${PERSONA_FILES.map(file => `
                    <button class="persona-tab ${currentPersonaFile === file.id ? 'active' : ''}" 
                            onclick="switchPersonaFile('${file.id}')"
                            title="${file.description}">
                        ${file.label}
                    </button>
                `).join('')}
            </div>
            <div class="persona-toolbar">
                <div class="persona-file-info">
                    <strong>${currentFile.label}</strong>
                    <span class="file-description">${currentFile.description}</span>
                </div>
                <button class="btn btn-primary" onclick="savePersonaContent()">${icon('save', 16)} 保存 ${currentFile.name}</button>
            </div>
            <div class="persona-editor-pane">
                <textarea id="persona-textarea" class="persona-textarea" data-file="${currentPersonaFile}">${escapeHtml(content)}</textarea>
            </div>
        </div>
    `;
}

function switchPersonaFile(fileId) {
    // Save current content to memory before switching
    const textarea = document.getElementById('persona-textarea');
    if (textarea) {
        const currentId = textarea.dataset.file;
        if (currentId) {
            personaContents[currentId] = textarea.value;
        }
    }
    
    currentPersonaFile = fileId;
    renderSoulEditorPage();
}

async function savePersonaContent() {
    const textarea = document.getElementById('persona-textarea');
    if (!textarea) return;
    
    const fileId = textarea.dataset.file;
    const fileName = PERSONA_FILES.find(f => f.id === fileId)?.name;
    if (!fileName) return;
    
    const newContent = textarea.value;
    
    // Save via API with workspace
    const response = await apiFetch(`${API_URL}/files/${fileName}/content?workspace=${currentWorkspace}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: newContent
    });
    
    if (response) {
        personaContents[fileId] = newContent;
        showNotification(`${fileName} 已保存`, 'success');
    }
}

// ==================== 新功能: Gateway 管理 ====================

let gatewayInfo = null;

async function fetchGatewayInfo() {
    showLoading('gateway-content');
    const response = await apiFetch(`${API_URL}/gateway/info`);
    if (!response) return;
    const data = await response.json();
    if (data.success) {
        gatewayInfo = data.gateway || {};
        renderGatewayPage();
    }
}

function renderGatewayPage() {
    const container = document.getElementById('gateway-content');
    
    // Debug: log actual data
    console.log('Gateway Info:', gatewayInfo);
    console.log('gatewayInfo?.service:', gatewayInfo?.service);
    
    // Extract status from nested structure
    const service = gatewayInfo?.service || {};
    console.log('service:', service);
    console.log('service?.runtime:', service?.runtime);
    
    const runtime = service?.runtime || gatewayInfo?.runtime || {};
    console.log('runtime:', runtime);
    
    const status = runtime?.status || runtime?.state || gatewayInfo?.status || 'unknown';
    const isRunning = status === 'running' || status === 'active';
    
    console.log('Extracted status:', status, 'isRunning:', isRunning);
    
    // Extract other info
    const gateway = gatewayInfo?.gateway || {};
    const port = gatewayInfo?.port || {};
    const rpc = gatewayInfo?.rpc || {};
    
    // Get PID and port
    const pid = runtime.pid || '-';
    const portNum = gateway.port || port.port || '-';
    const bindHost = gateway.bindHost || '127.0.0.1';
    const probeUrl = gateway.probeUrl || rpc.url || '-';
    
    container.innerHTML = `
        <div class="toolbar">
            <button class="btn btn-secondary" onclick="fetchGatewayInfo()">${icon('refresh', 16)} 刷新</button>
            <button class="btn btn-danger" onclick="restartGateway()">${icon('refresh', 16)} 重启 Gateway</button>
        </div>
        <div class="gateway-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Gateway 状态</span>
                    <div class="stat-icon ${isRunning ? 'icon-green' : 'icon-orange'}">${icon('gateway', 24)}</div>
                </div>
                <div class="stat-value" style="font-size: 24px; margin-top: 12px;">
                    ${isRunning ? '<span class="text-success">运行中</span>' : '<span class="text-danger">已停止</span>'}
                </div>
                <div class="stat-subtitle">${isRunning ? `PID: ${pid}` : '服务状态'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">端口</span>
                    <div class="stat-icon icon-blue">${icon('info', 24)}</div>
                </div>
                <div class="stat-value" style="font-size: 20px; margin-top: 16px;">${portNum}</div>
                <div class="stat-subtitle">${bindHost}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">RPC 地址</span>
                    <div class="stat-icon icon-purple">${icon('clock', 24)}</div>
                </div>
                <div class="stat-value" style="font-size: 14px; margin-top: 16px; word-break: break-all;">${probeUrl}</div>
                <div class="stat-subtitle">WebSocket 连接</div>
            </div>
        </div>
        <div class="gateway-config">
            <h3>Gateway 配置</h3>
            <pre class="config-preview">${JSON.stringify(gatewayInfo, null, 2)}</pre>
        </div>
    `;
}
