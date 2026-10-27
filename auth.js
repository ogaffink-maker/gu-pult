/* Вход в пульт: расшифровка data.enc.json в браузере (Web Crypto), затем загрузка app.js.
   Ключ данных хранится на устройстве, чтобы установленное приложение открывалось без пароля. */
(function () {
  "use strict";
  const KEY = "pult-session";
  const ub = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const bu = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
  let ENC = null;

  async function sha(s) {
    const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  async function openData(rawKey) {
    const k = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub(ENC.iv) }, k, ub(ENC.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async function unwrap(login, pass) {
    const id = await sha("pult:" + login.trim().toLowerCase());
    const a = ENC.accounts.find((x) => x.id === id);
    if (!a) throw new Error("login");
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    const kek = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: ub(a.salt), iterations: ENC.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    return { raw: await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub(a.iv) }, kek, ub(a.wk)), role: a.role };
  }
  function start(data, role) {
    window.DATA = data;
    window.PULT_ROLE = role;
    const g = document.getElementById("gate");
    if (g) g.remove();
    const s = document.createElement("script");
    s.src = "app.js";
    document.body.appendChild(s);
  }
  /* ---------- установка на телефон: показывается первой, ещё до входа ---------- */
  const ua = navigator.userAgent;
  const ENV = {
    standalone: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    ios: /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    android: /Android/.test(ua),
    inApp: /WhatsApp|Instagram|FBAN|FBAV|Telegram|TikTok|Line\/|; wv\)/.test(ua),
    mobile: /Android|iPhone|iPad|iPod/.test(ua) || matchMedia("(max-width: 767px)").matches,
  };
  ENV.iosSafari = ENV.ios && !ENV.inApp && !/CriOS|FxiOS|EdgiOS|YaBrowser|OPiOS/.test(ua);
  window.PULT_ENV = ENV;
  window.__bip = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__bip = e;
    document.dispatchEvent(new Event("pult-bip"));
    const b = document.getElementById("giBtn");
    if (b) b.textContent = "Установить на телефон";
  });
  window.addEventListener("appinstalled", () => { const c = document.getElementById("gInst"); if (c) c.remove(); });

  const SHARE = '<svg viewBox="0 0 24 24" class="gi-ico"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  // текст шага — в одном span, иначе <b> внутри grid-строки разъезжается по колонкам
  const installSteps = () => stepsRaw().replace(/<li>/g, "<li><span>").replace(/<\/li>/g, "</span></li>");
  function stepsRaw() {
    if (ENV.inApp) return `<p>Ссылка открыта внутри мессенджера — отсюда установить нельзя.</p><ol class="steps-i"><li>Нажмите <b>⋮</b> или <b>…</b> в углу экрана</li><li>Выберите <b>«Открыть в браузере»</b>${ENV.ios ? " (Safari)" : " (Chrome)"}</li><li>На открывшейся странице нажмите «Установить на телефон»</li></ol><button class="btn l wide" type="button" data-copy>Скопировать ссылку</button>`;
    if (ENV.iosSafari) return `<ol class="steps-i"><li>Нажмите <b>«Поделиться»</b> ${SHARE} в нижней панели Safari</li><li>Прокрутите вниз и выберите <b>«На экран „Домой“»</b></li><li>Нажмите <b>«Добавить»</b> — значок «Пульт» появится на экране</li></ol>`;
    if (ENV.ios) return `<p>На iPhone значок ставится только из <b>Safari</b>.</p><ol class="steps-i"><li>Скопируйте ссылку кнопкой ниже</li><li>Откройте Safari и вставьте её в адресную строку</li><li>Нажмите «Поделиться» ${SHARE} → «На экран „Домой“»</li></ol><button class="btn l wide" type="button" data-copy>Скопировать ссылку</button>`;
    if (ENV.android) return `<ol class="steps-i"><li>Нажмите <b>⋮</b> в правом верхнем углу браузера</li><li>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b></li><li>Подтвердите — значок «Пульт» появится на главном экране</li></ol><p class="gi-note">Если пункта нет, откройте ссылку в Google Chrome.</p>`;
    return `<p>В Chrome или Edge нажмите значок установки в правой части адресной строки, либо меню ⋮ → «Установить приложение».</p>`;
  }
  function installCard() {
    if (ENV.standalone || (!ENV.mobile && !window.__bip)) return "";
    return `<div class="gate-install" id="gInst">
        <div class="gi-h"><img src="icons/icon-192.png" alt=""><div><b>Установите пульт на телефон</b><small>Значок на главном экране, отчёты смены — уведомлениями</small></div></div>
        <button class="btn y wide" type="button" id="giBtn">Установить на телефон</button>
        <div class="gi-steps" id="giSteps" hidden></div>
      </div>`;
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href.split("#")[0]); alert("Ссылка скопирована"); }
    catch (e) { prompt("Скопируйте ссылку:", location.href.split("#")[0]); }
  }
  function wireInstall(root) {
    const btn = root.querySelector("#giBtn");
    if (!btn) return;
    btn.onclick = async () => {
      const bip = window.__bip;
      if (bip) {
        bip.prompt();
        const r = await bip.userChoice;
        window.__bip = null;
        if (r.outcome === "accepted") { try { sessionStorage.setItem("pult-install-dismissed", "1"); } catch (x) { /* без хранилища */ } root.querySelector("#gInst").innerHTML = '<div class="gi-done"><b>Готово!</b> Значок «Пульт» появился на главном экране — откройте его и войдите.</div>'; }
        return;
      }
      const s = root.querySelector("#giSteps");
      s.innerHTML = installSteps();
      s.hidden = !s.hidden;
      const c = s.querySelector("[data-copy]");
      if (c) c.onclick = copyLink;
    };
  }
  window.pultInstall = { card: installCard, wire: wireInstall, steps: installSteps };

  window.pultLogout = function () { try { localStorage.removeItem(KEY); } catch (e) { /* нет хранилища */ } location.hash = ""; location.reload(); };

  function gate(msg) {
    const g = document.createElement("div");
    g.id = "gate";
    g.innerHTML = `<div class="gate-wrap">${installCard()}<form class="gate-card" autocomplete="on">
        <div class="gate-brand"><span class="wm">Gastro Ultima</span><small>Пульт управляющего</small></div>
        <h1>Вход</h1><p>Доступ выдаёт Gastro Ultima. Данные зашифрованы и открываются только после входа.</p>
        <label>Логин<input name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
        <label>Пароль<input name="pass" type="password" autocomplete="current-password" required></label>
        <label class="gate-rem"><input type="checkbox" name="rem" checked> Запомнить на этом устройстве</label>
        <div class="gate-err">${msg || ""}</div>
        <button class="btn y wide" type="submit">Войти</button>
      </form></div>`;
    document.body.appendChild(g);
    wireInstall(g);
    const f = g.querySelector("form");
    if (!ENV.mobile) f.login.focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button[type=submit]"), err = f.querySelector(".gate-err");
      btn.disabled = true; btn.textContent = "Проверяем…"; err.textContent = "";
      try {
        const { raw, role } = await unwrap(f.login.value, f.pass.value);
        const data = await openData(raw);
        if (f.rem.checked) { try { localStorage.setItem(KEY, JSON.stringify({ k: bu(raw), role })); } catch (x) { /* без запоминания */ } }
        start(data, role);
      } catch (x) {
        err.textContent = "Неверный логин или пароль";
        btn.disabled = false; btn.textContent = "Войти";
      }
    };
  }

  async function boot() {
    if (window.DATA) return start(window.DATA, "Демо");
    try { ENC = await (await fetch("data.enc.json", { cache: "no-cache" })).json(); }
    catch (e) { document.body.insertAdjacentHTML("beforeend", '<div id="gate"><div class="gate-card"><h1>Нет связи</h1><p>Не удалось загрузить данные. Проверьте интернет и обновите страницу.</p></div></div>'); return; }
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { /* нет хранилища */ }
    if (saved) {
      try { return start(await openData(ub(saved.k)), saved.role); }
      catch (e) { try { localStorage.removeItem(KEY); } catch (x) { /* нет хранилища */ } return gate("Данные обновились — войдите заново"); }
    }
    gate();
  }
  boot();
})();
