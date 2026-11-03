"""Combate compartilhado: estado versionado e movimento autorizado pelo servidor."""
import json, math, re
import combat_history
import fog
import token_characters
from token_assets import TOKEN_IDS
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
ROOT=Path(__file__).parent

def install(c):
 combat_history.install(c)
 c.execute('CREATE TABLE IF NOT EXISTS combats(table_id TEXT,asset_id TEXT,state TEXT,revision INTEGER,PRIMARY KEY(table_id,asset_id))')
 c.execute('CREATE TABLE IF NOT EXISTS navigation(table_id TEXT,map_id TEXT,links TEXT,PRIMARY KEY(table_id,map_id))')

def fresh(c=None,tid=None):
 state={'enabled':False,'grid':{'size':35,'scale':1.5,'unit':'m','enabled':True},'tokens':[],'entries':[],'active':None,'round':1,'terrain':{},'conditions':json.loads((ROOT/'web/conditions.json').read_text(encoding='utf-8')),'enforce':True}
 if c is not None:
  from admin import settings
  config,_=settings(c,tid);state.update({k:v for k,v in config.items() if k in ('grid','conditions')});state['grid']={**fresh()['grid'],**state['grid']}
 return state

def compatible(s,c,tid,require):
 """Fill fields introduced by newer versions; never remove existing pieces."""
 require(isinstance(s,dict),400,'Estado de combate ilegível. Preserve o banco para recuperação.')
 defaults=fresh(c,tid)
 for key,value in defaults.items():
  if key not in s:s[key]=value
 require(isinstance(s['grid'],dict),400,'Configuração da grade ilegível. Revise a administração da mesa.')
 for key,value in fresh()['grid'].items():s['grid'].setdefault(key,value)
 for collection in ('tokens','entries'):
  require(isinstance(s[collection],list),400,'Lista de participantes ilegível. Preserve o banco para recuperação.')
  for item in s[collection]:
   require(isinstance(item,dict),400,'Participante de combate ilegível.')
   item.setdefault('hidden',False);item.setdefault('effects',[])
   if collection=='tokens':
    for key,value in {'owner':None,'spent':0,'budget':9,'color':'#b28b47'}.items():item.setdefault(key,value)
   else:item.setdefault('token',None)
 return s

def distance(a,b):return (abs(a[0]-b[0])+abs(a[1]-b[1])+abs(a[0]+a[1]-b[0]-b[1]))//2

def validate(s,c,tid,require):
 import drawings
 drawings.validate(s.get("drawings",[]),require)
 def num(v,lo,hi):return type(v) in (int,float) and math.isfinite(v) and lo<=v<=hi
 def text(v,n):return isinstance(v,str) and len(v)<=n
 def coord(v):return isinstance(v,list) and len(v)==2 and all(type(x)==int and -500<=x<=500 for x in v)
 require(isinstance(s,dict),400,'Estado inválido.');require(type(s.get('enabled',True))==bool,400,'Modo inválido.');g=s['grid']
 require(num(g['size'],15,100) and num(g['scale'],.1,100) and text(g['unit'],12) and type(g['enabled'])==bool,400,'Grade inválida.')
 require(type(s['round'])==int and 1<=s['round']<=100000 and type(s['enforce'])==bool,400,'Rodada inválida.')
 defs=s['conditions'];require(isinstance(defs,list) and len(defs)<=200,400,'Máximo de 200 condições.')
 ids=set()
 for x in defs:
  require(text(x['id'],100) and re.fullmatch(r'[A-Za-z0-9_-]+',x['id']) and x['id'] not in ids and text(x['name'],60) and text(x['icon'],12) and text(x['description'],3000) and re.fullmatch(r'#[0-9a-fA-F]{6}',x['color']),400,'Condição inválida.');ids.add(x['id'])
 members={x[0] for x in c.execute('SELECT user_id FROM members WHERE table_id=?',(tid,))}
 tokens=s['tokens'];entries=s['entries'];require(isinstance(tokens,list) and isinstance(entries,list) and len(tokens)<=200 and len(entries)<=200,400,'Máximo de 200 tokens e participantes.')
 tids=set();eids=set()
 for collection,seen in [(tokens,tids),(entries,eids)]:
  for x in collection:
   require(text(x['id'],100) and re.fullmatch(r'[A-Za-z0-9_-]+',x['id']) and x['id'] not in seen and text(x['name'],60) and type(x['hidden'])==bool,400,'Participante inválido.');seen.add(x['id'])
   require(isinstance(x['effects'],list) and len(x['effects'])<=200,400,'Efeitos inválidos.')
   for e in x['effects']:require(e['id'] in ids and type(e['secret'])==bool and type(e['stage'])==int and 1<=e['stage']<=3,400,'Marcador inválido.')
 for t in tokens:
  require(type(t.get('dead',False))==bool,400,'Estado Morto inválido.')
  require(t.get('appearance') is None or (isinstance(t.get('appearance'),str) and t['appearance'] in TOKEN_IDS),400,'Imagem de token inválida. Escolha um modelo da biblioteca.')
  require(coord([t['q'],t['r']]) and t['owner'] in members|{None} and num(t['budget'],0,1000) and num(t['spent'],0,100000) and re.fullmatch(r'#[0-9a-fA-F]{6}',t['color']),400,'Token inválido.')
 for e in entries:require((e['value'] is None or num(e['value'],-10000,10000)) and e['token'] in tids|{None},400,'Iniciativa inválida.')
 require(type(s.get('skipDead',False))==bool,400,'Opção de turnos inválida.')
 require(s['active'] in eids|{None},400,'Turno inexistente.')
 require(isinstance(s['terrain'],dict) and len(s['terrain'])<=2000,400,'Terreno muito grande.')
 for k,v in s['terrain'].items():require(re.fullmatch(r'-?\d{1,3},-?\d{1,3}',k) and type(v)==int and v in [0,2,3],400,'Terreno inválido.')
 require(len(json.dumps(s))<60000,400,'Cena excede 60 KB. Remova elementos para continuar.')

