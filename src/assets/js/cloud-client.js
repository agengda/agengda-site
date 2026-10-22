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

  // ---------- Leads (public anon insert, authenticated read) ----------
  async function submitLead(o) {
    o = o || {};
    if (isLocal()) {
      try {
        var r = await fetch("/api/lead", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o)
        });
        return r.ok;
      } catch (e) { return false; }
    }
    var c = ensureCloud();
    if (c) {
      try {
        var row = {
          name: o.name || null, company: o.company || null, phone: o.phone || null,
          country: o.country || null, model: o.model || null, qty: o.qty || null,
          temp: o.temp || null, delivery: o.delivery || null, msg: o.msg || null,
          page: o.page || null, lang: o.lang || null, ip: o.ip || null,
          source: o.source || null, medium: o.medium || null, campaign: o.campaign || null,
          term: o.term || null, content: o.content || null,
          gclid: o.gclid || null, fbclid: o.fbclid || null, ttclid: o.ttclid || null
        };
        var res = await c.database.from("leads").insert(row).select();
        if (!res.error) return true;
        console.error("[cloud] lead insert failed", res.error);
      } catch (e) { console.error("[cloud] lead insert error", e); }
    }
    // Resilience: fall back to the local server API if the cloud write failed.
    try {
      var r2 = await fetch("/api/lead", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o)
      });
      return r2.ok;
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
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    onAuth: function (cb) { window.addEventListener("cloud-auth", function (e) { cb(e.detail.session); }); }
  };

  // Kick off auth callback handling on load.
  if (!isLocal()) { initAuthCallback(); }
})();
