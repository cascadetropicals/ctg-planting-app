// Rendering: tabs, list (windowed), detail pane, form sheet, menu.
import { S, subscribe, context, setFields, flagRow, addRecord, chipOn, toggleChip, setPref, plantOptions, logout, refreshNow, setTablet } from './store.js';
import { VIEWS, VBAR, viewById, CHIPS, isPlugSize, reasonKey } from './views.js';
import { FORMS, PREFILL, FORM_DEFAULTS, readyDate } from './forms.js';
import { fmtDate, fmtDateTime, fmtNum, norm, esc, nowStamp } from './format.js';
import { t, getLang, setLang, tItems, tSignedIn, tGoogle, tTablet, tTitle, tAgain, tSaved } from './i18n.js';

const $ = s => document.querySelector(s);
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('aria-') && typeof v === 'boolean') { e.setAttribute(k, String(v)); continue; }
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = t(v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : (k === 'aria-label' || k === 'title' || k === 'placeholder' ? t(v) : v));
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(typeof c === 'string' ? t(c) : c));
  return e;
}
const NOFMT = new Set(['Forecast #', 'Plant Week', 'Ready Week', 'Incoming Week', 'Item #', 'Item Code', 'ID', 'Plant #', 'QCell', 'Size']);
export function show(col, v) {
  if (v === true) return 'Yes'; if (v === false) return 'No';
  if (v === '' || v == null) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(v)) return fmtDateTime(v);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDate(v);
  if (!NOFMT.has(col) && v !== '' && !isNaN(Number(v)) && String(v).trim() !== '') return fmtNum(v);
  return String(v);
}

// ---------------- state ----------------
const U = { view: 'planIncoming', sel: null, q: '', limit: 60, rows: [], counts: {} };
try { const v = localStorage.getItem('ctg_view'); if (v && viewById(v)) U.view = v; } catch (e) { /* ignore */ }
const view = () => viewById(U.view);
const wide = () => matchMedia('(min-width:900px)').matches;

function compute(v) {
  const C = context();
  if (v.kind === 'vendors') return (S.tables.vendors || []).slice().sort((a, b) => String(a['Vendor Name']).localeCompare(String(b['Vendor Name'])));
  if (!v.table) return [];
  let rows = (S.tables[v.table] || []).filter(r => v.slice(r, C));
  const q = norm(U.q);
  if (q) rows = rows.filter(r => norm([r.Genus, r.Variety, r.Vendor, r.Size, r.Location, r['Forecast #'], r['Plant Date'], r['Plug Location']].join(' ')).includes(q));
  return rows.sort(v.sort);
}
function computeCounts() {
  const C = context(), c = {};
  for (const v of VIEWS) {
    if (v.kind === 'vendors') c[v.id] = (S.tables.vendors || []).length;
    else if (v.table) { let n = 0; for (const r of S.tables[v.table] || []) if (v.slice(r, C)) n++; c[v.id] = n; }
  }
  U.counts = c;
}

// ---------------- tabs ----------------
const TAB_UI = {
  planIncoming: ['Incoming', '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'],
  planPlugs: ['Plugs', '<path d="M12 21v-8"/><path d="M12 13c-4 0-6-2-6-6 4 0 6 2 6 6z"/><path d="M12 15c0-3 2-5 6-5 0 4-2 5-6 5z"/>'],
  planFinished: ['Finished', '<path d="M6 11h12l-1.5 9h-9z"/><path d="M12 11V5"/><path d="M12 8c-3 0-4-2-4-4 3 0 4 1 4 4zM12 8c0-2 1-3 4-3 0 2-1 3-4 3z"/>'],
  plant2in: ['2in', '<path d="M7 12h10l-1 7H8z"/><path d="M12 12V7"/><path d="M12 9c-2 0-3-1-3-3 2 0 3 1 3 3z"/>'],
  finAddition: ['Addition', '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>']
};
function renderTabs() {
  const nav = $('#tabs'); nav.textContent = '';
  VIEWS.forEach(v => {
    const ui = TAB_UI[v.id] || [v.name, '<circle cx="12" cy="12" r="8"/>'];
    const ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ico.setAttribute('viewBox', '0 0 24 24'); ico.setAttribute('aria-hidden', 'true'); ico.innerHTML = ui[1];
    const b = h('button', { class: 'tab', role: 'tab', 'aria-selected': v.id === U.view, 'aria-label': v.name, title: v.name, 'data-id': v.id, onclick: () => go(v.id) },
      ico, h('span', { class: 'lb', text: ui[0] }), U.counts[v.id] != null ? h('span', { class: 'n', text: fmtNum(U.counts[v.id]) }) : null);
    nav.append(b);
  });
}
function go(id) {
  U.view = id; U.sel = null; U.q = ''; U.limit = 60; $('#search').value = ''; $('#clearSearch').hidden = true;
  try { localStorage.setItem('ctg_view', id); } catch (e) { /* ignore */ }
  $('#app').classList.remove('phone-detail'); renderAll();
  $('#list').scrollTop = 0;
}

