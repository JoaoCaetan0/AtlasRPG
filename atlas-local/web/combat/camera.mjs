// Camera belongs to this browser, never to the shared combat state.
export function mountCamera({board,surface,svg,slider,fitButton}) {
 const pan=mountMapPan(board);
 let ratio=1000/700,zoom=1,frame=0,disposed=false;
 const label=document.createElement('output');label.id='camera-status';slider.after(label);
 const minus=document.createElement('button'),plus=document.createElement('button');
 for(const [button,id,title,symbol] of [[minus,'zoom-out','Diminuir zoom','−'],[plus,'zoom-in','Aumentar zoom','+']]){
  button.type='button';button.id=id;button.className='secondary zoom-step';button.title=title;button.setAttribute('aria-label',title);button.textContent=symbol;
 }
 const controls=document.createElement('span');controls.className='zoom-buttons';slider.closest('label').after(controls);controls.append(minus,plus);
 function layout(){
  frame=0;if(disposed||!board.isConnected)return;
  const available=Math.max(80,innerHeight-board.getBoundingClientRect().top-64);
  board.style.height=available+'px';board.style.minHeight='0';
  // Reserve scrollbar space so manual zoom does not change its own reference scale.
  const width=Math.max(1,board.clientWidth-18),height=Math.max(1,board.clientHeight-18);
  const fitted=Math.min(width,height*ratio);
  surface.style.width=(fitted*zoom)+'px';surface.style.height=(fitted*zoom/ratio)+'px';
  minus.disabled=zoom<=.25;plus.disabled=zoom>=4;
  label.textContent=zoom===1?'Enquadrado':Math.round(zoom*100)+'% do enquadramento';
  if(zoom<=1){board.scrollLeft=0;board.scrollTop=0;}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
 slider.min=25;slider.max=400;slider.step=5;slider.value=100;
 minus.onclick=()=>step(-25);plus.onclick=()=>step(25);
 function step(delta){slider.value=Math.max(25,Math.min(400,Number(slider.value)+delta));slider.dispatchEvent(new Event('input'));}
 slider.oninput=()=>{zoom=Number(slider.value)/100;layout();};
 fitButton.textContent='Ver mapa inteiro';fitButton.onclick=()=>{zoom=1;slider.value=100;layout();};
 const wheel=e=>{
  if(e.target.closest('input,textarea,select,button,[contenteditable]')||board.classList.contains('panning-map'))return;
  if(!Number.isFinite(e.deltaY)||!e.deltaY)return;
  e.preventDefault();
  const rect=surface.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?board.clientHeight:1);
  zoom=Math.max(.25,Math.min(4,zoom*Math.exp(-Math.max(-120,Math.min(120,delta))*.002)));
  slider.value=zoom*100;layout();
  const after=surface.getBoundingClientRect();
  board.scrollLeft+=after.left+x*after.width-e.clientX;
  board.scrollTop+=after.top+y*after.height-e.clientY;
 };
 board.addEventListener('wheel',wheel,{passive:false});
 const observer=new ResizeObserver(schedule);observer.observe(board);observer.observe(board.parentElement);
 const toolbar=document.querySelector('.tabletop-toolbar');if(toolbar)observer.observe(toolbar);
 window.addEventListener('resize',schedule);
 schedule();
 return {setDimensions(w,h){ratio=w/h;schedule();},destroy(){board.removeEventListener('wheel',wheel);pan.destroy();disposed=true;observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);}};
}

// Right clicks are dispatched only after release; native contextmenu can fire
// before release on some platforms, so defer it until the gesture is known.
export function mountMapPan(board){
 let drag=null,suppressUntil=0,dispatching=false;
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
 function down(e){
  if(![1,2].includes(e.button)||drag||e.target?.closest?.('input,textarea,select,button,[contenteditable]'))return;
  stop(e);drag={pointer:e.pointerId,button:e.button,target:e.target,x:e.clientX,y:e.clientY,left:board.scrollLeft,top:board.scrollTop,moved:e.button===1};
  board.setPointerCapture(e.pointerId);if(drag.moved)board.classList.add('panning-map');
 }
 function move(e){
  if(!drag||e.pointerId!==drag.pointer)return;
  stop(e);const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  drag.moved=true;board.classList.add('panning-map');board.scrollLeft=drag.left-dx;board.scrollTop=drag.top-dy;
 }
 function finish(e,click=false){
  if(!drag||(e?.pointerId!==undefined&&e.pointerId!==drag.pointer))return;
  if(e?.preventDefault)stop(e);
  const ended=drag;drag=null;board.classList.remove('panning-map');
  if(board.hasPointerCapture(ended.pointer))board.releasePointerCapture(ended.pointer);
  if(ended.button===2){
   suppressUntil=Date.now()+750;
   if(click&&!ended.moved&&Math.hypot(e.clientX-ended.x,e.clientY-ended.y)<6){
    dispatching=true;
    try{ended.target?.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:e.clientX,clientY:e.clientY}));}finally{dispatching=false;}
   }
  }
 }
 const up=e=>finish(e,true),cancel=e=>finish(e,false);
 const context=e=>{if(!dispatching&&(drag?.button===2||Date.now()<suppressUntil))stop(e);};
 const aux=e=>{if([1,2].includes(e.button))stop(e);};
 const select=e=>e.preventDefault();
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['contextmenu',context],['auxclick',aux],['selectstart',select],['dragstart',select]];
 for(const [name,fn] of listeners)board.addEventListener(name,fn,true);
 window.addEventListener('blur',cancel);
 return {destroy(){finish();for(const [name,fn] of listeners)board.removeEventListener(name,fn,true);window.removeEventListener('blur',cancel);}};
}
