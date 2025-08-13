# CharacterCut Local Docker Setup

Complete local development environment using Docker with both frontend and backend.

## 🚀 Quick Start

### Option 1: One-Click Start (Windows)
```cmd
# Run the startup script
start-local.bat
```

### Option 2: Manual Commands
```bash
# Start everything
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📋 What You Get

- **Frontend**: http://localhost:3000 (SvelteKit app)
- **Backend**: http://localhost:8000 (FastAPI + rembg)
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## 🛠️ Development Modes

### Production Mode (Optimized)
```bash
# Use main docker-compose.yml
docker-compose up --build -d
```
- Frontend: Built static files served on port 3000
- Backend: Production-ready Python server
- Faster startup, optimized for performance

### Development Mode (Hot Reload)
```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up --build -d
```
- Frontend: Vite dev server with hot reload on port 5173
- Backend: Auto-reload on code changes
- Slower startup, better for development

## 🎯 Access Points

### From Your Computer
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### From Other Computers on Network
Find your IP address:
```cmd
ipconfig
```

Then access:
- Frontend: http://YOUR_IP:3000
- Backend: http://YOUR_IP:8000

Example: http://192.168.1.100:3000

## 🔧 Management Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Rebuild and start
docker-compose up --build -d
```

### Stop Services
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove everything
docker-compose down --rmi all -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f charactercut-backend
docker-compose logs -f charactercut-frontend
```

### Check Status
```bash
# Service status
docker-compose ps

# Health checks
curl http://localhost:8000/health
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker --version

# Free up ports
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Rebuild completely
docker-compose down --rmi all -v
docker-compose up --build -d
```

### Frontend Can't Connect to Backend
```bash
# Check backend is healthy
curl http://localhost:8000/health

# Check Docker network
docker network ls
docker network inspect background-remover_charactercut-network
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Increase Docker memory limits in Docker Desktop
# Settings > Resources > Advanced > Memory
```

### Port Conflicts
If ports 3000 or 8000 are in use:

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
  - "8001:8000"  # Use port 8001 instead
```

## 📁 Project Structure

```
background-remover/
├── docker-compose.yml         # Production setup
├── docker-compose.dev.yml     # Development setup
├── Dockerfile.frontend        # Frontend container
├── start-local.bat           # Windows startup script
├── backend/
│   ├── Dockerfile            # Backend container
│   └── simple_main.py        # FastAPI app
├── src/                      # Frontend source
└── static/                   # Static assets
```

## 🔒 Security Notes

### Development Security
- Services are accessible on your network by default
- No authentication required
- Only use on trusted networks

### Production Considerations
- Add authentication
- Use HTTPS
- Restrict network access
- Set up proper firewall rules

## 🎮 Testing the Setup

### 1. Basic Health Check
```bash
curl http://localhost:8000/health
```
Should return:
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "version": "1.0.0-dev"
}
```

### 2. Frontend Access
Open http://localhost:3000 in browser
- Should see CharacterCut interface
- Try uploading an image
- Verify processing works

### 3. API Documentation
Visit http://localhost:8000/docs
- Interactive API documentation
- Test endpoints directly

## 📊 Resource Requirements

### Minimum
- **RAM**: 4GB (2GB for Docker, 1GB for backend, 1GB for frontend)
- **CPU**: 2 cores
- **Disk**: 2GB free space
- **Network**: Local network access

### Recommended
- **RAM**: 8GB+
- **CPU**: 4+ cores
- **Disk**: 5GB+ free space
- **GPU**: Optional (for faster processing)

## 🚀 Next Steps

1. **Start the services**: Run `start-local.bat` or `docker-compose up -d`
2. **Test functionality**: Upload an image at http://localhost:3000
3. **Share with others**: Give them your IP address + port 3000
4. **Development**: Use `docker-compose.dev.yml` for coding

Your CharacterCut application is now running completely locally with Docker! 🎉