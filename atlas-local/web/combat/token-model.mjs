import { placement } from "./geometry.mjs";

export function nextName(tokens, base) {
  const names = new Set(tokens.map((t) => t.name));
  let n = 1;
  while (names.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

// Build everything before mutating scene state: a batch is all-or-nothing.
export function makeBatch(state, template, options, point, height, uid) {
  const count = Number(options.count);
  if (!Number.isInteger(count) || count < 1 || count > 20)
    throw Error("Escolha de 1 a 20 tokens por inserção.");
  if (state.tokens.length + count > 200)
    throw Error("Limite de 200 tokens neste mapa. Reduza a quantidade.");
  const name = String(options.name || template.name).trim();
  if (!name || name.length > 48)
    throw Error("Use um nome de até 48 caracteres.");
  const budget = Number(options.budget);
  if (!Number.isFinite(budget) || budget < 0 || budget > 1000)
    throw Error("Movimento deve estar entre 0 e 1000.");
  const occupied = [...state.tokens];
  const result = [];
  for (let i = 0; i < count; i++) {
    const [q, r] = placement(
      occupied,
      state.grid.size,
      height,
      point.x,
      point.y,
    );
    const token = {
      id: uid(),
      name: nextName(occupied, name),
      q,
      r,
      appearance: template.id,
      color: template.color,
      budget,
      spent: 0,
      owner: null,
      hidden: Boolean(options.hidden),
      effects: [],
    };
    occupied.push(token);
    result.push(token);
  }
  return result;
}

export function filterCatalog(items, query, category, favorites, recent) {
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const result = items.filter(
    (item) =>
      (!category ||
        (category === "favorites"
          ? favorites.includes(item.id)
          : category === "recent"
            ? recent.includes(item.id)
            : item.category === category)) &&
      words.every((word) =>
        normalize(`${item.name} ${item.tags} ${item.category}`).includes(word),
      ),
  );
  if (category === "recent")
    result.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  return result;
}
