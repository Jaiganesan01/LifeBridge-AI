@echo off
echo Starting LifeBridge AI Backend & Frontend...
start "LifeBridge AI - Backend" cmd /k "cd /d "%~dp0backend" && py -3.11 -m uvicorn main:app --reload --port 8000"
start "LifeBridge AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
