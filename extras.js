/* ======================================================================
   extras.js — قابلیت‌های جدید «دفترچه من»
   ۱) قالب ژانر   ۲) تب ساختار (کارت‌های جابه‌جاشونده)   ۳) فهرست کتاب‌ها
   ۵) سؤال تصادفی   ۶) انتخاب تب‌ها برای PDF
   ۷) اندازهٔ فونت قابل تنظیم
   داده‌های اضافه داخل همان پروژه (کلیدهای __meta و __cards) ذخیره می‌شوند،
   پس بک‌آپ و بازیابی پروژه خودکار آن‌ها را هم شامل می‌شود.
   ====================================================================== */
(function () {
'use strict';

var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
var isWriter = path.indexOf('nevisandegi') > -1;
var isReader = path.indexOf('reader') > -1;
var isAbout = path.indexOf('about') > -1;
var isLibrary = path.indexOf('library') > -1;
var isWorks = path.indexOf('works') > -1;
if (!(isWriter || isReader || isAbout || isLibrary || isWorks)) return;

var NS = (isWriter || isWorks) ? 'nvsdg' : 'reader';
var root = document.documentElement;
if (isWriter) root.classList.add('nbx-writer');
if (isReader) root.classList.add('nbx-reader');

/* ---------- ابزارهای کوچک ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
var FA_CACHE = {}, FA_N = 0;
function fa(n) { var k = String(n), v = FA_CACHE[k]; if (v !== undefined) return v; v = Number(n).toLocaleString('fa-IR'); if (FA_N < 4000) { FA_CACHE[k] = v; FA_N++; } return v; }
function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dateKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function uid() { return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
function grow(t) { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 56) + 'px'; }
/* نسخهٔ دسته‌ای: اول همه را auto می‌کند، بعد همه را می‌خواند، بعد می‌نویسد؛ فقط یک بار چیدمان محاسبه می‌شود */
function growAll(list) {
    list = Array.prototype.slice.call(list);
    list.forEach(function (t) { t.style.height = 'auto'; });
    var hs = list.map(function (t) { return Math.max(t.scrollHeight, 56); });
    list.forEach(function (t, i) { t.style.height = hs[i] + 'px'; });
}
function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

function toast(msg) {
    var t = el('div', { 'class': 'nbx-toast', role: 'status' }, esc(msg));
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2800);
}

/* ---------- استایل‌ها ---------- */
var css = '' +
'html{--nbx-bg:color-mix(in srgb,var(--tint,#f6c3d0) 35%,#fbf1e3);--nbx-bd:color-mix(in srgb,var(--acc,#e58fa8) 55%,#e8d8c0);--nbx-tx:#3a2a3f;--nbx-mut:#7a6a7f;--nbx-ac:var(--acc,#e58fa8);--nbx-acd:var(--accd,#a8456a);--nbx-in:color-mix(in srgb,var(--tint,#f6c3d0) 14%,#fbf3e2)}' +
'html.nb-dark{--nbx-bg:#2c251d;--nbx-bd:#54483a;--nbx-tx:#eadfc6;--nbx-mut:#a99c82;--nbx-acd:var(--accd,#f0a3b8);--nbx-in:#1c1712}' +
'body.nbx-lock{overflow:hidden}' +
/* دکمهٔ فونت */
'#nbx-font-btn{position:fixed;top:15px;left:66px;z-index:1000;width:44px;height:44px;border-radius:50%;border:1.5px dashed #e3c26d;background:#3a2a3f;color:#f3dc93;font:700 15px Vazirmatn,Tahoma,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);padding:0}' +
'html.nb-dark #nbx-font-btn{background:#2b2118;border-color:#a87b3c;color:#e3c26d}' +
'@media(max-width:600px){#nbx-font-btn{width:38px;height:38px;top:10px;left:56px;font-size:13px}}' +
'@media(min-width:601px){body>header{padding-left:128px!important}}' +
'.nbx-navbar{display:none;align-items:center;gap:10px;margin:2px 12px 6px;direction:rtl}' +
'.nbx-navbar.on{display:flex}' +
'.nbx-navtrack{position:relative;flex:1;height:6px;border-radius:6px;background:rgba(150,90,120,.22);overflow:hidden}' +
'.nbx-navthumb{position:absolute;top:0;bottom:0;border-radius:6px;background:#c0587f;transition:right .08s}' +
'.nbx-navhint{font:700 .78rem Vazirmatn,Tahoma,sans-serif;color:#8f3556;white-space:nowrap}' +
'html.nb-dark .nbx-navtrack{background:rgba(227,194,109,.25)}html.nb-dark .nbx-navthumb{background:#e3c26d}html.nb-dark .nbx-navhint{color:#e3c26d}' +
'.nbx-navbar.done .nbx-navhint{display:none}' +
'.nbx-fontpop{position:fixed;top:66px;left:10px;z-index:1001;display:none;gap:8px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--nbx-bg);border:1.5px solid var(--nbx-bd);color:var(--nbx-tx);box-shadow:0 10px 26px rgba(0,0,0,.28);font-family:Vazirmatn,Tahoma,sans-serif}' +
'.nbx-fontpop.open{display:flex}' +
'.nbx-fontpop button{min-width:40px;height:40px;border-radius:10px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-tx);font:700 16px Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
'.nbx-fontpop span{min-width:68px;text-align:center;font-size:.85rem}' +
/* آمار */
/* chips و دکمه‌ها */
'.nbx-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}' +
'.nbx-chip{padding:8px 14px;border-radius:999px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-tx);font:600 .88rem Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
'.nbx-chip[aria-pressed="true"]{background:var(--nbx-acd);border-color:var(--nbx-acd);color:#fff}' +
'html.nb-dark .nbx-chip[aria-pressed="true"]{color:#1c1712;background:#e3c26d;border-color:#e3c26d}' +
'.nbx-chip small{opacity:.75;margin-right:4px}' +
'.nbx-btn{padding:9px 16px;border-radius:10px;border:1.5px solid var(--nbx-ac);background:var(--nbx-in);color:var(--nbx-acd);font:700 .88rem Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
'.nbx-btn.primary{background:var(--nbx-acd);color:#fff;border-color:var(--nbx-acd)}' +
'html.nb-dark .nbx-btn.primary{background:#e3c26d;color:#1c1712;border-color:#e3c26d}' +
'.nbx-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
'.nbx-muted{color:var(--nbx-mut);font-size:.85rem}' +
'.nbx-genre-set[hidden]{display:none}' +
'.nbx-empty{padding:18px;border:2px dashed var(--nbx-bd);border-radius:12px;text-align:center;color:var(--nbx-mut)}' +
/* کارت‌های ساختار */
'.nbx-card{display:flex;gap:10px;align-items:flex-start;background:color-mix(in srgb,var(--nbx-ac) 16%,var(--nbx-in));border:1px solid var(--nbx-bd);border-right:6px solid var(--nbx-ac);border-radius:12px;padding:10px 12px;margin:10px 0;touch-action:pan-y}' +
'html.nb-dark .nbx-card{background:#2c251d}' +
'.nbx-card.scene{margin-right:22px;border-right-width:4px;opacity:.97}' +
'.nbx-card.chapter{border-right-width:8px;background:color-mix(in srgb,var(--nbx-ac) 28%,var(--nbx-in))}' +
'html.nb-dark .nbx-card.chapter{background:#352c22}' +
'.nbx-handle{flex:none;width:34px;height:40px;border-radius:8px;border:1.5px dashed var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-mut);font-size:1.2rem;cursor:grab;touch-action:none;padding:0}' +
'.nbx-card-main{flex:1;min-width:0}' +
'.nbx-card-top{display:flex;gap:8px;align-items:center;margin-bottom:6px}' +
'.nbx-badge{flex:none;padding:3px 10px;border-radius:999px;background:var(--nbx-acd);color:#fff;font-size:.75rem;font-weight:700}' +
'html.nb-dark .nbx-badge{background:#e3c26d;color:#1c1712}' +
'.nbx-card input.nbx-title,.nbx-card textarea.nbx-note,.nbx-card select{width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;box-sizing:border-box}' +
'.nbx-card input.nbx-title{font-weight:700}' +
'.nbx-card textarea.nbx-note{min-height:56px!important;height:56px;resize:none;overflow:hidden;line-height:1.8}' +
'.nbx-card-foot{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;align-items:center}' +
'.nbx-card-foot select{width:auto;min-width:96px;padding:5px 8px;font-size:.8rem}' +
'.nbx-mini{width:34px;height:32px;border-radius:8px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-tx);cursor:pointer;padding:0;font-size:.95rem}' +
'.nbx-mini.del{color:#c0392b}' +
'.nbx-dragging{opacity:.9;box-shadow:0 12px 28px rgba(0,0,0,.3);transform:scale(1.01);position:relative;z-index:5}' +
/* سؤال تصادفی */
'.nbx-dice{margin:0 0 18px;padding:16px;border-radius:12px;background:var(--straw,#f6dca6);color:var(--nbx-tx);border:1.5px dashed var(--nbx-bd);font-family:Vazirmatn,Tahoma,sans-serif}' +
'html.nb-dark .nbx-dice{background:#4d3f22;color:#f3e3b4}' +
'.nbx-dice h3{margin:0 0 8px;font-size:1rem}' +
'.nbx-dice-q{font-size:1.05rem;font-weight:700;line-height:1.9;min-height:2.2em;margin:6px 0 10px}' +
'.nbx-dice textarea{width:100%;min-height:90px;margin:8px 0;padding:10px;border-radius:10px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;box-sizing:border-box}' +
/* مودال */
'.nbx-ov{position:fixed;inset:0;z-index:2000;background:rgba(20,10,5,.55);display:flex;align-items:center;justify-content:center;padding:14px;font-family:Vazirmatn,Tahoma,sans-serif}' +
'.nbx-modal{width:min(640px,100%);max-height:92vh;overflow:auto;border-radius:16px;background:var(--nbx-bg);color:var(--nbx-tx);border:1.5px solid var(--nbx-bd);box-shadow:0 20px 50px rgba(0,0,0,.45);padding:0}' +
'html:not(.nb-dark) .nbx-modal{background:color-mix(in srgb,var(--tint,#f6c3d0) 28%,#fbf3e6)}' +
'.nbx-mhead{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:inherit;border-bottom:1.5px dashed var(--nbx-bd)}' +
'.nbx-mhead h2{margin:0;font-size:1.15rem;color:var(--nbx-tx)!important}' +
'.nbx-x{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-tx);cursor:pointer;font-size:1rem}' +
'.nbx-mbody{padding:14px 18px 18px}' +
'.nbx-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}' +
'.nbx-sum div{padding:10px;border-radius:10px;background:var(--nbx-in);border:1px solid var(--nbx-bd);text-align:center;font-size:.8rem;color:var(--nbx-mut)}' +
'.nbx-sum b{display:block;font-size:1.35rem;color:var(--nbx-tx)}' +
'.nbx-sum .big{grid-column:1/-1;background:var(--nbx-acd);border-color:var(--nbx-acd);color:#fff}' +
'.nbx-sum .big b{color:#fff;font-size:1.5rem}' +
'html.nb-dark .nbx-sum .big{background:#4d3f22;border-color:#a87b3c;color:#f3e3b4}' +
'html.nb-dark .nbx-sum .big b{color:#f3e3b4}' +
'.nbx-book{padding:12px;margin:8px 0;border-radius:12px;background:var(--nbx-in);border:1px solid var(--nbx-bd);border-right:5px solid var(--nbx-ac)}' +
'.nbx-book-top{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
'.nbx-book-name{font-weight:700;font-size:1rem}' +
'.nbx-stars{display:inline-flex;gap:2px;direction:ltr}' +
'.nbx-star{border:0;background:none;font-size:1.7rem;line-height:1;cursor:pointer;color:#9a7f45;padding:2px;min-width:42px;min-height:42px;display:inline-flex;align-items:center;justify-content:center}html.nb-dark .nbx-star{color:#b3a47c}html.nb-dark .nbx-star.on{color:#f0c34a}' +
'.nbx-star.on{color:#e3a712}' +
'.nbx-book-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;font-size:.82rem;color:var(--nbx-mut)}' +
'.nbx-book select,.nbx-book input[type=date],.nbx-meta select,.nbx-meta input[type=date],.nbx-modal select{padding:6px 8px;border-radius:8px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;font-size:.82rem}' +
/* انتخاب چاپ */
'.nbx-pick{display:flex;flex-direction:column;gap:6px;margin:10px 0}' +
'.nbx-pick label{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--nbx-in);border:1px solid var(--nbx-bd);cursor:pointer;color:var(--nbx-tx)!important;font-size:.92rem}' +
'.nbx-pick input{width:20px;height:20px;accent-color:var(--nbx-ac)}' +
'.nbx-pick small{margin-right:auto;color:var(--nbx-mut)}' +
/* toast */
'.nbx-toast{position:fixed;bottom:22px;left:50%;transform:translate(-50%,30px);opacity:0;z-index:3000;padding:12px 20px;border-radius:12px;background:#3a2a3f;color:#f3dc93;font:700 .9rem Vazirmatn,Tahoma,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.35);transition:all .3s;max-width:90vw;text-align:center}' +
'.nbx-toast.show{opacity:1;transform:translate(-50%,0)}' +
/* رنگ تب‌های جدید نویسنده */
'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(6){background:#fdd9c4!important}' +
'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(7){background:#cdeaf0!important}' +
'html.nbx-writer[data-tab="5"]{--tint:#fdd9c4;--acc:#ee9a74;--accd:#a8532e;--ml:rgba(238,154,116,.6)}' +
'html.nbx-writer[data-tab="6"]{--tint:#cdeaf0;--acc:#5fb3c4;--accd:#2a7a8b;--ml:rgba(95,179,196,.6)}' +
'html.nbx-writer:not(.nb-dark)[data-tab="5"]{--pt:#fde2d0}' +
'html.nbx-writer:not(.nb-dark)[data-tab="6"]{--pt:#d6edf1}' +
'html.nbx-writer.nb-dark[data-tab="5"]{--accd:#f2b08f}html.nbx-writer.nb-dark[data-tab="6"]{--accd:#8fd3e0}' +
'.project-toolbar #search-box{min-width:0;flex:1 1 140px}.project-toolbar{max-width:100%;box-sizing:border-box}' +
'@media(max-width:600px){.nbx-card.scene{margin-right:12px}}' +
'@media(prefers-reduced-motion:reduce){.nbx-bar b,.nbx-toast{transition:none}}';
document.head.appendChild(el('style', { id: 'nbx-css' }, css));

/* ---- افزودنی‌ها: تب‌های چسبان، منوی پروژه، کهن‌الگوها، مینی‌آموزش ---- */
var css2 = [
'.nav-wrapper{position:sticky;top:0;z-index:99;background:var(--pt,#fbf6e9);box-shadow:0 2px 8px rgba(0,0,0,.12)}.nav-wrapper nav{position:relative;top:auto}',
'html body .nav-wrapper{background:var(--pt,var(--pp,#fbf6e9))!important}html.nb-dark body .nav-wrapper{background:#2a231b!important}',
'.nbx-tb-more{display:none}.nbx-tb-panel{display:contents}',
'@media(max-width:700px){',
'.project-toolbar{padding:10px 12px!important;gap:8px!important}',
'.nbx-tb-more{display:inline-flex;align-items:center;gap:6px}',
'html body .project-toolbar .nbx-tb-more.btn-toolbar.btn-toolbar{background:var(--accd,#6b4a1e)!important;color:#fff!important;border:2px solid var(--accd,#6b4a1e)!important;border-radius:12px!important;min-height:44px;padding:8px 16px!important;font-size:.95rem!important;box-shadow:0 3px 0 rgba(0,0,0,.25),0 4px 10px rgba(0,0,0,.15);cursor:pointer;-webkit-tap-highlight-color:transparent}',
'.nbx-tb-more:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25)}',
'.nbx-tb-more .nbx-tb-ch{display:inline-block;transition:transform .2s}.nbx-tb-more[aria-expanded="true"] .nbx-tb-ch{transform:rotate(180deg)}',
'html.nb-dark body .project-toolbar .nbx-tb-more.btn-toolbar.btn-toolbar{background:#e3c26d!important;color:#1c1712!important;border-color:#e3c26d!important}',
'.nbx-tb-panel{display:none}',
'.nbx-tb-panel.open{display:flex;flex:1 1 100%;flex-wrap:wrap;gap:8px;padding-top:6px}',
'.nbx-tb-panel .btn-toolbar,.nbx-tb-panel .btn-toolbar-danger{flex:1 1 calc(50% - 8px);text-align:center}',
'.nbx-tb-panel>div{flex:1 1 100%;margin-right:0!important}',
'html body .nav-wrapper{position:static!important;box-shadow:none}',
'html body .nav-wrapper::before,html body .nav-wrapper::after{display:none!important;content:none!important}',
'html body .nav-wrapper nav{margin:0!important;position:static!important;overflow:visible!important;flex-wrap:wrap!important;white-space:normal!important;justify-content:center!important;gap:8px!important;padding:12px 10px!important}',
'html body .nav-wrapper nav .nav-link{flex:1 1 auto!important;padding:12px 14px!important;min-height:46px;font-size:1rem!important;border-radius:12px!important;margin:0!important;border-bottom-width:2px!important;text-align:center}',
'.nbx-navbar,.nbx-navbar.on{display:none!important}',
'}',
'.nbx-guide{margin-bottom:12px}.nbx-guide>summary h3,.nbx-learn>summary h3{border-bottom:0!important;padding-bottom:0!important;margin-bottom:0!important}.nbx-hub-seg{margin-bottom:28px}.nbx-road-st h3 small{font-weight:400;font-size:.8rem}',
'.nbx-road-it{display:flex;gap:8px;align-items:flex-start;padding:3px 0;cursor:pointer;font-size:.9rem;line-height:1.8}.nbx-road-it input{margin-top:6px;width:18px;height:18px;flex:none}.nbx-road-it.on span{opacity:.6;text-decoration:line-through}',
'.nbx-pr{padding:8px 12px;margin:8px 0;border-radius:10px;border:1px solid var(--nbx-bd);background:var(--nbx-in)}.nbx-pr b{display:block}.nbx-pr p{margin:2px 0 0;font-size:.88rem;line-height:1.9}',
'.nbx-arch>summary{cursor:pointer;list-style:none}.nbx-arch>summary h3{display:inline}.nbx-arch>summary small{display:block;opacity:.75;margin-top:2px}',
'.nbx-arch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}',
'.nbx-arch-card{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:right;padding:10px 12px;border-radius:12px;border:1.5px dashed var(--acc,#9d85d6);background:rgba(255,255,255,.55);color:inherit;font:inherit;cursor:pointer}',
'.nbx-arch-card .ic{font-size:1.5rem}.nbx-arch-card small{font-size:.74rem;line-height:1.55;opacity:.8}.nbx-arch-card em{font-style:normal;font-size:.78rem;font-weight:700;color:var(--accd,#5e45a3);margin-top:auto}',
'.nbx-arch-card:hover,.nbx-arch-card:focus-visible{transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,0,0,.12)}',
'html.nb-dark .nbx-arch-card{background:rgba(255,255,255,.06)}',
'.nbx-tips{margin:10px 22px 10px 0;padding:0;line-height:1.95}.nbx-tips li{margin-bottom:6px}',
'.nbx-ex{margin-top:8px;padding:10px 12px;border-radius:10px;border:1.5px dashed var(--acc,#9d85d6);background:rgba(255,255,255,.45)}',
'html.nb-dark .nbx-ex{background:rgba(255,255,255,.06)}'
].join('');
document.head.appendChild(el('style', { id: 'nbx-css2' }, css2));

/* ======================================================================
   ۷) اندازهٔ فونت (همهٔ صفحه‌ها)
   ====================================================================== */
var FONT_STEPS = [100, 112, 125, 140];
var fontLevel = parseInt(lsGet('nb-font-level', '0'), 10);
if (!(fontLevel >= 0 && fontLevel < FONT_STEPS.length)) fontLevel = 0;
function applyFont() { root.style.fontSize = FONT_STEPS[fontLevel] + '%'; }
applyFont();
(function () {
    var btn = el('button', { id: 'nbx-font-btn', type: 'button', title: 'اندازهٔ متن', 'aria-label': 'اندازهٔ متن', 'aria-expanded': 'false' }, 'Aa');
    var pop = el('div', { 'class': 'nbx-fontpop', role: 'group', 'aria-label': 'اندازهٔ متن' });
    var minus = el('button', { type: 'button', 'aria-label': 'کوچک‌تر' }, 'A−');
    var plus = el('button', { type: 'button', 'aria-label': 'بزرگ‌تر' }, 'A+');
    var lab = el('span');
    var reset = el('button', { type: 'button', 'aria-label': 'اندازهٔ عادی' }, '↺');
    function paint() {
        lab.textContent = fa(FONT_STEPS[fontLevel]) + '٪';
        minus.disabled = fontLevel === 0; plus.disabled = fontLevel === FONT_STEPS.length - 1;
        minus.style.opacity = minus.disabled ? .4 : 1; plus.style.opacity = plus.disabled ? .4 : 1;
    }
    function set(l) { fontLevel = Math.max(0, Math.min(FONT_STEPS.length - 1, l)); lsSet('nb-font-level', String(fontLevel)); applyFont(); paint(); }
    minus.onclick = function () { set(fontLevel - 1); };
    plus.onclick = function () { set(fontLevel + 1); };
    reset.onclick = function () { set(0); };
    pop.appendChild(minus); pop.appendChild(lab); pop.appendChild(plus); pop.appendChild(reset);
    btn.onclick = function (e) { e.stopPropagation(); var o = pop.classList.toggle('open'); btn.setAttribute('aria-expanded', o); };
    document.addEventListener('click', function (e) { if (!pop.contains(e.target) && e.target !== btn) { pop.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
    paint();
    document.body.appendChild(btn); document.body.appendChild(pop);
})();

if (isAbout) return; // صفحهٔ «دربارهٔ ما» فقط کنترل فونت را می‌گیرد

/* ---------- دسترسی به دادهٔ پروژه‌ها در صفحه‌ی کتابخانه (بدون صفحهٔ دفترچه) ---------- */
if (typeof window.nbIdbGet !== 'function') {
    (function () {
        var DB = 'nb-storage', ST = 'projectData', prom = null;
        function open() {
            if (prom) return prom;
            prom = new Promise(function (res, rej) {
                if (!('indexedDB' in window)) { rej(new Error('no idb')); return; }
                var rq = indexedDB.open(DB, 1);
                rq.onupgradeneeded = function () { if (!rq.result.objectStoreNames.contains(ST)) rq.result.createObjectStore(ST); };
                rq.onsuccess = function () { res(rq.result); };
                rq.onerror = function () { rej(rq.error); };
            });
            return prom;
        }
        window.nbIdbGet = async function (k) {
            try { var db = await open(); return await new Promise(function (res, rej) { var r = db.transaction(ST, 'readonly').objectStore(ST).get(k); r.onsuccess = function () { res(r.result !== undefined ? r.result : null); }; r.onerror = function () { rej(r.error); }; }); } catch (e) { return null; }
        };
        window.nbIdbSet = async function (k, v) {
            try { var db = await open(); await new Promise(function (res, rej) { var tx = db.transaction(ST, 'readwrite'); tx.objectStore(ST).put(v, k); tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); }; }); return true; } catch (e) { return false; }
        };
    })();
}
/* مدیر ساده‌ی کتاب‌ها برای صفحه‌ی کتابخانه: همان کلیدهای دفترچه کتاب‌خوان (reader-projects / reader-active-project) */
var LP = {
    list: function () { try { return JSON.parse(localStorage.getItem(NS + '-projects')) || []; } catch (e) { return []; } },
    getProjects: function () { return LP.list(); },
    getActiveId: function () { return lsGet(NS + '-active-project', ''); },
    setActive: function (id) { lsSet(NS + '-active-project', id); },
    addBook: async function (name) {
        var id = 'p' + Date.now() + Math.floor(Math.random() * 1000), l = LP.list();
        l.push({ id: id, name: name }); lsSet(NS + '-projects', JSON.stringify(l));
        await setData(id, {});
        return id;
    },
    open: async function (id) { LP.setActive(id); location.href = isWorks ? 'nevisandegi.html' : 'reader.html'; }
};
function PM() { return (typeof pm !== 'undefined') ? pm : LP; }

/* ======================================================================
   لایهٔ ذخیره‌سازی: داده‌های اضافه کنار فیلدهای پروژه
   ====================================================================== */
function dataKey(id) { return NS + '-proj-' + id; }
async function getData(id) {
    var v = null;
    try { v = await window.nbIdbGet(dataKey(id)); } catch (e) {}
    if (v) return v;
    try { return JSON.parse(localStorage.getItem(dataKey(id)) || 'null') || {}; } catch (e) { return {}; }
}
async function setData(id, d) {
    var ok = false;
    try { ok = await window.nbIdbSet(dataKey(id), d); } catch (e) {}
    if (ok) { try { localStorage.removeItem(dataKey(id)); } catch (e) {} }
    else { lsSet(dataKey(id), JSON.stringify(d)); }
}
window.nbSerial = window.nbSerial || (function () { var q = Promise.resolve(); return function (fn) { var r = q.then(fn); q = r.catch(function () {}); return r; }; })();
function patchData(id, fn) {
    return window.nbSerial(async function () { var d = await getData(id); fn(d); await setData(id, d); return d; }).catch(function () {});
}
var SAVERS = [];
/* ذخیرهٔ تأخیری که پروژه‌ی مقصد را هنگام ویرایش ثبت می‌کند (نه هنگام اجرا) و پیش از عوض شدن پروژه یا بستن صفحه فوراً ذخیره می‌کند */
function makeSaver(key, collect) {
    var timer = null, pid = null;
    function flush() {
        if (!timer) return Promise.resolve();
        clearTimeout(timer); timer = null;
        var target = pid, arr = collect(); pid = null;
        return patchData(target, function (d) { d[key] = arr; });
    }
    function save() { if (!timer) pid = activeId(); clearTimeout(timer); timer = setTimeout(flush, 400); }
    SAVERS.push(flush);
    return save;
}
function flushSavers() { return Promise.all(SAVERS.map(function (f) { return f(); })); }
window.addEventListener('pagehide', function () { flushSavers(); });
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSavers(); });
function activeId() { return PM().getActiveId(); }
function activeName() {
    var p = PM().getProjects().filter(function (x) { return x.id === activeId(); })[0];
    return p ? p.name : '';
}
async function getMeta(id) { var d = await getData(id || activeId()); return d.__meta || {}; }
function setMeta(patch, id) {
    return patchData(id || activeId(), function (d) { d.__meta = Object.assign({}, d.__meta || {}, patch); });
}

/* ======================================================================
   ۵) سؤال تصادفی
   ====================================================================== */
var PROMPTS_W = [
    'شخصیتت امروز چه چیزی را پنهان می‌کند؟',
    'اگر شخصیتت فقط یک ساعت وقت داشت، آن را صرف چه کاری می‌کرد؟',
    'آخرین دروغی که شخصیتت گفت چه بود و به چه کسی؟',
    'چه بو یا صدایی شخصیتت را به کودکی‌اش برمی‌گرداند؟',
    'بدترین روزِ تاریخ جهان داستانت چه بود و مردم چطور از آن یاد می‌کنند؟',
    'چه چیزی در جهان تو تابو است، بی‌آنکه کسی دلیلش را یادش باشد؟',
    'اگر صحنهٔ اول داستانت را از نگاه یک شاهد بی‌اهمیت بنویسی، او چه می‌بیند؟',
    'شخصیتت حاضر است برای چه چیزی همه‌چیز را از دست بدهد؟',
    'کدام جمله را هرگز نباید در دهان شخصیتت بگذاری؟',
    'در اتاق شخصیتت چه چیزی هست که او را لو می‌دهد؟',
    'اگر داستانت یک آهنگ بود، اوجش چه ساز و ریتمی داشت؟',
    'بزرگ‌ترین پشیمانی شخصیت منفی‌ات چیست؟',
    'چه اتفاق کوچکی می‌تواند کل نقشهٔ قهرمانت را خراب کند؟',
    'یک عادت روزانهٔ عجیب در جهان داستانت چیست؟',
    'اگر شخصیتت به خودِ ده سال قبلش نامه بنویسد، اولین جمله‌اش چیست؟',
    'چه رازی را فقط خواننده می‌داند و هیچ‌کدام از شخصیت‌ها نه؟',
    'آخرین صحنهٔ داستانت را بدون هیچ دیالوگی توصیف کن.',
    'در این داستان «خانه» برای هر شخصیت یعنی چه؟',
    'دو شخصیتت در آسانسور گیر کرده‌اند؛ کدامشان اول سکوت را می‌شکند و چرا؟',
    'چه چیزی در آغاز داستان درست به نظر می‌رسد ولی در پایان غلط از آب درمی‌آید؟',
    'شخصیتت صبح که از خواب بیدار می‌شود، اولین فکرش چیست؟',
    'چه چیزی شب‌ها شخصیتت را بیدار نگه می‌دارد؟',
    'شخصیتت دربارهٔ پول و قدرت چه باوری دارد و این باور از کجا آمده؟',
    'اولین چیزی که دیگران دربارهٔ شخصیتت فکر می‌کنند چیست، و چرا اشتباه است؟',
    'شخصیتت در چه موقعیتی ناخودآگاه دروغ می‌گوید؟',
    'کدام خاطرهٔ کودکی هنوز تصمیم‌های امروز شخصیتت را می‌سازد؟',
    'شخصیتت از چه چیزی بیش از مرگ می‌ترسد؟',
    'اگر شخصیتت یک روز کامل فقط حقیقت می‌گفت، چه بلایی سرش می‌آمد؟',
    'چه کسی را شخصیتت هنوز نبخشیده و چرا؟',
    'کدام ویژگی شخصیتت در آغاز مزیت است و در پایان به مصیبت تبدیل می‌شود؟',
    'اگر شخصیتت می‌توانست یک اشتباه گذشته را پاک کند، کدام را انتخاب می‌کرد و بعدش چه می‌شد؟',
    'شخصیتت وقتی کسی را دوست دارد چه کاری می‌کند که دیگران نمی‌کنند؟',
    'بوی خانهٔ شخصیتت چیست؟',
    'چه چیزی در جیب یا کیف شخصیتت هست که هیچ‌کس خبر ندارد؟',
    'اگر شخصیت منفی‌ات یک روز مهربان باشد، به چه دلیلی؟',
    'شخصیت منفی‌ات شب‌ها پیش از خواب به چه فکر می‌کند؟',
    'کدام ارزش شخصیتت زیر فشار اول از همه می‌شکند؟',
    'قدیمی‌ترین ضرب‌المثل جهان داستانت چیست و معنای واقعی‌اش چه بوده؟',
    'مردم جهان داستانت صبحانه چه می‌خورند و این دربارهٔ اقتصادشان چه می‌گوید؟',
    'چه چیزی در جهان تو ممنوع یا قاچاق است و چه کسی از آن سود می‌برد؟',
    'مردم جهانت چطور مرگ را بدرقه می‌کنند؟',
    'خطرناک‌ترین مکان جهان داستانت کجاست و چرا هنوز کسی به آنجا می‌رود؟',
    'جهان تو چه دروغ رسمی‌ای دارد که همه می‌دانند دروغ است؟',
    'کدام شغل در جهان تو هست که در جهان ما نیست؟',
    'یک جشن یا آیین مهم در جهان داستانت چطور شروع شد؟',
    'کمیاب‌ترین و ارزشمندترین چیز در جهان داستانت چیست؟',
    'یک واژه، لهجه یا ناسزا که فقط در جهان تو معنا دارد چیست؟',
    'اگر رنگ آسمان جهانت فرق می‌کرد، چه چیزهایی تغییر می‌کرد؟',
    'قدرتمندترین نهاد جهان داستانت چطور به قدرت رسید و چه چیزی از دید مردم پنهان مانده؟',
    'اگر صحنهٔ سوم داستانت را حذف کنی، چه چیزی فرو می‌ریزد؟',
    'کدام تصمیم قهرمانت باید کاملاً غلط، اما قابل‌فهم باشد؟',
    'قهرمانت اولین بار کجا باید شکست بخورد؟',
    'یک صحنهٔ آرامِ پیش از طوفان بنویس؛ چه چیزی در آن نامحسوس اشاره به طوفان است؟',
    'چه چیزی را می‌توانی با یک شیء کوچک نشان بدهی، به‌جای آنکه توضیح بدهی؟',
    'اگر کل داستانت در یک شب اتفاق می‌افتاد، آن شب چه شبی بود؟',
    'اولین جمله‌ای که خواننده را مجبور به ادامه دادن می‌کند چیست؟',
    'یک دیالوگ بنویس که در آن هیچ‌کس حرف اصلی‌اش را نمی‌زند.',
    'اگر راوی داستانت یک حیوان یا یک شیء بود، چه چیزی را می‌دید؟',
    'مهم‌ترین چیزی که قهرمانت باید یاد بگیرد چیست، و چه کسی نباید آن را به او بگوید؟',
    'اگر پایان داستانت تلخ‌وشیرین باشد، چه چیزی شیرین است و چه چیزی تلخ؟',
    'نقطهٔ بی‌بازگشت داستانت کجاست و قهرمان از کجا می‌فهمد؟',
    'داستانت را در یک جمله بگو، بعد همان را فقط با یک تصویر بگو.',
    'چه چیزی در داستانت باید کوچک‌تر و ساده‌تر شود تا قوی‌تر شود؟',
    'کدام شخصیت فرعی می‌تواند ناگهان مهم‌ترین نقش را بگیرد؟',
    'اگر ده سال بعد داستانت را بخوانی، کدام قسمتش را عوض می‌کنی؟'
];
var PROMPTS_R = [
    'اگر جای شخصیت اصلی بودی، کدام تصمیمش را عوض می‌کردی؟',
    'کدام صحنهٔ کتاب هنوز در ذهنت تصویر دارد؟ چرا؟',
    'اگر نویسنده یک فصل اضافه می‌نوشت، دوست داشتی دربارهٔ چه کسی باشد؟',
    'این کتاب را به چه کسی هدیه می‌دهی و چه می‌گویی؟',
    'اگر پایان کتاب را عوض می‌کردی، چه اتفاقی می‌افتاد؟',
    'کدام شخصیت فرعی بیشتر از آنچه نویسنده نشان داد ارزش داشت؟',
    'کتاب چه حسی را در تو بیدار کرد که مدت‌ها نداشتی؟',
    'اگر این کتاب فیلم بود، روی صحنهٔ آخرش چه موسیقی‌ای پخش می‌شد؟',
    'چه چیزی از سبک نویسنده را می‌توانی در نوشتهٔ خودت امتحان کنی؟',
    'کدام لحظهٔ کتاب را پیش‌بینی نمی‌کردی و چرا؟',
    'بعد از تمام شدن کتاب، اولین فکری که به سرت زد چه بود؟',
    'اگر می‌توانستی از شخصیت اصلی فقط یک سؤال بپرسی، چه می‌پرسیدی؟',
    'کدام جمله یا پاراگراف را زیر خط می‌کشیدی و چرا؟',
    'اگر شخصیت اصلی را در یک کافه می‌دیدی، چه چیزی به او می‌گفتی؟',
    'کدام شخصیت کتاب شبیه کسی است که می‌شناسی؟',
    'نویسنده در کجای کتاب چیزی را از تو پنهان کرد؟',
    'کدام قسمت کتاب را دوبار خواندی و چرا؟',
    'کتاب را بدون لو دادن داستان در یک جمله چطور معرفی می‌کنی؟',
    'اگر این کتاب یک غذا بود، چه طعمی داشت؟',
    'کدام شخصیت را زودتر از بقیه دوست یا دشمن داشتی، و بعداً نظرت عوض شد؟',
    'کتاب چه سؤال بی‌جوابی در ذهنت گذاشت؟',
    'اگر این داستان در شهر و زمان تو اتفاق می‌افتاد، چه چیزی فرق می‌کرد؟',
    'کدام قسمت کتاب کند به نظر رسید و شاید لازم بود؟',
    'کدام توصیف یا تصویر نویسنده برایت زنده‌تر از بقیه بود؟',
    'بعد از این کتاب، دلت می‌خواهد کدام کتاب را بخوانی؟',
    'پایان کتاب را چطور برای دوستت تعریف می‌کنی؟',
    'کدام دیالوگ کتاب را هنوز به یاد داری؟',
    'چه چیزی از شخصیت اصلی را در خودت دیدی؟',
    'اگر عنوان کتاب را عوض می‌کردی، چه می‌گذاشتی؟',
    'کتاب فراتر از ماجرا دربارهٔ چه چیزی است؟',
    'کدام شخصیت بیشتر از همه تغییر کرد و چه چیزی او را عوض کرد؟',
    'اگر یک شخصیت فرعی راوی کتاب می‌شد، داستان چه فرقی می‌کرد؟',
    'کدام لحظهٔ کتاب تو را خنداند یا اشکت را درآورد؟',
    'نویسنده با چه ترفندی تو را تا آخر کتاب نگه داشت؟',
    'کجای کتاب حس کردی «این را قبلاً جایی دیده‌ام»؟',
    'برای نقش اصلی فیلم این کتاب چه کسی را انتخاب می‌کردی؟',
    'اگر بخواهی یک نکته از این کتاب را در زندگی‌ات به کار ببری، کدام است؟',
    'چه چیزی در کتاب نیمه‌گفته ماند که دلت می‌خواست بیشتر بدانی؟',
    'اگر با نویسنده یک قهوه می‌خوردی، اولین سؤالت چه بود؟',
    'کدام صحنه را اگر نویسنده طولانی‌تر می‌نوشت بیشتر لذت می‌بردی؟',
    'کدام جمله از کتاب را دوست داری ماندگار بماند؟',
    'این کتاب را کدام فصل سال یا ساعت روز دوست داشتی بخوانی؟',
    'چه چیزی این کتاب را برای تو خواندنی کرد؟',
    'اگر قرار بود به یک جملهٔ کتاب جواب بدهی، به کدام و چه می‌گفتی؟',
    'کدام شخصیت در پایان کتاب به نظرت بهتر از بقیه از ماجرا بیرون آمد؟'
];
var diceApi = null;
function buildDice() {
    var nav = $('nav'), tab = null;
    var target = isWriter ? '#hub-free-writing' : '#read-writing-ideas';
    var targetName = isWriter ? '«تخلیه ذهن»' : '«ایده‌هایی که کتاب به ذهنت رساند»';
    if (!nav || !$('.tab-content') || $('#tab-dice')) return;
    tab = el('div', { id: 'tab-dice', 'class': 'tab-content' });
    var pool = isWriter ? PROMPTS_W : PROMPTS_R, last = -1;
    diceApi = null;
    var box = el('div', { 'class': 'nbx-dice', id: 'nbx-dice' },
        '<h3>🎲 جرقهٔ تصادفی</h3><div class="nbx-dice-q" id="nbx-dice-q" aria-live="polite">برای شروع، دکمهٔ «ایده تصادفی» را بزن.</div>' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-dice-roll">🎲 ایده تصادفی</button>' +
        '<button type="button" class="nbx-btn" id="nbx-dice-ans" hidden>✍️ همین‌جا جواب بده</button></div>' +
        '<div id="nbx-dice-form" hidden><textarea class="nbx-skip" id="nbx-dice-text" placeholder="هر چیزی که اولین بار به ذهنت می‌رسد؛ بدون سانسور..."></textarea>' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-dice-save">💾 ذخیره در ایده‌های تصادفی</button></div></div>');
    var arch = el('div', { 'class': 'nbx-dice-arch' }, '<h3 style="margin:18px 0 8px;font-size:1.05rem">📚 ایده‌های تصادفی ذخیره‌شده <small class="nbx-muted" id="nbx-dice-cnt"></small></h3><div id="nbx-dice-list"></div>');
    tab.appendChild(box); tab.appendChild(arch);
    placeTab(tab);
    nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-dice')" }, '🎲 ' + (isWriter ? fa($$('nav .nav-link').length + 1) + '. ' : '') + 'ایده تصادفی'));
    var q = $('#nbx-dice-q'), ans = $('#nbx-dice-ans'), form = $('#nbx-dice-form'), txt = $('#nbx-dice-text');
    $('#nbx-dice-roll').onclick = function () {
        var i; do { i = Math.floor(Math.random() * pool.length); } while (i === last && pool.length > 1);
        last = i; q.textContent = pool[i]; ans.hidden = false; form.hidden = true; txt.value = '';
    };
    ans.onclick = function () { form.hidden = false; txt.focus(); };
    diceApi = { set: function (t) { q.textContent = t; ans.hidden = false; form.hidden = false; txt.value = ''; txt.focus(); } };
    $('#nbx-dice-save').onclick = async function () {
        var v = txt.value.trim();
        if (!v) { toast('اول چیزی بنویس.'); return; }
        var item = { id: uid(), q: q.textContent, t: v, ts: Date.now() };
        await patchData(activeId(), function (d) { d.__dice = [item].concat(d.__dice || []); });
        txt.value = ''; form.hidden = true;
        toast('در ایده‌های تصادفی ذخیره شد ✓');
        refreshDice();
    };
    $('#nbx-dice-list').addEventListener('input', function (e) {
        var ta = e.target; if (!ta.classList.contains('nbx-dice-edit')) return;
        autoGrow(ta); var id = ta.closest('.nbx-quote').getAttribute('data-id'), val = ta.value;
        clearTimeout(ta._t); ta._t = setTimeout(function () { patchData(activeId(), function (d) { (d.__dice || []).forEach(function (x) { if (x.id === id) x.t = val; }); }); }, 400);
    });
    $('#nbx-dice-list').addEventListener('click', async function (e) {
        var bt = e.target.closest('[data-del]'); if (!bt) return;
        var id = bt.closest('.nbx-quote').getAttribute('data-id');
        if (!confirm('این ایده حذف شود؟')) return;
        await patchData(activeId(), function (d) { d.__dice = (d.__dice || []).filter(function (x) { return x.id !== id; }); });
        refreshDice();
    });
    refreshDice();
}
async function refreshDice() {
    var host = $('#nbx-dice-list'); if (!host) return;
    var d = await getData(activeId()), list = (d.__dice || []).filter(function (x) { return x && typeof x === 'object'; });
    host.innerHTML = '';
    var cnt = $('#nbx-dice-cnt'); if (cnt) cnt.textContent = list.length ? fa(list.length) + ' ایده' : '';
    if (!list.length) { host.innerHTML = '<div class="nbx-empty">هنوز ایده‌ای ذخیره نکرده‌ای. یک «ایده تصادفی» بگیر، جواب بده و ذخیره کن.</div>'; return; }
    list.forEach(function (x) {
        var c = el('div', { 'class': 'nbx-quote', 'data-id': x.id },
            '<div class="nbx-muted" style="font-weight:700;margin-bottom:6px">🎲 ' + esc(x.q || '') + '</div>' +
            '<textarea class="nbx-in nbx-skip nbx-dice-edit" rows="2" style="width:100%;min-height:60px" aria-label="جواب"></textarea>' +
            '<div class="nbx-row" style="margin-top:6px"><span class="nbx-muted">' + (x.ts ? esc(persianDate(dateKey(new Date(x.ts)))) : '') + '</span><button type="button" class="nbx-btn nbx-danger" data-del style="margin-right:auto">🗑 حذف</button></div>');
        var ta = $('textarea', c); ta.value = x.t || '';
        host.appendChild(c); autoGrow(ta);
    });
}

/* ======================================================================
   ۱) قالب ژانر (دفترچه نویسندگی)
   ====================================================================== */
var GENRES_W = [
    { id: 'fantasy', icon: '🐉', name: 'فانتزی', cards: [
        { t: '🪄 جادو و قواعد جهان', q: [
            ['سیستم جادو چه هزینه‌ای دارد؟', 'هر جادویی بهایی دارد؛ حافظه، سلامتی، عمر، یا چیزی که دوستش داری...'],
            ['چه کسانی می‌توانند جادو کنند و چه کسانی نه؟', 'ذاتی است، آموختنی است، یا امتیاز طبقه‌ای خاص؟'],
            ['جادو هرگز چه کاری را نمی‌تواند انجام دهد؟', 'محدودیت‌ها تنش می‌سازند؛ جادویی که همه‌چیز را حل کند، داستان را می‌کشد.'],
            ['مردم عادی دربارهٔ جادو چه احساسی دارند؟', 'ستایش، ترس، حسادت یا عادی‌شدن؟']] },
        { t: '🗺️ سرزمین و تقدیر', q: [
            ['اسطورهٔ آفرینش این جهان چیست؟', 'مردم فکر می‌کنند جهان از کجا آمده؟ آیا حقیقت چیز دیگری است؟'],
            ['شرِّ اصلی چیست و چرا از نگاه خودش حق دارد؟', 'بهترین دشمن‌ها خودشان را قهرمان می‌دانند.'],
            ['پیشگویی یا تقدیری وجود دارد؟ قهرمان چطور با آن روبه‌رو می‌شود؟', 'می‌پذیرد، می‌شکند یا آن را اشتباه می‌فهمد؟'],
            ['نژادها، موجودات یا قدرت‌هایی که مرز سرزمین‌ها را می‌سازند', 'چه کسی با چه کسی دشمن یا متحد است و چرا؟']] }
    ]},
    { id: 'crime', icon: '🕵️', name: 'جنایی و معمایی', cards: [
        { t: '🔪 جنایت و آدم‌ها', q: [
            ['جنایت چیست، کِی و کجا رخ داد؟', 'لحظه، مکان، و اولین چیزی که کسی متوجه شد...'],
            ['قربانی واقعاً که بود؟ چه رازی داشت؟', 'آدم‌ها دربارهٔ او یک چیز می‌گویند و حقیقت چیز دیگری است.'],
            ['هر مظنون چه انگیزه، فرصت و ابزاری داشت؟', 'دست‌کم سه مظنون با دلیل‌های متفاوت بنویس.'],
            ['کارآگاه یا راوی چه نقطه‌ضعف شخصی‌ای دارد؟', 'چیزی که او را در تحقیق کند یا گمراه می‌کند.']] },
        { t: '🧩 سرنخ و پیچ', q: [
            ['سه سرنخ واقعی که زود نشان می‌دهی ولی معنایشان دیر روشن می‌شود', 'خواننده باید بتواند در بازخوانی بگوید «همین‌جا بود!»'],
            ['سرنخ گمراه‌کننده (شاه‌ماهی قرمز) چیست؟', 'چیزی که منطقی به نظر می‌رسد ولی به بیراهه می‌برد.'],
            ['پیچ نهایی: خواننده چه چیزی را اشتباه فرض کرده بود؟', 'چه فرضی را عمداً به او دادی؟'],
            ['بهای حقیقت چیست؟ عدالت اجرا می‌شود؟', 'چه کسی تاوان می‌دهد و چه کسی از آن می‌گریزد؟']] }
    ]},
    { id: 'romance', icon: '💞', name: 'عاشقانه', cards: [
        { t: '💫 آشنایی و کشش', q: [
            ['این دو نفر چطور و کجا با هم روبه‌رو می‌شوند؟', 'صحنهٔ اول باید هم تصادفی باشد و هم اجتناب‌ناپذیر.'],
            ['هر کدام در دیگری چه چیزی می‌بیند که خودش ندارد؟', 'جذابیت از تفاوت می‌آید نه از شباهت.'],
            ['مانع بیرونی این عشق چیست؟', 'خانواده، فاصله، زمان، طبقه، شغل، قول قدیمی...'],
            ['مانع درونی: هر کدام از چه چیزی می‌ترسد؟', 'زخمی که او را از نزدیک شدن بازمی‌دارد.']] },
        { t: '💔 گره و فرجام', q: [
            ['لحظه‌ای که هر کدام حس کرد چیزی تغییر کرده', 'کوچک و دقیق؛ یک نگاه، یک جمله، یک سکوت.'],
            ['بزرگ‌ترین دعوا یا گسست چیست و چرا واقعاً رخ می‌دهد؟', 'دلیل ظاهری و دلیل واقعی را جدا بنویس.'],
            ['اوج عاشقانه: فداکاری یا اعتراف؟ چه چیزی را از دست می‌دهند؟', 'عشق وقتی باور می‌شود که بهایی داشته باشد.'],
            ['پایان: با هم، جدا، یا باز؟ خواننده صفحهٔ آخر را با چه حسی ببندد؟', 'حس نهایی را بنویس، بعد پایان را از آن بساز.']] }
    ]},
    { id: 'scifi', icon: '🚀', name: 'علمی‌تخیلی', cards: [
        { t: '🔭 اگرِ بزرگ جهان', q: [
            ['تنها یک «اگر» بزرگ این جهان را از جهان ما جدا می‌کند؛ آن اگر چیست؟', 'اگر انسان‌ها خواب را حذف کنند؟ اگر حافظه قابل خرید باشد؟...'],
            ['این فناوری یا کشف چه کسی را قدرتمند و چه کسی را بی‌صدا می‌کند؟', 'هر پیشرفتی برندگان و بازندگانی دارد.'],
            ['زندگی روزمرهٔ یک آدم عادی در این جهان چه شکلی است؟', 'صبحش، کارش، ترسش؛ جزئیاتی که جهان را باورپذیر می‌کند.'],
            ['بهای پیشرفت: چه چیز انسانی را از دست داده‌ایم؟', 'علمی‌تخیلی خوب همیشه دربارهٔ انسان است، نه ماشین.']] },
        { t: '⚙️ قانون و تنش', q: [
            ['قوانین علمی یا منطقی جهان: چه چیزی ممکن و چه چیزی ناممکن است؟', 'قاعده‌ها را یک‌بار بنویس و بعد به آن‌ها وفادار بمان.'],
            ['بحران یا دشمن اصلی: فناوری، انسان، طبیعت یا خود سیستم؟', 'چه چیزی واقعاً در برابر شخصیت اصلی ایستاده؟'],
            ['شخصیت اصلی چه باوری دربارهٔ آینده دارد که داستان به چالش می‌کشد؟', 'خوش‌بینی؟ بدبینی؟ ایمان به علم؟'],
            ['پایان: هشدار، امید یا پرسشی بی‌پاسخ؟', 'خواننده با چه فکری از جهان تو بیرون بیاید؟']] }
    ]},
    { id: 'horror', icon: '🕯️', name: 'ترسناک', cards: [
        { t: '😨 ترس و فضا', q: [
            ['ترس اصلی چیست: ناشناخته، فقدان، جسم، تنهایی؟', 'ترس واقعی همیشه به چیزی شخصی وصل است.'],
            ['مکان یا موقعیت بسته‌ای که فرار را سخت می‌کند', 'خانه، جاده، بیمارستان، خانواده، یک رابطه...'],
            ['اولین نشانهٔ «ناجور» که فقط خواننده متوجه می‌شود', 'چیز کوچکی که درست نیست و کسی نمی‌گوید.'],
            ['شخصیت اصلی چه چیزی را انکار می‌کند؟', 'انکار او همان جایی است که ترس رشد می‌کند.']] },
        { t: '👁️ قاعده و اوج', q: [
            ['قاعدهٔ هیولا یا نیروی تاریک: چه می‌کند و چه چیز آن را تحریک یا متوقف می‌کند؟', 'قاعده‌ای که خواننده کم‌کم کشف کند.'],
            ['لحظهٔ اوج وحشت و بهایی که قهرمان می‌پردازد', 'چه چیزی را برای بقا قربانی می‌کند؟'],
            ['چه چیزی را عمداً نشان نمی‌دهی تا ذهن خواننده کامل کند؟', 'آنچه دیده نمی‌شود معمولاً ترسناک‌تر است.'],
            ['پایان: رهایی یا ادامهٔ ترس بعد از صفحهٔ آخر؟', 'ترس چه ردی در خواننده باقی بگذارد؟']] }
    ]},
    { id: "history", icon: "🏛️", name: "تاریخی", cards: [
        { t: "📜 دوره و جهان", q: [
            ["دوره و مکان دقیق داستان کجا و کِی است؟", "سال، شهر، حکومت؛ هرچه دقیق‌تر، باورپذیرتر."],
            ["زندگی روزمرهٔ مردم عادی آن زمان چه شکلی بود؟", "غذا، پوشش، کار، باورها، ترس‌ها."],
            ["کدام واقعیت تاریخی ستون داستان است و کجا تخیل اضافه می‌کنی؟", "مرز حقیقت و خیال را از قبل مشخص کن."]] },
        { t: "⚔️ آدم‌ها و تحقیق", q: [
            ["شخصیت اصلی چطور درگیر رویدادهای بزرگ تاریخی می‌شود؟", "شاهد است، قربانی است یا تعیین‌کننده؟"],
            ["چه چیزهایی را باید دقیق تحقیق کنی؟", "زبان و تعارفات، پول، لباس، سلاح، قوانین."],
            ["کدام واژه یا نگرشِ امروزی ممکن است در آن دوره غلط باشد؟", "مراقب عبارت‌هایی باش که به زمان تو تعلق دارند."]] }
    ]},
    { id: "adventure", icon: "🧭", name: "ماجراجویی", cards: [
        { t: "🧭 سفر و هدف", q: [
            ["مقصد یا هدف نهایی سفر چیست؟", "گنج، آدم گمشده، رهایی، خانه..."],
            ["چرا قهرمان نمی‌تواند همان‌جا بماند؟", "چه چیزی او را مجبور به رفتن می‌کند؟"],
            ["همسفرها چه کسانی‌اند و هر کدام چه مهارت یا ضعفی دارند؟", "گروهِ ناکامل جذاب‌تر است."]] },
        { t: "🌋 مانع و تغییر", q: [
            ["سه مانع پشت‌سرهم: هر کدام چه چیزی از قهرمان می‌گیرد؟", "انرژی، آدم، ابزار، امید..."],
            ["چه زمان‌شمار یا رقیبی سفر را به مسابقه تبدیل می‌کند؟", "ساعتی در حال تمام شدن یا کسی که یک قدم جلوتر است."],
            ["سفر قهرمان را چطور عوض می‌کند؟", "برگشتن همان آدمِ رفته نباشد."]] }
    ]},
    { id: "dystopia", icon: "🏚️", name: "دیستوپیا", cards: [
        { t: "🏚️ نظم و قدرت", q: [
            ["چه قدرتی جامعه را کنترل می‌کند و با چه ابزاری؟", "ترس، رسانه، فناوری، نیاز، وعدهٔ امنیت..."],
            ["مردم چه چیزی را قربانی نظم کرده‌اند؟", "آزادی، حقیقت، عشق، حافظه..."],
            ["شعار رسمی حکومت چیست و حقیقتِ پشتش چیست؟", "فاصلهٔ این دو قلب دیستوپیاست."]] },
        { t: "🔥 شورش و بها", q: [
            ["چه چیزی قهرمان را از «سازگار» به «معترض» تبدیل می‌کند؟", "یک اتفاق شخصی معمولاً از شعار مؤثرتر است."],
            ["شورش چه بهایی دارد و چه کسی آن را می‌پردازد؟", "پیروزیِ بی‌هزینه باورپذیر نیست."],
            ["پایان: امید، شکست یا چرخهٔ تکرار؟", "خواننده با چه پرسشی از جهان بیرون بیاید؟"]] }
    ]},
    { id: "psych", icon: "🧠", name: "روان‌شناختی", cards: [
        { t: "🧠 ذهن و راوی", q: [
            ["ذهن شخصیت اصلی چه چیزی را از خودش پنهان می‌کند؟", "خاطره، گناه، ترس، میل..."],
            ["راوی تا چه حد قابل‌اعتماد است؟", "کجا خواننده باید شک کند؟"],
            ["نشانه‌های کوچکی که بعداً معنا پیدا می‌کنند", "تکرار یک تصویر، جمله یا رفتار."]] },
        { t: "🌀 پیچش و تعلیق", q: [
            ["حقیقتی که در اوج، همه‌چیز را عوض می‌کند", "طوری بنویس که شروع داستان با دانستنش معنای دیگری بگیرد."],
            ["اطلاعات را کِی و چقدر آزاد می‌کنی تا تعلیق بماند؟", "هر فصل یک پرسش تازه."],
            ["پایان: حقیقت کامل یا ابهام؟", "چه چیزی باید برای خواننده باز بماند؟"]] }
    ]},
    { id: "humor", icon: "😄", name: "طنز و کمدی", cards: [
        { t: "😄 موقعیت و شخصیت", q: [
            ["موقعیت اصلیِ خنده‌دار چیست؟", "سوءتفاهم، تضاد، آدم نامناسب در جای نامناسب..."],
            ["عیب بامزهٔ شخصیت اصلی چیست؟", "چیزی که هم خنده‌دار است هم دوست‌داشتنی."],
            ["قاعدهٔ دنیای کمدی تو چیست؟", "تا کجا اغراق می‌کنی؟"]] },
        { t: "🎭 زمان‌بندی و قلب", q: [
            ["شوخی تکرارشونده‌ی داستان چیست و در پایان چطور برمی‌گردد؟", "تکرار، بعد غافلگیری."],
            ["کجا باید خنده را قطع کنی تا احساس بنشیند؟", "طنز خوب جایی برای دل هم دارد."],
            ["طنز تو به چه چیزی نمی‌خندد؟", "مرزهایت را از قبل بدان."]] }
    ]},
    { id: "family", icon: "🏠", name: "درام خانوادگی", cards: [
        { t: "🏠 خانه و رابطه‌ها", q: [
            ["این خانواده بیرون چطور دیده می‌شود و داخل چطور است؟", "نقاب خانواده در برابر حقیقت."],
            ["هر عضو چه نقشی بازی می‌کند؟", "سپر، قربانی، مسئول، یاغی، آرام‌ساز..."],
            ["حرفی که سال‌هاست در این خانه گفته نشده", "سکوتی که همه می‌دانند."]] },
        { t: "💔 بحران و آشتی", q: [
            ["چه اتفاقی خانواده را مجبور به مواجهه می‌کند؟", "مرگ، ارث، بازگشت، بیماری، افشا..."],
            ["صحنهٔ دور میز: چه چیزی بالاخره گفته می‌شود؟", "بزرگ‌ترین درگیری را در صحنه‌ای ساده بگذار."],
            ["پایان: بخشش، فاصله یا پذیرش؟", "همه‌چیز لازم نیست حل شود."]] }
    ]},
    { id: 'ya', icon: '🌱', name: 'نوجوان و بزرگ‌شدن', cards: [
        { t: '🌱 دنیای نوجوان', q: [
            ['چه چیزی نوجوانِ داستانت را از بقیه جدا می‌کند؟', 'حس نادیده‌شدن، تفاوت، یا رازی که نمی‌تواند به کسی بگوید.'],
            ['خانه، مدرسه، دوستان: کدام پناه است و کدام فشار؟', 'هر دنیا قانون‌ها و انتظارهای خودش را دارد.'],
            ['او دربارهٔ خودش چه باور غلطی دارد؟', 'داستان بزرگ‌شدن یعنی شکستنِ یک باور.']] },
        { t: '🚪 نقطهٔ گذر', q: [
            ['اولین باری که دیگر نمی‌تواند مثل قبل رفتار کند', 'حادثه‌ای که کودکیِ او را تمام می‌کند.'],
            ['چه چیزی را باید از دست بدهد تا بزرگ شود؟', 'معصومیت، یک دوستی، تصویر آرمانی از والدین...'],
            ['پایان: او حالا چه کسی است و دیگر چه کسی نیست؟', 'تغییر را در یک رفتار کوچک نشان بده، نه در یک جملهٔ بزرگ.']] }
    ]},
    { id: 'war', icon: '🪖', name: 'جنگی', cards: [
        { t: '🪖 جبهه و جهان', q: [
            ['جنگ چرا شروع شده و هر طرف خودش را چه می‌داند؟', 'هر سو برای خودش دلیل دارد؛ دشمنِ بی‌چهره داستان را سطحی می‌کند.'],
            ['زندگی روزمره زیر سایهٔ جنگ چه شکلی است؟', 'صف نان، صدای آژیر، نامه‌ها، شوخی‌های سیاه...'],
            ['کدام جزئیات حسی خاطرهٔ جنگ را زنده می‌کنند؟', 'بو، صدا، گرسنگی، خستگی؛ نه فقط انفجار.']] },
        { t: '💔 انسان در برابر جنگ', q: [
            ['شخصیت اصلی برای چه می‌جنگد و برای چه می‌ماند؟', 'وظیفه، عشق، بقا، ترس از ننگ...'],
            ['لحظه‌ای که میان وفاداری و وجدان گیر می‌کند', 'بهترین صحنه‌های جنگی صحنه‌های انتخاب‌اند.'],
            ['جنگ با او و کسانی که دوستشان دارد چه می‌کند؟', 'بازگشت، فقدان، یا چیزی که دیگر هیچ‌وقت مثل قبل نمی‌شود.']] }
    ]},
    { id: 'myth', icon: '🏺', name: 'اسطوره‌ای', cards: [
        { t: '🏺 اسطوره و باور', q: [
            ['افسانهٔ بنیادین این جهان چیست و چه کسی روایتش می‌کند؟', 'روایت‌ها بسته به راوی فرق می‌کنند.'],
            ['خدایان، ایزدان یا نیروهای کهن: هر کدام نمایندهٔ چه چیزی‌اند؟', 'هر نیرو را با یک خواست و یک ضعف بساز.'],
            ['آیین‌ها، نذرها و ممنوعیت‌هایی که مردم رعایت می‌کنند', 'چرا؟ اگر رعایت نشوند چه می‌شود؟']] },
        { t: '⚡ قهرمان و تقدیر', q: [
            ['قهرمان اسطوره‌ای چه تبار یا نشانه‌ای دارد؟', 'نیمه‌خدا، برگزیده، یا انسانی که تقدیر او را انتخاب کرده.'],
            ['بهایی که برای مقابله با تقدیر باید پرداخت', 'در اسطوره‌ها هر دستاورد قربانی می‌خواهد.'],
            ['این داستان در حافظهٔ مردم چطور افسانه می‌شود؟', 'چه چیزی بزرگ‌نمایی می‌شود و چه چیزی فراموش؟']] }
    ]},
    { id: 'social', icon: '🏙️', name: 'ادبیات اجتماعی', cards: [
        { t: '🏙️ جامعه و طبقه', q: [
            ['کدام مسئلهٔ اجتماعی هستهٔ داستان است؟', 'فقر، تبعیض، مهاجرت، بی‌عدالتی... آن را در یک زندگی مشخص نشان بده.'],
            ['شخصیت اصلی در چه جایگاهی ایستاده و چه چیزی را نمی‌بیند؟', 'هر جایگاه نقطهٔ کوریِ خودش را دارد.'],
            ['محله، خانه و کار روزمره چه جزئیاتی دارند؟', 'مسئله باید در جزئیات زندگی دیده شود، نه در شعار.']] },
        { t: '⚖️ تقابل و پیامد', q: [
            ['نیروی مقابل کیست: فرد، سازمان، عرف یا ساختار؟', 'اگر دشمن یک ساختار است، چطور تقابل را ملموس می‌کنی؟'],
            ['صحنه‌ای که تضاد ارزش‌ها را بی‌حرف نشان می‌دهد', 'نشان بده، قضاوت نکن.'],
            ['پایان: تغییر کوچک، شکست یا پرسشی که باز می‌ماند؟', 'ادبیات اجتماعی اغلب پرسش را به خواننده می‌سپارد.']] }
    ]}
];
var GENRES_R = [
    { id: 'fantasy', icon: '🐉', name: 'فانتزی', cards: [
        { t: '🪄 جادو و جهان', q: [
            ['قواعد جادو در این کتاب چقدر منسجم بود؟', 'جادو همیشه از یک قاعده پیروی کرد یا هر جا لازم بود تغییر می‌کرد؟'],
            ['بهای جادو چه بود و آیا جدی گرفته شد؟', 'اگر جادو هزینه نداشت، تنش داستان چه می‌شد؟'],
            ['جهان‌سازی را چقدر باور کردی؟', 'کدام جزئیات جهان را واقعی کرد؟'],
            ['شرِّ اصلی چقدر چندلایه بود؟', 'می‌شد او را فهمید یا فقط یک دشمن بود؟']] },
        { t: '⚔️ قهرمان و تقدیر', q: [
            ['پیشگویی یا تقدیر چطور در داستان استفاده شد؟', 'تازه بود یا کلیشه؟'],
            ['کدام موجود، سرزمین یا نژاد بیشتر در ذهنت ماند؟', 'چرا؟'],
            ['لحظه‌ای که جهان کتاب برایت زنده شد', 'کدام صحنه بود؟'],
            ['چه چیزی را کلیشه حس کردی؟', 'و چه چیزی تازه بود؟']] }
    ]},
    { id: 'crime', icon: '🕵️', name: 'جنایی و معمایی', cards: [
        { t: '🧩 سرنخ و معما', q: [
            ['سرنخ‌ها را چطور چیده بود؟', 'منصفانه بودند یا نویسنده چیزی را پنهان کرد؟'],
            ['پیچ نهایی را حدس زدی؟ از کجا؟', 'کدام سرنخ تو را به آن رساند؟'],
            ['مظنون‌ها چقدر باورپذیر بودند؟', 'هر کدام انگیزهٔ واقعی داشتند؟'],
            ['کارآگاه یا راوی چه نقطه‌ضعفی داشت و چه اثری گذاشت؟', 'ضعف او به داستان کمک کرد؟']] },
        { t: '⚖️ حقیقت و عدالت', q: [
            ['شاه‌ماهی قرمز اثر کرد؟', 'کجا گمراه شدی؟'],
            ['انگیزهٔ نهایی قانع‌کننده بود؟', 'اگر نه، کجا کم داشت؟'],
            ['عدالت در پایان چگونه بود؟', 'پایان تو را راضی کرد یا ناراحت؟'],
            ['اگر دوباره بخوانی، کدام سرنخ را زودتر می‌بینی؟', 'کجا نویسنده ظریف عمل کرده بود؟']] }
    ]},
    { id: 'romance', icon: '💞', name: 'عاشقانه', cards: [
        { t: '💫 رابطه و کشش', q: [
            ['رابطه از کجا باورپذیر شد؟', 'کدام لحظه یا صحنه باعث شد باور کنی؟'],
            ['مانع اصلی واقعی بود یا ساختگی؟', 'اگر آدم‌ها فقط حرف می‌زدند، مشکل حل می‌شد؟'],
            ['شیمی دو شخصیت در کدام صحنه بهتر دیده شد؟', 'چه چیزی آن را ساخت؟'],
            ['زخم هر شخصیت چقدر در رفتارش دیده شد؟', 'رفتارها با گذشته‌اش می‌خواند؟']] },
        { t: '💔 اوج و فرجام', q: [
            ['اوج عاشقانه اثرگذار بود؟', 'چه چیزی را نشان داد؟'],
            ['دعوا یا گسست طبیعی بود؟', 'یا فقط برای ایجاد تنش بود؟'],
            ['پایان درست بود؟', 'اگر تغییرش می‌دادی چه می‌کردی؟'],
            ['بعد از آخرین صفحه چه حسی ماند؟', 'کدام جمله یا تصویر؟']] }
    ]},
    { id: 'scifi', icon: '🚀', name: 'علمی‌تخیلی', cards: [
        { t: '🔭 اگرِ بزرگ', q: [
            ['«اگرِ بزرگ» این کتاب چه بود و چقدر جدی دنبالش کرد؟', 'تا ته پیامدهایش را رفت؟'],
            ['فناوری چه کسی را قوی و چه کسی را ضعیف کرد؟', 'کتاب به این نابرابری پرداخت؟'],
            ['قوانین جهان تا آخر ثابت ماندند؟', 'جایی منطق شکست؟'],
            ['پیام انسانی کتاب چه بود؟', 'فراتر از فناوری، دربارهٔ چه چیزی بود؟']] },
        { t: '⚙️ بحران و فرجام', q: [
            ['کدام لحظه، دنیای آینده برایت ملموس شد؟', 'چه جزئیاتی؟'],
            ['بحران اصلی چطور حل شد؟', 'قانع‌کننده بود؟'],
            ['پایان هشدار بود یا امید؟', 'با آن موافق بودی؟'],
            ['چه چیزی از کتاب را در دنیای واقعی دیدی؟', 'چیزی که حالا جور دیگری نگاهش می‌کنی؟']] }
    ]},
    { id: 'horror', icon: '🕯️', name: 'ترسناک', cards: [
        { t: '😨 ترس و فضا', q: [
            ['ترس اصلی چه بود و چطور ساخته شد؟', 'با فضا، صدا، یا تصویر؟'],
            ['کدام صحنه تو را ترساند و چرا؟', 'ترس از چه چیزی در آن بود؟'],
            ['چه چیزی را نشان نداد و چه اثری داشت؟', 'نادیدنی بهتر بود یا دیدنی؟'],
            ['شخصیت چه چیزی را انکار می‌کرد؟', 'انکارش ترس را بیشتر کرد؟']] },
        { t: '👁️ قاعده و پایان', q: [
            ['قاعدهٔ نیروی تاریک روشن بود؟', 'یا هر جا لازم بود تغییر می‌کرد؟'],
            ['اوج وحشت و بهایی که قهرمان پرداخت', 'اثرگذار بود؟'],
            ['پایان چه ردی در تو گذاشت؟', 'بعد از بستن کتاب هم ترس ماند؟'],
            ['کجا ترس به کلیشه رسید؟', 'و کجا غافلگیرت کرد؟']] }
    ]},
    { id: "history", icon: "🏛️", name: "تاریخی", cards: [
        { t: "📜 دوره و جهان", q: [
            ["دوره چقدر زنده و باورپذیر ساخته شده بود؟", "با کدام جزئیات؟"],
            ["زندگی روزمره چطور نشان داده شد؟", "غذا، لباس، باورها..."]] },
        { t: "⚔️ تاریخ و تخیل", q: [
            ["تاریخ و تخیل کجا خوب به هم رسیدند؟", "یا نویسنده مرز را گم کرد؟"],
            ["چه چیزی دربارهٔ آن دوره یاد گرفتی؟", "چیزی که قبلاً نمی‌دانستی."]] }
    ]},
    { id: "adventure", icon: "🧭", name: "ماجراجویی", cards: [
        { t: "🧭 سفر", q: [
            ["هدف سفر روشن و جذاب بود؟", "برایت مهم شد؟"],
            ["کدام مانع هیجان‌انگیزتر بود؟", "چرا؟"]] },
        { t: "🌋 همسفرها و تغییر", q: [
            ["همسفرها چقدر دوست‌داشتنی بودند؟", "کدام را بیشتر دوست داشتی؟"],
            ["سفر شخصیت را چطور تغییر داد؟", "تغییر باورپذیر بود؟"]] }
    ]},
    { id: "dystopia", icon: "🏚️", name: "دیستوپیا", cards: [
        { t: "🏚️ جهان", q: [
            ["این جهان چقدر ترسناک یا باورپذیر بود؟", "کدام قانونش بیشتر آزارت داد؟"],
            ["شباهتی با دنیای واقعی دیدی؟", "چه چیزی تو را به فکر برد؟"]] },
        { t: "🔥 شورش", q: [
            ["چه چیزی شخصیت را به شورش رساند؟", "انگیزه قانع‌کننده بود؟"],
            ["پایان امیدوارکننده بود یا تلخ؟", "به نظرت درست بود؟"]] }
    ]},
    { id: "psych", icon: "🧠", name: "روان‌شناختی", cards: [
        { t: "🧠 ذهن و راوی", q: [
            ["راوی چقدر قابل‌اعتماد بود؟", "کجا شک کردی؟"],
            ["ذهن شخصیت چطور نشان داده شد؟", "باورپذیر و عمیق بود؟"]] },
        { t: "🌀 پیچش", q: [
            ["پیچش داستان غافلگیرت کرد؟", "نشانه‌هایش از قبل کاشته شده بود؟"],
            ["پایان قانع‌کننده بود؟", "یا ابهامش بهتر بود؟"]] }
    ]},
    { id: "humor", icon: "😄", name: "طنز و کمدی", cards: [
        { t: "😄 خنده", q: [
            ["کدام صحنه واقعاً خنداندت؟", "چرا کار کرد؟"],
            ["شوخی‌ها یکنواخت نشدند؟", "یا هر بار تازه بود؟"]] },
        { t: "🎭 قلب داستان", q: [
            ["کجا طنز به احساس رسید؟", "اثر گذاشت؟"],
            ["کدام شخصیت بامزه‌تر بود؟", "چرا؟"]] }
    ]},
    { id: "family", icon: "🏠", name: "درام خانوادگی", cards: [
        { t: "🏠 خانواده", q: [
            ["خانوادهٔ داستان چقدر واقعی بود؟", "شبیه کدام آدم‌ها؟"],
            ["کدام رابطه بیشتر تو را درگیر کرد؟", "چرا؟"]] },
        { t: "💔 بحران", q: [
            ["حرفی که گفته نشد چه اثری داشت؟", "فهمیدی چرا؟"],
            ["پایان به نظرت منصفانه بود؟", "بخشش یا فاصله؟"]] }
    ]}
];
var GENRES = isWriter ? GENRES_W : GENRES_R;
function placeTab(tab) {
    var tabs = $$('.tab-content'), last = tabs[tabs.length - 1];
    if (last) last.parentNode.insertBefore(tab, last.nextSibling); else document.body.appendChild(tab);
}
function buildGenre() {
    var nav = $('nav');
    if (!nav || !$('.tab-content')) return;
    var tab = el('div', { id: 'tab-genre', 'class': 'tab-content' });
    var pick = el('div', { 'class': 'layer-card' }, '<h3>🎭 قالب ژانر</h3><p class="nbx-muted" style="margin:0 0 4px">' + (isWriter ? 'ژانر (یا ترکیب چند ژانر) داستانت را انتخاب کن؛ سؤال‌های اختصاصی همان ژانر باز می‌شود و جواب‌ها همراه بقیهٔ دفترچه ذخیره می‌شوند.' : 'ژانر این کتاب را انتخاب کن؛ سؤال‌های تحلیلیِ همان ژانر باز می‌شود و جواب‌ها همراه بقیهٔ دفترچه ذخیره می‌شوند.') + '</p><div class="nbx-chips" id="nbx-genre-chips"></div><p class="nbx-muted" id="nbx-genre-empty" style="margin:8px 0 0">هنوز ژانری انتخاب نکرده‌ای.</p>');
    tab.appendChild(pick);
    GENRES.forEach(function (g) {
        var set = el('div', { 'class': 'nbx-genre-set', 'data-genre': g.id, hidden: '' });
        var n = 0;
        g.cards.forEach(function (c) {
            var card = el('div', { 'class': 'layer-card' }, '<h3>' + esc(g.icon + ' ' + g.name + ' — ' + c.t) + '</h3>');
            c.q.forEach(function (qq) {
                n++;
                var fg = el('div', { 'class': 'field-group' });
                fg.appendChild(el('label', null, esc(qq[0])));
                fg.appendChild(el('textarea', { id: 'gx-' + g.id + '-' + n, placeholder: qq[1] }));
                card.appendChild(fg);
            });
            set.appendChild(card);
        });
        tab.appendChild(set);
    });
    placeTab(tab);
    var b = el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-genre')" }, '🎭 ' + (isWriter ? '۷. ' : '') + 'قالب ژانر');
    nav.appendChild(b);
}
async function refreshGenre() {
    var chips = $('#nbx-genre-chips'); if (!chips) return;
    var meta = await getMeta();
    var sel = meta.genres || [];
    chips.innerHTML = '';
    GENRES.forEach(function (g) {
        var filled = $$('textarea[id^="gx-' + g.id + '-"]').filter(function (t) { return t.value.trim(); }).length;
        var on = sel.indexOf(g.id) > -1;
        var c = el('button', { 'class': 'nbx-chip', type: 'button', 'aria-pressed': String(on) }, g.icon + ' ' + esc(g.name) + (filled ? '<small>(' + fa(filled) + ')</small>' : ''));
        c.onclick = async function () {
            var m = await getMeta(), s = (m.genres || []).slice(), i = s.indexOf(g.id);
            if (i > -1) s.splice(i, 1); else s.push(g.id);
            await setMeta({ genres: s });
            refreshGenre();
        };
        chips.appendChild(c);
    });
    $$('.nbx-genre-set').forEach(function (s) {
        var has = sel.indexOf(s.getAttribute('data-genre')) > -1;
        // ژانری که جواب دارد همیشه باز می‌ماند تا نوشته‌ای پنهان نشود
        var filled = $$('textarea', s).some(function (t) { return t.value.trim(); });
        if (has || filled) s.removeAttribute('hidden'); else s.setAttribute('hidden', '');
    });
    $('#nbx-genre-empty').hidden = sel.length > 0 || $$('.nbx-genre-set:not([hidden])').length > 0;
}

/* ======================================================================
   ۲) تب ساختار: فصل‌ها و صحنه‌ها (کارت‌های جابه‌جاشونده)
   ====================================================================== */
var STATUS_S = [['idea', '💡 ایده'], ['draft', '✏️ پیش‌نویس'], ['done', '✅ تمام']];
var PACE = [['', 'ریتم؟'], ['slow', '🌊 کند'], ['mid', '🚶 متعادل'], ['fast', '🔥 تند'], ['broken', '⚡ شکسته']];
var saveCards = makeSaver('__cards', function () { return collectCards(); });
function collectCards() {
    return $$('#nbx-cards .nbx-card').map(function (c) {
        return {
            id: c.getAttribute('data-id'), type: c.getAttribute('data-type'),
            title: $('.nbx-title', c).value, note: $('.nbx-note', c).value,
            status: $('.nbx-status', c).value, pace: $('.nbx-pace', c).value,
            chars: getLinks(c, 'chars'), rules: getLinks(c, 'rules')
        };
    });
}
function buildStructure() {
    var nav = $('nav');
    if (!nav || !$('.tab-content')) return;
    var tab = el('div', { id: 'tab-structure', 'class': 'tab-content' });
    tab.innerHTML = '<div class="layer-card"><h3>🗂️ ساختار: فصل‌ها و صحنه‌ها</h3>' +
        '<p class="nbx-muted" style="margin:0 0 10px">هر فصل یا صحنه یک کارت است. با دستگیرهٔ <b>⠿</b> بکش و جابه‌جا کن، یا از دکمه‌های ↑ ↓ استفاده کن. ریتم هر صحنه را هم مشخص کن تا ببینی داستانت یک‌نواخت نشده باشد.</p>' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-add-ch">➕ فصل جدید</button><button type="button" class="nbx-btn" id="nbx-add-sc">➕ صحنهٔ جدید</button><button type="button" class="nbx-btn" id="nbx-tpl">✨ سه‌پرده‌ای</button><button type="button" class="nbx-btn" id="nbx-tpl-hero">🗡️ سفر قهرمان</button><button type="button" class="nbx-btn" id="nbx-tpl-seven">7️⃣ هفت‌نقطه‌ای</button><button type="button" class="nbx-btn" id="nbx-tpl-stc">🐱 نجات گربه</button><button type="button" class="nbx-btn" id="nbx-tpl-circle">⭕ دایرهٔ داستان</button><button type="button" class="nbx-btn" id="nbx-tpl-freytag">🔺 هرم فرایتاگ</button><button type="button" class="nbx-btn" id="nbx-tpl-eight">8️⃣ هشت‌توالی</button><button type="button" class="nbx-btn" id="nbx-tpl-kisho">🌸 کی‌شو‌تن‌کتسو</button></div>' +
        '<p class="nbx-muted" id="nbx-struct-sum" style="margin:10px 0 0"></p>' +
        '<div class="nbx-spine" id="nbx-spine"></div><div id="nbx-cards"></div><div class="nbx-empty" id="nbx-struct-empty">هنوز کارتی نساخته‌ای. با «فصل جدید» شروع کن یا از قالب سه‌پرده‌ای کمک بگیر.</div></div>';
    placeTab(tab);
    nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-structure')" }, '🗂️ ۶. ساختار'));
    var list = $('#nbx-cards');

    $('#nbx-add-ch').onclick = function () { addCard('chapter'); };
    $('#nbx-add-sc').onclick = function () { addCard('scene'); };
    $('#nbx-tpl').onclick = function () {
        if (collectCards().length && !confirm('کارت‌های قبلی می‌مانند و قالب سه‌پرده‌ای به انتهای آن‌ها اضافه می‌شود. ادامه بدهم؟')) return;
        [['پرده اول: معرفی و گره‌افکنی', 'دنیای عادی، شخصیت اصلی، حادثهٔ آغازگر.'],
         ['پرده دوم: کشمکش', 'مانع‌ها بزرگ‌تر می‌شوند، نقطهٔ میانی، سقوط.'],
         ['پرده سوم: اوج و فرجام', 'رویارویی نهایی و دنیای تازه.']].forEach(function (x) { addCard('chapter', { title: x[0], note: x[1] }, true); });
        afterChange(); toast('قالب اضافه شد');
    };

    function applyTpl(arr, label) {
        if (collectCards().length && !confirm('کارت‌های قبلی می‌مانند و ' + label + ' به انتهای آن‌ها اضافه می‌شود. ادامه بدهم؟')) return;
        arr.forEach(function (x) { addCard('chapter', { title: x[0], note: x[1] }, true); });
        afterChange(); toast('قالب اضافه شد');
    }
    $('#nbx-tpl-hero').onclick = function () { applyTpl(TPL_HERO, 'قالب سفر قهرمان'); };
    $('#nbx-tpl-seven').onclick = function () { applyTpl(TPL_SEVEN, 'قالب هفت‌نقطه‌ای'); };
    $('#nbx-tpl-circle').onclick = function () { applyTpl(TPL_CIRCLE, 'قالب دایرهٔ داستان'); };
    $('#nbx-tpl-freytag').onclick = function () { applyTpl(TPL_FREYTAG, 'قالب هرم فرایتاگ'); };
    $('#nbx-tpl-eight').onclick = function () { applyTpl(TPL_EIGHT, 'قالب هشت‌توالی'); };
    $('#nbx-tpl-kisho').onclick = function () { applyTpl(TPL_KISHO, 'قالب کی‌شو‌تن‌کتسو'); };
    $('#nbx-tpl-stc').onclick = function () { applyTpl(TPL_STC, 'قالب نجات گربه (۱۵ ضرب‌آهنگ)'); };

    // انتخاب، ویرایش و حذف
    list.addEventListener('input', function (e) { if (e.target.classList.contains('nbx-note')) grow(e.target); saveCards(); });
    list.addEventListener('change', saveCards);
    list.addEventListener('focusin', function (e) {
        var t = e.target;
        if (t.classList && t.classList.contains('nbx-note') && !t.value && t.getAttribute('data-keep')) { t.value = t.getAttribute('data-keep'); grow(t); }
    });
    list.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var card = b.closest('.nbx-card'); if (!card) return;
        if (b.classList.contains('up') && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
        else if (b.classList.contains('down') && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
        else if (b.classList.contains('del')) {
            var title = $('.nbx-title', card).value || 'این کارت';
            if (!confirm('«' + title + '» حذف شود؟')) return;
            card.remove();
        } else if (b.classList.contains('lk-chars')) { pickForCard(card, 'chars'); return; }
        else if (b.classList.contains('lk-rules')) { pickForCard(card, 'rules'); return; }
        else return;
        afterChange();
    });

    // کشیدن با اشاره‌گر (ماوس و لمس)
    var dragging = null;
    list.addEventListener('pointerdown', function (e) {
        var h = e.target.closest('.nbx-handle'); if (!h) return;
        e.preventDefault();
        dragging = h.closest('.nbx-card'); dragging.classList.add('nbx-dragging');
        try { h.setPointerCapture(e.pointerId); } catch (x) {}
    });
    list.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var over = under && under.closest ? under.closest('.nbx-card') : null;
        if (over && over !== dragging && list.contains(over)) {
            var r = over.getBoundingClientRect();
            list.insertBefore(dragging, e.clientY > r.top + r.height / 2 ? over.nextSibling : over);
        }
        if (e.clientY < 90) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
    });
    function endDrag() { if (!dragging) return; dragging.classList.remove('nbx-dragging'); dragging = null; afterChange(); }
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);
}
/* ======================================================================
   🧭 نقشهٔ راه نوشتن + 📜 اصول نوشتن (تب ساختار)
   ====================================================================== */
var ROAD_STAGES = [
    { t: '۱. ایده و هسته', h: 'پیش از هر چیز بدانی داستان دربارهٔ چیست.', it: ['لاگ‌لاین را نوشتم', 'پرسش محوری و تم روشن است', 'می‌دانم چرا این داستان را باید من بنویسم'] },
    { t: '۲. شخصیت و جهان', h: 'کسانی که داستان را جلو می‌برند و دنیایی که قانون دارد.', it: ['شخصیت اصلی و خواسته‌اش مشخص است', 'نیروی مخالف (آدم یا شرایط) روشن است', 'قانون‌ها و تابوهای جهان ثبت شده‌اند'] },
    { t: '۳. طرح و ساختار', h: 'نقشهٔ کلی پیش از شروع نوشتن.', it: ['یک روش ساختار را انتخاب کردم', 'نقاط عطف مشخص‌اند', 'فصل‌ها یا صحنه‌ها چیده شده‌اند'] },
    { t: '۴. پیش‌نویس اول', h: 'هدف: تمام شدن، نه خوب بودن.', it: ['بدون ویرایش وسط کار جلو رفتم', 'پایان را نوشتم', 'پیش‌نویس تا آخر کامل است'] },
    { t: '۵. بازنویسی ساختاری', h: 'کل داستان را از بالا نگاه کن، نه جمله‌ها را.', it: ['هر صحنه یک تغییر دارد', 'ریتم یک‌نواخت نیست', 'تناقض‌های شخصیت و جهان برطرف شد', 'قوس شخصیت اصلی کامل است'] },
    { t: '۶. ویرایش خط‌به‌خط', h: 'حالا نوبت جمله‌هاست.', it: ['جمله‌های زائد و تکرارها حذف شد', 'دیالوگ‌ها را بلند خواندم', 'املا و نشانه‌گذاری بررسی شد'] },
    { t: '۷. خوانندهٔ آزمایشی', h: 'نگاهی غیر از نگاه خودت.', it: ['حداقل یک نفر خواند', 'بازخوردها را جمع کردم', 'تصمیم گرفتم کدام‌ها اعمال شود'] },
    { t: '۸. نسخهٔ نهایی', h: 'آخرین کارها پیش از تمام شدن.', it: ['عنوان نهایی شد', 'معرفی کوتاه کتاب را نوشتم', 'از نسخهٔ نهایی نسخهٔ پشتیبان گرفتم'] }
];
var PRINCIPLES = [
    ['نشان بده، نگو', 'به‌جای «او عصبانی بود»، کاری که عصبانیت با بدنش و رفتارش می‌کند را بنویس.'],
    ['هر صحنه یک تغییر', 'اگر چیزی در صحنه عوض نشود (موقعیت، رابطه، آگاهی)، شاید لازم نباشد.'],
    ['شخصیت یعنی خواسته + مانع', 'شخصیتی که چیزی نمی‌خواهد یا مانعی ندارد، داستان نمی‌سازد.'],
    ['دیر وارد شو، زود بیرون بیا', 'صحنه را نزدیک به لحظهٔ مهمش شروع کن و بعد از آن زود تمامش کن.'],
    ['تفنگ چخوف', 'چیز مهمی که در داستان معرفی می‌کنی باید جایی به کار بیاید؛ و برعکس، چیزی که مهم است زودتر کاشته شود.'],
    ['به‌جای «و بعد»، «ولی» و «بنابراین»', 'هر صحنه باید نتیجهٔ قبلی و علت بعدی باشد، نه فقط ردیف‌شدن اتفاق‌ها.'],
    ['انتخاب باید هزینه داشته باشد', 'انتخابی که چیزی از شخصیت نمی‌گیرد، تعلیق نمی‌سازد.'],
    ['قهرمان کنشگر باشد', 'گره‌های اصلی باید از تصمیم خود شخصیت بیاید، نه فقط از اتفاق‌هایی که برایش می‌افتد.'],
    ['زیرمتن در دیالوگ', 'آدم‌ها کمتر مستقیم می‌گویند چه می‌خواهند؛ منظور را زیر حرف بگذار.'],
    ['اطلاعات را عقب بینداز', 'پاسخ را زود نده؛ پرسش را زنده نگه دار تا خواننده بماند.'],
    ['قانون‌های جهان را بی‌هزینه نشکن', 'اگر قانون جهان باید شکسته شود، شکستنش باید بهایی داشته باشد.'],
    ['پایان از دل آغاز می‌آید', 'هر چیز مهم که در شروع می‌کاری باید در پایان معنایی بگیرد.'],
    ['اول بنویس، بعد ویرایش کن', 'ویرایش هم‌زمان با نوشتن، پیش‌نویس را متوقف می‌کند؛ بگذار اول بد باشد.'],
    ['ریسک را بالا ببر', 'در هر پرده بپرس «اگر شکست بخورد چه از دست می‌دهد؟» و جواب را بزرگ‌تر کن.'],
    ['ساعت شنی', 'برای تعلیق، یک محدودیت زمانی یا برگشت‌ناپذیر بگذار: مهلت، رازی که لو می‌رود، فرصتی که می‌سوزد.'],
    ['نقطهٔ بی‌بازگشت', 'یک لحظه بساز که شخصیت دیگر نمی‌تواند به دنیای قبل برگردد.'],
    ['از آخر به اول فکر کن', 'وقتی پایان را بدانی، کاشتن سرنخ‌ها و چیدن صحنه‌ها آسان‌تر می‌شود.'],
    ['تناقض بده', 'آدم‌ها همیشه با خودشان یکی نیستند؛ شخصیتی که چیزی می‌گوید و کار دیگری می‌کند زنده‌تر است.'],
    ['نقص باورپذیر', 'شخصیت اصلی عیبی داشته باشد که مستقیم در مسیرش مانع بسازد.'],
    ['ضدقهرمان هم منطق دارد', 'او هم خودش را آدم خوبِ داستان می‌داند؛ دلیل‌هایش را جدی بنویس.'],
    ['خواستهٔ آگاهانه در برابر نیاز ناخودآگاه', 'چیزی که شخصیت دنبالش است با چیزی که واقعاً لازم دارد فرق دارد؛ قوس شخصیت از همین فاصله ساخته می‌شود.'],
    ['جزئیات خاص', 'یک جزئیات دقیق و غیرمنتظره از ده توصیف کلی بهتر است.'],
    ['حواس پنج‌گانه', 'هر صحنه حداقل یک حس غیر از دیدن داشته باشد: بو، صدا، لمس یا مزه.'],
    ['فعل قوی به‌جای قید', '«دوید» بهتر از «سریع رفت»؛ به‌جای تقویت جمله با قید، فعل دقیق‌تر پیدا کن.'],
    ['تکرار هدفمند', 'تکرار یک تصویر یا جمله باید معنایی بسازد، نه نتیجهٔ بی‌دقتی باشد.'],
    ['صدای راوی ثابت بماند', 'لحن و زاویهٔ دید را بی‌دلیل و وسط صحنه عوض نکن.'],
    ['بازنویسی بدون ترحم', 'صحنه‌ای که دوستش داری ولی به داستان خدمت نمی‌کند باید برود.'],
    ['بلند بخوان', 'ریتم لنگ و دیالوگ‌های ساختگی را با گوش راحت‌تر می‌شود پیدا کرد.'],
    ['کنار بگذار و برگرد', 'چند روز فاصله از پیش‌نویس، چشم را برای ویرایش تازه می‌کند.']
];
var ROAD = {};
var saveRoad = makeSaver('__roadmap', function () { return ROAD; });
function paintRoad() {
    var tot = 0, done = 0;
    $$('.nbx-road-st').forEach(function (st) {
        var boxes = $$('input[data-r]', st), n = 0;
        boxes.forEach(function (b) { var on = !!ROAD[b.getAttribute('data-r')]; b.checked = on; b.parentNode.classList.toggle('on', on); if (on) n++; });
        tot += boxes.length; done += n;
        var c = $('.nbx-road-c', st); if (c) c.textContent = fa(n) + ' از ' + fa(boxes.length);
    });
    var sm = $('.nbx-road-sum'); if (sm) sm.textContent = done ? fa(done) + ' از ' + fa(tot) + ' گام انجام شده' : 'چک‌لیست مراحل نوشتن، از ایده تا نسخهٔ نهایی';
}
function buildGuide(tab) {
    if (!tab || $('.nbx-guide', tab)) return;
    var pr = el('details', { 'class': 'layer-card nbx-layer nbx-arch nbx-guide' });
    pr.innerHTML = '<summary><div style="flex:1"><h3>📜 اصول نوشتن</h3><small>چند اصل آزموده‌شده برای طرح و بازنویسی؛ قانون نیستند، ابزارند.</small></div></summary>' +
        PRINCIPLES.map(function (x) { return '<div class="nbx-pr"><b>' + esc(x[0]) + '</b><p>' + esc(x[1]) + '</p></div>'; }).join('');
    tab.insertBefore(pr, tab.firstChild);
}
/* 🧭 نقشهٔ راه نوشتن: تب مستقل */
function buildRoadTab() {
    var nav = $('nav'); if (!nav || !$('.tab-content') || $('#tab-road')) return;
    var tab = el('div', { id: 'tab-road', 'class': 'tab-content' });
    var h = '<div class="layer-card"><h3>🧭 نقشهٔ راه نوشتن</h3><p class="nbx-muted" style="margin:0 0 4px">مراحل نوشتن یک اثر، از ایده تا نسخهٔ نهایی. هر گام را که انجام دادی تیک بزن؛ پیشرفت برای هر پروژه جدا ذخیره می‌شود.</p><p class="nbx-road-sum" style="margin:6px 0 0;font-weight:700"></p></div>';
    ROAD_STAGES.forEach(function (st, si) {
        h += '<div class="layer-card nbx-road-st"><h3>' + esc(st.t) + ' <small class="nbx-muted nbx-road-c"></small></h3><span class="nbx-muted" style="display:block;margin-bottom:4px">' + esc(st.h) + '</span>';
        st.it.forEach(function (x, ii) { h += '<label class="nbx-road-it"><input type="checkbox" data-r="s' + si + '-' + ii + '"><span>' + esc(x) + '</span></label>'; });
        h += '</div>';
    });
    tab.innerHTML = h;
    tab.addEventListener('change', function (e) {
        var b = e.target; if (!b.getAttribute || !b.getAttribute('data-r')) return;
        if (b.checked) ROAD[b.getAttribute('data-r')] = 1; else delete ROAD[b.getAttribute('data-r')];
        saveRoad(); paintRoad();
    });
    placeTab(tab);
    nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-road')" }, '🧭 ' + fa($$('nav .nav-link').length + 1) + '. نقشهٔ راه نوشتن'));
    paintRoad();
}
function addCard(type, data, silent) {
    var list = $('#nbx-cards'); data = data || {};
    var id = data.id || uid();
    var c = el('div', { 'class': 'nbx-card ' + type, 'data-id': id, 'data-type': type });
    var stOpts = STATUS_S.map(function (s) { return '<option value="' + s[0] + '"' + (data.status === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('');
    var pcOpts = PACE.map(function (s) { return '<option value="' + s[0] + '"' + ((data.pace || '') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('');
    c.innerHTML = '<button type="button" class="nbx-handle" aria-label="جابه‌جا کن (بکش)" title="بکش و جابه‌جا کن">⠿</button>' +
        '<div class="nbx-card-main"><div class="nbx-card-top"><span class="nbx-badge"></span>' +
        '<input class="nbx-title" type="text" placeholder="' + (type === 'chapter' ? 'عنوان فصل' : 'عنوان یا یک‌خطِ صحنه') + '" value="' + esc(data.title || '') + '"></div>' +
        '<textarea class="nbx-note" placeholder="چه اتفاقی می‌افتد؟ چه چیزی تغییر می‌کند؟"></textarea>' +
        '<div class="nbx-lk"><button type="button" class="nbx-btn sm lk-chars">👤 شخصیت‌ها</button><button type="button" class="nbx-btn sm lk-rules">📌 قانون و تابو</button><span class="nbx-lk-chips"></span></div>' +
        '<div class="nbx-card-foot"><select class="nbx-status" aria-label="وضعیت">' + stOpts + '</select><select class="nbx-pace" aria-label="ریتم">' + pcOpts + '</select>' +
        '<button type="button" class="nbx-mini up" aria-label="بالا">↑</button><button type="button" class="nbx-mini down" aria-label="پایین">↓</button><button type="button" class="nbx-mini del" aria-label="حذف">🗑</button></div></div>';
    var note = $('.nbx-note', c); note.value = data.note || ''; note.setAttribute('data-keep', data.note || '');
    setLinks(c, 'chars', data.chars || []); setLinks(c, 'rules', data.rules || []);
    list.appendChild(c);
    if (!silent) { afterChange(); $('.nbx-title', c).focus(); }
    return c;
}
function afterChange() {
    var ch = 0, sc = 0, notes = [];
    $$('#nbx-cards .nbx-card').forEach(function (c) {
        var b = $('.nbx-badge', c);
        if (c.getAttribute('data-type') === 'chapter') { ch++; sc = 0; b.textContent = 'فصل ' + fa(ch); }
        else { sc++; b.textContent = 'صحنه ' + fa(ch || 1) + '.' + fa(sc); }
        var n = $('.nbx-note', c); if (n.getAttribute('data-keep') !== n.value || !n.style.height) notes.push(n); n.setAttribute('data-keep', n.value);
    });
    growAll(notes);
    var all = $$('#nbx-cards .nbx-card');
    var chapters = all.filter(function (c) { return c.getAttribute('data-type') === 'chapter'; }).length;
    var done = all.filter(function (c) { return $('.nbx-status', c).value === 'done'; }).length;
    $('#nbx-struct-sum').textContent = all.length ? fa(chapters) + ' فصل · ' + fa(all.length - chapters) + ' صحنه · ' + fa(done) + ' کارت تمام‌شده' : '';
    $('#nbx-struct-empty').hidden = all.length > 0;
    saveCards();
    refreshRhythm();
    refreshLinks();
}
async function refreshStructure() {
    var list = $('#nbx-cards'); if (!list) return;
    var d = await getData(activeId());
    list.innerHTML = '';
    (d.__cards || []).forEach(function (c) { addCard(c.type === 'chapter' ? 'chapter' : 'scene', c, true); });
    // ذخیره‌ی دوباره‌ی بی‌صدا لازم نیست؛ فقط شمارنده‌ها و عنوان‌ها را به‌روز کن
    var ch = 0, sc = 0;
    $$('#nbx-cards .nbx-card').forEach(function (c) {
        var b = $('.nbx-badge', c);
        if (c.getAttribute('data-type') === 'chapter') { ch++; sc = 0; b.textContent = 'فصل ' + fa(ch); }
        else { sc++; b.textContent = 'صحنه ' + fa(ch || 1) + '.' + fa(sc); }
        grow($('.nbx-note', c));
    });
    var all = $$('#nbx-cards .nbx-card');
    var chapters = all.filter(function (c) { return c.getAttribute('data-type') === 'chapter'; }).length;
    var done = all.filter(function (c) { return $('.nbx-status', c).value === 'done'; }).length;
    $('#nbx-struct-sum').textContent = all.length ? fa(chapters) + ' فصل · ' + fa(all.length - chapters) + ' صحنه · ' + fa(done) + ' کارت تمام‌شده' : '';
    $('#nbx-struct-empty').hidden = all.length > 0;
    ROAD = {}; Object.keys(d.__roadmap || {}).forEach(function (k) { ROAD[k] = 1; }); paintRoad();
    refreshRhythm();
    renderSpine();
    refreshLinks();
}

/* ======================================================================
   ۳) فهرست کتاب‌ها و وضعیت هر کتاب (دفترچه کتاب‌خوان)
   ====================================================================== */
var BSTATUS = (isWriter || isWorks) ?
    [['', '— وضعیت —'], ['idea', '💡 فقط ایده'], ['writing', '✍️ در حال نوشتن'], ['revising', '🔧 در حال بازنویسی'], ['done', '✅ تمام شد'], ['dropped', '⏸️ نیمه‌کاره ماند']] :
    [['', '— وضعیت —'], ['want', '🔖 می‌خواهم بخوانم'], ['reading', '📖 در حال خواندن'], ['done', '✅ تمام شد'], ['dropped', '⏸️ نیمه‌کاره ماند']];
function persianYear(d) { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(d); }
function persianDate(iso) {
    if (!iso) return '';
    var p = iso.split('-'); if (p.length !== 3) return '';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(+p[0], +p[1] - 1, +p[2]));
}
function starsHtml(r) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<button type="button" class="nbx-star' + (i <= r ? ' on' : '') + '" data-v="' + i + '" aria-label="' + fa(i) + ' ستاره">' + (i <= r ? '★' : '☆') + '</button>';
    return s;
}
function statusSelect(v) { return '<select class="nbx-st" aria-label="وضعیت کتاب">' + BSTATUS.map(function (s) { return '<option value="' + s[0] + '"' + (v === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>'; }
function applyStatusChange(meta, val) {
    var patch = { status: val };
    if (val === 'done' && !meta.finished) patch.finished = dateKey();
    if (val !== 'done') patch.finished = meta.finished || '';
    return patch;
}
function buildMetaBox() {
    var nav = $('nav'); if (!nav || !$('.tab-content') || $('#tab-status')) return;
    var tab = el('div', { id: 'tab-status', 'class': 'tab-content' });
    tab.appendChild(el('div', { 'class': 'layer-card nbx-meta', id: 'nbx-meta' }));
    placeTab(tab);
    nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-status')" }, (isWriter ? '📖 ' + fa($$('nav .nav-link').length + 1) + '. وضعیت اثر' : '🌟 وضعیت و امتیاز')));
}
async function refreshMetaBox() {
    var box = $('#nbx-meta'); if (!box) return;
    if (isWriter) {
        var wm = await getMeta();
        box.innerHTML = '<h3>📖 وضعیت این اثر</h3><div class="nbx-row">' + statusSelect(wm.status || '') +
            '<span id="nbx-m-date" ' + (wm.status === 'done' ? '' : 'hidden') + '><label class="nbx-muted">تاریخ اتمام: <input type="date" id="nbx-m-fin" value="' + esc(wm.finished || '') + '"></label></span></div>' +
            '<p class="nbx-muted" style="margin:8px 0 0">تعداد کتاب‌هایت در <a href="works.html">✍️ آثار من</a> جمع می‌شود.</p>';
        $('.nbx-st', box).onchange = async function (e) { var mm = await getMeta(); await setMeta(applyStatusChange(mm, e.target.value)); refreshMetaBox(); };
        $('#nbx-m-fin').onchange = async function (e) { await setMeta({ finished: e.target.value }); };
        return;
    }
    var m = await getMeta(), r = m.rating || 0;
    box.innerHTML = '<h3>🌟 وضعیت و امتیاز این کتاب</h3>' +
        '<div class="nbx-row"><span class="nbx-stars" id="nbx-m-stars">' + starsHtml(r) + '</span>' + statusSelect(m.status || '') +
        '<span id="nbx-m-date" ' + (m.status === 'done' ? '' : 'hidden') + '><label class="nbx-muted">تاریخ اتمام: <input type="date" id="nbx-m-fin" value="' + esc(m.finished || '') + '"></label></span></div>' +
        '<p class="nbx-muted" style="margin:8px 0 0">این اطلاعات در <a href="library.html">📚 کتابخانهٔ من</a> جمع می‌شود.</p>';
    $('#nbx-m-stars').onclick = async function (e) {
        var b = e.target.closest('.nbx-star'); if (!b) return;
        var cur = (await getMeta()).rating || 0, v = +b.getAttribute('data-v');
        await setMeta({ rating: cur === v ? 0 : v }); refreshMetaBox();
    };
    $('.nbx-st', box).onchange = async function (e) {
        var mm = await getMeta(); await setMeta(applyStatusChange(mm, e.target.value)); refreshMetaBox();
    };
    $('#nbx-m-fin').onchange = async function (e) { await setMeta({ finished: e.target.value }); };
}
async function loadRows() {
    var projects = PM().getProjects(), rows = [];
    for (var i = 0; i < projects.length; i++) {
        if (!projects[i] || !projects[i].id) continue;
        var d = await getData(projects[i].id), meta = d.__meta || {};
        rows.push({ id: projects[i].id, name: projects[i].name, meta: meta });
    }
    return rows;
}
function libSummary(rows) {
    var yr = persianYear(new Date());
    var done = rows.filter(function (r) { return r.meta.status === 'done'; });
    var thisYear = done.filter(function (r) { return r.meta.finished && persianYear(new Date(r.meta.finished + 'T12:00:00')) === yr; });
    var rated = rows.filter(function (r) { return r.meta.rating > 0; });
    var s = {
        total: rows.length, done: done.length, thisYear: thisYear.length, yr: yr,
        reading: rows.filter(function (r) { return r.meta.status === 'reading'; }).length,
        want: rows.filter(function (r) { return r.meta.status === 'want'; }).length,
        writing: rows.filter(function (r) { return r.meta.status === 'writing'; }).length,
        revising: rows.filter(function (r) { return r.meta.status === 'revising'; }).length,
        idea: rows.filter(function (r) { return r.meta.status === 'idea'; }).length,
        dropped: rows.filter(function (r) { return r.meta.status === 'dropped'; }).length,
        avg: rated.length ? (rated.reduce(function (a, r) { return a + r.meta.rating; }, 0) / rated.length) : 0
    };
    // خلاصه برای نمایش روی صفحهٔ اصلی (بدون نیاز به باز کردن دیتابیس)
    lsSet(NS === 'nvsdg' ? 'nbx-works-summary' : 'nbx-lib-summary', JSON.stringify({ total: s.total, done: s.done, reading: s.reading, want: s.want }));
    return s;
}
function statsHtml(s) {
    if (isWriter || isWorks) return '<div class="nbx-sum nbx-sum5"><div data-f="idea" role="button" tabindex="0" aria-pressed="false"><b>' + fa(s.idea) + '</b>💡 ایده</div><div data-f="writing" role="button" tabindex="0" aria-pressed="false"><b>' + fa(s.writing) + '</b>✍️ در حال نوشتن</div><div data-f="revising" role="button" tabindex="0" aria-pressed="false"><b>' + fa(s.revising) + '</b>🔧 در حال بازنویسی</div><div data-f="done" role="button" tabindex="0" aria-pressed="false"><b>' + fa(s.done) + '</b>✅ تمام شد</div><div data-f="dropped" role="button" tabindex="0" aria-pressed="false"><b>' + fa(s.dropped) + '</b>⏸️ نیمه‌کاره ماند</div></div>';
        '<div><b>' + fa(s.total) + '</b>اثر ثبت‌شده</div><div><b>' + fa(s.thisYear) + '</b>تمام‌شده در سال ' + esc(s.yr) + '</div><div><b>' + fa(s.writing + s.revising) + '</b>در حال نوشتن و بازنویسی</div><div><b>' + fa(s.idea) + '</b>در مرحلهٔ ایده</div></div>';
    return '<div class="nbx-sum"><div class="big"><b>' + fa(s.thisYear) + '</b>کتاب در سال ' + esc(s.yr) + ' تمام کرده‌ای</div>' +
        '<div><b>' + fa(s.total) + '</b>کتاب در کتابخانه</div><div><b>' + fa(s.done) + '</b>کل کتاب‌های تمام‌شده</div><div><b>' + fa(s.reading) + '</b>در حال خواندن</div><div><b>' + fa(s.want) + '</b>در صف خواندن</div>' +
        '<div><b>' + (s.avg ? fa(s.avg.toFixed(1)) : '—') + '</b>میانگین امتیاز</div></div>';
}
async function updateLibSummary() { try { libSummary(await loadRows()); } catch (e) {} }
async function bookListInto(body) {
    var filter = 'all', sort = 'date', q = '', rows = [];
    body.innerHTML = '<div class="nbx-formbox nbx-addbook"><label class="nbx-muted" for="nbx-bl-new">کتاب تازه را به کتابخانه اضافه کن</label>' +
        '<div class="nbx-row"><input class="nbx-in" id="nbx-bl-new" type="text" placeholder="نام کتاب (و نویسنده)" style="flex:1;min-width:180px"><button type="button" class="nbx-btn primary" id="nbx-bl-add">➕ افزودن</button></div></div>' +
        '<div class="nbx-chips" id="nbx-bl-chips"></div>' +
        '<div class="nbx-row" style="margin:6px 0 4px"><input class="nbx-in" id="nbx-bl-q" type="search" placeholder="🔍 جستجو بین کتاب‌ها" aria-label="جستجو بین کتاب‌ها" style="flex:1;min-width:150px;max-width:280px">' +
        '<label class="nbx-muted">مرتب‌سازی: <select id="nbx-bl-sort"><option value="date">تاریخ اتمام (جدیدترین)</option><option value="rating">امتیاز (بیشترین)</option><option value="name">نام</option></select></label></div><div id="nbx-bl-list"></div>';
    $('#nbx-bl-sort').value = sort;
    $('#nbx-bl-sort').onchange = function (e) { sort = e.target.value; paint(); };
    $('#nbx-bl-q').oninput = function (e) { q = e.target.value.trim(); paint(); };
    async function addBook() {
        var inp = $('#nbx-bl-new'), name = inp.value.trim();
        if (!name) { toast('نام کتاب را بنویس.'); return; }
        await LP.addBook(name); inp.value = ''; toast('به کتابخانه اضافه شد ✓'); reload();
    }
    $('#nbx-bl-add').onclick = addBook;
    $('#nbx-bl-new').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addBook(); } };
    async function reload() { rows = await loadRows(); paint(); }
    function paint() {
        var s = libSummary(rows), sh = $('#lib-stats'); if (sh) sh.innerHTML = statsHtml(s);
        var chips = $('#nbx-bl-chips'); chips.innerHTML = '';
        [['all', 'همه'], ['done', '✅ تمام‌شده'], ['reading', '📖 در حال خواندن'], ['want', '🔖 در صف'], ['dropped', '⏸️ نیمه‌کاره']].forEach(function (f) {
            var c = el('button', { 'class': 'nbx-chip', type: 'button', 'aria-pressed': String(filter === f[0]) }, f[1]);
            c.onclick = function () { filter = f[0]; paint(); };
            chips.appendChild(c);
        });
        var list = rows.filter(function (r) { return (filter === 'all' || (r.meta.status || '') === filter) && (!q || r.name.toLowerCase().indexOf(q.toLowerCase()) > -1); });
        list.sort(function (a, b) {
            if (sort === 'rating') return (b.meta.rating || 0) - (a.meta.rating || 0);
            if (sort === 'name') return a.name.localeCompare(b.name, 'fa');
            return (b.meta.finished || '').localeCompare(a.meta.finished || '');
        });
        var host = $('#nbx-bl-list'); host.innerHTML = '';
        if (!rows.length) { host.innerHTML = '<div class="nbx-empty">کتابخانه‌ات هنوز خالی است. اولین کتابت را بالا اضافه کن؛ هر کتاب دفترچهٔ خودش را در «دفترچه کتاب‌خوان» دارد.</div>'; return; }
        if (!list.length) { host.innerHTML = '<div class="nbx-empty">کتابی با این فیلتر پیدا نشد.</div>'; return; }
        list.forEach(function (r) {
            var meta = r.meta, b = el('div', { 'class': 'nbx-book' });
            b.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">' + esc(r.name) + '</span><span class="nbx-stars">' + starsHtml(meta.rating || 0) + '</span></div>' +
                '<div class="nbx-book-foot">' + statusSelect(meta.status || '') +
                (meta.status === 'done' ? '<label>پایان: <input type="date" class="nbx-fin" value="' + esc(meta.finished || '') + '"></label>' : '') +
                '<button type="button" class="nbx-btn nbx-share">🖼️ کارت کتاب</button><button type="button" class="nbx-btn nbx-open" style="margin-right:auto">باز کردن دفترچه ←</button></div>' +
                (meta.finished ? '<div class="nbx-muted" style="margin-top:4px">تمام‌شده در ' + esc(persianDate(meta.finished)) + '</div>' : '');
            $('.nbx-stars', b).onclick = async function (e) {
                var st = e.target.closest('.nbx-star'); if (!st) return;
                var v = +st.getAttribute('data-v');
                await setMeta({ rating: (meta.rating || 0) === v ? 0 : v }, r.id); reload();
            };
            $('.nbx-st', b).onchange = async function (e) { await setMeta(applyStatusChange(meta, e.target.value), r.id); reload(); };
            var fin = $('.nbx-fin', b);
            if (fin) fin.onchange = async function (e) { await setMeta({ finished: e.target.value }, r.id); reload(); };
            $('.nbx-share', b).onclick = function () { var rt = meta.rating || 0; openShareCard('«' + r.name + '»\n' + (rt ? '★'.repeat(rt) + '☆'.repeat(5 - rt) : ''), 'کتابی که خواندم'); };
            $('.nbx-open', b).onclick = function () { LP.open(r.id); };
            host.appendChild(b);
        });
    }
    reload();
}

/* ======================================================================
   مودال عمومی
   ====================================================================== */
function openModal(title, bodyEl) {
    var ov = el('div', { 'class': 'nbx-ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    var box = el('div', { 'class': 'nbx-modal' });
    var head = el('div', { 'class': 'nbx-mhead' }, '<h2>' + esc(title) + '</h2>');
    var x = el('button', { 'class': 'nbx-x', type: 'button', 'aria-label': 'بستن' }, '✕');
    head.appendChild(x); box.appendChild(head); box.appendChild(bodyEl); ov.appendChild(box);
    document.body.appendChild(ov); document.body.classList.add('nbx-lock');
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() { ov.remove(); document.body.classList.remove('nbx-lock'); document.removeEventListener('keydown', onKey); }
    x.onclick = close;
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey);
    x.focus();
    return { close: close, box: box };
}

/* ======================================================================
   ۶) چاپ / PDF با انتخاب تب‌ها
   ====================================================================== */
var PALETTE = ['#e58fa8', '#6fbf9b', '#e3b93f', '#6fa6da', '#9d85d6', '#ee9a74', '#9bc25c', '#cf8fc2'];
function tabList() {
    return $$('nav .nav-link').map(function (b, i) {
        var mm = (b.getAttribute('onclick') || '').match(/'([^']+)'\s*\)/);
        if (!mm || mm[1] === 'tab-learn' || mm[1] === 'tab-road') return null;
        return { id: mm[1], title: b.textContent.replace(/\s+/g, ' ').trim().replace(/[۰-۹0-9]+\.\s*/, ''), color: PALETTE[i % PALETTE.length] };
    }).filter(Boolean);
}
function labelOf(field) {
    var l = field.previousElementSibling;
    while (l && l.tagName !== 'LABEL') l = l.previousElementSibling;
    if (!l && field.parentElement) l = field.parentElement.querySelector('label');
    return l ? l.textContent.replace(/\s+/g, ' ').trim() : 'بخش';
}
function collectSection(id) {
    var sec = document.getElementById(id); if (!sec) return { cards: [], count: 0 };
    if (id === 'tab-chars') { var cs = charsSection(); if (cs) return cs; }
    if (id === 'tab-notes') return notesSection();
    var ct = cardTabSection(id); if (ct && !MIXED_TABS[id]) return ct;
    if (id === 'tab-structure') {
        var rows = collectCards().filter(function (c) { return (c.title || '').trim() || (c.note || '').trim(); });
        return { structure: rows, cards: [], count: rows.length };
    }
    var cards = [], count = 0;
    $$('.layer-card', sec).forEach(function (card) {
        if (card.id === 'nbx-meta') return;
        var h = $('h3', card), items = [];
        $$('textarea[id]', card).forEach(function (t) { if (t.value.trim()) items.push({ label: labelOf(t), value: t.value.trim() }); });
        if (items.length) { cards.push({ title: h ? h.textContent.replace(/\s+/g, ' ').trim() : '', items: items }); count += items.length; }
    });
    if (ct && MIXED_TABS[id]) { cards = ct.cards.concat(cards); count += ct.count; }
    return { cards: cards, count: count };
}
function h(s) { return esc(s).replace(/\n/g, '<br>'); }
function buildPrintHtml(ids, mono) {
    var tabs = tabList().filter(function (t) { return ids.indexOf(t.id) > -1; });
    var proj = activeName() || (isWriter ? 'داستان' : 'کتاب');
    var kind = isWriter ? '📓 دفترچه نویسندگی' : '📖 دفترچه کتاب‌خوان';
    var date = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
        var secs = tabs.map(function (t) { return { t: t, d: collectSection(t.id) }; }).filter(function (s) { return s.d.count > 0; });
    var ink = mono ? '#222' : '';
    var out = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>' + esc(proj) + ' — ' + esc(kind.replace(/^\S+\s/, '')) + '</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"><style>' +
        '@page{size:A4;margin:18mm 15mm 20mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        'body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;color:#2a2230;line-height:2;margin:0;padding:18px;font-size:14px;background:#fff}' +
        '.bar{text-align:center;margin-bottom:20px}.bar button{background:#5b21b6;color:#fff;border:0;padding:10px 24px;border-radius:10px;font:700 14px Vazirmatn,Tahoma;cursor:pointer;margin:0 4px}' +
        '.cover{text-align:center;padding:34px 16px 26px;margin-bottom:26px;border-radius:16px;background:linear-gradient(160deg,' + (mono ? '#f2f2f2,#e6e6e6' : '#fde6ee,#e5eefb') + ');border:2px solid ' + (mono ? '#999' : '#e9c9d6') + '}' +
        '.cover .k{font-size:15px;color:#6b5a70}.cover h1{margin:6px 0 10px;font-size:30px;color:' + (ink || '#4c1d95') + '}.cover .m{font-size:13px;color:#6b5a70}' +
        '.toc{margin:16px auto 0;max-width:420px;text-align:right;font-size:13px}.toc div{display:flex;justify-content:space-between;border-bottom:1px dotted #bbb;padding:2px 0}' +
        '.sec{margin-top:26px}.sec>h2{margin:0 0 12px;padding:8px 16px;font-size:20px;border-radius:10px;break-after:avoid;color:#2a2230;border-right:8px solid var(--c)}' +
        '.sec>h2{background:' + (mono ? '#eee' : 'color-mix(in srgb,var(--c) 22%,#fff)') + '}' +
        '.card>h3{margin:18px 0 8px;font-size:16px;color:' + (ink || 'color-mix(in srgb,var(--c) 55%,#2a2230)') + ';break-after:avoid}' +
        '.it{margin:0 0 12px;padding:10px 14px;border-right:4px solid ' + (mono ? '#888' : 'var(--c)') + ';border-radius:8px;background:' + (mono ? '#f6f6f6' : 'color-mix(in srgb,var(--c) 8%,#fff)') + '}' +
        '.lb{font-weight:700;font-size:13px;color:' + (ink || 'color-mix(in srgb,var(--c) 55%,#2a2230)') + ';margin-bottom:2px;break-after:avoid}' +
        '.vl{overflow-wrap:anywhere;word-break:break-word}' +
        '.gh{margin:14px 0 6px;font-weight:700;font-size:13px;color:#6b5a70;border-bottom:1px dashed #bbb;break-after:avoid}' +
        '.sc{margin:0 0 10px;padding:8px 14px;border-radius:8px;border-right:4px solid var(--c);background:' + (mono ? '#f6f6f6' : 'color-mix(in srgb,var(--c) 8%,#fff)') + '}' +
        '.sc.ch{border-right-width:8px;font-weight:700;margin-top:16px}.sc.s{margin-right:20px}.sc small{color:#6b5a70;font-weight:400}' +
        '.ft{position:fixed;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:#888}' +
        '@media print{.bar{display:none!important}body{padding:0}}</style></head><body>' +
        '<div class="bar"><button onclick="window.print()">🖨️ چاپ / ذخیره PDF</button><button onclick="window.close()" style="background:#888">✕ بستن</button></div>' +
        '<div class="cover"><div class="k">' + esc(kind) + '</div><h1>' + esc(proj) + '</h1><div class="m">' + esc(date) + '</div>' +
        '<div class="toc">' + secs.map(function (s) { return '<div><span>' + esc(s.t.title) + '</span><span>' + fa(s.d.count) + (s.d.unit ? ' ' + s.d.unit : s.d.structure ? ' کارت' : ' بخش') + '</span></div>'; }).join('') + '</div></div>';
    secs.forEach(function (s) {
        out += '<div class="sec" style="--c:' + (mono ? '#666' : s.t.color) + '"><h2>' + esc(s.t.title) + '</h2>';
        if (s.d.structure) {
            var ch = 0, sc = 0;
            s.d.structure.forEach(function (c) {
                var st = { idea: 'ایده', draft: 'پیش‌نویس', done: 'تمام' }[c.status] || '';
                var pc = { slow: 'ریتم کند', mid: 'ریتم متعادل', fast: 'ریتم تند', broken: 'ریتم شکسته' }[c.pace] || '';
                var meta = [st, pc].filter(Boolean).join(' · ');
                if (c.type === 'chapter') { ch++; sc = 0; }
                else { sc++; }
                out += '<div class="sc ' + (c.type === 'chapter' ? 'ch' : 's') + '">' + (c.type === 'chapter' ? 'فصل ' + fa(ch) : 'صحنه ' + fa(ch || 1) + '.' + fa(sc)) + ' — ' + h(c.title || 'بدون عنوان') +
                    (meta ? ' <small>(' + esc(meta) + ')</small>' : '') + (c.note ? '<div style="font-weight:400">' + h(c.note) + '</div>' : '') + '</div>';
            });
        } else {
            s.d.cards.forEach(function (c) {
                out += '<div class="card">' + (c.title ? '<h3>' + esc(c.title) + '</h3>' : '');
                c.items.forEach(function (it) { if (it.head) { out += '<div class="gh">' + esc(it.head) + '</div>'; return; } out += '<div class="it"><div class="lb">' + esc(it.label) + '</div><div class="vl">' + h(it.value) + '</div></div>'; });
                out += '</div>';
            });
        }
        out += '</div>';
    });
    if (!secs.length) out += '<p style="text-align:center;color:#888">بخش انتخاب‌شده هنوز چیزی ندارد.</p>';
    out += '<div class="ft">' + esc(kind) + ' · ' + esc(proj) + '</div></body></html>';
    return out;
}
function openPrintPicker() {
    var tabs = tabList();
    var body = el('div', { 'class': 'nbx-mbody' });
    var info = tabs.map(function (t) { var sec = collectSection(t.id); return { t: t, n: sec.count, u: sec.unit }; });
    body.innerHTML = '<p class="nbx-muted" style="margin:0">بخش‌هایی را که می‌خواهی در PDF باشند علامت بزن. فقط فیلدهای پرشده چاپ می‌شوند.</p>' +
        '<div class="nbx-row" style="margin:10px 0"><button type="button" class="nbx-btn" id="nbx-p-all">انتخاب همه</button><button type="button" class="nbx-btn" id="nbx-p-none">هیچ‌کدام</button><button type="button" class="nbx-btn" id="nbx-p-filled">فقط پرشده‌ها</button></div>' +
        '<div class="nbx-pick" id="nbx-p-list">' + info.map(function (x, i) {
            return '<label><input type="checkbox" value="' + esc(x.t.id) + '"' + (x.n ? ' checked' : '') + '> ' + esc(x.t.title) + '<small>' + (x.n ? fa(x.n) + (x.u ? ' ' + x.u : x.t.id === 'tab-structure' ? ' کارت' : ' بخش پرشده') : 'خالی') + '</small></label>';
        }).join('') + '</div>' +
        '<label class="nbx-row" style="gap:8px;margin:8px 0"><input type="checkbox" id="nbx-p-mono" style="width:20px;height:20px"> <span>نسخهٔ ساده و کم‌رنگ (مناسب پرینتر سیاه‌وسفید)</span></label>' +
        '<div class="nbx-row" style="margin-top:10px"><button type="button" class="nbx-btn primary" id="nbx-p-go">🖨️ ساخت PDF</button></div>';
    var m = openModal('🖨️ خروجی PDF', body);
    var boxes = $$('#nbx-p-list input');
    $('#nbx-p-all').onclick = function () { boxes.forEach(function (b) { b.checked = true; }); };
    $('#nbx-p-none').onclick = function () { boxes.forEach(function (b) { b.checked = false; }); };
    $('#nbx-p-filled').onclick = function () { boxes.forEach(function (b, i) { b.checked = info[i].n > 0; }); };
    $('#nbx-p-go').onclick = function () {
        var ids = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        if (!ids.length) { toast('حداقل یک بخش را انتخاب کن.'); return; }
        var html = buildPrintHtml(ids, $('#nbx-p-mono').checked);
        var w = window.open('', '_blank');
        if (!w) { toast('مرورگر اجازهٔ باز شدن پنجرهٔ جدید را نداد.'); return; }
        w.document.open(); w.document.write(html); w.document.close();
        m.close();
        w.onload = function () { w.focus(); setTimeout(function () { try { w.print(); } catch (e) {} }, 600); };
    };
}
window.printFullContent = openPrintPicker;

/* ======================================================================
   ✨ جمله‌های ماندگار / 🔖 کتاب بعدی / ⚖️ مقایسه  (کتابخانهٔ من)
   ====================================================================== */
async function quotesInto(pane, m) {
    var projects = PM().getProjects(), all = [];
    for (var i = 0; i < projects.length; i++) {
        var d = await getData(projects[i].id);
        (d.__quotes || []).forEach(function (q) { all.push({ pid: projects[i].id, book: projects[i].name, q: q }); });
    }
    var filt = '';
    pane.innerHTML = '<div class="nbx-formbox"><label class="nbx-muted">این جمله از کدام کتاب است؟</label><select id="nbx-q-book">' +
        projects.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === activeId() ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') +
        '</select><textarea class="nbx-skip" id="nbx-q-text" placeholder="جمله‌ای که دلت می‌خواهد همیشه با تو بماند..."></textarea>' +
        '<div class="nbx-row"><input id="nbx-q-page" class="nbx-in" type="text" placeholder="صفحه (اختیاری)" style="max-width:140px"><button type="button" class="nbx-btn primary" id="nbx-q-add">➕ افزودن جمله</button></div></div>' +
        '<div class="nbx-row" style="margin:10px 0"><label class="nbx-muted">فقط کتاب: <select id="nbx-q-filter"><option value="">همه</option>' + projects.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('') + '</select></label></div><div id="nbx-q-list"></div>';
    $('#nbx-q-add').onclick = async function () {
        var t = $('#nbx-q-text').value.trim(), pid = $('#nbx-q-book').value;
        if (!t) { toast('اول جمله را بنویس.'); return; }
        await patchData(pid, function (d) { d.__quotes = (d.__quotes || []).concat([{ id: uid(), t: t, p: $('#nbx-q-page').value.trim() }]); });
        toast('جمله ذخیره شد ✓'); quotesInto(pane, m);
    };
    $('#nbx-q-filter').onchange = function (e) { filt = e.target.value; paint(); };
    function paint() {
        var host = $('#nbx-q-list'); host.innerHTML = '';
        var list = all.filter(function (x) { return !filt || x.pid === filt; });
        if (!list.length) { host.innerHTML = '<div class="nbx-empty">هنوز جمله‌ای نگه نداشته‌ای.</div>'; return; }
        list.forEach(function (x) {
            var c = el('div', { 'class': 'nbx-quote' });
            c.innerHTML = '<div class="nbx-q-t">' + esc(x.q.t).replace(/\n/g, '<br>') + '</div><div class="nbx-q-m">— «' + esc(x.book) + '»' + (x.q.p ? '، صفحهٔ ' + esc(x.q.p) : '') + '</div>' +
                '<div class="nbx-row" style="margin-top:6px"><button type="button" class="nbx-btn card">🖼️ کارت</button><button type="button" class="nbx-btn del" style="color:#c0392b;border-color:#c0392b">🗑 حذف</button></div>';
            $('.card', c).onclick = function () { openShareCard(x.q.t, '«' + x.book + '»'); };
            $('.del', c).onclick = async function () {
                if (!confirm('این جمله حذف شود؟')) return;
                await patchData(x.pid, function (d) { d.__quotes = (d.__quotes || []).filter(function (q) { return q.id !== x.q.id; }); });
                quotesInto(pane, m);
            };
            host.appendChild(c);
        });
    }
    paint();
}
var NEXT_KEY = 'nbx-next';
function getNext() { return safeList(NEXT_KEY).filter(function (x) { return typeof x.t === 'string'; }); }
function setNext(l) { lsSet(NEXT_KEY, JSON.stringify(l)); }
function nextInto(pane, m) {
    var list = getNext();
    pane.innerHTML = '<div class="nbx-formbox"><input id="nbx-n-title" class="nbx-in" type="text" placeholder="نام کتاب (و نویسنده)"><input id="nbx-n-why" class="nbx-in" type="text" placeholder="چرا می‌خواهی بخوانیش؟ مثلاً: چون دوستم گفت"><div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-n-add">➕ به صف اضافه کن</button></div></div><div id="nbx-n-list" style="margin-top:10px"></div>';
    $('#nbx-n-add').onclick = function () {
        var t = $('#nbx-n-title').value.trim(); if (!t) { toast('نام کتاب را بنویس.'); return; }
        list.push({ id: uid(), t: t, w: $('#nbx-n-why').value.trim() }); setNext(list); nextInto(pane, m);
    };
    var host = $('#nbx-n-list');
    if (!list.length) host.innerHTML = '<div class="nbx-empty">صف خواندنت خالی است؛ کتاب‌هایی که می‌خواهی بخوانی را اینجا نگه دار.</div>';
    list.forEach(function (b, i) {
        var c = el('div', { 'class': 'nbx-book' });
        c.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">📖 ' + esc(b.t) + '</span></div>' + (b.w ? '<div class="nbx-muted" style="margin-top:4px">چون: ' + esc(b.w) + '</div>' : '') +
            '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-btn go">📖 شروعش کردم</button><button type="button" class="nbx-mini up" aria-label="بالا">↑</button><button type="button" class="nbx-mini down" aria-label="پایین">↓</button><button type="button" class="nbx-mini del" aria-label="حذف">🗑</button></div>';
        $('.up', c).onclick = function () { if (i > 0) { list.splice(i - 1, 0, list.splice(i, 1)[0]); setNext(list); nextInto(pane, m); } };
        $('.down', c).onclick = function () { if (i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); setNext(list); nextInto(pane, m); } };
        $('.del', c).onclick = function () { if (!confirm('از صف حذف شود؟')) return; list.splice(i, 1); setNext(list); nextInto(pane, m); };
        $('.go', c).onclick = async function () {
            list.splice(i, 1); setNext(list);
            var id = await LP.addBook(b.t); await setMeta({ status: 'reading' }, id);
            LP.open(id);
        };
        host.appendChild(c);
    });
}
async function compareInto(pane, m) {
    var projects = PM().getProjects();
    if (projects.length < 2) { pane.innerHTML = '<div class="nbx-empty">برای مقایسه حداقل دو کتاب لازم است.</div>'; return; }
    var a = activeId(), b = (projects.filter(function (p) { return p.id !== a; })[0] || projects[0]).id;
    var opts = function (sel) { return projects.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join(''); };
    pane.innerHTML = '<div class="nbx-row" style="gap:8px"><select id="nbx-c-a" style="flex:1">' + opts(a) + '</select><span>⚖️</span><select id="nbx-c-b" style="flex:1">' + opts(b) + '</select></div><div id="nbx-c-out" style="margin-top:12px"></div>';
    var ROWS = [['⭐ امتیاز و وضعیت', '__meta'], ['🧭 تجربهٔ کلی', 'read-score-main'], ['❤️ احساس این کتاب', 'read-memory-feeling'], ['👤 شخصیتی که یادت نمی‌رود', 'read-memory-character'],
        ['🎬 صحنهٔ ماندگار', 'read-memory-scene'], ['✍️ سبک روایت', 'read-style-detail'], ['💭 چیزی که بعد از پایان ماند', 'read-end-detail'], ['📚 بعدش چه بخوانم', 'read-archive-detail']];
    async function paint() {
        var ia = $('#nbx-c-a').value, ib = $('#nbx-c-b').value;
        var da = await getData(ia), db = await getData(ib), out = $('#nbx-c-out');
        function cell(d, key) {
            if (key === '__meta') {
                var mt = d.__meta || {}, r = mt.rating || 0, st = (BSTATUS.filter(function (s) { return s[0] === (mt.status || ''); })[0] || [0, ''])[1];
                return (r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '—') + (st && mt.status ? '<br><small>' + esc(st) + '</small>' : '');
            }
            var v = (d[key] || '').trim(); return v ? esc(v).replace(/\n/g, '<br>') : '<span class="nbx-muted">—</span>';
        }
        var na = projects.filter(function (p) { return p.id === ia; })[0].name, nb = projects.filter(function (p) { return p.id === ib; })[0].name;
        out.innerHTML = '<div class="nbx-cmp"><div class="nbx-cmp-h">«' + esc(na) + '»</div><div class="nbx-cmp-h">«' + esc(nb) + '»</div>' +
            ROWS.map(function (r) { return '<div class="nbx-cmp-l">' + esc(r[0]) + '</div><div class="nbx-cmp-c">' + cell(da, r[1]) + '</div><div class="nbx-cmp-c">' + cell(db, r[1]) + '</div>'; }).join('') + '</div>';
    }
    $('#nbx-c-a').onchange = paint; $('#nbx-c-b').onchange = paint; paint();
}
/* ======================================================================
   🛒 فهرست خرید + 🖋️ نویسندگان مورد علاقه (صفحهٔ کتابخانه)
   ====================================================================== */
var BUY_KEY = 'nbx-buy', AUTH_KEY = 'nbx-authors';
var BUY_PRI = [['1', '🔴 حتماً بخر'], ['2', '🟡 هر وقت که شد'], ['3', '🟢 شاید']];
function getBuy() { return safeList(BUY_KEY).filter(function (x) { return typeof x.t === 'string'; }); }
function setBuy(l) { lsSet(BUY_KEY, JSON.stringify(l)); }
function getAuth() { return safeList(AUTH_KEY).filter(function (x) { return typeof x.n === 'string'; }); }
function setAuth(l) { lsSet(AUTH_KEY, JSON.stringify(l)); }
function priceOf(b) { var n = parseInt(String(b.pr || '').replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; }
function money(n) { try { return n.toLocaleString('fa-IR'); } catch (e) { return String(n); } }
function buyInto(pane, m) {
    var list = getBuy();
    var priOpts = BUY_PRI.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === '2' ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    pane.innerHTML = '<div class="nbx-formbox"><input id="nbx-b-title" class="nbx-in" type="text" placeholder="نام کتاب"><input id="nbx-b-auth" class="nbx-in" type="text" placeholder="نویسنده (اختیاری)">' +
        '<div class="nbx-row"><select id="nbx-b-pri" aria-label="اولویت">' + priOpts + '</select><input id="nbx-b-price" class="nbx-in" type="text" inputmode="numeric" placeholder="قیمت تقریبی به تومان (اختیاری)" style="flex:1;min-width:150px"></div>' +
        '<input id="nbx-b-why" class="nbx-in" type="text" placeholder="چرا می‌خواهی بخریش؟ (اختیاری)">' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-b-add">➕ به فهرست خرید</button></div></div><p class="nbx-muted" id="nbx-b-sum" style="margin:10px 0 0"></p><div id="nbx-b-list" style="margin-top:6px"></div>';
    $('#nbx-b-add').onclick = function () {
        var t = $('#nbx-b-title').value.trim(); if (!t) { toast('نام کتاب را بنویس.'); return; }
        list.push({ id: uid(), t: t, a: $('#nbx-b-auth').value.trim(), p: $('#nbx-b-pri').value, pr: $('#nbx-b-price').value.trim(), w: $('#nbx-b-why').value.trim() });
        setBuy(list); buyInto(pane, m);
    };
    var host = $('#nbx-b-list');
    if (!list.length) { host.innerHTML = '<div class="nbx-empty">فهرست خریدت خالی است؛ کتاب‌هایی که می‌خواهی بخری را با اولویتشان اینجا بچین.</div>'; return; }
    var items = list.map(function (b, i) { return { b: b, i: i }; }).sort(function (x, y) { return (x.b.p - y.b.p) || (x.i - y.i); });
    var total = 0, must = 0;
    items.forEach(function (x) { var v = priceOf(x.b); total += v; if (x.b.p === '1') must += v; });
    $('#nbx-b-sum').textContent = fa(list.length) + ' کتاب' + (total ? ' · جمع تقریبی ' + money(total) + ' تومان' + (must && must !== total ? ' (فقط «حتماً»: ' + money(must) + ')' : '') : '');
    items.forEach(function (x) {
        var b = x.b, c = el('div', { 'class': 'nbx-book' });
        var po = BUY_PRI.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === b.p ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
        c.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">📕 ' + esc(b.t) + '</span></div>' +
            (b.a ? '<div class="nbx-muted">✍️ ' + esc(b.a) + '</div>' : '') + (b.w ? '<div class="nbx-muted" style="margin-top:2px">چون: ' + esc(b.w) + '</div>' : '') + (priceOf(b) ? '<div class="nbx-muted">💰 ' + money(priceOf(b)) + ' تومان</div>' : '') +
            '<div class="nbx-row" style="margin-top:8px"><select class="pri" aria-label="اولویت">' + po + '</select><button type="button" class="nbx-btn go">✅ خریدم</button><button type="button" class="nbx-mini del" aria-label="حذف">🗑</button></div>';
        $('.pri', c).onchange = function (e) { b.p = e.target.value; setBuy(list); buyInto(pane, m); };
        $('.del', c).onclick = function () { if (!confirm('از فهرست خرید حذف شود؟')) return; list.splice(list.indexOf(b), 1); setBuy(list); buyInto(pane, m); };
        $('.go', c).onclick = async function () {
            list.splice(list.indexOf(b), 1); setBuy(list);
            var id = await LP.addBook(b.t + (b.a ? ' — ' + b.a : '')); await setMeta({ status: 'want' }, id);
            toast('به قفسهٔ کتاب‌هایت اضافه شد ✓'); buyInto(pane, m);
        };
        host.appendChild(c);
    });
}
async function authorsInto(pane, m) {
    var list = getAuth(), rows = [];
    try { rows = await loadRows(); } catch (e) {}
    pane.innerHTML = '<div class="nbx-formbox"><input id="nbx-a-name" class="nbx-in" type="text" placeholder="نام نویسنده"><div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-a-add">➕ به نویسنده‌های مورد علاقه</button></div></div><div id="nbx-a-list" style="margin-top:10px"></div>';
    function add() {
        var n = $('#nbx-a-name').value.trim(); if (!n) { toast('نام نویسنده را بنویس.'); return; }
        list.push({ id: uid(), n: n, w: '', f: '' }); setAuth(list); authorsInto(pane, m);
    }
    $('#nbx-a-add').onclick = add;
    $('#nbx-a-name').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    var host = $('#nbx-a-list');
    if (!list.length) { host.innerHTML = '<div class="nbx-empty">هنوز نویسنده‌ای ثبت نکرده‌ای. نویسنده‌هایی که دنبالشان می‌کنی را اینجا نگه دار.</div>'; return; }
    list.forEach(function (a) {
        var cnt = rows.filter(function (r) { return r.name.indexOf(a.n) > -1; }).length;
        var c = el('div', { 'class': 'nbx-book' });
        c.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">🖋️ ' + esc(a.n) + '</span></div>' +
            (cnt ? '<div class="nbx-muted">📚 ' + fa(cnt) + ' کتاب در قفسه‌ات نامش را دارد</div>' : '') +
            '<input class="nbx-in au-w" type="text" placeholder="چرا دوستش دارم؟" aria-label="چرا دوستش دارم" value="' + esc(a.w || '') + '" style="margin-top:6px">' +
            '<input class="nbx-in au-f" type="text" placeholder="کتاب‌هایی از او که دوست دارم یا می‌خواهم بخوانم" aria-label="کتاب‌های محبوب" value="' + esc(a.f || '') + '" style="margin-top:6px">' +
            '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-btn au-buy">🛒 کتابی از او به فهرست خرید</button><button type="button" class="nbx-mini del" aria-label="حذف">🗑</button></div>';
        $('.au-w', c).oninput = function (e) { a.w = e.target.value; setAuth(list); };
        $('.au-f', c).oninput = function (e) { a.f = e.target.value; setAuth(list); };
        $('.au-buy', c).onclick = function () {
            var t = prompt('نام کتابی از «' + a.n + '» که می‌خواهی بخری؟'); if (!t || !t.trim()) return;
            var bl = getBuy(); bl.push({ id: uid(), t: t.trim(), a: a.n, p: '2', pr: '', w: '' }); setBuy(bl); toast('به فهرست خرید اضافه شد ✓');
        };
        $('.del', c).onclick = function () { if (!confirm('«' + a.n + '» از فهرست حذف شود؟')) return; list.splice(list.indexOf(a), 1); setAuth(list); authorsInto(pane, m); };
        host.appendChild(c);
    });
}
/* ======================================================================
   🖨️ خروجی PDF برای «کتابخانهٔ من» و «آثار من»
   ====================================================================== */
var PDF_ORDER_W = ['done', 'revising', 'writing', 'idea', 'dropped', ''];
var PDF_ORDER_L = ['done', 'reading', 'want', 'dropped', ''];
function pdfStatusLabel(v) {
    var f = BSTATUS.filter(function (x) { return x[0] === (v || ''); })[0];
    return (f && f[0]) ? f[1] : 'بدون وضعیت';
}
function pdfStars(r) { return r > 0 ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''; }
function pdfGroup(rows, order) {
    var out = [];
    order.forEach(function (st) {
        var g = rows.filter(function (r) { var v = r.meta.status || ''; return (order.indexOf(v) > -1 ? v : '') === st; });
        if (!g.length) return;
        if (st === 'done') g.sort(function (a, b) { return (b.meta.finished || '').localeCompare(a.meta.finished || ''); });
        out.push({ head: pdfStatusLabel(st) + ' (' + fa(g.length) + ')' });
        g.forEach(function (r) { out.push({ r: r }); });
    });
    return out;
}
async function collectListPdf() {
    var secs = [], stats = [], rows, s;
    if (isWorks) {
        rows = await loadWorkRows(); s = libSummary(rows);
        var gname = {}; GENRES_W.forEach(function (g) { gname[g.id] = g.icon + ' ' + g.name; });
        stats = [fa(s.total) + ' اثر', fa(s.done) + ' تمام‌شده', fa(s.writing + s.revising) + ' در حال نوشتن و بازنویسی', fa(s.idea) + ' ایده'];
        secs.push({ id: 'works', title: '📚 آثار من', color: PALETTE[1], count: rows.length, unit: 'اثر',
            lines: pdfGroup(rows, PDF_ORDER_W).map(function (x) {
                if (x.head) return { head: x.head };
                var r = x.r, m = r.meta || {};
                var gs = (m.genres || []).map(function (g) { return gname[g]; }).filter(Boolean).join(' · ');
                var sub = [gs, m.finished ? 'تمام‌شده در ' + persianDate(m.finished) : ''].filter(Boolean).join(' · ');
                return { t: r.name, sub: sub, notes: [r.ext ? r.note : m.summary] };
            }) });
        var ideas = getIdeas();
        secs.push({ id: 'ideas', title: '💡 بایگانی ایده‌ها', color: PALETTE[2], count: ideas.length, unit: 'ایده',
            cards: ideas.map(function (i) { return { title: (i.t || '').trim() || 'بدون عنوان', items: [{ label: persianDate(i.d) || 'ایده', value: (i.x || '').trim() || '—' }] }; }) });
        return { name: 'آثار من', kind: '✍️ دفترچه نویسندگی', stats: stats, secs: secs };
    }
    rows = await loadRows(); s = libSummary(rows);
    stats = [fa(s.total) + ' کتاب', fa(s.done) + ' تمام‌شده', fa(s.thisYear) + ' کتاب در سال ' + s.yr, fa(s.reading) + ' در حال خواندن', fa(s.want) + ' در صف'];
    if (s.avg) stats.push('میانگین امتیاز ' + fa(s.avg.toFixed(1)));
    secs.push({ id: 'list', title: '📚 قفسهٔ کتاب‌ها', color: PALETTE[1], count: rows.length, unit: 'کتاب',
        lines: pdfGroup(rows, PDF_ORDER_L).map(function (x) {
            if (x.head) return { head: x.head };
            var m = x.r.meta || {};
            return { t: x.r.name, sub: [pdfStars(m.rating), m.finished ? 'تمام‌شده در ' + persianDate(m.finished) : ''].filter(Boolean).join(' · '), notes: [] };
        }) });
    var projects = PM().getProjects(), qCards = [], qn = 0;
    for (var i = 0; i < projects.length; i++) {
        if (!projects[i] || !projects[i].id) continue;
        var d = await getData(projects[i].id), qs = (d.__quotes || []).filter(function (q) { return q && typeof q.t === 'string' && q.t.trim(); });
        if (!qs.length) continue;
        qn += qs.length;
        qCards.push({ title: '«' + projects[i].name + '»', items: qs.map(function (q) { return { label: q.p ? 'صفحهٔ ' + q.p : 'جمله', value: q.t.trim() }; }) });
    }
    secs.push({ id: 'quotes', title: '✨ جمله‌های ماندگار', color: PALETTE[2], count: qn, unit: 'جمله', cards: qCards });
    var nx = getNext();
    secs.push({ id: 'next', title: '🔖 صف خواندن', color: PALETTE[3], count: nx.length, unit: 'کتاب',
        lines: nx.map(function (b, k) { return { t: fa(k + 1) + '. ' + b.t, sub: '', notes: [b.w ? 'چون: ' + b.w : ''] }; }) });
    var by = getBuy(), bl = [], sum = 0;
    BUY_PRI.forEach(function (pr) {
        var g = by.filter(function (b) { return (BUY_PRI.some(function (o) { return o[0] === b.p; }) ? b.p : '2') === pr[0]; });
        if (!g.length) return;
        bl.push({ head: pr[1] + ' (' + fa(g.length) + ')' });
        g.forEach(function (b) { var pc = priceOf(b); sum += pc; bl.push({ t: b.t + (b.a ? ' — ' + b.a : ''), sub: pc ? money(pc) + ' تومان' : '', notes: [b.w ? 'چرا: ' + b.w : ''] }); });
    });
    secs.push({ id: 'buy', title: '🛒 فهرست خرید', color: PALETTE[4], count: by.length, unit: 'کتاب', lines: bl, foot: sum ? 'جمع قیمت‌های واردشده: ' + money(sum) + ' تومان' : '' });
    var au = getAuth();
    secs.push({ id: 'authors', title: '🖋️ نویسنده‌های مورد علاقه‌ام', color: PALETTE[5], count: au.length, unit: 'نویسنده',
        lines: au.map(function (a) { return { t: a.n, sub: '', notes: [a.w ? 'چرا دوستش دارم: ' + a.w : '', a.f ? 'کتاب‌های محبوب: ' + a.f : ''] }; }) });
    return { name: 'کتابخانهٔ من', kind: '📖 دفترچه کتاب‌خوان', stats: stats, secs: secs };
}
function buildListPdfHtml(data, ids, mono) {
    var secs = data.secs.filter(function (x) { return ids.indexOf(x.id) > -1 && x.count > 0; });
    var date = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    var ink = mono ? '#222' : '';
    var out = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>' + esc(data.name) + '</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"><style>' +
        '@page{size:A4;margin:18mm 15mm 20mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        'body{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;color:#2a2230;line-height:2;margin:0;padding:18px;font-size:14px;background:#fff}' +
        '.bar{text-align:center;margin-bottom:20px}.bar button{background:#5b21b6;color:#fff;border:0;padding:10px 24px;border-radius:10px;font:700 14px Vazirmatn,Tahoma;cursor:pointer;margin:0 4px}' +
        '.cover{text-align:center;padding:34px 16px 26px;margin-bottom:26px;border-radius:16px;background:linear-gradient(160deg,' + (mono ? '#f2f2f2,#e6e6e6' : '#fde6ee,#e5eefb') + ');border:2px solid ' + (mono ? '#999' : '#e9c9d6') + '}' +
        '.cover .k{font-size:15px;color:#6b5a70}.cover h1{margin:6px 0 10px;font-size:30px;color:' + (ink || '#4c1d95') + '}.cover .m{font-size:13px;color:#6b5a70}' +
        '.stats{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0 4px}.stats span{padding:2px 12px;border-radius:99px;font-size:12.5px;background:' + (mono ? '#fff' : 'rgba(255,255,255,.75)') + ';border:1px solid ' + (mono ? '#aaa' : '#e3c6d4') + '}' +
        '.toc{margin:16px auto 0;max-width:420px;text-align:right;font-size:13px}.toc div{display:flex;justify-content:space-between;border-bottom:1px dotted #bbb;padding:2px 0}' +
        '.sec{margin-top:26px}.sec>h2{margin:0 0 12px;padding:8px 16px;font-size:20px;border-radius:10px;break-after:avoid;color:#2a2230;border-right:8px solid var(--c)}' +
        '.sec>h2{background:' + (mono ? '#eee' : 'color-mix(in srgb,var(--c) 22%,#fff)') + '}' +
        '.card{break-inside:avoid-page}.card>h3{margin:18px 0 8px;font-size:16px;color:' + (ink || 'color-mix(in srgb,var(--c) 55%,#2a2230)') + ';break-after:avoid}' +
        '.it{margin:0 0 12px;padding:10px 14px;border-right:4px solid ' + (mono ? '#888' : 'var(--c)') + ';border-radius:8px;background:' + (mono ? '#f6f6f6' : 'color-mix(in srgb,var(--c) 8%,#fff)') + '}' +
        '.lb{font-weight:700;font-size:13px;color:' + (ink || 'color-mix(in srgb,var(--c) 55%,#2a2230)') + ';margin-bottom:2px;break-after:avoid}' +
        '.vl{overflow-wrap:anywhere;word-break:break-word}' +
        '.gh{margin:14px 0 6px;font-weight:700;font-size:13px;color:#6b5a70;border-bottom:1px dashed #bbb;break-after:avoid}' +
        '.sc{margin:0 0 8px;padding:6px 14px;border-radius:8px;border-right:4px solid var(--c);break-inside:avoid;overflow-wrap:anywhere;background:' + (mono ? '#f6f6f6' : 'color-mix(in srgb,var(--c) 8%,#fff)') + '}' +
        '.sc small{color:#6b5a70;font-weight:400}.sc .nt{font-size:13px;color:#4a3d50}.sc b{font-weight:700}' +
        '.fo{margin-top:8px;font-weight:700;font-size:13px;text-align:left;color:#6b5a70}' +
        '.ft{position:fixed;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:#888}' +
        '@media print{.bar{display:none!important}body{padding:0}}</style></head><body>' +
        '<div class="bar"><button onclick="window.print()">🖨️ چاپ / ذخیره PDF</button><button onclick="window.close()" style="background:#888">✕ بستن</button></div>' +
        '<div class="cover"><div class="k">' + esc(data.kind) + '</div><h1>' + esc(data.name) + '</h1><div class="m">' + esc(date) + '</div>' +
        '<div class="stats">' + data.stats.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="toc">' + secs.map(function (x) { return '<div><span>' + esc(x.title) + '</span><span>' + fa(x.count) + ' ' + esc(x.unit) + '</span></div>'; }).join('') + '</div></div>';
    secs.forEach(function (x) {
        out += '<div class="sec" style="--c:' + (mono ? '#666' : x.color) + '"><h2>' + esc(x.title) + '</h2>';
        (x.lines || []).forEach(function (l) {
            if (l.head) { out += '<div class="gh">' + esc(l.head) + '</div>'; return; }
            out += '<div class="sc"><b>' + esc(l.t) + '</b>' + (l.sub ? ' <small>· ' + esc(l.sub) + '</small>' : '') +
                (l.notes || []).filter(function (n) { return n && String(n).trim(); }).map(function (n) { return '<div class="nt">' + h(String(n).trim()) + '</div>'; }).join('') + '</div>';
        });
        (x.cards || []).forEach(function (c) {
            out += '<div class="card"><h3>' + esc(c.title) + '</h3>';
            c.items.forEach(function (it) { out += '<div class="it"><div class="lb">' + esc(it.label) + '</div><div class="vl">' + h(it.value) + '</div></div>'; });
            out += '</div>';
        });
        if (x.foot) out += '<div class="fo">' + esc(x.foot) + '</div>';
        out += '</div>';
    });
    if (!secs.length) out += '<p style="text-align:center;color:#888">بخش انتخاب‌شده هنوز چیزی ندارد.</p>';
    out += '<div class="ft">' + esc(data.kind) + ' · ' + esc(data.name) + '</div></body></html>';
    return out;
}
async function openListPdfPicker() {
    var btn = $('#nbx-pdf-btn'); if (btn) btn.disabled = true;
    var data;
    try { data = await collectListPdf(); }
    catch (e) { try { console.error(e); } catch (_) {} toast('⚠️ آماده‌سازی PDF انجام نشد؛ صفحه را تازه کن و دوباره امتحان کن.'); if (btn) btn.disabled = false; return; }
    if (btn) btn.disabled = false;
    var body = el('div', { 'class': 'nbx-mbody' });
    body.innerHTML = '<p class="nbx-muted" style="margin:0">بخش‌هایی را که می‌خواهی در PDF باشند علامت بزن. بخش‌های خالی چاپ نمی‌شوند.</p>' +
        '<div class="nbx-row" style="margin:10px 0"><button type="button" class="nbx-btn" id="nbx-p-all">انتخاب همه</button><button type="button" class="nbx-btn" id="nbx-p-none">هیچ‌کدام</button><button type="button" class="nbx-btn" id="nbx-p-filled">فقط پرشده‌ها</button></div>' +
        '<div class="nbx-pick" id="nbx-p-list">' + data.secs.map(function (x) {
            return '<label><input type="checkbox" value="' + esc(x.id) + '"' + (x.count ? ' checked' : '') + '> ' + esc(x.title) + '<small>' + (x.count ? fa(x.count) + ' ' + esc(x.unit) : 'خالی') + '</small></label>';
        }).join('') + '</div>' +
        '<label class="nbx-row" style="gap:8px;margin:8px 0"><input type="checkbox" id="nbx-p-mono" style="width:20px;height:20px"> <span>نسخهٔ ساده و کم‌رنگ (مناسب پرینتر سیاه‌وسفید)</span></label>' +
        '<div class="nbx-row" style="margin-top:10px"><button type="button" class="nbx-btn primary" id="nbx-p-go">🖨️ ساخت PDF</button></div>';
    var m = openModal('🖨️ خروجی PDF', body);
    var boxes = $$('#nbx-p-list input');
    $('#nbx-p-all').onclick = function () { boxes.forEach(function (b) { b.checked = true; }); };
    $('#nbx-p-none').onclick = function () { boxes.forEach(function (b) { b.checked = false; }); };
    $('#nbx-p-filled').onclick = function () { boxes.forEach(function (b, i) { b.checked = data.secs[i].count > 0; }); };
    $('#nbx-p-go').onclick = function () {
        var ids = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        if (!ids.length) { toast('حداقل یک بخش را انتخاب کن.'); return; }
        var w = window.open('', '_blank');
        if (!w) { toast('مرورگر اجازهٔ باز شدن پنجرهٔ جدید را نداد.'); return; }
        w.document.open(); w.document.write(buildListPdfHtml(data, ids, $('#nbx-p-mono').checked)); w.document.close();
        m.close();
        w.onload = function () { w.focus(); setTimeout(function () { try { w.print(); } catch (e) {} }, 600); };
    };
}
/* ======================================================================
   💾 پشتیبان‌گیری و بازیابی کل صفحه (کتابخانهٔ من / آثار من)
   ====================================================================== */
var BK_APP = isWorks ? 'nvsdg-works' : 'reader-library';
function bkKeys() { return isWorks ? [EXT_KEY, IDEA_KEY] : [NEXT_KEY, BUY_KEY, AUTH_KEY]; }
function bkCss() {
    if ($('#nbx-css-bk')) return;
    document.head.appendChild(el('style', { id: 'nbx-css-bk' }, [
        '.nbx-bkwrap{margin-bottom:12px}',
        'html body .nbx-bk-more.nbx-btn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 16px;border-radius:12px;background:var(--accd,#6b4a1e);color:#fff;border:2px solid var(--accd,#6b4a1e);font-size:.95rem;box-shadow:0 3px 0 rgba(0,0,0,.25),0 4px 10px rgba(0,0,0,.15);-webkit-tap-highlight-color:transparent}',
        '.nbx-bk-more:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25)}',
        '.nbx-bk-more .nbx-bk-ch{display:inline-block;transition:transform .2s}.nbx-bk-more[aria-expanded="true"] .nbx-bk-ch{transform:rotate(180deg)}',
        'html.nb-dark body .nbx-bk-more.nbx-btn{background:#e3c26d;color:#1c1712;border-color:#e3c26d}',
        '.nbx-bk-panel{display:none;flex-wrap:wrap;gap:8px;padding-top:8px}.nbx-bk-panel.open{display:flex}',
        '.nbx-bk-panel .nbx-btn{flex:1 1 calc(50% - 8px);text-align:center}'
    ].join('\n')));
}
function backupBarHtml() {
    bkCss();
    return '<div class="nbx-bkwrap">' +
        '<button type="button" class="nbx-btn nbx-bk-more" id="nbx-bk-more" aria-expanded="false" aria-controls="nbx-bk-panel" title="بک‌آپ، بارگذاری و خروجی PDF">' +
            '<span aria-hidden="true">⚙️</span><span>' + (isWorks ? 'مدیریت پروژه' : 'مدیریت کتاب') + '</span><span class="nbx-bk-ch" aria-hidden="true">▾</span></button>' +
        '<div class="nbx-bk-panel nbx-bkbar" id="nbx-bk-panel">' +
            '<button type="button" class="nbx-btn" id="nbx-bk-save" title="همهٔ ' + (isWorks ? 'آثار، خلاصه‌ها و بایگانی ایده‌ها' : 'کتاب‌ها، جمله‌ها، صف خواندن، فهرست خرید و نویسنده‌ها') + ' را در یک فایل ذخیره کن تا بعداً بتوانی ادامه بدهی">💾 بک‌آپ پروژه (برای ادامه‌ی ویرایش بعداً)</button>' +
            '<button type="button" class="nbx-btn" id="nbx-bk-load" title="یک فایل بک‌آپ را بارگذاری کن">📂 بارگذاری بک‌آپ</button>' +
            '<button type="button" class="nbx-btn" id="nbx-pdf-btn" title="' + (isWorks ? 'آثار و ایده‌هایت را' : 'کتابخانه، جمله‌ها، صف خواندن و فهرست خرید را') + ' به‌صورت PDF بگیر">🖨️ خروجی PDF</button>' +
        '</div>' +
        '<input type="file" id="nbx-bk-file" accept="application/json,.json" style="display:none"></div>';
}
function bkAsk(msg) { return (typeof window.nbConfirm === 'function') ? window.nbConfirm(msg, true) : Promise.resolve(confirm(msg)); }
async function fullBackup() {
    try {
        var projects = PM().getProjects(), out = [];
        for (var i = 0; i < projects.length; i++) {
            if (!projects[i] || !projects[i].id) continue;
            out.push({ id: projects[i].id, name: projects[i].name, data: await getData(projects[i].id) });
        }
        var ls = {}; bkKeys().forEach(function (k) { var v = lsGet(k, null); if (v != null) ls[k] = v; });
        var payload = { app: BK_APP, kind: 'full', exportedAt: new Date().toISOString(), projects: out, ls: ls };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = (isWorks ? 'works' : 'library') + '-backup-' + dateKey() + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast('فایل پشتیبان ذخیره شد ✓'); nudgeMarkBackup();
    } catch (e) { try { console.error(e); } catch (_) {} toast('⚠️ پشتیبان‌گیری انجام نشد.'); }
}
async function fullRestore(file) {
    if (!file) return;
    try {
        var payload = JSON.parse(await file.text()), projs = [], lists = {};
        if (payload && payload.app === BK_APP && Array.isArray(payload.projects)) { projs = payload.projects; lists = payload.ls || {}; }
        else if (payload && payload.app === NS && payload.data && typeof payload.data === 'object') { projs = [{ id: uid(), name: payload.name || 'کتاب بازیابی‌شده', data: payload.data }]; }
        else { toast('فایل پشتیبان معتبر نیست یا مال بخش دیگری است.'); return; }
        projs = projs.filter(function (x) { return x && typeof x.id === 'string' && x.id && x.data && typeof x.data === 'object'; });
        var ok = await bkAsk('محتوای فایل با اطلاعات فعلی ادغام می‌شود؛ چیزی حذف نمی‌شود. مواردی که هم در فایل و هم الان هستند با نسخهٔ فایل جایگزین می‌شوند. ادامه بدهم؟');
        if (!ok) return;
        var list = LP.list(), nProj = 0, nItems = 0;
        for (var i = 0; i < projs.length; i++) {
            var x = projs[i], idx = -1;
            list.forEach(function (q, k) { if (q && q.id === x.id) idx = k; });
            if (idx > -1) list[idx] = { id: x.id, name: x.name || list[idx].name }; else list.push({ id: x.id, name: x.name || 'بدون نام' });
            await setData(x.id, x.data); nProj++;
        }
        lsSet(NS + '-projects', JSON.stringify(list));
        bkKeys().forEach(function (k) {
            if (typeof lists[k] !== 'string') return;
            var bk; try { bk = JSON.parse(lists[k]); } catch (e) { return; }
            if (!Array.isArray(bk)) return;
            var cur = safeList(k), map = {}, order = [];
            function keyOf(it) { return (it && typeof it.id === 'string' && it.id) ? it.id : JSON.stringify(it); }
            cur.forEach(function (it) { var kk = keyOf(it); if (!(kk in map)) order.push(kk); map[kk] = it; });
            bk.forEach(function (it) { if (!it || typeof it !== 'object' || Array.isArray(it)) return; var kk = keyOf(it); if (!(kk in map)) order.push(kk); map[kk] = it; nItems++; });
            strictSave(k, order.map(function (kk) { return map[kk]; }));
        });
        toast('بازیابی شد ✓ (' + fa(nProj) + ' ' + (isWorks ? 'دفترچه' : 'کتاب') + (nItems ? ' و ' + fa(nItems) + ' مورد دیگر' : '') + ')');
        setTimeout(function () { location.reload(); }, 900);
    } catch (e) { try { console.error(e); } catch (_) {} toast('خطا در خواندن فایل پشتیبان. فایل درستی انتخاب کن.'); }
}
function wireBackupBar() {
    var sv = $('#nbx-bk-save'), ld = $('#nbx-bk-load'), fi = $('#nbx-bk-file'); if (!sv || !ld || !fi) return;
    var more = $('#nbx-bk-more'), panel = $('#nbx-bk-panel');
    function setOpen(o) { if (!panel || !more) return; panel.classList.toggle('open', o); more.setAttribute('aria-expanded', String(o)); }
    if (more) more.onclick = function () { setOpen(!panel.classList.contains('open')); };
    if (panel) panel.addEventListener('click', function (e) { if (e.target.closest('button')) setTimeout(function () { setOpen(false); }, 60); });
    sv.onclick = fullBackup;
    var pb = $('#nbx-pdf-btn'); if (pb) pb.onclick = openListPdfPicker;
    ld.onclick = function () { fi.click(); };
    fi.onchange = function () { var f = fi.files && fi.files[0]; fi.value = ''; fullRestore(f); };
}
function buildLibraryPage() {
    var host = $('#lib-root'); if (!host) return;
    host.innerHTML = backupBarHtml() + '<div id="lib-stats"></div><div class="nbx-seg" id="lib-seg" role="tablist" aria-label="بخش‌های کتابخانه"></div><div class="nbx-mbody lib-pane" id="lib-pane"></div>';
    wireBackupBar(); var seg = $('#lib-seg'), pane = $('#lib-pane');
    var tabs = [['list', '📚 قفسهٔ کتاب‌ها', bookListInto], ['quotes', '✨ جمله‌های ماندگار', quotesInto], ['next', '🔖 صف خواندن', nextInto], ['buy', '🛒 فهرست خرید', buyInto], ['authors', '🖋️ نویسنده‌های مورد علاقه‌ام', authorsInto], ['compare', '⚖️ مقایسه', compareInto]];
    function show(id) {
        if (!tabs.some(function (t) { return t[0] === id; })) id = 'list';
        $$('button', seg).forEach(function (b) { var on = b.getAttribute('data-id') === id; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-selected', String(on)); });
        pane.innerHTML = ''; tabs.filter(function (t) { return t[0] === id; })[0][2](pane, null);
        try { history.replaceState(null, '', '#' + id); } catch (e) {}
    }
    tabs.forEach(function (t) { var b = el('button', { 'class': 'nbx-chip', type: 'button', role: 'tab', 'data-id': t[0] }, t[1]); b.onclick = function () { show(t[0]); }; seg.appendChild(b); });
    window.addEventListener('hashchange', function () { show(location.hash.replace('#', '')); });
    loadRows().then(function (rows) { var sh = $('#lib-stats'); if (sh) sh.innerHTML = statsHtml(libSummary(rows)); });
    show(location.hash.replace('#', '') || 'list');
}



/* نوار نشان‌دهندهٔ اسکرول تب‌ها (موبایل و لپ‌تاپ) */
function buildNavHint() {
    var nav = $('nav'); if (!nav || $('.nbx-navbar')) return;
    var bar = el('div', { 'class': 'nbx-navbar', 'aria-hidden': 'true' }, '<span class="nbx-navhint">👈 تب‌های بیشتر؛ بکش</span><div class="nbx-navtrack"><div class="nbx-navthumb"></div></div>');
    nav.parentNode.insertBefore(bar, nav.nextSibling);
    var th = $('.nbx-navthumb', bar);
    function upd() {
        var max = nav.scrollWidth - nav.clientWidth;
        if (max < 8) { bar.classList.remove('on'); return; }
        bar.classList.add('on');
        var w = Math.max(18, nav.clientWidth / nav.scrollWidth * 100), pos = Math.min(1, Math.abs(nav.scrollLeft) / max);
        th.style.width = w + '%'; th.style.right = (pos * (100 - w)) + '%';
        if (pos > 0.03) bar.classList.add('done');
    }
    nav.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd(); setTimeout(upd, 800); setTimeout(upd, 2200);
}

/* ======================================================================
   ✍️ آثار من (صفحهٔ نویسنده): شمارش و وضعیت کتاب‌هایی که نوشته
   ====================================================================== */
var EXT_KEY = 'nbx-works-ext', IDEA_KEY = 'nbx-ideas';
/* خواندن امن: داده‌ی خراب یا ناقص هیچ‌وقت صفحه را از کار نمی‌اندازد */
function safeList(key) {
    var raw; try { raw = JSON.parse(lsGet(key, '[]')); } catch (e) { return []; }
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); }).map(function (x) { if (typeof x.id !== 'string' || !x.id) x.id = uid(); return x; });
}
var lastSaveWarn = 0;
function strictSave(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); return true; }
    catch (e) { var n = Date.now(); if (n - lastSaveWarn > 4000) { lastSaveWarn = n; toast('⚠️ ذخیره نشد؛ حافظهٔ مرورگر پر است یا ذخیره‌سازی بسته است.'); } return false; }
}
function getExt() { return safeList(EXT_KEY).filter(function (x) { return typeof x.t === 'string' && x.t.trim(); }); }
function setExt(l) { return strictSave(EXT_KEY, l); }
function getIdeas() { return safeList(IDEA_KEY); }
function setIdeas(l) { return strictSave(IDEA_KEY, l); }
function extStatusSelect(v) { return '<select class="nbx-st" aria-label="وضعیت اثر">' + BSTATUS.slice(1).map(function (s) { return '<option value="' + s[0] + '"' + (v === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>'; }
function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, 90) + 'px'; }
async function loadWorkRows() {
    var rows = await loadRows();
    getExt().forEach(function (x) { rows.push({ id: x.id, name: x.t, meta: { status: x.s || 'done', finished: x.fin || '' }, ext: true, note: x.n || '' }); });
    return rows;
}
async function worksListInto(body) {
    var filter = 'all', q = '', rows = [], gname = {};
    GENRES_W.forEach(function (g) { gname[g.id] = g.icon + ' ' + g.name; });
    body.innerHTML = '<div class="nbx-formbox nbx-addbook"><label class="nbx-muted" for="nbx-bl-new">✍️ ثبت اثر تازه؛ اسم، خلاصه و جایگاهش در آرشیو را خودت انتخاب کن</label>' +
        '<input class="nbx-in" id="nbx-bl-new" type="text" placeholder="نام اثر (کتاب یا داستان)" style="width:100%;margin-top:6px">' +
        '<textarea class="nbx-in" id="nbx-bl-sum" placeholder="خلاصهٔ اثر؛ دربارهٔ چیست؟ (اختیاری)" rows="3" style="width:100%;min-height:80px;margin-top:8px"></textarea>' +
        '<div class="nbx-row" style="margin-top:8px"><select id="nbx-ex-st" aria-label="آرشیو؛ وضعیت اثر">' + BSTATUS.slice(1).map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === 'writing' ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>' +
        '<input class="nbx-in" id="nbx-ex-fin" type="date" aria-label="تاریخ اتمام (اختیاری)" title="تاریخ اتمام (اختیاری)" style="max-width:170px"></div>' +
        '<label class="nbx-muted" style="display:flex;align-items:center;gap:6px;margin-top:8px;cursor:pointer"><input type="checkbox" id="nbx-bl-nb"> 📓 برای این اثر دفترچهٔ نویسندگی هم ساخته شود</label>' +
        '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-btn primary" id="nbx-ex-add">➕ ثبت اثر</button></div></div>' +
        '<div class="nbx-row" style="margin:6px 0 4px"><input class="nbx-in" id="nbx-bl-q" type="search" placeholder="🔍 جستجو بین آثار" aria-label="جستجو بین آثار" style="flex:1;min-width:150px;max-width:280px"></div><div id="nbx-bl-list"></div>';
    $('#nbx-bl-q').oninput = function (e) { q = e.target.value.trim(); paint(); };
    async function addWork() {
        var inp = $('#nbx-bl-new'), name = inp.value.trim();
        if (!name) { toast('نام اثر را بنویس.'); return; }
        var st = $('#nbx-ex-st').value, sum = $('#nbx-bl-sum').value.trim(), fin = st === 'done' ? $('#nbx-ex-fin').value : '';
        if (st === 'done' && !fin) fin = dateKey();
        if ($('#nbx-bl-nb').checked) {
            var id = await LP.addBook(name);
            await setMeta({ status: st, finished: fin, summary: sum }, id);
        } else {
            var l = getExt();
            l.push({ id: uid(), t: name, s: st, fin: fin, n: sum });
            if (!setExt(l)) return;
        }
        inp.value = ''; $('#nbx-bl-sum').value = ''; $('#nbx-ex-fin').value = ''; $('#nbx-bl-nb').checked = false;
        toast('اثر ثبت شد ✓'); reload();
    }
    function syncExDate() { var on = $('#nbx-ex-st').value === 'done', f = $('#nbx-ex-fin'); f.disabled = !on; f.style.opacity = on ? '1' : '.45'; if (!on) f.value = ''; }
    $('#nbx-ex-st').onchange = syncExDate; syncExDate();
    $('#nbx-ex-add').onclick = addWork;
    $('#nbx-bl-new').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addWork(); } };
    async function reload() {
        try { rows = await loadWorkRows(); paint(); }
        catch (err) { try { console.error(err); } catch (_) {} var h = $('#nbx-bl-list'); if (h) h.innerHTML = '<div class="nbx-empty">⚠️ خواندن آثار با مشکل روبه‌رو شد. صفحه را یک‌بار تازه کن؛ داده‌هایت پاک نشده است.</div>'; }
    }
    function paint() {
        var s = libSummary(rows), sh = $('#lib-stats'); if (sh) sh.innerHTML = statsHtml(s);
        if (sh) $$('[data-f]', sh).forEach(function (bx) {
            var f = bx.getAttribute('data-f'), on = filter === f;
            bx.setAttribute('aria-pressed', String(on)); if (on) bx.classList.add('on');
            function pick() { filter = (filter === f) ? 'all' : f; paint(); }
            bx.onclick = pick;
            bx.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
        });
        var list = rows.filter(function (r) { return (filter === 'all' || (r.meta.status || '') === filter) && (!q || r.name.toLowerCase().indexOf(q.toLowerCase()) > -1); });
        var host = $('#nbx-bl-list'); host.innerHTML = '';
        if (!rows.length) { host.innerHTML = '<div class="nbx-empty">هنوز اثری ثبت نکرده‌ای. اولین اثرت را بالا اضافه کن؛ می‌توانی آن را با دفترچهٔ خودش در «دفترچه نویسندگی» بسازی یا فقط اسمش را ثبت کنی.</div>'; return; }
        if (!list.length) { host.innerHTML = '<div class="nbx-empty">اثری با این فیلتر پیدا نشد.</div>'; return; }
        list.forEach(function (r) {
            var meta = r.meta, b = el('div', { 'class': 'nbx-book' });
            if (r.ext) {
                b.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">' + esc(r.name) + '</span><span class="nbx-muted">📎 خارج از دفترچه</span></div>' +
                    '<div class="nbx-book-foot">' + extStatusSelect(meta.status || 'done') +
                    (meta.status === 'done' ? '<label>پایان: <input type="date" class="nbx-fin" value="' + esc(meta.finished || '') + '"></label>' : '') +
                    '<button type="button" class="nbx-btn nbx-share">🖼️ کارت اثر</button><button type="button" class="nbx-mini del" style="margin-right:auto" aria-label="حذف اثر">🗑</button></div>' +
                    '<textarea class="nbx-in nbx-ext-note" placeholder="خلاصهٔ اثر (اختیاری)..." rows="2" style="margin-top:8px;width:100%;min-height:60px"></textarea>';
                var xl = $('.nbx-ext-note', b); xl.value = r.note || ''; setTimeout(function () { autoGrow(xl); }, 0);
                function patchExt(fn) { var l = getExt(), it = l.filter(function (z) { return z.id === r.id; })[0]; if (it) { fn(it); setExt(l); } }
                xl.oninput = function () { autoGrow(xl); patchExt(function (it) { it.n = xl.value; }); };
                $('.nbx-st', b).onchange = function (e) { var v = e.target.value; patchExt(function (it) { it.s = v; if (v === 'done' && !it.fin) it.fin = dateKey(); }); reload(); };
                var xf = $('.nbx-fin', b); if (xf) xf.onchange = function (e) { patchExt(function (it) { it.fin = e.target.value; }); reload(); };
                $('.nbx-share', b).onclick = function () { openShareCard('«' + r.name + '»', 'اثری که نوشتم'); };
                $('.del', b).onclick = function () { if (!confirm('«' + r.name + '» از فهرست آثار حذف شود؟')) return; setExt(getExt().filter(function (z) { return z.id !== r.id; })); reload(); };
                host.appendChild(b); return;
            }
            var gs = (meta.genres || []).map(function (g) { return gname[g]; }).filter(Boolean).join(' · ');
            b.innerHTML = '<div class="nbx-book-top"><span class="nbx-book-name">' + esc(r.name) + '</span></div>' +
                (gs ? '<div class="nbx-muted" style="margin-top:2px">' + esc(gs) + '</div>' : '') +
                '<div class="nbx-book-foot">' + statusSelect(meta.status || '') +
                (meta.status === 'done' ? '<label>پایان: <input type="date" class="nbx-fin" value="' + esc(meta.finished || '') + '"></label>' : '') +
                '<button type="button" class="nbx-btn nbx-share">🖼️ کارت اثر</button><button type="button" class="nbx-btn nbx-open" style="margin-right:auto">باز کردن دفترچه ←</button></div>' +
                (meta.finished ? '<div class="nbx-muted" style="margin-top:4px">تمام‌شده در ' + esc(persianDate(meta.finished)) + '</div>' : '') +
                '<textarea class="nbx-in nbx-ext-note" placeholder="خلاصهٔ اثر (اختیاری)..." rows="2" style="margin-top:8px;width:100%;min-height:60px"></textarea>';
            var sl = $('.nbx-ext-note', b); sl.value = meta.summary || ''; setTimeout(function () { autoGrow(sl); }, 0);
            var slT = 0; sl.oninput = function () { autoGrow(sl); clearTimeout(slT); slT = setTimeout(function () { setMeta({ summary: sl.value }, r.id); }, 400); };
            sl.onblur = function () { clearTimeout(slT); setMeta({ summary: sl.value }, r.id); };
            $('.nbx-st', b).onchange = async function (e) { await setMeta(applyStatusChange(meta, e.target.value), r.id); reload(); };
            var fin = $('.nbx-fin', b);
            if (fin) fin.onchange = async function (e) { await setMeta({ finished: e.target.value }, r.id); reload(); };
            $('.nbx-share', b).onclick = function () { openShareCard('«' + r.name + '»', 'اثری که نوشتم'); };
            $('.nbx-open', b).onclick = function () { LP.open(r.id); };
            host.appendChild(b);
        });
    }
    reload();
}
function ideasInto(pane) {
    var q = '';
    pane.innerHTML = '<div class="nbx-formbox"><label class="nbx-muted" for="nbx-id-t">هر ایده‌ای که به ذهنت رسید اینجا بایگانی کن؛ بدون هیچ دفترچه و محدودیتی، ده خط یا صد خط.</label>' +
        '<input class="nbx-in" id="nbx-id-t" type="text" placeholder="عنوان ایده (اختیاری)">' +
        '<textarea class="nbx-in" id="nbx-id-x" placeholder="ایده‌ات را بنویس..." style="min-height:120px;width:100%"></textarea>' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary" id="nbx-id-add">💡 به بایگانی ایده‌ها اضافه کن</button></div></div>' +
        '<div class="nbx-row" style="margin:10px 0 2px"><input class="nbx-in" id="nbx-id-q" type="search" placeholder="🔍 جستجو بین ایده‌ها" aria-label="جستجو بین ایده‌ها" style="flex:1;min-width:150px;max-width:280px"><span class="nbx-muted" id="nbx-id-cnt"></span></div><div id="nbx-id-list"></div>';
    var tx = $('#nbx-id-x'); tx.oninput = function () { autoGrow(tx); };
    $('#nbx-id-add').onclick = function () {
        var t = $('#nbx-id-t').value.trim(), x = tx.value.trim();
        if (!t && !x) { toast('یک عنوان یا متن برای ایده بنویس.'); return; }
        var l = getIdeas(); l.unshift({ id: uid(), t: t, x: tx.value, d: dateKey() });
        if (!setIdeas(l)) return;
        $('#nbx-id-t').value = ''; tx.value = ''; autoGrow(tx); toast('ایده بایگانی شد ✓'); paint();
    };
    $('#nbx-id-q').oninput = function (e) { q = e.target.value.trim().toLowerCase(); paint(); };
    function paint() {
        var all = getIdeas(), host = $('#nbx-id-list'); host.innerHTML = '';
        $('#nbx-id-cnt').textContent = all.length ? fa(all.length) + ' ایده در بایگانی' : '';
        var list = all.filter(function (i) { return !q || ((i.t || '') + ' ' + (i.x || '')).toLowerCase().indexOf(q) > -1; });
        if (!all.length) { host.innerHTML = '<div class="nbx-empty">بایگانی ایده‌هایت خالی است؛ اولین ایده‌ات را بالا بنویس.</div>'; return; }
        if (!list.length) { host.innerHTML = '<div class="nbx-empty">ایده‌ای با این جستجو پیدا نشد.</div>'; return; }
        list.forEach(function (it) {
            var c = el('div', { 'class': 'nbx-book' });
            c.innerHTML = '<div class="nbx-book-top"><input class="nbx-in id-t" type="text" placeholder="بدون عنوان" aria-label="عنوان ایده" style="flex:1;min-width:140px;font-weight:700"><span class="nbx-muted">' + esc(persianDate(it.d)) + '</span></div>' +
                '<textarea class="nbx-in id-x" aria-label="متن ایده" style="margin-top:8px;width:100%;min-height:90px"></textarea>' +
                '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-mini del" style="margin-right:auto" aria-label="حذف ایده">🗑</button></div>';
            var t = $('.id-t', c), x = $('.id-x', c); t.value = it.t || ''; x.value = it.x || ''; setTimeout(function () { autoGrow(x); }, 0);
            function save() { var l = getIdeas(), z = l.filter(function (k) { return k.id === it.id; })[0]; if (z) { z.t = t.value; z.x = x.value; setIdeas(l); } }
            t.oninput = save; x.oninput = function () { autoGrow(x); save(); };
            $('.del', c).onclick = function () { if (!confirm('این ایده برای همیشه حذف شود؟')) return; setIdeas(getIdeas().filter(function (k) { return k.id !== it.id; })); paint(); };
            host.appendChild(c);
        });
    }
    paint();
}
function buildWorksPage() {
    var host = $('#lib-root'); if (!host) return;
    host.innerHTML = backupBarHtml() + '<div id="lib-stats"></div><div class="nbx-seg" id="lib-seg" role="tablist" aria-label="بخش‌های آثار من"></div><div class="nbx-mbody lib-pane" id="lib-pane"></div>';
    wireBackupBar(); var seg = $('#lib-seg'), pane = $('#lib-pane'), stats = $('#lib-stats');
    var tabs = [['works', '📚 آثار من', function (p) { stats.style.display = ''; worksListInto(p); }], ['ideas', '💡 بایگانی ایده‌ها', function (p) { stats.style.display = 'none'; ideasInto(p); }]];
    function show(id) {
        if (!tabs.some(function (t) { return t[0] === id; })) id = 'works';
        $$('button', seg).forEach(function (b) { var on = b.getAttribute('data-id') === id; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-selected', String(on)); });
        pane.innerHTML = ''; tabs.filter(function (t) { return t[0] === id; })[0][2](pane);
        try { history.replaceState(null, '', '#' + id); } catch (e) {}
    }
    tabs.forEach(function (t) { var b = el('button', { 'class': 'nbx-chip', type: 'button', role: 'tab', 'data-id': t[0] }, t[1]); b.onclick = function () { show(t[0]); }; seg.appendChild(b); });
    window.addEventListener('hashchange', function () { show(location.hash.replace('#', '')); });
    show(location.hash.replace('#', '') || 'works');
    function again() { if (document.visibilityState === 'hidden') return; var on = $('#lib-seg button[aria-pressed="true"]'); if (on && on.getAttribute('data-id') === 'works' && !(document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))) show('works'); }
    document.addEventListener('visibilitychange', again); window.addEventListener('pageshow', function (ev) { if (ev.persisted) again(); });
}

/* ======================================================================
   🖼️ کارت اشتراک‌گذاری
   ====================================================================== */
var SHARE = (isReader || isLibrary) ?
    { name: 'کارت تجربهٔ کتاب', icon: '📖', foot: '📖 دفترچه کتاب‌خوان', file: 'کارت-تجربه-کتاب.png', empty: 'جمله یا برداشتت از کتاب را اینجا بنویس', textPh: 'جمله یا برداشتت از کتابی که خوانده‌ای...', srcPh: 'نام کتاب و نویسنده — اختیاری', hint: 'برداشت یا جملهٔ محبوبت از کتابی که خوانده‌ای را روی یک کارت بگذار و با دیگران به اشتراک بگذار.' } :
    { name: 'کارت خلاصه کتاب', icon: '📖', foot: '✍️ دفترچه نویسندگی', file: 'کارت-خلاصه-کتاب.png', empty: 'جملهٔ اثرت یا یک‌خط معرفی‌اش را اینجا بنویس', textPh: 'جمله‌ای از اثرت، یا یک‌خط معرفی‌اش...', srcPh: 'نام اثر یا نام نویسنده — اختیاری', hint: 'جمله‌ای از اثرت یا معرفی کوتاهش را با نام خودت روی یک کارت بگذار و برای خواننده‌هایت بفرست.' };
var CARD_PAL = {
    pink: ['#fbd6e2', '#f6e3f4', '#8f3556', '#e58fa8', 'صورتی'], mint: ['#d3efe0', '#e8f6ec', '#2a6b4e', '#6fbf9b', 'نعنایی'],
    sun: ['#fbeaa8', '#fdf3d4', '#7a5a0a', '#e3b93f', 'لیمویی'], sky: ['#cfe3f7', '#e6effa', '#244f80', '#6fa6da', 'آبی'],
    lilac: ['#e0d4f6', '#f1eafb', '#4e3388', '#9d85d6', 'بنفش'], night: ['#1f1812', '#2f241a', '#ecdcb4', '#a87b3c', 'شب']
};
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function wrapLines(c, text, maxW) {
    var lines = [];
    String(text).split('\n').forEach(function (para) {
        var words = para.split(/\s+/).filter(Boolean), cur = '';
        if (!words.length) { lines.push(''); return; }
        words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
        lines.push(cur);
    });
    return lines;
}
function drawCard(cv, text, source, pal) {
    var W = 1080, H = 1350, c = cv.getContext('2d'), p = CARD_PAL[pal] || CARD_PAL.pink, night = pal === 'night';
    cv.width = W; cv.height = H;
    var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, p[0]); g.addColorStop(1, p[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = night ? 'rgba(227,194,109,.07)' : 'rgba(120,80,100,.08)';
    for (var x = 30; x < W; x += 40) for (var y = 30; y < H; y += 40) { c.beginPath(); c.arc(x, y, 2.2, 0, 6.3); c.fill(); }
    c.globalAlpha = .18; c.fillStyle = p[3]; c.beginPath(); c.arc(W - 120, 140, 230, 0, 6.3); c.fill(); c.beginPath(); c.arc(100, H - 160, 260, 0, 6.3); c.fill(); c.globalAlpha = 1;
    c.setLineDash([18, 14]); c.lineWidth = 5; c.strokeStyle = p[3]; rr(c, 56, 56, W - 112, H - 112, 36); c.stroke(); c.setLineDash([]);
    c.textAlign = 'center'; c.direction = 'rtl'; c.fillStyle = p[3]; c.font = '700 200px Vazirmatn,Tahoma,serif'; c.fillText('❝', W / 2, 330);
    c.fillStyle = p[2];
    var areaTop = 380, areaH = 640, maxW = 800, size = 68, lines, lh;
    for (; size >= 30; size -= 4) { c.font = '700 ' + size + 'px Vazirmatn,Tahoma,sans-serif'; lines = wrapLines(c, text || SHARE.empty, maxW); lh = size * 1.85; if (lines.length * lh <= areaH) break; }
    var y0 = areaTop + (areaH - lines.length * lh) / 2 + lh * 0.75;
    lines.forEach(function (ln, i) { c.fillText(ln, W / 2, y0 + i * lh); });
    if (source) { c.font = '600 34px Vazirmatn,Tahoma,sans-serif'; c.globalAlpha = .85; c.fillText('— ' + source, W / 2, 1090); c.globalAlpha = 1; }
    c.strokeStyle = p[3]; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 70, 1140); c.lineTo(W / 2 + 70, 1140); c.stroke();
    c.font = '700 34px Vazirmatn,Tahoma,sans-serif'; c.fillStyle = p[2]; c.globalAlpha = .8; c.fillText(SHARE.foot, W / 2, 1210); c.globalAlpha = 1;
}
function openShareCard(text, source) {
    var body = el('div', { 'class': 'nbx-mbody' }), pal = html_dark() ? 'night' : 'pink';
    body.innerHTML = '<p class="nbx-muted" style="margin:0 0 10px">' + esc(SHARE.hint) + '</p><canvas id="nbx-cv" style="width:100%;max-width:340px;display:block;margin:0 auto 10px;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,.25)"></canvas>' +
        '<textarea class="nbx-skip nbx-in" id="nbx-cv-text" rows="3" placeholder="' + esc(SHARE.textPh) + '"></textarea>' +
        '<input class="nbx-in" id="nbx-cv-src" type="text" placeholder="' + esc(SHARE.srcPh) + '" style="margin-top:6px">' +
        '<div class="nbx-chips" id="nbx-cv-pal"></div>' +
        '<div class="nbx-row" style="margin-top:6px"><button type="button" class="nbx-btn primary" id="nbx-cv-save">💾 ذخیره تصویر</button><button type="button" class="nbx-btn" id="nbx-cv-share">📤 ارسال</button></div>';
    openModal(SHARE.icon + ' ' + SHARE.name, body);
    var cv = $('#nbx-cv'), tx = $('#nbx-cv-text'), sr = $('#nbx-cv-src');
    tx.value = text || ''; sr.value = source || '';
    function redraw() { drawCard(cv, tx.value.trim(), sr.value.trim(), pal); }
    Object.keys(CARD_PAL).forEach(function (k) {
        var b = el('button', { 'class': 'nbx-chip', type: 'button', 'aria-pressed': String(k === pal) }, CARD_PAL[k][4]);
        b.onclick = function () { pal = k; $$('#nbx-cv-pal .nbx-chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); redraw(); };
        $('#nbx-cv-pal').appendChild(b);
    });
    tx.oninput = redraw; sr.oninput = redraw; redraw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    function blobOf(cb) { cv.toBlob(cb, 'image/png'); }
    $('#nbx-cv-save').onclick = function () {
        blobOf(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = SHARE.file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000); toast('تصویر ذخیره شد ✓'); });
    };
    $('#nbx-cv-share').onclick = function () {
        blobOf(function (b) {
            var f = new File([b], SHARE.file, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(function () {});
            else toast('این مرورگر ارسال مستقیم را پشتیبانی نمی‌کند؛ «ذخیره تصویر» را بزن.');
        });
    };
}
function html_dark() { return root.classList.contains('nb-dark'); }

/* ======================================================================
   🧩 بخش‌های تازهٔ دفترچه نویسنده (کارت‌های جابه‌جاشونده):
   شخصیت‌ها، خط زمان، مکان‌ها، جعبهٔ جمله‌ها
   ====================================================================== */
var CTABS = [];
function buildCardTab(cfg) {
    var nav = $('nav'); if (!nav || !$('.tab-content')) return;
    var mounted = !!cfg.mount;
    var tab = mounted ? cfg.mount : el('div', { id: cfg.id, 'class': 'tab-content' });
    tab.innerHTML = '<div class="layer-card"><h3>' + cfg.title + '</h3><p class="nbx-muted" style="margin:0 0 10px">' + cfg.desc + '</p>' +
        '<div class="nbx-row"><button type="button" class="nbx-btn primary nbx-ct-add">➕ ' + cfg.add + '</button></div>' +
        '<p class="nbx-muted nbx-ct-sum" style="margin:10px 0 0"></p><div class="nbx-ct-list"></div><div class="nbx-empty nbx-ct-empty">' + cfg.empty + '</div></div>';
    if (!mounted) {
        placeTab(tab);
        nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, '" + cfg.id + "')" }, cfg.nav));
    }
    var list = $('.nbx-ct-list', tab);
    var save0 = makeSaver(cfg.key, collect);
    function save() { save0(); if (cfg.onChange) cfg.onChange(); }
    function collect() {
        return $$('.nbx-card', list).map(function (c) {
            var o = { id: c.getAttribute('data-id') };
            $$('[data-k]', c).forEach(function (f) { o[f.getAttribute('data-k')] = f.value; });
            return o;
        });
    }
    function numbers() {
        $$('.nbx-card', list).forEach(function (c, i) { $('.nbx-badge', c).textContent = fa(i + 1); var n = $$('textarea', c); n.forEach(function (t) { t.setAttribute('data-keep', t.value); grow(t); }); });
        var n = $$('.nbx-card', list).length;
        $('.nbx-ct-sum', tab).textContent = n ? fa(n) + ' ' + cfg.unit : '';
        $('.nbx-ct-empty', tab).hidden = n > 0;
    }
    function add(data, silent) {
        data = data || {};
        var c = el('div', { 'class': 'nbx-card ct', 'data-id': data.id || uid() });
        var fieldsHtml = cfg.fields.map(function (f, i) {
            var v = data[f.k] || '';
            if (f.type === 'select') return '<select data-k="' + f.k + '" aria-label="' + esc(f.label) + '">' + f.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
            if (f.type === 'textarea') return '<label class="nbx-ct-l">' + esc(f.label) + '</label><textarea class="nbx-note" data-k="' + f.k + '" placeholder="' + esc(f.ph || '') + '"></textarea>';
            return '<label class="nbx-ct-l">' + esc(f.label) + '</label><input class="nbx-title nbx-line" type="text" data-k="' + f.k + '" placeholder="' + esc(f.ph || '') + '" value="' + esc(v) + '">';
        });
        c.innerHTML = '<button type="button" class="nbx-handle" aria-label="جابه‌جا کن (بکش)" title="بکش و جابه‌جا کن">⠿</button><div class="nbx-card-main">' +
            '<div class="nbx-card-top"><span class="nbx-badge"></span><input class="nbx-title" type="text" data-k="title" placeholder="' + esc(cfg.titlePh) + '" value="' + esc(data.title || '') + '"></div>' +
            fieldsHtml.join('') +
            '<div class="nbx-card-foot"><button type="button" class="nbx-mini up" aria-label="بالا">↑</button><button type="button" class="nbx-mini down" aria-label="پایین">↓</button><button type="button" class="nbx-mini del" aria-label="حذف">🗑</button></div></div>';
        $$('textarea', c).forEach(function (t) { t.value = data[t.getAttribute('data-k')] || ''; t.setAttribute('data-keep', t.value); });
        if (cfg.decorate) cfg.decorate(c, data);
        list.appendChild(c);
        if (!silent) { numbers(); save(); $('.nbx-title', c).focus(); }
        return c;
    }
    $('.nbx-ct-add', tab).onclick = function () { add(); };
    list.addEventListener('input', function (e) { if (e.target.tagName === 'TEXTAREA') grow(e.target); save(); });
    list.addEventListener('change', save);
    list.addEventListener('focusin', function (e) { var t = e.target; if (t.tagName === 'TEXTAREA' && !t.value && t.getAttribute('data-keep')) { t.value = t.getAttribute('data-keep'); grow(t); } });
    list.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; var card = b.closest('.nbx-card'); if (!card) return;
        if (b.classList.contains('up') && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
        else if (b.classList.contains('down') && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
        else if (b.classList.contains('del')) { if (!confirm('«' + ($('.nbx-title', card).value || 'این کارت') + '» حذف شود؟')) return; card.remove(); if (cfg.onDelete) cfg.onDelete(card.getAttribute('data-id')); }
        else return;
        numbers(); save();
    });
    var dragging = null;
    list.addEventListener('pointerdown', function (e) {
        var h = e.target.closest('.nbx-handle'); if (!h) return; e.preventDefault();
        dragging = h.closest('.nbx-card'); dragging.classList.add('nbx-dragging'); try { h.setPointerCapture(e.pointerId); } catch (x) {}
    });
    list.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var under = document.elementFromPoint(e.clientX, e.clientY), over = under && under.closest ? under.closest('.nbx-card') : null;
        if (over && over !== dragging && list.contains(over)) { var r = over.getBoundingClientRect(); list.insertBefore(dragging, e.clientY > r.top + r.height / 2 ? over.nextSibling : over); }
        if (e.clientY < 90) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
    });
    function end() { if (!dragging) return; dragging.classList.remove('nbx-dragging'); dragging = null; numbers(); save(); }
    list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);

    var api = {
        cfg: cfg, tabId: cfg.tabId || cfg.id,
        refresh: async function () { var d = await getData(activeId()); list.innerHTML = ''; (d[cfg.key] || []).forEach(function (x) { add(x, true); }); numbers(); },
        cards: function () { return collect(); }
    };
    CTABS.push(api);
    return api;
}
var SEL_KIND_R = [['', 'چه نوعی؟'], ['magic', 'قانون ماورایی'], ['social', 'قانون اجتماعی یا سیاسی'], ['taboo', 'تابو و خط قرمز'], ['other', 'دیگر']];
var SEL_KIND_S = [['', 'چه نوع منبعی؟'], ['book', 'کتاب'], ['article', 'مقاله و پژوهش'], ['film', 'فیلم و مستند'], ['web', 'وب‌سایت'], ['person', 'گفت‌وگو با آدم‌ها'], ['other', 'دیگر']];
var SEL_STATE_S = [['', 'هنوز شروع نکرده‌ام'], ['reading', 'در حال مطالعه'], ['done', 'خواندم و استفاده کردم']];
var SEL_KIND_N = [['', 'برای چیست؟'], ['char', 'شخصیت'], ['place', 'مکان'], ['group', 'گروه یا سازمان'], ['work', 'عنوان اثر'], ['other', 'چیز دیگر']];
var SEL_STATE_N = [['', 'کاندید'], ['picked', 'انتخاب شد ✅'], ['out', 'کنار گذاشتم']];
var SEL_KIND_T = [['', 'این رویداد کی رخ می‌دهد؟'], ['past', 'گذشتهٔ دور جهان'], ['before', 'پیش از شروع داستان'], ['in', 'داخل داستان'], ['after', 'پس از داستان']];
var SEL_KIND_P = [['', 'چه نوع مکانی؟'], ['city', 'شهر و محله'], ['home', 'خانه و اتاق'], ['nature', 'طبیعت'], ['closed', 'مکان بسته'], ['sacred', 'مقدس یا ممنوع'], ['other', 'دیگر']];
var SEL_KIND_L = [['', 'چه نوع جمله‌ای؟'], ['dialog', 'دیالوگ'], ['desc', 'توصیف'], ['open', 'جملهٔ آغاز'], ['end', 'جملهٔ پایان'], ['nice', 'عبارت زیبا']];
/* ======================================================================
   👥 سیستم شخصیت‌ها (ادغام «لایه‌های شخصیت‌پردازی» و «کارت شخصیت‌ها»)
   هر شخصیت یک کارت مستقل با همهٔ فیلدهای هر دو بخش است؛ تعداد نامحدود.
   کلید ذخیره‌سازی: __chars (داخل دادهٔ همان پروژه، پس بک‌آپ/بازیابی خودکار شامل آن است)
   داده‌های قدیمی (فیلدهای char-* و کلید __cast) دست‌نخورده می‌مانند و در اولین
   بارگذاری، یک‌بار و امن به کارت‌ها مهاجرت داده می‌شوند.
   ====================================================================== */
var CHAR_LEGACY = [{"title": "👤 لایه اول: هویت و ریشه‌ها", "fields": [{"k": "char-name-age", "label": "✨ این شخصیت کیست؟", "sub": "نام، سن و تصویری کوتاه که خواننده با دیدنش شخصیت را به یاد بیاورد.", "ph": "نام، سن و یک تصویر کوتاه از او... مثلاً: آراد، ۲۸ ساله، کسی که همیشه دیر تصمیم می‌گیرد اما وقتی تصمیم می‌گیرد، برنمی‌گردد..."}, {"k": "char-role", "label": "🎭 در این داستان چه نقشی دارد؟", "sub": "جایگاه او در داستان: چه کاری می‌کند و داستان بدون او چه می‌شد.", "ph": "قهرمان؟ ضدقهرمان؟ راوی؟ یا کسی که همه فکر می‌کنند مهم نیست اما داستان از او شروع می‌شود..."}, {"k": "char-family", "label": "🕯️ ریشه‌ها و آدم‌های زندگی‌اش", "sub": "آدم‌ها و گذشته‌ای که او را ساخته‌اند و هنوز روی انتخاب‌هایش اثر دارند.", "ph": "خانواده، رابطه‌های مهم، زخم‌ها یا خاطراتی که هنوز همراه اوست..."}]}, {"title": "👁️ لایه دوم: بدن، رفتار و امضای شخصیت", "fields": [{"k": "char-appearance", "label": "🩸 نشانه‌های ظاهری و زخم‌های ماندگار", "sub": "چیزی که بدن این شخصیت را قابل تشخیص می‌کند.", "ph": "مثلاً: جای زخم روی مچ دست که هیچ‌وقت درباره‌اش حرف نمی‌زند..."}, {"k": "char-habits", "label": "⚡ رفتارهای ناخودآگاه و تیک‌های شخصیتی", "sub": "بدنش قبل از حرفش لو می‌دهد.", "ph": "مثلاً: ناخن جویدن موقع اضطراب، یا لبخند کوتاه قبل از دروغ..."}, {"k": "char-tone", "label": "🗣️ امضای کلامی و شیوه حرف زدن", "sub": "لحن، ریتم و واژه‌هایی که فقط از دهان این شخصیت درمی‌آید.", "ph": "آرام و کش‌دار؟ یا کوتاه و تیز و بریده؟"}, {"k": "char-interests", "label": "🎧 دنیای شخصی و پناهگاه ذهنی", "sub": "جایی که وقتی دنیا سخت می‌شود به آن پناه می‌برد.", "ph": "موسیقی، قدم زدن، تنهایی، یا هر چیزی که در آن فرار می‌کند..."}]}, {"title": "🕳️ لایه سوم: اتاق تاریک روان", "fields": [{"k": "char-goals-fears", "label": "🔥 خواسته‌ها، ترس‌ها و نقطه شکست", "sub": "آنچه برایش می‌جنگد، آنچه ازش فرار می‌کند و نقطه‌ای که در آن می‌شکند.", "ph": "واقعاً چه می‌خواهد و از چه چیزی فرار می‌کند؟"}, {"k": "char-mask", "label": "🎭 نقاب اجتماعی vs حقیقت درونی", "sub": "دو نسخه از یک انسان.", "ph": "بیرون آرام، داخل فروپاشیده..."}, {"k": "char-contradiction", "label": "⚖️ تناقض مرکزی شخصیت", "sub": "جایی که حرف و عمل او با هم نمی‌خوانند؛ مرکز جذابیت شخصیت.", "ph": "چیزی که خودش را نقض می‌کند..."}, {"k": "char-secret", "label": "🩸 ریشه زخم‌ها", "sub": "اتفاق یا لحظه‌ای در گذشته که شخصیت امروز از آن شکل گرفته است.", "ph": "گذشته‌ای که هنوز تمام نشده..."}, {"k": "char-beliefs", "label": "🧠 باورهای شخصی و خط قرمزها", "sub": "آنچه شخصیت درباره زندگی، عشق، اعتماد، قدرت یا انسان‌ها باور دارد؛ حقیقت‌هایی که مسیر انتخاب‌هایش را هدایت می‌کنند، حتی اگر اشتباه باشند.", "ph": "مثلاً: «هیچ‌کس واقعاً قابل اعتماد نیست»، «ضعیف بودن یعنی شکست»، «عشق آدم‌ها را نابود می‌کند» یا هر باوری که شخصیت با آن زندگی می‌کند..."}, {"k": "char-dilemmas", "label": "⚡ نقطه فروپاشی", "sub": "لحظه‌ای که دو چیز مهم در برابر هم قرار می‌گیرند و راه برگشتی نیست.", "ph": "کجا مجبور به انتخاب غیرقابل برگشت می‌شود؟"}]}, {"title": "🕸️ لایه چهارم: شبکه روابط", "fields": [{"k": "char-relations", "label": "🔗 مسیر تغییر رابطه", "sub": "رابطهٔ او با آدم‌های اصلی از ابتدا تا انتها چگونه عوض می‌شود.", "ph": "از نفرت تا وابستگی، یا از عشق تا فروپاشی..."}, {"k": "char-relations-beats", "label": "⚡ نقاط انفجار رابطه", "sub": "رویدادهایی که رابطه را یک‌باره به سمت دیگری می‌برند.", "ph": "خیانت، افشا، نجات، یا فروپاشی..."}, {"k": "char-relations-reason", "label": "🧠 دلیل تغییر رابطه", "sub": "چرا رابطه عوض می‌شود: چه نیاز، ترس یا حقیقتی پشت آن است.", "ph": "ترس، نیاز، گذشته مشترک..."}]}];
var CF = {
    want: { k: 'want', label: '🎯 چه می‌خواهد؟', sub: 'چیزی که آشکارا دنبالش است و نیازی که شاید خودش هم نمی‌داند.', ph: 'خواستهٔ آشکار و نیاز پنهانش...' },
    fear: { k: 'fear', label: '😨 از چه می‌ترسد؟', sub: 'ترسی که پشت تصمیم‌ها و فرارهایش پنهان است.', ph: 'ترسی که تصمیم‌هایش را می‌سازد...' },
    secret: { k: 'secret', label: '🗝️ چه رازی دارد؟', sub: 'چیزی که پنهان نگه می‌دارد و افشایش داستان را عوض می‌کند.', ph: 'چیزی که به هیچ‌کس نمی‌گوید...' },
    arc: { k: 'arc', label: '🌱 در پایان چه تغییری می‌کند؟', sub: 'تغییر درونی او از صفحهٔ اول تا آخر، یا ایستادگی‌اش در برابر تغییر.', ph: 'از کجا شروع می‌کند و به کجا می‌رسد؟' },
    conflict: { k: 'conflict', label: '⚔️ هدف بیرونی در برابر تضاد درونی', sub: 'در دنیای بیرون دنبال چه چیزی است، و چه چیزی در درونش جلوی رسیدن به آن را می‌گیرد؟', ph: 'مثلاً: بیرون: پیدا کردن قاتل. درون: می‌ترسد حقیقت، خودش را مقصر نشان بدهد...' },
    rel: { k: 'rel', label: '🔗 رابطه با دیگران', sub: 'دوستان، دشمنان و وابستگی‌هایش، و دلیل هر کدام.', ph: 'با چه کسی دوست، دشمن یا دلبسته است و چرا؟' }
};
var CHAR_LAYERS = (function () {
    var L = CHAR_LEGACY, by = {};
    L.forEach(function (l) { l.fields.forEach(function (f) { by[f.k] = f; }); });
    return [
        { id: 'l1', title: L[0].title, fields: L[0].fields },
        { id: 'l2', title: L[1].title, fields: L[1].fields },
        { id: 'l3', title: L[2].title, fields: [CF.want, CF.conflict, CF.fear, by['char-goals-fears'], CF.secret, by['char-secret'], by['char-mask'], by['char-contradiction'], by['char-beliefs'], by['char-dilemmas'], CF.arc] },
        { id: 'l4', title: L[3].title, fields: [CF.rel].concat(L[3].fields) }
    ];
})();
var chHost = null, chActive = '';
function cleanLabel(s) { return String(s).replace(/^[^\s]+\s/, ''); }
function ask(msg) { return (typeof window.nbConfirm === 'function') ? window.nbConfirm(msg, true) : Promise.resolve(confirm(msg)); }
function migrateChars(d) {
    var out = [], legacy = {}, has = false;
    CHAR_LEGACY.forEach(function (l) { l.fields.forEach(function (f) { var v = d[f.k]; if (typeof v === 'string' && v.trim()) { has = true; legacy[f.k] = v; } }); });
    if (has) {
        var nm = String(legacy['char-name-age'] || '').trim().split(/[،,.\n؛:]/)[0].trim().slice(0, 28);
        out.push(Object.assign({ id: uid(), title: nm || 'شخصیت اصلی' }, legacy));
    }
    (d.__cast || []).forEach(function (x) { out.push(Object.assign({}, x, { id: x.id || uid() })); });
    return out;
}
function readEd(ed) {
    var o = { id: ed.getAttribute('data-id') };
    $$('[data-k]', ed).forEach(function (f) { o[f.getAttribute('data-k')] = f.value; });
    return o;
}
function collectChars() { return chHost ? $$('.nbx-char-ed', chHost).map(readEd) : []; }
var saveChars = makeSaver('__chars', collectChars);
function charRoleLabel(v) { var o = v && TYPES.filter(function (x) { return x.id === v; })[0]; return o ? (o.label || o.name) : ''; }
function charEd(data, hints) {
    var ed = el('div', { 'class': 'nbx-char-ed', 'data-id': data.id || uid(), hidden: '' });
    var cid = ed.getAttribute('data-id');
    var h = '<div class="layer-card nbx-ch-head">' +
        '<div class="nbx-ch-name"><span class="nbx-av nbx-av-lg" aria-hidden="true"></span><input class="nbx-in nbx-ch-title" type="text" data-k="title" placeholder="نام شخصیت" aria-label="نام شخصیت" value="' + esc(data.title || '') + '"></div>' +
        '<div class="nbx-ch-meta"><input type="hidden" data-k="role" value="' + esc(data.role || '') + '"><button type="button" class="nbx-btn nbx-role-chip" data-act="role" title="تغییر نقش یا نوع شخصیت">' + esc(charRoleLabel(data.role) || '🏷️ نوع و نقش؟') + ' ✎</button>' +
        '<input class="nbx-in" type="text" data-k="line" placeholder="یک‌خط معرفی؛ مثلاً: ساعت‌سازی که از زمان فرار می‌کند" aria-label="یک‌خط معرفی" value="' + esc(data.line || '') + '"></div>' +
        '<div class="nbx-lk nbx-lk-box" data-kind="chars" data-eid="' + esc(cid) + '"></div>' +
        '<div class="nbx-row nbx-ch-acts"><button type="button" class="nbx-btn" data-act="earlier" title="جلوتر در فهرست شخصیت‌ها">→ جلو</button><button type="button" class="nbx-btn" data-act="later" title="عقب‌تر در فهرست شخصیت‌ها">عقب ←</button>' +
        '<button type="button" class="nbx-btn nbx-danger" data-act="del">🗑 حذف</button></div></div>';
    CHAR_LAYERS.forEach(function (L, li) {
        h += '<details class="layer-card nbx-layer" data-layer="' + L.id + '"><summary><h3>' + esc(L.title) + '</h3><small class="nbx-fill"></small></summary>';
        L.fields.forEach(function (f) {
            h += '<div class="field-group"><label>' + esc(f.label) + '</label>' + (f.sub ? '<span class="sub-label">' + esc(f.sub) + '</span>' : '') +
                '<textarea data-k="' + esc(f.k) + '" placeholder="' + esc(f.ph || '') + '"></textarea></div>';
        });
        h += '</details>';
    });
    ed.innerHTML = h;
    $$('textarea', ed).forEach(function (t) { t.value = data[t.getAttribute('data-k')] || ''; });
    /* نمونهٔ راهنمای کهن‌الگو فقط به‌صورت متن کم‌رنگ (placeholder) نشان داده می‌شود: ذخیره نمی‌شود، در PDF و پشتیبان نمی‌آید و با اولین حرف ناپدید می‌شود */
    if (hints) Object.keys(hints).forEach(function (k) {
        if (!hints[k]) return;
        var f = $('[data-k="' + k + '"]', ed);
        if (f && f.type !== 'hidden' && !f.value) f.setAttribute('placeholder', 'نمونه: ' + hints[k]);
    });
    var stOpen = openState();
    $$('details', ed).forEach(function (d) {
        var k = 'chars|' + d.getAttribute('data-layer');
        d.open = !!stOpen[k];
        d.addEventListener('toggle', function () { var o = openState(); o[k] = d.open ? 1 : 0; lsSet(OPEN_KEY, JSON.stringify(o)); });
    });
    return ed;
}
function fillCount(ed) {
    $$('details', ed).forEach(function (d) {
        var all = $$('textarea', d), n = all.filter(function (t) { return t.value.trim(); }).length;
        var s = $('.nbx-fill', d); if (s) s.textContent = n ? fa(n) + ' از ' + fa(all.length) : '';
    });
}
function avatarOf(ed, i) {
    var name = $('[data-k="title"]', ed).value.trim(), ch = name ? Array.from(name)[0] : '؟';
    var col = PALETTE[i % PALETTE.length];
    var a = $('.nbx-av-lg', ed); if (a) { a.textContent = ch; a.style.setProperty('--av', col); }
    return { ch: ch, col: col };
}
function renderStrip() {
    if (!chHost) return;
    var strip = $('.nbx-char-strip', chHost); strip.innerHTML = '';
    var eds = $$('.nbx-char-ed', chHost);
    eds.forEach(function (ed, i) {
        var av = avatarOf(ed, i), name = $('[data-k="title"]', ed).value.trim(), rl = charRoleLabel($('[data-k="role"]', ed).value);
        var on = ed.getAttribute('data-id') === chActive;
        var b = el('button', { 'class': 'nbx-chip nbx-cc', type: 'button', role: 'tab', 'data-id': ed.getAttribute('data-id'), 'aria-pressed': String(on), 'aria-selected': String(on) });
        b.innerHTML = '<span class="nbx-av" style="--av:' + av.col + '" aria-hidden="true">' + esc(av.ch) + '</span><span class="nbx-cc-t">' + esc(name || 'بدون نام') + '</span>' + (rl ? '<small>' + esc(rl) + '</small>' : '');
        strip.appendChild(b);
    });
    $('.nbx-ch-sum', chHost).textContent = eds.length ? fa(eds.length) + ' شخصیت' : '';
    $('.nbx-ch-empty', chHost).hidden = eds.length > 0;
    var on = $('.nbx-cc[aria-pressed="true"]', strip); if (on && on.scrollIntoView) { try { strip.scrollLeft += 0; } catch (e) {} }
}
function showChar(id) {
    if (!chHost) return;
    var eds = $$('.nbx-char-ed', chHost);
    if (!eds.length) { chActive = ''; renderStrip(); return; }
    if (!eds.some(function (e) { return e.getAttribute('data-id') === id; })) id = eds[0].getAttribute('data-id');
    chActive = id;
    try { sessionStorage.setItem('nbx-ch-active-' + activeId(), id); } catch (e) {}
    eds.forEach(function (ed) {
        var on = ed.getAttribute('data-id') === id;
        if (on) ed.removeAttribute('hidden'); else ed.setAttribute('hidden', '');
        if (on) { growAll($$('textarea', ed)); fillCount(ed); }
    });
    renderStrip();
}
function insertEd(ed, after) {
    var box = $('.nbx-char-eds', chHost);
    if (after && after.nextSibling) box.insertBefore(ed, after.nextSibling); else box.appendChild(ed);
}
function buildCharacters() {
    var tab = $('#tab-chars'); if (!tab) return;
    tab.innerHTML = '';
    chHost = el('div', { 'class': 'nbx-chars' });
    chHost.innerHTML = '<div class="layer-card nbx-ch-top"><h3>👥 شخصیت‌های داستان</h3>' +
        '<p class="nbx-muted" style="margin:0 0 8px">برای هر شخصیت یک کارت مستقل بساز؛ هر کارت همهٔ جزئیات همان شخصیت را نگه می‌دارد و با بقیه قاطی نمی‌شود. بین شخصیت‌ها جابه‌جا شو و هر تعداد که خواستی اضافه کن.</p>' +
        '<div class="nbx-char-strip" role="tablist" aria-label="شخصیت‌ها"></div>' +
        '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-btn primary nbx-ch-add">➕ شخصیت تازه</button><span class="nbx-muted nbx-ch-sum"></span></div>' +
        '</div>' +
        '<div class="nbx-char-eds"></div>' +
        '<div class="nbx-empty nbx-ch-empty">هنوز شخصیتی نساخته‌ای. با «شخصیت تازه» شروع کن.</div>';
    tab.appendChild(chHost);
    /* یک دکمه برای همه‌چیز: نقش، کهن‌الگو، تیپ ادبی یا شخصیت انحصاری */
    $('.nbx-ch-add', chHost).onclick = function () {
        openTypePicker(false, function (t) {
            var ed = charEd(t ? { id: uid(), role: t.id } : { id: uid() }, t && t.start ? { line: t.line, want: t.want, fear: t.fear, secret: t.secret, arc: t.arc } : null);
            insertEd(ed); renderStrip(); showChar(ed.getAttribute('data-id')); saveChars(); refreshLinks();
            var ti = $('[data-k="title"]', ed); if (ti) { ti.focus(); if (ti.value) ti.select(); }
            toast(!t ? 'کارت خالی ساخته شد؛ هر چه می‌خواهی بنویس' : t.start ? 'کارت «' + t.name + '» ساخته شد؛ نمونه‌ها فقط متن کم‌رنگ‌اند و با نوشتن ناپدید می‌شوند' : 'کارت ساخته شد؛ نقش: ' + charRoleLabel(t.id));
        });
    };
    $('.nbx-char-strip', chHost).addEventListener('click', function (e) {
        var b = e.target.closest('.nbx-cc'); if (b) showChar(b.getAttribute('data-id'));
    });
    chHost.addEventListener('input', function (e) {
        var f = e.target; if (!f.getAttribute || !f.getAttribute('data-k')) return;
        var ed = f.closest('.nbx-char-ed'); if (!ed) return;
        if (f.tagName === 'TEXTAREA') { grow(f); fillCount(ed); }
        if (f.getAttribute('data-k') === 'title') { renderStrip(); refreshLinksSoon(); }
        saveChars();
    });
    chHost.addEventListener('change', function (e) {
        var f = e.target; if (!f.getAttribute || !f.getAttribute('data-k')) return;
        if (f.getAttribute('data-k') === 'role') renderStrip();
        saveChars();
    });
    chHost.addEventListener('toggle', function (e) { var d = e.target; if (d && d.tagName === 'DETAILS' && d.open) { growAll($$('textarea', d)); } }, true);
    chHost.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var ed = b.closest('.nbx-char-ed'), act = b.getAttribute('data-act'); if (!ed) return;
        var box = $('.nbx-char-eds', chHost);
        if (act === 'role') {
            openTypePicker(true, function (t) {
                $('[data-k="role"]', ed).value = t ? t.id : '';
                $('.nbx-role-chip', ed).textContent = (t ? charRoleLabel(t.id) : '🏷️ نوع و نقش؟') + ' ✎';
                renderStrip(); saveChars();
            });
            return;
        }
        if (act === 'earlier' && ed.previousElementSibling) box.insertBefore(ed, ed.previousElementSibling);
        else if (act === 'later' && ed.nextElementSibling) box.insertBefore(ed.nextElementSibling, ed);
        else if (act === 'del') {
            var nm = ($('[data-k="title"]', ed).value || '').trim() || 'این شخصیت';
            var ok = await ask('«' + nm + '» حذف شود؟ تمام اطلاعات همین کارت پاک می‌شود.'); if (!ok) return;
            var nxt = ed.nextElementSibling || ed.previousElementSibling, delId = ed.getAttribute('data-id'); ed.remove();
            unlinkEntity('chars', delId);
            showChar(nxt ? nxt.getAttribute('data-id') : '');
        } else return;
        renderStrip(); showChar(chActive); saveChars(); refreshLinksSoon();
    });
}
async function refreshChars() {
    if (!chHost) return;
    if (chHost.getAttribute('data-ready') && chHost.contains(document.activeElement)) return;
    var pid = activeId(), d = await getData(pid), arr = d.__chars;
    if (!Array.isArray(arr)) {
        arr = migrateChars(d);
        await patchData(pid, function (dd) { if (!Array.isArray(dd.__chars)) dd.__chars = arr; });
    }
    var box = $('.nbx-char-eds', chHost); box.innerHTML = '';
    arr.forEach(function (c) { box.appendChild(charEd(c)); });
    var want = ''; try { want = sessionStorage.getItem('nbx-ch-active-' + pid) || ''; } catch (e) {}
    showChar(want);
    chHost.setAttribute('data-ready', '1');
    refreshLinks();
}
function charsSection() {
    if (!chHost) return null;
    var cards = [], n = 0;
    collectChars().forEach(function (c) {
        var items = [], rl = charRoleLabel(c.role);
        if (rl) items.push({ label: 'نقش', value: rl });
        if ((c.line || '').trim()) items.push({ label: 'یک‌خط معرفی', value: c.line.trim() });
        var scs = scenesOf('chars', c.id).map(cardLabel); if (scs.length) items.push({ label: 'حضور در صحنه‌ها', value: scs.join('، ') });
        CHAR_LAYERS.forEach(function (L) {
            var sub = [];
            L.fields.forEach(function (f) { var v = (c[f.k] || '').trim(); if (v) sub.push({ label: cleanLabel(f.label), value: v }); });
            if (sub.length) { items.push({ head: cleanLabel(L.title) }); items = items.concat(sub); }
        });
        if (!(c.title || '').trim() && !items.length) return;
        n++; cards.push({ title: fa(n) + '. ' + ((c.title || '').trim() || 'بدون نام'), items: items.length ? items : [{ label: '—', value: '—' }] });
    });
    return { cards: cards, count: n, unit: 'شخصیت' };
}

/* ======================================================================
   ⏳ زمان و ریتم: خط زمان رویدادها + هم‌زمانی/فلش‌بک + ریتم روایت در یک تب
   ====================================================================== */
var PACE_LBL = { slow: 'کند', mid: 'متعادل', fast: 'تند', broken: 'شکسته' };
function goStructure(cardId) {
    var nb = $$('nav .nav-link').filter(function (b) { return (b.getAttribute('onclick') || '').indexOf("'tab-structure'") > -1; })[0];
    if (nb) nb.click();
    if (cardId) setTimeout(function () {
        var c = $('#nbx-cards .nbx-card[data-id="' + cardId + '"]');
        if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); c.classList.add('nbx-flash'); setTimeout(function () { c.classList.remove('nbx-flash'); }, 1800); }
    }, 150);
}
function refreshRhythm() {
    var host = $('#nbx-rhythm'); if (!host || !$('#nbx-cards')) return;
    var cards = collectCards(), ch = 0, sc = 0, counts = { slow: 0, mid: 0, fast: 0, broken: 0, none: 0 }, run = 0, maxRun = 0, last = '', lastLbl = '';
    var bar = '', scenes = 0;
    cards.forEach(function (c) {
        if (c.type === 'chapter') { ch++; sc = 0; bar += '<span class="nbx-rd" title="فصل ' + fa(ch) + (c.title ? ': ' + esc(c.title) : '') + '">' + fa(ch) + '</span>'; last = ''; run = 0; return; }
        sc++; scenes++;
        var p = c.pace || ''; counts[p || 'none']++;
        if (p && p === last) run++; else run = p ? 1 : 0;
        last = p; if (run > maxRun) { maxRun = run; lastLbl = PACE_LBL[p] || ''; }
        bar += '<button type="button" class="nbx-rb p-' + (p || 'none') + '" data-id="' + esc(c.id) + '" title="صحنه ' + fa(ch || 1) + '.' + fa(sc) + (c.title ? ' — ' + esc(c.title) : '') + ' (' + (PACE_LBL[p] ? 'ریتم ' + PACE_LBL[p] : 'ریتم تعیین نشده') + ')" aria-label="صحنه ' + fa(ch || 1) + '.' + fa(sc) + '"></button>';
    });
    var html = '<p class="nbx-muted" style="margin:0 0 8px">ریتم صحنه‌هایت به ترتیبی که در «ساختار» چیده‌ای. رنگ هر صحنه از ریتمی می‌آید که برایش انتخاب کرده‌ای؛ با لمس هر صحنه به کارتش می‌روی.</p>';
    if (!scenes) html += '<div class="nbx-empty">هنوز صحنه‌ای نساخته‌ای. در تب «ساختار» صحنه بساز و ریتم هر کدام را انتخاب کن تا اینجا دیده شود.</div>';
    else {
        html += '<div class="nbx-rhy-bar" role="group" aria-label="نوار ریتم صحنه‌ها">' + bar + '</div><div class="nbx-rhy-legend">' +
            [['slow', 'کند'], ['mid', 'متعادل'], ['fast', 'تند'], ['broken', 'شکسته'], ['none', 'نامشخص']].map(function (x) { return '<span><i class="nbx-rb p-' + x[0] + '"></i>' + x[1] + ' <b>' + fa(counts[x[0]]) + '</b></span>'; }).join('') + '</div>';
        var note = [];
        if (maxRun >= 4) note.push('⚠️ ' + fa(maxRun) + ' صحنهٔ پشت‌سرهم ریتم «' + lastLbl + '» دارند؛ شاید لازم باشد جایی نفس بدهی یا شتاب بگیری.');
        if (counts.none && counts.none < scenes) note.push(fa(counts.none) + ' صحنه هنوز ریتم ندارد.');
        if (note.length) html += '<p class="nbx-muted nbx-rhy-note">' + note.join(' ') + '</p>';
    }
    html += '<div class="nbx-row" style="margin:8px 0 14px"><button type="button" class="nbx-btn nbx-rhy-go">🗂️ ویرایش ریتم صحنه‌ها در «ساختار»</button></div>';
    host.innerHTML = html;
    $('.nbx-rhy-go', host).onclick = function () { goStructure(); };
    $$('.nbx-rb[data-id]', host).forEach(function (b) { b.onclick = function () { goStructure(b.getAttribute('data-id')); }; });
}
function buildTimeTab() {
    var tab = $('#tab-time'); if (!tab) return;
    var mount = $('#nbx-timeline-mount', tab);
    if (mount) buildCardTab({ mount: mount, tabId: 'tab-time', id: 'nbx-timeline', key: '__timeline', pdfPrefix: 'رویداد', title: '🕰️ خط زمان رویدادها', unit: 'رویداد', add: 'رویداد تازه', titlePh: 'عنوان رویداد',
        desc: 'رویدادهای مهم جهان و داستان را به ترتیب زمانی بچین. هر چه را جابه‌جا کنی، شماره‌ها خودشان درست می‌شوند.',
        empty: 'خط زمانت خالی است. اولین رویداد را اضافه کن.',
        fields: [{ k: 'kind', type: 'select', label: 'نوع', opts: SEL_KIND_T }, { k: 'when', type: 'input', label: '⏳ کی؟', ph: 'سال، فصل، «سه روز پیش از جنگ»...' },
            { k: 'who', type: 'input', label: '👤 چه کسانی؟', ph: 'درگیرها و شاهدها' }, { k: 'note', type: 'textarea', label: '📜 چه شد و چه اثری گذاشت؟', ph: 'این رویداد چه چیزی را برای همیشه تغییر داد؟' }] });
    window.nbxShowTimePane = bindPanes(tab, '.nbx-time-seg', 'events');
}
var PANE_SHOW = {};
function bindPanes(tab, segSel, first) {
    var btns = $$(segSel + ' [data-pane]', tab);
    function showPane(name) {
        btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-pane') === name)); });
        $$('.nbx-pane', tab).forEach(function (p) { if (p.getAttribute('data-pane') === name) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); });
        growAll($$('.nbx-pane:not([hidden]) textarea', tab));
    }
    btns.forEach(function (b) { b.onclick = function () { showPane(b.getAttribute('data-pane')); }; });
    PANE_SHOW[tab.id] = showPane;
    showPane(first);
    return showPane;
}
function buildHubTab() {
    var tab = $('#tab-hub'); if (!tab) return;
    bindPanes(tab, '.nbx-hub-seg', 'idea');
}
window.nbxReveal = function (t) {
    try {
        var cc = t.closest && t.closest('.layer-card.nbx-coll'); if (cc && !cc.classList.contains('nbx-open')) setCardOpen(cc, true, false);
        var ed = t.closest && t.closest('.nbx-char-ed');
        if (ed) { showChar(ed.getAttribute('data-id')); var det = t.closest('details'); if (det) det.open = true; }
        var pane = t.closest && t.closest('.nbx-pane');
        if (pane) { var tb = pane.closest('.tab-content'), sh = tb && PANE_SHOW[tb.id]; if (sh) sh(pane.getAttribute('data-pane')); }
    } catch (e) {}
};

/* ======================================================================
   🎭 کهن‌الگوهای شخصیت + 📚 مینی‌آموزش (دفترچه نویسندگی)
   ====================================================================== */
/* هر مورد: id (= مقدار ذخیره‌شده در role)، group، name، desc (فقط برای مواردی که توضیح لازم دارند)، و متن اولیه (line/want/fear/secret/arc).
   start:true یعنی نام کارت هم با نام مورد پر شود؛ مواردی که متن اولیه ندارند فقط برچسب نقش می‌گذارند. */
var TYPES = [
    { id: 'hero', group: 'role', icon: '🗡️', name: 'قهرمان', label: 'قهرمان', start: true, desc: 'محور داستان؛ برای چیزی که می‌خواهد، از دنیای امنش بیرون می‌آید و در راه تغییر می‌کند.', line: 'کسی که برای چیزی بزرگ‌تر از خودش، از دنیای امن بیرون می‌آید', want: 'چیزی که فکر می‌کند کم دارد، و نیازی پنهان که هنوز نمی‌بیندش', fear: 'نالایق‌بودن یا از دست دادن آنچه دارد', secret: '', arc: 'از تردید به پذیرفتن مسئولیت' },
    { id: 'anti', group: 'role', icon: '🌓', name: 'ضدقهرمان', label: 'ضدقهرمان', desc: 'قهرمانی که راه یا اخلاقش خاکستری است؛ همراهش می‌شویم، حتی وقتی کارش درست نیست.' },
    { id: 'ally', group: 'role', icon: '🤝', name: 'همراه و یار', label: 'همراه و یار', start: true, desc: 'کنار قهرمان می‌ماند، ضعفش را جبران می‌کند و بار سفر را سبک‌تر می‌کند.', line: 'کسی که بار قهرمان را سبک می‌کند و ضعفش را جبران می‌کند', want: 'تعلق و دیده‌شدن', fear: 'تنها ماندن', secret: 'دلیل واقعی همراهی‌اش', arc: 'از دنباله‌روی به ایستادن روی پای خودش' },
    { id: 'mentor', group: 'role', icon: '🧭', name: 'مربی و راهنما', label: 'مربی و راهنما', start: true, desc: 'ابزار، دانش یا جرئت می‌دهد، اما راه را به‌جای قهرمان نمی‌رود.', line: 'راهنمایی که ابزار، دانش یا جرئت می‌دهد، اما راه را به‌جای قهرمان نمی‌رود', want: 'دیدن قهرمان در جایی که خودش نتوانست برسد', fear: 'تکرار شکست گذشتهٔ خودش', secret: 'زخمی که او را مربی کرد', arc: 'از نگه‌داشتن قهرمان به رها کردنش' },
    { id: 'rival', group: 'role', icon: '🏁', name: 'رقیب', label: 'رقیب', desc: 'همان چیزی را می‌خواهد که قهرمان می‌خواهد؛ لزوماً آدم بدی نیست.' },
    { id: 'villain', group: 'role', icon: '⛓️', name: 'شخصیت منفی', label: 'شخصیت منفی', desc: 'مانع اصلی داستان؛ خواسته‌اش مستقیم با قهرمان در تضاد است.' },
    { id: 'narrator', group: 'role', icon: '📖', name: 'راوی', label: 'راوی', desc: 'کسی که داستان از زبان یا نگاه او روایت می‌شود؛ می‌تواند خودش در ماجرا باشد یا بیرون از آن.' },
    { id: 'minor', group: 'role', icon: '👤', name: 'فرعی', label: 'فرعی', desc: 'در حاشیهٔ ماجرا حضور دارد، اما صحنه‌ها و دنیای داستان را زنده‌تر می‌کند.' },

    { id: 'shadow', group: 'arch', icon: '🌑', name: 'سایه', label: 'سایه', start: true, desc: 'آینهٔ تاریک قهرمان؛ همان خواسته را دارد، با بهایی که قهرمان نمی‌پردازد.', line: 'آینهٔ تاریک قهرمان؛ همان خواسته، با بهایی که قهرمان نمی‌پردازد', want: 'کنترل، انتقام یا نظمی که فقط خودش می‌فهمد', fear: 'بی‌اهمیت‌شدن یا لو رفتن ضعفش', secret: 'دلیلی که خودش را حق می‌داند', arc: 'ایستادن در برابر قهرمان تا حقیقت آشکار شود' },
    { id: 'trickster', group: 'arch', icon: '🃏', name: 'فریبکار', label: 'فریبکار', start: true, desc: 'شوخ و غیرقابل‌پیش‌بینی؛ قاعده‌ها را می‌شکند و غرورها را سوراخ می‌کند.', line: 'شوخ و غیرقابل‌پیش‌بینی؛ قاعده‌ها را می‌شکند و غرورها را سوراخ می‌کند', want: 'آزادی و خنده؛ فرار از جدی‌گرفتن خودش', fear: 'گیرافتادن در یک نقش', secret: 'ترس اصلی‌اش را پشت شوخی پنهان می‌کند', arc: 'از بازی‌کردن به انتخابی واقعی' },
    { id: 'herald', group: 'arch', icon: '📯', name: 'پیک', label: 'پیک', start: true, desc: 'خبر تغییر را می‌آورد و داستان را راه می‌اندازد؛ کسی یا حتی چیزی (نامه، رویا).', line: 'کسی یا چیزی که خبر تغییر را می‌آورد و داستان را راه می‌اندازد', want: 'رساندن پیام', fear: 'بی‌پاسخ ماندن پیام', secret: '', arc: 'یا کنار می‌رود، یا به ماجرا می‌پیوندد' },
    { id: 'guardian', group: 'arch', icon: '🚪', name: 'پاسبان آستانه', label: 'پاسبان آستانه', start: true, desc: 'مانعی که جدیت قهرمان را می‌آزماید، پیش از آنکه بگذارد رد شود.', line: 'مانعی که جدیتِ قهرمان را می‌آزماید پیش از آنکه بگذارد رد شود', want: 'نگه‌داشتن مرز، قانون یا جایگاه', fear: 'بی‌معنی‌شدن آستانه', secret: 'شاید راهی برای عبور بداند', arc: 'از مانع به متحد، یا از دشمن به درس' },
    { id: 'shifter', group: 'arch', icon: '🎭', name: 'دگردیس', label: 'دگردیس', start: true, desc: 'وفاداری و نیتش مبهم است؛ قهرمان نمی‌داند می‌تواند به او اعتماد کند یا نه.', line: 'وفاداری و نیتش مبهم است؛ قهرمان نمی‌داند می‌تواند به او اعتماد کند یا نه', want: 'برای هر کس چیزی متفاوت به نظر می‌رسد', fear: 'برملا شدن نیت واقعی', secret: 'طرف واقعی‌اش', arc: 'روشن‌شدن وفاداری در اوج' },
    { id: 'innocent', group: 'arch', icon: '🌱', name: 'معصوم', label: 'معصوم', start: true, desc: 'باورش به خوبی دنیا دست‌نخورده است؛ همین هم نقطهٔ ضعفش است و هم نیرویش.', line: 'باورش به خوبی دنیا دست‌نخورده است؛ ساده‌دلی‌اش هم ضعف است هم نیرو', want: 'امنیت، و اینکه دنیا همان‌قدر خوب باشد که فکر می‌کند', fear: 'خیانت و دیدن چهرهٔ واقعی دنیا', secret: '', arc: 'از خوش‌باوری به باوری آگاهانه' },
    { id: 'orphan', group: 'arch', icon: '🧳', name: 'یتیم', label: 'یتیم', start: true, desc: 'تنها یا طردشده؛ مثل خواننده بی‌قدرت شروع می‌کند و دنبال جایی برای تعلق است.', line: 'تنها یا طردشده؛ بی‌قدرت شروع می‌کند و دنبال جایی برای تعلق است', want: 'جایی که واقعاً به آن تعلق داشته باشد', fear: 'دوباره رها شدن', secret: 'زخمی که اعتماد را برایش سخت کرده', arc: 'از تنهایی به تعلق' },
    { id: 'lover', group: 'arch', icon: '💞', name: 'عاشق', label: 'عاشق', start: true, desc: 'هر انتخابش را عشق، دلبستگی یا وفاداری تعیین می‌کند.', line: 'هر انتخابش را عشق، دلبستگی یا وفاداری تعیین می‌کند', want: 'نزدیکی و پیوند', fear: 'ترک شدن', secret: 'چیزی که برای نگه‌داشتنش حاضر است همه‌چیز را ببازد', arc: 'از وابستگی به عشقی که آزاد می‌گذارد' },
    { id: 'sage', group: 'arch', icon: '🦉', name: 'خردمند', label: 'خردمند', start: true, desc: 'دنبال حقیقت است؛ می‌فهمد و می‌شناسد، اما فهمیدن همیشه به عمل نمی‌رسد.', line: 'دنبال حقیقت است؛ می‌فهمد، اما فهمیدن همیشه به عمل نمی‌رسد', want: 'فهمیدن حقیقت', fear: 'نادانی یا فریب خوردن', secret: 'حقیقتی که فهمیده و بر زبان نمی‌آورد', arc: 'از دانستن به عمل کردن' },
    { id: 'rebel', group: 'arch', icon: '🔥', name: 'یاغی', label: 'یاغی', start: true, desc: 'نظم موجود را نمی‌پذیرد و حاضر است برای تغییرش بها بپردازد.', line: 'نظم موجود را نمی‌پذیرد و حاضر است برای تغییرش بها بپردازد', want: 'شکستن قاعده‌ای که ظالمانه می‌داند', fear: 'بی‌اثر ماندن', secret: '', arc: 'از خشم به ساختن چیزی تازه' },
    { id: 'caregiver', group: 'arch', icon: '🫶', name: 'پرورنده', label: 'پرورنده', start: true, desc: 'مراقبت از دیگران هویت اوست؛ گاهی تا حد فراموش کردن خودش.', line: 'مراقبت از دیگران هویت اوست؛ گاهی تا حد فراموش کردن خودش', want: 'محافظت از آدم‌هایی که دوستشان دارد', fear: 'بی‌فایده شدن', secret: 'نیازی که هیچ‌وقت به زبان نمی‌آورد', arc: 'از فداکاری بی‌حد به مراقبت از خودش هم' },

    { id: 'rend', group: 'type', icon: '🍷', name: 'رند', label: 'رند', start: true, desc: 'زیرک و آزاده؛ ظاهراً سبک‌سر، اما حقیقت را با زبان طعنه می‌گوید.', line: 'زیرک و آزاده؛ ظاهراً سبک‌سر، اما حقیقت را با طعنه می‌گوید', want: 'آزادی از قید و ریا', fear: 'اسیر شدن در یک نقش', secret: 'جدی‌ترین باورش را پشت شوخی پنهان کرده', arc: '' },
    { id: 'naive', group: 'type', icon: '🐑', name: 'ساده‌دل', label: 'ساده‌دل', start: true, desc: 'خوش‌باور و بی‌غل‌وغش؛ دنیا را همان‌طور که می‌گویند باور می‌کند و همین گره می‌سازد.', line: 'خوش‌باور و بی‌غل‌وغش؛ حرف دیگران را همان‌طور که هست باور می‌کند', want: 'اینکه همه خوب باشند', fear: 'دعوا و تنها شدن', secret: '', arc: '' },
    { id: 'hypocrite', group: 'type', icon: '🕯️', name: 'ریاکار', label: 'ریاکار', start: true, desc: 'ظاهرش پارسا و باطنش خلاف آن؛ تضاد ظاهر و باطنش صحنه می‌سازد.', line: 'ظاهرش پارسا و باطنش خلاف آن است', want: 'آبرو و اعتماد دیگران', fear: 'افشا شدن', secret: 'کاری که پشت درهای بسته می‌کند', arc: '' },
    { id: 'miser', group: 'type', icon: '💰', name: 'خسیس', label: 'خسیس', start: true, desc: 'ترس از نداری یا عشق به مال همهٔ تصمیم‌هایش را می‌بندد.', line: 'ترس از نداری یا عشق به مال همهٔ تصمیم‌هایش را می‌بندد', want: 'امنیت مالی', fear: 'فقر', secret: 'خاطرهٔ نداری که هنوز تمام نشده', arc: '' },
    { id: 'javanmard', group: 'type', icon: '🛡️', name: 'جوانمرد', label: 'جوانمرد', start: true, desc: 'ظاهرش خشن اما اهل معرفت است؛ قولش قانونش است (مثل لوطی در قصه‌های قدیمی).', line: 'ظاهرش خشن اما اهل معرفت؛ قولش قانونش است', want: 'آبروی نام و قول', fear: 'زیر قول زدن', secret: '', arc: '' },
    { id: 'braggart', group: 'type', icon: '🎺', name: 'لافزن', label: 'لافزن', start: true, desc: 'بیش از آنچه هست ادعا می‌کند و از آشکار شدن واقعیت می‌ترسد.', line: 'بیش از آنچه هست ادعا می‌کند', want: 'تحسین دیگران', fear: 'امتحان شدن', secret: 'چیزی که واقعاً از آن می‌ترسد', arc: '' }
];
var TYPE_GROUPS = [
    { g: 'role', title: '🎬 نقش در داستان', sub: 'این شخصیت در داستان چه کاری می‌کند؟' },
    { g: 'arch', title: '🏛️ کهن‌الگوها', sub: 'الگوهای بنیادینی که در اسطوره و قصه‌ها بارها برمی‌گردند. با چند جملهٔ اولیه.' },
    { g: 'type', title: '🎩 تیپ‌های ادبی', sub: 'تیپ: آدمی که یک خصلت برجسته‌اش نمایندهٔ گروهی از مردم است؛ بیشتر در ادبیات کلاسیک و طنز.' }
];
/* انتخاب‌گر: همان یک پنجره برای ساخت شخصیت و برای عوض‌کردن نقش کارت. cb(null) = شخصیت انحصاری / بدون نقش */
function openTypePicker(changeOnly, cb) {
    var body = el('div', { 'class': 'nbx-mbody' });
    var h = '<p class="nbx-muted" style="margin:0 0 10px">' + (changeOnly ? 'فقط نقش و نوع کارت عوض می‌شود؛ متن‌هایی که نوشته‌ای دست‌نخورده می‌مانند.' : 'یکی را انتخاب کن تا کارتش ساخته شود. برای کهن‌الگوها و تیپ‌ها نمونه‌های راهنما به‌صورت متن کم‌رنگ در کادرها دیده می‌شود؛ با شروع نوشتن ناپدید می‌شوند و چیزی برای پاک‌کردن نیست.') + '</p>';
    h += '<div class="nbx-arch-grid"><button type="button" class="nbx-arch-card nbx-pk-own" data-pick="" style="grid-column:1/-1"><span class="ic">✍️</span><b>' + (changeOnly ? 'بدون نقش' : 'شخصیت انحصاری') + '</b><small>' + (changeOnly ? 'برچسب نقش برداشته شود.' : 'در هیچ قالبی نمی‌گنجد؛ کارت خالی، همه‌چیز را خودت می‌نویسی.') + '</small></button></div>';
    TYPE_GROUPS.forEach(function (G) {
        h += '<h4 class="nbx-pk-h">' + esc(G.title) + '</h4><p class="nbx-muted nbx-pk-s">' + esc(G.sub) + '</p><div class="nbx-arch-grid">';
        TYPES.filter(function (t) { return t.group === G.g; }).forEach(function (t) {
            h += '<button type="button" class="nbx-arch-card" data-pick="' + esc(t.id) + '"><span class="ic">' + t.icon + '</span><b>' + esc(t.name) + '</b>' + (t.desc ? '<small>' + esc(t.desc) + '</small>' : '') + '</button>';
        });
        h += '</div>';
    });
    body.innerHTML = h;
    var m = openModal(changeOnly ? 'نقش و نوع این شخصیت' : 'شخصیت تازه: از کجا شروع کنیم؟', body);
    body.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick]'); if (!b) return;
        var id = b.getAttribute('data-pick'), t = TYPES.filter(function (x) { return x.id === id; })[0] || null;
        m.close();
        cb(t);
    });
}
var LEARN = [
    { icon: '💬', title: 'دیالوگ‌نویسی', tips: [
        'هر دیالوگ باید یک کار بکند: اطلاعات بدهد، شخصیت را نشان بدهد یا کشمکش بسازد. اگر دو کار بکند، عالی است.',
        'آدم‌ها کمتر آنچه واقعاً می‌خواهند را مستقیم می‌گویند. زیرمتن بساز: حرفی زده می‌شود، منظور چیز دیگری است.',
        'برای هر شخصیت یک ریتم جمله پیدا کن؛ کوتاه و بُرنده یا بلند و دوپهلو. اگر اسم‌ها را برداری، باید بشود حدس زد چه کسی حرف می‌زند.',
        'دیالوگ توضیحی ننویس: چیزی را که هر دو شخصیت می‌دانند، فقط برای خواننده نگو.',
        'مکث، حرف را قطع‌کردن و جواب‌ندادن هم دیالوگ است؛ لازم نیست هر جمله پاسخ مستقیم بگیرد.'],
      ex: 'دو نفر سر میز شام‌اند؛ یکی باید خبر بدی بدهد و نمی‌تواند. بدون گفتن خبر، صحنه را در ده جمله بنویس.' },
    { icon: '🪢', title: 'گره‌افکنی', tips: [
        'گره از خواستهٔ شخصیت می‌آید. چیزی که می‌خواهد را سخت‌تر کن، نه اینکه اتفاقی تصادفی بیندازی وسط.',
        'هر گره باید هزینه داشته باشد: اگر شکست بخورد، چه چیزی از دست می‌دهد؟',
        'صحنه‌ها را با «ولی» و «بنابراین» به هم وصل کن، نه با «و بعد». هر صحنه باید نتیجهٔ قبلی و علت بعدی باشد.',
        'بزرگ‌ترین گره‌ها را از انتخاب‌های اشتباه اما قابل‌فهمِ خود قهرمان بساز.',
        'برای پیچش، سرنخ‌های ریز را زودتر بکار تا غافلگیری «حق» باشد، نه فریب.'],
      ex: 'شخصیتت فقط می‌خواهد یک تلفن بزند. سه مانع پشت سر هم بنویس که هرکدام از قبلی بدتر باشد.' },
    { icon: '🎣', title: 'شروع جذاب', tips: [
        'جایی شروع کن که چیزی در حال تغییر است؛ نه بیدارشدن صبح و نه توضیح جهان.',
        'یک پرسش در ذهن خواننده بکار (چرا؟ چه می‌شود؟) و جوابش را عقب بینداز.',
        'صدا و لحن را از جملهٔ اول مشخص کن؛ خواننده باید بفهمد با چه کسی طرف است.',
        'یک جزئیات خاص از ده جزئیات عمومی بهتر است.',
        'بعد از تمام‌شدن کتاب شروع را دوباره بخوان؛ گاهی شروع واقعی، پاراگراف دوم یا سوم است.'],
      ex: 'یک صحنهٔ آغازین را سه بار بنویس: با یک دیالوگ، با یک عمل، با یک جزئیات عجیب. کدام قلاب بهتری دارد؟' },
    { icon: '🏁', title: 'پایان‌بندی', tips: [
        'پایان خوب هم غافلگیرکننده است و هم اجتناب‌ناپذیر؛ خواننده بعدش بگوید «معلوم بود، ولی نمی‌دیدمش».',
        'چیزهایی که در شروع کاشته‌ای در پایان باید معنا بگیرند؛ پایان از دل آغاز می‌آید.',
        'پرسش محوری داستان را جواب بده، حتی اگر جواب تلخ باشد.',
        'بعد از اوج زیاد کش نیا؛ چند صحنهٔ کوتاه برای فرود کافی است.',
        'پایان باز هم باید حس تمام‌شدن بدهد؛ سؤال را باز بگذار، نه تصمیمی را که نویسنده باید می‌گرفت.',
        'آخرین تصویر یا جمله را با دقت انتخاب کن؛ همان چیزی است که در ذهن خواننده می‌ماند.'],
      ex: 'پایان داستانت را در سه نسخه بنویس: تلخ، امیدوار و باز. کدام یک به تم اصلی نزدیک‌تر است؟' },
    { icon: '🎭', title: 'زاویهٔ دید و راوی', tips: [
        'اول‌شخص صمیمی و محدود است؛ سوم‌شخص محدود فاصلهٔ بیشتری می‌دهد؛ دانای کل دید وسیع می‌دهد ولی تعلیق را کم می‌کند.',
        'راوی فقط چیزی را می‌داند که شخصیتِ زاویهٔ دید می‌تواند بداند؛ از دانستنِ بی‌دلیل بپرهیز.',
        'لحن راوی را با شخصیتِ زاویهٔ دید هماهنگ کن؛ هر کس جهان را جور دیگری می‌بیند.',
        'راوی غیرقابل‌اعتماد ابزار قدرتمندی است ولی باید سرنخ‌هایی بگذاری که خواننده بتواند دروغ را بفهمد.',
        'تغییر زاویهٔ دید را با فصل یا صحنهٔ تازه انجام بده، نه وسط یک پاراگراف.'],
      ex: 'یک صحنهٔ دعوا را یک بار از دید یکی و یک بار از دید دیگری بنویس. چه چیزهایی تغییر کرد؟' },
    { icon: '🌆', title: 'توصیف و فضاسازی', tips: [
        'فقط چیزی را توصیف کن که به حس صحنه یا به داستان کمک می‌کند؛ بقیه را حذف کن.',
        'از حواس پنج‌گانه استفاده کن، نه فقط دیدن: بو، صدا، لمس و مزه فضا را زنده می‌کنند.',
        'توصیف را از چشم شخصیت بنویس؛ چیزی که او می‌بیند حال و اندیشهٔ او را هم نشان می‌دهد.',
        'یک جزئیات خاص و غیرمنتظره از ده صفت کلی بهتر است.',
        'توصیف را لابه‌لای حرکت بنویس، نه در یک بلوک طولانی که داستان را متوقف می‌کند.'],
      ex: 'یک اتاق را از دید کسی بنویس که همین حالا خبر بدی شنیده. از کلمهٔ «غمگین» استفاده نکن.' },
    { icon: '🕰️', title: 'ریتم و تعلیق', tips: [
        'جمله‌ها و صحنه‌های کوتاه سرعت می‌دهند؛ جمله‌های بلند مکث و تأمل می‌سازند.',
        'تعلیق از فاصلهٔ بین پرسش و پاسخ ساخته می‌شود؛ پاسخ را عقب بینداز.',
        'اگر خواننده چیزی بداند که شخصیت نمی‌داند، نگرانی ساخته می‌شود؛ این از غافلگیری قوی‌تر است.',
        'بعد از یک صحنهٔ پرتنش، یک صحنهٔ آرام بگذار تا تنش بعدی اثر بگیرد.',
        'ریتم یک‌نواخت، حتی اگر همه‌اش هیجان باشد، خسته‌کننده می‌شود.'],
      ex: 'یک صحنهٔ تعقیب را دو بار بنویس: یک بار با جمله‌های کوتاه و تند، یک بار با جمله‌های بلند و کند. کدام ترسناک‌تر است؟' },
    { icon: '💭', title: 'درون‌نگری و افکار شخصیت', tips: [
        'افکار شخصیت را وقتی نشان بده که تصمیم یا تضادی در کار است، نه برای توضیح چیزهایی که از عمل معلوم است.',
        'فکر باید جدید بگوید؛ اگر فقط حرف یا کار شخصیت را تکرار می‌کند، حذفش کن.',
        'تضاد میان فکر و عمل شخصیت را جذاب می‌کند: آنچه فکر می‌کند، آنچه می‌گوید و آنچه انجام می‌دهد.',
        'درون‌نگری را کوتاه و در لحظهٔ درست بگذار؛ نه وسط اوج صحنه.',
        'گاهی بهترین درون‌نگری یک عمل کوچک و گویا است.'],
      ex: 'یک تصمیم سخت را فقط با عمل و بدون هیچ فکر یا توضیحی نشان بده. خواننده چه چیزی را می‌فهمد؟' },
    { icon: '✂️', title: 'ویرایش و بازنویسی', tips: [
        'اول ساختار را اصلاح کن (صحنه‌ها، ترتیب، قوس شخصیت)، بعد جمله‌ها را.',
        'هر صحنه را بپرس: چه چیزی عوض می‌شود؟ اگر هیچ، شاید لازم نباشد.',
        'جمله‌های زائد، تکرارها و قیدهای بی‌کاربرد را حذف کن.',
        'کلیشه‌ها را پیدا کن و جایشان جزئیات خودت را بگذار.',
        'متن را بلند بخوان؛ ریتم لنگ و دیالوگ ساختگی را گوش راحت‌تر پیدا می‌کند.',
        'چند روز از متن فاصله بگیر و دوباره برگرد؛ چشم تازه خطاها را بهتر می‌بیند.'],
      ex: 'یک پاراگراف خودت را به نصف کوتاه کن، بی‌آنکه چیزی از معنا کم شود.' },
    { icon: '🧪', title: 'شخصیت زنده', tips: [
        'شخصیت یعنی خواسته + مانع؛ بدون این دو داستان حرکت نمی‌کند.',
        'میان خواستهٔ آگاهانه و نیاز ناخودآگاه فاصله بگذار؛ قوس شخصیت از همین فاصله ساخته می‌شود.',
        'تناقض بده: آدم‌ها همیشه با خودشان یکی نیستند.',
        'عادت‌ها و رفتارهای ریز (مثل جویدن لب یا کج‌کردن سر) شخصیت را باورپذیر می‌کنند.',
        'ضدقهرمان هم خودش را آدم خوبِ داستان می‌داند؛ دلیل‌هایش را جدی بنویس.'],
      ex: 'یک شخصیت را فقط با سه عادت کوچک معرفی کن، بدون هیچ توصیف مستقیمی از شخصیتش.' }
];
function buildLearnTab() {
    var nav = $('nav');
    if (!nav || !$('.tab-content') || $('#tab-learn')) return;
    var tab = el('div', { id: 'tab-learn', 'class': 'tab-content' });
    var h = '';
    LEARN.forEach(function (l, i) {
        h += '<details class="layer-card nbx-layer nbx-learn"><summary><h3>' + l.icon + ' ' + esc(l.title) + '</h3></summary><ul class="nbx-tips">' +
            l.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul><div class="nbx-ex"><b>✍️ تمرین:</b> ' + esc(l.ex) + '</div></details>';
    });
    tab.innerHTML = h;
    buildGuide(tab);
    placeTab(tab);
    nav.appendChild(el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-learn')" }, '📚 ' + fa($$('nav .nav-link').length + 1) + '. مینی‌آموزش'));
}
function buildToolbarMenu() {
    var tb = $('.project-toolbar');
    if (!tb || $('.nbx-tb-more', tb)) return;
    var kids = Array.prototype.slice.call(tb.children).filter(function (c) { return !c.querySelector || !c.querySelector('#project-select'); });
    var panel = el('div', { 'class': 'nbx-tb-panel', id: 'nbx-tb-panel' });
    var more = el('button', { 'class': 'btn-toolbar nbx-tb-more', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nbx-tb-panel' }, '');
    more.innerHTML = '<span class="nbx-tb-ic" aria-hidden="true">⚙️</span><span class="nbx-tb-tx">' + (isReader ? 'مدیریت کتاب' : 'مدیریت پروژه') + '</span><span class="nbx-tb-ch" aria-hidden="true">▾</span>';
    more.title = 'نام‌گذاری، بک‌آپ، بارگذاری، جستجو، حذف و ...';
    tb.appendChild(more); tb.appendChild(panel);
    kids.forEach(function (k) { panel.appendChild(k); });
    function setOpen(o) { panel.classList.toggle('open', o); more.setAttribute('aria-expanded', String(o)); }
    more.onclick = function () { setOpen(!panel.classList.contains('open')); };
    panel.addEventListener('click', function (e) {
        var b = e.target.closest('button,a');
        if (b && !e.target.closest('#search-box')) setTimeout(function () { setOpen(false); }, 60);
    });
    var sb = $('#search-box');
    if (sb) sb.addEventListener('keydown', function (e) { if (e.key === 'Enter') setTimeout(function () { setOpen(false); }, 60); });
}
function buildCardTabs() {
    buildCharacters();
    buildTimeTab();
    if ($('#nbx-rules-mount')) buildCardTab({ mount: $('#nbx-rules-mount'), tabId: 'tab-world', id: 'nbx-rules', key: '__rules', pdfPrefix: 'قانون', title: '📌 قانون‌ها و تابوهای مشخص', unit: 'قانون', add: 'قانون یا تابوی تازه', titlePh: 'خودِ قانون یا تابو در یک جمله',
        desc: 'هر قانون یا تابو را جدا ثبت کن و به صحنه‌هایی وصلش کن که اجرا یا شکسته می‌شود. قانونی که در هیچ صحنه‌ای نیست، هنوز به داستانت اثر نگذاشته؛ و برای کنترل تناقض‌ها همین فهرست را ببین.',
        empty: 'هنوز قانونی ثبت نکرده‌ای. هر چیزی که دنیای تو را از بقیه جدا می‌کند، از اینجا شروع می‌شود.',
        fields: [{ k: 'kind', type: 'select', label: 'نوع', opts: SEL_KIND_R },
            { k: 'cost', type: 'textarea', label: '💸 بها یا مجازاتش چیست؟', ph: 'اجرایش چه هزینه‌ای دارد؟ یا نقضش چه مجازاتی؟' },
            { k: 'breaks', type: 'textarea', label: '🔥 اگر شکسته شود چه می‌شود؟', ph: 'این همان جایی است که صحنه‌های خوب می‌سازد...' }],
        decorate: function (c) { var foot = $('.nbx-card-foot', c); foot.parentNode.insertBefore(el('div', { 'class': 'nbx-lk nbx-lk-box', 'data-kind': 'rules', 'data-eid': c.getAttribute('data-id') }), foot); },
        onDelete: function (id) { unlinkEntity('rules', id); }, onChange: function () { refreshLinksSoon(); },
        pdfExtra: function (c) { var sc = scenesOf('rules', c.id).map(cardLabel); return sc.length ? [{ label: 'به‌کار رفته در', value: sc.join('، ') }] : []; } });
    if ($('#nbx-sources-mount')) buildCardTab({ mount: $('#nbx-sources-mount'), tabId: 'tab-hub', id: 'nbx-sources', key: '__sources', pdfPrefix: 'منبع', title: '📚 منابع من', unit: 'منبع', add: 'منبع تازه', titlePh: 'نام کتاب، مقاله، فیلم یا سایت',
        desc: 'هر چیزی که برای باورپذیری داستانت می‌خوانی یا می‌بینی، با اینکه کجا پیدایش کنی و چه چیزی از آن لازم داری.',
        empty: 'هنوز منبعی ثبت نکرده‌ای.',
        fields: [{ k: 'kind', type: 'select', label: 'نوع', opts: SEL_KIND_S }, { k: 'where', type: 'input', label: '📍 کجا پیدایش کنم؟', ph: 'لینک، نام کتابخانه، آدرس یا اسم کسی که می‌شناسد' },
            { k: 'need', type: 'textarea', label: '💡 چه چیزی از آن لازم دارم؟', ph: 'مثلاً: جزئیات لباس و ابزار آن دوره' }, { k: 'state', type: 'select', label: 'وضعیت', opts: SEL_STATE_S }] });
    if ($('#nbx-names-mount')) buildCardTab({ mount: $('#nbx-names-mount'), tabId: 'tab-hub', id: 'nbx-names', key: '__names', pdfPrefix: 'اسم', title: '🏷️ ایدهٔ اسم‌ها', unit: 'اسم', add: 'اسم تازه', titlePh: 'اسم پیشنهادی',
        desc: 'اسم شخصیت‌ها، مکان‌ها و گروه‌ها را اینجا جمع کن؛ کنار هر اسم بنویس چه حسی یا معنایی دارد و کاندید است یا انتخاب شده.',
        empty: 'هنوز اسمی ننوشته‌ای.',
        fields: [{ k: 'kind', type: 'select', label: 'برای چیست؟', opts: SEL_KIND_N }, { k: 'meaning', type: 'input', label: '🪞 معنی یا حسی که دارد', ph: 'مثلاً: «آرام» اما در داستان کنایه است' },
            { k: 'state', type: 'select', label: 'وضعیت', opts: SEL_STATE_N }] });
    buildHubTab();
    buildCardTab({ id: 'tab-places', key: '__places', nav: '🗺️ ۸. مکان‌ها', title: '🗺️ مکان‌های داستان', unit: 'مکان', add: 'مکان تازه', titlePh: 'نام مکان',
        desc: 'هر مکان فقط یک جا نیست؛ حس و رازی دارد. برایش کارت بساز.',
        empty: 'هنوز مکانی ثبت نکرده‌ای.',
        fields: [{ k: 'kind', type: 'select', label: 'نوع', opts: SEL_KIND_P }, { k: 'feel', type: 'input', label: '🌫️ حس و فضا', ph: 'مثلاً: سرد، سنگین، پر از بوی کاغذ' },
            { k: 'look', type: 'textarea', label: '👁️ چه می‌بینی، می‌شنوی و می‌بویی؟', ph: 'جزئیاتی که این مکان را فقط مال خودش می‌کند...' },
            { k: 'role', type: 'textarea', label: '🎬 اینجا چه اتفاقی می‌افتد؟', ph: 'صحنه‌هایی که در این مکان رخ می‌دهند...' }, { k: 'secret', type: 'textarea', label: '🗝️ چه چیزی اینجا پنهان است؟', ph: 'رازی که مکان نگه داشته...' }] });
    buildCardTab({ id: 'tab-lines', key: '__lines', nav: '✨ ۹. جعبهٔ جمله‌ها', title: '✨ جعبهٔ جمله‌ها', unit: 'جمله', add: 'جملهٔ تازه', titlePh: 'جمله، دیالوگ یا توصیف',
        desc: 'جمله‌ها و دیالوگ‌هایی که نوشتی و دوستشان داری، یا جرقه‌هایی که می‌خواهی جایی استفاده کنی.',
        empty: 'جعبه خالی است؛ اولین جملهٔ خوبت را اینجا نگه دار.',
        fields: [{ k: 'kind', type: 'select', label: 'نوع', opts: SEL_KIND_L }, { k: 'where', type: 'input', label: '📍 مال کدام صحنه یا شخصیت؟', ph: 'اختیاری' }, { k: 'note', type: 'textarea', label: '💭 چرا دوستش داری؟', ph: 'چه حسی در آن هست؟' }] });
}
var MIXED_TABS = { 'tab-time': 1, 'tab-world': 1, 'tab-hub': 1 };
function cardTabSection(id) {
    var ts = CTABS.filter(function (x) { return x.tabId === id; }); if (!ts.length) return null;
    var cards = [], n = 0;
    ts.forEach(function (t) {
        var k = 0;
        t.cards().forEach(function (c) {
            var items = [];
            t.cfg.fields.forEach(function (f) {
                var v = (c[f.k] || '').trim(); if (!v) return;
                if (f.type === 'select') { var o = f.opts.filter(function (x) { return x[0] === v; })[0]; if (o) items.push({ label: 'نوع', value: o[1] }); }
                else items.push({ label: f.label.replace(/^[^\s]+\s/, ''), value: v });
            });
            if (t.cfg.pdfExtra) items = items.concat(t.cfg.pdfExtra(c));
            if (!(c.title || '').trim() && !items.length) return;
            k++; n++; cards.push({ title: (t.cfg.pdfPrefix ? t.cfg.pdfPrefix + ' ' : '') + fa(k) + '. ' + ((c.title || '').trim() || 'بدون عنوان'), items: items.length ? items : [{ label: '—', value: '—' }] });
        });
    });
    return { cards: cards, count: n };
}
var TPL_KISHO = [['کی (معرفی)', 'آدم‌ها، جا و فضا را بی‌هیچ کشمکش بزرگی معرفی کن؛ دنیای عادی.'], ['شو (گسترش)', 'همان دنیا را عمیق‌تر کن؛ جزئیات و رابطه‌ها، هنوز بدون گره.'], ['تن (چرخش)', 'عنصری غیرمنتظره وارد می‌شود و نگاه به همه‌چیز را عوض می‌کند.'], ['کتسو (پیوند)', 'معنای تازه‌ای که از برخورد بخش‌های قبلی می‌آید؛ نتیجه، نه لزوماً حل کشمکش.']];
var TPL_EIGHT = [['توالی ۱: وضعیت اولیه و حادثهٔ آغازگر', 'دنیای عادی و اتفاقی که آن را به هم می‌زند.'], ['توالی ۲: دوراهی و تصمیم', 'شخصیت در تنگنا می‌افتد و تصمیمی می‌گیرد که او را وارد ماجرا می‌کند.'], ['توالی ۳: نخستین مانع', 'تلاش‌های اول و برخورد با مانع‌های بزرگ‌تر از انتظار.'], ['توالی ۴: نقطهٔ میانی', 'اولین اوج؛ پیروزی یا شکستی که قواعد بازی را عوض می‌کند.'], ['توالی ۵: تغییر مسیر', 'پیامد نقطهٔ میانی؛ شخصیت راهش را اصلاح می‌کند و فشار بالا می‌رود.'], ['توالی ۶: همه‌چیز از دست می‌رود', 'اوج پرده دوم؛ سقوط و تاریک‌ترین لحظه.'], ['توالی ۷: تلاش آخر', 'شخصیت تصمیم تازه‌ای می‌گیرد و گره آخر باز می‌شود.'], ['توالی ۸: اوج و فرجام', 'رویارویی نهایی و دنیای تازه.']];
var TPL_HERO = [['دنیای عادی', 'زندگی قهرمان پیش از ماجرا.'], ['دعوت به ماجرا', 'اتفاقی که آرامش را به هم می‌زند.'], ['امتناع', 'قهرمان تردید می‌کند یا می‌ترسد.'], ['دیدار با مربی', 'کسی که راه یا ابزار می‌دهد.'], ['گذر از آستانه', 'ورود به دنیای تازه.'], ['آزمون‌ها و یاران و دشمنان', 'قواعد دنیای تازه را یاد می‌گیرد.'], ['نزدیک شدن به غار پنهان', 'آماده‌شدن برای بزرگ‌ترین چالش.'], ['آزمون سخت', 'نقطهٔ سقوط یا مرگِ نمادین.'], ['پاداش', 'چیزی که به‌دست می‌آورد.'], ['راه بازگشت', 'تعقیب و فشار پایانی.'], ['رستاخیز', 'آخرین آزمون و دگرگونی.'], ['بازگشت با اکسیر', 'چه چیزی با خود به خانه می‌آورد؟']];
var TPL_CIRCLE = [['منطقهٔ راحتی', 'شخصیت در دنیای آشنایش است؛ زندگی روزمره و عادت‌ها.'], ['نیاز', 'چیزی کم است یا می‌خواهد؛ ناراحتی‌ای که او را تکان می‌دهد.'], ['ورود به دنیای ناشناخته', 'از مرز می‌گذرد؛ یا تصمیم می‌گیرد یا مجبور می‌شود.'], ['سازگاری', 'قواعد دنیای تازه را می‌آموزد، با آزمون و خطا.'], ['دریافت', 'آنچه می‌خواست را به دست می‌آورد.'], ['بها', 'دریافتن هزینه دارد؛ چیزی از دست می‌رود یا بدتر می‌شود.'], ['بازگشت', 'به دنیای آشنا برمی‌گردد.'], ['تغییر', 'حالا فرق کرده است؛ آنچه آموخته چه تغییری در او یا دنیایش ساخته؟']];
var TPL_FREYTAG = [['مقدمه', 'معرفی شخصیت‌ها، فضا و موقعیت آغازین.'], ['اوج‌گیری', 'کشمکش شکل می‌گیرد و بالا می‌رود.'], ['نقطهٔ اوج', 'بزرگ‌ترین رویارویی و نقطهٔ چرخش داستان.'], ['فرود', 'پیامدهای اوج؛ گره‌ها یکی‌یکی باز می‌شوند.'], ['گره‌گشایی', 'فرجام؛ تکلیف کشمکش اصلی روشن می‌شود.']];
var TPL_STC = [['تصویر آغازین', 'عکسِ «پیش از» زندگی قهرمان؛ لحن داستان و نقصی که باید درست شود.'], ['بیان موضوع', 'کسی (نه الزاماً قهرمان) جمله‌ای می‌گوید که درس اصلی داستان است، و قهرمان هنوز آن را نمی‌شنود.'], ['آماده‌سازی', 'دنیای عادی، آدم‌های مهم و چیزهایی که باید بعداً درست شوند.'], ['حادثهٔ آغازگر', 'اتفاقی که زندگی عادی را برمی‌گرداند.'], ['تردید', 'آیا باید برود؟ آخرین مقاومت پیش از تصمیم.'], ['ورود به پرده دوم', 'انتخاب فعالِ قهرمان؛ قدم گذاشتن در دنیای وارونه.'], ['داستان فرعی (B)', 'رابطه‌ای که درس موضوع را می‌رساند: عشق، دوستی یا مربی.'], ['سرگرمی و بازی', 'وعدهٔ اصلی داستان؛ چیزی که خواننده برایش آمده.'], ['نقطهٔ میانی', 'پیروزی یا شکستِ دروغین؛ ریسک بالا می‌رود و ساعت شروع می‌شود.'], ['بدها نزدیک می‌شوند', 'فشار بیرونی بیشتر و شکاف درون گروه عمیق‌تر می‌شود.'], ['همه‌چیز از دست رفته', 'ضربهٔ سنگین؛ چیزی (یا کسی) می‌میرد یا تمام می‌شود.'], ['شب تاریک روح', 'ته چاه؛ لحظهٔ سوگ و پذیرش حقیقت.'], ['ورود به پرده سوم', 'جرقه‌ای که راه را نشان می‌دهد؛ داستان اصلی و فرعی به هم می‌رسند.'], ['پایان‌بندی', 'اجرای نقشه با آنچه تازه آموخته؛ اوج و رویارویی.'], ['تصویر پایانی', 'وارونهٔ تصویر آغازین؛ نشان بده چقدر عوض شده.']];
var TPL_SEVEN = [['قلاب', 'وضعیت آغاز؛ چیزی که توجه را می‌گیرد.'], ['نقطهٔ چرخش اول', 'ورود به ماجرای اصلی.'], ['فشار اول', 'نیروی مخالف بزرگ‌تر از انتظار.'], ['نقطهٔ میانی', 'حقیقتی آشکار می‌شود؛ قهرمان از واکنش به عمل می‌رسد.'], ['فشار دوم', 'همه‌چیز بدتر می‌شود.'], ['نقطهٔ چرخش دوم', 'آخرین قطعهٔ پازل.'], ['فرجام', 'رویارویی نهایی و نتیجه.']];

/* ======================================================================
   📌 یادداشت‌های چسبان (روی هر تب)
   ====================================================================== */
var saveStickies = debounce(function () {
    var map = {};
    $$('.nbx-sticky-zone').forEach(function (z) {
        var arr = $$('.nbx-sticky', z).map(function (s) { return { id: s.getAttribute('data-id'), t: $('.nbx-st-text', s).textContent }; }).filter(function (x) { return x.t.trim(); });
        if (arr.length) map[z.getAttribute('data-tab')] = arr;
    });
    patchData(activeId(), function (d) { d.__stickies = map; });
}, 500);
function addSticky(zone, data, focus) {
    var s = el('div', { 'class': 'nbx-sticky', 'data-id': data.id || uid() });
    s.innerHTML = '<i class="nbx-tape"></i><button type="button" class="nbx-st-x" aria-label="حذف یادداشت">✕</button><div class="nbx-st-text" contenteditable="true" role="textbox" aria-label="یادداشت چسبان" data-ph="یادداشتت را بنویس..."></div>';
    var tx = $('.nbx-st-text', s); tx.textContent = data.t || '';
    tx.addEventListener('input', saveStickies);
    tx.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text'); document.execCommand('insertText', false, t); });
    tx.addEventListener('blur', function () { if (!tx.textContent.trim()) { s.remove(); saveStickies(); } });
    $('.nbx-st-x', s).onclick = function () { s.remove(); saveStickies(); };
    $('.nbx-stickies', zone).appendChild(s);
    if (focus) tx.focus();
}
function buildStickies() {
    $$('.tab-content').forEach(function (tab) {
        if ($('.nbx-sticky-zone', tab)) return;
        var z = el('div', { 'class': 'nbx-sticky-zone', 'data-tab': tab.id });
        z.innerHTML = '<div class="nbx-stickies"></div><button type="button" class="nbx-btn nbx-addsticky">📌 یادداشت چسبان</button>';
        tab.insertBefore(z, tab.firstChild);
        $('.nbx-addsticky', z).onclick = function () { addSticky(z, { id: uid(), t: '' }, true); };
    });
}
async function refreshStickies() {
    var d = await getData(activeId()), map = d.__stickies || {};
    $$('.nbx-sticky-zone').forEach(function (z) {
        $('.nbx-stickies', z).innerHTML = '';
        (map[z.getAttribute('data-tab')] || []).forEach(function (x) { addSticky(z, x, false); });
    });
}

/* ---------- استایل بخش‌های جدید ---------- */
document.head.appendChild(el('style', { id: 'nbx-css3' }, [
    '.nbx-in,.nbx-formbox select,.nbx-formbox textarea{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:10px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;font-size:.9rem}',
    '.nbx-formbox{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:var(--nbx-in);border:1px dashed var(--nbx-bd)}',
    '.nbx-formbox textarea{min-height:84px}',
    '.nbx-seg{display:flex;gap:6px;padding:10px 18px 0;overflow-x:auto;white-space:nowrap}',
    '.nbx-quote{padding:12px 14px;margin:8px 0;border-radius:12px;background:var(--nbx-in);border:1px solid var(--nbx-bd);border-right:5px solid var(--nbx-ac)}',
    '.nbx-q-t{font-size:1.02rem;line-height:2;font-weight:600}.nbx-q-m{margin-top:4px;font-size:.82rem;color:var(--nbx-mut)}',
    '.nbx-cmp{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.nbx-cmp-h{padding:8px;border-radius:10px;background:var(--nbx-acd);color:#fff;text-align:center;font-weight:700;font-size:.9rem}',
    'html.nb-dark .nbx-cmp-h{background:#4d3f22;color:#f3e3b4}',
    '.nbx-cmp-l{grid-column:1/-1;margin-top:8px;font-weight:700;font-size:.85rem;color:var(--nbx-acd)}',
    '.nbx-cmp-c{padding:10px;border-radius:10px;background:var(--nbx-in);border:1px solid var(--nbx-bd);font-size:.88rem;line-height:1.9;overflow-wrap:anywhere;color:var(--nbx-tx)}',
    '.nbx-sticky-zone{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;margin:0 0 14px}',
    '.nbx-stickies{display:contents}',
    '.nbx-addsticky{padding:6px 12px;font-size:.8rem;opacity:.9}',
    '.nbx-sticky{position:relative;width:min(230px,46%);min-width:150px;padding:20px 14px 12px;background:#fff0a3;color:#4a3a1a;border-radius:3px 3px 12px 3px;box-shadow:2px 5px 10px rgba(80,60,0,.25);transform:rotate(-1.5deg);font-family:Vazirmatn,Tahoma,sans-serif}',
    '.nbx-sticky:nth-child(even){transform:rotate(1.6deg);background:#ffe0ec}.nbx-sticky:nth-child(3n){transform:rotate(-.6deg);background:#dff3e4}',
    'html.nb-dark .nbx-sticky{background:#5b4a24;color:#f3e3b4;box-shadow:2px 5px 10px rgba(0,0,0,.5)}html.nb-dark .nbx-sticky:nth-child(even){background:#523444}html.nb-dark .nbx-sticky:nth-child(3n){background:#2f4a3e}',
    '.nbx-tape{position:absolute;top:-9px;left:50%;width:60px;height:18px;margin-left:-30px;background:rgba(255,255,255,.55);transform:rotate(2deg)}',
    '.nbx-st-x{position:absolute;top:2px;left:4px;width:22px;height:22px;border:0;border-radius:50%;background:rgba(0,0,0,.08);color:inherit;cursor:pointer;font-size:.7rem;padding:0}',
    '.nbx-st-text{min-height:48px;outline:none;line-height:1.9;font-size:.9rem;white-space:pre-wrap;overflow-wrap:anywhere}',
    '.nbx-st-text:empty::before{content:attr(data-ph);opacity:.55}',
    '@media(max-width:600px){.nbx-sticky{width:calc(50% - 8px);min-width:140px}.nbx-cmp-c{font-size:.82rem;padding:8px}}',
    '.nbx-ct-l{display:block;margin:8px 0 3px;font-weight:700;font-size:.82rem;color:var(--nbx-acd)}',
    '.nbx-card.ct{flex-wrap:nowrap}.nbx-card.ct select{margin-top:6px;width:auto;min-width:150px}',
    '.nbx-ct-list .nbx-card .nbx-title.nbx-line{font-weight:500}',
    'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(8){background:#ffe7b3!important}html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(9){background:#d3e5f7!important}',
    'html.nbx-writer[data-tab="7"]{--tint:#ffe7b3;--acc:#e3b93f;--accd:#8a6a12;--ml:rgba(227,185,63,.6)}html.nbx-writer[data-tab="8"]{--tint:#d3e5f7;--acc:#6fa6da;--accd:#2d5f94;--ml:rgba(111,166,218,.6)}',
    'html.nbx-writer:not(.nb-dark)[data-tab="7"]{--pt:#fff0c8}html.nbx-writer:not(.nb-dark)[data-tab="8"]{--pt:#dbe9f8}',
    'html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(8){background:#5a4a1f!important}html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(9){background:#2f435c!important}',
    'html.nbx-writer.nb-dark[data-tab="7"]{--accd:#e8c86a}html.nbx-writer.nb-dark[data-tab="8"]{--accd:#9cc4ec}',
    /* رنگ پاستلی تب‌های ۱۰ تا ۱۳ نویسنده */
    'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(10){background:#d9ecc2!important}',
    'html.nbx-writer[data-tab="9"]{--tint:#d9ecc2;--acc:#9bc25c;--accd:#567a1f;--ml:rgba(155,194,92,.6)}',
    'html.nbx-writer:not(.nb-dark)[data-tab="9"]{--pt:#eaf5da}',
    'html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(10){background:#3f4d2a!important}html.nbx-writer.nb-dark[data-tab="9"]{--accd:#b6d98a}',
    'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(11){background:#ecc9e8!important}',
    'html.nbx-writer[data-tab="10"]{--tint:#ecc9e8;--acc:#cf8fc2;--accd:#8e4a82;--ml:rgba(207,143,194,.6)}',
    'html.nbx-writer:not(.nb-dark)[data-tab="10"]{--pt:#f8e6f5}',
    'html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(11){background:#54395a!important}html.nbx-writer.nb-dark[data-tab="10"]{--accd:#e5a8da}',
    'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(12){background:#c2ece2!important}',
    'html.nbx-writer[data-tab="11"]{--tint:#c2ece2;--acc:#5fc0ad;--accd:#2a7c6b;--ml:rgba(95,192,173,.6)}',
    'html.nbx-writer:not(.nb-dark)[data-tab="11"]{--pt:#e0f5f0}',
    'html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(12){background:#2b4a45!important}html.nbx-writer.nb-dark[data-tab="11"]{--accd:#8fdcc9}',
    'html.nbx-writer:not(.nb-dark) body nav .nav-link:not(.active):nth-child(13){background:#cfd4f6!important}',
    'html.nbx-writer[data-tab="12"]{--tint:#cfd4f6;--acc:#8a96e0;--accd:#4650a8;--ml:rgba(138,150,224,.6)}',
    'html.nbx-writer:not(.nb-dark)[data-tab="12"]{--pt:#e6e9fa}',
    'html.nbx-writer.nb-dark body nav .nav-link:not(.active):nth-child(13){background:#373c66!important}html.nbx-writer.nb-dark[data-tab="12"]{--accd:#aab4f0}',
    'html.nbx-reader:not(.nb-dark) body nav .nav-link:not(.active):nth-child(9){background:#fdd9c4!important}',
    'html.nbx-reader[data-tab="8"]{--tint:#fdd9c4;--acc:#ee9a74;--accd:#a8532e;--ml:rgba(238,154,116,.6)}',
    'html.nbx-reader:not(.nb-dark)[data-tab="8"]{--pt:#fde2d0}',
    'html.nbx-reader.nb-dark body nav .nav-link:not(.active):nth-child(9){background:#5a3a2c!important}html.nbx-reader.nb-dark[data-tab="8"]{--accd:#f2b08f}',
    '.nbx-char-strip{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;-webkit-overflow-scrolling:touch}',
    '.nbx-chip.nbx-cc{display:inline-flex;align-items:center;gap:8px;flex:none;padding:6px 14px 6px 10px}',
    '.nbx-cc-t{max-width:12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.nbx-av{flex:none;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--av,#e58fa8);color:#2a1d2e;font-weight:800;font-size:.85rem;border:1.5px solid rgba(58,42,63,.35)}',
    '.nbx-av-lg{width:44px;height:44px;font-size:1.2rem}',
    '.nbx-char-ed[hidden],.nbx-pane[hidden]{display:none}',
    '.nbx-btn.sm{padding:4px 11px;font-size:.78rem;border-radius:8px}.nbx-addsticky{min-height:40px}',
    '.nbx-lk{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}',
    '.nbx-lk-box{padding-top:8px;border-top:1px dashed var(--nbx-bd)}',
    '.nbx-lk-t{font-size:.8rem;color:var(--nbx-mut)}',
    '.nbx-lk-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in);color:var(--nbx-tx);font:600 .76rem Vazirmatn,Tahoma,sans-serif}',
    'button.nbx-lk-chip{cursor:pointer}',
    '.nbx-lk-warn{font-size:.8rem;color:#b45309}html.nb-dark .nbx-lk-warn{color:#f0b866}',
    '.nbx-spine{margin:10px 0;padding:10px 14px;border-radius:12px;border:1.5px dashed var(--nbx-ac);background:color-mix(in srgb,var(--nbx-ac) 10%,var(--nbx-in));line-height:1.9;font-size:.9rem}.nbx-spine b{margin-left:6px}.nbx-spine small{display:block;margin-top:4px}',
    '.nbx-nt-kinds{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.nbx-nt-kinds .nbx-chip,.nbx-nt-filter .nbx-chip{padding:5px 11px;font-size:.8rem}',
    '.nbx-nt-text{flex:1;min-width:0;min-height:64px;margin:0;padding:10px;border-radius:10px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;box-sizing:border-box}',
    '.nbx-nt-in{display:flex;gap:8px;align-items:stretch}.nbx-nt-pg{display:flex;flex-direction:column;gap:2px;width:72px;flex:none;font-size:.76rem;color:var(--nbx-mut)}.nbx-nt-pg .nbx-in{width:100%;text-align:center;padding:8px 4px}',
    '.nbx-nt-list .nbx-q-m{margin:0 0 4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.nbx-pgb{padding:1px 10px;border-radius:999px;background:var(--nbx-acd);color:#fff;font-size:.76rem;font-weight:700}html.nb-dark .nbx-pgb{background:#e3c26d;color:#1c1712}.nbx-kb{padding:1px 10px;border-radius:999px;border:1px solid var(--nbx-bd);font-size:.76rem}.nbx-nt-acts{margin-top:6px;gap:6px}',
    '.nbx-nt-bar{justify-content:space-between}.nbx-danger{color:#c0392b!important;border-color:#c0392b!important}',
    '.nbx-ch-head{display:flex;flex-direction:column;gap:10px}',
    '.nbx-ch-name{display:flex;align-items:center;gap:10px}',
    '.nbx-ch-title{font-weight:800;font-size:1.05rem}',
    '.nbx-ch-meta{display:grid;grid-template-columns:minmax(150px,1fr) 2fr;gap:8px;align-items:center}',
    '.nbx-role-chip{justify-self:start;white-space:nowrap}',
    '.nbx-pk-h{margin:16px 0 2px;font-size:1rem}.nbx-pk-s{margin:0 0 4px;font-size:.8rem}.nbx-pk-own{border-style:solid!important}',
    '.nbx-ch-head select{width:100%;padding:9px 11px;border-radius:10px;border:1.5px solid var(--nbx-bd);background:var(--nbx-in)!important;color:var(--nbx-tx)!important;font:inherit;font-size:.9rem;box-sizing:border-box}',
    '.nbx-ch-acts .nbx-danger{color:#c0392b;border-color:#c0392b}',
    '.nbx-layer>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px}',
    '.nbx-layer>summary::-webkit-details-marker{display:none}',
    '.nbx-layer>summary h3{margin:0;flex:1}',
    '.nbx-layer>summary::after{content:"▾";font-size:1.1rem;opacity:.7;transition:transform .2s}',
    '.nbx-layer:not([open])>summary::after{transform:rotate(90deg)}',
    '.nbx-layer[open]>summary{margin-bottom:12px}',
    '.nbx-layer>summary:focus-visible{outline:2px solid var(--nbx-acd);outline-offset:3px;border-radius:6px}',
    '.nbx-fill{color:var(--nbx-mut);font-size:.8rem}',
    '.layer-card.nbx-coll>h3{cursor:pointer;display:flex;align-items:center;gap:10px;user-select:none;-webkit-tap-highlight-color:transparent}',
    '.layer-card.nbx-coll>h3::after{content:"▾";font-size:1.1rem;opacity:.7;transition:transform .2s;flex:none}',
    '.layer-card.nbx-coll:not(.nbx-open)>h3::after{transform:rotate(90deg)}',
    '.layer-card.nbx-coll:not(.nbx-open)>h3{margin-bottom:0!important;padding-bottom:0!important;border-bottom:0!important}',
    '.layer-card.nbx-coll:not(.nbx-open)>:not(h3){display:none!important}',
    '.layer-card.nbx-coll>h3:focus-visible{outline:2px solid var(--nbx-acd);outline-offset:3px;border-radius:6px}',
    '.nbx-fill2{flex:1;text-align:end;color:var(--nbx-mut);font-size:.75rem;font-weight:400;white-space:nowrap}',
    '@media print{.layer-card.nbx-coll:not(.nbx-open)>:not(h3){display:revert!important}.layer-card.nbx-coll>h3::after{display:none}}',
    '@media(max-width:600px){.nbx-ch-meta{grid-template-columns:1fr}.nbx-ch-acts .nbx-btn{flex:1 1 auto}}',
    '.nbx-time-seg{padding:0 0 12px;flex-wrap:wrap;white-space:normal}',
    '.nbx-rhy-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:10px;border-radius:12px;background:var(--nbx-in);border:1px solid var(--nbx-bd)}',
    '.nbx-rb{display:inline-block;width:20px;height:34px;border-radius:6px;border:1.5px solid rgba(58,42,63,.35);padding:0;cursor:pointer;vertical-align:middle;transition:transform .15s}',
    'i.nbx-rb{width:14px;height:14px;cursor:default;margin-left:4px;border-radius:4px}',
    '.nbx-rb.p-slow{background:#8fbfe8}.nbx-rb.p-mid{background:#9fd3a8}.nbx-rb.p-fast{background:#f0a27a}.nbx-rb.p-broken{background:#b79be0}',
    '.nbx-rb.p-none{background:repeating-linear-gradient(45deg,#e6dccb 0 4px,#f6efe2 4px 8px)}',
    'html.nb-dark .nbx-rb.p-none{background:repeating-linear-gradient(45deg,#4a4034 0 4px,#2c251d 4px 8px)}',
    'button.nbx-rb:hover,button.nbx-rb:focus-visible{transform:translateY(-2px);outline:2px solid var(--nbx-acd)}',
    '.nbx-rd{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;margin:0 4px;border-radius:999px;background:var(--nbx-acd);color:#fff;font-size:.7rem;font-weight:700}',
    'html.nb-dark .nbx-rd{background:#e3c26d;color:#1c1712}',
    '.nbx-rhy-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:.82rem;color:var(--nbx-mut)}',
    '.nbx-flash{outline:3px solid var(--nbx-ac);outline-offset:2px}',
    '.nbx-liblink{display:inline-flex;align-items:center;text-decoration:none}',
    '.nbx-addbook{margin-bottom:10px}',
    '#lib-seg{padding:0 0 4px;flex-wrap:wrap;white-space:normal}',
    '@media(prefers-reduced-motion:reduce){.nbx-rb,.nbx-layer>summary::after{transition:none}}',
].join('\n')));

/* ======================================================================
   🔗 پیوند شخصیت‌ها و قانون‌ها به صحنه‌های «ساختار»
   پیوندها روی خود کارت صحنه ذخیره می‌شوند (chars و rules)؛ شخصیت و قانون فقط نمایش می‌دهند.
   ====================================================================== */
function getLinks(c, k) { try { var v = JSON.parse(c.getAttribute('data-' + k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function setLinks(c, k, arr) { c.setAttribute('data-' + k, JSON.stringify(arr)); }
function structCards() { return $$('#nbx-cards .nbx-card'); }
function cardLabel(c) { var b = $('.nbx-badge', c), t = $('.nbx-title', c), ti = t ? t.value.trim() : ''; return (b ? b.textContent : '') + (ti ? ' — ' + ti : ''); }
function charList() { return collectChars().map(function (c) { return { id: c.id, name: (c.title || '').trim() || 'بدون نام', sub: charRoleLabel(c.role) }; }); }
function ruleKindLabel(v) { var o = SEL_KIND_R.filter(function (x) { return x[0] === v && v; })[0]; return o ? o[1] : ''; }
function ruleList() {
    var t = CTABS.filter(function (x) { return x.cfg.key === '__rules'; })[0];
    return t ? t.cards().map(function (r) { return { id: r.id, name: (r.title || '').trim() || 'بدون عنوان', sub: ruleKindLabel(r.kind) }; }) : [];
}
function scenesOf(kind, id) { return structCards().filter(function (c) { return getLinks(c, kind).indexOf(id) > -1; }); }
function linkIndex() {
    var ix = { chars: {}, rules: {} };
    structCards().forEach(function (c) { ['chars', 'rules'].forEach(function (k) { getLinks(c, k).forEach(function (id) { (ix[k][id] = ix[k][id] || []).push(c); }); }); });
    return ix;
}
function renderCardLinks(c, ch, ru) {
    var box = $('.nbx-lk-chips', c); if (!box) return;
    ch = Array.isArray(ch) ? ch : charList(); ru = Array.isArray(ru) ? ru : ruleList(); var h = '';
    getLinks(c, 'chars').forEach(function (id) { var x = ch.filter(function (y) { return y.id === id; })[0]; if (x) h += '<span class="nbx-lk-chip">👤 ' + esc(x.name) + '</span>'; });
    getLinks(c, 'rules').forEach(function (id) { var x = ru.filter(function (y) { return y.id === id; })[0]; if (x) h += '<span class="nbx-lk-chip">📌 ' + esc(x.name) + '</span>'; });
    box.innerHTML = h;
}
function renderEntityScenes(box, ix) {
    var kind = box.getAttribute('data-kind'), id = box.getAttribute('data-eid'), chars = kind === 'chars';
    var sc = (ix && ix.chars) ? ((ix[kind] || {})[id] || []) : scenesOf(kind, id);
    var h = '<b class="nbx-lk-t">🎬 ' + (chars ? 'حضور در صحنه‌ها' : 'به‌کار رفته در') + '</b>';
    if (!sc.length) h += '<span class="nbx-lk-warn">⚠️ هنوز در هیچ صحنه‌ای ' + (chars ? 'نیامده' : 'به کار نرفته') + '</span>';
    else sc.forEach(function (c) { h += '<button type="button" class="nbx-lk-chip" data-go="' + esc(c.getAttribute('data-id')) + '" title="رفتن به این صحنه در «ساختار»">' + esc(cardLabel(c)) + '</button>'; });
    h += '<button type="button" class="nbx-btn sm" data-lk="' + kind + '">' + (sc.length ? '✎ تغییر' : '➕ وصل به صحنه') + '</button>';
    box.innerHTML = h;
}
function refreshLinks() {
    var ch = charList(), ru = ruleList(), ix = linkIndex();
    structCards().forEach(function (c) { renderCardLinks(c, ch, ru); });
    $$('.nbx-lk-box').forEach(function (b) { renderEntityScenes(b, ix); });
}
var refreshLinksSoon = debounce(function () { refreshLinks(); }, 150);
function unlinkEntity(kind, id) {
    var changed = false;
    structCards().forEach(function (c) { var a = getLinks(c, kind); if (a.indexOf(id) > -1) { setLinks(c, kind, a.filter(function (x) { return x !== id; })); changed = true; } });
    if (changed) afterChange(); else refreshLinks();
}
function goTab(id) {
    var nb = $$('nav .nav-link').filter(function (b) { return (b.getAttribute('onclick') || '').indexOf("'" + id + "'") > -1; })[0];
    if (nb) nb.click();
}
function linkModal(title, rows, isOn, toggle, emptyMsg, goLabel, goFn) {
    var body = el('div', { 'class': 'nbx-mbody' }), m;
    if (!rows.length) {
        body.innerHTML = '<div class="nbx-empty">' + esc(emptyMsg) + '</div><div class="nbx-row" style="margin-top:10px"><button type="button" class="nbx-btn primary nbx-lm-go">' + esc(goLabel) + '</button></div>';
        m = openModal(title, body);
        $('.nbx-lm-go', body).onclick = function () { m.close(); goFn(); };
        return;
    }
    body.innerHTML = '<p class="nbx-muted" style="margin:0 0 6px">هر علامتی که بزنی یا برداری، همان لحظه ذخیره می‌شود.</p><div class="nbx-pick">' + rows.map(function (r, i) {
        return '<label><input type="checkbox" data-i="' + i + '"' + (isOn(r) ? ' checked' : '') + '> ' + esc(r.name) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</label>';
    }).join('') + '</div>';
    body.addEventListener('change', function (e) { var i = e.target.getAttribute('data-i'); if (i == null) return; toggle(rows[+i], e.target.checked); });
    openModal(title, body);
}
function pickScenesFor(kind, id) {
    var chars = kind === 'chars';
    linkModal(chars ? 'این شخصیت در کدام صحنه‌هاست؟' : 'این قانون یا تابو در کدام صحنه به کار رفته؟',
        structCards().map(function (c) { return { c: c, name: cardLabel(c), sub: c.getAttribute('data-type') === 'chapter' ? 'فصل' : '' }; }),
        function (r) { return getLinks(r.c, kind).indexOf(id) > -1; },
        function (r, on) { var a = getLinks(r.c, kind).filter(function (x) { return x !== id; }); if (on) a.push(id); setLinks(r.c, kind, a); afterChange(); },
        'هنوز فصل یا صحنه‌ای در تب «ساختار» نساخته‌ای.', 'رفتن به «ساختار»', function () { goStructure(); });
}
function pickForCard(card, kind) {
    var chars = kind === 'chars';
    linkModal(chars ? 'کدام شخصیت‌ها در این صحنه‌اند؟' : 'کدام قانون یا تابو در این صحنه به کار می‌رود؟',
        chars ? charList() : ruleList(),
        function (r) { return getLinks(card, kind).indexOf(r.id) > -1; },
        function (r, on) { var a = getLinks(card, kind).filter(function (x) { return x !== r.id; }); if (on) a.push(r.id); setLinks(card, kind, a); afterChange(); },
        chars ? 'هنوز شخصیتی نساخته‌ای.' : 'هنوز قانون یا تابویی در تب «جهان‌سازی» ثبت نکرده‌ای.',
        chars ? 'رفتن به «شخصیت‌ها»' : 'رفتن به «جهان‌سازی»', function () { goTab(chars ? 'tab-chars' : 'tab-world'); });
}
function onLinkClick(e) {
    var t = e.target; if (!t || !t.closest) return;
    var b = t.closest('[data-lk]');
    if (b) { var box = b.closest('.nbx-lk-box'); if (box) pickScenesFor(b.getAttribute('data-lk'), box.getAttribute('data-eid')); return; }
    var g = t.closest('[data-go]'); if (g) goStructure(g.getAttribute('data-go'));
}
/* ستون فقرات بالای «ساختار» */
function renderSpine() {
    var box = $('#nbx-spine'); if (!box) return;
    var rows = [['🧵 لاگ‌لاین', '#story-logline'], ['❓ پرسش محوری', '#story-question'], ['🎯 تم', '#story-theme']].map(function (x) {
        var f = $(x[1]), v = f ? f.value.trim() : ''; return v ? '<div><b>' + x[0] + '</b>' + esc(v) + '</div>' : '';
    }).join('');
    box.innerHTML = rows ? rows + '<small class="nbx-muted">هر صحنه را با این‌ها بسنج: آیا ما را به جواب پرسش محوری نزدیک‌تر می‌کند؟</small>' : '<span class="nbx-muted">💡 لاگ‌لاین و پرسش محوری را در تب «داستان و ماجرا» بنویس تا همین‌جا بالای صحنه‌هایت بماند.</span>';
}
/* ======================================================================
   📝 یادداشت حین خواندن (دفترچه کتاب‌خوان): صفحه + برچسب + متن
   ====================================================================== */
var NOTES = [], noteSort = 'page', noteEditing = '', notesHost = null, notesPid = '';
var saveNotes = makeSaver('__notes', function () { return NOTES; });
function toLatinDigits(s) { return String(s || '').replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }); }
function pageNum(p) { var m = toLatinDigits(p).match(/\d+/); return m ? parseInt(m[0], 10) : 1e9; }
function notesSorted(mode) {
    var a = NOTES.slice();
    if (mode === 'page') a.sort(function (x, y) { return pageNum(x.p) - pageNum(y.p) || (x.ts || 0) - (y.ts || 0); });
    else a.sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); });
    return a;
}
function notesSection() {
    var items = notesSorted('page').map(function (n) {
        return { label: n.p ? 'صفحهٔ ' + n.p : 'یادداشت', value: n.t };
    });
    return { cards: items.length ? [{ title: '', items: items }] : [], count: items.length, unit: 'یادداشت' };
}
function buildNotesTab() {
    var nav = $('nav'); if (!nav || !$('.tab-content') || $('#tab-notes')) return;
    var tab = el('div', { id: 'tab-notes', 'class': 'tab-content' });
    tab.innerHTML = '<div class="layer-card"><h3>📝 یادداشت حین خواندن</h3>' +
        '<div class="nbx-nt-in"><label class="nbx-nt-pg"><span>صفحه</span><input class="nbx-in nbx-nt-page" type="text" inputmode="numeric" aria-label="شمارهٔ صفحه"></label>' +
        '<textarea class="nbx-skip nbx-nt-text" aria-label="متن یادداشت"></textarea></div>' +
        '<div class="nbx-row" style="margin-top:8px"><button type="button" class="nbx-btn primary nbx-nt-add">➕ ثبت</button><button type="button" class="nbx-btn nbx-nt-cancel" hidden>انصراف از ویرایش</button></div></div>' +
    '<div class="layer-card"><div class="nbx-row nbx-nt-bar"><button type="button" class="nbx-btn sm nbx-nt-sort"></button></div><p class="nbx-muted nbx-nt-sum" style="margin:8px 0"></p><div class="nbx-nt-list"></div></div>';
    /* درست بعد از «پیش‌شروع»، همان‌جا که خواندن شروع می‌شود */
    var t2 = $('#tab2'); if (t2 && t2.parentNode) t2.parentNode.insertBefore(tab, t2.nextSibling); else placeTab(tab);
    var nbtn = el('button', { 'class': 'nav-link', onclick: "openTab(event, 'tab-notes')" }, '📝 یادداشت حین خواندن');
    var b2 = $$('nav .nav-link').filter(function (x) { return (x.getAttribute('onclick') || '').indexOf("'tab2'") > -1; })[0];
    if (b2) b2.parentNode.insertBefore(nbtn, b2.nextSibling); else nav.appendChild(nbtn);
    notesHost = tab;
    var ta = $('.nbx-nt-text', tab), pg = $('.nbx-nt-page', tab), addB = $('.nbx-nt-add', tab), canB = $('.nbx-nt-cancel', tab);
    function endEdit() { noteEditing = ''; ta.value = ''; addB.textContent = '➕ ثبت'; canB.hidden = true; }
    function add() {
        var t = ta.value.trim(); if (!t) { toast('اول چیزی بنویس.'); ta.focus(); return; }
        var p = pg.value.trim();
        if (noteEditing) {
            var n = NOTES.filter(function (x) { return x.id === noteEditing; })[0];
            if (n) { n.t = t; n.p = p; }
            endEdit(); toast('تغییر ذخیره شد ✓');
        } else {
            NOTES.push({ id: uid(), t: t, p: p, ts: Date.now() });
            ta.value = ''; toast('ثبت شد ✓');
        }
        saveNotes(); renderNotes(); ta.focus();
    }
    addB.onclick = add;
    canB.onclick = function () { endEdit(); };
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); add(); } });
    $('.nbx-nt-sort', tab).onclick = function () { noteSort = noteSort === 'page' ? 'new' : 'page'; renderNotes(); };
    $('.nbx-nt-list', tab).addEventListener('click', async function (e) {
        var b = e.target.closest('[data-na]'); if (!b) return;
        var id = b.closest('.nbx-quote').getAttribute('data-id'), n = NOTES.filter(function (x) { return x.id === id; })[0]; if (!n) return;
        var act = b.getAttribute('data-na');
        if (act === 'del') {
            if (!confirm('این یادداشت حذف شود؟')) return;
            NOTES = NOTES.filter(function (x) { return x.id !== id; }); if (noteEditing === id) endEdit(); saveNotes(); renderNotes();
        } else if (act === 'edit') {
            noteEditing = id; ta.value = n.t; pg.value = n.p || ''; addB.textContent = '💾 ذخیرهٔ تغییر'; canB.hidden = false;
            window.nbxReveal(ta); ta.focus(); try { tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {}
        } else if (act === 'card') openShareCard(n.t, '«' + activeName() + '»' + (n.p ? '، صفحهٔ ' + n.p : ''));
        else if (act === 'star') {
            await patchData(activeId(), function (d) {
                var q = d.__quotes || [];
                if (!q.some(function (x) { return x.t === n.t; })) q.push({ id: uid(), t: n.t, p: n.p || '' });
                d.__quotes = q;
            });
            toast('به «جمله‌های ماندگار» کتابخانه اضافه شد ✓');
        }
    });
    renderNotes();
}
function renderNotes() {
    var tab = notesHost; if (!tab) return;
    $('.nbx-nt-sort', tab).textContent = noteSort === 'page' ? '↕ به ترتیب صفحه' : '↕ تازه‌ترین اول';
    var list = notesSorted(noteSort);
    $('.nbx-nt-sum', tab).textContent = NOTES.length ? '' : 'هنوز یادداشتی نداری.';
    var host = $('.nbx-nt-list', tab); host.innerHTML = '';
    list.forEach(function (n) {
        var c = el('div', { 'class': 'nbx-quote', 'data-id': n.id });
        c.innerHTML = (n.p ? '<div class="nbx-q-m"><span class="nbx-pgb">ص ' + esc(n.p) + '</span></div>' : '') +
            '<div class="nbx-q-t">' + esc(n.t).replace(/\n/g, '<br>') + '</div>' +
            '<div class="nbx-row nbx-nt-acts"><button type="button" class="nbx-mini" data-na="edit" title="ویرایش" aria-label="ویرایش">✏️</button><button type="button" class="nbx-mini" data-na="star" title="به جمله‌های ماندگار کتابخانه اضافه کن" aria-label="جملهٔ ماندگار">⭐</button><button type="button" class="nbx-mini" data-na="card" title="کارت تصویری" aria-label="کارت تصویری">🖼️</button><button type="button" class="nbx-mini nbx-danger" data-na="del" title="حذف" aria-label="حذف">🗑</button></div>';
        host.appendChild(c);
    });
}
async function refreshNotes() {
    if (!notesHost) return;
    var pid = activeId(), d = await getData(pid);
    NOTES = Array.isArray(d.__notes) ? d.__notes : [];
    if (pid !== notesPid) { notesPid = pid; noteEditing = ''; $('.nbx-nt-text', notesHost).value = ''; $('.nbx-nt-page', notesHost).value = ''; $('.nbx-nt-add', notesHost).textContent = '➕ ثبت'; $('.nbx-nt-cancel', notesHost).hidden = true; }
    renderNotes();
}

/* ======================================================================
   راه‌اندازی
   ====================================================================== */
async function refreshAll() {
    await flushSavers();
    await Promise.all([refreshGenre(), isWriter ? refreshStructure() : 0, isWriter ? refreshChars() : 0, (isReader || isWriter) ? refreshMetaBox() : 0, isReader ? refreshNotes() : 0, (isReader || isWriter) ? updateLibSummary() : 0, refreshStickies()].concat(CTABS.map(function (t) { return t.refresh(); })));
    refreshDice();
    if (isWriter) { refreshRhythm(); renderSpine(); refreshLinks(); }
}
function hookProjectManager() {
    ['switchProject', 'createNewProject', 'deleteCurrentProject', 'restoreProjectFromFile'].forEach(function (k) {
        var orig = pm[k]; if (typeof orig !== 'function') return;
        pm[k] = async function () { await flushSavers(); var r = await orig.apply(this, arguments); await refreshAll(); return r; };
    });
}

/* ======================================================================
   🗂️ کارت‌های تب‌ها مثل بخش شخصیت‌ها: لیست جمع‌وجور که با کلیک باز می‌شود
   ====================================================================== */
var OPEN_KEY = 'nbx-open-' + NS;
function openState() { try { var o = JSON.parse(lsGet(OPEN_KEY, '{}')); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; } }
function cardEligible(c) {
    if (!c || c.tagName !== 'DIV') return false;
    var cl = c.classList;
    if (cl.contains('nbx-meta') || cl.contains('nbx-ch-head') || cl.contains('nbx-ch-top')) return false;
    if (c.closest('.nbx-chars')) return false;
    if (c.parentElement && c.parentElement.closest('.layer-card')) return false;
    var h = c.firstElementChild;
    return !!(h && h.tagName === 'H3');
}
function setCardOpen(card, on, persist) {
    card.classList.toggle('nbx-open', !!on);
    var h = card.firstElementChild; if (h) h.setAttribute('aria-expanded', String(!!on));
    if (persist) { var st = openState(); st[card.getAttribute('data-nbx-key')] = on ? 1 : 0; lsSet(OPEN_KEY, JSON.stringify(st)); }
}
function enhanceCards() {
    var st = openState();
    $$('.tab-content').forEach(function (tab) {
        $$('.layer-card', tab).forEach(function (c) {
            if (c.classList.contains('nbx-coll')) return;
            if (!cardEligible(c)) return;
            var h = c.firstElementChild, key = tab.id + '|' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
            c.classList.add('nbx-coll'); c.setAttribute('data-nbx-key', key);
            h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0');
            var sp = el('span', { 'class': 'nbx-fill2' }); h.appendChild(sp);
            var on = (key in st) ? !!st[key] : false;
            setCardOpen(c, on, false);
        });
    });
    updateFillCounts();
}
function updateFillCounts() {
    $$('.layer-card.nbx-coll').forEach(function (c) {
        var sp = c.firstElementChild && c.firstElementChild.querySelector('.nbx-fill2'); if (!sp) return;
        var all = $$('textarea, input[type="text"], input:not([type])', c).filter(function (f) { return !f.closest('.nbx-lk'); });
        var n = all.filter(function (f) { return String(f.value || '').trim(); }).length;
        var txt = (all.length && all.length <= 14 && n) ? fa(n) + ' از ' + fa(all.length) : '';
        if (sp.textContent !== txt) sp.textContent = txt;
    });
}
function setupCollapsibleCards() {
    enhanceCards();
    var t = 0, again = function () { clearTimeout(t); t = setTimeout(enhanceCards, 150); };
    var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) { if (muts[i].target.closest && muts[i].target.closest('.nbx-fill2')) continue; if (muts[i].addedNodes.length) { again(); return; } }
    });
    $$('.tab-content').forEach(function (tab) { mo.observe(tab, { childList: true, subtree: true }); });
    function toggleFrom(e) {
        var h = e.target.closest && e.target.closest('h3'); if (!h) return;
        var card = h.parentElement; if (!card || !card.classList.contains('nbx-coll') || card.firstElementChild !== h) return;
        if (e.target.closest('button, a, input, select, textarea, label') && e.target !== h) return;
        e.preventDefault(); setCardOpen(card, !card.classList.contains('nbx-open'), true);
    }
    document.addEventListener('click', toggleFrom);
    document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'H3') toggleFrom(e); });
    document.addEventListener('input', debounce(updateFillCounts, 300));
    setInterval(function () { if (document.visibilityState !== 'hidden') updateFillCounts(); }, 1500);
}
async function init() {
    try { localStorage.removeItem('nbx-mood'); } catch (e) {} root.removeAttribute('data-nbx-mood'); root.style.removeProperty('--nbx-mood');
    ['days','goal','celebrated'].forEach(function (k) { try { localStorage.removeItem('nbx-' + NS + '-' + k); } catch (e) {} });
    if (isLibrary) { buildLibraryPage(); return; }
    if (isWorks) { buildWorksPage(); return; }
    if (typeof pm === 'undefined') return;
    if (isWriter) buildStructure();
    buildGenre();
    if (isWriter) buildCardTabs();
    if (isReader) buildNotesTab();
    if (isWriter) buildRoadTab();
    if (isWriter) buildLearnTab();
    if (isReader || isWriter) buildMetaBox();
    if (isReader || isWriter) setupCollapsibleCards();
    var tb = $('.project-toolbar');
    if (tb) {
        var cb = el('button', { 'class': 'btn-toolbar', type: 'button' }, SHARE.icon + ' ' + SHARE.name); cb.onclick = function () { openShareCard('', '«' + activeName() + '»'); }; tb.appendChild(cb);
    }
    buildToolbarMenu();
    buildDice();
    buildStickies();
    buildNavHint();
    hookProjectManager();
    if (isWriter) document.addEventListener('click', onLinkClick);

    // فیلدهای ژانر خودکار ذخیره شوند و آمار با تایپ به‌روز شود
    document.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'TEXTAREA') return;
        if (t.id && t.id.indexOf('gx-') === 0) { PM().saveActiveProjectField(t); }
        if (isWriter && /^story-(logline|question|theme)$/.test(t.id)) renderSpine();
    });

    // منتظر آماده شدن مدیر پروژه می‌مانیم، بعد فیلدهای تازه را از دادهٔ ذخیره‌شده پر می‌کنیم
    for (var i = 0; i < 60; i++) { if (PM().getActiveId() && PM().getProjects().length) break; await sleep(100); }
    await sleep(350);
    await PM().loadActiveProjectIntoForm();
    await refreshAll();
    setTimeout(refreshAll, 1500); // اگر بارگذاری اصلیِ صفحه دیرتر تمام شد، دوباره هماهنگ می‌شویم
}

/* ======================================================================
   🔔 یادآورهای آرام: نصب اپ و پشتیبان‌گیری
   قاعده‌ها:
   • هر پیام فقط وقتی می‌آید که واقعاً به درد کاربر بخورد، در هر بازدید حداکثر یکی، و خودش بعد از چند ثانیه می‌رود.
   • نصب: فقط یک بار در عمر، از بازدید روز دوم به بعد، و فقط اگر اپ نصب نشده باشد.
   • پشتیبان: وقتی کاربر دست‌کم ۲ روز مختلف سر زده و حدود ۱۵۰۰ نویسه نوشتهٔ واقعی دارد.
     اگر هرگز پشتیبان نگرفته یا از آخرین پشتیبان/یادآوری نوشتهٔ تازهٔ زیادی اضافه شده
     (حداقل ۱۵۰۰ نویسه و ۴۰٪ بیشتر) و ۳۰ روز از آخرین یادآوری گذشته باشد، دوباره یادآوری می‌شود.
     هر بار پشتیبان بگیرد (با یادآور یا از دکمهٔ خود صفحه)، شمارش از نو شروع می‌شود.
   ====================================================================== */
var NUDGE_KEY = 'nb-nudge', NUDGE_DAY = 86400000;
var nudgeShownNow = false, nudgeInstallEvt = null;
function nudgeState() { try { return JSON.parse(lsGet(NUDGE_KEY, '{}')) || {}; } catch (e) { return {}; } }
function nudgeSave(st) { lsSet(NUDGE_KEY, JSON.stringify(st)); }
function nudgeStandalone() { try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { return false; } }
function nudgeTextLen(v) {
    if (v == null) return 0;
    if (typeof v === 'string') return (v.indexOf('data:') === 0 || v.length > 20000) ? 0 : v.length;
    if (Array.isArray(v)) return v.reduce(function (a, x) { return a + nudgeTextLen(x); }, 0);
    if (typeof v === 'object') return Object.keys(v).reduce(function (a, k) { return a + nudgeTextLen(v[k]); }, 0);
    return 0;
}
async function nudgeContentSize() {
    var n = 0;
    try {
        var ps = PM().getProjects() || [];
        for (var i = 0; i < ps.length; i++) { if (ps[i] && ps[i].id) n += nudgeTextLen(await getData(ps[i].id)); }
    } catch (e) {}
    if (isLibrary || isWorks) {
        bkKeys().forEach(function (k) { try { n += nudgeTextLen(JSON.parse(lsGet(k, 'null'))); } catch (e) {} });
    }
    return n;
}
async function nudgeMarkBackup() {
    var st = nudgeState(); st.bkLast = Date.now(); st.bkSize = await nudgeContentSize(); nudgeSave(st);
}
function nudgeShow(text, buttons) {
    nudgeShownNow = true;
    var box = el('div', { 'class': 'nbx-nudge', role: 'status' }, '<p>' + esc(text) + '</p><div class="nbx-nudge-row"></div>');
    var row = $('.nbx-nudge-row', box), done = false;
    function hide() { if (done) return; done = true; box.classList.remove('show'); setTimeout(function () { box.remove(); }, 350); }
    buttons.forEach(function (b) {
        var btn = el('button', { type: 'button', 'class': 'nbx-nudge-btn' + (b.primary ? ' primary' : '') }, esc(b.t));
        btn.onclick = function () { hide(); if (b.fn) b.fn(); };
        row.appendChild(btn);
    });
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('show'); }); });
    setTimeout(hide, 22000);
}
function nudgeTryInstall() {
    var st = nudgeState();
    if (st.inst || lsGet('nb-install-dismissed', null) || nudgeStandalone() || (st.n || 0) < 2) return false;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if (nudgeInstallEvt) {
        st.inst = Date.now(); nudgeSave(st); lsSet('nb-install-dismissed', '1');
        var evt = nudgeInstallEvt;
        nudgeShow('📲 دفترچه را مثل یک اپ نصب کن؛ سریع‌تر باز می‌شود و بدون اینترنت هم کار می‌کند.', [
            { t: 'نصب', primary: true, fn: function () { try { evt.prompt(); } catch (e) {} } },
            { t: 'نه، ممنون' }
        ]);
        return true;
    }
    if (ios) {
        st.inst = Date.now(); nudgeSave(st); lsSet('nb-install-dismissed', '1');
        nudgeShow('📲 برای نصب روی گوشی: دکمهٔ اشتراک‌گذاری (مربع با فلش) را بزن و «Add to Home Screen» را انتخاب کن.', [{ t: 'فهمیدم', primary: true }]);
        return true;
    }
    return false;
}
async function nudgeTryBackup() {
    var st = nudgeState(), now = Date.now();
    if ((st.n || 0) < 2) return false;
    if (st.bkShown && now - st.bkShown < 30 * NUDGE_DAY) return false;
    var size = await nudgeContentSize();
    var base = Math.max(st.bkSize || 0, st.bkSeen || 0);
    var need = base ? Math.max(1500, base * 0.4) : 1500;
    if (size - base < need) return false;
    st = nudgeState(); st.bkShown = now; st.bkSeen = size; nudgeSave(st);
    var again = !!st.bkLast;
    nudgeShow(again ? '💾 از آخرین پشتیبانت نوشتهٔ تازه‌ای اضافه شده. یک نسخهٔ جدید بگیر تا چیزی از دست نرود.' : '💾 نوشته‌هایت خیلی شده! یک نسخهٔ پشتیبان بگیر تا اگر حافظهٔ مرورگر پاک شد چیزی از دست نرود.', [
        { t: 'پشتیبان بگیر', primary: true, fn: function () {
            if (isLibrary || isWorks) fullBackup(); else { var r = PM().backupCurrentProject(); if (r && r.then) r.then(nudgeMarkBackup); else nudgeMarkBackup(); }
        } },
        { t: 'بعداً' }
    ]);
    return true;
}
function setupNudges() {
    addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); nudgeInstallEvt = e; });
    addEventListener('appinstalled', function () { var st = nudgeState(); st.inst = Date.now(); nudgeSave(st); lsSet('nb-install-dismissed', '1'); });
    var st = nudgeState(), today = dateKey();
    if (st.d !== today) { st.d = today; st.n = (st.n || 0) + 1; nudgeSave(st); }
    // هر وقت کاربر خودش پشتیبان بگیرد، شمارش از نو شروع می‌شود
    try {
        var P = PM();
        if (P && P.backupCurrentProject && !P.__nudgeWrapped) {
            var orig = P.backupCurrentProject; P.__nudgeWrapped = true;
            P.backupCurrentProject = function () { var r = orig.apply(this, arguments); if (r && r.then) r.then(nudgeMarkBackup); else nudgeMarkBackup(); return r; };
        }
    } catch (e) {}
    document.head.appendChild(el('style', { id: 'nbx-css-nudge' },
        '.nbx-nudge{position:fixed;left:12px;right:12px;bottom:14px;max-width:460px;margin:0 auto;z-index:2900;padding:14px 16px;border-radius:14px;background:#fffaf0;color:#3a2a3f;border:1.5px solid #e3d8bd;box-shadow:0 10px 26px rgba(60,40,10,.22);transform:translateY(30px);opacity:0;transition:all .35s;font-family:Vazirmatn,Tahoma,sans-serif}' +
        '.nbx-nudge.show{transform:none;opacity:1}.nbx-nudge p{margin:0 0 10px;font-size:.9rem;line-height:1.9}' +
        '.nbx-nudge-row{display:flex;gap:8px;justify-content:flex-start}' +
        '.nbx-nudge-btn{padding:8px 14px;border-radius:10px;border:1.5px solid #d8c9a0;background:transparent;color:inherit;font:700 .85rem Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
        '.nbx-nudge-btn.primary{background:#cfe0f5;border-color:#9bbbe6;color:#2f4a73}' +
        'html.nb-dark .nbx-nudge{background:#2c251d;color:#eadfc6;border-color:#4a3e30}html.nb-dark .nbx-nudge-btn{border-color:#54483a}html.nb-dark .nbx-nudge-btn.primary{background:#3a4658;border-color:#9cc4ec;color:#dbe9fa}' +
        '@media(prefers-reduced-motion:reduce){.nbx-nudge{transition:none}}'));
    setTimeout(function () { if (!nudgeShownNow && document.visibilityState !== 'hidden') nudgeTryInstall(); }, 8000);
    setTimeout(function () { if (!nudgeShownNow && document.visibilityState !== 'hidden') nudgeTryBackup(); }, 25000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
setupNudges();
})();
