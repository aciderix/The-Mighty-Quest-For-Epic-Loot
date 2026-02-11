@echo off
title MQEL Offline - Lancement du jeu
color 0E

echo ================================================================
echo   MQEL OFFLINE - Lancement du jeu
echo ================================================================
echo.

curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo [!] Le serveur n'est pas demarre!
    echo Lancez d'abord "2-start-server.bat"
    pause
    exit /b 1
)

echo [OK] Serveur detecte
echo.

set GAME_PATH=
if exist "%~dp0\..\game\MightyQuest.exe" set GAME_PATH=%~dp0\..\game\MightyQuest.exe
if exist "C:\Program Files (x86)\Steam\steamapps\common\The Mighty Quest For Epic Loot\MightyQuest.exe" set GAME_PATH=C:\Program Files (x86)\Steam\steamapps\common\The Mighty Quest For Epic Loot\MightyQuest.exe

if "%GAME_PATH%"=="" (
    echo [X] MightyQuest.exe non trouve!
    set /p GAME_PATH="Chemin vers MightyQuest.exe: "
)

echo Lancement de: %GAME_PATH%
start "" "%GAME_PATH%" -offline -skipintro

echo Jeu lance! Bon pillage!
timeout /t 3