import json,tempfile,threading,unittest,io,os
from pathlib import Path
from test_server import a,Client
from assets import put
class Characters(unittest.TestCase):
 def test_assigned_sheet_and_editable_export(self):
  from pypdf import PdfReader
  supplied=os.environ.get('ATLAS_TEST_PDF')
  if not supplied:self.skipTest('Informe ATLAS_TEST_PDF para validar o modelo real de Estigma.')
  original=Path(supplied).read_bytes()
  with tempfile.TemporaryDirectory() as temp:
   a.DATA=Path(temp);a.init();s=a.ThreadingHTTPServer(('127.0.0.1',0),a.Handler);threading.Thread(target=s.serve_forever,daemon=True).start()
   try:
    base='http://127.0.0.1:'+str(s.server_port);owner=Client(base);player=Client(base);other=Client(base)
    for c,n in [(owner,'SheetGM'),(player,'SheetPlayer'),(other,'SheetOther')]:self.assertEqual(c.call('register',{'name':n,'password':'password-test-123'})[0],200)
    tid=owner.call('tables',{'name':'Fichas'})[1]['id'];pid=player.call('me')[1]['id'];code=owner.call('invite',{'table_id':tid})[1]['code']
    player.call('join',{'code':code});other.call('join',{'code':code})
    with a.db() as c:template=put(c,a.DATA,tid,'ficha.pdf',original)
    cid=owner.call('characters',{'table_id':tid,'name':'Elara','user_id':pid,'template_id':template})[1]['id']
    self.assertEqual(other.call('character',{'table_id':tid,'id':cid})[0],404)
    sheet=player.call('character',{'table_id':tid,'id':cid})[1];self.assertEqual(len(sheet['definitions']),168)
    values={'nome':'Elara','pv_atual':'25','atributo_INT':'3'}
    self.assertEqual(player.call('character',{'table_id':tid,'id':cid,'fields':values,'revision':0})[0],200)
    self.assertEqual(player.call('character',{'table_id':tid,'id':cid,'fields':values,'revision':0})[0],409)
    with player.http.open(base+'/api/character-pdf?table_id='+tid+'&id='+cid) as r:body=r.read()
    pdf=PdfReader(io.BytesIO(body));fields=pdf.get_fields();self.assertEqual(len(fields),168)
    for key,value in values.items():self.assertEqual(fields[key]['/V'],value)
    self.assertEqual(fields['pd_atual']['/V'],'')
    appearances=[]
    for page in pdf.pages:
     for ref in page.get('/Annots',[]):
      w=ref.get_object()
      if w.get('/Subtype')=='/Widget':appearances.append(w['/AP'].raw_get('/N').idnum)
    self.assertEqual(len(appearances),len(set(appearances)))
    for page in pdf.pages:
     for ref in page.get('/Annots',[]):
      widget=ref.get_object();name=widget.get('/T')
      if name in values:
       self.assertEqual(widget['/V'],values[name]);self.assertTrue(widget['/AP']['/N'])
    calculated={**values,'raca':'Golem','classe':'Mago','atributo_CON':'2','atributo_FOR':'-1','atributo_DES':'1','atributo_CAR':'1'}
    updated=player.call('character',{'table_id':tid,'id':cid,'fields':calculated,'build':{'auto':True,'powers':['aura']},'revision':1})
    self.assertEqual(updated[0],200);self.assertEqual(updated[1]['fields']['pv_maximo'],'18')
    self.assertEqual(updated[1]['fields']['pd_maximo'],'17');self.assertEqual(updated[1]['fields']['pv_atual'],'25')
    a.init();self.assertTrue(player.call('character',{'table_id':tid,'id':cid})[1]['build']['auto'])
    output=os.environ.get('ATLAS_TEST_EXPORT')
    if output:Path(output).write_bytes(body)
   finally:s.shutdown();s.server_close()
