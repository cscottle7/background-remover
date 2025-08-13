Write-Host "Starting CharacterCut Local Backend Server" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Activating Python virtual environment..." -ForegroundColor Yellow

# Change to the directory containing the script
Set-Location $PSScriptRoot

# Activate virtual environment and start server
& "backend\venv\Scripts\activate.bat"

Write-Host ""
Write-Host "Starting backend server on http://localhost:8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Keep this window open while using the app" -ForegroundColor Cyan
Write-Host "Frontend URL: https://background-remover-jet.vercel.app/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

python -m uvicorn backend.simple_main:app --host 0.0.0.0 --port 8000 --reload