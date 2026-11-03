import copy,io,json,os,tempfile,threading,unittest
from pathlib import Path
from test_server import a,Client
from assets import put
from PIL import Image
import abilities
from rules import RACES,CLASSES
class CharacterLinks(unittest.TestCase):
 def setUp(self):
  with a.ATTEMPTS_LOCK:a.ATTEMPTS.clear()
  self.temp=tempfile.TemporaryDirectory();a.DATA=Path(self.temp.name);a.init()
  self.server=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=self.server.serve_forever,daemon=True).start()
  self.base='http://127.0.0.1:'+str(self.server.server_port)
  self.gm,self.player,self.other=[Client(self.base) for _ in range(3)]
  for client,name in [(self.gm,'LinkGM'),(self.player,'LinkPlayer'),(self.other,'LinkOther')]:self.assertEqual(client.call('register',{'name':name,'password':'test-password-123'})[0],200)
  self.tid=self.gm.call('tables',{'name':'Vinculos'})[1]['id'];code=self.gm.call('invite',{'table_id':self.tid})[1]['code']
  self.player.call('join',{'code':code});self.other.call('join',{'code':code});self.pid=self.player.call('me')[1]['id']
  self.cid='hero-sheet';b=io.BytesIO();Image.new('RGB',(100,100),'red').save(b,format='PNG')
  with a.db() as c:
   self.aid=put(c,a.DATA,self.tid,'map.png',b.getvalue());c.execute('UPDATE assets SET public=1 WHERE id=?',(self.aid,))
   c.execute('INSERT INTO characters(id,table_id,user_id,name,fields) VALUES(?,?,?,?,?)',(self.cid,self.tid,self.pid,'Herói',json.dumps({'nome':'Nome da ficha','pv_atual':'12','pd_atual':'8','def_natural':'14','poder_01':'Segredo pessoal'})))
  self.args={'table_id':self.tid,'asset_id':self.aid};self.url='combat?table_id='+self.tid+'&asset_id='+self.aid
 def tearDown(self):
  self.server.shutdown();self.server.server_close();self.temp.cleanup()
 def add(self):
  s=self.gm.call(self.url)[1]['state'];s['enabled']=True
  s['tokens']=[{'id':'hero','character_id':self.cid,'name':'Nome falso','owner':None,'q':0,'r':0,'color':'#112233','budget':10,'spent':0,'hidden':False,'effects':[]}]
  s['entries']=[{'id':'turn','name':'Nome antigo','token':'hero','value':10,'hidden':False,'effects':[]}]
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':0,'state':s})[0],200)
 def test_link_authority_privacy_and_live_resources(self):
  self.add();r=self.player.call(self.url)[1];t=r['state']['tokens'][0]
  self.assertEqual(t['owner'],self.pid);self.assertEqual(t['name'],'Nome da ficha');self.assertEqual(r['state']['entries'][0]['name'],t['name'])
  self.assertEqual(r['characters'][self.cid]['resources']['pv_atual'],'12');self.assertNotIn('Segredo pessoal',json.dumps(r))
  other=self.other.call(self.url)[1];self.assertEqual(other['characters'],{});self.assertNotIn('character_id',other['state']['tokens'][0]);self.assertNotIn(self.cid,json.dumps(other))
  self.assertEqual(self.other.call('combat-move',{**self.args,'revision':1,'token_id':'hero','path':[[1,0]]})[0],403)
  self.assertEqual(self.player.call('combat-move',{**self.args,'revision':1,'token_id':'hero','path':[[1,0]]})[0],200)
  with a.db() as c:c.execute('UPDATE characters SET fields=?,revision=revision+1 WHERE id=?',(json.dumps({'nome':'Novo nome','pv_atual':'5'}),self.cid))
  r=self.player.call(self.url)[1];self.assertEqual(r['characters'][self.cid]['resources']['pv_atual'],'5');self.assertEqual(r['state']['tokens'][0]['name'],'Novo nome');self.assertEqual(r['revision'],2)
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':2})[0],200)
  r=self.player.call(self.url)[1];self.assertEqual(r['state']['tokens'][0]['q'],0);self.assertEqual(r['characters'][self.cid]['resources']['pv_atual'],'5')
  self.assertEqual(self.gm.call('combat-redo',{**self.args,'revision':3})[0],200)
  self.assertEqual(self.player.call(self.url)[1]['characters'][self.cid]['resources']['pv_atual'],'5')
  with a.db() as c:c.execute('UPDATE characters SET user_id=? WHERE id=?',(self.other.call('me')[1]['id'],self.cid))
  self.assertEqual(self.player.call('combat-move',{**self.args,'revision':4,'token_id':'hero','path':[[0,0]]})[0],403)
 def test_invalid_link_unlink_and_history(self):
  self.add();s=self.gm.call(self.url)[1]['state']
  for cid in ['missing',[],{'id':'bad'}]:
   s['tokens'][0]['character_id']=cid;self.assertEqual(self.gm.call('combat',{**self.args,'revision':1,'state':s})[0],400)
  tid=self.gm.call('tables',{'name':'Outra mesa'})[1]['id']
  with a.db() as c:c.execute('INSERT INTO characters(id,table_id,user_id,name) VALUES(?,?,?,?)',('foreign',tid,self.pid,'Outra'))
  s['tokens'][0]['character_id']='foreign';self.assertEqual(self.gm.call('combat',{**self.args,'revision':1,'state':s})[0],400)
  s['tokens'][0]['character_id']=None;self.assertEqual(self.gm.call('combat',{**self.args,'revision':1,'state':s})[0],200)
  self.assertEqual(self.player.call(self.url)[1]['characters'],{})
  self.assertEqual(self.gm.call('combat-undo',{**self.args,'revision':2})[0],200)
  self.assertIn(self.cid,self.player.call(self.url)[1]['characters'])
  with a.db() as c:self.assertEqual(json.loads(c.execute('SELECT fields FROM characters WHERE id=?',(self.cid,)).fetchone()[0])['pv_atual'],'12')
 def test_fog_hides_character_summary(self):
  self.add();self.assertEqual(self.gm.call('fog',{**self.args,'revision':0,'action':'enable'})[0],200)
  r=self.player.call(self.url)[1];self.assertEqual(r['characters'],{});self.assertEqual(r['state']['tokens'],[]);self.assertNotIn(self.cid,json.dumps(r))
