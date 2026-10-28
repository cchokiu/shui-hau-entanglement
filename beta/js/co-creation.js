(function () {
  "use strict";
  var DATA = window.CO_CREATION || {};
  var EMBED_OK = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|www\.youtube\.com\/embed\/|player\.vimeo\.com\/video\/)/;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function card(kind, item) {
    var box = el("article", "cc-item");
    if (kind === "gallery" && item.src) {
      var img = el("img");
      img.src = item.src; img.alt = item.alt || item.title || ""; img.loading = "lazy";
      box.appendChild(img);
    }
    if (kind === "video" && EMBED_OK.test(item.src || "")) {
      var frame = el("div", "video-frame");
      var ifr = el("iframe");
      ifr.src = item.src; ifr.title = item.title || "影片"; ifr.loading = "lazy"; ifr.allow = "fullscreen";
      frame.appendChild(ifr);
      box.appendChild(frame);
    }
    if (item.title) box.appendChild(el("h3", "cc-item-title", item.title));
    [].concat(item.desc || []).forEach(function (t) { box.appendChild(el("p", "para", t)); });
    var meta = [item.author, item.date].filter(Boolean).join(" · ");
    if (meta) box.appendChild(el("p", "cc-item-meta", meta));
    return box;
  }
  document.querySelectorAll(".cc-section").forEach(function (sec) {
    var kind = sec.getAttribute("data-kind");
    var items = DATA[kind] || [];
    var box = sec.querySelector(".cc-items");
    if (!items.length) { box.appendChild(el("p", "cc-empty", "內容陸續加入")); return; }
    items.forEach(function (it) { box.appendChild(card(kind, it)); });
  });
})();
