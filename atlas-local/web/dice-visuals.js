/* Small software 3D renderer: no external libraries, physics or random results. */
const diceMeshCache = new Map();
function diceHull(vertices) {
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
  const faces=new Map(), eps=1e-6;
  for(let i=0;i<vertices.length;i++) for(let j=i+1;j<vertices.length;j++) for(let k=j+1;k<vertices.length;k++) {
    let n=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));
    if(Math.hypot(...n)<eps) continue;
    n=unit(n);let d=dot(n,vertices[i]);
    const distances=vertices.map(v=>dot(n,v)-d);
    if(distances.some(x=>x>eps)&&distances.some(x=>x < -eps))continue;
    if(d<0){n=n.map(x=>-x);d=-d;}
    const ids=vertices.map((v,i)=>Math.abs(dot(n,v)-d)<eps?i:-1).filter(i=>i>=0);
    const key=ids.join(',');if(faces.has(key))continue;
    const center=[0,1,2].map(axis=>ids.reduce((s,i)=>s+vertices[i][axis],0)/ids.length);
    const u=unit(sub(vertices[ids[0]],center)),v=cross(n,u);
    ids.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),v),dot(sub(vertices[a],center),u))-Math.atan2(dot(sub(vertices[b],center),v),dot(sub(vertices[b],center),u)));
    faces.set(key,{ids,normal:n,distance:d});
  }
  return {vertices,faces:[...faces.values()]};
}
function diceMesh(sides) {
  sides=Number(sides);if(diceMeshCache.has(sides))return diceMeshCache.get(sides);
  let vertices=[];
  if(sides===4)vertices=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
  else if(sides===6)for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])vertices.push([x,y,z]);
  else if(sides===8)vertices=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  else if(sides===20||sides===12){
    const p=(1+Math.sqrt(5))/2;
    for(const a of [-1,1])for(const b of [-p,p])vertices.push([0,a,b],[a,b,0],[b,0,a]);
    if(sides===12)vertices=diceHull(vertices).faces.map(f=>f.normal.map(x=>x/f.distance));
  } else if(sides===10){
    // Dual of a regular pentagonal antiprism: ten kite-shaped faces.
    for(let i=0;i<10;i++){const a=i*Math.PI/5;vertices.push([Math.cos(a),Math.sin(a),i%2 ? .5 : -.5]);}
    vertices=diceHull(vertices).faces.map(f=>f.normal.map(x=>x/f.distance));
  } else return null;
  const radius=Math.max(...vertices.map(v=>Math.hypot(...v)));
  const mesh=diceHull(vertices.map(v=>v.map(x=>x/radius)));
  diceMeshCache.set(sides,mesh);return mesh;
}
function drawDiceMesh(canvas,phase) {
  const sides=Number(canvas.dataset.mesh),mesh=diceMesh(sides),ctx=canvas.getContext('2d');
  if(!mesh||!ctx)return;
  const ax=.45+phase*5,ay=.35+phase*7;
  const points=mesh.vertices.map(([x,y,z])=>{
    const a=y*Math.cos(ax)-z*Math.sin(ax),b=y*Math.sin(ax)+z*Math.cos(ax);
    return [x*Math.cos(ay)+b*Math.sin(ay),a,-x*Math.sin(ay)+b*Math.cos(ay)];
  });
  ctx.clearRect(0,0,160,160);
  const faces=mesh.faces.map(f=>f.ids.map(i=>points[i])).sort((a,b)=>a.reduce((s,v)=>s+v[2],0)/a.length-b.reduce((s,v)=>s+v[2],0)/b.length);
  faces.forEach((face,i)=>{
    ctx.beginPath();face.forEach(([x,y,z],j)=>{const scale=57/(1-z*.13),px=80+x*scale,py=80+y*scale;j?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();
    ctx.fillStyle=`hsl(${({4:32,6:210,8:166,10:280,12:345,20:43})[sides]}, 42%, ${23+i/faces.length*28}%)`;
    ctx.fill();ctx.strokeStyle='#f3dba79c';ctx.lineWidth=1.4;ctx.stroke();
  });
}
function animateDiceTray(tray) {
  if(tray.hidden)return;
  const canvases=[...tray.querySelectorAll('canvas[data-mesh]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=performance.now();
  function frame(now){
    if(!tray.isConnected)return;
    const t=reduced?1:Math.min(1,(now-start)/650);
    canvases.forEach(c=>drawDiceMesh(c,(1-t)**3));
    if(t<1)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
