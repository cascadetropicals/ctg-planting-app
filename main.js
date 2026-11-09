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
if ('serviceWorker' in navigator) {
  // Always look for a new release: on every open and whenever the app comes back to the foreground (home-screen apps stay alive in the background).
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    const check = () => { try { reg.update(); } catch (e) { /* ignore */ } };
    check(); document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 10 * 60 * 1000);
  }).catch(() => {});
  // A new service worker took over = new release: reload once, unless someone is in the middle of a form.
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had) { had = true; return; }
    const go = () => { if (document.querySelector('#overlay') && !document.querySelector('#overlay').hidden) return setTimeout(go, 3000); location.reload(); };
    go();
  });
}
if (S.user) enter(); else showLogin();
