@echo off
cd /d "%~dp0"
echo ========================================
echo   Museum AI Guide - Ingesting Data
echo ========================================
echo.
echo This will process artifacts.csv and upload to Qdrant
echo This may take a few minutes...
echo.
python ingestion/ingest_artifacts.py
echo.
echo Ingestion complete!
pause

