const {chromium}=require('playwright'),path=require('path'),assert=require('assert');let s,b;
(async()=>{
 s=require('child_process').spawn('python',[path.join(__dirname,'ui_camera_fixture.py')]);s.stderr.on('data',x=>process.stderr.write(x));await new Promise((ok,no)=>{s.stdout.once('data',ok);s.once('exit',c=>no(Error('fixture '+c)));});
 b=await chromium.launch({executablePath:process.env.ATLAS_BROWSER,args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1366,height:768}}),errors=[];p.setDefaultTimeout(10000);p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept();});p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766');await p.locator('#auth [name=name]').fill('Camera');await p.locator('#auth [name=password]').fill('camera-test-123');await p.getByRole('button',{name:'Entrar',exact:true}).click();
 await p.getByRole('button',{name:'Abrir mesa',exact:true}).click();await p.waitForSelector('#battle');
 await p.locator('[data-tab=combat]').click();await p.locator('#quick-token').click();await p.locator('#combat-form [name=name]').fill('Vigia de bronze');await p.locator('#combat-form [name=appearance]').selectOption('aliado');await p.locator('#combat-form button[type=submit]').click();await p.locator('#dialog').waitFor({state:'hidden'});
 await p.locator('[data-tab=assets]').click();await p.locator('#asset-custom-tab').click();await p.locator('[data-asset^=recent-]').first().waitFor();assert.equal(await p.locator('[data-asset^=recent-]').count(),1);await p.locator('[data-asset^=recent-]').click();await p.locator('#asset-insert').click();
 await p.waitForFunction(()=>document.querySelectorAll('[data-token]').length===2,{},{timeout:10000});
 const state=await p.evaluate(async()=>{const scene=await api('scene?table_id='+active.id);return (await api('combat?table_id='+active.id+'&asset_id='+scene.asset_id)).state;});assert.equal(state.tokens[1].appearance,'aliado');assert.equal(state.tokens[1].spent,0);assert.equal(state.tokens[1].owner,null);
 await p.reload();await p.getByRole('button',{name:'Abrir mesa',exact:true}).click();await p.waitForSelector('#battle');await p.locator('[data-tab=assets]').click();await p.locator('#asset-custom-tab').click();await p.locator('[data-asset^=recent-]').first().waitFor();assert.deepEqual(errors,[]);
 const first=await p.evaluate(()=>api('scene?table_id='+active.id));
 const second=await p.evaluate(async()=>{const assets=await api('assets?table_id='+active.id);const s=await api('scene?table_id='+active.id);const a=assets.find(x=>x.mime.startsWith('image/')&&x.id!==s.asset_id);await sendScene(a.id);return a.id;});
 await p.waitForFunction(()=>!document.querySelector('#previous-map').disabled,{},{timeout:10000});await p.locator('#previous-map').click();
 await p.waitForFunction(async id=>(await api('scene?table_id='+active.id)).asset_id===id,first.asset_id,{timeout:10000});
 assert.deepEqual(errors,[]);
 console.log('PASS recent custom tokens: create, persist, search category, reuse on map with reset state, reload persistence.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await b?.close();s?.kill();});
