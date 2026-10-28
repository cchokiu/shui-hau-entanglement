/* 互動地圖頁（G3）：資料標記（只顯示已核准、有座標的項目）、右下角圖例、資料卡、使用指南。
   資料來源：data/map-items.js（由 ~/Documents/shui-hau-ref/build-map-items.py 生成）。
   文字一律用 textContent 建立，不插入 HTML。 */
(function () {
  "use strict";

  var CATEGORIES = [
    { key: "animal", label: "動物", color: "#56B4E9" },
    { key: "plant", label: "植物", color: "#009E73" },
    { key: "villager", label: "村民", color: "#CC79A7" },
    { key: "tool", label: "工具", color: "#E69F00" },
    { key: "story", label: "故事", color: "#D55E00" }
  ];
  var CAT_BY_KEY = {};
  CATEGORIES.forEach(function (c) { CAT_BY_KEY[c.key] = c; });

  var DEFAULT_CENTER = [22.2195, 113.9165];
  var DEFAULT_ZOOM = 15;
  var DETAIL_ZOOM = 17;

  /* 只收錄已核准（approved）、有座標、類別已定的項目 */
  var ITEMS = (window.MAP_ITEMS || []).filter(function (it) {
    return it && it.approved === true &&
      typeof it.lat === "number" && typeof it.lng === "number" &&
      CAT_BY_KEY[it.category];
  });

  var wrap = document.getElementById("catMapWrap");
  var mapEl = document.getElementById("catMap");
  var mapNote = document.getElementById("catMapNote");
  var legendList = document.getElementById("legendList");
  var cardEl = document.getElementById("dataCard");
  var statusEl = document.getElementById("status");
  var guideToggle = document.getElementById("guideToggle");
  var guideBody = document.getElementById("guideBody");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var map = null;
  var markerLayer = null;
  var tileStat = { ok: 0, bad: 0 };
  var markers = [];        // { item, marker, el }
  var openItem = null;
  var openerEl = null;
  var legendItems = {};

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function announce(text) {
    statusEl.textContent = text;
  }

  /* ---------- 底圖 ---------- */

  function updateTileState() {
    var off = (tileStat.ok === 0 && tileStat.bad > 0) || navigator.onLine === false;
    wrap.classList.toggle("is-tiles-off", off);
    mapNote.hidden = !off;
    mapNote.textContent = off
      ? "底圖未能載入（離線或網絡不穩）。資料標記位置仍然正確，可照常使用。"
      : "";
  }

  function initMap() {
    if (!window.L) {
      mapNote.hidden = false;
      mapNote.textContent = "地圖程式庫未能載入，請重新整理。";
      return false;
    }
    map = L.map(mapEl, { zoomControl: true, attributionControl: true, zoomSnap: 1, zoomDelta: 1 });
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
    map.on("baselayerchange", function () { tileStat = { ok: 0, bad: 0 }; updateTileState(); });
    window.addEventListener("online", function () { tileStat = { ok: 0, bad: 0 }; updateTileState(); });
    markerLayer = L.layerGroup().addTo(map);
    map.on("click", closeCard);
    updateTileState();
    return true;
  }

  function fitPad() {
    return window.matchMedia("(max-width: 899px)").matches ? 40 : 48;
  }

  function fitAll() {
    if (!map) return;
    if (ITEMS.length) {
      var p = fitPad();
      map.fitBounds(L.latLngBounds(ITEMS.map(function (it) { return [it.lat, it.lng]; })),
        { padding: [p, p], animate: false, maxZoom: DEFAULT_ZOOM });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
    }
  }

  /* ---------- 資料標記 ---------- */

  function markerIcon(it) {
    return L.divIcon({
      className: "map-mk map-mk--" + it.category,
      html: '<span class="map-mk-dot"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  function setMarkerHover(entry, on) {
    if (!entry.el) return;
    entry.el.classList.toggle("is-hover", on);
    if (on) entry.marker.openTooltip(); else entry.marker.closeTooltip();
  }

  function renderMarkers() {
    markerLayer.clearLayers();
    markers = [];
    ITEMS.forEach(function (it) {
      var cat = CAT_BY_KEY[it.category];
      var marker = L.marker([it.lat, it.lng], {
        icon: markerIcon(it),
        title: it.title || cat.label,
        alt: cat.label + "：" + (it.title || ""),
        keyboard: true,
        riseOnHover: true
      });
      marker.bindTooltip(cat.label, { direction: "top", offset: [0, -10] });
      var entry = { item: it, marker: marker, el: null };
      marker.on("add", function () {
        entry.el = marker.getElement();
        if (!entry.el) return;
        entry.el.addEventListener("focus", function () { setMarkerHover(entry, true); });
        entry.el.addEventListener("blur", function () { setMarkerHover(entry, false); });
      });
      marker.on("mouseover", function () { setMarkerHover(entry, true); });
      marker.on("mouseout", function () { if (!entry.el || !entry.el.matches(":focus")) setMarkerHover(entry, false); });
      marker.on("click", function () { openCard(it, entry.el); });
      markerLayer.addLayer(marker);
      markers.push(entry);
    });
    if (!ITEMS.length && !document.getElementById("mapEmpty")) {
      var empty = el("p", "map-empty", "目前沒有已核准公開的資料標記。");
      empty.id = "mapEmpty";
      wrap.appendChild(empty);
    }
  }

  /* ---------- 圖例 ---------- */

  function setCategoryHighlight(key) {
    markers.forEach(function (m) {
      if (m.el) m.el.classList.toggle("is-cat-active", key !== null && m.item.category === key);
    });
    CATEGORIES.forEach(function (c) {
      var b = legendItems[c.key];
      if (b) b.classList.toggle("is-active", c.key === key);
    });
  }

  function renderLegend() {
    legendList.textContent = "";
    CATEGORIES.forEach(function (c) {
      var li = el("li");
      var b = el("button", "legend-item legend-item--" + c.key);
      b.type = "button";
      b.setAttribute("aria-label", c.label);
      b.appendChild(el("span", "legend-dot legend-dot--" + c.key));
      b.appendChild(el("span", "legend-label", c.label));
      b.addEventListener("mouseenter", function () { if (canHover) setCategoryHighlight(c.key); });
      b.addEventListener("mouseleave", function () { if (canHover) setCategoryHighlight(null); });
      b.addEventListener("focus", function () { if (b.matches(":focus-visible")) setCategoryHighlight(c.key); });
      b.addEventListener("blur", function () { setCategoryHighlight(null); });
      b.addEventListener("click", function () {
        var first = markers.filter(function (m) { return m.item.category === c.key; })[0];
        if (first && map) {
          map.flyTo([first.item.lat, first.item.lng], Math.max(map.getZoom(), DETAIL_ZOOM - 1), { duration: reduceMQ.matches ? 0 : 0.6 });
        }
      });
      legendItems[c.key] = b;
      li.appendChild(b);
      legendList.appendChild(li);
    });
  }

  /* ---------- 資料卡 ---------- */

  function buildCarousel(photos) {
    var box = el("div", "card-carousel");
    var figure = el("figure", "card-figure");
    var img = el("img");
    img.alt = "";
    img.loading = "lazy";
    figure.appendChild(img);
    box.appendChild(figure);
    var index = 0;
    var counter = el("p", "card-count");
    function show(i) {
      index = (i + photos.length) % photos.length;
      img.src = photos[index].src;
      img.alt = photos[index].alt || "";
      counter.textContent = (index + 1) + " / " + photos.length;
    }
    show(0);
    if (photos.length > 1) {
      var nav = el("div", "card-carousel-nav");
      var prev = el("button", "card-nav-btn", "上一張");
      prev.type = "button";
      prev.addEventListener("click", function () { show(index - 1); });
      var next = el("button", "card-nav-btn", "下一張");
      next.type = "button";
      next.addEventListener("click", function () { show(index + 1); });
      nav.append(prev, counter, next);
      box.appendChild(nav);
    } else {
      box.appendChild(counter);
    }
    return box;
  }

  function buildCard(it) {
    var cat = CAT_BY_KEY[it.category];
    var card = el("article", "data-card-inner card-" + it.category);
    card.appendChild(el("div", "card-band"));
    var body = el("div", "card-body");
    var close = el("button", "card-close", "關閉");
    close.type = "button";
    close.setAttribute("aria-label", "關閉資料卡");
    close.addEventListener("click", closeCard);
    body.appendChild(close);
    body.appendChild(el("p", "card-cat", cat.label));
    var title = el("h2", "card-title", it.title || cat.label);
    title.id = "cardTitle";
    title.tabIndex = -1;
    body.appendChild(title);
    if (it.location) body.appendChild(el("p", "card-meta", "大約位置：" + it.location));
    (it.text || []).forEach(function (t) {
      if (t) body.appendChild(el("p", "para card-text", t));
    });
    var media = it.media || [];
    var photos = media.filter(function (m) { return m.type === "photo" && m.src; });
    if (photos.length) body.appendChild(buildCarousel(photos));
    media.forEach(function (m) {
      if (!m.src) return;
      if (m.type === "video") {
        var v = el("video");
        v.controls = true;
        v.preload = "metadata";
        v.src = m.src;
        v.setAttribute("aria-label", (it.title || "影片"));
        body.appendChild(v);
      } else if (m.type === "audio") {
        var a = el("audio");
        a.controls = true;
        a.preload = "metadata";
        a.src = m.src;
        a.setAttribute("aria-label", (it.title || "聲音"));
        body.appendChild(a);
      }
    });
    if (it.source) body.appendChild(el("p", "card-source", "來源：" + it.source));
    if (it.author) body.appendChild(el("p", "card-source", "作者：" + it.author));
    card.appendChild(body);
    return card;
  }

  function openCard(it, markerEl) {
    openerEl = markerEl || null;
    openItem = it;
    cardEl.textContent = "";
    cardEl.appendChild(buildCard(it));
    cardEl.hidden = false;
    cardEl.setAttribute("role", "dialog");
    cardEl.setAttribute("aria-modal", "false");
    cardEl.setAttribute("aria-labelledby", "cardTitle");
    var t = document.getElementById("cardTitle");
    if (t) t.focus({ preventScroll: true });
    announce((CAT_BY_KEY[it.category] || {}).label + "：" + (it.title || "資料卡已打開"));
  }

  function closeCard() {
    if (!openItem) return;
    openItem = null;
    cardEl.hidden = true;
    cardEl.textContent = "";
    if (openerEl && openerEl.focus) openerEl.focus({ preventScroll: true });
    openerEl = null;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openItem) {
      e.preventDefault();
      closeCard();
    }
  });

  /* ---------- 使用指南（390 寬度可收合） ---------- */

  function setGuide(open) {
    guideBody.hidden = !open;
    guideToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  guideToggle.addEventListener("click", function () {
    setGuide(guideBody.hidden);
  });

  /* ---------- 啟動 ---------- */

  initMap();
  renderLegend();
  renderMarkers();
  fitAll();

  /* 版面在載入後仍可能變動，載入完成及縮放後重算地圖尺寸 */
  function relayout() {
    if (!map) return;
    map.invalidateSize({ animate: false });
    if (!openItem) fitAll();
  }
  window.addEventListener("load", relayout);
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  });
  relayout();
  announce(ITEMS.length ? "互動地圖：" + ITEMS.length + " 個資料標記" : "互動地圖：目前沒有已核准公開的資料標記");
})();
