// Form definitions. Field keys = sheet header text (whitespace-normalised).
import { addDays, nowStamp, todayISO } from './format.js';

const F = (k, label, type = 'text', extra = {}) => ({ k, label, type, ...extra });
const QTY = 'cantidad de plantas / plug Qty (count plugs - no flats)';
const SIZE_ES = 'tamaño / size';

const E = (k, label, extra = {}) => F(k, label, 'enum', extra);
const RO = { ro: true };
// Plug planting form (GF_PlugPlanting_Form): info rows read-only, editable: qty, Employee, Employee 2, Casa, Notes
const PLUG_FIELDS = [
  F('Choose Plant', 'Plant', 'plant', { ro: true, src: 'plug' }),
  F('FromContain', 'From container', 'text', RO), F(SIZE_ES, 'Size', 'text', RO), F('Qty of flats', 'Qty of flats', 'text', RO), F('Goal', 'Goal', 'text', RO), F('QCell', 'QCell', 'text', RO),
  F(QTY, 'Quantity (plugs, not flats)', 'num', { req: true }),
  E('Employee', 'Employee', { req: true, list: 'employee' }),
  E('Employee 2', 'Employee 2', { list: 'employee', showIf: v => !!v['Employee'] }),
  E('Casa / Greenhouse', 'Casa / Greenhouse', { req: true, list: 'greenhouse' }),
  F('Notas / Notes', 'Notas / Notes', 'long'),
  F('Vendor', 'Vendor', 'text', RO), F('Plant Date', 'Plant date', 'date', { ro: true }), F('ToContain', 'To container', 'text', RO),
  F('Ready Date', 'Ready date', 'date', { ro: true }), F('Qty Projected', 'Qty projected', 'text', RO), F('Forecast #', 'Forecast #', 'text', RO), F('Assortment', 'Assortment', 'text', RO),
  F('Plug Type', 'Plug type', 'text', { hide: true }), F('Incoming ID', 'Incoming ID', 'text', { hide: true })
];
const FIN_FIELDS = [
  F('Choose Plant', 'Plant', 'plant', { ro: true, src: 'item' }),
  F('FromContain', 'From container', 'text', RO), F('Goal', 'Goal', 'text', RO), F('QCell', 'QCell', 'text', RO),
  F('Size', 'Size', 'enum', { req: false, list: 'size' }),
  F('cantidad / Qty', 'Cantidad / Qty', 'num', { req: true }),
  F('Plugs used', 'Plugs used', 'num', { showIf: (v, L) => plugStock(L, v['Choose Plant']) > 0 && Number(v['cantidad / Qty']) > 0 }),
  F('INV_Plugs Qty on Hand', 'INV_Plugs Qty on Hand', 'text', { ro: true, calc: (v, L) => { const s = plugStock(L, v['Choose Plant']); return s == null ? '' : String(s - (Number(v['Plugs used']) || 0)); }, showIf: (v, L) => plugStock(L, v['Choose Plant']) != null }),
  E('Employee', 'Employee', { req: true, list: 'employee' }),
  E('Employee 2', 'Employee 2', { list: 'employee', showIf: v => !!v['Employee'] }),
  E('Casa / Greenhouse', 'Casa / Greenhouse', { req: true, list: 'greenhouse' }),
  F('Notas / Notes', 'Notas / Notes', 'long'),
  F('Vendor', 'Vendor', 'text', RO), F('Plant Date', 'Plant date', 'date', { ro: true }), F('Ready Date', 'Ready date', 'date', { ro: true }),
  F('Qty Projected', 'Qty projected', 'text', RO), F('Forecast #', 'Forecast #', 'text', RO), F('Assortment', 'Assortment', 'text', RO),
  F('Item Code', 'Item code', 'text', { hide: true }), F('Item #', 'Item #', 'text', { hide: true }), F('Plug Location', 'Plug location', 'text', { hide: true }), F('Incoming ID', 'Incoming ID', 'text', { hide: true })
];
function plugStock(L, plant) {
  const pn = L.ddPlant[String(plant || '').trim().toLowerCase().replace(/\s+/g, ' ')];
  if (!pn) return null; const q = L.stock[pn.trim().toLowerCase().replace(/\s+/g, ' ')]; return q == null ? null : q;
}
// Addition forms (Plugs Addition / Finished Addition): everything editable, AppSheet order
const PLUG_ADD_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { req: true, src: 'plug' }),
  E(SIZE_ES, 'Tamaño / size', { req: true, list: 'size' }),
  F(QTY, 'Quantity (plugs, not flats)', 'num', { req: true }),
  E('FromContain', 'From container', { list: 'fromContain' }), F('QCell', 'QCell', 'num'),
  E('Casa / Greenhouse', 'Casa / Greenhouse', { req: true, list: 'greenhouse' }),
  E('ToContain', 'To container', { list: 'toContain' }), E('Vendor', 'Vendor', { list: 'vendor' }),
  E('Employee', 'Employee', { req: true, list: 'employee' }),
  E('Employee 2', 'Employee 2', { list: 'employee', showIf: v => !!v['Employee'] }),
  F('Notas / Notes', 'Notas / Notes', 'long')
];
const FIN_ADD_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { req: true, src: 'item' }),
  F('cantidad / Qty', 'Cantidad / Qty', 'num', { req: true }),
  E('Casa / Greenhouse', 'Casa / Greenhouse', { req: true, list: 'greenhouse' }),
  E('Plug Location', 'Plug location', { list: 'plugLocation' }), F('QCell', 'QCell', 'num'), E('FromContain', 'From container', { list: 'fromContain' }),
  E('Employee', 'Employee', { req: true, list: 'employee' }),
  E('Employee 2', 'Employee 2', { list: 'employee', showIf: v => !!v['Employee'] }),
  F('Notas / Notes', 'Notas / Notes', 'long')
];
// Label forms (GF_*_labels_Form): only plant + quantity are shown; the rest is looked up by Forecast # (client keeps recent values, backend fills the rest)
const LABEL_QTY_PLUG = QTY, LABEL_QTY_FIN = 'cantidad / Qty';
const PLUG_LABEL_FIELDS = [F('Choose Plant', 'Plant', 'plant', { ro: true, src: 'plug' }), F(LABEL_QTY_PLUG, 'Quantity', 'num', { req: true }),
  ...['FromContain', 'Vendor', 'ToContain', 'QCell', 'Goal', 'Plug Type', 'Qty of flats', 'Forecast #', 'Ready Date', 'Assortment', SIZE_ES].map(k => F(k, k, 'text', { hide: true }))];
