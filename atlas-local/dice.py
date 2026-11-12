"""Interpretador de dados, sem eval. Subconjunto explícito da notação Rollem V1.
AST limitado antes de sortear; detalhes preservados, sorteio apenas no servidor.
"""
import re,secrets,math,json,time
from urllib.parse import urlsplit,parse_qs
class DiceError(ValueError):pass
TOKEN=re.compile(r'\s*(\d+|daro|taro|aro|ns|kh|kl|dh|dl|\+\+|--|<<|>>|<=|>=|[dDfFBGWkch!#()+*/<>=-])')
LIMIT=1000

def parse(text):
 if not isinstance(text,str) or not 1<=len(text)<=300:raise DiceError('Expressão: 1–300 caracteres.')
 text=text.strip();text=re.sub(r'^(?:/roll\s+|/r\s+|&)', '', text,flags=re.I)
 tokens=[];pos=0
 while pos<len(text):
  m=TOKEN.match(text,pos)
  if not m:raise DiceError('Símbolo inválido na posição '+str(pos+1)+'. Use o campo Descrição para anotações.')
  tokens.append(m[1]);pos=m.end()
 if not tokens or len(tokens)>180:raise DiceError('Expressão muito longa.')
 p=Parser(tokens);repeat=1
 if len(tokens)>1 and tokens[0].isdigit() and tokens[1]=='#':repeat=int(tokens[0]);p.i=2
 if not 1<=repeat<=20:raise DiceError('Use de 1 a 20 repetições.')
 node=p.comparison()
 if p.i!=len(tokens):raise DiceError('Notação incompleta ou modificador fora de ordem.')
 return repeat,node
class Parser:
 def __init__(self,t):self.t=t;self.i=0;self.depth=0
 def peek(self):return self.t[self.i] if self.i<len(self.t) else ''
 def pop(self):
  if self.i>=len(self.t):raise DiceError('Expressão incompleta.')
  v=self.t[self.i];self.i+=1;return v
 def integer(self):
  n=self.pop()
  if not n.isdigit() or len(n)>6:raise DiceError('Use um inteiro de até seis dígitos.')
  return int(n)
 def comparison(self):
  a=self.count()
  if self.peek() in ['<','<=','>','>=','=']:
   op=self.pop();a=('op',op,a,self.count())
  return a
 def count(self):
  a=self.add()
  while self.peek() in ['<<','>>']:a=('op',self.pop(),a,self.add())
  return a
 def add(self):
  a=self.mul()
  while self.peek() in ['+','-']:a=('op',self.pop(),a,self.mul())
  return a
 def mul(self):
  a=self.perdie()
  while self.peek() in ['*','/']:a=('op',self.pop(),a,self.perdie())
  return a
 def perdie(self):
  a=self.atom()
  while self.peek() in ['++','--']:a=('op',self.pop(),a,self.atom())
  return a
 def atom(self):
  self.depth+=1
  if self.depth>20:raise DiceError('Máximo de 20 níveis de parênteses.')
  try:
   t=self.peek()
   if t in ['+','-']:
    op=self.pop();return ('op','*',('n',-1 if op=='-' else 1),self.atom())
   if t=='(':
    self.pop();a=self.count()
    if self.pop()!=')':raise DiceError('Feche o parêntese. Comparações só podem estar no final.')
    return a
   if t in ['B','G','W']:
    letter=self.pop();count=self.integer();expl=self.peek()=='!'
    if expl:self.pop()
    return ('op','>>',self.die(count,6,{'explode':6} if expl else {}),('n',{'B':4,'G':3,'W':2}[letter]))
   count=1
   if t.isdigit():
    count=self.integer()
    if self.peek().lower()!='d':return ('n',count)
   if self.pop().lower()!='d':raise DiceError('Use dados como 1d20 ou 4d6.')
   sides=self.pop() if self.peek() in ['F','f'] else self.integer()
   if sides in ['f','F']:sides='F'
   mods={}
   while self.peek() in ['!','ns','k','kh','kl','d','dh','dl','c','aro','daro','taro']:
    op=self.pop()
    key='keep' if op in ['k','kh','kl','d','dh','dl'] else 'aro' if op in ['aro','daro','taro'] else op
    if key in mods:raise DiceError('Modificador repetido.')
    if op=='!':mods[key]=self.integer() if self.peek().isdigit() else sides
    elif op=='ns':mods[key]=True
    elif op in ['aro','daro','taro']:
     if count<2 or op=='daro' and count!=2 or op=='taro' and count!=3:raise DiceError('ARO exige ao menos 2 dados; DARO usa 2 e TARO usa 3.')
     mods[key]=True
    elif key=='keep':mods[key]=(op,self.integer())
    else:mods[key]=self.integer()
   if '!' in mods:mods['explode']=mods.pop('!')
   return self.die(count,sides,mods)
  finally:self.depth-=1
 def die(self,count,sides,mods):
  if not 1<=count<=100 or sides!='F' and not 2<=sides<=100000:raise DiceError('Use 1–100 dados, com 2–100.000 faces, ou dF.')
  if 'explode' in mods and (sides=='F' or not 2<=mods['explode']<=sides):raise DiceError('Explosão precisa de um limite entre 2 e as faces do dado.')
  if 'c' in mods and 'keep' in mods:raise DiceError('Crítico c não pode ser combinado com manter/descartar.')
  if mods.get('aro') and ('explode' in mods or 'keep' in mods):raise DiceError('Use ARO sem explosão ou manter/descartar.')
  return ('dice',count,sides,mods)

