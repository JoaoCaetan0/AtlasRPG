// Pointy-top axial coordinates; the server uses the same neighbour metric.
export function center(q, r, size, height) {
  return [500 + size * Math.sqrt(3) * (q + r / 2), height / 2 + size * 1.5 * r];
}

export function hex(x, y, size, height) {
  const q = ((Math.sqrt(3) / 3) * (x - 500) - (y - height / 2) / 3) / size;
  const r = ((2 / 3) * (y - height / 2)) / size;
  let a = Math.round(q),
    b = Math.round(r),
    c = Math.round(-q - r);
  const da = Math.abs(a - q),
    db = Math.abs(b - r),
    dc = Math.abs(c + q + r);
  if (da > db && da > dc) a = -b - c;
  else if (db > dc) b = -a - c;
  return [a || 0, b || 0];
}

export function polygon(x, y, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    return [x + size * Math.cos(angle), y + size * Math.sin(angle)];
  });
}

// Only visit cells that intersect the image, including very tall maps.
export function* cells(size, height) {
  const rMin = Math.floor((-size - height / 2) / (1.5 * size));
  const rMax = Math.ceil((height / 2 + size) / (1.5 * size));
  for (let r = rMin; r <= rMax; r++) {
    const qMin = Math.ceil((-size - 500) / (Math.sqrt(3) * size) - r / 2);
    const qMax = Math.floor((500 + size) / (Math.sqrt(3) * size) - r / 2);
    for (let q = qMin; q <= qMax; q++) {
      const [x, y] = center(q, r, size, height);
      if (y >= -size && y <= height + size) yield [q, r, x, y];
    }
  }
}

// Pick the closest available, fully visible cell; do not stack new tokens.
export function placement(tokens, size, height, x = 500, y = height / 2) {
  const occupied = new Set(tokens.map((t) => `${t.q},${t.r}`));
  let best = null,
    distance = Infinity;
  for (const [q, r, cx, cy] of cells(size, height)) {
    if (
      cx < size ||
      cx > 1000 - size ||
      cy < size ||
      cy > height - size ||
      occupied.has(`${q},${r}`)
    )
      continue;
    const d = (cx - x) ** 2 + (cy - y) ** 2;
    if (d < distance) {
      best = [q, r];
      distance = d;
    }
  }
  if (!best)
    throw Error(
      "Não há espaço livre para um token. Reduza o tamanho da grade.",
    );
  return best;
}

export function distance(a, b) {
  return (
    (Math.abs(a[0] - b[0]) +
      Math.abs(a[1] - b[1]) +
      Math.abs(a[0] + a[1] - b[0] - b[1])) /
    2
  );
}
// Straight hex route, excluding origin; all steps are validated again by server.
export function route(start, end) {
  const count = distance(start, end);
  if (count > 200) throw Error("Escolha um destino a até 200 hexágonos.");
  const result = [];
  for (let i = 1; i <= count; i++) {
    const q = start[0] + ((end[0] - start[0]) * i) / count + 1e-6;
    const r = start[1] + ((end[1] - start[1]) * i) / count + 1e-6;
    const [x, y] = center(q, r, 1, 0);
    result.push(hex(x, y, 1, 0));
  }
  return result;
}
export function routeCost(path, terrain, scale) {
  let cost = 0;
  for (const point of path) {
    const factor = terrain[point.join(",")] ?? 1;
    if (!factor) return null;
    cost += factor * scale;
  }
  return Math.round(cost * 1e6) / 1e6;
}
