// Build script: generates a static multilingual factory-export website.
// Run: node build.js  ->  outputs to dist/

const fs = require("fs");
const path = require("path");
const { LANGS, DEFAULT_LANG, T } = require("./src/i18n.js");
const SEOT = require("./src/seo.js");
const { APPS, APP_UI, APP_T } = require("./src/apps.js");
const { SERIES_KEYS, DEEP } = require("./src/data/deep.js");
const { SERIES, SPEC_FIELDS, RULES, CORRECTIONS, WATER_TEMP, MARGIN } = require("./src/data/catalog.js");
const { FORM_L } = require("./src/data/form.js");
const { FAQ } = require("./src/faq.js");

// Cache-busting version for the stylesheet: changes whenever style.css changes,
// so the browser always fetches the latest CSS instead of a stale 1-day cache.
const crypto = require("crypto");
// Deploy note: the publish sandbox excludes *.css files, so the CSS source that
// actually gets uploaded is src/style.js. Locally we keep editing the familiar
// src/style.css and re-derive style.js on every build; in the sandbox style.css
// is absent, so the committed style.js is used as-is.
const STYLE_CSS_PATH = path.join(__dirname, "src", "style.css");
const STYLE_JS_PATH = path.join(__dirname, "src", "style.js");
if (fs.existsSync(STYLE_CSS_PATH)) {
  try {
    const raw = fs.readFileSync(STYLE_CSS_PATH, "utf8");
    const safe = raw.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    fs.writeFileSync(STYLE_JS_PATH, "/* Auto-generated from style.css — edit style.css instead */\nmodule.exports = `" + safe + "`;\n");
  } catch (e) { /* keep existing style.js */ }
}
const SITE_CSS = (() => { try { return require("./src/style.js"); } catch (e) { return ""; } })();
const ASSET_V = (() => {
  try {
    return crypto.createHash("md5").update(SITE_CSS).digest("hex").slice(0, 8);
  } catch (e) { return "1"; }
})();

// ---------- Editable spec overrides ----------
// Values saved from the browser editor (/admin) are stored in data/catalog.json
// so the person filling in the datasheet never has to touch source code.
// This file wins over src/data/catalog.js when it exists.
const OVERRIDE_FILE = path.join(__dirname, "data", "catalog.json");
(function applyOverrides() {
  if (!fs.existsSync(OVERRIDE_FILE)) return;
  try {
    const o = JSON.parse(fs.readFileSync(OVERRIDE_FILE, "utf8"));
    SERIES.forEach((s) => {
      const ov = (o.series || {})[s.key];
      if (!ov) return;
      if (Array.isArray(ov.models) && ov.models.length) s.models = ov.models.map(String);
      s.spec = ov.spec && typeof ov.spec === "object" ? ov.spec : {};
    });
    if (o.rules) Object.keys(RULES).forEach((k) => { if (o.rules[k]) Object.assign(RULES[k], o.rules[k]); });
    if (Array.isArray(o.corrections)) {
      o.corrections.forEach((c) => {
        const hit = CORRECTIONS.find((x) => x.key === c.key);
        if (hit && c.factor !== undefined && c.factor !== "" && !isNaN(Number(c.factor))) {
          hit.factor = Number(c.factor);
        }
      });
    }
  } catch (e) {
    console.warn("data/catalog.json ignored:", e.message);
  }
})();

// ---------- Editable case overrides ----------
// Customer cases saved from the browser editor (/admin) live in
// data/cases.json. Text is authored in zh + en in the editor; any other
// language falls back to en until translated. Titles are assembled from the
// country flag + localized industry name + model + qty.
const CASES_FILE = path.join(__dirname, "data", "cases.json");
const CASE_FLAGS = {
  MX: "🇲🇽", BR: "🇧🇷", US: "🇺🇸", ME: "🕌", VN: "🇻🇳", ID: "🇮🇩",
  RU: "🇷🇺", TH: "🇹🇭", FR: "🇫🇷", GB: "🇬🇧", OTHER: "🌎",
};
let CASES = [];
try {
  if (fs.existsSync(CASES_FILE)) {
    const o = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
    if (Array.isArray(o.cases)) CASES = o.cases.slice(0, 5);
  }
} catch (e) {
  console.warn("data/cases.json ignored:", e.message);
}

(function applyCaseOverrides() {
  if (!CASES.length) return;
  LANGS.forEach((l) => {
    const d = DEEP[l.code] || DEEP.en;
    const appT = APP_T[l.code] || APP_T.en;
    d.cases = CASES.map((c) => {
      const txt = (c.i18n && (c.i18n[l.code] || c.i18n.en || c.i18n.zh)) || {};
      const ind = appT[c.industry] ? appT[c.industry].name : "";
      const flag = CASE_FLAGS[c.country] || "";
      return {
        t: [flag, ind, c.model, c.qty ? "× " + c.qty : ""].filter(Boolean).join(" · "),
        problem: txt.problem || "",
        solution: txt.solution || "",
        result: txt.result || "",
      };
    }).filter((c) => c.t);
  });
})();

// ---------- Editable factory profile ----------
// Texts and key figures saved from /admin live in data/factory.json.
// Empty values fall back to the copy in src/i18n.js; the facts strip only
// renders rows that actually have a value (never invent numbers).
const FACTORY_FILE = path.join(__dirname, "data", "factory.json");
const FACT_KEYS = ["founded", "area", "staff", "capacity", "markets"];
const FACT_LABEL = {
  founded: { zh: "成立年份", en: "Founded" },
  area: { zh: "厂房面积", en: "Factory area" },
  staff: { zh: "员工人数", en: "Employees" },
  capacity: { zh: "月产能（台）", en: "Units per month" },
  markets: { zh: "出口国家", en: "Export markets" },
};
let FACTORY = null;
try {
  if (fs.existsSync(FACTORY_FILE)) FACTORY = JSON.parse(fs.readFileSync(FACTORY_FILE, "utf8"));
} catch (e) {
  console.warn("data/factory.json ignored:", e.message);
}

(function applyFactoryOverrides() {
  if (!FACTORY || !FACTORY.i18n) return;
  const KEYS = ["intro", "a1_t", "a1_d", "a2_t", "a2_d", "a3_t", "a3_d", "a4_t", "a4_d", "cta"];
  LANGS.forEach((l) => {
    const src = FACTORY.i18n[l.code] || FACTORY.i18n.en;
    if (!src) return;
    const t = T[l.code];
    if (!t) return;
    KEYS.forEach((k) => {
      const v = String(src[k] || "").trim();
      if (v) t["f_" + k] = v;
    });
  });
})();

function factoryFacts(lang) {
  if (!FACTORY || !FACTORY.facts) return [];
  return FACT_KEYS.map((k) => ({
    key: k,
    label: lang === "zh" ? FACT_LABEL[k].zh : FACT_LABEL[k].en,
    value: String(FACTORY.facts[k] || "").trim(),
  })).filter((f) => f.value);
}

// ---------- Site config (edit here) ----------
const BRAND = process.env.SITE_BRAND || "Agengda";                    // replace with your real brand name
const WHATSAPP = process.env.WHATSAPP || "8615888503789";            // wa.me number, no "+" (e.g. 8615888503789)
const FACEBOOK = process.env.FACEBOOK || "https://www.facebook.com/profile.php?id=100086934803896"; // public page / profile
const MESSENGER = process.env.MESSENGER || "https://m.me/100086934803896"; // same identity as Facebook
const INSTAGRAM = process.env.INSTAGRAM || "https://www.instagram.com/agengda2021"; // your IG url; leave "" to hide
// ---- Company identity (appears in footer, contact page and Organization schema) ----
const COMPANY_NAME = process.env.COMPANY_NAME || "Agengda";
const ADDRESS = "No. 88, Manao Third Road, Changfu Industrial Park, Caidian District, Wuhan City, Hubei Province, China";
const EMAILS = ["agengda2021@gmail.com", "15888503789@163.com"];
const TEL_DISPLAY = "+86 158 8850 3789";
const GA_ID = process.env.GA_ID || "YOUR-GA-ID";                  // GA4 measurement id (G-XXXXXXX). Events fire once set.
const FB_PIXEL = process.env.FB_PIXEL || "1113369994432978";      // Meta Pixel ID (Events Manager). Leave "" to disable.
const SERVERJIANG = process.env.SERVERJIANG || "SCT449072TH4I7bOrX48bA7WeEDWGIe5uK"; // 方糖(Server酱) SendKey: 新询盘推送到微信. Leave "" to disable.
const SITE_URL = process.env.SITE_URL || "https://agengda-industrial-chiller.com";  // canonical + sitemap base
const LEAD_API = "/api/lead";                // lead endpoint served by server.js
// Social-share preview (Open Graph / Twitter Card). A wide workshop photo reads
// well when the link is shared on WhatsApp / Facebook / LinkedIn. Override via
// env OG_IMAGE if you later produce a branded 1200x630 card.
const OG_IMAGE = process.env.OG_IMAGE || `${SITE_URL}/assets/img/workshop.jpg`;
// Map language code -> BCP47 locale for og:locale (helps FB/WhatsApp pick language).
const OG_LOCALE = {
  es: "es_MX", pt: "pt_BR", en: "en_US", zh: "zh_CN", de: "de_DE", fr: "fr_FR",
  tr: "tr_TR", ru: "ru_RU", ar: "ar_AR", id: "id_ID", vi: "vi_VN", th: "th_TH",
};
// --------------------------------------------

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const IMG_SRC = path.join(ROOT, "assets", "img");
const IMG_DIST = path.join(DIST, "assets", "img");
const hasImg = (name) => name && (fs.existsSync(path.join(IMG_SRC, name)) || fs.existsSync(path.join(IMG_DIST, name)));

