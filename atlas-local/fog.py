"""Manual fog. Only the server produces the player raster; never return hidden pixels."""
import json, math, threading
from functools import lru_cache
from io import BytesIO
from urllib.parse import urlsplit, parse_qs
N=128
COVERED='0'*(N*N)
REVEALED='1'*(N*N)

def install(c):
 from vision_memory import install as install_memory
 install_memory(c)
 c.execute("CREATE TABLE IF NOT EXISTS vision_memory(table_id TEXT,digest TEXT,user_id TEXT,cells TEXT NOT NULL,PRIMARY KEY(table_id,digest,user_id))")
 c.execute('CREATE TABLE IF NOT EXISTS fog(table_id TEXT,digest TEXT,enabled INTEGER NOT NULL,cells TEXT NOT NULL,revision INTEGER NOT NULL,past TEXT NOT NULL,future TEXT NOT NULL,PRIMARY KEY(table_id,digest))')

def read(c,tid,digest):
 from scene_variants import fog_key
 digest=fog_key(c,tid,digest)
 row=c.execute('SELECT * FROM fog WHERE table_id=? AND digest=?',(tid,digest)).fetchone()
 return dict(row) if row else {'enabled':False,'cells':COVERED,'revision':0,'past':'[]','future':'[]'}

def public(row,master):
 result={'enabled':bool(row['enabled']),'cells':row['cells'] if row['enabled'] else COVERED,'revision':row['revision'],'resolution':N,'token_vision':bool(row.get('token_vision')),'dim_cells':row.get('dim_cells',COVERED) if row['enabled'] else COVERED}
 if master:result.update(undo=bool(json.loads(row['past'])),redo=bool(json.loads(row['future'])))
 return result

@lru_cache(maxsize=64)
def dimensions(path):
 from PIL import Image,ImageOps
 with Image.open(path) as im:
  if im.format not in ('PNG','JPEG','WEBP') or im.width*im.height>40000000:raise ValueError('Imagem não suportada para névoa.')
  with ImageOps.exif_transpose(im) as oriented:return oriented.size

def check_image(data,asset,require):
 try:dimensions(str(data/'blobs'/asset['digest']))
 except ImportError:require(False,503,'Instale as dependências da V12 para usar a névoa (Pillow).')
 except Exception:require(False,400,'Use uma imagem PNG, JPEG ou WebP válida de até 40 megapixels.')

def write(c,tid,digest,row):
 from scene_variants import fog_key
 digest=fog_key(c,tid,digest)
 c.execute('INSERT INTO fog VALUES(?,?,?,?,?,?,?) ON CONFLICT(table_id,digest) DO UPDATE SET enabled=excluded.enabled,cells=excluded.cells,revision=excluded.revision,past=excluded.past,future=excluded.future', (tid,digest,int(row['enabled']),row['cells'],row['revision'],row['past'],row['future']))

def cover(c,data,tid,asset,require,only_new=False):
 row=read(c,tid,asset['digest'])
 if only_new and row['revision']:return
 check_image(data,asset,require)
 old=[bool(row['enabled']),row['cells']]
 if old==[True,COVERED]:return
 row.update(enabled=True,cells=COVERED,revision=row['revision']+1,past=json.dumps((json.loads(row['past'])+[old])[-20:]),future='[]')
 write(c,tid,asset['digest'],row)

def handle(c,data,path,d,user,tid,master,require):
 from assets import permitted
 if urlsplit(path).path!='/api/fog':return NotImplemented
 q=parse_qs(urlsplit(path).query);aid=d.get('asset_id') if d else q.get('asset_id',[''])[0]
 asset=permitted(c,tid,aid,user,master);require(asset and asset['mime'].startswith('image/'),404,'Mapa indisponível.')
 row=read(c,tid,asset['digest'])
 if not d:
  if not master:
   from token_vision import effective
   row=effective(c,data,tid,asset,user,row)
  return public(row,master)
 require(master);require(type(d.get('revision'))==int and d['revision']==row['revision'],409,'A névoa mudou. A cena foi atualizada; repita a ação.')
 action=d.get('action');require(action in ('enable','disable','reveal','hide','reveal-all','hide-all','undo','redo'),400,'Ferramenta inválida.')
 old=[bool(row['enabled']),row['cells']];past=json.loads(row['past']);future=json.loads(row['future'])
 if action in ('undo','redo'):
  source,target=(past,future) if action=='undo' else (future,past)
  require(source,409,'Nenhuma ação disponível.');replacement=source.pop();target.append(old);row['enabled'],row['cells']=replacement
 elif action=='enable':check_image(data,asset,require);row['enabled']=True
 elif action=='disable':row['enabled']=False
 else:
  require(row['enabled'],400,'Ative a névoa primeiro.')
  if action.endswith('-all'):row['cells']=REVEALED if action=='reveal-all' else COVERED
  else:
   rect=d.get('rect');require(isinstance(rect,list) and len(rect)==4 and all(type(v) in (int,float) and math.isfinite(v) and 0<=v<=1 for v in rect),400,'Área inválida.')
   x0,y0,x1,y1=rect;require(x1>x0 and y1>y0,400,'Selecione uma área com largura e altura.')
   cells=list(row['cells'])
   for y in range(math.floor(y0*N),min(N,math.ceil(y1*N))):
    for x in range(math.floor(x0*N),min(N,math.ceil(x1*N))):cells[y*N+x]='1' if action=='reveal' else '0'
   row['cells']=''.join(cells)
 if old!=[bool(row['enabled']),row['cells']]:
  if action not in ('undo','redo'):past.append(old);future=[]
  row.update(revision=row['revision']+1,past=json.dumps(past[-20:]),future=json.dumps(future[-20:]));write(c,tid,asset['digest'],row)
 return public(row,master)

