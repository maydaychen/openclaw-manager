# OpenClaw Manager Nginx 安装与 SSL 配置指南

## 当前状态
- **应用端口**: 3456 (Node.js server.js)
- **Nginx 状态**: 未安装
- **目标**: 通过 Nginx 反向代理，配置 SSL 证书

## 安装步骤

### 1. 安装 Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

### 2. 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/openclaw-manager
```

**配置内容**:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器 IP
    
    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SSL 重定向 (启用 SSL 后取消注释)
    # return 301 https://$server_name$request_uri;
}

# HTTPS 服务器 (配置 SSL 后启用)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_prefer_server_ciphers on;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     
#     location / {
#         proxy_pass http://localhost:3456;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
```

### 3. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/openclaw-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 安装 Certbot 获取免费 SSL 证书
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 5. 自动续期 SSL 证书
Certbot 会自动创建定时任务，验证：
```bash
sudo systemctl list-timers | grep certbot
```

## 防火墙配置 (如启用)
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 3456  # 仅允许本地访问 (可选)
sudo ufw enable
```

## 验证安装
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口监听
sudo ss -tlnp | grep -E "(80|443)"

# 测试配置
curl -I http://your-domain.com
curl -I https://your-domain.com  # SSL 配置后
```

## 项目文件位置
- **Nginx 配置**: `/etc/nginx/sites-available/openclaw-manager`
- **应用目录**: `~/workspace/projects/openclaw-manager`
- **日志文件**: `/var/log/nginx/error.log`, `/var/log/nginx/access.log`

## 注意事项
1. **域名解析**: 确保域名已解析到服务器 IP
2. **端口 3456**: Node.js 应用继续监听此端口，Nginx 负责转发
3. **SSL 证书**: 使用 Let's Encrypt 免费证书，90 天有效期，自动续期
4. **安全性**: 建议配置防火墙，仅开放 80/443 端口

## 下一步行动
- [x] 确认使用 IP 访问 (临时方案)
- [x] 执行安装命令 (2026-03-11 06:53)
- [x] 配置 Nginx 反向代理
- [ ] 部署 OpenClaw Manager 应用到服务器
- [ ] 启动应用 (端口 3456)
- [ ] 测试访问
- [ ] 申请 SSL 证书 (需要域名)

## 部署状态 (2026-03-11 06:58 完成)
- **Nginx 安装**: ✅ 完成 (CentOS 9.4)
- **Nginx 状态**: ✅ 运行中 (PID: 33916)
- **端口监听**: ✅ 8088 已监听
- **配置文件**: ✅ `/etc/nginx/conf.d/openclaw-manager.conf`
- **后端服务**: ✅ AI Solutions 官网运行中 (PID: 32387, 端口 8099)
- **反向代理**: ✅ 已更新为 8099 端口
- **访问测试**: ✅ HTTP 200 OK

## 访问地址
- **官网前台**: `http://120.55.190.237:8088`
- **API 接口**: `http://120.55.190.237:8088/api/inquiries`
- **服务器本地**: `http://localhost:8088`

## 后台管理功能

### ✅ 已有功能
1. **咨询管理 API**
   - `POST /api/inquiry` - 提交咨询表单
   - `GET /api/inquiries` - 获取咨询列表
   - `PUT /api/inquiry/:id` - 更新咨询状态
   - `DELETE /api/inquiry/:id` - 删除咨询

2. **在线客服系统** (WebSocket/Socket.IO)
   - 客户实时聊天
   - 管理员接入聊天
   - 聊天记录保存
   - 客服状态管理

3. **管理员认证**
   - WebSocket 密码验证 (`admin123`)
   - 管理员标识 (`socket.isAdmin`)

### ❌ 待开发功能
- **后台管理页面** (`admin.html`) - 代码中提到但未实现
- **管理界面 UI** - 需要创建前端页面

### 📋 下一步建议
需要创建 `admin.html` 管理后台页面，包含：
- 登录界面
- 咨询列表管理
- 在线客服聊天界面
- 聊天记录查看

## 临时方案：仅 HTTP (使用 IP + 8088 端口)
在有域名之前，可以先配置 HTTP 访问：
```nginx
server {
    listen 8088;
    server_name _;  # 接受所有请求
    
    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

访问方式：`http://你的服务器IP:8088`

## 后续升级：添加域名后
1. 解析域名到服务器 IP
2. 运行 `sudo certbot --nginx -d your-domain.com`
3. Certbot 会自动更新 Nginx 配置启用 SSL
