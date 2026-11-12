@echo off
set PYTHONUTF8=1
cd /d "%~dp0"
echo Encerre o servidor antes desta verificacao. Nenhum dado sera alterado.
py -3 audit_data.py
pause
