@echo off
echo ======================================
echo Запуск PAVEPO приложения
echo ======================================
echo.
echo Запуск сервера...
start "PAVEPO Server" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 2 /nobreak >nul
echo Запуск Telegram бота...
start "PAVEPO Bot" cmd /k "cd /d %~dp0 && node bot.js"
echo.
echo ======================================
echo Готово!
echo Сервер: http://localhost:3000
echo Бот: @pavepobot
echo ======================================
echo.
pause
