// Zero-dependency static server + lead capture API.
//   node server.js            -> http://localhost:8080
//   PORT=9000 node server.js
//
// Endpoints:
//   POST /api/lead            store one inquiry from the site form
//   GET  /api/leads.csv       export all leads (needs LEAD_TOKEN)
//   GET  /api/health          service check
//   GET  /admin               datasheet editor (browser, no source code needed)
//   GET  /api/catalog         current series / models / spec values
//   POST /api/catalog         save values to data/catalog.json, then rebuild
//   POST /api/rebuild         rebuild the static site without saving
//
// Leads are appended to data/leads.jsonl — one JSON object per line, never
// overwritten, so nothing is lost if the service restarts.
// Spec values live in data/catalog.json, which build.js prefers over the
// defaults in src/data/catalog.js.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { execFile, execFileSync } = require("child_process");
const { SERIES, SPEC_FIELDS, RULES, CORRECTIONS } = require("./src/data/catalog.js");
const { DEEP } = require("./src/data/deep.js");
const { APPS, APP_T } = require("./src/apps.js");
const { T } = require("./src/i18n.js");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const DATA_DIR = path.join(ROOT, "data");
const LEADS = path.join(DATA_DIR, "leads.jsonl");
const CSV = path.join(DATA_DIR, "leads.csv");
// WorkBuddy 云库 leads 持久化（重部署不丢）。publishable key 本就在前端公开，可安全内置。
const CLOUD_LEADS_URL = process.env.WB_CLOUD_LEADS_URL || "https://chiller-b2b-site.app.workbuddy.host/.cloud/database/rest/leads";
const CLOUD_IMAGES_URL = process.env.WB_CLOUD_IMAGES_URL || "https://chiller-b2b-site.app.workbuddy.host/.cloud/database/rest/site_images";
const CLOUD_KEY = process.env.WB_CLOUD_KEY || "wbpk_t2KFszYVSzwXFrG40uHS4q_QCQsJY4GRgleqrX0YpoilF30XGS2Th8c";

// Server-side proxy for site_images. Browsers on the custom domain cannot call
// the WorkBuddy REST endpoint directly (CORS preflight has no ACAO header), so
// the front-end talks to these same-origin endpoints instead.
function cloudImagesApi(method, suffix, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { "Content-Type": "application/json", "x-wb-webapp-access-key": CLOUD_KEY, "Prefer": "return=representation" };
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);
    const r = https.request(CLOUD_IMAGES_URL + suffix, { method: method, headers: headers }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(raw ? JSON.parse(raw) : null); } catch (e) { resolve(null); }
        } else {
          reject(new Error("HTTP " + res.statusCode + " " + raw.slice(0, 200)));
        }
      });
    });
    r.on("error", reject);
    r.setTimeout(20000, () => r.destroy(new Error("cloud timeout")));
    if (payload) r.write(payload);
    r.end();
  });
}
const CATALOG_JSON = path.join(DATA_DIR, "catalog.json");
const ADMIN_HTML = path.join(ROOT, "admin.html");

// Deployment guard: the publish sandbox excludes prebuilt "dist/", so it must be
// rebuilt on the server. Do it in the BACKGROUND after listening — never before
// listen(), because a blocking build leaves no listener on $PORT and the platform
// gateway answers with its own bare "Not Found" until the build finishes.
let building = false;
let buildErr = null;
function distReady() {
  return fs.existsSync(path.join(DIST, "index.html"));
}
function ensureDist() {
  if (distReady() || building) return;
  building = true;
  console.log("dist/ missing — building static site in background…");
  execFile(process.execPath, ["build.js"], { cwd: ROOT, timeout: 180000 }, (err, stdout, stderr) => {
    building = false;
    buildErr = err ? String(stderr || err.message).slice(0, 400) : null;
    if (err) console.error("auto-build failed:", buildErr);
    else { console.log("auto-build done:", countPages(), "pages"); syncUploads(); }
  });
}
const WAIT_HTML =
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta http-equiv="refresh" content="2"><title>正在生成页面…</title>' +
  '<style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;' +
  'align-items:center;justify-content:center;height:100vh;margin:0;background:#f6f8fb;color:#22303f}' +
  '.b{text-align:center}i{display:inline-block;width:26px;height:26px;border:3px solid #d6e2f0;' +
  'border-top-color:#1d6fd8;border-radius:50%;animation:s .9s linear infinite;margin-bottom:14px}' +
  '@keyframes s{to{transform:rotate(360deg)}}p{margin:6px 0;font-size:15px}' +
  'small{color:#7b8a9a;font-size:12px}</style></head><body><div class="b">' +
  "<i></i><p>服务已启动，正在生成页面…</p><p><small>约 2-5 秒后自动刷新</small></p>" +
  "</div></body></html>";
const PORT = Number(process.env.PORT || 8080);
// No silent default: if LEAD_TOKEN is unset the lead export and the /admin editor
// stay disabled, so a fresh deploy can never expose customer data by accident.
const TOKEN = process.env.LEAD_TOKEN || "";
const AUTH_ON = TOKEN.length >= 8;

