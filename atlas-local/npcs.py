"""Private, per-table NPC journal with optimistic concurrency."""
import secrets
from urllib.parse import urlsplit

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS npcs(id TEXT PRIMARY KEY,table_id TEXT REFERENCES tables(id),name TEXT NOT NULL,summary TEXT NOT NULL,body TEXT NOT NULL,appearance TEXT,revision INTEGER NOT NULL DEFAULT 1)')
 c.execute('CREATE INDEX IF NOT EXISTS npc_table ON npcs(table_id)')

def handle(c,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/npcs':return NotImplemented
 require(master)
 if not d:return [dict(r) for r in c.execute('SELECT id,name,summary,body,appearance,revision FROM npcs WHERE table_id=?',(tid,))]
 ident=d.get('id');old=c.execute('SELECT * FROM npcs WHERE id=? AND table_id=?',(ident,tid)).fetchone() if isinstance(ident,str) else None
 if ident:
  require(old,404,'Personagem não encontrado nesta mesa.')
  require(type(d.get('revision'))==int and d['revision']==old['revision'],409,'Outro mestre alterou este personagem. Copie suas notas e reabra o card antes de salvar.')
 if d.get('delete') is True:
  require(old,404,'Personagem não encontrado.');c.execute('DELETE FROM npcs WHERE id=?',(ident,));return {'ok':True}
 values=[]
 for key,limit in [('name',60),('summary',180),('body',24000)]:
  value=d.get(key,'');require(isinstance(value,str) and len(value)<=limit,400,'Texto inválido ou muito longo.');values.append(value.strip())
 require(values[0],400,'Informe o nome do personagem.')
 from custom_tokens import valid_appearance
 appearance=d.get('appearance');require(valid_appearance(c,tid,appearance),400,'Token indisponível nesta mesa.')
 if old:c.execute('UPDATE npcs SET name=?,summary=?,body=?,appearance=?,revision=revision+1 WHERE id=?',(*values,appearance,ident))
 else:
  ident=secrets.token_hex(16);c.execute('INSERT INTO npcs VALUES(?,?,?,?,?,?,1)',(ident,tid,*values,appearance))
 return {'id':ident,'revision':old['revision']+1 if old else 1}
