import json,tempfile,threading,unittest,urllib.request,urllib.error
from io import BytesIO
from pathlib import Path
from PIL import Image
from test_server import a,Client
from assets import put
import fog

class Fog(unittest.TestCase):
 def setUp(self):
  with a.ATTEMPTS_LOCK:a.ATTEMPTS.clear()
  self.temp=tempfile.TemporaryDirectory();a.DATA=Path(self.temp.name);a.init()
  self.server=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=self.server.serve_forever,daemon=True).start()
  self.base='http://127.0.0.1:'+str(self.server.server_port);self.gm,self.player,self.other=[Client(self.base) for _ in range(3)]
  for client,name in [(self.gm,'FogGM'),(self.player,'FogPlayer'),(self.other,'FogOther')]:client.call('register',{'name':name,'password':'test-password-123'})
  self.tid=self.gm.call('tables',{'name':'Névoa'})[1]['id'];self.player.call('join',{'code':self.gm.call('invite',{'table_id':self.tid})[1]['code']});self.pid=self.player.call('me')[1]['id']
  im=Image.new('RGB',(256,256),(220,80,40));b=BytesIO();im.save(b,format='PNG');self.original=b.getvalue()
  with a.db() as c:
   self.aid=put(c,a.DATA,self.tid,'map.png',self.original);self.alias=put(c,a.DATA,self.tid,'copy.png',self.original)
   c.execute('UPDATE assets SET public=1 WHERE table_id=?',(self.tid,))
  self.args={'table_id':self.tid,'asset_id':self.aid};self.url='fog?table_id='+self.tid+'&asset_id='+self.aid
 def tearDown(self):
  self.server.shutdown();self.server.server_close();self.temp.cleanup()
  with a.ATTEMPTS_LOCK:a.ATTEMPTS.clear()
 def state(self):return self.gm.call(self.url)[1]
 def do(self,action,**kwargs):
  code,r=self.gm.call('fog',{**self.args,'revision':self.state()['revision'],'action':action,**kwargs});self.assertEqual(code,200,r);return r
 def image(self,client,aid=None):
  with client.http.open(self.base+'/api/asset?table_id='+self.tid+'&id='+(aid or self.aid)) as r:
   self.assertEqual(r.headers['Cache-Control'],'no-store');return r.read()
 def test_protected_pixels_alias_permissions_and_rehide(self):
  self.assertEqual(self.image(self.player),self.original)
  self.do('enable');pixels=Image.open(BytesIO(self.image(self.player)));self.assertEqual(set(pixels.get_flattened_data()),{(8,12,18)})
  self.assertEqual(self.image(self.gm),self.original)
  self.assertEqual(self.image(self.player,self.alias),self.image(self.player))
  self.assertEqual(self.player.call('fog',{**self.args,'revision':1,'action':'disable'})[0],403)
  self.assertEqual(self.other.call(self.url)[0],403)
  self.assertNotIn('undo',self.player.call(self.url)[1])
  self.do('reveal',rect=[0,0,.5,.5]);pixels=Image.open(BytesIO(self.image(self.player)))
  self.assertEqual(pixels.getpixel((100,100)),(220,80,40));self.assertEqual(pixels.getpixel((128,100)),(8,12,18));self.assertEqual(pixels.getpixel((100,128)),(8,12,18))
  self.do('hide',rect=[0,0,.5,.5]);self.assertEqual(set(Image.open(BytesIO(self.image(self.player))).get_flattened_data()),{(8,12,18)})
 def test_history_conflicts_validation_and_persistence(self):
  self.do('enable');s=self.do('reveal',rect=[0,0,.2,.2]);self.do('undo');self.assertEqual(self.state()['cells'],fog.COVERED)
  a.init();self.do('redo');self.assertEqual(self.state()['cells'],s['cells'])
  self.assertEqual(self.gm.call('fog',{**self.args,'revision':0,'action':'reveal-all'})[0],409)
  for rect in [[0,0,2,1],[0,0,0,1],[float('nan'),0,1,1],[True,0,1,1]]:
   self.assertEqual(self.gm.call('fog',{**self.args,'revision':self.state()['revision'],'action':'reveal','rect':rect})[0],400)
  self.do('undo');self.do('reveal',rect=[.8,.8,1,1]);self.assertFalse(self.state()['redo'])
 def test_tokens_terrain_initiative_and_movement_filtered(self):
  url='combat?table_id='+self.tid+'&asset_id='+self.aid;s=self.gm.call(url)[1]['state'];s['enabled']=True
  token={'id':'hero','name':'SecretName','q':0,'r':0,'owner':self.pid,'color':'#123456','budget':10,'spent':0,'hidden':False,'effects':[]}
  s['tokens']=[token];s['entries']=[{'id':'e','name':'SecretName','value':10,'token':'hero','hidden':False,'effects':[]}];s['active']='e';s['terrain']={'0,0':2,'2,0':2}
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200)
  self.do('enable');player=self.player.call(url)[1];self.assertEqual(player['state']['tokens'],[]);self.assertEqual(player['state']['entries'],[]);self.assertEqual(player['state']['terrain'],{});self.assertIsNone(player['state']['active']);self.assertNotIn('SecretName',json.dumps(player))
  self.do('reveal',rect=[.48,.48,.58,.54]);player=self.player.call(url)[1];self.assertEqual(len(player['state']['tokens']),1)
  self.assertEqual(self.player.call('combat-move',{**self.args,'revision':1,'token_id':'hero','path':[[1,0]]})[0],200)
  self.assertEqual(self.player.call('combat-move',{**self.args,'revision':2,'token_id':'hero','path':[[2,0]]})[0],403)
  self.assertEqual(self.gm.call(url)[1]['state']['tokens'][0]['spent'],1.5)
 def test_share_with_fog_is_atomic_and_invalid_image_fails_closed(self):
  self.assertEqual(self.gm.call('scene',{**self.args,'fog':True})[0],200);self.assertTrue(self.state()['enabled'])
  self.assertEqual(set(Image.open(BytesIO(self.image(self.player))).get_flattened_data()),{(8,12,18)})
  with a.db() as c:bad=put(c,a.DATA,self.tid,'bad.png',b'not an image')
  self.assertEqual(self.gm.call('scene',{'table_id':self.tid,'asset_id':bad,'fog':True})[0],400)
  self.assertEqual(self.gm.call('scene?table_id='+self.tid)[1]['asset_id'],self.aid)
  with a.db() as c:self.assertFalse(c.execute('SELECT public FROM assets WHERE id=?',(bad,)).fetchone()[0])
 def test_navigation_filters_covered_links_and_new_destination_starts_covered(self):
  im=Image.new('RGB',(256,256),(30,90,200));b=BytesIO();im.save(b,format='PNG')
  with a.db() as c:
   dest=put(c,a.DATA,self.tid,'destination.png',b.getvalue())
   for mid,aid in [('origin',self.aid),('destination',dest)]:
    c.execute('INSERT INTO maps VALUES(?,?,?,?,1)',(self.tid,mid,mid,'{}'))
    c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(self.tid,mid,'manhã',aid))
  links=[{'id':'gate','label':'Porta secreta','targets':['destination'],'rect':[.1,.1,.1,.1]}]
  self.assertEqual(self.gm.call('navigation',{'table_id':self.tid,'map_id':'origin','links':links})[0],200)
  self.do('enable');url='navigation?table_id='+self.tid+'&map_id=origin';self.assertEqual(self.player.call(url)[1],[])
  self.do('reveal',rect=[0,0,.5,.5]);self.assertEqual(len(self.player.call(url)[1]),1)
  self.gm.call('scene',{**self.args,'map_id':'origin'})
  rev=self.gm.call('scene?table_id='+self.tid)[1]['revision']
  self.assertEqual(self.gm.call('scene-navigate',{'table_id':self.tid,'map_id':'destination','revision':rev})[0],200)
  self.assertEqual(set(Image.open(BytesIO(self.image(self.player,dest))).get_flattened_data()),{(8,12,18)})
 def test_raster_has_no_metadata_respects_transparency_and_orientation(self):
  rgba=Image.new('RGBA',(17,13),(200,100,50,0));p=a.DATA/'transparent.png';rgba.save(p)
  output=Image.open(BytesIO(fog.masked(str(p),fog.REVEALED)));self.assertEqual(set(output.get_flattened_data()),{(8,12,18)})
  im=Image.new('RGB',(30,20),(50,90,120));exif=Image.Exif();exif[274]=6;exif[270]='secret metadata';p=a.DATA/'oriented.jpg';im.save(p,exif=exif)
  self.assertEqual(fog.dimensions(str(p)),(20,30))
  output=Image.open(BytesIO(fog.masked(str(p),fog.REVEALED)));self.assertEqual(output.size,(20,30));self.assertFalse(output.getexif());self.assertFalse(output.info)