const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
const abs = (code, file) => `${SITE_URL}/${code}/${file}`;

const FIELD_LABEL = {
  capacity: "spec_cap", kcal: "spec_kcal", compressor: "spec_cmp", pump: "spec_pump",
  power: "spec_pow", flow: "spec_flow",
  voltage: "spec_vol", refrigerant: "spec_ref", dim: "spec_dim", weight: "spec_wt",
};

// ---------- Page inventory ----------
const PAGES = [
  { file: "index.html", kind: "home" },
  { file: "products.html", kind: "products" },
  ...SERIES.map((s) => ({ file: `${s.slug}.html`, kind: "series", series: s })),
  ...APPS.map((a) => ({ file: `${a.slug}.html`, kind: "app", app: a })),
  { file: "cases.html", kind: "cases" },
  { file: "calculator.html", kind: "calc" },
  { file: "factory.html", kind: "factory" },
  { file: "contact.html", kind: "contact" },
  { file: "distributors.html", kind: "dist" },
  { file: "lp.html", kind: "lp" },
];

// ---------- Shared chrome ----------
function langMenu(current, file) {
  const cur = LANGS.find((x) => x.code === current || (x.htmlLang || x.code) === current) || { code: current, name: current.toUpperCase() };
  const items = LANGS.map((l) => {
    const active = l.code === cur.code ? ' style="font-weight:700;background:var(--c-bg-3)"' : "";
    return `<a href="../${l.code}/${file}"${active}><span class="lang-flag">${l.flag}</span>${l.name}</a>`;
  }).join("\n");
  return `
  <div class="lang-select">
    <button onclick="document.getElementById('lm-${current}-${file.replace(/\W/g, "")}').classList.toggle('open')" aria-label="language">🌐 <span>${cur.name.split("(")[0].trim()}</span> ▾</button>
    <div class="lang-menu" id="lm-${current}-${file.replace(/\W/g, "")}">${items}</div>
  </div>`;
}

function header(t, lang, file, ui, d) {
  return `<header class="site-header">
  <div class="container nav">
    <a class="brand" href="./index.html"><span class="logo">C</span>${BRAND}</a>
    <nav class="nav-links">
      <a href="./products.html">${t.nav_products}</a>
      <a href="./products.html#apps">${ui.nav}</a>
      <a href="./cases.html">${d.ui.nav_cases}</a>
      <a href="./calculator.html">${d.ui.nav_calc}</a>
      <a href="./factory.html">${t.nav_factory}</a>
      <a href="./distributors.html">${(SEOT[lang] || SEOT.en).nav_d}</a>
      <a href="./contact.html">${t.nav_contact}</a>
    </nav>
    <div class="nav-right">
      ${langMenu(lang, file)}
      <a class="btn btn-primary" href="./contact.html">${t.cta_whatsapp}</a>
    </div>
    <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false" onclick="var n=this.parentNode.querySelector('.nav-links');var o=n.classList.toggle('open');this.setAttribute('aria-expanded',o?'true':'false');document.body.classList.toggle('nav-open',o);">☰</button>
  </div>
</header>`;
}

function bareHeader(t, lang, file) {
  return `<header class="site-header">
  <div class="container nav">
    <a class="brand" href="./index.html"><span class="logo">C</span>${BRAND}</a>
    <div class="nav-right">${langMenu(lang, file)}</div>
  </div>
</header>`;
}

function footer(t) {
  return `<footer class="site-footer">
  <div class="container">
    <div class="copy">${t.footer_copy}</div>
    <div class="tag">${t.footer_made}</div>
  </div>
  <div class="container" style="padding-top:14px;color:var(--c-muted);font-size:13px;line-height:1.7;text-align:center">
    <div><strong>${COMPANY_NAME}</strong></div>
    <div>📍 ${ADDRESS}</div>
    <div>📧 ${EMAILS.map((e) => `<a href="mailto:${e}">${e}</a>`).join(" · ")}</div>
    <div>📱 <a href="https://wa.me/${WHATSAPP}">${TEL_DISPLAY}</a>${INSTAGRAM ? ` · 📸 <a href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram @agengda2021</a>` : ""}</div>
  </div>
  ${socialRow()}
</footer>`;
}

function waFloat(t) {
  return `<a class="wa-float" href="${waLink(t.wa_msg)}" target="_blank" rel="noopener" title="${t.cta_whatsapp}" onclick="track('wa_click',{placement:'float'});waLead('float')">💬</a>`;
}

// Social row shown in the footer on every page. Links live in the config block
// above (WHATSAPP / FACEBOOK / MESSENGER / INSTAGRAM) so they survive rebuilds.
function socialRow() {
  const items = [
    { href: `https://wa.me/${WHATSAPP}`, icon: "💬", label: "WhatsApp", channel: "whatsapp" },
    { href: FACEBOOK, icon: "📘", label: "Facebook", channel: "facebook" },
    { href: MESSENGER, icon: "📨", label: "Messenger", channel: "messenger" },
  ];
  if (INSTAGRAM) items.push({ href: INSTAGRAM, icon: "📸", label: "Instagram", channel: "instagram" });
  return `<div class="container" style="justify-content:center;gap:22px;flex-wrap:wrap;padding-top:16px;margin-top:6px;border-top:1px solid rgba(255,255,255,.14)">` +
    items.map((i) => `<a href="${i.href}" target="_blank" rel="noopener" style="text-decoration:none" onclick="track('contact_click',{channel:'${i.channel}'})">${i.icon} ${i.label}</a>`).join("") +
    `</div>`;
}

function analytics() {
  const on = GA_ID && GA_ID.indexOf("YOUR") !== 0;
  const px = FB_PIXEL && /^\d{6,20}$/.test(FB_PIXEL);
  return `${px ? `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${FB_PIXEL}');fbq('track','PageView');
</script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL}&ev=PageView&noscript=1" /></noscript>` : ""}<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
function track(ev,params){var a=window.__attribLast||{};var m=Object.assign({source:a.source||'',medium:a.medium||'',campaign:a.campaign||''},params||{});
try{window.dataLayer.push(Object.assign({event:ev},m));}catch(e){}
try{if(typeof fbq==='function'){var FB={lead_submit:'Lead',wa_click:'Lead',calculator_wa:'Contact',contact_click:'Contact'};
if(FB[ev]){var up={content_name:(a.content||'')||ev};if(m.model)up.content_category=m.model;if(m.value)up.value=m.value;
fbq('track',FB[ev],up,{eventID:ev+'_'+Date.now()});}else{fbq('trackCustom',ev,{source:m.source,campaign:m.campaign});}}}catch(e){}}
window.waLead=function(placement){try{var a=window.__attribLast||{};var m={name:'WhatsApp咨询',company:'',country:'',phone:'',model:'',qty:'',temp:'',delivery:'',msg:'WhatsApp 咨询（'+(placement||'')+'，未填表单）',page:location.pathname,lang:document.documentElement.lang,source:a.source||'',medium:a.medium||'',campaign:a.campaign||'',content:a.content||''};if(window.__notifyLead)window.__notifyLead(m);if(window.CloudApp&&window.CloudApp.submitLead)window.CloudApp.submitLead(m).catch(function(e){});}catch(e){}};
window.__notifyLead=function(o){try{var k='${SERVERJIANG}';if(!k)return;o=o||{};var name=o.name||'',company=o.company||'',country=o.country||'',phone=o.phone||'',model=o.model||'',qty=o.qty||'',temp=o.temp||'',delivery=o.delivery||'',msg=o.msg||'',src=[o.source,o.medium,o.campaign].filter(Boolean).join(' / ');var title='新询盘 · agengda工业冷水机';var desp=[name&&('姓名: '+name),company&&('公司: '+company),country&&('国家: '+country),phone&&('电话: '+phone),model&&('机型: '+model),qty&&('数量: '+qty),temp&&('温度: '+temp),delivery&&('交期: '+delivery),src&&('来源: '+src),msg&&('留言: '+msg)].filter(Boolean).join('\n');var u='https://sctapi.ftqq.com/'+encodeURIComponent(k)+'.send?title='+encodeURIComponent(title)+'&desp='+encodeURIComponent(desp);new Image().src=u;}catch(e){}};
${on ? `gtag('js',new Date());gtag('config','${GA_ID}');` : "/* set GA_ID in build.js to enable GA4 */"}
</script>${on ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>` : ""}`;
}

