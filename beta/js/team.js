/* 項目團隊頁：依 data/team.js 生成各組與成員。只用 textContent，不插入 HTML。 */
(function () {
  "use strict";

  var GROUPS = window.TEAM || [];
  var root = document.getElementById("teamGroups");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  GROUPS.forEach(function (g) {
    var sec = el("section", "team-group");
    sec.appendChild(el("h2", "team-group-title", g.group));
    var list = el("ul", "team-list");
    (g.members || []).forEach(function (m) {
      var li = el("li", "team-member");
      /* 英文欄位（name_en、title_en 等）留作日後英文版，中文版暫不顯示 */
      li.appendChild(el("h3", "team-name", m.name));
      if (m.title) li.appendChild(el("p", "team-title", m.title));
      if (m.same_as) li.appendChild(el("p", "team-note", "簡介見" + m.same_as));
      if (m.bio) li.appendChild(el("p", "para team-bio", m.bio));
      list.appendChild(li);
    });
    sec.appendChild(list);
    root.appendChild(sec);
  });
})();
