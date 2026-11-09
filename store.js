// State, lookups, derived fields, optimistic updates, persisted op queue, polling.
import { CONFIG } from './config.js';
import * as api from './api.js';
import { norm, uid, todayISO, isoWeek } from './format.js';

const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } } };

export const S = {
  user: LS.get('ctg_user', null), tablet: LS.get('ctg_tablet', ''), tables: {}, L: emptyL(), seq: 0, queue: LS.get('ctg_q', []), status: 'saved', loaded: false,
  prefs: LS.get('ctg_prefs', { chips: {}, urc: [] }), sent: LS.get('ctg_sent', {}), lastErr: ''
};
function emptyL() { return { dd: { byDesc: new Map(), byPlant: new Map(), list: [] }, grow: new Map(), growFin: new Map(), ddSize: {}, ddPlant: {}, stock: {}, inv: new Map(), lists: {} }; }

const subs = new Set();
export const subscribe = f => (subs.add(f), () => subs.delete(f));
const emit = what => subs.forEach(f => { try { f(what); } catch (e) { console.error(e); } });
const setStatus = (s, err) => { if (S.status !== s || err) { S.status = s; S.lastErr = err || ''; emit('status'); } };
const saveQ = () => LS.set('ctg_q', S.queue);

// ---------- derived ----------
function derive(table, r) {
  const L = S.L;
  if (table === 'incoming') {
    const loc = String(r.Location || '');
    r.Loc = /^cont/i.test(loc) ? 'Cont' : loc.split('-')[0];
    const d = L.dd.byPlant.get(norm(r['Plant #']));
    r['URC Priority'] = d && d.u ? Number(d.u) || d.u : '';
    r._prio = Number(r['URC Priority']) || 999;
    r._video = d && d.v ? String(d.v).replace(/\/view(\?.*)?$/, '/preview') : '';
  }
  if (table === 'flagPlug') r['Qty not incoming'] = Number(r.Goal || 0) - Number(r['Inputs on Order'] || 0);
  if (table === 'finPlant') {
    r.HB = /hb/i.test(r.Variety || '') ? 'HB' : '';
    const q = L.inv.get(norm(r['Item Code']));
    r._labelQty = q == null ? 0 : q;
    r['Labels inventory qty'] = r._labelQty;
  }
  if (table === 'plugPlant') {
    const d = L.dd.byPlant.get(norm(r['Plant #']));
    r._video = d && d.v ? String(d.v).replace(/\/view(\?.*)?$/, '/preview') : '';
  }
  return r;
}
function buildLookups(raw) {
  const L = emptyL(); raw = raw || {};
  for (const d of raw.dd || []) {
    L.dd.list.push(d);
    if (d.d) L.dd.byDesc.set(norm(d.d), d);
    if (d.p && !L.dd.byPlant.has(norm(d.p))) L.dd.byPlant.set(norm(d.p), d);
  }
  for (const g of raw.grow || []) L.grow.set(norm(g.p), { winter: Number(g.w) || 0, summer: Number(g.s) || 0 });
  for (const g of raw.growFin || []) L.growFin.set(norm(g.p), { winter: Number(g.w) || 0, summer: Number(g.s) || 0 });
  L.ddSize = raw.ddSize || {}; L.ddPlant = raw.ddPlant || {}; L.stock = raw.stock || {};
  for (const i of raw.inv || []) L.inv.set(norm(i.code), Number(i.qty) || 0);
  L.lists = raw.lists || {};
  return L;
}
export const plantOptions = src => {
  const seen = new Set(), out = [];
  for (const d of S.L.dd.list) {
    const isItem = / - [^-]+$/.test(d.d || '');
    if ((src === 'item') !== isItem || !d.d || seen.has(d.d)) continue;
    seen.add(d.d); out.push(d.d);
  }
  return out.sort();
};

// ---------- loading ----------
function ingest(res) {
  S.L = buildLookups(res.lookups);
  const t = {};
  for (const [id, rows] of Object.entries(res.tables || {})) t[id] = rows.map(r => derive(id, r));
  S.tables = t; S.seq = res.seq || 0; S.loaded = true;
  overlayQueue();
}
// re-apply not-yet-saved local edits on top of fresh server data
function overlayQueue() {
  for (const op of S.queue) if (op.type === 'set' || op.type === 'flag') applyLocal(op, true);
}
function applyLocal(op, quiet) {
  const rows = S.tables[op.table]; const r = rows && rows.find(x => x._k === op.key);
  if (!r) return;
  if (op.type === 'set') Object.assign(r, op.patch);
  if (op.type === 'flag') { r.Flagged = true; r['Flagged on App'] = true; }
  derive(op.table, r);
}
export async function loadAll() {
  const res = await api.call('load', {}, S.user && S.user.token);
  if (res.error) throw new Error(res.error);
  ingest(res); emit('data');
}

