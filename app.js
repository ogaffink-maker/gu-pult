/* Пульт управляющего: одна страница, данные — window.DATA (собирает build_data.py, расшифровывает auth.js) */
(function () {
  "use strict";
  const D = window.DATA;
  const V = D.venue, VS = V.short || V.name, VB = V.badge || VS.slice(0, 2).toUpperCase();
  const days = D.days;
  const byDate = Object.fromEntries(days.map((d, i) => [d.date, i]));
  const LAST = days[days.length - 1];
  const NOW = new Date(D.now);
  const $ = (s, r = document) => r.querySelector(s);
  const main = $("#main");

  /* ---------------------------------------------------------------- формат */
  const NB = " ";
  const fmtInt = (x) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const money = (x) => fmtInt(x) + NB + "₸";
  const mln = (x, dp = 2) => (x / 1e6).toFixed(dp).replace(".", ",").replace(/,?0+$/, "");
  const compact = (x) => {
    const a = Math.abs(x);
    if (a >= 1e6) return mln(x, a >= 1e7 ? 1 : 2) + NB + "млн" + NB + "₸";
    if (a >= 1e3) return fmtInt(x / 1e3) + NB + "тыс" + NB + "₸";
    return fmtInt(x) + NB + "₸";
  };
  const axisMoney = (x) => (x === 0 ? "0" : x >= 1e6 ? mln(x, 1) + " млн" : fmtInt(x / 1e3) + " тыс");
  const pct = (x, dp = 1) => (x * 100).toFixed(dp).replace(".", ",") + "%";
  const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const WDF = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const MG = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MN = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const pd = (s) => new Date(s + "T12:00:00");
  const dShort = (s) => { const d = pd(s); return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const dLong = (s) => { const d = pd(s); return `${d.getDate()} ${MG[d.getMonth()]}`; };
  const dFull = (s) => { const d = pd(s); const w = WDF[d.getDay()]; return w[0].toUpperCase() + w.slice(1) + ", " + dLong(s); };
  const dWd = (s) => WD[pd(s).getDay()] + ", " + dShort(s);
  const monthName = (m) => MN[parseInt(m, 10) - 1];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    shift: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    sales: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    control: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    finance: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2.1c0 3 6 1.6 6 4.6 0 1.3-1.3 2.3-3 2.3s-3-.8-3-2"/>',
    team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.7.8 2.8 2.6 3 5.2"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>', down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    critical: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M12 8v5M12 16.5v.01"/>',
    serious: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/>',
    warning: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
    good: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
  };
  const ico = (k, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}">${I[k]}</svg>`;
  const SEVN = { critical: "Критично", serious: "Важно", warning: "Внимание", good: "Хорошо", info: "Инфо" };
  const SEVW = { critical: 4, serious: 3, warning: 2, info: 1, good: 0 };

  function delta(cur, base, opt = {}) {
    if (!base) return "";
    const d = (cur - base) / base;
    const good = opt.inverse ? d < 0 : d > 0;
    const cls = Math.abs(d) < 0.02 ? "flat" : good ? "up" : "dn";
    const arrow = Math.abs(d) < 0.02 ? "" : ico(d > 0 ? "up" : "down");
    return `<span class="delta ${cls}">${arrow}${d > 0 ? "+" : d < 0 ? "−" : ""}${pct(Math.abs(d), Math.abs(d) < 0.1 ? 1 : 0)}</span>`;
  }

  /* ---------------------------------------------------------------- тултип */
  const tip = $("#tip");
  function showTip(e, html) {
    tip.innerHTML = html;
    tip.classList.add("on");
    const pt = e.touches ? e.touches[0] : e;
    const r = tip.getBoundingClientRect();
    let x = pt.clientX + 14, y = pt.clientY - r.height - 12;
    if (x + r.width > innerWidth - 8) x = pt.clientX - r.width - 14;
    if (x < 8) x = 8;
    if (y < 8) y = pt.clientY + 18;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => tip.classList.remove("on");
  const trow = (k, v) => `<div class="row"><span>${k}</span><b style="display:inline">${v}</b></div>`;
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }

  /* ---------------------------------------------------------------- графики */
  function ticks(max, n = 4) {
    const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    const out = []; for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
    if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
    return out;
  }
  const barPath = (x, y, w, h, r = 4) => {
    if (h <= 0) return "";
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };

  /* Столбцы с нормой (ступенька) и опциональной линией; одна ось */
  function barChart(el, o) {
    const W = Math.max(el.clientWidth, 260), H = o.h || 220;
    const pr = 6, pt = 12, pb = 24;
    const fy = o.yFmt || axisMoney;
    const n = o.data.length, ih = H - pt - pb;
    const vals = o.data.flatMap((d) => [d.v || 0, d.norm || 0, d.line || 0]);
    if (o.target) vals.push(o.target);
    const T = ticks(Math.max(...vals) || 1, o.nt || 4), ymax = T[T.length - 1];
    const pl = Math.max(28, Math.round(Math.max(...T.map((t) => fy(t).length)) * 6.4) + 12), iw = W - pl - pr;
    const y = (v) => pt + ih - (v / ymax) * ih;
    const band = iw / n, bw = Math.max(2, Math.min(o.bw || 22, band * 0.62));
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || "")}"><g class="grid">`;
    T.forEach((t) => { s += `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`; });
    s += "</g>";
    T.forEach((t) => { s += `<text class="ax" x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${fy(t)}</text>`; });
    if (o.band) s += `<rect x="${pl}" width="${iw}" y="${y(o.band[1])}" height="${y(o.band[0]) - y(o.band[1])}" fill="${o.dark ? "rgba(12,163,12,.14)" : "#E6F4E6"}"/>`;
    o.data.forEach((d, i) => {
      const cx = pl + band * i + band / 2;
      d._x = cx;
      if (d.v) {
        const fill = d.hl ? "var(--yellow)" : d.color || (o.dark ? "#6F6B63" : o.barColor || "var(--bar)");
        s += `<path class="bar" data-i="${i}" d="${barPath(cx - bw / 2, y(d.v), bw, y(0) - y(d.v))}" fill="${fill}" opacity="${d.faded ? 0.35 : 1}"/>`;
      }
    });
    if (o.data.some((d) => d.norm)) {
      let p = "", open = false;
      o.data.forEach((d, i) => {
        const x0 = pl + band * i + 1, x1 = pl + band * (i + 1) - 1;
        if (d.norm) { p += `${open ? "L" : "M"}${x0},${y(d.norm)}L${x1},${y(d.norm)}`; open = o.stepJoin !== false; } else open = false;
      });
      s += `<path d="${p}" fill="none" stroke="${o.dark ? "#8A857B" : "var(--norm)"}" stroke-width="2" stroke-dasharray="${o.normDash || "0"}" stroke-linejoin="round"/>`;
    }
    if (o.data.some((d) => d.line)) {
      const pts = o.data.map((d, i) => (d.line ? `${pl + band * i + band / 2},${y(d.line)}` : null)).filter(Boolean);
      s += `<polyline points="${pts.join(" ")}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    if (o.target) {
      s += `<line x1="${pl}" x2="${W - pr}" y1="${y(o.target)}" y2="${y(o.target)}" stroke="var(--good)" stroke-width="1.5"/>`;
      s += `<text class="ax" x="${W - pr}" y="${y(o.target) - 6}" text-anchor="end" style="fill:var(--good-ink);font-weight:700">${esc(o.targetLabel || "")}</text>`;
    }
    const every = Math.max(1, Math.ceil(n / Math.max(1, iw / (o.xw || 46))));
    o.data.forEach((d, i) => {
      if ((n - 1 - i) % every === 0 || o.allX) s += `<text class="ax" x="${d._x}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    o.data.forEach((d, i) => { s += `<rect class="hit" data-i="${i}" x="${pl + band * i}" y="${pt}" width="${band}" height="${ih}"/>`; });
    s += "</svg>";
    el.innerHTML = s;
    el.querySelectorAll(".hit").forEach((h) => {
      const i = +h.dataset.i, d = o.data[i];
      const bar = el.querySelector(`.bar[data-i="${i}"]`);
      const on = (e) => { if (bar) bar.style.opacity = 0.75; if (o.tip) showTip(e, o.tip(d, i)); };
      const off = () => { if (bar) bar.style.opacity = d.faded ? 0.35 : 1; hideTip(); };
      h.addEventListener("mousemove", on); h.addEventListener("mouseleave", off);
      h.addEventListener("touchstart", on, { passive: true }); h.addEventListener("touchend", () => setTimeout(off, 1500));
      if (o.onClick) h.addEventListener("click", () => { hideTip(); o.onClick(d, i); });
    });
  }

  function spark(el, vals, opt = {}) {
    const W = Math.max(el.clientWidth, 120), H = opt.h || 34;
    const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    const x = (i) => 3 + (i / (vals.length - 1)) * (W - 8), y = (v) => 3 + (H - 6) - ((v - mn) / r) * (H - 6);
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const li = vals.length - 1;
    el.innerHTML = `<svg width="${W}" height="${H}"><polyline points="${pts}" fill="none" stroke="#C9C2B3" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(li)}" cy="${y(vals[li])}" r="4" fill="var(--ink)" stroke="#fff" stroke-width="2"/></svg>`;
  }

  /* ---------------------------------------------------------------- данные: помощники */
  const range = (endIdx, n) => days.slice(Math.max(0, endIdx - n + 1), endIdx + 1);
  const sum = (a, f) => a.reduce((s, d) => s + (f(d) || 0), 0);
  const chk = (d) => d.rev / Math.max(d.orders, 1);
  const recentSignals = (n, endIdx = days.length - 1) => {
    const out = [];
    range(endIdx, n).forEach((d) => d.signals.forEach((s) => out.push({ ...s, date: d.date })));
    return out.sort((a, b) => SEVW[b.sev] - SEVW[a.sev] || b.date.localeCompare(a.date));
  };
  const alertCount = (d) => d.signals.filter((s) => s.sev === "critical" || s.sev === "serious").length;

  function shiftMessage(d) {
    const peakH = d.hours.indexOf(Math.max(...d.hours));
    const top = (d.top || []).slice(0, 3).map((t) => `${t.n} — ${t.q}`).join(", ");
    const bad = d.signals.filter((s) => s.sev !== "good" && s.sev !== "info");
    const lines = [
      `Выручка ${compact(d.rev)}` + (d.norm ? ` (${d.rev >= d.norm ? "+" : "−"}${pct(Math.abs(d.rev / d.norm - 1), 0)} к норме)` : ""),
      `Гостей ${d.guests} · заказов ${d.orders} · средний чек ${money(chk(d))}`,
      `Пик: ${peakH}:00–${peakH + 1}:00 — ${compact(d.hours[peakH])}`,
    ];
    if (top) lines.push(`Топ: ${top}`);
    lines.push(bad.length ? `Сигналы (${bad.length}): ` + bad.map((s) => s.title).join("; ") : "Сигналов нет — смена в норме");
    return lines.join("\n");
  }

  function sigHTML(s, showDate = true) {
    return `<div class="sig ${s.sev}"><div class="ico">${ico(s.sev)}</div><div><b>${esc(s.title)}</b><p>${esc(s.text)}</p></div>
      <div class="meta"><span class="tag ${s.sev}">${SEVN[s.sev]}</span>${showDate && s.date ? `<div>${esc(s.area)} · ${dWd(s.date)}</div>` : `<div>${esc(s.area)}</div>`}</div></div>`;
  }

  /* ---------------------------------------------------------------- навигация */
  const ROUTES = [
    { id: "", name: "Обзор", ic: "home" },
    { id: "shift", name: "Отчёт смены", tab: "Смена", ic: "shift" },
    { id: "sales", name: "Продажи", ic: "sales" },
    { id: "control", name: "Контроль", ic: "control" },
    { id: "finance", name: "Экономика", ic: "finance" },
    { id: "team", name: "Команда", ic: "team" },
    { id: "notify", name: "Уведомления", ic: "bell" },
  ];
  const ctrlCount = recentSignals(7).filter((s) => s.sev === "critical" || s.sev === "serious").length;
  function renderNav(cur) {
    $("#nav").innerHTML = ROUTES.map((r) => `<a href="#/${r.id}" class="${cur === r.id ? "on" : ""}">${ico(r.ic)}${r.name}${r.id === "control" && ctrlCount ? `<span class="cnt">${ctrlCount}</span>` : ""}</a>`).join("");
    const tabs = [ROUTES[0], ROUTES[1], ROUTES[2], ROUTES[3], { id: "more", name: "Ещё", ic: "more" }];
    const inMore = ["finance", "team", "notify", "more"].includes(cur);
    $("#tabbar").innerHTML = tabs.map((r) => `<a href="#/${r.id}" class="${cur === r.id || (r.id === "more" && inMore) ? "on" : ""}">${ico(r.ic)}${r.tab || r.name}${r.id === "control" && ctrlCount ? `<span class="cnt">${ctrlCount}</span>` : ""}</a>`).join("");
  }
  $("#syncTime").textContent = `${dShort(D.live.date)} в ${D.live.asOf}`;
  $("#vName").textContent = V.name; $("#vCity").textContent = `${V.city} · iiko подключено`; $("#mName").textContent = VS;
  if (V.next) $("#vNext").textContent = V.next; else $(".venue-next").remove();
  $("#who").textContent = window.PULT_ROLE || "";
  $("#mDate").textContent = `${dFull(D.live.date)} · ${D.live.asOf}`;
  $("#bellCount").textContent = alertCount(LAST) || "";

  const head = (eyebrow, title, sub, tools = "") =>
    `<div class="ph"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="ph-tools">${tools}</div></div>`;

  /* ================================================================ ОБЗОР */
  function pageOverview() {
    const L = D.live, li = days.length - 1;
    const greet = NOW.getHours() < 12 ? "Доброе утро" : NOW.getHours() < 18 ? "Добрый день" : "Добрый вечер";
    const w7 = range(li, 7), p7 = range(li - 7, 7);
    const pre30 = range(li, 28).filter((d) => d.afterPre != null);
    const preShare = (a) => sum(a, (d) => d.afterPre) / sum(a, (d) => d.rev);
    // одна строка на тип сигнала: самый свежий случай и сколько дней из семи он повторялся
    const groups = {};
    recentSignals(7).filter((s) => s.sev !== "info").forEach((s) => {
      const k = s.title.split(" —")[0].split(":")[0].replace(/ на \d+%.*/, "");
      const g = groups[k] || (groups[k] = { ...s, n: 0, sevMax: s.sev });
      g.n++;
      if (s.date > g.date) Object.assign(g, { title: s.title, text: s.text, date: s.date });
      if (SEVW[s.sev] > SEVW[g.sevMax]) g.sevMax = s.sev;
    });
    const sigs = Object.values(groups).map((g) => ({ ...g, sev: g.sevMax, area: g.n > 1 ? `${g.n} дн. из 7` : g.area }))
      .sort((a, b) => SEVW[b.sev] - SEVW[a.sev] || b.n - a.n).slice(0, 4);
    const devNow = L.rev / L.normToNow - 1;
    main.innerHTML = head(`${dFull(L.date)} · ${L.asOf}`, greet, `${V.name} · данные iiko обновляются каждые 15 минут`,
      `<a class="btn l hide-m" href="#/shift/${LAST.date}">${ico("shift")}Отчёт за ${dShort(LAST.date)}</a><button class="btn y" id="sendRep">${ico("send")}Прислать отчёт на телефон</button>`) +
      `<div class="g c12 fade-in">
        <section class="card dark livecard s7">
          <div class="live-top"><span class="pill"><span class="dot live"></span>Сейчас · сегодня</span><span class="live-when">${WDF[pd(L.date).getDay()]}, на ${L.asOf}</span></div>
          <div class="hero"><span class="v">${fmtInt(L.rev)}</span><span class="u">₸</span></div>
          <div class="hero-sub">${delta(L.rev, L.normToNow)}<span>к норме на ${L.asOf} — ${compact(L.normToNow)}</span></div>
          <div class="prog"><div class="prog-bar"><i style="width:${Math.min(100, (L.rev / L.normDay) * 100)}%"></i><em style="left:${Math.min(100, (L.normToNow / L.normDay) * 100)}%" title="Норма к этому часу"></em></div>
            <div class="prog-lbl"><span>Прогноз на день · <b>${compact(L.forecast)}</b></span><span>Норма пятницы · <b>${compact(L.normDay)}</b></span></div></div>
          <div class="live-chart chart" id="liveChart"></div>
          <div class="mini-stats"><div><small>Заказов</small><b>${L.orders}</b></div><div><small>Средний чек</small><b>${money(L.rev / L.orders)}</b></div><div><small>${devNow < -0.05 ? "Отставание" : "Запас"} к норме</small><b>${compact(Math.abs(L.rev - L.normToNow))}</b></div></div>
        </section>
        <section class="card s5">
          <div class="ch"><div><h2>Отчёт за вчерашнюю смену</h2><small>${dFull(LAST.date)} · пришёл в 00:30</small></div><a class="more" href="#/shift/${LAST.date}">Открыть</a></div>
          <div class="msg"><div class="msg-meta"><span class="ic">${VB}</span>${VS} · смена ${dShort(LAST.date)}</div>${esc(shiftMessage(LAST))}</div>
          <div class="sigs compact" style="margin-top:12px">${LAST.signals.slice(0, 2).map((s) => sigHTML(s, false)).join("") || `<div class="empty"><b>Смена прошла в норме</b>отклонений не найдено</div>`}</div>
        </section>
      </div>
      <div class="g c12 tiles2 fade-in">
        ${tile("Выручка за 7 дней", compact(sum(w7, (d) => d.rev)), delta(sum(w7, (d) => d.rev), sum(p7, (d) => d.rev)), "к прошлой неделе", range(li, 28).map((d) => d.rev))}
        ${tile("Гостей за 7 дней", fmtInt(sum(w7, (d) => d.guests)), delta(sum(w7, (d) => d.guests), sum(p7, (d) => d.guests)), "к прошлой неделе", range(li, 28).map((d) => d.guests))}
        ${tile("Средний чек", money(sum(w7, (d) => d.rev) / sum(w7, (d) => d.orders)), delta(sum(w7, (d) => d.rev) / sum(w7, (d) => d.orders), sum(p7, (d) => d.rev) / sum(p7, (d) => d.orders)), "к прошлой неделе", range(li, 28).map(chk))}
        ${tile("Удаления после пречека", pct(preShare(w7)), delta(preShare(w7), preShare(p7), { inverse: true }), "цель — не выше 1%", pre30.map((d) => d.afterPre / d.rev))}
      </div>
      <div class="g c12 fade-in">
        <section class="card s8">
          <div class="ch"><div><h2>Выручка по дням</h2><small>Последние 5 недель · нажмите на день, чтобы открыть отчёт смены</small></div><div class="hide-m"><span class="key"><i></i>выручка</span><span class="key"><i class="n"></i>норма дня недели</span></div></div>
          <div class="chart" id="revChart"></div>
        </section>
        <section class="card s4">
          <div class="ch"><div><h2>Сигналы за неделю</h2><small>Отклонения, которые требуют решения</small></div><a class="more" href="#/control">Все</a></div>
          <div class="sigs compact">${sigs.map((s) => sigHTML(s)).join("")}</div>
        </section>
      </div>
      <div class="g c12 fade-in">
        <section class="card s6">
          <div class="ch"><div><h2>Удаления после пречека по неделям</h2><small>Доля выручки · цель — не выше 1%</small></div></div>
          <div class="chart" id="delChart"></div>
          <p class="note">Последние недели — 4–5% выручки при цели 1%: удаление после пречека пока не требует ПИН-кода менеджера.</p>
        </section>
        <section class="card s6">
          <div class="ch"><div><h2>Что продавали вчера</h2><small>Топ блюд смены ${dShort(LAST.date)} по выручке</small></div></div>
          ${topTable(LAST, 7)}
        </section>
      </div>`;

    const hrs = [];
    for (let h = 8; h < 24; h++) hrs.push({ label: h + "", h, v: h < L.hours.length ? L.hours[h] : 0, norm: L.hoursNorm[h], hl: h < L.hours.length });
    draw("#liveChart", (el) => barChart(el, { data: hrs, h: 150, dark: true, pl: 46, xw: 26, bw: 16, tip: (d) => `<b>${d.h}:00–${d.h + 1}:00</b>${d.h < L.hours.length ? trow("Сегодня", compact(d.v)) : trow("Сегодня", "ещё впереди")}${trow("Норма", compact(d.norm))}` }));
    const r35 = range(li, 35).map((d) => ({ label: dShort(d.date), v: d.rev, norm: d.norm, d, hl: d.date === LAST.date }));
    draw("#revChart", (el) => barChart(el, { data: r35, h: 290, onClick: (x) => go("#/shift/" + x.d.date), tip: (x) => `<b>${dFull(x.d.date)}</b>${trow("Выручка", compact(x.v))}${trow("Норма", x.norm ? compact(x.norm) : "—")}${trow("Гостей", x.d.guests)}${trow("Сигналов", x.d.signals.filter((s) => s.sev !== "good").length)}` }));
    drawDelWeeks("#delChart", 11);
    sparkAll();
    $("#sendRep").onclick = () => notifyReport(LAST);
  }

  function tile(lb, v, dl, sub, series) {
    return `<section class="card tile s3"><div class="lb">${lb}</div><div class="v">${v}</div><div class="sub">${dl}<span>${sub}</span></div><div class="spark" data-s="${series.map((x) => +x.toFixed(4)).join(",")}"></div></section>`;
  }
  function sparkAll() { document.querySelectorAll(".spark").forEach((el) => spark(el, el.dataset.s.split(",").map(Number))); }
  function topTable(d, n) {
    if (!d.top) return `<div class="empty">Нет данных по блюдам за этот день</div>`;
    const mx = d.top[0].s;
    return `<table class="t"><tr><th>Блюдо</th><th class="r">Порций</th><th class="r">Выручка</th></tr>${d.top.slice(0, n).map((t, i) =>
      `<tr><td class="n">${esc(t.n)}</td><td class="r">${t.q}</td><td class="r"><div class="inbar"><i class="${i === 0 ? "y" : ""}" style="width:${Math.round((t.s / mx) * 70)}px"></i>${compact(t.s)}</div></td></tr>`).join("")}</table>`;
  }
  function drawDelWeeks(sel, n) {
    const w = D.delWeeks.slice(-n);
    draw(sel, (el) => barChart(el, {
      data: w.map((x, i) => ({ label: dShort(x.w), v: x.share, x, hl: i === w.length - 1 })), h: 210, yFmt: (v) => pct(v, Math.round(v * 1000) % 10 ? 1 : 0), target: D.targets.afterPre, targetLabel: "цель 1%", bw: 26,
      tip: (d) => `<b>Неделя с ${dLong(d.x.w)}</b>${trow("Доля выручки", pct(d.v))}${trow("Сумма", compact(d.x.sum))}`,
    }));
  }

  /* ================================================================ СМЕНА */
  function pageShift(date) {
    const i = byDate[date] ?? days.length - 1, d = days[i], prev = days[i - 1], next = days[i + 1];
    const disc = d.disc / d.rev;
    const payTot = Object.values(d.pay).reduce((a, b) => a + b, 0) || 1;
    const PAYC = { Kaspi: "#2a78d6", Halyk: "#eb6834", "Наличные": "#1baf7a", "Доставка": "#eda100", "Прочее": "#e87ba4" };
    const payKeys = Object.keys(PAYC).filter((k) => d.pay[k]);
    main.innerHTML = head("Отчёт смены", dFull(d.date), "Смена 08:00–24:00 · отчёт формируется автоматически после закрытия кассы",
      `<div class="datenav"><button ${prev ? "" : "disabled"} id="pv" aria-label="Предыдущий день">${ico("left")}</button><span>${dWd(d.date)}</span><button ${next ? "" : "disabled"} id="nx" aria-label="Следующий день">${ico("right")}</button></div><button class="btn y" id="sendRep">${ico("send")}<span class="hide-m">Прислать на телефон</span><span class="show-m">Прислать</span></button>`) +
      `<div class="g c12 fade-in">
        <section class="card s5">
          <div class="ch"><div><h2>Сообщение управляющему</h2><small>Так отчёт приходит на телефон</small></div></div>
          <div class="msg"><div class="msg-meta"><span class="ic">${VB}</span>${VS} · смена ${dShort(d.date)}</div>${esc(shiftMessage(d))}</div>
        </section>
        <section class="card s7">
          <div class="ch"><div><h2>Итоги смены</h2><small>Сравнение с нормой — медианой того же дня недели за 4 недели</small></div></div>
          <div class="g c12 kvgrid" style="gap:18px 14px">
            ${kv("Выручка", compact(d.rev), delta(d.rev, d.norm))}
            ${kv("Гостей", d.guests, delta(d.guests, d.normGuests))}
            ${kv("Заказов", d.orders, delta(d.orders, d.normOrders))}
            ${kv("Средний чек", money(chk(d)), delta(chk(d), d.normCheck))}
            ${kv("Скидки", pct(disc), `<span class="tag ${disc > 0.02 ? "warning" : "good"}">${disc > 0.02 ? "выше обычного" : "в норме"}</span>`)}
            ${kv("Удаления после пречека", d.afterPre == null ? "—" : compact(d.afterPre), d.afterPre == null ? "" : `<span class="tag ${d.afterPre / d.rev > 0.01 ? "critical" : "good"}">${pct(d.afterPre / d.rev)} выручки</span>`)}
          </div>
        </section>
      </div>
      <div class="g c12 fade-in">
        <section class="card s8">
          <div class="ch"><div><h2>Выручка по часам</h2><small>По времени открытия заказа</small></div><div class="hide-m"><span class="key"><i></i>смена</span><span class="key"><i class="n"></i>норма</span></div></div>
          <div class="chart" id="hourChart"></div>
        </section>
        <section class="card s4">
          <div class="ch"><div><h2>Сигналы смены</h2><small>${d.signals.length ? "Отклонения от нормы и правил" : ""}</small></div></div>
          <div class="sigs compact">${d.signals.map((s) => sigHTML(s, false)).join("") || `<div class="empty"><b>Отклонений нет</b>смена прошла в пределах нормы</div>`}</div>
        </section>
      </div>
      <div class="g c12 fade-in">
        <section class="card s6"><div class="ch"><div><h2>Топ блюд</h2><small>По выручке за смену</small></div></div>${topTable(d, 10)}</section>
        <section class="card s6">
          <div class="ch"><div><h2>Оплаты</h2><small>Структура выручки по способам оплаты</small></div></div>
          <div class="stack">${payKeys.map((k) => `<i style="width:${(d.pay[k] / payTot) * 100}%;background:${PAYC[k]}" title="${k}"></i>`).join("")}</div>
          <div class="stack-lg">${payKeys.map((k) => `<span><i style="background:${PAYC[k]}"></i>${k} <b>${pct(d.pay[k] / payTot, d.pay[k] / payTot < 0.01 ? 1 : 0)}</b></span>`).join("")}</div>
          <div class="ch" style="margin:22px 0 8px"><div><h2>Удаления после пречека — кто</h2></div></div>
          ${d.afterPreWho && d.afterPreWho.length ? `<table class="t"><tr><th>Сотрудник</th><th class="r">Сумма</th></tr>${d.afterPreWho.map(([w, v]) => `<tr><td class="n">${esc(w)}</td><td class="r">${money(v)}</td></tr>`).join("")}</table>` : `<div class="empty">${d.afterPre == null ? "Данные по пречекам доступны с 01.08" : "<b>Удалений после пречека нет</b>"}</div>`}
          <p class="note">Удалено заказов целиком: ${d.ordersDel[0]} на ${compact(d.ordersDel[1])} · всего удалено позиций на ${compact(d.delAll)}</p>
        </section>
      </div>`;
    if (prev) $("#pv").onclick = () => go("#/shift/" + prev.date);
    if (next) $("#nx").onclick = () => go("#/shift/" + next.date);
    $("#sendRep").onclick = () => notifyReport(d);
    const hrs = [];
    for (let h = 8; h < 24; h++) hrs.push({ label: h + "", h, v: d.hours[h], norm: d.hoursNorm[h], o: d.hoursOrders[h] });
    const peak = Math.max(...hrs.map((x) => x.v));
    hrs.forEach((x) => (x.hl = x.v === peak));
    draw("#hourChart", (el) => barChart(el, { data: hrs, h: 230, xw: 28, tip: (x) => `<b>${x.h}:00–${x.h + 1}:00</b>${trow("Выручка", compact(x.v))}${trow("Норма", compact(x.norm))}${trow("Заказов", x.o)}` }));
  }
  const kv = (k, v, dl) => `<div class="kv s4"><small>${k}</small><b>${v}</b><div>${dl || ""}</div></div>`;

  /* ================================================================ ПРОДАЖИ */
  let salesN = 30;
  function pageSales() {
    const li = days.length - 1, n = salesN === 0 ? days.length : salesN;
    const cur = range(li, n), prv = salesN === 0 ? [] : range(li - n, n);
    const r = (a) => sum(a, (d) => d.rev);
    const per = salesN === 0 ? "с 14 мая" : `${n} дней`;
    main.innerHTML = head("Продажи", "Продажи и спрос", `Период: ${per} · по ${dLong(LAST.date)}`,
      `<div class="seg" id="seg">${[[7, "7 дней"], [30, "30 дней"], [90, "90 дней"], [0, "Всё"]].map(([k, l]) => `<button data-k="${k}" class="${k === salesN ? "on" : ""}">${l}</button>`).join("")}</div>`) +
      `<div class="g c12 tiles2 fade-in">
        ${tile("Выручка", compact(r(cur)), prv.length ? delta(r(cur), r(prv)) : "", prv.length ? "к прошлому периоду" : "", cur.map((d) => d.rev))}
        ${tile("В среднем за день", compact(r(cur) / cur.length), prv.length ? delta(r(cur) / cur.length, r(prv) / prv.length) : "", prv.length ? "к прошлому периоду" : "", cur.map((d) => d.rev))}
        ${tile("Гостей", fmtInt(sum(cur, (d) => d.guests)), prv.length ? delta(sum(cur, (d) => d.guests), sum(prv, (d) => d.guests)) : "", prv.length ? "к прошлому периоду" : "", cur.map((d) => d.guests))}
        ${tile("Средний чек", money(r(cur) / sum(cur, (d) => d.orders)), prv.length ? delta(r(cur) / sum(cur, (d) => d.orders), r(prv) / sum(prv, (d) => d.orders)) : "", prv.length ? "к прошлому периоду" : "", cur.map(chk))}
      </div>
      <div class="g c12 fade-in"><section class="card s12">
        <div class="ch"><div><h2>Выручка по дням</h2><small>Нажмите на день, чтобы открыть отчёт смены</small></div><div class="hide-m"><span class="key"><i style="background:#D9D3C5"></i>по дням</span><span class="key"><i style="height:2px;background:var(--ink)"></i>среднее за 7 дней</span></div></div>
        <div class="chart" id="salesChart"></div></section></div>
      <div class="g c12 fade-in">
        <section class="card s7"><div class="ch"><div><h2>Загрузка по дням недели и часам</h2><small>Средняя выручка за час · наведите на ячейку</small></div></div><div class="scroll-x" id="heat"></div></section>
        <section class="card s5"><div class="ch"><div><h2>Способы оплаты и доставка</h2><small>Доля выручки за период</small></div></div><div id="payMix"></div></section>
      </div>
      <div class="g c12 fade-in"><section class="card s12">
        <div class="ch"><div><h2>ABC-анализ блюд</h2><small>30 дней по ${dLong(LAST.date)} · A — 80% выручки, B — следующие 15%, C — остальные 5%</small></div><div class="hide-m" id="abcSum"></div></div>
        <div class="scroll-x" id="abc"></div></section></div>`;
    $("#seg").onclick = (e) => { const b = e.target.closest("button"); if (b) { salesN = +b.dataset.k; pending.length = 0; pageSales(); } };
    sparkAll();
    const ma = cur.map((d, i) => { const j = days.indexOf(d); const w = days.slice(Math.max(0, j - 6), j + 1); return w.length === 7 ? sum(w, (x) => x.rev) / 7 : null; });
    draw("#salesChart", (el) => barChart(el, { data: cur.map((d, i) => ({ label: dShort(d.date), v: d.rev, line: ma[i], d })), h: 260, barColor: "#D9D3C5", bw: 18, onClick: (x) => go("#/shift/" + x.d.date), tip: (x) => `<b>${dFull(x.d.date)}</b>${trow("Выручка", compact(x.v))}${x.line ? trow("Среднее за 7 дней", compact(x.line)) : ""}${trow("Гостей", x.d.guests)}` }));
    // тепловая карта: средняя выручка в час по дням недели
    const acc = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => [0, 0]));
    cur.forEach((d) => { const w = (pd(d.date).getDay() + 6) % 7; d.hours.forEach((v, h) => { acc[w][h][0] += v; acc[w][h][1]++; }); });
    const H0 = 8, H1 = 23;
    let mx = 0; acc.forEach((r) => r.forEach((c, h) => { if (h >= H0 && h <= H1 && c[1]) mx = Math.max(mx, c[0] / c[1]); }));
    const ramp = (t) => { const a = [255, 246, 214], b = [168, 116, 0]; return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * Math.pow(t, 0.85))).join(",")})`; };
    const WDN = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    let ht = `<table class="hm"><tr><th class="rl"></th>${Array.from({ length: H1 - H0 + 1 }, (_, k) => `<th>${H0 + k}</th>`).join("")}</tr>`;
    acc.forEach((r, w) => {
      ht += `<tr><td class="rl">${WDN[w]}</td>`;
      for (let h = H0; h <= H1; h++) { const v = r[h][1] ? r[h][0] / r[h][1] : 0; ht += `<td data-t="${WDN[w]}, ${h}:00–${h + 1}:00|${compact(v)}" style="background:${v ? ramp(v / mx) : "var(--sand)"}"></td>`; }
      ht += "</tr>";
    });
    ht += `</table><div class="legend-ramp"><span>меньше</span><i style="background:linear-gradient(90deg,${ramp(0)},${ramp(0.5)},${ramp(1)})"></i><span>больше · до ${compact(mx)} в час</span></div>`;
    $("#heat").innerHTML = ht;
    $("#heat").querySelectorAll("td[data-t]").forEach((td) => {
      const [a, b] = td.dataset.t.split("|");
      td.onmousemove = (e) => showTip(e, `<b>${a}</b>${trow("Средняя выручка", b)}`); td.onmouseleave = hideTip;
    });
    // оплаты
    const PAYC = { Kaspi: "#2a78d6", Halyk: "#eb6834", "Наличные": "#1baf7a", "Доставка": "#eda100", "Прочее": "#e87ba4" };
    const pt = {}; cur.forEach((d) => Object.entries(d.pay).forEach(([k, v]) => (pt[k] = (pt[k] || 0) + v)));
    const tot = Object.values(pt).reduce((a, b) => a + b, 0) || 1;
    const keys = Object.keys(PAYC).filter((k) => pt[k]);
    $("#payMix").innerHTML = `<div class="stack" style="height:18px">${keys.map((k) => `<i style="width:${(pt[k] / tot) * 100}%;background:${PAYC[k]}"></i>`).join("")}</div>
      <table class="t" style="margin-top:14px"><tr><th>Способ</th><th class="r">Доля</th><th class="r">Сумма</th></tr>${keys.map((k) => `<tr><td class="n"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${PAYC[k]};margin-right:8px"></span>${k}</td><td class="r">${pct(pt[k] / tot)}</td><td class="r">${compact(pt[k])}</td></tr>`).join("")}</table>
      <p class="note">Доставка — Glovo, Wolt и Яндекс, подключены в октябре. Комиссию агрегаторов стоит закладывать в цену блюд доставки.</p>`;
    // ABC
    const A = D.abc, cnt = { A: 0, B: 0, C: 0 }; A.forEach((x) => cnt[x.c]++);
    $("#abcSum").innerHTML = `<span class="tag a">A · ${cnt.A}</span> <span class="tag b">B · ${cnt.B}</span> <span class="tag c">C · ${cnt.C}</span>`;
    const tot2 = A.reduce((s, x) => s + x.s, 0), m0 = A[0].s;
    $("#abc").innerHTML = `<table class="t"><tr><th>#</th><th>Блюдо</th><th class="hide-m">Группа</th><th class="r">Порций</th><th class="r">Доля</th><th class="r">Выручка</th><th>Класс</th></tr>${A.slice(0, 15).map((x, i) =>
      `<tr><td>${i + 1}</td><td class="n">${esc(x.n)}</td><td class="hide-m">${esc(x.g || "")}</td><td class="r">${fmtInt(x.q)}</td><td class="r">${pct(x.s / tot2)}</td><td class="r"><div class="inbar"><i class="${i < 3 ? "y" : ""}" style="width:${Math.round((x.s / m0) * 80)}px"></i>${compact(x.s)}</div></td><td><span class="tag ${x.c.toLowerCase()}">${x.c}</span></td></tr>`).join("")}</table>
      <p class="note">Показаны 15 позиций из ${A.length}. В классе C — ${cnt.C} позиций, которые вместе дают 5% выручки: кандидаты на вывод из меню.</p>`;
  }

  /* ================================================================ КОНТРОЛЬ */
  let ctrlFilter = "all";
  function pageControl() {
    const li = days.length - 1, d30 = range(li, 30), p30 = range(li - 30, 30);
    const pre = (a) => sum(a.filter((d) => d.afterPre != null), (d) => d.afterPre);
    const revp = (a) => sum(a.filter((d) => d.afterPre != null), (d) => d.rev);
    const who = {}; d30.forEach((d) => (d.afterPreWho || []).forEach(([w, v]) => (who[w] = (who[w] || 0) + v)));
    const whoA = Object.entries(who).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const back = recentSignals(30).filter((s) => s.area === "Учёт");
    main.innerHTML = head("Контроль", "Касса, учёт и закупки", "Сигналы строятся по правилам из итогового отчёта аудита",
      `<span class="tag critical" style="padding:6px 10px">${ctrlCount} важных за 7 дней</span>`) +
      `<div class="g c12 tiles2 fade-in">
        ${tile("Удаления после пречека, 30 дней", compact(pre(d30)), delta(pre(d30), pre(p30), { inverse: true }), pct(pre(d30) / revp(d30)) + " выручки", d30.filter((d) => d.afterPre != null).map((d) => d.afterPre))}
        ${tile("Удалено заказов целиком", fmtInt(sum(d30, (d) => d.ordersDel[0])), delta(sum(d30, (d) => d.ordersDel[0]), sum(p30, (d) => d.ordersDel[0]), { inverse: true }), "за 30 дней", d30.map((d) => d.ordersDel[0]))}
        ${tile("Скидки", pct(sum(d30, (d) => d.disc) / sum(d30, (d) => d.rev)), delta(sum(d30, (d) => d.disc), sum(p30, (d) => d.disc), { inverse: true }), compact(sum(d30, (d) => d.disc)) + " за 30 дней", d30.map((d) => d.disc))}
        ${tile("Накладные задним числом", back.length + " дн.", "", "за 30 дней с документами, внесёнными позже 2 суток", d30.map((d) => (d.signals.some((s) => s.area === "Учёт") ? 1 : 0)))}
      </div>
      <div class="g c12 fade-in">
        <section class="card s7"><div class="ch"><div><h2>Удаления после пречека по неделям</h2><small>Доля выручки · 11 недель с 10 августа</small></div></div><div class="chart" id="delChart"></div></section>
        <section class="card s5"><div class="ch"><div><h2>Кто удаляет после пречека</h2><small>30 дней по ${dLong(LAST.date)}</small></div></div>
          <table class="t"><tr><th>Сотрудник</th><th class="r">Сумма</th></tr>${whoA.map(([w, v], i) => `<tr><td class="n">${esc(w)}</td><td class="r"><div class="inbar"><i class="${i === 0 ? "y" : ""}" style="width:${Math.round((v / whoA[0][1]) * 90)}px"></i>${compact(v)}</div></td></tr>`).join("")}</table>
          <p class="note">Удаление после пречека — по ПИН-коду менеджера и с причиной. «Общая учётная запись» должна быть закрыта для кассовых операций.</p></section>
      </div>
      <div class="g c12 fade-in">
        <section class="card s7"><div class="ch"><div><h2>Журнал сигналов</h2><small>14 дней</small></div>
          <div class="seg" id="fseg">${[["all", "Все"], ["imp", "Важные"], ["Касса", "Касса"], ["Учёт", "Учёт"], ["Выручка", "Выручка"]].map(([k, l]) => `<button data-k="${k}" class="${k === ctrlFilter ? "on" : ""}">${l}</button>`).join("")}</div></div>
          <div class="sigs" id="journal"></div></section>
        <section class="card s5"><div class="ch"><div><h2>Закупочные цены</h2><small>Переплата против минимальной цены своих поставщиков, с начала года</small></div></div>
          <table class="t"><tr><th>Товар</th><th class="r">Средняя</th><th class="r">Мин.</th><th class="r">Потери</th></tr>${D.overpay.slice(0, 8).map((x) => `<tr><td class="n">${esc(x.n)}</td><td class="r">${fmtInt(x.avg)}</td><td class="r">${fmtInt(x.avg / (1 + x.gap))}</td><td class="r"><b>${compact(x.loss)}</b></td></tr>`).join("")}</table>
          ${D.prices.length ? `<div class="ch" style="margin:18px 0 8px"><div><h2>Цены за неделю</h2><small>19–23.10 к 12–16.10</small></div></div><div class="sigs">${D.prices.map((p) => `<div class="sig ${p.d > 0 ? "warning" : "good"}"><div class="ico">${ico(p.d > 0 ? "warning" : "good")}</div><div><b>${esc(p.n)}: ${fmtInt(p.prev)} → ${fmtInt(p.cur)} ₸/${esc(p.u)}</b><p>${p.d > 0 ? "Рост" : "Снижение"} на ${pct(Math.abs(p.d))} · входит в ${p.dishes} блюд</p></div><div class="meta"><span class="tag ${p.d > 0 ? "warning" : "good"}">${p.d > 0 ? "+" : "−"}${pct(Math.abs(p.d), 0)}</span></div></div>`).join("")}</div>` : ""}
        </section>
      </div>`;
    drawDelWeeks("#delChart", 11);
    sparkAll();
    const fill = () => {
      let s = recentSignals(14).filter((x) => x.sev !== "good");
      if (ctrlFilter === "imp") s = s.filter((x) => x.sev === "critical" || x.sev === "serious");
      else if (ctrlFilter !== "all") s = s.filter((x) => x.area === ctrlFilter);
      s.sort((a, b) => b.date.localeCompare(a.date) || SEVW[b.sev] - SEVW[a.sev]);
      $("#journal").innerHTML = s.slice(0, 12).map((x) => sigHTML(x)).join("") || `<div class="empty">Сигналов нет</div>`;
    };
    fill();
    $("#fseg").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; ctrlFilter = b.dataset.k; $("#fseg").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); fill(); };
  }

  /* ================================================================ ЭКОНОМИКА */
  function pageFinance() {
    const pl = D.pl, n = pl.length;
    const avg = (f) => pl.reduce((s, m) => s + f(m), 0) / n;
    const rev = avg((m) => m.rev), cogs = avg((m) => m.cogs) / rev, pay = avg((m) => m.pay) / rev, profit = avg((m) => m.profit);
    const T = D.targets;
    const meter = (name, v, tgt, max, note) => {
      const ok = !tgt || v <= tgt[1];
      return `<div class="meter"><div class="meter-h"><b>${name}</b><span class="v">${pct(v)}</span></div>
        <div class="meter-track"><span class="fill ${tgt ? (ok ? "ok" : "bad") : ""}" style="width:${(v / max) * 100}%"></span>${tgt ? `<span class="tgt" style="left:${(tgt[0] / max) * 100}%;width:${((tgt[1] - tgt[0]) / max) * 100}%"></span>` : ""}</div>
        <div class="meter-f"><span>${note}</span><span>${tgt ? `цель ${pct(tgt[0], 0)}–${pct(tgt[1], 0)}` : "доля выручки"}</span></div></div>`;
    };
    main.innerHTML = head("Экономика", "Прибыль и структура расходов", `Июнь–сентябрь · управленческий учёт по данным iiko, без расходов ${V.next ? "второй точки" : "других проектов"} и разового пакета 2ГИС`) +
      `<div class="g c12 tiles2 fade-in">
        ${tile("Выручка в месяц", compact(rev), "", "в среднем за 4 месяца", pl.map((m) => m.rev))}
        ${tile("Операционная прибыль", compact(profit), "", pct(profit / rev) + " выручки · цель 11–17 млн ₸", pl.map((m) => m.profit))}
        ${tile("Продукты к выручке", pct(cogs), `<span class="tag ${cogs > 0.35 ? "critical" : "good"}">цель 33–35%</span>`, "", pl.map((m) => m.cogs / m.rev))}
        ${tile("Оплата труда к выручке", pct(pay), `<span class="tag ${pay > 0.28 ? "critical" : "good"}">цель 27–28%</span>`, "", pl.map((m) => m.pay / m.rev))}
      </div>
      <div class="g c12 fade-in">
        <section class="card s7"><div class="ch"><div><h2>Операционная прибыль по месяцам</h2><small>Зелёная полоса — цель после внедрения рекомендаций: 11–17 млн ₸</small></div></div><div class="chart" id="plChart"></div></section>
        <section class="card s5"><div class="ch"><div><h2>Ключевые доли расходов</h2><small>Среднее за июнь–сентябрь</small></div></div>
          ${meter("Продукты", cogs, T.foodcost, 0.5, "с учётом инвентаризаций")}
          ${meter("Оплата труда", pay, T.payroll, 0.5, "начисления iiko")}
          ${meter("Аренда", avg((m) => m.rent) / rev, null, 0.5, "фиксированный расход")}
          ${meter("Маркетинг", avg((m) => m.mkt) / rev, null, 0.5, "без разового 2ГИС")}
        </section>
      </div>
      <div class="g c12 fade-in"><section class="card s12"><div class="ch"><div><h2>Отчёт о прибылях и убытках</h2><small>Тыс. ₸ · по данным iiko</small></div></div><div class="scroll-x">
        <table class="t"><tr><th>Статья</th>${pl.map((m) => `<th class="r">${monthName(m.m)}</th>`).join("")}<th class="r">Доля</th></tr>
        ${[["Выручка", "rev"], ["Продукты", "cogs"], ["Оплата труда", "pay"], ["Аренда", "rent"], ["Коммунальные", "util"], ["Маркетинг", "mkt"], ["Налоги", "tax"], ["Прочее и банк", "other"]].map(([k, f]) =>
          `<tr><td class="n">${k}</td>${pl.map((m) => `<td class="r">${fmtInt(m[f] / 1000)}</td>`).join("")}<td class="r">${f === "rev" ? "100%" : pct(avg((m) => m[f]) / rev)}</td></tr>`).join("")}
        <tr class="hl"><td class="n"><b>Операционная прибыль</b></td>${pl.map((m) => `<td class="r"><b>${fmtInt(m.profit / 1000)}</b></td>`).join("")}<td class="r"><b>${pct(profit / rev)}</b></td></tr></table></div>
        <p class="note">Октябрь появится после закрытия месяца. В рабочей версии отчёт обновляется автоматически по счетам iiko.</p></section></div>`;
    draw("#plChart", (el) => barChart(el, { data: pl.map((m, i) => ({ label: monthName(m.m), v: m.profit, m, hl: i === n - 1 })), h: 240, band: T.profit, bw: 44, xw: 60, allX: true, tip: (x) => `<b>${monthName(x.m.m)}</b>${trow("Прибыль", compact(x.v))}${trow("Рентабельность", pct(x.v / x.m.rev))}${trow("Выручка", compact(x.m.rev))}` }));
    sparkAll();
  }

  /* ================================================================ КОМАНДА */
  let teamM = null;
  function pageTeam() {
    const ms = Object.keys(D.waiters).sort();
    teamM = teamM || ms[ms.length - 1];
    const w = Object.entries(D.waiters[teamM]).map(([n, v]) => ({ n, ...v, chk: v.rev / v.orders })).filter((x) => x.orders >= 80 && x.n.startsWith(V.waiterPrefix || "")).sort((a, b) => b.rev - a.rev);
    const chks = w.map((x) => x.chk), mx = Math.max(...chks), mn = Math.min(...chks);
    const totR = w.reduce((s, x) => s + x.rev, 0), totO = w.reduce((s, x) => s + x.orders, 0);
    main.innerHTML = head("Команда", "Официанты", `${monthName(teamM)}${teamM.startsWith("10") ? " · по " + dLong(LAST.date) : ""} · учётные записи официантов («${V.waiterPrefix || ""} …») с 80 и более заказами; кассиры не включены`,
      `<div class="seg" id="mseg">${ms.slice(-4).map((m) => `<button data-k="${m}" class="${m === teamM ? "on" : ""}">${monthName(m)}</button>`).join("")}</div>`) +
      `<div class="g c12 tiles2 fade-in">
        ${tile("Официантов в зале", w.length, "", "в рейтинге за месяц", w.map((x) => x.rev))}
        ${tile("Средний чек зала", money(totR / totO), "", "по всем официантам", w.map((x) => x.chk))}
        ${tile("Разброс среднего чека", (mx / mn).toFixed(1).replace(".", ",") + "×", "", `от ${money(mn)} до ${money(mx)}`, chks.slice().sort((a, b) => a - b))}
        ${tile("Лучший средний чек", money(mx), "", esc(w.find((x) => x.chk === mx).n), w.map((x) => x.chk))}
      </div>
      <div class="g c12 fade-in"><section class="card s12"><div class="ch"><div><h2>Рейтинг зала</h2><small>По выручке · средний чек — главный показатель для мотивации</small></div></div><div class="scroll-x">
        <table class="t"><tr><th>#</th><th>Официант</th><th class="r">Выручка</th><th class="r">Заказов</th><th class="r hide-m">Гостей</th><th class="r">Средний чек</th><th class="r hide-m">Скидки</th></tr>
        ${w.map((x, i) => `<tr><td>${i + 1}</td><td class="n">${esc(x.n)}</td><td class="r">${compact(x.rev)}</td><td class="r">${x.orders}</td><td class="r hide-m">${x.guests}</td><td class="r"><div class="inbar"><i class="${x.chk === mx ? "y" : ""}" style="width:${Math.round((x.chk / mx) * 80)}px"></i>${money(x.chk)}</div></td><td class="r hide-m">${x.disc ? compact(x.disc) : "—"}</td></tr>`).join("")}</table></div>
        <p class="note">В рабочей версии рейтинг обновляется ежедневно и приходит управляющему в понедельник вместе с итогами недели.</p></section></div>`;
    $("#mseg").onclick = (e) => { const b = e.target.closest("button"); if (b) { teamM = b.dataset.k; pageTeam(); } };
    sparkAll();
  }

  /* ================================================================ УВЕДОМЛЕНИЯ */
  const PREFS_KEY = "hadia-push-prefs";
  let prefs = { report: true, critical: true, pace: true, week: false };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")); } catch (e) { /* без сохранения */ }
  function pageNotify() {
    const perm = "Notification" in window ? Notification.permission : "unsupported";
    const L = D.live, crit = LAST.signals.find((s) => s.sev === "critical" || s.sev === "serious");
    const p18 = LAST.hours.slice(0, 18).reduce((a, b) => a + b, 0), n18 = LAST.hoursNorm.slice(0, 18).reduce((a, b) => a + b, 0);
    const permTxt = { granted: ["good", "Разрешены на этом устройстве"], denied: ["critical", "Запрещены в настройках браузера"], default: ["warning", "Ещё не включены"], unsupported: ["info", "Браузер не поддерживает уведомления"] }[perm];
    const row = (k, t, s) => `<div class="set"><div><b>${t}</b><small>${s}</small></div><button class="sw ${prefs[k] ? "on" : ""}" data-k="${k}" aria-label="${t}"></button></div>`;
    main.innerHTML = head("Уведомления", "Отчёты и сигналы на телефон", "Приходят как обычные уведомления — без WhatsApp и сторонних приложений") +
      `<div class="g c12 fade-in">
        <section class="card s7">
          <div class="ch"><div><h2>Что присылать</h2><small>Настройки сохраняются для каждого получателя</small></div><span class="tag ${permTxt[0]}">${permTxt[1]}</span></div>
          ${row("report", "Отчёт смены", "Каждый день в 09:00 — выручка, гости, чек, топ блюд и сигналы")}
          ${row("critical", "Важные сигналы", "Сразу — удаления после пречека, расхождения, отказы «нет в наличии»")}
          ${row("pace", "Темп дня", "В 15:00 и 19:00, если выручка отстаёт от нормы больше чем на 10%")}
          ${row("week", "Итоги недели", "Понедельник, 10:00 — неделя к неделе и рейтинг официантов")}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
            <button class="btn" id="enable">${ico("bell")}Включить на этом устройстве</button>
            <button class="btn y" id="test">${ico("send")}Прислать пример</button>
          </div>
          <p class="note">Получатели в демо: собственник и управляющий. В рабочей версии — отдельный доступ для каждого и выбор, кто какие сигналы получает.</p>
        </section>
        <section class="card s5" style="background:#E9E5DC">
          <div class="phone">
            <div class="clock">09:00</div><div class="dt">${dFull(L.date).toLowerCase()}</div>
            <div class="push"><div class="push-h"><span class="ic">${VB}</span>${VS.toUpperCase()}<em>сейчас</em></div><b>Смена ${dShort(LAST.date)}: ${compact(LAST.rev)}${LAST.norm ? ` · ${LAST.rev >= LAST.norm ? "+" : "−"}${pct(Math.abs(LAST.rev / LAST.norm - 1), 0)} к норме` : ""}</b><p>Гостей ${LAST.guests}, чек ${money(chk(LAST))}. ${alertCount(LAST) ? "Важных сигналов: " + alertCount(LAST) : "Сигналов нет"}</p></div>
            ${crit ? `<div class="push"><div class="push-h"><span class="ic">${VB}</span>${VS.toUpperCase()}<em>00:31</em></div><b>${esc(crit.title)}</b><p>${esc(crit.text.slice(0, 90))}${crit.text.length > 90 ? "…" : ""}</p></div>` : ""}
            <div class="push"><div class="push-h"><span class="ic">${VB}</span>${VS.toUpperCase()}<em>вчера, 18:00</em></div><b>Темп дня: ${compact(p18)} к 18:00</b><p>${p18 < n18 ? "Ниже" : "Выше"} нормы на ${pct(Math.abs(p18 / n18 - 1), 0)} · норма к этому часу ${compact(n18)}</p></div>
          </div>
        </section>
      </div>
      <div class="g c12 fade-in">
        <section class="card s6"><div class="ch"><div><h2>Установка на Android</h2><small>Chrome</small></div></div><ol class="steps-i"><li>Откройте ссылку на пульт в Chrome и войдите</li><li>Нажмите «Установить приложение» во всплывающей подсказке или в меню ⋮</li><li>Откройте значок «Пульт» на главном экране и разрешите уведомления</li></ol></section>
        <section class="card s6"><div class="ch"><div><h2>Установка на iPhone</h2><small>Safari, iOS 16.4 и новее</small></div></div><ol class="steps-i"><li>Откройте ссылку на пульт в Safari и войдите</li><li>Нажмите «Поделиться» → «На экран „Домой“»</li><li>Откройте значок «Пульт» с экрана «Домой» и разрешите уведомления — в обычной вкладке Safari они не работают</li></ol></section>
      </div>`;
    main.querySelectorAll(".sw").forEach((b) => (b.onclick = () => { prefs[b.dataset.k] = !prefs[b.dataset.k]; b.classList.toggle("on"); try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* без сохранения */ } }));
    $("#enable").onclick = async () => { const ok = await askPermission(); toast(ok ? "Уведомления включены" : "Разрешение не получено"); pageNotify(); };
    $("#test").onclick = () => notifyReport(LAST);
  }

  function pageMore() {
    main.innerHTML = head("Ещё", "Разделы", window.PULT_ROLE ? `Вы вошли как: ${window.PULT_ROLE}` : "") + `<div class="g fade-in">${ROUTES.slice(4).map((r) => `<a class="card" href="#/${r.id}" style="display:flex;align-items:center;gap:14px"><span style="width:40px;height:40px;border-radius:12px;background:var(--sand);display:grid;place-items:center">${ico(r.ic).replace("<svg", '<svg style="width:20px;height:20px;fill:none;stroke:#111;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"')}</span><b style="font-size:15px">${r.name}</b><span style="margin-left:auto;color:var(--muted)">${ico("right").replace("<svg", '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2"')}</span></a>`).join("")}<button class="btn l wide" onclick="pultLogout()">Выйти из пульта</button></div>`;
  }

  /* ---------------------------------------------------------------- уведомления и PWA */
  let swReg = null;
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").then((r) => (swReg = r)).catch(() => {});
  }
  async function askPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  }
  async function notifyReport(d) {
    const title = `${VS} · смена ${dShort(d.date)}: ${compact(d.rev)}`;
    const body = shiftMessage(d).split("\n").slice(1).join("\n");
    if (!(await askPermission())) { toast("Разрешите уведомления в браузере, чтобы получить пример"); return; }
    const opt = { body, icon: "icons/icon-192.png", badge: "icons/badge-72.png", tag: "shift-" + d.date, data: { url: "#/shift/" + d.date } };
    try {
      const reg = swReg || (navigator.serviceWorker && (await navigator.serviceWorker.getRegistration()));
      if (reg) await reg.showNotification(title, opt); else new Notification(title, opt);
      toast("Отчёт отправлен на это устройство");
    } catch (e) { toast("Не удалось показать уведомление"); }
  }
  /* Установка: событие beforeinstallprompt ловит auth.js ещё до входа (window.__bip) */
  const ENV = window.PULT_ENV || { mobile: matchMedia("(max-width: 767px)").matches };
  const bip = () => window.__bip;
  if (bip()) $("#installBtn").hidden = false;
  document.addEventListener("pult-bip", () => { $("#installBtn").hidden = false; });
  async function doInstall() {
    const e = bip();
    if (!e) { const s = $("#sheetSteps"); if (s && window.pultInstall) { s.innerHTML = window.pultInstall.steps(); s.hidden = false; const c = s.querySelector("[data-copy]"); if (c) c.onclick = async () => { try { await navigator.clipboard.writeText(location.href.split("#")[0]); toast("Ссылка скопирована"); } catch (x) { toast(location.href.split("#")[0]); } }; } return; }
    e.prompt();
    const r = await e.userChoice;
    window.__bip = null; $("#installBtn").hidden = true; closeSheet();
    if (r.outcome === "accepted") toast("Значок «Пульт» появился на главном экране");
  }
  $("#installBtn").onclick = doInstall;
  window.addEventListener("appinstalled", () => { closeSheet(); $("#installBtn").hidden = true; });

  /* На телефоне, пока пульт открыт в браузере, первым делом предлагаем поставить значок */
  const SHEET_KEY = "pult-install-dismissed";
  const dismissed = () => { try { return sessionStorage.getItem(SHEET_KEY) === "1"; } catch (e) { return false; } };
  function closeSheet() { const s = $("#sheet"); if (s) { s.classList.remove("on"); setTimeout(() => s.remove(), 250); } }
  function installSheet() {
    if (ENV.standalone || !ENV.mobile || dismissed() || $("#sheet")) return;
    const el = document.createElement("div");
    el.id = "sheet"; el.className = "sheet";
    el.innerHTML = `<div class="sheet-in"><button class="sheet-x" aria-label="Закрыть">×</button><div class="sheet-h"><img src="icons/icon-192.png" alt=""><div><b>Установите пульт на телефон</b><small>Значок на главном экране, отчёты смены — уведомлениями</small></div></div><button class="btn y wide" id="sheetGo">${ico("phone")}Установить на телефон</button><div class="gi-steps" id="sheetSteps" hidden></div></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("on"), 30);
    el.querySelector(".sheet-x").onclick = () => { try { sessionStorage.setItem(SHEET_KEY, "1"); } catch (e) { /* без сохранения */ } closeSheet(); };
    el.querySelector("#sheetGo").onclick = doInstall;
  }
  setTimeout(installSheet, 600);

  /* В установленном приложении — один раз предложить включить уведомления */
  if (ENV.standalone && "Notification" in window && Notification.permission === "default") {
    setTimeout(() => {
      const el = document.createElement("div");
      el.id = "sheet"; el.className = "sheet";
      el.innerHTML = `<div class="sheet-in"><button class="sheet-x" aria-label="Закрыть">×</button><div class="sheet-h"><img src="icons/icon-192.png" alt=""><div><b>Включите уведомления</b><small>Отчёт смены в 09:00 и важные сигналы сразу</small></div></div><button class="btn y wide" id="sheetGo">${ico("bell")}Разрешить уведомления</button></div>`;
      document.body.appendChild(el);
      setTimeout(() => el.classList.add("on"), 30);
      el.querySelector(".sheet-x").onclick = closeSheet;
      el.querySelector("#sheetGo").onclick = async () => { closeSheet(); if (await askPermission()) notifyReport(LAST); };
    }, 1200);
  }

  /* ---------------------------------------------------------------- роутер */
  const pending = [];
  function draw(sel, fn) { const el = $(sel); if (el) { pending.push([el, fn]); fn(el); } }
  function go(h) { location.hash = h; }
  function route() {
    hideTip();
    pending.length = 0;
    const [, id = "", arg] = (location.hash || "#/").split("/");
    renderNav(id);
    ({ "": pageOverview, shift: () => pageShift(arg || LAST.date), sales: pageSales, control: pageControl, finance: pageFinance, team: pageTeam, notify: pageNotify, more: pageMore }[id] || pageOverview)();
    window.scrollTo(0, 0);
  }
  let rt;
  let lastW = innerWidth;
  window.addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(() => { pending.forEach(([el, fn]) => fn(el)); document.querySelectorAll(".spark").forEach((el) => spark(el, el.dataset.s.split(",").map(Number))); }, 120); });
  window.addEventListener("hashchange", route);
  document.addEventListener("scroll", hideTip, { passive: true });
  route();
})();