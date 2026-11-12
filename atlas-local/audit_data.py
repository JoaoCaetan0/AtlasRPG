"""Read-only integrity check. Stop Atlas first for a consistent filesystem snapshot."""
import argparse,hashlib,json,os,re,sqlite3
from pathlib import Path

def audit(directory):
 directory=Path(directory).resolve();database=directory/'atlas.sqlite3'
 if not database.is_file():raise ValueError('Banco não encontrado. Nenhum banco foi criado.')
 errors=[];warnings=[];checked=set()
 with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True) as c:
  c.row_factory=sqlite3.Row
  for row in c.execute('PRAGMA integrity_check'):
   if row[0]!='ok':errors.append({'type':'database_integrity','detail':row[0]})
  for row in c.execute('PRAGMA foreign_key_check'):errors.append({'type':'foreign_key','table':row[0],'rowid':row[1]})
  rows=c.execute('SELECT id,digest,size FROM assets').fetchall()
  for row in rows:
   digest=row['digest']
   if not isinstance(digest,str) or not re.fullmatch('[0-9a-f]{64}',digest):errors.append({'type':'invalid_digest','asset':row['id']});continue
   file=directory/'blobs'/digest
   if not file.is_file() or file.is_symlink():errors.append({'type':'missing_or_symlink_blob','asset':row['id']});continue
   if file.stat().st_size!=row['size']:errors.append({'type':'size_mismatch','asset':row['id']})
   if digest not in checked:
    h=hashlib.sha256()
    with file.open('rb') as f:
     for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    actual=h.hexdigest()
    if actual!=digest:errors.append({'type':'hash_mismatch','digest':digest})
    checked.add(digest)
  for row in c.execute('SELECT s.table_id FROM scene s JOIN assets a ON s.asset_id=a.id WHERE s.table_id!=a.table_id'):errors.append({'type':'scene_cross_table','table':row[0]})
  for row in c.execute('SELECT m.table_id,m.legacy_id FROM map_assets m LEFT JOIN assets a ON m.asset_id=a.id LEFT JOIN maps p ON p.table_id=m.table_id AND p.legacy_id=m.legacy_id WHERE a.id IS NULL OR p.legacy_id IS NULL OR a.table_id!=m.table_id'):errors.append({'type':'map_link','table':row[0],'map':row[1]})
 referenced={row['digest'] for row in rows}
 if (directory/'blobs').is_dir():
  orphans=sum(f.is_file() and f.name not in referenced for f in (directory/'blobs').iterdir())
  if orphans:warnings.append({'type':'unreferenced_files','count':orphans})
 return {'ok':not errors,'assets':len(rows),'blobs_checked':len(checked),'errors':errors,'warnings':warnings,'read_only':True}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data',type=Path,default=Path(os.environ.get('ATLAS_DATA',Path(__file__).parent/'data')));args=p.parse_args()
 try:result=audit(args.data)
 except (ValueError,sqlite3.Error,OSError) as e:result={'ok':False,'read_only':True,'error':str(e)}
 print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if result['ok'] else 1
if __name__=='__main__':raise SystemExit(main())
