const {chromium}=require('playwright'),path=require('path'),assert=require('assert');let server,browser;
(async()=>{
 server=require('child_process').spawn('python',[path.join(__dirname,'ui_camera_fixture.py')]);server.stderr.on('data',x=>process.stderr.write(x));await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('exit',c=>no(Error('fixture '+c)));});
 browser=await chromium.launch({executablePath:process.env.ATLAS_BROWSER,args:['--no-sandbox']});
 const gm=await browser.newPage(),player=await browser.newPage(),errors=[];
 for(const [p,name] of [[gm,'Camera'],[player,'Viewer']]){
  p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8766');
  await p.locator('#auth [name=name]').fill(name);await p.locator('#auth [name=password]').fill('camera-test-123');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.getByRole('button',{name:'Abrir mesa',exact:true}).click();await p.waitForSelector('#battle');
 }
 assert.equal(await player.locator('#scene-period').count(),0);
 await gm.waitForSelector('#scene-period');
 const before=await gm.evaluate(async()=>{
  const scene=await api('scene?table_id='+active.id),r=await api('combat?table_id='+active.id+'&asset_id='+scene.asset_id);
  r.state.enabled=true;r.state.tokens=[{id:'hero',name:'Herói',q:0,r:0,owner:null,color:'#123456',budget:10,spent:3,hidden:false,effects:[]}];
  await api('combat',{table_id:active.id,asset_id:scene.asset_id,revision:r.revision,state:r.state});
  return scene.asset_id;
 });
 await gm.waitForSelector('[data-token=hero]');await player.waitForSelector('[data-token=hero]');
 await gm.evaluate(()=>openWorkspacePanel('conditions'));await gm.locator('#token-select').selectOption('hero');
 await gm.locator('#cards-search').fill('corrosao');await gm.locator('[data-condition=corrosao]').click();
 await player.waitForSelector('[data-token=hero] .condition-icon');
 await gm.locator('[data-condition=corrosao]').click();await player.waitForFunction(()=>!document.querySelector('[data-token=hero] .condition-icon'));
 await gm.locator('#drawer-close').click();await gm.evaluate(()=>openWorkspacePanel('initiative'));
 await gm.locator('#add-selected-turn').click();await gm.waitForFunction(()=>document.querySelectorAll('#turns .turn').length===1);
 await gm.locator('#quick-initiative').fill('0');await gm.locator('#add-selected-turn').click();await gm.waitForFunction(()=>document.querySelectorAll('#turns .turn').length===2);
 const entries=await gm.evaluate(async()=>{const s=await api('scene?table_id='+active.id);return (await api('combat?table_id='+active.id+'&asset_id='+s.asset_id)).state.entries;});
 assert.equal(entries[0].value,null);assert.equal(entries[1].value,0);assert.equal(entries[0].token,entries[1].token);assert.notEqual(entries[0].id,entries[1].id);
 await player.waitForSelector('#initiative-float');await player.locator('[data-close]').click();assert.equal(await player.locator('#initiative-float').isVisible(),false);
 assert.equal(await gm.locator('#initiative-float').isVisible(),true);
 await gm.locator('#turns .turn').nth(1).dragTo(gm.locator('#turns .turn').nth(0));
 await gm.waitForFunction(()=>document.querySelector('#turns .turn')?.innerText.includes(' · 0'));
 await gm.locator('#add-turn').click();await gm.locator('#combat-form [name=name]').fill('Evento');await gm.locator('#combat-form button[type=submit]').click();await gm.waitForFunction(()=>document.querySelectorAll('#turns .turn').length===3);
 await player.waitForTimeout(1300);assert.equal(await player.locator('#initiative-float').isVisible(),false);
 await gm.locator('#drawer-close').click();await gm.locator('[data-min]').click();assert.equal(await gm.locator('.float-body').isVisible(),false);await gm.locator('[data-min]').click();
 const handle=gm.locator('.float-drag'),box=await handle.boundingBox();await gm.mouse.move(box.x+10,box.y+10);await gm.mouse.down();await gm.mouse.move(box.x+100,box.y-80,{steps:8});await gm.mouse.up();assert.ok((await gm.locator('#initiative-float').boundingBox()).x>50);
 await gm.evaluate(()=>openWorkspacePanel('conditions'));await gm.locator('#cards-search').fill('');await gm.waitForTimeout(200);await gm.screenshot({path:'/tmp/atlas-ui4.png'});
 assert.deepEqual(errors,[]);console.log('PASS cards, toggle synchronization, optional zero/null, duplicated token, reorder, independent entry, local window close.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