def visible(row,x,y):
 if not row['enabled']:return True
 if not (0<=x<1 and 0<=y<1):return False
 return row['cells'][min(N-1,int(y*N))*N+min(N-1,int(x*N))]=='1'

def token_visible(row,token,size,height):
 return visible(row,(500+size*math.sqrt(3)*(token['q']+token['r']/2))/1000,(height/2+size*1.5*token['r'])/height)

_raster_lock=threading.Lock()
def masked(path,cells):
 with _raster_lock:return _masked(path,cells)

@lru_cache(maxsize=4)
def _masked(path,cells):
 from PIL import Image,ImageDraw,ImageOps
 w,h=dimensions(path)
 with Image.open(path) as original:
  with ImageOps.exif_transpose(original) as oriented:
   rgba=oriented.convert('RGBA');raster=Image.new('RGB',rgba.size,(8,12,18));raster.paste(rgba,(0,0),rgba.getchannel('A'))
 mask=Image.new('L',(w,h),0);draw=ImageDraw.Draw(mask)
 # Same floor boundaries in every adjacent cell: no interpolation or overlap.
 for y in range(N):
  for x in range(N):
   if cells[y*N+x]=='1':
    left,top=x*w//N,y*h//N;right,bottom=(x+1)*w//N,(y+1)*h//N
    if right>left and bottom>top:draw.rectangle((left,top,right-1,bottom-1),fill=255)
 output=Image.new('RGB',(w,h),(8,12,18));output.paste(raster,(0,0),mask)
 stream=BytesIO();output.save(stream,format='PNG');return stream.getvalue()

@lru_cache(maxsize=3)
def _base_rasters(path):
 from PIL import Image,ImageOps,ImageEnhance
 with Image.open(path) as im:
  oriented=ImageOps.exif_transpose(im).convert('RGBA');oriented.thumbnail((2048,2048),Image.Resampling.LANCZOS)
  rgb=Image.new('RGB',oriented.size,(8,12,18));rgb.paste(oriented,(0,0),oriented.getchannel('A'))
 gray=ImageEnhance.Brightness(ImageOps.grayscale(rgb).convert('RGB')).enhance(.6)
 return rgb,gray

@lru_cache(maxsize=12)
def vision_raster(path,cells,dim_cells):
 from PIL import Image,ImageDraw
 base,gray=_base_rasters(path);w,h=base.size
 output=Image.new('RGB',base.size,(8,12,18))
 for bitmap,source in [(dim_cells,gray),(cells,base)]:
  if '1' not in bitmap:continue
  mask=Image.new('L',base.size,0);draw=ImageDraw.Draw(mask)
  for y in range(N):
   x=0
   while x<N:
    if bitmap[y*N+x]!='1':x+=1;continue
    end=x+1
    while end<N and bitmap[y*N+end]=='1':end+=1
    left,top,right,bottom=x*w//N,y*h//N,end*w//N,(y+1)*h//N
    if right>left and bottom>top:draw.rectangle((left,top,right-1,bottom-1),fill=255)
    x=end
  output.paste(source,(0,0),mask)
 stream=BytesIO()
 # Lossless keeps symbols and small lettering crisp. No global raster lock.
 output.save(stream,format='WEBP',lossless=True,method=0)
 return stream.getvalue(),'image/webp'


@lru_cache(maxsize=8)
def display_raster(path):
 """Bound display size; preserve uploaded originals for export and editing."""
 base,_=_base_rasters(path)
 stream=BytesIO();base.save(stream,format='WEBP',lossless=True,method=0)
 return stream.getvalue(),'image/webp'