def handle(c,data,path,d,user,tid,master,require):
 from assets import permitted
 ep=urlsplit(path).path;q=parse_qs(urlsplit(path).query)
 if ep=='/api/navigation':
  mid=d.get('map_id') if d else q.get('map_id',[''])[0]
  m=c.execute('SELECT visible FROM maps WHERE table_id=? AND legacy_id=?',(tid,mid)).fetchone();require(m and (master or m['visible']),404,'Mapa indisponível.')
  if d:
   require(master)
   if 'expected_links' in d:
    from urllib.parse import quote
    current=handle(c,data,'/api/navigation?map_id='+quote(mid),{},user,tid,master,require)
    require(current==d['expected_links'],409,'Os acessos foram alterados por outro mestre. Reabra o mapa; seu rascunho não foi salvo.')
   links=d['links'];require(isinstance(links,list) and len(links)<=100,400,'Acessos inválidos.')
   for l in links:
    require(isinstance(l['label'],str) and 0<len(l['label'])<=100 and isinstance(l['targets'],list) and len(l['targets'])<=20,400,'Destino inválido.')
    rect=l['rect'];require(isinstance(rect,list) and len(rect)==4 and all(type(x) in (int,float) and math.isfinite(x) and 0<=x<=1 for x in rect) and rect[2]>0 and rect[3]>0 and rect[0]+rect[2]<=1.000001 and rect[1]+rect[3]<=1.000001,400,'Área inválida.')
    for dest in l['targets']:require(c.execute('SELECT 1 FROM maps WHERE table_id=? AND legacy_id=?',(tid,dest)).fetchone(),400,'Destino ausente.')
   c.execute('INSERT INTO navigation VALUES(?,?,?) ON CONFLICT(table_id,map_id) DO UPDATE SET links=excluded.links',(tid,mid,json.dumps(links)));return {'ok':True}
  saved=c.execute('SELECT links FROM navigation WHERE table_id=? AND map_id=?',(tid,mid)).fetchone()
  links=json.loads(saved[0]) if saved else json.loads((ROOT/'web/navigation.json').read_text(encoding='utf-8'))['links'].get(mid,[])
  available={x[0] for x in c.execute('SELECT legacy_id FROM maps WHERE table_id=?'+('' if master else ' AND visible=1'),(tid,))}
  protected=[]
  if not master:
   protected=[fog.read(c,tid,r[0]) for r in c.execute('SELECT a.digest FROM map_assets m JOIN assets a ON a.id=m.asset_id WHERE m.table_id=? AND m.legacy_id=?',(tid,mid))]
  result=[]
  for l in links:
   if not all(fog.visible(mask,l['rect'][0]+l['rect'][2]/2,l['rect'][1]+l['rect'][3]/2) for mask in protected):continue
   targets=[x for x in l['targets'] if x in available]
   if targets:result.append({**l,'targets':targets})
  return result
 if ep not in ['/api/combat','/api/combat-move','/api/combat-undo','/api/combat-redo']:return NotImplemented
 aid=d.get('asset_id') if d else q.get('asset_id',[''])[0]
 asset=permitted(c,tid,aid,user,master);require(asset and asset['mime'].startswith('image/'),404,'Mapa indisponível.')
 from scene_variants import combat_key
 aid=combat_key(c,tid,aid)
 row=c.execute('SELECT state,revision FROM combats WHERE table_id=? AND asset_id=?',(tid,aid)).fetchone();s=compatible(json.loads(row[0]) if row else fresh(c,tid),c,tid,require);rev=row[1] if row else 0
 linked_characters=token_characters.hydrate(c,tid,s)
 if ep in ['/api/combat-undo','/api/combat-redo']:
  require(master);require(bool(d),405,'Use POST para alterar o histórico.')
 fog_state=fog.read(c,tid,asset['digest'])
 height=700
 if fog_state['enabled']:
  width,pixels=fog.dimensions(str(data/'blobs'/asset['digest']));height=1000*pixels/width
 before=json.loads(json.dumps(s)) if d else None
 if d:
  require(type(d.get('revision'))==int and d['revision']==rev,409,'Combate atualizado por outra pessoa. Recarregue a cena antes de repetir.')
  if ep=='/api/combat':require(master);s=compatible(d.get('state'),c,tid,require);validate(s,c,tid,require);token_characters.hydrate(c,tid,s,require)
  elif ep in ['/api/combat-undo','/api/combat-redo']:
   s=combat_history.restore(c,tid,aid,s,ep=='/api/combat-redo',require);token_characters.hydrate(c,tid,s,require);validate(s,c,tid,require)
  else:
   require(s.get('enabled',True),400,'O mestre precisa ativar o combate neste mapa.')
   t=next((x for x in s['tokens'] if x['id']==d['token_id']),None);require(t and (master or (t['owner']==user and not t['hidden'])))
   if not master:require(fog.token_visible(fog_state,t,s['grid']['size'],height),403,'Token fora da área revelada.')
   path=d['path'];require(isinstance(path,list) and 1<=len(path)<=200,400,'Caminho inválido.')
   previous=[t['q'],t['r']];cost=0
   for point in path:
    require(isinstance(point,list) and len(point)==2 and all(type(v)==int and -500<=v<=500 for v in point) and distance(previous,point)==1,400,'Percorra hexágonos vizinhos.')
    if not master:require(fog.token_visible(fog_state,{'q':point[0],'r':point[1]},s['grid']['size'],height),403,'Destino fora da área revelada.')
    factor=s['terrain'].get(str(point[0])+','+str(point[1]),1);require(factor>0,400,'Hexágono bloqueado.');cost+=s['grid']['scale']*factor;previous=point
   require(not s['enforce'] or t['spent']+cost<=t['budget']+1e-8,400,'Movimento insuficiente.')
   t['q'],t['r']=previous;t['spent']=round(t['spent']+cost,6)
  if ep in ['/api/combat','/api/combat-move']:combat_history.record(c,tid,aid,before,s,user)
  c.execute('INSERT INTO combats VALUES(?,?,?,?) ON CONFLICT(table_id,asset_id) DO UPDATE SET state=excluded.state,revision=excluded.revision',(tid,aid,json.dumps(s),rev+1));return {'revision':rev+1}
 if not master:
  import drawings
  s["drawings"]=[d for d in s.get("drawings",[]) if drawings.visible(d,fog_state)]
  s['tokens']=[t for t in s['tokens'] if not t['hidden'] and fog.token_visible(fog_state,t,s['grid']['size'],height)];visible={t['id'] for t in s['tokens']}
  s['entries']=[e for e in s['entries'] if not e['hidden'] and (e['token'] is None or e['token'] in visible)]
  if s['active'] not in {e['id'] for e in s['entries']}:s['active']=None
  for x in s['tokens']+s['entries']:x['effects']=[e for e in x['effects'] if not e['secret']]
  s['terrain']={k:v for k,v in s['terrain'].items() if fog.token_visible(fog_state,dict(zip(('q','r'),map(int,k.split(',')))),s['grid']['size'],height)}
 result={'characters':token_characters.summaries(s,linked_characters,user,master),'state':s,'revision':rev,'fog':fog.public(fog_state,master)}
 if master:result['history']=combat_history.metadata(c,tid,aid)
 return result
