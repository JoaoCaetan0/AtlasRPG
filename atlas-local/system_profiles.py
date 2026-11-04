"""Versioned table-local profiles and bounded numeric formula evaluation."""
import ast
import copy
import json
import math
import re
from urllib.parse import urlsplit

PRESETS = [
 ('estigma','Estigma do Caos','Livro da campanha','estigma'),
 ('ordem','Ordem Paranormal','Livro básico — estrutura inicial','generic'),
 ('tormenta20','Tormenta20','Jogo do Ano — estrutura inicial','generic'),
 ('dnd2014','D&D','2014 / SRD 5.1 — estrutura inicial','generic'),
 ('dnd2024','D&D','2024 / SRD 5.2.1 — estrutura inicial','generic'),
 ('custom','Personalizado','Suas regras','generic'),
]

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS system_profiles(table_id TEXT PRIMARY KEY REFERENCES tables(id),profile TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0)')

def presets():
 return [{'id':i,'name':n,'edition':e,'engine':g,'coverage':'Assistente Estigma existente' if g=='estigma' else 'Ficha configurável; catálogos e automações oficiais pendentes'} for i,n,e,g in PRESETS]

def preset(key):
 item=next((p for p in presets() if p['id']==key),None)
 if not item:raise ValueError('Sistema desconhecido.')
 result={**item,'version':1,'fields':[
  {'id':'nome','label':'Nome','group':'Identidade','type':'text','formula':''},
  {'id':'anotacoes','label':'Anotações','group':'Anotações','type':'longtext','formula':''},
 ] if item['engine']=='generic' else []}
 if item['engine']=='generic' and key!='custom':
  labels=[('origem','Origem'),('classe','Classe')]
  if key!='ordem':labels.insert(0,('ancestralidade','Raça / espécie'))
  result['fields'][1:1]=[{'id':k,'label':label,'group':'Identidade','type':'text','formula':''} for k,label in labels]
  # Blank fields only: no unverified official calculation or character options.
  result['fields'] += [{'id':k,'label':label,'group':'Recursos','type':'number','formula':''} for k,label in [('pv_atual','Vida atual'),('pv_maximo','Vida máxima'),('defesa','Defesa')]]
 return result

def read(c,tid):
 row=c.execute('SELECT * FROM system_profiles WHERE table_id=?',(tid,)).fetchone()
 if row:return json.loads(row['profile']),row['revision']
 # Legacy records are never migrated by a read. Preserve their working Estigma adapter.
 p=preset('estigma');name=c.execute('SELECT system FROM tables WHERE id=?',(tid,)).fetchone()
 if name and name[0]:p['name']=name[0]
 return p,0

def initialize(c,tid,key):
 p=preset(key)
 c.execute('INSERT INTO system_profiles VALUES(?,?,0)',(tid,json.dumps(p,ensure_ascii=False)))
 if p['engine']=='generic':
  from admin import defaults
  config=defaults();config['conditions']=[]
  c.execute('INSERT INTO table_settings VALUES(?,?,0)',(tid,json.dumps(config,ensure_ascii=False)))
 return p

OPS={ast.Add:lambda a,b:a+b,ast.Sub:lambda a,b:a-b,ast.Mult:lambda a,b:a*b,ast.Div:lambda a,b:a/b}
FUNCS={'min':min,'max':max,'floor':math.floor,'ceil':math.ceil,'round':round,'abs':abs}
def expression(source,allowed):
 if not isinstance(source,str) or len(source)>250:raise ValueError('Fórmula muito longa (máximo 250 caracteres).')
 try:tree=ast.parse(source,mode='eval')
 except (SyntaxError,RecursionError):raise ValueError('Fórmula inválida.')
 nodes=list(ast.walk(tree))
 if len(nodes)>80:raise ValueError('Simplifique a fórmula.')
 refs=set()
 for node in nodes:
  if isinstance(node,ast.Name):
   if node.id not in FUNCS:
    if node.id not in allowed:raise ValueError('Campo desconhecido na fórmula: '+node.id)
    refs.add(node.id)
  elif isinstance(node,ast.Call):
   if not isinstance(node.func,ast.Name) or node.func.id not in FUNCS or node.keywords or not 1<=len(node.args)<=8:raise ValueError('Função não permitida.')
  elif isinstance(node,ast.Constant):
   if type(node.value) not in (int,float) or not math.isfinite(node.value) or abs(node.value)>1e9:raise ValueError('Número fora do limite.')
  elif not isinstance(node,(ast.Expression,ast.Load,ast.BinOp,ast.UnaryOp,ast.UAdd,ast.USub,*OPS)):
   raise ValueError('Use números, campos, +, -, *, / e funções permitidas.')
 return tree,refs

