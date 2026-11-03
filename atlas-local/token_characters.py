"""Vínculo de identidade. Recursos vivem só na ficha, nunca no histórico do token."""
import json
RESOURCE_KEYS=('pv_atual','pv_maximo','pd_atual','pd_maximo','def_natural','def_armadura','def_escudo','def_mod')
def records(c,tid):
 return {r['id']:r for r in c.execute('SELECT * FROM characters WHERE table_id=?',(tid,))}
def hydrate(c,tid,state,require=None):
 rows=records(c,tid);members={r[0] for r in c.execute('SELECT user_id FROM members WHERE table_id=?',(tid,))}
 for token in state['tokens']:
  cid=token.get('character_id')
  if cid is None or cid=='':
   token.pop('character_id',None);continue
  if not isinstance(cid,str) or cid not in rows:
   if require:require(False,400,'Escolha uma ficha desta mesa.')
   token.pop('character_id',None);token['owner']=None;continue
  ch=rows[cid];fields=json.loads(ch['fields'])
  token['name']=str(fields.get('nome') or ch['name'])[:60]
  token['owner']=ch['user_id'] if ch['user_id'] in members else None
 linked={t['id']:t for t in state['tokens'] if t.get('character_id')}
 for entry in state['entries']:
  if entry['token'] in linked:entry['name']=linked[entry['token']]['name']
 return rows

def summaries(state,rows,user,master):
 result={}
 for token in state['tokens']:
  cid=token.get('character_id');ch=rows.get(cid)
  if not ch:continue
  if not master and ch['user_id']!=user:
   token.pop('character_id',None);continue
  fields=json.loads(ch['fields'])
  result[cid]={'id':cid,'name':str(fields.get('nome') or ch['name']),'revision':ch['revision'],'resources':{k:fields.get(k,'') for k in RESOURCE_KEYS}}
 return result
