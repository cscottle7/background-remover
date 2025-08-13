@echo off
echo Starting CharacterCut Local Environment...
echo.

echo Building and starting services...
docker-compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak > nul

echo.
echo ======================================
echo CharacterCut is now running locally!
echo ======================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Health:   http://localhost:8000/health
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.

echo Testing backend health...
curl -s http://localhost:8000/health
echo.
echo.
echo Ready to use! Open http://localhost:3000 in your browser.
pause