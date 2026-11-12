from datetime import datetime
from pathlib import Path
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
APP = ROOT / 'atlas-local'
PY_FILE = APP / 'characters.py'
JS_FILE = APP / 'web' / 'characters.js'


def replace_once(source: str, before: str, after: str, label: str) -> str:
    count = source.count(before)
    if count != 1:
        raise RuntimeError(f'Não foi possível localizar o ponto de atualização de {label} (ocorrências: {count}). Nenhum arquivo foi alterado.')
    return source.replace(before, after, 1)


def update_python(source: str) -> str:
    if "ep=='/api/character-delete'" in source:
        raise RuntimeError('A exclusão de fichas já parece estar instalada em characters.py.')

    helper = """def detach_character(state,cid):
 changed=False
 if isinstance(state,dict):
  for token in state.get('tokens',[]):
   if isinstance(token,dict) and token.get('character_id')==cid:
    token.pop('character_id',None);token['owner']=None;changed=True
 return changed

"""
    source = replace_once(
        source,
        'def handle(c,data,path,d,user,tid,master,require,Binary):',
        helper + 'def handle(c,data,path,d,user,tid,master,require,Binary):',
        'função de fichas',
    )

    endpoint = """ if ep=='/api/character-delete' and d:
  require(master)
  cid=d.get('id');require(isinstance(cid,str) and 1<=len(cid)<=128,400,'Ficha inválida.')
  ch=c.execute('SELECT id FROM characters WHERE id=? AND table_id=?',(cid,tid)).fetchone()
  require(ch,404,'Ficha não encontrada nesta mesa.')
  for row in c.execute('SELECT asset_id,state FROM combats WHERE table_id=?',(tid,)).fetchall():
   state=json.loads(row['state'])
   if detach_character(state,cid):
    c.execute('UPDATE combats SET state=?,revision=revision+1 WHERE table_id=? AND asset_id=?',(json.dumps(state,ensure_ascii=False),tid,row['asset_id']))
  for row in c.execute('SELECT id,before_state,after_state FROM combat_history WHERE table_id=?',(tid,)).fetchall():
   before=json.loads(row['before_state']);after=json.loads(row['after_state'])
   changed_before=detach_character(before,cid);changed_after=detach_character(after,cid)
   if changed_before or changed_after:
    c.execute('UPDATE combat_history SET before_state=?,after_state=? WHERE id=?',(json.dumps(before,ensure_ascii=False),json.dumps(after,ensure_ascii=False),row['id']))
  c.execute('DELETE FROM characters WHERE id=? AND table_id=?',(cid,tid))
  folder=data/'exports'
  if folder.is_dir():
   for cached in folder.iterdir():
    if cached.is_file() and cached.name.startswith(cid+'-') and cached.suffix.lower()=='.pdf':
     try:cached.unlink()
     except OSError:pass
  return {'ok':True,'id':cid}
"""
    return replace_once(
        source,
        " if ep in ['/api/character','/api/character-pdf']:\n",
        endpoint + " if ep in ['/api/character','/api/character-pdf']:\n",
        'rota de exclusão no servidor',
    )


def update_javascript(source: str) -> str:
    if 'data-delete-character' in source or 'character-delete' in source:
        raise RuntimeError('A exclusão de fichas já parece estar instalada em web/characters.js.')

    source = replace_once(
        source,
        '<button class="roster-sheet" data-character="${r.id}">Abrir ficha</button></div><button class="secondary roster-add"',
        '<button class="roster-sheet" data-character="${r.id}">Abrir ficha</button>${isMaster()?`<button type="button" class="danger roster-delete" data-delete-character="${r.id}">Excluir ficha</button>`:""}</div><button class="secondary roster-add"',
        'botão de exclusão na lista de personagens',
    )

    handler = """  if(isMaster()) document.querySelectorAll('[data-delete-character]').forEach(b=>b.onclick=()=>act(async()=>{
    const character=rows.find(c=>c.id===b.dataset.deleteCharacter);
    if(!character||!confirm(`Excluir definitivamente a ficha "${character.name}"? Tokens vinculados serão desvinculados, mas continuarão no mapa. Esta ação não pode ser desfeita.`))return;
    await api('character-delete',{table_id:active.id,id:character.id});
    await characterView();
    showFeedback(`Ficha "${character.name}" excluída.`);
  }));
"""
    marker = "  document.querySelectorAll('[data-portrait]').forEach(b=>b.onclick=()=>act(()=>chooseCharacterPortrait(rows.find(c=>c.id===b.dataset.portrait))));\n"
    return replace_once(source, marker, handler + marker, 'ação do botão de exclusão')


def main() -> int:
    if not APP.is_dir() or not (APP / 'server.py').is_file():
        print('ERRO: não encontrei atlas-local/server.py. Extraia o ZIP na pasta principal da instalação do Atlas, ao lado da pasta atlas-local.')
        return 2
    if not PY_FILE.is_file() or not JS_FILE.is_file():
        print('ERRO: faltam os arquivos esperados da instalação (characters.py ou web/characters.js).')
        return 2

    try:
        old_py = PY_FILE.read_text(encoding='utf-8')
        old_js = JS_FILE.read_text(encoding='utf-8')
        new_py = update_python(old_py)
        new_js = update_javascript(old_js)
        compile(new_py, str(PY_FILE), 'exec')
    except Exception as exc:
        print(f'ERRO: {exc}')
        print('Nenhum arquivo foi alterado.')
        return 1

    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = ROOT / f'backup_atlas_excluir_fichas_{stamp}'
    (backup / 'atlas-local' / 'web').mkdir(parents=True)
    shutil.copy2(PY_FILE, backup / 'atlas-local' / 'characters.py')
    shutil.copy2(JS_FILE, backup / 'atlas-local' / 'web' / 'characters.js')

    for path, content in ((PY_FILE, new_py), (JS_FILE, new_js)):
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', newline='', dir=path.parent, delete=False) as tmp:
            tmp.write(content)
            temp_path = Path(tmp.name)
        temp_path.replace(path)

    print('ATUALIZAÇÃO CONCLUÍDA.')
    print('Adicionado: botão Excluir ficha (somente mestres), confirmação e exclusão protegida no servidor.')
    print('Tokens associados permanecem no mapa, mas são desvinculados da ficha; o histórico de combate é saneado.')
    print(f'Backup dos arquivos anteriores: {backup}')
    print('Reinicie o Atlas e atualize o navegador com Ctrl+F5.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
