"""Atlas local: checkpoint de desenvolvimento, não publicar sem revisão remota."""
import hashlib, hmac, json, os, secrets, sqlite3, time, shutil, traceback
from contextlib import closing
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalog import import_catalog
from campaign import create_campaign
from assets import install, permitted
from features import route as feature_route, Binary
from network import bind_address, valid_request
from request_security import body_size,strict_json,request_limit
import threading
from collections import defaultdict,deque
ATTEMPTS=defaultdict(deque)
ATTEMPTS_LOCK=threading.Lock()
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('ATLAS_DATA', ROOT / 'data'))

def db():
    DATA.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DATA / 'atlas.sqlite3', timeout=10)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c

def init():
    with closing(db()) as c, c:
        c.execute('PRAGMA journal_mode=WAL')
        if c.execute('PRAGMA user_version').fetchone()[0]>14:raise RuntimeError('Banco de versão mais nova; use a atualização correspondente.')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER);
        CREATE TABLE IF NOT EXISTS tables(id TEXT PRIMARY KEY,name TEXT,synopsis TEXT,system TEXT);
        CREATE TABLE IF NOT EXISTS members(table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),role TEXT CHECK(role IN ('owner','gm','player')),PRIMARY KEY(table_id,user_id));
        CREATE TABLE IF NOT EXISTS invites(code TEXT PRIMARY KEY,table_id TEXT REFERENCES tables(id),expires INTEGER);
        CREATE TABLE IF NOT EXISTS notes(table_id TEXT,user_id TEXT,body TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(table_id,user_id),FOREIGN KEY(table_id,user_id) REFERENCES members(table_id,user_id));
        CREATE TABLE IF NOT EXISTS bans(table_id TEXT REFERENCES tables(id),user_id TEXT REFERENCES users(id),PRIMARY KEY(table_id,user_id));
        CREATE TABLE IF NOT EXISTS maps(table_id TEXT REFERENCES tables(id),legacy_id TEXT,title TEXT,metadata TEXT,visible INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(table_id,legacy_id));
        CREATE TABLE IF NOT EXISTS note_history(table_id TEXT,user_id TEXT,revision INTEGER,body TEXT,editor TEXT,changed INTEGER,PRIMARY KEY(table_id,user_id,revision));
        PRAGMA user_version=14;
        ''')
        install(c)

def password(value,salt):
    return hashlib.scrypt(value.encode(),salt=bytes.fromhex(salt),n=16384,r=8,p=1).hex()

def uid(): return secrets.token_hex(16)
class Failure(Exception):
    def __init__(self,status,message): self.status,self.message=status,message

def require(ok,status=403,message='Sem permissão.'):
    if not ok: raise Failure(status,message)

class Handler(BaseHTTPRequestHandler):
    server_version='Atlas'
    sys_version=''
    def setup(self):
        super().setup()
        self.connection.settimeout(15)
    def end_headers(self):
        self.send_header('Referrer-Policy','no-referrer')
        if getattr(self,'route_ms',None) is not None:self.send_header('Server-Timing',f'app;dur={self.route_ms:.2f}')
        super().end_headers()
    def log_message(self,*args): pass
    def send(self,status,payload,cookie=None):
        data=json.dumps(payload,ensure_ascii=False,allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if cookie: self.send_header('Set-Cookie',cookie)
        self.end_headers();self.wfile.write(data)
    def do_GET(self): self.handle_request()
    def do_POST(self): self.handle_request()
    def handle_request(self):
        self.route_ms=None
        if urlsplit(self.path).path=='/api/socket':
            self.protocol_version='HTTP/1.1';self.close_connection=True
        try:
            require(valid_request(self.headers,self.server.server_address),403,'Endereço ou origem não autorizado.')
            static={'/':('index.html','text/html; charset=utf-8'),'/style.css':('style.css','text/css'),'/app.js':('app.js','application/javascript'),'/combat.js':('combat.js','application/javascript'),'/session.js':('session.js','application/javascript'),'/admin.js':('admin.js','application/javascript')}
            for module in ['panel-preferences.js','ui-feedback.js','combat/token-rotation.mjs','realtime.js','npcs.js','combat/token-maker.mjs','dice-visuals.js','combat/token-menu.mjs','system-profiles.js','workspace.js','navigation.js','files.js','participants.js','characters.js','combat/fog.mjs','combat/camera.mjs','combat/condition-icons.mjs','combat/combat-panels.mjs','combat/drawings.mjs','combat/geometry.mjs','combat/renderer.mjs','combat/asset-library.mjs','combat/token-model.mjs']:
                static['/'+module]=(module,'application/javascript')
            from token_assets import static_routes
            static.update(static_routes())
            static_path=urlsplit(self.path).path
            if static_path in static and self.command=='GET':
                filename,mime=static[static_path]
                data=(ROOT/'web'/filename).read_bytes()
                self.send_response(200);self.send_header('Content-Type',mime)
                self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
                self.send_header('X-Frame-Options','DENY');self.end_headers();self.wfile.write(data);return
            require(self.path.startswith('/api/'),404,'Não encontrado.')
            data={}
            if self.command=='POST':
                # Header obrigatório impede submissões simples cross-origin; sem CORS.
                require(self.headers.get('X-Atlas-Request')=='1',403,'Requisição inválida.')
                require(self.headers.get('Content-Type','').startswith('application/json'),415,'Use JSON.')
                try:size=body_size(self.headers,request_limit(self.path))
                except OverflowError:
                    self.close_connection=True
                    raise Failure(413,'Arquivo ou requisição acima do limite permitido para esta ação.')
                except ValueError:raise Failure(400,'Cabeçalhos de tamanho inválidos.')
                raw=self.rfile.read(size);require(len(raw)==size,400,'Requisição incompleta.')
                try:data=strict_json(raw)
                except (ValueError,RecursionError):raise Failure(400,'JSON inválido: confira a estrutura e os números enviados.')
                if self.path in ('/api/login','/api/register'):
                    with ATTEMPTS_LOCK:
                        now=time.monotonic()
                        for ip in list(ATTEMPTS):
                            if not ATTEMPTS[ip] or ATTEMPTS[ip][-1]<now-60:del ATTEMPTS[ip]
                        require(self.client_address[0] in ATTEMPTS or len(ATTEMPTS)<4096,429,'Muitas tentativas. Aguarde um minuto.')
                        bucket=ATTEMPTS[self.client_address[0]]
                        while bucket and bucket[0]<now-60:bucket.popleft()
                        require(len(bucket)<30,429,'Muitas tentativas. Aguarde um minuto.');bucket.append(now)
            route_start=time.perf_counter()
            with closing(db()) as c, c:
                if self.command=='POST' and self.path!='/api/token-preview':c.execute('BEGIN IMMEDIATE')
                result,cookie=self.route(c,data)
            self.route_ms=(time.perf_counter()-route_start)*1000
            from realtime import Stream
            from socket_transport import Socket
            if self.command=='POST':result=self.after_write(data,result)
            if isinstance(result,Socket):
                result.serve(self,db,DATA);return
            if isinstance(result,Stream):
                result.serve(self,db,DATA);return
            if isinstance(result,Binary):
                cacheable=urlsplit(self.path).path=='/api/asset'
                etag='\"'+hashlib.sha256(result.path if isinstance(result.path,bytes) else (str(result.path)+str(result.path.stat().st_mtime_ns)+str(result.path.stat().st_size)).encode()).hexdigest()+'\"'
                if cacheable and self.headers.get('If-None-Match')==etag:
                    self.send_response(304);self.send_header('ETag',etag);self.send_header('Cache-Control','private, no-cache');self.end_headers();return
                self.send_response(200);self.send_header('Content-Type',result.mime)
                if cacheable:self.send_header('ETag',etag)
                self.send_header('Content-Length',str(len(result.path) if isinstance(result.path,bytes) else result.path.stat().st_size))
                self.send_header('Cache-Control','private, no-cache' if cacheable else 'no-store');self.send_header('X-Content-Type-Options','nosniff')
                self.send_header('Content-Security-Policy',"sandbox; default-src 'none'")
                self.end_headers()
                if isinstance(result.path,bytes):self.wfile.write(result.path)
                else:
                    with result.path.open('rb') as f:shutil.copyfileobj(f,self.wfile)
            else:self.send(200,result,cookie)
        except (BrokenPipeError,ConnectionResetError):self.close_connection=True
        except TimeoutError:
            self.close_connection=True
            try:self.send(408,{'error':'Tempo de envio esgotado. Tente novamente.'})
            except OSError:pass
        except Failure as e:self.send(e.status,{'error':e.message})
        except (ValueError,TypeError,KeyError) as e:
            # No request values, cookies or file paths in the user-facing message.
            reference=secrets.token_hex(4)
            frame=traceback.extract_tb(e.__traceback__)[-1]
            print(f'Atlas erro {reference}: {urlsplit(self.path).path} {type(e).__name__} em {Path(frame.filename).name}:{frame.lineno}',file=sys.stderr,flush=True)
            self.send(400,{'error':f'Dados incompatíveis nesta operação. Referência: {reference}. Consulte o terminal do Atlas.'})
        except sqlite3.IntegrityError:self.send(409,{'error':'Registro já existe ou referência inválida.'})
        except Exception:self.send(500,{'error':'Falha interna. Nenhuma operação parcial foi confirmada.'})
    def after_write(self,data,result):
        from realtime import publish
        if self.path=='/api/token-preview':
            from realtime import preview
            preview(data['table_id'],result['preview']);result={'ok':True}
        elif self.path=='/api/scene-preload':
            from realtime import prepare
            result={'id':prepare(data['table_id'],data['asset_id'])}
        elif self.path=='/api/scene-preload-ready':
            from realtime import ready
            ready(data['table_id'],result['user'],data['ticket']);result={'ok':True}
        else:
            from realtime import clear_previews
            clear_previews(data.get('table_id'));publish(data.get('table_id'),self.path)
        return result
    def route(self,c,d):
        path=self.path;post=self.command=='POST'
        if path in ['/api/register','/api/login'] and post:
            require(isinstance(d.get('name'),str),400,'Nome inválido.')
            name=d['name'].strip();pw=d.get('password','')
            require(isinstance(pw,str) and 2<=len(name)<=60 and 10<=len(pw)<=256,400,'Nome: 2–60 caracteres. Senha: 10–256 caracteres.')
            if path.endswith('register'):
                salt=secrets.token_hex(16);user=uid()
                c.execute('INSERT INTO users VALUES(?,?,?,?)',(user,name,salt,password(pw,salt)))
            else:
                row=c.execute('SELECT * FROM users WHERE name=?',(name,)).fetchone()
                require(row and hmac.compare_digest(row['password'],password(pw,row['salt'])),401,'Nome ou senha incorretos.');user=row['id']
            previous=SimpleCookie();previous.load(self.headers.get('Cookie',''))
            if 'atlas' in previous:
                old_token=hashlib.sha256(previous['atlas'].value.encode()).hexdigest()
                c.execute('DELETE FROM sessions WHERE token=?',(old_token,))
            c.execute('DELETE FROM sessions WHERE expires<=?',(int(time.time()),))
            token=secrets.token_urlsafe(32)
            c.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),user,int(time.time())+43200))
            return {'ok':True},f'atlas={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200'
        cookies=SimpleCookie();cookies.load(self.headers.get('Cookie',''))
        raw=cookies['atlas'].value if 'atlas' in cookies else ''
        token=hashlib.sha256(raw.encode()).hexdigest()
        row=c.execute('SELECT u.id,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',(token,time.time())).fetchone()
        require(row,401,'Entre na sua conta.');user=row['id']
        if path=='/api/me':return dict(row),None
        if path=='/api/logout' and post:
            c.execute('DELETE FROM sessions WHERE token=?',(token,));return {'ok':True},'atlas=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'
        if path=='/api/create-estigma' and post:
            key_file=DATA/'host-key.txt'
            expected=key_file.read_text(encoding='utf-8').strip() if key_file.is_file() else ''
            supplied=d.get('host_key','')
            require(isinstance(supplied,str) and expected and hmac.compare_digest(supplied,expected),403,'Informe o código do anfitrião exibido no terminal.')
            require((ROOT/'campaign'/'manifest.json').is_file(),409,'Acervo do Estigma não encontrado (campaign/manifest.json). Esta atualização contém o sistema e os tokens. Restaure a pasta campaign completa da instalação anterior, ao lado de server.py. Se sua mesa já existe, abra-a na lista de mesas; não é necessário prepará-la novamente. Sem o acervo original, crie uma mesa e importe seus arquivos pela Biblioteca.')
            return create_campaign(c,ROOT,DATA,user),None
        if path=='/api/system-presets' and not post:
            from system_profiles import presets
            return presets(),None
        if path=='/api/tables' and not post:
            return [dict(x) for x in c.execute('SELECT t.*,m.role FROM tables t JOIN members m ON t.id=m.table_id WHERE m.user_id=?',(user,))],None
        if path=='/api/tables' and post:
            name=d.get('name','').strip();require(1<=len(name)<=120,400,'Informe o nome da mesa.')
            tid=uid();c.execute('INSERT INTO tables VALUES(?,?,?,?)',(tid,name,str(d.get('synopsis',''))[:4000],str(d.get('system',''))[:120]))
            if 'system_id' in d:
                from system_profiles import initialize
                profile=initialize(c,tid,d['system_id'])
                c.execute('UPDATE tables SET system=? WHERE id=?',(profile['name'],tid))
            c.execute('INSERT INTO members VALUES(?,?,?)',(tid,user,'owner'));return {'id':tid},None
        if path=='/api/join' and post:
            inv=c.execute('SELECT * FROM invites WHERE code=? AND expires>?',(d.get('code','').strip(),time.time())).fetchone()
            require(inv,404,'Convite inválido ou expirado.')
            require(not c.execute('SELECT 1 FROM bans WHERE table_id=? AND user_id=?',(inv['table_id'],user)).fetchone(),403,'Entrada bloqueada pelo mestre.')
            c.execute('INSERT OR IGNORE INTO members VALUES(?,?,?)',(inv['table_id'],user,'player'))
            return {'id':inv['table_id']},None
        tid=d.get('table_id') if post else parse_qs(urlsplit(self.path).query).get('table_id',[''])[0]
        member=c.execute('SELECT role FROM members WHERE table_id=? AND user_id=?',(tid,user)).fetchone()
        require(member);role=member['role'];master=role in ['owner','gm']
        if urlsplit(path).path=='/api/socket' and not post:
            require(self.headers.get('Origin')=='http://'+self.headers['Host'],403,'Origem inválida.')
            try:import websockets
            except ImportError:raise Failure(503,'Instale as dependências da CP12 para ativar WebSocket.')
            from socket_transport import Socket
            return Socket(tid,user,token),None
        if urlsplit(path).path=='/api/events' and not post:
            from realtime import Stream
            return Stream(tid,user,token),None
        if path=='/api/scene-preload' and post:
            require(master)
            asset=permitted(c,tid,d.get('asset_id'),user,master)
            require(asset and asset['mime'].startswith('image/'),404,'Mapa indisponível.')
            return {'ok':True},None
        if path=='/api/scene-preload-ready' and post:
            from realtime import preload_for
            prep=preload_for(c,tid,user,master)
            require(prep and prep['id']==d.get('ticket'),409,'Preparação encerrada.')
            return {'user':user},None
        if path=='/api/token-preview' and post:
            import math
            angle=d.get('direction')
            require(type(angle) in (int,float) and math.isfinite(angle) and 0<=angle<360,400,'Direção inválida.')
            aid=d.get('asset_id');require(isinstance(aid,str),400,'Mapa inválido.')
            scene=c.execute('SELECT asset_id FROM scene WHERE table_id=?',(tid,)).fetchone()
            require(scene and scene[0]==aid,409,'A cena mudou.')
            from realtime import visible_tokens
            t=visible_tokens(c,DATA,tid,aid,user,master).get(d.get('token_id'))
            require(t and (master or t['owner']==user))
            return {'preview':{'asset_id':aid,'token_id':t['id'],'direction':angle,'sender':user}},None
        extra=feature_route(c,DATA,path,d,user,tid,master,require)
        if extra is not NotImplemented:return extra,None
        if path=='/api/import-legacy' and post:
            require(role=='owner');return import_catalog(c,ROOT,tid),None
        if path.startswith('/api/maps?') and not post:
            rows=c.execute('SELECT * FROM maps WHERE table_id=?'+('' if master else ' AND visible=1'),(tid,))
            return [{'id':x['legacy_id'],'title':x['title'],'visible':bool(x['visible']),'metadata':json.loads(x['metadata']) if master else None,'images':[dict(v) for v in c.execute('SELECT period,asset_id FROM map_assets WHERE table_id=? AND legacy_id=?',(tid,x['legacy_id'])) if permitted(c,tid,v['asset_id'],user,master)]} for x in rows],None
        if path=='/api/map-visibility' and post:
            require(master);require(isinstance(d.get('visible'),bool),400,'Visibilidade inválida.')
            c.execute('UPDATE maps SET visible=? WHERE table_id=? AND legacy_id=?',(int(d['visible']),tid,d['id']))
            return {'ok':True},None
        if path=='/api/remove-member' and post:
            require(master);target=d['user_id']
            victim=c.execute('SELECT role FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone()
            require(victim and victim['role']!='owner' and target!=user,400,'Participante inválido ou proprietário protegido.')
            require(role=='owner' or victim['role']=='player')
            if d.get('block',True):c.execute('INSERT OR IGNORE INTO bans VALUES(?,?)',(tid,target))
            old=c.execute('SELECT body,revision FROM notes WHERE table_id=? AND user_id=?',(tid,target)).fetchone()
            if old:c.execute('INSERT OR IGNORE INTO note_history VALUES(?,?,?,?,?,?)',(tid,target,old['revision'],old['body'],user,int(time.time())))
            c.execute('DELETE FROM notes WHERE table_id=? AND user_id=?',(tid,target))
            c.execute('DELETE FROM members WHERE table_id=? AND user_id=?',(tid,target))
            return {'ok':True},None
        if path.startswith('/api/blocked?') and not post:
            require(master)
            return [dict(x) for x in c.execute('SELECT u.id,u.name FROM bans b JOIN users u ON b.user_id=u.id WHERE b.table_id=?',(tid,))],None
        if path=='/api/unblock' and post:
            require(master);c.execute('DELETE FROM bans WHERE table_id=? AND user_id=?',(tid,d['user_id']));return {'ok':True},None
        if path.startswith('/api/members?') and not post:
            return [dict(x) for x in c.execute('SELECT u.id,u.name,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.table_id=?',(tid,))],None
        if path=='/api/invite' and post:
            require(master);code=secrets.token_urlsafe(18)
            c.execute('INSERT INTO invites VALUES(?,?,?)',(code,tid,int(time.time())+604800));return {'code':code},None
        if path=='/api/revoke-invites' and post:
            require(master);c.execute('DELETE FROM invites WHERE table_id=?',(tid,));return {'ok':True},None
        if path=='/api/role' and post:
            require(role=='owner');target=d['user_id'];new=d['role']
            require(new in ['gm','player'] and target!=user,400,'Cargo inválido ou proprietário protegido.')
            c.execute("UPDATE members SET role=? WHERE table_id=? AND user_id=? AND role!='owner'",(new,tid,target));return {'ok':True},None
        if path=='/api/note' and post:
            target=d.get('user_id',user);require(master or target==user)
            require(c.execute('SELECT 1 FROM members WHERE table_id=? AND user_id=?',(tid,target)).fetchone(),404,'Participante não encontrado.')
            note=c.execute('SELECT body,revision FROM notes WHERE table_id=? AND user_id=?',(tid,target)).fetchone()
            old=dict(note) if note else {'body':'','revision':0}
            if not note:
                archived=c.execute('SELECT body,revision FROM note_history WHERE table_id=? AND user_id=? ORDER BY revision DESC LIMIT 1',(tid,target)).fetchone()
                if archived:old=dict(archived)
            if 'body' in d:
                body=d['body'];require(isinstance(body,str) and len(body)<=30000,400,'Nota muito longa.')
                require(d.get('revision')==old['revision'],409,'A nota mudou. Reabra antes de salvar; seu texto permanece na tela.')
                c.execute('INSERT INTO notes VALUES(?,?,?,?) ON CONFLICT(table_id,user_id) DO UPDATE SET body=excluded.body,revision=excluded.revision',(tid,target,body,old['revision']+1))
                c.execute('INSERT INTO note_history VALUES(?,?,?,?,?,?)',(tid,target,old['revision']+1,body,user,int(time.time())))
                old={'body':body,'revision':old['revision']+1}
            return old,None
        raise Failure(404,'Não encontrado.')

if __name__=='__main__':
    init();port=int(os.environ.get('ATLAS_PORT','8765'))
    host=bind_address()
    key_file=DATA/'host-key.txt'
    if not key_file.exists():
        key_file.write_text(secrets.token_urlsafe(24),encoding='utf-8')
        try:key_file.chmod(0o600)
        except OSError:pass
    print('Código do anfitrião para preparar Estigma: '+key_file.read_text(encoding='utf-8').strip(),flush=True)
    print(f'Atlas local/VPN: http://{host}:{port} — Ctrl+C encerra.',flush=True)
    try:
        ThreadingHTTPServer((host,port),Handler).serve_forever()
    except OSError as e:
        raise SystemExit('Não foi possível usar esse IP/porta. Verifique o adaptador e a porta: '+str(e))
