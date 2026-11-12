"""Strict bounded JSON and HTTP framing for the local adapter."""
import json,math

def strict_json(raw):
 def pairs(items):
  out={}
  for k,v in items:
   if k in out:raise ValueError('Chave duplicada')
   out[k]=v
  return out
 def invalid(value):raise ValueError('Número inválido')
 value=json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=invalid)
 if not isinstance(value,dict):raise ValueError('Objeto obrigatório')
 pending=[(value,0)]
 while pending:
  item,depth=pending.pop()
  if depth>64:raise ValueError('JSON profundo demais')
  if isinstance(item,float) and not math.isfinite(item):raise ValueError('Número fora do limite')
  if isinstance(item,dict):pending.extend((x,depth+1) for x in item.values())
  elif isinstance(item,list):pending.extend((x,depth+1) for x in item)
 return value

def request_limit(path):
 # Portraits are PNG data URLs converted locally, not combat commands.
 return {'/api/upload':15*1024**2,'/api/character-portrait':3*1024**2+4096}.get(path,65536)

def body_size(headers,limit):
 lengths=headers.get_all('Content-Length',[])
 if headers.get_all('Transfer-Encoding',[]) or len(lengths)!=1:raise ValueError('Enquadramento inválido')
 v=lengths[0]
 if not v.isascii() or not v.isdecimal() or len(v)>10:raise ValueError('Comprimento inválido')
 size=int(v)
 if not 0<size<=limit:raise OverflowError('Corpo acima do limite')
 return size
