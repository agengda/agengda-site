/* 冷水机独立站 — 图片管理（云端 base64，上传即时生效，无需重新部署）
 * 依赖 window.CloudApp.loadImages / saveImages（cloud-client.js）。
 * 图片以 key -> dataURL 存云端 site_images 表；前台 hydrateImages 实时覆盖。
 */
(function () {
  "use strict";

  // 所有可换图片位。key 必须与前台 data-img-key 一致。
  // def = 站点默认图路径（未上传时显示），用于缩略图预览。
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

  var MAX_W = 1600, MAX_H = 1600, QUALITY = 0.82;
  var state = {};   // key -> dataURL (云端覆盖)
  var host = null;
  var app = window.CloudApp;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function toast(msg, bad) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast on" + (bad ? " bad" : "");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.className = "toast"; }, 3200);
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
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); // 去透明底
        ctx.drawImage(img, 0, 0, w, h);
        var data = cv.toDataURL("image/jpeg", QUALITY);
        if (data.length > 1.6 * 1024 * 1024) data = cv.toDataURL("image/jpeg", 0.65);
        cb(data, null);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function render() {
    if (!host) return;
    host.innerHTML = "";
    var sec = el("div", "sec");
    var head = el("div", "sec-head");
    head.appendChild(el("h2", null, "图片管理"));
    head.appendChild(el("code", null, "上传即时生效"));
    sec.appendChild(head);
    sec.appendChild(el("p", "sec-sub",
      "在这里替换网站上的照片。上传后直接生效，不用重新部署；删除则恢复站点默认图。" +
      "（需先用 WorkBuddy 登录，且图片自动压缩后存云端）"));

    var grid = el("div", "img-grid");
    var groups = {};
    SLOTS.forEach(function (s) { (groups[s.group] = groups[s.group] || []).push(s); });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (slot) {
        var card = el("div", "img-card");
        var thumb = el("div", "img-thumb");
        var src = state[slot.key] || slot.def;
        var im = el("img");
        im.src = src; im.alt = slot.name; im.loading = "lazy";
        im.onerror = function () { thumb.innerHTML = '<span class="ph">（无预览图）</span>'; };
        thumb.appendChild(im);
        card.appendChild(thumb);

        var meta = el("div", "img-meta");
        var badge = state[slot.key]
          ? '<span class="img-badge cloud">已替换</span>'
          : '<span class="img-badge def">默认</span>';
        meta.appendChild(el("div", "nm", slot.name + badge));
        meta.appendChild(el("div", "ds", slot.group + " · " + slot.key));

        var acts = el("div", "acts");
        var file = el("input");
        file.type = "file"; file.accept = "image/*"; file.style.display = "none";
        file.addEventListener("change", function () {
          var f = file.files && file.files[0];
          if (!f) return;
          if (f.size > 20 * 1024 * 1024) { toast("图片超过 20MB，请压缩后再传", true); file.value = ""; return; }
          toast("正在处理 " + slot.name + "…");
          compressToDataUrl(f, function (data, err) {
            file.value = "";
            if (err) { toast(err, true); return; }
            if (!data) { toast("处理失败", true); return; }
            var next = {};
            Object.keys(state).forEach(function (k) { next[k] = state[k]; });
            next[slot.key] = data;
            if (!app || !app.saveImages) { toast("云服务未就绪", true); return; }
            toast("正在保存到云端…");
            app.saveImages(next).then(function (ok) {
              if (!ok) { toast("保存失败，请确认已登录", true); return; }
              state = next; render(); toast(slot.name + " 已更新，刷新网站即可看到");
            });
          });
        });
        var up = el("button", "primary", "上传替换");
        up.type = "button";
        up.addEventListener("click", function () { file.click(); });
        acts.appendChild(up); acts.appendChild(file);

        if (state[slot.key]) {
          var del = el("button", null, "恢复默认");
          del.type = "button";
          del.addEventListener("click", function () {
            var next = {};
            Object.keys(state).forEach(function (k) { if (k !== slot.key) next[k] = state[k]; });
            app.saveImages(next).then(function (ok) {
              if (!ok) { toast("保存失败，请确认已登录", true); return; }
              state = next; render(); toast(slot.name + " 已恢复默认图");
            });
          });
          acts.appendChild(del);
        }
        meta.appendChild(acts);
        card.appendChild(meta);
        grid.appendChild(card);
      });
    });
    sec.appendChild(grid);
    host.appendChild(sec);
  }

  function init() {
    host = document.getElementById("imageHost");
    if (!host) return;
    if (app && app.loadImages) {
      app.loadImages().then(function (m) { state = m || {}; render(); });
    } else {
      host.innerHTML = '<div class="sec"><p class="sec-sub">图片管理服务未就绪（云客户端未加载）。</p></div>';
    }
  }

  // 登录后重新加载（匿名读到的是当前覆盖；登录后才能写）。
  window.addEventListener("cloud-auth", function () {
    if (app && app.loadImages) app.loadImages().then(function (m) { state = m || {}; render(); });
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