const FIN_LABEL_FIELDS = [F('Choose Plant', 'Plant', 'plant', { ro: true, src: 'item' }), F(LABEL_QTY_FIN, 'Quantity', 'num', { req: true }),
  ...['Size', 'QCell', 'FromContain', 'Goal', 'Ready Date', 'Forecast #', 'Casa / Greenhouse', 'Plug Location', 'Assortment'].map(k => F(k, k, 'text', { hide: true }))];
// "Empieza" start forms: Choose Plant fixed, only Employee
const START_FIELDS = [F('Choose Plant', 'Choose plant', 'text', { ro: true }), E('Employee', 'Employee', { req: true, list: 'employee' })];
const ADD_LABEL_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { ro: true, src: 'item' }),
  F('cantidad / Qty', 'Cantidad / Qty', 'num', { req: true }),
  E('Employee', 'Employee', { list: 'employee' }),
  ...['Item Code', 'Item #', 'Plant Date', 'Size', 'Forecast #', 'Casa / Greenhouse'].map(k => F(k, k, 'text', { hide: true }))
];

export const FORMS = {
  plugPlanting: { title: 'Plug planting record', target: 'gfPlug', fields: PLUG_FIELDS },
  plugLabels: { title: 'Plug label printing record', target: 'gfPlugLabels', fields: PLUG_LABEL_FIELDS },
  finPlanting: { title: 'Finished planting record', target: 'gfFin', fields: FIN_FIELDS },
  finLabels: { title: 'Finished label printing record', target: 'gfFinLabels', fields: FIN_LABEL_FIELDS },
  plugAddition: { title: 'Plugs Addition', target: 'gfPlug', fields: PLUG_ADD_FIELDS },
  finAddition: { title: 'Finished Addition', target: 'gfFin', fields: FIN_ADD_FIELDS },
  plugStart: { title: 'Plug planting start', target: 'gfPlug', fields: START_FIELDS },
  finStart: { title: 'Finished planting start', target: 'gfFin', fields: START_FIELDS },
  addLabels: { title: 'Add labels', target: 'gfAddLabels', fields: ADD_LABEL_FIELDS }
};

// ---- prefill (copies of AppSheet's LINKTOFORM expressions) ----
const forecastFrom = v => (!v || v === 'no Prod Plan match') ? nowStamp() : v;
const itemLookup = (L, desc) => {
  const d = L.dd.byDesc.get(String(desc).trim().toLowerCase());
  return d ? { 'Item Code': d.c || '', 'Item #': d.i || '' } : {};
};
const clean = o => { for (const k of Object.keys(o)) if (o[k] === '' || o[k] == null) delete o[k]; return o; };
const plantName = r => (r.Genus + ' ' + r.Variety).trim();
const itemName = r => plantName(r) + ' - ' + r.Size;

