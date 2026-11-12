// User-specific browser preference. Never published to the room or realtime channel.
function normalizePanelOrder(saved, available) {
 const order=Array.isArray(saved)?saved:[];
 return [...new Set([...order.filter(x=>available.includes(x)),...available])];
}
function movePanelOrder(order,id,to) {
 const result=[...order],from=result.indexOf(id);
 if(from<0)return result;
 result.splice(from,1);result.splice(Math.max(0,Math.min(result.length,to)),0,id);return result;
}
function mountPanelPreferences(rail,user) {
 const key='atlas:rail:v1:'+user, buttons=[...rail.querySelectorAll('[data-tab]')],defaults=buttons.map(b=>b.dataset.tab);
 let order=defaults,dragged=null,suppressUntil=0;
 try{order=normalizePanelOrder(JSON.parse(localStorage.getItem(key)),defaults);}catch{}
 const animations=new Map();
 function clearTarget(){buttons.forEach(b=>b.classList.remove('rail-drop','rail-drop-after'));}
 function apply(save=false){
  const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const before=new Map(buttons.map(b=>[b,b.getBoundingClientRect?.()]));
  animations.forEach(a=>a.cancel());animations.clear();
  for(const id of order)rail.append(buttons.find(b=>b.dataset.tab===id));
  if(save&&!reduce)for(const b of buttons){
   const first=before.get(b),last=b.getBoundingClientRect?.();
   if(!first||!last||!b.animate)continue;
   const x=first.left-last.left,y=first.top-last.top;
   if(!x&&!y)continue;
   const animation=b.animate([{translate:`${x}px ${y}px`},{translate:'0 0'}],{duration:210,easing:'cubic-bezier(.2,.8,.2,1)'});
   animations.set(b,animation);animation.onfinish=()=>{if(animations.get(b)===animation)animations.delete(b);};
  }
  if(save)try{localStorage.setItem(key,JSON.stringify(order));}catch{showFeedback('A ordem foi alterada, mas este navegador não permitiu salvar a preferência.','error');}
 }
 function reorder(id,to){order=movePanelOrder(order,id,to);apply(true);}
 apply();
 for(const b of buttons){
  b.draggable=true;
  b.addEventListener('dragstart',e=>{dragged=b.dataset.tab;suppressUntil=Infinity;b.classList.add('rail-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-atlas-panel',dragged);});
  b.addEventListener('dragover',e=>{if(!dragged)return;e.preventDefault();e.dataTransfer.dropEffect='move';clearTarget();if(b.dataset.tab!==dragged){b.classList.add('rail-drop');if(order.indexOf(dragged)<order.indexOf(b.dataset.tab))b.classList.add('rail-drop-after');}});
  b.addEventListener('dragleave',e=>{if(!b.contains?.(e.relatedTarget))b.classList.remove('rail-drop','rail-drop-after');});
  b.addEventListener('drop',e=>{if(!dragged)return;e.preventDefault();e.stopPropagation();reorder(dragged,order.indexOf(b.dataset.tab));clearTarget();});
  b.addEventListener('dragend',()=>{dragged=null;suppressUntil=Date.now()+350;buttons.forEach(x=>x.classList.remove('rail-drop','rail-drop-after','rail-dragging'));});
  b.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  b.addEventListener('keydown',e=>{if(!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();reorder(b.dataset.tab,order.indexOf(b.dataset.tab)+(e.key==='ArrowUp'?-1:1));b.focus();showFeedback('Ordem atualizada.');});
 }
}
