async function openTokenCharacter(id) {
  if (sidebarLoading || !canLeave()) return;
  await openWorkspacePanel("characters");
  if (currentPanel !== "characters") return;
  await characterEditor(id);
}

function characterSections(selected) {
 if(!isMaster())return '';
 return `<nav class="character-sections" aria-label="Coleção de personagens"><button type="button" data-collection="characters" aria-pressed="${selected==='characters'}">Personagens</button><button type="button" data-collection="saved" aria-pressed="${selected==='saved'}">Tokens salvos</button></nav>`;
}
function bindCharacterSections() {
 document.querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>act(async()=>{if(!canLeave())return;await (b.dataset.collection==='saved'?savedTokenView():characterView());}));
}
async function characterView(highlightId) {
  const rows = await api("characters?table_id=" + active.id);
  const art = isMaster()?await tokenPortraitCatalog():await (await import('/combat/asset-library.mjs')).loadTokenCatalog();
  const profile = (await api("system-profile?table_id="+active.id)).profile;
  let templates = [];
  if (isMaster())
    templates = (await api("assets?table_id=" + active.id)).filter(
      (a) => a.mime === "application/pdf",
    );
  $("#workspace-content").innerHTML =
    characterSections("characters") + `<p class="muted">Arraste um personagem para o mapa ou use ＋. Clique no retrato para trocar a imagem.</p><div class="character-roster">${rows.map(r=>{const pic=art.find(a=>a.id===r.appearance);const image=pic?.image||(r.appearance?.startsWith('custom-')?'/api/token-art?table_id='+active.id+'&id='+encodeURIComponent(r.appearance):'');return `<article class="roster-card" draggable="true" data-roster="${esc(r.id)}"><button class="roster-portrait" data-portrait="${esc(r.id)}" title="Alterar imagem de ${esc(r.name)}" aria-label="Alterar imagem de ${esc(r.name)}">${image?`<img src="${esc(image)}" draggable="false" alt="">`:'<span>♟</span>'}<small>✎</small></button><div class="roster-copy"><strong>${esc(r.name)}</strong><button class="roster-sheet" data-character="${r.id}">Abrir ficha</button></div><button class="secondary roster-add" data-deploy="${r.id}" title="Inserir no centro da área visível" aria-label="Inserir ${esc(r.name)} no mapa">＋</button></article>`;}).join('')}</div>${isMaster() ? `<form id="new-character" class="card"><h3>Criar personagem</h3><label>Nome<input name="name" required maxlength="120"></label><label>Jogador responsável<select name="user_id">${members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></label><label>Modelo PDF<select name="template_id">${profile.engine === "generic" ? '<option value="">Ficha configurável do Atlas</option>' : ""}${templates.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label><button ${templates.length || profile.engine === "generic" ? "" : "disabled"}>Criar ficha</button><p>Envie modelos preenchíveis pela Biblioteca. A ficha de Estigma acompanha o acervo completo.</p></form>` : ""}`;
  bindCharacterSections();
  if(highlightId){const card=[...document.querySelectorAll("[data-roster]")].find(c=>c.dataset.roster===highlightId);card?.classList.add("roster-updated");card?.querySelector("[data-character]")?.focus({preventScroll:true});card?.scrollIntoView({block:"nearest"});}
  document
    .querySelectorAll("[data-character]")
    .forEach(
      (b) =>
        (b.onclick = () => act(() => characterEditor(b.dataset.character))),
    );
  document.querySelectorAll('[data-roster]').forEach(card=>{card.ondragstart=e=>{e.dataTransfer.setData('application/x-atlas-character',card.dataset.roster);e.dataTransfer.effectAllowed='copy';};});
  document.querySelectorAll('[data-deploy]').forEach(b=>b.onclick=()=>act(()=>{if(!sceneActions.deploy)throw Error('Escolha um mapa primeiro.');return sceneActions.deploy(b.dataset.deploy);}));
  document.querySelectorAll('[data-portrait]').forEach(b=>b.onclick=()=>act(()=>chooseCharacterPortrait(rows.find(c=>c.id===b.dataset.portrait))));
  if (isMaster())
    $("#new-character").onsubmit = (e) => {
      e.preventDefault();
      act(async () => {
        const r = await api("characters", {
          table_id: active.id,
          ...Object.fromEntries(new FormData(e.target)),
        });
        await characterEditor(r.id);
      });
    };
}
async function characterEditor(id) {
  const c = await api("character", { table_id: active.id, id });
  if(c.engine === "generic") return genericCharacterEditor(c);
  const rules = await api("character-rules?table_id=" + active.id);
  let rev = c.revision,
    calc = null,
    request = 0,
    timer;
  const compatible = c.build?.engine !== "pdf-generic" && ["atributo_CON", "pv_maximo", "raca", "classe"].every(
    (k) => c.definitions.some((f) => f.key === k),
  );
  const values = { ...c.fields };
  if (!values.nome) values.nome = c.name;
  const groups = {
    Identidade: [],
    Atributos: [],
    "Recursos e defesa": [],
    Perícias: [],
    "Poderes e magias": [],
    Inventário: [],
    "Descrição e anotações": [],
  };
  function group(k) {
    if (["nome", "raca", "classe"].includes(k)) return "Identidade";
    if (k.startsWith("skill_") || k === "pp") return "Perícias";
    if (/^(item_|efeito_p3_|detalhamento_|moedas)/.test(k)) return "Inventário";
    if (/^(poder_|efeito_|resistencia_)/.test(k)) return "Poderes e magias";
    if (k.startsWith("atributo_")) return "Atributos";
    if (/^(pv_|pd_|def_|cond_)/.test(k)) return "Recursos e defesa";
    return "Descrição e anotações";
  }
  c.definitions.forEach((f) => groups[group(f.key)].push(f));
  function field(f) {
    const v = values[f.key] ?? "";
    let control;
    if (compatible && ["raca", "classe"].includes(f.key)) {
      const opts = f.key === "raca" ? rules.races : rules.classes;
      control = `<select name="${f.key}"><option value="">Selecione</option>${(!opts.includes(
        v,
      ) && v
        ? [v]
        : []
      )
        .concat(opts)
        .map((x) => `<option ${v === x ? "selected" : ""}>${esc(x)}</option>`)
        .join("")}</select>`;
    } else
      control = f.multiline
        ? `<textarea name="${esc(f.key)}">${esc(v)}</textarea>`
        : `<input name="${esc(f.key)}" value="${esc(v)}" ${/^(atributo_|pv_|pd_|def_|skill_.*nivel|pp$)/.test(f.key) ? 'inputmode="decimal"' : ""}>`;
    return `<label class="sheet-field" data-field-label="${esc(f.label.toLocaleLowerCase())}">${esc(f.label)}${control}</label>`;
  }
  const b = c.build || {},
    extras = b.extras || {};
  $("#workspace-content").innerHTML =
    `<div class="row sheet-heading"><h2>${esc(c.name)}</h2><button class="secondary" id="back-characters">← Personagens</button></div><p class="sheet-caption">Ficha de personagem · PDF editável</p><form id="character-fields">${
      compatible
        ? `<details class="sheet-section" open><summary>Assistente de criação • Estigma do Caos</summary><label><input type="checkbox" id="auto-stats" ${b.auto ? "checked" : ""}> Calcular PV máximo, PD máximo e Defesa natural ao salvar</label><p>Escolha raça e classe, depois informe os cinco atributos da sua Lótus. A distribuição de classe permanece manual: os valores do diagrama ainda precisam de conferência visual. Você pode editar 2 pontos conforme o livro.</p><div id="stat-summary" class="stat-summary"></div><label id="race-skill-label">Perícia racial à escolha<select id="race-skill"></select></label><div id="class-powers">${Object.entries(
            rules.powers,
          )
            .map(
              ([key, [cls, label]]) =>
                `<label data-power-class="${cls}"><input type="checkbox" data-power="${key}" ${b.powers?.includes(key) ? "checked" : ""}> ${esc(label)}</label>`,
            )
            .join(
              "",
            )}</div><details><summary>Ajustes da mesa e composição dos valores</summary><div class="compact-grid">${Object.entries(
            rules.extras,
          )
            .map(
              ([key, label]) =>
                `<label>${label}<input type="number" step="any" data-extra="${key}" value="${extras[key] || 0}"></label>`,
            )
            .join(
              "",
            )}</div><div id="stat-formulas"></div><small>${esc(rules.source)}</small></details><div class="row"><button type="button" id="calc-now" class="secondary">Recalcular</button><button type="button" id="initial-resources" class="secondary">Preencher recursos iniciais</button><button type="button" id="class-skills" class="secondary">Aplicar perícias iniciais de raça e classe</button></div><small>Recursos iniciais preenchem somente PV atual, PD atual e PP vazios. Perícias mantêm níveis já adquiridos. A troca de classe não remove progressão anterior.</small></details>`
        : ""
    }<section id="origin-abilities" class="sheet-section" aria-label="Habilidades automáticas" hidden></section><label>Buscar campo<input id="field-search" type="search" placeholder="Ex.: Fortitude, armadura, descrição"></label>${Object.entries(
      groups,
    )
      .filter(([, fs]) => fs.length)
      .map(
        ([title, fs], i) =>
          `<details class="sheet-section" ${i < 2 ? "open" : ""}><summary>${title} <small>${fs.length} campos</small></summary><div class="sheet-fields">${fs.map(field).join("")}</div></details>`,
      )
      .join(
        "",
      )}<div class="sheet-actions"><button>Salvar ficha</button><button type="button" id="export-character" class="secondary">Salvar e abrir PDF</button><span id="character-status" role="status">Versão ${rev}</span></div></form>`;
  const form = $("#character-fields");
  const read = () => Object.fromEntries(new FormData(form));
  function build() {
    return compatible
      ? {
          auto: $("#auto-stats").checked,
          race_skill: $("#race-skill").value,
          powers: [...form.querySelectorAll("[data-power]:checked")].map(
            (x) => x.dataset.power,
          ),
          extras: Object.fromEntries(
            [...form.querySelectorAll("[data-extra]")].map((x) => [
              x.dataset.extra,
              Number(x.value),
            ]),
          ),
        }
      : b;
  }
  function renderAbilities() {
    const host = $("#origin-abilities");
    if (!compatible) return;
    const fields = read();
    const abilities = (rules.abilities || []).filter(a => fields[a.kind === "race" ? "raca" : "classe"] === a.origin);
    host.hidden = false;
    host.innerHTML = `<h3>Habilidades de origem <small>${abilities.length}</small></h3><p>Incluídas automaticamente pela raça e classe. Trocar a origem atualiza esta lista e o anexo do PDF; seus poderes e anotações manuais permanecem.</p>${abilities.length ? ["race", "class"].map(kind => {
      const list = abilities.filter(a => a.kind === kind);
      if (!list.length) return "";
      return `<h4>${kind === "race" ? "Raça" : "Classe"} · ${esc(list[0].origin)}</h4>` + list.map(a => `<details class="origin-ability" data-ability="${a.id}"><summary>${esc(a.name)} <small>${esc(a.cost)}</small></summary><p>${esc(a.description)}</p><small>${esc(a.source)}</small></details>`).join("");
    }).join("") : "<p>Selecione uma raça ou classe em Identidade.</p>"}<small>Incluir a habilidade não ativa seus custos, efeitos temporários ou bônus condicionais. Use os controles de cálculo e resolva escolhas com o mestre.</small>`;
  }
  renderAbilities();
  function mark() {
    dirty = true;
    $("#character-status").textContent = "Alterações não salvas";
  }
  async function recalc() {
    if (!compatible) return;
    const seq = ++request,
      fields = read();
    const choices = rules.skillChoices[fields.raca] || [],
      cs = $("#race-skill");
    if (cs.dataset.race !== fields.raca) {
      cs.innerHTML =
        '<option value="">Escolha uma perícia</option>' +
        choices
          .map((n) => {
            const k = "skill_" + String(n).padStart(2, "0") + "_nivel";
            return `<option value="${n}">${esc(c.definitions.find((f) => f.key === k)?.label || k)}</option>`;
          })
          .join("");
      cs.value = String(b.race_skill || "");
      cs.dataset.race = fields.raca;
    }
    $("#race-skill-label").hidden = !choices.length;
    form
      .querySelectorAll("[data-power-class]")
      .forEach((x) => (x.hidden = x.dataset.powerClass !== fields.classe));
    const automatic = $("#auto-stats").checked;
    ["pv_maximo", "pd_maximo", "def_natural"].forEach((k) => {
      if (form.elements[k]) form.elements[k].readOnly = automatic;
    });
    try {
      const r = await api("character-calculate", {
        table_id: active.id,
        fields,
        build: build(),
      });
      if (seq !== request || !document.contains(form)) return;
      calc = r;
      $("#stat-summary").innerHTML = Object.entries(r.stats)
        .map(
          ([label, v]) =>
            `<div><small>${esc(label)}</small><strong>${v}</strong></div>`,
        )
        .join("");
      $("#stat-formulas").innerHTML =
        Object.entries(r.formulas)
          .map(([k, v]) => `<p><b>${k}</b>: ${esc(v)}</p>`)
          .join("") + r.warnings.map((w) => `<p>${esc(w)}</p>`).join("");
      if (automatic)
        Object.entries(r.fields).forEach(([k, v]) => {
          if (form.elements[k]) form.elements[k].value = v;
        });
    } catch (e) {
      if (seq !== request || !document.contains(form)) return;
      calc = null;
      $("#stat-summary").textContent = e.message;
    }
  }
  form.oninput = (e) => {
    if (e.target.id === "field-search") return;
    mark();
    if (["raca", "classe"].includes(e.target.name)) renderAbilities();
    clearTimeout(timer);
    if (compatible) timer = setTimeout(() => act(recalc), 250);
  };
  async function save() {
    clearTimeout(timer);
    request++;
    const r = await api("character", {
      table_id: active.id,
      id,
      fields: read(),
      build: build(),
      revision: rev,
    });
    rev = r.revision;
    Object.entries(r.fields).forEach(([k, v]) => {
      if (form.elements[k]) form.elements[k].value = v;
    });
    dirty = false;
    $("#character-status").textContent = "Salvo • versão " + rev;
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    act(()=>runSheetSave(form,async()=>{
      await save();await characterView(id);showFeedback('Personagem salvo.');
    }));
  };
  $("#back-characters").onclick = () =>
    act(async () => {
      if (canLeave()) {
        request++;
        clearTimeout(timer);
        await characterView();
      }
    });
  $("#export-character").onclick = () =>
    act(() => runSheetSave(form,async () => {
      await save();
      $("#dialog-title").textContent = c.name;
      $("#dialog-body").replaceChildren();
      const frame = document.createElement("iframe");
      frame.title = "Ficha preenchida";
      frame.src = "/api/character-pdf?table_id=" + active.id + "&id=" + id;
      $("#dialog-body").append(frame);
      $("#dialog").showModal();
    }));
  $("#field-search").oninput = (e) => {
    const q = e.target.value.trim().toLocaleLowerCase();
    form
      .querySelectorAll("[data-field-label]")
      .forEach((x) => (x.hidden = !x.dataset.fieldLabel.includes(q)));
    form.querySelectorAll(".sheet-section").forEach((section) => {
      if (section.querySelector(".sheet-fields")) {
        section.hidden = ![...section.querySelectorAll(".sheet-field")].some(
          (x) => !x.hidden,
        );
        if (q && !section.hidden) section.open = true;
      }
    });
  };
  if (compatible) {
    $("#calc-now").onclick = () => act(recalc);
    $("#initial-resources").onclick = () =>
      act(async () => {
        await recalc();
        if (!calc) return;
        for (const [k, v] of Object.entries({
          pv_atual: calc.fields.pv_maximo,
          pd_atual: calc.fields.pd_maximo,
          pp: calc.stats["PP iniciais"],
        })) {
          if (form.elements[k] && !form.elements[k].value)
            form.elements[k].value = v;
        }
        mark();
      });
    $("#class-skills").onclick = () =>
      act(async () => {
        await recalc();
        if (!calc) return;
        for (const [k, v] of Object.entries(calc.skills)) {
          if (
            form.elements[k] &&
            Number(form.elements[k].value || 0) < Number(v)
          )
            form.elements[k].value = v;
        }
        mark();
        await recalc();
      });
    await recalc();
  }
  mountSheetWorkspace(form);
}

async function chooseCharacterPortrait(character){
 const {loadTokenCatalog}=await import('/combat/asset-library.mjs');
 let art=isMaster()?await tokenPortraitCatalog():await loadTokenCatalog();
 const tid=active.id;
 $('#dialog-title').textContent='Token de '+character.name;
 $('#dialog-body').innerHTML=`<div class="portrait-picker"><label>Buscar imagem<input type="search" class="portrait-search" placeholder="Urso, goblin, guerreiro…"></label><button class="portrait-upload secondary">Criar com imagem</button><p class="muted">Define a imagem das próximas inserções. Tokens já na cena mantêm sua aparência.</p><div class="portrait-options"></div><p class="portrait-status" role="status"></p></div>`;
 const host=$('.portrait-picker');let busy=false;
 async function choose(id){if(busy)return;busy=true;try{await api('character-portrait',{table_id:tid,id:character.id,revision:character.revision,appearance:id});$('#dialog').close();if(active?.id===tid)await characterView();}catch(e){host.querySelector('.portrait-status').textContent=e.message;}finally{busy=false;}}
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){const q=norm(host.querySelector('input').value);host.querySelector('.portrait-options').innerHTML='<button data-art="" title="Usar iniciais">♟<small>Iniciais</small></button>'+art.filter(a=>norm(a.name+' '+(a.family_name||'')).includes(q)).map(a=>`<button data-art="${esc(a.id)}" title="${esc(a.name)}" aria-pressed="${a.id===character.appearance}"><img src="${esc(a.thumbnail||a.image)}" alt="" loading="lazy"><small>${esc(a.name)}</small></button>`).join('');host.querySelectorAll('[data-art]').forEach(b=>b.onclick=()=>choose(b.dataset.art));}
 host.querySelector('input').oninput=render;
 host.querySelector('.portrait-upload').onclick=()=>act(async()=>{
  const {openTokenMaker}=await import('/combat/token-maker.mjs');
  openTokenMaker({save:({content})=>api('character-portrait',{table_id:tid,id:character.id,revision:character.revision,content}),onSaved:async()=>{$('#dialog').close();if(active?.id===tid)await characterView();}});
 });
 render();$('#dialog').showModal();host.querySelector('input').focus();
}
async function savedTokenView(){
 if(!isMaster())return;
 const [rows,art]=await Promise.all([api('saved-tokens?table_id='+active.id),tokenPortraitCatalog()]);
 const host=$('#workspace-content');host.innerHTML=characterSections('saved')+`<p class="muted">Botão direito no token → Salvar token. Arraste um card para reutilizá-lo.</p><button type="button" class="secondary" id="saved-refresh">↻ Atualizar tokens</button><label>Buscar modelo<input id="saved-search" type="search" placeholder="Nome do token"></label><div class="saved-roster character-roster"></div>`;
 function render(){const q=$('#saved-search').value.toLocaleLowerCase('pt-BR');host.querySelector('.saved-roster').innerHTML=rows.filter(t=>t.name.toLocaleLowerCase('pt-BR').includes(q)).map(t=>{const pic=art.find(a=>a.id===t.appearance);return `<article class="roster-card" draggable="true" data-saved="${esc(t.id)}">${pic?`<img class="roster-image" src="${esc(pic.thumbnail||pic.image)}" alt="" draggable="false">`:'<span class="npc-avatar">♟</span>'}<div class="roster-copy"><strong>${esc(t.name)}</strong><small>Movimento: ${t.budget}</small></div><button class="secondary" data-use="${t.id}" aria-label="Inserir ${esc(t.name)}">＋</button><button class="secondary" data-remove="${t.id}" aria-label="Excluir modelo ${esc(t.name)}">×</button></article>`;}).join('')||'<p class="empty">Nenhum token salvo.</p>';
 host.querySelectorAll('[data-saved]').forEach(card=>card.ondragstart=e=>{e.dataTransfer.setData('application/x-atlas-saved-token',card.dataset.saved);e.dataTransfer.effectAllowed='copy';});
 host.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>act(()=>{if(!sceneActions.saved)throw Error('Escolha um mapa primeiro.');return sceneActions.saved(b.dataset.use);}));
 host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>act(async()=>{if(!confirm('Remover este modelo salvo? Os tokens na cena serão preservados.'))return;await api('saved-tokens',{table_id:active.id,id:b.dataset.remove,delete:true});rows.splice(rows.findIndex(t=>t.id===b.dataset.remove),1);render();}));
 }
 bindCharacterSections();$('#saved-refresh').onclick=()=>act(savedTokenView);$('#saved-search').oninput=render;render();
}

