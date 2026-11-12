import unittest,json
from io import BytesIO
from PIL import Image
import test_fog
from test_server import a

class Vision(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def setup_vision(self):
  self.url='combat?table_id='+self.tid+'&asset_id='+self.aid
  s=self.gm.call(self.url)[1]['state'];s['enabled']=True;s['vision']={'enabled':True,'range':5,'angle':160}
  base={'vision':{'range':None,'angle':None,'direction':0},'id':'hero','name':'Hero','q':0,'r':0,'owner':self.pid,'hidden':False,'effects':[],'color':'#123456','budget':100,'spent':0}
  s['tokens']=[base,{**base,'id':'behind','owner':None,'q':-2,'name':'Hidden'},{**base,'id':'front','owner':None,'q':2}]
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200)
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})
  self.gm.call('fog',{**self.args,'revision':1,'action':'reveal-all'})
 def image(self,client,aid=None):
  with client.http.open(self.base+'/api/asset?table_id='+self.tid+'&id='+(aid or self.aid)) as r:return Image.open(BytesIO(r.read())).convert('RGB')
 def test_pixels_tokens_alias_and_rotation(self):
  self.setup_vision();img=self.image(self.player)
  self.assertEqual(img.getpixel((150,128)),(220,80,40));self.assertEqual(img.getpixel((90,128)),(8,12,18))
  self.assertEqual(img.tobytes(),self.image(self.player,self.alias).tobytes())
  state=self.player.call(self.url)[1];self.assertEqual({t['id'] for t in state['state']['tokens']},{'hero','front'})
  self.assertEqual(self.player.call('token-facing',{**self.args,'revision':1,'token_id':'behind','direction':180})[0],403)
  self.assertEqual(self.player.call('token-facing',{**self.args,'revision':1,'token_id':'hero','direction':180})[0],200)
  after=self.player.call(self.url)[1];self.assertGreater(after['fog']['revision'],state['fog']['revision'])
  self.assertEqual(self.image(self.player).getpixel((90,128)),(220,80,40))
  self.assertEqual(self.image(self.gm).getpixel((10,10)),(220,80,40))
 def test_no_owner_manual_mask_disabled_and_move(self):
  self.setup_vision()
  self.other.call('join',{'code':self.gm.call('invite',{'table_id':self.tid})[1]['code']})
  self.assertEqual(set(self.image(self.other).get_flattened_data()),{(8,12,18)})
  first=self.player.call(self.url)[1]['fog']['revision']
  move=self.player.call('combat-move',{**self.args,'revision':1,'token_id':'hero','path':[[1,0]]});self.assertEqual(move[0],200,move)
  self.gm.call('fog',{**self.args,'revision':2,'action':'hide-all'})
  self.assertEqual(set(self.image(self.player).get_flattened_data()),{(8,12,18)})
  self.gm.call('fog',{**self.args,'revision':3,'action':'disable'})
  self.assertEqual(self.image(self.other).getpixel((0,0)),(220,80,40))
  self.assertGreater(self.player.call(self.url)[1]['fog']['revision'],first)
 def test_invalid_and_disabled_sight_revision(self):
  self.setup_vision();current=self.gm.call(self.url)[1];before=self.player.call(self.url)[1]['fog']['revision']
  current['state']['vision']['angle']=0
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':current['revision'],'state':current['state']})[0],400)
  current['state']['vision']={'enabled':False,'angle':360,'range':10}
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':current['revision'],'state':current['state']})[0],200)
  self.assertGreater(self.player.call(self.url)[1]['fog']['revision'],before)
  self.assertEqual(self.image(self.player).getpixel((0,0)),(220,80,40))

 def test_preview_authorization(self):
  self.setup_vision()
  endpoint='asset?table_id='+self.tid+'&id='+self.aid+'&view_as='+self.pid
  self.assertEqual(self.player.call(endpoint)[0],403)
  with self.gm.http.open(self.base+'/api/'+endpoint) as r:
   image=Image.open(BytesIO(r.read())).convert('RGB')
  self.assertEqual(image.tobytes(),self.image(self.player).tobytes())
 def test_override_union_and_undo(self):
  self.setup_vision();current=self.gm.call(self.url)[1]
  current['state']['tokens'][0]['vision']={'range':5,'angle':360,'direction':0}
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':1,'state':current['state']})[0],200)
  self.assertEqual(self.image(self.player).getpixel((90,128)),(220,80,40))
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':2})[0],200)
  remembered=self.image(self.player).getpixel((90,128))
  self.assertEqual(remembered[0],remembered[1]);self.assertEqual(remembered[1],remembered[2]);self.assertGreater(remembered[0],18) # Previously seen: gray memory, never live tokens
  current=self.gm.call(self.url)[1];current['state']['tokens'][1]['owner']=self.pid
  current['state']['tokens'][1]['vision']={'range':5,'angle':160,'direction':180}
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':3,'state':current['state']})[0],200)
  self.assertEqual(self.image(self.player).getpixel((70,128)),(220,80,40))

 def test_default_direction_is_north(self):
  self.setup_vision()
  state=self.gm.call(self.url)[1]
  for token in state['state']['tokens']:token.pop('vision',None)
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':state['revision'],'state':state['state']})[0],200)
  image=self.image(self.player)
  self.assertEqual(image.getpixel((128,100)),(220,80,40))
  self.assertNotEqual(image.getpixel((128,155)),(220,80,40))
