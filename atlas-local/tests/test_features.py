import base64,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
from test_server import a,Client
from assets import put
from network import bind_address
class Features(unittest.TestCase):
 def test_files_grants_scene_chat(self):
  with tempfile.TemporaryDirectory() as tmp:
   a.DATA=Path(tmp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=s.serve_forever,daemon=True).start()
   try:
    base='http://127.0.0.1:'+str(s.server_port);owner=Client(base);player=Client(base);outsider=Client(base)
    for c,n in [(owner,'OwnerF'),(player,'PlayerF'),(outsider,'OtherF')]:self.assertEqual(c.call('register',{'name':n,'password':'test-password-123'})[0],200)
    self.assertEqual(player.call('create-estigma',{'host_key':'invalid'})[0],403)
    tid=owner.call('tables',{'name':'Arquivos'})[1]['id'];pid=player.call('me')[1]['id']
    code=owner.call('invite',{'table_id':tid})[1]['code'];player.call('join',{'code':code})
    file=owner.call('upload',{'table_id':tid,'name':'pista.txt','content':base64.b64encode(b'Segredo').decode()})[1]['id']
    self.assertEqual(player.call('assets?table_id='+tid)[1],[])
    self.assertEqual(player.call('asset?table_id='+tid+'&id='+file)[0],404)
    self.assertEqual(outsider.call('assets?table_id='+tid)[0],403)
    self.assertEqual(player.call('asset-grants',{'table_id':tid,'id':file,'public':True,'users':[]})[0],403)
    owner.call('asset-grants',{'table_id':tid,'id':file,'public':False,'users':[pid]})
    with player.http.open(base+'/api/asset?table_id='+tid+'&id='+file) as r:self.assertEqual(r.read(),b'Segredo')
    self.assertEqual(player.call('organize',{'table_id':tid,'id':file,'folder':'Suspeitos','label':'Carta'})[0],200)
    self.assertEqual(owner.call('assets?table_id='+tid)[1][0]['folder'],'')
    self.assertEqual(owner.call('assets?table_id='+tid+'&user_id='+pid)[1][0]['folder'],'Suspeitos')
    owner.call('asset-grants',{'table_id':tid,'id':file,'public':False,'users':[]})
    self.assertEqual(player.call('asset?table_id='+tid+'&id='+file)[0],404)
    with a.db() as c:image=put(c,a.DATA,tid,'map.png',b'fake-test-image')
    self.assertEqual(player.call('scene',{'table_id':tid,'asset_id':image})[0],403)
    self.assertEqual(owner.call('scene',{'table_id':tid,'asset_id':image})[0],200)
    self.assertEqual(player.call('scene?table_id='+tid)[1]['asset_id'],image)
    self.assertEqual(player.call('chat',{'table_id':tid,'body':'Encontrei a pista'})[0],200)
    self.assertEqual(owner.call('chat?table_id='+tid)[1][0]['body'],'Encontrei a pista')
    self.assertEqual(player.call('clear-chat',{'table_id':tid})[0],403)
    owner.call('clear-chat',{'table_id':tid});self.assertEqual(player.call('chat?table_id='+tid)[1],[])
    req=urllib.request.Request(base+'/api/me',headers={'Host':'evil.example'})
    with self.assertRaises(urllib.error.HTTPError) as ctx:owner.http.open(req)
    self.assertEqual(ctx.exception.code,403)
   finally:s.shutdown();s.server_close()
 def test_network_binding_is_specific(self):
  self.assertEqual(bind_address('26.1.2.3'),'26.1.2.3')
  self.assertEqual(bind_address('192.168.1.4'),'192.168.1.4')
  for host in ['0.0.0.0','8.8.8.8','224.0.0.1']:
   with self.assertRaises(ValueError):bind_address(host)