// ---------------- list ----------------
function renderChips() {
  const el = $('#chips'), v = view(); el.textContent = '';
  if (v.chips) {
    for (const n of CHIPS[v.chips]) el.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': chipOn(v.chips, n), onclick: () => { toggleChip(v.chips, n); U.limit = 60; renderList(); renderChips(); } }, n));
  } else if (v.vendorPicker) {
    const names = [...new Set((S.tables.vendors || []).map(x => x['Vendor Name']))].sort();
    for (const n of names) {
      const on = S.prefs.urc.includes(n);
      el.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': on, onclick: () => { setPref('urc', on ? S.prefs.urc.filter(x => x !== n) : [...S.prefs.urc, n]); renderAll(); } }, n));
    }
  }
  el.hidden = !el.childElementCount;
}
function rowEl(v, r) {
  const subs = (v.sub || []).map(c => show(c, r[c])).filter(Boolean);
  const tags = [];
  if (r['Planted on App']) tags.push(h('span', { class: 'tag green', text: 'Planted' }));
  if (r['Flagged on App'] || r.Flagged) tags.push(h('span', { class: 'tag green', text: 'Flagged' }));
  if (r.Transferred) tags.push(h('span', { class: 'tag blue', text: 'Transferred' }));
  if (r['Label added']) tags.push(h('span', { class: 'tag green', text: 'Label added' }));
  const sz = r.Size || (v.kind === 'urc' ? (r['URC Priority'] || '–') : '');
  return h('div', { class: 'row' + (r['Planted on App'] || r['Flagged on App'] ? ' done' : ''), role: 'listitem', 'data-k': r._k, 'aria-selected': U.sel === r._k, onclick: () => select(r._k) },
    sz !== '' ? h('div', { class: 'sz', text: String(sz) }) : null,
    h('div', { class: 'tx' }, h('div', { class: 't1', text: ((r.Genus || '') + ' ' + (r.Variety || '')).trim() || r['Vendor Name'] || '' }),
      h('div', { class: 't2' }, subs.join(' · '), tags)),
    quickBtn(v, r));
}
// One-tap action on the row itself (Planting / Label printing / Flag): opens the form without opening the detail view
function quickBtn(v, r) {
  const k = (v.actions || []).find(x => MAIN_ACTIONS.includes(x) && ACTIONS[x] && ACTIONS[x].show(r));
  if (!k) return null;
  const main = h('button', { class: 'btn primary quick', type: 'button', onclick: e => { e.stopPropagation(); ACTIONS[k].run(r, v); } }, ACTIONS[k].label);
  if (!(v.video && r._video && /^plant/.test(k))) return main; // play only next to Planting, never next to label buttons
  // plant has an instruction video: play button as the right third of the quick action
  const play = h('a', { class: 'btn primary play', href: r._video, target: '_blank', rel: 'noopener', 'aria-label': 'Watch video', title: 'Watch video', onclick: e => e.stopPropagation() }, '\u25B6');
  return h('div', { class: 'qgroup' }, main, play);
}
function vendorRow(r) {
  const on = !!r.VendorConfirmed;
  return h('div', { class: 'row', role: 'listitem', style: 'padding:6px 12px' },
    h('button', { class: 'tile', role: 'switch', 'aria-checked': on, onclick: () => { setFields('vendors', r, { VendorConfirmed: !on }); } },
      h('span', { text: r['Vendor Name'] }), h('span', { class: 'sw' })));
}
let io = null;
function renderList() {
  const v = view(), list = $('#list'); list.textContent = '';
  if (io) io.disconnect();
  U.rows = compute(v);
  $('#viewhead').textContent = '';
  if (v.kind === 'addition') {
    $('#vbar').hidden = true;
    $('#viewhead').append(h('span', { text: 'Add a finished planting record' }));
    list.append(h('div', { class: 'empty' }, h('b', { text: 'New finished planting' }), h('p', { text: 'Record plants you planted that are not on the list.' }),
      h('button', { class: 'btn primary', type: 'button', onclick: () => openForm('finAddition', FORM_DEFAULTS(), { sentKey: null }) }, 'Add record')));
    $('#searchbar').hidden = true; return;
  }
  renderVbar();
  $('#searchbar').hidden = v.kind === 'vendors';
  $('#viewhead').append(h('span', { text: v.name }), h('span', { text: fmtNum(U.rows.length) + ' ' + tItems(U.rows.length) }));
  if (!S.loaded) { list.append(h('div', { class: 'empty' }, h('b', { text: 'Loading…' }))); return; }
  if (v.kind === 'urc' && !S.prefs.urc.length) { list.append(h('div', { class: 'empty' }, h('b', { text: 'Select incoming vendor' }), h('p', { text: 'Tap one or more vendors above.' }))); return; }
  if (!U.rows.length) { list.append(h('div', { class: 'empty' }, h('b', { text: 'Nothing here' }), h('p', { text: 'No items match this view right now.' }))); return; }
  appendRows(v);
}
function appendRows(v) {
  const list = $('#list'); list.querySelector('.sentinel')?.remove();
  const start = list.querySelectorAll('.row').length, end = Math.min(U.rows.length, U.limit);
  const frag = document.createDocumentFragment();
  for (let i = start; i < end; i++) frag.append(v.kind === 'vendors' ? vendorRow(U.rows[i]) : rowEl(v, U.rows[i]));
  list.append(frag);
  if (end < U.rows.length) {
    const s = h('div', { class: 'sentinel' }); list.append(s);
    io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); U.limit += 120; appendRows(v); } }, { root: list, rootMargin: '400px' });
    io.observe(s);
  }
}
function select(k) {
  U.sel = k; document.querySelectorAll('.row[aria-selected=true]').forEach(e => e.setAttribute('aria-selected', 'false'));
  document.querySelector('.row[data-k="' + CSS.escape(k) + '"]')?.setAttribute('aria-selected', 'true');
  if (!wide()) $('#app').classList.add('phone-detail');
  renderDetail();
}

