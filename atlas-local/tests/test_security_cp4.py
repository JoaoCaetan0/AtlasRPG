import base64,hashlib,http.client,json,unittest
from email.message import Message
from unittest.mock import patch
import test_fog
from test_server import a
from request_security import strict_json,body_size
from upload_validation import validate_upload
from audit_data import audit

class Inputs(unittest.TestCase):
 def test_strict_json(self):
  for body in [b'{"a":1,"a":2}',b'{"a":NaN}',b'{"a":Infinity}',b'{"a":1e999}',b'[]',b'{"a":'+b'['*70+b'0'+b']'*70+b'}']:
   with self.subTest(body=body),self.assertRaises((ValueError,RecursionError)):strict_json(body)
  self.assertEqual(strict_json(b'{"a":[1,2]}'),{'a':[1,2]})
 def test_framing(self):
  for entries in [[('Content-Length','2'),('Content-Length','2')],[('Content-Length','2'),('Transfer-Encoding','chunked')],[('Content-Length','-1')]]:
   h=Message()
   for k,v in entries:h[k]=v
   with self.assertRaises(ValueError):body_size(h,100)
  h=Message();h['Content-Length']='101'
  with self.assertRaises(OverflowError):body_size(h,100)

class Security(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def test_cross_table_organization(self):
  other_table=self.other.call('tables',{'name':'Outra mesa'})[1]['id']
  with a.db() as c:
   from assets import put
   foreign=put(c,a.DATA,other_table,'private.txt',b'secret')
  self.assertEqual(self.gm.call('organize',{'table_id':self.tid,'id':foreign,'label':'changed'})[0],404)
  with a.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM placements WHERE asset_id=?',(foreign,)).fetchone()[0],0)
  self.assertEqual(self.gm.call('organize',{'table_id':self.tid,'id':self.aid,'label':'ok'})[0],200)
 def test_upload_invalid_is_atomic_and_valid_image_works(self):
  before=set((a.DATA/'blobs').iterdir())
  for name,body in [('fake.png',b'<script>bad</script>'),('wrong.jpg',self.original),('../x.txt',b'x'),('bad.pdf',b'%PDF-1.4'),('a:b.txt',b'x')]:
   r=self.gm.call('upload',{'table_id':self.tid,'name':name,'content':base64.b64encode(body).decode()});self.assertEqual(r[0],400,r)
  self.assertEqual(before,set((a.DATA/'blobs').iterdir()))
  with patch('upload_validation.MAX_PIXELS',10):
   with self.assertRaises(ValueError):validate_upload('map.png',self.original)
  r=self.gm.call('upload',{'table_id':self.tid,'name':'valid.png','content':base64.b64encode(self.original).decode()});self.assertEqual(r[0],200,r)
  self.assertEqual(self.player.call('upload',{'table_id':self.tid,'name':'x.txt','content':'eA=='})[0],403)
 def test_invalid_http_and_session_rotation(self):
  port=self.server.server_port
  for body in [b'{"name":"one","name":"two"}',b'{"name":NaN}']:
   conn=http.client.HTTPConnection('127.0.0.1',port);conn.request('POST','/api/register',body,{'Content-Type':'application/json','X-Atlas-Request':'1'});r=conn.getresponse();self.assertEqual(r.status,400);r.read();conn.close()
  conn=http.client.HTTPConnection('127.0.0.1',port);conn.putrequest('GET','/api/me');conn.putheader('Host','evil');conn.endheaders();r=conn.getresponse();self.assertEqual(r.status,403);r.read();conn.close()
  with a.db() as c:old={r[0] for r in c.execute('SELECT token FROM sessions WHERE user_id=(SELECT id FROM users WHERE name=?)',('FogGM',))}
  self.assertEqual(self.gm.call('login',{'name':'FogGM','password':'test-password-123'})[0],200)
  with a.db() as c:new={r[0] for r in c.execute('SELECT token FROM sessions WHERE user_id=(SELECT id FROM users WHERE name=?)',('FogGM',))}
  self.assertFalse(old&new);self.assertEqual(len(new),1)
 def test_audit_detects_corruption_without_repair(self):
  db=a.DATA/'atlas.sqlite3';before=hashlib.sha256(db.read_bytes()).hexdigest()
  self.assertTrue(audit(a.DATA)['ok']);self.assertEqual(hashlib.sha256(db.read_bytes()).hexdigest(),before)
  blob=next((a.DATA/'blobs').iterdir());blob.write_bytes(b'corrupt')
  result=audit(a.DATA);self.assertFalse(result['ok']);self.assertTrue(any(x['type']=='hash_mismatch' for x in result['errors']));self.assertEqual(blob.read_bytes(),b'corrupt')
