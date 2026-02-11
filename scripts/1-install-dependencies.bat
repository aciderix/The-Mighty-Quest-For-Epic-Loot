@echo off
title MQEL Offline - Installation des dependances
color 0A

echo ================================================================
echo   MQEL OFFLINE - Installation des dependances
echo ================================================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js n'est pas installe!
    echo.
    echo Telechargez Node.js ici: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js detecte
)

cd /d "%~dp0\..\server"

echo.
echo Installation des packages npm...
call npm install

if errorlevel 1 (
    echo [X] Erreur lors de l'installation des packages
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   Installation terminee avec succes!
echo ================================================================
echo.
pause