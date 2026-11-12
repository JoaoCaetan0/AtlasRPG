/* Rolagens: mesmo componente na aba Dados e na janela sobre o mapa. */
function rollValue(value) {
  return typeof value === "boolean"
    ? value
      ? "Sucesso"
      : "Fracasso"
    : Number(value.toFixed?.(4) ?? value).toLocaleString("pt-BR");
}
function rollCard(r) {
  return `<article class="roll-card" data-roll-id="${r.id}"><div class="row"><strong>${esc(r.name)}</strong><small>${new Date(r.created * 1000).toLocaleTimeString("pt-BR")} · ${esc({ public: "Mesa", gm: "Mestres + autor", self: "Só você" }[r.scope])}</small></div>${r.label ? `<h3>${esc(r.label)}</h3>` : ""}<code>${esc(r.payload.expression)}</code><small class="roll-draw-count">${r.payload.draws} dado(s) sorteado(s)</small>${r.payload.results.map((result, i) => `<div class="roll-result"><strong>${r.payload.results.length > 1 ? `${i + 1}. ` : ""}${rollValue(result.total)}</strong><details><summary>Ver dados sorteados</summary>${result.groups.map((g) => `<div class="dice-breakdown"><small>${g.count}d${g.sides}</small> ${g.dice.map((d) => `<span class="die-value ${d.kept ? "" : "discarded"} ${d.critical ? "critical" : ""}" title="${d.kept ? "Considerado" : "Descartado"}${d.critical ? " · Faixa crítica" : ""}">${d.value}</span>`).join("")}</div>`).join("") || "<p>Expressão aritmética.</p>"}</details></div>`).join("")}<button type="button" class="secondary reuse-roll" data-expression="${esc(r.payload.expression)}" data-label="${esc(r.label || '')}" data-scope="${esc(r.scope)}">Usar fórmula</button></article>`;
}
async function diceView() {
  $("#workspace-content").innerHTML =
    '<div id="dice-root"></div>';
  await mountDice($("#dice-root"));
}
async function diceDialog() {
  return openWorkspacePanel("dice");
}
async function mountDice(root, compact = false) {
  const tid = active.id;
  let busy = false,
    attempt = null;
  const el = (s) => root.querySelector(s);
  root.innerHTML = `<div class="dice-layout ${compact ? "compact" : ""}"><form class="dice-compose"><div class="dice-scroll"><section class="dice-output"><p class="roll-status" role="status"></p><div class="roll-visual" aria-hidden="true" hidden></div></section><label>Fórmula<input name="expression" maxlength="300" value="1d20" required autocomplete="off" spellcheck="false" placeholder="Ex.: 1d20+3"></label><div class="quick-dice">${[4, 6, 8, 10, 12, 20, 100].map((n) => `<button type="button" class="secondary" data-die="${n}">d${n}</button>`).join("")}</div><div class="row"><button type="button" class="secondary" data-preset="2d20kh1">Vantagem</button><button type="button" class="secondary" data-preset="2d20kl1">Desvantagem</button></div><details class="dice-favorites"><summary>★ Favoritos</summary><div class="favorite-list"></div><label>Nome<input name="favorite_name" maxlength="60" placeholder="Ex.: Ataque com arco"></label><button type="button" class="secondary favorite-save">Salvar favorito</button></details><input type="hidden" name="label" value=""><label>Visibilidade<select name="scope"><option value="public">Mesa</option><option value="gm">Mestres e você</option><option value="self">Só você</option></select></label><details class="dice-options"><summary>Opções</summary><label class="check-label"><input type="checkbox" class="roll-animate" checked> Animar dados</label></details><details id="dice-hint"><summary>Ajuda com fórmulas</summary><dl class="dice-help"><div><dt>Teste</dt><dd><code>1d20+3</code></dd></div><div><dt>Manter maior</dt><dd><code>2d20kh1</code></dd></div><div><dt>Descartar menor</dt><dd><code>4d6d1</code></dd></div><div><dt>Repetir 6 vezes</dt><dd><code>6#4d6d1</code></dd></div><div><dt>Explosão</dt><dd><code>d6!</code></dd></div></dl><small>Até 100 dados por grupo, 20 repetições e 1.000 sorteios.</small></details></div><footer class="dice-actions"><button class="roll-submit">⚄ Rolar</button></footer></form></div>`;
  const form = el("form"),
    status = el(".roll-status");
  async function refreshFavorites() {
    const rows = await api("dice-favorites?table_id=" + tid);
    if (!root.isConnected) return;
    el(".favorite-list").innerHTML = rows.map((f,i) => `<div class="favorite-row"><button type="button" class="secondary" data-favorite="${i}"><strong>${esc(f.name)}</strong><code>${esc(f.expression)}</code><small>${esc({public:'Mesa',gm:'Mestres e você',self:'Só você'}[f.scope])}</small></button><button type="button" class="secondary" data-remove-favorite="${i}" aria-label="Excluir ${esc(f.name)}">×</button></div>`).join('') || '<p>Nenhuma fórmula salva.</p>';
    root.querySelectorAll('[data-favorite]').forEach(b => b.onclick = () => {
      const f=rows[Number(b.dataset.favorite)];
      form.elements.expression.value=f.expression; form.elements.label.value=f.label;
      form.elements.scope.value=f.scope; form.elements.favorite_name.value=f.name;
      status.textContent='Fórmula carregada.';
      form.elements.expression.focus();
    });
    root.querySelectorAll('[data-remove-favorite]').forEach(b => b.onclick = () => act(async () => {
      await api('dice-favorites',{table_id:tid,action:'delete',name:rows[Number(b.dataset.removeFavorite)].name});
      await refreshFavorites();
    }));
  }
  el('.favorite-save').onclick = () => act(async () => {
    await api('dice-favorites',{table_id:tid,name:form.elements.favorite_name.value,expression:form.elements.expression.value,label:form.elements.label.value,scope:form.elements.scope.value});
    status.textContent='Favorito salvo.'; await refreshFavorites();
  });
  root.querySelectorAll("[data-die],[data-preset]").forEach(
    (b) =>
      (b.onclick = () => {
        form.elements.expression.value =
          b.dataset.preset || "1d" + b.dataset.die;
        form.elements.expression.focus();
      }),
  );
  form.onsubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const values = {expression:form.elements.expression.value,label:form.elements.label.value,scope:form.elements.scope.value},
      signature = JSON.stringify(values);
    if (!attempt || attempt.signature !== signature)
      attempt = {
        signature,
        id:
          "roll-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2),
      };
    el(".roll-submit").disabled = true;
    status.textContent = "Sorteando…";
    act(async () => {
      try {
        const r = await api("roll", {
          table_id: tid,
          ...values,
          request_id: attempt.id,
        });
        attempt = null;
        if (!root.isConnected) return;
        status.textContent = r.payload.results
          .map((x) => rollValue(x.total))
          .join(" · ");
        const tray = el(".roll-visual");
        tray.hidden = !el(".roll-animate").checked;
        tray.innerHTML = diceTray(r.payload);
        animateDiceTray(tray);
        el(".dice-scroll").scrollTop=0;


      } catch (e) {
        status.textContent = e.message;
        throw e;
      } finally {
        busy = false;
        if (root.isConnected) el(".roll-submit").disabled = false;
      }
    });
  };
  await refreshFavorites();

}

