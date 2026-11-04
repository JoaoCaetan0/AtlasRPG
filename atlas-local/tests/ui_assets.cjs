const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("assert");
const output =
  process.env.ATLAS_UI_OUTPUT || require("os").tmpdir() + "/atlas-assets-ui";
fs.mkdirSync(output, { recursive: true });
process.env.ATLAS_UI_OUTPUT = output;
let server, browser;
(async () => {
  server = require("child_process").spawn("python", [
    path.join(__dirname, "ui_camera_fixture.py"),
  ]);
  await new Promise((ok, no) => {
    server.stdout.once("data", ok);
    server.once("error", no);
    server.once("exit", (code) => no(Error("Fixture exited " + code)));
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
  await page.locator("#auth [name=name]").fill("Camera");
  await page.locator("#auth [name=password]").fill("camera-test-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await page.locator("#battle image").waitFor();
  const open = () => page.evaluate(() => openWorkspacePanel("assets"));
  const count = async (n) =>
    page.waitForFunction(
      (n) => document.querySelectorAll("[data-token]").length === n,
      n,
    );
  const saved = () =>
    page.evaluate(async () => {
      const scene = await api("scene?table_id=" + active.id);
      return api(
        "combat?table_id=" + active.id + "&asset_id=" + scene.asset_id,
      );
    });
  await open();
  assert.equal(await page.locator("[data-asset]").count(), 28);
  await page.locator("#asset-search").fill("LÓBO");
  assert.equal(await page.locator("[data-asset]").count(), 1);
  await page.locator("[data-favorite=lobo]").click();
  await page.locator("#asset-search").fill("");
  await page.locator("#asset-category").selectOption("favorites");
  assert.equal(await page.locator("[data-asset]").count(), 1);
  await page.locator("[data-asset=lobo]").click();
  await page.locator("#asset-options [name=count]").fill("2");
  await page.locator("#asset-insert").click();
  await count(2);
  assert.equal(await page.locator("[data-token] image").count(), 2);
  assert.deepEqual(
    (await saved()).state.tokens.map((t) => t.name),
    ["Lobo 1", "Lobo 2"],
  );
  await page.locator("#quick-undo").click();
  await count(0);
  assert.equal((await saved()).state.enabled, false);
  await open();
  await page.locator("#asset-category").selectOption("Armadilhas");
  await page.locator("[data-asset=armadilha]").click();
  assert(await page.locator("#asset-options [name=hidden]").isChecked());
  await page.locator("#asset-options [name=count]").fill("1");
  await page.locator("#asset-place").click();
  await page.locator("#battle").press("Escape");
  assert(
    !(await page.locator(".combat-board").getAttribute("class")).includes(
      "placing-asset",
    ),
  );
  await count(0);
  await open();
  await page.locator("#asset-place").click();
  const board = await page.locator("#battle").boundingBox();
  await page.mouse.click(board.x + board.width * 0.25, board.y + 220);
  await count(1);
  let state = await saved();
  assert.equal(state.state.tokens[0].appearance, "armadilha");
  assert(state.state.tokens[0].hidden);
  // Separate player session must not receive the concealed placement or insertion UI.
  const info = await page.evaluate(async () => ({
    tid: active.id,
    code: (await api("invite", { table_id: active.id })).code,
  }));
  const playerContext = await browser.newContext();
  const headers = { "X-Atlas-Request": "1" };
  await playerContext.request.post("http://127.0.0.1:8766/api/register", {
    headers,
    data: { name: "Jogador assets", password: "test-only-12345" },
  });
  await playerContext.request.post("http://127.0.0.1:8766/api/join", {
    headers,
    data: { code: info.code },
  });
  const player = await playerContext.newPage();
  await player.goto("http://127.0.0.1:8766");
  await player.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await player.locator("#battle image").waitFor();
  assert.equal(await player.locator("[data-token]").count(), 0);
  assert.equal(await player.locator("#asset-library").count(), 0);
  await open();
  await page.locator("#asset-category").selectOption("Monstros");
  await page
    .locator("[data-asset=goblin]")
    .dragTo(page.locator("#battle"), { targetPosition: { x: 110, y: 160 } });
  await count(2);
  state = await saved();
  assert.equal(state.state.tokens[1].appearance, "goblin");
  assert(!state.state.tokens[1].hidden);
  await player.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  await page.reload();
  await page.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await count(2);
  assert.equal(await page.locator("[data-token] image").count(), 2);
  await open();
  await page.locator("#asset-category").selectOption("favorites");
  assert.equal(await page.locator("[data-asset=lobo]").count(), 1);
  await page.locator("#asset-category").selectOption("");
  await page
    .locator("#asset-grid img")
    .evaluateAll((imgs) =>
      Promise.all(imgs.map((img) => img.decode())),
    );
  await page.screenshot({ path: path.join(output, "assets-desktop.png") });
  await page.locator("#drawer-close").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  await page.locator("#asset-category").selectOption("Aliados");
  await page.locator("[data-asset=aliado]").click();
  await page.locator("#asset-insert").click();
  await count(3);
  await open();
  await page.screenshot({
    path: path.join(output, "assets-mobile.png"),
    fullPage: true,
  });
  assert(
    await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    "mobile assets overflow",
  );
  // Plain tokens and artwork remain editable with the original combat editor.
  await page.locator("#drawer-close").click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => openWorkspacePanel("conditions"));
  state = await saved();
  const ally = state.state.tokens.find((t) => t.appearance === "aliado");
  await page.locator("#token-select").selectOption(ally.id);
  await page.locator("#edit-token").click();
  assert.equal(
    await page.locator("#combat-form [name=appearance]").inputValue(),
    "aliado",
  );
  await page.locator("#combat-form [name=appearance]").selectOption("slime");
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(() => !document.querySelector("#dialog").open);
  assert.equal(
    (await saved()).state.tokens.find((t) => t.id === ally.id).appearance,
    "slime",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: catalog search/categories/favorites, batch insertion, undo, click placement, Escape, hidden player filtering, drag/drop, persisted artwork, mobile and appearance editing.",
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
