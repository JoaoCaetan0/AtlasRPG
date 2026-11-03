const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("assert");
const output = process.env.ATLAS_UI_OUTPUT || "/tmp/atlas-live-ui";
fs.mkdirSync(output, { recursive: true });
process.env.ATLAS_UI_OUTPUT = output;
const host = process.env.ATLAS_TEST_HOST || "127.0.0.1",
  base = `http://${host}:8766`;
let server, browser;
(async () => {
  server = require("child_process").spawn("python", [
    path.join(__dirname, "ui_fixture.py"),
  ]);
  await new Promise((ok, no) => {
    server.stdout.once("data", ok);
    server.once("error", no);
    server.once("exit", (code) => no(Error("fixture " + code)));
  });
  browser = await chromium.launch({
    executablePath: process.env.ATLAS_BROWSER,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-proxy-server"],
    headless: true,
  });
  const gm = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  gm.on("pageerror", (e) => errors.push(e.message));
  await gm.addInitScript(() => {
    window.structuredClone = undefined;
  });
  let firstCombat = true;
  await gm.route("**/api/combat?*", async route => {
    if (firstCombat) {firstCombat = false; return route.fulfill({status:400,contentType:"application/json",body:JSON.stringify({error:"Dados inválidos."})});}
    return route.continue();
  });
  await gm.goto(base);
  await gm.locator("#auth [name=name]").fill("Teste mestre");
  await gm.locator("#auth [name=password]").fill("test-only-12345");
  await gm.getByRole("button", { name: "Entrar", exact: true }).click();
  await gm.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await gm.locator("#battle image").waitFor();
  // Click the not-yet-ready board; it must not read undefined.enabled.
  await gm.locator("#battle").dispatchEvent("click", {clientX:100,clientY:100});
  await gm.waitForFunction(() => document.querySelector("#sync-status")?.textContent === "Sincronizado");
  assert(!(await gm.locator("#notice").textContent()).includes("undefined"));
  const saved = () =>
    gm.evaluate(async () => {
      const scene = await api("scene?table_id=" + active.id);
      return api(
        "combat?table_id=" + active.id + "&asset_id=" + scene.asset_id,
      );
    });
  if (host !== "127.0.0.1")
    assert.equal(
      await gm.evaluate(() => isSecureContext),
      false,
      "must test real HTTP LAN",
    );
  const info = await gm.evaluate(async () => ({
    tid: active.id,
    code: (await api("invite", { table_id: active.id })).code,
  }));
  const pc = await browser.newContext();
  const headers = { "X-Atlas-Request": "1" };
  await pc.request.post(base + "/api/register", {
    headers,
    data: { name: "Jogador ao vivo", password: "test-only-12345" },
  });
  await pc.request.post(base + "/api/join", {
    headers,
    data: { code: info.code },
  });
  const player = await pc.newPage();
  player.on("pageerror", (e) => errors.push(e.message));
  await player.goto(base);
  await player.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await player.locator("#battle image").waitFor();
  const playerId = await player.evaluate(() => me.id);
  // A single click must activate combat and the full grid on both browsers.
  await gm.evaluate(() => openWorkspacePanel("combat"));
  await player.waitForFunction(
    () =>
      document.querySelector("[data-layer=grid]").getAttribute("d").length >
      100,
  );
  assert((await saved()).state.enabled);
  await gm.locator("#grid-size").fill("45");
  await gm.locator("#save-grid").click();
  await player.waitForFunction(async () => {
    const s = await api("scene?table_id=" + active.id);
    return (
      (await api("combat?table_id=" + active.id + "&asset_id=" + s.asset_id))
        .state.grid.size === 45
    );
  });
  // Plain token creation/edit must work without secure-context-only cloning.
  await gm.locator("#quick-token").click();
  await gm.locator("#combat-form [name=name]").fill("Explorador");
  // Refresh membership for fixture-created player, as room was already open.
  await gm.locator("#close-dialog").click();
  await gm.evaluate(async () => {
    members = await api("members?table_id=" + active.id);
  });
  await gm.locator("#quick-token").click();
  await gm.locator("#combat-form [name=name]").fill("Explorador");
  await gm.locator("#combat-form [name=owner]").selectOption(playerId);
  await gm.locator("#combat-form button[type=submit]").click();
  await player.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  await gm.getByText("Tokens e condições", { exact: true }).click();
  await gm.locator("#edit-token").click();
  await gm.locator("#combat-form [name=name]").fill("Explorador LAN");
  await gm.locator("#combat-form button[type=submit]").click();
  await player.waitForFunction(
    () =>
      document.querySelector("[data-token]").getAttribute("aria-label") ===
      "Explorador LAN",
  );
  const clickHex = async (page, q, r) => {
    const point = await page.evaluate(
      async ({ q, r }) => {
        const svg = document.querySelector("#battle"),
          g = await import("/combat/geometry.mjs"),
          p = svg.createSVGPoint();
        [p.x, p.y] = g.center(q, r, 45, svg.viewBox.baseVal.height);
        const c = p.matrixTransform(svg.getScreenCTM());
        return { x: c.x, y: c.y };
      },
      { q, r },
    );
    await page.mouse.click(point.x, point.y);
  };
  const token = (await saved()).state.tokens[0];
  await player.locator("[data-token]").click();
  // Focus in master's grid input must not block remote updates.
  await gm.locator("#grid-size").focus();
  await clickHex(player, token.q + 2, token.r);
  await gm.waitForFunction(() =>
    document.querySelector("#movement-info").textContent.includes("3 /"),
  );
  assert.equal((await saved()).state.tokens[0].spent, 3);
  // Ruler is available to player and does not spend movement or create history.
  const before = (await saved()).revision;
  await player.locator("#ruler-toggle").click();
  await clickHex(player, token.q + 2, token.r);
  await clickHex(player, token.q + 3, token.r);
  await player.waitForFunction(() =>
    document
      .querySelector("#asset-status")
      .textContent.includes("Régua: 1 hexágonos"),
  );
  assert.equal((await saved()).revision, before);
  // Direct initiative access, synchronized while the player has a dialog open.
  await player.evaluate(() => openWorkspacePanel("dice"));
  await gm.evaluate(() => openWorkspacePanel("combat"));
  await gm.locator("#add-turn").click();
  await gm.locator("#combat-form [name=name]").fill("Explorador LAN");
  await gm.locator("#combat-form [name=value]").fill("18");
  await gm.locator("#combat-form button[type=submit]").click();
  await gm.locator("#next-turn").click();
  await player.waitForFunction(() =>
    document
      .querySelector("#combat-round")
      .textContent.includes("Explorador LAN"),
  );
  await player.locator("#drawer-close").click();
  // Simulate a dropped connection; the next polling attempts recover by themselves.
  await pc.route("**/api/combat?*", (route) => route.abort());
  await player.waitForFunction(() =>
    document.querySelector("#sync-status").textContent.includes("Reconectando"),
  );
  await pc.unroute("**/api/combat?*");
  await player.waitForFunction(
    () => document.querySelector("#sync-status").textContent === "Sincronizado",
  );
  // Changing scene also reaches player automatically.
  const fixture = JSON.parse(
    fs.readFileSync(path.join(output, "fixture.json")),
  );
  await gm.evaluate(
    async (aid) => sendScene(aid),
    fixture.assets[1],
  );
  assert((await gm.locator("#battle image").first().getAttribute("href")).includes(fixture.assets[1]), "sendScene must render before returning");
  await player.waitForFunction(
    (aid) =>
      document
        .querySelector("#battle image")
        .getAttribute("href")
        .includes(aid),
    fixture.assets[1],
  );
  await gm.waitForFunction(
    (aid) =>
      document
        .querySelector("#battle image")
        .getAttribute("href")
        .includes(aid),
    fixture.assets[1],
  );
  await gm.setViewportSize({ width: 390, height: 844 });
  await gm.evaluate(() => openWorkspacePanel("combat"));
  assert(await gm.evaluate(() => document.body.scrollWidth <= innerWidth + 1));
  await gm.screenshot({
    path: path.join(output, "combat-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: HTTP " +
      host +
      ", one-click grid, size, plain token edit, live player movement with focused GM grid, ruler without cost, initiative during dialog, reconnection, scene switch, mobile.",
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
