// Transport: POST text/plain JSON to Apps Script (no preflight). Empty API_URL = demo mode.
import { CONFIG } from './config.js';
import { handle as demo } from './demo.js';

export const isDemo = () => !CONFIG.API_URL;

export async function call(action, body = {}, token = '') {
  if (isDemo()) return demo(action, body, token);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 45000);
  try {
    const res = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, ...body }), signal: ctl.signal, redirect: 'follow' });
    if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { net: true });
    const j = await res.json();
    if (j && j.error === 'auth') throw Object.assign(new Error('auth'), { auth: true });
    return j;
  } catch (e) {
    if (e.auth) throw e;
    throw Object.assign(new Error(e.message || 'offline'), { net: true });
  } finally { clearTimeout(t); }
}
