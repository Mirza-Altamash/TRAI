@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8085') do taskkill /PID %%a /F
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5002') do taskkill /PID %%a /F
echo Stopped processes on ports 8085 and 5002.
