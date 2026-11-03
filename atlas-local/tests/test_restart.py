import os,socket,subprocess,sys,tempfile,time,unittest
from pathlib import Path
from test_server import Client
class Restart(unittest.TestCase):
 def test_process_restart_preserves_session_table_and_note(self):
  with tempfile.TemporaryDirectory() as temp:
   with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
   env={**os.environ,'ATLAS_DATA':temp,'ATLAS_PORT':str(port)}
   def launch():
    p=subprocess.Popen([sys.executable,str(Path(__file__).resolve().parents[1]/'server.py')],env=env,stdout=subprocess.DEVNULL)
    for _ in range(100):
     try:
      with socket.create_connection(('127.0.0.1',port),timeout=.1):return p
     except OSError:time.sleep(.03)
    p.terminate();p.wait();raise RuntimeError('Servidor não iniciou')
   client=Client('http://127.0.0.1:'+str(port));p=launch()
   try:
    self.assertEqual(client.call('register',{'name':'Persistente','password':'senha-reinicio-123'})[0],200)
    tid=client.call('tables',{'name':'Campanha durável'})[1]['id']
    client.call('note',{'table_id':tid,'body':'Pista depois do reinício','revision':0})
    p.terminate();p.wait(timeout=5);p=launch()
    self.assertEqual(client.call('tables')[1][0]['id'],tid)
    self.assertEqual(client.call('note',{'table_id':tid})[1]['body'],'Pista depois do reinício')
   finally:p.terminate();p.wait(timeout=5)
