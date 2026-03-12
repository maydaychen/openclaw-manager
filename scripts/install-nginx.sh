#!/bin/bash
# OpenClaw Manager Nginx 安装脚本
# 使用 8088 端口，反向代理到 3456

set -e

echo "🚀 开始安装 Nginx..."

# 更新包列表
sudo apt update

# 安装 Nginx
sudo apt install -y nginx

echo "✅ Nginx 安装完成"

# 创建 Nginx 配置文件
echo "📝 创建 Nginx 配置文件..."

sudo tee /etc/nginx/sites-available/openclaw-manager > /dev/null <<'EOF'
server {
    listen 8088;
    server_name _;
    
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
EOF

# 启用配置
echo "🔗 启用 Nginx 配置..."
sudo ln -sf /etc/nginx/sites-available/openclaw-manager /etc/nginx/sites-enabled/openclaw-manager

# 删除默认配置 (避免冲突)
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
echo "🧪 测试 Nginx 配置..."
sudo nginx -t

# 重启 Nginx
echo "🔄 重启 Nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Nginx 安装和配置完成!"
echo ""
echo "📍 访问地址：http://你的服务器IP:8088"
echo "📋 状态检查：sudo systemctl status nginx"
echo "📋 端口检查：sudo ss -tlnp | grep 8088"
echo ""
echo "🎯 后续升级 (有域名后):"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
