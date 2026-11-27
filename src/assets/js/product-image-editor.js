/* 产品页内图片编辑器。
 * 只有持有效后台 token（/admin?token=... 写入的 7 天 cookie）的访客才会看到控件。
 * 产品详情页：图集可替换 / 删除 / 新增 / 排序；产品列表页：封面可替换。
 * 保存仍走 CloudApp.saveImages，写权限要求 WorkBuddy 账号登录。
 */
(function () {
  "use strict";

  var app = window.CloudApp;
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var state = {}, galleries = {}, allowed = false;
  var toastTimer = null;

  function injectCss() {
    var css = [
      ".pie-bar{position:fixed;right:18px;bottom:86px;z-index:70;display:flex;flex-direction:column;gap:8px;align-items:flex-end}",
      ".pie-fab{border:0;border-radius:999px;padding:10px 15px;background:#0b6bcb;color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(11,107,203,.28)}",
      ".pie-fab.off{background:#64748b}",
      ".pie-tip{font-size:11px;color:#475569;background:rgba(255,255,255,.94);border:1px solid #dbe3ec;border-radius:8px;padding:5px 8px;max-width:210px;text-align:right}",
      ".prod-tile,.series-cover{position:relative}",
      ".pie-tools{display:none;position:absolute;left:6px;right:6px;bottom:6px;gap:4px;flex-wrap:wrap;justify-content:center;background:rgba(15,23,42,.82);border-radius:8px;padding:5px}",
      "body.pie-on .pie-tools{display:flex}",
      ".pie-tools button{border:0;border-radius:5px;padding:3px 7px;font-size:11px;line-height:1.4;background:#fff;color:#0f172a;cursor:pointer}",
      ".pie-tools button.danger{background:#fee2e2;color:#991b1b}",
      ".pie-add{display:none;align-items:center;justify-content:center;min-height:230px;border:2px dashed #94a3b8;border-radius:12px;background:#f8fafc;color:#475569;font-size:13px;cursor:pointer}",
      "body.pie-on .pie-add{display:flex}",
      ".pie-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:90;background:#0f172a;color:#fff;border-radius:8px;padding:9px 15px;font-size:13px;opacity:0;pointer-events:none;transition:.2s}",
      ".pie-toast.on{opacity:1}",
      ".pie-toast.bad{background:#991b1b}"
    ].join("");
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  }

  function toast(msg, bad) {
    var t = document.getElementById("pieToast");
    t.textContent = msg;
    t.className = "pie-toast on" + (bad ? " bad" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "pie-toast"; }, 3200);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function compress(file, cb) {
    var rd = new FileReader();
    rd.onerror = function () { cb(null, "读取文件失败"); };
    rd.onload = function () {
      var im = new Image();
      im.onerror = function () { cb(null, "图片解码失败"); };
      im.onload = function () {
        // 1200px / 0.72 keeps product photos sharp while keeping the base64
        // payload small. Cloudflare adds ~1s per 30KB on browser POSTs, so a
        // smaller image means saving finishes in a few seconds instead of 15+.
        var w = im.width, h = im.height, r = Math.min(1, 1200 / w, 1200 / h);
        w = Math.round(w * r); h = Math.round(h * r);
        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        var cx = cv.getContext("2d");
        cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h);
        cx.drawImage(im, 0, 0, w, h);
        var d = cv.toDataURL("image/jpeg", 0.72);
        if (d.length > 160 * 1024) d = cv.toDataURL("image/jpeg", 0.55);
        cb(d, null);
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  function pick(multiple, cb) {
    var f = document.createElement("input");
    f.type = "file"; f.accept = "image/*"; f.multiple = !!multiple; f.style.display = "none";
    f.addEventListener("change", function () {
      var fs = Array.prototype.slice.call(f.files || []);
      f.value = "";
      if (fs.length) cb(fs);
    });
    document.body.appendChild(f);
    f.click();
  }

  function uid() {
    return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  async function finish(ok, msg) {
    if (!ok) { toast("保存失败，请稍后重试", true); return; }
    toast(msg || "已保存，正在刷新…");
    setTimeout(function () { location.reload(); }, 600);
  }

  function writeSlot(key, val, msg) {
    if (!app || !app.saveSlot) { toast("云服务未就绪", true); return; }
    if (val && String(val).length > 1.6 * 1024 * 1024) { toast("单张图片太大，请换一张", true); return; }
    toast("正在保存…");
    app.saveSlot(key, val).then(function (ok) { finish(ok, msg); });
  }

  function writeGallery(key, items, msg) {
    if (!app || !app.saveGallery) { toast("云服务未就绪", true); return; }
    var size = items ? JSON.stringify(items).length : 0;
    if (size > 6 * 1024 * 1024) { toast("本组图片太大，请先删除一些", true); return; }
    toast("正在保存…");
    app.saveGallery(key, items).then(function (ok) { finish(ok, msg); });
  }

  function itemsFor(series, box) {
    // 始终以页面上"当前真正显示的图块"为准，避免用旧快照删除/替换时
    // 把刚新增或刚替换的图片弄丢。
    var cfg = galleries["product:" + series];
    return Array.prototype.map.call(box.querySelectorAll(".prod-tile"), function (fig, i) {
      var im = fig.querySelector("img"), cp = fig.querySelector("figcaption");
      var src = im ? (im.getAttribute("src") || "") : "";
      var key = im ? (im.getAttribute("data-img-key") || "") : "";
      var stored = Array.isArray(cfg) ? cfg[i] : null;
      // 默认站点图的 src 是相对路径，保存时用空 src + def 让前台回退到默认图。
      // 只有 base64/外链才是用户上传的真实内容。
      var userSrc = /^(data:image\/|https?:\/\/)/.test(src) ? src : "";
      return {
        id: (stored && stored.id) || (key ? "def-" + key : "def-" + i),
        def: key || (stored && stored.def) || "",
        src: userSrc || (stored && stored.src) || "",
        cap: cp ? cp.textContent : ((stored && stored.cap) || "")
      };
    });
  }

  function button(label, cls, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls || "";
    b.textContent = label;
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
    return b;
  }

  function decorateGallery(box) {
    // build.js 写的是 data-gallery="air"；云端配置键才是 "product:air"。
    var series = box.getAttribute("data-gallery");
    var tiles = Array.prototype.slice.call(box.querySelectorAll(".prod-tile"));
    var items = itemsFor(series, box);

    tiles.forEach(function (tile, idx) {
      if (tile.querySelector(".pie-tools")) return;
      var bar = document.createElement("div");
      bar.className = "pie-tools";
      bar.appendChild(button("替换", "", function () {
        pick(false, function (fs) {
          var f = fs[0];
          if (f.size > 20 * 1024 * 1024) { toast("图片超过 20MB", true); return; }
          toast("正在处理…");
          compress(f, function (d, err) {
            if (err) { toast(err, true); return; }
            var next = itemsFor(series, box);
            if (!next[idx]) return;
            next[idx].src = d;
            writeGallery("product:" + series, next, "第 " + (idx + 1) + " 张已替换");
          });
        });
      }));
      bar.appendChild(button("删除", "danger", function () {
        var next = itemsFor(series, box);
        next.splice(idx, 1);
        writeGallery("product:" + series, next, "第 " + (idx + 1) + " 张已删除");
      }));
      if (idx > 0) {
        bar.appendChild(button("←", "", function () {
          var next = itemsFor(series, box);
          var t = next[idx - 1]; next[idx - 1] = next[idx]; next[idx] = t;
          writeGallery("product:" + series, next, "顺序已调整");
        }));
      }
      if (idx < tiles.length - 1) {
        bar.appendChild(button("→", "", function () {
          var next = itemsFor(series, box);
          var t = next[idx + 1]; next[idx + 1] = next[idx]; next[idx] = t;
          writeGallery("product:" + series, next, "顺序已调整");
        }));
      }
      tile.appendChild(bar);
    });

    if (!box.querySelector(".pie-add")) {
      var add = document.createElement("div");
      add.className = "pie-add";
      add.textContent = "＋ 添加图片";
      add.addEventListener("click", function () {
        pick(true, function (fs) {
          toast("正在处理 " + fs.length + " 张图片…");
          var out = [];
          function step(i) {
            if (i >= fs.length) {
              if (!out.length) { toast("没有可用图片", true); return; }
              var next = itemsFor(series, box);
              out.forEach(function (d) { next.push({ id: uid(), def: "", src: d, cap: "" }); });
              writeGallery("product:" + series, next, "已添加 " + out.length + " 张图片");
              return;
            }
            if (fs[i].size > 20 * 1024 * 1024) { step(i + 1); return; }
            compress(fs[i], function (d, err) {
              if (d) out.push(d);
              step(i + 1);
            });
          }
          step(0);
        });
      });
      box.appendChild(add);
    }
  }

  function decorateCovers() {
    if (!/\/products\.html(?:[?#]|$)/.test(location.pathname)) return;
    var imgs = document.querySelectorAll(".series-cover img[data-img-key]");
    Array.prototype.forEach.call(imgs, function (im) {
      var card = im.closest(".series-cover");
      if (!card || card.querySelector(".pie-tools")) return;
      var key = im.getAttribute("data-img-key");
      var bar = document.createElement("div");
      bar.className = "pie-tools";
      bar.appendChild(button("替换封面", "", function () {
        pick(false, function (fs) {
          var f = fs[0];
          if (f.size > 20 * 1024 * 1024) { toast("图片超过 20MB", true); return; }
          compress(f, function (d, err) {
            if (err) { toast(err, true); return; }
            writeSlot(key, d, "封面已替换");
          });
        });
      }));
      if (state[key]) {
        bar.appendChild(button("恢复默认", "", function () { writeSlot(key, null, "封面已恢复默认"); }));
      }
      card.appendChild(bar);
    });
  }

  function setup() {
    injectCss();
    var t = document.createElement("div");
    t.id = "pieToast"; t.className = "pie-toast";
    document.body.appendChild(t);

    var bar = document.createElement("div");
    bar.className = "pie-bar";
    var tip = document.createElement("div");
    tip.className = "pie-tip";
    tip.textContent = "仅授权账号可见 · 改动实时生效";
    // 授权后默认直接进入编辑模式，避免用户以为按钮点不动。
    document.body.classList.add("pie-on");
    var fab = button("✅ 完成编辑（点此隐藏工具）", "pie-fab", function () {
      document.body.classList.toggle("pie-on");
      fab.textContent = document.body.classList.contains("pie-on")
        ? "✅ 完成编辑（点此隐藏工具）" : "📷 管理本页图片";
    });
    bar.appendChild(tip); bar.appendChild(fab);
    document.body.appendChild(bar);

    var boxes = document.querySelectorAll(".prod-gallery[data-gallery]");
    Array.prototype.forEach.call(boxes, decorateGallery);
    decorateCovers();
  }

  async function init() {
    if (!app) return;
    if (LOCAL) {
      allowed = true;
    } else {
      // Cloudflare caches everything, so the token is passed explicitly on the
      // product URL once and verified with a cache-busted request. The result
      // lives in sessionStorage for the rest of this browser tab.
      var qToken = new URLSearchParams(location.search).get("token");
      if (qToken) {
        try {
          var url = "/api/editor-status?token=" + encodeURIComponent(qToken) + "&_=" + Date.now();
          var r = await fetch(url, { cache: "no-store" });
          allowed = r.ok && (await r.json()).ok === true;
        } catch (e) { allowed = false; }
        if (allowed) sessionStorage.setItem("pie_allowed", "1");
      } else {
        allowed = sessionStorage.getItem("pie_allowed") === "1";
      }
    }
    if (!allowed) return; // 普通访客完全看不到任何编辑入口
    // 先等前台把云端最新图集渲染进 DOM，再挂编辑按钮；否则按钮会挂在
    // 旧的默认图块上，且随后被 hydrateImages 重建的 DOM 冲掉。
    if (app.hydrateImages) {
      try { await app.hydrateImages(); } catch (e) {}
    }
    var m = await app.loadImages();
    m = m || {};
    Object.keys(m).forEach(function (k) {
      if (k === "__galleries") {
        if (m[k] && typeof m[k] === "object" && !Array.isArray(m[k])) galleries = m[k];
      } else state[k] = m[k];
    });
    setup();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
