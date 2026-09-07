@echo off
setlocal EnableDelayedExpansion
title ATM Sensor Barcode Manager - Windows Installation Setup Builder

echo ==============================================================================
echo   ATM SENSOR BARCODE MANAGER · WINDOWS SETUP (.EXE) INSTALLER BUILDER
echo   Target: Zebra ZT230-200dpi Industrial Thermal Label System
echo ==============================================================================
echo.

:: Step 1: Check Node.js
echo [1/4] Checking Node.js Environment...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in system PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
node -v
echo   [OK] Node.js detected.

:: Step 2: Install dependencies
echo.
echo [2/4] Verifying NPM Dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install npm packages.
    pause
    exit /b 1
)
echo   [OK] Dependencies verified.

:: Step 3: Compile React UI and Server
echo.
echo [3/4] Compiling React Frontend and bundling Thermal Print Engine...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)
echo   [OK] Production assets compiled in \dist.

:: Step 4: Packaging NSIS Installation Setup Wizard
echo.
echo [4/4] Building Windows Installation Package (NSIS Setup Wizard)...
call npx electron-builder --win --x64 --config electron-builder.json
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Installer packaging failed.
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo   INSTALLATION PACKAGE GENERATED SUCCESSFULLY!
echo.
echo   Location: release\ATM-Sensor-Barcode-Manager-Setup.exe
echo.
echo   DELIVERY INSTRUCTIONS FOR CLIENT:
echo   1. Send "ATM-Sensor-Barcode-Manager-Setup.exe" to your client.
echo   2. When they double-click and run the installer:
echo      * The Windows Installation Wizard will guide them through setup
echo      * It installs the program to "Program Files\ATM Sensor Barcode Manager"
echo      * It creates Desktop and Start Menu shortcuts
echo      * It automatically configures Windows Print Spooler and Firewall rules
echo      * It creates the Windows Programs & Features Uninstaller
echo      * It launches the application ready for printing!
echo ==============================================================================
echo.
pause
