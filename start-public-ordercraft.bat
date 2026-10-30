@echo off
title OrderCraft Cloud Launcher
echo ========================================================
echo        OrderCraft Manufacturing ERP - Cloud Launcher
echo ========================================================
echo.

echo [1/3] Starting Dedicated MySQL 8.0 on port 3307...
start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --no-defaults --port=3307 --datadir="c:\ORDER_CRAFT\mysql-data" --console > nul 2>&1
timeout /t 3 /nobreak > nul

echo [2/3] Starting Unified Backend & Angular ERP on port 8081...
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
start /b "" "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot\bin\java.exe" -jar "c:\ORDER_CRAFT\backend\target\ordercraft-backend-1.0.0.jar" > nul 2>&1
timeout /t 6 /nobreak > nul

echo [3/3] Opening Public Internet Tunnel (No Card / 100%% Free)...
echo.
echo ========================================================
echo Your Public Link will appear below. Share it with anyone!
echo Press Ctrl+C to stop the public server.
echo ========================================================
echo.
"c:\ORDER_CRAFT\tools\cloudflared.exe" tunnel --url http://localhost:8081
