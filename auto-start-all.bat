@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: Colors for output (using PowerShell for colored output)
set "RESET=[0m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "BLUE=[34m"
set "CYAN=[36m"
set "MAGENTA=[35m"

:: Title
cls
call :color_echo %MAGENTA% "=========================================="
call :color_echo %MAGENTA% "  🦞 OpenClaw Full Auto-Start System"
call :color_echo %MAGENTA% "=========================================="
echo.

:: Configuration file path
set "ENV_FILE=%~dp0.env"
set "AUTO_IMPROVE_DIR=%~dp0auto-improve"

:: Step 1: Check if .env file exists
call :color_echo %BLUE% "📋 Step 1: Checking environment configuration..."

if not exist "%ENV_FILE%" (
    call :color_echo %RED% "❌ .env file not found!"
    echo.
    call :color_echo %YELLOW% "Creating .env file template..."
    call :create_env_template
    call :color_echo %YELLOW% "Please edit the .env file and add your OpenAI OAuth credentials."
    call :color_echo %YELLOW% "Then run this script again."
    echo.
    pause
    exit /b 1
)

call :color_echo %GREEN% "✅ .env file found"
echo.

:: Step 2: Check for OpenAI OAuth credentials
call :color_echo %BLUE% "📋 Step 2: Checking OpenAI OAuth credentials..."

set "CLIENT_ID_FOUND=0"
set "CLIENT_SECRET_FOUND=0"

:: Read .env file and check for credentials
for /f "tokens=*" %%a in ('type "%ENV_FILE%" ^| findstr /i "OPENAI_CLIENT_ID"') do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        echo !line! | findstr /i /c:"OPENAI_CLIENT_ID=" >nul
        if !errorlevel! equ 0 (
            set "CLIENT_ID_FOUND=1"
        )
    )
)

for /f "tokens=*" %%a in ('type "%ENV_FILE%" ^| findstr /i "OPENAI_CLIENT_SECRET"') do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        echo !line! | findstr /i /c:"OPENAI_CLIENT_SECRET=" >nul
        if !errorlevel! equ 0 (
            set "CLIENT_SECRET_FOUND=1"
        )
    )
)

:: Check if credentials are actually set (not just placeholders)
for /f "tokens=2 delims=" %%a in ('type "%ENV_FILE%" ^| findstr /i "^OPENAI_CLIENT_ID="') do (
    set "CLIENT_ID_VALUE=%%a"
    if not "%%a"=="" if not "%%a"=="your_client_id_here" if not "%%a"=="YOUR_CLIENT_ID" set "CLIENT_ID_FOUND=2"
)

for /f "tokens=2 delims=" %%a in ('type "%ENV_FILE%" ^| findstr /i "^OPENAI_CLIENT_SECRET="') do (
    set "CLIENT_SECRET_VALUE=%%a"
    if not "%%a"=="" if not "%%a"=="your_client_secret_here" if not "%%a"=="YOUR_CLIENT_SECRET" set "CLIENT_SECRET_FOUND=2"
)

if %CLIENT_ID_FOUND% lss 2 (
    call :color_echo %RED% "❌ OPENAI_CLIENT_ID not configured in .env"
    call :show_setup_guide
    exit /b 1
)

if %CLIENT_SECRET_FOUND% lss 2 (
    call :color_echo %RED% "❌ OPENAI_CLIENT_SECRET not configured in .env"
    call :show_setup_guide
    exit /b 1
)

call :color_echo %GREEN% "✅ OpenAI OAuth credentials found"
echo.

:: Step 3: Load environment variables
call :color_echo %BLUE% "📋 Step 3: Loading environment variables..."
for /f "tokens=*" %%a in (%ENV_FILE%) do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        if not "!line!"=="" (
            for /f "tokens=1,2 delims=" %%b in ("!line!") do (
                set "%%b"
            )
        )
    )
)
call :color_echo %GREEN% "✅ Environment loaded"
echo.

:: Step 4: Run OAuth2 auto-login
call :color_echo %BLUE% "📋 Step 4: Running OAuth2 authentication..."
echo.

cd /d "%AUTO_IMPROVE_DIR%"

:: Check if already authenticated (token file exists)
if exist "codex-token.json" (
    call :color_echo %GREEN% "✅ Already authenticated (token found)"
) else (
    call :color_echo %YELLOW% "🔐 No existing token found. Starting authentication flow..."
    echo.
    
    :: Run auto-login
    node auto-login.mjs
    
    if !errorlevel! neq 0 (
        call :color_echo %RED% "❌ Authentication failed!"
        call :color_echo %YELLOW% "Please check your credentials and try again."
        pause
        exit /b 1
    )
    
    call :color_echo %GREEN% "✅ Authentication successful!"
)

echo.

:: Step 5: Start all components
call :color_echo %BLUE% "📋 Step 5: Starting all components..."
echo.

call :color_echo %CYAN% "🚀 Launching components in separate windows..."
echo.

