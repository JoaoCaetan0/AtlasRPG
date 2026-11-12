import json,unittest
import test_token_vision,test_fog
from test_server import a
import fog

class TokenMemory(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 setup_vision=test_token_vision.Vision.setup_vision
 def setup_pair(self):
  self.setup_vision();r=self.gm.call(self.url)[1]
  r['state']['vision'].update(gradient=0)
  t=r['state']['tokens'][0];other={**t,'id':'second','vision':{**t['vision'],'direction':180}}
  r['state']['tokens']=[t,other]
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':r['revision'],'state':r['state']})[0],200)
 def clear(self,token='hero',client=None,revision=None):
  rev=self.gm.call(self.url)[1]['revision'] if revision is None else revision
  return (client or self.gm).call('token-memory-clear',{**self.args,'token_id':token,'revision':rev})
 def memories(self):
  with a.db() as c:return {(r['combat_id'],r['token_id'],r['user_id']):r['cells'] for r in c.execute('SELECT * FROM token_exploration WHERE table_id=?',(self.tid,))}
 def test_individual_exploration_reset_and_persistence(self):
  self.setup_pair();self.player.call(self.url)
  before=self.memories();hero=before[(self.aid,'hero',self.pid)];second=before[(self.aid,'second',self.pid)]
  self.assertNotEqual(hero,second)
  for ident in ['hero','second']:
   self.assertEqual(self.player.call('token-facing',{**self.args,'revision':0,'token_id':ident,'direction':270})[0],200)
  old=self.player.call(self.url)[1];right=next(i for i,(h,s,v) in enumerate(zip(hero,second,old['fog']['cells'])) if h=='1' and s==v=='0')
  left=next(i for i,(h,s,v) in enumerate(zip(hero,second,old['fog']['cells'])) if s=='1' and h==v=='0')
  self.assertEqual(old['fog']['dim_cells'][right],'1')
  retained=self.memories()[(self.aid,'second',self.pid)]
  self.assertEqual(self.clear()[0],200)
  self.assertEqual(self.memories()[(self.aid,'second',self.pid)],retained)
  a.init();after=self.player.call(self.url)[1]
  self.assertEqual(after['fog']['dim_cells'][right],'0');self.assertEqual(after['fog']['dim_cells'][left],'1')
  self.assertEqual(after['fog']['cells'],old['fog']['cells']);self.assertGreater(after['fog']['revision'],old['fog']['revision'])
 def test_legacy_migrates_once_and_clear_before_first_view(self):
  self.setup_pair()
  with a.db() as c:
   digest=c.execute('SELECT digest FROM assets WHERE id=?',(self.aid,)).fetchone()[0]
   c.execute('INSERT INTO vision_memory VALUES(?,?,?,?)',(self.tid,digest,self.pid,fog.REVEALED))
  self.assertEqual(self.clear()[0],200)
  m=self.memories();self.assertEqual(m[(self.aid,'hero',self.pid)],fog.COVERED);self.assertEqual(m[(self.aid,'second',self.pid)],fog.REVEALED)
  self.player.call(self.url);self.assertNotEqual(self.memories()[(self.aid,'hero',self.pid)],fog.REVEALED)
  r=self.gm.call(self.url)[1];r['state']['tokens'].append({**r['state']['tokens'][0],'id':'new'})
  self.gm.call('combat',{**self.args,'revision':r['revision'],'state':r['state']});self.player.call(self.url)
  self.assertNotEqual(self.memories()[(self.aid,'new',self.pid)],fog.REVEALED)
 def test_permissions_conflict_and_no_unrelated_changes(self):
  self.setup_pair();self.player.call(self.url);before=self.memories();state=self.gm.call(self.url)[1]
  self.assertEqual(self.clear(client=self.player)[0],403)
  self.assertEqual(self.clear(client=self.other)[0],403)
  self.assertEqual(self.clear(revision=-1)[0],409)
  self.assertEqual(self.clear(token='missing')[0],404);self.assertEqual(before,self.memories())
  with a.db() as c:
   c.execute('INSERT INTO token_exploration VALUES(?,?,?,?,?,?)',(self.tid,'another-map','another-map','hero',self.pid,fog.REVEALED))
  self.assertEqual(self.clear()[0],200)
  self.assertEqual(self.memories()[('another-map','hero',self.pid)],fog.REVEALED)
  self.assertEqual(self.gm.call(self.url)[1]['state'],state['state'])
 def test_reset_publishes_committed_event(self):
  self.setup_pair()
  stream=self.player.http.open(self.base+'/api/events?table_id='+self.tid,timeout=3)
  try:
   stream.readline();initial=json.loads(stream.readline()[6:]);stream.readline()
   self.assertEqual(self.clear()[0],200)
   stream.readline();event=json.loads(stream.readline()[6:]);self.assertGreater(event['combat'],initial['combat'])
  finally:stream.close()
