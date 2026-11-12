import unittest,json
import test_fog
from test_server import a

class Resources(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def prepare(self,linked=False):
  self.url='combat?table_id='+self.tid+'&asset_id='+self.aid
  s=self.gm.call(self.url)[1]['state'];s['enabled']=True
  token={'id':'hero','name':'Hero','q':0,'r':0,'owner':self.pid,'hidden':False,'effects':[],'color':'#123456','budget':10,'spent':0}
  if linked:
   with a.db() as c:c.execute('INSERT INTO characters(id,table_id,user_id,name,fields,build) VALUES(?,?,?,?,?,?)',('sheet',self.tid,self.pid,'Hero',json.dumps({'nome':'Hero','pv_atual':'15','pv_maximo':'20','pd_atual':'4','pd_maximo':'8'}),'{}'))
   token['character_id']='sheet'
  s['tokens']=[token];self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200)
  self.resource_url='token-resources?table_id='+self.tid+'&asset_id='+self.aid+'&token_id=hero'
 def save(self,client,values,bars=None,info=None):
  info=info or client.call(self.resource_url)[1]
  payload={**self.args,'token_id':'hero','revision':info['revision'],'resource_revision':info['resource_revision'],'values':values}
  if bars is not None:payload['bars']=bars
  return client.call('token-resources',payload)
 def test_privacy_permissions_and_conflict(self):
  self.prepare()
  bars={'pv':{'enabled':True,'visibility':'all','numbers':False},'pd':{'enabled':True,'visibility':'gm','numbers':True}}
  self.assertEqual(self.save(self.gm,{'pv_atual':7,'pv_maximo':10,'pd_atual':2,'pd_maximo':5},bars)[0],200)
  view=self.player.call(self.url)[1]['resources']['hero'];self.assertEqual(len(view),1);self.assertEqual(view[0]['ratio'],.7);self.assertNotIn('current',view[0])
  info=self.player.call(self.resource_url)[1];self.assertEqual(info['values']['pd_atual'],2)
  self.assertEqual(self.save(self.player,{'pd_atual':3})[0],200)
  self.assertEqual(self.save(self.player,{'pv_maximo':100})[0],403)
  self.assertEqual(self.save(self.player,{'pv_atual':6})[0],200)
  self.assertEqual(self.save(self.player,{'pv_atual':5},info=info)[0],409)
  self.assertEqual(self.other.call(self.resource_url)[0],403)
 def test_sheet_source_and_independent_control(self):
  self.prepare(True)
  self.assertEqual(self.save(self.player,{'pv_atual':9})[0],200)
  with a.db() as c:
   ch=c.execute('SELECT fields,revision FROM characters WHERE id=?',('sheet',)).fetchone();self.assertEqual(json.loads(ch[0])['pv_atual'],'9');self.assertEqual(ch[1],1)
   self.assertEqual(c.execute('SELECT count(*) FROM token_resources').fetchone()[0],0)
  self.other.call('join',{'code':self.gm.call('invite',{'table_id':self.tid})[1]['code']})
  other_id=self.other.call('me')[1]['id'];current=self.gm.call(self.url)[1];t=current['state']['tokens'][0];t.update(owner=other_id,control_override=True)
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':current['revision'],'state':current['state']})[0],200)
  result=self.other.call(self.url)[1];self.assertEqual(result['state']['tokens'][0]['owner'],other_id);self.assertEqual(result['characters'],{})
  self.assertEqual(self.other.call('character?table_id='+self.tid+'&id=sheet')[0],404)
  self.assertEqual(self.save(self.other,{'pv_atual':8})[0],200)
  self.assertEqual(self.player.call(self.resource_url)[0],403)
 def test_validation_and_deleted_token(self):
  self.prepare();self.assertEqual(self.save(self.gm,{'pv_maximo':-1})[0],400)
  self.assertEqual(self.save(self.gm,{}, {'pv':{'enabled':True,'visibility':'bad','numbers':True}})[0],400)
  self.assertEqual(self.save(self.gm,{'pv_atual':3,'pv_maximo':5})[0],200)
  current=self.gm.call(self.url)[1];current['state']['tokens']=[]
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':current['revision'],'state':current['state']})[0],200)
  self.assertEqual(self.gm.call(self.resource_url)[0],403)
  current=self.gm.call(self.url)[1]
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':current['revision']})[0],200)
  self.assertEqual(self.gm.call(self.resource_url)[1]['values']['pv_atual'],3)

 def test_frontend_modules_are_served(self):
  import re
  paths=set(re.findall(r'\["([^"\n]+\.js)",', (a.ROOT/'web/index.html').read_text(encoding='utf-8')))
  paths.update(str(p.relative_to(a.ROOT/'web')) for p in (a.ROOT/'web/combat').glob('*.mjs'))
  for path in paths:
   with self.subTest(path=path),self.gm.http.open(self.base+'/'+path) as response:
    self.assertEqual(response.status,200)
    self.assertIn('javascript',response.headers['Content-Type'])

 def test_owner_controls_sharing_and_other_member_cannot_modify(self):
  self.prepare(True)
  self.other.call('join',{'code':self.gm.call('invite',{'table_id':self.tid})[1]['code']})
  bars={'pv':{'enabled':True,'visibility':'all','numbers':True},'pd':{'enabled':True,'visibility':'owner','numbers':True}}
  self.assertEqual(self.save(self.player,{'pv_atual':11,'pd_atual':3},bars)[0],200)
  seen=self.other.call(self.url)[1]['resources']['hero'];self.assertEqual([x['kind'] for x in seen],['pv']);self.assertEqual(seen[0]['current'],11)
  self.assertEqual(self.save(self.other,{'pv_atual':1},info=self.player.call(self.resource_url)[1])[0],403)
  self.assertEqual(self.save(self.player,{}, {'pv':{'enabled':True,'visibility':'owner','numbers':True}})[0],200)
  a.init();self.assertNotIn('hero',self.other.call(self.url)[1]['resources'])
  self.assertEqual(self.player.call(self.resource_url)[1]['values']['pv_atual'],11)
  self.assertEqual(self.save(self.player,{'pv_maximo':200})[0],403)
  self.assertEqual(self.save(self.player,{}, {'pd':{'visibility':'bad'}})[0],400)
