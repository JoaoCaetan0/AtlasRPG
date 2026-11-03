import tempfile,threading,unittest,copy,json
from pathlib import Path
from test_server import a,Client
from assets import put

class TokenAssets(unittest.TestCase):
 def test_catalog_validation_hidden_artwork_and_legacy_compatibility(self):
  with tempfile.TemporaryDirectory() as tmp:
   a.DATA=Path(tmp);a.init();server=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler)
   threading.Thread(target=server.serve_forever,daemon=True).start()
   base='http://127.0.0.1:'+str(server.server_port)
   gm,player=Client(base),Client(base)
   try:
    for client,name in [(gm,'AssetsGM'),(player,'AssetsPlayer')]:
     self.assertEqual(client.call('register',{'name':name,'password':'test-password-123'})[0],200)
    tid=gm.call('tables',{'name':'Assets'})[1]['id']
    player.call('join',{'code':gm.call('invite',{'table_id':tid})[1]['code']})
    with gm.http.open(base+'/tokens/catalog.json') as response:catalog=json.load(response)
    self.assertEqual(len(catalog),8)
    for item in catalog:
     with gm.http.open(base+item['image']) as response:
      self.assertEqual(response.headers['Content-Type'],'image/png')
      self.assertEqual(response.read()[:8],b'\x89PNG\r\n\x1a\n')
    with a.db() as c:
     aid=put(c,a.DATA,tid,'map.png',b'test');c.execute('UPDATE assets SET public=1 WHERE id=?',(aid,))
    args={'table_id':tid,'asset_id':aid};url='combat?table_id='+tid+'&asset_id='+aid
    state=gm.call(url)[1]['state'];state['enabled']=True
    token={'id':'old','name':'Antigo','q':0,'r':0,'owner':None,'color':'#123456','budget':10,'spent':0,'hidden':False,'effects':[]}
    state['tokens']=[token,{**token,'id':'new','name':'Lobo 1','appearance':'lobo'},
                     {**token,'id':'trap','name':'Armadilha 1','appearance':'armadilha','hidden':True}]
    for invalid in ['https://example.com/image.png','../secret',[],1]:
     bad=copy.deepcopy(state);bad['tokens'][1]['appearance']=invalid
     self.assertEqual(gm.call('combat',{**args,'revision':0,'state':bad})[0],400)
    self.assertEqual(player.call('combat',{**args,'revision':0,'state':state})[0],403)
    self.assertEqual(gm.call('combat',{**args,'revision':0,'state':state})[0],200)
    visible=player.call(url)[1]['state']['tokens']
    self.assertEqual([t['id'] for t in visible],['old','new'])
    self.assertEqual(visible[1]['appearance'],'lobo')
    self.assertNotIn('appearance',visible[0])
    a.init();self.assertEqual(gm.call(url)[1]['state']['tokens'][2]['appearance'],'armadilha')
   finally:server.shutdown();server.server_close()
