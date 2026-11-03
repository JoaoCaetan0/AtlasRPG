import sys,json,tempfile,threading,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
sys.path.insert(0,str(Path(__file__).resolve().parent))
from test_server import a,Client
from assets import put
with tempfile.TemporaryDirectory() as temp:
 a.DATA=Path(temp);a.init();server=a.ThreadingHTTPServer((os.environ.get('ATLAS_TEST_HOST','127.0.0.1'),8766),a.Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
 gm=Client('http://'+os.environ.get('ATLAS_TEST_HOST','127.0.0.1')+':8766');gm.call('register',{'name':'Teste mestre','password':'test-only-12345'})
 user=gm.call('me')[1]['id'];tid=gm.call('tables',{'name':'Estigma • revisão da interface','system':'Estigma do Caos','synopsis':'Ambiente de teste da versão 06'})[1]['id']
 ids=[]
 with a.db() as c:
  for i,(name,digest) in enumerate([('Vila do Freixo','233b25e3605878c7e047e9d6e9ac0f85b0a9f6c960c83823a0474154225666c5'),('Armazém','c6b001d80311244c68e79efb4cee40731b05df0cc68de41ad8e643bca1707409')]):
   aid=put(c,a.DATA,tid,name+'.png',(Path(__file__).resolve().parents[1]/'campaign/blobs'/digest).read_bytes());ids.append(aid);c.execute('INSERT INTO maps VALUES(?,?,?,?,?)',(tid,'test'+str(i),name,'{}',0));c.execute('INSERT INTO map_assets VALUES(?,?,?,?)',(tid,'test'+str(i),'manhã',aid))
  pdf=put(c,a.DATA,tid,'Ficha.pdf',(Path(__file__).resolve().parents[1]/'campaign/blobs/ac077d9e3b50680ec80397bf099836cbde82c005360478959f75fbe001ba082c').read_bytes())
 gm.call('scene',{'table_id':tid,'asset_id':ids[0]});gm.call('navigation',{'table_id':tid,'map_id':'test0','links':[{'id':'passage','label':'Armazém','targets':['test1'],'rect':[.1,.1,.2,.08]}]})
 char=gm.call('characters',{'table_id':tid,'name':'Aventureiro de teste','user_id':user,'template_id':pdf})[1]['id']
 (Path(os.environ['ATLAS_UI_OUTPUT'])/'fixture.json').write_text(json.dumps({'tid':tid,'assets':ids,'char':char}))
 print('UI fixture ready',flush=True)
 threading.Event().wait()
