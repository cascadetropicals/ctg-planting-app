// Dates are ISO strings 'YYYY-MM-DD' everywhere inside the app (compare as strings).
const pad = n => String(n).padStart(2, '0');
export const isoDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const todayISO = () => isoDate(new Date());
export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + n));
}
// ISO-8601 week number (same as AppSheet ISOWEEKNUM)
export function isoWeek(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - y0) / 86400000 + 1) / 7);
}
export const fmtDate = iso => {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? Number(m[2]) + '/' + Number(m[3]) + '/' + m[1] : String(iso);
};
export const fmtDateTime = s => {
  if (!s) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s);
  return m ? Number(m[2]) + '/' + Number(m[3]) + '/' + m[1] + ' ' + m[4] + ':' + m[5] : String(s);
};
// numbers: #,###  (thousands separator, no decimals unless the value has them)
export function fmtNum(v) {
  if (v === '' || v == null || isNaN(Number(v))) return v == null ? '' : String(v);
  const n = Number(v);
  const dec = Math.abs(n % 1) > 1e-9 ? 2 : 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dec });
}
export const nowStamp = () => {
  const d = new Date();
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
};
export const nowISO = () => {
  const d = new Date();
  return isoDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
};
export const norm = s => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
