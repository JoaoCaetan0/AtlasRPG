import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function setup(){
 const sockets=[],sources=[];
 class WebSocket{constructor(){this.readyState=0;this.bufferedAmount=0;this.sent=[];sockets.push(this);}send(x){this.sent.push(JSON.parse(x));}close(){this.readyState=3;this.onclose?.();}open(){this.readyState=1;this.onopen?.();}message(type,data){this.onmessage?.({data:JSON.stringify({type,data})});}}
 class EventSource{constructor(){this.readyState=0;sources.push(this);}close(){this.readyState=2;}addEventListener(){}}
 const context=vm.createContext({WebSocket,EventSource,active:{id:'table'},location:{protocol:'http:',host:'localhost:8765'},document:{querySelector:()=>null,querySelectorAll:()=>[],body:{dataset:{},classList:{contains:()=>true}}},window:{dispatchEvent(){}},CustomEvent:class{},notice:{textContent:''},isMaster:()=>false,TextEncoder,performance,setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask});
 vm.runInContext(fs.readFileSync(new URL('../web/realtime.js',import.meta.url),'utf8'),context);
 return {context,sockets,sources,run:s=>vm.runInContext(s,context)};
}
test('WebSocket confirms commands and keeps HTTP fallback for unsupported or closed transport',async()=>{
 const x=setup();try{x.run("startRealtime('table')");assert.equal(x.run("socketRequest('chat',{table_id:'table'})"),null);x.sockets[0].open();
 const pending=x.run("socketRequest('chat',{table_id:'table',body:'Hello'})");const msg=x.sockets[0].sent[0];assert.equal(msg.path,'chat');x.sockets[0].message('result',{id:msg.id,ok:true,result:{saved:true}});assert.equal((await pending).saved,true);
 assert.equal(x.run("socketRequest('upload',{table_id:'table'})"),null);
 }finally{x.run('stopRealtime()');}
});
test('Disconnected writes are rejected and not replayed through fallback',async()=>{
 const x=setup();try{x.run("startRealtime('table')");x.sockets[0].open();const pending=x.run("socketRequest('roll',{table_id:'table'})");x.sockets[0].close();await assert.rejects(pending,/interrompida/);assert.equal(x.sockets[0].sent.length,1);assert.equal(x.sources.length,1);
 }finally{x.run('stopRealtime()');}
});
test('Backpressure rejects previews instead of building an old movement queue',async()=>{
 const x=setup();try{x.run("startRealtime('table')");x.sockets[0].open();x.sockets[0].bufferedAmount=70000;await assert.rejects(x.run("socketRequest('token-preview',{table_id:'table'})"),/ocupada/);assert.equal(x.sockets[0].sent.length,0);
 }finally{x.run('stopRealtime()');}
});
