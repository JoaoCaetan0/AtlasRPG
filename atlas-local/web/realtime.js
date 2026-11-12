// Persistent duplex channel, with SSE/HTTP recovery. Never replay uncertain writes.
let atlasLastChange=null,atlasEvents=null,atlasEventTimer=null,atlasRealtimeTable=null;
let atlasSocket=null,atlasReconnect=null,atlasConnectTimer=null,atlasTransportGeneration=0,atlasRequestId=0;
const atlasPending=new Map();
const atlasSocketCommands=new Set(['token-preview','token-facing','combat-move','combat','combat-undo','combat-redo','scene','scene-navigate','scene-previous','scene-period','chat','roll','scene-preload','scene-preload-ready']);
function realtimeLabel(){return atlasSocket?.readyState===1?'WebSocket':atlasEvents?.readyState===1?'SSE':'reconectando';}
function updateTransport(){const node=document.querySelector('#sync-status');if(node)node.title='Conexão: '+realtimeLabel();document.body.dataset.transport=realtimeLabel();}
function rejectPending(){for(const item of atlasPending.values()){clearTimeout(item.timer);item.reject(Error('Conexão interrompida. Confira o resultado antes de repetir a ação.'));}atlasPending.clear();}
function stopRealtime(){
 ++atlasTransportGeneration;clearTimeout(atlasReconnect);clearTimeout(atlasConnectTimer);clearInterval(atlasEventTimer);
 atlasEvents?.close();atlasEvents=null;const ws=atlasSocket;atlasSocket=null;ws?.close();rejectPending();atlasRealtimeTable=null;
}
function socketRequest(path,data){
 if(!atlasSocketCommands.has(path)||data?.table_id!==atlasRealtimeTable||atlasSocket?.readyState!==1)return null;
 if(atlasSocket.bufferedAmount>65536||atlasPending.size>=32)return Promise.reject(Error('Conexão ocupada. Aguarde a sincronização.'));
 const id=String(++atlasRequestId),body=JSON.stringify({id,path,data});
 if(new TextEncoder().encode(body).length>65536)return null;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{atlasPending.delete(id);reject(Error('Confirmação não recebida. Confira o resultado antes de repetir.'));},path==='token-preview'?1500:10000);
  atlasPending.set(id,{resolve,reject,timer});
  try{atlasSocket.send(body);}catch(error){clearTimeout(timer);atlasPending.delete(id);reject(error);}
 });
}
function startRealtime(tid){
 stopRealtime();atlasLastChange=null;atlasRealtimeTable=tid;const generation=atlasTransportGeneration;
 let connected=false,retry=1000;const prepared=new Set(),images=new Map();
 const current=()=>generation===atlasTransportGeneration&&active?.id===tid;
 const notify=detail=>{if(current()){atlasLastChange=detail;window.dispatchEvent(new CustomEvent('atlas-change',{detail}));}};
 async function receive(type,payload){
  if(!current())return;
  if(type==='change'){notify(payload);return;}
  if(type==='token-preview'){window.dispatchEvent(new CustomEvent('atlas-token-preview',{detail:payload}));return;}
  if(type==='revoked'){stopRealtime();notice.textContent='Sessão encerrada ou acesso à mesa removido.';return;}
  if(type==='result'){
   const request=atlasPending.get(payload.id);if(!request)return;
   atlasPending.delete(payload.id);clearTimeout(request.timer);
   if(payload.ok)request.resolve(payload.result);else request.reject(Error(payload.error||'Ação recusada.'));
   return;
  }
  if(type!=='preload')return;
  try{
   const p=payload;
   if(isMaster())document.querySelectorAll('[data-preload-status]').forEach(n=>{if(n.dataset.assetId===p.asset_id)n.textContent=`Preparação: ${p.ready||0} participantes prontos`;});
   if(prepared.has(p.id))return;prepared.add(p.id);
   const img=new Image();img.src='/api/asset?table_id='+encodeURIComponent(tid)+'&id='+encodeURIComponent(p.asset_id)+'&display=1';
   await img.decode();if(!current())return;
   images.set(p.id,img);if(images.size>3)images.delete(images.keys().next().value);
   await api('scene-preload-ready',{table_id:tid,ticket:p.id});
  }catch{}
 }
 function fallback(){
  if(!current()||atlasEvents)return;
  const source=new EventSource('/api/events?table_id='+encodeURIComponent(tid));atlasEvents=source;
  source.onopen=()=>{if(current()){connected=true;updateTransport();}};
  source.onerror=()=>{if(current()){connected=false;updateTransport();}};
  for(const type of ['change','token-preview','preload','revoked'])source.addEventListener(type,e=>{try{receive(type,JSON.parse(e.data));}catch{}});
 }
 function connect(){
  if(!current())return;
  let ws;
  try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/api/socket?table_id='+encodeURIComponent(tid));}
  catch{fallback();atlasReconnect=setTimeout(connect,10000);return;}
  atlasSocket=ws;
  atlasConnectTimer=setTimeout(()=>{if(current()&&ws.readyState!==1){fallback();ws.close();}},2500);
  ws.onopen=()=>{if(!current()){ws.close();return;}clearTimeout(atlasConnectTimer);atlasEvents?.close();atlasEvents=null;connected=true;retry=1000;updateTransport();};
  ws.onmessage=e=>{try{const message=JSON.parse(e.data);receive(message.type,message.data);}catch{}};
  ws.onerror=()=>{};
  ws.onclose=()=>{if(!current()||atlasSocket!==ws)return;clearTimeout(atlasConnectTimer);atlasSocket=null;rejectPending();connected=false;fallback();updateTransport();atlasReconnect=setTimeout(connect,retry);retry=Math.min(30000,retry*2);};
 }
 connect();
 atlasEventTimer=setInterval(()=>{if(!current()||!document.body.classList.contains('in-workspace')){if(current())stopRealtime();return;}if(!connected)notify({fallback:Date.now()});},2000);
}
function watchTable(root,callback,topics=['scene','combat']){
 let last='',pending=false,again=false,disposed=false;
 async function run(){if(disposed||!root.isConnected)return;if(pending){again=true;return;}pending=true;try{await callback();}catch(e){if(root.isConnected)showFeedback(e.message,"error");}finally{pending=false;if(again){again=false;queueMicrotask(run);}}}
 const listener=e=>{if(!root.isConnected){dispose();return;}const d=e.detail,key=JSON.stringify(topics.map(k=>d[k]??d.fallback));if(last===key)return;last=key;run();};
 function dispose(){disposed=true;window.removeEventListener('atlas-change',listener);observer.disconnect();}
 const observer=new MutationObserver(()=>{if(!root.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('atlas-change',listener);if(atlasLastChange){const snapshot=atlasLastChange;queueMicrotask(()=>listener({detail:snapshot}));}return dispose;
}

function rotationSender(table,asset){
 let pending=null,inflight=null,last=0,timer=null;
 async function pump(){
  clearTimeout(timer);timer=null;
  if(inflight||!pending)return;
  const wait=50-(performance.now()-last);
  if(wait>0){timer=setTimeout(pump,wait);return;}
  const p=pending;pending=null;last=performance.now();
  inflight=api('token-preview',{table_id:table,asset_id:asset,...p}).catch(()=>{});
  await inflight;inflight=null;if(pending)pump();
 }
 return {send(token_id,direction){pending={token_id,direction};pump();},async drain(){clearTimeout(timer);pending=null;if(inflight)await inflight;},cancel(){clearTimeout(timer);pending=null;}};
}
