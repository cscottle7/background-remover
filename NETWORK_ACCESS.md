# Network Access Configuration

This guide shows how to make your CharacterCut Docker backend accessible from other computers on your network.

## Current Setup

- **Frontend**: Deployed on Vercel at https://background-remover-jet.vercel.app/
- **Backend**: Docker container running locally on your machine
- **Default Configuration**: Backend accessible at `http://localhost:8000`

## Making Backend Accessible from Other Computers

### Step 1: Find Your Local IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example output: `192.168.1.100`

### Step 2: Configure Frontend to Use Your IP

Create a `.env` file in the project root:

```env
# Replace 192.168.1.100 with your actual IP address
VITE_API_URL=http://192.168.1.100:8000
```

### Step 3: Ensure Docker Backend is Running

```bash
# Check if backend is running
docker ps

# If not running, start it
docker-compose up -d

# Verify health
curl http://localhost:8000/health
```

### Step 4: Test Network Access

From another computer on the same network:
```bash
# Test health endpoint (replace with your IP)
curl http://192.168.1.100:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "version": "1.0.0-dev"
}
```

### Step 5: Update Frontend Deployment

After updating `.env`, redeploy the frontend:

```bash
# Commit the environment configuration
git add .env
git commit -m "Configure backend IP for network access"
git push

# Vercel will automatically redeploy
```

## Network Configuration Options

### Option 1: Environment Variable (Recommended)
- Create `.env` file with `VITE_API_URL=http://YOUR_IP:8000`
- Allows easy switching between different network setups

### Option 2: Direct Code Update
- Modify `src/lib/services/api.ts` directly
- Less flexible but works for permanent setups

### Option 3: Dynamic IP Detection (Advanced)
- Frontend automatically detects and uses the current network IP
- Requires additional configuration and may not work in all environments

## Firewall Configuration

### Windows Firewall
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change Settings" → "Allow another app"
4. Add Docker Desktop or allow port 8000

### Router Configuration
If accessing from outside your local network:
1. Set up port forwarding for port 8000
2. Use your public IP instead of local IP
3. Consider security implications

## Security Considerations

⚠️ **Important Security Notes:**

1. **Local Network Only**: Only expose the backend on your local network
2. **No Authentication**: The current backend has no authentication - only use on trusted networks
3. **Firewall**: Ensure proper firewall rules are in place
4. **HTTPS**: For production use, implement HTTPS and proper authentication

## Troubleshooting

### Backend Not Accessible
- Check firewall settings
- Verify Docker container is running: `docker ps`
- Test locally first: `curl http://localhost:8000/health`

### CORS Errors
- Backend is already configured for CORS with `allow_origins=["*"]`
- If issues persist, check browser console for specific errors

### Frontend Not Connecting
- Verify `.env` file is created and contains correct IP
- Check Vercel deployment includes the new environment variables
- Test API endpoint directly in browser: `http://YOUR_IP:8000/health`

## Example Complete Setup

1. **Find IP**: `192.168.1.100`
2. **Create `.env`**:
   ```env
   VITE_API_URL=http://192.168.1.100:8000
   ```
3. **Start Backend**:
   ```bash
   docker-compose up -d
   ```
4. **Test**:
   ```bash
   curl http://192.168.1.100:8000/health
   ```
5. **Deploy**:
   ```bash
   git add . && git commit -m "Configure network access" && git push
   ```

Now anyone on your network can access the frontend at https://background-remover-jet.vercel.app/ and it will process images using your local Docker backend!