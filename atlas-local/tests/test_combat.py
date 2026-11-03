import tempfile,threading,unittest,copy,json
from pathlib import Path
from test_server import a,Client
from assets import put
class Combat(unittest.TestCase):
 def test_combat_navigation_authorization_and_movement(self):
  with tempfile.TemporaryDirectory() as tmp:
   a.DATA=Path(tmp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=s.serve_forever,daemon=True).start()
   try:
    owner,player,other=[Client('http://127.0.0.1:'+str(s.server_port)) for _ in range(3)]
    for c,n in [(owner,'CombateGM'),(player,'CombatePlayer'),(other,'CombateOther')]:self.assertEqual(c.call('register',{'name':n,'password':'test-password-123'})[0],200)
    tid=owner.call('tables',{'name':'Combate'})[1]['id'];pid=player.call('me')[1]['id']
    code=owner.call('invite',{'table_id':tid})[1]['code'];player.call('join',{'code':code})
    with a.db() as c:
     aid=put(c,a.DATA,tid,'test.png',b'test');c.execute('UPDATE assets SET public=1 WHERE id=?',(aid,))
     for mid in ['A','B']:c.execute('INSERT INTO maps VALUES(?,?,?,?,?)',(tid,mid,mid,'{}',int(mid=='A')))
    args={'table_id':tid,'asset_id':aid};url='combat?table_id='+tid+'&asset_id='+aid
    state=owner.call(url)[1]['state'];state['enabled']=True;self.assertEqual(len(state['conditions']),28)
    t={'id':'token1','name':'Herói','q':0,'r':0,'owner':pid,'color':'#123456','budget':3,'spent':0,'hidden':False,'effects':[{'id':'acuado','stage':1,'secret':True}]}
    state['tokens']=[t,{**copy.deepcopy(t),'id':'secret','name':'Segredo','hidden':True}]
    state['entries']=[{'id':'e1','name':'Heroi','token':'token1','value':10,'hidden':False,'effects':[]},{'id':'e2','name':'Segredo','token':'secret','value':9,'hidden':False,'effects':[]}];state['active']='e2';state['terrain']={'1,0':2,'2,0':0}
    self.assertEqual(player.call('combat',{**args,'revision':0,'state':state})[0],403)
    self.assertEqual(owner.call('combat',{**args,'revision':0,'state':state})[0],200)
    public=player.call(url)[1]['state'];self.assertEqual(len(public['tokens']),1);self.assertEqual(public['tokens'][0]['effects'],[]);self.assertEqual(len(public['entries']),1);self.assertIsNone(public['active'])
    self.assertEqual(other.call(url)[0],403)
    move={**args,'revision':1,'token_id':'token1','path':[[1,0]]}
    self.assertEqual(player.call('combat-move',{**move,'token_id':'secret'})[0],403)
    self.assertEqual(player.call('combat-move',{**move,'path':[[3,0]]})[0],400)
    self.assertEqual(player.call('combat-move',move)[0],200)
    self.assertEqual(player.call('combat-move',move)[0],409)
    self.assertEqual(player.call(url)[1]['state']['tokens'][0]['spent'],3)
    self.assertEqual(player.call('combat-move',{**move,'revision':2,'path':[[2,0]]})[0],400)
    self.assertEqual(player.call('combat-move',{**move,'revision':2,'path':[[0,0]]})[0],400)
    a.init();self.assertEqual(owner.call(url)[1]['revision'],2)
    nav={'table_id':tid,'map_id':'A','links':[{'label':'Segredo','targets':['B'],'rect':[.1,.1,.2,.2]}]}
    self.assertEqual(player.call('navigation',nav)[0],403);self.assertEqual(owner.call('navigation',nav)[0],200)
    self.assertEqual(player.call('navigation?table_id='+tid+'&map_id=A')[1],[])
    owner.call('map-visibility',{'table_id':tid,'id':'B','visible':True})
    self.assertEqual(len(player.call('navigation?table_id='+tid+'&map_id=A')[1]),1)
    with a.db() as c:
     bid=put(c,a.DATA,tid,'b.png',b'b');day=put(c,a.DATA,tid,'day.png',b'day')
     c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,'A','noite',aid))
     c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,'B','noite',bid))
     c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,'B','manha',day))
    owner.call('scene',{'table_id':tid,'asset_id':aid})
    shared=owner.call('scene?table_id='+tid)[1]
    self.assertEqual(shared['map_id'],'A')
    payload={'table_id':tid,'revision':shared['revision'],'map_id':'B'}
    self.assertEqual(player.call('scene-navigate',payload)[0],403)
    self.assertEqual(owner.call('scene-navigate',{**payload,'map_id':'C'})[0],400)
    self.assertEqual(owner.call('scene-navigate',payload)[1]['fallback'],False)
    self.assertEqual(owner.call('scene-navigate',payload)[0],409)
    shared=player.call('scene?table_id='+tid)[1]
    self.assertEqual(shared['asset_id'],bid);self.assertIsNone(shared['map_id'])
    owner.call('scene',{'table_id':tid,'asset_id':aid})
    self.assertEqual(owner.call(url)[1]['state']['tokens'][0]['spent'],3)
    with a.db() as c:c.execute('DELETE FROM map_assets WHERE table_id=? AND legacy_id=? AND period=?',(tid,'B','noite'))
    current=owner.call('scene?table_id='+tid)[1]
    result=owner.call('scene-navigate',{'table_id':tid,'map_id':'B','revision':current['revision']})
    self.assertTrue(result[1]['fallback']);self.assertEqual(result[1]['period'],'manha')
    old=owner.call(url)[1];old['state']['enabled']=False
    self.assertEqual(owner.call('combat',{**args,'revision':old['revision'],'state':old['state']})[0],200)
    self.assertEqual(player.call('combat-move',{**move,'revision':old['revision']+1,'path':[[0,0]]})[0],400)
    nav['links'][0]['rect']=[.9,.9,.5,.5];self.assertEqual(owner.call('navigation',nav)[0],400)
   finally:s.shutdown();s.server_close()