// UTM / ad-click attribution: capture source from URL or platform click IDs,
// persist across page navigation (first + last touch), expose on window.
function attribScript() {
  return `<script>
(function(){
  try{
    var KEY='attrib_v1';
    var p=new URLSearchParams(location.search);
    function g(n){return p.get(n)||'';}
    var src=g('utm_source'),med=g('utm_medium'),cmp=g('utm_campaign'),trm=g('utm_term'),cnt=g('utm_content'),
        gclid=g('gclid'),fbclid=g('fbclid'),ttclid=g('ttclid');
    if(!src&&gclid){src='google';med=med||'cpc';}
    if(!src&&fbclid){src='facebook';med=med||'paid_social';}
    if(!src&&ttclid){src='tiktok';med=med||'paid_social';}
    var cur={source:src,medium:med,campaign:cmp,term:trm,content:cnt,gclid:gclid,fbclid:fbclid,ttclid:ttclid};
    var has=src||med||cmp||gclid||fbclid||ttclid;
    var store={};
    try{store=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
    if(has){ if(!store.first||!store.first.source) store.first=cur; store.last=cur; try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){} }
    window.__attrib=(store.first||cur||{});
    window.__attribLast=(store.last||window.__attrib||{});
    // Meta ads: remember which creative brought the visit so Lead events can be segmented.
    if(cnt){ try{ if(!store.fbContent) store.fbContent=cnt; localStorage.setItem('attrib_content',cnt); localStorage.setItem(KEY,JSON.stringify(store)); }catch(e){} }
    window.getAttrib=function(w){return (w==='last'?window.__attribLast:window.__attrib)||{};};
  }catch(e){window.__attrib={};window.__attribLast={};}
})();
</script>`;
}

function hreflang(file) {
  const alts = LANGS.map((l) => `  <link rel="alternate" hreflang="${l.hreflang || l.code}" href="${abs(l.code, file)}" />`).join("\n");
  return `${alts}\n  <link rel="alternate" hreflang="x-default" href="${abs(DEFAULT_LANG, file)}" />`;
}

