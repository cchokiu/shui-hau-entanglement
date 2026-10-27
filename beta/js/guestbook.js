/* 留言板前端：載入已核准留言、提交新留言、防 XSS（全部用 textContent）。
   依賴 window.CONFIG.GUESTBOOK_URL；未設定時只顯示「留言功能即將開放」。 */
(function () {
  "use strict";

  var CONFIG = window.CONFIG || {};

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.getFullYear() + "-" +
      pad2(d.getMonth() + 1) + "-" +
      pad2(d.getDate()) + " " +
      pad2(d.getHours()) + ":" +
      pad2(d.getMinutes());
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function renderMessages(container, url) {
    fetch(url, { method: "GET", headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        container.textContent = "";
        if (!Array.isArray(list) || !list.length) {
          container.appendChild(el("p", "guestbook-empty", "暫時沒有留言"));
          return;
        }
        var ul = el("ul", "guestbook-list");
        list.forEach(function (item) {
          var li = el("li", "guestbook-item");
          var name = el("strong", "guestbook-author",
            (item.name || "匿名").toString());
          var msg = el("span", "guestbook-message",
            (item.message || "").toString());
          var time = el("time", "guestbook-time", formatTime(item.timestamp));
          li.appendChild(name);
          li.appendChild(document.createTextNode("："));
          li.appendChild(msg);
          li.appendChild(document.createTextNode(" "));
          li.appendChild(time);
          ul.appendChild(li);
        });
        container.appendChild(ul);
      })
      .catch(function () {
        container.textContent = "";
        container.appendChild(el("p", "guestbook-error", "無法載入留言"));
      });
  }

  function renderForm(messagesContainer, url) {
    var status = el("p", "guestbook-status", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    var form = el("form", "guestbook-form");

    // Honeypot field — hidden from real users.
    var hp = el("input", "guestbook-hp");
    hp.type = "text";
    hp.name = "website";
    hp.tabIndex = -1;
    hp.setAttribute("aria-hidden", "true");
    hp.setAttribute("autocomplete", "off");
    hp.setAttribute("placeholder", "請勿填寫此欄位");

    var nameLabel = el("label", "guestbook-label", "稱呼（選填）");
    var nameInput = el("input", "guestbook-input");
    nameInput.type = "text";
    nameInput.name = "name";
    nameInput.maxLength = 40;
    nameLabel.appendChild(nameInput);

    var msgLabel = el("label", "guestbook-label", "留言");
    var msgInput = el("textarea", "guestbook-textarea");
    msgInput.name = "message";
    msgInput.required = true;
    msgInput.maxLength = 500;
    msgInput.rows = 4;
    msgLabel.appendChild(msgInput);

    var submit = el("button", "btn guestbook-submit", "送出");
    submit.type = "submit";

    form.append(hp, nameLabel, msgLabel, submit, status);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (hp.value.trim()) {
        status.textContent = "";
        return;
      }
      status.textContent = "傳送中…";
      fetch(url, { method: "POST", body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) {
            status.textContent = "已收到，經審核後顯示";
            form.reset();
            renderMessages(messagesContainer, url);
          } else {
            status.textContent = (data && data.error) || "傳送失敗";
          }
        })
        .catch(function () {
          status.textContent = "傳送失敗";
        });
    });

    return form;
  }

  function init(container, url) {
    if (!container) return;
    container.textContent = "";
    if (!url) {
      container.appendChild(el("p", "guestbook-soon", "留言功能即將開放"));
      return;
    }
    container.appendChild(el("h2", "guestbook-title", "留言板"));
    var messagesContainer = el("div", "guestbook-messages");
    container.appendChild(messagesContainer);
    container.appendChild(renderForm(messagesContainer, url));
    renderMessages(messagesContainer, url);
  }

  window.Guestbook = { init: init };

  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("guestbook");
    if (container && typeof CONFIG.GUESTBOOK_URL !== "undefined") {
      init(container, CONFIG.GUESTBOOK_URL);
    }
  });
})();
