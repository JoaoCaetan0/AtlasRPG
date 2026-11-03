// The tabletop has its own lifecycle. Drawers never replace its SVG or timer.
let currentPanel = null,
  workspaceView = null,
  sidebarLoading = false,
  sceneActions = {};
const panelNames = {
  scene: "Mapa",
  chat: "Conversa",
  dice: "Dados",
  combat: "Combate",
  grid: "Grid",
  drawings: "Desenhos",
  conditions: "Condições",
  initiative: "Iniciativa",
  assets: "Tokens",
  fog: "Névoa de guerra",
  history: "Desfazer e refazer",
  maps: "Mapas",
  files: "Biblioteca",
  characters: "Personagens",
  notes: "Caderno",
  members: "Participantes",
  admin: "Administração",
};
const iconPaths = {
  drawings: "M4 17L17 4l3 3L7 20H4ZM14 7l3 3",
  grid: "M4 4h16v16H4ZM4 9h16M4 15h16M9 4v16M15 4v16",
  conditions: "M12 3l8 4v6l-8 8-8-8V7ZM8 12l3 3 5-6",
  initiative: "M4 5h2m4 0h10M4 12h2m4 0h10M4 19h2m4 0h10",
  fog: "M5 17h14a4 4 0 0 0 0-8 7 7 0 0 0-13-2 5 5 0 0 0-1 10zM7 21h10",
  scene: "M5 3l14 10-7 1-3 7L5 3z",
  chat: "M4 4h16v12H9l-5 4V4zm4 4h8m-8 4h5",
  dice: "M5 3h14l2 2v14l-2 2H5l-2-2V5l2-2zm3 5h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01",
  combat:
    "M4 3l5 2 11 14-3 2L6 7 4 3zm16 0-5 2-3 4m-3 4-5 6 3 2 4-5M3 15l6 6m12-6-6 6",
  assets: "M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-8 18v-2a8 8 0 0 1 16 0v2H4z",
  history: "M3 10a9 9 0 1 1 2 8M3 3v7h7m2-4v6l4 2",
  maps: "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16",
  files: "M3 6h7l2 3h9v11H3V6zm0 0V4h7l2 2h8v3",
  characters: "M8 3h12v18H4V7l4-4zm0 0v4H4m5 3h6m-6 4h6m-6 4h6",
  notes: "M4 3h16v18H4V3zm4 5h8m-8 4h8m-8 4h5",
  members:
    "M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-7 17v-2a7 7 0 0 1 14 0v2m0-16a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 5",
  admin:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-2-5h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3 3-3z",
};
function workspaceIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[name]}"/></svg>`;
}
function renderWorkspace(t) {
  currentPanel = null;
  workspaceView = null;
  sidebarLoading = false;
  document.body.classList.add("in-workspace");
  const panels = [
    "scene",
    "chat",
    ...(isMaster() ? ["drawings", "fog", "history"] : []),
    "maps",
    "files",
    "characters",
    "notes",
    "members",
    ...(isMaster() ? ["admin"] : []),
  ];
  const topPanels=["combat",...(isMaster()?["grid","assets","conditions"]:[]),"initiative","dice"];
  app.innerHTML = `<div class="workspace-heading"><button id="back" class="secondary" title="Voltar às mesas">← Mesas</button><h1>${esc(t.name)}</h1><span id="room-synopsis" title="${esc(t.synopsis)}">${esc(t.system)}</span></div><nav class="battle-tabs" aria-label="Ferramentas de combate">${topPanels.map(key=>`<button data-tab="${key}" aria-label="${panelNames[key]}" aria-expanded="false" aria-controls="workspace-drawer">${workspaceIcon(key)}<span>${panelNames[key]}</span></button>`).join("")}</nav><div id="pane"></div><nav class="workspace-rail" aria-label="Ferramentas da mesa">${panels.map((key) => `<button data-tab="${key}" aria-label="${panelNames[key]}" title="${panelNames[key]}" aria-expanded="false" aria-controls="workspace-drawer">${workspaceIcon(key)}<span class="rail-tooltip" aria-hidden="true">${panelNames[key]}</span></button>`).join("")}</nav><aside id="workspace-drawer" hidden aria-labelledby="workspace-title"><div class="drawer-heading"><h2 id="workspace-title"></h2><button id="drawer-close" class="secondary" aria-label="Recolher painel" title="Recolher painel (Esc)">×</button></div><div class="drawer-scroll"><div id="combat-slot" hidden></div><div id="drawings-slot" hidden></div><div id="grid-slot" hidden></div><div id="conditions-slot" hidden></div><div id="initiative-slot" hidden></div><div id="assets-slot" hidden></div><div id="fog-slot" hidden></div><div id="history-slot" hidden></div><div id="chat-slot" hidden></div><div id="dice-slot" hidden></div><div id="workspace-content" hidden></div></div></aside><dialog id="dialog"><div class="row"><h2 id="dialog-title"></h2><button id="close-dialog" class="secondary">Fechar</button></div><div id="dialog-body"></div></dialog>`;
  $("#back").onclick = () =>
    act(async () => {
      if (!sidebarLoading && canLeave()) await home();
    });
  document
    .querySelectorAll("[data-tab]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          act(() => openWorkspacePanel(button.dataset.tab, true))),
    );
  $("#drawer-close").onclick = () => {
    if (!sidebarLoading) setSidebar(null);
  };
  $("#workspace-drawer").onkeydown = (e) => {
    if (e.key === "Escape" && !$("#dialog").open && !sidebarLoading) {
      e.preventDefault();
      e.stopPropagation();
      setSidebar(null);
    }
  };
  app.onkeydown = (e) => {
    if (
      e.key === "Escape" &&
      currentPane === "scene" &&
      currentPanel &&
      !$("#dialog").open &&
      !sidebarLoading
    ) {
      e.preventDefault();
      setSidebar(null);
    }
  };
  $("#close-dialog").onclick = () => $("#dialog").close();
  $("#dialog").addEventListener("close", () =>
    $("#dialog-body").replaceChildren(),
  );
}
function setSidebar(name, focus = true) {
  if (!$("#workspace-drawer")) return;
  const previous = currentPanel;
  currentPanel = name;
  $("#workspace-drawer").classList.toggle("conditions-drawer",name==="conditions");
  $("#workspace-drawer").classList.toggle("battle-drawer",["combat","grid","assets","conditions","initiative","dice"].includes(name));
  const slot = ["combat", "drawings", "grid", "conditions", "initiative", "assets", "fog", "history", "chat", "dice"].includes(name)
    ? name + "-slot"
    : "workspace-content";
  $("#workspace-drawer").hidden = !name;
  $("#workspace-title").textContent = panelNames[name] || "";
  for (const node of document.querySelectorAll(".drawer-scroll > div"))
    node.hidden = !name || node.id !== slot;
  document.querySelectorAll("[data-tab]").forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle("active", on);
    b.setAttribute("aria-expanded", String(on));
  });
  if (name === "assets" && $("#asset-library")) $("#asset-library").open = true;
  if (name === "history" && $("#combat-history"))
    $("#combat-history").open = true;
  if (focus) {
    if (name) $("#drawer-close").focus({ preventScroll: true });
    else
      document
        .querySelector(`[data-tab="${previous || "scene"}"]`)
        ?.focus({ preventScroll: true });
  }
}
async function openWorkspacePanel(name, toggle = false) {
  if (sidebarLoading || currentPane !== "scene") return;
  if (name === "scene" || (toggle && currentPanel === name)) {
    setSidebar(null);
    return;
  }
  if (["assets", "drawings", "grid", "conditions", "fog", "history", "admin"].includes(name) && !isMaster()) return;
  const generic = !["chat", "dice", "combat", "drawings", "grid", "conditions", "initiative", "assets", "fog", "history"].includes(
    name,
  );
  if (workspaceView && workspaceView !== name && dirty) {
    if (!canLeave()) return;
    $("#workspace-content").replaceChildren();
    workspaceView = null;
  }
  sidebarLoading = true;
  $(".drawer-scroll").style.visibility = "hidden";
  $(".drawer-scroll").inert = true;
  $("#workspace-drawer").setAttribute("aria-busy", "true");
  document.querySelectorAll("[data-tab]").forEach((b) => (b.disabled = true));
  $("#drawer-close").disabled = true;
  try {
    if (name === "combat") await sceneActions.activate?.();
    if (name === "chat" && !$("#chat-slot").childElementCount)
      await chatView($("#chat-slot"));
    if (name === "dice" && !$("#dice-slot").childElementCount)
      await mountDice($("#dice-slot"));
    if (generic && workspaceView !== name) {
      clearInterval(poll);
      $("#workspace-content").replaceChildren();
      workspaceView = name;
      await {
        maps: mapView,
        files: fileView,
        characters: characterView,
        notes: noteView,
        members: memberView,
        admin: adminView,
      }[name]();
    }
    setSidebar(name);
  } catch (e) {
    if (generic) workspaceView = null;
    throw e;
  } finally {
    sidebarLoading = false;
    $(".drawer-scroll").style.visibility = "";
    $(".drawer-scroll").inert = false;
    $("#workspace-drawer").removeAttribute("aria-busy");
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) => (b.disabled = false));
    if ($("#drawer-close")) $("#drawer-close").disabled = false;
  }
}
