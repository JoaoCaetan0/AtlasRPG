import base64,json,secrets,time
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from assets import permitted,put
import fog
class Binary:
 def __init__(self,path,mime):self.path,self.mime=path,mime

def scene_map(c,tid,aid):
 context=c.execute('SELECT m.legacy_id,m.period FROM scene_context s JOIN map_assets m ON m.table_id=s.table_id AND m.legacy_id=s.map_id AND m.period=s.period WHERE s.table_id=? AND m.asset_id=?',(tid,aid)).fetchone()
 if context:return context
 matches=c.execute('SELECT legacy_id,period FROM map_assets WHERE table_id=? AND asset_id=?',(tid,aid)).fetchall()
 return matches[0] if len(matches)==1 else None

def route(c,data,path,d,user,tid,master,require):
 from scene_variants import handle as period_handle
 result=period_handle(c,data,path,d,user,tid,master,require)
 if result is not NotImplemented:return result
 from dice import handle as dice_handle
 from admin import handle as admin_handle
 from system_profiles import handle as profile_handle
 from recent_tokens import handle as recent_handle
 for handler in (dice_handle,admin_handle,profile_handle,recent_handle):
  result=handler(c,path,d,user,tid,master,require)
  if result is not NotImplemented:return result
 result=fog.handle(c,data,path,d,user,tid,master,require)
 if result is not NotImplemented:return result
 from combat import handle as combat_handle
 result=combat_handle(c,data,path,d,user,tid,master,require)
 if result is not NotImplemented:return result
 from characters import handle
 result=handle(c,data,path,d,user,tid,master,require,Binary)
 if result is not NotImplemented:return result
 ep=urlsplit(path).path;q=parse_qs(urlsplit(path).query)
 from scene_history import remember as remember_scene, read as previous_scene, restore as restore_scene
 if ep=='/api/scene-previous' and d:
  require(master);return restore_scene(c,tid,d.get('revision'),require)
 if ep=='/api/assets' and not d:
  target=q.get('user_id',[user])[0];require(master or target==user)
  rows=c.execute('SELECT a.*,p.folder,p.label FROM assets a LEFT JOIN placements p ON p.asset_id=a.id AND p.user_id=? WHERE a.table_id=? ORDER BY a.name',(target,tid)).fetchall()
  return [{'id':r['id'],'name':r['name'],'mime':r['mime'],'size':r['size'],'public':bool(r['public']),'folder':r['folder'] or '', 'label':r['label'] or '', 'grants':[x[0] for x in c.execute('SELECT user_id FROM grants WHERE asset_id=?',(r['id'],))] if master else []} for r in rows if (master and target==user) or permitted(c,tid,r['id'],target,False)]
 if ep=='/api/asset' and not d:
  r=permitted(c,tid,q.get('id',[''])[0],user,master);require(r,404,'Arquivo indisponível.')
  p=data/'blobs'/r['digest'];require(p.is_file(),404,'Arquivo ausente. Reimporte a fonte.')
  hidden=fog.read(c,tid,r['digest'])
  if not master and hidden['enabled']:
   return Binary(fog.masked(str(p),hidden['cells']),'image/png')
  return Binary(p,r['mime'])
 if ep=='/api/asset-grants' and d:
  require(master);aid=d['id'];require(permitted(c,tid,aid,user,True),404,'Arquivo ausente.')
  users=d.get('users',[]);require(isinstance(users,list) and len(users)<=100 and all(isinstance(x,str) for x in users),400,'Lista inválida.')
  require(isinstance(d.get('public'),bool),400,'Visibilidade inválida.')
  for target in users:require(c.execute('SELECT 1 FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone(),400,'Participante inválido.')
  c.execute('UPDATE assets SET public=? WHERE id=?',(int(d['public']),aid));c.execute('DELETE FROM grants WHERE asset_id=?',(aid,))
  for target in set(users):c.execute('INSERT INTO grants VALUES(?,?)',(aid,target))
  return {'ok':True}
 if ep=='/api/organize' and d:
  target=d.get('user_id',user);require(master or target==user)
  require(c.execute('SELECT 1 FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone(),404,'Participante ausente.')
  require(permitted(c,tid,d['id'],target,False) or (target==user and master),404,'Arquivo indisponível para o participante.')
  folder=d.get('folder','');label=d.get('label','');require(isinstance(folder,str) and isinstance(label,str) and len(folder)<=200 and len(label)<=200,400,'Texto muito longo.')
  c.execute('INSERT INTO placements VALUES(?,?,?,?) ON CONFLICT(asset_id,user_id) DO UPDATE SET folder=excluded.folder,label=excluded.label',(d['id'],target,folder,label));return {'ok':True}
 if ep=='/api/upload' and d:
  require(master);name=d.get('name','');require(isinstance(name,str) and name==Path(name).name and '\\' not in name and len(name)<200,400,'Nome inválido.')
  body=base64.b64decode(d['content'],validate=True);require(len(body)<=10*1024**2,413,'Máximo de 10 MiB.')
  aid=put(c,data,tid,'Envios/'+secrets.token_hex(8)+'/'+name,body);require(aid,400,'Formato não permitido.');return {'id':aid}
 if ep=='/api/scene-navigate' and d:
  require(master)
  current=c.execute('SELECT asset_id,revision FROM scene WHERE table_id=?',(tid,)).fetchone()
  require(current and d.get('revision')==current['revision'],409,'A cena mudou. Recarregue antes de navegar.')
  origin=scene_map(c,tid,current['asset_id'])
  require(origin,400,'Selecione a cena pela aba Mapas para identificar seus acessos.')
  links=combat_handle(c,data,'/api/navigation?map_id='+origin['legacy_id'],{},user,tid,True,require)
  dest=d.get('map_id');require(any(dest in x['targets'] for x in links),400,'Este acesso não pertence ao mapa atual.')
  images=c.execute('SELECT period,asset_id FROM map_assets WHERE table_id=? AND legacy_id=? ORDER BY period',(tid,dest)).fetchall()
  require(images,400,'O destino não possui imagem vinculada.')
  chosen=next((x for x in images if x['period']==origin['period']),images[0])
  require(permitted(c,tid,chosen['asset_id'],user,True),404,'Imagem indisponível.')
  origin_asset=permitted(c,tid,current['asset_id'],user,True)
  if origin_asset and fog.read(c,tid,origin_asset['digest'])['enabled']:
   fog.cover(c,data,tid,permitted(c,tid,chosen['asset_id'],user,True),require,only_new=True)
  c.execute('UPDATE assets SET public=1 WHERE id=?',(chosen['asset_id'],))
  remember_scene(c,tid,chosen['asset_id'],dest)
  c.execute('UPDATE scene SET asset_id=?,revision=revision+1 WHERE table_id=?',(chosen['asset_id'],tid))
  c.execute('INSERT INTO scene_context VALUES(?,?,?) ON CONFLICT(table_id) DO UPDATE SET map_id=excluded.map_id,period=excluded.period',(tid,dest,chosen['period']))
  return {'ok':True,'period':chosen['period'],'fallback':chosen['period']!=origin['period']}
 if ep=='/api/scene' and not d:
  s=c.execute('SELECT asset_id,revision FROM scene WHERE table_id=?',(tid,)).fetchone()
  aid=s['asset_id'] if s and permitted(c,tid,s['asset_id'],user,master) else None
  m=scene_map(c,tid,aid) if master and aid else None
  from scene_variants import options
  return {'previous':previous_scene(c,tid) if master else None,'asset_id':aid,'revision':s['revision'] if s else 0,'map_id':m['legacy_id'] if m else None,'period':m['period'] if m else None,'periods':options(c,tid,m['legacy_id'],aid) if m else []}
 if ep=='/api/scene' and d:
  require(master);aid=d.get('asset_id')
  if aid:
   r=permitted(c,tid,aid,user,True);require(r and r['mime'].startswith('image/'),400,'Selecione uma imagem.')
   if d.get('fog') is True:fog.cover(c,data,tid,r,require)
   c.execute('UPDATE assets SET public=1 WHERE id=?',(aid,))
  context=None
  if d.get('map_id'):
   context=c.execute('SELECT legacy_id,period FROM map_assets WHERE table_id=? AND legacy_id=? AND asset_id=?',(tid,d['map_id'],aid)).fetchone();require(context,400,'Imagem não pertence ao mapa informado.')
  remember_scene(c,tid,aid,context['legacy_id'] if context else None)
  c.execute('DELETE FROM scene_context WHERE table_id=?',(tid,))
  if context:c.execute('INSERT INTO scene_context VALUES(?,?,?)',(tid,context['legacy_id'],context['period']))
  c.execute('INSERT INTO scene VALUES(?,?,1) ON CONFLICT(table_id) DO UPDATE SET asset_id=excluded.asset_id,revision=scene.revision+1',(tid,aid));return {'ok':True}
 if ep=='/api/chat' and not d:
  before=int(q.get('before',['0'])[0]);require(before>=0,400,'Cursor inválido.')
  sql='SELECT m.id,m.body,m.created,u.name FROM messages m JOIN users u ON m.user_id=u.id WHERE table_id=?'
  args=[tid]
  if before:sql+=' AND m.id<?';args.append(before)
  rows=c.execute(sql+' ORDER BY m.id DESC LIMIT 100',args).fetchall();return [dict(x) for x in reversed(rows)]
 if ep=='/api/chat' and d:
  body=d.get('body','');require(isinstance(body,str) and 1<=len(body.strip())<=4000,400,'Mensagem: 1–4000 caracteres.')
  c.execute('INSERT INTO messages(table_id,user_id,body,created) VALUES(?,?,?,?)',(tid,user,body.strip(),int(time.time())));return {'ok':True}
 if ep=='/api/clear-chat' and d:
  require(master);c.execute('DELETE FROM messages WHERE table_id=?',(tid,));return {'ok':True}
 if ep=='/api/note-history' and d:
  target=d.get('user_id',user);require(master or target==user)
  require(c.execute('SELECT 1 FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone(),404,'Participante ausente.')
  return [dict(x) for x in c.execute('SELECT h.revision,h.body,h.changed,u.name AS editor FROM note_history h LEFT JOIN users u ON u.id=h.editor WHERE table_id=? AND user_id=? ORDER BY revision DESC LIMIT 30',(tid,target))]
 return NotImplemented