// ---------------- detail ----------------
const selectedRow = () => U.sel == null ? null : (S.tables[view().table] || []).find(r => r._k === U.sel);
function renderDetail() {
  const d = $('#detailpane'), v = view(); d.textContent = '';
  const r = view().table ? selectedRow() : null;
  if (!r || v.kind === 'vendors') { d.append(h('div', { class: 'empty' }, h('b', { text: 'Select an item' }), h('p', { text: 'Details and actions appear here.' }))); return; }
  d.append(h('div', { class: 'dhead' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => { U.sel = null; $('#app').classList.remove('phone-detail'); renderList(); renderDetail(); } }, '←'),
    h('div', { class: 'ttl' }, ((r.Genus || '') + ' ' + (r.Variety || '')).trim(), h('small', { text: [r.Size, r.Vendor || r.Location].filter(Boolean).join(' · ') }))));
  const body = h('div', { class: 'dbody' });
    const MAIN = MAIN_ACTIONS;
  const keys = (v.actions || []).filter(k => ACTIONS[k] && ACTIONS[k].show(r));
  const main = keys.filter(k => MAIN.includes(k)), more = keys.filter(k => !MAIN.includes(k));
  if (main.length) body.append(h('div', { class: 'actions main' }, main.map(k => h('button', { class: 'btn primary big', type: 'button', onclick: () => ACTIONS[k].run(r, v) }, ACTIONS[k].label))));
  if (more.length) body.append(h('details', { class: 'more' }, h('summary', { text: 'More actions' }), h('div', { class: 'actions' }, more.map(k => h('button', { class: 'btn', type: 'button', onclick: () => ACTIONS[k].run(r, v) }, ACTIONS[k].label)))));
  if (v.video && r._video) body.append(h('div', { class: 'actions' }, h('a', { class: 'btn', href: r._video, target: '_blank', rel: 'noopener' }, 'Watch video')));
  const sect = h('div', { class: 'sect', style: 'margin:0 12px 16px' }, h('h3', { text: 'Details' }));
  for (const c of v.cols) { const val = show(c, r[c]); if (val !== '') sect.append(h('div', { class: 'kv' }, h('span', { text: c }), h('span', { text: val }))); }
  body.append(sect); d.append(body);
}

