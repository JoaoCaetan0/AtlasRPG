import tempfile,threading,unittest,json
from pathlib import Path
from test_server import a,Client
from assets import put
class V06(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();a.DATA=Path(self.tmp.name);a.init();self.s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=self.s.serve_forever,daemon=True).start()
  self.gm,self.player,self.other=[Client('http://127.0.0.1:'+str(self.s.server_port)) for _ in range(3)]
  for c,n in [(self.gm,'Master06'),(self.player,'Player06'),(self.other,'Other06')]:self.assertEqual(c.call('register',{'name':n,'password':'test-password-123'})[0],200)
  self.tid=self.gm.call('tables',{'name':'Mesa06'})[1]['id'];code=self.gm.call('invite',{'table_id':self.tid})[1]['code'];self.player.call('join',{'code':code});self.other.call('join',{'code':code})
 def tearDown(self):self.s.shutdown();self.s.server_close();self.tmp.cleanup()
 def test_roll_permissions_idempotence_and_history(self):
  for scope in ['public','gm','self']:
   d={'table_id':self.tid,'expression':'2d20kh1','scope':scope,'label':'Teste','request_id':'test-'+scope+'-12345'}
   first=self.player.call('roll',d);again=self.player.call('roll',d);self.assertEqual(first[0],200);self.assertEqual(first[1]['id'],again[1]['id']);self.assertTrue(again[1]['reused'])
  url='rolls?table_id='+self.tid
  self.assertEqual(len(self.player.call(url)[1]),3);self.assertEqual(len(self.gm.call(url)[1]),2);self.assertEqual(len(self.other.call(url)[1]),1)
  self.assertEqual(self.player.call('clear-rolls',{'table_id':self.tid})[0],403)
  self.gm.call('clear-rolls',{'table_id':self.tid});self.assertEqual(len(self.player.call(url)[1]),1);self.assertEqual(len(self.gm.call(url)[1]),0)
  bad=self.player.call('roll',{'table_id':self.tid,'expression':'d6!1','request_id':'invalid-12345'});self.assertEqual(bad[0],400);self.assertIn('Explosão',bad[1]['error'])
 def test_admin_maps_settings_and_revision(self):
  tid=self.tid;self.assertEqual(self.player.call('admin-settings?table_id='+tid)[0],403)
  conf=self.gm.call('admin-settings?table_id='+tid)[1];conf.update(table_id=tid,name='Revisada',system='Outro RPG',synopsis='Sinopse')
  conf['config']['grid']['scale']=2;conf['config']['conditions'].append({'id':'custom_test','name':'Teste','icon':'★','color':'#123456','description':'Regra'})
  self.assertEqual(self.gm.call('admin-settings',conf)[0],200);self.assertEqual(self.gm.call('admin-settings',conf)[0],409)
  with a.db() as c:
   im=put(c,a.DATA,tid,'mapa.png',b'img');im2=put(c,a.DATA,tid,'segredo.png',b'img2')
  m={'table_id':tid,'revision':0,'title':'Novo','kind':'encounter','tags':['Árvores','Ruínas'],'region':'Stalla','notes':'Segredo','visible':False,'images':[{'period':'noite','asset_id':im}]}
  self.assertEqual(self.player.call('admin-maps',m)[0],403);r=self.gm.call('admin-maps',m);self.assertEqual(r[0],200);mid=r[1]['id']
  self.assertEqual(self.player.call('maps?table_id='+tid)[1],[])
  catalog=self.gm.call('admin-maps?table_id='+tid)[1]
  self.assertEqual(catalog[0]['metadata']['kind'],'encounter');self.assertEqual(catalog[0]['metadata']['tags'],['Árvores','Ruínas'])
  self.assertEqual(self.gm.call('admin-maps',{**m,'id':mid,'revision':1,'kind':'invalid'})[0],400)
  self.assertEqual(self.gm.call('admin-maps',{**m,'id':mid,'revision':1,'tags':['x'*41]})[0],400)
  m.update(id=mid,revision=1,visible=True);self.assertEqual(self.gm.call('admin-maps',m)[0],200);self.assertEqual(self.gm.call('admin-maps',m)[0],409)
  pub=self.player.call('maps?table_id='+tid)[1];self.assertEqual(pub[0]['images'][0]['asset_id'],im);self.assertIsNone(pub[0]['metadata'])
  m.update(revision=2,images=[{'period':'noite','asset_id':im},{'period':'NOITE','asset_id':im2}]);self.assertEqual(self.gm.call('admin-maps',m)[0],400)
  combat=self.gm.call('combat?table_id='+tid+'&asset_id='+im)[1];self.assertEqual(combat['state']['grid']['scale'],2);self.assertEqual(len(combat['state']['conditions']),29)
  self.gm.call('combat',{'table_id':tid,'asset_id':im,'revision':0,'state':combat['state']})
  conf['revision']=1;conf['config']['grid']['scale']=3;self.gm.call('admin-settings',conf)
  self.assertEqual(self.gm.call('combat?table_id='+tid+'&asset_id='+im)[1]['state']['grid']['scale'],2)
  self.assertEqual(self.gm.call('combat?table_id='+tid+'&asset_id='+im2)[1]['state']['grid']['scale'],3)
  a.init();self.assertEqual(self.gm.call('admin-settings?table_id='+tid)[1]['revision'],2)

 def test_scene_identity_and_stale_access_editor(self):
  tid=self.tid
  with a.db() as c:
   aid=put(c,a.DATA,tid,'shared.png',b'image')
   for mid in ['a','b']:
    c.execute('INSERT INTO maps VALUES(?,?,?,?,?)',(tid,mid,mid,'{}',0));c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,mid,'day',aid))
  self.gm.call('scene',{'table_id':tid,'asset_id':aid,'map_id':'b'})
  self.assertEqual(self.gm.call('scene?table_id='+tid)[1]['map_id'],'b')
  links=[{'id':'link','label':'Voltar','targets':['a'],'rect':[0,0,.1,.1]}]
  args={'table_id':tid,'map_id':'b','links':links,'expected_links':[]}
  self.assertEqual(self.gm.call('navigation',args)[0],200)
  self.assertEqual(self.gm.call('navigation',args)[0],409)
  revision=self.gm.call('scene?table_id='+tid)[1]['revision']
  self.assertEqual(self.gm.call('scene-navigate',{'table_id':tid,'map_id':'a','revision':revision})[0],200)
  self.assertEqual(self.gm.call('scene?table_id='+tid)[1]['map_id'],'a')