// Constant-time-ish compare for the token query param / cookie.
function tokenOk(given) {
  if (!AUTH_ON || !given) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(TOKEN);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
function cookieToken(req) {
  const raw = String(req.headers.cookie || "");
  const hit = raw.split(/;\s*/).find((c) => c.indexOf("lead_token=") === 0);
  return hit ? decodeURIComponent(hit.slice("lead_token=".length)) : "";
}
function authed(req, q) {
  return tokenOk(q.get("token")) || tokenOk(cookieToken(req));
}
const NO_AUTH_HTML =
  '<!doctype html><meta charset="utf-8"><title>后台未启用</title>' +
  '<body style="font-family:system-ui;padding:40px;max-width:640px;line-height:1.7">' +
  "<h2>后台未启用</h2><p>服务器没有配置 <code>LEAD_TOKEN</code> 环境变量，为保护客户询盘数据，" +
  "<code>/admin</code> 与询盘导出已自动关闭。</p>" +
  "<p>在主机（Render → Environment）设置一个至少 8 位的 <code>LEAD_TOKEN</code> 后重启即可启用。" +
  "访问方式：<code>/admin?token=你的口令</code></p></body>";

// Chinese labels for the editor (internal tool — staff facing).
const SPEC_LABEL = {
  capacity: "制冷量", kcal: "制冷量（大卡）", compressor: "压缩机输入功率",
  pump: "水泵输入功率", power: "总功率", flow: "冷冻水流量", voltage: "电源",
  refrigerant: "冷媒", dim: "外形尺寸", weight: "整机重量",
};
const RULE_LABEL = {
  inj: "注塑机（每吨锁模力）", blow: "吹塑机（每 kg/h 产量）",
  extr: "挤出机（螺杆直径）", rub: "橡胶挤出（每 kg/h 胶料）", laser: "激光（每 kW 功率）",
};
const CORR_LABEL = {
  ambient: "环境温度偏高", altitude: "高海拔", intermittent: "间歇运行",
  fullload: "满负荷连续运行",
};

// ---------- Factory profile editor data ----------
const FACTORY_JSON = path.join(DATA_DIR, "factory.json");
const FACT_KEYS = ["founded", "area", "staff", "capacity", "markets"];
const FACT_LABEL = {
  founded: "成立年份", area: "厂房面积", staff: "员工人数",
  capacity: "月产能（台）", markets: "出口国家",
};
const FACTORY_TEXT_KEYS = ["intro", "a1_t", "a1_d", "a2_t", "a2_d", "a3_t", "a3_d", "a4_t", "a4_d", "cta"];
// Four "factory evidence" tiles: editable label (zh/en) + uploaded photo.
const EV_KEYS = [
  { key: "workshop", img: "workshop.jpg", zh: "车间与产线", en: "Workshop & production lines" },
  { key: "test", img: "test.jpg", zh: "整机试机", en: "Full-unit testing" },
  { key: "cert", img: "factory-test.jpg", zh: "出厂测试", en: "Factory test" },
  { key: "shipping", img: "shipping.jpg", zh: "装柜与出口", en: "Loading & export" },
];
const IMG_DIR = path.join(DIST, "assets", "img");
// Uploaded photos/videos live in DATA_DIR (persisted when a disk is mounted at
// /app/data) and are copied into dist/assets/img after every (re)build, so
// redeploys never wipe the boss's media.
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function syncUploads() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) return 0;
    fs.mkdirSync(IMG_DIR, { recursive: true });
    let n = 0;
    for (const f of fs.readdirSync(UPLOAD_DIR)) {
      const src = path.join(UPLOAD_DIR, f);
      const dst = path.join(IMG_DIR, f);
      try { fs.copyFileSync(src, dst); n++; } catch (e) { /* skip unreadable file */ }
    }
    if (n) console.log(`uploads   restored ${n} media file(s) into dist`);
    return n;
  } catch (e) { return 0; }
}

function readFactory() {
  try {
    return JSON.parse(fs.readFileSync(FACTORY_JSON, "utf8")) || {};
  } catch (e) {
    return {};
  }
}

function factoryState() {
  const o = readFactory();
  const zh = (DEEP.zh) || {};
  const en = (DEEP.en) || {};
  const fill = (lang, k) => ((o.i18n && o.i18n[lang] && o.i18n[lang][k]) || "");
  const evOv = Array.isArray(o.evidence) ? o.evidence : [];
  return {
    textKeys: FACTORY_TEXT_KEYS,
    facts: FACT_KEYS.map((k) => ({ key: k, label: FACT_LABEL[k], value: String((o.facts || {})[k] || "") })),
    evidence: EV_KEYS.map((d, i) => {
      const e = evOv[i] || {};
      const img = String(e.img || d.img);
      return {
        key: d.key,
        img,
        zh: String(e.zh || ""),
        en: String(e.en || ""),
        // placeholder shown in the editor when nothing has been typed yet
        defZh: d.zh,
        defEn: d.en,
        // whether a real photo file exists for this tile
        has: fs.existsSync(path.join(IMG_DIR, img)),
      };
    }),
    i18n: {
      zh: FACTORY_TEXT_KEYS.reduce((acc, k) => { acc[k] = fill("zh", k); return acc; }, {}),
      en: FACTORY_TEXT_KEYS.reduce((acc, k) => { acc[k] = fill("en", k); return acc; }, {}),
    },
    // defaults currently rendered on the site, so the editor can show placeholders
    defaults: {
      zh: (T && T.zh) ? FACTORY_TEXT_KEYS.reduce((acc, k) => { acc[k] = T.zh["f_" + k] || ""; return acc; }, {}) : {},
      en: (T && T.en) ? FACTORY_TEXT_KEYS.reduce((acc, k) => { acc[k] = T.en["f_" + k] || ""; return acc; }, {}) : {},
    },
  };
}

function sanitizeFactory(input) {
  if (!input || typeof input !== "object") throw new Error("invalid payload");
  const out = { i18n: {}, facts: {}, savedAt: new Date().toISOString() };
  ["zh", "en"].forEach((lang) => {
    const src = (input.i18n || {})[lang] || {};
    out.i18n[lang] = {};
    FACTORY_TEXT_KEYS.forEach((k) => {
      const v = clip(src[k], 400);
      if (v) out.i18n[lang][k] = v;
    });
  });
  FACT_KEYS.forEach((k) => {
    const v = clip((input.facts || {})[k], 30);
    if (v) out.facts[k] = v;
  });
  if (Array.isArray(input.evidence)) {
    out.evidence = input.evidence.slice(0, 4).map((e, i) => {
      const d = EV_KEYS[i] || {};
      const item = {};
      // image: only keep a plain filename that lives under assets/img
      const img = clip((e && e.img) || "", 120).replace(/[^A-Za-z0-9._-]/g, "");
      if (img) item.img = img;
      const zh = clip((e && e.zh) || "", 60);
      const en = clip((e && e.en) || "", 60);
      if (zh) item.zh = zh;
      if (en) item.en = en;
      return item;
    });
  }
  return out;
}
const CASES_JSON = path.join(DATA_DIR, "cases.json");
const INDUSTRIES = APPS.map((a) => ({ key: a.key, label: (APP_T.zh[a.key] || {}).name || a.key }));
const COUNTRIES = [
  { key: "MX", label: "🇲🇽 墨西哥" }, { key: "BR", label: "🇧🇷 巴西" },
  { key: "US", label: "🇺🇸 美国" }, { key: "ME", label: "🕌 中东" },
  { key: "VN", label: "🇻🇳 越南" }, { key: "ID", label: "🇮🇩 印尼" },
  { key: "RU", label: "🇷🇺 俄罗斯" }, { key: "TH", label: "🇹🇭 泰国" },
  { key: "FR", label: "🇫🇷 法国" }, { key: "GB", label: "🇬🇧 英国" },
  { key: "OTHER", label: "🌎 其他国家" },
];

function readCases() {
  try {
    const o = JSON.parse(fs.readFileSync(CASES_JSON, "utf8"));
    return Array.isArray(o.cases) ? o.cases : [];
  } catch (e) {
    return [];
  }
}