def roll(expression,randbelow=None):
 repeats,ast=parse(expression);randbelow=randbelow or secrets.randbelow;used=0
 def sample(sides):
  nonlocal used
  used+=1
  if used>LIMIT:raise DiceError('Limite de 1.000 sorteios, incluindo explosões. Nenhum resultado foi registrado.')
  return randbelow(3)-1 if sides=='F' else randbelow(sides)+1
 def evaluate(n,groups):
  if n[0]=='n':return [n[1]]
  if n[0]=='dice':
   _,count,sides,mods=n;raw=[]
   while True:
    batch=[]
    for _ in range(count):
     v=sample(sides);batch.append(v)
     while 'explode' in mods and v>=mods['explode']:
      v=sample(sides);batch.append(v)
    raw.extend(batch)
    if not mods.get('aro') or len(set(batch))!=1:break
   kept=set(range(len(raw)))
   if 'keep' in mods:
    kind,k=mods['keep'];order=sorted(kept,key=lambda i:raw[i],reverse=kind in ['k','kh','dh'])
    kept=set(order[:k]) if kind in ['k','kh','kl'] else set(order[k:])
   order=list(range(len(raw))) if mods.get('ns') else sorted(range(len(raw)),key=lambda i:raw[i],reverse=True)
   groups.append({'count':count,'sides':sides,'dice':[{'value':raw[i],'kept':i in kept,'critical':'c' in mods and raw[i]>=mods['c']} for i in order]})
   return [raw[i] for i in range(len(raw)) if i in kept]
  _,op,left,right=n;a=evaluate(left,groups);b=evaluate(right,groups);x,y=sum(a),sum(b)
  if op=='++':v=[i+y for i in a]
  elif op=='--':v=[i-y for i in a]
  elif op=='<<':v=[sum(i<=y for i in a)]
  elif op=='>>':v=[sum(i>=y for i in a)]
  elif op=='+':v=[x+y]
  elif op=='-':v=[x-y]
  elif op=='*':v=[x*y]
  elif op=='/':
   if y==0:raise DiceError('Divisão por zero. Nenhum resultado foi registrado.')
   v=[x/y]
  else:v=[{'<':lambda:x<y,'<=':lambda:x<=y,'>':lambda:x>y,'>=':lambda:x>=y,'=':lambda:x==y}[op]()]
  if any(not math.isfinite(i) or abs(i)>10**12 for i in v):raise DiceError('Resultado fora do limite numérico.')
  return v
 results=[]
 for _ in range(repeats):
  groups=[];v=evaluate(ast,groups);total=v[0] if ast[0]=='op' and ast[1] in ['<','<=','>','>=','='] else sum(v)
  results.append({'total':total,'groups':groups})
 return {'expression':expression,'results':results,'draws':used}

def install(c):
 from dice_favorites import install as install_favorites
 install_favorites(c)
 c.execute('CREATE TABLE IF NOT EXISTS dice_rolls(id INTEGER PRIMARY KEY AUTOINCREMENT,table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),label TEXT,scope TEXT,payload TEXT,created INTEGER,request_id TEXT,UNIQUE(table_id,user_id,request_id))')
 c.execute('CREATE INDEX IF NOT EXISTS dice_table_history ON dice_rolls(table_id,id)')

def chat_command(body):
 if not isinstance(body,str):return None
 match=re.match(r'^\s*/(?:r|roll)(?:\s+|$)(.*)',body,re.I|re.S)
 if not match:return None
 expression,sep,label=match[1].partition('|')
 return {'expression':expression.strip(),'label':label.strip() if sep else ''}

