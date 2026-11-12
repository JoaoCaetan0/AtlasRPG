"""PV/PD have one source: linked sheet or separate token resource record.
Only display preferences belong to undoable combat state.
"""
import json,math
from urllib.parse import urlsplit,parse_qs
from scene_variants import combat_key
KINDS=('pv','pd')
DEFAULT={'enabled':False,'visibility':'owner','numbers':True}

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS token_resources(table_id TEXT,asset_id TEXT,token_id TEXT,values_json TEXT,revision INTEGER,PRIMARY KEY(table_id,asset_id,token_id))')

def validate(token,require):
 require(type(token.get('control_override',False)) is bool,400,'Controle do token inválido.')
 bars=token.get('bars',{})
 require(isinstance(bars,dict) and set(bars)<=set(KINDS),400,'Barras inválidas.')
 for config in bars.values():
  require(isinstance(config,dict) and set(config)<=set(DEFAULT) and type(config.get('enabled',False)) is bool and type(config.get('numbers',True)) is bool and config.get('visibility','owner') in ['all','owner','gm'],400,'Preferências de barras inválidas.')

def source(c,tid,aid,t):
 ch=c.execute('SELECT * FROM characters WHERE table_id=? AND id=?',(tid,t.get('character_id'))).fetchone()
 if ch:return json.loads(ch['fields']),ch['revision'],ch
 row=c.execute('SELECT values_json,revision FROM token_resources WHERE table_id=? AND asset_id=? AND token_id=?',(tid,aid,t['id'])).fetchone()
 return (json.loads(row[0]),row[1],None) if row else ({},0,None)

def numeric(value):
 try:
  n=float(str(value).replace(',','.'))
  return n if math.isfinite(n) else None
 except (ValueError,TypeError):return None

def display(c,tid,aid,state,user,master):
 result={}
 for t in state['tokens']:
  values,_,_=source(c,tid,aid,t);out=[]
  for kind in KINDS:
   cfg={**DEFAULT,**t.get('bars',{}).get(kind,{})}
   if not cfg['enabled'] or not (master or cfg['visibility']=='all' or (cfg['visibility']=='owner' and t.get('owner')==user)):continue
   current=numeric(values.get(kind+'_atual'));maximum=numeric(values.get(kind+'_maximo'))
   if current is None or maximum is None:continue
   entry={'kind':kind,'ratio':max(0,min(1,current/maximum)) if maximum>0 else 0,'numbers':cfg['numbers']}
   if cfg['numbers']:entry.update(current=current,maximum=maximum)
   out.append(entry)
  if out:result[t['id']]=out
 return result

def handle(c,data,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/token-resources':return NotImplemented
 from assets import permitted
 import combat,token_characters,combat_history
 q=parse_qs(urlsplit(path).query)
 aid=d.get('asset_id') if d else q.get('asset_id',[''])[0];ident=d.get('token_id') if d else q.get('token_id',[''])[0]
 asset=permitted(c,tid,aid,user,master);require(asset,404,'Mapa indisponível.')
 aid=combat_key(c,tid,aid)
 row=c.execute('SELECT state,revision FROM combats WHERE table_id=? AND asset_id=?',(tid,aid)).fetchone();require(row,404,'Combate ausente.')
 state=json.loads(row[0]);token_characters.hydrate(c,tid,state)
 t=next((t for t in state['tokens'] if t['id']==ident),None)
 require(t and (master or (t.get('owner')==user and not t.get('hidden'))))
 values,resource_revision,ch=source(c,tid,aid,t)
 # Sharing does not revoke the controller's own resource access.
 allowed=list(KINDS)
 if d:
  require(type(d.get('revision')) is int and d['revision']==row[1] and type(d.get('resource_revision')) is int and d['resource_revision']==resource_revision,409,'Token ou ficha atualizado. Reabra os recursos antes de salvar.')
  incoming=d.get('values',{});require(isinstance(incoming,dict),400,'Recursos inválidos.')
  keys={k+'_'+suffix for k in allowed for suffix in (('atual','maximo') if master else ('atual',))}
  require(set(incoming)<=keys,403,'Você só pode alterar os valores atuais permitidos.')
  for key,value in incoming.items():
   require(type(value) in (int,float) and math.isfinite(value) and (-1000000 if key.endswith('atual') else 0)<=value<=1000000,400,'Recurso inválido.')
  before=json.loads(json.dumps(state))
  if 'bars' in d:
   proposed={**t.get('bars',{}),**d['bars']} if isinstance(d['bars'],dict) else d['bars']
   validate({**t,'bars':proposed},require)
   if not master:require(all(cfg.get('visibility','owner') in ('all','owner') for cfg in d['bars'].values()),403,'Escolha compartilhar com a mesa ou manter privado.')
   t['bars']=proposed
  values.update({k:str(v) for k,v in incoming.items()})
  if incoming:
   if ch:c.execute('UPDATE characters SET fields=?,revision=revision+1 WHERE id=?',(json.dumps(values,ensure_ascii=False),ch['id']))
   else:c.execute('INSERT INTO token_resources VALUES(?,?,?,?,?) ON CONFLICT(table_id,asset_id,token_id) DO UPDATE SET values_json=excluded.values_json,revision=excluded.revision',(tid,aid,ident,json.dumps(values),resource_revision+1))
  if state!=before:combat_history.record(c,tid,aid,before,state,user)
  c.execute('UPDATE combats SET state=?,revision=revision+1 WHERE table_id=? AND asset_id=?',(json.dumps(state),tid,aid))
  return {'ok':True}
 return {'revision':row[1],'resource_revision':resource_revision,'linked':bool(ch),'values':{k:numeric(values.get(k)) for kind in allowed for k in [kind+'_atual',kind+'_maximo']},'bars':{kind:{**DEFAULT,**t.get('bars',{}).get(kind,{})} for kind in allowed}}
