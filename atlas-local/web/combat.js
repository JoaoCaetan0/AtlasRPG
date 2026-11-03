const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
let tabletopGeneration = 0;
let tabletopCamera;
let tabletopModernPanels;
async function combatView() {
  tabletopCamera?.destroy();
  tabletopModernPanels?.destroy();
  clearInterval(mapPoll);
  const generation = ++tabletopGeneration;
  sceneActions = {};
  for (const id of ["combat-slot", "grid-slot", "conditions-slot", "initiative-slot", "assets-slot", "history-slot", "fog-slot"])
    $("#" + id).innerHTML =
      "<p>Compartilhe um mapa para acessar estas ferramentas.</p>";
  const [
    { createRenderer },
    geometry,
    { mountAssetLibrary, loadTokenCatalog },
    { makeBatch },
    { mountFog },
    { mountCamera },
    { conditionIcon },
    { mountCombatPanels },
    { mountDrawings },
  ] = await Promise.all([
    import("/combat/renderer.mjs"),
    import("/combat/geometry.mjs"),
    import("/combat/asset-library.mjs"),
    import("/combat/token-model.mjs"),
    import("/combat/fog.mjs"),
    import("/combat/camera.mjs"),
    import("/combat/condition-icons.mjs"),
    import("/combat/combat-panels.mjs"),
    import("/combat/drawings.mjs"),
  ]);
  if (generation !== tabletopGeneration || currentPane !== "scene") return;
  const catalog = await loadTokenCatalog().catch(() => {
    notice.textContent =
      "Miniaturas indisponíveis. Tokens simples continuam disponíveis.";
    return [];
  });
  const scene = await api("scene?table_id=" + active.id);
  if (generation !== tabletopGeneration || currentPane !== "scene") return;
  if (!scene.asset_id) {
    $("#pane").innerHTML =
      "<div class=empty><h2>A mesa está pronta</h2><p>Escolha uma imagem em Mapas ou Biblioteca e envie à cena.</p></div>";
    mapPoll = setInterval(
      () =>
        act(async () => {
          const r = await api("scene?table_id=" + active.id);
          if (r.asset_id && currentPane === "scene") {
            clearInterval(mapPoll);
            await combatView();
          }
        }),
      1000,
    );
    return;
  }
  const aid = scene.asset_id;
  let state,
    rev,
    selected = null,
    linkedSheets = {},
    mode = "move",
    height = 700,
    busy = false,
    key = "",
    library = null,
    pendingAsset = null,
    history = { undo: null, redo: null },
    fogEditor, fogState, fogRevision = -1,
    measuring = false,
    measureStart = null,
    loading = false;
  $("#pane").innerHTML =
    `<div class="tabletop-toolbar row"><strong>Mapa compartilhado</strong><span id="scene-period-host"></span><span id="combat-round"></span><small id="sync-status" role="status">Conectando…</small>${isMaster() ? '<details id="combat-history" class="history-menu"><summary>Histórico ▾</summary><div class="history-popover"><button id="combat-undo" disabled>Desfazer</button><button id="combat-redo" disabled>Refazer</button><p id="history-description" role="status">Carregando histórico…</p><small>Ctrl+Z · Ctrl+Shift+Z ou Ctrl+Y. Apenas ações de combate.</small></div></details><span id="asset-library-host"></span><button id="quick-token" class="secondary">＋ Token simples</button>' : ""}<button id="scene-dice" class="secondary">⚄ Dados</button><button id="combat-toggle" class="secondary" aria-expanded="false" aria-controls="combat-panel">⚔ Combate ▾</button><button id="initiative-toggle" class="secondary">Iniciativa</button><button id="ruler-toggle" class="secondary" aria-pressed="false">Régua</button><button id="map-fit" class="secondary">Ajustar</button><label class="zoom-label">Zoom <input id="map-zoom" type="range" min="100" max="300" step="25" value="100"></label><button id="combat-refresh" class="secondary" aria-label="Recarregar mapa">↻</button>${isMaster() ? '<button id="clear-scene" class="secondary">Retirar cena</button>' : ""}</div><div id="asset-feedback" class="asset-feedback" hidden><span id="asset-status" role="status"></span><button id="asset-cancel" class="secondary" hidden>Cancelar posicionamento</button></div><div class="combat-layout"><div class="map-column"><div class="combat-board"><div id="map-surface"><svg id="battle" viewBox="0 0 1000 700" role="img" tabindex="0" aria-label="Mapa compartilhado com tokens"></svg><div id="scene-accesses"></div></div></div><p id="movement-info"></p><div id="linked-sheet-summary" class="linked-sheet-summary" hidden></div></div><aside id="combat-panel" hidden><div id="combat-mode"></div><details id="initiative-section" open><summary>Ordem dos turnos</summary><div id="turn-actions"></div><div id="turns"></div></details><details><summary>Tokens e condições</summary><div id="token-controls"></div></details>${isMaster() ? '<details open><summary>Grade e movimento</summary><div id="grid-controls"></div></details><details><summary>Catálogo de condições</summary><div id="condition-controls"></div></details>' : ""}</aside></div>`;
  if (isMaster())
    $("#clear-scene").onclick = () =>
      act(async () => {
        await api("scene", { table_id: active.id, asset_id: null });
        clearInterval(mapPoll);
        await combatView();
      });
  $("#scene-dice").onclick = () => act(() => openWorkspacePanel("dice"));
  sceneActions.activate = async () => {
    if (!state) throw Error("Aguarde o carregamento do mapa.");
    if (isMaster() && state.enabled === false)
      await change(() => {
        state.enabled = true;
        state.grid.enabled = true;
      });
  };
  $("#combat-toggle").onclick = () => act(() => openWorkspacePanel("combat"));
  $("#initiative-toggle").onclick = () =>
    act(() => openWorkspacePanel("initiative"));
  $("#ruler-toggle").onclick = () => {
    drawingEditor?.stop();
    fogEditor?.stop();
    measuring = !measuring;
    measureStart = null;
    $("#ruler-toggle").setAttribute("aria-pressed", String(measuring));
    $("#ruler-layer")?.remove();
    status(
      measuring
        ? "Régua: clique na origem e depois no destino. Não gasta movimento."
        : "Régua desligada.",
    );
  };
  const camera = mountCamera({board: $(".combat-board"), surface: $("#map-surface"), svg: $("#battle"), slider: $("#map-zoom"), fitButton: $("#map-fit")});
  tabletopCamera = camera;
  if(isMaster() && scene.map_id && scene.periods?.length>1){
    $('#scene-period-host').innerHTML=`<label class="scene-period-label">Horário<select id="scene-period" aria-label="Horário da cena">${scene.periods.map(p=>`<option value="${esc(p.period)}" ${p.period===scene.period?'selected':''}>${esc(p.period)}</option>`).join('')}</select></label>`;
    const picker=$('#scene-period');
    async function switchPeriod(period,aligned=false){
      if(busy)throw Error('Aguarde a ação de combate terminar.');
      picker.disabled=true;
      try{
        await api('scene-period',{table_id:active.id,map_id:scene.map_id,revision:scene.revision,period,aligned});
        if(generation===tabletopGeneration){$('#dialog').close();await combatView();}
        notice.textContent='Horário atualizado. Combate e névoa preservados.';
      }finally{if(picker.isConnected){picker.disabled=false;picker.value=scene.period;}}
    }
    picker.onchange=()=>{
      const target=scene.periods.find(p=>p.period===picker.value);picker.value=scene.period;
      if(!target || target.period===scene.period)return;
      if(target.linked)return act(()=>switchPeriod(target.period));
      $('#dialog-title').textContent='Vincular horário: '+target.period;
      $('#dialog-body').innerHTML=`<p>Confira se portas, caminhos e limites ocupam as mesmas posições. Esta vinculação compartilhará tokens, grade, iniciativa e névoa entre as versões.</p><div class="period-comparison"><figure><img src="${assetUrl(aid)}" alt="Horário atual"><figcaption>${esc(scene.period)}</figcaption></figure><figure><img src="${assetUrl(target.asset_id)}" alt="Novo horário"><figcaption>${esc(target.period)}</figcaption></figure></div><p>Se a versão já tiver combate ou névoa independentes, a troca será bloqueada para preservar esses dados.</p><form id="period-link-form"><label><input type="checkbox" required> As imagens têm a mesma planta e enquadramento.</label><div class="row"><button>Vincular e trocar</button><button type="button" id="period-cancel" class="secondary">Cancelar</button></div><p id="period-error" role="alert"></p></form>`;
      $('#dialog').showModal();$('#period-cancel').onclick=()=>$('#dialog').close();
      $('#period-link-form').onsubmit=e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;act(async()=>{try{await switchPeriod(target.period,true);}catch(error){if($('#period-error'))$('#period-error').textContent=error.message;throw error;}finally{button.disabled=false;}});};
    };
  }

  if (isMaster() && scene.map_id) {
    const links = await api(
      "navigation?table_id=" +
        active.id +
        "&map_id=" +
        encodeURIComponent(scene.map_id),
    );
    $("#scene-accesses").innerHTML = links
      .map(
        (l, i) =>
          `<button class="access" data-scene-access="${i}" title="Ir para ${esc(l.label)} e levar os jogadores" style="left:${l.rect[0] * 100}%;top:${l.rect[1] * 100}%;width:${l.rect[2] * 100}%;height:${l.rect[3] * 100}%">↗ ${esc(l.label)}</button>`,
      )
      .join("");
    async function travel(mid) {
      if (busy) return;
      busy = true;
      try {
        const r = await api("scene-navigate", {
          table_id: active.id,
          map_id: mid,
          revision: scene.revision,
        });
        $("#dialog").close();
        clearInterval(mapPoll);
        await combatView();
        if (r.fallback)
          notice.textContent =
            "Destino aberto na versão " +
            r.period +
            "; o horário anterior não está disponível.";
      } finally {
        busy = false;
      }
    }
    document.querySelectorAll("[data-scene-access]").forEach(
      (b) =>
        (b.onclick = () =>
          act(async () => {
            const l = links[+b.dataset.sceneAccess];
            if (l.targets.length === 1) return travel(l.targets[0]);
            const maps = await api("maps?table_id=" + active.id);
            $("#dialog-title").textContent = l.label;
            $("#dialog-body").innerHTML = l.targets
              .map(
                (id) =>
                  `<button data-travel="${esc(id)}">${esc(maps.find((m) => m.id === id)?.title || id)}</button>`,
              )
              .join("");
            $("#dialog").showModal();
            document
              .querySelectorAll("[data-travel]")
              .forEach(
                (x) => (x.onclick = () => act(() => travel(x.dataset.travel))),
              );
          })),
    );
  }

  const renderMap = createRenderer($("#battle"), assetUrl(aid), catalog);
  fogEditor = mountFog({svg: $("#battle"), host: $("#fog-slot"), master: isMaster(), notify: status,
    send: async command => {
      try { await api("fog", {table_id: active.id,asset_id: aid,...command}); }
      finally { key = ""; await load(); }
    }
  });
  if (isMaster()) $("#quick-token").onclick = () => act(() => tokenEditor());

  function visiblePoint() {
    const svg = $("#battle"),
      board = $(".combat-board"),
      rect = board.getBoundingClientRect(),
      p = svg.createSVGPoint();
    p.x = rect.left + board.clientWidth / 2;
    p.y =
      rect.top +
      Math.min(board.clientHeight, svg.getBoundingClientRect().height) / 2;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function eventPoint(e) {
    const svg = $("#battle"),
      p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function status(text) {
    $("#asset-feedback").hidden = false;
    $("#asset-status").textContent = text;
  }
  function cancelPlacement() {
    pendingAsset = null;
    $(".combat-board").classList.remove("placing-asset");
    $("#asset-cancel").hidden = true;
    status("Posicionamento cancelado.");
  }
  async function insertAsset(value, point = visiblePoint()) {
    drawingEditor?.stop();
    if (!state) throw Error("Aguarde o carregamento do mapa.");
    const batch = makeBatch(
      state,
      value.template,
      value.options,
      point,
      height,
      uid,
    );
    await change(() => {
      state.tokens.push(...batch);
      state.enabled = true;
      state.grid.enabled = true;
      selected = batch[0].id;
    });
    pendingAsset = null;
    $(".combat-board").classList.remove("placing-asset");
    $("#asset-cancel").hidden = true;
    status(
      `${batch.length} token(s) inserido(s) · ${value.options.hidden ? "ocultos para jogadores" : "visíveis para jogadores"}.`,
    );
  }
  if (isMaster()) {
    library = mountAssetLibrary({
      host: $("#asset-library-host"),
      catalog,
      preferenceKey: `atlas-assets:${me.id}:${active.id}`,
      onInsert: insertAsset,
      onClose: () => {
        if (currentPanel === "assets") setSidebar(null);
      },
      onPlace: (value) => {
        fogEditor.stop();
        pendingAsset = value;
        $(".combat-board").classList.add("placing-asset");
        $("#asset-cancel").hidden = false;
        status(
          `Posicionar ${value.options.count} × ${value.template.name} · ${value.options.hidden ? "oculto" : "visível"}: clique no mapa ou cancele com Esc.`,
        );
        $("#battle").focus({ preventScroll: true });
      },
      onDrop: (value, event) => insertAsset(value, eventPoint(event)),
    });
    $("#asset-cancel").onclick = cancelPlacement;
    async function historyStep(direction) {
      if (currentPane !== "scene" || generation !== tabletopGeneration) return;
      if (busy || !history[direction]) return;
      const action = history[direction];
      if (
        action.actor !== me.id &&
        !confirm(
          `${direction === "undo" ? "Desfazer" : "Refazer"} “${action.label}”, ação de ${action.author}?`,
        )
      )
        return;
      busy = true;
      updateHistoryControls();
      try {
        await api("combat-" + direction, {
          table_id: active.id,
          asset_id: aid,
          revision: rev,
        });
        pendingAsset = null;
        $(".combat-board").classList.remove("placing-asset");
        $("#asset-cancel").hidden = true;
        key = "";
        await load();
        status(
          `${direction === "undo" ? "Desfeito" : "Refeito"}: ${action.label}.`,
        );
      } catch (e) {
        key = "";
        await load();
        throw e;
      } finally {
        busy = false;
        updateHistoryControls();
      }
    }
    $("#combat-undo").onclick = () => act(() => historyStep("undo"));
    $("#combat-redo").onclick = () => act(() => historyStep("redo"));
    $("#combat-history").onkeydown = (e) => {
      if (e.key === "Escape") {
        $("#combat-history").open = false;
        $("#combat-history > summary").focus();
      }
    };
    $("#pane").onkeydown = (e) => {
      if (currentPane !== "scene" || generation !== tabletopGeneration) return;
      if (
        !(e.ctrlKey || e.metaKey) ||
        e.altKey ||
        $("#dialog").open ||
        e.target.closest("input,textarea,select,[contenteditable]")
      )
        return;
      const key = e.key.toLowerCase();
      const direction =
        key === "z"
          ? e.shiftKey
            ? "redo"
            : "undo"
          : key === "y"
            ? "redo"
            : null;
      if (direction) {
        e.preventDefault();
        if (!e.repeat) act(() => historyStep(direction));
      }
    };
    $(".combat-board").ondragover = (e) => {
      if (
        Array.from(e.dataTransfer.types).includes("application/x-atlas-token")
      ) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    };
    $(".combat-board").ondrop = (e) => {
      if (
        Array.from(e.dataTransfer.types).includes("application/x-atlas-token")
      ) {
        e.preventDefault();
        library.drop(e);
      }
    };
    $("#battle").onkeydown = (e) => {
      if (e.key === "Escape" && pendingAsset) {
        e.preventDefault();
        cancelPlacement();
      }
    };
  }
  const image = new Image();
  image.onload = () => {
    height = (1000 * image.naturalHeight) / image.naturalWidth;
    camera.setDimensions(image.naturalWidth, image.naturalHeight);
    if (currentPane === "scene" && generation === tabletopGeneration && state)
      draw();
  };
  image.src = assetUrl(aid);
  async function load(fromPoll = false) {
    const latest = await api("scene?table_id=" + active.id);
    if (currentPane !== "scene" || generation !== tabletopGeneration) return;
    if (latest.asset_id !== aid || latest.map_id !== scene.map_id) {
      clearInterval(mapPoll);
      $("#dialog")?.close();
      return combatView();
    }
    scene.revision = latest.revision;
    const r = await api("combat?table_id=" + active.id + "&asset_id=" + aid);
    if (currentPane !== "scene" || generation !== tabletopGeneration) return;
    if (fromPoll && busy) return;
    if (r.revision < rev || (r.fog && r.fog.revision < fogRevision) || key === JSON.stringify(r)) return;
    if (!r.state || !r.state.grid || !Array.isArray(r.state.tokens) || !r.fog)
      throw Error("Resposta incompleta do servidor. Reinicie o Atlas após atualizar todos os arquivos.");
    $("#sync-status").textContent = "Sincronizado";
    state = r.state;
    linkedSheets = r.characters || {};
    rev = r.revision;
    history = r.history || { undo: null, redo: null };
    fogState = r.fog;
    if (fogState && fogRevision !== fogState.revision) {
      fogRevision = fogState.revision;
      if (!isMaster()) $("#battle > image").setAttribute("href",assetUrl(aid)+"&fog_revision="+fogRevision);
    }
    if (!state.tokens.some((t) => t.id === selected)) selected = null;
    render();
    key = JSON.stringify(r);
  }
  async function save() {
    await api("combat", {
      table_id: active.id,
      asset_id: aid,
      revision: rev,
      state,
    });
    key = "";
    await load();
  }
  async function change(fn) {
    if (!state || !Number.isInteger(rev)) throw Error("Aguardando o combate carregar. A reconexão é automática.");
    if (busy)
      throw Error(
        "Uma atualização está em andamento. Aguarde e tente salvar novamente.",
      );
    busy = true;
    updateHistoryControls();
    try {
      fn();
      await save();
    } catch (e) {
      key = "";
      await load();
      throw e;
    } finally {
      busy = false;
      updateHistoryControls();
    }
  }
  const hex = (x, y) => geometry.hex(x, y, state.grid.size, height);
  let modernPanels, drawingEditor;
  const badge = (e) => {
    const d = state.conditions.find((x) => x.id === e.id);
    return d
      ? `<span class="effect-badge" style="background:${d.color}" title="${esc(d.name + " — " + d.description)}">${conditionIcon(d)}${e.stage > 1 ? e.stage : ""}${e.secret ? " ◌" : ""}</span>`
      : "";
  };
  function draw() {
    queueMicrotask(()=>{if(generation===tabletopGeneration)modernPanels?.update();});
    const enabled = state.enabled !== false;
    $("#ruler-layer")?.remove();
    renderMap(state, height, selected);
    if (fogState) fogEditor.apply(fogState, height);
    drawingEditor?.apply(height);
    const t = state.tokens.find((t) => t.id === selected);
    const deadButton=$("#dead-token");if(deadButton){deadButton.disabled=!t;deadButton.textContent=t?.dead?"Remover marca de morto":"Marcar morto";}
    const sheet = t && linkedSheets[t.character_id], host = $("#linked-sheet-summary");
    host.hidden = !sheet;
    if (sheet) {
      const f = sheet.resources;
      host.innerHTML = `<button id="open-token-sheet" class="secondary">Abrir ficha</button><span><strong>${esc(sheet.name)}</strong> · PV ${esc(f.pv_atual || "—")}/${esc(f.pv_maximo || "—")} · PD ${esc(f.pd_atual || "—")}/${esc(f.pd_maximo || "—")} · Defesa natural ${esc(f.def_natural || "—")}</span>`;
      $("#open-token-sheet").onclick = () => act(() => openTokenCharacter(sheet.id));
    } else host.replaceChildren();
    $("#movement-info").textContent = !enabled
      ? "Exploração · abra Combate para configurar a cena."
      : t
        ? `${t.name}: ${t.spent} / ${t.budget} ${state.grid.unit} usados. Clique no destino para percorrer a linha de hexágonos. Modo: ${mode}.`
        : "Selecione um token e clique no destino para mover.";
  }
  function updateHistoryControls() {
    if (currentPane !== "scene" || generation !== tabletopGeneration) return;
    if (!isMaster() || !$("#combat-undo")) return;
    for (const direction of ["undo", "redo"]) {
      const button = $("#combat-" + direction),
        action = history[direction];
      button.disabled = busy || !action;
      button.title = action
        ? `${action.label} · ${action.author}`
        : "Nenhuma ação disponível";
    }
    $("#history-description").textContent = history.undo
      ? `Desfazer: ${history.undo.label} · ${history.undo.author}`
      : "Nenhuma ação para desfazer.";
    if (history.redo)
      $("#history-description").textContent +=
        `\nRefazer: ${history.redo.label} · ${history.redo.author}`;
  }
  function render() {
    updateHistoryControls();
    $("#combat-toggle").textContent =
      isMaster() && state.enabled === false
        ? "⚔ Entrar em combate"
        : "⚔ Combate ▾";
    draw();
    $("#combat-round").textContent =
      state.enabled === false
        ? "Exploração"
        : "Rodada " +
          state.round +
          " · " +
          (state.entries.find((e) => e.id === state.active)?.name ||
            "Sem turno ativo");
    $("#combat-mode").innerHTML = isMaster()
      ? `<label class=mode-switch><input type=checkbox id=combat-enabled ${state.enabled !== false ? "checked" : ""}> Combate ativo neste mapa</label>`
      : "";
    if (isMaster())
      $("#combat-enabled").onchange = (e) =>
        act(() =>
          change(() => {
            state.enabled = e.target.checked;
            if (state.enabled) state.grid.enabled = true;
          }),
        );
    $("#turn-actions").innerHTML = isMaster()
      ? `<button id="add-turn">Adicionar</button><button id="sort-turn">Ordenar ↓</button><button id="next-turn">Próximo turno</button><label><input id="skip-dead" type="checkbox" ${state.skipDead?"checked":""}> Pular tokens mortos</label>`
      : "";
    $("#turns").innerHTML = state.entries
      .map((e, i) => {
        const t = state.tokens.find((t) => t.id === e.token);
        return `<article class="turn ${e.id === state.active ? "current" : ""}"><strong>${esc(e.name)}${t?.dead ? " · Morto" : ""}</strong> · ${e.value??"—"} ${e.hidden ? "(oculto)" : ""}<div>${(t ? t.effects : e.effects).map(badge).join("")}</div>${isMaster() ? `<button data-edit-turn="${e.id}">Editar</button><button data-up="${i}">↑</button><button data-down="${i}">↓</button><button data-active="${e.id}">▶</button><button data-effects="e:${e.id}">Condições</button><button data-del-turn="${e.id}">×</button>` : ""}</article>`;
      })
      .join("");
    $("#token-controls").innerHTML =
      `<select id="token-select"><option value="">Selecione um token</option>${state.tokens.map((t) => `<option value="${t.id}" ${selected === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>${isMaster() ? '<button id="new-token">Novo token</button><button id="edit-token">Editar selecionado</button><button id="effects-token">Condições</button><button id="dead-token">Marcar / desmarcar morto</button><button id="delete-token">Remover token</button>' : ""}`;
    const currentToken=state.tokens.find(t=>t.id===selected);
    if($("#dead-token")){$("#dead-token").disabled=!currentToken;$("#dead-token").textContent=currentToken?.dead?"Remover marca de morto":"Marcar morto";}
    $("#token-select").onchange = (e) => {
      selected = e.target.value;
      draw();
    };
    if (!isMaster()) return;
    $("#skip-dead").onchange=e=>act(()=>change(()=>{state.skipDead=e.target.checked;}));
    $("#add-turn").onclick = () => turnEditor();
    $("#sort-turn").onclick = () =>
      act(() => change(() => state.entries.sort((a, b) => (a.value==null)-(b.value==null)||(b.value??0)-(a.value??0))));
    function begin(e) {
      state.active = e?.id || null;
      const t = state.tokens.find((t) => t.id === e?.token);
      if (t) t.spent = 0;
    }
    $("#next-turn").onclick = () =>
      act(() =>
        change(() => {
          if (!state.entries.length) return;
          const i = state.entries.findIndex((e) => e.id === state.active);
          let next=(i+1)%state.entries.length,steps=0;
          while(state.skipDead && state.tokens.find(t=>t.id===state.entries[next].token)?.dead && steps<state.entries.length){next=(next+1)%state.entries.length;steps++;}
          if(steps===state.entries.length){state.active=null;return;}
          if(next<=i && i>=0)state.round++;
          begin(state.entries[next]);
        }),
      );
    document.querySelectorAll("[data-up],[data-down]").forEach(
      (b) =>
        (b.onclick = () =>
          act(() =>
            change(() => {
              const i = +(b.dataset.up ?? b.dataset.down),
                j = i + (b.dataset.up !== undefined ? -1 : 1);
              if (j >= 0 && j < state.entries.length)
                [state.entries[i], state.entries[j]] = [
                  state.entries[j],
                  state.entries[i],
                ];
            }),
          )),
    );
    document
      .querySelectorAll("[data-active]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            act(() =>
              change(() =>
                begin(state.entries.find((e) => e.id === b.dataset.active)),
              ),
            )),
      );
    document
      .querySelectorAll("[data-edit-turn]")
      .forEach((b) => (b.onclick = () => turnEditor(b.dataset.editTurn)));
    document.querySelectorAll("[data-del-turn]").forEach(
      (b) =>
        (b.onclick = () =>
          act(() =>
            change(() => {
              state.entries = state.entries.filter(
                (e) => e.id !== b.dataset.delTurn,
              );
              if (state.active === b.dataset.delTurn) state.active = null;
            }),
          )),
    );
    document
      .querySelectorAll("[data-effects]")
      .forEach((b) => (b.onclick = () => effects(b.dataset.effects)));
    $("#new-token").onclick = () => act(() => tokenEditor());
    $("#edit-token").onclick = () => {
      if (selected) act(() => tokenEditor(selected));
    };
    $("#dead-token").onclick = () => act(()=>change(()=>{const t=state.tokens.find(t=>t.id===selected);if(t)t.dead=!t.dead;}));
    $("#effects-token").onclick = () => {
      if (selected) effects("t:" + selected);
    };
    $("#delete-token").onclick = () =>
      act(() =>
        change(() => {
          const t = state.tokens.find((t) => t.id === selected);
          if (!t) return;
          for (const e of state.entries.filter((e) => e.token === selected)) {
            e.token = null;
            e.effects = cloneState(t.effects);
            e.hidden = e.hidden || t.hidden;
          }
          state.tokens = state.tokens.filter((t) => t.id !== selected);
          selected = null;
        }),
      );
    const gridFocus = $("#grid-controls")?.contains(document.activeElement)
      ? document.activeElement.id
      : null;
    const gridDraft = gridFocus
      ? Array.from($("#grid-controls").querySelectorAll("input")).map((el) => [
          el.id,
          el.value,
          el.checked,
        ])
      : [];
    $("#grid-controls").innerHTML =
      `<label><input id="grid-on" type="checkbox" ${state.grid.enabled ? "checked" : ""}> Mostrar grade</label><label>Raio do hexágono<input id="grid-size" type="number" min="15" max="100" value="${state.grid.size}"></label><label>Distância por hexágono<input id="grid-scale" type="number" min=".1" step=".1" value="${state.grid.scale}"></label><label>Unidade<input id="grid-unit" maxlength="12" value="${esc(state.grid.unit)}"></label><label><input id="enforce" type="checkbox" ${state.enforce ? "checked" : ""}> Limitar pelo movimento disponível</label><button id="save-grid">Salvar grade</button><label>Ferramenta<select id="terrain-mode"><option value="move">Mover tokens</option><option value="1">Terreno normal</option><option value="2">Difícil ×2</option><option value="3">Muito difícil ×3</option><option value="0">Bloqueado</option></select></label>`;
    for (const [id, value, checked] of gridDraft) {
      $("#" + id).value = value;
      $("#" + id).checked = checked;
    }
    if (gridFocus) $("#" + gridFocus)?.focus({ preventScroll: true });
    $("#terrain-mode").value = mode;
    $("#terrain-mode").onchange = (e) => {
      mode = e.target.value;
      draw();
    };
    $("#save-grid").onclick = () =>
      act(() =>
        change(() => {
          state.grid = {
            size: +$("#grid-size").value,
            scale: +$("#grid-scale").value,
            unit: $("#grid-unit").value,
            enabled: $("#grid-on").checked,
          };
          state.enforce = $("#enforce").checked;
        }),
      );
    $("#condition-controls").innerHTML =
      `<select id="condition-edit"><option value="">Nova condição</option>${state.conditions.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><button id="condition-open">Editar definição</button>`;
    $("#condition-open").onclick = () =>
      conditionEditor($("#condition-edit").value);
  }
  function form(title, html, callback) {
    const formRevision = rev;
    const dialog = $("#dialog");
    $("#dialog-title").textContent = title;
    $("#dialog-body").innerHTML =
      `<form id="combat-form">${html}<p class="form-error" role="alert"></p><div class="form-actions"><button type="submit">Salvar</button></div></form>`;
    if (!dialog.open) dialog.showModal();
    const form = $("#combat-form"),
      button = form.querySelector("[type=submit]"),
      error = form.querySelector(".form-error");
    form.querySelector("input")?.focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (button.disabled) return;
      const fd = new FormData(form);
      button.disabled = true;
      button.textContent = "Salvando…";
      error.textContent = "";
      try {
        if (rev !== formRevision)
          throw Error(
            "O combate mudou enquanto você editava. Feche e reabra este formulário para evitar sobrescrever outra ação.",
          );
        await change(() => callback(fd));
        dialog.close();
      } catch (e) {
        error.textContent = e.message;
        error.scrollIntoView({ block: "nearest" });
      } finally {
        button.disabled = false;
        button.textContent = "Salvar";
      }
    };
  }
  async function tokenEditor(id) {
    fogEditor.stop();
    members = await api("members?table_id=" + active.id);
    const sheets = await api("characters?table_id=" + active.id);
    if (currentPane !== "scene" || generation !== tabletopGeneration) return;
    if (!state)
      throw Error("O mapa ainda está carregando. Aguarde um instante.");
    if (!id && state.tokens.length >= 200)
      throw Error(
        "Este mapa já possui 200 tokens. Remova um token antes de adicionar outro.",
      );
    const existing = state.tokens.find((x) => x.id === id);
    const t = existing
      ? cloneState(existing)
      : {
          id: uid(),
          name: "Token",
          q: 0,
          r: 0,
          color: "#8860ba",
          budget: 10,
          spent: 0,
          owner: null,
          hidden: false,
          effects: [],
        };
    if (!id) {
      const svg = $("#battle"),
        board = $(".combat-board"),
        rect = board.getBoundingClientRect(),
        point = svg.createSVGPoint();
      point.x = rect.left + board.clientWidth / 2;
      point.y =
        rect.top +
        Math.min(board.clientHeight, svg.getBoundingClientRect().height) / 2;
      const pos = point.matrixTransform(svg.getScreenCTM().inverse());
      [t.q, t.r] = geometry.placement(
        state.tokens,
        state.grid.size,
        height,
        pos.x,
        pos.y,
      );
    }
    form(
      id ? "Editar token" : "Adicionar token",
      `${!id && state.enabled === false ? "<p>Ao salvar, o combate será ativado e o token aparecerá no mapa.</p>" : ""}<label>Nome<input name="name" maxlength="60" value="${esc(t.name)}" required></label><label>Ficha vinculada<select name="character_id"><option value="">Sem vínculo</option>${sheets.map(c => `<option value="${c.id}" ${t.character_id === c.id ? "selected" : ""}>${esc(c.name)} · ${esc(members.find(m => m.id === c.user_id)?.name || "Sem participante")}</option>`).join("")}</select></label><p class="token-link-help">Ao vincular, nome e controle seguem a ficha. PV, PD e defesa ficam disponíveis apenas ao responsável e aos mestres. Desvincular preserva a ficha.</p><label>Aparência<select name="appearance"><option value="">Círculo com iniciais</option>${catalog.map((c) => `<option value="${c.id}" ${t.appearance === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label><label>Cor da base<input name="color" type="color" value="${t.color}"></label><label>Controlado por<select name="owner"><option value="">Mestres</option>${members.map((m) => `<option value="${m.id}" ${t.owner === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label><label>Movimento<input name="budget" type="number" min="0" max="1000" step=".1" value="${t.budget}"></label><label>Já utilizado<input name="spent" type="number" min="0" step=".1" value="${t.spent}"></label><label><input type="checkbox" name="hidden" ${t.hidden ? "checked" : ""}> Oculto para jogadores</label>`,
      (fd) => {
        Object.assign(t, {
          name: fd.get("name"),
          character_id: fd.get("character_id") || null,
          appearance: fd.get("appearance") || null,
          color: fd.get("color"),
          owner: fd.get("owner") || null,
          budget: +fd.get("budget"),
          spent: +fd.get("spent"),
          hidden: fd.has("hidden"),
        });
        if (!id) {
          const index = state.tokens.findIndex((x) => x.id === t.id);
          if (index < 0) state.tokens.push(t);
          else state.tokens[index] = t;
          state.enabled = true;
          state.grid.enabled = true;
        } else {
          const index = state.tokens.findIndex((x) => x.id === id);
          if (index < 0)
            throw Error(
              "O token foi removido. Feche o formulário e atualize a cena.",
            );
          state.tokens[index] = t;
        }
        selected = t.id;
      },
    );
    const editor = $("#combat-form"), select = editor.elements.character_id;
    function syncLink() {
      const sheet = sheets.find(c => c.id === select.value);
      editor.elements.name.readOnly = !!sheet;
      editor.elements.owner.disabled = !!sheet;
      if (sheet) {
        editor.elements.name.value = linkedSheets[sheet.id]?.name || sheet.name;
        editor.elements.owner.value = sheet.user_id;
      }
    }
    select.onchange = syncLink;
    syncLink();
  }
  function turnEditor(id) {
    const e = state.entries.find((x) => x.id === id) || {
      id: uid(),
      name: "Participante",
      value: null,
      token: null,
      hidden: false,
      effects: [],
    };
    form(
      "Participante da iniciativa",
      `<label>Nome<input name="name" maxlength="60" value="${esc(e.name)}" required></label><label>Iniciativa<input name="value" type="number" step="any" value="${e.value??''}"></label><label>Token<select name="token"><option value="">Sem token</option>${state.tokens.map((t) => `<option value="${t.id}" ${e.token === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label><label><input name="hidden" type="checkbox" ${e.hidden ? "checked" : ""}> Oculto</label>`,
      (fd) => {
        Object.assign(e, {
          name: fd.get("name"),
          value: fd.get("value").trim()===""?null:+fd.get("value"),
          token: fd.get("token") || null,
          hidden: fd.has("hidden"),
        });
        if (!id) state.entries.push(e);
      },
    );
  }
  function effects(target) {
    let t=target.startsWith('t:')?state.tokens.find(x=>x.id===target.slice(2)):state.entries.find(x=>x.id===target.slice(2));
    if(t?.token)t=state.tokens.find(x=>x.id===t.token);
    if(!t)return;
    const sorted=[...state.conditions].sort((a,b)=>Number(t.effects.some(e=>e.id===b.id))-Number(t.effects.some(e=>e.id===a.id))||a.name.localeCompare(b.name,'pt-BR'));
    form('Condições de '+t.name,
      '<label>Buscar condição<input id="effect-search" type="search" placeholder="Nome da condição"></label><p id="effect-count" role="status"></p><div class="effect-options">'+sorted.map(c=>{
        const e=t.effects.find(e=>e.id===c.id);
        return `<fieldset class="effect-option" data-condition-name="${esc(c.name)}"><label class="effect-heading"><input name="apply:${c.id}" type="checkbox" ${e?'checked':''}>${conditionIcon(c)}<strong>${esc(c.name)}</strong>${e?'<small>Aplicada</small>':''}</label><p class="effect-summary">${esc(c.description.split('\n')[0])}</p><details><summary>Regra completa</summary><p>${esc(c.description)}</p></details><div class="effect-settings" ${e?'':'hidden'}>${(c.maxStage||1)>1?`<label>Estágio<select name="stage:${c.id}">${Array.from({length:c.maxStage},(_,i)=>`<option ${e?.stage===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label>`:`<input type="hidden" name="stage:${c.id}" value="${e?.stage||1}">`}<label><input name="secret:${c.id}" type="checkbox" ${e?.secret?'checked':''}> Somente mestres</label></div></fieldset>`;
      }).join('')+'</div>',fd=>{
        t.effects=state.conditions.filter(c=>fd.has('apply:'+c.id)).map(c=>({id:c.id,stage:+fd.get('stage:'+c.id),secret:fd.has('secret:'+c.id)}));
      });
    const search=$('#effect-search'),rows=[...document.querySelectorAll('.effect-option')];
    const normalize=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    search.oninput=()=>{const q=normalize(search.value);let count=0;for(const row of rows){row.hidden=!normalize(row.dataset.conditionName).includes(q);if(!row.hidden)count++;}$('#effect-count').textContent=count+' condições';};
    for(const row of rows)row.querySelector('input[type=checkbox]').onchange=e=>{row.querySelector('.effect-settings').hidden=!e.target.checked;};
    search.oninput();search.focus();
  }
  function conditionEditor(id) {
    const c = state.conditions.find((x) => x.id === id) || {
      id: uid(),
      name: "",
      icon: "◆",
      color: "#b28b47",
      description: "",
    };
    form(
      "Definição da condição",
      `<label>Nome<input name="name" required maxlength="60" value="${esc(c.name)}"></label><label>Ícone<input name="icon" maxlength="12" value="${esc(c.icon)}"></label><label>Cor<input type="color" name="color" value="${c.color}"></label><label>Descrição<textarea name="description" maxlength="3000">${esc(c.description)}</textarea></label><label><input name="stages" type="checkbox" ${c.maxStage ? "checked" : ""}> Três estágios</label>`,
      (fd) => {
        Object.assign(c, {
          name: fd.get("name"),
          icon: fd.get("icon"),
          color: fd.get("color"),
          description: fd.get("description"),
        });
        if (fd.has("stages")) c.maxStage = 3;
        else delete c.maxStage;
        if (!id) state.conditions.push(c);
      },
    );
  }
  $("#battle").onclick = (e) =>
    act(async () => {
      if (!state || busy || generation !== tabletopGeneration || fogEditor.active) return;
      if (pendingAsset && isMaster()) {
        const value = pendingAsset;
        await insertAsset(value, eventPoint(e));
        library.record(value.template.id);
        return;
      }
      if (state.enabled === false) return;
      if (measuring) {
        const pos = eventPoint(e),
          point = hex(pos.x, pos.y);
        if (!measureStart) {
          measureStart = point;
          status("Régua: agora clique no destino.");
          return;
        }
        const route = geometry.route(measureStart, point);
        const cost = geometry.routeCost(route, state.terrain, state.grid.scale);
        const coords = [measureStart, ...route].map(([q, r]) =>
          geometry.center(q, r, state.grid.size, height),
        );
        $("#ruler-layer")?.remove();
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polyline",
        );
        line.id = "ruler-layer";
        line.setAttribute("points", coords.map((p) => p.join(",")).join(" "));
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#ffdd55");
        line.setAttribute("stroke-width", "4");
        line.style.pointerEvents = "none";
        $("#battle").append(line);
        status(
          `Régua: ${route.length} hexágonos · ${route.length * state.grid.scale} ${state.grid.unit} · ${cost === null ? "caminho bloqueado" : "custo " + cost + " " + state.grid.unit}. Clique para iniciar outra medida.`,
        );
        measureStart = null;
        return;
      }
      const token = e.target.closest("[data-token]");
      if (token) {
        selected = token.dataset.token;
        $("#token-select").value = selected;
        draw();
        return;
      }
      const svg = $("#battle"),
        p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      const pos = p.matrixTransform(svg.getScreenCTM().inverse()),
        point = hex(pos.x, pos.y);
      if (mode !== "move" && isMaster())
        return change(() => {
          const k = point.join(",");
          if (mode === "1") delete state.terrain[k];
          else state.terrain[k] = +mode;
        });
      if (!selected) return;
      const moving = state.tokens.find((t) => t.id === selected);
      if (!isMaster() && moving.owner !== me.id)
        throw Error(
          "Este token é controlado por outro participante. Peça ao mestre para atribuí-lo a você.",
        );
      const path = geometry.route([moving.q, moving.r], point);
      if (!path.length) return;
      if (busy) return;
      busy = true;
      try {
        await api("combat-move", {
          table_id: active.id,
          asset_id: aid,
          revision: rev,
          token_id: selected,
          path,
        });
        key = "";
        await load();
      } catch (e) {
        key = "";
        await load();
        throw e;
      } finally {
        busy = false;
        updateHistoryControls();
      }
    });
  $("#combat-refresh").onclick = () =>
    act(async () => {
      key = "";
      await load();
    });
  const panel = $("#combat-panel");
  panel.hidden = false;
  $("#combat-slot").replaceChildren(panel);
  $('#initiative-slot').replaceChildren($('#initiative-section'));
  if (isMaster()) {
    const tokenSection=$('#token-controls').parentElement;tokenSection.open=true;
    const gridSection=$('#grid-controls').parentElement;gridSection.open=true;
    const conditionSection=$('#condition-controls').parentElement;conditionSection.open=true;
    $('#grid-slot').replaceChildren(gridSection);
    $('#conditions-slot').replaceChildren(tokenSection,conditionSection);
    panel.prepend($("#quick-token"));
    $("#assets-slot").replaceChildren($("#asset-library-host"));
    $("#history-slot").replaceChildren($("#combat-history"));
  }
  for(const id of ["combat-toggle","initiative-toggle","scene-dice"])$("#"+id).hidden=true;
  modernPanels=mountCombatPanels({get:()=>({state,selected}),change,master:isMaster(),key:"atlas-initiative:"+me.id+":"+active.id,edit:turnEditor,uid});
  tabletopModernPanels=modernPanels;
  drawingEditor=mountDrawings({svg:$("#battle"),host:$("#drawings-slot"),master:isMaster(),get:()=>state,change,uid,prepare:()=>{fogEditor.stop();measuring=false;pendingAsset=null;mode="move";}});
  setSidebar(currentPanel, false);
  async function synchronize() {
    if (
      currentPane !== "scene" ||
      generation !== tabletopGeneration ||
      busy ||
      loading
    )
      return;
    loading = true;
    try {
      await load(true);
      if ($("#sync-status")) $("#sync-status").textContent = "Sincronizado";
    } catch (e) {
      if ($("#sync-status"))
        $("#sync-status").textContent = "Reconectando… " + e.message;
    } finally {
      loading = false;
    }
  }
  mapPoll = setInterval(synchronize, 1000);
  await synchronize();
}
