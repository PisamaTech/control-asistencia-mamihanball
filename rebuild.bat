@echo off
echo === Limpiando archivos antiguos ===
rmdir /s /q .next 2>nul
rmdir /s /q out 2>nul
echo.

echo === Instalando dependencias ===
call npm install
echo.

echo === Construyendo el proyecto ===
call npm run build
echo.

echo === Build completado ===
echo Ahora ejecuta: firebase deploy
pause
