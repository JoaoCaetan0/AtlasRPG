// V16: configuration uses table-local profiles; sheets snapshot the schema at creation.
async function mountAdminSections(section) {
  const root=$('#workspace-content'), layout=root.querySelector('.admin-layout');
  if(!layout)return;
  const identity=layout.firstElementChild, maps=layout.lastElementChild;
  const system=document.createElement('section');system.id='system-config';system.hidden=true;
  const nav=document.createElement('nav');nav.className='admin-tabs';nav.setAttribute('aria-label','Configuração da mesa');
  nav.innerHTML=['Mesa','Sistema','Mapas'].map((n,i)=>`<button type="button" data-admin-section="${i}" aria-pressed="${i===0}">${n}</button>`).join('');
  layout.before(nav);layout.append(system);maps.hidden=true;
  const sections=[identity,system,maps];
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{sections.forEach((s,i)=>s.hidden=i!==+b.dataset.adminSection);nav.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  nav.querySelector(`[data-admin-section="${["0","1","2"].includes(section)?section:"0"}"]`).click();
  const {profile,revision}=await api('system-profile?table_id='+active.id);
  let rev=revision, draft=cloneState(profile);
  const old=$('#table-settings [name=system]');old.readOnly=true;old.title='Personalize na seção Sistema';
  system.innerHTML=`<article class="card"><div class="row"><h3>Regras desta mesa</h3><span class="profile-badge">Perfil independente</span></div><p>As alterações valem nesta mesa. Fichas existentes preservam sua configuração original.</p><form id="profile-form"><div class="compact-grid"><label>Nome do sistema<input name="name" maxlength="120" required value="${esc(profile.name)}"></label><label>Edição / referência<input name="edition" maxlength="160" required value="${esc(profile.edition)}"></label></div><p>${esc(profile.coverage||'Perfil da mesa')}</p>${profile.engine==='generic'?'<div class="row"><button type="button" id="profile-export" class="secondary">Exportar perfil</button><label class="profile-import">Importar perfil<input type="file" id="profile-import" accept="application/json,.json"></label></div><div class="row"><h4>Campos da ficha</h4><button type="button" id="profile-add-field" class="secondary">＋ Campo</button></div><label>Buscar campo<input type="search" id="profile-search" placeholder="Nome ou seção"></label><div id="profile-fields" class="profile-fields"></div><details><summary>Como funcionam as fórmulas?</summary><p>Use o identificador dos campos numéricos: por exemplo, vida_base + vigor * 2. Operações: +, −, *, /. Funções: min, max, floor, ceil, round, abs. Campos vazios valem zero. Não há execução de código.</p><p>O jogador pode marcar um resultado como ajuste manual na ficha.</p></details>':'<p>O Estigma continua usando seu assistente e PDF atuais. A migração visual dos atributos e regras para este editor será uma etapa posterior.</p>'}<div class="sheet-actions"><button>Salvar sistema</button><span id="profile-status" role="status">Sem alterações</span></div></form></article><article class="card" id="profile-conditions"><h3>Condições da mesa</h3><p>Os padrões se aplicam a novos combates; cenas já salvas mantêm suas regras.</p></article>`;
  const conditionSection=[...$('#table-settings').querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='Condições do sistema');
  if(conditionSection){conditionSection.open=true;$('#profile-conditions').append(conditionSection);const save=document.createElement('button');save.type='button';save.textContent='Salvar condições';save.onclick=()=>$('#table-settings').requestSubmit();$('#profile-conditions').append(save);const status=document.createElement('p');status.id='conditions-save-status';status.setAttribute('role','status');$('#profile-conditions').append(status);}
  function mark(){dirty=true;$('#profile-form').dataset.dirty='true';$('#profile-status').textContent='Alterações não salvas';}
  const form=$('#profile-form');form.oninput=e=>{if(e.target.id!=='profile-search')mark();};
  function renderFields(){
    const q=($('#profile-search')?.value||'').toLocaleLowerCase();
    $('#profile-fields').innerHTML=draft.fields.filter(f=>(f.label+' '+f.group).toLocaleLowerCase().includes(q)).map(f=>`<button type="button" class="profile-field" data-field-id="${esc(f.id)}"><strong>${esc(f.label)}</strong><small>${esc(f.group)} · ${f.type==='number'?'Número':f.type==='longtext'?'Texto longo':'Texto'}</small><code>${esc(f.id)}</code>${f.formula?`<small>ƒ ${esc(f.formula)}</small>`:''}</button>`).join('')||'<p>Nenhum campo. Adicione os campos que sua mesa usa.</p>';
    system.querySelectorAll('[data-field-id]').forEach(b=>b.onclick=()=>editField(b.dataset.fieldId));
  }
  function editField(id){
    const f=draft.fields.find(x=>x.id===id)||{id:'campo_'+Date.now().toString(36),label:'',group:'Atributos',type:'number',formula:''};
    $('#dialog-title').textContent=id?'Editar campo':'Novo campo';
    $('#dialog-body').innerHTML=`<form id="profile-field-form"><label>Nome<input name="label" required maxlength="80" value="${esc(f.label)}"></label><div class="compact-grid"><label>Seção<input name="group" required maxlength="60" value="${esc(f.group)}"></label><label>Tipo<select name="type">${[['number','Número'],['text','Texto'],['longtext','Texto longo']].map(([v,n])=>`<option value="${v}" ${f.type===v?'selected':''}>${n}</option>`).join('')}</select></label></div><details ${f.formula?'open':''}><summary>Identificador e cálculo</summary><label>Identificador<input name="id" required pattern="[a-z][a-z0-9_]{0,39}" value="${esc(f.id)}" ${id?'readonly':''}></label><label>Fórmula opcional<input name="formula" maxlength="250" value="${esc(f.formula)}" placeholder="vida_base + vigor * 2"></label></details><div class="row"><button>Aplicar ao rascunho</button>${id?'<button type="button" id="profile-remove-field" class="secondary">Remover campo</button>':''}</div></form>`;
    $('#dialog').showModal();
    $('#profile-field-form').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(f.type!=='number')f.formula='';if(draft.fields.some(x=>x.id===f.id&&x.id!==id)){notice.textContent='Identificador repetido.';return;}if(id)draft.fields=draft.fields.map(x=>x.id===id?f:x);else draft.fields.push(f);mark();$('#dialog').close();renderFields();};
    if(id)$('#profile-remove-field').onclick=()=>{draft.fields=draft.fields.filter(x=>x.id!==id);mark();$('#dialog').close();renderFields();};
  }
  if(profile.engine==='generic'){
    $('#profile-export').onclick=()=>{const f=new FormData(form),p={...draft,name:f.get('name'),edition:f.get('edition')};const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Atlas_Perfil.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    $('#profile-import').onchange=e=>act(async()=>{const file=e.target.files[0];if(!file)return;try{if(file.size>30000)throw Error('Perfil muito grande. Máximo de 30 KB.');const p=JSON.parse(await file.text());if(p.version!==1||p.engine!=='generic'||typeof p.name!=='string'||typeof p.edition!=='string'||!Array.isArray(p.fields)||p.fields.length>100||p.fields.some(f=>!f||['id','label','group','type','formula'].some(k=>typeof f[k]!=='string')))throw Error('Arquivo de perfil incompatível.');draft={...draft,name:p.name,edition:p.edition,fields:p.fields};form.elements.namedItem('name').value=p.name;form.elements.namedItem('edition').value=p.edition;renderFields();mark();$('#profile-status').textContent='Perfil importado no rascunho. Salve para validar e aplicar às próximas fichas.';}catch(error){$('#profile-status').textContent=error.message;throw error;}finally{e.target.value='';}});
  }
  if(profile.engine==='generic'){$('#profile-add-field').onclick=()=>editField();$('#profile-search').oninput=renderFields;renderFields();}
  form.onsubmit=e=>{e.preventDefault();act(async()=>{const f=new FormData(form);draft.name=f.get('name');draft.edition=f.get('edition');const button=form.querySelector('button[type=submit]')||form.querySelector('.sheet-actions button');button.disabled=true;try{const r=await api('system-profile',{table_id:active.id,revision:rev,profile:draft});rev=r.revision;draft=r.profile;active.system=draft.name;old.value=draft.name;$('#room-synopsis').textContent=draft.name;$('#profile-status').textContent='Sistema salvo — novas fichas usarão estes campos';form.dataset.dirty='false';dirty=$('#admin-status').textContent==='Alterações não salvas';}catch(error){$('#profile-status').textContent=error.message;throw error;}finally{button.disabled=false;}});};
}

async function genericCharacterEditor(c){
  let rev=c.revision;const values={...c.fields},overrides=new Set(c.build.overrides||[]);
  const groups=[...new Set(c.profile.fields.map(f=>f.group))];
  $('#workspace-content').innerHTML=`<div class="row"><h2>${esc(c.name)}</h2><button id="generic-back" class="secondary">← Personagens</button></div><p>${esc(c.profile.name)} · ${esc(c.profile.edition)}</p><form id="generic-sheet">${groups.map((group,i)=>`<details class="sheet-section" ${i===0?'open':''}><summary>${esc(group)}</summary><div class="compact-grid">${c.profile.fields.filter(f=>f.group===group).map(f=>`<label>${esc(f.label)}${f.type==='longtext'?`<textarea name="${esc(f.id)}">${esc(values[f.id]??'')}</textarea>`:`<input name="${esc(f.id)}" ${f.type==='number'?'type="number" step="any"':''} value="${esc(values[f.id]??'')}" ${f.formula&&!overrides.has(f.id)?'readonly':''}>`}${f.formula?`<small>ƒ ${esc(f.formula)}</small><span><input type="checkbox" data-override="${esc(f.id)}" ${overrides.has(f.id)?'checked':''}> Ajuste manual</span>`:''}</label>`).join('')}</div></details>`).join('')}<div class="sheet-actions"><button>Salvar ficha</button><span id="generic-status" role="status">Os cálculos são atualizados ao salvar.</span></div></form>`;
  $('#generic-back').onclick=()=>{if(canLeave())act(characterView);};
  const form=$('#generic-sheet');form.oninput=(e)=>{if(e.target.id==='field-search')return;dirty=true;$('#generic-status').textContent='Alterações não salvas';};
  form.querySelectorAll('[data-override]').forEach(x=>x.onchange=()=>{const k=x.dataset.override;if(x.checked)overrides.add(k);else overrides.delete(k);form.elements.namedItem(k).readOnly=!x.checked;});
  form.onsubmit=e=>{e.preventDefault();act(()=>runSheetSave(form,async()=>{
   const fields=Object.fromEntries(new FormData(form));
   const r=await api('character',{table_id:active.id,id:c.id,revision:rev,fields,overrides:[...overrides]});
   rev=r.revision;
   for(const f of c.profile.fields){const el=form.elements.namedItem(f.id);if(el)el.value=r.fields[f.id]??'';}
   dirty=false;await characterView(c.id);showFeedback('Personagem salvo.');
  }));};
  mountSheetWorkspace(form);
}
