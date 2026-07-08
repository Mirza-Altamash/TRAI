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
  echo ERROR: ..\frontend\.env is missing! Please create it from .env.example before running install.bat.
  exit /b 1
)
if not exist "..\backend\.env" (
  echo ERROR: ..\backend\.env is missing! Please create it from .env.example before running install.bat.
  exit /b 1
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

echo Installation and Build Complete.
