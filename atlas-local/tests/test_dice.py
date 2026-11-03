import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from dice import roll,DiceError
class Dice(unittest.TestCase):
 def seq(self,values):
  it=iter(values);return lambda n:next(it)
 def total(self,expression,values):return roll(expression,self.seq(values))['results'][0]['total']
 def test_keep_drop_and_breakdown(self):
  r=roll('4d6d1',self.seq([0,2,4,5]));self.assertEqual(r['results'][0]['total'],14)
  self.assertEqual(sum(not d['kept'] for d in r['results'][0]['groups'][0]['dice']),1)
  self.assertEqual(self.total('4d6kl2',[0,2,4,5]),4)
  self.assertEqual(self.total('4d6dh2',[0,2,4,5]),4)
  self.assertEqual(self.total('4d6k2',[0,2,4,5]),11)
 def test_explode_and_aro(self):
  self.assertEqual(self.total('d6!',[5,5,2]),15)
  self.assertEqual(self.total('d6!4',[3,1]),6)
  self.assertEqual(self.total('2d6daro',[2,2,0,1]),9)
  self.assertEqual(self.total('3d6taro',[1,1,1,0,1,2]),12)
 def test_fate_burningwheel_crit(self):
  self.assertEqual(self.total('3dF',[0,1,2]),0)
  self.assertEqual(self.total('B4',[2,3,4,0]),2)
  self.assertEqual(self.total('W2!',[5,0,1]),2)
  r=roll('d20c18',lambda n:17);self.assertTrue(r['results'][0]['groups'][0]['dice'][0]['critical'])
 def test_math_perdie_count_and_comparison(self):
  self.assertEqual(self.total('(4d6--2)*2+1',[0,2,4,5]),15)
  self.assertEqual(self.total('3d6++1>>4',[0,2,4]),2)
  self.assertTrue(self.total('2d6+2>=10',[3,3]))
  self.assertEqual(self.total('-2+3*4',[]),10)
  self.assertEqual(self.total('7/2',[]),3.5)
 def test_repeats_and_nosort(self):
  r=roll('2#2d6ns',self.seq([1,5,0,3]));self.assertEqual([x['total'] for x in r['results']],[8,5])
  self.assertEqual([d['value'] for d in r['results'][0]['groups'][0]['dice']],[2,6])
 def test_invalid_and_budget(self):
  for expr in ['1d1','101d6','d6!1','1/0','(1<2)*3','__import__(x)','d20kh','d20c18k1','0#d6','21#d6','1d6aro','2d6!aro','('*30+'1'+')'*30]:
   with self.subTest(expr=expr),self.assertRaises(DiceError):roll(expr,lambda n:0)
  with self.assertRaises(DiceError):roll('d6!',lambda n:5)
