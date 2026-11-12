"""Authenticated WebSocket adapter on the existing HTTP socket (websockets Sans-I/O)."""
import json,select,socket,time
from contextlib import closing
from collections import deque,OrderedDict
import realtime
from request_security import strict_json

COMMANDS=frozenset(('token-preview','token-facing','combat-move','combat','combat-undo','combat-redo','scene','scene-navigate','scene-previous','scene-period','chat','roll','scene-preload','scene-preload-ready'))

class Socket:
 def __init__(self,tid,user,token):self.tid,self.user,self.token=tid,user,token
 def serve(self,handler,db,data):
  from websockets.server import ServerProtocol
  from websockets.http11 import Request
  from websockets.frames import Frame,OP_TEXT,OP_CONT,OP_BINARY,OP_PONG
  from websockets.protocol import State
  protocol=ServerProtocol(origins=['http://'+handler.headers['Host']],max_size=65536)
  conn=handler.connection;conn.settimeout(2);conn.setsockopt(socket.IPPROTO_TCP,socket.TCP_NODELAY,1)
  handler.close_connection=True
  def flush():
   for chunk in protocol.data_to_send():
    if chunk:conn.sendall(chunk)
  def emit(kind,payload):
   protocol.send_text(json.dumps({'type':kind,'data':payload},ensure_ascii=False,allow_nan=False).encode());flush()
  # BaseHTTPRequestHandler already consumed the HTTP header; delegate validation to the library.
  header=(handler.requestline+'\r\n'+''.join(k+': '+v+'\r\n' for k,v in handler.headers.items())+'\r\n').encode('latin-1')
  protocol.receive_data(header)
  requests=protocol.events_received()
  if len(requests)!=1 or not isinstance(requests[0],Request):flush();return
  response=protocol.accept(requests[0]);protocol.send_response(response);flush()
  if response.status_code!=101:return
  previous=None;pv=-1;auth_at=0;role=None;fragment=bytearray();rates=deque();results=OrderedDict()
  ping_at=time.monotonic();pong_at=ping_at
  try:
   while protocol.state is State.OPEN:
    now=time.monotonic()
    if now-auth_at>=1:
     with closing(db()) as c:
      member=c.execute('SELECT m.role FROM sessions s JOIN members m ON m.user_id=s.user_id WHERE s.token=? AND s.user_id=? AND s.expires>? AND m.table_id=?',(self.token,self.user,time.time(),self.tid)).fetchone()
     if not member:
      emit('revoked',{});protocol.send_close(1008,'Acesso encerrado');flush();break
     role=member[0];auth_at=now
    with realtime._condition:
     current=dict(realtime._versions[self.tid]);version=realtime._preview_versions[self.tid]
    if version!=pv:
     with closing(db()) as c,c:
      packets=realtime.filtered_previews(c,self.tid,self.user,role in ('gm','owner'),data)
      prep=realtime.preload_for(c,self.tid,self.user,role in ('gm','owner'))
     if packets:emit('token-preview',packets)
     if prep:emit('preload',prep)
     pv=version
    if current!=previous:emit('change',current);previous=current
    if now-ping_at>=15:
     if pong_at<ping_at and now-pong_at>35:protocol.send_close(1001,'Conexão inativa');flush();break
     protocol.send_ping(b'atlas');flush();ping_at=now
    if not select.select([conn],[],[],.02)[0]:continue
    chunk=conn.recv(16384)
    if not chunk:break
    protocol.receive_data(chunk);flush()
    for event in protocol.events_received():
     if not isinstance(event,Frame):continue
     if event.opcode==OP_PONG:pong_at=time.monotonic();continue
     if event.opcode==OP_BINARY:protocol.send_close(1003,'Use JSON');flush();return
     if event.opcode not in (OP_TEXT,OP_CONT):continue
     fragment.extend(event.data)
     if len(fragment)>65536:protocol.send_close(1009,'Mensagem grande demais');flush();return
     if not event.fin:continue
     raw=bytes(fragment);fragment.clear()
     while rates and rates[0]<now-1:rates.popleft()
     if len(rates)>=80:protocol.send_close(1008,'Muitas mensagens');flush();return
     rates.append(now)
     ident=None
     try:
      message=strict_json(raw);ident=message.get('id');path=message.get('path');body=message.get('data')
      if not isinstance(ident,str) or not 1<=len(ident)<=80:raise ValueError('Identificador inválido.')
      if ident in results:
       emit('result',results[ident]);continue
      if path not in COMMANDS or not isinstance(body,dict) or body.get('table_id')!=self.tid:raise ValueError('Comando ou mesa inválidos.')
      # Reuse the exact HTTP authorization and transaction rules for every command.
      old_path,old_method=handler.path,handler.command
      try:
       handler.path='/api/'+path;handler.command='POST'
       with closing(db()) as c,c:
        if path!='token-preview':c.execute('BEGIN IMMEDIATE')
        result,_=handler.route(c,body)
       result=handler.after_write(body,result)
      finally:handler.path,handler.command=old_path,old_method
      reply={'id':ident,'ok':True,'result':result}
     except Exception as error:
      reply={'id':ident,'ok':False,'error':getattr(error,'message','Comando inválido ou indisponível.'),'status':getattr(error,'status',400)}
     if isinstance(ident,str) and 1<=len(ident)<=80:
      results[ident]=reply
      if len(results)>128:results.popitem(last=False)
     emit('result',reply)
  except (OSError,EOFError):pass
  finally:
   handler.close_connection=True
