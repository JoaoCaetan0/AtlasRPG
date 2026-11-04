const app = document.querySelector("#app"),
  notice = document.querySelector("#notice");
let me,
  active,
  revision = 0,
  target;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// State is plain JSON; works on HTTP LAN where structuredClone may be unavailable.
const cloneState = (value) => JSON.parse(JSON.stringify(value));
async function api(path, data) {
  const controller = new AbortController();
  const timeout = data ? null : setTimeout(() => controller.abort(), 15000);
  let r;
  try {
    r = await fetch(
      "/api/" + path,
      data
        ? {
            signal: controller.signal,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Atlas-Request": "1",
            },
            body: JSON.stringify(data),
          }
        : { cache: "no-store", signal: controller.signal },
    );
  } finally {
    clearTimeout(timeout);
  }
  const v = await r.json();
  if (!r.ok) throw Error(v.error);
  return v;
}
async function act(fn) {
  notice.textContent = "";
  try {
    await fn();
  } catch (e) {
    notice.textContent = e.message;
  }
}
function auth() {
  app.innerHTML = `<h1>Seu próximo encontro começa aqui.</h1><p>Entre ou crie uma conta neste servidor. Os dados ficam no computador do anfitrião.</p><section class="card" style="max-width:440px"><form id="auth"><label>Nome de usuário<input name="name" required minlength="2" autocomplete="username"></label><label>Senha<input name="password" type="password" required minlength="10" autocomplete="current-password"></label><div class="row"><button value="login">Entrar</button><button value="register" class="secondary">Criar conta</button></div></form></section>`;
  document.querySelector("#auth").onsubmit = (e) => {
    e.preventDefault();
    act(async () => {
      await api(e.submitter.value, Object.fromEntries(new FormData(e.target)));
      await start();
    });
  };
}
async function start() {
  try {
    me = await api("me");
  } catch {
    auth();
    return;
  }
  document.querySelector("#identity").textContent = me.name;
  await home();
}
async function home() {
  clearInterval(mapPoll);
  currentPane = "";
  document.body.classList.remove("in-workspace");
  const [tables, presets] = await Promise.all([api("tables"), api("system-presets")]);
  app.innerHTML = `<div class="row"><h1>Minhas mesas</h1><button id="install-estigma">Preparar Estigma do Caos</button><button class="secondary" id="out">Sair</button></div><p>Campanhas, arquivos e cenas compartilhadas na sua rede local ou VPN.</p><div class="grid">${tables.map((t) => `<article class="card"><small>${esc(t.system)} · ${esc(t.role)}</small><h2>${esc(t.name)}</h2><p>${esc(t.synopsis)}</p><button data-open="${t.id}">Abrir mesa</button></article>`).join("") || "<p>Nenhuma mesa vinculada ainda.</p>"}</div><div class="grid"><form class="card" id="create"><h2>Criar mesa</h2><label>Nome<input name="name" value="Estigma do Caos" required maxlength="120"></label><fieldset class="system-picker"><legend>Sistema de RPG</legend>${presets.map((p,i)=>`<label class="system-choice"><input type="radio" name="system_id" value="${esc(p.id)}" ${i===0?"checked":""}><span><strong>${esc(p.name)}</strong><small>${esc(p.edition)}</small></span></label>`).join("")}</fieldset><p class="muted">Outros sistemas começam com ficha configurável. Regras e catálogos oficiais ainda não estão automatizados.</p><label>Sinopse<textarea name="synopsis"></textarea></label><button>Criar como proprietário</button></form><form class="card" id="join"><h2>Entrar por convite</h2><label>Código<input name="code" required></label><button>Entrar como jogador</button></form></div>`;
  document.querySelector("#install-estigma").onclick = () =>
    act(async () => {
      const host_key = prompt(
        "Código do anfitrião mostrado no terminal do servidor:",
      );
      if (!host_key) return;
      notice.textContent = "Preparando os arquivos da campanha…";
      document.querySelector("#install-estigma").disabled = true;
      try {
        const r = await api("create-estigma", { host_key });
        await home();
        notice.textContent = `Campanha preparada: ${r.files} arquivos, ${r.linked} vínculos de mapas.`;
      } catch (e) {
        document.querySelector("#install-estigma").disabled = false;
        throw e;
      }
    });
  document.querySelector("#out").onclick = () =>
    act(async () => {
      await api("logout", {});
      await start();
    });
  document.querySelector("#create").onsubmit = (e) => {
    e.preventDefault();
    act(async () => {
      await api("tables", Object.fromEntries(new FormData(e.target)));
      await home();
    });
  };
  const invite = new URLSearchParams(location.hash.slice(1)).get("invite");
  if (invite) document.querySelector("#join [name=code]").value = invite;
  document.querySelector("#join").onsubmit = (e) => {
    e.preventDefault();
    act(async () => {
      await api("join", Object.fromEntries(new FormData(e.target)));
      await home();
    });
  };
  document
    .querySelectorAll("[data-open]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          act(() => room(tables.find((t) => t.id === b.dataset.open)))),
    );
}

let dirty = false,
  poll = null,
  currentPane = "",
  mapPoll = null,
  members = [];
function canLeave() {
  if (dirty && !confirm("Há alterações não salvas. Descartar?")) return false;
  dirty = false;
  clearInterval(poll);
  return true;
}
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
const assetUrl = (id) => "/api/asset?table_id=" + active.id + "&id=" + id;
const isMaster = () => active.role !== "player";
async function room(t) {
  if (!canLeave()) return;
  active = t;
  members = await api("members?table_id=" + t.id);
  active.role = members.find((m) => m.id === me.id).role;
  renderWorkspace(t);
  currentPane = "scene";
  await combatView();
}
const $ = (s) => document.querySelector(s);
async function tab(name) {
  return openWorkspacePanel(name);
}
