@echo off
cd dashboard
call npx npm-check-updates -u
if %errorlevel% neq 0 (
    echo npm-check-updates failed
    pause
    exit /b %errorlevel%
)
echo npm-check-updates completed successfully

npm run dev
pause

