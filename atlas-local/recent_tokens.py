"""Thirty custom token templates per master and table; never scene state."""
import json
from urllib.parse import urlsplit

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS recent_tokens(seq INTEGER PRIMARY KEY AUTOINCREMENT,table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),template TEXT NOT NULL)')
 c.execute('CREATE INDEX IF NOT EXISTS recent_token_owner ON recent_tokens(table_id,user_id,seq)')

def remember(c,tid,user,token):
 template={k:token.get(k) for k in ('name','appearance','color','budget','hidden')}
 c.execute('INSERT INTO recent_tokens(table_id,user_id,template) VALUES(?,?,?)',(tid,user,json.dumps(template,ensure_ascii=False)))
 c.execute('DELETE FROM recent_tokens WHERE table_id=? AND user_id=? AND seq NOT IN (SELECT seq FROM recent_tokens WHERE table_id=? AND user_id=? ORDER BY seq DESC LIMIT 30)',(tid,user,tid,user))

def handle(c,path,d,user,tid,master,require):
 if urlsplit(path).path!='/api/recent-tokens':return NotImplemented
 require(master);require(not d,405,'Use a biblioteca para consultar modelos recentes.')
 return [{'id':'recent-'+str(r['seq']),**json.loads(r['template'])} for r in c.execute('SELECT seq,template FROM recent_tokens WHERE table_id=? AND user_id=? ORDER BY seq DESC LIMIT 30',(tid,user))]
