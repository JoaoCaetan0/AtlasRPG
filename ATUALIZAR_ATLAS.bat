@echo off
setlocal
cd /d "%~dp0"
echo Atualizacao Atlas - excluir fichas de personagem
echo.
where py >nul 2>nul
if not errorlevel 1 (
  py -3 aplicar_atualizacao.py
) else (
  python aplicar_atualizacao.py
)
if errorlevel 1 (
  echo.
  echo A atualizacao nao foi aplicada. Verifique a mensagem acima.
  pause
  exit /b 1
)
echo.
pause
