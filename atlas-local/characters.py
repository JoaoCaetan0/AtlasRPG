"""Fichas com campos textuais de PDF AcroForm e controle de versão."""
import json,secrets
import abilities
from rules import catalog,calculate
from urllib.parse import urlsplit,parse_qs

def install(c):
 c.execute('CREATE TABLE IF NOT EXISTS characters(id TEXT PRIMARY KEY,table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),name TEXT,template_id TEXT REFERENCES assets(id),fields TEXT DEFAULT \'{}\',revision INTEGER DEFAULT 0)')
 if 'build' not in {r[1] for r in c.execute('PRAGMA table_info(characters)')}:c.execute("ALTER TABLE characters ADD COLUMN build TEXT DEFAULT '{}'")

def pdf_api():
 try:from pypdf import PdfReader,PdfWriter
 except ImportError:raise ValueError('Instale o suporte PDF: py -3 -m pip install -r requirements.txt')
 return PdfReader,PdfWriter

def schema(c,data,tid,template):
 r=c.execute("SELECT * FROM assets WHERE table_id=? AND id=? AND mime='application/pdf'",(tid,template)).fetchone()
 if not r:raise ValueError('Modelo PDF inválido.')
 Reader,_=pdf_api();reader=Reader(data/'blobs'/r['digest']);fields=reader.get_fields() or {}
 if not fields or len(fields)>1000 or any(str(v.get('/FT'))!='/Tx' for v in fields.values()):raise ValueError('Esta versão aceita PDFs com campos de texto preenchíveis. Imagens e outros tipos de campo precisam de adaptação.')
 return reader,[{'key':k,'label':str(v.get('/TU') or k).replace('_',' '),'multiline':bool(int(v.get('/Ff',0))&4096)} for k,v in fields.items()]

def handle(c,data,path,d,user,tid,master,require,Binary):
 ep=urlsplit(path).path;q=parse_qs(urlsplit(path).query)
 if ep=='/api/character-rules':return catalog()
 if ep=='/api/character-calculate' and d:
  require(isinstance(d.get('fields'),dict),400,'Campos inválidos.');return calculate(d['fields'],d.get('build',{}))
 if ep=='/api/characters' and not d:
  rows=c.execute('SELECT id,name,user_id,revision FROM characters WHERE table_id=?'+('' if master else ' AND user_id=?'),(tid,) if master else (tid,user))
  return [dict(r) for r in rows]
 if ep=='/api/characters' and d:
  require(master);target=d.get('user_id');require(c.execute('SELECT 1 FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone(),400,'Escolha um participante.')
  name=d.get('name','');require(isinstance(name,str) and 1<=len(name.strip())<=120,400,'Nome inválido.')
  schema(c,data,tid,d['template_id']);cid=secrets.token_hex(16)
  c.execute('INSERT INTO characters(id,table_id,user_id,name,template_id) VALUES(?,?,?,?,?)',(cid,tid,target,name.strip(),d['template_id']));return {'id':cid}
 if ep in ['/api/character','/api/character-pdf']:
  cid=d.get('id') if d else q.get('id',[''])[0]
  ch=c.execute('SELECT * FROM characters WHERE id=? AND table_id=?',(cid,tid)).fetchone();require(ch and (master or ch['user_id']==user),404,'Personagem indisponível.')
  reader,defs=schema(c,data,tid,ch['template_id']);fields=json.loads(ch['fields']);build=json.loads(ch['build'])
  if ep=='/api/character-pdf':
   _,Writer=pdf_api();writer=Writer();writer.clone_document_from_reader(reader)
   # O modelo original reutiliza appearance streams entre widgets. Regerar
   # cada campo evita que PV apareça visualmente no PD, mantendo ambos editáveis.
   from pypdf.generic import NameObject,DictionaryObject
   form=writer.root_object['/AcroForm']
   if '/DR' not in form:form[NameObject('/DR')]=DictionaryObject()
   resources=form['/DR']
   if '/Font' not in resources:resources[NameObject('/Font')]=DictionaryObject()
   if '/Helv' not in resources['/Font']:
    font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica'),NameObject('/Encoding'):NameObject('/WinAnsiEncoding')})
    resources['/Font'][NameObject('/Helv')]=writer._add_object(font)
   for page in writer.pages:
    for annotation in page.get('/Annots',[]):
     widget=annotation.get_object()
     if widget.get('/Subtype')=='/Widget':widget.pop('/AP',None)
   values={f['key']:str((reader.get_fields() or {})[f['key']].get('/V','')) for f in defs}
   values.update(fields)
   writer.update_page_form_field_values(None,values,auto_regenerate=False)
   abilities.append_pdf(writer,fields,ch['name'])
   folder=data/'exports';folder.mkdir(exist_ok=True);out=folder/(cid+'-'+str(ch['revision'])+'.pdf')
   writer.write(out);return Binary(out,'application/pdf')
  if 'fields' in d:
   values=d['fields'];require(isinstance(values,dict) and len(values)<=1000,400,'Campos inválidos.')
   allowed={f['key'] for f in defs};require(all(k in allowed and isinstance(v,str) and len(v)<=10000 for k,v in values.items()),400,'Valor ou campo inválido.')
   require(d.get('revision')==ch['revision'],409,'A ficha foi atualizada. Reabra antes de salvar; o rascunho permanece no editor.')
   build=d.get('build',build)
   require(isinstance(build,dict) and len(json.dumps(build))<10000 and type(build.get('auto',False))==bool,400,'Configuração inválida.')
   if build.get('auto'):
    computed=calculate(values,build)
    for k,v in computed['fields'].items():
     if k in allowed:values[k]=v
   c.execute('UPDATE characters SET fields=?,build=?,revision=revision+1 WHERE id=?',(json.dumps(values,ensure_ascii=False),json.dumps(build,ensure_ascii=False),cid));fields=values
  return {'id':cid,'name':ch['name'],'build':build,'fields':fields,'definitions':defs,'abilities':abilities.selected(fields),'revision':ch['revision']+(1 if 'fields' in d else 0)}
 return NotImplemented
