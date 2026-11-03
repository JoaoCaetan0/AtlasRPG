const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("assert");
const output =
  process.env.ATLAS_UI_OUTPUT || require("os").tmpdir() + "/atlas-history-ui";
fs.mkdirSync(output, { recursive: true });
process.env.ATLAS_UI_OUTPUT = output;
let server, browser;
(async () => {
  server = require("child_process").spawn("python", [
    path.join(__dirname, "ui_fixture.py"),
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
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto("http://127.0.0.1:8766");
  await page.locator("#auth [name=name]").fill("Teste mestre");
  await page.locator("#auth [name=password]").fill("test-only-12345");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await page.locator("#battle image").waitFor();
  const saved = () =>
    page.evaluate(async () => {
      const scene = await api("scene?table_id=" + active.id);
      return api(
        "combat?table_id=" + active.id + "&asset_id=" + scene.asset_id,
      );
    });
  const history = () => page.evaluate(() => openWorkspacePanel("history"));
  await page.evaluate(() => openWorkspacePanel("combat"));
  await page.locator("#quick-token").click();
  await page.locator("#combat-form [name=name]").fill("Guardião");
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-token]").length === 1 &&
      !document.querySelector("#dialog").open,
  );
  await page.evaluate(() => openWorkspacePanel("combat"));
  await page.getByText("Tokens e condições", { exact: true }).click();
  await page.locator("#edit-token").click();
  await page.locator("#combat-form [name=name]").fill("Sentinela");
  const revision = (await saved()).revision;
  await page.locator("#combat-form [name=name]").press("Control+z");
  assert.equal((await saved()).revision, revision, "typing undo changed scene");
  await page.locator("#combat-form [name=name]").fill("Sentinela");
  await page.locator("#combat-form button[type=submit]").click();
  await page.waitForFunction(() => !document.querySelector("#dialog").open);
  await page.locator("#delete-token").click();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 0,
  );
  await page.locator("#battle").press("Control+z");
  await page.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  assert.equal((await saved()).state.tokens[0].name, "Sentinela");
  await page.locator("#battle").press("Control+z");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-token]").getAttribute("aria-label") ===
      "Guardião",
  );
  await page.locator("#battle").press("Control+Shift+z");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-token]").getAttribute("aria-label") ===
      "Sentinela",
  );
  await page.reload();
  await page.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await page.locator("[data-token]").waitFor();
  await history();
  assert(await page.locator("#combat-redo").isEnabled());
  await page.locator("#combat-redo").click();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 0,
  );
  await page.locator("#combat-undo").click();
  await page.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  await page.locator("#drawer-close").click();
  // A real map click must record movement and restore its cost too.
  await page.locator("[data-token]").click();
  const token = (await saved()).state.tokens[0];
  const point = await page.evaluate(async (t) => {
    const svg = document.querySelector("#battle"),
      g = await import("/combat/geometry.mjs"),
      p = svg.createSVGPoint();
    [p.x, p.y] = g.center(t.q + 1, t.r, 35, svg.viewBox.baseVal.height);
    const c = p.matrixTransform(svg.getScreenCTM());
    return { x: c.x, y: c.y };
  }, token);
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() =>
    document.querySelector("#movement-info").textContent.includes("1.5 /"),
  );
  await history();
  await page.locator("#combat-undo").click();
  await page.waitForFunction(() =>
    document.querySelector("#movement-info").textContent.includes("0 /"),
  );
  assert.equal((await saved()).state.tokens[0].q, token.q);
  await page.locator("#combat-redo").click();
  await page.waitForFunction(() =>
    document.querySelector("#movement-info").textContent.includes("1.5 /"),
  );
  await page.screenshot({ path: path.join(output, "history-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    "mobile history overflow",
  );
  await page.screenshot({
    path: path.join(output, "history-mobile.png"),
    fullPage: true,
  });
  const beforeTab = (await saved()).revision;
  await page.locator("[data-tab=dice]").click();
  await page.locator(".roll-submit").press("Control+z");
  assert.equal(
    (await saved()).revision,
    beforeTab,
    "history shortcut escaped map scope",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: delete/edit undo, redo, reload persistence, movement cost restoration, native text undo isolation and mobile history.",
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