export const PREFILL = {
  // Incoming_arrived row -> plug planting form
  incPlug: (r, L) => clean({ [SIZE_ES]: r.Size, 'Choose Plant': plantName(r), 'Qty Projected': r['Qty Projected'], FromContain: r['From Contain'], Vendor: r.Vendor,
    ToContain: r.ToContain, QCell: r.QCell, 'Casa / Greenhouse': r.Location, 'Ready Date': r['Ready Date'], 'Plug Type': r['Plug Type'], 'Qty of flats': r['Qty of flats'],
    Goal: r.Goal, 'Forecast #': forecastFrom(r['Forecast #']), 'Incoming ID': r.ID }),
  incFin: (r, L) => clean({ Size: r.Size, 'Choose Plant': itemName(r), Vendor: r.Vendor, QCell: r.QCell, FromContain: r['From Contain'], 'Qty Projected': r['Qty Projected'],
    'Ready Date': r['Ready Date'], 'Casa / Greenhouse': r.Location, 'Forecast #': r['Forecast #'], 'Incoming ID': r.ID, Goal: r.Goal,
    ...(r['Item #'] ? { 'Item #': r['Item #'] } : itemLookup(L, itemName(r))), ...(itemLookup(L, itemName(r))['Item Code'] ? { 'Item Code': itemLookup(L, itemName(r))['Item Code'] } : {}) }),
  incPlugLabels: (r, L) => clean({ [SIZE_ES]: r.Size, 'Choose Plant': plantName(r), FromContain: r['From Contain'], Vendor: r.Vendor, ToContain: r.ToContain, QCell: r.QCell,
    Goal: r.Goal, 'Plug Type': r['Plug Type'], 'Qty of flats': r['Qty of flats'], 'Forecast #': r['Forecast #'], 'Ready Date': r['Ready Date'] }),
  incFinLabels: (r, L) => clean({ Size: r.Size, 'Choose Plant': itemName(r), QCell: r.QCell, FromContain: r['From Contain'], Goal: r.Goal, 'Ready Date': r['Ready Date'],
    'Forecast #': r['Forecast #'], 'Casa / Greenhouse': r.Location }),
  // Plug_puse bandera row
  plugPlug: (r, L) => clean({ [SIZE_ES]: r.Size, 'Choose Plant': plantName(r), FromContain: r['From Contain'], Vendor: r.Vendor, ToContain: r.ToContain, Assortment: r.Assortment,
    QCell: r.QCell, Goal: r.Goal, 'Plug Type': r['Plug Type'], 'Qty of flats': r['Qty of flats'], 'Forecast #': r['Forecast #'], 'Ready Date': r['Ready Date'], 'Casa / Greenhouse': r.Location }),
  plugPlugLabels: (r, L) => clean({ [SIZE_ES]: r.Size, 'Choose Plant': plantName(r), FromContain: r['From Contain'], Vendor: r.Vendor, ToContain: r.ToContain, Assortment: r.Assortment,
    QCell: r.QCell, Goal: r.Goal, 'Plug Type': r['Plug Type'], 'Qty of flats': r['Qty of flats'], 'Forecast #': r['Forecast #'] }),
  // Puse bandera row
  finFin: (r, L) => clean({ Size: r.Size, 'Choose Plant': itemName(r), QCell: r.QCell, FromContain: r['From Contain'], Goal: r.Goal, 'Plug Location': r['Plug Location'],
    'Forecast #': r['Forecast #'], 'Casa / Greenhouse': r.Location, Assortment: r.Assortment, 'Ready Date': r['Ready Date'],
    ...(r['Item Code'] ? { 'Item Code': r['Item Code'] } : itemLookup(L, itemName(r))), ...(r['Item #'] ? { 'Item #': r['Item #'] } : itemLookup(L, itemName(r))) }),
  finFinLabels: (r, L) => clean({ Size: r.Size, 'Choose Plant': itemName(r), QCell: r.QCell, FromContain: r['From Contain'], Goal: r.Goal, 'Plug Location': r['Plug Location'],
    'Forecast #': r['Forecast #'], 'Casa / Greenhouse': r.Location, Assortment: r.Assortment }),
  finAddLabels: (r, L) => clean({ Size: r.Size, 'Choose Plant': itemName(r), 'Plant Date': r['Actual Plant Date'], 'Forecast #': r['Forecast #'], 'Casa / Greenhouse': r.Location,
    'Item Code': r['Item Code'], 'Item #': r['Item #'] })
};

export const FORM_DEFAULTS = () => ({ 'Plant Date': todayISO() });

// Ready date = plant date + grow weeks * 7 (PLUGgrow-library: months 4-8 use summer column)
export function readyDate(L, plant, plantDate, fin) {
  const g = (fin ? L.growFin : L.grow).get(String(plant).trim().toLowerCase());
  if (!g || !plantDate) return '';
  const mon = Number(plantDate.slice(5, 7));
  const w = (mon >= 4 && mon <= 8) ? g.summer : g.winter;
  return w ? addDays(plantDate, Math.round(w * 7)) : '';
}
