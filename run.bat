@echo off
call npx npm-check-updates -u
if %errorlevel% neq 0 (
    echo npm-check-updates failed
    pause
    exit /b %errorlevel%
)

node server\server.mjs
if %errorlevel% neq 0 (
    echo Server failed to start
    pause
    exit /b %errorlevel%
)

pause