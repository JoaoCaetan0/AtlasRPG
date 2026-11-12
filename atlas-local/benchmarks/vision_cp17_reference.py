"""Token sight intersects manual fog. Hidden pixels are removed server-side."""
import json,math
from functools import lru_cache
import fog
DEFAULT={'enabled':False,'range':10,'angle':160,'gradient':3,'exploration':True}

def validate(config,require,token=False):
 require(isinstance(config,dict),400,'Visão inválida.')
 def number(v,low,high):return type(v) in (float,int) and math.isfinite(v) and low<=v<=high
 if not token:require(type(config.get('enabled')) is bool,400,'Ativação da visão inválida.')
 for key,lo,hi in [('range',0,1000),('angle',1,360)]:
  value=config.get(key)
  require((token and value is None) or number(value,lo,hi),400,'Alcance ou ângulo de visão inválido.')
 require(config.get('gradient') is None or number(config['gradient'],0,1000),400,'Faixa cinza inválida.')
 if not token:require(type(config.get('exploration',True)) is bool,400,'Memória de exploração inválida.')
 if token:require(number(config.get('direction',270),0,360),400,'Direção inválida.')

@lru_cache(maxsize=64)
def sight(cells,height,size,scale,sources):
 shapes=[]
 for q,r,distance,angle,direction in sources:
  shapes.append((500+size*math.sqrt(3)*(q+r/2),height/2+size*1.5*r,distance/scale*math.sqrt(3)*size,angle,math.radians(direction)))
 def contains(px,py,s):
  x,y,radius,angle,direction=s;dx=px-x;dy=py-y
  if dx*dx+dy*dy>radius*radius:return False
  if angle>=360 or dx*dx+dy*dy<min(radius,size*.65)**2:return True
  delta=(math.atan2(dy,dx)-direction+math.pi)%(2*math.pi)-math.pi
  return abs(delta)<=math.radians(angle/2)
 result=list(fog.COVERED)
 for y in range(fog.N):
  for x in range(fog.N):
   i=y*fog.N+x
   if cells[i]!='1':continue
   # Conservative full-cell test avoids revealing corners beyond the cone.
   corners=[(x*1000/fog.N,y*height/fog.N),((x+1)*1000/fog.N,y*height/fog.N),(x*1000/fog.N,(y+1)*height/fog.N),((x+1)*1000/fog.N,(y+1)*height/fog.N)]
   if any(all(contains(px,py,s) for px,py in corners) for s in shapes):result[i]='1'
 return ''.join(result)

def scenes(c,tid,key):
 from scene_variants import fog_key
 import token_characters
 result=[]
 for item in c.execute('SELECT b.asset_id,b.state,a.digest FROM combats b JOIN assets a ON a.id=b.asset_id WHERE b.table_id=?',(tid,)):
  if fog_key(c,tid,item['digest'])!=key:continue
  state=json.loads(item['state']);token_characters.hydrate(c,tid,state);result.append((item['asset_id'],state))
 return result

def effective(c,data,tid,asset,user,row=None):
 from scene_variants import fog_key
 from vision_memory import seed,remember
 # Serialize exploration writes with clears; a delayed GET must not resurrect old memory.
 row=dict(fog.read(c,tid,asset['digest']))
 if row['enabled'] and not c.in_transaction:
  c.execute('BEGIN IMMEDIATE')
  row=dict(fog.read(c,tid,asset['digest']))
 key=fog_key(c,tid,asset['digest']);all_scenes=scenes(c,tid,key)
 revision=row['revision']
 for aid,_ in all_scenes:
  revision+=c.execute('SELECT revision FROM combats WHERE table_id=? AND asset_id=?',(tid,aid)).fetchone()[0]
 row['revision']=revision
 configs=[(aid,state,state.get('vision',DEFAULT)) for aid,state in all_scenes if state.get('vision',DEFAULT).get('enabled')]
 if not row['enabled'] or not configs:return row
 manual=row['cells'];dim=fog.REVEALED;exploration=True;contributions=[]
 w,h=fog.dimensions(str(data/'blobs'/asset['digest']));height=1000*h/w
 for aid,state,config in configs:
  sources=[];extended=[]
  exploration=exploration and config.get('exploration',True)
  for t in state['tokens']:
   if t.get('owner')!=user or t.get('hidden'):continue
   v=t.get('vision',{});distance=v.get('range');angle=v.get('angle')
   source=(t['q'],t['r'],config['range'] if distance is None else distance,config['angle'] if angle is None else angle,v.get('direction',270));sources.append(source)
   gradient=v.get('gradient');gradient=config.get('gradient',3) if gradient is None else gradient
   extended.append((*source[:2],source[2]+gradient,*source[3:]))
   contributions.append((aid,t['id'],state['grid'],source))
  row['cells']=sight(row['cells'],height,state['grid']['size'],state['grid']['scale'],tuple(sources))
  fringe=sight(manual,height,state['grid']['size'],state['grid']['scale'],tuple(extended))
  dim=''.join('1' if a==b=='1' else '0' for a,b in zip(dim,fringe))
 memory=fog.COVERED
 if exploration:
  seed(c,tid,key,user,all_scenes)
  for aid,ident,grid,source in contributions:
   # Credit only this token's currently authorized cells, never another token's sight.
   seen=sight(row['cells'],height,grid['size'],grid['scale'],(source,))
   memory=union(memory,remember(c,tid,key,aid,ident,user,seen))
 row['dim_cells']=''.join('1' if m=='1' and v!='1' and (f=='1' or e=='1') else '0' for m,v,f,e in zip(manual,row['cells'],dim,memory))
 row['token_vision']=True
 return row

def union(a,b):
 return "".join("1" if x=="1" or y=="1" else "0" for x,y in zip(a,b))