// ---------------- view-level buttons (Empieza, Additions) ----------------
function choose(title, hint, opts) {
  const ov = $('#overlay'), close = () => { ov.hidden = true; ov.textContent = ''; document.body.style.overflow = ''; };
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
    h('header', {}, h('h2', { text: title }), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: close }, '✕')),
    h('div', { class: 'body' }, hint ? h('p', { class: 'hint', text: hint }) : null, opts.map(o => h('button', { class: 'btn primary big choice', type: 'button', onclick: () => { close(); o.run(); } }, o.label))));
  ov.textContent = ''; ov.append(sheet); ov.hidden = false; document.body.style.overflow = 'hidden'; ov.onclick = e => { if (e.target === ov) close(); };
}
// One tap: saves Empieza with the logged-in name (Employee) and email; no form.
// Last time is remembered per user and kind on this device; the buttons show it ("not yet today" otherwise).
const EK = 'ctg_empieza';
const empGet = () => { try { return JSON.parse(localStorage.getItem(EK) || '{}'); } catch (e) { return {}; } };
const empLast = kind => { const t = (empGet()[(S.user && S.user.name || '') + '|' + kind]) || 0; return t; };
const sameDay = t => t && new Date(t).toDateString() === new Date().toDateString();
const hhmm = t => { const d = new Date(t); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
const empStatus = kind => { const last = empLast(kind); return sameDay(last) ? '✓ ' + hhmm(last) : t('not yet today'); };
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
function toast(msg) {
  let t = document.querySelector('#toast'); if (!t) { t = h('div', { id: 'toast', role: 'status' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 4000);
}
function empieza(kind) {
  const label = kind === 'plug' ? 'Plugs' : 'Finished', last = empLast(kind);
  const go = () => {
    addRecord(kind === 'plug' ? 'gfPlug' : 'gfFin', { 'Choose Plant': 'Empieza', Employee: S.user.name }, null);
    const m = empGet(); m[(S.user.name || '') + '|' + kind] = Date.now(); try { localStorage.setItem(EK, JSON.stringify(m)); } catch (e) { /* ignore */ }
    toast(tSaved(label, S.user.name, hhmm(Date.now()))); renderVbar();
  };
  if (last && Date.now() - last < 3 * 3600 * 1000) choose(tTitle(label), tAgain(label, ago(last), hhmm(last)), [{ label: 'Yes, submit again', run: go }, { label: 'No, cancel', run: () => {} }]);
  else go();
}
// Lunch alert: from 12:40 Pacific time, until someone taps Empieza (plugs or finished) after 12:40. Only while the app is open.
const ALERT_FROM = 12 * 60 + 40, ALERT_TO = 17 * 60; // minutes after midnight, Pacific
const pt = t => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(t)).map(x => [x.type, x.value])); return { day: p.year + p.month + p.day, min: Number(p.hour) * 60 + Number(p.minute) }; };
let snoozeUntil = 0;
// Returns 'start' (no Empieza yet today, e.g. right after signing in), 'lunch' (none since 12:40 PT) or '' (nothing to show).
function empDue() {
  if (!S.user || !S.loaded || Date.now() < snoozeUntil) return '';
  const n = pt(Date.now()), ts = ['plug', 'fin'].map(empLast).filter(Boolean).map(pt).filter(l => l.day === n.day);
  if (!ts.length) return 'start';
  if (n.min < ALERT_FROM || n.min >= ALERT_TO) return '';
  return ts.some(l => l.min >= ALERT_FROM) ? '' : 'lunch';
}
function checkLunch() {
  const ex = document.querySelector('#lunchAlert'), due = empDue();
  if (!due) { if (ex) ex.remove(); return; }
  if (ex || !$('#overlay').hidden) return; // already showing, or someone is filling in a form: try again in 30 s
  const close = () => document.querySelector('#lunchAlert')?.remove();
  const doIt = k => () => { close(); empieza(k); };
  const el = h('div', { id: 'lunchAlert', role: 'alertdialog', 'aria-modal': 'true' },
    h('div', { class: 'box' }, h('div', { class: 'big', text: due === 'start' ? '🌱' : '🍽️' }), h('h2', { text: due === 'start' ? 'Starting work?' : 'Back from lunch?' }),
      h('p', { text: due === 'start' ? 'Tap Empieza now to start your day, so your work time is recorded correctly.' : 'Tap Empieza now, so your work time is recorded correctly.' }),
      h('button', { class: 'btn primary big', type: 'button', onclick: doIt('plug') }, 'Plugs – Empieza'),
      h('button', { class: 'btn primary big', type: 'button', onclick: doIt('fin') }, 'Finished – Empieza'),
      h('button', { class: 'btn', type: 'button', onclick: () => { snoozeUntil = Date.now() + 10 * 60000; close(); } }, due === 'start' ? 'Not yet – remind me in 10 min' : 'Not back yet – remind me in 10 min')));
  document.body.append(el); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { /* ignore */ }
}
let askedTablet = false;
export function askTablet(force) {
  const list = (S.L.lists || {}).tabletEmail || []; if (!list.length) return;
  if (!force) { if (S.tablet || askedTablet || (S.user && S.user.email)) return; askedTablet = true; }
  choose('Which Google account is this tablet signed in to?', 'Pick it once. It is saved with every record as the Email Address (like AppSheet did).', list.map(e => ({ label: e, run: () => setTablet(e) })));
}
function renderVbar() {
  const bar = $('#vbar'), cfg = VBAR[view().id]; bar.textContent = ''; bar.hidden = !cfg; if (!cfg) return;
  const KL = { plug: 'Plugs', fin: 'Finished' };
  const START = { plug: { label: 'Plugs – Empieza  (' + empStatus('plug') + ')', run: () => empieza('plug') }, fin: { label: 'Finished – Empieza  (' + empStatus('fin') + ')', run: () => empieza('fin') } };
  const ADD = { plug: { label: 'Plugs Addition', run: () => openForm('plugAddition', {}, { sentKey: null }) }, fin: { label: 'Finished Addition', run: () => openForm('finAddition', {}, { sentKey: null }) } };
  if (cfg.start) {
    const st = cfg.start.map(k => KL[k] + ' ' + empStatus(k)).join(' · '), ok = cfg.start.every(k => sameDay(empLast(k)));
    bar.append(h('button', { class: 'btn primary emp' + (ok ? '' : ' warn'), type: 'button', onclick: () => cfg.start.length === 1 ? START[cfg.start[0]].run() : choose('Empieza – start work', 'Tap this every time you start again: morning, after break, lunch, pulling or other work. It is saved right away with your name.', cfg.start.map(k => START[k])) },
      h('b', { text: 'Empieza' }), h('small', { text: st })));
  }
  if (cfg.add) bar.append(h('button', { class: 'btn', type: 'button', onclick: () => choose('Add a planting record', 'For plants that are not in the list.', cfg.add.map(k => ADD[k])) }, '+ Addition'));
}

