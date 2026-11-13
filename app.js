/* OWC Crew Hub - app logic */
(function () {
"use strict";
const D = window.OWC_DATA;
const CFG = window.OWC_CONFIG || {};
const API = (CFG.apiUrl || "").trim();
const CLASSES = ["Light", "Medium", "Heavy"];
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => Number(n || 0).toLocaleString();
const store = {
  get(k, d) { try { const v = localStorage.getItem("owc-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("owc-" + k, JSON.stringify(v)); } catch (e) {} }
};
const sess = {
  get(k) { try { return sessionStorage.getItem("owc-" + k) || ""; } catch (e) { return ""; } },
  set(k, v) { try { v ? sessionStorage.setItem("owc-" + k, v) : sessionStorage.removeItem("owc-" + k); } catch (e) {} }
};
const gadgetsOf = c => [...D.classes[c].gadgets, ...D.common];
const tierOf = (c, n) => (D.tiers[c] || {})[n] || "";
const tierTag = (c, n) => { const t = tierOf(c, n); return t ? ` <span class="tier t-${t}">${t}</span>` : ""; };

/* ---------------- toast / modal / effects ---------------- */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
function modal(html) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal"><div class="box">${html}<div class="btns" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-close>Close</button></div></div></div>`;
  const m = root.firstChild;
  m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-close")) root.innerHTML = ""; });
  return m;
}
function celebrate(text) {
  const f = $("#flash"), a = $("#announce");
  a.textContent = text;
  [f, a].forEach(el => { el.classList.remove("go"); void el.offsetWidth; el.classList.add("go"); });
  const cols = ["#ffe08a", "#d4a63a", "#b07cff", "#7fd4ff", "#ffffff"];
  for (let i = 0; i < 36; i++) {
    const s = document.createElement("div"); s.className = "spark";
    s.style.background = cols[i % cols.length]; s.style.left = (50 + (Math.random() * 20 - 10)) + "vw"; s.style.top = "38vh";
    document.body.appendChild(s);
    const dx = (Math.random() * 2 - 1) * 260, dy = -(120 + Math.random() * 260), rot = Math.random() * 720;
    const an = s.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot / 2}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx * 1.3}px,${dy + 520}px) rotate(${rot}deg)`, opacity: 0 }], { duration: 1400 + Math.random() * 600, easing: "cubic-bezier(.2,.6,.4,1)" });
    an.onfinish = () => s.remove();
  }
  if (navigator.vibrate) try { navigator.vibrate([20, 40, 20]); } catch (e) {}
}

/* ---------------- scoring (same formula as the backend) ---------------- */
const DEFAULT_W = { elims: 100, assists: 50, deaths: -40, revives: 75, objective: 150, damagePer10: 1, win: 200, rolled: 150 };
const DEFAULT_G = { S: 2200, A: 1600, B: 1000, C: 500 };
let W = { ...DEFAULT_W }, G = { ...DEFAULT_G };
function scoreOf(p, win, rolled) {
  let s = p.elims * W.elims + p.assists * W.assists + p.deaths * W.deaths + p.revives * W.revives + p.objective * W.objective + Math.floor(p.damage / 10) * W.damagePer10;
  if (win) s += W.win; if (rolled) s += W.rolled;
  return Math.max(0, Math.round(s));
}
const gradeOf = s => s >= G.S ? "S" : s >= G.A ? "A" : s >= G.B ? "B" : s >= G.C ? "C" : "D";
const int = v => { const n = Math.round(Number(v)); return isFinite(n) && n > 0 ? n : 0; };

/* ---------------- API (real or demo) ---------------- */
async function api(action, payload = {}) {
  if (!API) return mock(action, payload);
  const pin = sess.get("pin");
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, pin, ...payload }) });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "Something went wrong");
  return j;
}
/* Demo backend: saves on this device so the app works before setup. */
function mock(action, p) {
  const db = store.get("demo", { matches: [], trials: [], redemptions: [], pins: [], maps: [], seasons: [], season: "OWC Season 1 (demo)" });
  const save = () => store.set("demo", db);
  const rewards = [
    { id: "pick-loadout", name: "Pick Don's next loadout on stream", cost: 300, description: "You choose the build, weapon and gadgets live" },
    { id: "shoutout", name: "Stream shoutout", cost: 200, description: "A shoutout on the next stream" },
    { id: "custom-role", name: "Custom Discord role color", cost: 500, description: "Pick a color for your name for a month" },
    { id: "game-night-pick", name: "Choose a Game Night game", cost: 600, description: "Pick one game for Community Game Night" }
  ];
  const bal = () => { const b = {}; db.trials.forEach(t => b[t.player] = (b[t.player] || 0) + t.bucks); db.redemptions.forEach(r => b[r.player] = (b[r.player] || 0) - r.cost); return b; };
  const trialsState = date => ({ ok: true, balances: bal(), claimedToday: db.trials.filter(t => t.date === date).map(t => ({ player: t.player, trialId: t.trialId })),
    recentRedemptions: db.redemptions.slice(-25).reverse().map((r, i) => ({ ...r, row: i })) });
  const isAdmin = () => sess.get("pin") === "1234";
  return new Promise((resolve, reject) => setTimeout(() => { try { resolve(run()); } catch (e) { reject(e); } }, 250));
  function run() {
    switch (action) {
      case "config": return { ok: true, config: { seasonName: db.season, weights: DEFAULT_W, grades: DEFAULT_G, screenshotReader: true, discord: false, adminSet: true }, rewards };
      case "readScreenshot": return { ok: true, read: { mode: "Cashout", map: "Las Vegas", result: "win", players: [
        { name: store.get("me", "") || "Wilson", team: "OWC", elims: 11, assists: 6, deaths: 4, revives: 3, damage: 6420, objective: 4 },
        { name: "RiskyBiscuits", team: "OWC", elims: 8, assists: 9, deaths: 5, revives: 6, damage: 5210, objective: 3 },
        { name: "Biogaming128", team: "OWC", elims: 14, assists: 3, deaths: 7, revives: 1, damage: 8120, objective: 2 },
        { name: "EnemyOne", team: "Team 2", elims: 9, assists: 2, deaths: 8, revives: 0, damage: 5100, objective: 1 },
        { name: "EnemyTwo", team: "Team 2", elims: 6, assists: 4, deaths: 9, revives: 2, damage: 4300, objective: 0 }] } };
      case "submitMatch": {
        const win = p.result === "win";
        const players = p.players.map(x => { const o = { ...x }; o.score = scoreOf(o, win, p.rolled); o.grade = gradeOf(o.score); return o; }).sort((a, b) => b.score - a.score);
        const m = { id: Math.random().toString(36).slice(2, 10), timestamp: new Date().toISOString(), season: db.season, reporter: p.reporter, mode: p.mode, map: p.map, result: win ? "win" : "loss", mvp: players[0].name, players, screenshot: "", rolled: !!p.rolled };
        db.matches.push(m); save(); return { ok: true, match: m };
      }
      case "scoreboard": { const s = p.season || db.season; return { ok: true, season: s, current: db.season, matches: db.matches.filter(m => s === "*" || m.season === s).slice().reverse() }; }
      case "seasons": return { ok: true, current: { name: db.season }, archive: db.seasons.slice().reverse() };
      case "trials": return trialsState(p.date);
      case "claimTrial": {
        if (!p.player) throw new Error("Set your gamertag first (Crew tab).");
        if (db.trials.some(t => t.date === p.date && t.player.toLowerCase() === p.player.toLowerCase() && t.trialId === p.trialId)) throw new Error("Already claimed today.");
        db.trials.push({ date: p.date, player: p.player, trialId: p.trialId, bucks: int(p.bucks) }); save(); return trialsState(p.date);
      }
      case "redeem": {
        const r = rewards.find(x => x.id === p.rewardId); const have = bal()[p.player] || 0;
        if (!p.player) throw new Error("Set your gamertag first (Crew tab).");
        if (have < r.cost) throw new Error(`Not enough OWC Bucks (${have} / ${r.cost}).`);
        db.redemptions.push({ timestamp: new Date().toISOString(), player: p.player, reward: r.name, cost: r.cost, status: "pending" }); save(); return trialsState("");
      }
      case "setRedemption": { const list = db.redemptions.slice(-25).reverse(); if (list[p.row]) list[p.row].status = p.status === "refunded" ? "refunded" : "done"; save(); return trialsState(""); }
      case "patches": return { ok: true, patches: [{ date: "2026-10-20T00:00:00Z", title: "Demo: patch notes appear here automatically once connected", url: "https://www.reachthefinals.com/patchnotes", summary: "• The live app reads new THE FINALS updates from Steam every hour\n• Each one gets a short summary\n• New patches can auto-post to your Discord" }] };
      case "refreshPatches": return mock("patches", {});
      case "maps": return { ok: true, maps: db.maps, pins: db.pins };
      case "addPin": { if (!p.label) throw new Error("Give the callout a name."); db.pins.push({ id: Math.random().toString(36).slice(2, 8), map: p.map, x: p.x, y: p.y, label: p.label, type: p.type, by: p.by }); save(); return { ok: true, maps: db.maps, pins: db.pins }; }
      case "deletePin": { db.pins = db.pins.filter(x => x.id !== p.id); save(); return { ok: true, maps: db.maps, pins: db.pins }; }
      case "uploadMap": { db.maps = db.maps.filter(x => x.name !== p.map); db.maps.push({ name: p.map, image: p.image, credit: p.credit }); save(); return { ok: true, maps: db.maps, pins: db.pins }; }
      case "adminCheck": if (!isAdmin()) throw new Error("Wrong admin PIN. (Demo PIN is 1234)"); return { ok: true };
      case "deleteMatch": db.matches = db.matches.filter(m => m.id !== p.id); save(); return { ok: true };
      case "newSeason": {
        const ms = db.matches.filter(m => m.season === db.season); const t = {}, mv = {};
        ms.forEach(m => { mv[m.mvp] = (mv[m.mvp] || 0) + 1; m.players.forEach(x => t[x.name] = (t[x.name] || 0) + x.score); });
        const champ = Object.keys(t).sort((a, b) => t[b] - t[a])[0] || ""; const mvp = Object.keys(mv).sort((a, b) => mv[b] - mv[a])[0] || "";
        db.seasons.push({ name: db.season, end: new Date().toISOString(), champion: champ, mvp, matches: ms.length }); db.season = p.name; save();
        return { ok: true, archived: db.seasons[db.seasons.length - 1].name, champion: champ, mvp };
      }
      default: throw new Error("Unknown action");
    }
  }
}

/* ---------------- state ---------------- */
const S = { me: store.get("me", ""), cfg: null, rewards: [], seasonName: "", admin: !!sess.get("pin"), lastRoll: store.get("lastRoll", 0) };

/* ---------------- tabs ---------------- */
const loaders = {};
function showTab(id) {
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === id));
  $$("section.tab").forEach(s => s.classList.toggle("on", s.id === "tab-" + id));
  const b = $(`#nav button[data-tab="${id}"]`); if (b) b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  window.scrollTo({ top: 0 });
  if (loaders[id]) loaders[id]();
  try { history.replaceState(null, "", "#" + id); } catch (e) {}
}
$("#nav").addEventListener("click", e => { const b = e.target.closest("button[data-tab]"); if (b) showTab(b.dataset.tab); });
function seg(el, cb) {
  el.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    $$("button", el).forEach(x => x.classList.toggle("on", x === b)); cb(b.dataset.v);
  });
}
const segVal = el => ($("button.on", el) || {}).dataset?.v;

