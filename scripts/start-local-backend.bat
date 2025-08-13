@echo off
echo Starting CharacterCut Local Backend Server
echo =========================================
echo.
echo Activating Python virtual environment...
call backend\venv\Scripts\activate.bat

echo.
echo Starting backend server on http://localhost:8000...
echo.
echo IMPORTANT: Keep this window open while using the app
echo Frontend URL: https://background-remover-jet.vercel.app/
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn backend.simple_main:app --host 0.0.0.0 --port 8000 --reload