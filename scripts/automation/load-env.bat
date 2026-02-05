@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   🦞 OpenClaw Environment Loader
echo ============================================
echo.

set "ENV_FILE=%~dp0.env"

if not exist "%ENV_FILE%" (
    echo ❌ .env file not found at: %ENV_FILE%
    pause
    exit /b 1
)

echo 📂 Loading environment variables from .env file...
echo.

setlocal EnableDelayedExpansion

for /f "tokens=*" %%a in (%ENV_FILE%) do (
    set "line=%%a"
    
    :: Skip comments and empty lines
    if not "!line:~0,1!"=="#" (
        if not "!line!"=="" (
            :: Check if line contains =
            echo !line! | findstr /C:"=" >nul
            if !errorlevel! equ 0 (
                for /f "tokens=1,* delims=" %%b in ("!line!") do (
                    set "var_name=%%b"
                    set "var_value=%%c"
                    
                    :: Remove any surrounding quotes
                    set "var_value=!var_value:"=!"
                    
                    :: Set the environment variable
                    endlocal
                    set "%%b=%%c"
                    setlocal EnableDelayedExpansion
                    
                    echo   ✓ Set %%b
                )
            )
        )
    )
)

echo.
echo ✅ Environment variables loaded successfully!
echo.
echo 🚀 You can now run OpenClaw commands in this session.
echo.

endlocal

:: Keep the window open with a new prompt
cmd /k
