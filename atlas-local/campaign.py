"""Instalação idempotente do acervo incluído, com proprietário real."""
import json
from assets import put,link_maps
from catalog import import_catalog

def create_campaign(c,root,data,user):
 manifest=root/'campaign/manifest.json'
 if not manifest.is_file():raise ValueError('Pacote de conteúdo não incluído. Use import_campaign.py com seus ZIPs originais.')
 content=json.loads(manifest.read_text(encoding='utf-8'));tid='estigma-'+user
 c.execute('INSERT OR IGNORE INTO tables VALUES(?,?,?,?)',(tid,'Estigma do Caos','Campanha principal e aventura paralela A Ferida que Caminha.','Estigma do Caos'))
 c.execute('INSERT OR IGNORE INTO members VALUES(?,?,?)',(tid,user,'owner'));import_catalog(c,root,tid)
 for asset in content['assets']:
  body=(root/'campaign/blobs'/asset['digest']).read_bytes()
  import hashlib
  if hashlib.sha256(body).hexdigest()!=asset['digest']:raise ValueError('Conteúdo corrompido: '+asset['name'])
  aid=put(c,data,tid,asset['source'],body)
  if asset.get('title'):c.execute('UPDATE assets SET name=? WHERE id=?',(asset['title'],aid))
  # Organização inicial do proprietário é independente dos jogadores.
  folder=asset.get('folder','')
  if folder:c.execute('INSERT OR IGNORE INTO placements VALUES(?,?,?,?)',(aid,user,folder,''))
 report=link_maps(c,tid)
 return {'id':tid,'files':len(content['assets']),'linked':report['linked'],'missing':len(report['missing'])}
