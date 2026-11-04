"""One previous presented map per table; independent of combat undo."""
def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS previous_scene(table_id TEXT PRIMARY KEY REFERENCES tables(id),asset_id TEXT,map_id TEXT,period TEXT)')

def remember(c,tid,new_asset,new_map=None):
 from features import scene_map
 old=c.execute('SELECT asset_id FROM scene WHERE table_id=?',(tid,)).fetchone()
 if not old or not old['asset_id'] or old['asset_id']==new_asset:return
 context=scene_map(c,tid,old['asset_id'])
 if new_map and context and context['legacy_id']==new_map:return
 c.execute('INSERT INTO previous_scene VALUES(?,?,?,?) ON CONFLICT(table_id) DO UPDATE SET asset_id=excluded.asset_id,map_id=excluded.map_id,period=excluded.period',(tid,old['asset_id'],context['legacy_id'] if context else None,context['period'] if context else None))

def read(c,tid):
 row=c.execute('SELECT p.*,a.name FROM previous_scene p JOIN assets a ON a.id=p.asset_id AND a.table_id=p.table_id WHERE p.table_id=?',(tid,)).fetchone()
 if not row:return None
 current=c.execute('SELECT asset_id FROM scene WHERE table_id=?',(tid,)).fetchone()
 if current and current[0]==row['asset_id']:return None
 result=dict(row)
 m=c.execute('SELECT title FROM maps WHERE table_id=? AND legacy_id=?',(tid,row['map_id'])).fetchone()
 result['title']=m['title'] if m else row['name']
 return result

def restore(c,tid,revision,require):
 current=c.execute('SELECT revision FROM scene WHERE table_id=?',(tid,)).fetchone()
 require(current and current['revision']==revision,409,'A cena mudou. Aguarde a atualização e tente novamente.')
 target=read(c,tid);require(target,404,'Ainda não há um mapa anterior disponível.')
 remember(c,tid,target['asset_id'],target['map_id'])
 c.execute('UPDATE scene SET asset_id=?,revision=revision+1 WHERE table_id=?',(target['asset_id'],tid))
 c.execute('DELETE FROM scene_context WHERE table_id=?',(tid,))
 if target['map_id'] and c.execute('SELECT 1 FROM map_assets WHERE table_id=? AND legacy_id=? AND asset_id=? AND period=?',(tid,target['map_id'],target['asset_id'],target['period'])).fetchone():
  c.execute('INSERT INTO scene_context VALUES(?,?,?)',(tid,target['map_id'],target['period']))
 c.execute('UPDATE assets SET public=1 WHERE id=? AND table_id=?',(target['asset_id'],tid))
 return {'ok':True}
