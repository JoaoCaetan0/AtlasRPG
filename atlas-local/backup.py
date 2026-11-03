"""Backup completo local. Execute com o servidor encerrado para incluir arquivos de forma consistente."""
import argparse,datetime,sqlite3
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import server
p=argparse.ArgumentParser(description=__doc__);p.add_argument('destination',type=Path);a=p.parse_args()
if not (server.DATA/'atlas.sqlite3').is_file():raise SystemExit('Nenhum banco local encontrado.')
if a.destination.resolve().is_relative_to(server.DATA.resolve()):raise SystemExit('Escolha destino fora da pasta data/.')
if a.destination.exists():raise SystemExit('Destino já existe. Use outro nome para preservar o backup anterior.')
with ZipFile(a.destination,'x',ZIP_DEFLATED) as z:
 for f in server.DATA.rglob('*'):
  if f.is_file():z.write(f,Path('data')/f.relative_to(server.DATA))
print('Backup criado:',a.destination)
