"""Recuperação pelo anfitrião com acesso ao disco. Encerre o servidor primeiro."""
import argparse,getpass,secrets
import server
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--user',required=True);a=p.parse_args()
first=getpass.getpass('Nova senha (mínimo 10 caracteres): ');second=getpass.getpass('Repita: ')
if first!=second or not 10<=len(first)<=256:raise SystemExit('Senhas diferentes ou tamanho inválido.')
server.init()
with server.db() as c:
 row=c.execute('SELECT id FROM users WHERE name=?',(a.user,)).fetchone()
 if not row:raise SystemExit('Conta não encontrada.')
 salt=secrets.token_hex(16);c.execute('UPDATE users SET salt=?,password=? WHERE id=?',(salt,server.password(first,salt),row['id']))
 c.execute('DELETE FROM sessions WHERE user_id=?',(row['id'],))
print('Senha alterada. As sessões anteriores foram encerradas.')
