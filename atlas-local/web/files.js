async function preview(id, name, mime) {
  $("#dialog-title").textContent = name;
  const b = $("#dialog-body");
  b.replaceChildren();
  if (mime.startsWith("image/")) {
    const x = document.createElement("img");
    x.src = assetUrl(id);
    x.alt = name;
    b.append(x);
  } else if (mime === "application/pdf") {
    const x = document.createElement("iframe");
    x.src = assetUrl(id);
    x.title = name;
    b.append(x);
  } else if (mime.startsWith("audio/")) {
    const x = document.createElement("audio");
    x.src = assetUrl(id);
    x.controls = true;
    b.append(x);
  } else {
    const r = await fetch(assetUrl(id));
    if (!r.ok) throw Error("Arquivo indisponível.");
    const x = document.createElement("pre");
    x.textContent = await r.text();
    b.append(x);
  }
  $("#dialog").showModal();
}
async function sendScene(id, map_id = null, fog = false) {
  await api("scene", { table_id: active.id, asset_id: id, map_id, fog });
  setSidebar(null);
  await combatView();
  notice.textContent = "Cena compartilhada.";
}
async function sceneView() {
  return combatView();
}
// Preferences are private to this browser/user/table, never campaign metadata.
function mapPreferences(){
 const key='atlas-map-catalog:'+me.id+':'+active.id;
 let value={};
 try{value=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 const prefs={query:typeof value.query==='string'?value.query:'',kind:value.kind||'',scope:value.scope||'',favorites:Array.isArray(value.favorites)?value.favorites:[],recent:Array.isArray(value.recent)?value.recent:[],versions:value.versions&&typeof value.versions==='object'?value.versions:{}};
 return {prefs,save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}}};
}
const mapSearchText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
async function mapView() {
 const maps=await api('maps?table_id='+active.id),{prefs,save}=mapPreferences();
 const kinds={regional:'Regional',encounter:'Encontro',unclassified:'Não classificado'};
 $('#workspace-content').innerHTML=`<div class="row"><h2>Mapas</h2>${active.role==='owner'?'<button id="import">Importar catálogo</button>':''}</div>
 <div class="map-filters"><label>Buscar<input id="search" type="search" placeholder="Nome, região ou etiqueta" value="${esc(prefs.query)}"></label>
 <label>Tipo<select id="map-kind"><option value="">Todos os tipos</option>${Object.entries(kinds).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
 <label>Exibir<select id="map-scope"><option value="">Todos</option><option value="favorites">Favoritos</option><option value="recent">Recentes</option></select></label>
 <button id="map-clear" class="secondary">Limpar filtros</button></div><p id="map-count" role="status"></p><div id="map-list" class="grid"></div>`;
 $('#map-kind').value=prefs.kind;$('#map-scope').value=prefs.scope;
 function remember(id){prefs.recent=[id,...prefs.recent.filter(x=>x!==id)].slice(0,30);save();}
 function render(){
  prefs.query=$('#search').value;prefs.kind=$('#map-kind').value;prefs.scope=$('#map-scope').value;save();
  const words=mapSearchText(prefs.query).trim().split(/\s+/).filter(Boolean);
  let filtered=maps.filter(m=>{const text=mapSearchText([m.title,m.metadata?.region,...(m.metadata?.tags||[])].join(' '));return words.every(w=>text.includes(w))&&(!prefs.kind||(m.metadata?.kind||'unclassified')===prefs.kind)&&(!prefs.scope||(prefs.scope==='favorites'?prefs.favorites:prefs.recent).includes(m.id));});
  if(prefs.scope==='recent')filtered.sort((a,b)=>prefs.recent.indexOf(a.id)-prefs.recent.indexOf(b.id));
  $('#map-count').textContent=filtered.length+' de '+maps.length+' mapas';
  $('#map-list').innerHTML=filtered.map(m=>{
   const favorite=prefs.favorites.includes(m.id),variant=m.images.find(v=>v.asset_id===prefs.versions[m.id])||m.images[0];
   return `<article class="card"><div class="row"><small>${esc(kinds[m.metadata?.kind]||kinds.unclassified)}</small><button class="secondary map-favorite" data-map-favorite="${esc(m.id)}" aria-pressed="${favorite}" aria-label="${favorite?'Remover dos':'Adicionar aos'} favoritos: ${esc(m.title)}">${favorite?'★':'☆'}</button></div>
   ${variant?`<img class="thumb" loading="lazy" src="${assetUrl(variant.asset_id)}" alt="${esc(m.title)}">`:'<p>Imagem não vinculada</p>'}<h3>${esc(m.title)}</h3><p>${esc(m.metadata?.region||'')}</p>
   <div class="map-tags">${(m.metadata?.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
   ${variant?`<label>Horário / versão<select data-version="${esc(m.id)}">${m.images.map(v=>`<option value="${v.asset_id}" ${v.asset_id===variant.asset_id?'selected':''}>${esc(v.period)}</option>`).join('')}</select></label>
   <div class="row"><button data-open-map="${esc(m.id)}">${isMaster()?'Prévia privada':'Abrir mapa'}</button>${isMaster()?`<button data-send="${esc(m.id)}" class="secondary">Mostrar aos jogadores</button><button data-send-fog="${esc(m.id)}" class="secondary">Mostrar com névoa</button>`:''}</div>`:''}
   ${isMaster()?`<details><summary>Notas do mestre</summary><p style="white-space:pre-wrap">${esc(m.metadata?.notes||'Sem notas')}</p></details>`:''}</article>`;
  }).join('')||'<p class="empty">Nenhum mapa corresponde aos filtros. Use “Limpar filtros” para ver o catálogo.</p>';
  const version=id=>prefs.versions[id]||maps.find(m=>m.id===id).images[0].asset_id;
  document.querySelectorAll('[data-version]').forEach(select=>{prefs.versions[select.dataset.version]=select.value;select.onchange=()=>{prefs.versions[select.dataset.version]=select.value;save();select.closest('article').querySelector('img').src=assetUrl(select.value);};});
  document.querySelectorAll('[data-map-favorite]').forEach(b=>b.onclick=()=>{const id=b.dataset.mapFavorite;prefs.favorites=prefs.favorites.includes(id)?prefs.favorites.filter(x=>x!==id):[...prefs.favorites,id];save();render();document.querySelector('[data-map-favorite="'+id+'"]')?.focus();});
  document.querySelectorAll('[data-open-map]').forEach(b=>b.onclick=()=>act(async()=>{const id=b.dataset.openMap;remember(id);await navigateMap(id,version(id));}));
  for(const [selector,key,covered] of [['[data-send]','send',false],['[data-send-fog]','sendFog',true]])document.querySelectorAll(selector).forEach(b=>b.onclick=()=>act(async()=>{const id=b.dataset[key];await sendScene(version(id),id,covered);remember(id);}));
 }
 render();$('#search').oninput=render;$('#map-kind').onchange=render;$('#map-scope').onchange=render;
 $('#map-clear').onclick=()=>{$('#search').value='';$('#map-kind').value='';$('#map-scope').value='';render();$('#search').focus();};
 if(active.role==='owner')$('#import').onclick=()=>act(async()=>{const r=await api('import-legacy',{table_id:active.id});await mapView();notice.textContent=r.message;});
}
async function fileView() {
  let files = [];
  target = me.id;
  $("#workspace-content").innerHTML =
    `<h2>Biblioteca e organização pessoal</h2><p>Pastas e títulos pessoais não alteram a biblioteca do mestre.</p><div class="row"><input id="file-search" placeholder="Pesquisar arquivo ou pasta" aria-label="Pesquisar arquivos"><select id="file-owner" aria-label="Coleção do participante">${(isMaster() ? members : [me]).map((m) => `<option value="${m.id}" ${m.id === me.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></div>${isMaster() ? '<label>Adicionar arquivo (até 10 MiB)<input id="upload" type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md,.mp3,.ogg,.wav"></label>' : ""}<div class="grid" id="file-list"></div>`;
  async function load() {
    target = $("#file-owner").value;
    files = await api("assets?table_id=" + active.id + "&user_id=" + target);
    render();
  }
  function render() {
    const q = $("#file-search").value.toLowerCase();
    $("#file-list").innerHTML =
      files
        .filter((f) =>
          (f.name + " " + f.folder + " " + f.label).toLowerCase().includes(q),
        )
        .map(
          (f) =>
            `<article class="card"><small>${esc(f.folder || "Sem pasta")} · ${(f.size / 1024 ** 2).toFixed(1)} MiB</small><h3>${esc(f.label || f.name)}</h3><div class="row"><button data-file="${f.id}">Abrir</button><button class="secondary" data-organize="${f.id}">Organizar</button>${isMaster() ? `<button class="secondary" data-grant="${f.id}">Acesso</button>${f.mime.startsWith("image/") ? `<button class="secondary" data-scene="${f.id}">Enviar à mesa</button><button data-scene-fog="${f.id}" class="secondary">Enviar com névoa</button>` : ""}` : ""}</div></article>`,
        )
        .join("") || '<div class="empty">Nenhum arquivo liberado.</div>';
    document.querySelectorAll("[data-file]").forEach(
      (b) =>
        (b.onclick = () =>
          act(() => {
            const f = files.find((f) => f.id === b.dataset.file);
            return preview(f.id, f.label || f.name, f.mime);
          })),
    );
    document
      .querySelectorAll("[data-scene]")
      .forEach(
        (b) => (b.onclick = () => act(() => sendScene(b.dataset.scene))),
      );
    document.querySelectorAll("[data-organize]").forEach(
      (b) =>
        (b.onclick = () => {
          const f = files.find((f) => f.id === b.dataset.organize);
          $("#dialog-title").textContent = "Organizar arquivo";
          $("#dialog-body").innerHTML =
            `<form id="organize-file"><label>Pasta pessoal<input name="folder" maxlength="200" value="${esc(f.folder)}" placeholder="Ex.: Locais/Fazenda/Documentos"></label><label>Título<input name="label" maxlength="200" value="${esc(f.label || f.name)}"></label><button>Salvar organização</button></form>`;
          $("#dialog").showModal();
          $("#organize-file").onsubmit = (e) => {
            e.preventDefault();
            act(async () => {
              await api("organize", {
                table_id: active.id,
                id: f.id,
                user_id: target,
                ...Object.fromEntries(new FormData(e.target)),
              });
              $("#dialog").close();
              await load();
            });
          };
        }),
    );
    document.querySelectorAll("[data-scene-fog]").forEach(b => b.onclick = () => act(() => sendScene(b.dataset.sceneFog,null,true)));
    document.querySelectorAll("[data-grant]").forEach(
      (b) =>
        (b.onclick = () => {
          const f = files.find((f) => f.id === b.dataset.grant);
          $("#dialog-title").textContent = "Acesso: " + f.name;
          $("#dialog-body").innerHTML =
            `<form id="grants"><label><input type="checkbox" name="public" ${f.public ? "checked" : ""}> Todos os participantes</label>${members
              .filter((m) => m.role === "player")
              .map(
                (m) =>
                  `<label><input type="checkbox" name="users" value="${m.id}" ${f.grants.includes(m.id) ? "checked" : ""}> ${esc(m.name)}</label>`,
              )
              .join(
                "",
              )}<p>Mestres sempre têm acesso. Revogar não apaga cópias já baixadas.</p><button>Salvar acesso</button></form>`;
          $("#dialog").showModal();
          $("#grants").onsubmit = (e) => {
            e.preventDefault();
            act(async () => {
              const fd = new FormData(e.target);
              await api("asset-grants", {
                table_id: active.id,
                id: f.id,
                public: fd.has("public"),
                users: fd.getAll("users"),
              });
              $("#dialog").close();
              await load();
            });
          };
        }),
    );
  }
  $("#file-owner").onchange = () => act(load);
  $("#file-search").oninput = render;
  if (isMaster())
    $("#upload").onchange = () =>
      act(async () => {
        const f = $("#upload").files[0];
        if (!f) return;
        if (f.size > 10 * 1024 ** 2) throw Error("Limite de 10 MiB.");
        const content = await new Promise((yes, no) => {
          const reader = new FileReader();
          reader.onload = () => yes(reader.result.split(",")[1]);
          reader.onerror = no;
          reader.readAsDataURL(f);
        });
        await api("upload", { table_id: active.id, name: f.name, content });
        await load();
        notice.textContent =
          "Arquivo enviado. Acesso inicial somente dos mestres.";
      });
  await load();
}
