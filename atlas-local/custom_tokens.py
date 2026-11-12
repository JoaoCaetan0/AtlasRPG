"""Table-owned token portraits. Artwork is served only for visible scene tokens."""
import secrets
from urllib.parse import urlsplit,parse_qs
from token_assets import TOKEN_IDS

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS token_templates(id TEXT PRIMARY KEY,table_id TEXT REFERENCES tables(id),asset_id TEXT REFERENCES assets(id),name TEXT NOT NULL,creator TEXT REFERENCES users(id))')
 c.execute('CREATE INDEX IF NOT EXISTS token_template_table ON token_templates(table_id)')

def valid_appearance(c,tid,value):
 return value is None or isinstance(value,str) and (value in TOKEN_IDS or c.execute('SELECT 1 FROM token_templates WHERE table_id=? AND id=?',(tid,value)).fetchone() is not None)

def handle(c,data,path,d,user,tid,master,require):
 ep=urlsplit(path).path
 if ep not in ('/api/token-templates','/api/token-art'):return NotImplemented
 if ep=='/api/token-templates':
  require(master)
  if not d:
   return [{'id':r['id'],'appearance':r['id'],'name':r['name'],'image':'/api/token-art?table_id='+tid+'&id='+r['id'],'category':'Personalizados','subgroup':'Meus retratos','tags':r['name'],'color':'#b28b47','budget':9,'custom':True} for r in c.execute('SELECT * FROM token_templates WHERE table_id=? ORDER BY rowid DESC',(tid,))]
  name=d.get('name','');require(isinstance(name,str) and 1<=len(name.strip())<=60,400,'Informe um nome de até 60 caracteres.')
  aid=d.get('asset_id');require(isinstance(aid,str),400,'Imagem inválida.')
  a=c.execute('SELECT * FROM assets WHERE table_id=? AND id=?',(tid,aid)).fetchone()
  require(a and a['mime']=='image/png',400,'Use uma imagem PNG criada pelo gerador.')
  from PIL import Image
  with Image.open(data/'blobs'/a['digest']) as im:require(im.width==512 and im.height==512,400,'O token deve ter 512 × 512 pixels.')
  ident='custom-'+secrets.token_hex(16)
  c.execute('INSERT INTO token_templates VALUES(?,?,?,?,?)',(ident,tid,aid,name.strip(),user))
  from recent_tokens import remember
  remember(c,tid,user,{'name':name.strip(),'appearance':ident,'color':'#b28b47','budget':9,'hidden':False})
  return {'id':ident}
 require(not d,405,'Use GET para carregar imagens.')
 ident=parse_qs(urlsplit(path).query).get('id',[''])[0]
 row=c.execute('SELECT a.digest FROM token_templates t JOIN assets a ON a.id=t.asset_id WHERE t.table_id=? AND t.id=?',(tid,ident)).fetchone()
 require(row,404,'Token não encontrado.')
 if not master:
  own=c.execute('SELECT 1 FROM characters WHERE table_id=? AND user_id=? AND appearance=?',(tid,user,ident)).fetchone()
  if own:
   from features import Binary
   return Binary(data/'blobs'/row['digest'],'image/png')
  from combat import handle as combat_handle
  scene=c.execute('SELECT asset_id FROM scene WHERE table_id=?',(tid,)).fetchone()
  require(scene,404,'Sem cena ativa.')
  state=combat_handle(c,data,'/api/combat?asset_id='+scene['asset_id'],{},user,tid,False,require)
  require(any(t.get('appearance')==ident for t in state.get('state',{}).get('tokens',[])),404,'Token fora da cena visível.')
 from features import Binary
 return Binary(data/'blobs'/row['digest'],'image/png')