/* =========================================================
   ROLL
   ========================================================= */
let off = new Set(store.get("off", []));
const offKey = (c, cat, n) => `${c}|${cat}|${n}`;
function pool(c, cat) {
  let list = cat === "gadgets" ? gadgetsOf(c) : D.classes[c][cat];
  list = list.filter(n => !off.has(offKey(c, cat, n)));
  if ($("#metaOnly").checked) {
    const meta = list.filter(n => ["S", "A"].includes(tierOf(c, n)));
    if (meta.length >= (cat === "gadgets" ? 3 : 1)) list = meta;
  }
  return list;
}
const validClasses = () => CLASSES.filter(c => pool(c, "specs").length && pool(c, "weapons").length && pool(c, "gadgets").length >= 3);
let mode = "solo", pick = "Any", mix = false, size = 3, solo = null;
let locks = { cls: false, spec: false, weapon: false, g0: false, g1: false, g2: false };

function rollOne(cls, prev, lk) {
  const same = prev && lk && prev.cls === cls;
  const o = { cls };
  o.spec = same && lk.spec ? prev.spec : rnd(pool(cls, "specs"));
  o.weapon = same && lk.weapon ? prev.weapon : rnd(pool(cls, "weapons"));
  const keep = [0, 1, 2].map(i => same && lk["g" + i] ? prev.gadgets[i] : null);
  const rest = shuffle(pool(cls, "gadgets").filter(g => !keep.includes(g)));
  o.gadgets = keep.map(g => g ?? rest.shift());
  return o;
}
function doRoll() {
  const err = $("#rollErr"); err.textContent = "";
  const ok = validClasses();
  if (mode === "solo") {
    const cls = (locks.cls && solo) ? solo.cls : pick !== "Any" ? pick : rnd(ok);
    if (!cls || !ok.includes(cls)) { err.textContent = `Not enough ${cls || ""} gear left in the armory filter.`; return; }
    solo = rollOne(cls, solo, locks);
    animateRoll([solo], true);
  } else {
    if (!ok.length) { err.textContent = "The armory filter is empty. Turn some gear back on."; return; }
    let classes = [];
    if (mix) { while (classes.length < size) classes.push(...shuffle(ok)); classes = shuffle(classes.slice(0, size)); }
    else for (let i = 0; i < size; i++) classes.push(rnd(ok));
    animateRoll(classes.map(c => rollOne(c)), false);
  }
  S.lastRoll = Date.now(); store.set("lastRoll", S.lastRoll);
}
function loadoutCard(l, i, solo) {
  const col = D.classes[l.cls].color;
  const lockBtn = k => solo ? `<button class="lock ${locks[k] ? "on" : ""}" data-k="${k}" aria-label="lock">${locks[k] ? "🔒" : "🔓"}</button>` : "";
  const tg = n => esc(n) + tierTag(l.cls, n);
  const rows = [["Spec", tg(l.spec), "spec"], ["Weapon", tg(l.weapon), "weapon"], ["Gadget 1", tg(l.gadgets[0]), "g0"], ["Gadget 2", tg(l.gadgets[1]), "g1"], ["Gadget 3", tg(l.gadgets[2]), "g2"]];
  return `<div class="card" style="border-left:4px solid ${col}">
    <div class="card-head"><div><div class="who">${solo ? "CONTESTANT" : "CONTESTANT " + String(i + 1).padStart(2, "0")}</div>
    <div class="cls" style="color:${col}">${l.cls}</div></div>${lockBtn("cls")}</div>
    ${rows.map(([k, v, key]) => `<div class="r" data-slot="${key}"><div class="k">${k}</div><div class="v">${v}</div>${lockBtn(key)}</div>`).join("")}
  </div>`;
}
function renderRoll(list, soloMode) {
  const out = $("#rollOut");
  out.className = soloMode ? "" : "grid2 grid3";
  $("#rollWrap").style.maxWidth = soloMode ? "" : "1100px";
  out.innerHTML = list.map((l, i) => loadoutCard(l, i, soloMode)).join("") +
    (soloMode ? `<div class="btns" style="margin:-2px 0 6px"><button class="btn" id="saveLo">☆ Save loadout</button><button class="btn" id="shareLo">⤴ Share code</button><span class="note" style="align-self:center">Tap 🔓 to hold a slot, then roll again.</span></div>` : "");
  $$(".lock", out).forEach(b => b.onclick = () => { locks[b.dataset.k] = !locks[b.dataset.k]; renderRoll(list, soloMode); });
  if (soloMode) { $("#saveLo").onclick = () => saveLoadout(list[0]); $("#shareLo").onclick = () => shareCode(list[0]); }
}
function animateRoll(final, soloMode) {
  const btn = $("#rollBtn"); btn.disabled = true;
  let t = 0;
  const tick = setInterval(() => {
    t++;
    const fake = final.map(f => {
      const g = (k, v, arr) => (soloMode && locks[k] ? v : rnd(arr));
      return { cls: f.cls, spec: g("spec", f.spec, D.classes[f.cls].specs), weapon: g("weapon", f.weapon, D.classes[f.cls].weapons), gadgets: [0, 1, 2].map(i => g("g" + i, f.gadgets[i], gadgetsOf(f.cls))) };
    });
    renderRoll(fake, soloMode);
    $$("#rollOut .r").forEach(r => { if (!(soloMode && locks[r.dataset.slot])) r.classList.add("rolling"); });
    if (t >= 10) { clearInterval(tick); renderRoll(final, soloMode); btn.disabled = false; celebrate(final.length > 1 ? `SQUAD OF ${final.length} LOCKED IN!` : "CONTESTANT LOCKED IN!"); }
  }, 55);
}
/* share codes: OWC-<class><spec><weapon>-<g1><g2><g3> */
const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function encode(l) {
  const c = D.classes[l.cls], gs = gadgetsOf(l.cls);
  return "OWC-" + l.cls[0] + B36[c.specs.indexOf(l.spec)] + B36[c.weapons.indexOf(l.weapon)] + "-" + l.gadgets.map(g => B36[gs.indexOf(g)]).join("");
}
function decode(code) {
  const m = String(code).toUpperCase().replace(/\s/g, "").match(/^OWC-([LMH])([0-9A-Z])([0-9A-Z])-([0-9A-Z])([0-9A-Z])([0-9A-Z])$/);
  if (!m) return null;
  const cls = { L: "Light", M: "Medium", H: "Heavy" }[m[1]], c = D.classes[cls], gs = gadgetsOf(cls);
  const ix = ch => B36.indexOf(ch);
  const l = { cls, spec: c.specs[ix(m[2])], weapon: c.weapons[ix(m[3])], gadgets: [gs[ix(m[4])], gs[ix(m[5])], gs[ix(m[6])]] };
  if (!l.spec || !l.weapon || l.gadgets.some(g => !g) || new Set(l.gadgets).size < 3) return null;
  return l;
}
function saveLoadout(l) {
  const saved = store.get("saved", []);
  const code = encode(l);
  if (saved.some(s => s.code === code)) { toast("Already saved"); return; }
  saved.unshift({ code, name: `${l.cls} · ${l.weapon}`, at: Date.now() }); store.set("saved", saved.slice(0, 30));
  toast("Loadout saved ☆"); renderSaved();
}
async function shareCode(l) {
  const code = encode(l);
  const text = `OWC loadout ${code}\n${l.cls}: ${l.spec} · ${l.weapon} · ${l.gadgets.join(", ")}\nLoad it in the OWC Crew Hub.`;
  try { if (navigator.share) { await navigator.share({ title: "OWC loadout", text }); return; } } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Code copied: " + code); } catch (e) { modal(`<h2 class="gold">Share code</h2><p class="code">${code}</p><p class="note">${esc(text)}</p>`); }
}
function renderSaved() {
  const saved = store.get("saved", []);
  const box = $("#savedBox");
  if (!saved.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="label">Saved loadouts</div><div class="panel">${saved.map((s, i) => `<div class="res"><div class="n">${esc(s.name)}<br><span class="code" style="font-size:13px">${s.code}</span></div>
    <button class="btn sm" data-load="${i}">Load</button><button class="btn sm danger" data-del="${i}">✕</button></div>`).join("")}</div>`;
  $$("[data-load]", box).forEach(b => b.onclick = () => loadCode(saved[b.dataset.load].code));
  $$("[data-del]", box).forEach(b => b.onclick = () => { saved.splice(b.dataset.del, 1); store.set("saved", saved); renderSaved(); });
}
function loadCode(code) {
  const l = decode(code);
  if (!l) { toast("That code doesn't look right"); return; }
  if (mode !== "solo") $("#modeSeg button[data-v=solo]").click();
  solo = l; locks = { cls: false, spec: false, weapon: false, g0: false, g1: false, g2: false };
  renderRoll([l], true); toast("Loadout loaded"); window.scrollTo({ top: $("#rollOut").offsetTop - 140, behavior: "smooth" });
}
function buildPool() {
  const el = $("#pool");
  el.innerHTML = CLASSES.map(c => ["specs", "weapons", "gadgets"].map(cat => {
    const list = cat === "gadgets" ? gadgetsOf(c) : D.classes[c][cat];
    return `<h4 style="color:${D.classes[c].color}">${c} · ${cat === "specs" ? "Specializations" : cat}</h4><div class="chips">${list.map(n => `<button class="chip ${off.has(offKey(c, cat, n)) ? "off" : ""}" data-id="${esc(offKey(c, cat, n))}">${esc(n)}</button>`).join("")}</div>`;
  }).join("")).join("");
  $$(".chip", el).forEach(b => b.onclick = () => { const k = b.dataset.id; off.has(k) ? off.delete(k) : off.add(k); b.classList.toggle("off"); store.set("off", [...off]); });
}
function setSize(n) {
  size = Math.max(2, Math.min(8, n));
  $("#count").textContent = size;
  $("#countHint").textContent = size === 3 ? "Cashout / Quick Cash" : size === 5 ? "Power Shift" : size === 8 ? "Point Break" : size + " contestants";
  $("#minus").disabled = size <= 2; $("#plus").disabled = size >= 8;
}
function initRoll() {
  seg($("#modeSeg"), v => {
    mode = v; $("#classWrap").classList.toggle("hidden", v !== "solo"); $("#squadWrap").classList.toggle("hidden", v !== "squad");
    $("#rollOut").innerHTML = ""; solo = null; Object.keys(locks).forEach(k => locks[k] = false);
    $("#rollWrap").style.maxWidth = "";
  });
  seg($("#classSeg"), v => { pick = v; locks.cls = false; });
  $("#mix").onchange = e => mix = e.target.checked;
  $("#minus").onclick = () => setSize(size - 1); $("#plus").onclick = () => setSize(size + 1); setSize(3);
  $("#rollBtn").onclick = doRoll;
  $("#allOn").onclick = () => { off.clear(); store.set("off", []); buildPool(); };
  $("#codeLoad").onclick = () => loadCode($("#codeIn").value);
  buildPool(); renderSaved();
}

/* =========================================================
   REPORT
   ========================================================= */
let shotData = "", rows = [];
const blankRow = name => ({ name: name || "", build: "", elims: 0, assists: 0, deaths: 0, revives: 0, damage: 0, objective: 0 });
function fillSelect(el, list, ph) { el.innerHTML = `<option value="">${ph}</option>` + list.map(x => `<option>${esc(x)}</option>`).join(""); }
function bestMatch(list, v) { if (!v) return ""; const s = String(v).toLowerCase(); return list.find(x => x.toLowerCase() === s) || list.find(x => s.includes(x.toLowerCase()) || x.toLowerCase().includes(s)) || ""; }
async function downscale(file, max = 1600, q = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q);
  } finally { URL.revokeObjectURL(url); }
}
/* --- screenshot: keep only the reporter's squad --- */
let readAll = [], squadSel = null;
const normTag = v => String(v || "").toLowerCase().replace(/#\d+$/, "").replace(/[^a-z0-9]/g, "");
function isMe(name) {
  const a = normTag(name), b = normTag(S.me);
  if (!a || !b) return false;
  return a === b || (b.length >= 4 && a.includes(b)) || (a.length >= 4 && b.includes(a));
}
function teamsOf(list) { const t = []; list.forEach(p => { const k = p.team || ""; if (k && !t.includes(k)) t.push(k); }); return t; }
function mySquad(list) {
  const me = list.find(p => isMe(p.name)) || list.find(p => p.isYou);
  if (me && me.team) return me.team;
  return null;
}
function pickSquad(team) {
  squadSel = team;
  const list = team === null ? readAll : readAll.filter(p => p.team === team);
  rows = list.map(p => ({ ...blankRow(p.name), ...p, build: "" }));
  const bar = $("#squadPick"), teams = teamsOf(readAll);
  if (!bar) return;
  if (teams.length < 2) { bar.innerHTML = ""; return; }
  const mine = mySquad(readAll);
  bar.innerHTML = `<span class="muted">Squad:</span> ` + teams.map(t => `<button class="btn sm ${t === team ? "purple" : ""}" data-sq="${esc(t)}">${t === mine ? "⭐ " : ""}${esc(t)}</button>`).join("") +
    ` <button class="btn sm ${team === null ? "purple" : ""}" data-sq="">All teams</button>`;
  $$("[data-sq]", bar).forEach(b => b.onclick = () => { pickSquad(b.dataset.sq || null); renderRows(); });
}
function renderRows() {
  const L = $("#plList");
  if (!rows.length) rows.push(blankRow(S.me));
  L.innerHTML = rows.map((r, i) => `<div class="pl" data-i="${i}">
    <div class="top2"><input data-f="name" value="${esc(r.name)}" placeholder="Gamertag" maxlength="32">
      <select data-f="build"><option value="">Build</option>${CLASSES.map(c => `<option ${r.build === c ? "selected" : ""}>${c}</option>`).join("")}</select>
      <button class="btn sm danger" data-rm="${i}" aria-label="remove">✕</button></div>
    <div class="stats">${[["elims", "Elims"], ["assists", "Assists"], ["deaths", "Deaths"], ["revives", "Revives"], ["damage", "Damage"], ["objective", "Objective"]]
      .map(([f, l]) => `<div><label>${l}</label><input type="number" inputmode="numeric" min="0" data-f="${f}" value="${r[f] || 0}"></div>`).join("")}</div></div>`).join("");
  $$("input,select", L).forEach(inp => inp.oninput = () => {
    const i = +inp.closest(".pl").dataset.i, f = inp.dataset.f;
    rows[i][f] = (f === "name" || f === "build") ? inp.value : int(inp.value);
    livePreview();
  });
  $$("[data-rm]", L).forEach(b => b.onclick = () => { rows.splice(+b.dataset.rm, 1); renderRows(); });
  livePreview();
}
function scored() {
  const win = segVal($("#resSeg")) === "win", rolled = $("#rRolled").checked;
  return rows.filter(r => r.name.trim()).map(r => { const s = scoreOf(r, win, rolled); return { ...r, score: s, grade: gradeOf(s) }; }).sort((a, b) => b.score - a.score);
}
function resultRows(list) {
  return list.map((p, i) => `<div class="res"><span class="gradeb g-${p.grade}">${p.grade}</span><div class="n ${i === 0 ? "mvp" : ""}">${i === 0 ? "👑 " : ""}${esc(p.name)}
    <div class="note">${p.elims}E · ${p.assists}A · ${p.deaths}D · ${p.revives}R · ${fmt(p.damage)} dmg · ${p.objective} obj</div></div><span class="s">${fmt(p.score)}</span></div>`).join("");
}
function livePreview() {
  const list = scored();
  $("#livePrev").innerHTML = list.length ? resultRows(list) : `<span class="muted">Add players to see grades.</span>`;
}
async function submitReport() {
  const err = $("#subErr"); err.textContent = "";
  const list = scored();
  if (!list.length) { err.textContent = "Add at least one player with a name."; return; }
  const btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "SUBMITTING…";
  try {
    const meta = { mode: $("#rMode").value, map: $("#rMap").value, result: segVal($("#resSeg")) };
    const card = await makeCard("match", { ...meta, players: list, season: S.seasonName }, "wide").then(c => c.toDataURL("image/png")).catch(() => "");
    const r = await api("submitMatch", { reporter: S.me || list[0].name, ...meta, rolled: $("#rRolled").checked,
      players: rows.filter(r => r.name.trim()), screenshot: shotData, card });
    celebrate(r.match.result === "win" ? "VICTORY REPORTED!" : "REPORT FILED!");
    showMatchResult(r.match);
    rows = []; shotData = ""; readAll = []; squadSel = null; $("#squadPick").innerHTML = ""; $("#shotPrev").classList.add("hidden"); $("#shotRead").classList.add("hidden"); renderRows();
  } catch (e) { err.textContent = e.message; }
  finally { btn.disabled = false; btn.textContent = "SUBMIT REPORT"; }
}
function showMatchResult(m) {
  const box = modal(`<h2 class="gold">${m.result === "win" ? "🏆 Victory" : "⚔️ Match filed"}</h2>
    <p class="sub">${esc(m.mode || "Match")}${m.map ? " · " + esc(m.map) : ""} · Squad MVP <b class="mvp">${esc(m.mvp)}</b></p>
    <div>${resultRows(m.players)}</div>${shareButtons()}`);
  wireShare(box, () => ({ kind: "match", data: { ...m, season: m.season || S.seasonName } }));
}
function initReport() {
  fillSelect($("#rMode"), D.modes, "Mode"); fillSelect($("#rMap"), D.maps, "Map");
  seg($("#resSeg"), livePreview);
  $("#rRolled").onchange = livePreview;
  $("#shotPick").onclick = () => $("#shotIn").click();
  $("#shotIn").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    $("#shotErr").textContent = "";
    shotData = await downscale(f);
    const p = $("#shotPrev"); p.src = shotData; p.classList.remove("hidden");
    $("#shotRead").classList.remove("hidden");
    e.target.value = "";
  };
  $("#shotRead").onclick = async () => {
    const b = $("#shotRead"); b.disabled = true; b.textContent = "Reading…"; $("#shotErr").textContent = "";
    try {
      const r = (await api("readScreenshot", { image: shotData, me: S.me })).read || {};
      if (r.players && r.players.length) { readAll = r.players; pickSquad(mySquad(readAll)); }
      const md = bestMatch(D.modes, r.mode), mp = bestMatch(D.maps, r.map);
      if (md) $("#rMode").value = md; if (mp) $("#rMap").value = mp;
      if (r.result) $(`#resSeg button[data-v=${r.result === "win" ? "win" : "loss"}]`).click();
      renderRows(); toast(squadSel === null ? "Stats read. Remove anyone not in your squad, then double-check." : "Your squad's stats are in. Double-check before submitting.");
    } catch (e) { $("#shotErr").textContent = e.message; }
    finally { b.disabled = false; b.textContent = "🔎 Read stats"; }
  };
  $("#addPl").onclick = () => { rows.push(blankRow()); renderRows(); };
  $("#addMe").onclick = () => { if (!S.me) { toast("Set your gamertag in the Crew tab first"); return; } rows.push(blankRow(S.me)); renderRows(); };
  $("#submitBtn").onclick = submitReport;
  loaders.report = () => { $("#rRolled").checked = Date.now() - S.lastRoll < 3 * 3600e3; livePreview(); };
  renderRows();
}
function renderHowGrade() {
  $("#howGrade").innerHTML = `Points: +${W.elims} per elimination, +${W.assists} per assist, ${W.deaths} per death, +${W.revives} per revive, +${W.objective} per objective play, +${W.damagePer10} per 10 damage, +${W.win} for a win, +${W.rolled} for playing a rolled loadout.<br>
    Grades: <b>S</b> ${fmt(G.S)}+ · <b>A</b> ${fmt(G.A)}+ · <b>B</b> ${fmt(G.B)}+ · <b>C</b> ${fmt(G.C)}+ · <b>D</b> below. Top score = squad MVP. High Command can tune these in the Config tab of the Google Sheet.`;
}

