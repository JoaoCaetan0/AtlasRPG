import argparse,os,subprocess,sys,webbrowser
from pathlib import Path
from network import bind_address
p=argparse.ArgumentParser(description='Atlas — servidor local e Radmin VPN')
p.add_argument('--network',action='store_true');p.add_argument('--host');a=p.parse_args()
try:
 host=a.host
 if a.network and not host:
  print('Conecte o Radmin VPN antes de iniciar. Copie o IPv4 mostrado ao lado do seu computador.')
  if sys.platform=='win32':
   subprocess.run(['powershell','-NoProfile','-Command',"Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias,IPAddress | Format-Table -AutoSize"],check=False)
  host=input('IPv4 da interface Radmin ou LAN: ').strip()
 host=bind_address(host)
except (ValueError,EOFError) as e:raise SystemExit(str(e))
print(f'Endereço da mesa: http://{host}:8765\nCompartilhe apenas com participantes conectados à sua rede. Ctrl+C encerra.')
env={**os.environ,'ATLAS_BIND':host,'ATLAS_PORT':'8765'}
try:subprocess.run([sys.executable,str(Path(__file__).with_name('server.py'))],env=env,check=True)
except KeyboardInterrupt:pass
except subprocess.CalledProcessError:print('Não foi possível iniciar. Confira se o IP pertence ao seu computador e se a porta está livre.')
