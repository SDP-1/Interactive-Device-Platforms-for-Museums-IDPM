@echo off
cd /d "%~dp0"
echo ========================================
echo   Museum AI Guide - Starting Server
echo ========================================
echo.
echo Starting API server on http://localhost:8000
echo Press CTRL+C to stop the server
echo.
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
pause