/* =========================================================
   SCOREBOARD
   ========================================================= */
let boardData = null, seasonsData = null;
function aggregate(matches) {
  const t = {};
  matches.forEach(m => m.players.forEach(p => {
    const k = p.name.toLowerCase();
    const a = t[k] || (t[k] = { name: p.name, n: 0, wins: 0, score: 0, mvps: 0, s: 0, elims: 0, deaths: 0, revives: 0, objective: 0, damage: 0, best: 0 });
    a.n++; a.score += p.score; a.elims += p.elims; a.deaths += p.deaths; a.revives += p.revives; a.objective += p.objective; a.damage += p.damage;
    if (m.result === "win") a.wins++; if (p.grade === "S") a.s++; if (m.mvp === p.name) a.mvps++; a.best = Math.max(a.best, p.score);
  }));
  return Object.values(t).map(a => ({ ...a, avg: Math.round(a.score / a.n) })).sort((x, y) => y.score - x.score);
}
async function loadBoard(force) {
  const out = $("#boardOut");
  if (!boardData || force) {
    out.innerHTML = `<div class="empty">Loading…</div>`;
    try {
      const sel = $("#seasonSel").value || "";
      const [b, s] = await Promise.all([api("scoreboard", { season: sel }), seasonsData && !force ? Promise.resolve(seasonsData) : api("seasons")]);
      boardData = b; seasonsData = s;
      const opts = [s.current.name, ...s.archive.map(a => a.name)];
      $("#seasonSel").innerHTML = opts.map(o => `<option ${o === b.season ? "selected" : ""}>${esc(o)}</option>`).join("");
    } catch (e) { out.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  }
  renderBoard();
}
function renderBoard() {
  const out = $("#boardOut"), view = segVal($("#boardSeg")), b = boardData;
  $("#boardSub").textContent = `${b.season} · ${b.matches.length} match${b.matches.length === 1 ? "" : "es"} reported`;
  if (view === "stand") {
    const ag = aggregate(b.matches);
    if (!ag.length) { out.innerHTML = `<div class="empty">No matches yet this season. Head to Report after your next game.</div>`; return; }
    out.innerHTML = `<div class="panel stripe tablewrap"><table><thead><tr><th></th><th>Contestant</th><th class="num">Pts</th><th class="num">Avg</th><th class="num">MVP</th><th class="num">S</th><th class="num">GP</th><th class="num">W</th><th class="num">E</th><th class="num">R</th></tr></thead>
      <tbody>${ag.map((a, i) => `<tr><td class="rank">${i + 1}</td><td><b>${i === 0 ? "👑 " : ""}${esc(a.name)}</b></td><td class="num">${fmt(a.score)}</td><td class="num">${fmt(a.avg)}</td><td class="num">${a.mvps}</td><td class="num">${a.s}</td><td class="num">${a.n}</td><td class="num">${a.wins}</td><td class="num">${a.elims}</td><td class="num">${a.revives}</td></tr>`).join("")}</tbody></table></div>
      ${shareButtons("Share standings")}`;
    wireShare(out, () => ({ kind: "standings", data: { season: b.season, rows: ag.slice(0, 8) } }));
  } else if (view === "matches") {
    if (!b.matches.length) { out.innerHTML = `<div class="empty">No matches yet.</div>`; return; }
    out.innerHTML = `<div class="grid2">${b.matches.slice(0, 60).map(m => `<div class="panel">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${m.result === "win" ? "🏆 WIN" : "LOSS"} · ${esc(m.mode || "Match")}${m.map ? " · " + esc(m.map) : ""}</b><span class="note">${new Date(m.timestamp).toLocaleDateString()}</span></div>
      <div class="note">MVP <b class="mvp">${esc(m.mvp)}</b> · reported by ${esc(m.reporter || "crew")}${m.rolled ? " · 🎲 rolled" : ""}</div>
      ${resultRows(m.players.slice(0, 4))}
      <div class="btns" style="margin-top:8px"><button class="btn sm" data-share="${m.id}">⤴ Share</button>${m.screenshot ? `<a class="btn sm" href="${esc(m.screenshot)}" target="_blank" rel="noopener">🖼 Screenshot</a>` : ""}${S.admin ? `<button class="btn sm danger" data-delm="${m.id}">Delete</button>` : ""}</div></div>`).join("")}</div>`;
    $$("[data-share]", out).forEach(bt => bt.onclick = () => { const m = b.matches.find(x => x.id === bt.dataset.share); showMatchResult(m); });
    $$("[data-delm]", out).forEach(bt => bt.onclick = async () => {
      if (bt.dataset.sure !== "1") { bt.dataset.sure = "1"; bt.textContent = "Tap again to delete"; return; }
      try { await api("deleteMatch", { id: bt.dataset.delm }); toast("Match deleted"); loadBoard(true); } catch (e) { toast(e.message); }
    });
  } else {
    const a = (seasonsData && seasonsData.archive) || [];
    out.innerHTML = a.length ? `<div class="grid2">${a.map(s => `<div class="panel stripe"><h2 class="gold" style="font-size:22px">${esc(s.name)}</h2>
      <div class="res"><span class="gradeb g-S">🏆</span><div class="n">Season Champion<div class="note">${esc(s.champion || "—")}</div></div></div>
      <div class="res"><span class="gradeb g-A">👑</span><div class="n">Season MVP<div class="note">${esc(s.mvp || "—")}</div></div></div>
      <p class="note">${s.matches || 0} matches${s.end ? " · ended " + new Date(s.end).toLocaleDateString() : ""}</p></div>`).join("")}</div>`
      : `<div class="empty">No finished seasons yet. When High Command starts a new season, the champion and MVP land here.</div>`;
  }
}
function initBoard() {
  seg($("#boardSeg"), () => boardData && renderBoard());
  $("#boardRefresh").onclick = () => loadBoard(true);
  $("#seasonSel").onchange = () => loadBoard(true);
  loaders.board = () => loadBoard(false);
}

/* =========================================================
   SHARE CARDS
   ========================================================= */
const FORMATS = { wide: [1200, 675, "Discord / Facebook"], square: [1080, 1080, "Instagram post"], portrait: [1080, 1350, "Instagram portrait"], story: [1080, 1920, "Story / TikTok"] };
function shareButtons(label) {
  return `<div class="label">${label || "Share card"}</div><div class="chips" data-fmts>${Object.entries(FORMATS).map(([k, f], i) => `<button class="chip ${i === 0 ? "on" : ""}" data-fmt="${k}">${f[2]}</button>`).join("")}</div>
    <img class="cardprev hidden" alt="share card preview">
    <div class="btns" style="margin-top:8px"><button class="btn gold" data-sharego>⤴ Share</button><button class="btn" data-dl>⬇ Save image</button><button class="btn" data-copy>⧉ Copy</button></div>`;
}
function wireShare(root, getData) {
  let fmtK = "wide", canvas = null;
  const prev = $(".cardprev", root);
  const draw = async () => { canvas = await makeCard(getData().kind, getData().data, fmtK); prev.src = canvas.toDataURL("image/png"); prev.classList.remove("hidden"); };
  $$("[data-fmt]", root).forEach(b => b.onclick = () => { $$("[data-fmt]", root).forEach(x => x.classList.toggle("on", x === b)); fmtK = b.dataset.fmt; draw(); });
  const blob = () => new Promise(r => canvas.toBlob(r, "image/png"));
  $("[data-sharego]", root).onclick = async () => {
    if (!canvas) await draw();
    const file = new File([await blob()], "owc-" + Date.now() + ".png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "OWC Crew", text: "The OW Crew · twitch.tv/dwilson7165 · discord.gg/xkMZ3b5Zm" }); return; }
    } catch (e) { if (e.name === "AbortError") return; }
    toast("Sharing isn't available here. Use Save image instead.");
  };
  $("[data-dl]", root).onclick = async () => {
    if (!canvas) await draw();
    const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = "owc-" + Date.now() + ".png"; document.body.appendChild(a); a.click(); a.remove();
  };
  $("[data-copy]", root).onclick = async () => {
    if (!canvas) await draw();
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": await blob() })]); toast("Image copied. Paste it into Discord."); }
    catch (e) { toast("Copy isn't supported here. Use Save image."); }
  };
  draw();
}
let emblemImg = null;
function emblem() { if (emblemImg) return Promise.resolve(emblemImg); return new Promise(res => { const i = new Image(); i.onload = () => { emblemImg = i; res(i); }; i.onerror = () => res(null); i.src = "icons/emblem.png"; }); }
const FF = { stencil: "'Black Ops One', Impact, 'Arial Black', sans-serif", led: "Orbitron, 'Arial Black', sans-serif", body: "'Saira Condensed', 'Arial Narrow', Arial, sans-serif" };
async function makeCard(kind, data, fmtK) {
  try { await Promise.all([document.fonts.load("40px 'Black Ops One'"), document.fonts.load("700 30px Orbitron"), document.fonts.load("700 30px 'Saira Condensed'")]); } catch (e) {}
  const [w, h] = FORMATS[fmtK];
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d");
  const wide = w / h > 1.3;
  // background
  const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#1a1022"); bg.addColorStop(.5, "#111215"); bg.addColorStop(1, "#0c0c0f");
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  const glow = x.createRadialGradient(w / 2, h * .18, 10, w / 2, h * .18, w * .7); glow.addColorStop(0, "rgba(91,42,134,.55)"); glow.addColorStop(1, "rgba(91,42,134,0)");
  x.fillStyle = glow; x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(255,255,255,.03)"; x.lineWidth = 1;
  for (let i = 0; i < w; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  for (let i = 0; i < h; i += 40) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  const hazard = y => { x.save(); x.beginPath(); x.rect(0, y, w, 14); x.clip(); for (let i = -20; i < w + 20; i += 28) { x.fillStyle = "#d4a63a"; x.beginPath(); x.moveTo(i, y + 14); x.lineTo(i + 14, y); x.lineTo(i + 28, y); x.lineTo(i + 14, y + 14); x.fill(); } x.restore(); };
  hazard(0); hazard(h - 14);
  const goldText = (t, px, y, size, font, align = "left") => {
    x.font = `${size}px ${font}`; x.textAlign = align;
    const g = x.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, "#ffe08a"); g.addColorStop(.6, "#d4a63a"); g.addColorStop(1, "#8f6a1c");
    x.fillStyle = g; x.fillText(t, px, y);
  };
  const em = await emblem();
  const pad = wide ? 50 : 70;
  const eS = wide ? 150 : 220;
  if (em) { x.save(); x.beginPath(); x.roundRect ? x.roundRect(pad, 40, eS, eS, 24) : x.rect(pad, 40, eS, eS); x.clip(); x.drawImage(em, pad, 40, eS, eS); x.restore(); x.strokeStyle = "rgba(212,166,58,.6)"; x.lineWidth = 2; x.strokeRect(pad, 40, eS, eS); }
  const tx = pad + eS + 30;
  x.fillStyle = "#c9ccd1"; x.font = `700 ${wide ? 20 : 26}px ${FF.led}`; x.textAlign = "left";
  x.fillText("OWC HIGH COMMAND", tx, 40 + (wide ? 34 : 50));
  const title = kind === "match" ? (data.result === "win" ? "VICTORY" : "MATCH REPORT") : "STANDINGS";
  goldText(title, tx, 40 + (wide ? 100 : 140), wide ? 64 : 84, FF.stencil);
  const sub = (kind === "match" ? [data.mode, data.map, data.season].filter(Boolean).join("  ·  ") : (data.season || "")).toUpperCase();
  let subSize = wide ? 26 : 34; const maxW = w - tx - pad;
  x.fillStyle = "#ecebe6";
  do { x.font = `700 ${subSize}px ${FF.body}`; subSize -= 1; } while (x.measureText(sub).width > maxW && subSize > 14);
  x.fillText(sub, tx, 40 + (wide ? 138 : 190));
  let y = 40 + eS + (wide ? 34 : 60);
  const list = kind === "match" ? data.players.slice(0, wide ? 4 : (h > 1500 ? 8 : 6)) : data.rows.slice(0, wide ? 5 : (h > 1500 ? 8 : 6));
  if (kind === "match" && list[0]) {
    x.fillStyle = "rgba(91,42,134,.6)"; x.fillRect(pad, y, w - pad * 2, wide ? 62 : 90);
    x.fillStyle = "#ffe08a"; x.font = `700 ${wide ? 18 : 24}px ${FF.led}`; x.fillText("SQUAD MVP", pad + 20, y + (wide ? 38 : 54));
    goldText("👑 " + list[0].name, pad + (wide ? 210 : 270), y + (wide ? 44 : 64), wide ? 40 : 54, FF.stencil);
    y += (wide ? 62 : 90) + 16;
  }
  const footTop = h - (wide ? 110 : 170);
  const baseH = wide ? 60 : (h > 1500 ? 110 : 96);
  const rowH = Math.max(baseH * 0.8, Math.min(baseH * 1.5, (footTop - y) / Math.max(list.length, 1)));
  if (!wide) y += Math.max(0, (footTop - y - rowH * list.length) / 2) * 0.7;
  const gcol = { S: "#ffe08a", A: "#8a4fd0", B: "#3d6fb0", C: "#4b4d55", D: "#2a2b30" };
  list.forEach((p, i) => {
    const ry = y + i * rowH;
    x.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.06)"; x.fillRect(pad, ry, w - pad * 2, rowH - 8);
    const bx = pad + 12, bs = Math.min(rowH - 28, wide ? 40 : 76);
    if (kind === "match") {
      const by = ry + (rowH - 8 - bs) / 2; x.fillStyle = gcol[p.grade]; x.fillRect(bx, by, bs, bs);
      x.fillStyle = p.grade === "S" ? "#111" : "#fff"; x.font = `900 ${bs * .6}px ${FF.led}`; x.textAlign = "center"; x.fillText(p.grade, bx + bs / 2, by + bs * .72);
    } else {
      x.fillStyle = "#ffe08a"; x.font = `900 ${bs * .55}px ${FF.led}`; x.textAlign = "center"; x.fillText(String(i + 1), bx + bs / 2, ry + (rowH - 8) / 2 + bs * .2);
    }
    const mid = ry + (rowH - 8) / 2;
    x.textAlign = "left"; x.fillStyle = "#ecebe6"; x.font = `700 ${wide ? 28 : 38}px ${FF.body}`;
    x.fillText(p.name.slice(0, 20), bx + bs + 18, mid - (wide ? 2 : 4));
    x.fillStyle = "#8e8c86"; x.font = `600 ${wide ? 17 : 24}px ${FF.body}`;
    const line = kind === "match" ? `${p.elims} ELIMS · ${p.assists} AST · ${p.deaths} DTH · ${p.revives} REV · ${fmt(p.damage)} DMG` : `${p.n} GAMES · ${p.mvps} MVP · ${p.s} S-RANKS · AVG ${fmt(p.avg)}`;
    x.fillText(line, bx + bs + 18, mid + (wide ? 20 : 30));
    x.textAlign = "right"; x.fillStyle = "#ffe08a"; x.font = `900 ${wide ? 28 : 38}px ${FF.led}`;
    x.fillText(fmt(p.score), w - pad - 18, mid + 10);
  });
  // footer
  x.textAlign = "center"; x.fillStyle = "#c9ccd1"; x.font = `700 ${wide ? 20 : 28}px ${FF.body}`;
  x.fillText("TWITCH.TV/DWILSON7165   ·   DISCORD.GG/xkMZ3b5Zm", w / 2, h - (wide ? 34 : 60));
  goldText("ONE TEAM · ONE CREW · RISE TOGETHER", w / 2, h - (wide ? 62 : 104), wide ? 20 : 30, FF.stencil, "center");
  return c;
}

