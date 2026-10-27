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
  window.pultLogout = function () { try { localStorage.removeItem(KEY); } catch (e) { /* нет хранилища */ } location.hash = ""; location.reload(); };

  function gate(msg) {
    const g = document.createElement("div");
    g.id = "gate";
    g.innerHTML = `<form class="gate-card" autocomplete="on">
        <div class="gate-brand"><span class="wm">Gastro Ultima</span><small>Пульт управляющего</small></div>
        <h1>Вход</h1><p>Доступ выдаёт Gastro Ultima. Данные зашифрованы и открываются только после входа.</p>
        <label>Логин<input name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
        <label>Пароль<input name="pass" type="password" autocomplete="current-password" required></label>
        <label class="gate-rem"><input type="checkbox" name="rem" checked> Запомнить на этом устройстве</label>
        <div class="gate-err">${msg || ""}</div>
        <button class="btn y wide" type="submit">Войти</button>
      </form>`;
    document.body.appendChild(g);
    const f = g.querySelector("form");
    f.login.focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button"), err = f.querySelector(".gate-err");
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
