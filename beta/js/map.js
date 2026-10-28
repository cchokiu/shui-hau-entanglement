/* 互動地圖頁：Data Catalogue 地點的標記、地點內容、可用鍵盤操作的地點清單。
   資料來源：data/catalogue-points.js（由 build-catalogue.py 生成）。同一座標的地點合併為一個標記。 */
(function () {
  "use strict";

  var POINTS = window.CATALOGUE_POINTS || [];

  /* 組別（ref 小數點前的數字）對應的名稱與色票（與 tokens.css 相同） */
  var GROUPS = {
    "1": { name: "沙白", color: "--c-clam" },
    "2": { name: "黃牛", color: "--c-cattle" },
    "3": { name: "水牛", color: "--c-buffalo" },
    "4": { name: "人", color: "--black" },
    "5": { name: "水稻", color: "--c-rice" }
  };
  var DEFAULT_CENTER = [22.2195, 113.9165];
  var DEFAULT_ZOOM = 15;
  var DETAIL_ZOOM = 17;

  var wrap = document.getElementById("catMapWrap");
  var mapNote = document.getElementById("catMapNote");
  var panel = document.getElementById("catPanel");
  var legend = document.getElementById("catLegend");
  var statusEl = document.getElementById("status");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var map = null;
  var markerLayer = null;
  var tileStat = { ok: 0, bad: 0 };
  var selectedKey = null;
  var LOCATIONS = groupByCoord(POINTS);

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function announce(text) {
    statusEl.textContent = text;
  }

  function groupOf(p) {
    return String(p.group);
  }

  function groupInfo(g) {
    return GROUPS[g] || { name: g, color: "--text" };
  }

  /* 同一座標的地點合併（例如 1.2 與 4.4 同位） */
  function groupByCoord(points) {
    var byKey = {};
    var order = [];
    points.forEach(function (p) {
      var k = p.lat.toFixed(6) + "," + p.lng.toFixed(6);
      if (!byKey[k]) {
        byKey[k] = { key: k, lat: p.lat, lng: p.lng, points: [] };
        order.push(k);
      }
      byKey[k].points.push(p);
    });
    return order.map(function (k) { return byKey[k]; });
  }

  function locationByKey(key) {
    for (var i = 0; i < LOCATIONS.length; i++) {
      if (LOCATIONS[i].key === key) return LOCATIONS[i];
    }
    return null;
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
      return false;
    }
    map = L.map("catMap", {
      zoomControl: true,
      attributionControl: true,
      zoomSnap: 1,
      zoomDelta: 1
    });

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
    return true;
  }

  function fitPad() {
    return window.matchMedia("(max-width: 899px)").matches ? 40 : 48;
  }

  /* 總覽：包住所有地點；沒有資料時置中於預設位置 */
  function fitAll() {
    if (!map) return;
    if (LOCATIONS.length) {
      var pts = LOCATIONS.map(function (l) { return [l.lat, l.lng]; });
      var p = fitPad();
      map.fitBounds(L.latLngBounds(pts), { padding: [p, p], animate: false, maxZoom: DEFAULT_ZOOM });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
    }
  }

  function markerIcon(loc, current) {
    var g = groupOf(loc.points[0]);
    var cls = "cat-marker cat-marker--" + g +
      (loc.points.length > 1 ? " is-group" : "") +
      (current ? " is-current" : "");
    return L.divIcon({
      className: cls,
      html: "",
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  function locationTitle(loc) {
    return loc.points.map(function (p) { return p.ref + " " + p.name; }).join("、");
  }

  function renderMarkers() {
    if (!map) return;
    markerLayer.clearLayers();
    LOCATIONS.forEach(function (loc) {
      var current = loc.key === selectedKey;
      var marker = L.marker([loc.lat, loc.lng], {
        icon: markerIcon(loc, current),
        title: locationTitle(loc),
        alt: "地點：" + locationTitle(loc),
        keyboard: true,
        zIndexOffset: current ? 1000 : 0
      });
      marker.on("click", function () { select(loc.key); });
      markerLayer.addLayer(marker);
    });
  }

  function renderLegend() {
    legend.textContent = "";
    var present = {};
    POINTS.forEach(function (p) { present[groupOf(p)] = true; });
    var title = el("p", "species-legend-title", "地點分類");
    var list = el("ul", "species-legend-list");
    Object.keys(GROUPS).forEach(function (g) {
      if (!present[g]) return;
      var item = el("li", "species-legend-item");
      item.appendChild(el("span", "cat-legend-dot cat-legend-dot--" + g));
      item.appendChild(document.createTextNode(GROUPS[g].name));
      list.appendChild(item);
    });
    legend.append(title, list, el("p", "species-legend-note", "標記位置為大約位置"));
  }

  /* ---------- 側欄 ---------- */

  function renderIndex() {
    panel.appendChild(el("h1", "stop-title", "互動地圖"));
    panel.appendChild(el("p", "para", "地圖上的標記是 Data Catalogue 記錄的地點，為大約位置。點擊標記，或從下方清單選擇地點，即可查看該地點的資料。"));
    Object.keys(GROUPS).forEach(function (g) {
      var pts = POINTS.filter(function (p) { return groupOf(p) === g; });
      if (!pts.length) return;
      panel.appendChild(el("h2", "meet-heading free-heading", g + "．" + GROUPS[g].name));
      var list = el("ul", "free-list");
      pts.forEach(function (p) {
        var li = el("li");
        var b = el("button", "free-item", p.ref + "　" + p.name);
        b.type = "button";
        b.addEventListener("click", function () { select(locKeyOf(p)); });
        li.appendChild(b);
        list.appendChild(li);
      });
      panel.appendChild(list);
    });
    panel.appendChild(el("p", "panel-foot", "位置為大約位置"));
  }

  function locKeyOf(p) {
    for (var i = 0; i < LOCATIONS.length; i++) {
      if (LOCATIONS[i].points.indexOf(p) !== -1) return LOCATIONS[i].key;
    }
    return null;
  }

  function renderLocation(loc) {
    var back = el("button", "free-back", "← 返回地點清單");
    back.type = "button";
    back.addEventListener("click", clearSelection);
    panel.appendChild(back);

    loc.points.forEach(function (p, i) {
      if (i > 0) panel.appendChild(el("hr", "cat-divider"));
      var g = groupInfo(groupOf(p));
      panel.appendChild(el("p", "stop-meta", p.ref + " · " + g.name));
      panel.appendChild(el("h2", "stop-title", p.name));
      if (!p.items || !p.items.length) {
        panel.appendChild(el("p", "para", "此地點暫無資料。"));
        return;
      }
      p.items.forEach(function (it) {
        var art = el("article", "cat-item");
        var head = [it.topic, it.summary].filter(Boolean).join(" · ");
        art.appendChild(el("h3", "cat-item-title", head || "（無標題）"));
        var meta = [it.place, it.date, it.form].filter(Boolean).join(" · ");
        if (meta) art.appendChild(el("p", "cat-item-meta", meta));
        panel.appendChild(art);
      });
    });
    panel.appendChild(el("p", "panel-foot", "位置為大約位置"));
  }

  function renderPanel() {
    panel.textContent = "";
    if (!POINTS.length) {
      panel.appendChild(el("h1", "stop-title", "互動地圖"));
      panel.appendChild(el("p", "para", "資料整理中"));
      return;
    }
    var loc = selectedKey ? locationByKey(selectedKey) : null;
    if (loc) renderLocation(loc);
    else renderIndex();
  }

  /* ---------- 狀態 ---------- */

  function select(key) {
    var loc = locationByKey(key);
    if (!loc) return;
    selectedKey = key;
    renderMarkers();
    renderPanel();
    panel.scrollTop = 0;
    if (map) {
      var z = Math.max(map.getZoom(), DETAIL_ZOOM);
      if (reduceMQ.matches) {
        map.setView([loc.lat, loc.lng], z, { animate: false });
      } else {
        map.flyTo([loc.lat, loc.lng], z, { duration: 0.8 });
      }
    }
    announce(locationTitle(loc) + "：地點資料");
  }

  function clearSelection() {
    selectedKey = null;
    renderMarkers();
    renderPanel();
    fitAll();
    announce("互動地圖：地點清單");
  }

  /* ---------- 啟動 ---------- */

  initMap();
  renderLegend();
  renderMarkers();
  renderPanel();
  fitAll();
  announce(POINTS.length ? "互動地圖：地點清單" : "互動地圖：資料整理中");

  /* 版面在載入後仍可能變動（字體、底圖容器尺寸），載入完成及縮放後重算地圖尺寸並回到目前視野 */
  function relayout() {
    if (!map) return;
    map.invalidateSize({ animate: false });
    if (selectedKey) {
      var loc = locationByKey(selectedKey);
      if (loc) map.setView([loc.lat, loc.lng], map.getZoom(), { animate: false });
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
  relayout();
})();
