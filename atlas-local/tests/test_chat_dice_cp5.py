import unittest
import test_fog
from test_server import a
from dice import chat_command

class ChatDice(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 def post(self,client,body='/r 2d6+3 | Ataque',rid='chat-test-001',scope='public'):
  return client.call('chat',{'table_id':self.tid,'body':body,'request_id':rid,'scope':scope})
 def feed(self,client):return client.call('chat-events?table_id='+self.tid)[1]
 def test_commands_atomic_retry_and_shared_id(self):
  code,result=self.post(self.player);self.assertEqual(code,200,result)
  code,retry=self.post(self.player);self.assertEqual(retry['id'],result['id']);self.assertTrue(retry['reused'])
  self.assertEqual(self.post(self.player,'/r 3d6')[0],409)
  self.assertEqual(self.post(self.player,'/r bad','invalid-001')[0],400)
  feed=self.feed(self.player);self.assertEqual(len(feed),1);self.assertEqual(feed[0]['label'],'Ataque')
  self.assertEqual(feed[0]['id'],self.player.call('rolls?table_id='+self.tid)[1][0]['id'])
  with a.db() as c:self.assertEqual(c.execute('SELECT count(*) FROM messages').fetchone()[0],0)
 def test_privacy_and_membership(self):
  for i,scope in enumerate(['public','gm','self']):self.assertEqual(self.post(self.gm,rid='scope-test-'+str(i),scope=scope)[0],200)
  self.assertEqual(len(self.feed(self.player)),1);self.assertEqual(len(self.feed(self.gm)),3)
  self.assertEqual(self.other.call('chat-events?table_id='+self.tid)[0],403)
  self.post(self.player,rid='player-private',scope='gm');self.assertEqual(len(self.feed(self.gm)),4)
 def test_cursor_same_second_and_clear(self):
  with a.db() as c:
   for n in range(105):c.execute('INSERT INTO messages(table_id,user_id,body,created) VALUES(?,?,?,?)',(self.tid,self.pid,str(n),100))
  first=self.feed(self.player);self.assertEqual(len(first),100)
  second=self.player.call('chat-events?table_id='+self.tid+'&before='+first[0]['cursor'])[1]
  self.assertEqual(len(second),5);self.assertFalse({x['id'] for x in first}&{x['id'] for x in second})
  self.assertEqual(self.player.call('chat-events?table_id='+self.tid+'&before=bad')[0],400)
  self.post(self.player);self.gm.call('clear-chat',{'table_id':self.tid});self.assertEqual(len(self.feed(self.player)),1)
 def test_detection(self):
  self.assertIsNone(chat_command('d20'));self.assertIsNone(chat_command('/rude hello'))
  self.assertEqual(chat_command(' /ROLL 2d20kh1 | Olhar '),{'expression':'2d20kh1','label':'Olhar'})
  self.assertEqual(self.post(self.player,'/r','empty-roll')[0],400)
