/* 共用：頁首高度寫入 --hdr-h（供全高區塊使用）；暫時連結（href="#"）不改變網址。 */
(function () {
  "use strict";

  var header = document.getElementById("siteHeader");

  function setHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty(
      "--hdr-h",
      (header.offsetHeight + 1) + "px"
    );
  }

  setHeaderHeight();
  window.addEventListener("load", setHeaderHeight);
  window.addEventListener("resize", setHeaderHeight);

  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });
})();
