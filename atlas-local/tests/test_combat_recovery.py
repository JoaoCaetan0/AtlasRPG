"""Regression: older combat states keep pieces and gain missing defaults."""
import json,tempfile,threading,unittest
from pathlib import Path
from test_server import a,Client
from assets import put

class Recovery(unittest.TestCase):
 def test_legacy_grid_and_tokens_survive_then_can_move(self):
  with tempfile.TemporaryDirectory() as tmp:
   a.DATA=Path(tmp);a.init()
   s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler)
   threading.Thread(target=s.serve_forever,daemon=True).start()
   try:
    gm=Client('http://127.0.0.1:'+str(s.server_port))
    self.assertEqual(gm.call('register',{'name':'Recovery','password':'recovery-password'})[0],200)
    tid=gm.call('tables',{'name':'Recovery'})[1]['id']
    with a.db() as c:
     aid=put(c,a.DATA,tid,'old.png',b'fixture')
     old={'grid':{'size':40},'tokens':[{'id':'old','name':'Preservado','q':0,'r':0}]}
     c.execute('INSERT INTO combats VALUES(?,?,?,?)',(tid,aid,json.dumps(old),3))
    args={'table_id':tid,'asset_id':aid}
    url='combat?table_id='+tid+'&asset_id='+aid
    status,response=gm.call(url);self.assertEqual(status,200,response)
    state=response['state'];self.assertEqual(state['grid']['size'],40)
    self.assertTrue(state['grid']['enabled']);self.assertEqual(state['tokens'][0]['name'],'Preservado')
    state['enabled']=True
    self.assertEqual(gm.call('combat',{**args,'revision':3,'state':state})[0],200)
    self.assertEqual(gm.call('combat-move',{**args,'revision':4,'token_id':'old','path':[[1,0]]})[0],200)
    self.assertEqual(gm.call(url)[1]['state']['tokens'][0]['spent'],1.5)
    # Incompatible data is not silently discarded/reset.
    with a.db() as c:c.execute('UPDATE combats SET state=? WHERE table_id=?',(json.dumps({'grid':None,'tokens':old['tokens']}),tid))
    status,response=gm.call(url);self.assertEqual(status,400)
    self.assertIn('grade ilegível',response['error'])
    with a.db() as c:self.assertEqual(json.loads(c.execute('SELECT state FROM combats').fetchone()[0])['tokens'][0]['name'],'Preservado')
   finally:s.shutdown();s.server_close()
