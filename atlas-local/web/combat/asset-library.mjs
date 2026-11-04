let catalogPromise;
export async function loadTokenCatalog() {
  if (!catalogPromise)
    catalogPromise = fetch("/tokens/catalog.json")
      .then((r) => {
        if (!r.ok)
          throw Error("Não foi possível carregar os modelos de token.");
        return r.json();
      })
      .catch((e) => {
        catalogPromise = null;
        throw e;
      });
  return catalogPromise;
}
import { filterCatalog } from "./token-model.mjs";

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Native details provides disclosure semantics, keyboard access and no focus trap.
export function mountAssetLibrary({
  host,
  catalog,
  preferenceKey,
  onInsert,
  onPlace,
  onDrop,
  onClose = () => {},
  loadCustom = async () => [],
}) {
  const basicCatalog=[...catalog];
  let customRequest=0;
  let chosen = null,
    working = false,
    favorites = [],
    recent = [],
    dragged = null;
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || "{}");
    favorites = Array.isArray(saved.favorites)
      ? saved.favorites.filter((id) => (catalog.some((c) => c.id === id) || (typeof id === "string" && id.startsWith("recent-"))))
      : [];
    recent = Array.isArray(saved.recent)
      ? saved.recent.filter((id) => (catalog.some((c) => c.id === id) || (typeof id === "string" && id.startsWith("recent-"))))
      : [];
  } catch {}
  const remember = () => {
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({ favorites, recent }),
      );
    } catch {}
  };
  host.innerHTML = `<details id="asset-library" class="asset-library"><summary>Assets ▾</summary><section class="asset-popover" aria-label="Biblioteca de tokens"><div class="row asset-heading"><strong>Biblioteca de tokens</strong><button type="button" id="asset-close" class="secondary" aria-label="Fechar biblioteca">×</button></div><div class="row"><button type="button" class="secondary" id="asset-basic-tab">Coleção básica</button><button type="button" class="secondary" id="asset-custom-tab">Meus recentes · 30</button></div><label>Buscar<input id="asset-search" type="search" placeholder="Nome ou tipo de criatura" autocomplete="off"></label><label>Categoria<select id="asset-category"><option value="">Coleção básica</option><option value="favorites">Favoritos</option><option value="recent">Usados recentemente</option><option value="custom-recent">Personalizados recentes · até 30</option>${[...new Set(catalog.map((c) => c.category))].map((c) => `<option>${esc(c)}</option>`).join("")}</select></label><p id="asset-results" class="muted" aria-live="polite"></p><div id="asset-grid" class="asset-grid"></div><form id="asset-options" hidden><div class="asset-selection"><img id="asset-preview" alt=""><strong id="asset-chosen"></strong></div><label>Quantidade<input name="count" type="number" min="1" max="20" value="1" required></label><label class="check-label"><input name="hidden" type="checkbox"> Oculto para jogadores</label><details class="asset-advanced"><summary>Nome e movimento</summary><label>Nome base<input name="name" maxlength="60" required></label><label>Movimento disponível<input name="budget" type="number" min="0" max="1000" step=".1" required></label><small>Valor inicial genérico. Ajuste à ficha; cada cópia recebe um número.</small></details><p class="asset-note">Inserir ativa o combate. Modelos ocultos aparecem apenas para mestres.</p><div class="asset-actions"><button type="submit" id="asset-place">Posicionar no mapa</button><button type="button" class="secondary" id="asset-insert">Inserir agora</button></div></form><p id="asset-error" class="form-error" role="alert"></p><p class="asset-help">Escolha um modelo ou arraste sua miniatura ao mapa. “Inserir agora” usa a área visível. Os 30 personalizados recentes ficam salvos por mestre e mesa. Cópias começam sem ficha, dono, condições ou movimento gasto. Favoritos ficam neste navegador.</p></section></details>`;
  const $ = (selector) => host.querySelector(selector),
    details = $("#asset-library"),
    form = $("#asset-options"),
    error = $("#asset-error");
  function close(focus = true) {
    details.open = false;
    onClose();
    if (focus && !host.closest("#workspace-drawer"))
      details.querySelector("summary").focus();
  }
  details.ontoggle = () => {
    if(details.open) refreshCustom();
    if (details.open && !matchMedia("(max-width:800px)").matches) {
      const panel = $(".asset-popover");
      panel.style.maxHeight =
        Math.max(220, innerHeight - panel.getBoundingClientRect().top - 16) +
        "px";
    }
  };
  async function refreshCustom(){
    const request=++customRequest;
    try{const rows=await loadCustom();if(request!==customRequest||!host.isConnected)return;
      const custom=rows.map(t=>{const initials=esc(t.name.slice(0,2).toUpperCase());const placeholder='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="${t.color}"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="32">${initials}</text></svg>`);return {...t,custom:true,category:'Personalizados',tags:t.name,image:t.appearance?'/tokens/'+t.appearance+'.png':placeholder};});
      catalog=[...basicCatalog,...custom];render();
    }catch(e){if(host.isConnected)error.textContent='Recentes: '+e.message;}
  }
  $("#asset-basic-tab").onclick=()=>{$("#asset-category").value="";$("#asset-search").value="";render();};
  $("#asset-custom-tab").onclick=()=>{$("#asset-category").value="custom-recent";$("#asset-search").value="";render();refreshCustom();};
  $("#asset-close").onclick = () => close();
  host.onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };
  function render() {
    const items = filterCatalog(
      $("#asset-category").value ? catalog : basicCatalog,
      $("#asset-search").value,
      $("#asset-category").value,
      favorites,
      recent,
    );
    $("#asset-results").textContent =
      `${items.length} modelo${items.length === 1 ? "" : "s"}`;
    $("#asset-grid").innerHTML =
      items
        .map(
          (c) =>
            `<article class="asset-card"><button type="button" class="asset-pick secondary" data-asset="${c.id}" draggable="true" aria-pressed="${chosen?.id === c.id}" title="Selecionar ou arrastar ${esc(c.name)}"><img src="${c.image}" alt="" width="76" height="76" loading="lazy" draggable="false"><span>${esc(c.name)}</span></button><button type="button" class="asset-favorite secondary" data-favorite="${c.id}" aria-label="${favorites.includes(c.id) ? "Remover dos favoritos" : "Favoritar"}: ${esc(c.name)}" aria-pressed="${favorites.includes(c.id)}">${favorites.includes(c.id) ? "★" : "☆"}</button></article>`,
        )
        .join("") ||
      '<p class="asset-empty">Nenhum modelo encontrado. Altere a busca ou a categoria.</p>';
    host.querySelectorAll("[data-asset]").forEach((button) => {
      const item = catalog.find((c) => c.id === button.dataset.asset);
      button.onclick = () => {
        if (!working) {
          choose(item);
          render();
        }
      };
      button.ondragstart = (e) => {
        if (working) {
          e.preventDefault();
          return;
        }
        choose(item);
        try {
          dragged = spec();
          e.dataTransfer.setData("application/x-atlas-token", item.id);
          e.dataTransfer.effectAllowed = "copy";
        } catch (err) {
          error.textContent = err.message;
          e.preventDefault();
        }
      };
      button.ondragend = () => {
        dragged = null;
      };
    });
    host.querySelectorAll("[data-favorite]").forEach(
      (button) =>
        (button.onclick = () => {
          const id = button.dataset.favorite;
          favorites = favorites.includes(id)
            ? favorites.filter((x) => x !== id)
            : [...favorites, id];
          remember();
          render();
          host.querySelector(`[data-favorite="${id}"]`)?.focus();
        }),
    );
  }
  function choose(item) {
    const changed = chosen?.id !== item.id;
    chosen = item;
    form.hidden = false;
    error.textContent = "";
    $("#asset-preview").src = item.image;
    $("#asset-chosen").textContent = item.name;
    if (changed) {
      form.elements.name.value = item.name;
      form.elements.budget.value = item.budget;
      form.elements.hidden.checked = item.hidden;
    }
  }
  function spec() {
    if (!chosen) throw Error("Selecione um modelo.");
    if (!form.reportValidity())
      throw Error("Revise a quantidade e os campos do modelo.");
    return {
      template: chosen,
      options: {
        count: Number(form.elements.count.value),
        name: form.elements.name.value.trim(),
        budget: Number(form.elements.budget.value),
        hidden: form.elements.hidden.checked,
      },
    };
  }
  function record(id) {
    recent = [id, ...recent.filter((x) => x !== id)].slice(0, 8);
    remember();
  }
  async function run(fn) {
    if (working) return;
    working = true;
    error.textContent = "";
    form.setAttribute("aria-busy", "true");
    const controls = [...form.querySelectorAll("input,button")];
    controls.forEach((c) => (c.disabled = true));
    try {
      await fn();
    } catch (e) {
      details.open = true;
      error.textContent = e.message;
    } finally {
      working = false;
      controls.forEach((c) => (c.disabled = false));
      form.removeAttribute("aria-busy");
    }
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (working) return;
    try {
      const value = spec();
      onPlace(value);
      close(false);
    } catch (e) {
      error.textContent = e.message;
    }
  };
  $("#asset-insert").onclick = () => {
    let value;
    try {
      value = spec();
    } catch (e) {
      error.textContent = e.message;
      return;
    }
    run(async () => {
      await onInsert(value);
      record(value.template.id);
      close();
    });
  };
  $("#asset-search").oninput = render;
  $("#asset-category").onchange = render;
  render();
  return {
    close,
    record,
    async drop(event) {
      if (!dragged) return false;
      const value = dragged;
      dragged = null;
      event.preventDefault();
      await run(async () => {
        await onDrop(value, event);
        record(value.template.id);
        close(false);
      });
      return true;
    },
  };
}
