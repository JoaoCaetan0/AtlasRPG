@echo off
cd /d "%~dp0"
py -3 -m pip install -r requirements.txt
if errorlevel 1 (
 echo Falha ao instalar dependencias. Confira Python e conexao.
) else (
 echo Dependencias de PDF e nevoa instaladas.
)
pause
