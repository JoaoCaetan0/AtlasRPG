"""Bounded transactional undo/redo. Only GMs receive metadata or restore states."""
import json

LIMIT = 40

def install(c):
    c.execute('''CREATE TABLE IF NOT EXISTS combat_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT, table_id TEXT, asset_id TEXT,
        before_state TEXT NOT NULL, after_state TEXT NOT NULL,
        label TEXT NOT NULL, actor TEXT NOT NULL, undone INTEGER NOT NULL DEFAULT 0)''')
    c.execute('CREATE INDEX IF NOT EXISTS combat_history_scene ON combat_history(table_id,asset_id,id)')

def describe(before, after):
    old={t['id']:t for t in before['tokens']};new={t['id']:t for t in after['tokens']}
    added=new.keys()-old.keys();removed=old.keys()-new.keys()
    if added:return 'Inserir '+str(len(added))+' token(s)'
    if removed:return 'Remover '+str(len(removed))+' token(s)'
    if before.get('active')!=after.get('active') or before.get('round')!=after.get('round'):
        return 'Alterar turno/rodada'
    for key in sorted(old.keys() & new.keys()):
        a,b=old[key],new[key]
        if a!=b:
            if a.get('dead',False)!=b.get('dead',False):return ('Marcar morto: ' if b.get('dead') else 'Remover marca de morto: ')+b['name']
            if a['effects']!=b['effects']:return 'Condições de '+b['name']
            if (a['q'],a['r'])!=(b['q'],b['r']):return 'Mover '+b['name']
            return 'Editar '+b['name']
    for key,label in [('entries','Editar iniciativa'),('active','Alterar turno'),('round','Alterar rodada'),('terrain','Pintar terreno'),('grid','Configurar grade'),('conditions','Editar condições'),('enabled','Ativar/desativar combate'),('enforce','Limitar movimento')]:
        if before.get(key)!=after.get(key):return label
    return 'Atualizar combate'

def record(c,tid,aid,before,after,actor):
    if before==after:return
    c.execute('DELETE FROM combat_history WHERE table_id=? AND asset_id=? AND undone=1',(tid,aid))
    c.execute('INSERT INTO combat_history(table_id,asset_id,before_state,after_state,label,actor) VALUES(?,?,?,?,?,?)',
              (tid,aid,json.dumps(before),json.dumps(after),describe(before,after),actor))
    c.execute('''DELETE FROM combat_history WHERE table_id=? AND asset_id=? AND id NOT IN
                 (SELECT id FROM combat_history WHERE table_id=? AND asset_id=? ORDER BY id DESC LIMIT ?)''',
              (tid,aid,tid,aid,LIMIT))

def candidate(c,tid,aid,redo):
    return c.execute('SELECT * FROM combat_history WHERE table_id=? AND asset_id=? AND undone=? ORDER BY id '+('ASC' if redo else 'DESC')+' LIMIT 1',
                     (tid,aid,int(redo))).fetchone()

def metadata(c,tid,aid):
    result={'limit':LIMIT}
    for key,redo in [('undo',False),('redo',True)]:
        row=candidate(c,tid,aid,redo)
        if row:
            author=c.execute('SELECT name FROM users WHERE id=?',(row['actor'],)).fetchone()
            result[key]={'label':row['label'],'actor':row['actor'],'author':author[0] if author else 'Participante removido'}
        else:result[key]=None
    return result

def restore(c,tid,aid,state,redo,require):
    row=candidate(c,tid,aid,redo)
    require(row is not None,409,'Nenhuma ação disponível para '+('refazer.' if redo else 'desfazer.'))
    expected=json.loads(row['before_state'] if redo else row['after_state'])
    from token_characters import hydrate
    from combat import compatible
    compatible(expected,c,tid,require)
    hydrate(c,tid,expected)
    require(state==expected,409,'O histórico não corresponde ao estado atual. Nenhuma alteração foi aplicada.')
    target=json.loads(row['after_state'] if redo else row['before_state'])
    compatible(target,c,tid,require)
    c.execute('UPDATE combat_history SET undone=? WHERE id=?',(0 if redo else 1,row['id']))
    return target
