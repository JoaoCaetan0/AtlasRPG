"""Importação de metadados legados sem executar JavaScript."""
import json
from pathlib import Path

def legacy_records(root):
    text=(root/'legacy/ABRIR_CATALOGO_V2.html').read_text(encoding='utf-8')
    start=text.index('window.MAPAS = ')+len('window.MAPAS = ')
    records,_=json.JSONDecoder().raw_decode(text[start:])
    if not isinstance(records,list):raise ValueError('Catálogo inválido')
    ids=set()
    for record in records:
        if not isinstance(record,dict) or not record.get('id') or record['id'] in ids:raise ValueError('ID ausente/duplicado')
        ids.add(record['id'])
    return records

def import_catalog(c,root,table_id):
    records=legacy_records(root);added=0
    for r in records:
        added+=c.execute('INSERT OR IGNORE INTO maps(table_id,legacy_id,title,metadata,visible) VALUES(?,?,?,?,0)',(table_id,r['id'],r['title'],json.dumps(r,ensure_ascii=False))).rowcount
    return {'total':len(records),'added':added,'images_imported':0,'message':'Metadados importados. Imagens ainda precisam ser vinculadas; todos os mapas iniciam ocultos.'}
