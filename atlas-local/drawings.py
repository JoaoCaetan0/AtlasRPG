"""Validated map annotations. Covered drawings are withheld entirely from players."""
import math,re

def validate(items,require):
 require(isinstance(items,list) and len(items)<=100,400,'Máximo de 100 desenhos por cena.')
 ids=set()
 for d in items:
  require(isinstance(d,dict),400,'Desenho inválido.')
  require(isinstance(d.get('id'),str) and re.fullmatch(r'[A-Za-z0-9_-]{1,100}',d['id']) and d['id'] not in ids,400,'Identidade do desenho inválida.');ids.add(d['id'])
  require(d.get('tool') in ['pen','line','arrow','rect','ellipse','triangle','polygon','highlight'],400,'Forma inválida.')
  require(type(d.get('private'))==bool and isinstance(d.get('color'),str) and re.fullmatch(r'#[0-9a-fA-F]{6}',d['color']),400,'Cor ou visibilidade inválida.')
  require(type(d.get('width')) in (float,int) and math.isfinite(d['width']) and 1<=d['width']<=12,400,'Espessura inválida.')
  opacity=d.get('opacity',1);require(type(opacity) in (int,float) and math.isfinite(opacity) and .1<=opacity<=1,400,'Opacidade inválida.')
  require(type(d.get('fill',False))==bool,400,'Preenchimento inválido.')
  pts=d.get('points');require(isinstance(pts,list) and 2<=len(pts)<=200,400,'Pontos inválidos.')
  require(d['tool']!='polygon' or len(pts)>=3,400,'Polígono precisa de três vértices.')
  for p in pts:require(isinstance(p,list) and len(p)==2 and all(type(v) in (float,int) and math.isfinite(v) and 0<=v<=1 for v in p),400,'Coordenadas inválidas.')

def visible(d,mask):
 if d['private']:return False
 if not mask['enabled']:return True
 # Include stroke padding in the normalized bounding box. Conservative masking
 # avoids leaking even the hidden segment of a partly revealed annotation.
 pts=d['points'];pad=d['width']/100
 x0=max(0,int((min(p[0] for p in pts)-pad)*128));x1=min(127,int((max(p[0] for p in pts)+pad)*128))
 y0=max(0,int((min(p[1] for p in pts)-pad)*128));y1=min(127,int((max(p[1] for p in pts)+pad)*128))
 return all(mask['cells'][y*128+x]=='1' for y in range(y0,y1+1) for x in range(x0,x1+1))
