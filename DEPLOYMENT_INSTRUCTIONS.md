# CharacterCut Deployment Instructions

## Architecture
- **Frontend**: Vercel (static site)
- **Backend**: Your Linux server (full rembg AI processing)

## Step 1: Deploy Frontend to Vercel

The frontend is already configured. Just commit and push:

```bash
git add -A
git commit -m "Separate frontend/backend deployment"
git push origin master
```

Frontend will be at: https://background-remover-woad.vercel.app/

## Step 2: Deploy Backend to Your Server

### Upload Backend Files
1. Copy the entire `backend/` directory to your server
2. Also copy `deploy-backend.sh` to your server

### Run Deployment Script
On your Linux server:

```bash
# Make script executable
chmod +x deploy-backend.sh

# Run deployment (will ask for sudo password)
./deploy-backend.sh
```

### Manual Steps After Script
1. Copy your backend files to `/opt/charactercut/`:
   ```bash
   sudo cp -r backend/* /opt/charactercut/
   ```

2. Test the API:
   ```bash
   curl https://viben-apps.dwsstaging.net.au/health
   ```

## Step 3: Verify Everything Works

1. **Frontend**: https://background-remover-woad.vercel.app/
2. **Backend**: https://viben-apps.dwsstaging.net.au/health
3. **Full Flow**: Upload an image and watch it process with full AI background removal

## Troubleshooting

### Backend Issues
```bash
# Check service status
sudo systemctl status charactercut

# View logs
sudo journalctl -u charactercut -f

# Restart service
sudo systemctl restart charactercut
```

### Frontend Issues
- Redeploy on Vercel
- Check browser console for API connection errors

## Server Requirements

- **OS**: Ubuntu/Debian Linux
- **RAM**: 4GB+ (for rembg models)
- **CPU**: 2+ cores recommended
- **Storage**: 2GB+ free space
- **Network**: HTTPS domain configured

## Security Notes

- The deployment script sets up Nginx reverse proxy
- CORS is configured for your frontend domain
- Services run as non-root user
- Systemd manages process restart on failure