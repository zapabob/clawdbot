@echo off
title Style-Bert-VITS2 TTS API Server (port 5000)
chcp 65001 > NUL
echo ===================================================
echo  Starting Style-Bert-VITS2 FastAPI Server
echo  API: http://localhost:5000
echo  Docs: http://localhost:5000/docs
echo  Models: http://localhost:5000/models/info
echo ===================================================
pushd "C:\Users\downl\Desktop\EasyNovelAssistant\EasyNovelAssistant\Style-Bert-VITS2"
venv\Scripts\python server_fastapi.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to start SBV2 server. Check venv and model files.
    pause
    popd
    exit /b %errorlevel%
)
popd
pause
