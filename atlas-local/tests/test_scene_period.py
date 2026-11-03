import unittest,json
from io import BytesIO
from PIL import Image
import test_fog
from test_server import a
from assets import put
import fog

class Periods(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 image=test_fog.Fog.image
 def prepare(self,size=(256,256)):
  b=BytesIO();Image.new('RGB',size,(20,30,90)).save(b,format='PNG')
  with a.db() as c:
   self.night=put(c,a.DATA,self.tid,'night.png',b.getvalue())
   c.execute('INSERT INTO maps VALUES(?,?,?,?,0)',(self.tid,'wood','Bosque','{}'))
   for period,aid in [('manhã',self.aid),('noite',self.night)]:c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(self.tid,'wood',period,aid))
  self.gm.call('scene',{**self.args,'map_id':'wood'})
 def scene(self):return self.gm.call('scene?table_id='+self.tid)[1]
 def switch(self,period,**extra):
  return self.gm.call('scene-period',{'table_id':self.tid,'map_id':'wood','revision':self.scene()['revision'],'period':period,**extra})
 def combat(self,aid):return self.gm.call('combat?table_id='+self.tid+'&asset_id='+aid)[1]
 def test_roundtrip_history_fog_masking_and_restart(self):
  self.prepare();s=self.combat(self.aid)['state'];s['enabled']=True;s['round']=4
  s['tokens']=[{'id':'hero','name':'Herói','q':0,'r':0,'owner':self.pid,'color':'#123456','budget':10,'spent':3,'hidden':False,'effects':[]}]
  s['entries']=[{'id':'e','name':'Herói','value':17,'token':'hero','hidden':False,'effects':[]}];s['active']='e'
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200)
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})
  self.gm.call('fog',{**self.args,'revision':1,'action':'reveal','rect':[0,0,.25,.25]})
  before=self.combat(self.aid);self.assertEqual(self.switch('noite',aligned=True)[0],200)
  after=self.combat(self.night)
  self.assertEqual(before['state'],after['state']);self.assertEqual(before['history'],after['history'])
  self.assertEqual(before['fog']['cells'],after['fog']['cells'])
  with Image.open(BytesIO(self.image(self.player,self.night))) as im:
   self.assertEqual(im.getpixel((200,200)),(8,12,18));self.assertEqual(im.getpixel((10,10)),(20,30,90))
  public=self.player.call('scene?table_id='+self.tid)[1];self.assertEqual(public['asset_id'],self.night);self.assertEqual(public['periods'],[])
  self.assertEqual(self.player.call('combat?table_id='+self.tid+'&asset_id='+self.night)[1]['state']['tokens'],[])
  self.assertEqual(self.gm.call('combat-undo',{'table_id':self.tid,'asset_id':self.night,'revision':after['revision']})[0],200)
  self.assertEqual(self.combat(self.aid)['state']['tokens'],[])
  self.assertEqual(self.switch('manhã')[0],200)
  a.init()
  self.assertEqual(self.switch('noite')[0],200)
  undo=self.combat(self.night)
  self.assertEqual(self.gm.call('combat-redo',{'table_id':self.tid,'asset_id':self.night,'revision':undo['revision']})[0],200)
  self.assertEqual(self.combat(self.aid)['state']['tokens'][0]['spent'],3)
  mask=self.combat(self.night)['fog']
  self.assertEqual(self.gm.call('fog',{'table_id':self.tid,'asset_id':self.night,'revision':mask['revision'],'action':'hide-all'})[0],200)
  self.assertEqual(self.combat(self.aid)['fog']['cells'],fog.COVERED)
 def test_permissions_stale_requests_confirmation_and_alignment(self):
  self.prepare()
  request={'table_id':self.tid,'map_id':'wood','revision':self.scene()['revision'],'period':'noite','aligned':True}
  self.assertEqual(self.player.call('scene-period',request)[0],403)
  self.assertEqual(self.switch('noite')[0],400)
  self.assertEqual(self.switch('invalid',aligned=True)[0],400)
  self.assertEqual(self.gm.call('scene-period',{**request,'revision':0})[0],409)
  self.assertEqual(self.switch('noite',aligned=True)[0],200)
  self.assertEqual(self.gm.call('scene-period',request)[0],409)
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':self.combat(self.aid)['state']})[0],409)
  self.assertEqual(self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})[0],409)
 def test_proportion_mismatch_is_atomic(self):
  self.prepare((256,128));self.assertEqual(self.switch('noite',aligned=True)[0],400)
  self.assertEqual(self.scene()['asset_id'],self.aid)
  with a.db() as c:
   self.assertEqual(c.execute('SELECT count(*) FROM scene_layers').fetchone()[0],0)
   self.assertFalse(c.execute('SELECT public FROM assets WHERE id=?',(self.night,)).fetchone()[0])
 def test_independent_legacy_state_preserved(self):
  self.prepare();s=self.combat(self.night)
  self.gm.call('combat',{'table_id':self.tid,'asset_id':self.night,'revision':0,'state':s['state']})
  self.assertEqual(self.switch('noite',aligned=True)[0],409)
  self.assertEqual(self.combat(self.night)['state'],s['state'])
  self.assertEqual(self.scene()['asset_id'],self.aid)
