import unittest
import test_fog
class Drawings(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def read(self,client=None):return (client or self.gm).call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]
 def test_visibility_history_and_validation(self):
  s=self.read()['state'];s['drawings']=[{'id':'a','tool':'rect','points':[[.2,.2],[.4,.4]],'private':True,'color':'#123456','width':3}]
  self.assertEqual(self.player.call('combat',{**self.args,'revision':0,'state':s})[0],403)
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200);self.assertEqual(self.read(self.player)['state']['drawings'],[])
  s['drawings'][0]['private']=False;self.gm.call('combat',{**self.args,'revision':1,'state':s});self.assertEqual(len(self.read(self.player)['state']['drawings']),1)
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'});self.assertEqual(self.read(self.player)['state']['drawings'],[])
  self.gm.call('combat-undo',{**self.args,'revision':2});self.assertTrue(self.read()['state']['drawings'][0]['private'])
  s['drawings'][0]['points']=[[2,0],[0,0]];self.assertEqual(self.gm.call('combat',{**self.args,'revision':3,'state':s})[0],400)

 def test_style_and_polygon_validation(self):
  from drawings import validate
  def require(ok,*args):
   if not ok:raise ValueError(args)
  d={'id':'shape','tool':'polygon','points':[[.1,.1],[.5,.1],[.3,.5]],'private':False,'color':'#123456','width':3,'opacity':.5,'fill':True}
  validate([d],require)
  for patch in [{'opacity':float('nan')},{'opacity':2},{'fill':'yes'},{'points':[[0,0],[1,1]]}]:
   with self.assertRaises(ValueError):validate([{**d,**patch}],require)
