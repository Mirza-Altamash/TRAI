# TRAI Citizen Hub - Deployment Guide

## 1. Directory context
Always run all deployment commands from the deployment\ directory.

## 2. Environment variables
**Automated:** The `install.bat` script automatically generates `frontend\.env` and `backend\.env` with production configurations if they do not exist.
Required backend keys: PORT, HOST, NODE_ENV, MONGODB_URI, CLIENT_URL, CORS_ORIGIN.
Required frontend keys: VITE_API_URL, VITE_SOCKET_URL.

## 3. Installation and build
Run:
```bat
install.bat
```
This installs dependencies, builds both apps, creates uploads folders, and adds firewall rules for 8085 and 5002.

## 4. Starting services
Run:
```bat
start.bat
```
This opens two command windows (backend on 5002, frontend on 8085).

## 5. Accessing the portal
RDP machine: http://localhost:8085
Other machines on LAN: http://192.168.7.251:8085

## 6. Database operations
**NOTE: Database Seeding is automated in `install.bat`. It is non-destructive and skips automatically if users already exist.**
Backup:
```bat
mongodump --db trai_citizen_hub --out backup_folder/
```
Restore:
```bat
mongorestore --db trai_citizen_hub backup_folder/trai_citizen_hub/
```

## 7. Troubleshooting
- **Firewall issues:** Check Windows Defender Firewall inbound TCP on 8085 and 5002.
- **CORS errors:** Ensure CLIENT_URL and CORS_ORIGIN in backend\.env match http://192.168.7.251:8085.
- **MongoDB connection:** Ensure MongoDB is running on 127.0.0.1:27017.
- **Port conflicts:** Use `netstat -ano | findstr :8085` or `:5002`, then kill conflicting PIDs.


<!-- mirza -->