// Up to 40 results, including pairs for percentile dice. Full history stays intact.
function diceTray(payload) {
  const dice = payload.results.flatMap((result, index) => result.groups.flatMap(g =>
    g.dice.map(d => ({...d, sides:g.sides, repetition:index + 1}))));
  function visual(d) {
    const supported=[4,6,8,10,12,20].includes(Number(d.sides));
    if(Number(d.sides)===100) {
      const n=d.value%100;
      return `<span class="percentile-pair"><span><canvas width="160" height="160" data-mesh="10"></canvas><small>${String(Math.floor(n/10)*10).padStart(2,'0')}</small></span><span><canvas width="160" height="160" data-mesh="10"></canvas><small>${n%10}</small></span></span>`;
    }
    if(supported || d.sides==='F')return `<canvas width="160" height="160" data-mesh="${d.sides==='F'?6:Number(d.sides)}"></canvas>`;
    return '<span class="unusual-die">◆</span>';
  }
  return `<div class="dice-tray">${dice.slice(0,40).map(d =>
    `<span class="result-die ${d.kept ? '' : 'discarded'}" data-sides="${esc(String(d.sides))}"><small>d${esc(String(d.sides))} · ${d.repetition}</small>${visual(d)}<b>${esc(String(d.value))}</b>${!d.kept?'<small>Descartado</small>':''}</span>`).join('')}</div>${dice.length > 40 ? '<small>Mais dados no detalhamento do histórico.</small>' : ''}`;
}
