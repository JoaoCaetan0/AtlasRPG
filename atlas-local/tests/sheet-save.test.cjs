const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const context=vm.createContext({});vm.runInContext(fs.readFileSync(__dirname+'/../web/characters.js','utf8'),context);const attrs=new Map(),status={textContent:''},buttons=[{disabled:false},{disabled:true}];const form={inert:false,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),querySelector:()=>status,querySelectorAll:()=>buttons};return {run:context.runSheetSave,form,attrs,status,buttons};}
test('concurrent save and PDF requests execute only once and preserve disabled controls',async()=>{
 const {run,form,attrs,buttons}=setup();let finish,calls=0;const wait=new Promise(r=>finish=r);
 const first=run(form,async()=>{calls++;await wait;return 12;});
 assert.equal(form.inert,true);assert.equal(attrs.get('aria-busy'),'true');
 await run(form,async()=>calls++);assert.equal(calls,1);
 finish();assert.equal(await first,12);assert.equal(form.inert,false);assert.equal(attrs.has('aria-busy'),false);assert.deepEqual(buttons.map(b=>b.disabled),[false,true]);
});
test('failed save retains inputs, shows error, unlocks and allows retry',async()=>{
 const {run,form,status}=setup();form.fields={nome:'Rascunho',pv:'17'};
 await assert.rejects(run(form,async()=>{throw Error('Conflito de revisão');}),/Conflito/);
 assert.equal(status.textContent,'Conflito de revisão');assert.deepEqual(form.fields,{nome:'Rascunho',pv:'17'});assert.equal(form.inert,false);
 assert.equal(await run(form,async()=>42),42);
});
