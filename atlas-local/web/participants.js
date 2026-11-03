async function noteView() {
  target = me.id;
  let saved = "";
  $("#workspace-content").innerHTML =
    `<h2>Caderno pessoal</h2><p>Visível para o jogador e os mestres.</p><label>Caderno de<select id="note-owner">${(isMaster() ? members : [me]).map((m) => `<option value="${m.id}" ${m.id === me.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label><textarea id="note" aria-label="Anotações"></textarea><div class="row sheet-actions"><button id="save">Salvar</button><button id="history" class="secondary">Histórico</button><span id="note-status"></span></div>`;
  async function load() {
    const r = await api("note", { table_id: active.id, user_id: target });
    revision = r.revision;
    saved = r.body;
    $("#note").value = saved;
    dirty = false;
    $("#note-status").textContent = "Versão " + revision;
  }
  $("#note-owner").onchange = () =>
    act(async () => {
      const next = $("#note-owner").value;
      if (!canLeave()) {
        $("#note-owner").value = target;
        return;
      }
      target = next;
      await load();
    });
  $("#note").oninput = () => {
    dirty = $("#note").value !== saved;
    $("#note-status").textContent = dirty ? "Alterações não salvas" : "Salvo";
  };
  $("#save").onclick = () =>
    act(async () => {
      const body = $("#note").value;
      const r = await api("note", {
        table_id: active.id,
        user_id: target,
        body,
        revision,
      });
      revision = r.revision;
      saved = body;
      dirty = $("#note").value !== body;
      $("#note-status").textContent = "Salvo • versão " + revision;
    });
  $("#history").onclick = () =>
    act(async () => {
      const rows = await api("note-history", {
        table_id: active.id,
        user_id: target,
      });
      $("#dialog-title").textContent = "Últimas 30 versões";
      $("#dialog-body").innerHTML =
        rows
          .map(
            (r) =>
              `<article class="card"><h3>Versão ${r.revision} · ${esc(r.editor)}</h3><pre>${esc(r.body)}</pre><button data-restore="${r.revision}">Carregar no editor</button></article>`,
          )
          .join("") || "<p>Nenhuma versão salva.</p>";
      $("#dialog").showModal();
      document.querySelectorAll("[data-restore]").forEach(
        (b) =>
          (b.onclick = () => {
            if (dirty && !confirm("Substituir o rascunho?")) return;
            $("#note").value = rows.find(
              (r) => r.revision === Number(b.dataset.restore),
            ).body;
            dirty = true;
            $("#note-status").textContent =
              "Versão carregada. Clique em Salvar.";
            $("#dialog").close();
          }),
      );
    });
  await load();
}
async function chatView(root = $("#chat-slot")) {
  const $ = (selector) => root.querySelector(selector),
    tid = active.id;
  root.innerHTML =
    '<div class="chat-history-tools row"><button id="older" class="secondary">Anteriores</button><button id="chat-live" class="secondary">Ao vivo</button><span id="chat-status" role="status"></span></div><div id="chat-log" aria-live="polite"></div><form id="chat"><label>Mensagem<textarea name="body" maxlength="4000" required placeholder="Converse com a mesa…"></textarea></label><button>Enviar</button></form>' +
    (isMaster()
      ? '<details><summary>Gerenciar conversa</summary><button id="clear-chat" class="danger">Apagar histórico</button></details>'
      : "");
  let last = "",
    first = 0,
    before = 0,
    loading = false;
  async function update() {
    if (loading || !root.isConnected) return;
    loading = true;
    try {
      const rows = await api(
        "chat?table_id=" + tid + (before ? "&before=" + before : ""),
      );
      if (!root.isConnected) return;
      const key = JSON.stringify(rows);
      if (last !== key) {
        const log = $("#chat-log"),
          atBottom = log.scrollTop + log.clientHeight >= log.scrollHeight - 40;
        last = key;
        first = rows[0]?.id || 0;
        log.innerHTML =
          rows
            .map(
              (r) =>
                `<article class="message"><strong>${esc(r.name)}</strong> <small>${new Date(r.created * 1000).toLocaleTimeString("pt-BR")}</small><p>${esc(r.body)}</p></article>`,
            )
            .join("") || "<p>Sem mensagens.</p>";
        if (atBottom && !before) log.scrollTop = log.scrollHeight;
      }
      $("#chat-status").textContent = before ? "Histórico" : "Ao vivo";
    } catch (e) {
      if (root.isConnected) $("#chat-status").textContent = "Reconectando…";
    } finally {
      loading = false;
    }
  }
  $("#chat").onsubmit = (e) => {
    e.preventDefault();
    const form = e.target,
      body = form.elements.body.value,
      button = form.querySelector("button");
    if (button.disabled) return;
    button.disabled = true;
    act(async () => {
      try {
        await api("chat", { table_id: tid, body });
        if (form.elements.body.value === body) form.reset();
        before = 0;
        last = "";
        await update();
      } finally {
        button.disabled = false;
      }
    });
  };
  $("#older").onclick = () => {
    if (first) {
      before = first;
      update();
    }
  };
  $("#chat-live").onclick = () => {
    before = 0;
    update();
  };
  if (isMaster())
    $("#clear-chat").onclick = () =>
      act(async () => {
        if (!confirm("Apagar todo o histórico da mesa?")) return;
        await api("clear-chat", { table_id: tid });
        before = 0;
        last = "";
        await update();
      });
  await update();
  const timer = setInterval(() => {
    if (!root.isConnected) clearInterval(timer);
    else if (!before) update();
  }, 1000);
}
async function memberView() {
  $("#workspace-content").innerHTML =
    `<h2>Participantes</h2><div class="card">${members.map((m) => `<div class="row toolbar"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small>${active.role === "owner" && m.id !== me.id ? `<button data-role="${m.id}" data-next="${m.role === "gm" ? "player" : "gm"}" class="secondary">${m.role === "gm" ? "Tornar jogador" : "Tornar mestre"}</button>` : ""}${isMaster() && m.id !== me.id && m.role !== "owner" && (active.role === "owner" || m.role === "player") ? `<button data-remove="${m.id}" class="danger">Remover e bloquear</button>` : ""}</div>`).join("")}</div>${isMaster() ? '<div class="card"><h2>Convites</h2><button id="invite">Gerar convite • 7 dias</button> <button id="revoke" class="secondary">Revogar convites</button><p id="code"></p><h2>Bloqueados</h2><div id="blocked"></div></div>' : ""}`;
  async function reload() {
    members = await api("members?table_id=" + active.id);
    await memberView();
  }
  document.querySelectorAll("[data-role]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          await api("role", {
            table_id: active.id,
            user_id: b.dataset.role,
            role: b.dataset.next,
          });
          await reload();
        })),
  );
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          if (!confirm("Remover e bloquear este participante?")) return;
          await api("remove-member", {
            table_id: active.id,
            user_id: b.dataset.remove,
            block: true,
          });
          await reload();
        })),
  );
  if (isMaster()) {
    $("#invite").onclick = () =>
      act(async () => {
        const r = await api("invite", { table_id: active.id });
        $("#code").textContent =
          location.origin + "/#invite=" + r.code + "  · Código: " + r.code;
      });
    $("#revoke").onclick = () =>
      act(async () => {
        await api("revoke-invites", { table_id: active.id });
        $("#code").textContent = "Convites revogados.";
      });
    const banned = await api("blocked?table_id=" + active.id);
    $("#blocked").innerHTML =
      banned
        .map(
          (m) =>
            `<p>${esc(m.name)} <button data-unblock="${m.id}">Desbloquear</button></p>`,
        )
        .join("") || "<p>Nenhum bloqueio.</p>";
    document.querySelectorAll("[data-unblock]").forEach(
      (b) =>
        (b.onclick = () =>
          act(async () => {
            await api("unblock", {
              table_id: active.id,
              user_id: b.dataset.unblock,
            });
            await reload();
          })),
    );
  }
}
