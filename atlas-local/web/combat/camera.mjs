// Camera belongs to this browser, never to the shared combat state.
export function mountCamera({board,surface,svg,slider,fitButton}) {
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
 const observer=new ResizeObserver(schedule);observer.observe(board);observer.observe(board.parentElement);
 const toolbar=document.querySelector('.tabletop-toolbar');if(toolbar)observer.observe(toolbar);
 window.addEventListener('resize',schedule);
 schedule();
 return {setDimensions(w,h){ratio=w/h;schedule();},destroy(){disposed=true;observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);}};
}