// One reusable sheet workspace; fields remain in their original form and retain names.
function mountSheetWorkspace(form) {
 const host=form.parentElement;
 const sections=[...form.children].filter(n=>n.classList.contains('sheet-section')&&!n.hidden);
 if(!sections.length)return;
 form.classList.add('sheet-workspace');
 const heading=host.querySelector('h2');
 if(heading)heading.closest('.row')?.classList.add('sheet-identity-header');
 const actions=form.querySelector('.sheet-actions');
 const tools=document.createElement('div');tools.className='sheet-tools';
 let search=form.querySelector('#field-search');
 if(!search){const label=document.createElement('label');label.textContent='Buscar campo';search=document.createElement('input');search.type='search';search.id='field-search';search.placeholder='Nome, atributo, equipamento…';label.append(search);tools.append(label);}
 else tools.append(search.closest('label'));
 const nav=document.createElement('nav');nav.className='sheet-navigation';nav.setAttribute('aria-label','Seções da ficha');tools.append(nav);
 const main=document.createElement('div');main.className='sheet-pages';
 const empty=document.createElement('p');empty.className='empty';empty.textContent='Nenhum campo encontrado.';empty.hidden=true;main.append(empty);
 const normalized=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const pages=sections.map((section,i)=>{
  const title=section.querySelector(':scope > summary, :scope > h3');
  const label=title?.childNodes[0]?.textContent?.trim()||'Habilidades';
  const button=document.createElement('button');button.type='button';button.textContent=label.replace('Assistente de criação • Estigma do Caos','Cálculos');button.className='sheet-nav-item';
  const ident='sheet-page-'+i;
  section.id=section.id||ident;section.classList.add('sheet-page');section.open=true;
  button.setAttribute('aria-controls',section.id);button.setAttribute('aria-pressed','false');
  // The outer details is now a page; inner disclosures stay independently usable.
  if(section.tagName==='DETAILS'&&title){title.addEventListener('click',e=>e.preventDefault());title.tabIndex=-1;}
  nav.append(button);main.append(section);
  return {section,button,scroll:0};
 });
 form.prepend(tools,main);if(actions)form.append(actions);
 let selected=pages.findIndex(p=>p.button.textContent==='Identidade');if(selected<0)selected=0;
 function activate(index,focus=false){
  pages[selected].scroll=main.scrollTop;selected=index;
  pages.forEach((p,i)=>{p.section.classList.toggle('sheet-page-visible',i===index);p.button.setAttribute('aria-pressed',String(i===index));});
  main.scrollTop=pages[index].scroll;
  if(focus)pages[index].button.focus();
 }
 function filter(){
  const q=normalized(search.value.trim());
  for(const p of pages){
   const labels=[...p.section.querySelectorAll('.sheet-field, .compact-grid > label')];
   for(const field of labels){if(!field.dataset.fieldLabel)field.dataset.fieldLabel=field.firstChild?.textContent||field.textContent;field.hidden=!!q&&!normalized(field.dataset.fieldLabel).includes(q);}
   p.match=!q||(labels.length?labels.some(f=>!f.hidden):normalized(p.section.textContent).includes(q));
   p.button.hidden=!p.match;
  }
  const first=pages.findIndex(p=>p.match);empty.hidden=first!==-1;
  if(first===-1){pages.forEach(p=>p.section.classList.remove('sheet-page-visible'));return;}
  activate(pages[selected].match?selected:first);
 }
 pages.forEach((p,i)=>p.button.onclick=()=>activate(i));
 search.oninput=filter;
 form.addEventListener('invalid',e=>{const i=pages.findIndex(p=>p.section.contains(e.target));if(i>=0){search.value='';filter();activate(i);for(const d of e.target.closest('.sheet-page').querySelectorAll('details'))d.open=true;}},true);
 // Preserve existing dirty/recalculation handlers; search is purely local UI.
 search.addEventListener('input',e=>e.stopPropagation());
 activate(selected);
}

// Lock only the submitting sheet; minimize/chat remain available while it saves.
const pendingSheets=new WeakSet();
async function runSheetSave(form,work){
 if(pendingSheets.has(form))return;
 pendingSheets.add(form);
 const previousInert=form.inert;
 const status=form.querySelector('.sheet-actions [role="status"]');
 const buttons=[...form.querySelectorAll('.sheet-actions button')].map(button=>[button,button.disabled]);
 form.setAttribute('aria-busy','true');form.inert=true;
 buttons.forEach(([button])=>button.disabled=true);
 if(status)status.textContent='Salvando…';
 try{return await work();}
 catch(error){if(status)status.textContent=error.message;throw error;}
 finally{pendingSheets.delete(form);form.inert=previousInert;form.removeAttribute('aria-busy');buttons.forEach(([button,disabled])=>button.disabled=disabled);}
}
