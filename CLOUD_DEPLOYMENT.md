# Cloud Server Deployment Guide

Deploy your CharacterCut Docker backend to a cloud server for 24/7 availability and external access.

## 🎯 Recommended Options

### Option 1: Railway (Easiest)
- **Cost**: ~$5-10/month
- **Setup Time**: 5 minutes
- **Pros**: Git-based deployment, automatic HTTPS, simple scaling
- **Best For**: Quick deployment, minimal configuration

### Option 2: DigitalOcean Droplet (Most Control)
- **Cost**: $6-12/month
- **Setup Time**: 15-30 minutes  
- **Pros**: Full server control, SSH access, custom configurations
- **Best For**: Learning, customization, cost-effective scaling

### Option 3: Google Cloud Run (Pay-per-use)
- **Cost**: $0-20/month (depends on usage)
- **Setup Time**: 10-15 minutes
- **Pros**: Serverless, automatic scaling, pay only when used
- **Best For**: Variable traffic, cost optimization

## 🚂 Railway Deployment (Recommended for Beginners)

### Step 1: Prepare for Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Configure for Railway
Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "dockerfile",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn simple_main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

### Step 3: Deploy
```bash
# Initialize Railway project
railway init

# Deploy
railway up
```

### Step 4: Get Your URL
```bash
# Generate domain
railway domain

# Your backend will be available at:
# https://your-app-name.railway.app
```

## 🌊 DigitalOcean Droplet Deployment

### Step 1: Create Droplet
1. Go to DigitalOcean → Create → Droplet
2. Choose: **Docker** marketplace image
3. Size: **Basic $6/month** (1GB RAM, 1 CPU)
4. Add SSH key
5. Create droplet

### Step 2: Connect and Deploy
```bash
# SSH to your droplet
ssh root@YOUR_DROPLET_IP

# Clone your repository
git clone https://github.com/your-username/background-remover.git
cd background-remover

# Start the backend
docker-compose up -d

# Verify it's running
curl http://localhost:8000/health
```

### Step 3: Configure Firewall
```bash
# Allow HTTP traffic
ufw allow 8000/tcp
ufw enable

# Test external access
curl http://YOUR_DROPLET_IP:8000/health
```

## ☁️ Google Cloud Run Deployment

### Step 1: Build and Push Image
```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push to Container Registry
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/charactercut-backend

# Deploy to Cloud Run
gcloud run deploy charactercut-backend \
  --image gcr.io/YOUR_PROJECT_ID/charactercut-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --timeout 300
```

## 🔧 Production Configuration

### Update Docker Configuration
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  charactercut-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: charactercut-backend
    ports:
      - "8000:8000"
    environment:
      - STAGE=production
      - PORT=8000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    # Remove development volumes
```

### Update Frontend Configuration
Once deployed, update your frontend:

```env
# .env file
VITE_API_URL=https://your-backend-domain.com
```

## 💰 Cost Comparison

| Platform | Monthly Cost | Setup Difficulty | Scalability |
|----------|-------------|------------------|-------------|
| Railway | $5-10 | Easy | Auto |
| DigitalOcean | $6-12 | Medium | Manual |
| Google Cloud Run | $0-20 | Medium | Auto |
| AWS Fargate | $10-25 | Hard | Auto |
| Fly.io | $5-15 | Medium | Auto |

## 🔒 Security Considerations

### SSL/HTTPS
- Railway: Automatic HTTPS
- DigitalOcean: Use Nginx + Let's Encrypt
- Cloud Run: Automatic HTTPS

### Environment Variables
```bash
# Set secure environment variables
export REMBG_MODEL_CACHE_DIR=/app/models
export MAX_FILE_SIZE=10485760
export ALLOWED_ORIGINS=https://background-remover-jet.vercel.app
```

### Firewall Rules
```bash
# DigitalOcean UFW example
ufw allow ssh
ufw allow 8000/tcp
ufw enable
```

## 📊 Monitoring

### Health Checks
All platforms support health check endpoints at `/health`

### Logs
```bash
# Railway
railway logs

# DigitalOcean
docker logs charactercut-backend

# Google Cloud Run
gcloud logging read "resource.type=cloud_run_revision"
```

## 🚀 Quick Start Commands

**Railway:**
```bash
railway login && railway init && railway up
```

**DigitalOcean:**
```bash
# After creating droplet
git clone YOUR_REPO && cd background-remover
docker-compose -f docker-compose.prod.yml up -d
```

**Google Cloud Run:**
```bash
gcloud builds submit --tag gcr.io/PROJECT/charactercut-backend backend/
gcloud run deploy --image gcr.io/PROJECT/charactercut-backend --platform managed
```

Choose the option that best fits your needs and budget!