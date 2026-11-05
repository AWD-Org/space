// Smoke tests for Space. Visits the key public routes of a dev/staging URL and
// opens (or reuses) one GitHub issue per failing check, labelled `type: bug`
// so the project auto-add puts it in the Bugs view.
//
// Env: SMOKE_BASE_URL (required), GITHUB_TOKEN + GITHUB_REPOSITORY (to file issues),
//      RUN_URL (link to the workflow run), DRY_RUN=1 (never touch GitHub).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
if (!BASE) {
  console.error("SMOKE_BASE_URL is required");
  process.exit(2);
}
if (/^https?:\/\/(www\.)?space\.amoxtli\.tech/i.test(BASE)) {
  console.error("Refusing to run against production");
  process.exit(2);
}

const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

// Console noise that is not an app bug.
const IGNORED_CONSOLE = [/favicon/i, /Download the React DevTools/i, /third-party cookie/i];
// Third-party hosts whose failures are not ours.
const IGNORED_HOSTS = [/googletagmanager|google-analytics|googleapis\.com\/identitytoolkit/i];

const checks = [
  { id: "landing-desktop", title: "Landing page fails on desktop", path: "/", ctx: DESKTOP, expectText: /cat[aá]logo/i },
  { id: "landing-mobile", title: "Landing page fails on mobile", path: "/", ctx: MOBILE, expectText: /cat[aá]logo/i, noHorizontalScroll: true },
  { id: "login-mobile", title: "Login page fails on mobile", path: "/entrar", ctx: MOBILE, expectSelector: "input", noHorizontalScroll: true },
  { id: "login-desktop", title: "Login page fails on desktop", path: "/entrar", ctx: DESKTOP, expectSelector: "input" },
  { id: "register-mobile", title: "Sign-up page fails on mobile", path: "/registro", ctx: MOBILE, expectSelector: "input", noHorizontalScroll: true },
  { id: "terms", title: "Terms page fails", path: "/terminos", ctx: DESKTOP, expectText: /t[eé]rminos/i },
  { id: "privacy", title: "Privacy page fails", path: "/privacidad", ctx: DESKTOP, expectText: /privacidad/i },
  { id: "not-found", title: "Unknown routes do not return a real 404", path: "/esta-ruta-no-existe-smoke", ctx: DESKTOP, expectStatus: 404 },
  { id: "panel-guard", title: "Panel is reachable without a session", path: "/app", ctx: DESKTOP, expectRedirectTo: /\/(entrar|registro)/ },
];

async function runCheck(browser, check) {
  const context = await browser.newContext({ ...check.ctx, locale: "es-MX" });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (m) => {
    if (check.expectStatus && /Failed to load resource/i.test(m.text())) return; // the expected 4xx itself
    if (m.type() === "error" && !IGNORED_CONSOLE.some((r) => r.test(m.text()))) problems.push("console error: " + m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => problems.push("uncaught exception: " + String(e.message).slice(0, 300)));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !IGNORED_HOSTS.some((x) => x.test(u)) && !(check.expectStatus && u === BASE + check.path)) {
      problems.push("HTTP " + r.status() + " " + u.slice(0, 200));
    }
  });
  let status = 0;
  try {
    const res = await page.goto(BASE + check.path, { waitUntil: "networkidle", timeout: 45000 });
    status = res ? res.status() : 0;
    const wanted = check.expectStatus || 200;
    if (!check.expectRedirectTo && status !== wanted) problems.push("expected HTTP " + wanted + " but got " + status);
    if (check.expectRedirectTo && !check.expectRedirectTo.test(new URL(page.url()).pathname)) problems.push("expected a redirect to the login but ended on " + new URL(page.url()).pathname);
    if (check.expectText) {
      const text = await page.locator("body").innerText();
      if (!check.expectText.test(text)) problems.push("expected text " + check.expectText + " not found");
    }
    if (check.expectSelector && (await page.locator(check.expectSelector).count()) === 0) problems.push("expected element " + check.expectSelector + " not found");
    if (check.noHorizontalScroll) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) problems.push("horizontal scroll on mobile (" + overflow + "px)");
    }
  } catch (e) {
    problems.push("navigation failed: " + String(e.message).split("\n")[0]);
  }
  let shot = null;
  if (problems.length) {
    mkdirSync("smoke-results", { recursive: true });
    shot = "smoke-results/" + check.id + ".png";
    await page.screenshot({ path: shot, fullPage: false }).catch(() => (shot = null));
  }
  await context.close();
  return { problems, shot };
}

async function gh(path, init = {}) {
  const res = await fetch("https://api.github.com/repos/" + process.env.GITHUB_REPOSITORY + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + process.env.GITHUB_TOKEN,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("GitHub " + res.status + " on " + path + ": " + (await res.text()).slice(0, 200));
  return res.json();
}

async function fileIssue(check, problems) {
  const marker = "<!-- smoke:" + check.id + " -->";
  const open = await gh("/issues?state=open&labels=" + encodeURIComponent("found in QA") + "&per_page=100");
  const existing = open.find((i) => !i.pull_request && (i.body || "").includes(marker));
  const when = new Date().toISOString();
  const list = problems.map((p) => "- " + p).join("\n");
  if (existing) {
    console.log("Issue already open for " + check.id + ": #" + existing.number);
    return;
  }
  const body = [
    "Automatic smoke test failed twice in a row.",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| Check | `" + check.id + "` |",
    "| URL | " + BASE + check.path + " |",
    "| Viewport | " + (check.ctx.isMobile ? "mobile 390x844" : "desktop 1440x900") + " |",
    "| Detected | " + when + " |",
    "| Run | " + (process.env.RUN_URL || "n/a") + " |",
    "",
    "### What failed",
    list,
    "",
    "A screenshot is attached to the workflow run as the `smoke-results` artifact.",
    "",
    marker,
    "*Reported by the Space smoke tests*",
  ].join("\n");
  const issue = await gh("/issues", {
    method: "POST",
    body: JSON.stringify({ title: "[Smoke] " + check.title, body, labels: ["type: bug", "found in QA", "S2: high"] }),
  });
  console.log("Opened #" + issue.number + " for " + check.id);
}

const browser = await chromium.launch();
const failed = [];
for (const check of checks) {
  let r = await runCheck(browser, check);
  if (r.problems.length) {
    await new Promise((res) => setTimeout(res, 15000)); // one retry before calling it a bug
    r = await runCheck(browser, check);
  }
  console.log((r.problems.length ? "FAIL " : "PASS ") + check.id + (r.problems.length ? "\n  " + r.problems.join("\n  ") : ""));
  if (r.problems.length) failed.push({ check, problems: r.problems });
}
await browser.close();

if (failed.length && !process.env.DRY_RUN && process.env.GITHUB_TOKEN) {
  for (const f of failed) await fileIssue(f.check, f.problems);
}
console.log(failed.length ? failed.length + " of " + checks.length + " checks failed" : "All " + checks.length + " checks passed");
process.exit(failed.length ? 1 : 0);
