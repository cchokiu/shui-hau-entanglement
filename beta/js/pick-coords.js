/* 取點工具（?pick=1 才載入）：點地圖，顯示十進制（6 位）及度分秒（DMS），附「複製」按鈕。
   用法：window.SHPickCoords.attach(leafletMap)。文字一律用 textContent。 */
(function () {
  "use strict";

  /* 22.220417 → 22°13'13.5"N；負值用 S／W */
  function dms(value, pos, neg) {
    var abs = Math.abs(value);
    var d = Math.floor(abs);
    var m = Math.floor((abs - d) * 60);
    var s = Math.round(((abs - d) * 60 - m) * 60 * 10) / 10;
    if (s >= 60) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    return d + "°" + m + "'" + s.toFixed(1) + '"' + (value >= 0 ? pos : neg);
  }

  function format(latlng) {
    var lat = latlng.lat, lng = latlng.lng;
    return {
      decimal: lat.toFixed(6) + ", " + lng.toFixed(6),
      dms: dms(lat, "N", "S") + " " + dms(lng, "E", "W")
    };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = el("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      if (ok) resolve(); else reject(new Error("copy failed"));
    });
  }

  function attach(map) {
    if (!map || !window.L) return;
    var popup = null;
    map.on("click", function (e) {
      var f = format(e.latlng);
      var box = el("div", "pick-box");
      box.appendChild(el("p", "pick-title", "座標"));
      box.appendChild(el("p", "pick-line pick-decimal", f.decimal));
      box.appendChild(el("p", "pick-line pick-dms", f.dms));
      var row = el("div", "pick-row");
      var btn = el("button", "pick-copy", "複製");
      btn.type = "button";
      var msg = el("span", "pick-msg");
      msg.setAttribute("role", "status");
      btn.addEventListener("click", function () {
        copyText(f.decimal + "\n" + f.dms).then(function () {
          msg.textContent = "已複製";
        }, function () {
          msg.textContent = "無法複製，請手動選取";
        });
      });
      row.append(btn, msg);
      box.appendChild(row);
      if (popup) map.closePopup(popup);
      popup = L.popup({ className: "pick-popup", closeButton: true, autoPan: true, maxWidth: 280 })
        .setLatLng(e.latlng)
        .setContent(box)
        .openOn(map);
    });
  }

  window.SHPickCoords = { attach: attach, format: format };
})();
