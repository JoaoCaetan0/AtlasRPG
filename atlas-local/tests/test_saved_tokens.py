import json,unittest
import test_fog
from test_server import a

class SavedTokens(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def prepare(self):
  with a.db() as c:
   c.execute('INSERT INTO characters(id,table_id,user_id,name) VALUES(?,?,?,?)',('hero',self.tid,self.pid,'Hero'))
  self.gm.call('scene',self.args)
 def test_character_portrait_and_deployment_permissions(self):
  self.prepare()
  from token_assets import TOKEN_IDS
  art=next(iter(TOKEN_IDS))
  body={'table_id':self.tid,'id':'hero','revision':0,'appearance':art}
  self.assertEqual(self.player.call('character-portrait',body)[0],200)
  self.assertEqual(self.player.call('character-portrait',body)[0],409)
  result=self.player.call('characters?table_id='+self.tid)[1];self.assertEqual(result[0]['appearance'],art)
  deploy={**self.args,'revision':0,'character_id':'hero','point':[0,0]}
  self.assertEqual(self.player.call('character-deploy',deploy)[0],200)
  self.assertEqual(self.player.call('character-deploy',{**deploy,'revision':1,'point':[1,0]})[0],409)
  state=self.gm.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]
  token=state['state']['tokens'][0];self.assertEqual(token['owner'],self.pid);self.assertEqual(token['appearance'],art)
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':1})[0],200)
  self.assertEqual(self.gm.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1]['state']['tokens'],[])
 def test_templates_private_idempotent_and_independent(self):
  self.prepare();self.player.call('character-deploy',{**self.args,'revision':0,'character_id':'hero','point':[0,0]})
  state=self.gm.call('combat?table_id='+self.tid+'&asset_id='+self.aid)[1];token=state['state']['tokens'][0]
  req={**self.args,'token_id':token['id']}
  self.assertEqual(self.player.call('saved-tokens',req)[0],403)
  code,result=self.gm.call('saved-tokens',req);self.assertEqual(code,200,result)
  self.assertEqual(self.gm.call('saved-tokens',req)[1],result)
  self.assertEqual(self.player.call('saved-tokens?table_id='+self.tid)[0],403)
  rows=self.gm.call('saved-tokens?table_id='+self.tid)[1];self.assertEqual(len(rows),1);self.assertNotIn('character_id',rows[0]);self.assertNotIn('owner',rows[0]);self.assertNotIn('spent',rows[0])
  self.gm.call('saved-tokens',{'table_id':self.tid,'id':result['id'],'delete':True})
  self.assertEqual(self.gm.call('saved-tokens?table_id='+self.tid)[1],[])
 def test_hidden_area_and_wrong_character_are_denied(self):
  self.prepare()
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})
  req={**self.args,'revision':0,'character_id':'hero','point':[0,0]}
  self.assertEqual(self.player.call('character-deploy',req)[0],403)
  self.assertEqual(self.player.call('character-deploy',{**req,'character_id':'missing'})[0],403)
  self.assertEqual(self.gm.call('character-deploy',{**req,'point':[500,500]})[0],400)

 def test_player_can_upload_own_portrait_without_general_upload_access(self):
  import base64
  from io import BytesIO
  from PIL import Image
  self.prepare();image=BytesIO();Image.new('RGBA',(512,512),(80,120,160,255)).save(image,format='PNG')
  req={'table_id':self.tid,'id':'hero','revision':0,'content':base64.b64encode(image.getvalue()).decode()}
  code,result=self.player.call('character-portrait',req);self.assertEqual(code,200,result)
  self.assertTrue(result['id'].startswith('custom-'))
  with self.player.http.open(self.base+'/api/token-art?table_id='+self.tid+'&id='+result['id']) as response:self.assertEqual(response.status,200)
  self.assertEqual(self.player.call('character-portrait',{**req,'revision':1,'content':'not-png'})[0],400)
  self.assertEqual(self.player.call('character-portrait',{**req,'id':'missing'})[0],403)
