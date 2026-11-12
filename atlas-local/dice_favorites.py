"""Personal, table-scoped formula shortcuts. Saving never rolls dice."""
from urllib.parse import urlsplit
from dice import parse,DiceError

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS dice_favorites(table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),name TEXT,expression TEXT,label TEXT,scope TEXT,PRIMARY KEY(table_id,user_id,name))')

def handle(c,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/dice-favorites':return NotImplemented
 if not d:
  return [dict(r) for r in c.execute('SELECT name,expression,label,scope FROM dice_favorites WHERE table_id=? AND user_id=? ORDER BY name COLLATE NOCASE',(tid,user))]
 name=d.get('name','');action=d.get('action','save')
 require(isinstance(name,str) and 1<=len(name.strip())<=60 and action in ['save','delete'],400,'Nome: 1–60 caracteres.')
 name=name.strip()
 if action=='delete':
  c.execute('DELETE FROM dice_favorites WHERE table_id=? AND user_id=? AND name=?',(tid,user,name));return {'ok':True}
 expression=d.get('expression');label=d.get('label','');scope=d.get('scope','public')
 require(isinstance(label,str) and len(label)<=120 and scope in ['public','gm','self'],400,'Descrição ou visibilidade inválida.')
 try:parse(expression)
 except DiceError as e:require(False,400,str(e))
 old=c.execute('SELECT 1 FROM dice_favorites WHERE table_id=? AND user_id=? AND name=?',(tid,user,name)).fetchone()
 count=c.execute('SELECT count(*) FROM dice_favorites WHERE table_id=? AND user_id=?',(tid,user)).fetchone()[0]
 require(old or count<30,400,'Limite de 30 favoritos por mesa. Remova um para continuar.')
 c.execute('INSERT INTO dice_favorites VALUES(?,?,?,?,?,?) ON CONFLICT(table_id,user_id,name) DO UPDATE SET expression=excluded.expression,label=excluded.label,scope=excluded.scope',(tid,user,name,expression.strip(),label,scope))
 return {'ok':True}
