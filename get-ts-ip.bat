@echo off
chcp 65001 >nul
tailscale ip > ts_ip.txt 2>nul
type ts_ip.txt
pause
