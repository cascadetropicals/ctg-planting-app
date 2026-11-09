import { CONFIG } from './config.js';
import { S, login, loadAll, start, subscribe, setTablet } from './store.js';
import { mount, refreshUI } from './ui.js';
import { isDemo, call } from './api.js';

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
  try { if (!$('#tabRow').hidden) setTablet($('#loginTab').value); await login($('#loginName').value); await enter(); }
  catch (er) { $('#loginErr').textContent = er.net ? 'No connection. Try again.' : (er.message || 'Could not sign in'); }
  go.disabled = false;
});
// Google sign-in (like AppSheet): shown only when the backend has a Client ID configured.
async function setupGoogle() {
  if (isDemo()) return;
  try {
    const cfg = await call('cfg');
    if (cfg && !cfg.googleClientId && (cfg.tabletEmail || []).length) { // no Google sign-in set up: pick this tablet's account on the start page
      const sel = $('#loginTab'); sel.textContent = '';
      const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Choose account…'; sel.append(ph);
      for (const e of cfg.tabletEmail) { const o = document.createElement('option'); o.value = e; o.textContent = e; sel.append(o); }
      sel.value = S.tablet && cfg.tabletEmail.includes(S.tablet) ? S.tablet : ''; sel.required = true; $('#tabRow').hidden = false;
      return;
    }
    if (!cfg || !cfg.googleClientId) return;
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = no; document.head.append(s); });
    window.google.accounts.id.initialize({ client_id: cfg.googleClientId, auto_select: false, cancel_on_tap_outside: false, callback: async r => {
      const name = $('#loginName').value.trim();
      if (!name) { $('#loginErr').textContent = 'Please enter your name first, then sign in with Google.'; return; }
      $('#loginErr').textContent = '';
      try { await login(name, r.credential); await enter(); }
      catch (er) { $('#loginErr').textContent = er.net ? 'No connection. Try again.' : (er.message || 'Could not sign in'); }
    } });
    window.google.accounts.id.renderButton($('#gbtn'), { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
    $('#gbox').hidden = false; $('#loginGo').hidden = true;
  } catch (e) { /* no connection or blocked: keep the name-only login */ }
}
subscribe(w => { if (w === 'auth') showLogin(); });
setupGoogle();
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
