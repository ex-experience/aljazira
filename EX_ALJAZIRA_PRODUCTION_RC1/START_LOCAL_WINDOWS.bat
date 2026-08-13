@echo off
title EX ALJAZIRA - Production RC1
cd /d "%~dp0"
echo.
echo EX ALJAZIRA Production RC1
echo http://localhost:8080
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  py -m http.server 8080
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  python -m http.server 8080
  exit /b
)
echo Python not found. Use VS Code Live Server.
pause
