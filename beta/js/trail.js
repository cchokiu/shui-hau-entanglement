/* 路線探索頁：地圖、路線分頁、逐站切換、網址 hash、鍵盤、底圖失敗處理、圖片放大。
   右側欄頂部的分頁：自由探索｜一、瀨鑊邊｜二、翅口（沙白）｜三、水稻；換路線不重新載入頁面（history.pushState）。
   狀態 idx：-1 為「路線介紹」，0 至 N-1 為各站。 */
(function () {
  "use strict";

  var ROUTES = [window.ROUTE1, window.ROUTE2, window.ROUTE3].filter(Boolean);
  function hasPos(s) { return typeof s.lat === "number" && typeof s.lng === "number"; }

  /* 探索模式：網址沒有 trail=（無 hash 或 #explore）時，地圖顯示全部站點與路線 */
  var EXPLORE = {
    id: "explore",
    title: "路線探索",
    intro: ["三條路線各有顏色。把滑鼠移到地圖上的路線，該路線會亮起；按下路線，或按上方的分頁，即可閱讀該路線的站點內容。圓點是各站位置，點選可閱讀內容。路線三（水稻）以時間線呈現，請按「三、水稻」分頁。"],
    sources: [],
    related: [],
    stops: ROUTES.reduce(function (all, r) {
      return all.concat(r.stops.map(function (s) {
        return Object.assign({}, s, { routeId: r.id, routeTitle: r.title, routeOrder: s.order });
      }));
    }, [])
  };

  /* 目前路線 id：有 trail= 且是已知路線 → 該路線；trail= 不明 → 第一條；沒有 trail= → "explore" */
  function routeIdFromHash() {
    var m = /trail=([a-z0-9]+)/i.exec(location.hash);
    if (!m) return "explore";
    for (var i = 0; i < ROUTES.length; i++) { if (ROUTES[i].id === m[1]) return ROUTES[i].id; }
    return ROUTES[0].id;
  }
  function routeById(id) {
    for (var i = 0; i < ROUTES.length; i++) { if (ROUTES[i].id === id) return ROUTES[i]; }
    return EXPLORE;
  }

  var currentId = routeIdFromHash();
  var ROUTE = routeById(currentId);
  var EXPLORE_MODE = currentId === "explore";

  /* 物種名稱對應的色票（與 tokens.css 相同） */
  var SPECIES_COLOR = {
    "翅口（沙白）": "--c-clam",
    "水稻": "--c-rice",
    "水牛": "--c-buffalo"
  };

  /* 將 route*.js 的站點資料轉為本頁使用的欄位；缺少的素材（missing）不轉入，即不顯示 */
  function buildStops(route) {
    return route.stops.map(function (s) {
      return {
        id: s.id,
        n: s.order,
        routeId: s.routeId || route.id,
        routeTitle: s.routeTitle || route.title,
        routeOrder: s.routeOrder || s.order,
        place: s.name,
        lat: s.lat,
        lng: s.lng,
        era: s.era || "",
        fit: s.fit !== false,          /* false：總覽視野不計入此站 */
        gpsSource: s.gps_source || "",
        links: s.links || [],
        paragraphs: s.text,
        media: (s.photos || []).map(function (p) {
          return { type: "image", src: p.src, caption: p.caption, alt: p.alt };
        }),
        meet: (s.species || []).map(function (name) {
          return { label: name, color: SPECIES_COLOR[name] || "--text" };
        })
      };
    });
  }
  var STOPS = buildStops(ROUTE);
  var N = STOPS.length;
  var TILE_ZOOM = 16;
  var CHZ_STOP_ID = "s3";        /* 路線三「長洲」：在地圖範圍外，以邊緣指示進入 */

  var header = document.getElementById("siteHeader");
  var wrap = document.getElementById("routeMapWrap");
  var mapNote = document.getElementById("routeMapNote");
  var scroller = document.getElementById("routeSidePanel");   /* 側欄（桌面：本身不捲動，內容區捲動） */
  var tabsEl = document.getElementById("routeTabs");
  var panel = document.getElementById("routePanelBody");      /* 內容區：逐站內容在這裡繪製 */
  var keyEl = document.getElementById("routeKey");
  var statusEl = document.getElementById("status");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileMQ = window.matchMedia("(max-width: 899px)");

  var state = { idx: -1, free: false, cluster: null };
  var lightbox = null;
  var lightboxOpener = null;

  /* ---------- 小工具 ---------- */

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  /* 色票名稱（例如 "--c-clam"）轉成 CSS 類別（例如 "dot--clam"） */
  function dotClass(colorToken) {
    return "dot--" + String(colorToken).replace(/^--c-/, "").replace(/^--/, "");
  }

  /* 網址格式：順序導覽 #trail=ID&stop=N；自由漫遊 #trail=ID&mode=free（可再加 &stop=N） */
  function hashFor(idx) {
    if (EXPLORE_MODE) {
      if (idx < 0) return "#explore";
      return "#explore&stop=" + STOPS[idx].routeId + "-" + STOPS[idx].routeOrder;
    }
    var base = "#trail=" + ROUTE.id + (state.free ? "&mode=free" : "");
    return idx < 0
      ? base
      : base + "&stop=" + (idx + 1);
  }

  function parseHash() {
    state.free = false;
    if (EXPLORE_MODE) {
      state.free = true;
      var es = /(?:^|&)stop=([a-z0-9]+)-(\d+)/i.exec(location.hash);
      if (!es) return -1;
      for (var k = 0; k < STOPS.length; k++) {
        if (STOPS[k].routeId === es[1] && STOPS[k].routeOrder === parseInt(es[2], 10)) return k;
      }
      return -1;
    }
    var m = /trail=([a-z0-9]+)/i.exec(location.hash);
    if (!m || m[1] !== ROUTE.id) return -1;
    state.free = /(?:^|&)mode=free(?![a-z0-9])/i.test(location.hash);
    var sn = /(?:^|&)stop=(\d+)/.exec(location.hash);
    if (!sn) return -1;
    var n = parseInt(sn[1], 10);
    if (isNaN(n)) return -1;
    return clamp(n - 1, 0, N - 1);
  }

  function announce(text) {
    statusEl.textContent = text;
  }

  /* ---------- 頁首及空連結 ---------- */

  function setHeaderHeight() {
    document.documentElement.style.setProperty(
      "--hdr-h",
      (header.offsetHeight + 1) + "px"
    );
  }

  setHeaderHeight();
  window.addEventListener("resize", setHeaderHeight);

  /* 暫時的連結（href="#"）不改變網址 */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  /* ---------- 地圖 ---------- */

  var map = null;
  var markerLayer = null;
  var lineLayer = null;
  var tileStat = { ok: 0, bad: 0 };

  function updateTileState() {
    var off = (tileStat.ok === 0 && tileStat.bad > 0) || navigator.onLine === false;
    wrap.classList.toggle("is-tiles-off", off);
    mapNote.hidden = !off;
    mapNote.textContent = off
      ? "底圖未能載入（離線或網絡不穩）。站點位置及連線仍然正確，可照常使用。"
      : "";
  }

  function initMap() {
    if (!window.L) {
      mapNote.hidden = false;
      mapNote.textContent = "地圖程式庫未能載入，請重新整理。";
      return;
    }

    map = L.map("routeMap", {
      zoomControl: true,
      attributionControl: true,
      keyboard: false,            /* 鍵盤只用於換站，不讓地圖自行平移 */
      zoomSnap: 1,                /* 整數縮放，避免小數縮放造成底圖圖塊縫隙 */
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

    lineLayer = L.layerGroup().addTo(map);
    drawRouteLayers();
    /* 觸控裝置點按地圖空白處：取消路線亮起 */
    map.on("click", function () { if (!canHover && activeRoute) setActiveRoute(null); });
    markerLayer = L.layerGroup().addTo(map);
    updateTileState();
  }

  /* 依目前路線畫線：
     自由探索：路線一、二的實線（可 hover／點按）；路線三不畫線。
     單一路線：路線一、二為示意虛線；路線三不畫虛線／折線，只顯示編號站點。 */
  function drawRouteLayers() {
    if (!map) return;
    lineLayer.clearLayers();
    routeLines = {};
    activeRoute = null;
    if (EXPLORE_MODE) { drawExploreRoutes(); return; }
    if (ROUTE.id === "rice") return;   /* C4：路線三不畫虛線／折線 */
    var latlngs = STOPS.filter(hasPos).map(function (s) { return [s.lat, s.lng]; });
    /* 底下先畫一條較寬的淺色底線（casing），讓深色虛線在森林底圖上清楚可見 */
    L.polyline(latlngs, {
      className: "route-casing",
      color: tokenValue("--bg"),
      weight: 7,
      opacity: 0.85,
      interactive: false
    }).addTo(lineLayer);
    L.polyline(latlngs, {
      className: "route-line",
      color: tokenValue("--text"),   /* 與 CSS 的 --text 相同 */
      weight: 3,
      opacity: 0.9,
      dashArray: "6 6",
      interactive: false
    }).addTo(lineLayer);
  }

  function tokenValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* 總覽視野的範圍：只計入有位置且 fit 不為 false 的站點 */
  function overviewBounds() {
    var pts = STOPS.filter(function (s) { return hasPos(s) && s.fit; })
      .map(function (s) { return [s.lat, s.lng]; });
    return L.latLngBounds(pts.length ? pts : [[22.2195, 113.9165]]);
  }

  /* 地圖邊界內距：手機 40px，桌面 48px */
  function fitPad() {
    return mobileMQ.matches ? 40 : 48;
  }

  /* 依目前狀態設定視野（不做動畫）：介紹頁包住三個站點；站點則置中於該站；物種 hash 則對應物種點位 */
  function applyView() {
    if (!map) return;
    if (state.idx < 0 || !hasPos(STOPS[state.idx])) {
      var p = fitPad();
      map.fitBounds(overviewBounds(), { padding: [p, p], animate: false });
    } else {
      var s = STOPS[state.idx];
      map.setView([s.lat, s.lng], TILE_ZOOM, { animate: false });
    }
  }

  /* 導航列高度寫入 --nav-h，供側欄底部內距使用 */
  function setNavHeight() {
    var nav = panel.querySelector(".trail-nav");
    var h = nav && mobileMQ.matches ? nav.offsetHeight : 0;
    document.documentElement.style.setProperty("--nav-h", h + "px");
  }

  /* 版面變動（縮放視窗、跨越 900px、載入完成）後重算地圖尺寸 */
  function relayout() {
    setHeaderHeight();
    setNavHeight();
    if (!map) return;
    map.invalidateSize({ animate: false });   /* 保持地圖中心不變 */
    if (state.idx < 0) applyView();
  }

  function markerIcon(stop, current) {
    var size = current ? 40 : 30;
    return L.divIcon({
      className: "stop-marker" + (current ? " is-current" : ""),
      html: String(stop.n),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  /* 探索模式：同一座標的站點合併；單站為圓點，多站顯示站數。標題列出路線名與站名。 */
  function renderExploreMarker(idxs) {
    var multi = idxs.length > 1;
    var current = idxs.indexOf(state.idx) !== -1;
    var size = multi ? (current ? 32 : 28) : (current ? 20 : 16);
    var icon = L.divIcon({
      className: "stop-marker is-dot" + (multi ? " is-group" : "") + (current ? " is-current" : ""),
      html: multi ? String(idxs.length) : "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
    var names = idxs.map(function (i) {
      var s = STOPS[i];
      return s.routeTitle + " 第 " + s.routeOrder + " 站：" + s.place;
    }).join("、");
    var s0 = STOPS[idxs[0]];
    var marker = L.marker([s0.lat, s0.lng], {
      icon: icon, title: names, alt: names, keyboard: true,
      zIndexOffset: current ? 1000 : 0
    });
    marker.on("click", function () {
      if (!multi) {
        goTo(idxs[0], { push: true });
      } else {
        state.cluster = idxs;
        render(null);
        announce(s0.place + "：" + idxs.length + " 個站點");
      }
    });
    markerLayer.addLayer(marker);
  }

  /* 相距不足約 25 米的站點合併為同一個標記（例如路線三 2 水口灣與 8 復耕稻田），避免圓點互相蓋住 */
  var GROUP_METERS = 25;
  function metersBetween(a, b) {
    var dLat = (a.lat - b.lat) * 111320;
    var dLng = (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function renderStopMarkers() {
    var groups = {}, order = [];
    STOPS.forEach(function (s, i) {
      if (!hasPos(s)) return;
      var key = null;
      for (var j = 0; j < order.length; j++) {
        if (metersBetween(STOPS[groups[order[j]][0]], s) < GROUP_METERS) { key = order[j]; break; }
      }
      if (key === null) { key = String(i); groups[key] = []; order.push(key); }
      groups[key].push(i);
    });
    order.forEach(function (k) {
      var idxs = groups[k];
      if (EXPLORE_MODE) { renderExploreMarker(idxs); return; }
      var s0 = STOPS[idxs[0]];
      var current = idxs.indexOf(state.idx) !== -1;
      var label = idxs.map(function (i) { return STOPS[i].n; }).join("·");
      var h = current ? 40 : 30;
      var w = Math.max(h, label.length * 9 + 16);
      var icon = L.divIcon({
        className: "stop-marker" + (current ? " is-current" : "") + (idxs.length > 1 ? " is-group" : ""),
        html: label, iconSize: [w, h], iconAnchor: [w / 2, h / 2]
      });
      var names = idxs.map(function (i) { return STOPS[i].n + "．" + STOPS[i].place; }).join("、");
      var marker = L.marker([s0.lat, s0.lng], { icon: icon, title: names, alt: "站點：" + names, keyboard: true, zIndexOffset: current ? 2000 : 1000 });
      marker.on("click", function () {
        var pos = idxs.indexOf(state.idx);
        goTo(pos === -1 ? idxs[0] : idxs[(pos + 1) % idxs.length], { push: true });
      });
      markerLayer.addLayer(marker);
    });
  }

  function renderMarkers() {
    if (!map) return;
    markerLayer.clearLayers();
    renderStopMarkers();

  }

  function moveMap() {
    if (!map) return;
    if (state.idx < 0 || !hasPos(STOPS[state.idx])) {
      var p = fitPad();
      if (reduceMQ.matches) {
        map.fitBounds(overviewBounds(), { padding: [p, p], animate: false });
      } else {
        map.flyToBounds(overviewBounds(), { padding: [p, p], duration: 0.9 });
      }
      return;
    }
    var s = STOPS[state.idx];
    if (reduceMQ.matches) {
      map.setView([s.lat, s.lng], TILE_ZOOM, { animate: false });
    } else {
      map.flyTo([s.lat, s.lng], TILE_ZOOM, { duration: 0.9 });
    }
  }

  /* ---------- 路線分頁與路線線條 ---------- */

  /* 路線顏色（固定，只用於地圖線條）；分頁名稱；紙塊的物種色 */
  var ROUTE_COLOR = { laiwok: "#214C40", clam: "#0072B2", rice: "#D55E00" };
  var TAB_LABEL = { explore: "自由探索", laiwok: "一、瀨鑊邊", clam: "二、翅口（沙白）", rice: "三、水稻" };
  var CHIP_BY_ROUTE = { explore: "", laiwok: "paper-chip--cattle", clam: "paper-chip--clam", rice: "paper-chip--rice" };
  var KEY_TEXT = {
    line: "示意連線：只表示站點次序，並非實際行走路線",
    nolines: "編號依時間先後；站點位置為大約位置"
  };
  var routeLines = {};
  var activeRoute = null;
  /* 有滑鼠（可 hover 且指標精準）的裝置；觸控裝置為 false */
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 亮起某條路線；其餘變淡。id 為 null 時回復原狀。 */
  function setActiveRoute(id) {
    activeRoute = id;
    Object.keys(routeLines).forEach(function (rid) {
      routeLines[rid].setStyle({
        opacity: id === null ? 0.85 : (rid === id ? 1 : 0.2),
        weight: rid === id ? 7 : 4
      });
    });
  }

  /* 切換路線（或「自由探索」）：pushState＋直接重繪，不重新載入頁面 */
  function enterRoute(id) {
    var h = id === "explore" ? "#explore" : "#trail=" + id;
    if (location.hash !== h) history.pushState(null, "", h);
    applyHash({ instant: true, announceRoute: true });
  }

  /* 有滑鼠的裝置：按下即進入；觸控裝置：第一次點按亮起，第二次點按才進入 */
  function routeTap(id) {
    if (canHover || activeRoute === id) {
      enterRoute(id);
    } else {
      setActiveRoute(id);
    }
  }

  var tabEls = {};

  function buildTabs() {
    tabsEl.textContent = "";
    ["explore"].concat(ROUTES.map(function (r) { return r.id; })).forEach(function (id) {
      var b = el("button", "route-tab paper-chip " + CHIP_BY_ROUTE[id], TAB_LABEL[id]);
      b.type = "button";
      b.id = "routeTab-" + id;
      b.setAttribute("role", "tab");
      b.setAttribute("data-route", id);
      b.setAttribute("aria-controls", "routePanelBody");
      b.addEventListener("click", function () { if (id !== currentId) enterRoute(id); });
      /* 自由探索時，tab 的 hover／焦點與地圖線條互相呼應 */
      b.addEventListener("mouseenter", function () { if (canHover && EXPLORE_MODE && routeLines[id]) setActiveRoute(id); });
      b.addEventListener("mouseleave", function () { if (canHover && EXPLORE_MODE) setActiveRoute(null); });
      tabEls[id] = b;
      tabsEl.appendChild(b);
    });
    /* 鍵盤：左右鍵（及 Home／End）切換分頁，焦點跟著移動 */
    tabsEl.addEventListener("keydown", function (e) {
      var ids = Object.keys(tabEls);
      var i = ids.indexOf(currentId);
      var d = 0;
      if (e.key === "ArrowRight") d = 1;
      else if (e.key === "ArrowLeft") d = -1;
      else if (e.key === "Home") i = -1, d = 1;
      else if (e.key === "End") i = ids.length, d = -1;
      else return;
      e.preventDefault();
      e.stopPropagation();
      var next = ids[(i + d + ids.length) % ids.length];
      enterRoute(next);
      tabEls[next].focus();
    });
  }

  /* 同步分頁的選中狀態、地圖提示文字與長洲指示 */
  function updateRouteChrome() {
    Object.keys(tabEls).forEach(function (id) {
      var on = id === currentId;
      tabEls[id].setAttribute("aria-selected", on ? "true" : "false");
      tabEls[id].tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "routeTab-" + currentId);
    var cur = tabEls[currentId];
    if (cur && tabsEl.scrollWidth > tabsEl.clientWidth) {
      tabsEl.scrollLeft = Math.max(0, cur.offsetLeft - (tabsEl.clientWidth - cur.offsetWidth) / 2);
    }
    if (keyEl) keyEl.textContent = currentId === "rice" ? KEY_TEXT.nolines : KEY_TEXT.line;
    updateChzIndicator();
  }

  /* C3：路線三的長洲在地圖外。地圖右下邊緣放方向指示，按下打開該站內容。 */
  var chzBtn = null;
  function chzIndex() {
    for (var i = 0; i < STOPS.length; i++) { if (STOPS[i].id === CHZ_STOP_ID) return i; }
    return -1;
  }
  function updateChzIndicator() {
    var show = currentId === "rice" && chzIndex() !== -1;
    if (!show) {
      if (chzBtn) { chzBtn.remove(); chzBtn = null; }
      return;
    }
    if (!chzBtn) {
      chzBtn = el("button", "chz-indicator paper-chip paper-chip--rice", "往長洲 約 11 公里 →");
      chzBtn.type = "button";
      chzBtn.setAttribute("aria-label", "往長洲，約 11 公里，打開長洲站點");
      chzBtn.addEventListener("click", function () { goTo(chzIndex(), { push: true }); });
      wrap.appendChild(chzBtn);
    }
    chzBtn.classList.toggle("is-active", state.idx === chzIndex());
  }

  /* 自由探索：路線一、二的線（路線三不畫線）。只連接有座標的站點，按 order 排序。 */
  function drawExploreRoutes() {
    ROUTES.forEach(function (r) {
      if (r.id === "rice") return;
      var pts = r.stops
        .filter(hasPos)
        .slice()
        .sort(function (a, b) { return a.order - b.order; })
        .map(function (s) { return [s.lat, s.lng]; });
      var line = L.polyline(pts, {
        color: ROUTE_COLOR[r.id],
        weight: 4,
        opacity: 0.85,
        interactive: true,
        className: "route-track route-track--" + r.id
      }).addTo(lineLayer);
      routeLines[r.id] = line;
      line.on("mouseover", function () { if (canHover) setActiveRoute(r.id); });
      line.on("mouseout", function () { if (canHover) setActiveRoute(null); });
      line.on("click", function () { routeTap(r.id); });
    });
  }

  /* ---------- 側欄 ---------- */

  function renderIntroText(frag) {
    frag.appendChild(el("h1", "stop-title", ROUTE.title));
    ROUTE.intro.forEach(function (text) {
      frag.appendChild(el("p", "para", text));
    });
    if (ROUTE.sources && ROUTE.sources.length) frag.appendChild(el("p", "panel-foot", "資料來源：" + ROUTE.sources.join("；")));
  }

  /* 單一路線介紹：有站點沒有地圖位置時，說明為何地圖上看不到 */
  function missingPosNote(frag) {
    var missing = STOPS.filter(function (s) { return !hasPos(s); }).length;
    if (missing && !EXPLORE_MODE) frag.appendChild(el("p", "panel-foot panel-foot--tight", "部分站點位置待補，暫未顯示在地圖上。"));
  }

  /* 單一路線的自由漫遊（手動網址）：可切回順序導覽 */
  function modeToggle() {
    var a = el("a", "mode-toggle", "改為順序導覽");
    a.href = "#trail=" + ROUTE.id;
    var p = el("p", "para");
    p.appendChild(a);
    return p;
  }

  /* 探索模式：某個地圖位置有多個站點時，列出這些站點讓訪客選擇 */
  function renderCluster(frag) {
    var back = el("button", "free-back", "← 返回全部站點");
    back.type = "button";
    back.addEventListener("click", function () { goTo(-1, { push: true }); });
    frag.appendChild(back);
    frag.appendChild(el("h2", "meet-heading free-heading", "此位置的站點"));
    var list = el("ul", "free-list");
    state.cluster.forEach(function (i) {
      var s = STOPS[i];
      var li = el("li");
      var b = el("button", "free-item", s.routeTitle + " · 第 " + s.routeOrder + " 站：" + s.place);
      b.type = "button";
      b.addEventListener("click", function () {
        state.cluster = null;
        goTo(i, { push: true });
      });
      li.appendChild(b);
      list.appendChild(li);
    });
    frag.appendChild(list);
  }

  /* 探索模式的面板：介紹（未選站）、群組站點（未選站）、站點內容（已選站） */
  function renderExplore(frag) {
    if (state.idx >= 0) {
      renderStopBody(frag);
      var s = STOPS[state.idx];
      var links = el("p", "para explore-links");
      var back = el("a", "text-link", "← 返回全部站點");
      back.href = "#explore";
      var go = el("a", "text-link", "由此站開始這條路線 →");
      go.href = "trail.html#trail=" + s.routeId + "&stop=" + s.routeOrder;
      links.append(back, document.createTextNode("　"), go);
      frag.appendChild(links);
      return;
    }
    if (state.cluster) {
      renderCluster(frag);
      return;
    }
    renderIntroText(frag);
    frag.appendChild(el("p", "panel-foot", "站點位置為大約位置"));
  }

  function renderIntro(frag) {
    renderIntroText(frag);
    var start = el("button", "btn btn--start paper-chip " + CHIP_BY_ROUTE[currentId], "由第 1 站開始 →");
    start.type = "button";
    start.addEventListener("click", function () { goTo(0, { push: true, focus: "next" }); });
    var wrapBtn = el("div", "start-row");
    wrapBtn.appendChild(start);
    frag.appendChild(wrapBtn);
    if (currentId === "rice") {
      frag.appendChild(el("h2", "meet-heading free-heading", "時間線"));
      frag.appendChild(timeline());
    }
    missingPosNote(frag);
    frag.appendChild(el("p", "panel-foot panel-foot--tight", "站點位置為大約位置"));
  }

  /* C4：路線三的時間線（縱向：年代在左，站名在右，可按）。沒有地圖位置的站點加註。 */
  function timeline() {
    var ol = el("ol", "timeline");
    STOPS.forEach(function (s, i) {
      var li = el("li", "timeline-row");
      var b = el("button", "timeline-item");
      b.type = "button";
      if (i === state.idx) b.setAttribute("aria-current", "true");
      b.setAttribute("aria-label", s.n + ". " + s.place + (s.era ? "，" + s.era : "") + (hasPos(s) ? "" : "，地圖未標示"));
      b.appendChild(el("span", "timeline-era", s.era || "—"));
      b.appendChild(el("span", "timeline-dot"));
      var name = el("span", "timeline-name");
      name.appendChild(el("span", "timeline-place", s.n + ". " + s.place));
      if (!hasPos(s)) name.appendChild(el("span", "timeline-sub", s.id === CHZ_STOP_ID ? "在地圖範圍外，見地圖右下角" : "地圖未標示"));
      b.appendChild(name);
      b.addEventListener("click", function () { goTo(i, { push: true }); });
      li.appendChild(b);
      ol.appendChild(li);
    });
    return ol;
  }

  /* 自由漫遊：全部站點清單；目前站點加 aria-current */
  function freeList() {
    if (currentId === "rice") return timeline();
    var list = el("ul", "free-list");
    STOPS.forEach(function (s, i) {
      var li = el("li");
      var label = s.n + ". " + s.place +
        (s.era ? "（" + s.era + "）" : "") +
        (hasPos(s) ? "" : "（未有地圖位置）");
      var b = el("button", "free-item", label);
      b.type = "button";
      if (i === state.idx) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () { goTo(i, { push: true }); });
      li.appendChild(b);
      list.appendChild(li);
    });
    return list;
  }

  function renderFree(frag) {
    if (state.idx < 0) {
      renderIntroText(frag);
      frag.appendChild(modeToggle());
    }
    frag.appendChild(el("h2", "meet-heading free-heading", "全部站點"));
    frag.appendChild(freeList());
    if (state.idx >= 0) {
      var back = el("button", "free-back", "← 返回全部站點");
      back.type = "button";
      back.addEventListener("click", function () { goTo(-1, { push: true }); });
      frag.appendChild(back);
      renderStopBody(frag);
    } else {
      renderRelated(frag);
      frag.appendChild(el("p", "panel-foot", "站點位置為大約位置"));
    }
  }

  /* 「繼續探索」：列出相關路線（路線最後一站及自由漫遊清單底部） */
  function renderRelated(frag) {
    if (!ROUTE.related || !ROUTE.related.length) return;
    var rel = el("section", "related-routes");
    rel.appendChild(el("h3", "meet-heading", "繼續探索"));
    ROUTE.related.forEach(function (id) {
      var r = ROUTES.filter(function (x) { return x.id === id; })[0];
      if (!r) return;
      var p = el("p", "para"); var a = el("a", "text-link", "前往" + r.title + " →");
      a.href = "trail.html#trail=" + r.id; p.appendChild(a); rel.appendChild(p);
    });
    frag.appendChild(rel);
  }

  function renderStepHead(frag) {
    var head = el("div", "page-head");
    var num = el("p", "page-num");
    num.appendChild(el("span", "page-digits", pad2(state.idx + 1)));
    num.appendChild(el("span", "total", " / " + pad2(N)));
    head.appendChild(num);

    var progress = el("ol", "progress");
    progress.setAttribute("aria-label", "進度");
    STOPS.forEach(function (s, i) {
      var li = el("li");
      var b = el("button", "progress-seg" + (i <= state.idx ? " is-on" : ""));
      b.type = "button";
      b.setAttribute("aria-label", "第 " + s.n + " 站：" + s.place);
      if (i === state.idx) b.setAttribute("aria-current", "step");
      b.addEventListener("click", function () { goTo(i, { push: true }); });
      li.appendChild(b);
      progress.appendChild(li);
    });
    head.appendChild(progress);
    frag.appendChild(head);
  }

  function renderNav(frag, focusRole) {
    var nav = el("div", "trail-nav");
    var prev = el("button", "btn btn--prev paper-chip", "← 上一站");
    prev.type = "button";
    prev.disabled = state.idx <= 0;
    prev.addEventListener("click", function () { goTo(state.idx - 1, { push: true, focus: "prev" }); });

    var next = el("button", "btn btn--next paper-chip " + CHIP_BY_ROUTE[currentId], "下一站 →");
    next.type = "button";
    next.disabled = state.idx >= N - 1;
    next.addEventListener("click", function () { goTo(state.idx + 1, { push: true, focus: "next" }); });

    nav.append(prev, next);
    frag.appendChild(nav);
  }

  function mediaEl(m) {
    var fig = el("figure", "stop-fig");
    if (m.type === "video") {
      /* 點擊後才載入 iframe，避免未播放時下載約 4 MB 的第三方播放器 */
      var frame = el("div", "video-frame");
      var play = el("button", "video-facade", "▶ 播放影片");
      play.type = "button";
      play.setAttribute("aria-label", "播放影片：" + m.caption);
      play.addEventListener("click", function () {
        var iframe = el("iframe");
        iframe.src = m.src;
        iframe.title = m.caption;
        iframe.allow = "autoplay; fullscreen";
        frame.textContent = "";
        frame.appendChild(iframe);
      });
      frame.appendChild(play);
      fig.appendChild(frame);
    } else if (m.type === "image") {
      var btn = el("button", "stop-media-btn");
      btn.type = "button";
      btn.setAttribute("aria-label", "放大圖片：" + m.caption);
      var img = el("img");
      img.src = m.src;
      img.alt = m.alt || m.caption;
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(m.src, m.caption, btn); });
      fig.appendChild(btn);
    } else {
      var ph = el("div", "photo-hold");
      ph.setAttribute("role", "img");
      ph.setAttribute("aria-label", "待補：" + m.caption);
      ph.appendChild(el("span", "photo-hold-kind", "相片"));
      ph.appendChild(el("span", "photo-hold-note", m.note));
      fig.appendChild(ph);
    }
    if (m.caption) fig.appendChild(el("figcaption", null, m.caption));
    return fig;
  }

  function renderStop(frag, focusRole) {
    renderStepHead(frag);
    renderNav(frag, focusRole);
    renderStopBody(frag);
    if (state.idx === N - 1) renderRelated(frag);
  }

  function renderStopBody(frag) {
    var s = STOPS[state.idx];
    /* 順序導覽已有「02 / 09」頁碼與標題，不再重複 meta 行；自由探索、自由漫遊沒有頁碼，才顯示 */
    if (EXPLORE_MODE) {
      frag.appendChild(el("p", "stop-meta", s.routeTitle + "．第 " + s.routeOrder + " 站"));
    } else if (state.free) {
      frag.appendChild(el("p", "stop-meta", ROUTE.title + " · 第 " + s.n + " 站，共 " + N + " 站"));
    }
    frag.appendChild(el("h2", "stop-title", s.place));
    if (s.era) frag.appendChild(el("p", "stop-era", s.era));

    var paras = el("div", "paras");
    if (s.paragraphs && s.paragraphs.length) {
      paras.appendChild(el("p", "para", s.paragraphs[0]));
      if (s.paragraphs.length > 1) {
        var details = el("details", "stop-details");
        details.appendChild(el("summary", "stop-summary", "閱讀更多"));
        s.paragraphs.slice(1).forEach(function (text) {
          details.appendChild(el("p", "para", text));
        });
        paras.appendChild(details);
      }
    }
    frag.appendChild(paras);

    if (s.media && s.media.length) {
      var list = el("div", "stop-media-list");
      s.media.forEach(function (m) { list.appendChild(mediaEl(m)); });
      frag.appendChild(list);
    }

    if (s.links.length) {
      var linkList = el("ul", "stop-links");
      s.links.forEach(function (l) {
        var li = el("li"); var a = el("a", "text-link", l.label + " ↗");
        a.href = l.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(a); linkList.appendChild(li);
      });
      frag.appendChild(linkList);
    }

    if (s.meet.length) {
      var meet = el("section", "meet-section");
      meet.appendChild(el("h3", "meet-heading", "在這裡遇見"));
      var chips = el("ul", "meet-list");
      s.meet.forEach(function (item) {
        var li = el("li", "meet-chip");
        li.appendChild(el("span", "dot " + dotClass(item.color)));
        li.appendChild(document.createTextNode(item.label));
        chips.appendChild(li);
      });
      meet.appendChild(chips);
      frag.appendChild(meet);
    }

    if (hasPos(s)) frag.appendChild(el("p", "panel-foot", "站點位置為大約位置"));
    if (s.gpsSource) frag.appendChild(el("p", "stop-gps-source", "位置：" + s.gpsSource));
  }

  function render(focusRole) {
    panel.textContent = "";
    var frag = document.createDocumentFragment();
    if (EXPLORE_MODE) {
      panel.classList.toggle("has-nav", false);
      renderExplore(frag);
      panel.appendChild(frag);
      setNavHeight();
      renderMarkers();
      updateChzIndicator();
      return;
    }
    panel.classList.toggle("has-nav", state.idx >= 0 && !state.free);
    if (state.free) {
      renderFree(frag);
    } else if (state.idx < 0) {
      renderIntro(frag);
    } else {
      renderStop(frag, focusRole);
    }
    panel.appendChild(frag);
    setNavHeight();

    if (focusRole) {
      var target = panel.querySelector(
        focusRole === "prev" ? ".btn--prev" : ".btn--next"
      );
      if (target && !target.disabled) {
        target.focus({ preventScroll: true });
      } else {
        var other = panel.querySelector(focusRole === "prev" ? ".btn--next" : ".btn--prev");
        if (other && !other.disabled) other.focus({ preventScroll: true });
      }
    }
    renderMarkers();
    updateChzIndicator();
  }

  /* ---------- 狀態切換 ---------- */

  function syncHash(push) {
    var h = hashFor(state.idx);
    if (location.hash === h) return;
    if (push) {
      history.pushState(null, "", h);
    } else {
      history.replaceState(null, "", h);
    }
  }

  /* opts.push：是否寫入瀏覽紀錄；opts.focus：換站後聚焦 "next" 或 "prev"；
     opts.instant：不做地圖動畫（換路線、初次載入） */
  function goTo(idx, opts) {
    opts = opts || {};
    var target = clamp(idx, -1, N - 1);
    var changed = target !== state.idx;
    state.cluster = null;   /* 換站或回到介紹時，清除多站位置的選單 */
    state.idx = target;
    render(opts.focus || null);
    syncHash(opts.push !== false);
    if (changed) {
      panel.scrollTop = 0;
      if (mobileMQ.matches) window.scrollTo(0, 0);
    }
    if (opts.instant) applyView(); else moveMap();
    announce(target < 0
      ? ROUTE.title + "：路線介紹"
      : "第 " + STOPS[target].n + " 站：" + STOPS[target].place);
  }

  function step(d) {
    if (state.free || EXPLORE_MODE) return;   /* 自由漫遊及探索模式不依次序換站 */
    var next = state.idx + d;
    if (next < 0 || next > N - 1) return;
    goTo(next, { push: true, focus: d > 0 ? "next" : "prev" });
  }

  /* 換路線：更新站點資料、地圖線條與分頁狀態（不重新載入頁面）；內容由呼叫端用 goTo 繪製 */
  function setRoute(id) {
    currentId = id;
    ROUTE = routeById(id);
    EXPLORE_MODE = id === "explore";
    STOPS = buildStops(ROUTE);
    N = STOPS.length;
    state.idx = -1;
    state.free = false;
    state.cluster = null;
    closeLightbox();
    drawRouteLayers();
  }

  /* 依網址 hash 同步路線與站點：換路線時直接重繪，不重新載入 */
  function applyHash(opts) {
    opts = opts || {};
    var id = routeIdFromHash();
    var routeChanged = id !== currentId;
    if (routeChanged) setRoute(id);
    var wasFree = state.free;
    var target = parseHash();
    if (routeChanged || target !== state.idx || wasFree !== state.free) {
      goTo(target, { push: false, instant: !!opts.instant || routeChanged });
    }
    if (routeChanged || opts.announceRoute) {
      updateRouteChrome();
      announce("已切換至「" + TAB_LABEL[currentId] + "」" + (state.idx < 0 ? "" : "，" + "第 " + STOPS[state.idx].n + " 站：" + STOPS[state.idx].place));
    }
  }

  /* 網址 hash 變動（上一頁、下一頁、手動編輯）時同步；pushState 不會觸發這兩個事件 */
  window.addEventListener("popstate", function () { applyHash(); });
  window.addEventListener("hashchange", function () { applyHash(); });

  /* ---------- 燈箱（圖片放大） ---------- */

  function openLightbox(src, caption, opener) {
    closeLightbox();
    lightboxOpener = opener;
    lightbox = el("div", "lightbox");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", caption);

    var img = el("img", "lightbox-img");
    img.src = src;
    img.alt = caption;

    var close = el("button", "lightbox-close", "關閉");
    close.type = "button";
    close.addEventListener("click", closeLightbox);

    var cap = el("p", "lightbox-cap", caption);

    lightbox.append(img, close, cap);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target === cap) closeLightbox();
    });
    document.body.appendChild(lightbox);
    close.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    if (lightboxOpener) lightboxOpener.focus({ preventScroll: true });
    lightboxOpener = null;
  }

  /* ---------- 鍵盤 ---------- */

  document.addEventListener("keydown", function (e) {
    if (lightbox) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
    if (t && t.closest && t.closest('[role="tablist"]')) return;   /* 分頁自己處理左右鍵 */

    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      step(-1);
    }
  });

  /* ---------- 啟動 ---------- */

  initMap();
  buildTabs();

  /* C6：?pick=1 才載入取點工具；沒有這個參數時完全不載入 */
  if (map && /[?&]pick=1(?:&|$)/.test(location.search)) {
    var pickScript = document.createElement("script");
    pickScript.src = "js/pick-coords.js";
    pickScript.onload = function () { if (window.SHPickCoords) window.SHPickCoords.attach(map); };
    document.head.appendChild(pickScript);
  }

  /* 依網址 hash 還原位置（重新整理後停在同一站或對應物種）；無效的 hash 回到路線介紹 */
  state.idx = parseHash();
  updateRouteChrome();
  render(null);
  syncHash(false);
  applyView();

  /* 版面在載入後仍可能變動（字體、圖片），載入完成後再重算一次 */
  window.addEventListener("load", relayout);
  mobileMQ.addEventListener("change", relayout);
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  });
  relayout();
  announce(state.idx < 0
      ? ROUTE.title + "：路線介紹"
      : "第 " + STOPS[state.idx].n + " 站：" + STOPS[state.idx].place);
})();
