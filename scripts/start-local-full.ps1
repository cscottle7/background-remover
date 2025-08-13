Write-Host "=================================================" -ForegroundColor Blue
Write-Host "      CharacterCut - Local Development Setup" -ForegroundColor Blue  
Write-Host "=================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Starting both frontend and backend servers..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Keep this window open while developing" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend will be available at:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host ""

# Change to the directory containing the script
Set-Location $PSScriptRoot

# Start backend in background job
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    & "backend\venv\Scripts\activate.bat"
    python -m uvicorn backend.simple_main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList (Get-Location)

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in foreground
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
npm run dev

# Clean up background job when frontend stops
Write-Host "Stopping backend server..." -ForegroundColor Yellow
Stop-Job $backendJob
Remove-Job $backendJob