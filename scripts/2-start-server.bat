@echo off
title MQEL Offline Server
color 0B

echo ================================================================
echo   MQEL OFFLINE SERVER
echo   Supabase Backend Edition
echo ================================================================
echo.
echo Endpoints:
echo   - API:       http://localhost:3000
echo   - Health:    http://localhost:3000/api/health
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo ================================================================
echo.

cd /d "%~dp0\..\server"
node server-v2.js

pause