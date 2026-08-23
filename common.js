/* ======================================================
   کدهای مشترک بین صفحات سایت «دفترچه من»
   (قبلاً این توابع توی چند فایل جدا کپی شده بودن)
   ====================================================== */

/* ---------- حالت شب/روز ---------- */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('nb-dark');
    localStorage.setItem('nb-dark-mode', isDark ? '1' : '0');
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) {
        btn.textContent = document.documentElement.classList.contains('nb-dark') ? '☀️' : '🌙';
    }
});

/* ---------- منوی کشویی هدر در موبایل ---------- */
function toggleMobileMenu() {
    const menu = document.getElementById('headerBtns');
    if (menu) menu.classList.toggle('open');
}

/* ======================================================
   رفع مشکل اسکرول با کیبورد (Windows/دسکتاپ)
   وقتی روی دکمه‌ای کلیک می‌شه، فوکوس روش می‌مونه. اگه اون دکمه
   داخل یه container باشه که فقط افقی اسکرول می‌شه (مثل nav)،
   مرورگر با زدن Page Up/Down یا کلیدهای جهت‌دار سعی می‌کنه همون
   container رو اسکرول کنه (که عمودی جایی برای اسکرول نداره) و
   دیگه به صفحه‌ی اصلی نمی‌رسه؛ در نتیجه اسکرول کیبورد قفل می‌شه.
   راه‌حل: بعد از هر کلیک روی دکمه/لینک، فوکوس رو آزاد می‌کنیم تا
   کیبورد دوباره کل صفحه رو اسکرول کنه. (فوکوس با تب کیبورد دست‌نخورده
   می‌مونه چون این فقط بعد از «کلیک» اجرا می‌شه.)
   ====================================================== */
document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a');
    if (el) requestAnimationFrame(() => el.blur());
});

/* ======================================================
   مودال سفارشی به‌جای prompt/confirm بومی مرورگر
   توی حالت standalone (نصب‌شده روی صفحه‌ی اصلی موبایل) این
   دیالوگ‌های بومی خیلی وقت‌ها نمایش داده نمی‌شن؛ این نسخه با
   HTML/CSS خودمون همه‌جا یکسان کار می‌کنه.
   ====================================================== */
function nbBuildModal({ message, withInput, defaultValue, danger }) {
    return new Promise((resolve) => {
        const prevFocus = document.activeElement;
        const overlay = document.createElement('div');
        overlay.className = 'nb-modal-overlay';

        const box = document.createElement('div');
        box.className = 'nb-modal-box';

        const msg = document.createElement('div');
        msg.className = 'nb-modal-message';
        msg.textContent = message;
        box.appendChild(msg);

        let input = null;
        if (withInput) {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'nb-modal-input';
            input.value = defaultValue || '';
            box.appendChild(input);
        }

        const actions = document.createElement('div');
        actions.className = 'nb-modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'nb-modal-btn nb-modal-btn-cancel';
        cancelBtn.textContent = 'انصراف';

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'nb-modal-btn ' + (danger ? 'nb-modal-btn-danger' : 'nb-modal-btn-ok');
        okBtn.textContent = danger ? 'حذف کن' : 'تأیید';

        actions.appendChild(cancelBtn);
        actions.appendChild(okBtn);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        function close(result) {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
            if (prevFocus && prevFocus.focus) prevFocus.focus();
            resolve(result);
        }

        function onKeydown(ev) {
            if (ev.key === 'Escape') { ev.preventDefault(); close(withInput ? null : false); }
            if (ev.key === 'Enter') { ev.preventDefault(); okBtn.click(); }
        }

        cancelBtn.addEventListener('click', () => close(withInput ? null : false));
        okBtn.addEventListener('click', () => close(withInput ? (input.value.trim() || null) : true));
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(withInput ? null : false); });
        document.addEventListener('keydown', onKeydown);

        (input || okBtn).focus();
        if (input) input.select();
    });
}

