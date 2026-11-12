// Run with ATLAS_BROWSER=/usr/bin/chromium node tests/ui_sheet_cp19.cjs.
// Real DOM/layout test without campaign data or an HTTP fixture.
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ATLAS_BROWSER||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(`<aside id="workspace-drawer"><div class="drawer-heading">Personagens</div><div class="drawer-scroll"><div id="workspace-content"><div class="row"><h2>Aruna</h2></div><form id="character-fields"><label>Buscar campo<input id="field-search"></label><details class="sheet-section"><summary>Identidade</summary><div class="sheet-fields"><label class="sheet-field" data-field-label="nome">Nome<input name="nome" value="Aruna"></label></div></details><details class="sheet-section"><summary>Recursos</summary><div class="sheet-fields"><label class="sheet-field" data-field-label="vida">Vida<input name="pv_atual" value="23"></label></div></details><details class="sheet-section"><summary>Anotações</summary><div class="sheet-fields"><label class="sheet-field" data-field-label="história">História<textarea name="historia">Texto preservado</textarea></label></div></details><div class="sheet-actions"><button>Salvar ficha</button></div></form></div></div></aside>`);
  await page.addStyleTag({content:fs.readFileSync('web/style.css','utf8')});
  await page.addScriptTag({content:fs.readFileSync('web/characters.js','utf8')});
  await page.evaluate(()=>mountSheetWorkspace(document.querySelector('form')));
  await page.getByRole('button',{name:'Recursos',exact:true}).click();
  await page.locator('[name=pv_atual]').fill('17');
  await page.getByRole('button',{name:'Identidade',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(new FormData(document.querySelector('form')))),{nome:'Aruna',pv_atual:'17',historia:'Texto preservado'});
  await page.locator('#field-search').fill('historia');
  assert(await page.locator('[name=historia]').isVisible());
  await page.locator('#field-search').fill('inexistente');assert(await page.getByText('Nenhum campo encontrado.').isVisible());
  await page.locator('#field-search').fill('');assert.equal(await page.locator('.sheet-navigation button:visible').count(),3);
  for(const viewport of [{width:1440,height:900},{width:700,height:420},{width:390,height:844},{width:320,height:568}]){
   await page.setViewportSize(viewport);
   const box=await page.locator('.sheet-actions').boundingBox();assert(box.y>=0&&box.y+box.height<=viewport.height+1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  assert.deepEqual(errors,[]);console.log('CP19: field preservation, search, navigation, responsive actions passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
