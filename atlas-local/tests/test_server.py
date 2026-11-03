import importlib.util,json,tempfile,threading,unittest,urllib.request,urllib.error,http.cookiejar
from pathlib import Path
spec=importlib.util.spec_from_file_location('atlas',Path(__file__).resolve().parents[1]/'server.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class Client:
 def __init__(self,base):self.base=base;self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,path,data=None):
  req=urllib.request.Request(self.base+'/api/'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','X-Atlas-Request':'1'})
  try:
   with self.http.open(req) as r:return r.status,json.load(r)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
class Integration(unittest.TestCase):
 def test_authorization_persistence_and_conflicts(self):
  with tempfile.TemporaryDirectory() as temp:
   a.DATA=Path(temp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler)
   thread=threading.Thread(target=s.serve_forever,daemon=True);thread.start()
   try:
    base='http://127.0.0.1:'+str(s.server_port);owner=Client(base);player=Client(base);other=Client(base)
    for c,name in [(owner,'Mestre'),(player,'Jogador'),(other,'Visitante')]:self.assertEqual(c.call('register',{'name':name,'password':'senha-de-teste-123'})[0],200)
    tid=owner.call('tables',{'name':'Estigma','system':'Estigma do Caos'})[1]['id']
    pid=player.call('me')[1]['id'];oid=owner.call('me')[1]['id']
    self.assertEqual(other.call('members?table_id='+tid)[0],403)
    code=owner.call('invite',{'table_id':tid})[1]['code']
    self.assertEqual(player.call('join',{'code':code})[0],200)
    self.assertEqual(player.call('tables')[1][0]['role'],'player')
    self.assertEqual(player.call('role',{'table_id':tid,'user_id':pid,'role':'gm'})[0],403)
    self.assertEqual(player.call('invite',{'table_id':tid})[0],403)
    self.assertEqual(player.call('note',{'table_id':tid,'user_id':oid})[0],403)
    note={'table_id':tid,'body':'Pista preservada','revision':0}
    self.assertEqual(player.call('note',note)[0],200)
    self.assertEqual(player.call('note',note)[0],409)
    self.assertEqual(owner.call('note',{'table_id':tid,'user_id':pid})[1]['body'],'Pista preservada')
    a.init() # esquema idempotente, dados continuam no disco
    self.assertEqual(player.call('note',{'table_id':tid})[1]['revision'],1)
    owner.call('role',{'table_id':tid,'user_id':pid,'role':'gm'})
    self.assertEqual(player.call('invite',{'table_id':tid})[0],200)
    owner.call('role',{'table_id':tid,'user_id':pid,'role':'player'})
    self.assertEqual(player.call('invite',{'table_id':tid})[0],403)
    owner.call('revoke-invites',{'table_id':tid})
    self.assertEqual(other.call('join',{'code':code})[0],404)
    self.assertEqual(owner.call('role',{'table_id':tid,'user_id':oid,'role':'player'})[0],400)
    imported=owner.call('import-legacy',{'table_id':tid})
    self.assertEqual(imported[0],200);self.assertGreater(imported[1]['added'],50)
    self.assertEqual(owner.call('import-legacy',{'table_id':tid})[1]['added'],0)
    self.assertEqual(player.call('import-legacy',{'table_id':tid})[0],403)
    self.assertEqual(player.call('maps?table_id='+tid)[1],[])
    maps=owner.call('maps?table_id='+tid)[1];mid=maps[0]['id']
    owner.call('map-visibility',{'table_id':tid,'id':mid,'visible':True})
    public=player.call('maps?table_id='+tid)[1]
    self.assertEqual(len(public),1);self.assertIsNone(public[0]['metadata'])
    owner.call('remove-member',{'table_id':tid,'user_id':pid,'block':True})
    self.assertEqual(player.call('note',{'table_id':tid})[0],403)
    code=owner.call('invite',{'table_id':tid})[1]['code']
    self.assertEqual(player.call('join',{'code':code})[0],403)
    owner.call('unblock',{'table_id':tid,'user_id':pid})
    self.assertEqual(player.call('join',{'code':code})[0],200)
    self.assertEqual(player.call('note',{'table_id':tid})[1]['body'],'Pista preservada')
    self.assertEqual(player.call('note',{'table_id':tid,'body':'Retomada','revision':1})[0],200)
    player.call('logout',{});self.assertEqual(player.call('tables')[0],401)
   finally:s.shutdown();s.server_close()
if __name__=='__main__':unittest.main()