// ---------------- actions ----------------
const MAIN_ACTIONS = ['plantInc', 'labelInc', 'plantPlug', 'labelPlug', 'plantFin', 'labelFin', 'flagPlug', 'flagFin', 'addLabels'];
const sentKey = (t, r, k) => t + ':' + r._k + ':' + k;
const plugForm = (r, v) => v.table === 'incoming' ? isPlugSize(r.Size) : v.table === 'plugPlant';
const ACTIONS = {
  plantInc: { label: 'Planting', show: r => !r['Planted on App'], run: (r, v) => plantRun(r, v, 'p') },
  labelInc: { label: 'Label printing', show: r => !!r['Planted on App'], run: (r, v) => labelRun(r, v) },
  plantPlug: { label: 'Planting', show: r => !r['Planted on App'], run: (r, v) => plantRun(r, v, 'p') },
  labelPlug: { label: 'Label printing', show: r => !!r['Planted on App'], run: (r, v) => labelRun(r, v) },
  plantFin: { label: 'Planting', show: r => !r['Planted on App'], run: (r, v) => plantRun(r, v, 'p') },
  labelFin: { label: 'Label printing', show: r => !!r['Planted on App'], run: (r, v) => labelRun(r, v) },
  flagPlug: { label: 'Flag', show: r => !r['Flagged on App'] && !r.Transferred, run: (r, v) => { flagRow(v.table, r); } },
  flagFin: { label: 'Flag', show: r => !r['Flagged on App'] && !r.Transferred, run: (r, v) => { flagRow(v.table, r); } },
  reasonInc: { label: 'Add reason why not planted', show: () => true, run: (r, v) => reasonRun(r, v, 'Incoming audit reason', 'Reason why not planted', 'reasonIncoming') },
  reasonPlug: { label: 'Add reason why not planted', show: () => true, run: (r, v) => reasonRun(r, v, 'Plugs audit reason', 'Reason why not flagged', 'reasonPlug') },
  reasonFin: { label: 'Add reason why not planted', show: () => true, run: (r, v) => reasonRun(r, v, 'Finished audit reason', 'Reason why not flagged', 'reasonFin') },
  addLabels: { label: 'Add labels', show: r => !r['Label added'], run: (r, v) => { setFields(v.table, r, { 'Label added': true }); openForm('addLabels', PREFILL.finAddLabels(r, S.L), { sentKey: sentKey(v.table, r, 'l') }); } },
  setPlanted: { label: 'Set Planted on App', show: r => !r['Planted on App'], run: (r, v) => setFields(v.table, r, { 'Planted on App': true }) },
  labelsBy: { label: 'Labels added by', show: () => true, run: (r, v) => reasonRun(r, v, 'Label added by', 'Label added by', 'labelBy') }
};
function plantRun(r, v) {
  const plug = plugForm(r, v);
  const pre = v.table === 'incoming' ? (plug ? PREFILL.incPlug(r, S.L) : PREFILL.incFin(r, S.L)) : v.table === 'plugPlant' ? PREFILL.plugPlug(r, S.L) : PREFILL.finFin(r, S.L);
  openForm(plug ? 'plugPlanting' : 'finPlanting', pre, { sentKey: sentKey(v.table, r, 'p'), after: () => setFields(v.table, r, { 'Planted on App': true }) });
}
function labelRun(r, v) {
  const plug = plugForm(r, v);
  const pre = v.table === 'incoming' ? (plug ? PREFILL.incPlugLabels(r, S.L) : PREFILL.incFinLabels(r, S.L)) : v.table === 'plugPlant' ? PREFILL.plugPlugLabels(r, S.L) : PREFILL.finFinLabels(r, S.L);
  openForm(plug ? 'plugLabels' : 'finLabels', pre, { sentKey: sentKey(v.table, r, 'l') });
}
function reasonRun(r, v, title, col, list) {
  openSheet({ title, fields: [{ k: col, label: col, type: 'enum', req: true, list }], values: { [col]: r[col] || '' },
    onSave: vals => { setFields(v.table, r, { [col]: vals[col] }); } });
}

