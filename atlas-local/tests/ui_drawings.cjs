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
 await gm.evaluate(()=>openWorkspacePanel('drawings'));await gm.locator('#drawing-private').uncheck();await gm.locator('[data-draw=rect]').click();await gm.locator('#drawer-close').click();
 const box=await gm.locator('#battle').boundingBox();await gm.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await gm.mouse.down();await gm.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await gm.mouse.up();
 await gm.waitForFunction(()=>document.querySelector('#drawing-layer')?.children.length===1);await player.waitForFunction(()=>document.querySelector('#drawing-layer')?.children.length===1);
 await gm.locator('#battle').press('Escape');
 await gm.evaluate(async()=>{const scene=await api('scene?table_id='+active.id),r=await api('combat?table_id='+active.id+'&asset_id='+scene.asset_id);await api('combat-undo',{table_id:active.id,asset_id:scene.asset_id,revision:r.revision});});
 await player.waitForFunction(()=>document.querySelector('#drawing-layer')?.children.length===0);
 assert.deepEqual(errors,[]);console.log('PASS draw rectangle, player synchronization, Escape and undo.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