function nbPrompt(message, defaultValue) {
    return nbBuildModal({ message, withInput: true, defaultValue });
}

function nbConfirm(message, danger) {
    return nbBuildModal({ message, withInput: false, danger });
}

/* ======================================================
   ذخیره‌سازی با ظرفیت بالا (IndexedDB)
   localStorage معمولاً فقط ۵-۱۰ مگابایت جا داره. برای اینکه
   کاربرهایی که متن زیاد می‌نویسن به این سقف نخورن، داده‌ی
   هر پروژه رو توی IndexedDB نگه می‌داریم (ظرفیتش خیلی بیشتره)
   و فقط اطلاعات کوچیک (لیست پروژه‌ها و پروژه‌ی فعال) توی
   localStorage می‌مونه چون سریع و همزمانه.
   ====================================================== */
const NB_IDB_NAME = 'nb-storage';
const NB_IDB_STORE = 'projectData';
let _nbIdbPromise = null;

function nbIdbOpen() {
    if (_nbIdbPromise) return _nbIdbPromise;
    _nbIdbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) { reject(new Error('IndexedDB not supported')); return; }
        const req = indexedDB.open(NB_IDB_NAME, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(NB_IDB_STORE)) {
                req.result.createObjectStore(NB_IDB_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _nbIdbPromise;
}

async function nbIdbGet(key) {
    try {
        const db = await nbIdbOpen();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(NB_IDB_STORE, 'readonly');
            const req = tx.objectStore(NB_IDB_STORE).get(key);
            req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
            req.onerror = () => reject(req.error);
        });
    } catch (e) { return null; }
}

async function nbIdbSet(key, value) {
    try {
        const db = await nbIdbOpen();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(NB_IDB_STORE, 'readwrite');
            tx.objectStore(NB_IDB_STORE).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        return true;
    } catch (e) { return false; }
}

async function nbIdbDelete(key) {
    try {
        const db = await nbIdbOpen();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(NB_IDB_STORE, 'readwrite');
            tx.objectStore(NB_IDB_STORE).delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        return true;
    } catch (e) { return false; }
}

/* ======================================================
   سیستم چند پروژه‌ای (دفترچه نویسندگی و دفترچه کتاب‌خوان)
   قبلاً این منطق توی دو فایل جدا و تقریباً عین هم کپی شده بود؛
   حالا یک نسخه‌ی مشترک با تنظیمات جدا برای هر صفحه.
   ====================================================== */