function ldScript(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

// ---------- FAQ (product / application pages) ----------
// Returns the localized [question, answer] pairs with {name} filled in.
function faqPairs(lang, name) {
  const pairs = FAQ[lang] || FAQ.en;
  return pairs.map(([q, a]) => [String(q).replace(/\{name\}/g, name), String(a).replace(/\{name\}/g, name)]);
}

// On-page FAQ section. Uses native <details> so the text is in the DOM (required
// for FAQ rich results) and works without JS.
function faqBlock(lang, name) {
  const items = faqPairs(lang, name);
  const head = FAQ_TITLE[lang] || "FAQ";
  const rows = items.map(([q, a]) =>
    `<details class="faq"><summary>${q}</summary><div class="faq-a">${a}</div></details>`).join("\n    ");
  const style = `<style>.faq-section{margin:34px 0}.faq-list{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:10px}.faq{border:1px solid var(--c-border,#e2e8f0);border-radius:12px;background:#fff;overflow:hidden}.faq>summary{cursor:pointer;padding:14px 18px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px}.faq>summary::-webkit-details-marker{display:none}.faq>summary::after{content:"+";font-size:1.2rem;color:var(--c-accent,#16a34a);transition:transform .15s}.faq[open]>summary::after{transform:rotate(45deg)}.faq-a{padding:0 18px 16px;color:#475569;line-height:1.65}</style>`;
  return `${style}<section class="faq-section"><div class="container">
  <div class="section-head"><h2>${head}</h2></div>
  <div class="faq-list">${rows}</div>
</div></section>`;
}

// Localized heading for the FAQ section.
const FAQ_TITLE = {
  es: "Preguntas frecuentes", pt: "Perguntas frequentes", en: "FAQ",
  zh: "常见问题", de: "Häufige Fragen", fr: "FAQ", tr: "Sıkça Sorulan Sorular",
  ru: "Частые вопросы", ar: "الأسئلة الشائعة", id: "Pertanyaan Umum",
  vi: "Câu hỏi thường gặp", th: "คำถามที่พบบ่อย",
};

// FAQPage structured data (must mirror the visible FAQ text exactly).
function faqSchema(lang, name) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs(lang, name).map(([q, a]) => ({
      "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function shell({ title, desc, code, lang, dir, file, body, t, ui, d, ld, bare, robots }) {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${desc}" />
${robots ? `<meta name="robots" content="${robots}" />` : ""}
<link rel="canonical" href="${abs(code, file)}" />
${hreflang(file)}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${BRAND}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${abs(code, file)}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${OG_LOCALE[code] || code}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="stylesheet" href="../assets/css/style.css?v=${ASSET_V}" />
${(ld || []).map(ldScript).join("\n")}
${analytics()}
</head>
<body>
${bare ? bareHeader(t, lang, file) : header(t, lang, file, ui, d)}
<main>
${body}
</main>
${bare ? "" : footer(t)}
${waFloat(t)}
${bare ? "" : `<a href="/admin" id="editFab" class="edit-fab">✏️ 编辑本页内容</a>
<script>if(!/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)){var _f=document.getElementById('editFab');if(_f)_f.remove();}</script>
<script src="/assets/js/inline-ev.js"></script>
<script src="/assets/js/cloud-config.js"></script>
<script src="/assets/js/workbuddy-cloud-sdk.js"></script>
<script src="/assets/js/cloud-client.js"></script>
<script>if(window.CloudApp&&window.CloudApp.hydrateFactory){window.CloudApp.hydrateFactory();}</script>`}
<script>document.addEventListener('click',function(e){if(!e.target.closest('.lang-select')){document.querySelectorAll('.lang-menu.open').forEach(function(m){m.classList.remove('open');});}if(!e.target.closest('.nav-burger')&&!e.target.closest('.nav-links')){document.querySelectorAll('.nav-links.open').forEach(function(n){n.classList.remove('open');});document.body.classList.remove('nav-open');var b=document.querySelector('.nav-burger');if(b)b.setAttribute('aria-expanded','false');}});</script>
${attribScript()}
</body>
</html>`;
}

// ---------- Reusable blocks ----------
function appCard(a, aT) {
  return `<a class="app-card" href="./${a.slug}.html">
      <span class="app-emoji">${a.emoji}</span>
      <span class="app-card-text"><strong>${aT.name}</strong><small>${aT.intro}</small></span>
    </a>`;
}

function seriesCard(s, d, t) {
  const x = d.series[s.key];
  return `<a class="card series-card" href="./${s.slug}.html">
      <h3>${x.name}</h3>
      <p>${x.intro}</p>
      <ul class="feat-list">${x.f.map((f) => `<li>${f}</li>`).join("")}</ul>
      <span class="series-more">${t.nav_products} →</span>
    </a>`;
}

function specTable(s, d) {
  const missing = [];
  const head = `<tr><th>${d.ui.spec_title}</th>${s.models.map((m) => `<th>${m}</th>`).join("")}</tr>`;
  const rows = SPEC_FIELDS.map((f) => {
    const cells = s.models.map((m) => {
      const v = (s.spec[m] || {})[f.key];
      if (v === undefined || v === null || v === "") { missing.push(m); return `<td><span class="pending">${d.ui.spec_pending}</span></td>`; }
      return `<td>${v}${f.unit ? " " + f.unit : ""}</td>`;
    }).join("");
    return `<tr><th>${d.ui[FIELD_LABEL[f.key]]}${f.unit ? ` <span class="unit">${f.unit}</span>` : ""}</th>${cells}</tr>`;
  }).join("");
  return `<div class="spec-wrap">
    <table class="spec-table"><thead>${head}</thead><tbody>${rows}</tbody></table>
  </div>${missing.length ? `<div class="spec-note">⚠️ ${d.ui.spec_banner}</div>` : ""}`;
}

// Four "factory evidence" tiles. Labels are editable (zh/en) via /admin,
// and each tile can take an uploaded photo stored in assets/img.
const EV_DEFAULTS = [
  { key: "workshop", img: "workshop.jpg", icon: "🏭", ui: "ev_workshop" },
  { key: "test", img: "test.jpg", icon: "🔧", ui: "ev_test" },
  { key: "cert", img: "factory-test.jpg", icon: "📊", ui: "ev_cert" },
  { key: "shipping", img: "shipping.jpg", icon: "🚢", ui: "ev_ship" },
];

function evidenceTiles(d, lang) {
  const ov = FACTORY && Array.isArray(FACTORY.evidence) ? FACTORY.evidence : [];
  return EV_DEFAULTS.map((def, i) => {
    const o = ov[i] || {};
    const img = (o.img && String(o.img).trim()) || def.img;
    let label = d.ui[def.ui];
    const zz = String(o.zh || "").trim();
    const ee = String(o.en || "").trim();
    if (lang === "zh" && zz) label = zz;
    else if (lang === "en" && ee) label = ee;
    return { key: def.key, img, icon: def.icon, label };
  });
}

function evidence(d, lang) {
  const tiles = evidenceTiles(d, lang);
  const cells = tiles.map((x) => {
    const base = String(x.img || "").replace(/\.[^.]+$/, "");
    const vmp4 = fs.existsSync(path.join(IMG_SRC, base + ".mp4")) ? base + ".mp4" : null;
    const vwebm = fs.existsSync(path.join(IMG_SRC, base + ".webm")) ? base + ".webm" : null;
    const poster = fs.existsSync(path.join(IMG_SRC, base + ".jpg")) ? base + ".jpg" : null;
    if (vmp4 || vwebm) {
      const srcs = (vmp4 ? `<source src="../assets/img/${vmp4}" type="video/mp4" />` : "")
        + (vwebm ? `<source src="../assets/img/${vwebm}" type="video/webm" />` : "");
      return `<figure class="ev-tile ev-video" data-ev-key="${x.key}"><video controls playsinline loop${poster ? ` poster="../assets/img/${poster}"` : ""} preload="none">${srcs}</video><figcaption>${x.label}</figcaption></figure>`;
    }
    return hasImg(x.img)
      ? `<figure class="ev-tile" data-ev-key="${x.key}"><img src="../assets/img/${x.img}" alt="${x.label}" loading="lazy" /><figcaption>${x.label}</figcaption></figure>`
      : `<figure class="ev-tile ev-icon" data-ev-key="${x.key}"><div class="ev-ic">${x.icon}</div><figcaption>${x.label}</figcaption></figure>`;
  }).join("\n    ");
  // Factory video. By default served from local assets (uploaded via /admin as
  // factory-video.mp4 / .webm). To make the video load fast inside China, set
  // FACTORY_VIDEO_CDN to your China-accessible CDN sources; the block will then
  // use those URLs instead of the local files. Leave empty to keep local mode.
  // Example:
  //   const FACTORY_VIDEO_CDN = [
  //     { src: "https://cdn.example.com/factory-video.webm", type: "video/webm" },
  //     { src: "https://cdn.example.com/factory-video.mp4",  type: "video/mp4" },
  //   ];
  const FACTORY_VIDEO_CDN = [];
  const fvSources = FACTORY_VIDEO_CDN.length
    ? FACTORY_VIDEO_CDN.map(s => `      <source src="${s.src}" type="${s.type}" />`).join("\n")
    : `      <source src="../assets/img/factory-video.webm" type="video/webm" />
      <source src="../assets/img/factory-video.mp4" type="video/mp4" />
      <source src="../assets/img/factory-video-480.mp4" type="video/mp4" />`;
  const videoBlock = `
  <div class="factory-video-wrap" data-factory-video style="margin-top:26px">
    <div class="section-head"><h2>${d.ui.ev_title || "Factory"} · Video</h2></div>
    <video controls preload="none" playsinline poster="../assets/img/factory-video-poster.jpg" style="width:100%;max-width:860px;display:block;margin:0 auto;border-radius:12px;background:#000;aspect-ratio:16/9"
      onerror="var w=this.closest('[data-factory-video]');if(w)w.style.display='none'">
${fvSources}
    </video>
  </div>`;
  return `<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>${d.ui.ev_title}</h2></div>
  <div class="ev-grid">
    ${cells}
  </div>
  ${videoBlock}
</div></section>`;
}

// ---------- Lead form ----------
// Short form (3 fields): WhatsApp number (required) + machine model + message.
// Long BANT forms kill mobile conversion; a short one keeps the lead flowing
// and the WhatsApp conversation collects the rest.
function leadForm(f, t, d, opts) {
  const o = opts || {};
  return `<form id="leadForm" class="lead-form">
  <div class="field"><label>${f.f_phone}</label><input name="phone" inputmode="tel" required /></div>
  <div class="field"><label>${f.f_model}</label><input name="model" /></div>
  <div class="field"><label>${t.c_msg}</label><textarea name="msg" rows="3"></textarea></div>
  <button class="btn btn-primary" type="submit">${t.c_submit}</button>
  <a class="btn btn-outline" style="margin-inline-start:10px" href="${waLink(t.wa_msg)}" target="_blank" rel="noopener" onclick="track('wa_click',{placement:'form'})">${f.f_send_wa}</a>
  <p class="note" id="leadNote">${t.c_note}</p>
  ${o.hidden || ""}
</form>
<script>
(function(){
var fm=document.getElementById('leadForm'), note=document.getElementById('leadNote');
var WA='${waLink("").split("?")[0]}';
fm.addEventListener('submit',function(e){
  e.preventDefault();
  var o={}; new FormData(fm).forEach(function(v,k){o[k]=v;});
  var a=window.__attribLast||{};
  o.name=o.name||''; o.company=o.company||''; o.country=o.country||'';
  o.qty=o.qty||''; o.temp=o.temp||''; o.delivery=o.delivery||'';
  o.source=a.source||''; o.medium=a.medium||''; o.campaign=a.campaign||''; o.term=a.term||''; o.content=a.content||'';
  o.gclid=a.gclid||''; o.fbclid=a.fbclid||''; o.ttclid=a.ttclid||'';
  o.page=location.pathname; o.lang=document.documentElement.lang; o.ts=new Date().toISOString();
  var text=(o.msg||'')+'\\n'+(o.name||'')+(o.company?', '+o.company:'')+(o.country?', '+o.country:'')+(o.model?' | '+o.model:'')+(o.qty?' x'+o.qty:'')+(o.temp?' | '+o.temp:'');
  note.textContent=${JSON.stringify(f.f_sent)};
  var done=false;
  function okLead(){ if(done) return; done=true; track('lead_submit',{source:a.source||'',medium:a.medium||'',campaign:a.campaign||'',content:a.content||'',page:o.page,model:o.model||'',qty:o.qty||''}); try{ if(window.__notifyLead) window.__notifyLead(o); }catch(e){} var waUrl=WA+'?text='+encodeURIComponent(text); note.innerHTML=${JSON.stringify(f.f_reply)}+" <a class='wa-link' href='"+waUrl+"' target='_blank' rel='noopener' onclick='track(\"wa_click\",{placement:\"success\"})'>💬 "+${JSON.stringify(t.cta_whatsapp)}+"</a>"; }
  function errLead(){ note.textContent=${JSON.stringify(f.f_err)}; }
  (function(){
    var payload=o;
    // 必达通道：方糖微信推送（国内服务器，已验证可用），先发，保证询盘不丢。
    // 云端存储改为「尽力而为」：成功则可在云端看列表，失败也不影响用户看到“发送成功”。
    if(window.CloudApp&&window.CloudApp.submitLead){
      window.CloudApp.submitLead(payload).catch(function(e){ console.warn('[lead] cloud save skipped (non-blocking):',e); });
    }
    // 成功：只要方糖已推送（国内必达）即视为成功，立即反馈给用户。
    okLead();
  })();
  window.open(WA+'?text='+encodeURIComponent(text),'_blank');
  return false;
});
})();
</script>`;
}

// ---------- Page bodies ----------
function trustStrip(lang) {
  const s = SEOT[lang] || SEOT.en;
  const cells = s.stats.map(([n, l2]) =>
    `<div style="flex:1 1 160px;min-width:150px;text-align:center;padding:20px 10px;border:1px solid rgba(255,255,255,.3);border-radius:12px;background:rgba(255,255,255,.08)"><b style="display:block;font-size:1.5rem">${n}</b><span style="font-size:.92rem;opacity:.92">${l2}</span></div>`).join("");
  return `<section><div class="container">
  <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center">${cells}</div>
  <p style="text-align:center;font-size:.78rem;opacity:.65;margin-top:10px">${s.fn}</p>
</div></section>`;
}

function distBody(lang, t) {
  const s = SEOT[lang] || SEOT.en;
  const dp = s.distPage;
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(dp.wa)}`;
  const cards = dp.items.map(([ic, tt, dd]) =>
    `<div class="card"><div class="ic">${ic}</div><h3>${tt}</h3><p>${dd}</p></div>`).join("\n    ");
  const stat = s.stats.map(([n, l2]) =>
    `<div style="flex:1 1 170px;min-width:160px;text-align:center;padding:22px 10px;border:1px solid #e5e7eb;border-radius:12px;background:#fff"><b style="display:block;font-size:1.55rem">${n}</b><span style="font-size:.95rem;color:#555">${l2}</span></div>`).join("");
  return `
<section class="hero"><div class="container hero-inner">
  <span class="kicker">${BRAND} · ${s.nav_d}</span>
  <h1>${dp.h}</h1>
  <p class="sub">${dp.s}</p>
  <div class="actions">
    <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">${dp.ctaB}</a>
    <a class="btn btn-outline" style="color:#fff;border-color:#fff" href="./products.html">${t.nav_products}</a>
  </div>
</div></section>

<section><div class="container">
  <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center">${stat}</div>
  <p style="text-align:center;font-size:.78rem;opacity:.6;margin-top:10px">${s.fn}</p>
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>${dp.why}</h2></div>
  <div class="grid-3">
    ${cards}
  </div>
</div></section>

<section><div class="container">
  <div class="section-head"><h2>${dp.who_h}</h2></div>
  <p style="max-width:860px;margin:0 auto;text-align:center;font-size:1.05rem;line-height:1.7">${dp.who}</p>
</div></section>

<section><div class="container">
  <div class="cta-band">
    <h2>${dp.ctaH}</h2>
    <p>${dp.ctaP}</p>
    <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="${wa}" target="_blank" rel="noopener">${dp.ctaB}</a>
  </div>
</div></section>`;
}

function homeBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  const aT = APP_T[lang] || APP_T.en;
  return `
<section class="hero"><div class="container hero-inner">
  <span class="kicker">${t.h_hero_kicker}</span>
  <h1>${t.h_hero_title}</h1>
  <p class="sub">${t.h_hero_sub}</p>
  <div class="actions">
    <a class="btn btn-primary" href="./calculator.html">${d.ui.calc_title}</a>
    <a class="btn btn-outline" style="color:#fff;border-color:#fff" href="./products.html">${t.nav_products}</a>
  </div>
</div></section>

${trustStrip(lang)}

<section><div class="container">
  <div class="section-head"><h2>${t.h_value_title}</h2></div>
  <div class="grid-3">
    <div class="card"><div class="ic">🌡️</div><h3>${t.h_val1_t}</h3><p>${t.h_val1_d}</p></div>
    <div class="card"><div class="ic">⚡</div><h3>${t.h_val2_t}</h3><p>${t.h_val2_d}</p></div>
    <div class="card"><div class="ic">🛠️</div><h3>${t.h_val3_t}</h3><p>${t.h_val3_d}</p></div>
  </div>
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>${t.h_prod_title}</h2><p>${t.h_prod_sub}</p></div>
  <div class="series-grid">${SERIES.map((s) => seriesCard(s, d, t)).join("\n    ")}</div>
</div></section>

<section><div class="container">
  <div class="section-head"><h2>${ui.nav}</h2></div>
  <div class="app-grid">${APPS.map((a) => appCard(a, aT[a.key])).join("\n    ")}</div>
</div></section>

${evidence(d, lang)}

<section><div class="container">
  <div class="cta-band">
    <h2>${t.h_cta_title}</h2>
    <p>${t.h_cta_text}</p>
    <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./contact.html">${t.h_cta_btn}</a>
  </div>
</div></section>`;
}

function productsBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  const aT = APP_T[lang] || APP_T.en;
  return `
<div class="page-hero"><div class="container">
  <h1>${t.p_title}</h1><p>${t.p_intro}</p>
</div></div>
<section><div class="container">
  <div class="series-grid">${SERIES.map((s) => seriesCard(s, d, t)).join("\n    ")}</div>
  <div class="spec-note">⚠️ ${t.p_spec_note}</div>
</div></section>
<section class="bg-soft" id="apps"><div class="container">
  <div class="section-head"><h2>${ui.nav}</h2><p>${ui.kicker}</p></div>
  <div class="app-grid">${APPS.map((a) => appCard(a, aT[a.key])).join("\n    ")}</div>
</div></section>`;
}

function seriesBody(t, ui, lang, s) {
  const d = DEEP[lang] || DEEP.en;
  const x = d.series[s.key];
  const others = SERIES.filter((o) => o.key !== s.key);
  return `
<div class="page-hero"><div class="container">
  <span class="kicker-line">${t.p_title}</span>
  <h1>${x.name}</h1><p>${x.intro}</p>
  <div class="actions">
    <a class="btn btn-primary" href="./contact.html">${t.h_hero_btn}</a>
    <a class="btn btn-outline" href="./calculator.html">${d.ui.calc_title}</a>
  </div>
</div></div>

<section><div class="container">
  <div class="section-head"><h2>${d.ui.spec_title}</h2></div>
  ${specTable(s, d)}
</div></section>

<section class="bg-soft"><div class="container">
  <div class="grid-3">
    ${x.f.map((f) => `<div class="card fit"><div class="ic">✓</div><p>${f}</p></div>`).join("\n    ")}
  </div>
  <div class="cta-band" style="margin-top:32px">
    <h2>${d.ui.lp_title}</h2><p>${d.ui.lp_sub}</p>
    <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./calculator.html">${d.ui.calc_title}</a>
  </div>
</div></section>

${evidence(d, lang)}

<section><div class="container">
  <div class="section-head"><h2>${t.p_title}</h2></div>
  <div class="series-grid">${others.map((o) => seriesCard(o, d, t)).join("\n    ")}</div>
</div></section>
${faqBlock(lang, x.name)}`;
}

function appBody(t, ui, lang, app) {
  const d = DEEP[lang] || DEEP.en;
  const all = APP_T[lang] || APP_T.en;
  const aT = all[app.key];
  const others = APPS.filter((x) => x.key !== app.key);
  return `
<div class="page-hero"><div class="container">
  <span class="kicker-line">${app.emoji} ${ui.kicker}</span>
  <h1>${aT.name}</h1><p>${aT.intro}</p>
  <div class="actions">
    <a class="btn btn-primary" href="./contact.html">${t.h_hero_btn}</a>
    <a class="btn btn-outline" href="./calculator.html">${d.ui.calc_title}</a>
  </div>
</div></div>

<section><div class="container">
  <div class="section-head"><h2>${ui.pain_title}</h2></div>
  <div class="grid-3">
    ${aT.pain.map((p) => `<div class="card pain"><div class="ic">⚠️</div><p>${p}</p></div>`).join("\n    ")}
  </div>
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>${ui.fit_title}</h2></div>
  <div class="grid-3">
    ${aT.fit.map((p) => `<div class="card fit"><div class="ic">✓</div><p>${p}</p></div>`).join("\n    ")}
  </div>
  <div class="spec-note">⚠️ ${t.p_spec_note}</div>
</div></section>

<section><div class="container">
  <div class="section-head"><h2>${ui.more_title}</h2></div>
  <div class="app-grid">${others.map((a) => appCard(a, all[a.key])).join("\n    ")}</div>
</div></section>

<section class="bg-soft"><div class="container"><div class="cta-band">
  <h2>${ui.cta_title}</h2><p>${ui.cta_text}</p>
  <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./contact.html">${t.h_cta_btn}</a>
</div></div></section>
${faqBlock(lang, aT.name)}`;
}

function casesBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  // Banner only while cases are still template/placeholder content.
  const complete = d.cases.length > 0 && d.cases.every((c) =>
    c.problem && c.solution && c.result && !/\[[^\]]*\]/.test(c.problem + c.solution + c.result));
  return `
<div class="page-hero"><div class="container">
  <h1>${d.ui.case_title}</h1>${complete ? "" : `<p>${d.ui.case_banner}</p>`}
</div></div>
<section><div class="container">
  <div class="grid-2">
    ${d.cases.map((c) => `<article class="card case-card">
      <h3>${c.t}</h3>
      <dl class="case-dl">
        <dt>${d.ui.case_problem}</dt><dd>${c.problem}</dd>
        <dt>${d.ui.case_solution}</dt><dd>${c.solution}</dd>
        <dt>${d.ui.case_result}</dt><dd>${c.result}</dd>
      </dl>
    </article>`).join("\n    ")}
  </div>
  ${complete ? "" : `<div class="spec-note">⚠️ ${d.ui.case_banner}</div>`}
</div></section>
${evidence(d, lang)}
<section class="bg-soft"><div class="container"><div class="cta-band">
  <h2>${ui.cta_title}</h2><p>${ui.cta_text}</p>
  <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./calculator.html">${d.ui.calc_title}</a>
</div></div></section>`;
}

