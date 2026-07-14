@echo off
cd /d "%~dp0"

echo Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Node.js is not installed or not in PATH.
  exit /b 1
)

echo Checking for .env files...
if not exist "..\frontend\.env" (
  echo Auto-generating frontend .env...
  echo VITE_API_URL=http://192.168.7.251:5002/api> "..\frontend\.env"
  echo VITE_SOCKET_URL=http://192.168.7.251:5002>> "..\frontend\.env"
)

if not exist "..\backend\.env" (
  echo Auto-generating backend .env...
  echo PORT=5002> "..\backend\.env"
  echo HOST=0.0.0.0>> "..\backend\.env"
  echo NODE_ENV=production>> "..\backend\.env"
  echo MONGODB_URI=mongodb://127.0.0.1:27017/trai_citizen_hub>> "..\backend\.env"
  echo CLIENT_URL=http://192.168.7.251:8085>> "..\backend\.env"
  echo CORS_ORIGIN=http://192.168.7.251:8085>> "..\backend\.env"
  echo JWT_ACCESS_SECRET=a82d02c7b5f1064d8a169b2d8e41bf372a83e602fc5d89f8164b2a8d50e184cd>> "..\backend\.env"
  echo JWT_REFRESH_SECRET=e741dbdfa8684c3e8de9d5f7f2b1d033603c7b2c01997fa4402a5e8de9d5f7f2b>> "..\backend\.env"
)

echo Installing frontend dependencies...
cd ..\frontend
call npm install

echo Installing backend dependencies...
cd ..\backend
call npm install

echo Creating required folders...
if not exist "uploads" mkdir uploads
if not exist "uploads\trail-attachments" mkdir uploads\trail-attachments

echo Building backend...
call npm run build

echo Building frontend...
cd ..\frontend
call npm run build

echo Checking firewall rules...
netsh advfirewall firewall show rule name="TRAI Frontend 8085" >nul 2>&1
if not %errorlevel% == 0 (
  netsh advfirewall firewall add rule name="TRAI Frontend 8085" dir=in action=allow protocol=TCP localport=8085
)
netsh advfirewall firewall show rule name="TRAI Backend 5002" >nul 2>&1
if not %errorlevel% == 0 (
  netsh advfirewall firewall add rule name="TRAI Backend 5002" dir=in action=allow protocol=TCP localport=5002
)

echo Seeding Database (this will fail safely if already seeded)...
cd ..\backend
call npm run seed

echo Installation and Build Complete.
