/* 冷水机独立站 — WorkBuddy Cloud Service client (CDN SDK form).
 * Initializes once from window.__CLOUD_CONFIG, then exposes window.CloudApp.
 * On localhost we keep using the local server API (/api/*); on the published
 * site we use the real cloud database / auth so data survives redeploys.
 */
(function () {
  "use strict";
  var CFG = window.__CLOUD_CONFIG;
  var cloud = null;
  var authReady = false;

  function isLocal() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  }

  function ensureCloud() {
    if (cloud) return cloud;
    if (!CFG || !window.WorkBuddyCloud) return null;
    try {
      cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
        endpoint: CFG.endpoint,
        oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
        publishableKey: CFG.publishableKey
      });
    } catch (e) {
      cloud = null;
    }
    return cloud;
  }

  function emitAuth(session) {
    window.dispatchEvent(new CustomEvent("cloud-auth", { detail: { session: session || null } }));
  }

  function cleanUrl() {
    var u = new URL(location.href);
    ["code", "state", "provider"].forEach(function (k) { u.searchParams.delete(k); });
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  }

  async function restoreSession() {
    var s = await getSession();
    emitAuth(s);
  }

  // Handle OAuth callback at startup (WorkBuddy account sign-in).
  async function initAuthCallback() {
    var u = new URL(location.href);
    if (!u.searchParams.has("code") && !u.searchParams.has("error")) {
      restoreSession();
      return;
    }
    var c = ensureCloud();
    if (!c) { restoreSession(); return; }
    var provider = u.searchParams.get("provider");
    try {
      var r;
      if (provider === "workbuddy") r = await c.auth.handleWorkBuddyCallback();
      else if (provider === "wechat") r = await c.auth.handleWechatWebCallback();
      else { restoreSession(); return; }
      if (r && r.data) cleanUrl();
    } catch (e) {
      console.error("[cloud] oauth callback error", e);
    }
    restoreSession();
  }

  // ---------- Auth (WorkBuddy account sign-in) ----------
  async function signIn(provider) {
    provider = provider || "workbuddy";
    var c = ensureCloud();
    if (!c) { console.error("[cloud] not ready"); return; }
    var back = new URL(location.href);
    back.pathname = location.pathname;
    ["code", "state", "provider"].forEach(function (k) { back.searchParams.delete(k); });
    var r = await c.auth.signInWithOAuth({ provider: provider, redirectTo: back.toString() });
    if (r.error) { console.error("[cloud] sign in failed", r.error); return; }
    if (r.data && r.data.url) location.assign(r.data.url);
  }

  async function signOut() {
    var c = ensureCloud();
    if (!c) return;
    try { await c.auth.signOut(); } catch (e) {}
    emitAuth(null);
  }

  async function getSession() {
    var c = ensureCloud();
    if (!c) return null;
    try {
      var r = await c.auth.getSession();
      return (r && r.data) ? r.data : null;
    } catch (e) { return null; }
  }

  // ---------- Leads (统一走服务器：本地落盘 + 云端持久化 + 微信提醒) ----------
  async function submitLead(o) {
    o = o || {};
    // 不再由浏览器直连云端库。原因：旧逻辑用 .insert().select()，而匿名角色没有
    // SELECT 权限（RLS 仅 authenticated 可读），回读会让整条插入失败 → 询盘丢失。
    // 现在统一 POST /api/lead，由服务器一次完成：本地 leads.jsonl + 云端库 + 微信推送。
    try {
      var r = await fetch("/api/lead", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o)
      });
      return r.ok;
    } catch (e) { return false; }
  }

  async function loadLeads() {
    if (isLocal()) return null;
    var c = ensureCloud();
    if (!c) return null;
    try {
      var r = await c.database.from("leads")
        .select("*").order("created_at", { ascending: false }).limit(300);
      if (r.error) { console.error("[cloud] leads read failed", r.error); return null; }
      return r.data || [];
    } catch (e) { return null; }
  }

  // ---------- Factory profile (public anon read, authenticated write) ----------
  // Stored as a single row (id=1) whose `state` JSON mirrors data/factory.json
  // shape: { i18n:{zh,en}, facts:[{key,label,value}], evidence:[{key,img,zh,en,...}] }.
  async function loadFactory() {
    if (isLocal()) {
      try {
        var r = await fetch("/api/factory", { cache: "no-store" });
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { return null; }
    }
    var c = ensureCloud();
    if (!c) return null;
    try {
      var res = await c.database.from("factory").select("state").eq("id", 1).maybeSingle();
      if (res.error) { console.error("[cloud] factory read failed", res.error); return null; }
      return (res.data && res.data.state) ? res.data.state : null;
    } catch (e) { return null; }
  }

  async function saveFactory(state) {
    if (isLocal()) {
      try {
        var r = await fetch("/api/factory", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state)
        });
        return r.ok;
      } catch (e) { return false; }
    }
    var c = ensureCloud();
    if (!c) return false;
    try {
      var res = await c.database.from("factory")
        .upsert({ id: 1, state: state, saved_at: new Date().toISOString() })
        .select();
      if (res.error) { console.error("[cloud] factory save failed", res.error); return false; }
      return true;
    } catch (e) { console.error("[cloud] factory save error", e); return false; }
  }

  // ---------- Site images (base64 in cloud DB, via same-origin server proxy) ----------
  // Browser -> /api/images -> server -> WorkBuddy REST. Direct browser calls fail
  // on the custom domain because the cloud REST endpoint has no CORS headers.
  async function loadImages() {
    try {
      // Cloudflare caches GET /api/images for 2h regardless of the server's
      // no-store header. A unique query param forces an edge MISS every time.
      var r = await fetch("/api/images?t=" + Date.now() + "-" + Math.random().toString(36).slice(2), { cache: "no-store" });
      if (!r.ok) return null;
      var j = await r.json();
      return (j && j.images) ? j.images : {};
    } catch (e) { return null; }
  }

  async function saveImages(images) {
    try {
      var r = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: images })
      });
      if (!r.ok) return false;
      var j = await r.json();
      return !!(j && j.ok);
    } catch (e) { console.error("[cloud] images save error", e); return false; }
  }

  // Apply cloud image overrides to every tagged element on the page.
  // Galleries are stored under the reserved "__galleries" key and rebuilt here,
  // so photos can be added / removed / replaced in /admin without a redeploy.
  function safeImgUrl(v) {
    if (typeof v !== "string") return "";
    if (/^data:image\//.test(v) || /^\/assets\/img\//.test(v) || /^https?:\/\//.test(v)) return v;
    return "";
  }

  function tileBase(fig) {
    var im = fig.querySelector("img");
    var cp = fig.querySelector("figcaption");
    return {
      src: im ? (im.getAttribute("src") || "") : "",
      cap: cp ? cp.textContent : "",
      key: im ? (im.getAttribute("data-img-key") || "") : ""
    };
  }

  function findBase(list, item) {
    if (!item || !item.def) return null;
    var def = String(item.def);
    var bare = def.replace(/\.[^.]+$/, "");
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b.key === def || b.key === bare || b.src.indexOf(def) !== -1) return b;
    }
    return null;
  }

  function applyProductGallery(series, cfg) {
    var box = document.querySelector('.prod-gallery[data-gallery="' + series + '"]');
    if (!box || !Array.isArray(cfg)) return;
    var bases = Array.prototype.map.call(box.querySelectorAll(".prod-tile"), tileBase);
    var frag = document.createDocumentFragment();
    cfg.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var base = findBase(bases, item);
      var src = safeImgUrl(item.src) || (base && base.src) || "";
      if (!src) return;
      var cap = (typeof item.cap === "string" && item.cap) ? item.cap : (base ? base.cap : "");
      var fig = document.createElement("figure");
      fig.className = "prod-tile";
      var shot = document.createElement("div");
      shot.className = "prod-shot";
      var im = document.createElement("img");
      im.src = src; im.alt = cap || ""; im.loading = "lazy";
      if (base && base.key) im.setAttribute("data-img-key", base.key);
      shot.appendChild(im);
      var fc = document.createElement("figcaption");
      fc.textContent = cap;
      fig.appendChild(shot); fig.appendChild(fc);
      frag.appendChild(fig);
    });
    box.innerHTML = "";
    box.appendChild(frag);
  }

  function applyFactoryGallery(cfg) {
    var box = document.querySelector('.ev-grid[data-gallery="factory"]');
    if (!box || !Array.isArray(cfg)) return;
    var bases = Array.prototype.map.call(box.querySelectorAll("figure.ev-tile"), tileBase);
    var frag = document.createDocumentFragment();
    cfg.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var base = findBase(bases, item);
      var src = safeImgUrl(item.src) || (base && base.src) || "";
      if (!src) return;
      var cap = (typeof item.cap === "string" && item.cap) ? item.cap : (base ? base.cap : "");
      var fig = document.createElement("figure");
      fig.className = "ev-tile";
      var im = document.createElement("img");
      im.src = src; im.alt = cap || ""; im.loading = "lazy";
      if (base && base.key) im.setAttribute("data-img-key", base.key);
      var fc = document.createElement("figcaption");
      fc.textContent = cap;
      fig.appendChild(im); fig.appendChild(fc);
      frag.appendChild(fig);
    });
    box.innerHTML = "";
    box.appendChild(frag);
  }

  async function hydrateImages() {
    var map = await loadImages();
    if (!map) return;

    // Rebuild galleries first, then apply fixed-slot overrides so a replaced
    // cover photo also shows up inside its gallery tile.
    var galleries = (map.__galleries && typeof map.__galleries === "object" && !Array.isArray(map.__galleries))
      ? map.__galleries : null;
    if (galleries) {
      Object.keys(galleries).forEach(function (k) {
        if (k.indexOf("product:") === 0) applyProductGallery(k.slice(8), galleries[k]);
        else if (k === "factory") applyFactoryGallery(galleries[k]);
      });
    }

    var tagged = document.querySelectorAll("[data-img-key]");
    Object.keys(map).forEach(function (key) {
      if (key === "__galleries") return;
      var val = map[key];
      if (typeof val !== "string") return;
      for (var i = 0; i < tagged.length; i++) {
        var n = tagged[i];
        if (n.getAttribute("data-img-key") !== key) continue;
        if (val === "__hidden__") { n.style.display = "none"; continue; }
        n.style.display = "";
        var url = safeImgUrl(val);
        if (!url) continue;
        if (n.hasAttribute("data-img-poster")) {
          if (n.getAttribute("poster") !== url) n.setAttribute("poster", url);
        } else {
          if (n.getAttribute("src") !== url) n.setAttribute("src", url);
        }
        n.classList.add("img-cloud-applied");
      }
    });
  }

  // ---------- Public-page hydration (overrides build-time defaults live) ----------
  async function hydrateFactory() {
    if (isLocal()) return; // local uses static defaults; edits happen via /api at build time
    var st = await loadFactory();
    if (!st) return;
    var lang = (document.documentElement.lang || "en");
    var facts = st.facts;
    if (Array.isArray(facts)) {
      facts.forEach(function (f) {
        if (!f || !f.key || !f.value) return;
        var el = document.querySelector('.fact[data-fact="' + f.key + '"] strong');
        if (el) el.textContent = f.value;
      });
    } else if (facts && typeof facts === "object") {
      Object.keys(facts).forEach(function (k) {
        if (!facts[k]) return;
        var el = document.querySelector('.fact[data-fact="' + k + '"] strong');
        if (el) el.textContent = facts[k];
      });
    }
    (st.evidence || []).forEach(function (e) {
      if (!e || !e.key) return;
      var tile = document.querySelector('.ev-tile[data-ev-key="' + e.key + '"]');
      if (!tile) return;
      var cap = tile.querySelector("figcaption");
      var label = (lang === "zh" ? (e.zh || "") : (e.en || ""));
      if (cap && label) cap.textContent = label;
      if (e.img) {
        var want = "/assets/img/" + e.img;
        var existing = tile.querySelector("img");
        if (existing) {
          if (existing.getAttribute("src") !== want) existing.setAttribute("src", want);
        } else {
          tile.classList.remove("ev-icon");
          var ic = tile.querySelector(".ev-ic"); if (ic) ic.remove();
          var im = document.createElement("img");
          im.src = want; im.alt = label || e.key; im.loading = "lazy";
          if (cap) tile.insertBefore(im, cap); else tile.appendChild(im);
        }
      }
    });
  }

  window.CloudApp = {
    isLocal: isLocal,
    submitLead: submitLead,
    loadLeads: loadLeads,
    loadFactory: loadFactory,
    saveFactory: saveFactory,
    hydrateFactory: hydrateFactory,
    loadImages: loadImages,
    saveImages: saveImages,
    hydrateImages: hydrateImages,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    onAuth: function (cb) { window.addEventListener("cloud-auth", function (e) { cb(e.detail.session); }); }
  };

  // Kick off auth callback handling on load.
  if (!isLocal()) { initAuthCallback(); }
})();