function calcBody(t, ui, lang, appLang) {
  const d = DEEP[lang] || DEEP.en;
  const appT = APP_T[lang] || APP_T.en;
  const opts = APPS.map((a) => `<option value="${a.key}">${appT[a.key].name}</option>`).join("");
  return `
<div class="page-hero"><div class="container">
  <h1>${d.ui.calc_title}</h1><p>${d.ui.calc_sub}</p>
</div></div>
<section><div class="container">
  <div class="calc-grid">
    <form id="calcForm" class="calc-panel">
      <div class="field"><label>${d.ui.calc_ind}</label><select id="ind">${opts}</select></div>
      <div class="field"><label id="paramLabel">${d.ui.calc_param}</label><input id="val" type="number" min="0" step="0.1" inputmode="decimal" required /></div>
      <fieldset class="corr">
        <legend>${d.ui.corr_title}</legend>
        <label><input type="checkbox" id="c_amb" /> ${d.ui.corr_amb}</label>
        <label><input type="checkbox" id="c_alt" /> ${d.ui.corr_alt}</label>
        <label><input type="checkbox" id="c_int" /> ${d.ui.corr_int}</label>
        <label><input type="checkbox" id="c_full" /> ${d.ui.corr_full}</label>
      </fieldset>
      <div class="field"><label>${d.ui.wt_title}</label><select id="wt">${WATER_TEMP.map((w) => `<option value="${w.key}"${w.key === "t7" ? " selected" : ""}>${d.ui["wt" + w.key.slice(1)]}</option>`).join("")}</select></div>
      <div class="field"><label>${d.ui.margin_title}</label><select id="mg">${MARGIN.map((m) => `<option value="${m.key}"${m.key === "std" ? " selected" : ""}>${d.ui["margin_" + m.key]}</option>`).join("")}</select></div>
      <button class="btn btn-primary" type="submit">${d.ui.calc_btn}</button>
    </form>
    <div class="calc-result" id="calcResult">
      <div class="cr-label">${d.ui.calc_result}</div>
      <div class="cr-value" id="crVal">—</div>
      <div class="cr-sub" id="crSub"></div>
      <div class="cr-label">${d.ui.calc_rec}</div>
      <div class="cr-rec" id="crRec">—</div>
      <a class="btn btn-primary" id="crSend" href="${waLink(t.wa_msg)}" target="_blank" rel="noopener">${d.ui.calc_send}</a>
      <p class="note">${d.ui.calc_note}</p>
    </div>
  </div>
</div></section>
${evidence(d, lang)}
<script>
(function(){
var R=${JSON.stringify(RULES)};
var CORR={${CORRECTIONS.map((c) => c.key + ":" + c.factor).join(",")}};
var WT={${WATER_TEMP.map((w) => w.key + ":" + w.factor).join(",")}};
var MG={${MARGIN.map((m) => m.key + ":" + m.factor).join(",")}};
var WTT=${JSON.stringify(d.ui.wt_title)};
var PARAM={inj:'${d.ui.in_tonnage}',blow:'${d.ui.in_output}',extr:'${d.ui.in_screw}',rub:'${d.ui.in_output}',laser:'${d.ui.in_laser}'};
var REC={air:${JSON.stringify(d.series.air.name)},water:${JSON.stringify(d.series.water.name)},low:${JSON.stringify(d.series.low.name)},screw:${JSON.stringify(d.series.screw.name)}};
var SLUG={air:'air-cooled-chiller',water:'water-cooled-chiller',low:'low-temp-chiller',screw:'screw-chiller'};
var indEl=document.getElementById('ind'),valEl=document.getElementById('val'),labEl=document.getElementById('paramLabel');
var resEl=document.getElementById('calcResult'),valOut=document.getElementById('crVal'),subOut=document.getElementById('crSub');
var recOut=document.getElementById('crRec'),sendEl=document.getElementById('crSend');
function syncLabel(){labEl.textContent=PARAM[indEl.value]||'${d.ui.calc_param}';}
indEl.addEventListener('change',syncLabel);syncLabel();
document.getElementById('calcForm').addEventListener('submit',function(e){
  e.preventDefault();
  var v=parseFloat(valEl.value);if(!v||v<=0)return;
  var rule=R[indEl.value];if(!rule)return;
  var f=1;if(document.getElementById('c_amb').checked)f*=CORR.ambient;
  if(document.getElementById('c_alt').checked)f*=CORR.altitude;
  if(document.getElementById('c_int').checked)f*=CORR.intermittent;
  if(document.getElementById('c_full').checked)f*=CORR.fullload;
  var wtEl=document.getElementById('wt'),mgEl=document.getElementById('mg');
  f*=(WT[wtEl.value]||1)*(MG[mgEl.value]||1);
  var lo=v*rule.k[0]*f,hi=v*rule.k[1]*f;
  var rec=hi<=30?'air':(hi<=70?'water':'screw');
  if(wtEl.value==='t0'||wtEl.value==='tm10')rec='low';
  var trLo=lo/3.517,trHi=hi/3.517;
  valOut.textContent=lo.toFixed(1)+' – '+hi.toFixed(1)+' kW';
  subOut.textContent='≈ '+trLo.toFixed(1)+' – '+trHi.toFixed(1)+' TR';
  recOut.innerHTML='<a href="./'+SLUG[rec]+'.html">'+REC[rec]+' →</a>';
  var msg='${d.ui.calc_title}'+'\\n'+indEl.value.toUpperCase()+' / '+PARAM[indEl.value]+': '+v+'\\n'+WTT+': '+wtEl.options[wtEl.selectedIndex].text+'\\n'+'${d.ui.calc_result}'.replace(/:$/,'')+': '+lo.toFixed(1)+'-'+hi.toFixed(1)+' kW ('+trLo.toFixed(1)+'-'+trHi.toFixed(1)+' TR)\\n'+'${d.ui.calc_rec}'.replace(/:$/,'')+': '+REC[rec];
  sendEl.href='${waLink("")}'.split('?')[0]+'?text='+encodeURIComponent(msg);
  sendEl.onclick=function(){track('calculator_wa',{industry:indEl.value});};
  resEl.classList.add('is-done');
  track('calculator_result',{industry:indEl.value,value:v,kw_max:Math.round(hi),water:wtEl.value,margin:mgEl.value});
  resEl.scrollIntoView({behavior:'smooth',block:'nearest'});
});
})();
</script>
<section class="bg-soft"><div class="container"><div class="cta-band">
  <h2>${ui.cta_title}</h2><p>${ui.cta_text}</p>
  <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./contact.html">${t.h_cta_btn}</a>
</div></div></section>`;
}

function factoryBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  const facts = factoryFacts(lang);
  return `
<div class="page-hero"><div class="container">
  <h1>${t.f_title}</h1><p>${t.f_intro}</p>
</div></div>
${facts.length ? `<section class="bg-soft" style="padding-block:28px"><div class="container">
  <div class="fact-grid">
    ${facts.map((f) => `<div class="fact" data-fact="${f.key}"><strong>${f.value}</strong><span>${f.label}</span></div>`).join("\n    ")}
  </div>
</div></section>` : ""}
<section><div class="container">
  <div class="grid-2">
    <div class="card"><div class="ic">🏭</div><h3>${t.f_a1_t}</h3><p>${t.f_a1_d}</p></div>
    <div class="card"><div class="ic">✅</div><h3>${t.f_a2_t}</h3><p>${t.f_a2_d}</p></div>
    <div class="card"><div class="ic">🔬</div><h3>${t.f_a3_t}</h3><p>${t.f_a3_d}</p></div>
    <div class="card"><div class="ic">📞</div><h3>${t.f_a4_t}</h3><p>${t.f_a4_d}</p></div>
  </div>
</div></section>
${evidence(d, lang)}
<section><div class="container">
  <div class="cta-band">
    <h2>${t.f_cta}</h2>
    <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./contact.html">${t.nav_contact}</a>
  </div>
</div></section>`;
}

function contactBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  const f = FORM_L[lang] || FORM_L.en;
  return `
<div class="page-hero"><div class="container">
  <h1>${t.c_title}</h1><p>${t.c_intro}</p>
</div></div>
<section><div class="container">
  <div class="contact-wrap">
    <div class="wa-card">
      <div style="font-size:46px;margin-bottom:10px">💬</div>
      <h3 style="margin:0 0 8px">WhatsApp</h3>
      <p style="color:var(--c-muted);margin:0 0 18px">${t.c_wa_text}</p>
      <a class="wa-btn" href="${waLink(t.wa_msg)}" target="_blank" rel="noopener" onclick="track('wa_click',{placement:'contact'});waLead('contact')">📱 ${t.cta_whatsapp}</a>
      <p class="note" style="margin-top:18px">${d.ui.calc_title} → <a href="./calculator.html">${d.ui.calc_sub}</a></p>
    </div>
    ${leadForm(f, t, d)}
  </div>
</div></section>
<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>${COMPANY_NAME} · Factory &amp; Contact Details</h2></div>
  <div class="grid-3">
    <div class="card"><div class="ic">🏭</div><h3>Factory Address</h3><p>${ADDRESS}</p></div>
    <div class="card"><div class="ic">📧</div><h3>Email</h3><p>${EMAILS.map((e) => `<a href="mailto:${e}">${e}</a>`).join("<br />")}</p></div>
    <div class="card"><div class="ic">📱</div><h3>WhatsApp / Mobile</h3><p><a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">${TEL_DISPLAY}</a></p><p><a href="${waLink(t.wa_msg)}" target="_blank" rel="noopener">${t.cta_whatsapp}</a></p></div>
  </div>
  <div class="grid-3" style="margin-top:14px">
    <div class="card"><div class="ic">📸</div><h3>Instagram</h3><p><a href="${INSTAGRAM}" target="_blank" rel="noopener">@agengda2021</a></p></div>
    <div class="card"><div class="ic">📘</div><h3>Facebook</h3><p><a href="${FACEBOOK}" target="_blank" rel="noopener">${t.footer_copy.split("©")[0].trim() || "Agengda"}</a></p></div>
    <div class="card"><div class="ic">💬</div><h3>Messenger</h3><p><a href="${MESSENGER}" target="_blank" rel="noopener">Chat on Messenger</a></p></div>
  </div>
</div></section>`;
}

