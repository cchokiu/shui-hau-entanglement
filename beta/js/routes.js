(function () {
  "use strict";
  var routes = [window.ROUTE1, window.ROUTE2, window.ROUTE3].filter(Boolean);
  var list = document.getElementById("routeCards");
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  routes.forEach(function (r) {
    var li = el("li", "route-card");
    var a = el("a", "route-card-link");
    a.href = "trail.html#trail=" + encodeURIComponent(r.id);
    a.appendChild(el("h2", "route-card-title", r.title));
    if (r.intro && r.intro[0]) a.appendChild(el("p", "para", r.intro[0]));
    a.appendChild(el("p", "route-card-meta", "共 " + r.stops.length + " 站 →"));
    li.appendChild(a);
    list.appendChild(li);
  });
})();
