import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from rules import calculate
class Rules(unittest.TestCase):
 def fields(self,**kw):return {'raca':'Humano','classe':'Bárbaro','atributo_CON':'2','atributo_FOR':'3','atributo_DES':'-1','atributo_INT':'-1','atributo_CAR':'2',**kw}
 def test_formula_minimums_and_selected_power(self):
  r=calculate(self.fields(),{'auto':True,'powers':['musculatura']})
  self.assertEqual(r['fields'],{'pv_maximo':'22','pd_maximo':'15','def_natural':'8'})
  self.assertEqual(r['stats']['PP iniciais'],18)
  self.assertEqual(calculate(self.fields(classe='Bardo'),{'powers':['musculatura']})['fields']['pv_maximo'],'16')
 def test_racial_and_class_defense(self):
  r=calculate(self.fields(raca='Draconato',classe='Paladino',atributo_DES='2'),{'powers':['voto'],'extras':{'def':1}})
  self.assertEqual(r['fields']['def_natural'],'19')
  self.assertEqual(r['stats']['Slots de inventário'],12)
 def test_current_resources_never_written(self):
  r=calculate(self.fields(pv_atual='2',pp='12'),{})
  self.assertNotIn('pv_atual',r['fields']);self.assertNotIn('pp',r['fields'])
 def test_invalid_numeric_values(self):
  for value in ['NaN','Infinity','abc','10001']:
   with self.assertRaises(ValueError):calculate(self.fields(atributo_CON=value),{})
