/* Rolagens: mesmo componente na aba Dados e na janela sobre o mapa. */
function rollValue(value) {
  return typeof value === "boolean"
    ? value
      ? "Sucesso"
      : "Fracasso"
    : Number(value.toFixed?.(4) ?? value).toLocaleString("pt-BR");
}
function rollCard(r) {
  return `<article class="roll-card"><div class="row"><strong>${esc(r.name)}</strong><small>${new Date(r.created * 1000).toLocaleTimeString("pt-BR")} · ${esc({ public: "Mesa", gm: "Mestres + autor", self: "Só você" }[r.scope])}</small></div>${r.label ? `<h3>${esc(r.label)}</h3>` : ""}<code>${esc(r.payload.expression)}</code>${r.payload.results.map((result, i) => `<div class="roll-result"><strong>${r.payload.results.length > 1 ? `${i + 1}. ` : ""}${rollValue(result.total)}</strong><details><summary>Ver dados sorteados</summary>${result.groups.map((g) => `<div class="dice-breakdown"><small>${g.count}d${g.sides}</small> ${g.dice.map((d) => `<span class="die-value ${d.kept ? "" : "discarded"} ${d.critical ? "critical" : ""}" title="${d.kept ? "Considerado" : "Descartado"}${d.critical ? " · Faixa crítica" : ""}">${d.value}</span>`).join("")}</div>`).join("") || "<p>Expressão aritmética.</p>"}</details></div>`).join("")}</article>`;
}
async function diceView() {
  $("#workspace-content").innerHTML =
    '<div class="section-heading"><h2>Dados</h2><p>Resultados sorteados no servidor e guardados nesta mesa.</p></div><div id="dice-root"></div>';
  await mountDice($("#dice-root"));
}
async function diceDialog() {
  return openWorkspacePanel("dice");
}
async function mountDice(root, compact = false) {
  const tid = active.id;
  let last = "",
    first = 0,
    before = 0,
    busy = false,
    attempt = null;
  const el = (s) => root.querySelector(s);
  root.innerHTML = `<div class="dice-layout ${compact ? "compact" : ""}"><form class="dice-compose"><label>Expressão<input name="expression" maxlength="300" value="1d20" required autocomplete="off" spellcheck="false" aria-describedby="dice-hint"></label><div class="quick-dice">${[4, 6, 8, 10, 12, 20, 100].map((n) => `<button type="button" class="secondary" data-die="${n}">d${n}</button>`).join("")}</div><div class="row"><button type="button" class="secondary" data-preset="2d20kh1">Vantagem</button><button type="button" class="secondary" data-preset="2d20kl1">Desvantagem</button></div><label>Descrição opcional<input name="label" maxlength="120" placeholder="Ex.: Investigação no celeiro"></label><label>Quem verá o resultado<select name="scope"><option value="public">Toda a mesa</option><option value="gm">Mestres e você</option><option value="self">Somente você</option></select></label><label class="check-label"><input type="checkbox" class="roll-animate" checked> Animação 3D breve</label><button class="roll-submit">Rolar dados</button><p class="roll-status" role="status"></p><div class="roll-visual" aria-hidden="true" hidden><div class="dice-cube">${["frente", "costas", "direita", "esquerda", "topo", "base"].map((side) => `<span class="cube-face ${side}">◆</span>`).join("")}</div></div><details id="dice-hint"><summary>Notações e limites</summary><p><code>1d20+3</code> · <code>4d6d1</code> · <code>2d20kh1</code> · <code>6#4d6d1</code> · <code>5d6&gt;&gt;4</code> · <code>d6!</code> · <code>4dF</code></p><p>Aritmética, parênteses, explosão (! ou !N), manter/descartar (kh, kl, dh, dl), ajuste por dado (++/--), contagem (&lt;&lt;/&gt;&gt;), comparação final, Burning Wheel, crítico c e ARO. Máximo: 100 dados por grupo, 20 repetições e 1.000 sorteios com explosões.</p><p>Base Rollem V1. Não aceita macros de Discord, comentários dentro da expressão ou múltiplas rolagens em colchetes. Use Descrição para anotações. Vantagem é o atalho 2d20kh1; altere conforme a regra da mesa.</p></details></form><section class="dice-history"><div class="row history-toolbar"><h3>Histórico</h3><button type="button" class="secondary roll-latest">Ao vivo</button><button type="button" class="secondary roll-older">Anteriores</button></div><div class="roll-list"></div>${isMaster() ? '<details><summary>Gerenciar histórico</summary><p>Apaga rolagens da mesa e dos mestres. Rolagens pessoais são preservadas.</p><button class="danger clear-rolls" type="button">Apagar histórico compartilhado</button></details>' : ""}</section></div>`;
  const form = el("form"),
    status = el(".roll-status");
  root.querySelectorAll("[data-die],[data-preset]").forEach(
    (b) =>
      (b.onclick = () => {
        form.elements.expression.value =
          b.dataset.preset || "1d" + b.dataset.die;
        form.elements.expression.focus();
      }),
  );
  async function refresh() {
    const rows = await api(
      "rolls?table_id=" + tid + (before ? "&before=" + before : ""),
    );
    if (!root.isConnected) return;
    const key = JSON.stringify(rows);
    if (last === key) return;
    last = key;
    first = rows[0]?.id || 0;
    el(".roll-list").innerHTML =
      rows.slice().reverse().map(rollCard).join("") ||
      '<p class="empty">Nenhuma rolagem por aqui. Escolha um dado para começar.</p>';
    el(".roll-older").disabled = !first || rows.length < 50;
    el(".roll-latest").textContent = before ? "Retomar ao vivo" : "Ao vivo";
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const values = Object.fromEntries(new FormData(form)),
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
        const cube = el(".dice-cube");
        el(".roll-visual").hidden = !el(".roll-animate").checked;
        if (
          el(".roll-animate").checked &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          cube.classList.remove("rolling");
          void cube.offsetWidth;
          cube.classList.add("rolling");
        }
        before = 0;
        last = "";
        await refresh();
      } catch (e) {
        status.textContent = e.message;
        throw e;
      } finally {
        busy = false;
        if (root.isConnected) el(".roll-submit").disabled = false;
      }
    });
  };
  el(".roll-older").onclick = () =>
    act(async () => {
      if (first) {
        before = first;
        last = "";
        await refresh();
      }
    });
  el(".roll-latest").onclick = () =>
    act(async () => {
      before = 0;
      last = "";
      await refresh();
    });
  if (isMaster())
    el(".clear-rolls").onclick = () =>
      act(async () => {
        if (!confirm("Apagar o histórico compartilhado de dados desta mesa?"))
          return;
        await api("clear-rolls", { table_id: tid });
        before = 0;
        last = "";
        await refresh();
      });
  await refresh();
  const timer = setInterval(() => {
    if (!root.isConnected || (compact && !$("#dialog").open)) {
      clearInterval(timer);
      return;
    }
    if (!before && !busy) act(refresh);
  }, 3000);
}
