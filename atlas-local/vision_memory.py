"""Isolated exploration. Legacy user masks are seeded once, never replayed after reset."""
import json
from urllib.parse import urlsplit
import fog

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS token_exploration(table_id TEXT,digest TEXT,combat_id TEXT,token_id TEXT,user_id TEXT,cells TEXT NOT NULL,PRIMARY KEY(table_id,digest,combat_id,token_id,user_id))')
 c.execute('CREATE TABLE IF NOT EXISTS exploration_migration(table_id TEXT,digest TEXT,user_id TEXT,PRIMARY KEY(table_id,digest,user_id))')

def seed(c,tid,key,user,scenes):
 if c.execute('SELECT 1 FROM exploration_migration WHERE table_id=? AND digest=? AND user_id=?',(tid,key,user)).fetchone():return
 legacy=c.execute('SELECT cells FROM vision_memory WHERE table_id=? AND digest=? AND user_id=?',(tid,key,user)).fetchone()
 if legacy:
  for aid,state in scenes:
   for t in state['tokens']:
    if t.get('owner')==user:
     c.execute('INSERT OR IGNORE INTO token_exploration VALUES(?,?,?,?,?,?)',(tid,key,aid,t['id'],user,legacy[0]))
 c.execute('INSERT OR IGNORE INTO exploration_migration VALUES(?,?,?)',(tid,key,user))

def remember(c,tid,key,aid,ident,user,cells):
 from token_vision import union
 row=c.execute('SELECT cells FROM token_exploration WHERE table_id=? AND digest=? AND combat_id=? AND token_id=? AND user_id=?',(tid,key,aid,ident,user)).fetchone()
 old=row[0] if row else fog.COVERED
 merged=union(old,cells)
 if merged!=old:
  c.create_function('vision_union',2,union)
  c.execute('INSERT INTO token_exploration VALUES(?,?,?,?,?,?) ON CONFLICT(table_id,digest,combat_id,token_id,user_id) DO UPDATE SET cells=vision_union(token_exploration.cells,excluded.cells)',(tid,key,aid,ident,user,cells))
 return merged

def handle(c,data,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/token-memory-clear':return NotImplemented
 require(master);require(bool(d),405,'Use POST.')
 from assets import permitted
 from scene_variants import fog_key,combat_key
 from token_vision import scenes
 asset=permitted(c,tid,d.get('asset_id'),user,master);require(asset and asset['mime'].startswith('image/'),404,'Mapa indisponível.')
 aid=combat_key(c,tid,asset['id']);key=fog_key(c,tid,asset['digest'])
 row=c.execute('SELECT state,revision FROM combats WHERE table_id=? AND asset_id=?',(tid,aid)).fetchone();require(row,404,'Cena indisponível.')
 require(type(d.get('revision')) is int and d['revision']==row['revision'],409,'A cena mudou. Confira o token e tente novamente.')
 ident=d.get('token_id');state=json.loads(row['state']);require(any(t['id']==ident for t in state['tokens']),404,'Token indisponível.')
 all_scenes=scenes(c,tid,key)
 users={t.get('owner') for _,s in all_scenes for t in s['tokens'] if t.get('owner')}
 for owner in users:seed(c,tid,key,owner,all_scenes)
 c.execute('UPDATE token_exploration SET cells=? WHERE table_id=? AND digest=? AND combat_id=? AND token_id=?',(fog.COVERED,tid,key,aid,ident))
 # Revision invalidates the viewer raster; normal post-commit realtime invalidation follows.
 c.execute('UPDATE combats SET revision=revision+1 WHERE table_id=? AND asset_id=?',(tid,aid))
 return {'ok':True,'token_id':ident}
