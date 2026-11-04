import copy
import unittest
import test_fog
from system_profiles import preset,validate,calculate

class FormulaTests(unittest.TestCase):
 def profile(self):
  p=preset('custom');p['fields'] += [dict(id=k,label=k,group='Recursos',type='number',formula=f) for k,f in [('vigor',''),('vida','vigor * 2 + 10'),('limite','max(vida, 20)')]];return p
 def test_calculation_overrides_and_invalid_rules(self):
  p=self.profile();self.assertEqual(calculate(p,{'vigor':'3'},[])['vida'],'16')
  self.assertEqual(calculate(p,{'vigor':'3','vida':'35'},['vida'])['limite'],'35')
  for formula in ['__import__("os")','vigor.__class__','vigor ** 100','[vigor]','inexistente + 1','vida+1']:
   bad=copy.deepcopy(p);bad['fields'][-2]['formula']=formula
   with self.assertRaises(ValueError):validate(bad)
  with self.assertRaises(ValueError):calculate(p,{'vigor':'nan'},[])
  p['fields'][-2]['formula']='1 / vigor'
  with self.assertRaises(ValueError):calculate(p,{'vigor':'0'},[])

class ProfileAPI(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def test_profile_sheet_ownership_revision_and_snapshot(self):
  tid=self.gm.call('tables',{'name':'Outra','system_id':'custom'})[1]['id']
  self.player.call('join',{'code':self.gm.call('invite',{'table_id':tid})[1]['code']})
  profile=self.gm.call('system-profile?table_id='+tid)[1]
  p=profile['profile'];p['fields'] += [dict(id=k,label=k,group='Atributos',type='number',formula=f) for k,f in [('base',''),('vida','base*2')]]
  payload={'table_id':tid,'revision':0,'profile':p}
  self.assertEqual(self.player.call('system-profile',payload)[0],403)
  self.assertEqual(self.gm.call('system-profile',payload)[0],200)
  self.assertEqual(self.gm.call('system-profile',payload)[0],409)
  self.assertEqual(self.gm.call('admin-settings?table_id='+tid)[1]['config']['conditions'],[])
  self.assertTrue(self.gm.call('admin-settings?table_id='+self.tid)[1]['config']['conditions'])
  status,r=self.gm.call('characters',{'table_id':tid,'name':'Teste','user_id':self.pid,'template_id':''});self.assertEqual(status,200,r)
  cid=r['id'];args={'table_id':tid,'id':cid,'revision':0,'fields':{'base':'7'},'overrides':[]}
  status,r=self.player.call('character',args);self.assertEqual(status,200,r);self.assertEqual(r['fields']['vida'],'14')
  self.assertEqual(self.player.call('character',args)[0],409)
  self.assertEqual(self.other.call('character',{'table_id':tid,'id':cid})[0],403)
  p['fields'][-1]['formula']='base*3';self.gm.call('system-profile',{**payload,'revision':1})
  status,r=self.player.call('character',{**args,'revision':1,'fields':{'base':'8'}});self.assertEqual(status,200,r);self.assertEqual(r['fields']['vida'],'16')
  self.assertEqual(self.player.call('character-pdf?table_id='+tid+'&id='+cid)[0],400)
