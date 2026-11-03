import sys,tempfile,threading,io
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from test_server import a,Client
from assets import put
from PIL import Image
with tempfile.TemporaryDirectory() as tmp:
 a.DATA=Path(tmp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',8766),a.Handler);threading.Thread(target=s.serve_forever,daemon=True).start()
 gm=Client('http://127.0.0.1:8766');gm.call('register',{'name':'Camera','password':'camera-test-123'})
 tid=gm.call('tables',{'name':'Camera'})[1]['id']
 with a.db() as c:
  ids=[]
  for title,size in [('Alto',(500,1800)),('Largo',(1800,500)),('Noite',(500,1800))]:
   b=io.BytesIO();Image.new('RGB',size,'#152540' if title=='Noite' else '#457980').save(b,format='PNG');aid=put(c,a.DATA,tid,title+'.png',b.getvalue());ids.append(aid)
 for title,kind,tags,aid in [('Floresta Âmbar','encounter',['Árvores'],ids[0]),('Região do Norte','regional',['Viagem'],ids[1])]:
  result=gm.call('admin-maps',{'table_id':tid,'revision':0,'title':title,'region':'Stalla','notes':'Notas privadas','visible':False,'images':[{'period':'manhã','asset_id':aid}]+([{'period':'noite','asset_id':ids[2]}] if aid==ids[0] else []),'kind':kind,'tags':tags})
  assert result[0]==200,result
 player=Client('http://127.0.0.1:8766');player.call('register',{'name':'Viewer','password':'camera-test-123'});player.call('join',{'code':gm.call('invite',{'table_id':tid})[1]['code']})
 gm.call('scene',{'table_id':tid,'asset_id':ids[0]})
 print('ready',flush=True);threading.Event().wait()
