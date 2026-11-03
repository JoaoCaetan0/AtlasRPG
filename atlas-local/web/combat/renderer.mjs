import { conditionIcon } from "./condition-icons.mjs";
import { center, polygon, cells } from "./geometry.mjs";

const NS = "http://www.w3.org/2000/svg";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Persistent layers: token updates never replace the image or the grid.
export function createRenderer(svg, imageUrl, catalog = []) {
  const artwork = new Map(catalog.map((c) => [c.id, c.image]));
  const layer = (tag) => {
    const node = document.createElementNS(NS, tag);
    svg.append(node);
    return node;
  };
  svg.replaceChildren();
  const image = layer("image");
  image.setAttribute("href", imageUrl);
  image.setAttribute("width", "1000");
  const grid = layer("path");
  grid.dataset.layer = "grid";
  grid.setAttribute("fill", "none");
  grid.setAttribute("stroke", "#ffffffa0");
  grid.setAttribute("stroke-width", "1.2");
  grid.style.filter = "drop-shadow(0px 0px 1px #000)";
  grid.style.pointerEvents = "none";
  const terrain = layer("g");
  terrain.dataset.layer = "terrain";
  const tokens = layer("g");
  tokens.dataset.layer = "tokens";
  let gridKey = "",
    terrainKey = "",
    lastHeight;
  const tokenNodes = new Map();
  return function render(state, height, selected) {
    if (height !== lastHeight) {
      svg.setAttribute("viewBox", `0 0 1000 ${height}`);
      image.setAttribute("height", height);
      lastHeight = height;
    }
    const enabled = state.enabled !== false,
      size = state.grid.size;
    const nextGridKey = `${enabled}:${state.grid.enabled}:${size}:${height}`;
    if (gridKey !== nextGridKey) {
      gridKey = nextGridKey;
      grid.setAttribute(
        "d",
        enabled && state.grid.enabled
          ? Array.from(
              cells(size, height),
              ([q, r, x, y]) =>
                "M" +
                polygon(x, y, size)
                  .map((p) => p.join(","))
                  .join("L") +
                "Z",
            ).join("")
          : "",
      );
    }
    const nextTerrainKey = `${enabled}:${size}:${height}:${JSON.stringify(state.terrain)}`;
    if (terrainKey !== nextTerrainKey) {
      terrainKey = nextTerrainKey;
      terrain.innerHTML = enabled
        ? Object.entries(state.terrain)
            .map(([key, factor]) => {
              const [q, r] = key.split(",").map(Number),
                [x, y] = center(q, r, size, height);
              return `<polygon points="${polygon(x, y, size)
                .map((p) => p.join(","))
                .join(
                  " ",
                )}" fill="${factor === 0 ? "#b6202099" : factor === 2 ? "#e5ae3866" : "#a261e277"}"/>`;
            })
            .join("")
        : "";
    }
    const keep = new Set();
    const icons = new Map(state.conditions.map((c) => [c.id, c]));
    for (const t of enabled ? state.tokens : []) {
      keep.add(t.id);
      const [x, y] = center(t.q, t.r, size, height);
      const art = artwork.get(t.appearance);
      const face = art
        ? `<image href="${escape(art)}" x="${x - size * 0.8}" y="${y - size * 0.8}" width="${size * 1.6}" height="${size * 1.6}" preserveAspectRatio="xMidYMid meet"/>`
        : `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="white" font-size="15">${escape(t.name.slice(0, 2))}</text>`;
      const markup = `<circle cx="${x}" cy="${y}" r="${size * 0.65}" fill="${art ? "#14202d" : t.color}" stroke="${selected === t.id ? "#fff" : t.color}" stroke-width="${selected === t.id ? 4 : 2}"/>${face}${t.dead ? `<path data-dead="true" d="M${x-size*.8} ${y-size*.8}L${x+size*.8} ${y+size*.8}M${x+size*.8} ${y-size*.8}L${x-size*.8} ${y+size*.8}" stroke="#ff303f" stroke-width="${Math.max(5,size*.15)}" stroke-linecap="round" pointer-events="none"/>` : ""}<text x="${x}" y="${y + size}" text-anchor="middle" fill="white" stroke="#111" paint-order="stroke" stroke-width="2" font-size="13">${escape(t.name)}${t.hidden ? " · oculto" : ""}</text>${t.effects.map((e,i)=>{const c=icons.get(e.id);return c?`<g transform="translate(${x-size+i*25} ${y-size-15})">${conditionIcon(c,24)}<title>${escape(c.name)}${e.stage>1?' · '+e.stage:''}</title></g>`:'';}).join("")}`;
      let entry = tokenNodes.get(t.id);
      if (!entry) {
        const node = document.createElementNS(NS, "g");
        node.dataset.token = t.id;
        tokens.append(node);
        entry = { node, markup: null };
        tokenNodes.set(t.id, entry);
      }
      if (entry.markup !== markup) {
        entry.node.innerHTML = markup;
        entry.markup = markup;
      }
      entry.node.setAttribute("opacity", t.hidden ? 0.45 : 1);
      entry.node.setAttribute("aria-label", t.name);
    }
    for (const [id, entry] of tokenNodes)
      if (!keep.has(id)) {
        entry.node.remove();
        tokenNodes.delete(id);
      }
  };
}
