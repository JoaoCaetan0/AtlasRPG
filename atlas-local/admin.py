"""Configuração por mesa, cadastro de mapas e padrões para novos combates."""
import json,secrets
from urllib.parse import urlsplit,parse_qs

def install(c):
 c.execute("CREATE TABLE IF NOT EXISTS table_settings(table_id TEXT PRIMARY KEY REFERENCES tables(id),config TEXT,revision INTEGER DEFAULT 0)")
 c.execute("CREATE TABLE IF NOT EXISTS map_revisions(table_id TEXT,map_id TEXT,revision INTEGER,PRIMARY KEY(table_id,map_id))")
def defaults():
 from combat import fresh
 s=fresh();return {'grid':s['grid'],'conditions':s['conditions']}
def settings(c,tid):
 r=c.execute('SELECT * FROM table_settings WHERE table_id=?',(tid,)).fetchone()
 return (json.loads(r['config']),r['revision']) if r else (defaults(),0)
def text(v,n):return isinstance(v,str) and len(v)<=n

def handle(c,path,d,user,tid,master,require):
 ep=urlsplit(path).path
 if ep not in ['/api/admin-settings','/api/admin-maps']:return NotImplemented
 require(master)
 if ep=='/api/admin-settings':
  config,revision=settings(c,tid)
  if d:
   require(d.get('revision')==revision,409,'Configuração alterada por outro mestre. Reabra o painel antes de salvar.')
   name=d.get('name');synopsis=d.get('synopsis');system=d.get('system')
   require(text(name,120) and name.strip() and text(synopsis,3000) and text(system,120) and system.strip(),400,'Revise nome, sinopse e sistema.')
   config=d.get('config');require(isinstance(config,dict) and set(config)=={'grid','conditions'},400,'Configuração inválida.')
   from combat import fresh,validate
   sample=fresh();sample.update(config);validate(sample,c,tid,require)
   c.execute('UPDATE tables SET name=?,synopsis=?,system=? WHERE id=?',(name.strip(),synopsis,system.strip(),tid))
   c.execute('INSERT INTO table_settings VALUES(?,?,?) ON CONFLICT(table_id) DO UPDATE SET config=excluded.config,revision=excluded.revision',(tid,json.dumps(config),revision+1));revision+=1
  table=c.execute('SELECT name,synopsis,system FROM tables WHERE id=?',(tid,)).fetchone()
  return {**dict(table),'config':config,'revision':revision}
 if not d:
  rows=c.execute('SELECT m.*,COALESCE(r.revision,0) AS revision FROM maps m LEFT JOIN map_revisions r ON r.table_id=m.table_id AND r.map_id=m.legacy_id WHERE m.table_id=? ORDER BY m.title',(tid,)).fetchall()
  return [{**dict(r),'metadata':json.loads(r['metadata']),'images':[dict(x) for x in c.execute('SELECT period,asset_id FROM map_assets WHERE table_id=? AND legacy_id=? ORDER BY period',(tid,r['legacy_id']))]} for r in rows]
 mid=d.get('id')
 if mid:
  row=c.execute('SELECT * FROM maps WHERE table_id=? AND legacy_id=?',(tid,mid)).fetchone();require(row,404,'Mapa não encontrado.')
  revision=c.execute('SELECT revision FROM map_revisions WHERE table_id=? AND map_id=?',(tid,mid)).fetchone();revision=revision[0] if revision else 0
  metadata=json.loads(row['metadata'])
 else:mid='custom-'+secrets.token_hex(8);revision=0;metadata={}
 require(d.get('revision')==revision,409,'Mapa alterado por outro mestre. Reabra antes de salvar.')
 title=d.get('title','');region=d.get('region','');notes=d.get('notes','');visible=d.get('visible',False);images=d.get('images')
 require(text(title,160) and title.strip() and text(region,200) and text(notes,10000) and type(visible)==bool,400,'Campos do mapa inválidos.')
 require(isinstance(images,list) and 1<=len(images)<=20,400,'Cadastre de 1 a 20 versões por mapa.')
 periods=set()
 for im in images:
  require(isinstance(im,dict) and text(im.get('period'),40) and im['period'].strip(),400,'Informe um nome para cada versão.')
  key=im['period'].strip().casefold();require(key not in periods,400,'Não repita o nome de uma versão.');periods.add(key)
  asset=c.execute("SELECT 1 FROM assets WHERE table_id=? AND id=? AND mime LIKE 'image/%'",(tid,im.get('asset_id'))).fetchone();require(asset,400,'Selecione uma imagem desta mesa.')
 kind=d.get('kind',metadata.get('kind','unclassified'));tags=d.get('tags',metadata.get('tags',[]))
 require(kind in ('unclassified','regional','encounter'),400,'Tipo do mapa inválido.')
 require(isinstance(tags,list) and len(tags)<=20 and all(text(t,40) and t.strip() for t in tags),400,'Use até 20 etiquetas de até 40 caracteres.')
 metadata.update(region=region,notes=notes,kind=kind,tags=list(dict.fromkeys(t.strip() for t in tags)))
 c.execute('INSERT INTO maps VALUES(?,?,?,?,?) ON CONFLICT(table_id,legacy_id) DO UPDATE SET title=excluded.title,metadata=excluded.metadata,visible=excluded.visible',(tid,mid,title.strip(),json.dumps(metadata),int(visible)))
 c.execute('DELETE FROM map_assets WHERE table_id=? AND legacy_id=?',(tid,mid))
 for im in images:
  c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,mid,im['period'].strip(),im['asset_id']))
  if visible:c.execute('UPDATE assets SET public=1 WHERE table_id=? AND id=?',(tid,im['asset_id']))
 c.execute('INSERT INTO map_revisions VALUES(?,?,?) ON CONFLICT(table_id,map_id) DO UPDATE SET revision=excluded.revision',(tid,mid,revision+1))
 return {'id':mid,'revision':revision+1}
