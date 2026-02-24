@echo off
REM start_all.bat — opens three terminals to run frontend, backend, and serial gateway
REM Adjust Node/python paths or virtualenv activation as needed.

REM Terminal 1: frontend (Vite) on port 8084
start cmd /k "cd /d %~dp0 && set PORT=8084 && npm run dev"

REM Terminal 2: backend uvicorn
start cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000"

REM Terminal 3: serial gateway
start cmd /k "cd /d %~dp0backend && python serial_gateway.py"

echo Launched frontend, backend, and serial gateway in new terminals.
pause
