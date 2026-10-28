/* 互動地圖頁：Data Catalogue 每一項資料一個點（data/catalogue-points.js 的 CATALOGUE_ITEMS）。
   位置為大約位置；同一地點的點已分散，方便點選。hash：#item=ID。 */
(function () {
  "use strict";

  var ITEMS = window.CATALOGUE_ITEMS || [];
  var UNPLACED = window.CATALOGUE_UNPLACED || [];
  var DEFAULT_CENTER = [22.2195, 113.9165];
  var DEFAULT_ZOOM = 15;
  var DETAIL_ZOOM = 17;

  var wrap = document.getElementById("catMapWrap");
  var mapNote = document.getElementById("catMapNote");
  var panel = document.getElementById("catPanel");
  var statusEl = document.getElementById("status");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileMQ = window.matchMedia("(max-width: 899px)");

  var map = null;
  var markerLayer = null;
  var tileStat = { ok: 0, bad: 0 };
  var selectedId = null;
  var byId = {};
  ITEMS.forEach(function (it) { byId[it.id] = it; });

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function announce(text) {
    statusEl.textContent = text;
  }

  function fitPad() {
    return mobileMQ.matches ? 40 : 48;
  }

  /* ---------- 地圖 ---------- */

  function updateTileState() {
    var off = (tileStat.ok === 0 && tileStat.bad > 0) || navigator.onLine === false;
    wrap.classList.toggle("is-tiles-off", off);
    mapNote.hidden = !off;
    mapNote.textContent = off
      ? "底圖未能載入（離線或網絡不穩）。地點位置仍然正確，可照常使用。"
      : "";
  }

  function initMap() {
    if (!window.L) {
      mapNote.hidden = false;
      mapNote.textContent = "地圖程式庫未能載入，請重新整理。";
      return;
    }
    map = L.map("catMap", { zoomControl: true, attributionControl: true, zoomSnap: 1, zoomDelta: 1 });

    var satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "衛星影像 © Esri, Maxar, Earthstar Geographics" }
    );
    var street = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "© OpenStreetMap contributors" }
    );
    [satellite, street].forEach(function (layer) {
      layer.on("tileload", function () { tileStat.ok++; updateTileState(); });
      layer.on("tileerror", function () { tileStat.bad++; updateTileState(); });
    });
    satellite.addTo(map);
    L.control.layers({ "衛星影像": satellite, "街道地圖": street }, null, { position: "topright" }).addTo(map);
    map.on("baselayerchange", function () {
      tileStat = { ok: 0, bad: 0 };
      updateTileState();
    });
    window.addEventListener("online", function () {
      tileStat = { ok: 0, bad: 0 };
      updateTileState();
    });
    markerLayer = L.layerGroup().addTo(map);
    updateTileState();
  }

  /* 總覽：包住全部點；沒有資料時置中於預設位置 */
  function fitAll() {
    if (!map) return;
    if (ITEMS.length) {
      var pts = ITEMS.map(function (it) { return [it.lat, it.lng]; });
      var p = fitPad();
      map.fitBounds(L.latLngBounds(pts), { padding: [p, p], animate: false, maxZoom: DEFAULT_ZOOM });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
    }
  }

  function dotIcon(current) {
    var size = current ? 20 : 14;
    return L.divIcon({
      className: "cat-dot" + (current ? " is-current" : ""),
      html: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  function renderMarkers() {
    if (!map) return;
    markerLayer.clearLayers();
    ITEMS.forEach(function (it) {
      var current = it.id === selectedId;
      var marker = L.marker([it.lat, it.lng], {
        icon: dotIcon(current),
        title: it.summary,
        alt: it.summary,
        keyboard: true,
        zIndexOffset: current ? 1000 : 0
      });
      marker.on("click", function () { select(it.id); });
      markerLayer.addLayer(marker);
    });
  }

  /* ---------- 側欄 ---------- */

  function renderIndex() {
    panel.appendChild(el("p", "para", "點選地圖上的圓點，查看相關的田野資料。"));
    var list = el("ul", "free-list");
    ITEMS.forEach(function (it) {
      var li = el("li");
      var b = el("button", "free-item", it.summary);
      b.type = "button";
      var sub = [it.topic, it.form].filter(Boolean).join("．");
      if (sub) b.appendChild(el("span", "free-sub", sub));
      b.addEventListener("click", function () { select(it.id); });
      li.appendChild(b);
      list.appendChild(li);
    });
    panel.appendChild(list);

    if (UNPLACED.length) {
      panel.appendChild(el("h2", "meet-heading free-heading", "位置待定"));
      var ul = el("ul", "cat-unplaced");
      UNPLACED.forEach(function (u) {
        var sub = [u.topic, u.form].filter(Boolean).join("．");
        ul.appendChild(el("li", null, sub ? u.summary + "（" + sub + "）" : u.summary));
      });
      panel.appendChild(ul);
    }
    panel.appendChild(el("p", "panel-foot", "位置為大約位置"));
  }

  function renderItem(it) {
    var back = el("button", "free-back", "← 返回全部資料");
    back.type = "button";
    back.addEventListener("click", clearSelection);
    panel.appendChild(back);

    panel.appendChild(el("h2", "stop-title", it.summary));
    if (it.topic) panel.appendChild(el("p", "para", "對應主題：" + it.topic));
    if (it.place) panel.appendChild(el("p", "para", "地點：" + it.place));
    if (it.date) panel.appendChild(el("p", "para", "日期：" + it.date));
    if (it.form) panel.appendChild(el("p", "para", "資料形式：" + it.form));
    panel.appendChild(el("p", "panel-foot", "位置為大約位置"));
  }

  function renderPanel() {
    panel.textContent = "";
    if (!ITEMS.length) {
      panel.appendChild(el("h1", "stop-title", "互動地圖"));
      panel.appendChild(el("p", "para", "資料整理中"));
      return;
    }
    var it = selectedId ? byId[selectedId] : null;
    if (it) renderItem(it);
    else {
      panel.appendChild(el("h1", "stop-title", "互動地圖"));
      renderIndex();
    }
  }

  /* ---------- 狀態 ---------- */

  function setHash(h) {
    if (location.hash === h) return;
    history.pushState(null, "", h || (location.pathname + location.search));
  }

  function select(id, opts) {
    var it = byId[id];
    if (!it) return;
    selectedId = id;
    if (!opts || opts.hash !== false) setHash("#item=" + encodeURIComponent(id));
    renderMarkers();
    renderPanel();
    panel.scrollTop = 0;
    if (map) {
      var z = Math.max(map.getZoom(), DETAIL_ZOOM);
      if (reduceMQ.matches || (opts && opts.instant)) {
        map.setView([it.lat, it.lng], z, { animate: false });
      } else {
        map.flyTo([it.lat, it.lng], z, { duration: 0.8 });
      }
    }
    announce(it.summary + "：地點資料");
  }

  function clearSelection() {
    selectedId = null;
    setHash(null);
    renderMarkers();
    renderPanel();
    fitAll();
    announce("互動地圖：資料清單");
  }

  function syncFromHash() {
    var m = /item=([^&]+)/.exec(location.hash);
    var id = m ? decodeURIComponent(m[1]) : null;
    if (id && byId[id]) {
      if (id !== selectedId) select(id, { hash: false });
    } else if (selectedId) {
      selectedId = null;
      renderMarkers();
      renderPanel();
      fitAll();
    }
  }

  /* ---------- 啟動 ---------- */

  initMap();
  renderMarkers();
  renderPanel();
  fitAll();

  /* 版面在載入後仍可能變動，載入完成及縮放後重算地圖尺寸，並回到目前視野 */
  function relayout() {
    if (!map) return;
    map.invalidateSize({ animate: false });
    if (selectedId && byId[selectedId]) {
      var it = byId[selectedId];
      map.setView([it.lat, it.lng], map.getZoom(), { animate: false });
    } else {
      fitAll();
    }
  }
  window.addEventListener("load", relayout);
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  });
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("popstate", syncFromHash);

  /* 開啟網址時若帶 #item=ID，直接選取該項 */
  syncFromHash();
  relayout();
  announce(ITEMS.length ? "互動地圖：資料清單" : "互動地圖：資料整理中");
})();
