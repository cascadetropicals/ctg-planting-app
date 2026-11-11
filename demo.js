// Demo backend: same request/response contract as the Apps Script, kept in localStorage.
import { addDays, isoWeek, todayISO, nowISO, uid } from './format.js';
const KEY = 'ctg_demo_db_v1';
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const pick = a => a[Math.floor(rnd() * a.length)];

const GEN = ['Petunia', 'Calibrachoa', 'Geranium', 'Begonia', 'Lantana', 'Verbena', 'Fuchsia', 'Impatiens', 'Salvia', 'Coleus', 'Dahlia', 'Primera'];
const VAR = ['Red', 'Purple Wave', 'Sunset', 'White HB', 'Pink Blush', 'Cherry', 'Lemon', 'Plantation', 'Blue Ice', 'Coral'];
const VENDORS = ['Ball', 'Dummen', 'Syngenta', 'Selecta', 'Proven', 'Florensis'];
const LOCS = ['H1-A', 'H2-1', 'H2-2', 'H3-1', 'H4', 'Cont 1', 'Cont 2', 'piso', 'H3-3'];
const ITEMS = [];
GEN.forEach((g, gi) => VAR.slice(0, 6).forEach((v, vi) => ITEMS.push({ g, v, p: 'P' + (100 + gi * 10 + vi) })));

function make() {
  const t = todayISO(), wk = isoWeek(t), db = { seq: 1, tables: {}, log: [], users: {} };
  const ts = () => nowISO();
  const inc = [], fp = [], ff = [], pp = [], fn = [];
  for (let i = 0; i < 70; i++) {
    const it = pick(ITEMS), size = pick(['50', '72', '105', '4in', '6in', '8in', '2in']);
    const wkx = pick([wk, wk, wk, wk - 1]);
    inc.push({ ID: 'INC' + (1000 + i), Size: size, Genus: it.g, Variety: it.v, 'Plant #': it.p, Goal: Math.round(rnd() * 40 + 5) * 50, QCell: pick([6, 8, 10, 12]), 'Qty of flats': Math.round(rnd() * 30 + 2),
      'From Contain': pick(['URC', 'TC', 'Cutting']), Vendor: pick(VENDORS), ToContain: pick(['4in', '6in', '72', '105']), 'Incoming Week': wkx, 'Plant Date': addDays(t, Math.round(rnd() * 10 - 3)),
      'Reason why not planted': rnd() < 0.08 ? 'Late shipment' : '', 'Plant Week': wkx + 1, 'Ready Week': wkx + 8, 'Forecast #': rnd() < 0.2 ? 'no Prod Plan match' : '2026' + String(1000 + i),
      Timestamp: ts(), 'Planted on App': rnd() < 0.2, Location: pick(LOCS), 'Qty Projected': 500, 'Ready Date': addDays(t, 60), 'Plug Type': 'Standard' });
  }
  for (let i = 0; i < 50; i++) {
    const it = pick(ITEMS), goal = Math.round(rnd() * 40 + 5) * 50;
    fp.push({ Size: pick(['50', '72', '105']), Genus: it.g, Variety: it.v, QCell: 8, Assortment: rnd() < 0.2 ? 'Mix A' : '', Goal: goal, 'Plant Date': addDays(t, Math.round(rnd() * 20 - 5)),
      'From Contain': pick(['Cutting', 'URC', 'Seed']), ToContain: pick(['72', '105']), 'Plant Week': wk, 'Ready Week': wk + 6, Vendor: pick(VENDORS), 'Forecast #': '2026' + (2000 + i), Timestamp: ts(),
      Flagged: rnd() < 0.15, 'Flagged on App': false, Transferred: rnd() < 0.1, 'Inputs on Order': Math.round(goal * (0.4 + rnd() * 0.7)), Location: pick(LOCS), 'Qty of flats': 20, 'Plug Type': 'Std', 'Reason why not checked': '' });
  }
  for (let i = 0; i < 40; i++) {
    const it = pick(ITEMS);
    ff.push({ Size: pick(['4in', '6in', '8in', '2in']), Genus: it.g, Variety: it.v, 'Plug Location': pick(LOCS), QCell: 6, Goal: Math.round(rnd() * 20 + 3) * 10, 'Plant Date': addDays(t, Math.round(rnd() * 20 - 5)),
      'From Contain': pick(['Cutting', 'URC']), 'Plant Week': wk, 'Ready Week': wk + 7, 'Forecast #': '2026' + (3000 + i), Timestamp: ts(), Flagged: rnd() < 0.15, 'Flagged on App': false, Transferred: rnd() < 0.1, 'Reason why not checked': '' });
  }
  for (let i = 0; i < 60; i++) {
    const it = pick(ITEMS);
    pp.push({ 'Plant #': it.p, Size: pick(['50', '72', '105']), Genus: it.g, Variety: it.v, Location: pick(LOCS), QCell: 8, Assortment: '', 'Plant Date': addDays(t, Math.round(rnd() * 50 - 40)), 'From Contain': pick(['Cutting', 'URC']),
      ToContain: '72', 'Reason why not flagged': rnd() < 0.05 ? 'No space' : '', 'Plant Week': wk, 'Ready Week': wk + 6, Vendor: pick(VENDORS), 'Forecast #': '2026' + (4000 + i), Timestamp: ts(), 'Planted on App': rnd() < 0.3 });
  }
  for (let i = 0; i < 110; i++) {
    const it = pick(ITEMS), size = pick(['4in', '6in', '8in', '10in', '2in']), d = addDays(t, Math.round(rnd() * 50 - 40));
    fn.push({ Size: size, Genus: it.g, Variety: it.v, Goal: Math.round(rnd() * 20 + 3) * 10, QCell: 6, Assortment: rnd() < 0.2 ? 'Mix' : '', Location: pick(LOCS), 'Plug Location': pick(LOCS), 'Plant Week': wk, 'Plant Date': d,
      'From Contain': pick(['Cutting', 'URC']), 'Reason why not flagged': rnd() < 0.05 ? 'Missing plugs' : '', 'Ready Week': wk + 7, 'Forecast #': '2026' + (5000 + i), Timestamp: ts(), 'Planted on App': rnd() < 0.5,
      'Actual Plant Date': d, 'Location planted': pick(LOCS), 'Qty planted': Math.round(rnd() * 20 + 3) * 10, 'Label added': rnd() < 0.3, 'Label added by': '', 'Item Code': 'IC' + (i % 12), 'Item #': 'N' + i });
  }
  const mk = (rows, name) => rows.map((r, i) => ({ ...r, _k: name === 'incoming' ? r.ID : String(i + 6), _row: i + 6 }));
  db.tables = { incoming: mk(inc, 'incoming'), flagPlug: mk(fp), flagFin: mk(ff), plugPlant: mk(pp), finPlant: mk(fn),
    vendors: VENDORS.map((v, i) => ({ 'Vendor Name': v, VendorConfirmed: i < 4, _k: v, _row: i + 2 })) };
  return db;
}
let db = null;
const load = () => { if (db) return db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; } if (!db) { db = make(); persist(); } return db; };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } };

const lookups = () => ({
  weeks: { 'Incoming URC/TC': 'wk 46', 'Planting Incoming URC/TC': 'wk 45 / 46', 'Planting Plugs': 'wk 47 / 48', 'Planting Finished 2': 'wk 47 / 48' },
  dd: ITEMS.flatMap(i => [{ d: i.g + ' ' + i.v, p: i.p, u: 1 + (i.p.length % 3), v: '', c: '', i: '' }]).concat(
    ITEMS.flatMap(i => ['4in', '6in', '8in'].map((s, n) => ({ d: i.g + ' ' + i.v + ' - ' + s, p: i.p, c: 'IC' + n, i: 'N' + i.p, b: '0' + i.p + n, u: '', v: '' })))),
  grow: ITEMS.map(i => ({ p: i.g + ' ' + i.v, w: 8, s: 6 })),
  inv: Array.from({ length: 12 }, (_, n) => ({ code: 'IC' + n, qty: n % 3 })),
  lists: { greenhouse: LOCS, size: ['50', '72', '105', '2in', '4in', '6in', '8in', '10in'], fromContain: ['Cutting', 'URC', 'TC', 'Seed'], toContain: ['72', '105', '4in', '6in'],
    vendor: VENDORS, employee: ['Maria', 'Jose', 'Ana', 'Luis'], plugLocation: LOCS, reasonIncoming: ['Late shipment', 'Not received', 'Quality issue'],
    reasonPlug: ['No space', 'Missing plugs'], reasonFin: ['Missing plugs', 'No space'], labelBy: ['Maria', 'Jose', 'Ana', 'Luis'] }
});
const delay = ms => new Promise(r => setTimeout(r, ms));

export async function handle(action, body, token) {
  await delay(60);
  const d = load();
  if (action === 'login') { const n = String(body.name || '').trim(); if (!n) return { error: 'Please enter your name.' }; return { token: 'demo-' + n, name: n }; }
  if (action === 'ping') return { seq: d.seq };
  if (action === 'load') return { seq: d.seq, tables: d.tables, lookups: lookups() };
  if (action === 'save') {
    const results = [];
    for (const op of body.ops || []) {
      try { apply(d, op, token.replace('demo-', '')); results.push({ id: op.id, ok: true }); } catch (e) { results.push({ id: op.id, ok: false, err: String(e.message || e) }); }
    }
    d.seq++; persist();
    return { results, seq: d.seq };
  }
  return { error: 'unknown action' };
}
function apply(d, op, user) {
  if (op.type === 'add') { d.log.push({ t: nowISO(), user, target: op.target, values: op.values }); if (d.log.length > 200) d.log.shift(); return; }
  const rows = d.tables[op.table]; const r = rows && rows.find(x => x._k === op.key);
  if (!r) throw new Error('row not found');
  if (op.type === 'set') { Object.assign(r, op.patch); return; }
  if (op.type === 'flag') {
    if (r.Flagged || r['Flagged on App'] || r.Transferred) return;
    r.Flagged = true; r['Flagged on App'] = true;
    const target = op.table === 'flagPlug' ? 'plugPlant' : 'finPlant';
    const copy = { ...r, 'Planted on App': false, Timestamp: nowISO() };
    delete copy.Flagged; delete copy['Flagged on App']; delete copy.Transferred;
    const n = d.tables[target].length + 6; copy._k = uid(); copy._row = n; d.tables[target].push(copy);
    return;
  }
  throw new Error('bad op');
}
