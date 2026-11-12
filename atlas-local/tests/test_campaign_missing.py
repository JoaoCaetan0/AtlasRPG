import unittest,tempfile
from pathlib import Path
from unittest.mock import patch
import test_fog
from test_server import a
class MissingCampaign(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def test_missing_content_explains_recovery_without_creating_table(self):
  (a.DATA/'host-key.txt').write_text('test-host-key',encoding='utf-8')
  before=self.gm.call('tables')[1]
  with tempfile.TemporaryDirectory() as empty,patch.object(a,'ROOT',Path(empty)):
   code,result=self.gm.call('create-estigma',{'host_key':'test-host-key'})
  self.assertEqual(code,409)
  self.assertIn('campaign/manifest.json',result['error'])
  self.assertIn('pasta campaign completa',result['error'])
  self.assertEqual(before,self.gm.call('tables')[1])
