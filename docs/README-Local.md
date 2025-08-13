# CharacterCut - Local Development Setup

## 🎉 Complete Local Development Environment

Both frontend and backend are now running locally for full development control!

## 🚀 Quick Start

### Option 1: Start Both Services (Recommended)
```powershell
# PowerShell
.\start-local-full.ps1

# or Command Prompt
.\start-local-full.bat
```

### Option 2: Start Services Separately

**Backend Only:**
```powershell
.\start-local-backend.ps1
# or
.\start-local-backend.bat
```

**Frontend Only:**
```powershell
npm run dev
```

## 🌐 Access Points

- **Local Frontend**: http://localhost:3000
- **Local Backend**: http://localhost:8000
- **API Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## ✅ Verify Setup

Run the test script to verify everything works:
```powershell
python test-local-full.py
```

## 🔧 What's Running

### Frontend (SvelteKit)
- **Port**: 3000
- **Hot Reload**: Enabled
- **Environment**: Development mode
- **API Target**: http://localhost:8000

### Backend (FastAPI + Python)
- **Port**: 8000
- **Auto Reload**: Enabled
- **Model**: u2net (downloaded automatically)
- **Processing**: Local CPU-based

## 📁 Project Structure

```
C:\Apps\background-remover\
├── src/                    # Frontend source code
├── backend/               # Backend source code
│   ├── venv/             # Python virtual environment
│   ├── simple_main.py    # FastAPI server
│   └── requirements-local.txt
├── .env.local            # Local environment variables
├── start-local-full.*    # Start both services
├── start-local-backend.* # Start backend only
└── test-local-full.py    # Test complete setup
```

## 🛠️ Development Workflow

1. **Start Services**: Run `.\start-local-full.ps1`
2. **Open Browser**: Navigate to http://localhost:3000
3. **Upload Images**: Drag & drop or browse to upload
4. **Live Reload**: Both frontend and backend auto-reload on changes
5. **API Testing**: Use http://localhost:8000/docs for API testing

## 🎯 Key Features

- **No Docker**: Pure Python/Node.js setup
- **Fast Processing**: <5 seconds per image
- **Hot Reload**: Instant development feedback
- **CORS Configured**: Frontend can access backend
- **Local Processing**: Images processed on your machine
- **Auto-cleanup**: Images expire after 1 hour

## 🔍 Troubleshooting

### Backend Issues
- Check Python version: `python --version` (should be 3.13+)
- Verify dependencies: `backend\venv\Scripts\activate.bat && pip list`
- Check logs in terminal running backend

### Frontend Issues
- Check Node version: `node --version` (works with 18.x - 22.x)
- Clear npm cache: `npm cache clean --force`
- Reinstall: `npm install`

### CORS Issues
- Verify `.env.local` contains: `VITE_API_URL=http://localhost:8000`
- Check backend CORS middleware in `backend/simple_main.py`

## 📊 Performance

- **Model Loading**: ~10 seconds on first start
- **Processing Speed**: 2-5 seconds per image
- **Memory Usage**: ~1-2GB for backend with model loaded
- **Storage**: 0GB (no Docker images!)

## 🔒 Security

- **Local Only**: No external network access required
- **No Data Storage**: Images auto-delete after processing
- **No Authentication**: Local development only
- **CORS**: Restricted to localhost origins

## 🎨 Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `python test-local-full.py` - Test complete setup
- `python test-local-setup.py` - Test backend + Vercel frontend

## 📈 Next Steps

1. **Image Testing**: Upload various image formats and sizes
2. **Feature Development**: Use hot reload for rapid iteration
3. **API Exploration**: Check out http://localhost:8000/docs
4. **Performance Monitoring**: Watch terminal output for processing times

## 🎉 Success!

You now have a complete local development environment with:
- ✅ Local frontend and backend
- ✅ Hot reload for both services  
- ✅ Fast image processing
- ✅ No Docker dependencies
- ✅ Easy startup scripts

Happy coding! 🚀