// ---------------- form sheet ----------------
function typeahead(f, val, getOpts, onPick) {
  const inp = h('input', { type: 'text', value: val || '', autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'done' });
  const box = h('div', { class: 'opts', hidden: true }), wrap = h('div', { class: 'ta' }, inp, box);
  const draw = () => {
    const q = norm(inp.value), all = getOpts();
    const m = (q ? all.filter(o => norm(o).includes(q)) : all).slice(0, 40);
    box.textContent = '';
    for (const o of m) box.append(h('div', { class: 'opt', onmousedown: e => { e.preventDefault(); inp.value = o; box.hidden = true; onPick(o); } }, o));
    box.hidden = !m.length || (m.length === 1 && m[0] === inp.value);
  };
  inp.addEventListener('focus', draw); inp.addEventListener('input', () => { draw(); onPick(inp.value, true); });
  inp.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 120));
  return { wrap, inp };
}
export function openSheet({ title, fields, values, onSave, form }) {
  const ov = $('#overlay'), vals = { ...values }, inputs = {}, flds = {};
  const close = () => { ov.hidden = true; ov.textContent = ''; document.body.style.overflow = ''; };
  const listFor = f => f.src ? plantOptions(f.src) : ((S.L.lists || {})[f.list] || []);
  const mk = f => {
    let ctl;
    if (f.ro) {
      const inp = h('input', { type: 'text', value: vals[f.k] ?? '', disabled: true }); inputs[f.k] = inp; ctl = inp;
      const fe0 = h('div', { class: 'fld ro' }, h('label', {}, f.label), ctl); flds[f.k] = fe0; return fe0;
    }
    if (f.type === 'enum' && listFor(f).length && listFor(f).length <= 80) {
      const sel = h('select', {}), cur = vals[f.k] ?? '';
      const opts = listFor(f).slice(); if (cur !== '' && !opts.includes(cur)) opts.unshift(cur);
      sel.append(h('option', { value: '' }, ''), ...opts.map(o => h('option', { value: o }, o)));
      sel.value = cur; sel.addEventListener('change', () => { vals[f.k] = sel.value; changed(f.k); vis(); });
      inputs[f.k] = sel; ctl = sel;
    } else if (f.type === 'plant' || (f.type === 'enum' && listFor(f).length)) {
      const t = typeahead(f, vals[f.k], () => listFor(f), (v, u) => { vals[f.k] = v; if (!u) changed(f.k); vis(); }); inputs[f.k] = t.inp; ctl = t.wrap;
    } else if (f.type === 'num') {
      const inp = h('input', { type: 'number', inputmode: 'numeric', value: vals[f.k] ?? '', min: '0' }); inp.addEventListener('input', () => { vals[f.k] = inp.value; vis(); });
      inputs[f.k] = inp; ctl = f.req ? h('div', { class: 'stepper' },
        h('button', { type: 'button', 'aria-label': 'Less', onclick: () => { inp.value = Math.max(0, Number(inp.value || 0) - 1); vals[f.k] = inp.value; vis(); } }, '−'), inp,
        h('button', { type: 'button', 'aria-label': 'More', onclick: () => { inp.value = Number(inp.value || 0) + 1; vals[f.k] = inp.value; vis(); } }, '+')) : inp;
    } else if (f.type === 'date') {
      const inp = h('input', { type: 'date', value: vals[f.k] || '' }); inp.addEventListener('input', () => { vals[f.k] = inp.value; changed(f.k); }); inputs[f.k] = inp; ctl = inp;
    } else if (f.type === 'long') {
      const inp = h('textarea', {}, vals[f.k] || ''); inp.addEventListener('input', () => { vals[f.k] = inp.value; }); inputs[f.k] = inp; ctl = inp;
    } else {
      const inp = h('input', { type: 'text', value: vals[f.k] || '', autocomplete: 'off', enterkeyhint: f.upc ? 'search' : 'done' }); inp.addEventListener('input', () => { vals[f.k] = inp.value; });
      if (f.upc) inp.addEventListener('change', () => upc(inp.value));
      inputs[f.k] = inp; ctl = inp;
    }
    const fe = h('div', { class: 'fld' }, h('label', {}, f.label, f.req ? h('span', { class: 'req', text: ' *' }) : null), ctl);
    flds[f.k] = fe; return fe;
  };
  const refill = (k, v) => { vals[k] = v; if (inputs[k]) inputs[k].value = v; };
  const hiddenNow = f => f.showIf ? !f.showIf(vals, S.L) : false;
  function vis() {
    for (const f of fields) {
      if (f.calc) { const c = f.calc(vals, S.L); refill(f.k, c); }
      if (f.showIf && flds[f.k]) flds[f.k].hidden = hiddenNow(f);
    }
  }
  function changed(k) {
    if (!form) return;
    const isItem = form.fields.find(f => f.k === 'Choose Plant')?.src === 'item';
    if (k === 'Choose Plant') {
      const d = S.L.dd.byDesc.get(norm(vals['Choose Plant']));
      if (isItem && d) { if (inputs['Item Code']) refill('Item Code', d.c || ''); if (inputs['Item #']) refill('Item #', d.i || ''); }
    }
    if ((k === 'Choose Plant' || k === 'Plant Date') && inputs['Ready Date'] && !form.userReady) {
      const rd = readyDate(S.L, vals['Choose Plant'], vals['Plant Date'], isItem); if (rd) refill('Ready Date', rd);
    }
  }
  function upc(code) {
    const c = norm(code); if (!c) return;
    const d = S.L.dd.list.find(x => x.b && norm(x.b) === c);
    if (d) { refill('Choose Plant', d.d); changed('Choose Plant'); } else flds['Escanear UPC / Scan UPC']?.classList.add('bad');
  }
  // AppSheet-style layout: key facts as compact text lines on top, the fields to fill in right below, the rest as small lines at the bottom
  const TOPK = new Set(['Choose Plant', 'FromContain', 'QCell', 'Plug Location', 'Size', 'tamaño / size', 'Casa / Greenhouse', 'Goal']);
  const BOTK = ['Vendor', 'ToContain', 'Plant Date', 'Ready Date', 'Qty Projected', 'Qty of flats', 'Forecast #', 'Assortment'];
  const roF = f => f.ro && !f.calc && !f.hide;
  const topF = fields.filter(f => roF(f) && TOPK.has(f.k)), botF = fields.filter(f => roF(f) && BOTK.includes(f.k));
  const init = { ...vals }, iv = k => { const x = init[k]; return x == null ? '' : String(x); };
  const dt = x => /^\d{4}-\d{2}-\d{2}$/.test(x) ? fmtDate(x) : x;
  const info = [];
  const isPlug = fields.some(f => f.k === 'tamaño / size');
  if (topF.some(f => f.k === 'Choose Plant') && iv('Choose Plant')) info.push(h('div', { class: 'ititle', text: iv('Choose Plant') + (isPlug && iv('tamaño / size') ? ' - ' + iv('tamaño / size') + ' Plug' : '') }));
  const has = k => topF.some(f => f.k === k);
  const from = [has('FromContain') && iv('FromContain') !== '' && t('From') + ': ' + iv('FromContain'), has('QCell') && iv('QCell') !== '' && 'QCell: ' + iv('QCell'), has('Plug Location') && iv('Plug Location') !== '' && t('Plug Location') + ': ' + iv('Plug Location')].filter(Boolean);
  if (from.length) info.push(h('div', { class: 'iline red', text: from.join('  |  ') }));
  const sz = has('tamaño / size') ? '' : has('Size') && iv('Size') !== '' ? t('Finished size') + ': ' + iv('Size') : '';
  const l2 = [sz, has('Casa / Greenhouse') && iv('Casa / Greenhouse') !== '' && t('Location') + ': ' + iv('Casa / Greenhouse')].filter(Boolean);
  if (l2.length) info.push(h('div', { class: 'iline', text: l2.join('  |  ') }));
  if (isPlug && iv('Plug Type')) info.push(h('div', { class: 'iline', text: iv('Plug Type') }));
  const flats = Number(iv('Qty of flats')), plugsN = Math.round(flats * Number(iv('tamaño / size')));
  const showFlats = isPlug && flats > 0 && plugsN > 0;
  if (has('Goal') && iv('Goal') !== '') info.push(h('div', { class: 'iline', text: t('Goal') + ': ' + iv('Goal') + (showFlats ? '   |  plantar ' + flats + ' flats (' + fmtNum(plugsN) + ' plugs)' : '') }));
  const bot = botF.filter(f => iv(f.k) !== '' && !(showFlats && f.k === 'Qty of flats')).map(f => h('div', { class: 'iline sm', text: (f.k === 'Assortment' ? t('Asst') : t(f.label)) + ': ' + dt(iv(f.k)) }));
  const main = fields.filter(f => !f.hide && !topF.includes(f) && !botF.includes(f)), more = [];
  const body = h('div', { class: 'body' }, info.length ? h('div', { class: 'info' }, info) : null, h('div', { class: 'grp' }, main.map(mk)), bot.length ? h('div', { class: 'info bot' }, bot) : null);
  if (more.length) body.append(h('details', { class: 'grp' }, h('summary', { text: 'More fields' }), more.map(mk)));
  const err = h('p', { class: 'err', style: 'padding:0 14px', role: 'alert' });
  const save = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    for (const f of fields) if (f.type === 'date' && inputs[f.k]) vals[f.k] = inputs[f.k].value;
    const bad = fields.filter(f => f.req && !f.ro && !hiddenNow(f) && !String(vals[f.k] ?? '').trim());
    Object.entries(flds).forEach(([k, e]) => e.classList.toggle('bad', bad.some(f => f.k === k)));
    if (bad.length) { err.textContent = t('Please fill: ') + bad.map(f => t(f.label)).join(', '); return; }
    const out = {}; for (const f of fields) { if (hiddenNow(f)) continue; const v = vals[f.k]; if (v !== '' && v != null) out[f.k] = typeof v === 'string' ? v.trim() : v; }
    close(); onSave(out);
  } }, 'Save');
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
    h('header', {}, h('h2', { text: title }), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: close }, '✕')),
    body, err, h('footer', {}, h('button', { class: 'btn', type: 'button', onclick: close }, 'Cancel'), save));
  vis();
  ov.textContent = ''; ov.append(sheet); ov.hidden = false; document.body.style.overflow = 'hidden';
  ov.onclick = e => { if (e.target === ov) close(); };
  if (form) { const rdi = inputs['Ready Date']; if (rdi) rdi.addEventListener('input', () => { form.userReady = true; }); }
  return close;
}
function backToList() {
  if (view().kind === 'addition') return;
  U.sel = null; $('#app').classList.remove('phone-detail'); renderList(); renderDetail();
}
const RK = 'ctg_recent_fc';
function recentPut(vals) { try { const fc = vals['Forecast #']; if (!fc) return; const m = JSON.parse(localStorage.getItem(RK) || '{}'); m[fc] = vals; const ks = Object.keys(m); if (ks.length > 60) delete m[ks[0]]; localStorage.setItem(RK, JSON.stringify(m)); } catch (e) { /* ignore */ } }
function recentGet(fc) { try { return fc ? JSON.parse(localStorage.getItem(RK) || '{}')[fc] : null; } catch (e) { return null; } }
function openForm(id, prefill, opts = {}) {
  const def = FORMS[id], base = { ...FORM_DEFAULTS(), ...prefill };
  if (def.fields.some(f => f.k === 'Forecast #') && !base['Forecast #']) base['Forecast #'] = nowStamp();
  if (def.fields.some(f => f.k === 'Employee') && !base.Employee && S.user) base.Employee = S.user.name; // logged-in name pre-entered
  if (def.fields.some(f => f.k === 'Size') && !base.Size && base['Choose Plant'] && S.L.ddSize[norm(base['Choose Plant'])]) base.Size = S.L.ddSize[norm(base['Choose Plant'])];
  if (def.fields.some(f => f.k === 'Ready Date') && !base['Ready Date'] && base['Choose Plant']) { const rd = readyDate(S.L, base['Choose Plant'], base['Plant Date'], def.target === 'gfFin'); if (rd) base['Ready Date'] = rd; }
  if (def.target === 'gfPlugLabels' || def.target === 'gfFinLabels') Object.assign(base, recentGet(base['Forecast #']) || {}, { 'Choose Plant': base['Choose Plant'] });
  const form = { fields: def.fields, userReady: !!prefill['Ready Date'] };
  openSheet({ title: def.title, fields: def.fields, values: base, form, onSave: vals => { recentPut(vals); addRecord(def.target, vals, opts.sentKey); if (opts.after) opts.after(); backToList(); } });
}

