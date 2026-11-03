"""Exercise real API flows when implicit text encoding is Windows-1252."""
from pathlib import Path
from unittest.mock import patch
from test_combat import Combat

_read=Path.read_text
_write=Path.write_text

def windows_read(self,encoding=None,errors=None,**kwargs):
 return _read(self,encoding=encoding or 'cp1252',errors=errors,**kwargs)

def windows_write(self,data,encoding=None,errors=None,**kwargs):
 return _write(self,data,encoding=encoding or 'cp1252',errors=errors,**kwargs)

class WindowsEncoding(Combat):
 def setUp(self):
  self.enterContext(patch.object(Path,'read_text',windows_read))
  self.enterContext(patch.object(Path,'write_text',windows_write))

 def test_unicode_catalogs(self):
  import combat,abilities,token_assets,json,importlib
  conditions=combat.fresh()['conditions']
  self.assertEqual(len(conditions),28)
  self.assertTrue(any(any(ord(c)>127 for c in x['description']) for x in conditions))
  abilities.catalog.cache_clear()
  self.assertTrue(abilities.catalog())
  self.assertTrue(importlib.reload(token_assets).CATALOG)
  self.assertTrue(json.loads((combat.ROOT/'web/navigation.json').read_text(encoding='utf-8')))
