import json,time,unittest
import test_fog,test_token_vision
from test_server import a
from websockets.sync.client import connect
from websockets.exceptions import InvalidStatus,ConnectionClosed

class WebSocketTransport(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 setup_vision=test_token_vision.Vision.setup_vision
 def socket(self,client,origin=None):
  jar=next(h.cookiejar for h in client.http.handlers if hasattr(h,'cookiejar'))
  cookie='; '.join(c.name+'='+c.value for c in jar)
  return connect(self.base.replace('http:','ws:')+'/api/socket?table_id='+self.tid,origin=origin or self.base,additional_headers={'Cookie':cookie},proxy=None,open_timeout=3,close_timeout=1)
 def receive(self,ws,kind):
  for _ in range(30):
   m=json.loads(ws.recv(timeout=3))
   if m['type']==kind:return m['data']
  self.fail('Missing '+kind)
 def command(self,ws,path,body,ident='1'):
  ws.send(json.dumps({'id':ident,'path':path,'data':body}));return self.receive(ws,'result')
 def test_duplex_preview_commit_and_filtered_broadcast(self):
  self.setup_vision();self.gm.call('scene',self.args)
  with self.socket(self.gm) as gm,self.socket(self.player) as player:
   self.receive(gm,'change');self.receive(player,'change');begin=time.monotonic()
   r=self.command(gm,'token-preview',{**self.args,'token_id':'front','direction':45});self.assertTrue(r['ok'],r)
   packets=self.receive(player,'token-preview');self.assertEqual(packets[0]['direction'],45)
   print('CP12 WebSocket local preview %.1f ms'%((time.monotonic()-begin)*1000))
   self.assertLess(time.monotonic()-begin,1)
   self.assertTrue(self.command(gm,'token-preview',{**self.args,'token_id':'behind','direction':80},'2')['ok'])
   packets=self.receive(player,'token-preview');self.assertNotIn('behind',[p['token_id'] for p in packets])
   bad=self.command(player,'token-facing',{**self.args,'token_id':'front','direction':70,'revision':1});self.assertFalse(bad['ok'])
   before=self.player.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]['revision']
   r=self.command(player,'token-facing',{**self.args,'token_id':'hero','direction':90,'revision':before},'2');self.assertTrue(r['ok'],r)
   self.assertEqual(self.gm.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]['revision'],before+1)
 def test_origin_membership_and_cross_table(self):
  for client,origin in [(self.other,None),(self.player,'https://attacker.invalid')]:
   with self.assertRaises(InvalidStatus):self.socket(client,origin)
  with self.socket(self.player) as ws:
   r=self.command(ws,'chat',{'table_id':'other-table','body':'no'});self.assertFalse(r['ok'])
   ws.send(json.dumps({'id':[],'path':'chat','data':{}}));self.assertFalse(self.receive(ws,'result')['ok'])
   r=self.command(ws,'chat',{'table_id':self.tid,'body':'still alive'},'valid');self.assertTrue(r['ok'],r)
 def test_duplicate_request_is_not_executed_twice(self):
  with self.socket(self.player) as ws:
   args={'table_id':self.tid,'body':'Only once'}
   first=self.command(ws,'chat',args,'same');second=self.command(ws,'chat',args,'same')
   self.assertTrue(first['ok'],first);self.assertEqual(first,second)
 def test_session_revocation_closes_stream(self):
  with self.socket(self.player) as ws:
   self.receive(ws,'change');self.player.call('logout',{})
   self.assertEqual(self.receive(ws,'revoked'),{})
 def test_binary_and_oversized_frames_are_closed(self):
  for body in [b'not json','x'*70000]:
   with self.socket(self.player) as ws:
    self.receive(ws,'change');ws.send(body)
    with self.assertRaises(ConnectionClosed):ws.recv(timeout=3)
