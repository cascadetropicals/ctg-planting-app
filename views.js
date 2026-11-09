import { addDays, isoWeek, norm } from './format.js';

export const PLUG_SIZES = ['50', '72', '105'];
export const isPlugSize = s => PLUG_SIZES.includes(String(s).trim());
const has = v => v !== '' && v != null && v !== false;
const blank = v => !has(v);
const lc = v => norm(v);
const cmpStr = (a, b) => lc(a).localeCompare(lc(b));
const cmpBool = (a, b) => (a ? 1 : 0) - (b ? 1 : 0);

// Chips (device-local toggles) copied from the AppSheet filter tables.
export const CHIPS = {
  finished: ['4in', '6in', '8in/10in', 'HB 4in', 'HB 6in', 'cortes'],
  twoIn: ['assorted', 'cortes'],
  labels: ['print label', 'label con foto', '2in', '4in', 'H1', 'H2-1', 'H2-2', 'H2-3', 'H3-1', 'H3-2', 'H3-3', 'H4', 'Cont 1', 'Cont 2', 'piso']
};

// C = context {today, week, confirmed:Set(vendor), on(group,name)->bool, urcVendors:[...] }
const ok15 = (r, C) => r['Plant Date'] >= addDays(C.today, -15);
const audit = (r, C) => r['Plant Date'] < addDays(C.today, -15) && r['Plant Date'] >= addDays(C.today, -45);

const SLICES = {
  planIncoming: (r, C) => r['Incoming Week'] === C.week && blank(r['Reason why not planted']) && C.confirmed.has(lc(r.Vendor)),
  incAudit: (r, C) => r['Incoming Week'] === C.week - 1 && !r['Planted on App'] && blank(r['Reason why not planted']),
  urcPrio: (r, C) => r['Incoming Week'] === C.week && blank(r['Reason why not planted']) && C.urcVendors.map(lc).includes(lc(r.Vendor)),
  flagPlugs: r => r['From Contain'] === 'Cutting' && Number(r['Inputs on Order']) <= Number(r.Goal),
  flagUrc: r => r['From Contain'] === 'URC' && Number(r['Inputs on Order']) < 0.85 * Number(r.Goal),
  planPlugs: (r, C) => ok15(r, C) && blank(r['Reason why not flagged']),
  plugsAudit: (r, C) => audit(r, C) && blank(r['Reason why not flagged']),
  planFinished: (r, C) => r.Size !== '2in' && ok15(r, C) && blank(r['Reason why not flagged'])
    && (!C.on('finished', '4in') || r.Size === '4in')
    && (!C.on('finished', '6in') || r.Size === '6in')
    && (!C.on('finished', '8in/10in') || r.Size === '8in' || r.Size === '10in')
    && (!C.on('finished', 'HB 4in') || (/hb/i.test(r.Variety) && r.Size === '4in'))
    && (!C.on('finished', 'HB 6in') || (/hb/i.test(r.Variety) && r.Size === '6in'))
    && (!C.on('finished', 'cortes') || r['From Contain'] === 'Cutting'),
  plant2in: (r, C) => ok15(r, C) && blank(r['Reason why not flagged']) && r.Size === '2in'
    && (!C.on('twoIn', 'assorted') || has(r.Assortment))
    && (!C.on('twoIn', 'cortes') || r['From Contain'] === 'Cutting'),
  finAudit: (r, C) => audit(r, C) && blank(r['Reason why not flagged']),
  labels: (r, C) => {
    if (!r['Planted on App'] || !(r['Actual Plant Date'] >= addDays(C.today, -28))) return false;
    const q = r._labelQty, L = r.Location || '';
    const on = n => C.on('labels', n);
    if (on('print label') && !(q < 1)) return false;
    if (on('label con foto') && !(q > 0)) return false;
    if (on('2in') && r.Size !== '2in') return false;
    if (on('4in') && r.Size !== '4in') return false;
    for (const loc of ['H1', 'H2-1', 'H2-2', 'H2-3', 'H3-1', 'H3-2', 'H3-3', 'H4', 'Cont 1', 'Cont 2', 'piso']) {
      if (on(loc) && !lc(L).includes(lc(loc))) return false;
    }
    if (r.Genus === 'Primera' && r.Variety === 'Plantation') return false;
    if (/hb/i.test(r.Variety || '')) return false;
    return true;
  }
};

