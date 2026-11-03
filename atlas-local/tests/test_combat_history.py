import copy,json,tempfile,threading,unittest
from pathlib import Path
from test_server import a,Client
from assets import put

class History(unittest.TestCase):
 def setUp(self):
  # Each test starts a distinct temporary server; isolate its in-memory limiter.
  with a.ATTEMPTS_LOCK:a.ATTEMPTS.clear()
  self.temp=tempfile.TemporaryDirectory();a.DATA=Path(self.temp.name);a.init()
  self.server=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler)
  threading.Thread(target=self.server.serve_forever,daemon=True).start()
  base='http://127.0.0.1:'+str(self.server.server_port)
  self.gm,self.player=Client(base),Client(base)
  for client,name in [(self.gm,'HistoryGM'),(self.player,'HistoryPlayer')]:
   client.call('register',{'name':name,'password':'test-password-123'})
  self.tid=self.gm.call('tables',{'name':'Histórico'})[1]['id']
  self.player.call('join',{'code':self.gm.call('invite',{'table_id':self.tid})[1]['code']})
  self.pid=self.player.call('me')[1]['id']
  with a.db() as c:
   self.aid=put(c,a.DATA,self.tid,'map.png',b'map');c.execute('UPDATE assets SET public=1 WHERE id=?',(self.aid,))
  self.args={'table_id':self.tid,'asset_id':self.aid}
  self.url='combat?table_id='+self.tid+'&asset_id='+self.aid
 def tearDown(self):
  self.server.shutdown();self.server.server_close();self.temp.cleanup()
  with a.ATTEMPTS_LOCK:a.ATTEMPTS.clear()
 def get(self):return self.gm.call(self.url)[1]
 def save(self,state):
  code,result=self.gm.call('combat',{**self.args,'revision':self.get()['revision'],'state':state})
  self.assertEqual(code,200,result)
 def step(self,direction):
  result=self.gm.call('combat-'+direction,{**self.args,'revision':self.get()['revision']})
  self.assertEqual(result[0],200,result);return self.get()['state']
 def test_full_restore_redo_player_movement_and_private_metadata(self):
  states=[self.get()['state']];s=copy.deepcopy(states[-1]);s['enabled']=True
  s['tokens']=[{'id':'hero','name':'Herói','q':0,'r':0,'owner':self.pid,'color':'#123456','budget':10,'spent':0,'hidden':False,'effects':[]}]
  self.save(s);states.append(copy.deepcopy(s))
  s['entries']=[{'id':'turn','name':'Herói','value':12,'token':'hero','hidden':False,'effects':[]}];s['active']='turn';self.save(s);states.append(copy.deepcopy(s))
  s['tokens'][0]['effects']=[{'id':s['conditions'][0]['id'],'stage':1,'secret':True}];self.save(s);states.append(copy.deepcopy(s))
  result=self.player.call('combat-move',{**self.args,'revision':self.get()['revision'],'token_id':'hero','path':[[1,0]]})
  self.assertEqual(result[0],200);s=self.get()['state'];states.append(copy.deepcopy(s));self.assertEqual(s['tokens'][0]['spent'],1.5)
  self.assertEqual(self.get()['history']['undo']['actor'],self.pid)
  self.assertNotIn('history',self.player.call(self.url)[1])
  self.assertEqual(self.player.call('combat-undo',{**self.args,'revision':self.get()['revision']})[0],403)
  s['terrain']={'2,0':2};s['grid']['size']=40;self.save(s);states.append(copy.deepcopy(s))
  s['tokens']=[];s['entries']=[];s['active']=None;self.save(s);states.append(copy.deepcopy(s))
  stale=self.get()['revision'];self.assertEqual(self.step('undo'),states[-2])
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':stale})[0],409)
  for expected in reversed(states[:-2]):self.assertEqual(self.step('undo'),expected)
  self.assertIsNone(self.get()['history']['undo'])
  a.init() # New connections read the persisted cursor and snapshots.
  for expected in states[1:]:self.assertEqual(self.step('redo'),expected)
  self.assertIsNone(self.get()['history']['redo'])
 def test_new_branch_noop_and_bounded_history(self):
  for n in range(2,48):
   s=self.get()['state'];s['round']=n;self.save(s)
  with a.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM combat_history').fetchone()[0],40)
  self.step('undo');redo=self.get()['history']['redo'];self.save(self.get()['state'])
  self.assertEqual(self.get()['history']['redo'],redo) # no-op does not destroy redo
  self.step('redo');self.step('undo');s=self.get()['state'];s['round']=100;self.save(s)
  self.assertIsNone(self.get()['history']['redo'])
  for _ in range(40):self.step('undo')
  self.assertIsNone(self.get()['history']['undo'])
 def test_restore_validation_is_atomic_and_history_is_isolated(self):
  s=self.get()['state'];s['round']=2;self.save(s)
  with a.db() as c:
   other=put(c,a.DATA,self.tid,'other.png',b'other')
  self.assertIsNone(self.gm.call('combat?table_id='+self.tid+'&asset_id='+other)[1]['history']['undo'])
  with a.db() as c:
   changed=copy.deepcopy(s);changed['round']=9
   c.execute('UPDATE combats SET state=? WHERE table_id=? AND asset_id=?',(json.dumps(changed),self.tid,self.aid))
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':self.get()['revision']})[0],409)
  self.assertEqual(self.get()['state']['round'],9)
  self.assertIsNone(self.get()['history']['redo'])
 def test_invalid_restoration_rolls_back_cursor_and_scene(self):
  s=self.get()['state'];s['tokens']=[{'id':'owned','name':'Token','q':0,'r':0,'owner':self.pid,'color':'#123456','budget':10,'spent':0,'hidden':False,'effects':[]}]
  self.save(s);s['tokens']=[];self.save(s)
  self.assertEqual(self.gm.call('remove-member',{'table_id':self.tid,'user_id':self.pid,'block':True})[0],200)
  before=self.get()
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':before['revision']})[0],400)
  self.assertEqual(self.get(),before)
