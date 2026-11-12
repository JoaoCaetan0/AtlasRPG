import json,time,unittest
import test_fog
import test_token_vision
import fog

class Explorer(unittest.TestCase):
 setUp=test_fog.Fog.setUp
 tearDown=test_fog.Fog.tearDown
 setup_vision=test_token_vision.Vision.setup_vision
 image=test_token_vision.Vision.image
 def test_memory_fringe_hides_objects_and_respects_manual_ceiling(self):
  self.setup_vision()
  initial=self.player.call(self.url)[1]
  gray=initial['fog']['dim_cells'];visible=initial['fog']['cells']
  self.assertIn('1',gray)
  self.assertTrue(all(not(a==b=='1') for a,b in zip(gray,visible)))
  old=self.image(self.player).getpixel((150,128));self.assertEqual(old,(220,80,40))
  self.assertEqual(self.player.call('token-facing',{**self.args,'revision':0,'token_id':'hero','direction':180})[0],200) # Narrow patch safely tolerates an older scene revision.
  later=self.player.call(self.url)[1];pixel=self.image(self.player).getpixel((150,128));self.assertEqual(len(set(pixel)),1)
  self.assertNotIn('front',{t['id'] for t in later['state']['tokens']})
  self.assertEqual(self.gm.call('fog',{**self.args,'revision':2,'action':'hide-all'})[0],200)
  hidden=self.player.call(self.url)[1]['fog'];self.assertNotIn('1',hidden['cells']);self.assertNotIn('1',hidden['dim_cells'])
 def test_push_event_after_commit_and_permissions(self):
  self.assertEqual(self.other.call('events?table_id='+self.tid)[0],403)
  response=self.player.http.open(self.base+'/api/events?table_id='+self.tid,timeout=3)
  try:
   self.assertEqual(response.headers['Content-Type'],'text/event-stream')
   self.assertEqual(response.readline(),b'event: change\n');initial=json.loads(response.readline()[6:]);response.readline()
   started=time.monotonic();self.assertEqual(self.gm.call('chat',{'table_id':self.tid,'body':'Ping'})[0],200)
   self.assertEqual(response.readline(),b'event: change\n');next_event=json.loads(response.readline()[6:]);self.assertGreater(next_event['chat'],initial['chat'])
   self.assertLess(time.monotonic()-started,2)
   self.assertEqual(set(next_event),{'scene','combat','chat','rolls'}) # No message contents or private state in events.
  finally:response.close()
 def test_disabled_memory_and_fringe(self):
  self.setup_vision();current=self.gm.call(self.url)[1];current['state']['vision'].update(gradient=0,exploration=False)
  self.assertEqual(self.gm.call('combat',{**self.args,'revision':1,'state':current['state']})[0],200)
  self.assertEqual(self.player.call(self.url)[1]['fog']['dim_cells'],fog.COVERED)
