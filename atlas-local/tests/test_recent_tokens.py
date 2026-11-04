import unittest
import test_fog
from recent_tokens import remember,handle
from test_server import a

class RecentTokens(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def test_atomic_creation_permissions_and_reset_template(self):
  state=self.gm.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]['state']
  state['tokens']=[dict(id='custom',name='Sentinela',q=0,r=0,appearance='aliado',owner=self.pid,color='#123456',budget=12,spent=4,hidden=True,effects=[])]
  payload={**self.args,'revision':0,'state':state,'remember_token':'custom'}
  self.assertEqual(self.gm.call('combat',payload)[0],200)
  rows=self.gm.call('recent-tokens?table_id='+self.tid)[1];self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['name'],'Sentinela');self.assertNotIn('owner',rows[0]);self.assertNotIn('spent',rows[0]);self.assertNotIn('effects',rows[0])
  self.assertEqual(self.player.call('recent-tokens?table_id='+self.tid)[0],403)
  self.assertEqual(self.gm.call('combat',payload)[0],409)
  self.assertEqual(len(self.gm.call('recent-tokens?table_id='+self.tid)[1]),1)
  self.assertEqual(self.gm.call('combat',{**payload,'revision':1})[0],400)
 def test_limit_order_and_owner_isolation(self):
  with a.db() as c:
   for i in range(35):remember(c,self.tid,self.pid,dict(name=str(i),color='#123456',budget=10,hidden=False))
   rows=handle(c,'/api/recent-tokens',{},self.pid,self.tid,True,a.require)
   self.assertEqual(len(rows),30);self.assertEqual(rows[0]['name'],'34');self.assertEqual(rows[-1]['name'],'5')
   self.assertEqual(handle(c,'/api/recent-tokens',{},'other',self.tid,True,a.require),[])