function lpBody(t, ui, lang) {
  const d = DEEP[lang] || DEEP.en;
  const f = FORM_L[lang] || FORM_L.en;
  return `
<section class="hero"><div class="container hero-inner">
  <span class="kicker">${t.h_hero_kicker}</span>
  <h1>${d.ui.lp_title}</h1>
  <p class="sub">${d.ui.lp_sub}</p>
  <div class="actions">
    <a class="btn btn-primary" href="${waLink(t.wa_msg)}" target="_blank" rel="noopener" onclick="track('wa_click',{placement:'lp_hero'});waLead('lp_hero')">${t.cta_whatsapp}</a>
    <a class="btn btn-outline" style="color:#fff;border-color:#fff" href="#lead">${t.h_hero_btn}</a>
  </div>
</div></section>

<section><div class="container">
  <div class="grid-3">
    <div class="card"><div class="ic">🏭</div><h3>${t.f_a1_t}</h3><p>${t.f_a1_d}</p></div>
    <div class="card"><div class="ic">⚡</div><h3>${t.h_val2_t}</h3><p>${t.h_val2_d}</p></div>
    <div class="card"><div class="ic">📞</div><h3>${t.f_a4_t}</h3><p>${t.f_a4_d}</p></div>
  </div>
  <div class="cta-band" style="margin-top:32px">
    <h2>${d.ui.calc_title}</h2><p>${d.ui.calc_sub}</p>
    <a class="btn btn-primary" style="background:#fff;color:var(--c-accent)" href="./calculator.html">${d.ui.calc_title}</a>
  </div>
</div></section>

${evidence(d, lang)}

<section id="lead"><div class="container">
  <div class="section-head"><h2>${t.c_title}</h2><p>${t.c_intro}</p></div>
  <div class="lp-form-wrap">${leadForm(f, t, d)}</div>
</div></section>`;
}

// ---------- Titles / descriptions / structured data ----------
function metaFor(p, t, ui, d, appT, lang) {
  const s = SEOT[lang] || SEOT.en;
  switch (p.kind) {
    case "home": return { title: s.home[0], desc: s.home[1] };
    case "products": return { title: s.products[0], desc: s.products[1] };
    case "series": {
      const n = d.series[p.series.key].name;
      return { title: s.series[0].replace("{name}", n), desc: s.series[1].replace("{name}", n) };
    }
    case "app": {
      const n = appT[p.app.key].name;
      return { title: s.app[0].replace("{name}", n), desc: s.app[1].replace("{name}", n) };
    }
    case "cases": return { title: s.cases[0], desc: s.cases[1] };
    case "calc": return { title: s.calc[0], desc: s.calc[1] };
    case "factory": return { title: s.factory[0], desc: s.factory[1] };
    case "contact": return { title: s.contact[0], desc: s.contact[1] };
    case "dist": return { title: s.dist[0], desc: s.dist[1] };
    case "lp": return { title: `${d.ui.lp_title} | ${BRAND}`, desc: d.ui.lp_sub };
    default: return { title: BRAND, desc: t.h_hero_sub };
  }
}

function structuredData(p, t, ui, d, appT, lang, file) {
  const out = [];
  const crumb = (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, item: abs(lang, it.file),
    })),
  });
  if (p.kind === "home") {
    out.push({
      "@context": "https://schema.org", "@type": "Organization",
      name: COMPANY_NAME, url: SITE_URL, logo: `${SITE_URL}/assets/img/logo.png`,
      description: t.footer_made,
      email: EMAILS,
      telephone: TEL_DISPLAY,
      address: { "@type": "PostalAddress", streetAddress: "No. 88, Manao Third Road, Changfu Industrial Park, Caidian District", addressLocality: "Wuhan", addressRegion: "Hubei", addressCountry: "CN" },
      sameAs: [FACEBOOK, INSTAGRAM].filter(Boolean),
      contactPoint: [{ "@type": "ContactPoint", contactType: "sales", telephone: `+${WHATSAPP}`, email: EMAILS[0], availableLanguage: LANGS.map((l) => l.code) }],
    });
    out.push({ "@context": "https://schema.org", "@type": "WebSite", name: BRAND, url: SITE_URL, inLanguage: LANGS.map((l) => l.hreflang || l.code) });
  } else   if (p.kind === "series") {
    const x = d.series[p.series.key];
    out.push({
      "@context": "https://schema.org", "@type": "Product",
      name: x.name, description: x.intro, brand: { "@type": "Brand", name: BRAND },
      category: "Industrial water chiller", url: abs(lang, file),
      image: `${SITE_URL}/assets/img/workshop.jpg`,
      model: (SERIES.find((s) => s.key === p.series.key) || {}).models ? SERIES.find((s) => s.key === p.series.key).models.join(", ") : undefined,
      manufacturer: { "@type": "Organization", name: BRAND },
      offers: { "@type": "Offer", availability: "https://schema.org/InStock", priceCurrency: "USD", url: abs(lang, file) },
    });
    out.push(crumb([{ name: t.nav_home, file: "index.html" }, { name: t.p_title, file: "products.html" }, { name: x.name, file }]));
    out.push(faqSchema(lang, x.name));
  } else if (p.kind === "app") {
    const aT = appT[p.app.key];
    out.push(crumb([{ name: t.nav_home, file: "index.html" }, { name: ui.nav, file: "products.html" }, { name: aT.name, file }]));
    out.push(faqSchema(lang, aT.name));
  } else if (p.kind === "lp") {
    out.push(crumb([{ name: t.nav_home, file: "index.html" }, { name: d.ui.lp_title, file }]));
  } else {
    out.push(crumb([{ name: t.nav_home, file: "index.html" }, { name: metaFor(p, t, ui, d, appT).title.split("|").pop().trim(), file }]));
  }
  return out;
}

// ---------- Build ----------
// Incremental: pages are overwritten in place, never by wiping dist/.
// Wiping ~190 files at once trips the host safe-delete guard, which made the
// in-browser datasheet editor fail with a build error. Only pages that the
// build no longer produces get removed afterwards.
const WRITTEN = new Set();

function pruneOrphans() {
  let removed = 0;
  LANGS.forEach((l) => {
    const dir = path.join(DIST, l.code);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    const orphans = names.filter((n) => n.endsWith(".html") && !WRITTEN.has(path.join(dir, n)));
    for (let i = 0; i < orphans.length; i += 20) {
      orphans.slice(i, i + 20).forEach((n) => {
        try { fs.unlinkSync(path.join(dir, n)); removed++; } catch (e) { /* ignore */ }
      });
    }
  });
  if (removed) console.log(`pruned ${removed} stale page(s)`);
}