function sanitizeCases(input) {
  if (!input || !Array.isArray(input.cases)) throw new Error("invalid payload");
  const out = [];
  input.cases.slice(0, 5).forEach((c) => {
    if (!c || typeof c !== "object") return;
    const item = {
      country: clip(c.country, 10),
      industry: clip(c.industry, 10),
      model: clip(c.model, 40),
      qty: clip(c.qty, 10),
      i18n: {},
    };
    const i18n = c.i18n && typeof c.i18n === "object" ? c.i18n : {};
    ["zh", "en"].forEach((lang) => {
      const t = i18n[lang];
      if (t && typeof t === "object") {
        item.i18n[lang] = {
          problem: clip(t.problem, 600),
          solution: clip(t.solution, 600),
          result: clip(t.result, 600),
        };
      }
    });
    out.push(item);
  });
  return { cases: out, savedAt: new Date().toISOString() };
}


const FIELDS = ["ts", "name", "company", "phone", "country", "model", "qty", "temp", "delivery", "msg", "page", "lang", "ip", "source", "medium", "campaign", "term", "content", "gclid", "fbclid", "ttclid"];
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".pdf": "application/pdf", ".woff2": "font/woff2",
};

function ensureData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function clip(v, max) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 500);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > (limit || 32 * 1024)) { reject(new Error("payload too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function toCsv(rows) {
  const esc = (v) => `"${String(v === undefined || v === null ? "" : v).replace(/"/g, '""')}"`;
  const head = FIELDS.join(",");
  const body = rows.map((r) => FIELDS.map((f) => esc(r[f])).join(",")).join("\n");
  return "\uFEFF" + head + "\n" + body + "\n";
}

function readLeads() {
  if (!fs.existsSync(LEADS)) return [];
  return fs.readFileSync(LEADS, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);
}

// Delete an uploaded media file from both the persistent dir and live dist.
// Only accepts names produced by /api/upload, so repo defaults can't be wiped.
function deleteMedia(name) {
  const safe = String(name || "").replace(/[^A-Za-z0-9._-]/g, "");
  if (!safe) return false;
  const uploadedName = /^([a-z0-9_-]+-[a-z0-9]{6,12}|factory-video)\.(jpg|png|webp|gif|mp4|webm|mov)$/i.test(safe);
  if (!uploadedName) return false;
  let ok = false;
  for (const dir of [UPLOAD_DIR, IMG_DIR]) {
    const f = path.join(dir, safe);
    if (!f.startsWith(dir)) continue;
    try { if (fs.existsSync(f)) { fs.unlinkSync(f); ok = true; } } catch (e) { /* ignore */ }
  }
  return ok;
}

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

// ---------- Datasheet state (defaults merged with data/catalog.json) ----------
function readOverride() {
  try {
    return JSON.parse(fs.readFileSync(CATALOG_JSON, "utf8")) || {};
  } catch (e) {
    return {};
  }
}

function catalogState() {
  const o = readOverride();
  const zh = (DEEP && DEEP.zh) || { series: {} };
  const ovCorr = Array.isArray(o.corrections) ? o.corrections : [];
  return {
    fields: SPEC_FIELDS.map((f) => ({ key: f.key, unit: f.unit, label: SPEC_LABEL[f.key] || f.key })),
    series: SERIES.map((s) => {
      const ov = (o.series || {})[s.key] || {};
      return {
        key: s.key,
        slug: s.slug,
        name: (zh.series[s.key] || {}).name || s.key,
        models: Array.isArray(ov.models) && ov.models.length ? ov.models.map(String) : s.models,
        spec: ov.spec && typeof ov.spec === "object" ? ov.spec : {},
      };
    }),
    rules: Object.keys(RULES).map((k) => {
      const saved = (o.rules || {})[k];
      const kv = saved && Array.isArray(saved.k) ? saved.k : RULES[k].k;
      return { key: k, label: RULE_LABEL[k] || k, k: [kv[0], kv[1]] };
    }),
    corrections: CORRECTIONS.map((c) => {
      const hit = ovCorr.find((x) => x && x.key === c.key);
      const v = hit && hit.factor !== null && hit.factor !== undefined ? Number(hit.factor) : c.factor;
      return { key: c.key, label: CORR_LABEL[c.key] || c.key, factor: isNaN(v) ? c.factor : v };
    }),
  };
}

// Accept only the shape we expect; anything else is dropped rather than stored.
function sanitizeCatalog(input) {
  if (!input || typeof input !== "object") throw new Error("invalid payload");
  const known = SERIES.map((s) => s.key);
  const fields = SPEC_FIELDS.map((f) => f.key);
  const out = { series: {}, rules: {}, corrections: [], savedAt: new Date().toISOString() };

  Object.keys(input.series || {}).forEach((key) => {
    if (known.indexOf(key) === -1) return;
    const s = input.series[key] || {};
    const models = (Array.isArray(s.models) ? s.models : [])
      .map((m) => clip(m, 40)).filter(Boolean).slice(0, 12);
    if (!models.length) return;
    const spec = {};
    models.forEach((m) => {
      const src = (s.spec || {})[m];
      if (!src || typeof src !== "object") return;
      const row = {};
      fields.forEach((f) => {
        const v = clip(src[f], 60);
        if (v) row[f] = v;
      });
      if (Object.keys(row).length) spec[m] = row;
    });
    out.series[key] = { models, spec };
  });

  Object.keys(input.rules || {}).forEach((k) => {
    if (!RULES[k]) return;
    const kv = (input.rules[k] || {}).k;
    if (!Array.isArray(kv)) return;
    const pair = kv.map((x) => (x === null || x === "" || isNaN(Number(x)) ? null : Number(x)));
    if (pair[0] === null || pair[1] === null) return;
    if (pair[0] <= 0 || pair[1] <= 0 || pair[1] < pair[0]) return;
    out.rules[k] = { k: pair };
  });

  (Array.isArray(input.corrections) ? input.corrections : []).forEach((c) => {
    if (!c || !CORRECTIONS.some((x) => x.key === c.key)) return;
    const f = c.factor === null || c.factor === "" ? null : Number(c.factor);
    if (f === null || isNaN(f) || f <= 0) return;
    out.corrections.push({ key: c.key, factor: f });
  });

  return out;
}

function countPages() {
  let n = 0;
  (function walk(dir) {
    let list = [];
    try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    list.forEach((d) => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) walk(p);
      else if (d.name.endsWith(".html")) n++;
    });
  })(DIST);
  return n;
}

function rebuild() {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(ROOT, "build.js")], { cwd: ROOT, timeout: 180000 }, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: "构建失败：" + String(stderr || err.message).slice(0, 400) });
      syncUploads();
      resolve({ ok: true, msg: "已发布，重新生成 " + countPages() + " 个页面" });
    });
  });
}

