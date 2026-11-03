import test from "node:test";
import assert from "node:assert/strict";
import { center, hex, cells, placement } from "../web/combat/geometry.mjs";

test("hex centres round-trip including negative coordinates and different image heights", () => {
  for (const size of [15, 35, 100])
    for (const height of [300, 700, 4000])
      for (let q = -10; q <= 10; q++)
        for (let r = -10; r <= 10; r++)
          assert.deepEqual(hex(...center(q, r, size, height), size, height), [
            q,
            r,
          ]);
});

test("bounded grid produces the same visible cells as the original exhaustive scan", () => {
  for (const size of [15, 35, 100])
    for (const height of [300, 700, 4000]) {
      const original = [],
        bound = Math.ceil(Math.max(height, 1000) / size) + 2;
      for (let r = -bound; r <= bound; r++)
        for (let q = -bound; q <= bound; q++) {
          const [x, y] = center(q, r, size, height);
          if (
            x >= -size &&
            x <= 1000 + size &&
            y >= -size &&
            y <= height + size
          )
            original.push(`${q},${r}`);
        }
      assert.deepEqual(
        Array.from(cells(size, height), ([q, r]) => `${q},${r}`),
        original,
      );
    }
});

test("placement avoids occupied cells and stays inside the image", () => {
  const tokens = [];
  for (let i = 0; i < 200; i++) {
    const [q, r] = placement(tokens, 35, 2000, 500, 100);
    assert(!tokens.some((t) => t.q === q && t.r === r));
    const [x, y] = center(q, r, 35, 2000);
    assert(x >= 35 && x <= 965 && y >= 35 && y <= 1965);
    tokens.push({ q, r });
  }
  assert.throws(() => placement([], 100, 100), /espaço livre/);
});

import { route, distance, routeCost } from "../web/combat/geometry.mjs";
test("straight routes contain adjacent cells and end exactly at destination", () => {
  for (let q = -20; q <= 20; q++)
    for (let r = -20; r <= 20; r++) {
      const start = [3, -2],
        end = [q, r],
        path = route(start, end);
      assert.equal(path.length, distance(start, end));
      let previous = start;
      for (const step of path) {
        assert.equal(distance(previous, step), 1);
        previous = step;
      }
      assert.deepEqual(previous, end);
    }
  assert.throws(() => route([0, 0], [201, 0]), /200/);
});
test("ruler includes terrain multipliers and blocked cells", () => {
  const path = route([0, 0], [3, 0]);
  assert.equal(routeCost(path, { "1,0": 2, "2,0": 3 }, 1.5), 9);
  assert.equal(routeCost(path, { "2,0": 0 }, 1.5), null);
});
