import base64,random,unittest
from io import BytesIO
from PIL import Image
import test_saved_tokens

class PortraitUpload(unittest.TestCase):
 setUp=test_saved_tokens.SavedTokens.setUp
 tearDown=test_saved_tokens.SavedTokens.tearDown
 prepare=test_saved_tokens.SavedTokens.prepare
 def test_textured_portrait_over_64k(self):
  self.prepare();out=BytesIO();Image.frombytes('RGB',(512,512),random.Random(41).randbytes(512*512*3)).save(out,format='PNG')
  payload=base64.b64encode(out.getvalue()).decode();self.assertGreater(len(payload),65536)
  code,result=self.player.call('character-portrait',{'table_id':self.tid,'id':'hero','revision':0,'content':payload})
  self.assertEqual(code,200,result)

  # Consecutive uploads advance the revision and failures preserve the last image.
  code,second=self.player.call('character-portrait',{'table_id':self.tid,'id':'hero','revision':1,'content':payload})
  self.assertEqual(code,200,second);self.assertNotEqual(result['id'],second['id'])
  self.assertEqual(self.player.call('character-portrait',{'table_id':self.tid,'id':'hero','revision':2,'content':'invalid'})[0],400)
  row=self.player.call('characters?table_id='+self.tid)[1][0]
  self.assertEqual(row['appearance'],second['id']);self.assertEqual(row['revision'],2)
  self.assertEqual(self.other.call('character-portrait',{'table_id':self.tid,'id':'hero','revision':2,'content':payload})[0],403)

 def test_limits_are_endpoint_specific(self):
  from request_security import request_limit
  self.assertGreater(request_limit('/api/character-portrait'),3*1024**2)
  self.assertEqual(request_limit('/api/combat'),65536)
  self.assertEqual(request_limit('/api/character-portrait-invalid'),65536)
