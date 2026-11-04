"""Build the cumulative CP3 program update, including all 28 token images."""
import json,sys,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'Atlas_V16_CP3_28Tokens.zip'
allowed={'.py','.bat','.md','.txt','.json','.js','.mjs','.cjs','.css','.html'}
files=[*root.glob('*.py'),*root.glob('*.bat'),root/'README.md',root/'requirements.txt']
for folder in ('web','docs','tests','legacy'):
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and p.suffix in allowed and '__pycache__' not in p.parts and not any(x.startswith('.') for x in p.relative_to(root).parts))
catalog=json.loads((root/'web/tokens/catalog.json').read_text(encoding='utf-8'))
assert len(catalog)==28
for item in catalog:
 image=root/'web'/item['image'].lstrip('/')
 assert image.is_file(),image
 files.append(image)
files=sorted(set(p for p in files if p.is_file()))
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 z.writestr('LEIA_PRIMEIRO.txt','Atlas V16 CP3 — atualização cumulativa do programa e 28 tokens.\nRequer sua instalação existente com mapas e documentos.\nFeche o servidor e faça backup de data/. Mescle atlas-local na instalação, substituindo os arquivos do programa. Preserve data/ e campaign/. Reinicie e use Ctrl+F5 no navegador.\nDetalhes: atlas-local/docs/ATUALIZACAO_V16_CP3.md\n')
 for p in files:z.write(p,'atlas-local/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(out) as z:assert z.testzip() is None
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'files':len(files),'tokens':len(catalog)}))
