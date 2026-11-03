"""Pacotes ZIP independentes: extraia todos na mesma pasta. Nunca inclui data/."""
import hashlib,json,sys,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'entrega-v14-2'
out.mkdir(exist_ok=True,parents=True)
files=[*root.glob('*.py'),*root.glob('*.bat'),root/'README.md',root/'requirements.txt',root/'.gitignore']
for folder in ['web','docs','tests','legacy','campaign']:
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and not any(part.startswith('.') for part in p.relative_to(root).parts))
files=sorted(set(p for p in files if p.is_file()))
manifest=json.loads((root/'campaign/manifest.json').read_text(encoding='utf-8'))
for a in manifest['assets']:
 p=root/'campaign/blobs'/a['digest']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==a['digest'],a['name']
art_report=json.loads((root/'docs/TOKENS_V08_VERIFICACAO.json').read_text(encoding='utf-8'))
for item in art_report:
 p=root/'web/tokens'/(item['id']+'.png')
 assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],item['id']
parts=[[],[],[]];sizes=[0,0,0]
for p in files:
 if 'campaign' not in p.relative_to(root).parts:parts[0].append(p);sizes[0]+=p.stat().st_size
for p in sorted((p for p in files if 'campaign' in p.relative_to(root).parts),key=lambda p:p.stat().st_size,reverse=True):
 i=sizes.index(min(sizes));parts[i].append(p);sizes[i]+=p.stat().st_size
seen=set();report=[]
for i,paths in enumerate(parts,1):
 dest=out/f'Atlas_Estigma_V14_2_Parte_{i}.zip'
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  z.writestr('LEIA_PRIMEIRO.txt','Atlas V14.2: extraia os TRES ZIPs na MESMA pasta, mesclando atlas-local.\nSao ZIPs normais: nao renomeie e nao concatene.\nDepois leia atlas-local/docs/CORRECAO_14_2.md.\nAtualizacao existente: preserve data/ e faca backup antes.\n')
  for p in sorted(paths):
   name='atlas-local/'+p.relative_to(root).as_posix();assert name not in seen;seen.add(name);z.write(p,name)
 with zipfile.ZipFile(dest) as z:assert z.testzip() is None
 report.append({'name':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'files':len(paths)})
assert len(seen)==len(files)
(out/'VERIFICACAO.json').write_text(json.dumps({'packages':report,'source_files':len(files),'campaign_assets':len(manifest['assets']),'campaign_hashes':'all verified','builtin_tokens':len(art_report),'token_hashes':'all verified'},indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
