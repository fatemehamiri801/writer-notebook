/* a11y.js — دسترس‌پذیری مشترک همه‌ی صفحه‌ها
   ۱) رویدادهای کلیک (به‌جای onclick درون‌خطی) با addEventListener
   ۲) الگوی تب‌ها (tablist / tab / tabpanel + کنترل با صفحه‌کلید)
   ۳) نام قابل‌خواندن برای دکمه‌های فقط‌آیکن */
(function () {
  "use strict";

  /* ---------- ۱) کلیک‌ها ---------- */
  var ACTIONS = {
    closeWindow: function () { window.close(); }
  };

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-open-tab],[data-click]") : null;
    if (!t) return;
    var tab = t.getAttribute("data-open-tab");
    if (tab) {
      if (typeof window.openTab === "function") {
        // openTab از evt.currentTarget استفاده می‌کند
        window.openTab({ currentTarget: t, target: t, preventDefault: function () {} }, tab);
      }
      return;
    }
    var name = t.getAttribute("data-click"), fn = ACTIONS[name] || window[name];
    if (typeof fn === "function") fn.call(t, e);
  });

  /* ---------- ۲) تب‌ها ---------- */
  function tabsOf(nav) {
    return Array.prototype.slice.call(nav.querySelectorAll("[data-open-tab]"));
  }

  function syncTabs(nav) {
    var tabs = tabsOf(nav);
    if (!tabs.length) return;
    nav.setAttribute("role", "tablist");
    if (!nav.hasAttribute("aria-label")) nav.setAttribute("aria-label", "بخش‌های دفترچه");
    var activeIdx = -1;
    tabs.forEach(function (b, i) { if (b.classList.contains("active")) activeIdx = i; });
    if (activeIdx < 0) activeIdx = 0;
    tabs.forEach(function (b, i) {
      var id = b.getAttribute("data-open-tab"), panel = document.getElementById(id), on = i === activeIdx;
      if (!b.id) b.id = "tabbtn-" + id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.setAttribute("aria-controls", id);
      b.tabIndex = on ? 0 : -1;
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", b.id);
      }
    });
  }

  function initTabs() {
    var nav = document.querySelector("nav");
    if (!nav || !nav.querySelector("[data-open-tab]")) return;
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      Promise.resolve().then(function () { pending = false; syncTabs(nav); });
    }
    syncTabs(nav);
    // تب‌هایی که extras.js بعداً اضافه می‌کند و تغییر کلاس active
    new MutationObserver(schedule).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    // ←/→ (با درنظر گرفتن راست‌به‌چپ)، Home و End؛ فوکوس جابه‌جا می‌شود و Enter/Space تب را باز می‌کند
    nav.addEventListener("keydown", function (e) {
      var cur = e.target.closest ? e.target.closest("[role=tab]") : null;
      if (!cur) return;
      var tabs = tabsOf(nav), i = tabs.indexOf(cur), rtl = getComputedStyle(nav).direction === "rtl", n = -1;
      if (e.key === "ArrowRight") n = rtl ? i - 1 : i + 1;
      else if (e.key === "ArrowLeft") n = rtl ? i + 1 : i - 1;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = tabs.length - 1;
      else return;
      e.preventDefault();
      n = (n + tabs.length) % tabs.length;
      tabs.forEach(function (b, k) { b.tabIndex = k === n ? 0 : -1; });
      tabs[n].focus();
    });
  }

  /* ---------- ۳) نام دکمه‌های فقط‌آیکن ---------- */
  function hasText(el) {
    // متنی که حرف یا رقم داشته باشد؛ ایموجی و نمادها به‌تنهایی نام حساب نمی‌شوند
    return /[\p{L}\p{N}]/u.test((el.textContent || "").replace(/\s+/g, ""));
  }
  function labelIconButtons(root) {
    var list = (root || document).querySelectorAll("button, [role=button]");
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b.hasAttribute("aria-label") || b.hasAttribute("aria-labelledby") || hasText(b)) continue;
      var name = b.getAttribute("title");
      if (name) b.setAttribute("aria-label", name);
    }
  }

  function initDarkToggle() {
    var d = document.getElementById("dark-mode-toggle");
    if (!d) return;
    var root = document.documentElement;
    function s() { d.setAttribute("aria-pressed", root.classList.contains("nb-dark") ? "true" : "false"); }
    s();
    new MutationObserver(s).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  function init() {
    initTabs();
    initDarkToggle();
    labelIconButtons();
    var timer = 0;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { labelIconButtons(); }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ---------- ۴) ثبت سرویس‌ورکر (مشترک همه‌ی صفحه‌ها) ----------
     تا اگر کاربر مستقیم با لینک یا میانبر PWA هر صفحه‌ای را باز کرد
     (مثلاً nevisandegi یا reader) آفلاین‌کار کند. ثبت تکراری بی‌ضرر است. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }
})();
