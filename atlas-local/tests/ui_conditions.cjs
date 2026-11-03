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
 await gm.evaluate(()=>openWorkspacePanel('combat'));await gm.getByText('Tokens e condições',{exact:true}).click();await gm.locator('#token-select').selectOption('hero');await gm.locator('#effects-token').click();
 await gm.locator('#effect-search').fill('corrosao');assert.equal(await gm.locator('.effect-option:visible').count(),1);
 await gm.locator('[name="apply:corrosao"]').check();await gm.locator('#effect-search').fill('sono');await gm.locator('[name="apply:sono"]').check();
 await gm.locator('#combat-form button[type=submit]').click();await gm.waitForFunction(()=>!document.querySelector('#dialog').open);
 await player.waitForFunction(()=>document.querySelectorAll('[data-token=hero] .condition-icon').length===2);
 await gm.locator('#dead-token').click();await player.waitForSelector('[data-token=hero] [data-dead=true]');
 await gm.evaluate(async()=>{const scene=await api('scene?table_id='+active.id),r=await api('combat?table_id='+active.id+'&asset_id='+scene.asset_id);r.state.entries=[{id:'dead',name:'Herói',value:20,token:'hero',hidden:false,effects:[]},{id:'live',name:'Aliado',value:10,token:null,hidden:false,effects:[]}];r.state.active='live';await api('combat',{table_id:active.id,asset_id:scene.asset_id,revision:r.revision,state:r.state});});
 await gm.waitForFunction(()=>document.querySelector('#turns')?.innerText.includes('Aliado'));
 await gm.locator('#skip-dead').check();await gm.waitForTimeout(1200);await gm.locator('#next-turn').click();
 await gm.waitForFunction(()=>document.querySelector('#combat-round')?.textContent.includes('Rodada 2'));
 assert.match(await gm.locator('.turn.current').innerText(),/Aliado/);
 await gm.locator('#dead-token').click();await player.waitForFunction(()=>!document.querySelector('[data-dead=true]'));
 await gm.locator('#effects-token').click();assert.match(await gm.locator('.effect-option').first().innerText(),/Corrosão/);
 assert.deepEqual(errors,[]);console.log('PASS conditions search, hidden selections preserved, SVG icons, dead toggle and live player update.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
