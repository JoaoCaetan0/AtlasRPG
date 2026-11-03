const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("assert");
const output = process.env.ATLAS_UI_OUTPUT || "/tmp/atlas-workspace-ui";
fs.mkdirSync(output, { recursive: true });
process.env.ATLAS_UI_OUTPUT = output;
let server, browser;
(async () => {
  server = require("child_process").spawn("python", [
    path.join(__dirname, "ui_fixture.py"),
  ]);
  server.stderr.on("data", (d) => process.stderr.write(d));
  await new Promise((ok, no) => {
    server.stdout.once("data", ok);
    server.once("error", no);
    server.once("exit", (c) => no(Error("fixture " + c)));
  });
  browser = await chromium.launch({
    executablePath: process.env.ATLAS_BROWSER,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });
  const gm = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors = [];
  gm.on("pageerror", (e) => errors.push(e.message));
  gm.on("dialog", (d) => d.accept());
  await gm.goto("http://127.0.0.1:8766");
  await gm.locator("#auth [name=name]").fill("Teste mestre");
  await gm.locator("#auth [name=password]").fill("test-only-12345");
  await gm.getByRole("button", { name: "Entrar", exact: true }).click();
  await gm.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await gm.locator("#battle image").waitFor();
  await gm.evaluate(() => {
    window.savedSvg = document.querySelector("#battle");
    window.savedImage = document.querySelector("#battle image");
  });
  const open = async (name) => {
    if (await gm.evaluate((name) => currentPanel !== name, name))
      await gm.locator(`[data-tab=${name}]`).click();
  };
  await open("combat");
  await gm.waitForFunction(
    () =>
      document.querySelector("[data-layer=grid]").getAttribute("d").length >
      100,
  );
  await gm.locator("#quick-token").click();
  await gm.locator("#combat-form [name=name]").fill("Guardião");
  await gm.locator("#combat-form button[type=submit]").click();
  await gm.locator("[data-token]").waitFor();
  await gm.locator("#drawer-close").click();
  await gm.locator("[data-token]").click();
  await gm.locator("#map-zoom").fill("150");
  await gm.locator("#map-zoom").dispatchEvent("input");
  await open("chat");
  await gm.locator("#chat textarea").fill("Rascunho da sessão");
  await open("dice");
  await gm.locator("#dice-slot [name=expression]").fill("2d20+3");
  await gm.locator(".roll-submit").click();
  await gm.locator(".roll-card").first().waitFor();
  await open("chat");
  assert.equal(
    await gm.locator("#chat textarea").inputValue(),
    "Rascunho da sessão",
  );
  await gm.locator("#chat button").click();
  await gm.waitForFunction(() =>
    document
      .querySelector("#chat-log")
      .textContent.includes("Rascunho da sessão"),
  );
  await open("dice");
  assert.equal(
    await gm.locator("#dice-slot [name=expression]").inputValue(),
    "2d20+3",
  );
  assert(
    await gm.evaluate(
      () =>
        window.savedSvg === document.querySelector("#battle") &&
        window.savedImage === document.querySelector("#battle image"),
    ),
  );
  assert.equal(await gm.locator("#map-zoom").inputValue(), "150");
  assert((await gm.locator("#movement-info").innerText()).includes("Guardião"));
  // Every main area opens as a drawer over the exact same tabletop.
  for (const name of [
    "maps",
    "files",
    "characters",
    "notes",
    "members",
    "admin",
  ]) {
    await open(name);
    assert.equal(await gm.locator("#workspace-drawer").isVisible(), true);
    assert(
      await gm.evaluate(
        () => window.savedSvg === document.querySelector("#battle"),
      ),
    );
  }
  await open("notes");
  await gm.locator("#note").fill("Não perder este rascunho");
  await gm.locator("#drawer-close").click();
  await open("notes");
  assert.equal(
    await gm.locator("#note").inputValue(),
    "Não perder este rascunho",
  );
  await gm.locator("#save").click();
  await gm.waitForFunction(() => !dirty);
  await open("assets");
  await gm.locator("[data-asset=lobo]").click();
  await gm.locator("#asset-insert").click();
  await gm.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 2,
  );
  assert(await gm.locator("#workspace-drawer").isHidden());
  await open("history");
  await gm.locator("#combat-undo").click();
  await gm.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 1,
  );
  await gm.locator("#combat-redo").click();
  await gm.waitForFunction(
    () => document.querySelectorAll("[data-token]").length === 2,
  );
  // Second authenticated browser: live chat, turn and map while drawers remain open.
  const info = await gm.evaluate(async () => ({
    tid: active.id,
    code: (await api("invite", { table_id: active.id })).code,
  }));
  const pc = await browser.newContext();
  const headers = { "X-Atlas-Request": "1" };
  await pc.request.post("http://127.0.0.1:8766/api/register", {
    headers,
    data: { name: "Jogador lateral", password: "test-only-12345" },
  });
  await pc.request.post("http://127.0.0.1:8766/api/join", {
    headers,
    data: { code: info.code },
  });
  const player = await pc.newPage();
  player.on("pageerror", (e) => errors.push(e.message));
  await player.goto("http://127.0.0.1:8766");
  await player.getByRole("button", { name: "Abrir mesa", exact: true }).click();
  await player.locator("[data-token]").first().waitFor();
  assert.equal(await player.locator("[data-tab=admin]").count(), 0);
  assert.equal(await player.locator("[data-tab=assets]").count(), 0);
  await player.locator("[data-tab=chat]").click();
  await player.locator("#chat textarea").fill("Olá mestre");
  await player.locator("#chat button").click();
  await open("chat");
  await gm.waitForFunction(() =>
    document.querySelector("#chat-log").textContent.includes("Olá mestre"),
  );
  await open("combat");
  await gm.locator("#add-turn").click();
  await gm.locator("#combat-form [name=name]").fill("Vigia");
  await gm.locator("#combat-form button[type=submit]").click();
  await gm.locator("#next-turn").click();
  await player.waitForFunction(() =>
    document.querySelector("#combat-round").textContent.includes("Vigia"),
  );
  await open("chat");
  await gm.screenshot({ path: path.join(output, "workspace-desktop.png") });
  await gm.setViewportSize({ width: 390, height: 844 });
  await open("combat");
  assert(await gm.evaluate(() => document.body.scrollWidth <= innerWidth + 1));
  await gm.screenshot({
    path: path.join(output, "workspace-mobile.png"),
    fullPage: true,
  });
  await gm.locator("#drawer-close").press("Escape");
  assert(await gm.locator("#workspace-drawer").isHidden());
  assert.equal(
    await gm
      .locator("[data-tab=combat]")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  const fixture = JSON.parse(
    fs.readFileSync(path.join(output, "fixture.json")),
  );
  await gm.evaluate(
    (aid) => api("scene", { table_id: active.id, asset_id: aid }),
    fixture.assets[1],
  );
  await player.waitForFunction(
    (aid) =>
      document
        .querySelector("#battle image")
        .getAttribute("href")
        .includes(aid),
    fixture.assets[1],
  );
  assert(await player.locator("#chat").isVisible());
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all overlay menus; map/image/zoom/selection preserved; chat and dice drafts; notes; token library; undo/redo; two-role live chat/turn/map; mobile; Escape and focus.",
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
