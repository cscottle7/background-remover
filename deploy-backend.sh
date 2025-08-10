#!/bin/bash
# CharacterCut Backend Deployment Script for Linux Server
# Run this on your server: https://viben-apps.dwsstaging.net.au/

set -e  # Exit on error

echo "🚀 CharacterCut Backend Deployment Starting..."

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️ Warning: Running as root. Consider using a non-root user."
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+ if not present
echo "🐍 Installing Python and dependencies..."
sudo apt install -y python3 python3-pip python3-venv git nginx

# Check Python version
python3_version=$(python3 --version 2>&1 | grep -Po '(?<=Python )\d+\.\d+')
if [[ $(echo "$python3_version >= 3.9" | bc -l) -eq 0 ]]; then
    echo "❌ Python 3.9+ required. Found: $python3_version"
    exit 1
fi

# Create application directory
APP_DIR="/opt/charactercut"
echo "📁 Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $(whoami):$(whoami) $APP_DIR

# Clone or copy backend files (you'll need to upload the backend/ directory)
cd $APP_DIR

# Create virtual environment
echo "🔧 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python packages..."
pip install --upgrade pip
pip install fastapi uvicorn[standard] python-multipart
pip install rembg[cpu] pillow numpy requests

# Create systemd service file
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/charactercut.service > /dev/null <<EOF
[Unit]
Description=CharacterCut Background Removal API
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/uvicorn simple_main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration
echo "🌐 Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/charactercut > /dev/null <<EOF
server {
    listen 80;
    server_name viben-apps.dwsstaging.net.au;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    
    # Handle preflight requests
    location / {
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
        
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeouts for image processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Increase max upload size for images
    client_max_body_size 10M;
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/charactercut /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable services
echo "🔄 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable charactercut
sudo systemctl restart nginx
sudo systemctl start charactercut

# Check service status
echo "✅ Deployment complete! Checking service status..."
sudo systemctl status charactercut --no-pager
sudo systemctl status nginx --no-pager

echo ""
echo "🎉 CharacterCut Backend Deployed Successfully!"
echo ""
echo "🔗 API Endpoints:"
echo "   Health: https://viben-apps.dwsstaging.net.au/health"
echo "   Process: https://viben-apps.dwsstaging.net.au/simple-process"
echo ""
echo "📝 Useful commands:"
echo "   Check logs: sudo journalctl -u charactercut -f"
echo "   Restart service: sudo systemctl restart charactercut"
echo "   Check status: sudo systemctl status charactercut"
echo ""