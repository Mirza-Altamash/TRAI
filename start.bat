@echo off
echo ===================================================
echo     TRAI Citizen Hub - Remote Desktop Setup
echo ===================================================
echo.

echo [1/3] Installing Backend Dependencies...
cd backend
call npm install
echo.
echo Seeding Database (Ensuring users are created)...
call npx ts-node src/services/seed.ts
cd ..

echo.
echo [2/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/3] Starting Servers...
echo Starting Backend Server on port 5002...
start cmd /k "cd backend && npm run dev"

echo Starting Frontend Server on port 5001...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Setup Complete! 
echo The Backend API is running on http://localhost:5002
echo The Frontend UI is running on http://localhost:5001
echo.
echo NOTE: Two new command prompt windows have opened to run the servers.
echo ===================================================
pause
