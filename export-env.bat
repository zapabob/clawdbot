@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   💾 Export Current Environment to .env
echo ============================================
echo.

set "ENV_FILE=%~dp0.env.backup"

echo 📤 Exporting environment variables to %ENV_FILE%...
echo.
(
echo # OpenClaw Environment Export
echo # Generated on: %date% %time%
echo.
echo # OpenAI Configuration
echo OPENAI_CLIENT_ID=%OPENAI_CLIENT_ID%
echo OPENAI_CLIENT_SECRET=%OPENAI_CLIENT_SECRET%
echo OPENAI_API_KEY=%OPENAI_API_KEY%
echo.
echo # Twilio Configuration
echo TWILIO_ACCOUNT_SID=%TWILIO_ACCOUNT_SID%
echo TWILIO_AUTH_TOKEN=%TWILIO_AUTH_TOKEN%
echo TWILIO_WHATSAPP_FROM=%TWILIO_WHATSAPP_FROM%
echo.
echo # LINE Configuration
echo LINE_CHANNEL_ACCESS_TOKEN=%LINE_CHANNEL_ACCESS_TOKEN%
echo LINE_CHANNEL_SECRET=%LINE_CHANNEL_SECRET%
echo.
echo # Gateway Settings
echo OPENCLAW_GATEWAY_PORT=%OPENCLAW_GATEWAY_PORT%
echo OPENCLAW_GATEWAY_BIND=%OPENCLAW_GATEWAY_BIND%
echo OPENCLAW_GATEWAY_MODE=%OPENCLAW_GATEWAY_MODE%
echo.
echo # Auto-Improve Settings
echo AUTO_IMPROVE_ENABLED=%AUTO_IMPROVE_ENABLED%
echo AUTO_IMPROVE_MODE=%AUTO_IMPROVE_MODE%
echo AUTO_IMPROVE_CHECK_INTERVAL=%AUTO_IMPROVE_CHECK_INTERVAL%
) > "%ENV_FILE%"

echo ✅ Environment exported to: %ENV_FILE%
echo.
echo 📝 To apply these to your main .env file:
echo    copy .env.backup .env
echo.
pause
