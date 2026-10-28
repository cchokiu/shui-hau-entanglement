/* 互動地圖：訪客「加入你的地點」。
   選點 → 表單 → POST 到 CONFIG.GUESTBOOK_URL（欄位：name、message、species、lat、lng、website）。
   地點經審批（Sheet 的 approved 改為 yes）後才會公開。
   GUESTBOOK_URL 為空，或載入失敗時，隱藏按鈕，不顯示錯誤。 */
(function () {
  "use strict";

  var SH = window.SHMap;
  var CONFIG = window.CONFIG || {};
  var URL_ = CONFIG.GUESTBOOK_URL || "";
  if (!SH || !SH.map || !window.L || !URL_) return;

  var map = SH.map;
  var panel = SH.panel;
  var wrap = document.getElementById("catMapWrap");
  var SPECIES = ["沙白", "水牛", "黃牛", "水稻", "人", "其他"];
  var BOUNDS = { latMin: 22.15, latMax: 22.35, lngMin: 113.80, lngMax: 114.10 };

  var picking = false;
  var sending = false;
  var tempMarker = null;
  var hintEl = null;
  var control = null;
  var btnEl = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function inBounds(ll) {
    return ll.lat >= BOUNDS.latMin && ll.lat <= BOUNDS.latMax &&
      ll.lng >= BOUNDS.lngMin && ll.lng <= BOUNDS.lngMax;
  }

  function showHint(text) {
    if (!hintEl) {
      hintEl = el("p", "contribute-hint");
      hintEl.setAttribute("role", "status");
      wrap.appendChild(hintEl);
    }
    hintEl.textContent = text;
    hintEl.hidden = false;
  }

  function hideHint() {
    if (hintEl) hintEl.hidden = true;
  }

  function removeTemp() {
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  }

  /* 結束選點模式，回到全部資料清單 */
  function exitMode() {
    picking = false;
    sending = false;
    wrap.classList.remove("is-picking");
    hideHint();
    map.off("click", onPick);
    removeTemp();
    if (btnEl) btnEl.disabled = false;
    SH.resetPanel();
  }

  /* ---------- 選點 ---------- */

  function startPicking() {
    if (picking || sending) return;
    picking = true;
    if (btnEl) btnEl.disabled = true;
    wrap.classList.add("is-picking");
    showHint("在地圖上點一下，放置你的地點");
    map.on("click", onPick);
  }

  function onPick(e) {
    map.off("click", onPick);
    wrap.classList.remove("is-picking");
    hideHint();
    removeTemp();
    tempMarker = L.marker(e.latlng, {
      draggable: true,
      icon: L.divIcon({ className: "visitor-dot is-temp", html: "", iconSize: [18, 18], iconAnchor: [9, 9] }),
      title: "拖動以調整位置",
      alt: "你的地點（可拖動）"
    }).addTo(map);
    showForm();
  }

  /* ---------- 表單 ---------- */

  function showForm() {
    panel.textContent = "";
    var back = el("button", "free-back", "← 取消");
    back.type = "button";
    back.addEventListener("click", cancel);
    panel.appendChild(back);
    panel.appendChild(el("h2", "stop-title", "加入你的地點"));
    panel.appendChild(el("p", "para", "可拖動地圖上的標記，調整位置。"));

    var form = el("form", "guestbook-form contribute-form");
    form.noValidate = true;

    var nameLabel = el("label", "guestbook-label", "稱呼（選填）");
    var nameInput = el("input", "guestbook-input");
    nameInput.type = "text";
    nameInput.name = "name";
    nameInput.maxLength = 40;
    nameLabel.appendChild(nameInput);

    var msgLabel = el("label", "guestbook-label", "你在這裏看見或想起甚麼？（必填）");
    var msgInput = el("textarea", "guestbook-textarea");
    msgInput.name = "message";
    msgInput.maxLength = 500;
    msgInput.rows = 5;
    var counter = el("p", "guestbook-status", "0 / 500");
    msgInput.addEventListener("input", function () {
      counter.textContent = msgInput.value.length + " / 500";
    });
    msgLabel.appendChild(msgInput);
    msgLabel.appendChild(counter);

    var spLabel = el("label", "guestbook-label", "相關物種");
    var spSelect = el("select", "guestbook-input");
    spSelect.name = "species";
    SPECIES.forEach(function (s) {
      var o = el("option", null, s);
      o.value = s;
      spSelect.appendChild(o);
    });
    spLabel.appendChild(spSelect);

    /* honeypot：對人類隱藏；有值就會被後端靜默丟棄 */
    var hp = el("input", "guestbook-hp");
    hp.type = "text";
    hp.name = "website";
    hp.tabIndex = -1;
    hp.autocomplete = "off";
    hp.setAttribute("aria-hidden", "true");

    var consentLabel = el("label", "guestbook-label contribute-consent");
    var consent = el("input");
    consent.type = "checkbox";
    consent.name = "consent";
    consentLabel.appendChild(consent);
    consentLabel.appendChild(document.createTextNode(" 我明白內容經審批後才會公開，請勿填寫個人資料"));

    var status = el("p", "guestbook-status contribute-msg");
    status.setAttribute("role", "status");

    var actions = el("div", "contribute-actions");
    var submit = el("button", "btn btn--next guestbook-submit", "送出");
    submit.type = "submit";
    var cancelBtn = el("button", "btn", "取消");
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", cancel);
    actions.appendChild(submit);
    actions.appendChild(cancelBtn);

    form.append(nameLabel, msgLabel, spLabel, hp, consentLabel, status, actions);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(form, submit, status);
    });
    panel.appendChild(form);
    panel.scrollTop = 0;
    msgInput.focus();
  }

  function setStatus(node, text) {
    node.textContent = text;
  }

  function send(form, submitBtn, status) {
    if (sending || !tempMarker) return;
    var message = form.elements.message.value.trim();
    if (!message) {
      setStatus(status, "請填寫你看見或想起的內容。");
      return;
    }
    if (!form.elements.consent.checked) {
      setStatus(status, "請先勾選同意項目。");
      return;
    }
    var ll = tempMarker.getLatLng();
    if (!inBounds(ll)) {
      setStatus(status, "請把標記放在水口範圍內。");
      return;
    }

    var fd = new FormData();
    fd.append("name", form.elements.name.value.trim());
    fd.append("message", message);
    fd.append("species", form.elements.species.value);
    fd.append("lat", ll.lat.toFixed(6));
    fd.append("lng", ll.lng.toFixed(6));
    fd.append("website", form.elements.website.value);

    sending = true;
    submitBtn.disabled = true;
    setStatus(status, "送出中…");
    fetch(URL_, { method: "POST", body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.success) throw new Error("rejected");
        exitMode();
        panel.insertBefore(el("p", "para contribute-thanks", "謝謝！地點審批後會顯示在地圖上。"), panel.firstChild);
      })
      .catch(function () {
        sending = false;
        submitBtn.disabled = false;
        setStatus(status, "暫時未能送出，請稍後再試。");
      });
  }

  function cancel() {
    if (sending) return;
    exitMode();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && (picking || tempMarker)) cancel();
  });

  /* ---------- 按鈕（Leaflet control） ---------- */

  var Ctrl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      var box = L.DomUtil.create("div", "leaflet-bar contribute-control");
      var b = L.DomUtil.create("button", "contribute-btn", box);
      b.type = "button";
      b.textContent = "＋ 加入你的地點";
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.on(b, "click", function (e) {
        L.DomEvent.stop(e);
        startPicking();
      });
      btnEl = b;
      return box;
    }
  });
  control = new Ctrl();
  control.addTo(map);

  /* 載入已核准的訪客地點；失敗時隱藏按鈕，不顯示錯誤 */
  fetch(URL_, { method: "GET", headers: { Accept: "application/json" } })
    .then(function (r) { return r.json(); })
    .then(function (list) {
      if (!Array.isArray(list)) throw new Error("bad list");
      SH.addVisitorPoints(list.filter(function (v) {
        return typeof v.lat === "number" && typeof v.lng === "number";
      }));
    })
    .catch(function () {
      if (control) control.remove();
    });
})();