def evaluate(tree,values):
 def run(n):
  if isinstance(n,ast.Expression):return run(n.body)
  if isinstance(n,ast.Constant):return n.value
  if isinstance(n,ast.Name):return float(values.get(n.id) or 0)
  if isinstance(n,ast.BinOp):v=OPS[type(n.op)](run(n.left),run(n.right))
  elif isinstance(n,ast.UnaryOp):v=(-1 if isinstance(n.op,ast.USub) else 1)*run(n.operand)
  else:v=FUNCS[n.func.id](*[run(a) for a in n.args])
  if not math.isfinite(v) or abs(v)>1e12:raise ValueError('Resultado fora do limite.')
  return v
 return run(tree)

def validate(p):
 if not isinstance(p,dict) or len(json.dumps(p))>30000:raise ValueError('Perfil inválido ou muito grande.')
 if p.get('id') not in {x[0] for x in PRESETS} or p.get('engine') not in ('estigma','generic') or p.get('version')!=1:raise ValueError('Formato do perfil desconhecido.')
 for key,limit in [('name',120),('edition',160)]:
  if not isinstance(p.get(key),str) or not p[key].strip() or len(p[key])>limit:raise ValueError('Revise nome e edição do sistema.')
 fields=p.get('fields')
 if not isinstance(fields,list) or len(fields)>100:raise ValueError('Use até 100 campos.')
 ids=set()
 for f in fields:
  if not isinstance(f,dict) or not isinstance(f.get('id'),str) or not re.fullmatch('[a-z][a-z0-9_]{0,39}',f['id']) or f['id'] in ids or f['id'] in FUNCS:raise ValueError('Identificador de campo inválido ou repetido.')
  ids.add(f['id'])
  for k,limit in [('label',80),('group',60)]:
   if not isinstance(f.get(k),str) or not f[k].strip() or len(f[k])>limit:raise ValueError('Informe nome e seção do campo.')
  if f.get('type') not in ('text','number','longtext') or not isinstance(f.get('formula'),str):raise ValueError('Tipo de campo inválido.')
  if f['formula'] and f['type']!='number':raise ValueError('Somente campos numéricos aceitam fórmulas.')
 numeric={f['id'] for f in fields if f['type']=='number'};deps={}
 for f in fields:
  if f['formula']:deps[f['id']]=expression(f['formula'],numeric)[1]
 done=set()
 def visit(k,stack):
  if k in stack:raise ValueError('Fórmulas formam um ciclo: '+k)
  if k in done:return
  for other in deps.get(k,[]):visit(other,stack|{k})
  done.add(k)
 for k in deps:visit(k,set())

def calculate(p,values,overrides):
 validate(p)
 if not isinstance(values,dict) or len(values)>1000 or not all(isinstance(k,str) and isinstance(v,str) and len(v)<=10000 for k,v in values.items()):raise ValueError('Valores da ficha inválidos.')
 formulas={f['id']:f for f in p['fields'] if f['formula']}
 if not isinstance(overrides,list) or len(overrides)>100 or any(not isinstance(k,str) or k not in formulas for k in overrides):raise ValueError('Ajustes manuais inválidos.')
 result=copy.deepcopy(values);done=set();numeric={f['id'] for f in p['fields'] if f['type']=='number'}
 for k in numeric:
  try:v=float(values.get(k) or 0)
  except (ValueError,TypeError):raise ValueError('Informe um número em '+k+'.')
  if not math.isfinite(v) or abs(v)>1e12:raise ValueError('Número fora do limite em '+k+'.')
 def resolve(k):
  if k in done or k not in formulas or k in overrides:return
  tree,refs=expression(formulas[k]['formula'],numeric)
  for ref in refs:resolve(ref)
  try:v=evaluate(tree,result)
  except (ValueError,TypeError,ZeroDivisionError,OverflowError):raise ValueError('Não foi possível calcular '+formulas[k]['label']+'. Confira os valores e divisões por zero.')
  result[k]=str(int(v) if v==int(v) else v);done.add(k)
 for k in formulas:resolve(k)
 return result

def handle(c,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/system-profile':return NotImplemented
 p,revision=read(c,tid)
 if d:
  require(master);require(d.get('revision')==revision,409,'O sistema mudou. Reabra antes de salvar.')
  candidate=d.get('profile')
  try:validate(candidate)
  except ValueError as error:require(False,400,str(error))
  require(candidate['id']==p['id'] and candidate['engine']==p['engine'],400,'Troca de sistema exige migração; crie outra mesa por enquanto.')
  if p['engine']=='estigma':require(candidate['fields']==p['fields'],400,'O assistente Estigma mantém seus campos próprios nesta etapa.')
  c.execute('INSERT INTO system_profiles VALUES(?,?,?) ON CONFLICT(table_id) DO UPDATE SET profile=excluded.profile,revision=excluded.revision',(tid,json.dumps(candidate,ensure_ascii=False),revision+1))
  c.execute('UPDATE tables SET system=? WHERE id=?',(candidate['name'],tid));p=candidate;revision+=1
 return {'profile':p,'revision':revision}
