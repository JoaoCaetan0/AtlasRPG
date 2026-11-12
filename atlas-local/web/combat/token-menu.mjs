// A single local popover; keyboard, mouse and touch share the same actions.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function menuPosition(x,y,width,height,vw,vh){return {left:Math.max(8,Math.min(x+10,vw-width-8)),top:Math.max(8,Math.min(y+10,vh-height-8))};}
export function mountTokenMenu({svg,get,master,user,members,select,change,uid,api,refresh,table,asset,edit,visionPanel}){
 const box=document.createElement('section');box.className='token-popover';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-label','Ações do token');document.body.append(box);
 const abort=new AbortController(),on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:abort.signal});
 let id=null,anchor={x:0,y:0},timer=null,origin=null,suppressUntil=0,pending=false,returnFocus=null;
 const token=()=>get().state?.tokens.find(t=>t.id===id);
 function close(){box.hidden=true;id=null;returnFocus?.focus?.({preventScroll:true});}
 function fit(){const p=menuPosition(anchor.x,anchor.y,box.offsetWidth,box.offsetHeight,innerWidth,innerHeight);box.style.left=p.left+'px';box.style.top=p.top+'px';}
 function shell(title,html){box.innerHTML=`<header><button type="button" data-back aria-label="Voltar às ações">‹</button><strong>${esc(title)}</strong><button type="button" data-close aria-label="Fechar">×</button></header><div class="token-popover-body">${html}<p class="token-popover-status" role="status"></p></div>`;box.querySelector('[data-close]').onclick=close;box.querySelector('[data-back]').onclick=home;fit();}
 async function run(fn){if(pending)return;pending=true;const feedback=box.querySelector('.token-popover-status');feedback.textContent='Salvando…';box.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();await refresh();if(box.isConnected&&!box.hidden)home();}catch(e){if(feedback.isConnected)feedback.textContent=e.message;}finally{pending=false;box.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 function home(){const t=token();if(!t){close();return;}const control=master||t.owner===user;
 shell(t.name,`${box.dataset.memoryCleared?'<p role="status">Memória visual limpa. A visão atual permanece ativa.</p>':''}${box.dataset.saved?'<p role="status">Token salvo. Acesse Personagens → Tokens salvos.</p>':''}<div class="token-action-grid">${master?`<button data-action="initiative"><span>⚔</span>Iniciativa</button><button data-action="dead" class="${t.dead?'active':''}"><span>${t.dead?'♡':'✕'}</span>${t.dead?'Reviver':'Marcar morto'}</button>`:''}${control?'<button data-action="resources"><span class="resource-icon">♥ ◆</span>PV e PD</button>':''}${master?'<button data-action="vision"><span>◉</span>Visão</button><button data-action="save"><span>▣</span>Salvar token</button><button data-action="owner"><span>♙</span>Vincular jogador</button><button data-action="edit"><span>⚙</span>Editar token</button>':''}</div>${!control?'<p>Este token é controlado por outro participante.</p>':''}${master?'<button class="token-delete" data-action="delete">⌫ Excluir da cena</button>':''}`);
 box.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
 }
 function action(kind){const t=token();if(!t)return close();
 if(kind==='save')return run(async()=>{await api('saved-tokens',{table_id:table,asset_id:asset,token_id:id});box.dataset.saved='true';});
 if(kind==='dead')return run(()=>change(()=>{token().dead=!token().dead;}));
 if(kind==='edit'){const target=id;close();edit(target);return;}
 if(kind==='vision'&&!master){close();visionPanel();return;}
 if(kind==='delete'){
  shell('Excluir token',`<p>Remover <strong>${esc(t.name)}</strong> e suas entradas de iniciativa? A ficha será preservada. Você pode desfazer no histórico.</p><button class="danger" data-confirm>Excluir da cena</button>`);
  box.querySelector('[data-confirm]').onclick=()=>run(()=>change(()=>{const state=get().state;state.tokens=state.tokens.filter(t=>t.id!==id);state.entries=state.entries.filter(e=>e.token!==id);if(!state.entries.some(e=>e.id===state.active))state.active=null;}));return;
 }
 if(kind==='resources')return resources();
 if(kind==='initiative'){
  shell('Adicionar à iniciativa','<form><label>Valor opcional<input name="value" type="number" min="-10000" max="10000" step="any" placeholder="Sem valor"></label><small>Entra no fim da fila. Pode adicionar novamente.</small><button>Adicionar</button></form>');
  box.querySelector('form').onsubmit=e=>{e.preventDefault();const value=e.target.elements.value.value;run(()=>change(()=>{const t=token();get().state.entries.push({id:uid(),token:t.id,name:t.name,value:value===''?null:+value,hidden:t.hidden,effects:[]});}));};
 } else if(kind==='owner'){
  shell('Quem controla o token',`<form><label>Participante<select name="owner"><option value="">Somente mestres</option>${members.map(m=>`<option value="${esc(m.id)}" ${m.id===t.owner?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><small>Não transfere a ficha nem permite abrir seus dados privados.</small><button>Vincular</button></form>`);
  box.querySelector('form').onsubmit=e=>{e.preventDefault();const owner=e.target.elements.owner.value;run(()=>change(()=>{token().owner=owner||null;token().control_override=true;}));};
 } else if(kind==='vision'){
  const v=t.vision||{};
  shell('Visão do token',`<form><label>Alcance · ${esc(get().state.grid.unit)}<input name="range" type="number" min="0" max="1000" step=".1" value="${v.range??''}" placeholder="Padrão da cena"></label><label>Amplitude · graus<input name="angle" type="number" min="1" max="360" step="any" value="${v.angle??''}" placeholder="Padrão da cena"></label><label>Faixa cinza adicional<input name="gradient" type="number" min="0" max="1000" step=".1" value="${v.gradient??''}" placeholder="Padrão da cena"></label><small>360° dá visão circular. Campos vazios herdam alcance e amplitude da cena.</small><button>Aplicar visão</button></form><button type="button" data-clear-memory class="secondary">Limpar memória visual</button><small>Remove apenas a exploração deste token neste mapa. A visão atual continua ativa.</small>`);
  box.querySelector('[data-clear-memory]').onclick=()=>{
   if(!master||!confirm('Limpar a memória visual deste token neste mapa? O histórico explorado será removido. A visão atual e os outros tokens serão preservados. Áreas lembradas por outro token do mesmo jogador podem continuar cinzas.'))return;
   const target=id;
   run(async()=>{const current=await api(`combat?table_id=${table}&asset_id=${asset}`);await api('token-memory-clear',{table_id:table,asset_id:asset,token_id:target,revision:current.revision});box.dataset.memoryCleared='true';});
  };
  box.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.target.elements,v={range:f.range.value===''?null:+f.range.value,angle:f.angle.value===''?null:+f.angle.value,gradient:f.gradient.value===''?null:+f.gradient.value,direction:t.vision?.direction??270};run(()=>change(()=>{token().vision=v;}));};
 }
 box.querySelector('input,select')?.focus();fit();
 }
 async function resources(){
 const target=id;shell('PV e PD','<p>Carregando recursos…</p>');
 try{
  const r=await api(`token-resources?table_id=${table}&asset_id=${asset}&token_id=${encodeURIComponent(target)}`);
  if(id!==target||box.hidden)return;
  shell('PV e PD',`<form><small>${r.linked?'Sincronizado com a ficha vinculada.':'Recursos próprios deste token.'}</small><small>Preencha Atual e Máximo para exibir cada barra.</small>${['pv','pd'].filter(k=>r.bars[k]).map(k=>{const cfg=r.bars[k];return `<fieldset class="resource-card resource-${k}"><legend>${k==='pv'?'♥ PV':'◆ PD'}</legend><div class="resource-values"><label>Atual<input name="${k}_atual" type="number" step="any" min="-1000000" max="1000000" value="${r.values[k+'_atual']??''}"></label><label>Máximo<input name="${k}_maximo" type="number" step="any" min="0" max="1000000" value="${r.values[k+'_maximo']??''}" ${master?'':'disabled'}></label></div>${`<label class="check-label"><input name="${k}_enabled" type="checkbox" ${cfg.enabled?'checked':''}> Exibir barra</label><label>Visibilidade<select name="${k}_visibility">${[['all','Toda a mesa'],['owner','Mestres e você'],...(master?[['gm','Somente mestres']]:[])].map(([value,label])=>`<option value="${value}" ${(cfg.visibility===value||(!master&&cfg.visibility==='gm'&&value==='owner'))?'selected':''}>${label}</option>`).join('')}</select></label><label class="check-label"><input name="${k}_numbers" type="checkbox" ${cfg.numbers?'checked':''}> Mostrar valores</label>`}</fieldset>`;}).join('')}<button>Salvar recursos</button></form>`);
  box.querySelector('form').onsubmit=e=>{
   e.preventDefault();const f=e.target.elements,values={},bars={};
   for(const k of ['pv','pd'].filter(k=>r.bars[k])){
    for(const suffix of master?['atual','maximo']:['atual']){const input=f[k+'_'+suffix];if(input.value!=='')values[k+'_'+suffix]=+input.value;}
    bars[k]={enabled:f[k+'_enabled'].checked,visibility:f[k+'_visibility'].value,numbers:f[k+'_numbers'].checked};
   }
   run(()=>api('token-resources',{table_id:table,asset_id:asset,token_id:target,revision:r.revision,resource_revision:r.resource_revision,values,bars}));
  };fit();
 }catch(e){if(id===target&&!box.hidden)box.querySelector('.token-popover-status').textContent=e.message;}
 }
 function open(target,x,y){if(pending)return;box.dataset.saved='';box.dataset.memoryCleared='';id=target;select(id);anchor={x,y};returnFocus=document.activeElement;box.hidden=false;home();box.querySelector('button[data-action]')?.focus();}
 on(svg,'contextmenu',e=>{const t=e.target.closest('[data-token]');if(!t)return;e.preventDefault();open(t.dataset.token,e.clientX,e.clientY);});
 on(svg,'pointerdown',e=>{if(e.pointerType==='mouse')return;const t=e.target.closest('[data-token]');if(!t)return;origin={x:e.clientX,y:e.clientY};timer=setTimeout(()=>{suppressUntil=Date.now()+700;open(t.dataset.token,e.clientX,e.clientY);},550);});
 const cancel=()=>{clearTimeout(timer);timer=null;};
 on(svg,'pointermove',e=>{if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>10)cancel();});
 on(svg,'pointerup',cancel);on(svg,'pointercancel',cancel);
 on(svg,'click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 on(svg,'keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){const target=e.target.closest('[data-token]');const ident=target?.dataset.token||get().selected;if(!ident)return;e.preventDefault();const rect=(target||svg).getBoundingClientRect();open(ident,rect.left+rect.width/2,rect.top+rect.height/2);}});
 on(document,'pointerdown',e=>{if(!box.hidden&&!box.contains(e.target))close();});
 on(box,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const items=[...box.querySelectorAll('button,input,select')].filter(el=>!el.disabled);const i=items.indexOf(document.activeElement);if(items.length&&((e.shiftKey&&i===0)||(!e.shiftKey&&i===items.length-1))){e.preventDefault();items[e.shiftKey?items.length-1:0].focus();}}});
 on(window,'resize',()=>{if(!box.hidden)fit();});
 return {destroy(){cancel();abort.abort();box.remove();},update(){if(id&&!token())close();}};
}
