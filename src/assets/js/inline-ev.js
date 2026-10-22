/* 工厂证据卡 内联编辑器。
 * - localhost：直连本地 server.js（/api/factory、/api/upload）。
 * - 已发布站点：通过 CloudApp 走真实云服务；编辑前需使用 WorkBuddy 账号登录。
 */
(function () {
  var LOCAL = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "[::1]");
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".ev-tile"));
  if (!tiles.length) return;

  // ---- 创建弹窗 ----
  var modal = document.createElement("div");
  modal.className = "ev-modal";
  modal.style.display = "none";
  modal.innerHTML =
    '<div class="ev-box">' +
      '<div class="ev-head">编辑工厂证据 <button class="ev-x" id="evX" type="button">×</button></div>' +
      '<div class="ev-body">' +
        '<div class="ev-thumb" id="evThumb">（未上传图片）</div>' +
        '<label>标题（中文）</label><input id="evZh" type="text" maxlength="40" placeholder="如：车间与产线" />' +
        '<label>标题（English）</label><input id="evEn" type="text" maxlength="40" placeholder="e.g. Workshop & production lines" />' +
        '<div class="ev-actions">' +
          '<button id="evUp" type="button" class="ev-btn">上传图片</button>' +
          '<button id="evClr" type="button" class="ev-btn ev-danger">清除图片</button>' +
          '<input id="evFile" type="file" accept="image/*" style="display:none" />' +
        '</div>' +
        '<div class="ev-msg" id="evMsg"></div>' +
      '</div>' +
      '<div class="ev-foot">' +
        '<button id="evCancel" type="button" class="ev-btn">取消</button>' +
        '<button id="evSave" type="button" class="ev-btn ev-primary">保存并发布</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var elZh = modal.querySelector("#evZh"), elEn = modal.querySelector("#evEn"),
      elThumb = modal.querySelector("#evThumb"), elMsg = modal.querySelector("#evMsg"),
      elFile = modal.querySelector("#evFile");

  var curKey = null, curImg = "", curPreview = "";

  function toast(msg, isErr) {
    elMsg.textContent = msg;
    elMsg.style.color = isErr ? "#b42318" : "#1a7f37";
  }

  function paintThumb() {
    var src = curPreview || (curImg ? "/assets/img/" + curImg : "");
    if (src) {
      elThumb.innerHTML = "";
      var im = document.createElement("img");
      im.src = src; im.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:8px";
      im.onerror = function () { elThumb.textContent = "（图片无法预览）"; };
      elThumb.appendChild(im);
    } else {
      elThumb.textContent = "（未上传图片）";
    }
  }

  function addBadges() {
    tiles.forEach(function (t) {
      var key = t.getAttribute("data-ev-key");
      if (!key) return;
      if (t.querySelector(".ev-badge")) return;
      t.classList.add("ev-editable");
      var badge = document.createElement("button");
      badge.type = "button";
      badge.className = "ev-badge";
      badge.textContent = "✏️ 改";
      badge.addEventListener("click", function (e) { e.stopPropagation(); open(key); });
      t.appendChild(badge);
    });
  }

  function addLoginHint() {
    var t = tiles[0];
    if (t.querySelector(".ev-badge")) return;
    var badge = document.createElement("button");
    badge.type = "button";
    badge.className = "ev-badge";
    badge.textContent = "🔒 登录编辑";
    badge.addEventListener("click", function (e) {
      e.stopPropagation();
      if (window.CloudApp) window.CloudApp.signIn("workbuddy");
    });
    t.appendChild(badge);
  }

  async function open(key) {
    if (!LOCAL) {
      var session = await window.CloudApp.getSession();
      if (!session) { if (window.CloudApp) window.CloudApp.signIn("workbuddy"); return; }
    }
    curKey = key; curImg = ""; curPreview = "";
    elZh.value = ""; elEn.value = "";
    toast("");
    modal.style.display = "flex";
    var j = LOCAL
      ? await fetch("/api/factory", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      : await window.CloudApp.loadFactory();
    var arr = (j && j.evidence) || [];
    var item = null;
    for (var i = 0; i < arr.length; i++) { if (arr[i].key === key) { item = arr[i]; break; } }
    if (item) {
      elZh.value = item.zh || "";
      elEn.value = item.en || "";
      curImg = item.img || "";
    }
    paintThumb();
  }

  function close() { modal.style.display = "none"; }

  modal.querySelector("#evX").addEventListener("click", close);
  modal.querySelector("#evCancel").addEventListener("click", close);
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  modal.querySelector("#evUp").addEventListener("click", function () { elFile.click(); });
  elFile.addEventListener("change", function () {
    var f = elFile.files && elFile.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast("图片超过 8MB，请先压缩", true); elFile.value = ""; return; }
    var rd = new FileReader();
    rd.onload = function () {
      toast("上传中…");
      fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: rd.result, base: curKey || "evidence" }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || "上传失败");
          curImg = j.img; curPreview = rd.result; paintThumb();
          toast("图片已上传，记得点「保存并发布」");
        })
        .catch(function (err) { toast("上传失败：" + err.message, true); });
    };
    rd.readAsDataURL(f);
  });

  modal.querySelector("#evClr").addEventListener("click", function () {
    curImg = ""; curPreview = ""; paintThumb(); toast("已清除图片，记得保存");
  });

  modal.querySelector("#evSave").addEventListener("click", async function () {
    toast("保存中…");
    var j = LOCAL
      ? await fetch("/api/factory", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      : await window.CloudApp.loadFactory();
    j = j || {};
    var arr = j.evidence || [];
    var found = false;
    arr.forEach(function (it) { if (it.key === curKey) { it.zh = elZh.value.trim(); it.en = elEn.value.trim(); it.img = curImg; found = true; } });
    if (!found) { arr.push({ key: curKey, zh: elZh.value.trim(), en: elEn.value.trim(), img: curImg }); }
    j.evidence = arr;
    var ok = LOCAL
      ? await fetch("/api/factory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(j) }).then(function (r) { return r.ok; })
      : await window.CloudApp.saveFactory(j);
    if (!ok) { toast("保存失败，请重试", true); return; }
    toast("已保存，正在刷新…");
    setTimeout(function () { location.reload(); }, 700);
  });

  // 入口：本地直接显示编辑角标；已发布站点需登录后才显示编辑入口
  if (LOCAL) {
    addBadges();
  } else if (window.CloudApp) {
    window.CloudApp.getSession().then(function (s) { s ? addBadges() : addLoginHint(); });
    window.CloudApp.onAuth(function (s) {
      if (s) { addLoginHint.__done = false; addBadges(); }
    });
  }
})();
