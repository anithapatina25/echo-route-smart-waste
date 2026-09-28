@echo off
echo =============================================================
echo   Starting ECHO ROUTE SMART WASTE Portal
echo   "Smarter Routes. Cleaner Communities."
echo =============================================================
echo.
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
echo.
"%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe" server.js
pause
