"""Reconstrói o conteúdo distribuível a partir dos quatro arquivos originais."""
import argparse, hashlib, json, re, zipfile
from pathlib import Path, PurePosixPath
from html.parser import HTMLParser
from assets import MIMES, canonical

class PlainText(HTMLParser):
 def __init__(self): super().__init__(); self.parts=[]; self.hidden=0
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style'): self.hidden+=1
  if tag in ('p','div','br','h1','h2','h3','li','tr'): self.parts.append('\n')
 def handle_endtag(self,tag):
  if tag in ('script','style'): self.hidden=max(0,self.hidden-1)
  if tag in ('p','div','h1','h2','h3','li','tr'): self.parts.append('\n')
 def handle_data(self,data):
  if not self.hidden:self.parts.append(data)

def build(sources,root):
 names=['Mapas_Estigma_do_Caos_COM_EDITOR_V2.zip','Mapas_Estigma_do_Caos_PARTE_2.zip','A_Ferida_que_Caminha_Materiais_da_Sessao.zip','Estigma_do_Caos_Ficha_Editavel_corrigida.pdf']
 paths=[]
 for name in names:
  found=list(sources.rglob(name))
  if len(found)!=1:raise ValueError('Esperado um arquivo: '+name)
  paths.append(found[0])
 out=root/'campaign'; blobs=out/'blobs';blobs.mkdir(parents=True,exist_ok=True);assets={}
 with zipfile.ZipFile(paths[2]) as z: index={x['code']:x for x in json.loads(z.read('A_Ferida_que_Caminha_Materiais/Mestre/indice_documentos.json'))}
 def add(source,body):
  digest=hashlib.sha256(body).hexdigest(); dest=blobs/digest
  if not dest.exists():dest.write_bytes(body)
  p=PurePosixPath(source);a={'source':source,'name':p.name,'mime':MIMES[p.suffix.lower()],'digest':digest,'size':len(body),'folder':str(p.parent)}
  m=re.search(r'Documento_(\d+)',p.name)
  if m and m[1] in index:
   entry=index[m[1]];a.update(title=entry['title']+p.suffix,folder=entry['where'])
  if source in assets and assets[source]['digest']!=digest:raise ValueError('Fonte divergente: '+source)
  assets[source]=a
 with zipfile.ZipFile(out/'arquivo_historico.zip','w',zipfile.ZIP_DEFLATED) as history:
  for path in paths:
   if path.suffix!='.zip':add(path.name,path.read_bytes());continue
   with zipfile.ZipFile(path) as z:
    for item in z.infolist():
     if item.is_dir():continue
     source=canonical(item.filename);p=PurePosixPath(source)
     if '..' in p.parts or source.startswith('/') or ':' in source:raise ValueError('Caminho inválido')
     body=z.read(item)
     if p.suffix.lower() in MIMES:add(source,body)
     else:
      history.writestr(path.stem+'/'+source,body)
      if path==paths[2] and p.suffix.lower()=='.html':
       parser=PlainText();parser.feed(body.decode('utf-8-sig'));plain=re.sub(r'\n[ \t]*\n+', '\n\n', ''.join(parser.parts)).strip()
       add(str(p)+'.txt',plain.encode())
 (out/'manifest.json').write_text(json.dumps({'schema':1,'assets':list(assets.values())},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'files':len(assets),'blobs':len(list(blobs.iterdir()))}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);a=p.parse_args();build(a.sources,Path(__file__).resolve().parent)
