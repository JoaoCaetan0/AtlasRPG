import subprocess,sys
from pathlib import Path
print('Use apenas se você estiver com o pacote de código sem o acervo incluído.')
owner=input('Nome exato da sua conta no Atlas: ').strip()
folder=input('Pasta que contém os dois ZIPs de mapas, o ZIP da aventura e a ficha corrigida: ').strip().strip('"')
subprocess.run([sys.executable,str(Path(__file__).with_name('import_campaign.py')),'--owner',owner,'--sources',folder],check=True)
