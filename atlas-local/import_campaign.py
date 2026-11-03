import argparse,json
from pathlib import Path
import server
from assets import import_sources
from catalog import import_catalog

def main():
 p=argparse.ArgumentParser(description='Importar campanha para sua conta local');p.add_argument('--owner',required=True);p.add_argument('--sources',required=True,type=Path);a=p.parse_args()
 files=[]
 for name in ['Mapas_Estigma_do_Caos_COM_EDITOR_V2.zip','Mapas_Estigma_do_Caos_PARTE_2.zip','A_Ferida_que_Caminha_Materiais_da_Sessao.zip','Estigma_do_Caos_Ficha_Editavel_corrigida.pdf']:
  found=list(a.sources.rglob(name))
  if len(found)!=1:raise SystemExit('Esperado exatamente um arquivo: '+name)
  files.append(found[0])
 server.init()
 with server.db() as c:
  owner=c.execute('SELECT id FROM users WHERE name=?',(a.owner,)).fetchone()
  if not owner:raise SystemExit('Crie primeiro sua conta no aplicativo.')
  tid='estigma-'+owner['id'];c.execute('INSERT OR IGNORE INTO tables VALUES(?,?,?,?)',(tid,'Estigma do Caos','Campanha principal e A Ferida que Caminha','Estigma do Caos'))
  c.execute('INSERT OR IGNORE INTO members VALUES(?,?,?)',(tid,owner['id'],'owner'));import_catalog(c,server.ROOT,tid)
  report=import_sources(c,server.DATA,tid,files)
 (server.DATA/'importacao-estigma.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'table_id':tid,'files':report['files'],'linked':report['linked'],'missing':len(report['missing'])},ensure_ascii=False))
if __name__=='__main__':main()
