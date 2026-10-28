/* 路線探索頁：地圖、逐站切換、網址 hash、鍵盤、底圖失敗處理、圖片放大。
   狀態 idx：-1 為「路線介紹」，0 至 N-1 為各站。 */
(function () {
  "use strict";

  var ROUTES = [window.ROUTE1, window.ROUTE2, window.ROUTE3].filter(Boolean);
  function routeFromHash() {
    var m = /trail=([a-z0-9]+)/i.exec(location.hash);
    for (var i = 0; i < ROUTES.length; i++) { if (m && ROUTES[i].id === m[1]) return ROUTES[i]; }
    return ROUTES[0];
  }
  var ROUTE = routeFromHash();
  function hasPos(s) { return typeof s.lat === "number" && typeof s.lng === "number"; }
  var SPECIES_POINTS = window.SPECIES_POINTS || [];

  /* 物種名稱對應的色票（與 tokens.css 相同） */
  var SPECIES_COLOR = {
    "翅口（沙白）": "--c-clam",
    "水稻": "--c-rice",
    "水牛": "--c-buffalo"
  };

  var SPECIES_META = {
    clam: { name: "翅口（沙白）", color: "--c-clam" },
    buffalo: { name: "水牛", color: "--c-buffalo" },
    rice: { name: "水稻", color: "--c-rice" }
  };
  var NAME_TO_KEY = {};
  Object.keys(SPECIES_META).forEach(function (k) {
    NAME_TO_KEY[SPECIES_META[k].name] = k;
  });

  /* 將 route1.js 的站點資料轉為本頁使用的欄位；缺少的素材（missing）不轉入，即不顯示 */
  var STOPS = ROUTE.stops.map(function (s) {
    return {
      n: s.order,
      place: s.name,
      lat: s.lat,
      lng: s.lng,
      era: s.era || "",
      fit: s.fit !== false,          /* false：總覽視野不計入此站（例如相距過遠的長洲） */
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
  var N = STOPS.length;
  var TILE_ZOOM = 16;

  var header = document.getElementById("siteHeader");
  var wrap = document.getElementById("routeMapWrap");
  var mapNote = document.getElementById("routeMapNote");
  var panel = document.getElementById("routeSidePanel");
  var statusEl = document.getElementById("status");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileMQ = window.matchMedia("(max-width: 899px)");

  var state = { idx: -1, speciesKey: null, free: false };
  var speciesLegend = document.getElementById("speciesLegend");
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
    if (state.speciesKey && idx < 0) {
      return "#species=" + state.speciesKey;
    }
    var base = "#trail=" + ROUTE.id + (state.free ? "&mode=free" : "");
    return idx < 0
      ? base
      : base + "&stop=" + (idx + 1);
  }

  function parseHash() {
    state.free = false;
    var sm = /species=([a-z0-9]+)/i.exec(location.hash);
    if (sm) {
      var key = sm[1];
      if (SPECIES_META[key]) {
        state.speciesKey = key;
        return -1;
      }
    }
    state.speciesKey = null;
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
  var speciesLayer = null;
  var routeLine = null;
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

    var latlngs = STOPS.filter(hasPos).map(function (s) { return [s.lat, s.lng]; });

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

    /* 底下先畫一條較寬的淺色底線（casing），讓深色虛線在森林底圖上清楚可見 */
    L.polyline(latlngs, {
      className: "route-casing",
      color: tokenValue("--bg"),
      weight: 7,
      opacity: 0.85,
      interactive: false
    }).addTo(map);

    routeLine = L.polyline(latlngs, {
      className: "route-line",
      color: tokenValue("--text"),   /* 與 CSS 的 --text 相同 */
      weight: 3,
      opacity: 0.9,
      dashArray: "6 6",
      interactive: false
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    speciesLayer = L.layerGroup().addTo(map);
    updateTileState();
  }

  function speciesPointsFor(key) {
    var name = SPECIES_META[key] && SPECIES_META[key].name;
    return SPECIES_POINTS.filter(function (p) {
      return p.species && p.species.indexOf(name) !== -1;
    });
  }

  function speciesBounds(key) {
    var pts = speciesPointsFor(key);
    if (!pts.length) return null;
    return L.latLngBounds(pts.map(function (p) { return [p.lat, p.lng]; }));
  }

  function speciesIcon(key) {
    return L.divIcon({
      className: "species-marker species-marker--" + key,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  function speciesPopupContent(point, key) {
    var wrap = document.createElement("div");
    var title = document.createElement("strong");
    title.textContent = point.name;
    wrap.appendChild(title);
    point.species.forEach(function (name) {
      var k = NAME_TO_KEY[name];
      if (!k) return;
      var p = document.createElement("p");
      p.style.margin = "6px 0 0";
      var a = document.createElement("a");
      a.href = "species.html#" + k;
      a.textContent = "查看" + name + "故事 →";
      p.appendChild(a);
      wrap.appendChild(p);
    });
    return wrap;
  }

  function renderLegend() {
    if (!speciesLegend) return;
    speciesLegend.textContent = "";
    var title = el("p", "species-legend-title", "物種標記");
    var list = el("ul", "species-legend-list");
    Object.keys(SPECIES_META).forEach(function (key) {
      var item = el("li", "species-legend-item");
      var dot = el("span", "species-legend-dot species-legend-dot--" + key);
      item.appendChild(dot);
      item.appendChild(document.createTextNode(SPECIES_META[key].name));
      list.appendChild(item);
    });
    var note = el("p", "species-legend-note", "標記位置為大約位置");
    speciesLegend.append(title, list, note);
  }

  function tokenValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* 總覽視野的範圍：只計入有位置且 fit 不為 false 的站點 */
  function overviewBounds() {
    var pts = STOPS.filter(function (s) { return hasPos(s) && s.fit; })
      .map(function (s) { return [s.lat, s.lng]; });
    return L.latLngBounds(pts.length ? pts : routeLine.getLatLngs());
  }

  /* 地圖邊界內距：手機 40px，桌面 48px */
  function fitPad() {
    return mobileMQ.matches ? 40 : 48;
  }

  /* 依目前狀態設定視野（不做動畫）：介紹頁包住三個站點；站點則置中於該站；物種 hash 則對應物種點位 */
  function applyView() {
    if (!map) return;
    if (state.speciesKey) {
      var b = speciesBounds(state.speciesKey);
      if (b) {
        var p = fitPad();
        map.fitBounds(b, { padding: [p, p], animate: false });
        return;
      }
    }
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
    if (state.idx < 0 || state.speciesKey) applyView();
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

  function renderStopMarkers() {
    var groups = {}, order = [];
    STOPS.forEach(function (s, i) {
      if (!hasPos(s)) return;
      var k = s.lat.toFixed(6) + "," + s.lng.toFixed(6);
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(i);
    });
    order.forEach(function (k) {
      var idxs = groups[k];
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

    speciesLayer.clearLayers();
    renderLegend();
    SPECIES_POINTS.forEach(function (point) {
      var key = NAME_TO_KEY[point.species && point.species[0]];
      if (!key || !SPECIES_META[key]) return;
      var marker = L.marker([point.lat, point.lng], {
        icon: speciesIcon(key),
        title: point.name + "（" + SPECIES_META[key].name + "）",
        alt: point.name,
        keyboard: true,
        zIndexOffset: 500
      });
      marker.bindPopup(speciesPopupContent(point, key));
      speciesLayer.addLayer(marker);
    });
  }

  function moveMap() {
    if (!map) return;
    if (state.speciesKey) {
      var b = speciesBounds(state.speciesKey);
      if (b) {
        var p = fitPad();
        if (reduceMQ.matches) {
          map.fitBounds(b, { padding: [p, p], animate: false });
        } else {
          map.flyToBounds(b, { padding: [p, p], duration: 0.9 });
        }
        return;
      }
    }
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

  /* ---------- 側欄 ---------- */

  function topLinks() {
    var row = el("div", "panel-links");
    var all = el("a", "text-link", "← 所有路線");
    all.href = "routes.html";
    row.appendChild(all);
    return row;
  }

  function renderIntroText(frag) {
    frag.appendChild(el("h1", "stop-title", ROUTE.title));
    ROUTE.intro.forEach(function (text) {
      frag.appendChild(el("p", "para", text));
    });
    if (ROUTE.sources && ROUTE.sources.length) frag.appendChild(el("p", "panel-foot", "資料來源：" + ROUTE.sources.join("；")));
  }

  /* 介紹區的模式切換：順序導覽 ↔ 自由漫遊 */
  function modeToggle() {
    var a = el("a", "mode-toggle", state.free ? "改為順序導覽" : "改為自由漫遊");
    a.href = state.free ? "#trail=" + ROUTE.id : "#trail=" + ROUTE.id + "&mode=free";
    var p = el("p", "para");
    p.appendChild(a);
    return p;
  }

  function renderIntro(frag) {
    renderIntroText(frag);
    var start = el("button", "btn btn--next btn--start", "由第 1 站開始 →");
    start.type = "button";
    start.addEventListener("click", function () { goTo(0, { push: true, focus: "next" }); });
    var wrapBtn = el("div", "start-row");
    wrapBtn.appendChild(start);
    frag.appendChild(wrapBtn);
    frag.appendChild(modeToggle());
    frag.appendChild(el("p", "panel-foot", "站點位置為大約位置"));
  }

  /* 自由漫遊：全部站點清單；目前站點加 aria-current */
  function freeList() {
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
    var prev = el("button", "btn btn--prev", "← 上一站");
    prev.type = "button";
    prev.disabled = state.idx <= 0;
    prev.addEventListener("click", function () { goTo(state.idx - 1, { push: true, focus: "prev" }); });

    var next = el("button", "btn btn--next", "下一站 →");
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
    frag.appendChild(el("p", "stop-meta", ROUTE.title + " · 第 " + s.n + " 站，共 " + N + " 站 · " + s.place));
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
    frag.appendChild(topLinks());   /* 介紹頁與各站共用：側欄最上方 */
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
     opts.instant：初次載入時不做動畫 */
  function goTo(idx, opts) {
    opts = opts || {};
    var target = clamp(idx, -1, N - 1);
    var changed = target !== state.idx;
    if (target >= 0) state.speciesKey = null;   /* 進入站點後清除物種聚焦 */
    state.idx = target;
    render(opts.focus || null);
    syncHash(opts.push !== false);
    if (changed) {
      panel.scrollTop = 0;
      if (mobileMQ.matches) window.scrollTo(0, 0);
    }
    moveMap();
    announce(target < 0
      ? ROUTE.title + "：路線介紹"
      : "第 " + STOPS[target].n + " 站：" + STOPS[target].place);
  }

  function step(d) {
    if (state.free) return;   /* 自由漫遊不依次序換站 */
    var next = state.idx + d;
    if (next < 0 || next > N - 1) return;
    goTo(next, { push: true, focus: d > 0 ? "next" : "prev" });
  }

  /* 網址 hash 變動（上一頁、下一頁、手動編輯）時同步 */
  function syncFromHash() {
    var rm = /trail=([a-z0-9]+)/i.exec(location.hash);
    if (rm && rm[1] !== ROUTE.id && ROUTES.some(function (r) { return r.id === rm[1]; })) { location.reload(); return; }
    var wasFree = state.free;
    var target = parseHash();
    if (target !== state.idx || state.speciesKey || wasFree !== state.free) goTo(target, { push: false });
  }

  window.addEventListener("popstate", syncFromHash);
  window.addEventListener("hashchange", syncFromHash);

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

  /* 依網址 hash 還原位置（重新整理後停在同一站或對應物種）；無效的 hash 回到路線介紹 */
  state.idx = parseHash();
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
  announce(state.speciesKey
    ? SPECIES_META[state.speciesKey].name + "：地圖點位"
    : state.idx < 0
      ? ROUTE.title + "：路線介紹"
      : "第 " + STOPS[state.idx].n + " 站：" + STOPS[state.idx].place);
})();
