"""Habilidades de origem: catálogo do livro, separado de campos manuais."""
import json,threading
from functools import lru_cache
from pathlib import Path
_font_lock=threading.Lock()
@lru_cache(maxsize=1)
def register_fonts():
 from reportlab.pdfbase import pdfmetrics
 from reportlab.pdfbase.ttfonts import TTFont
 with _font_lock:
  for name,file in [('AtlasSans','DejaVuSans.ttf'),('AtlasBold','DejaVuSans-Bold.ttf')]:
   if name not in pdfmetrics.getRegisteredFontNames():pdfmetrics.registerFont(TTFont(name,str(Path(__file__).parent/'docs/fonts'/file)))
@lru_cache(maxsize=1)
def catalog():
 return json.loads((Path(__file__).parent/'docs/HABILIDADES.json').read_text(encoding='utf-8'))
def selected(fields):
 return [a for a in catalog() if fields.get('raca' if a['kind']=='race' else 'classe')==a['origin']]
def append_pdf(writer,fields,name):
 items=selected(fields)
 if not items:return
 from io import BytesIO
 from xml.sax.saxutils import escape
 from pypdf import PdfReader
 try:
  from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,KeepTogether,PageBreak
  from reportlab.lib.styles import getSampleStyleSheet
  from reportlab.lib import colors
 except ImportError:raise ValueError('Execute INSTALAR_DEPENDENCIAS.bat para exportar o anexo de habilidades.')
 register_fonts();stream=BytesIO();styles=getSampleStyleSheet()
 for style in styles.byName.values():style.fontName='AtlasSans'
 for key in ['Title','Heading1','Heading2']:styles[key].fontName='AtlasBold'
 styles['BodyText'].fontSize=10;styles['BodyText'].leading=14
 story=[Paragraph('Habilidades de origem',styles['Title']),Paragraph(escape(str(fields.get('nome') or name)),styles['Heading2']),Paragraph('Incluídas automaticamente pela raça e classe. Os campos manuais da ficha original permanecem editáveis. Efeitos, custos e escolhas são resolvidos conforme o livro e o mestre.',styles['BodyText']),Spacer(1,14)]
 for kind,title in [('race','Raça'),('class','Classe')]:
  group=[a for a in items if a['kind']==kind]
  if not group:continue
  if kind=='class' and any(a['kind']=='race' for a in items):story.append(PageBreak())
  story.append(Paragraph(escape(title+' · '+group[0]['origin']),styles['Heading1']))
  for a in group:
   story.append(KeepTogether([Paragraph(escape(a['name']+' ('+a['cost']+')'),styles['Heading2']),Paragraph(escape(a['description']),styles['BodyText']),Paragraph(escape(a['source']),styles['Italic']),Spacer(1,8)]))
 def footer(canvas,doc):
  canvas.saveState();canvas.setFont('AtlasSans',9);canvas.setFillColor(colors.HexColor('#555555'));canvas.drawString(42,25,'Estigma do Caos · Habilidades de origem');canvas.drawRightString(553,25,str(doc.page));canvas.restoreState()
 SimpleDocTemplate(stream,pagesize=(595,842),leftMargin=42,rightMargin=42,topMargin=38,bottomMargin=42).build(story,onFirstPage=footer,onLaterPages=footer)
 for page in PdfReader(stream).pages:writer.add_page(page)
