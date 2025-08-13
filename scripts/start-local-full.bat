@echo off
title CharacterCut - Local Development Setup
echo =================================================
echo       CharacterCut - Local Development Setup
echo =================================================
echo.
echo Starting both frontend and backend servers...
echo.
echo IMPORTANT: Keep this window open while developing
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at:  http://localhost:8000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in background
start "CharacterCut Backend" /B cmd /C "backend\venv\Scripts\activate.bat && python -m uvicorn backend.simple_main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in foreground
echo Starting frontend development server...
npm run dev