:: Component 1: Auto-Improve Engine
call :color_echo %MAGENTA% "  [1/3] Starting Auto-Improve Engine..."
start "🦞 Auto-Improve Engine" cmd /k "cd /d %AUTO_IMPROVE_DIR% && echo Starting Auto-Improve Engine with Codex 5.1 Max... && color 0A && node auto-improve.mjs"
timeout /t 3 /nobreak > nul

:: Component 2: Health Monitor  
call :color_echo %MAGENTA% "  [2/3] Starting Health Monitor..."
start "💓 Health Monitor" cmd /k "cd /d %AUTO_IMPROVE_DIR% && echo Starting System Health Monitor... && color 0B && node monitor.mjs"
timeout /t 2 /nobreak > nul

:: Component 3: OpenClaw Gateway
call :color_echo %MAGENTA% "  [3/3] Starting OpenClaw Gateway..."
start "🌐 OpenClaw Gateway" cmd /k "cd /d %~dp0 && echo Starting OpenClaw Gateway... && color 0E && pnpm dev gateway"

:: Wait for components to initialize
timeout /t 5 /nobreak > nul

:: Final Summary
echo.
call :color_echo %GREEN% "=========================================="
call :color_echo %GREEN% "  ✅ All Systems Started Successfully!"
call :color_echo %GREEN% "=========================================="
echo.
call :color_echo %CYAN% "Components running:"
echo.
call :color_echo %MAGENTA% "  🦞 Auto-Improve Engine" 
echo     ^(Main improvement engine with Codex 5.1 Max^)
call :color_echo %MAGENTA% "  💓 Health Monitor"     
echo     ^(Real-time system health monitoring^)
call :color_echo %MAGENTA% "  🌐 OpenClaw Gateway"   
echo     ^(WhatsApp gateway service^)
echo.
call :color_echo %YELLOW% "Quick Commands:"
call :color_echo %RESET% "  Rollback: cd auto-improve ^&^& node rollback.mjs list"
call :color_echo %RESET% "  Status:   cd auto-improve ^&^& node rollback.mjs last-stable"
call :color_echo %RESET% "  Logs:     tail -f auto-improve/monitor.log"
echo.
call :color_echo %BLUE% "Press any key to close this window..."
pause > nul

exit /b 0

:: Helper Functions
:color_echo
    set "color_code=%~1"
    set "message=%~2"
    powershell -NoProfile -Command "Write-Host '%message%' -ForegroundColor %color_code:~1,-1%"
    exit /b 0

:create_env_template
    (
        echo # OpenClaw Configuration
        echo.
        echo # OpenAI OAuth Credentials ^(Required for Auto-Improve^)
        echo # Get these from https://platform.openai.com/settings/organization/oauth
        echo OPENAI_CLIENT_ID=your_client_id_here
        echo OPENAI_CLIENT_SECRET=your_client_secret_here
        echo.
        echo # Twilio Configuration ^(for WhatsApp^)
        echo # Copy to .env and fill with your Twilio credentials
        echo TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        echo TWILIO_AUTH_TOKEN=your_auth_token_here
        echo # Must be a WhatsApp-enabled Twilio number, prefixed with whatsapp:
        echo TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
        echo ZAI_API_KEY=your_zai_api_key_here
        echo.
        echo # OpenClaw + LINE + Codex Configuration
        echo # LINE Messaging API credentials ^(from LINE Developers Console^)
        echo LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
        echo LINE_CHANNEL_SECRET=your_channel_secret_here
        echo.
        echo # OpenClaw Gateway settings
        echo OPENCLAW_GATEWAY_PORT=18789
        echo OPENCLAW_GATEWAY_BIND=loopback
        echo.
        echo # Optional: Ngrok region for webhook tunnel
        echo # NGROK_REGION=jp
    ) > "%ENV_FILE%"
    call :color_echo %GREEN% "✅ Created .env template at %ENV_FILE%"
    exit /b 0

:show_setup_guide
    echo.
    call :color_echo %YELLOW% "=========================================="
    call :color_echo %YELLOW% "  🔐 OpenAI OAuth Setup Required"
    call :color_echo %YELLOW% "=========================================="
    echo.
    call :color_echo %RESET% "To use the Auto-Improve system, you need:"
    echo.
    call :color_echo %CYAN% "  1. OpenAI account with OAuth app credentials"
    call :color_echo %RESET% "     Visit: https://platform.openai.com/settings/organization/oauth"
    echo.
    call :color_echo %CYAN% "  2. Add these lines to your .env file:"
    call :color_echo %RESET% "     OPENAI_CLIENT_ID=your-actual-client-id"
    call :color_echo %RESET% "     OPENAI_CLIENT_SECRET=your-actual-client-secret"
    echo.
    call :color_echo %YELLOW% "Your .env file is at: %ENV_FILE%"
    call :color_echo %YELLOW% "Please edit it now and re-run this script."
    echo.
    pause
    exit /b 1
