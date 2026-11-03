async function openTokenCharacter(id) {
  if (sidebarLoading || !canLeave()) return;
  await openWorkspacePanel("characters");
  if (currentPanel !== "characters") return;
  await characterEditor(id);
}

async function characterView() {
  const rows = await api("characters?table_id=" + active.id);
  let templates = [];
  if (isMaster())
    templates = (await api("assets?table_id=" + active.id)).filter(
      (a) => a.mime === "application/pdf",
    );
  $("#workspace-content").innerHTML =
    `<h2>Personagens</h2><p>Fichas individuais. Salve no editor antes de exportar o PDF.</p><div class="grid">${rows.map((r) => `<article class="card"><h3>${esc(r.name)}</h3><button data-character="${r.id}">Abrir ficha</button></article>`).join("")}</div>${isMaster() ? `<form id="new-character" class="card"><h3>Criar personagem</h3><label>Nome<input name="name" required maxlength="120"></label><label>Jogador responsável<select name="user_id">${members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></label><label>Modelo PDF<select name="template_id">${templates.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label><button ${templates.length ? "" : "disabled"}>Criar ficha</button><p>Envie modelos preenchíveis pela Biblioteca. A ficha de Estigma acompanha o acervo completo.</p></form>` : ""}`;
  document
    .querySelectorAll("[data-character]")
    .forEach(
      (b) =>
        (b.onclick = () => act(() => characterEditor(b.dataset.character))),
    );
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
  const c = await api("character", { table_id: active.id, id }),
    rules = await api("character-rules?table_id=" + active.id);
  let rev = c.revision,
    calc = null,
    request = 0,
    timer;
  const compatible = ["atributo_CON", "pv_maximo", "raca", "classe"].every(
    (k) => c.definitions.some((f) => f.key === k),
  );
  const values = { ...c.fields };
  if (!values.nome) values.nome = c.name;
  const groups = {
    Identidade: [],
    "Atributos e recursos": [],
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
    if (/^(atributo_|pv_|pd_|def_|cond_)/.test(k))
      return "Atributos e recursos";
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
    `<div class="row sheet-heading"><h2>${esc(c.name)}</h2><button class="secondary" id="back-characters">← Personagens</button></div><p>A ficha é salva no servidor. O PDF baixado é uma cópia editável.</p><form id="character-fields">${
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
    act(save);
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
    act(async () => {
      await save();
      $("#dialog-title").textContent = c.name;
      $("#dialog-body").replaceChildren();
      const frame = document.createElement("iframe");
      frame.title = "Ficha preenchida";
      frame.src = "/api/character-pdf?table_id=" + active.id + "&id=" + id;
      $("#dialog-body").append(frame);
      $("#dialog").showModal();
    });
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
}
