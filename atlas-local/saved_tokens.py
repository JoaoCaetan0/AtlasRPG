"""Reusable master templates and the default portrait of a character."""
import json,secrets
from urllib.parse import urlsplit

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS saved_tokens(id TEXT PRIMARY KEY,table_id TEXT NOT NULL,template TEXT NOT NULL)')
 c.execute('CREATE INDEX IF NOT EXISTS saved_token_table ON saved_tokens(table_id)')

def handle(c,data,path,d,user,tid,master,require):
 ep=urlsplit(path).path
 if ep not in ('/api/saved-tokens','/api/character-portrait'):return NotImplemented
 from custom_tokens import valid_appearance
 if ep=='/api/character-portrait':
  require(bool(d),405,'Use POST.')
  ch=c.execute('SELECT * FROM characters WHERE id=? AND table_id=?',(d.get('id'),tid)).fetchone()
  require(ch and (master or ch['user_id']==user),403,'Personagem indisponível.')
  require(d.get('revision')==ch['revision'],409,'A ficha mudou. Reabra a lista de personagens.')
  if 'content' in d:
   import base64
   from io import BytesIO
   from PIL import Image
   from assets import put
   raw=d['content'];require(isinstance(raw,str) and len(raw)<=3*1024*1024,400,'Imagem muito grande.')
   try:
    body=base64.b64decode(raw,validate=True)
    with Image.open(BytesIO(body)) as im:
     require(im.format=='PNG' and im.size==(512,512),400,'Use o gerador de token de 512 × 512 pixels.')
     safe=BytesIO();im.convert('RGBA').save(safe,format='PNG');body=safe.getvalue()
   except (ValueError,OSError):
    require(False,400,'Imagem PNG inválida.')
   asset_id=put(c,data,tid,'Retratos/'+secrets.token_hex(16)+'.png',body)
   appearance='custom-'+secrets.token_hex(16)
   c.execute('INSERT INTO token_templates VALUES(?,?,?,?,?)',(appearance,tid,asset_id,ch['name'][:60],user))
   c.execute('UPDATE characters SET appearance=?,revision=revision+1 WHERE id=?',(appearance,ch['id']))
   return {'id':appearance}
  appearance=d.get('appearance') or None
  require(valid_appearance(c,tid,appearance),400,'Token inválido.')
  if not master:
   from token_assets import TOKEN_IDS
   require(appearance is None or appearance in TOKEN_IDS or appearance==ch['appearance'],403,'Peça ao mestre para atribuir este retrato personalizado.')
  require(d.get('revision')==ch['revision'],409,'A ficha mudou. Reabra a lista de personagens.')
  c.execute('UPDATE characters SET appearance=?,revision=revision+1 WHERE id=?',(appearance,ch['id']))
  return {'ok':True}
 require(master)
 if not d:return [{'id':r['id'],**json.loads(r['template'])} for r in c.execute('SELECT * FROM saved_tokens WHERE table_id=? ORDER BY rowid DESC',(tid,))]
 if d.get('delete'):
  require(isinstance(d.get('id'),str),400,'Modelo inválido.')
  c.execute('DELETE FROM saved_tokens WHERE table_id=? AND id=?',(tid,d['id']));return {'ok':True}
 from combat import handle as combat_handle
 from urllib.parse import quote
 require(isinstance(d.get('asset_id'),str) and isinstance(d.get('token_id'),str),400,'Token inválido.')
 result=combat_handle(c,data,'/api/combat?asset_id='+quote(d['asset_id']),{},user,tid,True,require)
 token=next((t for t in result['state']['tokens'] if t['id']==d['token_id']),None)
 require(token,404,'Token não encontrado.')
 template={k:token.get(k) for k in ('name','appearance','color','budget','vision') if k in token}
 # New instances start alive, without damage, ownership, spent movement or conditions.
 template['hidden']=False
 existing=c.execute('SELECT id FROM saved_tokens WHERE table_id=? AND template=?',(tid,json.dumps(template,sort_keys=True))).fetchone()
 if existing:return {'id':existing[0]}
 require(c.execute('SELECT count(*) FROM saved_tokens WHERE table_id=?',(tid,)).fetchone()[0]<500,400,'Limite de 500 modelos. Remova um modelo para continuar.')
 ident=secrets.token_hex(16);c.execute('INSERT INTO saved_tokens VALUES(?,?,?)',(ident,tid,json.dumps(template,sort_keys=True)));return {'id':ident}
