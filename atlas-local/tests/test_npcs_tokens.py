import base64,io,tempfile,threading,unittest,urllib.error
from pathlib import Path
from PIL import Image
from test_server import a,Client

class NpcTokens(unittest.TestCase):
 def test_private_journal_portrait_scope_and_visibility(self):
  with tempfile.TemporaryDirectory() as tmp:
   a.DATA=Path(tmp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=s.serve_forever,daemon=True).start()
   try:
    base='http://127.0.0.1:'+str(s.server_port);gm,player=Client(base),Client(base)
    for client,name in [(gm,'NPCGM'),(player,'NPCPlayer')]:self.assertEqual(client.call('register',{'name':name,'password':'test-password-123'})[0],200)
    tid=gm.call('tables',{'name':'NPCs'})[1]['id'];tid2=gm.call('tables',{'name':'Other'})[1]['id']
    player.call('join',{'code':gm.call('invite',{'table_id':tid})[1]['code']})
    args={'table_id':tid}
    self.assertEqual(player.call('npcs?table_id='+tid)[0],403)
    self.assertEqual(player.call('npcs',{**args,'name':'No'})[0],403)
    self.assertEqual(gm.call('npcs',{**args,'name':''})[0],400)
    result=gm.call('npcs',{**args,'name':'Bernardo','summary':'Taverneiro','body':'Segredo'})
    self.assertEqual(result[0],200);npc=result[1]
    update={**args,**npc,'name':'Bernardo','summary':'Taverneiro de Stalla','body':'Segredo'}
    self.assertEqual(gm.call('npcs',update)[0],200)
    self.assertEqual(gm.call('npcs',update)[0],409)
    self.assertEqual(gm.call('npcs',{**update,'table_id':tid2})[0],404)
    png=io.BytesIO();Image.new('RGBA',(512,512),(90,40,10,255)).save(png,'PNG')
    aid=gm.call('upload',{**args,'name':'token.png','content':base64.b64encode(png.getvalue()).decode()})[1]['id']
    self.assertEqual(player.call('token-templates',{**args,'name':'No','asset_id':aid})[0],403)
    self.assertEqual(gm.call('token-templates',{'table_id':tid2,'name':'No','asset_id':aid})[0],400)
    result=gm.call('token-templates',{**args,'name':'Bernardo','asset_id':aid});self.assertEqual(result[0],200);appearance=result[1]['id']
    self.assertEqual(gm.call('npcs',{**update,'revision':2,'appearance':appearance})[0],200)
    self.assertEqual(gm.call('npcs?table_id='+tid)[1][0]['appearance'],appearance)
    a.init();self.assertEqual(len(gm.call('token-templates?table_id='+tid)[1]),1)
    self.assertEqual(gm.call('recent-tokens?table_id='+tid)[1][0]['appearance'],appearance)
    art=base+'/api/token-art?table_id='+tid+'&id='+appearance
    def get_status(client):
     try:
      with client.http.open(art) as res:return res.status
     except urllib.error.HTTPError as e:return e.code
    self.assertEqual(get_status(gm),200);self.assertEqual(get_status(player),404)
    self.assertEqual(gm.call('scene',{**args,'asset_id':aid})[0],200)
    state=gm.call('combat?table_id='+tid+'&asset_id='+aid)[1]['state']
    state['tokens']=[{'id':'npc','name':'Bernardo','q':0,'r':0,'owner':None,'color':'#123456','budget':10,'spent':0,'hidden':False,'effects':[],'appearance':appearance}];state['enabled']=True
    self.assertEqual(gm.call('combat',{**args,'asset_id':aid,'revision':0,'state':state})[0],200)
    self.assertEqual(get_status(player),200)
    state['tokens'][0]['hidden']=True
    self.assertEqual(gm.call('combat',{**args,'asset_id':aid,'revision':1,'state':state})[0],200)
    self.assertEqual(get_status(player),404)
   finally:s.shutdown();s.server_close()
