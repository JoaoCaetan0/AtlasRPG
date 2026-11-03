import hashlib,json,unicodedata,zipfile,secrets
from pathlib import Path,PurePosixPath
MIMES={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.txt':'text/plain','.md':'text/plain'}
def install(c):
 from scene_variants import install as layers_install
 layers_install(c)
 from fog import install as fog_install
 fog_install(c)
 from combat import install as combat_install
 combat_install(c)
 c.executescript('''
 CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,table_id TEXT REFERENCES tables(id),source TEXT,name TEXT,mime TEXT,digest TEXT,size INTEGER,public INTEGER DEFAULT 0,UNIQUE(table_id,source));
 CREATE TABLE IF NOT EXISTS grants(asset_id TEXT REFERENCES assets(id),user_id TEXT REFERENCES users(id),PRIMARY KEY(asset_id,user_id));
 CREATE TABLE IF NOT EXISTS placements(asset_id TEXT REFERENCES assets(id),user_id TEXT REFERENCES users(id),folder TEXT DEFAULT '',label TEXT DEFAULT '',PRIMARY KEY(asset_id,user_id));
 CREATE TABLE IF NOT EXISTS map_assets(table_id TEXT,legacy_id TEXT,period TEXT,asset_id TEXT REFERENCES assets(id),PRIMARY KEY(table_id,legacy_id,period));
 CREATE TABLE IF NOT EXISTS scene_context(table_id TEXT PRIMARY KEY,map_id TEXT,period TEXT);
 CREATE TABLE IF NOT EXISTS scene(table_id TEXT PRIMARY KEY REFERENCES tables(id),asset_id TEXT REFERENCES assets(id),revision INTEGER DEFAULT 0);
 CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),body TEXT,created INTEGER);
 ''')
 from characters import install as install_characters
 install_characters(c)
 from dice import install as dice_install
 from admin import install as admin_install
 dice_install(c);admin_install(c)
def put(c,data,tid,source,body):
 mime=MIMES.get(PurePosixPath(source).suffix.lower())
 if not mime:return None
 if len(body)>64*1024**2:raise ValueError('Arquivo acima de 64 MiB')
 digest=hashlib.sha256(body).hexdigest();folder=data/'blobs';folder.mkdir(parents=True,exist_ok=True);dest=folder/digest
 if not dest.exists():
  temp=folder/(digest+'.'+secrets.token_hex(6)+'.tmp');temp.write_bytes(body);temp.replace(dest)
 aid=hashlib.sha256((tid+'\0'+source).encode()).hexdigest()[:32]
 old=c.execute('SELECT digest FROM assets WHERE id=?',(aid,)).fetchone()
 if old and old['digest']!=digest:raise ValueError('Conteúdo divergente: '+source)
 c.execute('INSERT OR IGNORE INTO assets(id,table_id,source,name,mime,digest,size) VALUES(?,?,?,?,?,?,?)',(aid,tid,source,PurePosixPath(source).name,mime,digest,len(body)))
 return aid

def permitted(c,tid,aid,user,master):
 r=c.execute('SELECT * FROM assets WHERE id=? AND table_id=?',(aid,tid)).fetchone()
 return r if r and (master or r['public'] or c.execute('SELECT 1 FROM grants WHERE asset_id=? AND user_id=?',(aid,user)).fetchone()) else None

def canonical(p):return unicodedata.normalize('NFC',p.replace('\\','/'))
def link_maps(c,tid):
 available={canonical(r['source']):r['id'] for r in c.execute('SELECT source,id FROM assets WHERE table_id=?',(tid,))};linked=0;missing=[]
 for row in c.execute('SELECT legacy_id,metadata FROM maps WHERE table_id=?',(tid,)).fetchall():
  m=json.loads(row['metadata']);variants={'Original':m.get('path','')};variants.update({k:v['path'] for k,v in (m.get('variants') or {}).items() if v.get('path')})
  for period,path in variants.items():
   aid=available.get(canonical(path))
   if aid:c.execute('INSERT OR IGNORE INTO map_assets VALUES(?,?,?,?)',(tid,row['legacy_id'],period,aid));linked+=1
   elif path:missing.append({'map':row['legacy_id'],'period':period,'path':path})
 return {'linked':linked,'missing':missing}
def import_sources(c,data,tid,paths):
 report={'files':0,'ignored':[],'sources':[]}
 for p in paths:
  p=Path(p);report['sources'].append(p.name)
  if p.suffix=='.zip':
   with zipfile.ZipFile(p) as z:
    if sum(i.file_size for i in z.infolist())>3*1024**3:raise ValueError('ZIP muito grande')
    for i in z.infolist():
     if i.is_dir():continue
     source=canonical(i.filename)
     if '..' in PurePosixPath(source).parts or source.startswith('/') or ':' in source:raise ValueError('Caminho inválido no ZIP')
     if PurePosixPath(source).suffix.lower() not in MIMES:report['ignored'].append(source);continue
     if i.file_size>64*1024**2:raise ValueError('Arquivo muito grande')
     if put(c,data,tid,source,z.read(i)):report['files']+=1
  elif put(c,data,tid,p.name,p.read_bytes()):report['files']+=1
 report.update(link_maps(c,tid));return report
