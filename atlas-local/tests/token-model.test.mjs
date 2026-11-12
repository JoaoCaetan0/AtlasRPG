import test from "node:test";
import assert from "node:assert/strict";
import { makeBatch, filterCatalog } from "../web/combat/token-model.mjs";

const template = {
  id: "lobo",
  name: "Lobo",
  color: "#123456",
  category: "Animais",
  tags: "animal fera",
};
const options = { count: 3, name: "Lobo", budget: 10, hidden: false };
const state = { grid: { size: 35 }, tokens: [] };

test("batch keeps unique names, free cells and artwork without mutating original state", () => {
  let i = 0;
  const batch = makeBatch(
    state,
    template,
    options,
    { x: 500, y: 300 },
    1000,
    () => String(++i),
  );
  assert.equal(state.tokens.length, 0);
  assert.deepEqual(
    batch.map((t) => t.name),
    ["Lobo 1", "Lobo 2", "Lobo 3"],
  );
  assert.equal(new Set(batch.map((t) => `${t.q},${t.r}`)).size, 3);
  assert(batch.every((t) => t.appearance === "lobo" && t.owner === null));
  const next = makeBatch(
    { ...state, tokens: batch },
    template,
    { ...options, count: 1, hidden: true },
    { x: 500, y: 300 },
    1000,
    () => String(++i),
  );
  assert.equal(next[0].name, "Lobo 4");
  assert(next[0].hidden);
});
test("invalid batches fail before changing state", () => {
  for (const count of [0, 21, 1.5])
    assert.throws(() =>
      makeBatch(
        state,
        template,
        { ...options, count },
        { x: 0, y: 0 },
        700,
        () => "",
      ),
    );
  assert.throws(
    () =>
      makeBatch(
        { ...state, tokens: Array(199).fill({ q: 0, r: 0, name: "a" }) },
        template,
        options,
        { x: 0, y: 0 },
        700,
        () => "",
      ),
    /200/,
  );
  assert.throws(
    () =>
      makeBatch(
        state,
        template,
        { ...options, budget: Infinity },
        { x: 0, y: 0 },
        700,
        () => "",
      ),
    /Movimento/,
  );
  assert.equal(state.tokens.length, 0);
});
test("catalog search supports accents, categories, favorites and recent ordering", () => {
  const items = [
    template,
    { id: "aliado", name: "NPC aliado", tags: "pessoa", category: "Aliados" },
  ];
  assert.equal(filterCatalog(items, "LÓBO", "", [], [])[0].id, "lobo");
  assert.equal(
    filterCatalog(items, "", "favorites", ["aliado"], [])[0].id,
    "aliado",
  );
  assert.deepEqual(
    filterCatalog(items, "", "recent", [], ["aliado", "lobo"]).map((c) => c.id),
    ["aliado", "lobo"],
  );
  assert.deepEqual(filterCatalog(items, "", "Monstros", [], []), []);
});

import { groupTokenFamilies } from '../web/combat/token-model.mjs';
test('family variants preserve filtering, custom identity and search by subgroup',()=>{
 const rows=[
  {...template,id:'goblin',family:'goblin',family_name:'Goblin',variant_name:'Clava',subgroup:'Goblinoides'},
  {...template,id:'goblin-v2',family:'goblin',family_name:'Goblin',variant_name:'Escudeiro',subgroup:'Goblinoides'},
  {...template,id:'hobgoblin',family:'hobgoblin',family_name:'Hobgoblin',subgroup:'Goblinoides'},
  {...template,id:'recent-1',custom:true,subgroup:'Personalizados'},
 ];
 assert.deepEqual(groupTokenFamilies(rows).map(x=>x.items.length),[2,1,1]);
 assert.equal(groupTokenFamilies(rows,'Goblinoides').length,2);
 const favorite=filterCatalog(rows,'','favorites',['goblin-v2'],[]);
 assert.deepEqual(groupTokenFamilies(favorite)[0].items.map(x=>x.id),['goblin-v2']);
 assert.equal(filterCatalog(rows,'escudeiro','',[],[])[0].id,'goblin-v2');
 assert.equal(filterCatalog(rows,'goblinoides','',[],[]).length,3);
 const batch=makeBatch(state,rows[1],{...options,count:1},{x:500,y:300},1000,()=> 'variant');
 assert.equal(batch[0].appearance,'goblin-v2');
});

test('new template instances without a saved direction face north and retain range',()=>{
 const batch=makeBatch(state,{...template,vision:{range:20}}, {...options,count:1},{x:500,y:300},1000,()=> 'north');
 assert.equal(batch[0].vision.direction,270);assert.equal(batch[0].vision.range,20);
});
