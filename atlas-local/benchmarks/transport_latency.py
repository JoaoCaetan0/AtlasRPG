"""Isolated two-client loopback benchmark; not a Radmin/browser latency claim."""
import sys,json,time,statistics,math
from pathlib import Path
sys.path[:0]=[str(Path(__file__).resolve().parents[1]),str(Path(__file__).resolve().parents[1]/'tests')]
from test_websocket_transport import WebSocketTransport

def stats(values):
 ordered=sorted(values)
 return {'samples':len(values),'median_ms':round(statistics.median(values),3),'p95_ms':round(ordered[math.ceil(.95*len(ordered))-1],3),'max_ms':round(max(values),3)}
f=WebSocketTransport();f.setUp()
try:
 f.setup_vision();f.gm.call('scene',f.args)
 timings=[];payloads=[];connects=[]
 with f.socket(f.gm) as gm,f.socket(f.player) as player:
  f.receive(gm,'change');f.receive(player,'change')
  for i in range(30):
   angle=(i*11)%360;start=time.perf_counter()
   result=f.command(gm,'token-preview',{**f.args,'token_id':'front','direction':angle},str(i));assert result['ok'],result
   while True:
    packets=f.receive(player,'token-preview')
    if any(t['token_id']=='front' and t['direction']==angle for t in packets):break
   timings.append((time.perf_counter()-start)*1000);payloads.append(len(json.dumps(packets).encode()))
 for i in range(5):
  start=time.perf_counter()
  with f.socket(f.player) as player:f.receive(player,'change')
  connects.append((time.perf_counter()-start)*1000)
 print(json.dumps({'environment':'same-host loopback, synthetic small map, fog enabled, 2 authorized clients','preview_send_ack_and_delivery':stats(timings),'preview_payload_json_bytes':{'min':min(payloads),'max':max(payloads)},'connect_initial_state_and_close':stats(connects),'limitations':['No browser render/decode measured','No Radmin/network measurement','No before-after transport speedup asserted']},indent=2))
finally:f.tearDown()
