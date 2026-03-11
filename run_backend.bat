@echo off
REM Run this file from the project root by double-clicking it.
cd /d "%~dp0backend"
REM Install dependencies once if needed:
REM pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
