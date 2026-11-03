const {chromium}=require('playwright'),path=require('path'),assert=require('assert');let s,b;
(async()=>{
 s=require('child_process').spawn('python',[path.join(__dirname,'ui_camera_fixture.py')]);s.stderr.on('data',x=>process.stderr.write(x));await new Promise((ok,no)=>{s.stdout.once('data',ok);s.once('exit',c=>no(Error('fixture '+c)));});
 b=await chromium.launch({executablePath:process.env.ATLAS_BROWSER,args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766');await p.locator('#auth [name=name]').fill('Camera');await p.locator('#auth [name=password]').fill('camera-test-123');await p.getByRole('button',{name:'Entrar',exact:true}).click();await p.getByRole('button',{name:'Abrir mesa',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('#battle')?.viewBox.baseVal.height===3600);
 async function fits(){await p.waitForFunction(()=>{const b=document.querySelector('.combat-board'),v=document.querySelector('#battle').getBoundingClientRect();return b.scrollHeight<=b.clientHeight+1&&b.scrollWidth<=b.clientWidth+1&&v.bottom<=innerHeight;});}
 await fits();
 await p.locator('#zoom-in').click();assert.equal(await p.locator('#map-zoom').inputValue(),'125');
 await p.locator('#zoom-out').click();assert.equal(await p.locator('#map-zoom').inputValue(),'100');await fits();
 await p.locator('#map-zoom').fill('200');await p.locator('#map-zoom').dispatchEvent('input');await p.waitForFunction(()=>document.querySelector('.combat-board').scrollHeight>document.querySelector('.combat-board').clientHeight);
 await p.evaluate(()=>openWorkspacePanel('combat'));await p.waitForFunction(()=>document.querySelector('[data-layer=grid]').getAttribute('d').length>100);assert.equal(await p.locator('#map-zoom').inputValue(),'200');
 await p.locator('#drawer-close').click();await p.locator('#map-fit').click();await fits();
 await p.setViewportSize({width:390,height:844});await fits();
 await p.evaluate(async()=>{const files=await api('assets?table_id='+active.id+'&user_id='+me.id);await sendScene(files.find(x=>x.name.includes('Largo')).id);});
 await p.waitForFunction(()=>document.querySelector('#battle')?.viewBox.baseVal.height<300);await fits();assert.deepEqual(errors,[]);
 await p.setViewportSize({width:1366,height:768});
 await p.evaluate(()=>openWorkspacePanel('maps'));await p.locator('#search').fill('arvores');
 assert.equal(await p.locator('#map-list article').count(),1);assert.match(await p.locator('#map-list').innerText(),/Floresta/);
 await p.locator('[data-map-favorite]').click();await p.locator('#search').fill('');await p.locator('#map-scope').selectOption('favorites');assert.equal(await p.locator('#map-list article').count(),1);
 await p.locator('#map-clear').click();await p.locator('#map-kind').selectOption('regional');assert.equal(await p.locator('#map-list article').count(),1);assert.match(await p.locator('#map-list').innerText(),/Norte/);
 await p.locator('#drawer-close').click();await p.evaluate(()=>openWorkspacePanel('maps'));assert.equal(await p.locator('#map-kind').inputValue(),'regional');
 await p.locator('#map-clear').click();assert.equal(await p.locator('#map-list article').count(),2);
 assert.deepEqual(errors,[]);
 console.log('PASS zoom buttons and searchable/filterable persistent map catalog; full application: tall/wide scene, fit, manual zoom, combat refresh preserves zoom, resize mobile, scene switching.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await b?.close();s?.kill();});
