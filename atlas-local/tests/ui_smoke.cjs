const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const output =
  process.env.ATLAS_UI_OUTPUT || require("os").tmpdir() + "/atlas-ui";
fs.mkdirSync(output, { recursive: true });
process.env.ATLAS_UI_OUTPUT = output;
const assert = require("assert");
let server, browser;
(async () => {
  server = require("child_process").spawn("python", [
    path.join(__dirname, "ui_fixture.py"),
  ]);
  await new Promise((ok, no) => {
    server.stdout.once("data", ok);
    server.once("error", no);
  });
  browser = await chromium.launch({
    executablePath: process.env.ATLAS_BROWSER || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto("http://127.0.0.1:8766");
  await page.locator("#auth [name=name]").fill("Teste mestre");
  await page.locator("#auth [name=password]").fill("test-only-12345");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await page.locator("#battle image").waitFor();

  // Regression: create directly from exploration without opening the combat panel.
  await page.evaluate(() => openWorkspacePanel("combat"));
  await page.locator("#quick-token").click();
  await page.locator("#combat-form [name=name]").fill("Lobo");
  await page.locator("#combat-form button[type=submit]").click();
  await page.locator("[data-token]").waitFor();
  await page.waitForFunction(() => !document.querySelector("#dialog").open);
  await page.evaluate(() => openWorkspacePanel("combat"));
  assert(await page.locator("#combat-enabled").isChecked());
  await page.getByText("Tokens e condições", { exact: true }).click();
  await page.evaluate(() => {
    window.gridBefore = document.querySelector("[data-layer=grid]");
    window.imageBefore = document.querySelector("#battle image");
    window.pathBefore = window.gridBefore.getAttribute("d");
  });
  // Server rejection must keep the form and its entered values visible.
  let rejectOnce = true;
  await page.route("**/api/combat", async (route) => {
    if (route.request().method() === "POST" && rejectOnce) {
      rejectOnce = false;
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Conflito de teste: tente novamente." }),
      });
    }
    return route.continue();
  });
  await page.locator("#new-token").click();
  await page.locator("#combat-form [name=name]").fill("Guarda");
  await page.locator("#combat-form button[type=submit]").click();
  await page
    .locator(".form-error")
    .getByText("Conflito de teste: tente novamente.")
    .waitFor();
  assert.equal(
    await page.locator("#combat-form [name=name]").inputValue(),
    "Guarda",
  );
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-token]").length === 2 &&
      !document.querySelector("#dialog").open,
  );
  await page.unroute("**/api/combat");
  const combatState = () =>
    page.evaluate(async () => {
      const scene = await api("scene?table_id=" + active.id);
      return api(
        "combat?table_id=" + active.id + "&asset_id=" + scene.asset_id,
      );
    });
  let saved = await combatState();
  assert.equal(saved.state.tokens.length, 2);
  assert.notDeepEqual(
    saved.state.tokens.map((t) => [t.q, t.r])[0],
    saved.state.tokens.map((t) => [t.q, t.r])[1],
  );
  // Select via the menu, edit, move one hex, then reload the scene.
  const guard = saved.state.tokens.find((t) => t.name === "Guarda");
  await page.locator("#token-select").selectOption(guard.id);
  await page.locator("#edit-token").click();
  await page.locator("#combat-form [name=name]").fill("Guarda norte");
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(() => !document.querySelector("#dialog").open);
  const click = await page.evaluate(async ({ q, r }) => {
    const svg = document.querySelector("#battle"),
      g = await import("/combat/geometry.mjs");
    const p = svg.createSVGPoint();
    [p.x, p.y] = g.center(q + 1, r, 35, svg.viewBox.baseVal.height);
    const c = p.matrixTransform(svg.getScreenCTM());
    return { x: c.x, y: c.y };
  }, guard);
  await page.evaluate(() => setSidebar(null));
  await page.mouse.click(click.x, click.y);
  await page.waitForFunction(async (id) => {
    const scene = await api("scene?table_id=" + active.id);
    const c = await api(
      "combat?table_id=" + active.id + "&asset_id=" + scene.asset_id,
    );
    return c.state.tokens.find((t) => t.id === id).spent === 1.5;
  }, guard.id);
  assert(
    await page.evaluate(
      () =>
        window.gridBefore === document.querySelector("[data-layer=grid]") &&
        window.imageBefore === document.querySelector("#battle image") &&
        window.pathBefore === window.gridBefore.getAttribute("d"),
    ),
    "moving or editing rebuilt static layers",
  );
  await page.screenshot({ path: path.join(output, "map-desktop.png") });
  await page.locator("#combat-refresh").click();
  saved = await combatState();
  assert.equal(
    saved.state.tokens.find((t) => t.id === guard.id).name,
    "Guarda norte",
  );
  await page.evaluate(() => openWorkspacePanel("combat"));
  await page.locator("#delete-token").click();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  // Mobile quick creation remains accessible and retains existing tokens.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => openWorkspacePanel("combat"));
  await page.locator("#quick-token").click();
  await page.locator("#combat-form [name=name]").fill("Token móvel");
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-token]").length === 2 &&
      !document.querySelector("#dialog").open,
  );
  assert(
    await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    "mobile combat overflows",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => openWorkspacePanel("dice"));
  await page.locator(".dice-compose [name=expression]").fill("4d6d1");
  await page
    .locator(".dice-compose [name=label]")
    .fill("Teste de investigação");
  await page.locator(".roll-submit").click();
  await page.locator(".roll-card").waitFor();
  assert(
    (await page.locator(".roll-card").innerText()).includes(
      "Teste de investigação",
    ),
  );
  await page.screenshot({ path: path.join(output, "dice-desktop.png") });
  await page.locator("#drawer-close").click();
  await page.locator("[data-tab=admin]").click();
  await page
    .locator("#table-settings [name=name]")
    .fill("Estigma • interface revisada");
  await page
    .getByRole("button", { name: "Salvar configurações", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("#admin-status").textContent ===
      "Configuração salva",
  );
  await page.locator("#admin-new-map").click();
  await page.locator("#map-editor [name=title]").fill("Novo mapa de teste");
  const fixture = JSON.parse(
    fs.readFileSync(path.join(output, "fixture.json")),
  );
  await page
    .locator('[data-version-asset="0"]')
    .selectOption(fixture.assets[0]);
  await page.getByRole("button", { name: "Salvar mapa", exact: true }).click();
  await page.locator("#admin-map-list").waitFor();
  assert(
    (await page.locator("#admin-map-list").innerText()).includes(
      "Novo mapa de teste",
    ),
  );
  await page.screenshot({ path: path.join(output, "admin-desktop.png") });
  await page.locator("[data-tab=maps]").click();
  await page.locator("[data-send^=custom-]").click();
  await page.locator("#battle").waitFor();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-scene-access]").length === 0,
  );
  await page.locator("[data-tab=maps]").click();
  await page.locator('[data-open-map="test0"]').click();
  await page.locator("#edit-access").click();
  await page.locator("#access-canvas img").evaluate((img) => img.decode());
  await page.locator("#access-draw").click();
  const box = await page.locator("#access-canvas").boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.4, {
    steps: 5,
  });
  await page.mouse.up();
  await page.locator("#access-label").fill("Novo caminho");
  await page.locator("#access-targets").selectOption("test1");
  await page.screenshot({ path: path.join(output, "access-desktop.png") });
  await page.locator("#access-commit").click();
  await page.locator("#edit-access").waitFor();
  assert(
    (await page.locator(".map-navigation").innerText()).includes(
      "Novo caminho",
    ),
  );
  await page.locator("#close-dialog").click();
  await page.locator("[data-tab=characters]").click();
  await page.locator("[data-character]").click();
  await page.locator("[name=raca]").selectOption("Humano");
  await page.locator("[name=classe]").selectOption("Bárbaro");
  for (const [k, v] of Object.entries({
    CON: 2,
    FOR: 3,
    DES: 1,
    INT: 0,
    CAR: 1,
  }))
    await page.locator("[name=atributo_" + k + "]").fill(String(v));
  await page.locator("#auto-stats").check();
  await page.locator("[data-power=musculatura]").check();
  await page.locator("#calc-now").click();
  await page.waitForFunction(
    () => document.querySelector("[name=pv_maximo]").value === "23",
  );
  await page.getByRole("button", { name: "Salvar ficha", exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector("#character-status").textContent.startsWith("Salvo"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(output, "character-mobile.png"),
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.body.scrollWidth <= window.innerWidth + 1,
    ),
    "mobile character overflows",
  );
  await page.locator("[data-tab=dice]").click();
  await page.locator(".dice-layout").waitFor();
  await page.screenshot({
    path: path.join(output, "dice-mobile.png"),
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.body.scrollWidth <= window.innerWidth + 1,
    ),
    "mobile dice overflows",
  );
  await page.locator("[data-tab=admin]").click();
  await page.locator(".admin-layout").waitFor();
  assert(
    await page.evaluate(
      () => document.body.scrollWidth <= window.innerWidth + 1,
    ),
    "mobile admin overflows",
  );
  await page.screenshot({
    path: path.join(output, "admin-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real-browser login, exploration token creation, retry, edit, move, persistence, removal, mobile tokens, persistent SVG layers, roll, admin, map creation, draw access, character autosave, mobile overflow.",
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server?.kill();
  });