// ---------- auth ----------
export async function login(name) {
  const res = await api.call('login', { name });
  if (res.error) throw new Error(res.error);
  S.user = { name: res.name, token: res.token }; LS.set('ctg_user', S.user);
  return S.user;
}
export const setTablet = e => { S.tablet = e; LS.set('ctg_tablet', e); emit('data'); };
export function logout() { S.user = null; LS.set('ctg_user', null); S.tables = {}; S.loaded = false; stop(); emit('auth'); }

// ---------- edits ----------
function enqueue(op) {
  op.id = uid(); op.t = Date.now();
  if (op.type === 'set') { // coalesce per row
    const prev = S.queue.find(o => o.type === 'set' && o.table === op.table && o.key === op.key && !o.sending);
    if (prev) { Object.assign(prev.patch, op.patch); saveQ(); applyLocal(op); emit('data'); kick(); return; }
  }
  S.queue.push(op); saveQ(); applyLocal(op); emit('data'); setStatus('saving'); kick();
}
export const setFields = (table, row, patch) => enqueue({ type: 'set', table, key: row._k, patch, ident: ident(table, row) });
export const flagRow = (table, row) => enqueue({ type: 'flag', table, key: row._k, ident: ident(table, row) });
export function addRecord(target, values, sentKey) {
  enqueue({ type: 'add', target, values, by: S.user && S.user.name, email: S.tablet || '' });
  if (sentKey) { S.sent[sentKey] = Date.now(); LS.set('ctg_sent', S.sent); emit('data'); }
}
const ident = (table, r) => table === 'incoming' ? { ID: r.ID } : { Genus: r.Genus, Variety: r.Variety, Size: r.Size, 'Forecast #': r['Forecast #'] };
export const setPref = (k, v) => { S.prefs[k] = v; LS.set('ctg_prefs', S.prefs); emit('data'); };
export const chipOn = (g, n) => !!(S.prefs.chips[g] && S.prefs.chips[g][n]);
export function toggleChip(g, n) { const c = S.prefs.chips[g] = S.prefs.chips[g] || {}; c[n] = !c[n]; setPref('chips', S.prefs.chips); }

// ---------- queue flush ----------
let flushing = false, backoff = 0, timer = null, pollT = null, fullT = null;
export function kick() { if (flushing) return; clearTimeout(timer); timer = setTimeout(flush, backoff); }
async function flush() {
  if (flushing || !S.queue.length || !S.user) { if (!S.queue.length) setStatus(navigator.onLine === false ? 'offline' : 'saved'); return; }
  flushing = true; setStatus('saving');
  const batch = S.queue.slice(0, 20); batch.forEach(o => o.sending = true);
  try {
    const res = await api.call('save', { ops: batch.map(({ sending, t, ...o }) => o) }, S.user.token);
    if (res.error) throw new Error(res.error);
    const bad = [];
    for (const r of res.results || []) if (!r.ok) bad.push(r);
    const done = new Set(batch.map(o => o.id));
    S.queue = S.queue.filter(o => !done.has(o.id)); saveQ(); backoff = 0;
    if (bad.length) { setStatus('err', bad[0].err || 'Some changes were not saved'); await loadAll().catch(() => {}); }
    else setStatus('saved');
  } catch (e) {
    batch.forEach(o => delete o.sending);
    if (e.auth) { logout(); flushing = false; return; }
    backoff = Math.min(backoff ? backoff * 2 : 2000, 60000); setStatus(e.net ? 'offline' : 'err', e.message);
  }
  flushing = false;
  if (S.queue.length) kick(); else if (S.status === 'saving') setStatus('saved');
}

// ---------- polling ----------
async function poll() {
  if (document.hidden || flushing || S.queue.length) return;
  try {
    const r = await api.call('ping', {}, S.user.token);
    if (r.seq != null && r.seq !== S.seq) await loadAll();
    if (S.status === 'offline') setStatus('saved');
  } catch (e) { if (e.auth) logout(); else setStatus('offline'); }
}
export function start() {
  stop();
  pollT = setInterval(poll, CONFIG.POLL_SECONDS * 1000);
  fullT = setInterval(() => { if (!document.hidden && !S.queue.length) loadAll().catch(() => {}); }, CONFIG.FULL_RELOAD_SECONDS * 1000);
  document.addEventListener('visibilitychange', onVis); addEventListener('online', onOnline); addEventListener('offline', () => setStatus('offline'));
  kick();
}
const onVis = () => { if (!document.hidden && S.user) { poll(); kick(); } };
const onOnline = () => { backoff = 0; kick(); poll(); };
export function stop() { clearInterval(pollT); clearInterval(fullT); }
export const refreshNow = async () => { try { await flush(); await loadAll(); setStatus('saved'); } catch (e) { setStatus(e.net ? 'offline' : 'err', e.message); } };

export const context = () => {
  const today = todayISO();
  const conf = new Set((S.tables.vendors || []).filter(v => v.VendorConfirmed).map(v => norm(v['Vendor Name'])));
  return { today, week: isoWeek(today), confirmed: conf, on: chipOn, urcVendors: S.prefs.urc || [] };
};
