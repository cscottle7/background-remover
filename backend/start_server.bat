@echo off
echo Starting CharacterCut Backend Server...
cd /d "C:\Users\cscot\Documents\Apps\Remove background\backend"
python -m uvicorn simple_main:app --host 127.0.0.1 --port 8000 --reload
pause