const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),assert=require('assert');
const output=process.env.ATLAS_UI_OUTPUT||'/tmp/atlas-fog-ui';fs.mkdirSync(output,{recursive:true});process.env.ATLAS_UI_OUTPUT=output;
let server,browser;
(async()=>{
 server=require('child_process').spawn('python',[path.join(__dirname,'ui_fixture.py')]);
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);server.once('exit',c=>no(Error('fixture '+c)));});
 browser=await chromium.launch({executablePath:process.env.ATLAS_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
 const gm=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];gm.on('pageerror',e=>errors.push(e.message));gm.on('dialog',d=>d.accept());
 await gm.goto('http://127.0.0.1:8766');await gm.locator('#auth [name=name]').fill('Teste mestre');await gm.locator('#auth [name=password]').fill('test-only-12345');await gm.getByRole('button',{name:'Entrar',exact:true}).click();await gm.getByRole('button',{name:'Abrir mesa',exact:true}).click();await gm.locator('#battle image').waitFor();
 await gm.evaluate(()=>openWorkspacePanel('combat'));await gm.locator('#quick-token').click();await gm.locator('#combat-form [name=name]').fill('Fera secreta');await gm.locator('#combat-form button[type=submit]').click();await gm.waitForFunction(()=>document.querySelectorAll('[data-token]').length===1);
 await gm.evaluate(()=>openWorkspacePanel('fog'));await gm.locator('#fog-enabled').check();
 await gm.waitForFunction(()=>document.querySelector('#fog-layer path')?.getAttribute('d').length>10);
 const info=await gm.evaluate(async()=>({tid:active.id,code:(await api('invite',{table_id:active.id})).code,scene:await api('scene?table_id='+active.id)}));
 const pc=await browser.newContext(),headers={'X-Atlas-Request':'1'};await pc.request.post('http://127.0.0.1:8766/api/register',{headers,data:{name:'Jogador névoa',password:'test-only-12345'}});await pc.request.post('http://127.0.0.1:8766/api/join',{headers,data:{code:info.code}});
 const player=await pc.newPage();player.on('pageerror',e=>errors.push(e.message));await player.goto('http://127.0.0.1:8766');await player.getByRole('button',{name:'Abrir mesa',exact:true}).click();await player.waitForFunction(()=>document.querySelector('#fog-layer path')?.getAttribute('d').length>10);
 assert.equal(await player.locator('[data-tab=fog]').count(),0);assert.equal(await player.locator('[data-token]').count(),0);
 // Verify pixels of a fresh direct GET, independent of SVG overlay.
 const colors=()=>player.evaluate(async()=>{const s=await api('scene?table_id='+active.id);const r=await fetch(assetUrl(s.asset_id));const img=await createImageBitmap(await r.blob()),canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return [...ctx.getImageData(5,5,1,1).data];});
 assert.deepEqual(await colors(),[8,12,18,255]);
 // Pointer drag reveals the middle of the actual map. No movement is charged.
 const before=await gm.evaluate(async()=>{const s=await api('scene?table_id='+active.id);return api('combat?table_id='+active.id+'&asset_id='+s.asset_id)});
 const token=before.state.tokens[0];
 await gm.locator('#fog-reveal').click();await gm.locator('#drawer-close').click();
 const box=await gm.evaluate(async(t)=>{const svg=document.querySelector('#battle'),g=await import('/combat/geometry.mjs'),p=svg.createSVGPoint();const [x,y]=g.center(t.q,t.r,35,svg.viewBox.baseVal.height);const point=(x,y)=>{p.x=x;p.y=y;const z=p.matrixTransform(svg.getScreenCTM());return {x:z.x,y:z.y}};return [point(x-50,y-50),point(x+50,y+50)];},token);
 await gm.mouse.move(box[0].x,box[0].y);await gm.mouse.down();await gm.mouse.move(box[1].x,box[1].y,{steps:5});await gm.mouse.up();
 await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===1);
 const after=await gm.evaluate(async()=>{const s=await api('scene?table_id='+active.id);return api('combat?table_id='+active.id+'&asset_id='+s.asset_id)});assert.equal(after.state.tokens[0].spent,0);assert.equal(after.revision,before.revision);
 await gm.evaluate(()=>openWorkspacePanel('fog'));await gm.locator('#fog-undo').click();await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===0);await gm.locator('#fog-redo').click();await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===1);
 await gm.locator('#fog-stop').click();await gm.locator('#fog-preview').check();assert.equal(await gm.locator('#fog-layer path').getAttribute('opacity'),'1');
 await gm.screenshot({path:path.join(output,'fog-master.png')});await player.screenshot({path:path.join(output,'fog-player.png')});
 await gm.reload();await gm.getByRole('button',{name:'Abrir mesa',exact:true}).click();await gm.locator('#battle image').waitFor();await gm.locator('[data-tab=fog]').click();await gm.waitForFunction(()=>document.querySelector('#fog-enabled')?.checked);assert(await gm.locator('#fog-enabled').isChecked());
 await gm.getByText('Mapa inteiro',{exact:true}).click();await gm.locator('#fog-cover-all').click();await player.waitForFunction(()=>document.querySelectorAll('[data-token]').length===0);
 await gm.setViewportSize({width:390,height:844});assert(await gm.evaluate(()=>document.body.scrollWidth<=innerWidth+1));await gm.screenshot({path:path.join(output,'fog-mobile.png'),fullPage:true});
 // A new map can be shared completely covered before the player requests its bytes.
 await gm.evaluate(()=>openWorkspacePanel('maps'));await gm.locator('[data-send-fog=test1]').click();
 const fixture=JSON.parse(fs.readFileSync(path.join(output,'fixture.json')));await player.waitForFunction(aid=>document.querySelector('#battle image').getAttribute('href').includes(aid),fixture.assets[1]);assert.deepEqual(await colors(),[8,12,18,255]);
 assert.deepEqual(errors,[]);console.log('PASS: fog enable, protected fresh raster GET, player permissions/tokens, rectangle drag, no movement cost, undo/redo, GM preview, reload persistence, mobile, atomic covered scene.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server?.kill();});
