import unittest
import test_fog
from test_server import a

class Favorites(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def save(self,name='Ataque',**extra):
  return self.player.call('dice-favorites',{'table_id':self.tid,'name':name,'expression':'2d20kh1+3','label':'Arco','scope':'self',**extra})
 def test_save_update_delete_isolated_without_roll(self):
  self.assertEqual(self.save()[0],200)
  endpoint='dice-favorites?table_id='+self.tid
  rows=self.player.call(endpoint)[1];self.assertEqual(rows[0]['scope'],'self')
  self.assertEqual(self.gm.call(endpoint)[1],[])
  self.assertEqual(self.other.call(endpoint)[0],403)
  self.assertEqual(self.save(expression='d6')[0],200)
  self.assertEqual(len(self.player.call(endpoint)[1]),1)
  with a.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM dice_rolls').fetchone()[0],0)
  self.gm.call('dice-favorites',{'table_id':self.tid,'name':'Ataque','action':'delete'})
  self.assertEqual(len(self.player.call(endpoint)[1]),1)
  self.player.call('dice-favorites',{'table_id':self.tid,'name':'Ataque','action':'delete'})
  self.assertEqual(self.player.call(endpoint)[1],[])
 def test_limits_validation_and_persistence(self):
  for i in range(30):self.assertEqual(self.save(str(i))[0],200)
  self.assertEqual(self.save('overflow')[0],400)
  self.assertEqual(self.save('0',expression='d8')[0],200)
  for values in [{'expression':'__import__'},{'scope':'secret'},{'name':''}]:self.assertEqual(self.save(**values)[0],400)
  a.init();self.assertEqual(len(self.player.call('dice-favorites?table_id='+self.tid)[1]),30)
