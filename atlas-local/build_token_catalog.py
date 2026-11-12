"""Integrate generated artwork without changing scene IDs. Idempotent, resumable."""
import json, hashlib
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parent
PLAN=ROOT/'docs/token-art/manifest.json'
def build(require_complete=True):
 rows=json.loads(PLAN.read_text(encoding='utf-8'))
 records={p.stem:json.loads(p.read_text(encoding='utf-8')) for p in (PLAN.parent/'completed').glob('*.json')}
 missing=[];ready=[]
 for row in rows:
  row.update(records.get(row['id'],{}))
  source=Path(row['source']) if row.get('source') else None
  if not source or not source.is_file():
   bundled=ROOT/'web/tokens'/f"{row['id']}.png"
   if bundled.is_file() and row.get('sha256')==hashlib.sha256(bundled.read_bytes()).hexdigest():source=bundled
   else:missing.append(row['id']);continue
  ready.append((row,source))
 if missing and require_complete:raise RuntimeError(f'{len(missing)} images pending: '+', '.join(missing))
 for row,source in ready:
  dest=ROOT/'web/tokens'/f"{row['id']}.png"
  thumb=dest.with_name(row['id']+'.thumb.png')
  with Image.open(source) as im:
   im.load()
   if 'A' not in im.getbands() or im.getchannel('A').getextrema()[0]!=0:raise ValueError(f'No transparent background: {source}')
   # Output size only; preserve artwork, proportions, alpha and color.
   for size,path in [(768,dest),(192,thumb)]:
    sprite=ImageOps.contain(im.convert('RGBA'),(size,size),Image.Resampling.LANCZOS)
    buffer=BytesIO();sprite.save(buffer,format="PNG",optimize=True)
    temporary=path.with_suffix(path.suffix+".tmp");temporary.write_bytes(buffer.getvalue());temporary.replace(path)
    with Image.open(path) as check:check.load()
  row['status']='integrated'
  row['sha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
  row['thumbnail']=f"/tokens/{row['id']}.thumb.png"
 PLAN.with_suffix('.tmp').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
 PLAN.with_suffix('.tmp').replace(PLAN)
 if not missing:
  public=[{k:v for k,v in row.items() if k not in ('prompt','source','status','sha256')} for row in rows]
  dest=ROOT/'web/tokens/catalog.json'
  dest.with_suffix('.tmp').write_text(json.dumps(public,ensure_ascii=False,indent=2),encoding='utf-8')
  dest.with_suffix('.tmp').replace(dest)
 print(json.dumps({'integrated':len(ready),'pending':len(missing)}))
if __name__=='__main__':
 import sys
 build('--partial' not in sys.argv)