// ---------------- chrome ----------------
const PILL = { saved: 'Saved', saving: 'Saving…', offline: 'Offline – will send later', err: 'Problem – tap to retry' };
function renderPill() {
  const p = $('#pill'); p.className = 'pill ' + (S.status === 'saved' ? '' : S.status);
  $('#pillText').textContent = t(PILL[S.status]) + (S.status === 'offline' && S.queue.length ? ' (' + S.queue.length + ')' : '');
  p.title = S.lastErr || '';
}
export function openMenu() {
  const m = $('#menu'); m.textContent = '';
  m.append(h('div', { class: 'info', text: tSignedIn(S.user ? S.user.name : '') }));
  if (S.user && S.user.email) m.append(h('div', { class: 'info', text: tGoogle(S.user.email) }));
  else if (((S.L.lists || {}).tabletEmail || []).length) m.append(h('button', { type: 'button', onclick: () => { m.hidden = true; askTablet(true); } }, tTablet(S.tablet)));
  if (S.lastErr) m.append(h('div', { class: 'errl', text: S.lastErr }));
  m.append(h('button', { type: 'button', onclick: () => { m.hidden = true; applyLang(getLang() === 'es' ? 'en' : 'es'); } }, t('Language') + ': ' + (getLang() === 'es' ? 'Español → English' : 'English → Español')),
    h('button', { type: 'button', onclick: () => { m.hidden = true; refreshNow(); } }, 'Refresh now'),
    h('button', { type: 'button', onclick: () => { m.hidden = true; logout(); } }, 'Switch user'));
  m.hidden = false;
  setTimeout(() => document.addEventListener('click', function f(e) { if (!m.contains(e.target)) { m.hidden = true; } document.removeEventListener('click', f); }, { once: true }), 0);
}
function renderWho() {
  const w = $('#whoami'); if (!w) return; const mail = S.user && (S.user.email || S.tablet) || '';
  w.textContent = ''; w.hidden = !S.user;
  if (S.user) w.append(h('b', { text: S.user.name }), mail ? h('span', { text: mail }) : h('span', { class: 'warn', text: t('no Google account set') }));
}
let rafR = 0;
function renderAll() { renderWho(); computeCounts(); renderTabs(); renderChips(); renderList(); renderDetail(); renderPill(); const u = S.user && S.user.name; $('#userInit').textContent = u ? u[0].toUpperCase() : '?'; }
export function mount() {
  $('#search').addEventListener('input', e => { U.q = e.target.value; U.limit = 60; $('#clearSearch').hidden = !U.q; renderList(); });
  $('#clearSearch').addEventListener('click', () => { U.q = ''; $('#search').value = ''; $('#clearSearch').hidden = true; renderList(); });
  $('#syncBtn').addEventListener('click', () => { $('#syncBtn').classList.add('spin'); refreshNow().finally(() => $('#syncBtn').classList.remove('spin')); });
  $('#pill').addEventListener('click', () => refreshNow());
  $('#userBtn').addEventListener('click', e => { e.stopPropagation(); openMenu(); });
  addEventListener('resize', () => { if (wide()) $('#app').classList.remove('phone-detail'); });
  subscribe(what => {
    if (what === 'status') return renderPill();
    cancelAnimationFrame(rafR); rafR = requestAnimationFrame(() => {
      renderWho(); const top = $('#list').scrollTop; computeCounts(); renderTabs(); renderChips();
      const n = Math.max(U.limit, 60); U.limit = n; renderList(); $('#list').scrollTop = top; renderDetail(); renderPill();
    });
  });
  renderAll();
  setTimeout(checkLunch, 1500); // right after signing in / opening the app
  setInterval(checkLunch, 30000); document.addEventListener('visibilitychange', () => { if (!document.hidden) checkLunch(); }); window.__lunchCheck = checkLunch;
}
export const refreshUI = () => renderAll();
// static texts in index.html carry data-t (text) / data-tp (placeholder) / data-ta (aria-label) with the English original
export function translateStatic() {
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach(e => { e.setAttribute('placeholder', t(e.dataset.tp)); });
  document.querySelectorAll('[data-ta]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.ta)); });
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
}
export function applyLang(l) {
  setLang(l); translateStatic();
  if (S.user && !$('#app').hidden) { renderAll(); document.querySelector('#lunchAlert')?.remove(); if (window.__lunchCheck) window.__lunchCheck(); }
}
