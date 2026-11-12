import json,time,urllib.request,urllib.error,unittest
import test_fog,test_token_vision,realtime
from test_server import a

class LiveRotation(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 setup_vision=test_token_vision.Vision.setup_vision
 def setup_scene(self):
  self.setup_vision()
  self.assertEqual(self.gm.call('scene',self.args)[0],200)
 def test_preview_does_not_save_and_filters_recipients(self):
  self.setup_scene()
  before=self.gm.call(self.url)[1]
  self.assertEqual(self.player.call('token-preview',{**self.args,'token_id':'hero','direction':72})[0],200)
  after=self.gm.call(self.url)[1]
  self.assertEqual(before['revision'],after['revision'])
  self.assertEqual(before['state'],after['state'])
  self.assertEqual(self.player.call('token-preview',{**self.args,'token_id':'behind','direction':72})[0],403)
  self.assertEqual(self.gm.call('token-preview',{**self.args,'token_id':'behind','direction':72})[0],200)
  with a.db() as c:
   p=realtime.filtered_previews(c,self.tid,self.pid,False,a.DATA)
  self.assertEqual([x['token_id'] for x in p],['hero'])
  for value in [-1,360,True,'42']:
   self.assertEqual(self.player.call('token-preview',{**self.args,'token_id':'hero','direction':value})[0],400)
 def test_live_stream_delivers_before_mouse_release(self):
  self.setup_scene()
  response=self.player.http.open(self.base+'/api/events?table_id='+self.tid,timeout=3)
  def event():
   name=None
   for _ in range(30):
    line=response.readline()
    if line.startswith(b'event: '):name=line[7:].strip().decode()
    if line.startswith(b'data: '):
     payload=json.loads(line[6:]);response.readline();return name,payload
   self.fail('No event received')
  try:
   self.assertEqual(event()[0],'change')
   begin=time.monotonic()
   self.assertEqual(self.gm.call('token-preview',{**self.args,'token_id':'front','direction':123})[0],200)
   name,packets=event();self.assertEqual(name,'token-preview')
   self.assertEqual(packets[0]['direction'],123)
   elapsed=time.monotonic()-begin
   print('CP11 preview delivery local: %.1f ms'%(elapsed*1000))
   self.assertLess(elapsed,1)
  finally:response.close()
 def test_cache_revalidates_visibility_and_access(self):
  url=self.base+'/api/asset?table_id='+self.tid+'&id='+self.aid
  with self.player.http.open(url) as r:etag=r.headers['ETag'];r.read()
  req=urllib.request.Request(url,headers={'If-None-Match':etag})
  with self.assertRaises(urllib.error.HTTPError) as caught:self.player.http.open(req)
  self.assertEqual(caught.exception.code,304)
  self.assertEqual(self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})[0],200)
  with self.player.http.open(req) as r:self.assertEqual(r.status,200);self.assertNotEqual(r.headers['ETag'],etag);r.read()
  self.gm.call('asset-grants',{'table_id':self.tid,'id':self.aid,'public':False,'users':[]})
  with self.assertRaises(urllib.error.HTTPError) as caught:self.player.http.open(req)
  self.assertEqual(caught.exception.code,404)
 def test_preload_does_not_grant_private_map(self):
  self.gm.call('asset-grants',{'table_id':self.tid,'id':self.aid,'public':False,'users':[]})
  code,result=self.gm.call('scene-preload',self.args);self.assertEqual(code,200)
  with a.db() as c:self.assertIsNone(realtime.preload_for(c,self.tid,self.pid,False))
  self.assertEqual(self.player.call('scene-preload-ready',{'table_id':self.tid,'ticket':result['id']})[0],409)
  self.assertEqual(self.player.call('scene-preload',self.args)[0],403)
 def test_display_version_respects_fog_and_original(self):
  from io import BytesIO
  from PIL import Image
  url=self.base+'/api/asset?table_id='+self.tid+'&id='+self.aid
  with self.player.http.open(url+'&display=1') as response:
   self.assertEqual(response.headers['Content-Type'],'image/webp')
   image=Image.open(BytesIO(response.read()));self.assertLessEqual(max(image.size),2048)
   self.assertEqual(image.convert('RGB').getpixel((20,20)),(220,80,40))
  self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})
  with self.player.http.open(url+'&display=1') as response:
   self.assertEqual(Image.open(BytesIO(response.read())).convert('RGB').getpixel((20,20)),(8,12,18))
  with self.gm.http.open(url) as response:self.assertEqual(response.read(),self.original)
