/* 頁面轉場：進場淡入；離場淡出。首頁離開時，四張物種卡紙由中央向外散開後消失。
   減少動態（prefers-reduced-motion）時不做任何動畫。 */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = !!(reduce && reduce.matches);
  var leaving = false;

  function enter() {
    html.classList.remove("is-entering");
  }

  /* 卡紙以 .hero-plates 的中心為原點，沿中心到卡紙中心的方向移出；位移 = 距離 × 1.8，最少 160px */
  function scatter() {
    var hero = document.querySelector(".hero-plates");
    if (!hero) return;
    var hr = hero.getBoundingClientRect();
    var cx = hr.left + hr.width / 2;
    var cy = hr.top + hr.height / 2;
    hero.querySelectorAll(".plate").forEach(function (p) {
      var r = p.getBoundingClientRect();
      var dx = (r.left + r.width / 2) - cx;
      var dy = (r.top + r.height / 2) - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var mag = Math.max(len * 1.8, 160);
      p.style.setProperty("--sx", String(dx / len * mag));
      p.style.setProperty("--sy", String(dy / len * mag));
    });
  }

  function leave(href) {
    leaving = true;
    if (reduced) {
      location.href = href;
      return;
    }
    html.classList.add("is-leaving");
    var delay = 300;
    if (document.body && document.body.classList.contains("page-home")) {
      html.classList.add("is-scattering");
      scatter();
      delay = 650;
    }
    setTimeout(function () { location.href = href; }, delay);
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (a.origin !== location.origin) return;
    var raw = a.getAttribute("href") || "";
    if (raw.charAt(0) === "#") return;                       /* 只改 hash 的連結 */
    if (a.pathname === location.pathname && a.search === location.search && a.hash) return;
    e.preventDefault();
    if (leaving) return;
    leave(a.href);
  }

  function onPageShow(e) {
    /* 按「上一頁」由 bfcache 返回：還原頁面狀態 */
    if (!e.persisted) return;
    leaving = false;
    html.classList.remove("is-leaving", "is-scattering");
    document.querySelectorAll(".plate").forEach(function (p) {
      p.style.removeProperty("--sx");
      p.style.removeProperty("--sy");
    });
  }

  try {
    var start = function () {
      if (reduced) enter();
      else requestAnimationFrame(enter);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onPageShow);
  } catch (err) {
    enter();
  } finally {
    setTimeout(enter, 2000);   /* 保險：無論如何 2 秒後頁面必須可見 */
  }
})();
