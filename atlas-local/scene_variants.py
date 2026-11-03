"""Aligned time variants share one durable combat and fog identity.

Legacy states are never overwritten: linking a version with independent saved
state is rejected. Existing asset permission checks remain before resolution.
"""
import json
from urllib.parse import urlsplit
import fog

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS scene_layers(table_id TEXT,asset_id TEXT,map_id TEXT,combat_asset TEXT,fog_digest TEXT,PRIMARY KEY(table_id,asset_id))')

def layer(c,tid,aid):
 return c.execute('SELECT * FROM scene_layers WHERE table_id=? AND asset_id=?',(tid,aid)).fetchone()

def combat_key(c,tid,aid):
 row=layer(c,tid,aid)
 return row['combat_asset'] if row else aid

def fog_key(c,tid,digest):
 row=c.execute('SELECT l.fog_digest FROM scene_layers l JOIN assets a ON a.id=l.asset_id AND a.table_id=l.table_id WHERE l.table_id=? AND a.digest=? LIMIT 1',(tid,digest)).fetchone()
 return row[0] if row else digest

def options(c,tid,mid,aid):
 current=layer(c,tid,aid)
 return [{'period':r['period'],'asset_id':r['asset_id'],
          'linked':r['asset_id']==aid or bool(current and layer(c,tid,r['asset_id']) and layer(c,tid,r['asset_id'])['combat_asset']==current['combat_asset'])}
         for r in c.execute('SELECT period,asset_id FROM map_assets WHERE table_id=? AND legacy_id=? ORDER BY rowid',(tid,mid))]

def handle(c,data,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/scene-period':return NotImplemented
 require(master);require(bool(d),405,'Use POST para trocar o horário.')
 from features import scene_map
 from assets import permitted
 current=c.execute('SELECT asset_id,revision FROM scene WHERE table_id=?',(tid,)).fetchone()
 require(current and type(d.get('revision'))==int and d['revision']==current['revision'],409,'A cena mudou. Aguarde a atualização e repita.')
 origin=scene_map(c,tid,current['asset_id'])
 require(origin and origin['legacy_id']==d.get('map_id'),409,'O mapa atual mudou.')
 target=c.execute('SELECT asset_id FROM map_assets WHERE table_id=? AND legacy_id=? AND period=?',(tid,origin['legacy_id'],d.get('period'))).fetchone()
 require(target,400,'Horário não disponível neste mapa.')
 source=permitted(c,tid,current['asset_id'],user,True);dest=permitted(c,tid,target['asset_id'],user,True)
 require(source and dest,404,'Imagem indisponível.')
 if source['id']==dest['id']:
  c.execute('UPDATE scene_context SET period=? WHERE table_id=?',(d['period'],tid))
  c.execute('UPDATE scene SET revision=revision+1 WHERE table_id=?',(tid,))
  return {'ok':True}
 mid=origin['legacy_id']
 left,right=layer(c,tid,source['id']),layer(c,tid,dest['id'])
 require(not left or left['map_id']==mid,409,'Esta imagem já compartilha camadas com outro mapa.')
 require(not right or right['map_id']==mid,409,'Esta versão já compartilha camadas com outro mapa.')
 linked=left and right and left['combat_asset']==right['combat_asset']
 if not linked:
  require(d.get('aligned') is True,400,'Confirme que as versões têm a mesma planta e enquadramento.')
  for asset in (source,dest):
   fog.check_image(data,asset,require)
   # A digest-level mask must not acquire a second, ambiguous scene identity.
   elsewhere=c.execute('SELECT 1 FROM map_assets m JOIN assets a ON a.id=m.asset_id WHERE m.table_id=? AND a.digest=? AND m.legacy_id<>? LIMIT 1',(tid,asset['digest'],mid)).fetchone()
   require(not elsewhere,409,'Uma destas imagens também pertence a outro mapa. Cadastre uma imagem exclusiva antes de vincular os horários.')
  sw,sh=fog.dimensions(str(data/'blobs'/source['digest']));dw,dh=fog.dimensions(str(data/'blobs'/dest['digest']))
  require(sw*dh==dw*sh,400,'As proporções das imagens diferem. Alinhe as versões antes de compartilhar tokens e névoa.')
  require(not right,409,'Esta versão já tem outra identidade de cena. Use o catálogo para abrir seu estado preservado.')
  saved=c.execute('SELECT 1 FROM combats WHERE table_id=? AND asset_id=?',(tid,dest['id'])).fetchone()
  mask=c.execute('SELECT 1 FROM fog WHERE table_id=? AND digest=?',(tid,dest['digest'])).fetchone()
  require(not saved and (not mask or dest['digest']==fog_key(c,tid,source['digest'])),409,'Esta versão possui combate ou névoa independentes. Nada foi alterado. Abra-a pelo catálogo para acessar o estado preservado.')
  anchor=combat_key(c,tid,source['id']);digest=fog_key(c,tid,source['digest'])
  # Invalidate pending writes from clients still viewing either old version.
  state=c.execute('SELECT state,revision FROM combats WHERE table_id=? AND asset_id=?',(tid,anchor)).fetchone()
  if not state:
   from combat import fresh
   c.execute('INSERT INTO combats VALUES(?,?,?,1)',(tid,anchor,json.dumps(fresh(c,tid))))
  else:c.execute('UPDATE combats SET revision=revision+1 WHERE table_id=? AND asset_id=?',(tid,anchor))
  mask=fog.read(c,tid,digest);mask['revision']+=1;fog.write(c,tid,digest,mask)
  for asset in (source,dest):
   c.execute('INSERT OR IGNORE INTO scene_layers VALUES(?,?,?,?,?)',(tid,asset['id'],mid,anchor,digest))
 c.execute('UPDATE assets SET public=1 WHERE id=?',(dest['id'],))
 c.execute('UPDATE scene SET asset_id=?,revision=revision+1 WHERE table_id=?',(dest['id'],tid))
 c.execute('INSERT INTO scene_context VALUES(?,?,?) ON CONFLICT(table_id) DO UPDATE SET map_id=excluded.map_id,period=excluded.period',(tid,mid,d['period']))
 return {'ok':True}