function build() {
  LANGS.forEach((l) => {
    fs.mkdirSync(path.join(DIST, l.code), { recursive: true });
  });

  LANGS.forEach((l) => {
    const t = T[l.code];
    const ui = APP_UI[l.code] || APP_UI.en;
    const d = DEEP[l.code] || DEEP.en;
    const appT = APP_T[l.code] || APP_T.en;
    const f = FORM_L[l.code] || FORM_L.en;
    FORM_SENT_PLACEHOLDER = f.f_sent;
    const dir = path.join(DIST, l.code);

    PAGES.forEach((p) => {
      const meta = metaFor(p, t, ui, d, appT, l.code);
      let body;
      switch (p.kind) {
        case "home": body = homeBody(t, ui, l.code); break;
        case "products": body = productsBody(t, ui, l.code); break;
        case "series": body = seriesBody(t, ui, l.code, p.series); break;
        case "app": body = appBody(t, ui, l.code, p.app); break;
        case "cases": body = casesBody(t, ui, l.code); break;
        case "calc": body = calcBody(t, ui, l.code, appT); break;
        case "factory": body = factoryBody(t, ui, l.code); break;
        case "contact": body = contactBody(t, ui, l.code); break;
        case "dist": body = distBody(l.code, t); break;
        case "lp": body = lpBody(t, ui, l.code); break;
        default: body = "";
      }
      const html = shell({
        title: meta.title, desc: meta.desc, code: l.code, lang: l.htmlLang || l.code, dir: l.dir,
        file: p.file, body, t, ui, d,
        ld: structuredData(p, t, ui, d, appT, l.code, p.file),
        bare: p.kind === "lp",
        robots: p.kind === "lp" ? "noindex,follow" : null,
      });
      fs.writeFileSync(path.join(dir, p.file), html, "utf8");
      WRITTEN.add(path.join(dir, p.file));
    });
    console.log(`built ${l.code} (${l.name}) - ${PAGES.length} pages`);
  });

  pruneOrphans();

  // language chooser (preserved at /choose.html so it stays reachable)
  const grid = LANGS.map((l) => `<a href="./${l.code}/index.html"><span class="lang-flag">${l.flag}</span>${l.name}</a>`).join("\n");
  fs.writeFileSync(path.join(DIST, "choose.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${BRAND} — Choose your language</title>
<link rel="stylesheet" href="./assets/css/style.css?v=${ASSET_V}" />
${analytics()}
</head>
<body>
<div class="lang-chooser"><div class="box">
  <h1>${BRAND}</h1>
  <p>Choose your language / 选择语言 / Elige tu idioma</p>
  <div class="lang-grid">${grid}</div>
</div></div>
</body>
</html>`, "utf8");

  // root opens in the visitor's own language:
  //   1. explicit ?lang=xx in the URL (ad campaigns can pin the language)
  //   2. language the visitor picked before (localStorage, set by /choose.html)
  //   3. browser languages (es -> /es/, pt -> /pt/, ar -> /ar/ ...)
  //   4. fall back to English
  // UTM / click-id params are carried over to the target page so attribution
  // (fbclid / utm_*) survives the redirect.
  fs.writeFileSync(path.join(DIST, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${BRAND}</title>
<link rel="canonical" href="${abs(DEFAULT_LANG, "index.html")}" />
<link rel="alternate" hreflang="x-default" href="${abs(DEFAULT_LANG, "index.html")}" />
${LANGS.map((l) => `<link rel="alternate" hreflang="${l.hreflang || l.code}" href="${abs(l.code, "index.html")}" />`).join("\n")}
<meta http-equiv="refresh" content="0; url=./en/index.html" />
<noscript><meta http-equiv="refresh" content="0; url=./en/index.html" /></noscript>
${analytics()}
</head>
<body>
<div class="lang-chooser"><div class="box">
  <h1>${BRAND}</h1>
  <p>Loading… <a href="./choose.html">Other languages / 其他语言</a></p>
</div></div>
<script>
(function(){
  var L=${JSON.stringify(LANGS.map((l) => l.code))};
  var want='';
  try{
    var p=new URLSearchParams(location.search);
    want=(p.get('lang')||'').toLowerCase();
    if(L.indexOf(want)<0) want='';
    if(!want){ want=(localStorage.getItem('lang_choice')||'').toLowerCase(); if(L.indexOf(want)<0) want=''; }
    if(!want){
      var nls=navigator.languages||[navigator.language||navigator.userLanguage||'en'];
      for(var i=0;i<nls.length&&!want;i++){
        var nl=String(nls[i]||'').toLowerCase();
        if(nl.indexOf('zh')===0){ want='zh'; break; }
        for(var j=0;j<L.length;j++){ if(nl.indexOf(L[j])===0){ want=L[j]; break; } }
      }
    }
  }catch(e){}
  if(L.indexOf(want)<0) want='en';
  try{ localStorage.setItem('lang_last',want); }catch(e){}
  location.replace('./'+want+'/index.html'+location.search);
})();
</script>
</body>
</html>`, "utf8");

  // UTM link builder (ad campaign helper)
  fs.writeFileSync(path.join(DIST, "utm-builder.html"), `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UTM 链接生成器</title>
<link rel="stylesheet" href="./assets/css/style.css?v=${ASSET_V}">
<style>.ub{max-width:760px;margin:40px auto;padding:0 16px;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif}.ub label{display:block;margin:12px 0 4px;font-weight:600;color:#334155}.ub input,.ub select{width:100%;padding:9px 11px;border:1px solid #d3dae3;border-radius:9px;box-sizing:border-box;font:inherit}.ub .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ub pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:10px;white-space:pre-wrap;word-break:break-all;margin-top:16px}.ub button{margin-top:14px;padding:9px 16px;border:0;border-radius:9px;background:#16a34a;color:#fff;font:inherit;font-weight:600;cursor:pointer}.ub .hint{color:#64748b;font-size:12.5px;margin-top:6px}</style>
</head><body><div class="ub">
<h1>UTM 广告链接生成器</h1>
<p class="hint">给每个广告系列生成带 UTM 的链接，GA4 就能看出哪个渠道带来的询盘最多。建议按「渠道_国家_素材」命名 campaign。</p>
<div class="row">
  <div><label>落地页基础网址</label><input id="u" value="https://agengda-industrial-chiller.com/en/products.html"></div>
  <div><label>来源 utm_source</label><input id="s" value="google" list="srcs"><datalist id="srcs"><option>google<option>facebook<option>instagram<option>tiktok<option>linkedin</datalist></div>
</div>
<div class="row">
  <div><label>媒介 utm_medium</label><input id="m" value="cpc" list="meds"><datalist id="meds"><option>cpc<option>paid_social<option>display<option>email<option>referral</datalist></div>
  <div><label>系列 utm_campaign</label><input id="c" placeholder="例：chiller_mx_video_01"></div>
</div>
<div class="row">
  <div><label>关键词 utm_term（可选）</label><input id="t" placeholder="冷水机"></div>
  <div><label>素材 utm_content（可选）</label><input id="cn" placeholder="video_a / image_b"></div>
</div>
<button id="go">生成链接</button>
<pre id="out">填完上面点「生成链接」</pre>
<script>
(function(){
  function g(id){return document.getElementById(id).value.trim();}
  document.getElementById('go').addEventListener('click',function(){
    var u=g('u'); if(!u) return;
    var p=new URLSearchParams();
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k,i){
      var v=[g('s'),g('m'),g('c'),g('t'),g('cn')][i]; if(v) p.set(k,v);
    });
    var sep=u.indexOf('?')>=0?'&':'?';
    var full=u+sep+p.toString();
    document.getElementById('out').textContent=full;
    navigator.clipboard&&navigator.clipboard.writeText(full);
  });
})();
</script>
</div></body></html>`, "utf8");

  // sitemap
  const alts = (file) => LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l.hreflang || l.code}" href="${abs(l.code, file)}"/>`).join("")
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(DEFAULT_LANG, file)}"/>`;
  const sitemapPages = PAGES.filter((p) => p.kind !== "lp"); // lp is noindex
  const urls = LANGS.map((l) => sitemapPages.map((p) =>
    `  <url><loc>${abs(l.code, p.file)}</loc>${alts(p.file)}<changefreq>weekly</changefreq></url>`).join("\n")).join("\n");
  fs.writeFileSync(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${SITE_URL}/</loc><changefreq>weekly</changefreq></url>
${urls}
</urlset>`, "utf8");

  fs.writeFileSync(path.join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`, "utf8");

  // IndexNow key file (Bing / Yandex / Seznam instant indexing must find it at /<key>.txt)
  const INDEXNOW_KEY = "6b50956eba5d3fe8ad77216d0ea10369";
  fs.writeFileSync(path.join(DIST, INDEXNOW_KEY + ".txt"), INDEXNOW_KEY, "utf8");

  // assets
  const copyForce = (src, dst) => {
    try { fs.unlinkSync(dst); } catch (_) {}
    fs.copyFileSync(src, dst);
  };
  fs.mkdirSync(path.join(DIST, "assets", "css"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "assets", "css", "style.css"), SITE_CSS);
  fs.mkdirSync(IMG_DIST, { recursive: true });
  if (fs.existsSync(IMG_SRC)) {
    fs.readdirSync(IMG_SRC).forEach((n) => copyForce(path.join(IMG_SRC, n), path.join(IMG_DIST, n)));
  }
  const JS_SRC = path.join(ROOT, "src", "assets", "js");
  const JS_DIST = path.join(DIST, "assets", "js");
  if (fs.existsSync(JS_SRC)) {
    fs.mkdirSync(JS_DIST, { recursive: true });
    fs.readdirSync(JS_SRC).forEach((n) => copyForce(path.join(JS_SRC, n), path.join(JS_DIST, n)));
  }

  // Admin backend: served from the site root on the published site too, so the
  // cloud-backed factory editor and leads viewer are reachable at /admin.
  const ADMIN_SRC = path.join(ROOT, "admin.html");
  if (fs.existsSync(ADMIN_SRC)) {
    fs.copyFileSync(ADMIN_SRC, path.join(DIST, "admin.html"));
  }

  console.log("\nBuild complete -> dist/");
  console.log("Pages:", LANGS.length * PAGES.length + 1, "| Languages:", LANGS.length, "| Per language:", PAGES.length);
}

build();

// redeploy-trigger 2026-10-26T08:18:14.267087Z