class Abilities(unittest.TestCase):
 def test_catalog_and_source(self):
  items=abilities.catalog();self.assertEqual(len(items),82);self.assertEqual(len({a['id'] for a in items}),82)
  lines=(Path(__file__).resolve().parents[1]/'docs/LIVRO_FONTE_CANVA.txt').read_text(encoding='utf-8').splitlines()
  for a in items:self.assertIn(a['description'],lines[a['source_line']-1])
  for race in RACES:self.assertEqual(len(abilities.selected({'raca':race})),4)
  for cls in CLASSES:self.assertEqual(len(abilities.selected({'classe':cls})),2 if cls=='Engenheiro' else 4)
  self.assertIn('Sentidos aguçados',[a['name'] for a in abilities.selected({'raca':'Silvano'})])
  self.assertNotIn('Sentidos aguçados',[a['name'] for a in abilities.selected({'raca':'Draconato'})])
 def test_selections_do_not_mutate_manual_fields(self):
  f={'raca':'Humano','classe':'Mago','poder_01':'Meu poder','efeito_01':'Minha anotação'};before=copy.deepcopy(f)
  self.assertEqual(len(abilities.selected(f)),8);self.assertEqual(f,before)
  f.update(raca='Golem',classe='Engenheiro');self.assertEqual(len(abilities.selected(f)),6);self.assertEqual(f['poder_01'],'Meu poder')
  self.assertEqual(abilities.selected({'raca':'Customizada','classe':'Outra'}),[])
 def test_pdf_appendix_keeps_form_and_full_descriptions(self):
  from pypdf import PdfReader,PdfWriter
  template=Path(__file__).resolve().parents[1]/'campaign/blobs/ac077d9e3b50680ec80397bf099836cbde82c005360478959f75fbe001ba082c'
  if not template.exists():self.skipTest('Modelo real ausente')
  original=PdfReader(template);w=PdfWriter();w.clone_document_from_reader(original)
  f={'nome':'Teste de habilidades','raca':'Golem','classe':'Engenheiro'};abilities.append_pdf(w,f,'Teste');b=io.BytesIO();w.write(b);r=PdfReader(b)
  self.assertEqual(len(r.get_fields()),168);self.assertGreater(len(r.pages),len(original.pages))
  text=' '.join(p.extract_text() for p in r.pages[len(original.pages):]);self.assertIn('Autômato',text);self.assertIn('você perde o autômato',text);self.assertIn('Gambiarra',text)
  if os.environ.get('ATLAS_ABILITY_PDF'):Path(os.environ['ATLAS_ABILITY_PDF']).write_bytes(b.getvalue())
