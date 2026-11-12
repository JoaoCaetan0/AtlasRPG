const {chromium}=require('playwright'),path=require('path'),assert=require('assert');let s,b;
(async()=>{
 s=require('child_process').spawn('python',[path.join(__dirname,'ui_camera_fixture.py')]);s.stderr.on('data',x=>process.stderr.write(x));await new Promise((ok,no)=>{s.stdout.once('data',ok);s.once('exit',c=>no(Error('fixture '+c)));});
 b=await chromium.launch({executablePath:process.env.ATLAS_BROWSER,args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1366,height:768}}),errors=[];p.setDefaultTimeout(10000);p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept();});p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766');await p.locator('#auth [name=name]').fill('Camera');await p.locator('#auth [name=password]').fill('camera-test-123');await p.getByRole('button',{name:'Entrar',exact:true}).click();
 await p.getByRole('button',{name:'Abrir mesa',exact:true}).click();await p.waitForSelector('#battle');
 assert.equal(await p.locator('.workspace-rail [data-tab=scene],.workspace-rail [data-tab=history]').count(),0);
 console.log('OPEN ADMIN');await p.locator('[data-tab=admin]').click();await p.waitForSelector('#profile-form',{state:'attached'});
 assert(await p.locator('#workspace-drawer').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await p.locator('[data-admin-section="2"]').click();assert.equal(await p.locator('.map-prep-card').count(),2);
 await p.locator('[data-admin-access]').first().click();await p.locator('#access-draw').click();const box=await p.locator('#access-canvas').boundingBox();await p.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await p.mouse.down();await p.mouse.move(box.x+box.width*.5,box.y+box.height*.3);await p.mouse.up();await p.locator('#access-target-search').fill('Floresta');await p.locator('#close-dialog').click();
 await p.screenshot({path:'/tmp/atlas-v16-admin.png'});
 await p.setViewportSize({width:390,height:844});assert(await p.locator('#workspace-drawer .drawer-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await p.locator('#scene-pointer').click();await p.locator('#workspace-drawer').waitFor({state:'hidden'});
 await p.setViewportSize({width:1366,height:768});await p.locator('#back').click();
 await p.locator('#create [name=name]').fill('Sistema de teste');await p.locator('#create [value=custom]').check();await p.locator('#create button').click();
 await p.locator('article').filter({has:p.getByRole('heading',{name:'Sistema de teste',exact:true})}).getByRole('button',{name:'Abrir mesa'}).click();
 console.log('OPEN ADMIN');await p.locator('[data-tab=admin]').click();await p.locator('[data-admin-section="1"]').click();
 async function field(name,id,formula=''){
  await p.locator('#profile-add-field').click();await p.locator('#profile-field-form [name=label]').fill(name);await p.locator('#profile-field-form details summary').click();await p.locator('#profile-field-form [name=id]').fill(id);await p.locator('#profile-field-form [name=formula]').fill(formula);await p.locator('#profile-field-form button').first().click();
 }
 await field('Vigor','vigor');await field('Vida máxima','vida','vigor * 2 + 10');await p.locator('#profile-form .sheet-actions button').click();await p.waitForFunction(()=>document.querySelector('#profile-status').textContent.startsWith('Sistema salvo'),{},{timeout:10000});
 const downloadPromise=p.waitForEvent('download');await p.locator('#profile-export').click();const download=await downloadPromise;await download.saveAs('/tmp/atlas-v16-export.json');const exported=JSON.parse(require('fs').readFileSync('/tmp/atlas-v16-export.json','utf8'));assert(exported.fields.some(f=>f.id==='vida'));await p.locator('#profile-import').setInputFiles('/tmp/atlas-v16-export.json');await p.waitForFunction(()=>document.querySelector('#profile-status').textContent.startsWith('Perfil importado'),{},{timeout:10000});await p.locator('#profile-form .sheet-actions button').click();await p.waitForFunction(()=>document.querySelector('#profile-status').textContent.startsWith('Sistema salvo'),{},{timeout:10000});
 await p.locator('#add-condition').click();await p.locator('#admin-condition-form [name=name]').fill('Condição de teste');await p.locator('#admin-condition-form [name=description]').fill('Marcador personalizado da mesa.');await p.locator('#admin-condition-form button').click();await p.getByRole('button',{name:'Salvar condições',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#conditions-save-status').textContent.startsWith('Condições e padrões salvos'),{},{timeout:10000});
 await p.screenshot({path:'/tmp/atlas-v16-profile.png'});
 await p.locator('[data-tab=characters]').click();await p.locator('#new-character [name=name]').fill('Heroína');await p.locator('#new-character button').click();
 await p.getByRole('button',{name:'Atributos',exact:true}).click();await p.locator('#generic-sheet [name=vigor]').fill('7');await p.locator('#generic-sheet .sheet-actions button').click();await p.locator('[data-character]').first().waitFor();await p.locator('[data-character]').first().click();await p.getByRole('button',{name:'Atributos',exact:true}).click();assert.equal(await p.locator('#generic-sheet [name=vida]').inputValue(),'24');
 await p.locator('[data-override=vida]').check();await p.locator('#generic-sheet [name=vida]').fill('99');await p.locator('#generic-sheet .sheet-actions button').click();await p.locator('[data-character]').first().waitFor();await p.locator('[data-character]').first().click();await p.getByRole('button',{name:'Atributos',exact:true}).click();assert.equal(await p.locator('#generic-sheet [name=vida]').inputValue(),'99');
 assert.deepEqual(errors,[]);console.log('PASS V16: direct toolbar, responsive administration, map preparation links, custom table/profile fields, generic sheet formulas/manual overrides; no browser errors.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await b?.close();s?.kill();});
