@echo off
title MQEL Offline - Quick Start
color 0D

echo ================================================================
echo        _____  _____  ____  _     
echo       |     ||  _  ||    || |    
echo       | | | || | | ||  --|| |__  
echo       |_|_|_||_|_|_||____||____|  OFFLINE
echo.
echo   The Mighty Quest For Epic Loot
echo   Quick Start Launcher
echo ================================================================
echo.
echo [1] Demarrer le serveur (dans une nouvelle fenetre)
echo [2] Lancer le jeu
echo [3] Ouvrir la page de login dans le navigateur
echo [4] Installer les dependances
echo [5] Quitter
echo.
echo ================================================================

:start
choice /c 12345 /n /m "Choix: "

if errorlevel 5 exit /b
if errorlevel 4 goto install
if errorlevel 3 goto browser
if errorlevel 2 goto game
if errorlevel 1 goto server

:server
start "MQEL Server" cmd /k "%~dp02-start-server.bat"
timeout /t 3
goto start

:game
call "%~dp03-launch-game.bat"
goto start

:browser
start http://localhost:3000
goto start

:install
call "%~dp01-install-dependencies.bat"
goto start