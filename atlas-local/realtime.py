"""SSE change hints and ephemeral previews, filtered per authenticated viewer."""
import json,threading,time
from collections import defaultdict,OrderedDict
from contextlib import closing
from urllib.parse import urlsplit
_condition=threading.Condition()
_preloads={}
_visibility_cache=OrderedDict()
_previews=defaultdict(dict)
_preview_versions=defaultdict(int)
_versions=defaultdict(lambda:dict(scene=0,combat=0,chat=0,rolls=0))

def publish(tid,path):
 if not isinstance(tid,str) or not tid:return
 ep=urlsplit(path).path
 topics=('chat','rolls') if ep in ('/api/chat','/api/roll','/api/clear-chat','/api/clear-rolls') else ('scene','combat')
 with _condition:
  for topic in topics:_versions[tid][topic]+=1
  _condition.notify_all()

def preview(tid,packet):
 with _condition:
  now=time.monotonic()
  bucket=_previews[tid]
  for key in list(bucket):
   if now-bucket[key][0]>2:del bucket[key]
  if len(bucket)>=256:bucket.clear()
  bucket[(packet['asset_id'],packet['token_id'])]=(now,packet)
  _preview_versions[tid]+=1
  _condition.notify_all()

def clear_previews(tid):
 with _condition:
  _previews.pop(tid,None)
  _preview_versions[tid]+=1
  _condition.notify_all()

def visible_tokens(c,data,tid,aid,user,master):
 # Match the combat API visibility policy without hydrating sheets, bars or history.
 from assets import permitted
 from scene_variants import combat_key
 import fog,token_vision
 asset=permitted(c,tid,aid,user,master)
 if not asset:return {}
 row=c.execute('SELECT state FROM combats WHERE table_id=? AND asset_id=?',(tid,combat_key(c,tid,aid))).fetchone()
 if not row:return {}
 state=json.loads(row[0]);tokens=state.get('tokens',[])
 if master:return {t['id']:t for t in tokens}
 # Invalidate on every committed table change; also bind to the actual stored token state.
 with _condition:
  versions=tuple(_versions[tid].items())
  cache_key=(tid,aid,user,versions,row[0])
  cached=_visibility_cache.get(cache_key)
  if cached and time.monotonic()-cached[0]<.5:
   _visibility_cache.move_to_end(cache_key);return cached[1]

 manual=fog.read(c,tid,asset['digest'])
 view=token_vision.effective(c,data,tid,asset,user,manual)
 height=700
 if view['enabled']:
  width,pixels=fog.dimensions(str(data/'blobs'/asset['digest']));height=1000*pixels/width
 size=state['grid']['size']
 visible={t['id']:t for t in tokens if not t.get('hidden',False) and (fog.token_visible(view,t,size,height) or (t.get('owner')==user and fog.token_visible(manual,t,size,height)))}
 with _condition:
  if tuple(_versions[tid].items())==versions:
   _visibility_cache[cache_key]=(time.monotonic(),visible)
   while len(_visibility_cache)>128:_visibility_cache.popitem(last=False)
 return visible

def filtered_previews(c,tid,user,master,data):
 current=c.execute('SELECT asset_id FROM scene WHERE table_id=?',(tid,)).fetchone()
 if not current or not current[0]:return []
 aid=current[0]
 with _condition:
  packets=[dict(packet) for stamp,packet in _previews[tid].values() if time.monotonic()-stamp<2 and packet['asset_id']==aid]
 if not packets:return []
 allowed=visible_tokens(c,data,tid,aid,user,master)
 return [p for p in packets if p['token_id'] in allowed]

def prepare(tid,aid):
 import secrets
 with _condition:
  ticket=secrets.token_hex(8)
  _preloads[tid]={'id':ticket,'asset_id':aid,'ready':set(),'at':time.monotonic()}
  _preview_versions[tid]+=1;_condition.notify_all()
 return ticket

def ready(tid,user,ticket):
 with _condition:
  p=_preloads.get(tid)
  if p and p['id']==ticket:
   p['ready'].add(user);_preview_versions[tid]+=1;_condition.notify_all()

def preload_for(c,tid,user,master):
 from assets import permitted
 with _condition:
  p=_preloads.get(tid)
  if not p or time.monotonic()-p['at']>600:return None
  p={**p,'ready':set(p['ready'])}
 if not permitted(c,tid,p['asset_id'],user,master):return None
 return {'id':p['id'],'asset_id':p['asset_id'],**({'ready':len(p['ready'])} if master else {})}

def snapshot(tid):
 with _condition:return dict(_versions[tid])

class Stream:
 def __init__(self,tid,user,token):self.tid,self.user,self.token=tid,user,token
 def serve(self,handler,db,data):
  handler.send_response(200);handler.send_header('Content-Type','text/event-stream');handler.send_header('Cache-Control','no-store');handler.send_header('X-Accel-Buffering','no');handler.end_headers()
  previous=None;preview_version=-1;start=time.monotonic()
  # Rotate connections periodically; no SQLite transaction remains open while waiting.
  while time.monotonic()-start<120:
   with closing(db()) as c:
    permitted=c.execute('SELECT m.role FROM sessions s JOIN members m ON m.user_id=s.user_id WHERE s.token=? AND s.user_id=? AND s.expires>? AND m.table_id=?',(self.token,self.user,time.time(),self.tid)).fetchone()
   if not permitted:
    handler.wfile.write(b'event: revoked\ndata: {}\n\n');handler.wfile.flush();break
   with _condition:
    current=dict(_versions[self.tid]);pv=_preview_versions[self.tid]
   if pv!=preview_version:
    with closing(db()) as c,c:
     packets=filtered_previews(c,self.tid,self.user,permitted[0] in ('owner','gm'),data)
     prep=preload_for(c,self.tid,self.user,permitted[0] in ('owner','gm'))
    if prep:
     handler.wfile.write(('event: preload\ndata: '+json.dumps(prep)+'\n\n').encode());handler.wfile.flush()
    preview_version=pv
    if packets:
     handler.wfile.write(('event: token-preview\ndata: '+json.dumps(packets)+'\n\n').encode());handler.wfile.flush()
   if current!=previous:
    payload=('event: change\ndata: '+json.dumps(current)+'\n\n').encode();previous=current
   else:payload=b': heartbeat\n\n'
   handler.wfile.write(payload);handler.wfile.flush()
   with _condition:_condition.wait_for(lambda:dict(_versions[self.tid])!=previous or _preview_versions[self.tid]!=preview_version,timeout=10)
  handler.close_connection=True
