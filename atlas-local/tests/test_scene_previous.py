import unittest
import test_fog
from test_server import a

class PreviousScene(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def scene(self):return self.gm.call('scene?table_id='+self.tid)[1]
 def test_return_clear_permissions_and_conflict(self):
  self.gm.call('scene',{'table_id':self.tid,'asset_id':self.aid})
  self.gm.call('scene',{'table_id':self.tid,'asset_id':self.alias})
  s=self.scene();self.assertEqual(s['previous']['asset_id'],self.aid)
  args={'table_id':self.tid,'revision':s['revision']}
  self.assertEqual(self.player.call('scene-previous',args)[0],403)
  self.assertIsNone(self.player.call('scene?table_id='+self.tid)[1]['previous'])
  self.assertEqual(self.gm.call('scene-previous',args)[0],200)
  self.assertEqual(self.scene()['asset_id'],self.aid)
  self.assertEqual(self.gm.call('scene-previous',args)[0],409)
  self.gm.call('scene',{'table_id':self.tid,'asset_id':None})
  s=self.scene();self.assertEqual(s['previous']['asset_id'],self.aid)
  self.assertEqual(self.gm.call('scene-previous',{'table_id':self.tid,'revision':s['revision']})[0],200)
  self.assertEqual(self.scene()['asset_id'],self.aid)
  self.assertIsNone(self.scene()['previous'])