// sort comparators (AppSheet "Sort by")
const byPlantedGenus = (a, b) => cmpBool(a['Planted on App'], b['Planted on App']) || cmpStr(a.Genus, b.Genus);
const byTransGenus = (a, b) => cmpBool(a.Transferred, b.Transferred) || cmpStr(a.Genus, b.Genus);
const byPrio = (a, b) => (a._prio - b._prio) || byPlantedGenus(a, b);
const byLabels = (a, b) => cmpBool(a['Label added'], b['Label added']) || cmpStr(a['Location planted'], b['Location planted'])
  || String(a['Actual Plant Date']).localeCompare(String(b['Actual Plant Date'])) || cmpStr(a.Genus, b.Genus);

const REASON = { incoming: 'Reason why not planted', flagPlug: 'Reason why not checked', flagFin: 'Reason why not checked', plugPlant: 'Reason why not flagged', finPlant: 'Reason why not flagged' };
export const reasonKey = t => REASON[t];

// Views in AppSheet order: 10 primary tabs, then 4 menu tabs.
const ALL_VIEWS = [
  { id: 'incVendors', name: 'Incoming URC/TC', kind: 'vendors' },
  { id: 'urcPrio', name: 'URC Priority', kind: 'urc', table: 'incoming', slice: SLICES.urcPrio, sort: byPrio,
    cols: ['URC Priority', 'Genus', 'Variety', 'Loc', 'Goal', 'Vendor'], sub: ['Vendor', 'Goal', 'Loc'], vendorPicker: true },
  { id: 'planIncoming', name: 'Planting Incoming URC/TC', table: 'incoming', slice: SLICES.planIncoming, sort: byPlantedGenus,
    cols: ['Size', 'Genus', 'Variety', 'Goal', 'QCell', 'Qty of flats', 'From Contain', 'Vendor', 'ToContain', 'Incoming Week', 'Plant Date', 'Reason why not planted', 'Plant Week', 'Ready Week', 'Forecast #', 'Timestamp'],
    sub: ['Vendor', 'Goal', 'From Contain', 'Plant Date'], actions: ['plantInc', 'labelInc', 'reasonInc', 'setPlanted', 'resetPlanted'], video: true },
  { id: 'incAudit', name: 'Incoming Audit', table: 'incoming', slice: SLICES.incAudit, sort: byPlantedGenus,
    cols: ['Size', 'Genus', 'Variety', 'Goal', 'QCell', 'Qty of flats', 'From Contain', 'Vendor', 'ToContain', 'Incoming Week', 'Plant Date', 'Reason why not planted', 'Plant Week', 'Ready Week', 'Forecast #', 'Timestamp'],
    sub: ['Vendor', 'Goal', 'From Contain', 'Plant Date'], actions: ['plantInc', 'reasonInc'] },
  { id: 'flagPlugs', name: 'Flagging Plugs', table: 'flagPlug', slice: SLICES.flagPlugs, sort: byTransGenus,
    cols: ['Size', 'Genus', 'Variety', 'QCell', 'Assortment', 'Goal', 'Plant Date', 'From Contain', 'ToContain', 'Plant Week', 'Ready Week', 'Vendor', 'Forecast #', 'Timestamp'],
    sub: ['Goal', 'Plant Date', 'Vendor'], actions: ['flagPlug'] },
  { id: 'planPlugs', name: 'Planting Plugs', table: 'plugPlant', slice: SLICES.planPlugs, sort: byPlantedGenus,
    cols: ['Size', 'Genus', 'Variety', 'Location', 'QCell', 'Assortment', 'Plant Date', 'From Contain', 'ToContain', 'Reason why not flagged', 'Plant Week', 'Ready Week', 'Vendor', 'Forecast #', 'Timestamp'],
    sub: ['Location', 'Plant Date', 'Vendor'], actions: ['plantPlug', 'labelPlug', 'reasonPlug', 'setPlanted', 'resetPlanted'], video: true },
  { id: 'flagFinished', name: 'Flagging Finished', table: 'flagFin', slice: () => true, sort: byTransGenus,
    cols: ['Size', 'Genus', 'Variety', 'Plug Location', 'QCell', 'Goal', 'Plant Date', 'From Contain', 'Plant Week', 'Ready Week', 'Forecast #', 'Timestamp', 'Reason why not checked'],
    sub: ['Plug Location', 'Goal', 'Plant Date'], actions: ['flagFin'] },
  { id: 'planFinished', name: 'Planting Finished 2', table: 'finPlant', slice: SLICES.planFinished, sort: byPlantedGenus, chips: 'finished',
    cols: ['Size', 'Genus', 'Variety', 'HB', 'Goal', 'QCell', 'Assortment', 'Location', 'Plug Location', 'Plant Week', 'Plant Date', 'From Contain', 'Reason why not flagged', 'Ready Week', 'Forecast #', 'Timestamp'],
    sub: ['Location', 'Plant Date', 'Goal'], actions: ['plantFin', 'labelFin', 'reasonFin', 'setPlanted', 'resetPlanted'] },
  { id: 'plant2in', name: '2in Planting', table: 'finPlant', slice: SLICES.plant2in, sort: byPlantedGenus, chips: 'twoIn',
    cols: ['Size', 'Genus', 'Variety', 'Goal', 'QCell', 'Assortment', 'Location', 'Plug Location', 'Plant Week', 'Plant Date', 'From Contain', 'Reason why not flagged', 'Ready Week', 'Forecast #', 'Timestamp'],
    sub: ['Location', 'Plant Date', 'Goal'], actions: ['plantFin', 'labelFin', 'setPlanted', 'resetPlanted'] },
  { id: 'finAddition', name: 'Planting Finished addition', kind: 'addition' },
  // menu tabs
  { id: 'addLabels', name: 'Add Labels', menu: true, table: 'finPlant', slice: SLICES.labels, sort: byLabels, chips: 'labels',
    cols: ['Size', 'Genus', 'Variety', 'Location planted', 'Qty planted', 'Actual Plant Date', 'HB', 'Label added by', 'Labels inventory qty'],
    sub: ['Location planted', 'Qty planted', 'Actual Plant Date'], actions: ['addLabels', 'labelsBy'] },
  { id: 'finAudit', name: 'Finished Audit', menu: true, table: 'finPlant', slice: SLICES.finAudit, sort: byPlantedGenus,
    cols: ['Size', 'Genus', 'Variety', 'HB', 'Goal', 'QCell', 'Assortment', 'Location', 'Plug Location', 'Plant Week', 'Plant Date', 'From Contain', 'Reason why not flagged', 'Ready Week', 'Forecast #', 'Timestamp'],
    sub: ['Location', 'Plant Date', 'Goal'], actions: ['plantFin', 'reasonFin'] },
  { id: 'flagUrc', name: 'Flagging URC Plugs', menu: true, table: 'flagPlug', slice: SLICES.flagUrc, sort: byTransGenus,
    cols: ['Size', 'Genus', 'Variety', 'Qty not incoming', 'QCell', 'Assortment', 'Goal', 'Inputs on Order', 'Plant Date', 'From Contain', 'ToContain', 'Plant Week', 'Ready Week', 'Vendor', 'Forecast #', 'Timestamp'],
    sub: ['Goal', 'Inputs on Order', 'Vendor'], actions: ['flagPlug'] },
  { id: 'plugsAudit', name: 'Plugs Audit', menu: true, table: 'plugPlant', slice: SLICES.plugsAudit, sort: byPlantedGenus,
    cols: ['Size', 'Genus', 'Variety', 'QCell', 'Assortment', 'Plant Date', 'From Contain', 'ToContain', 'Reason why not flagged', 'Plant Week', 'Ready Week', 'Vendor', 'Forecast #', 'Timestamp'],
    sub: ['Plant Date', 'Vendor', 'From Contain'], actions: ['plantPlug', 'reasonPlug'] }
];
// Only the planting tabs are shown (decision 6 Nov). To bring other tabs back, add their ids here.
// view-level buttons (like AppSheet's Add buttons): start = Empieza chooser, add = additions
export const VBAR = { planIncoming: { start: ['plug', 'fin'], add: ['plug', 'fin'] }, planPlugs: { start: ['plug'] }, planFinished: { start: ['fin'] }, plant2in: { start: ['fin'] } };
export const ENABLED = ['planIncoming', 'planPlugs', 'planFinished', 'plant2in', 'finAddition'];
export const VIEWS = ALL_VIEWS.filter(v => ENABLED.includes(v.id));
export const viewById = id => VIEWS.find(v => v.id === id);
