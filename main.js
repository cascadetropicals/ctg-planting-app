import { CONFIG } from './config.js';
import { S, login, loadAll, start, subscribe } from './store.js';
import { mount, refreshUI } from './ui.js';
import { isDemo } from './api.js';

const $ = s => document.querySelector(s);
let mounted = false;

async function enter() {
  $('#login').hidden = true; $('#app').hidden = false;
  if (!mounted) { mount(); mounted = true; }
  refreshUI();
  try { await loadAll(); } catch (e) { if (e.auth) return showLogin(); }
  refreshUI(); start();
}
function showLogin(msg) {
  $('#app').hidden = true; $('#login').hidden = false; $('#loginErr').textContent = msg || '';
  $('#codeRow').hidden = true; setTimeout(() => $('#loginName').focus(), 50);
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const go = $('#loginGo'); go.disabled = true; $('#loginErr').textContent = '';
  try { await login($('#loginName').value); await enter(); }
  catch (er) { $('#loginErr').textContent = er.net ? 'No connection. Try again.' : (er.message || 'Could not sign in'); }
  go.disabled = false;
});
subscribe(w => { if (w === 'auth') showLogin(); });
document.title = CONFIG.APP_NAME + (isDemo() ? ' (demo)' : '');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if (S.user) enter(); else showLogin();
