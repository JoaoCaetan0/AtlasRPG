"""Gera pacote de retomada sem banco, credenciais ou diretório Git."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import sys
root=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'Atlas_Local_Checkpoint.zip'
# Lista positiva: futuros uploads ou arquivos pessoais não entram por acidente.
files=[*root.glob('*.py'),*root.glob('*.bat'),root/'README.md',root/'requirements.txt',root/'.gitignore']
for folder in ['web','docs','tests','legacy']:
 files.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and not any(part.startswith('.') for part in p.relative_to(root).parts))
with ZipFile(out,'w',ZIP_DEFLATED) as z:
 for p in sorted(set(files)):
  if p.is_file():z.write(p,Path('atlas-local')/p.relative_to(root))
print(out)