function createProjectManager(cfg) {
    const NS = cfg.ns;
    const PROJECTS_KEY = `${NS}-projects`;
    const ACTIVE_KEY = `${NS}-active-project`;
    const MIGRATED_FLAG = `${NS}-idb-migrated`;
    const projDataKey = (id) => `${NS}-proj-${id}`;

    function getProjects() {
        try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; }
        catch (e) { return []; }
    }
    function saveProjects(list) { localStorage.setItem(PROJECTS_KEY, JSON.stringify(list)); }
    function getActiveId() { return localStorage.getItem(ACTIVE_KEY); }
    function setActiveId(id) { localStorage.setItem(ACTIVE_KEY, id); }
    function uid() { return 'p' + Date.now() + Math.floor(Math.random() * 1000); }

    async function getProjectData(id) {
        const fromIdb = await nbIdbGet(projDataKey(id));
        if (fromIdb) return fromIdb;
        try {
            const legacy = JSON.parse(localStorage.getItem(projDataKey(id)) || 'null');
            return legacy || {};
        } catch (e) { return {}; }
    }

    async function setProjectData(id, data) {
        const ok = await nbIdbSet(projDataKey(id), data);
        if (ok) {
            localStorage.removeItem(projDataKey(id));
        } else {
            try {
                localStorage.setItem(projDataKey(id), JSON.stringify(data));
            } catch (e) {
                alert('حافظه‌ی مرورگر پر شده. لطفاً یکی از پروژه‌های قدیمی رو حذف کن تا بشه ادامه داد.');
            }
        }
    }

    async function deleteProjectData(id) {
        await nbIdbDelete(projDataKey(id));
        localStorage.removeItem(projDataKey(id));
    }

    async function migrateAndInit() {
        let projects = getProjects();
        if (projects.length === 0) {
            const legacyData = {};
            let hasLegacy = false;
            document.querySelectorAll('textarea').forEach(t => {
                const v = localStorage.getItem(t.id);
                if (v) { hasLegacy = true; legacyData[t.id] = v; }
            });
            const id = uid();
            projects = [{ id, name: hasLegacy ? cfg.legacyName : cfg.firstItemName }];
            saveProjects(projects);
            setActiveId(id);
            await setProjectData(id, legacyData);
        } else if (!localStorage.getItem(MIGRATED_FLAG)) {
            // انتقال یک‌بارهٔ داده‌های قدیمی از localStorage به IndexedDB
            for (const p of projects) {
                const raw = localStorage.getItem(projDataKey(p.id));
                if (raw) {
                    try {
                        await nbIdbSet(projDataKey(p.id), JSON.parse(raw));
                        localStorage.removeItem(projDataKey(p.id));
                    } catch (e) { /* اگه خطا داد، نسخه‌ی قدیمی دست‌نخورده می‌مونه */ }
                }
            }
        }
        localStorage.setItem(MIGRATED_FLAG, '1');
        if (!getActiveId() || !projects.find(p => p.id === getActiveId())) {
            setActiveId(projects[0].id);
        }
    }

    function renderProjectSelector() {
        const select = document.getElementById('project-select');
        const projects = getProjects();
        const activeId = getActiveId();
        select.innerHTML = '';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            if (p.id === activeId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    async function loadActiveProjectIntoForm() {
        const id = getActiveId();
        const data = await getProjectData(id);
        document.querySelectorAll('textarea').forEach(t => {
            t.value = data[t.id] || '';
        });
    }

    async function switchProject(id) {
        setActiveId(id);
        await loadActiveProjectIntoForm();
    }

    async function createNewProject() {
        // به‌جای window.prompt (که توی PWA نصب‌شده روی موبایل/iOS
        // خیلی وقت‌ها اصلاً نمایش داده نمی‌شه) از مودال خودمون استفاده می‌کنیم
        const name = await nbPrompt(cfg.newPromptText, cfg.newPromptDefault);
        if (!name) return;
        const id = uid();
        const projects = getProjects();
        projects.push({ id, name });
        saveProjects(projects);
        await setProjectData(id, {});
        setActiveId(id);
        renderProjectSelector();
        await loadActiveProjectIntoForm();
    }

    async function renameCurrentProject() {
        const id = getActiveId();
        const projects = getProjects();
        const proj = projects.find(p => p.id === id);
        if (!proj) return;
        const name = await nbPrompt(cfg.renamePromptText, proj.name);
        if (!name) return;
        proj.name = name;
        saveProjects(projects);
        renderProjectSelector();
    }

    async function deleteCurrentProject() {
        const projects = getProjects();
        if (projects.length <= 1) {
            await nbConfirm(cfg.minItemsAlert);
            return;
        }
        const id = getActiveId();
        const proj = projects.find(p => p.id === id);
        const ok = await nbConfirm(cfg.deleteConfirm(proj.name), true);
        if (!ok) return;

        await deleteProjectData(id);
        const remaining = projects.filter(p => p.id !== id);
        saveProjects(remaining);
        setActiveId(remaining[0].id);
        renderProjectSelector();
        await loadActiveProjectIntoForm();
    }

    async function saveActiveProjectField(textarea) {
        const id = getActiveId();
        const data = await getProjectData(id);
        data[textarea.id] = textarea.value;
        await setProjectData(id, data);
    }

    return {
        getProjects, getActiveId, setActiveId,
        migrateAndInit, renderProjectSelector, loadActiveProjectIntoForm,
        switchProject, createNewProject, renameCurrentProject, deleteCurrentProject,
        saveActiveProjectField
    };
}
