# VPS Deployment Guide (PocketBase)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   PocketBase    │
│   (Nginx)       │     │   (Go + SQLite) │
│   Port 3000     │     │   Port 8090     │
└─────────────────┘     └─────────────────┘
```

## Option A: Docker (Recommended)

### 1. Clone the project
```bash
cd ~
git clone https://github.com/krisauseu/moneystill.git
cd moneystill
```

### 2. Create .env file
```bash
cp .env.example .env
nano .env
```

Fill in your values:
```env
VITE_POCKETBASE_URL=https://your-pocketbase-url.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
FRONTEND_URL=https://app.moneystill.com
```

### 3. Start Docker containers
```bash
# Stop and remove old containers
docker compose down --rmi all

# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f
```

### 4. Set up PocketBase Admin
1. Open `http://YOUR_IP:8090/_/`
2. Create a superuser account
3. Collections should already exist (from pb_hooks)

### 5. Configure SMTP for emails
1. Go to PocketBase Admin → Settings → Mail settings
2. Configure your SMTP server (e.g., Mailgun, Postmark, etc.)
3. Go to Settings → Auth providers → Users
4. Enable "Require email verification"

### 6. Verify
- Frontend: `http://YOUR_IP:3000`
- PocketBase Admin: `http://YOUR_IP:8090/_/`

---

## Option B: Without Docker (systemd)

### Install prerequisites
```bash
# Node.js 20 (for frontend build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
```

### 1. Download PocketBase
```bash
cd ~
mkdir pocketbase && cd pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.24.4/pocketbase_0.24.4_linux_amd64.zip
unzip pocketbase_0.24.4_linux_amd64.zip
chmod +x pocketbase
```

### 2. Set up PocketBase as a service
```bash
sudo nano /etc/systemd/system/pocketbase.service
```

Contents:
```ini
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pocketbase
ExecStart=/root/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

### 3. Build the frontend
```bash
cd ~/moneystill/frontend

# Create .env
echo "VITE_POCKETBASE_URL=https://your-pocketbase-url.com" > .env

npm install
npm run build
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/moneystill
```

Contents:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/USER/moneystill/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name db.your-domain.com;

    # PocketBase
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -sf /etc/nginx/sites-available/moneystill /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## Troubleshooting

### PocketBase not running
```bash
sudo systemctl status pocketbase
sudo journalctl -u pocketbase -f
```

### Frontend shows nothing
- Open browser console (F12)
- Check if VITE_POCKETBASE_URL was set correctly BEFORE the build
- With Docker: `docker compose logs frontend`

### Emails not being sent
- Check SMTP settings in PocketBase
- Send a test email via Settings → Mail settings → Send test email

### Users cannot delete their account
- Enable cascade delete for the `user` relation in all collections
- PocketBase Admin → Collection → Edit → user field → Cascade delete

---

## SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d db.your-domain.com
```
