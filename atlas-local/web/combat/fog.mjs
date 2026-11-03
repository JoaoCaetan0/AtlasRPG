// Manual reveal rectangles in normalized map coordinates; the server owns the mask.
export function mountFog({svg,host,master,send,notify}) {
  const ns='http://www.w3.org/2000/svg';
  let state={enabled:false,cells:'',resolution:128,revision:0},height=700,mode=null,start=null,busy=false,suppress=false,pendingEnabled=null;
  const layer=document.createElementNS(ns,'g');layer.id='fog-layer';layer.style.pointerEvents='none';
  const draft=document.createElementNS(ns,'rect');draft.id='fog-draft';draft.setAttribute('fill','#efc96633');draft.setAttribute('stroke','#efc966');draft.setAttribute('stroke-width','2');draft.style.pointerEvents='none';
  if(master) {
    host.innerHTML='<p>A névoa é compartilhada por todos os jogadores. Arraste no mapa para selecionar uma área. Recolha o painel se precisar de espaço.</p><label class="check-label"><input id="fog-enabled" type="checkbox"> Névoa ativa</label><div class="row"><button id="fog-reveal">Revelar área</button><button id="fog-hide" class="secondary">Ocultar área</button><button id="fog-stop" class="secondary">Concluir seleção</button></div><p id="fog-status" role="status"></p><label class="check-label"><input id="fog-preview" type="checkbox"> Ver a cobertura como jogador</label><div class="row"><button id="fog-undo" class="secondary">Desfazer névoa</button><button id="fog-redo" class="secondary">Refazer névoa</button></div><details><summary>Mapa inteiro</summary><button id="fog-cover-all" class="secondary">Cobrir tudo</button><button id="fog-reveal-all" class="danger">Revelar tudo</button></details><p><small>A cobertura usa uma malha de 128 × 128 áreas. Tokens são ocultados pelo centro. “Ver como jogador” simula a cobertura; não altera suas permissões de mestre.</small></p>';
  }
  const $=s=>host?.querySelector(s);
  function stop(){mode=null;start=null;draft.remove();svg.classList.remove('fog-drawing');svg.closest('.combat-board')?.classList.remove('painting-fog');controls();}
  function controls(){if(!master)return;
    $('#fog-enabled').checked=pendingEnabled??state.enabled;
    host.querySelectorAll('button,input').forEach(el=>el.disabled=busy);
    for(const [id,action] of [['#fog-reveal','reveal'],['#fog-hide','hide']]) {$(id).disabled=busy||!state.enabled;$(id).setAttribute('aria-pressed',String(mode===action));}
    $('#fog-undo').disabled=busy||!state.undo;$('#fog-redo').disabled=busy||!state.redo;
    $('#fog-cover-all').disabled=busy||!state.enabled;$('#fog-reveal-all').disabled=busy||!state.enabled;
    $('#fog-status').textContent=busy?'Salvando…':!state.enabled?'Desativada: a imagem inteira pode ser vista.':mode?`${mode==='reveal'?'Revelar':'Ocultar'}: arraste uma área no mapa. Esc encerra.`:'Ativa · selecione uma ferramenta.';
  }
  function paint(){
    layer.replaceChildren();svg.append(layer);
    if(!state.enabled) return;
    const n=state.resolution,opacity=!master||$('#fog-preview').checked?1:.62;
    // Merge horizontal runs to keep large completely covered areas inexpensive.
    let d='';
    for(let y=0;y<n;y++)for(let x=0;x<n;){if(state.cells[y*n+x]==='1'){x++;continue;}let end=x+1;while(end<n&&state.cells[y*n+end]!=='1')end++;
      d+=`M${x*1000/n},${y*height/n}h${(end-x)*1000/n}v${height/n}h${-(end-x)*1000/n}Z`;x=end;}
    const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('fill','#080c12');path.setAttribute('opacity',opacity);layer.append(path);
    if(start)svg.append(draft);
  }
  async function act(action,rect){if(busy)return;busy=true;controls();try{await send({action,rect,revision:state.revision});}catch(e){notify(e.message);}finally{busy=false;pendingEnabled=null;controls();}}
  if(master){
    $('#fog-enabled').onchange=e=>{const enabled=e.target.checked;if(!enabled&&!confirm('Desativar a névoa e liberar a imagem inteira para os jogadores?')){controls();return;}pendingEnabled=enabled;stop();act(enabled?'enable':'disable');};
    for(const action of ['reveal','hide']) $('#fog-'+action).onclick=()=>{svg.dispatchEvent(new Event('stop-drawing'));mode=action;svg.classList.add('fog-drawing');svg.closest('.combat-board')?.classList.add('painting-fog');controls();svg.focus({preventScroll:true});};
    $('#fog-stop').onclick=stop;$('#fog-preview').onchange=paint;
    $('#fog-undo').onclick=()=>act('undo');$('#fog-redo').onclick=()=>act('redo');
    $('#fog-cover-all').onclick=()=>{if(confirm('Cobrir o mapa inteiro?'))act('hide-all');};
    $('#fog-reveal-all').onclick=()=>{if(confirm('Revelar o mapa inteiro para os jogadores?'))act('reveal-all');};
  }
  function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const v=p.matrixTransform(svg.getScreenCTM().inverse());return [Math.max(0,Math.min(1,v.x/1000)),Math.max(0,Math.min(1,v.y/height))];}
  function rectangle(end){return [Math.min(start[0],end[0]),Math.min(start[1],end[1]),Math.max(start[0],end[0]),Math.max(start[1],end[1])];}
  svg.addEventListener('pointerdown',e=>{if(!master||!state.enabled||!mode||busy||e.button!==0)return;e.preventDefault();start=point(e);svg.setPointerCapture(e.pointerId);draft.setAttribute('width','0');draft.setAttribute('height','0');svg.append(draft);});
  svg.addEventListener('pointermove',e=>{if(!start)return;const [x,y,u,v]=rectangle(point(e));draft.setAttribute('x',x*1000);draft.setAttribute('y',y*height);draft.setAttribute('width',(u-x)*1000);draft.setAttribute('height',(v-y)*height);});
  svg.addEventListener('pointerup',e=>{if(!start)return;const rect=rectangle(point(e));start=null;draft.remove();suppress=true;setTimeout(()=>suppress=false,0);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(rect[2]>rect[0]&&rect[3]>rect[1])act(mode,rect);});
  svg.addEventListener('pointercancel',()=>{start=null;draft.remove();});
  svg.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode){e.preventDefault();stop();}});
  controls();
  return {get active(){return !!mode||suppress;},stop,apply(next,h){state=next;height=h;if(!state.enabled)stop();controls();paint();},paint};
}
