@echo off
title AbKharido Git Push Wizard
echo ===================================================
echo   AbKharido.com - Automatic GitHub Push Script
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git was not found in your system path.
    echo Please make sure you have installed Git from https://git-scm.com/
    echo and restarted your computer if needed.
    echo.
    pause
    exit /b
)

echo [1/5] Initializing Git Repository...
git init

echo [2/5] Setting main branch...
git branch -M main

echo [3/5] Linking GitHub Remote...
:: Remove old origin if exists to prevent crashes
git remote remove origin >nul 2>nul
git remote add origin https://github.com/rj901126/abkharido.git

echo [4/5] Stage and Commit local files...
git add .
git commit -m "feat: fullstack app with cashfree gateway"

echo [5/5] Pushing files to GitHub main branch...
echo.
git push -u origin main

echo.
echo ===================================================
echo   Done! Check your Vercel Dashboard for progress.
echo ===================================================
echo.
pause
