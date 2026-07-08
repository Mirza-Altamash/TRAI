@echo off
cd /d "%~dp0"
SET PROJECT_ROOT=%~dp0..
SET BACKEND_DIR=%PROJECT_ROOT%\backend
SET FRONTEND_DIR=%PROJECT_ROOT%\frontend

echo Starting Backend...
cd /d "%BACKEND_DIR%"
SET PORT=5002
SET HOST=0.0.0.0
SET CORS_ORIGIN=http://192.168.7.251:8085
SET CLIENT_URL=http://192.168.7.251:8085
start "TRAI Backend" cmd /c "npm run start"

echo Starting Frontend...
cd /d "%FRONTEND_DIR%"
start "TRAI Frontend" cmd /c "npm run preview -- --host 0.0.0.0 --port 8085"

echo.
echo Backend:  http://192.168.7.251:5002
echo Frontend: http://192.168.7.251:8085
pause
