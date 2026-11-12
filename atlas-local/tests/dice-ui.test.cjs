const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context=vm.createContext({esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../web/session.js'),'utf8'),context);
test('dice tray preserves values and caps visual work',()=>{
 const payload={results:[{groups:[{sides:20,dice:Array.from({length:50},(_,i)=>({value:i%20+1,kept:i!==0}))}]}]};
 const html=context.diceTray(payload);
 assert.equal((html.match(/class="result-die /g)||[]).length,40);
 assert.match(html,/discarded/);assert.match(html,/Mais dados/);assert.match(html,/>20<\/b>/);
});
test('cards escape descriptions and keep server identity',()=>{
 const html=context.rollCard({id:7,name:'<img>',label:'<script>',scope:'self',created:1,payload:{expression:'d6',draws:1,results:[{total:4,groups:[]}]}});
 assert.match(html,/data-roll-id="7"/);assert.match(html,/&lt;script>/);assert.doesNotMatch(html,/<img>/);assert.match(html,/Só você/);
});
test('boolean and numeric totals stay legible',()=>{
 assert.equal(context.rollValue(false),'Fracasso');assert.equal(context.rollValue(true),'Sucesso');assert.equal(context.rollValue(3.5),'3,5');
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../web/dice-visuals.js'),'utf8'),context);
test('3D meshes have correct faces, manifold edges and finite coordinates',()=>{
 for(const n of [4,6,8,10,12,20]) {
  const mesh=context.diceMesh(n);assert.equal(mesh.faces.length,n,`d${n}`);
  const edges=new Map();
  for(const f of mesh.faces)for(let i=0;i<f.ids.length;i++){
   const edge=[f.ids[i],f.ids[(i+1)%f.ids.length]].sort((a,b)=>a-b).join(',');edges.set(edge,(edges.get(edge)||0)+1);
  }
  assert.ok([...edges.values()].every(count=>count===2));
  assert.equal(mesh.vertices.length-edges.size+mesh.faces.length,2);
  assert.ok(mesh.vertices.flat().every(Number.isFinite));
 }
});
test('percentile 100 is 00 and 0, custom dice keep exact values',()=>{
 const html=context.diceTray({results:[{groups:[{sides:100,dice:[{value:100,kept:true}]},{sides:14,dice:[{value:13,kept:true}]}]}]});
 assert.equal((html.match(/data-mesh="10"/g)||[]).length,2);assert.match(html,/>00<\/small>/);assert.match(html,/>100<\/b>/);assert.match(html,/>13<\/b>/);
});
test('renderer emits finite projected coordinates for every basic die',()=>{
 let drawn=0;
 const ctx={clearRect(){},beginPath(){},closePath(){},fill(){drawn++;},stroke(){},moveTo(x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));},lineTo(x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));}};
 for(const n of [4,6,8,10,12,20])for(const phase of [0,.5,1])context.drawDiceMesh({dataset:{mesh:n},getContext:()=>ctx},phase);
 assert.equal(drawn,(4+6+8+10+12+20)*3);
});
test('reduced motion draws a single frame without scheduling a loop',()=>{
 let frames=0;
 context.performance={now:()=>0};context.matchMedia=()=>({matches:true});
 context.requestAnimationFrame=fn=>{frames++;fn(0);};
 context.animateDiceTray({hidden:false,isConnected:true,querySelectorAll:()=>[]});
 assert.equal(frames,1);
});
