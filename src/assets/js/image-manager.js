/* 冷水机独立站 — 图片管理（云端 base64，上传即时生效，无需重新部署）
 * 依赖 window.CloudApp.loadImages / saveImages（cloud-client.js）。
 * 固定图位：替换 / 隐藏 / 恢复默认。
 * 图集（产品 4 组 + 工厂 1 组）：新增 / 删除 / 替换 / 排序 / 改说明。
 * 存储：site_images 表 id=1 的 images jsonb；图集配置放在保留键 __galleries。
 */
(function () {
  "use strict";

  // 固定图位。key 必须与前台 data-img-key 一致。
  var SLOTS = [
    { key: "prod-air-box",        name: "风冷箱式机",        def: "/assets/img/prod-air-box.jpg",        group: "产品图" },
    { key: "prod-air-large",      name: "大型风冷机组",      def: "/assets/img/prod-air-large.jpg",      group: "产品图" },
    { key: "prod-water-screw",    name: "水冷螺杆机组",      def: "/assets/img/prod-water-screw.jpg",    group: "产品图" },
    { key: "prod-low-temp",       name: "低温机组",          def: "/assets/img/prod-low-temp.jpg",       group: "产品图" },
    { key: "prod-screw-front",    name: "螺杆机正面",        def: "/assets/img/prod-screw-front.jpg",    group: "产品图" },
    { key: "prod-screw-side",     name: "螺杆机侧面",        def: "/assets/img/prod-screw-side.jpg",     group: "产品图" },
    { key: "prod-detail-coils",   name: "铜管换热器",        def: "/assets/img/prod-detail-coils.jpg",   group: "产品图" },
    { key: "prod-detail-panel",   name: "控制面板",          def: "/assets/img/prod-detail-panel.jpg",   group: "产品图" },
    { key: "ev-workshop",         name: "工厂车间",          def: "/assets/img/workshop.jpg",            group: "工厂实景" },
    { key: "ev-test",             name: "整机试机",          def: "/assets/img/test.jpg",                group: "工厂实景" },
    { key: "ev-cert",             name: "出厂检验",          def: "/assets/img/factory-test.jpg",        group: "工厂实景" },
    { key: "ev-shipping",         name: "装柜出口",          def: "/assets/img/shipping.jpg",            group: "工厂实景" },
    { key: "factory-video-poster",name: "工厂视频封面",      def: "/assets/img/factory-video-poster.jpg",group: "工厂实景" }
  ];

  // 可增删的图集。def 是站点默认图文件名，与 build.js 的 data-gallery 对应。
  var GALLERIES = [
    { key: "product:air", name: "风冷式冷水机 · 图片集", defaults: [
      { def: "prod-air-box.jpg", name: "箱式风冷机组" },
      { def: "prod-air-large.jpg", name: "大型风冷机组" },
      { def: "prod-detail-panel.jpg", name: "控制面板" }
    ]},
    { key: "product:water", name: "水冷式冷水机 · 图片集", defaults: [
      { def: "prod-water-screw.jpg", name: "水冷螺杆机组" },
      { def: "prod-detail-coils.jpg", name: "铜管换热器" },
      { def: "prod-detail-panel.jpg", name: "控制面板" }
    ]},
    { key: "product:low", name: "低温冷水机 · 图片集", defaults: [
      { def: "prod-screw-front.jpg", name: "螺杆机正面" },
      { def: "prod-detail-panel.jpg", name: "控制面板" },
      { def: "prod-detail-coils.jpg", name: "铜管换热器" }
    ]},
    { key: "product:screw", name: "螺杆式冷水机 · 图片集", defaults: [
      { def: "prod-water-screw.jpg", name: "水冷螺杆机组" },
      { def: "prod-screw-side.jpg", name: "螺杆机侧面" },
      { def: "prod-detail-panel.jpg", name: "控制面板" }
    ]},
    { key: "factory", name: "工厂实景 · 图片集", defaults: [
      { def: "workshop.jpg", name: "生产车间与组装产线" },
      { def: "test.jpg", name: "整机试机与运行检测" },
      { def: "factory-test.jpg", name: "出厂前质量检验" },
      { def: "shipping.jpg", name: "打包装柜与出口发运" }
    ]}
  ];

  var MAX_W = 1600, MAX_H = 1600, QUALITY = 0.82;
  var SIZE_LIMIT = 12 * 1024 * 1024; // 云端 JSON 总大小保护
  var state = {};     // 固定图位 key -> dataURL / "__hidden__"
  var galleries = {}; // "product:air" -> [item]
  var host = null;
  var app = window.CloudApp;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function btn(label, cls, fn) {
    var b = el("button", cls, esc(label));
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function toast(msg, bad) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast on" + (bad ? " bad" : "");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.className = "toast"; }, 3600);
  }
  function uid() {
    return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // 压缩为 JPEG dataURL，控制体积（云端 JSON 存储）。
  function compressToDataUrl(file, cb) {
    var reader = new FileReader();
    reader.onerror = function () { cb(null, "读取文件失败"); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { cb(null, "图片解码失败"); };
      img.onload = function () {
        var w = img.width, h = img.height, r = Math.min(1, MAX_W / w, MAX_H / h);
        w = Math.round(w * r); h = Math.round(h * r);
        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        var ctx = cv.getContext("2d");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        var data = cv.toDataURL("image/jpeg", QUALITY);
        if (data.length > 1.6 * 1024 * 1024) data = cv.toDataURL("image/jpeg", 0.65);
        cb(data, null);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function pickFiles(multiple, cb) {
    var inp = el("input");
    inp.type = "file"; inp.accept = "image/*"; inp.multiple = !!multiple;
    inp.style.display = "none";
    inp.addEventListener("change", function () {
      var fs = Array.prototype.slice.call(inp.files || []);
      inp.value = "";
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      if (fs.length) cb(fs);
    });
    document.body.appendChild(inp);
    inp.click();
  }

  function compressAll(files, cb) {
    var out = [];
    var tooBig = 0;
    function next(i) {
      if (i >= files.length) { cb(out, tooBig); return; }
      if (files[i].size > 20 * 1024 * 1024) { tooBig++; next(i + 1); return; }
      compressToDataUrl(files[i], function (data, err) {
        if (data) out.push(data);
        else if (err) toast(err, true);
        next(i + 1);
      });
    }
    next(0);
  }

  function save(nextState, nextGalleries, msg) {
    if (!app || !app.saveImages) { toast("云服务未就绪", true); return; }
    var payload = {};
    Object.keys(nextState).forEach(function (k) { payload[k] = nextState[k]; });
    payload.__galleries = nextGalleries;
    if (JSON.stringify(payload).length > SIZE_LIMIT) {
      toast("云端图片总量超过 12MB，请先删除一些已上传图片再添加", true);
      return;
    }
    toast("正在保存到云端…");
    app.saveImages(payload).then(function (ok) {
      if (!ok) { toast("保存失败，请稍后重试", true); return; }
      state = nextState; galleries = nextGalleries;
      render();
      toast(msg || "已保存，刷新网站即可看到");
    });
  }

  function writeSlot(key, val, msg) {
    var n = {};
    Object.keys(state).forEach(function (k) { if (k !== key) n[k] = state[k]; });
    if (val !== null) n[key] = val;
    save(n, galleries, msg);
  }

  function writeGallery(key, items, msg) {
    var g = {};
    Object.keys(galleries).forEach(function (k) { if (k !== key) g[k] = galleries[k]; });
    if (items !== null) g[key] = items;
    save(state, g, msg);
  }

  function itemsFor(gal) {
    var cfg = galleries[gal.key];
    if (Array.isArray(cfg)) return cfg.map(function (x) {
      return { id: x.id || uid(), def: x.def || "", src: x.src || "", cap: x.cap || "" };
    });
    return gal.defaults.map(function (d) {
      return { id: "def-" + d.def, def: d.def, src: "", cap: "" };
    });
  }

  function defaultSrc(gal, def) {
    for (var i = 0; i < gal.defaults.length; i++) {
      if (gal.defaults[i].def === def) return "/assets/img/" + def;
    }
    return "/assets/img/" + (def || "");
  }
  function defaultName(gal, def) {
    for (var i = 0; i < gal.defaults.length; i++) {
      if (gal.defaults[i].def === def) return gal.defaults[i].name;
    }
    return "默认图片";
  }

  function thumb(src, fallback) {
    var box = el("div", "img-thumb");
    if (!src) { box.appendChild(el("span", "ph", "（已隐藏）")); return box; }
    var im = el("img");
    im.src = src; im.alt = ""; im.loading = "lazy";
    im.onerror = function () { box.innerHTML = '<span class="ph">（无预览图）</span>'; };
    box.appendChild(im);
    return box;
  }

  function renderFixed(sec) {
    sec.appendChild(el("p", "sec-sub",
      "固定展示位：可上传替换、临时隐藏或恢复默认。隐藏后前台不再显示该图；恢复默认会删掉云端上传的版本。"));
    var grid = el("div", "img-grid");
    var groups = {};
    SLOTS.forEach(function (s) { (groups[s.group] = groups[s.group] || []).push(s); });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (slot) {
        var val = state[slot.key];
        var hidden = val === "__hidden__";
        var card = el("div", "img-card");
        card.appendChild(thumb(hidden ? "" : (val || slot.def)));
        var meta = el("div", "img-meta");
        var badge = hidden
          ? '<span class="img-badge hide">已隐藏</span>'
          : (val ? '<span class="img-badge cloud">已替换</span>' : '<span class="img-badge def">默认</span>');
        meta.appendChild(el("div", "nm", esc(slot.name) + badge));
        meta.appendChild(el("div", "ds", esc(slot.group + " · " + slot.key)));
        var acts = el("div", "acts");
        acts.appendChild(btn("上传替换", "primary", function () {
          pickFiles(false, function (fs) {
            var f = fs[0];
            if (f.size > 20 * 1024 * 1024) { toast("图片超过 20MB，请压缩后再传", true); return; }
            toast("正在处理 " + slot.name + "…");
            compressToDataUrl(f, function (data, err) {
              if (err) { toast(err, true); return; }
              if (!data) { toast("处理失败", true); return; }
              writeSlot(slot.key, data, slot.name + " 已更新，刷新网站即可看到");
            });
          });
        }));
        if (val && !hidden) {
          acts.appendChild(btn("恢复默认", null, function () {
            writeSlot(slot.key, null, slot.name + " 已恢复默认图");
          }));
        }
        acts.appendChild(btn(hidden ? "恢复显示" : "隐藏此图", null, function () {
          writeSlot(slot.key, hidden ? null : "__hidden__",
            slot.name + (hidden ? " 已恢复显示" : " 已隐藏"));
        }));
        meta.appendChild(acts);
        card.appendChild(meta);
        grid.appendChild(card);
      });
    });
    sec.appendChild(grid);
  }

  function renderGallery(sec, gal) {
    var items = itemsFor(gal);
    var wrap = el("div", "gal-wrap");
    var head = el("div", "gal-head");
    head.appendChild(el("h3", null, esc(gal.name)));
    head.appendChild(el("code", null, items.length + " 张"));
    head.appendChild(btn("+ 添加图片", "primary", function () {
      pickFiles(true, function (fs) {
        toast("正在处理 " + fs.length + " 张图片…");
        compressAll(fs, function (dataList, tooBig) {
          if (!dataList.length) { toast("没有可用的图片", true); return; }
          var next = itemsFor(gal);
          dataList.forEach(function (d) {
            next.push({ id: uid(), def: "", src: d, cap: "" });
          });
          writeGallery(gal.key, next,
            "已添加 " + dataList.length + " 张" + (tooBig ? "（" + tooBig + " 张超过 20MB 已跳过）" : ""));
        });
      });
    }));
    head.appendChild(btn("恢复整组默认", null, function () {
      if (!window.confirm("确定删除这一组的全部改动，恢复站点默认图片吗？")) return;
      writeGallery(gal.key, null, gal.name + " 已恢复默认");
    }));
    wrap.appendChild(head);

    var grid = el("div", "img-grid");
    if (!items.length) wrap.appendChild(el("p", "sec-sub", "这一组目前是空的，点「+ 添加图片」上传。"));
    items.forEach(function (item, idx) {
      var isNew = !item.def;
      var changed = !!item.src;
      var card = el("div", "img-card");
      card.appendChild(thumb(item.src || defaultSrc(gal, item.def)));
      var meta = el("div", "img-meta");
      var badge = isNew
        ? '<span class="img-badge new">新增</span>'
        : (changed ? '<span class="img-badge cloud">已替换</span>' : '<span class="img-badge def">默认</span>');
      meta.appendChild(el("div", "nm", "第 " + (idx + 1) + " 张" + badge));
      meta.appendChild(el("div", "ds", esc(isNew ? "后台新增图片" : defaultName(gal, item.def))));

      var cap = el("input", "cap-input");
      cap.type = "text";
      cap.value = item.cap || "";
      cap.placeholder = "图片说明（留空 = 用默认说明）";
      cap.addEventListener("change", function () {
        var next = itemsFor(gal);
        if (!next[idx]) return;
        next[idx].cap = cap.value.trim();
        writeGallery(gal.key, next, "图片说明已更新");
      });
      meta.appendChild(cap);

      var acts = el("div", "acts");
      acts.appendChild(btn("替换", "primary", function () {
        pickFiles(false, function (fs) {
          var f = fs[0];
          if (f.size > 20 * 1024 * 1024) { toast("图片超过 20MB，请压缩后再传", true); return; }
          toast("正在处理图片…");
          compressToDataUrl(f, function (data, err) {
            if (err) { toast(err, true); return; }
            if (!data) { toast("处理失败", true); return; }
            var next = itemsFor(gal);
            if (!next[idx]) return;
            next[idx].src = data;
            writeGallery(gal.key, next, "第 " + (idx + 1) + " 张已替换");
          });
        });
      }));
      if (changed && !isNew) {
        acts.appendChild(btn("用原图", null, function () {
          var next = itemsFor(gal);
          if (!next[idx]) return;
          next[idx].src = "";
          writeGallery(gal.key, next, "第 " + (idx + 1) + " 张已恢复原图");
        }));
      }
      acts.appendChild(btn("删除", null, function () {
        var next = itemsFor(gal);
        next.splice(idx, 1);
        writeGallery(gal.key, next, "第 " + (idx + 1) + " 张已删除");
      }));
      if (idx > 0) {
        acts.appendChild(btn("←", null, function () {
          var next = itemsFor(gal);
          var t = next[idx - 1]; next[idx - 1] = next[idx]; next[idx] = t;
          writeGallery(gal.key, next, "顺序已调整");
        }));
      }
      if (idx < items.length - 1) {
        acts.appendChild(btn("→", null, function () {
          var next = itemsFor(gal);
          var t = next[idx + 1]; next[idx + 1] = next[idx]; next[idx] = t;
          writeGallery(gal.key, next, "顺序已调整");
        }));
      }
      meta.appendChild(acts);
      card.appendChild(meta);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    sec.appendChild(wrap);
  }

  function render() {
    if (!host) return;
    host.innerHTML = "";
    var sec1 = el("div", "sec");
    var head1 = el("div", "sec-head");
    head1.appendChild(el("h2", null, "图片管理 · 固定展示位"));
    head1.appendChild(el("code", null, "上传即时生效"));
    sec1.appendChild(head1);
    renderFixed(sec1);
    host.appendChild(sec1);

    var sec2 = el("div", "sec");
    var head2 = el("div", "sec-head");
    head2.appendChild(el("h2", null, "图片管理 · 可增删图集"));
    head2.appendChild(el("code", null, "新增 / 删除 / 替换 / 排序"));
    sec2.appendChild(head2);
    sec2.appendChild(el("p", "sec-sub",
      "这里控制产品详情页和工厂实景页的图片张数。添加可一次选多张；删除只是移除图集，不会删掉网站默认文件。" +
      "图片说明留空时自动沿用原来的多语言说明。（改动自动保存，无需登录）"));
    GALLERIES.forEach(function (g) { renderGallery(sec2, g); });
    host.appendChild(sec2);
  }

  function load() {
    if (!app || !app.loadImages) {
      host.innerHTML = '<div class="sec"><p class="sec-sub">图片管理服务未就绪（云客户端未加载）。</p></div>';
      return;
    }
    app.loadImages().then(function (m) {
      state = {}; galleries = {};
      m = m || {};
      Object.keys(m).forEach(function (k) {
        if (k === "__galleries") {
          if (m[k] && typeof m[k] === "object" && !Array.isArray(m[k])) galleries = m[k];
        } else {
          state[k] = m[k];
        }
      });
      render();
    });
  }

  function init() {
    host = document.getElementById("imageHost");
    if (!host) return;
    load();
  }

  window.addEventListener("cloud-auth", function () { if (host) load(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
