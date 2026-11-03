import unittest,json
import test_fog
from test_server import a
class Dead(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def read(self,client=None):return (client or self.gm).call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]
 def write(self,s,client=None):return (client or self.gm).call('combat',{**self.args,'revision':self.read()['revision'],'state':s})
 def test_dead_undo_visibility_permissions_and_validation(self):
  s=self.read()['state'];s['enabled']=True;s['tokens']=[{'id':'hero','name':'Herói','q':0,'r':0,'owner':self.pid,'color':'#123456','budget':10,'spent':3,'hidden':False,'effects':[]}]
  self.assertEqual(self.write(s)[0],200);s=self.read()['state'];s['tokens'][0]['dead']=True
  self.assertEqual(self.write(s,self.player)[0],403);self.assertEqual(self.write(s)[0],200)
  self.assertTrue(self.read(self.player)['state']['tokens'][0]['dead'])
  self.gm.call('combat-undo',{**self.args,'revision':self.read()['revision']});self.assertFalse(self.read()['state']['tokens'][0].get('dead',False))
  self.gm.call('combat-redo',{**self.args,'revision':self.read()['revision']});self.assertTrue(self.read()['state']['tokens'][0]['dead']);self.assertEqual(self.read()['state']['tokens'][0]['spent'],3)
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'});self.assertEqual(self.read(self.player)['state']['tokens'],[])
  a.init();self.assertTrue(self.read()['state']['tokens'][0]['dead'])
  s=self.read()['state'];s['tokens'][0]['dead']='true';self.assertEqual(self.write(s)[0],400)
 def test_old_history_without_dead_remains_usable(self):
  s=self.read()['state'];s['tokens']=[{'id':'hero','name':'Herói','q':0,'r':0,'owner':None,'color':'#123456','budget':9,'spent':0,'hidden':False,'effects':[]}];self.write(s)
  with a.db() as c:
   row=c.execute('SELECT id,after_state FROM combat_history WHERE table_id=?',(self.tid,)).fetchone();old=json.loads(row['after_state']);old['tokens'][0].pop('dead',None);c.execute('UPDATE combat_history SET after_state=? WHERE id=?',(json.dumps(old),row['id']))
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':self.read()['revision']})[0],200)
