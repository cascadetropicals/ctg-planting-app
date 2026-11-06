// Form definitions. Field keys = sheet header text (whitespace-normalised).
import { addDays, nowStamp, todayISO } from './format.js';

const F = (k, label, type = 'text', extra = {}) => ({ k, label, type, ...extra });
const QTY = 'cantidad de plantas / plug Qty (count plugs - no flats)';
const SIZE_ES = 'tamaño / size';

const PLUG_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { req: true, src: 'plug' }),
  F(QTY, 'Quantity (plugs, not flats)', 'num', { req: true }),
  F('Casa / Greenhouse', 'Casa / Greenhouse', 'enum', { req: true, list: 'greenhouse' }),
  F('Notas / Notes', 'Notas / Notes', 'long'),
  F(SIZE_ES, 'Tamaño / size', 'enum', { req: true, list: 'size' }),
  F('FromContain', 'From container', 'enum', { more: true, list: 'fromContain' }),
  F('Vendor', 'Vendor', 'enum', { more: true, list: 'vendor' }),
  F('Plant Date', 'Plant date', 'date', { more: true }),
  F('ToContain', 'To container', 'enum', { more: true, list: 'toContain' }),
  F('QCell', 'QCell', 'num', { more: true }),
  F('Employee', 'Employee', 'enum', { more: true, list: 'employee' }),
  F('Employee 2', 'Employee 2', 'enum', { more: true, list: 'employee' }),
  F('Qty Projected', 'Qty projected', 'num', { more: true }),
  F('Ready Date', 'Ready date', 'date', { more: true }),
  F('Goal', 'Goal', 'num', { more: true }),
  F('Plug Type', 'Plug type', 'text', { more: true }),
  F('Qty of flats', 'Qty of flats', 'num', { more: true }),
  F('Forecast #', 'Forecast #', 'text', { more: true }),
  F('Incoming ID', 'Incoming ID', 'text', { more: true }),
  F('Assortment', 'Assortment', 'text', { more: true })
];
const FIN_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { req: true, src: 'item' }),
  F('Escanear UPC / Scan UPC', 'Escanear UPC / Scan UPC', 'text', { upc: true }),
  F('cantidad / Qty', 'Cantidad / Qty', 'num', { req: true }),
  F('Casa / Greenhouse', 'Casa / Greenhouse', 'enum', { req: true, list: 'greenhouse' }),
  F('linea', 'Linea', 'text'),
  F('Notas / Notes', 'Notas / Notes', 'long'),
  F('Employee', 'Employee', 'enum', { req: true, list: 'employee' }),
  F('Employee 2', 'Employee 2', 'enum', { more: true, list: 'employee' }),
  F('Plug Location', 'Plug location', 'enum', { more: true, list: 'plugLocation' }),
  F('Item Code', 'Item code', 'text', { more: true }),
  F('Item #', 'Item #', 'text', { more: true }),
  F('Plugs used', 'Plugs used', 'num', { more: true }),
  F('FromContain', 'From container', 'enum', { more: true, list: 'fromContain' }),
  F('Vendor', 'Vendor', 'enum', { more: true, list: 'vendor' }),
  F('Plant Date', 'Plant date', 'date', { more: true }),
  F('QCell', 'QCell', 'num', { more: true }),
  F('Qty Projected', 'Qty projected', 'num', { more: true }),
  F('Ready Date', 'Ready date', 'date', { more: true }),
  F('Goal', 'Goal', 'num', { more: true }),
  F('Size', 'Size', 'enum', { more: true, list: 'size' }),
  F('Forecast #', 'Forecast #', 'text', { more: true }),
  F('Incoming ID', 'Incoming ID', 'text', { more: true }),
  F('Assortment', 'Assortment', 'text', { more: true })
];
// "Planting Finished addition" tab shows only these fields
const FIN_ADD_KEYS = ['Choose Plant', 'cantidad / Qty', 'Casa / Greenhouse', 'Plug Location', 'QCell', 'FromContain', 'Employee', 'Employee 2', 'Notas / Notes'];
const finAddFields = FIN_FIELDS.filter(f => FIN_ADD_KEYS.includes(f.k)).map(f => ({ ...f, more: false }))
  .sort((a, b) => FIN_ADD_KEYS.indexOf(a.k) - FIN_ADD_KEYS.indexOf(b.k));
const ADD_LABEL_FIELDS = [
  F('Choose Plant', 'Choose plant', 'plant', { req: true, src: 'item' }),
  F('Escanear UPC / Scan UPC', 'Escanear UPC / Scan UPC', 'text', { upc: true }),
  F('cantidad / Qty', 'Cantidad / Qty', 'num', { req: true }),
  F('Casa / Greenhouse', 'Casa / Greenhouse', 'enum', { req: true, list: 'greenhouse' }),
  F('Notas / Notes', 'Notas / Notes', 'long'),
  F('Employee', 'Employee', 'enum', { req: true, list: 'employee' }),
  F('Item Code', 'Item code', 'text', { more: true }),
  F('Item #', 'Item #', 'text', { more: true }),
  F('Plant Date', 'Plant date', 'date', { more: true }),
  F('Size', 'Size', 'enum', { more: true, list: 'size' }),
  F('Forecast #', 'Forecast #', 'text', { more: true })
];

export const FORMS = {
  plugPlanting: { title: 'Plug planting record', target: 'gfPlug', fields: PLUG_FIELDS },
  plugLabels: { title: 'Plug label printing record', target: 'gfPlugLabels', fields: PLUG_FIELDS },
  finPlanting: { title: 'Finished planting record', target: 'gfFin', fields: FIN_FIELDS },
  finLabels: { title: 'Finished label printing record', target: 'gfFinLabels', fields: FIN_FIELDS },
  finAddition: { title: 'Planting Finished addition', target: 'gfFin', fields: finAddFields },
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
export function readyDate(L, plant, plantDate) {
  const g = L.grow.get(String(plant).trim().toLowerCase());
  if (!g || !plantDate) return '';
  const mon = Number(plantDate.slice(5, 7));
  const w = (mon >= 4 && mon <= 8) ? g.summer : g.winter;
  return w ? addDays(plantDate, Math.round(w * 7)) : '';
}