/* =========================================================
   TRIALS
   ========================================================= */
function todayET() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p; // YYYY-MM-DD
}
function seeded(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function todaysTrials() {
  const r = seeded("owc-" + todayET());
  const bySp = {}; D.trials.forEach(t => (bySp[t.sponsor] = bySp[t.sponsor] || []).push(t));
  const sps = Object.keys(bySp).sort(() => r() - .5).slice(0, 3);
  return sps.map(s => bySp[s][Math.floor(r() * bySp[s].length)]);
}
let trialState = null;
async function loadTrials() {
  const date = todayET();
  $("#trialDate").textContent = `Today's trials · ${new Date(date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · resets at midnight Eastern`;
  $("#meNote").textContent = S.me ? `as ${S.me}` : "Set your gamertag in the Crew tab to earn bucks";
  try { trialState = await api("trials", { date }); } catch (e) { $("#trialList").innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  renderTrials();
}
function renderTrials() {
  const date = todayET(), st = trialState, me = (S.me || "").toLowerCase();
  const bal = st.balances || {};
  const myB = Object.entries(bal).find(([k]) => k.toLowerCase() === me);
  const mine = myB ? myB[1] : 0;
  $("#myBucks").textContent = fmt(mine);
  $("#trialList").innerHTML = todaysTrials().map(t => {
    const sp = D.sponsors[t.sponsor];
    const done = st.claimedToday.some(c => c.trialId === t.id && c.player.toLowerCase() === me);
    const n = st.claimedToday.filter(c => c.trialId === t.id).length;
    return `<div class="panel trial" style="border-left-color:${sp.color}"><div class="sp" style="color:${sp.color}">${esc(t.sponsor)} <span class="muted">· ${esc(sp.tag)}</span></div>
      <h3>${esc(t.title)}</h3><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span class="bucks">+${t.bucks} <small class="muted" style="font-size:11px">BUCKS</small></span>
      <button class="btn ${done ? "" : "gold"}" data-claim="${t.id}" ${done ? "disabled" : ""}>${done ? "✓ Claimed" : "Mark complete"}</button></div>
      <div class="note" style="margin-top:6px">${n} crew member${n === 1 ? "" : "s"} completed this today</div></div>`;
  }).join("");
  $$("[data-claim]").forEach(b => b.onclick = async () => {
    if (!S.me) { toast("Set your gamertag in the Crew tab first"); return; }
    const t = D.trials.find(x => x.id === b.dataset.claim);
    b.disabled = true;
    try { trialState = await api("claimTrial", { player: S.me, date, trialId: t.id, sponsor: t.sponsor, title: t.title, bucks: t.bucks }); celebrate(`+${t.bucks} OWC BUCKS!`); renderTrials(); }
    catch (e) { toast(e.message); b.disabled = false; }
  });
  $("#rewardList").innerHTML = (S.rewards || []).map(r => `<div class="panel" style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b>${esc(r.name)}</b><div class="note">${esc(r.description || "")}</div></div>
    <div style="text-align:right"><div class="bucks" style="font-size:15px">${fmt(r.cost)}</div><button class="btn sm ${mine >= r.cost ? "gold" : ""}" data-redeem="${esc(r.id)}" ${mine >= r.cost ? "" : "disabled"}>Redeem</button></div></div>`).join("") || `<div class="empty">No rewards set up yet.</div>`;
  $$("[data-redeem]").forEach(b => b.onclick = async () => {
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Confirm?"; return; }
    b.disabled = true;
    try { trialState = await api("redeem", { player: S.me, rewardId: b.dataset.redeem }); celebrate("REWARD REDEEMED!"); toast("High Command has been notified."); renderTrials(); }
    catch (e) { toast(e.message); b.disabled = false; }
  });
  const lb = Object.entries(bal).sort((a, b) => b[1] - a[1]).slice(0, 15);
  $("#bucksBoard").innerHTML = lb.length ? lb.map(([n, v], i) => `<div class="res"><span class="rank">${i + 1}</span><div class="n">${esc(n)}</div><span class="s">${fmt(v)}</span></div>`).join("") : `<span class="muted">Nobody has earned bucks yet. Be first.</span>`;
  const rd = st.recentRedemptions || [];
  $("#redeemList").innerHTML = rd.length ? rd.map(r => `<div class="res"><div class="n">${esc(r.player)} <span class="muted">→</span> ${esc(r.reward)}<div class="note">${fmt(r.cost)} bucks · ${esc(r.status)}</div></div>
    ${S.admin && r.status === "pending" ? `<button class="btn sm gold" data-done="${r.row}">Done</button><button class="btn sm danger" data-refund="${r.row}">Refund</button>` : ""}</div>`).join("") : `<span class="muted">No redemptions yet.</span>`;
  $$("[data-done],[data-refund]").forEach(b => b.onclick = async () => {
    try { trialState = await api("setRedemption", { row: b.dataset.done || b.dataset.refund, status: b.dataset.refund ? "refunded" : "done" }); renderTrials(); } catch (e) { toast(e.message); }
  });
}

/* =========================================================
   INTEL
   ========================================================= */
let patchesLoaded = false;
function renderIntelStatic() {
  const s = D.season;
  $("#seasonCard").innerHTML = `<div class="who">CURRENT SEASON</div><h2 class="gold">${esc(s.name)}</h2><p class="note">Started ${new Date(s.started + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
    <ul style="margin:8px 0 8px 18px;line-height:1.5">${s.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>
    <div class="btns">${s.links.map(l => `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>`;
  $("#seasonCard").innerHTML += `<div class="label">Happening now</div><ul style="margin:0 0 4px 18px;line-height:1.5">${s.happening.map(h => `<li>${esc(h)}</li>`).join("")}</ul>
    <div class="label">Build health</div><div class="row2" style="grid-template-columns:repeat(3,1fr)">${CLASSES.map(c => `<div class="panel" style="margin:0;padding:10px;text-align:center"><b style="color:${D.classes[c].color}">${c.toUpperCase()}</b><div class="bucks">${D.health[c].hp}</div><div class="note">${D.health[c].was !== D.health[c].hp ? "was " + D.health[c].was : "unchanged"}</div></div>`).join("")}</div>`;
  $("#patchLog").innerHTML = D.patchLog.map((p, i) => `<details ${i === 0 ? "open" : ""} style="margin-top:8px"><summary>Update ${esc(p.v)} <span class="muted">· ${new Date(p.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></summary>
    <ul style="margin:8px 0 0 18px;line-height:1.5">${p.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`).join("");
  $("#soloModes").innerHTML = D.soloShowdown.map(([n, d]) => `<div class="res"><div class="n">${esc(n)}<div class="note">${esc(d)}</div></div></div>`).join("");
  $("#metaNotes").innerHTML = `<ul style="margin-left:18px;line-height:1.5">${D.metaNotes.map(n => `<li>${esc(n)}</li>`).join("")}</ul><p class="note" style="margin-top:8px">${esc(D.dataNote)}</p>`;
  const tierChips = (c, list) => list.filter(n => tierOf(c, n)).sort((a, b) => tierOf(c, a).localeCompare(tierOf(c, b)))
    .map(n => `<span class="chip"><span class="tier t-${tierOf(c, n)}">${tierOf(c, n)}</span> ${esc(n)}</span>`).join("");
  $("#metaTiers").innerHTML = `<div class="panel" style="border-color:var(--gold-lo)"><b>Changed since this tier list</b><ul style="margin:6px 0 0 18px;line-height:1.5">${D.changedSinceTiers.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` +
    CLASSES.map(c => `<div class="panel"><b style="color:${D.classes[c].color};letter-spacing:.1em">${c.toUpperCase()}</b>
    <h4 class="note" style="margin:10px 0 4px">WEAPONS</h4><div class="chips">${tierChips(c, D.classes[c].weapons)}</div>
    <h4 class="note" style="margin:10px 0 4px">SPECIALIZATIONS</h4><div class="chips">${tierChips(c, D.classes[c].specs)}</div>
    <h4 class="note" style="margin:10px 0 4px">GADGETS</h4><div class="chips">${tierChips(c, gadgetsOf(c))}</div></div>`).join("");
  $("#metaBuilds").innerHTML = `<div class="grid2">${D.metaBuilds.map((b, i) => `<div class="panel"><div class="who" style="color:${D.classes[b.cls].color}">${b.cls.toUpperCase()}</div><b style="font-size:19px">${esc(b.name)}</b>
    <div class="note">${esc(b.spec)} · ${esc(b.weapon)} · ${b.gadgets.map(esc).join(", ")}</div><div class="btns" style="margin-top:8px"><button class="btn sm gold" data-mb="${i}">Load in Roll</button></div></div>`).join("")}</div><p class="note">${esc(D.metaBuildNote)}</p>`;
  $$("[data-mb]").forEach(b => b.onclick = () => { const m = D.metaBuilds[b.dataset.mb]; showTab("roll"); loadCode(encode({ cls: m.cls, spec: m.spec, weapon: m.weapon, gadgets: m.gadgets })); });
}
async function loadPatches(force) {
  if (patchesLoaded && !force) return;
  const el = $("#patchList");
  try {
    const r = await api(force ? "refreshPatches" : "patches");
    patchesLoaded = true;
    el.innerHTML = (r.patches || []).length ? r.patches.map(p => `<div class="panel"><div class="note">${new Date(p.date).toLocaleDateString()}</div><b style="font-size:18px">${esc(p.title)}</b>
      <div class="note" style="white-space:pre-line;margin:6px 0;color:var(--silver)">${esc(p.summary)}</div><a class="btn sm" href="${esc(p.url)}" target="_blank" rel="noopener">Full notes ↗</a></div>`).join("")
      : `<div class="empty">No patch notes pulled yet. They'll appear within an hour of setup.</div>`;
  } catch (e) { el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* =========================================================
   ARMORY
   ========================================================= */
function renderArmory(c) {
  const k = D.classes[c];
  const ws = k.weapons.map(n => ({ n, ...(D.weaponStats[n] || {}) })).sort((a, b) => (b.dps || 0) - (a.dps || 0));
  const v = x => x == null ? "—" : x;
  const hp = D.health[c];
  $("#armOut").innerHTML = `<div class="panel stripe" style="display:flex;align-items:center;gap:14px"><div class="bucks" style="font-size:34px">${hp.hp}<small class="muted" style="font-size:12px"> HP</small></div><div class="note">${hp.was !== hp.hp ? `Season 12: ${hp.was} → ${hp.hp}. ` : ""}${esc(hp.note)}</div></div>
    <div class="label">Weapons</div><div class="panel tablewrap"><table><thead><tr><th>Weapon</th><th>Tier</th><th class="num">Dmg</th><th class="num">RPM</th><th class="num">DPS</th><th class="num">Mag</th><th class="num">TTK</th></tr></thead>
    <tbody>${ws.map(w => `<tr><td><b>${esc(w.n)}</b><div class="note">${esc(w.type || "")}</div>${w.note ? `<div class="note">${esc(w.note)}</div>` : ""}${w.s12 ? `<div class="note" style="color:var(--gold-hi)">▲▼ ${esc(w.s12)}</div>` : ""}</td><td>${tierOf(c, w.n) ? `<span class="tier t-${tierOf(c, w.n)}">${tierOf(c, w.n)}</span>` : ""}</td><td class="num">${v(w.dmg)}</td><td class="num">${v(w.rpm)}</td><td class="num">${v(w.dps)}</td><td class="num">${v(w.mag)}</td><td class="num">${w.ttk ? w.ttk.toFixed(2) + "s" : "—"}</td></tr>`).join("")}</tbody></table></div>
    <div class="label">Specializations</div><div class="panel">${k.specs.map(s => `<div class="res"><div class="n">${esc(s)}${tierTag(c, s)}<div class="note">${esc((D.specStats[s] || [])[1] || "")}</div></div><span class="pill">${esc((D.specStats[s] || [])[0] || "")}</span></div>`).join("")}</div>
    <div class="label">Gadgets</div><div class="panel">${gadgetsOf(c).map(g => { const s = D.gadgetStats[g] || []; return `<div class="res"><div class="n">${esc(g)}${tierTag(c, g)}${D.common.includes(g) ? ' <span class="pill">All builds</span>' : ""}<div class="note">${esc(s[1] || "")}</div></div><span class="pill">${s[0] ? s[0] + "s" : "—"}</span></div>`; }).join("")}</div>`;
  $("#armNote").innerHTML = `Sorted by DPS. Dmg = body damage per shot (shotguns: full shell; melee: precise hit). TTK = time to eliminate a Medium (250 HP); "—" where a Season 12 change means it still needs re-measuring. ▲▼ = changed this season. Gadget times are cooldowns. ${esc(D.dataNote)} "—" = not in our sources yet.`;
}

/* =========================================================
   MAPS
   ========================================================= */
let mapsData = { maps: [], pins: [] }, curMap = D.maps[0], adding = false;
async function loadMaps() {
  try { mapsData = await api("maps"); } catch (e) { $("#mapView").innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  renderMaps();
}
function renderMaps() {
  $("#mapChips").innerHTML = D.maps.map(m => `<button class="chip ${m === curMap ? "on" : ""}" data-map="${esc(m)}">${esc(m)}</button>`).join("");
  $$("[data-map]").forEach(b => b.onclick = () => { curMap = b.dataset.map; adding = false; renderMaps(); });
  const info = mapsData.maps.find(m => m.name === curMap);
  const pins = mapsData.pins.filter(p => p.map === curMap);
  const typeOpts = ["callout", "objective", "vault", "cashout", "spawn", "danger"];
  $("#mapView").innerHTML = `
    ${info && info.image ? `<div class="mapbox ${adding ? "adding" : ""}" id="mapbox"><img src="${esc(info.image)}" alt="${esc(curMap)} map">
      ${pins.map(p => `<div class="pin ${esc(p.type)}" style="left:${p.x}%;top:${p.y}%" data-pin="${esc(p.id)}"><b>${esc(p.label)}</b><i></i></div>`).join("")}</div>
      ${info.credit ? `<p class="note" style="margin-top:4px">Map image: ${esc(info.credit)}</p>` : ""}
      <div class="btns" style="margin-top:10px"><button class="btn ${adding ? "gold" : ""}" id="addPinBtn">${adding ? "Tap the map to place it…" : "📍 Add callout"}</button></div>`
    : `<div class="panel empty">No map image for ${esc(curMap)} yet.${S.admin ? " Upload one below." : " High Command can upload one."}</div>`}
    ${D.reworkedMaps.includes(curMap) ? `<p class="note" style="color:var(--gold-hi);margin-top:6px">Reworked in Season 12: make sure the map image shows the new layout.</p>` : ""}
    <div class="label">Callouts on ${esc(curMap)}</div>
    <div class="panel">${pins.length ? pins.map(p => `<div class="res"><span class="pill">${esc(p.type)}</span><div class="n">${esc(p.label)}<div class="note">added by ${esc(p.by || "crew")}</div></div>${S.admin ? `<button class="btn sm danger" data-delpin="${esc(p.id)}">✕</button>` : ""}</div>`).join("") : `<span class="muted">No callouts yet.</span>`}</div>
    ${S.admin ? `<div class="label">High Command: map image</div><div class="panel"><input type="file" accept="image/*" id="mapFile"><input id="mapCredit" placeholder="Image credit (e.g. GameCoach.gg)" style="margin-top:8px" value="${esc(info ? info.credit : "")}">
      <button class="btn gold" id="mapUp" style="margin-top:8px">Upload for ${esc(curMap)}</button></div>` : ""}`;
  const box = $("#mapbox");
  if ($("#addPinBtn")) $("#addPinBtn").onclick = () => { adding = !adding; renderMaps(); };
  if (box && adding) box.onclick = e => {
    if (e.target.closest(".pin")) return;
    const r = box.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1), y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    const m = modal(`<h2 class="gold">New callout</h2><input id="pinLabel" placeholder="e.g. Red Roof, Bank Vault, Bridge" maxlength="30">
      <select id="pinType" style="margin-top:8px">${typeOpts.map(t => `<option value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select>
      <button class="btn gold" id="pinSave" style="margin-top:10px;width:100%">Save callout</button>`);
    setTimeout(() => $("#pinLabel", m).focus(), 50);
    $("#pinSave", m).onclick = async () => {
      try { mapsData = await api("addPin", { map: curMap, x, y, label: $("#pinLabel", m).value, type: $("#pinType", m).value, by: S.me }); $("#modalRoot").innerHTML = ""; adding = false; renderMaps(); toast("Callout added"); }
      catch (err) { toast(err.message); }
    };
  };
  $$("[data-pin]").forEach(p => p.onclick = e => { e.stopPropagation(); const pin = pins.find(x => x.id === p.dataset.pin); toast(`${pin.label} · ${pin.type}${pin.by ? " · by " + pin.by : ""}`); });
  $$("[data-delpin]").forEach(b => b.onclick = async () => { try { mapsData = await api("deletePin", { id: b.dataset.delpin }); renderMaps(); } catch (e) { toast(e.message); } });
  if ($("#mapUp")) $("#mapUp").onclick = async () => {
    const f = $("#mapFile").files[0]; if (!f) { toast("Pick an image first"); return; }
    const b = $("#mapUp"); b.disabled = true; b.textContent = "Uploading…";
    try { mapsData = await api("uploadMap", { map: curMap, image: await downscale(f, 1800, .88), credit: $("#mapCredit").value }); toast("Map uploaded"); renderMaps(); }
    catch (e) { toast(e.message); b.disabled = false; b.textContent = "Upload for " + curMap; }
  };
}

/* =========================================================
   BADGES
   ========================================================= */
async function loadBadges() {
  const grid = $("#badgeGrid"), cs = $("#careerStats");
  if (!S.me) { cs.innerHTML = `<span class="muted">Set your gamertag in the Crew tab to track your badges.</span>`; }
  let matches = [];
  try { matches = (await api("scoreboard", { season: "*" })).matches; } catch (e) { cs.innerHTML = esc(e.message); }
  const me = (S.me || "").toLowerCase();
  const st = { matches: 0, mvps: 0, sGrades: 0, elims: 0, revives: 0, objective: 0, flawless: 0, bestDamage: 0, rolledWins: 0, wins: 0 };
  matches.forEach(m => { const p = m.players.find(x => x.name.toLowerCase() === me); if (!p) return;
    st.matches++; if (m.mvp.toLowerCase() === me) st.mvps++; if (p.grade === "S") st.sGrades++; st.elims += p.elims; st.revives += p.revives; st.objective += p.objective;
    if (p.deaths === 0) st.flawless++; st.bestDamage = Math.max(st.bestDamage, p.damage); if (m.result === "win") { st.wins++; if (m.rolled) st.rolledWins++; } });
  const got = D.achievements.filter(a => a.test(st)).length;
  if (S.me) cs.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">${esc(S.me)}</b><span class="bucks">${got}/${D.achievements.length}</span></div>
    <div class="note">${st.matches} matches · ${st.wins} wins · ${st.mvps} MVPs · ${st.sGrades} S-ranks · ${st.elims} elims · ${st.revives} revives</div>`;
  grid.innerHTML = D.achievements.map(a => `<div class="badge ${a.test(st) ? "got" : ""}"><span class="ic">${a.icon}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>`).join("");
}

/* =========================================================
   CREW: profile, music, install, admin
   ========================================================= */
function initCrew() {
  $("#meIn").value = S.me;
  $("#meSave").onclick = () => { S.me = $("#meIn").value.trim().slice(0, 32); store.set("me", S.me); toast(S.me ? `Welcome to the crew, ${S.me}` : "Gamertag cleared"); };
  $("#foot").innerHTML = `OWC Crew Hub v${esc(CFG.appVersion || "1")} · ${API ? "Connected to OWC Command" : "Demo mode"}<br>Fan-made by The OW Crew. Not affiliated with Embark Studios.<br>${esc(D.dataNote)}`;
  renderAdmin();
}
function renderAdmin() {
  const box = $("#adminBox");
  if (!S.admin) {
    box.innerHTML = `<p class="note">Admin tools for Don: new seasons, deleting bad reports, map uploads.</p><div style="display:flex;gap:8px;margin-top:8px"><input id="pinIn" type="password" inputmode="numeric" placeholder="Admin PIN"><button class="btn gold" id="pinGo">Unlock</button></div>`;
    $("#pinGo").onclick = async () => {
      sess.set("pin", $("#pinIn").value.trim());
      try { await api("adminCheck"); S.admin = true; toast("High Command unlocked"); renderAdmin(); }
      catch (e) { sess.set("pin", ""); toast(e.message); }
    };
    return;
  }
  box.innerHTML = `<p><b class="mvp">High Command unlocked</b> <span class="note">(this session)</span></p>
    <div class="label">Start a new season</div><p class="note">Archives the current standings (Champion + MVP go to the Hall of Fame) and resets the scoreboard.</p>
    <div style="display:flex;gap:8px;margin-top:6px"><input id="nsName" placeholder="e.g. OWC Season 2"><button class="btn gold" id="nsGo">Start</button></div>
    <div class="label">Patch notes</div><button class="btn" id="pRef">↻ Check for new patches now</button>
    <div class="label">Other tools</div><p class="note">Delete reports in Scoreboard > Matches. Upload map images and remove callouts in Maps. Mark rewards done in Trials. Scoring and rewards live in the Google Sheet (Config and Rewards tabs).</p>
    <div class="btns" style="margin-top:10px"><button class="btn danger" id="lockAdmin">Lock</button></div>`;
  $("#nsGo").onclick = async () => {
    const name = $("#nsName").value.trim(); if (!name) { toast("Name the new season"); return; }
    const b = $("#nsGo"); if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Confirm"; return; }
    try { const r = await api("newSeason", { name }); celebrate("NEW SEASON!"); toast(`${r.archived} archived. Champion: ${r.champion || "—"}`); boardData = null; seasonsData = null; await loadConfig(); renderAdmin(); }
    catch (e) { toast(e.message); }
  };
  $("#pRef").onclick = async () => { toast("Checking Steam…"); await loadPatches(true); toast("Patch notes updated"); };
  $("#lockAdmin").onclick = () => { sess.set("pin", ""); S.admin = false; renderAdmin(); };
}
/* music */
let tracks = [], tIdx = 0;
const audio = $("#audio");
async function initMusic() {
  try { const r = await fetch("music/playlist.json", { cache: "no-cache" }); if (r.ok) tracks = (await r.json()).tracks || []; } catch (e) {}
  audio.volume = store.get("vol", 0.6); $("#mVol").value = audio.volume;
  $("#mVol").oninput = e => { audio.volume = +e.target.value; store.set("vol", audio.volume); };
  $("#mList").innerHTML = tracks.length ? tracks.map((t, i) => `<div class="track" data-t="${i}">♪ ${esc(t.title)}</div>`).join("") : `<p class="note">Add your Suno MP3s to the music folder (see the setup guide) and they'll show up here.</p>`;
  $$("[data-t]").forEach(el => el.onclick = () => playTrack(+el.dataset.t));
  const toggle = () => { if (!tracks.length) { toast("No tracks yet. Add MP3s to the music folder."); return; } if (audio.paused) { if (!audio.src) playTrack(tIdx); else audio.play().catch(() => {}); } else audio.pause(); };
  $("#musicBtn").onclick = toggle; $("#mPlay").onclick = toggle;
  $("#mNext").onclick = () => tracks.length && playTrack((tIdx + 1) % tracks.length);
  $("#mPrev").onclick = () => tracks.length && playTrack((tIdx - 1 + tracks.length) % tracks.length);
  audio.onended = () => playTrack((tIdx + 1) % tracks.length);
  audio.onplay = audio.onpause = () => { const on = !audio.paused; $("#musicBtn").classList.toggle("on", on); $("#mPlay").textContent = on ? "⏸" : "▶"; };
  if (tracks.length) $("#mNow").textContent = tracks[0].title;
  /* Auto-start: browsers only allow sound after the first tap, so start on the first touch anywhere. */
  const auto = $("#mAuto");
  auto.checked = store.get("autoMusic", true);
  auto.onchange = () => { store.set("autoMusic", auto.checked); if (!auto.checked) audio.pause(); };
  if (tracks.length && auto.checked) {
    tIdx = Math.floor(Math.random() * tracks.length);
    audio.src = "music/" + encodeURIComponent(tracks[tIdx].file);
    audio.play().catch(() => {
      const kick = e => {
        if (e.target.closest && (e.target.closest("#musicBtn") || e.target.closest("#mPlay") || e.target.closest("#mAuto"))) return cleanup();
        if (auto.checked && audio.paused) playTrack(tIdx);
        cleanup();
      };
      const cleanup = () => ["pointerdown", "keydown"].forEach(ev => removeEventListener(ev, kick, true));
      ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, kick, true));
    });
  }
}
function playTrack(i) {
  tIdx = i; const t = tracks[i]; if (!t) return;
  audio.src = "music/" + encodeURIComponent(t.file); audio.play().catch(() => toast("Tap play again to start the music"));
  $("#mNow").textContent = t.title;
  $$("[data-t]").forEach(el => el.classList.toggle("on", +el.dataset.t === i));
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: "The OW Crew", artwork: [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
}
/* install */
let deferred = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("#installBtn").classList.remove("hidden"); });
function initInstall() {
  $("#installBtn").onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#installBtn").classList.add("hidden"); };
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) $("#installTip").textContent = "You're running the installed app. 🦉";
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* =========================================================
   BOOT
   ========================================================= */
async function loadConfig() {
  try {
    const r = await api("config");
    S.cfg = r.config; S.rewards = r.rewards || []; S.seasonName = r.config.seasonName;
    W = { ...DEFAULT_W, ...(r.config.weights || {}) }; G = { ...DEFAULT_G, ...(r.config.grades || {}) };
    renderHowGrade(); livePreview();
  } catch (e) { toast("Can't reach OWC Command: " + e.message); renderHowGrade(); }
}
function init() {
  if (!API) $("#demoBanner").classList.remove("hidden");
  initRoll(); initReport(); initBoard(); initCrew(); initMusic(); initInstall();
  seg($("#armSeg"), renderArmory); renderArmory("Light");
  renderIntelStatic();
  loaders.trials = loadTrials; loaders.intel = () => loadPatches(false); loaders.maps = loadMaps; loaders.badges = loadBadges;
  loaders.crew = () => { $("#meIn").value = S.me; };
  renderHowGrade();
  loadConfig().then(() => { const h = location.hash.slice(1); if (h && $("#tab-" + h)) showTab(h); });
}
init();
})();
