@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw AGI システム健全性チェック
REM ============================================

set SCRIPTDIR=%~dp0
set AGIDIR=%SCRIPTDIR%auto-improve

echo ============================================
echo  OpenClaw AGI システム健全性チェック
echo ============================================
echo チェック時刻: %date% %time%
echo.

REM 1. Tailscale
echo [1] Tailscale接続状態:
tailscale status >nul 2>&1
if %errorlevel% equ 0 (
    tailscale status | head -5
    for /f "tokens=*" %%a in ('tailscale ip 2^nul') do echo    IP: %%a
) else (
    echo    ❌ Tailscale未接続
)
echo.

REM 2. Gateway
echo [2] Gateway稼働状態:
curl -s -o nul -w "    HTTP応答コード: %{http_code}\n" http://127.0.0.1:18789 2>nul
tasklist | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo    ✅ node.exe 実行中
) else (
    echo    ❌ node.exe 停止中
)
echo.

REM 3. Codex認証
echo [3] Codex認証状態:
if exist "%AGIDIR%\codex-token.json" (
    for %%a in ("%AGIDIR%\codex-token.json") do echo    ✅ 認証済み (最終更新: %~ta)
) else (
    echo    ❌ 未認証
)
echo.

REM 4. AGIエンジン
echo [4] AGIエンジン状態:
tasklist | findstr /i "auto-improve" >nul
if %errorlevel% equ 0 (
    echo    ✅ 実行中
) else (
    echo    ⚠️  停止中
)
if exist "%SCRIPTDIR%agi-system.log" (
    echo    最終実行: %~za バイト
)
echo.

REM 5. ヘルスモニタ
echo [5] ヘルスモニタ:
tasklist | findstr /i "monitor" >nul
if %errorlevel% equ 0 (
    echo    ✅ 実行中
) else (
    echo    ⚠️  停止中
)
echo.

REM 6. ネットワークポート
echo [6] ネットワークポート:
netstat -an | findstr ":18789" >nul
if %errorlevel% equ 0 (
    echo    ✅ 18789番ポート Listen中
) else (
    echo    ❌ 18789番ポート 未使用
)
echo.

REM 7. 設定ファイル
echo [7] 設定ファイル:
if exist "%SCRIPTDIR%.env" (
    echo    ✅ .env 存在
) else (
    echo    ❌ .env 欠落
)
if exist "%SCRIPTDIR%config.json" (
    echo    ✅ config.json 存在
) else (
    echo    ⚠️  config.json 欠落
)
echo.

REM まとめ
echo ============================================
echo 健全性チェック完了
echo ============================================
pause
