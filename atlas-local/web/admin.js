async function adminView(section = "0") {
  if (!isMaster()) throw Error("Apenas mestres podem administrar a mesa.");
  const [settings, maps, assets] = await Promise.all([
    api("admin-settings?table_id=" + active.id),
    api("admin-maps?table_id=" + active.id),
    api("assets?table_id=" + active.id),
  ]);
  let revision = settings.revision,
    config = cloneState(settings.config);
  $("#workspace-content").innerHTML =
    `<div class="section-heading"><h2>Administração da mesa</h2><p>Cadastre conteúdo e escolha os padrões dos próximos combates.</p></div><div class="admin-layout"><section><form id="table-settings" class="card"><h3>Identidade da mesa</h3><label>Nome<input name="name" maxlength="120" required value="${esc(settings.name)}"></label><label>Sistema de RPG<input name="system" maxlength="120" required value="${esc(settings.system)}"></label><label>Sinopse<textarea name="synopsis" maxlength="3000">${esc(settings.synopsis)}</textarea></label><details><summary>Padrão da grade</summary><p>Aplica-se a mapas sem combate salvo. Combates existentes mantêm suas configurações.</p><div class="compact-grid"><label>Raio do hexágono<input name="size" type="number" min="15" max="100" value="${config.grid.size}" required></label><label>Distância por hexágono<input name="scale" type="number" min=".1" max="100" step=".1" value="${config.grid.scale}" required></label><label>Unidade<input name="unit" maxlength="12" value="${esc(config.grid.unit)}" required></label></div><label><input name="enabled" type="checkbox" ${config.grid.enabled ? "checked" : ""}> Mostrar grid ao ativar combate</label></details><details><summary>Condições do sistema</summary><p>Cores, ícones e regras para novos combates. Editar aqui não altera efeitos de combates já salvos.</p><label>Buscar condição<input id="condition-search" type="search" placeholder="Ex.: Sangramento"></label><div id="admin-conditions"></div><button type="button" id="add-condition" class="secondary">Adicionar condição</button></details><div class="sheet-actions"><button>Salvar configurações</button><span id="admin-status">Sem alterações</span></div></form></section><section class="card"><div class="row"><h3>Mapas e versões</h3><button id="admin-new-map">Adicionar mapa</button></div><p>Use imagens da Biblioteca ou envie um arquivo durante o cadastro.</p><label>Buscar mapa<input id="admin-map-search" type="search" placeholder="Nome ou região"></label><label>Tipo<select id="admin-map-kind"><option value="all">Todos os mapas</option><option value="regional">Regionais</option><option value="encounter">Encontros</option><option value="unclassified">Não classificados</option></select></label><div id="admin-map-list"></div></section></div>`;
  const form = $("#table-settings");
  form.oninput = (e) => {
    if (e.target.id === "condition-search") return;
    dirty = true;
    $("#admin-status").textContent = "Alterações não salvas";
  };
  function conditionList() {
    const q = $("#condition-search").value.toLocaleLowerCase();
    $("#admin-conditions").innerHTML =
      config.conditions
        .filter((c) => c.name.toLocaleLowerCase().includes(q))
        .map(
          (c) =>
            `<div class="condition-row"><span class="effect-badge" style="background:${c.color}">${esc(c.icon)}</span><span>${esc(c.name)}</span><button type="button" class="secondary" data-admin-condition="${c.id}">Editar</button></div>`,
        )
        .join("") || "<p>Nenhuma condição encontrada.</p>";
    document
      .querySelectorAll("[data-admin-condition]")
      .forEach(
        (b) => (b.onclick = () => editCondition(b.dataset.adminCondition)),
      );
  }
  function editCondition(id) {
    const current = config.conditions.find((c) => c.id === id) || {
      id: "custom-" + Date.now().toString(36),
      name: "",
      icon: "◆",
      color: "#bb954e",
      description: "",
    };
    $("#dialog-title").textContent = id ? "Editar condição" : "Nova condição";
    $("#dialog-body").innerHTML =
      `<form id="admin-condition-form"><label>Nome<input name="name" maxlength="60" required value="${esc(current.name)}"></label><div class="compact-grid"><label>Ícone ou emoji<input name="icon" maxlength="12" value="${esc(current.icon)}"></label><label>Cor<input name="color" type="color" value="${current.color}"></label></div><label>Regra<textarea name="description" maxlength="3000">${esc(current.description)}</textarea></label><label><input name="stages" type="checkbox" ${current.maxStage ? "checked" : ""}> Possui três estágios</label><button>Aplicar ao rascunho</button></form>`;
    $("#dialog").showModal();
    $("#admin-condition-form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target),
        c = {
          ...current,
          name: f.get("name"),
          icon: f.get("icon"),
          color: f.get("color"),
          description: f.get("description"),
        };
      if (f.has("stages")) c.maxStage = 3;
      else delete c.maxStage;
      if (id)
        config.conditions = config.conditions.map((x) => (x.id === id ? c : x));
      else config.conditions.push(c);
      dirty = true;
      $("#admin-status").textContent = "Salve as configurações para confirmar";
      $("#dialog").close();
      conditionList();
    };
  }
  $("#add-condition").onclick = () => editCondition();
  $("#condition-search").oninput = conditionList;
  conditionList();
  form.onsubmit = (e) => {
    e.preventDefault();
    act(async () => {
      const f = new FormData(form);
      config.grid = {
        size: +f.get("size"),
        scale: +f.get("scale"),
        unit: f.get("unit"),
        enabled: f.has("enabled"),
      };
      const r = await api("admin-settings", {
        table_id: active.id,
        revision,
        config,
        name: f.get("name"),
        synopsis: f.get("synopsis"),
        system: f.get("system"),
      });
      revision = r.revision;
      Object.assign(active, {
        name: r.name,
        synopsis: r.synopsis,
        system: r.system,
      });
      $("#app h1").textContent = r.name;
      if ($("#room-synopsis")) $("#room-synopsis").textContent = r.system;
      dirty = $("#profile-form")?.dataset.dirty === "true";
      $("#admin-status").textContent = "Configuração salva";
      if($("#conditions-save-status"))$("#conditions-save-status").textContent="Condições e padrões salvos para novos combates.";
    });
  };
  function mapList() {
    const normalize=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
    const q = normalize($("#admin-map-search").value);
    $("#admin-map-list").innerHTML =
      maps
        .filter((m) =>
          (($("#admin-map-kind").value==="all")||($("#admin-map-kind").value===(m.metadata.kind||"unclassified"))) && normalize(m.title + " " + (m.metadata.region || "")+" "+(m.metadata.tags||[]).join(" ")).includes(q),
        )
        .map(
          (m) =>
            `<article class="admin-map-row map-prep-card">${m.images[0]?`<img loading="lazy" src="${assetUrl(m.images[0].asset_id)}" alt="">`:""}<div><strong>${esc(m.title)}</strong><small>${m.images.length} versões · ${m.visible ? "Disponível no catálogo" : "Oculto no catálogo"}</small></div><button class="secondary" data-admin-map="${esc(m.legacy_id)}">Editar</button><button type="button" class="secondary" data-admin-access="${esc(m.legacy_id)}">Acessos</button></article>`,
        )
        .join("") || "<p>Nenhum mapa. Cadastre o primeiro.</p>";
    document.querySelectorAll("[data-admin-map]").forEach(
      (b) =>
        (b.onclick = () =>
          act(async () => {
            if (canLeave())
              await mapEditor(
                maps.find((m) => m.legacy_id === b.dataset.adminMap),
                assets,
              );
          })),
    );
  }
  $('#admin-map-list').addEventListener('click',e=>{
    const b=e.target.closest('[data-admin-access]');if(!b)return;
    act(async()=>{if(!canLeave())return;const mid=b.dataset.adminAccess,m=maps.find(x=>x.legacy_id===mid);if(!m?.images.length)throw Error('Cadastre uma imagem primeiro.');const links=await api('navigation?table_id='+active.id+'&map_id='+encodeURIComponent(mid));accessEditor(mid,m.images[0].asset_id,maps.map(x=>({...x,id:x.legacy_id})),links);if(!$('#dialog').open)$('#dialog').showModal();});
  });
  $("#admin-map-search").oninput = mapList;
  $("#admin-map-kind").onchange = mapList;
  $("#admin-new-map").onclick = () =>
    act(async () => {
      if (canLeave()) await mapEditor(null, assets);
    });
  mapList();
  await mountAdminSections(section);
}
async function mapEditor(map, allAssets) {
  let assets = allAssets.filter((a) => a.mime.startsWith("image/")),
    versions = cloneState(map?.images || [{ period: "manhã", asset_id: "" }]);
  $("#workspace-content").innerHTML =
    `<div class="section-heading row"><h2>${map ? "Editar mapa" : "Novo mapa"}</h2><button id="back-admin" class="secondary">← Administração</button></div><form id="map-editor"><section class="card"><div class="compact-grid"><label>Nome do mapa<input name="title" required maxlength="160" value="${esc(map?.title || "")}" placeholder="Ex.: Fazenda do Freixo"></label><label>Região<input name="region" maxlength="200" value="${esc(map?.metadata.region || "")}" placeholder="Ex.: Veldora / Stalla"></label></div><div class="compact-grid"><label>Tipo de mapa<select name="kind">${[['unclassified','Não classificado'],['regional','Regional'],['encounter','Encontro']].map(([value,label])=>`<option value="${value}" ${(map?.metadata.kind||'unclassified')===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Etiquetas<input name="tags" value="${esc((map?.metadata.tags||[]).join(', '))}" placeholder="Floresta, vila, subterrâneo"><small>Separe por vírgulas; até 20 etiquetas.</small></label></div><label>Notas do mestre<textarea name="notes" maxlength="10000">${esc(map?.metadata.notes || "")}</textarea></label><label><input type="checkbox" name="visible" ${map?.visible ? "checked" : ""}> Disponibilizar o mapa e suas versões no catálogo dos jogadores</label><small>Desmarcar oculta o catálogo, mas não revoga o acesso às imagens já compartilhadas. Gerencie esse acesso na Biblioteca.</small></section><section class="card"><h3>Versões do mapa</h3><p>Cadastre manhã, tarde, noite, interior ou outro nome. Cada versão usa uma imagem.</p><div id="map-versions"></div><div class="row"><button type="button" id="add-version" class="secondary">Adicionar versão</button><label class="upload-button">Enviar imagem<input type="file" id="map-image-upload" accept="image/png,image/jpeg,image/webp"></label></div><p id="map-upload-status" role="status"></p></section><div class="sheet-actions"><button>Salvar mapa</button><span id="map-editor-status">${map ? "Edição do cadastro" : "Novo cadastro"}</span></div></form>`;
  function mark() {
    dirty = true;
    $("#map-editor-status").textContent = "Alterações não salvas";
  }
  function render() {
    const available = assets
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    $("#map-versions").innerHTML =
      versions
        .map(
          (v, i) =>
            `<fieldset class="map-version"><legend>Versão ${i + 1}</legend><div class="version-fields"><label>Nome da versão<input data-period="${i}" maxlength="40" required value="${esc(v.period)}" list="period-options"></label><label>Imagem<select data-version-asset="${i}" required><option value="">Selecione uma imagem</option>${available.map((a) => `<option value="${a.id}" ${a.id === v.asset_id ? "selected" : ""}>${esc(a.name)} · ${a.id.slice(0, 6)}</option>`).join("")}</select></label><button type="button" class="secondary" data-remove-version="${i}" ${versions.length === 1 ? "disabled" : ""}>Remover versão</button></div>${v.asset_id ? `<img class="version-preview" src="${assetUrl(v.asset_id)}" alt="Prévia de ${esc(v.period)}">` : '<div class="empty">Escolha uma imagem para visualizar.</div>'}</fieldset>`,
        )
        .join("") +
      '<datalist id="period-options"><option value="manhã"><option value="tarde"><option value="noite"><option value="interior"></datalist>';
    document.querySelectorAll("[data-period]").forEach(
      (x) =>
        (x.oninput = () => {
          versions[+x.dataset.period].period = x.value;
          mark();
        }),
    );
    document.querySelectorAll("[data-version-asset]").forEach(
      (x) =>
        (x.onchange = () => {
          versions[+x.dataset.versionAsset].asset_id = x.value;
          mark();
          render();
        }),
    );
    document.querySelectorAll("[data-remove-version]").forEach(
      (b) =>
        (b.onclick = () => {
          versions.splice(+b.dataset.removeVersion, 1);
          mark();
          render();
        }),
    );
  }
  $("#map-editor").oninput = mark;
  $("#add-version").onclick = () => {
    if (versions.length >= 20) return;
    versions.push({ period: "", asset_id: "" });
    mark();
    render();
  };
  render();
  $("#back-admin").onclick = () =>
    act(async () => {
      if (canLeave()) await adminView("2");
    });
  $("#map-image-upload").onchange = () =>
    act(async () => {
      const f = $("#map-image-upload").files[0];
      if (!f) return;
      if (f.size > 10 * 1024 ** 2) throw Error("A imagem deve ter até 10 MiB.");
      $("#map-upload-status").textContent = "Enviando imagem…";
      try {
        const content = await new Promise((yes, no) => {
          const r = new FileReader();
          r.onload = () => yes(r.result.split(",")[1]);
          r.onerror = no;
          r.readAsDataURL(f);
        });
        const r = await api("upload", {
          table_id: active.id,
          name: f.name,
          content,
        });
        assets.push({ id: r.id, name: f.name, mime: f.type });
        const v = versions.find((v) => !v.asset_id);
        if (v) v.asset_id = r.id;
        else if (versions.length < 20)
          versions.push({ period: "", asset_id: r.id });
        mark();
        render();
        $("#map-upload-status").textContent =
          "Imagem enviada. Salve o mapa para concluir o vínculo.";
      } catch (e) {
        $("#map-upload-status").textContent = e.message;
        throw e;
      }
    });
  $("#map-editor").onsubmit = (e) => {
    e.preventDefault();
    act(async () => {
      const f = new FormData(e.target);
      await api("admin-maps", {
        table_id: active.id,
        id: map?.legacy_id,
        revision: map?.revision || 0,
        title: f.get("title"),
        region: f.get("region"),
        kind: f.get("kind"),
        tags: f.get("tags").split(",").map(x=>x.trim()).filter(Boolean),
        notes: f.get("notes"),
        visible: f.has("visible"),
        images: versions,
      });
      dirty = false;
      await adminView("2");
      notice.textContent =
        "Mapa salvo. Use Acessos no card para conectar este mapa a outros.";
    });
  };
}

function accessEditor(mid, aid, maps, initial) {
  let draft = cloneState(initial),
    selected = draft.length ? 0 : -1,
    changed = false,
    drag = null,
    saving = false;
  const dialog = $("#dialog");
  $("#dialog-title").textContent = "Editar acessos do mapa";
  $("#dialog-body").innerHTML =
    `<div class="access-editor"><section><div class="row"><button id="access-draw" class="secondary" aria-pressed="false">+ Desenhar acesso</button><span id="access-hint">Clique em um acesso para editar. Arraste para reposicionar.</span></div><div id="access-canvas"><img src="${assetUrl(aid)}" alt="Mapa para posicionar acessos" draggable="false"><div id="access-overlay"></div></div></section><aside class="card"><h3>Acessos</h3><select id="access-pick" aria-label="Selecionar acesso"></select><form id="access-properties"><label>Nome do acesso<input id="access-label" maxlength="100" required></label><label>Buscar destino<input type="search" id="access-target-search" placeholder="Nome do mapa"></label><label>Destinos<select id="access-targets" multiple size="7" aria-describedby="access-target-help">${maps.map((m) => `<option value="${esc(m.id)}">${esc(m.title)}</option>`).join("")}</select></label><small id="access-target-help">Ctrl ou ⌘ permite selecionar mais de um destino.</small><details><summary>Ajustar posição e tamanho</summary><div class="compact-grid">${["X", "Y", "Largura", "Altura"].map((l, i) => `<label>${l} (%)<input id="access-coordinate-${i}" type="number" min="0" max="100" step=".1"></label>`).join("")}</div><button id="access-apply" type="submit" class="secondary">Aplicar medidas</button></details><button type="button" id="access-delete" class="danger">Excluir acesso selecionado</button></form><div class="sheet-actions"><button id="access-commit">Salvar acessos</button><span id="access-status" role="status">Sem alterações</span></div></aside></div>`;
  const canvas = $("#access-canvas");
  let drawing = false;
  const mark = () => {
    changed = true;
    $("#access-status").textContent = "Alterações não salvas";
  };
  function draw() {
    const overlay = $("#access-overlay");
    overlay.innerHTML = draft
      .map(
        (l, i) =>
          `<button type="button" data-rect-index="${i}" class="access-rect ${i === selected ? "selected" : ""}" style="left:${l.rect[0] * 100}%;top:${l.rect[1] * 100}%;width:${l.rect[2] * 100}%;height:${l.rect[3] * 100}%" aria-label="Editar ${esc(l.label)}">${esc(l.label)}</button>`,
      )
      .join("");
  }
  function select() {
    draw();
    $("#access-pick").innerHTML = draft
      .map(
        (l, i) =>
          `<option value="${i}" ${i === selected ? "selected" : ""}>${i + 1}. ${esc(l.label)}</option>`,
      )
      .join("");
    const l = draft[selected];
    $("#access-properties").hidden = !l;
    if (!l) return;
    $("#access-label").value = l.label;
    [...$("#access-targets").options].forEach(
      (o) => (o.selected = l.targets.includes(o.value)),
    );
    l.rect.forEach(
      (v, i) => ($("#access-coordinate-" + i).value = (v * 100).toFixed(1)),
    );
  }
  function point(e) {
    const r = canvas.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    ];
  }
  $("#access-draw").onclick = () => {
    drawing = !drawing;
    $("#access-draw").setAttribute("aria-pressed", String(drawing));
    canvas.classList.toggle("drawing", drawing);
    $("#access-hint").textContent = drawing
      ? "Arraste sobre o mapa para criar a área clicável."
      : "Clique em um acesso para editar. Arraste para reposicionar.";
  };
  canvas.onpointerdown = (e) => {
    if (e.button !== 0) return;
    const node = e.target.closest("[data-rect-index]"),
      p = point(e);
    if (drawing) {
      if (draft.length >= 100) {
        notice.textContent = "Limite de 100 acessos por mapa.";
        return;
      }
      draft.push({
        id: uid(),
        label: "Novo acesso",
        targets: [],
        rect: [p[0], p[1], 0.01, 0.01],
      });
      selected = draft.length - 1;
      drag = { kind: "new", start: p };
      select();
    } else if (node) {
      selected = +node.dataset.rectIndex;
      drag = { kind: "move", start: p, base: [...draft[selected].rect] };
      select();
    } else return;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  canvas.onpointermove = (e) => {
    if (!drag) return;
    const p = point(e),
      l = draft[selected];
    if (drag.kind === "new") {
      const [x, y] = drag.start;
      l.rect = [
        Math.min(x, p[0]),
        Math.min(y, p[1]),
        Math.abs(x - p[0]),
        Math.abs(y - p[1]),
      ];
    } else {
      const [x, y, w, h] = drag.base;
      l.rect = [
        Math.max(0, Math.min(1 - w, x + p[0] - drag.start[0])),
        Math.max(0, Math.min(1 - h, y + p[1] - drag.start[1])),
        w,
        h,
      ];
    }
    mark();
    draw();
  };
  function end() {
    if (!drag) return;
    const l = draft[selected];
    if (drag.kind === "new") {
      if (l.rect[2] < 0.01 || l.rect[3] < 0.01) {
        draft.splice(selected, 1);
        selected = draft.length - 1;
      } else mark();
      drawing = false;
      canvas.classList.remove("drawing");
      $("#access-draw").setAttribute("aria-pressed", "false");
      $("#access-hint").textContent = "Selecione o destino do novo acesso.";
    }
    drag = null;
    select();
  }
  canvas.onpointerup = end;
  canvas.onpointercancel = end;
  $("#access-pick").onchange = (e) => {
    selected = +e.target.value;
    select();
  };
  $("#access-label").oninput = (e) => {
    if (!draft[selected]) return;
    draft[selected].label = e.target.value;
    const option = $("#access-pick").options[selected];
    if (option) option.textContent = selected + 1 + ". " + e.target.value;
    mark();
    draw();
  };
  $('#access-target-search').oninput=e=>{const q=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();[...$('#access-targets').options].forEach(o=>o.hidden=!o.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));};
  $("#access-targets").onchange = (e) => {
    draft[selected].targets = [...e.target.selectedOptions].map((o) => o.value);
    mark();
  };
  $("#access-properties").onsubmit = (e) => {
    e.preventDefault();
    const rect = [0, 1, 2, 3].map(
      (i) => Number($("#access-coordinate-" + i).value) / 100,
    );
    if (
      !rect.every((v) => Number.isFinite(v) && v >= 0 && v <= 1) ||
      rect[2] <= 0 ||
      rect[3] <= 0 ||
      rect[0] + rect[2] > 1.000001 ||
      rect[1] + rect[3] > 1.000001
    ) {
      $("#access-status").textContent =
        "A área precisa ficar dentro do mapa e ter tamanho maior que zero.";
      return;
    }
    draft[selected].rect = rect;
    mark();
    draw();
  };
  $("#access-delete").onclick = () => {
    if (selected < 0) return;
    draft.splice(selected, 1);
    selected = Math.min(selected, draft.length - 1);
    mark();
    select();
  };
  const closeButton = $("#close-dialog"),
    previous = closeButton.onclick;
  function allowClose(e) {
    if (changed && !saving && !confirm("Descartar alterações dos acessos?")) {
      e?.preventDefault();
      return false;
    }
    changed = false;
    return true;
  }
  function onCancel(e) {
    allowClose(e);
  }
  function cleanup() {
    closeButton.onclick = previous;
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("close", cleanup);
  }
  closeButton.onclick = (e) => {
    if (allowClose(e)) {
      dialog.close();
      $("#dialog-body").replaceChildren();
    }
  };
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", cleanup);
  $("#access-commit").onclick = () =>
    act(async () => {
      if (draft.some((l) => !l.label.trim() || !l.targets.length)) {
        $("#access-status").textContent =
          "Preencha o nome e pelo menos um destino em cada acesso.";
        return;
      }
      saving = true;
      $("#access-commit").disabled = true;
      try {
        await api("navigation", {
          table_id: active.id,
          map_id: mid,
          links: draft,
          expected_links: initial,
        });
        changed = false;
        cleanup();
        await navigateMap(mid, aid);
        notice.textContent = "Acessos salvos.";
      } finally {
        saving = false;
        if ($("#access-commit")) $("#access-commit").disabled = false;
      }
    });
  select();
}