def chat_events(c,tid,user,master,cursor,require):
 # Stable keyset across messages and rolls, including identical timestamps.
 args=[tid,tid,user]
 visibility="r.user_id=? OR r.scope='public'"+(" OR r.scope='gm'" if master else '')
 sql="""SELECT * FROM (
 SELECT m.created,0 AS kind,m.id,m.body,u.name,m.user_id,NULL AS label,NULL AS scope,NULL AS payload
 FROM messages m JOIN users u ON u.id=m.user_id WHERE m.table_id=?
 UNION ALL
 SELECT r.created,1 AS kind,r.id,NULL,u.name,r.user_id,r.label,r.scope,r.payload
 FROM dice_rolls r JOIN users u ON u.id=r.user_id WHERE r.table_id=? AND ("""+visibility+"))"
 if cursor:
  require(bool(re.fullmatch(r'\d{1,12}:[01]:\d{1,18}',cursor)),400,'Cursor inválido.')
  sql+=' WHERE (created,kind,id)<(?,?,?)';args.extend(map(int,cursor.split(':')))
 rows=c.execute(sql+' ORDER BY created DESC,kind DESC,id DESC LIMIT 100',args).fetchall()
 result=[]
 for row in reversed(rows):
  item=dict(row);item['cursor']=f"{row['created']}:{row['kind']}:{row['id']}"
  if item['payload']:item['payload']=json.loads(item['payload'])
  result.append(item)
 return result

def handle(c,path,d,user,tid,master,require):
 ep=urlsplit(path).path;q=parse_qs(urlsplit(path).query)
 if ep=='/api/chat-events' and not d:return chat_events(c,tid,user,master,q.get('before',[''])[0],require)
 if ep=='/api/chat' and d:
  command=chat_command(d.get('body'))
  if command is not None:
   d={**d,**command};ep='/api/roll'
 if ep=='/api/roll' and d:
  label=d.get('label','');scope=d.get('scope','public');rid=d.get('request_id','')
  require(isinstance(label,str) and len(label)<=120 and scope in ['public','gm','self'],400,'Descrição ou visibilidade inválida.')
  require(isinstance(rid,str) and re.fullmatch(r'[a-zA-Z0-9_-]{8,80}',rid),400,'Identificador da rolagem inválido.')
  old=c.execute('SELECT * FROM dice_rolls WHERE table_id=? AND user_id=? AND request_id=?',(tid,user,rid)).fetchone()
  if old:
   require(old['label']==label and old['scope']==scope and json.loads(old['payload'])['expression']==d.get('expression'),409,'Identificador já usado para outra rolagem.')
   return {'id':old['id'],'payload':json.loads(old['payload']),'reused':True}
  require(c.execute('SELECT count(*) FROM dice_rolls WHERE table_id=? AND user_id=? AND created>?',(tid,user,time.time()-10)).fetchone()[0]<15,429,'Aguarde alguns segundos antes de rolar novamente.')
  try:payload=roll(d.get('expression'))
  except DiceError as e:require(False,400,str(e))
  cur=c.execute('INSERT INTO dice_rolls(table_id,user_id,label,scope,payload,created,request_id) VALUES(?,?,?,?,?,?,?)',(tid,user,label,scope,json.dumps(payload),int(time.time()),rid))
  return {'id':cur.lastrowid,'payload':payload,'reused':False}
 if ep=='/api/rolls' and not d:
  before=int(q.get('before',['0'])[0]);require(before>=0,400,'Cursor inválido.')
  args=[tid,user];sql="SELECT r.*,u.name FROM dice_rolls r JOIN users u ON r.user_id=u.id WHERE r.table_id=? AND (r.user_id=? OR r.scope='public'"+(" OR r.scope='gm'" if master else '')+")"
  if before:sql+=' AND r.id<?';args.append(before)
  rows=c.execute(sql+' ORDER BY r.id DESC LIMIT 50',args).fetchall()
  return [{'id':r['id'],'user_id':r['user_id'],'name':r['name'],'label':r['label'],'scope':r['scope'],'created':r['created'],'payload':json.loads(r['payload'])} for r in reversed(rows)]
 if ep=='/api/clear-rolls' and d:
  require(master);c.execute("DELETE FROM dice_rolls WHERE table_id=? AND scope!='self'",(tid,));return {'ok':True}
 return NotImplemented