function serveStatic(req, res, urlPath) {
  // First boot / restarted container: pages are still being generated.
  if (!distReady()) {
    ensureDist();
    if (buildErr) {
      return send(res, 503,
        "<!doctype html><meta charset=utf-8><title>构建失败</title>" +
        "<body style=\"font-family:system-ui;padding:40px\"><h2>站点构建失败</h2><pre>" +
        buildErr.replace(/[<>&]/g, "") + "</pre></body>", "text/html; charset=utf-8");
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(WAIT_HTML);
  }

  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(DIST, path.normalize(rel).replace(/^([/\\])+/, ""));
  if (!file.startsWith(DIST)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");

  const pipeFile = (f, st) => {
    const ext = path.extname(f).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": st.size,
      "Cache-Control": ext === ".html" ? "public, max-age=0, must-revalidate" : "public, max-age=86400",
    });
    fs.createReadStream(f).pipe(res);
  };

  fs.stat(file, (err, st) => {
    if (!err && st.isFile()) return pipeFile(file, st);

    // A directory requested without a trailing slash (e.g. /en, /es, /pt):
    // serve its index.html instead of a bare 404, so language links never dead-end.
    if (!err && st.isDirectory()) {
      const idx = path.join(file, "index.html");
      return fs.stat(idx, (e2, st2) => {
        if (!e2 && st2.isFile()) return pipeFile(idx, st2);
        send(res, 404, "Not found", "text/plain; charset=utf-8");
      });
    }

    // No such file: if it looks like a language/bare segment without extension,
    // try "<rel>/index.html" before giving up.
    if (!path.extname(file)) {
      const idx = path.join(file, "index.html");
      return fs.stat(idx, (e3, st3) => {
        if (!e3 && st3.isFile()) return pipeFile(idx, st3);
        send(res, 404, "Not found", "text/plain; charset=utf-8");
      });
    }

    send(res, 404, "Not found", "text/plain; charset=utf-8");
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";

  if (url.startsWith("/api/health")) return send(res, 200, JSON.stringify({ ok: true, leads: readLeads().length, notify: notifySummary() }));

  const pathname = url.split("?")[0];
  const Q = new URLSearchParams(url.split("?")[1] || "");

  if (url.startsWith("/api/notify-status")) {
    if (!authed(req, Q)) return send(res, 401, "Unauthorized", "text/plain; charset=utf-8");
    if (Q.get("selfcheck") === "1") {
      const results = await notifySend("[自检] 询盘通知通道测试", "这是一条通道自检消息，非真实询盘。", null, true);
      return send(res, 200, JSON.stringify({ ok: true, results: results, summary: notifySummary() }));
    }
    return send(res, 200, JSON.stringify(notifySummary(true)));
  }


  // Lets public pages decide whether to show inline image tools. Uses the same
  // token cookie set by /admin?token=... (7 days), so no token is exposed in JS.
  if (pathname === "/api/editor-status") {
    return send(res, 200, JSON.stringify({ ok: authed(req, Q) }), "application/json; charset=utf-8");
  }

  // Cloud image store, proxied same-origin to avoid CORS on the custom domain.
  if (pathname === "/api/images" && req.method === "GET") {
    try {
      const rows = await cloudImagesApi("GET", "?select=images&id=eq.1");
      const images = (rows && rows[0] && rows[0].images) || {};
      return send(res, 200, JSON.stringify({ images: images }));
    } catch (e) {
      return send(res, 502, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }
  if (pathname === "/api/images" && req.method === "POST") {
    try {
      const o = JSON.parse((await readBody(req, 16 * 1024 * 1024)) || "{}");
      if (!o.images || typeof o.images !== "object") {
        return send(res, 400, JSON.stringify({ ok: false, error: "missing images" }));
      }
      await cloudImagesApi("PATCH", "?id=eq.1", { images: o.images, saved_at: new Date().toISOString() });
      return send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      return send(res, 502, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }
  // Partial update: browser sends only ONE gallery / one fixed slot instead of
  // the whole 1MB image set. Cloudflare adds ~1s per 30KB on browser POSTs, so
  // uploading everything made every edit time out. Server merges here.
  if (pathname === "/api/images/patch" && req.method === "POST") {
    try {
      const o = JSON.parse((await readBody(req, 16 * 1024 * 1024)) || "{}");
      if (!o.key || typeof o.key !== "string") {
        return send(res, 400, JSON.stringify({ ok: false, error: "missing key" }));
      }
      const rows = await cloudImagesApi("GET", "?select=images&id=eq.1");
      const images = (rows && rows[0] && rows[0].images) || {};
      if (o.gallery !== undefined) {
        if (!images.__galleries || typeof images.__galleries !== "object" || Array.isArray(images.__galleries)) images.__galleries = {};
        if (o.gallery === null) delete images.__galleries[o.key];
        else images.__galleries[o.key] = o.gallery;
      } else if (o.slot !== undefined) {
        if (o.slot === null) delete images[o.key];
        else images[o.key] = o.slot;
      } else {
        return send(res, 400, JSON.stringify({ ok: false, error: "missing gallery/slot" }));
      }
      await cloudImagesApi("PATCH", "?id=eq.1", { images: images, saved_at: new Date().toISOString() });
      return send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      return send(res, 502, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  // Editors change live site content, so every one of them sits behind LEAD_TOKEN.
  // /api/catalog and /api/factory are also read by the public JS bundle, so only
  // their write verbs are gated; reading the datasheet stays open.
  const ADMIN_WRITE = ["/api/catalog", "/api/factory", "/api/cases", "/api/upload", "/api/upload/delete", "/api/rebuild"];
  const wantsAdminPage = pathname === "/admin" || pathname === "/admin.html";
  const wantsAdminWrite = ADMIN_WRITE.indexOf(pathname) !== -1 && req.method === "POST";
  if (wantsAdminPage || wantsAdminWrite) {
    if (!AUTH_ON) {
      if (wantsAdminPage) return send(res, 200, NO_AUTH_HTML, "text/html; charset=utf-8");
      return send(res, 503, JSON.stringify({ ok: false, error: "编辑器未启用：服务器未配置 LEAD_TOKEN" }));
    }
    if (!authed(req, Q)) {
      if (wantsAdminPage) {
        return send(res, 401,
          '<!doctype html><meta charset="utf-8"><title>需要口令</title>' +
          '<body style="font-family:system-ui;padding:40px;max-width:640px;line-height:1.7"><h2>需要口令</h2>' +
          '<p>请在网址后加 <code>?token=你的口令</code>，例如 <code>/admin?token=口令</code>。' +
          "验证一次后浏览器会记住 7 天。</p></body>",
          "text/html; charset=utf-8");
      }
      return send(res, 401, JSON.stringify({ ok: false, error: "unauthorized" }));
    }
    // Remember a good token so the editor's in-page fetches keep working.
    if (Q.get("token")) res.setHeader("Set-Cookie", `lead_token=${encodeURIComponent(TOKEN)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  }

  if (pathname === "/admin" || pathname === "/admin.html") {
    return fs.readFile(ADMIN_HTML, "utf8", (err, html) => {
      if (err) return send(res, 404, "admin.html not found", "text/plain; charset=utf-8");
      send(res, 200, html, "text/html; charset=utf-8");
    });
  }

  if (pathname === "/api/catalog" && req.method === "GET") {
    return send(res, 200, JSON.stringify(catalogState()));
  }

  if (pathname === "/api/factory" && req.method === "GET") {
    return send(res, 200, JSON.stringify(factoryState()));
  }

  if (pathname === "/api/factory" && req.method === "POST") {
    try {
      const raw = await readBody(req, 512 * 1024);
      const clean = sanitizeFactory(JSON.parse(raw || "{}"));
      ensureData();
      fs.writeFileSync(FACTORY_JSON, JSON.stringify(clean, null, 2), "utf8");
      console.log("factory  saved");
      const r = await rebuild();
      return send(res, r.ok ? 200 : 500, JSON.stringify(r));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  // Remove an uploaded photo/video (boss can take media down from /admin).
  if (pathname === "/api/upload/delete" && req.method === "POST") {
    try {
      const raw = await readBody(req, 8 * 1024);
      const body = JSON.parse(raw || "{}");
      const gone = deleteMedia(body.name);
      if (!gone) return send(res, 404, JSON.stringify({ ok: false, error: "文件不存在或不可删除" }));
      console.log(`upload   deleted ${body.name}`);
      return send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  // Upload a factory-evidence photo or factory video (base64 data URL).
  if (pathname === "/api/upload" && req.method === "POST") {
    try {
      const raw = await readBody(req, 80 * 1024 * 1024);
      const body = JSON.parse(raw || "{}");
      const dataUrl = String(body.dataUrl || "");
      const m = dataUrl.match(/^data:(image\/(png|jpe?g|webp|gif)|video\/(mp4|webm|quicktime));base64,(.+)$/i);
      if (!m) throw new Error("只支持 png / jpg / webp 图片或 mp4 / webm / mov 视频");
      const kind = m[1].toLowerCase().startsWith("image/") ? "image" : "video";
      let ext = m[2] || m[3];
      ext = String(ext).toLowerCase().replace("jpeg", "jpg").replace("quicktime", "mov");
      const buf = Buffer.from(m[4], "base64");
      const maxBytes = kind === "image" ? 20 * 1024 * 1024 : 60 * 1024 * 1024;
      if (buf.length > maxBytes) throw new Error(kind === "image" ? `图片 ${(buf.length / 1048576).toFixed(1)}MB 超过 20MB 上限，请压缩后再传` : `视频 ${(buf.length / 1048576).toFixed(1)}MB 超过 60MB 上限，请压缩或剪短后再传`);
      const base = String(body.base || (kind === "video" ? "factory-video" : "evidence")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "evidence";
      // Fixed name for videos so the site always points at one file; images keep
      // the timestamped name to avoid stale browser cache.
      const name = kind === "video" ? `${base}.${ext}` : `${base}-${Date.now().toString(36)}.${ext}`;
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);           // persistent copy (disk)
      fs.mkdirSync(IMG_DIR, { recursive: true });
      fs.writeFileSync(path.join(IMG_DIR, name), buf);              // live copy for current dist
      console.log(`upload   ${name}  ${buf.length}B`);
      return send(res, 200, JSON.stringify({ ok: true, img: name, video: kind === "video" ? name : undefined }));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  if (pathname === "/api/cases" && req.method === "GET") {
    return send(res, 200, JSON.stringify({ industries: INDUSTRIES, countries: COUNTRIES, cases: readCases() }));
  }
  if (pathname === "/api/cases" && req.method === "POST") {
    try {
      const raw = await readBody(req, 512 * 1024);
      const clean = sanitizeCases(JSON.parse(raw || "{}"));
      ensureData();
      fs.writeFileSync(CASES_JSON, JSON.stringify(clean, null, 2), "utf8");
      console.log(`cases  saved  ${clean.cases.length}`);
      const skipRebuild = new URLSearchParams(url.split("?")[1] || "").get("norebuild") === "1";
      const r = skipRebuild ? { ok: true, msg: "案例已保存" } : await rebuild();
      return send(res, r.ok ? 200 : 500, JSON.stringify(r));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  if (pathname === "/api/catalog" && req.method === "POST") {
    try {
      const raw = await readBody(req, 512 * 1024);
      const clean = sanitizeCatalog(JSON.parse(raw || "{}"));
      ensureData();
      fs.writeFileSync(CATALOG_JSON, JSON.stringify(clean, null, 2), "utf8");
      console.log(`catalog  saved  ${Object.keys(clean.series).length} series`);
      // ?norebuild=1 lets the admin editor save params and cases together,
      // rebuilding once after the second request instead of twice.
      const skipRebuild = new URLSearchParams(url.split("?")[1] || "").get("norebuild") === "1";
      const r = skipRebuild ? { ok: true, msg: "参数已保存" } : await rebuild();
      if (r.ok) return send(res, 200, JSON.stringify(r));
      return send(res, 500, JSON.stringify(r));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  if (url.split("?")[0] === "/api/rebuild" && req.method === "POST") {
    const r = await rebuild();
    return send(res, r.ok ? 200 : 500, JSON.stringify(r));
  }

  if (url.startsWith("/api/lead") && req.method === "POST") {
    try {
      const raw = await readBody(req);
      const input = JSON.parse(raw || "{}");
      if (!clip(input.name) && !clip(input.phone)) return send(res, 400, JSON.stringify({ ok: false, error: "name or phone required" }));
      const row = { ts: new Date().toISOString() };
      ["name", "company", "phone", "country", "model", "qty", "temp", "delivery", "msg", "page", "lang", "source", "medium", "campaign", "term", "content", "gclid", "fbclid", "ttclid"].forEach((k) => { row[k] = clip(input[k], k === "msg" ? 2000 : 200); });
      row.ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
      ensureData();
      fs.appendFileSync(LEADS, JSON.stringify(row) + "\n", "utf8");
      fs.writeFileSync(CSV, toCsv(readLeads()), "utf8");
      console.log(`lead  ${row.ts}  ${row.name || "-"}  ${row.country || "-"}  ${row.model || "-"}`);
      // 通知：方糖(免费版 5 条/天) + 可选备用通道；每次结果落盘可查，失败绝不静默
      try {
        const title = "新询盘 · agengda工业冷水机";
        const desp = [
          row.ts && ("提交时间: " + row.ts),
          row.page && ("来源页: " + row.page + " (" + (row.lang || "") + ")"),
          row.name && ("姓名: " + row.name),
          row.company && ("公司: " + row.company),
          row.country && ("国家: " + row.country),
          row.phone && ("电话: " + row.phone),
          row.model && ("机型: " + row.model),
          row.qty && ("数量: " + row.qty),
          row.temp && ("温度: " + row.temp),
          row.delivery && ("交期: " + row.delivery),
          (row.source || row.medium || row.campaign) && ("来源: " + [row.source, row.medium, row.campaign].filter(Boolean).join(" / ")),
          row.msg && ("留言: " + row.msg)
        ].filter(Boolean).join("\n");
        notifySend(title, desp, row).catch(function (e) { console.warn("[lead notify] error:", e.message); });
      } catch (e) { console.warn("[lead notify] error:", e.message); }
      // 云端持久化：把本条询盘写入 WorkBuddy 云库（重部署/磁盘重置都不丢）。
      // 切勿加 .select() / Prefer:return=representation —— 匿名角色无 SELECT 权限，回读会让整条插入失败。
      try {
        const cloudRow = {};
        ["name", "company", "phone", "country", "model", "qty", "temp", "delivery", "msg", "page", "lang", "source", "medium", "campaign", "term", "content", "gclid", "fbclid", "ttclid"].forEach((k) => { if (row[k] != null && row[k] !== "") cloudRow[k] = row[k]; });
        if (row.ip) cloudRow.ip = row.ip;
        const payload = JSON.stringify(cloudRow);
        const creq = https.request(CLOUD_LEADS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "x-wb-webapp-access-key": CLOUD_KEY,
            "Prefer": "return=minimal"
          }
        }, (cr) => { cr.resume(); console.log("[cloud sync] " + cr.statusCode); });
        creq.on("error", (e) => console.warn("[cloud sync] failed:", e.message));
        creq.write(payload); creq.end();
      } catch (e) { console.warn("[cloud sync] error:", e.message); }
      return send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  }

  if (url.startsWith("/api/leads.csv")) {
    if (!AUTH_ON) return send(res, 503, "导出未启用：服务器未配置 LEAD_TOKEN", "text/plain; charset=utf-8");
    const q = new URLSearchParams(url.split("?")[1] || "");
    if (!authed(req, q)) return send(res, 401, "Unauthorized", "text/plain; charset=utf-8");
    return send(res, 200, toCsv(readLeads()), "text/csv; charset=utf-8");
  }

  if (url.startsWith("/api/leads.json")) {
    if (!AUTH_ON) return send(res, 503, "导出未启用：服务器未配置 LEAD_TOKEN", "text/plain; charset=utf-8");
    const q = new URLSearchParams(url.split("?")[1] || "");
    if (!authed(req, q)) return send(res, 401, "Unauthorized", "text/plain; charset=utf-8");
    return send(res, 200, JSON.stringify(readLeads()), "application/json; charset=utf-8");
  }

  // ---- 隐私政策页（Meta 即时表单必填链接：墨西哥用 Aviso de Privacidad）----
  if (LEGAL_ES_PATHS.indexOf(pathname) !== -1) return send(res, 200, LEGAL_ES_HTML, "text/html; charset=utf-8");
  if (LEGAL_EN_PATHS.indexOf(pathname) !== -1) return send(res, 200, LEGAL_EN_HTML, "text/html; charset=utf-8");

  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed", "text/plain; charset=utf-8");
  return serveStatic(req, res, url);
});

// ============================================================
// 隐私政策页（Meta 即时表单的 Privacy policy 链接必须真实可打开）
// 全部内容基于站点已公开的真实信息：公司名 / 地址 / 邮箱 / 电话
// ============================================================
const LEGAL_ES_PATHS = ["/es/aviso-de-privacidad.html", "/aviso-de-privacidad.html", "/es/aviso-de-privacidad"];
const LEGAL_EN_PATHS = ["/privacy.html", "/en/privacy.html", "/privacy"];

const LEGAL_CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:#f6f8fb;color:#1a1a1a;line-height:1.75;
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}
  .wrap{max-width:820px;margin:0 auto;padding:28px 18px 64px}
  .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
  .top a{color:#0D47A1;text-decoration:none;font-weight:700;font-size:15px}
  .top .home{font-weight:400;font-size:13px;color:#5a6b85}
  .card{background:#fff;border-radius:14px;padding:36px 34px;box-shadow:0 2px 20px rgba(13,71,161,.07)}
  h1{color:#0D47A1;font-size:25px;line-height:1.3;margin:0 0 6px}
  h2{color:#0D47A1;font-size:16px;margin:26px 0 8px}
  .meta{color:#667;font-size:13px;margin:0 0 22px}
  .box{background:#f0f5ff;border-left:4px solid #0D47A1;border-radius:6px;padding:13px 16px;font-size:14px;margin:18px 0}
  ul{padding-left:20px;margin:8px 0}
  li{margin:5px 0}
  a{color:#0D47A1}
  .foot{margin-top:30px;padding-top:16px;border-top:1px solid #e6ecf5;font-size:13px;color:#667}
  @media(max-width:520px){.card{padding:24px 18px}h1{font-size:21px}}
`;

const LEGAL_ES_HTML = `<!doctype html><html lang="es-MX"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aviso de Privacidad | Agengda</title>
<meta name="description" content="Aviso de Privacidad de Agengda: qué datos personales recabamos, con qué finalidad los usamos, cómo ejercer tus derechos ARCO y cómo contactarnos.">
<link rel="canonical" href="https://agengda-industrial-chiller.com/es/aviso-de-privacidad.html">
<style>${LEGAL_CSS}</style></head><body>
<div class="wrap">
  <div class="top"><a href="/es/">Agengda</a><a class="home" href="/es/">← Volver al inicio</a></div>
  <div class="card">
    <h1>Aviso de Privacidad</h1>
    <p class="meta">Última actualización: 31 de octubre de 2026</p>

    <div class="box">Al enviar cualquiera de nuestros formularios (incluidos los formularios instantáneos de Facebook e Instagram), usted acepta el presente Aviso de Privacidad.</div>

    <h2>1. Responsable de los datos personales</h2>
    <p><strong>Agengda</strong> (en adelante, "Agengda"), fabricante de enfriadores industriales, con domicilio en No. 88, Manao Third Road, Changfu Industrial Park, Caidian District, Wuhan City, Hubei Province, China.</p>
    <p>Correo de contacto: <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a> · Teléfono / WhatsApp: <a href="https://wa.me/8615888503789">+86 158 8850 3789</a></p>

    <h2>2. Datos personales que recabamos</h2>
    <p>A través de nuestros formularios, de nuestro sitio web, de WhatsApp o de correo electrónico podemos recabar los siguientes datos:</p>
    <ul>
      <li>Nombre completo y cargo</li>
      <li>Nombre de la empresa</li>
      <li>Ciudad y estado</li>
      <li>Número de WhatsApp o teléfono y correo electrónico</li>
      <li>Información sobre su proceso productivo, equipo actual, capacidad requerida o volumen de compra</li>
    </ul>
    <p>No recabamos datos personales sensibles.</p>

    <h2>3. Finalidades primarias (necesarias)</h2>
    <p>Sus datos se utilizan para las siguientes finalidades que dan origen a la relación comercial:</p>
    <ul>
      <li>Elaborar y enviarle cotizaciones</li>
      <li>Enviarle fichas técnicas y documentación de producto</li>
      <li>Dar seguimiento comercial a su solicitud</li>
      <li>Coordinar logística, garantía y servicio posventa</li>
    </ul>

    <h2>4. Finalidades secundarias (opcionales)</h2>
    <p>Podemos utilizar sus datos para enviarle información sobre nuevos productos, promociones o encuestas de satisfacción. Si no desea que sus datos se utilicen para estos fines, escríbanos a <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a> indicándolo. Su negativa no afectará la atención de su solicitud.</p>

    <h2>5. Transferencias de datos</h2>
    <p>No transferimos sus datos personales a terceros sin su consentimiento, salvo las excepciones previstas por la ley (por ejemplo, requerimientos de autoridad competente) o cuando sea indispensable para completar el envío, la logística o el cobro de su pedido, limitándonos a los datos necesarios para ello.</p>

    <h2>6. Derechos ARCO y revocación del consentimiento</h2>
    <p>Usted tiene derecho a <strong>Acceder</strong> a sus datos, <strong>Rectificarlos</strong>, <strong>Cancelarlos</strong> u <strong>Oponerse</strong> a su tratamiento (derechos ARCO), así como a revocar el consentimiento que nos otorgó.</p>
    <p>Para ejercerlos, envíe un correo a <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a> con: nombre completo, el derecho que desea ejercer y un medio para contactarle. Responderemos en un plazo máximo de 20 días hábiles.</p>

    <h2>7. Conservación y seguridad de los datos</h2>
    <p>Conservamos sus datos mientras exista una relación comercial o hasta que solicite su eliminación. Aplicamos medidas administrativas y técnicas razonables para protegerlos contra acceso no autorizado, pérdida o alteración.</p>

    <h2>8. Datos recabados mediante plataformas de Meta</h2>
    <p>Cuando usted envía un formulario instantáneo en Facebook o Instagram, los datos son recabados por Agengda y no por Meta. Meta Platforms, Inc. trata la información conforme a sus propias políticas de privacidad, las cuales no controlamos.</p>

    <h2>9. Cambios a este aviso</h2>
    <p>Cualquier modificación a este Aviso de Privacidad se publicará en esta misma página, indicando la fecha de actualización. Le recomendamos revisarla periódicamente.</p>

    <h2>10. Contacto</h2>
    <p>Para cualquier duda sobre este aviso o sobre el tratamiento de sus datos:</p>
    <ul>
      <li>Correo: <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a></li>
      <li>WhatsApp / Teléfono: <a href="https://wa.me/8615888503789">+86 158 8850 3789</a></li>
      <li>Domicilio: No. 88, Manao Third Road, Changfu Industrial Park, Caidian District, Wuhan City, Hubei Province, China</li>
    </ul>
    <div class="foot">Agengda · Fabricante de enfriadores industriales · <a href="/es/">agengda-industrial-chiller.com</a></div>
  </div>
</div></body></html>`;

const LEGAL_EN_HTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy | Agengda</title>
<meta name="description" content="Agengda Privacy Policy: what personal data we collect, why we use it, and how to exercise your rights.">
<link rel="canonical" href="https://agengda-industrial-chiller.com/privacy.html">
<style>${LEGAL_CSS}</style></head><body>
<div class="wrap">
  <div class="top"><a href="/">Agengda</a><a class="home" href="/">← Back to home</a></div>
  <div class="card">
    <h1>Privacy Policy</h1>
    <p class="meta">Last updated: October 31, 2026</p>

    <div class="box">By submitting any of our forms (including Facebook and Instagram instant forms) you agree to this Privacy Policy.</div>

    <h2>1. Data controller</h2>
    <p><strong>Agengda</strong>, manufacturer of industrial chillers, No. 88, Manao Third Road, Changfu Industrial Park, Caidian District, Wuhan City, Hubei Province, China.</p>
    <p>Contact: <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a> · Phone / WhatsApp: <a href="https://wa.me/8615888503789">+86 158 8850 3789</a></p>

    <h2>2. Data we collect</h2>
    <ul>
      <li>Full name and job title</li>
      <li>Company name</li>
      <li>City and state</li>
      <li>WhatsApp / phone number and email address</li>
      <li>Information about your production process, current equipment, required capacity or purchase volume</li>
    </ul>
    <p>We do not collect sensitive personal data.</p>

    <h2>3. Primary purposes</h2>
    <ul>
      <li>Preparing and sending quotations</li>
      <li>Sending technical datasheets and product documentation</li>
      <li>Following up on your enquiry</li>
      <li>Coordinating logistics, warranty and after-sales service</li>
    </ul>

    <h2>4. Secondary purposes (optional)</h2>
    <p>We may use your data to send information about new products, promotions or satisfaction surveys. To opt out, email <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a>. Your refusal will not affect the handling of your enquiry.</p>

    <h2>5. Transfers</h2>
    <p>We do not transfer your personal data to third parties without your consent, except where required by law or where strictly necessary to complete shipping, logistics or payment of your order.</p>

    <h2>6. Your rights</h2>
    <p>You have the right to access, rectify, cancel or object to the processing of your data, and to withdraw your consent at any time. Email <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a> with your full name, the right you wish to exercise and a way to contact you. We will respond within 20 business days.</p>

    <h2>7. Retention and security</h2>
    <p>We retain your data for as long as a commercial relationship exists or until you request deletion. We apply reasonable administrative and technical safeguards against unauthorised access, loss or alteration.</p>

    <h2>8. Data collected through Meta platforms</h2>
    <p>When you submit an instant form on Facebook or Instagram, the data is collected by Agengda, not by Meta. Meta Platforms, Inc. processes information under its own privacy policies, which we do not control.</p>

    <h2>9. Changes</h2>
    <p>Any change to this Privacy Policy will be published on this page with an updated date.</p>

    <h2>10. Contact</h2>
    <ul>
      <li>Email: <a href="mailto:agengda2021@gmail.com">agengda2021@gmail.com</a></li>
      <li>WhatsApp / Phone: <a href="https://wa.me/8615888503789">+86 158 8850 3789</a></li>
      <li>Address: No. 88, Manao Third Road, Changfu Industrial Park, Caidian District, Wuhan City, Hubei Province, China</li>
    </ul>
    <div class="foot">Agengda · Industrial chiller manufacturer · <a href="/">agengda-industrial-chiller.com</a></div>
  </div>
</div></body></html>`;

ensureData();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`sites+leads  http://localhost:${PORT}`);
  console.log(`leads file   ${LEADS}`);
  console.log(`csv export   http://localhost:${PORT}/api/leads.csv?token=${TOKEN}`);
  // Listen first, then (re)build the static pages if the sandbox shipped without dist/.
  ensureDist();
});


// ===== Inquiry notification helpers (2026-11-28) =====
// 方糖免费版每天仅 5 条：所有发送结果落盘，失败不再静默；可配置不限量备用通道。
const NOTIFY_LOG = require("path").join(__dirname, "data", "notify-log.jsonl");
const WECOM_HOOK = process.env.WECOM_WEBHOOK || "";
function notifyWrite(rec) {
  try {
    fs.appendFileSync(NOTIFY_LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, rec)) + "\n", "utf8");
  } catch (e) { console.warn("[notify log] failed:", e.message); }
}
function notifyRows() {
  try {
    const txt = fs.existsSync(NOTIFY_LOG) ? fs.readFileSync(NOTIFY_LOG, "utf8") : "";
    return txt.trim().split("\n").filter(Boolean).map(function (l) {
      try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
  } catch (e) { return []; }
}
function notifySummary(withLog) {
  const rows = notifyRows();
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const t = rows.filter(function (r) {
    return new Date(new Date(r.ts || 0).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10) === today;
  });
  const out = {
    channel: "serverjiang",
    today: {
      attempts: t.length,
      ok: t.filter(function (r) { return r.status === "ok"; }).length,
      failed: t.filter(function (r) { return r.status === "failed"; }).length,
      merged: t.filter(function (r) { return r.status === "merged"; }).length
    },
    last: rows[rows.length - 1] || null,
    backup: { pushplus: !!process.env.PUSHPLUS_TOKEN, wecom: !!WECOM_HOOK }
  };
  if (withLog) out.recent = rows.slice(-20);
  return out;
}
function notifyHttp(fullUrl, method, headers, body) {
  return new Promise(function (resolve) {
    try {
      const u = new URL(fullUrl);
      const lib = u.protocol === "http:" ? require("http") : https;
      const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: u.pathname + u.search,
        method: method || "GET",
        headers: headers || {},
        timeout: 10000
      };
      const r = lib.request(opts, function (res) {
        let buf = ""; res.setEncoding("utf8");
        res.on("data", function (c) { if (buf.length < 2000) buf += c; });
        res.on("end", function () { resolve({ http: res.statusCode, body: buf }); });
      });
      r.setTimeout(10000, function () { r.destroy(); resolve({ http: 0, body: "timeout(10s)" }); });
      r.on("error", function (e) { resolve({ http: 0, body: e.message }); });
      if (body) r.write(body);
      r.end();
    } catch (e) { resolve({ http: 0, body: e.message }); }
  });
}
async function notifySend(title, desp, row, selfcheck) {
  const results = [];
  const phone = row && row.phone ? row.phone : "";
  const sKey = process.env.SERVERJIANG || "SCT449072TH4I7bOrX48bA7WeEDWGIe5uK";
  // 同一号码 5 分钟内重复提交：主通道合并，避免测试/误触吃掉每日额度（询盘数据仍完整落库）
  let merged = false;
  if (!selfcheck && phone) {
    const cutoff = Date.now() - 300000;
    merged = notifyRows().some(function (r) {
      return r.status === "ok" && r.channel === "serverjiang" && r.phone === phone && Date.parse(r.ts) > cutoff;
    });
  }
  if (sKey && !merged) {
    const q = "https://sctapi.ftqq.com/" + encodeURIComponent(sKey) + ".send?title=" + encodeURIComponent(title) + "&desp=" + encodeURIComponent(desp);
    const r = await notifyHttp(q, "GET", {}, null);
    let code = -1, msg = r.body.slice(0, 160);
    try { const j = JSON.parse(r.body); code = j.code; msg = j.message || j.info || msg; } catch (e) {}
    const ok = r.http === 200 && code === 0;
    notifyWrite({ channel: "serverjiang", status: ok ? "ok" : "failed", http: r.http, code: code, message: String(msg).slice(0, 160), phone: phone, title: title });
    results.push({ channel: "serverjiang", ok: ok, http: r.http, code: code, message: String(msg).slice(0, 160) });
  } else if (merged) {
    notifyWrite({ channel: "serverjiang", status: "merged", phone: phone, message: "duplicate within 5min, primary channel skipped" });
    results.push({ channel: "serverjiang", ok: false, merged: true });
  }
  // 备用通道：配置环境变量后生效，不受 5 条/天限制
  if (process.env.PUSHPLUS_TOKEN) {
    const b = JSON.stringify({ token: process.env.PUSHPLUS_TOKEN, title: title, content: desp, template: "txt" });
    const r = await notifyHttp("https://www.pushplus.plus/send", "POST",
      { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) }, b);
    const ok = r.http === 200 && /"code":200/.test(r.body);
    notifyWrite({ channel: "pushplus", status: ok ? "ok" : "failed", http: r.http, message: r.body.slice(0, 160), phone: phone });
    results.push({ channel: "pushplus", ok: ok, http: r.http, message: r.body.slice(0, 160) });
  }
  if (WECOM_HOOK) {
    // 企业微信 text.content 上限 2048 字节(UTF-8)，中文约 3 字节/字；超长会整条失败，先按字节截断
    let content = title + "\n" + desp;
    while (Buffer.byteLength(content, "utf8") > 1900) content = content.slice(0, -20);
    const b = JSON.stringify({ msgtype: "text", text: { content: content } });
    const r = await notifyHttp(WECOM_HOOK, "POST",
      { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) }, b);
    const ok = r.http === 200 && /"errcode":0/.test(r.body);
    notifyWrite({ channel: "wecom", status: ok ? "ok" : "failed", http: r.http, message: r.body.slice(0, 160), phone: phone });
    results.push({ channel: "wecom", ok: ok, http: r.http, message: r.body.slice(0, 160) });
  }
  return results;
}
