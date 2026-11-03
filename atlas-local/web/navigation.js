async function navigateMap(mid, aid) {
  const maps = await api("maps?table_id=" + active.id),
    m = maps.find((x) => x.id === mid);
  if (!m) throw Error("Mapa indisponível.");
  aid = aid || m.images[0]?.asset_id;
  if (!aid) throw Error("Imagem não vinculada.");
  const links = await api(
    "navigation?table_id=" + active.id + "&map_id=" + encodeURIComponent(mid),
  );
  $("#dialog-title").textContent = m.title;
  $("#dialog-body").innerHTML =
    `<div class="map-navigation"><img src="${assetUrl(aid)}" alt="${esc(m.title)}">${links.map((l, i) => `<button class="access" data-access="${i}" style="left:${l.rect[0] * 100}%;top:${l.rect[1] * 100}%;width:${l.rect[2] * 100}%;height:${l.rect[3] * 100}%">${esc(l.label)}</button>`).join("")}</div><div id="destinations"></div>${isMaster() ? '<button id="edit-access" class="secondary">Editar acessos</button><button id="map-public" class="secondary">Disponibilizar mapa aos jogadores</button>' : ""}`;
  if (!$("#dialog").open) $("#dialog").showModal();
  document.querySelectorAll("[data-access]").forEach(
    (b) =>
      (b.onclick = () =>
        act(async () => {
          const l = links[+b.dataset.access];
          if (l.targets.length === 1) return navigateMap(l.targets[0]);
          $("#destinations").innerHTML = l.targets
            .map(
              (id) =>
                `<button data-dest="${esc(id)}">${esc(maps.find((x) => x.id === id)?.title || id)}</button>`,
            )
            .join("");
          document
            .querySelectorAll("[data-dest]")
            .forEach(
              (x) => (x.onclick = () => act(() => navigateMap(x.dataset.dest))),
            );
        })),
  );
  if (isMaster()) {
    $("#map-public").onclick = () =>
      act(async () => {
        for (const im of m.images)
          await api("asset-grants", {
            table_id: active.id,
            id: im.asset_id,
            public: true,
            users: [],
          });
        await api("map-visibility", {
          table_id: active.id,
          id: mid,
          visible: true,
        });
        notice.textContent = "Mapa e suas variações disponibilizados.";
      });
    $("#edit-access").onclick = () => accessEditor(mid, aid, maps, links);
  }
}
