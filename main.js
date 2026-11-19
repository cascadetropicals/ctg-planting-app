import { CONFIG } from './config.js';
import { S, login, loadAll, start, subscribe, setTablet, presence, logout } from './store.js';
import { mount, refreshUI, translateStatic, applyLang, askDuplicate } from './ui.js';
import { t } from './i18n.js';
import { isDemo, call } from './api.js';

const $ = s => document.querySelector(s);
let mounted = false;

async function enter(fresh) {
  $('#login').hidden = true; $('#app').hidden = false;
  if (!mounted) { mount(); mounted = true; }
  refreshUI();
  try { await loadAll(); } catch (e) { if (e.auth) return showLogin(); }
  refreshUI(); start();
  const p = await presence(fresh ? 'login' : 'ping'); // who else is logged in with this account today?
  const mine = (p.users || []).find(u => u.me);
  if (fresh && mine && mine.dup) askDuplicate((p.users || []).filter(u => !u.me && u.acct === mine.acct), mine, logout);
}
function showLogin(msg) {
  $('#app').hidden = true; $('#login').hidden = false; $('#loginErr').textContent = msg || '';
  $('#codeRow').hidden = true; setTimeout(() => $('#loginName').focus(), 50);
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const go = $('#loginGo'); go.disabled = true; $('#loginErr').textContent = '';
  try { if (!$('#tabRow').hidden) setTablet($('#loginTab').value); await login($('#loginName').value); await enter(true); }
  catch (er) { $('#loginErr').textContent = er.net ? t('No connection. Try again.') : (er.message || t('Could not sign in')); }
  go.disabled = false;
});
// Sign-in step 1: tap your name (list from the employee sheet, kept for offline); step 2: Google button.
function nameStep(list) {
  const KEY = 'ctg_names'; try { if (list.length) localStorage.setItem(KEY, JSON.stringify(list)); else list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { /* ignore */ }
  if (!list.length) { $('#gbox').hidden = false; return; }
  const sel = $('#nameSel'), inp = $('#loginName'); sel.textContent = '';
  const add = (v, txt) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; sel.append(o); };
  add('', t('Choose your name…')); list.forEach(n => add(n, n)); add('__other', t('Other name…'));
  const sync = () => { $('#gHint').textContent = t('Sign in as') + ' ' + inp.value.trim(); $('#gbox').hidden = !inp.value.trim(); $('#loginErr').textContent = ''; };
  sel.onchange = () => {
    if (sel.value === '__other') { inp.value = ''; $('#nameRow').hidden = false; inp.focus(); }
    else { inp.value = sel.value; $('#nameRow').hidden = true; }
    sync();
  };
  inp.addEventListener('input', sync);
  $('#nameRow').hidden = true; $('#nameStep').hidden = false; $('#gbox').hidden = true;
}
// Google sign-in (like AppSheet): shown only when the backend has a Client ID configured.
async function setupGoogle() {
  if (isDemo()) return;
  try {
    const cfg = await call('cfg');
    if (cfg && !cfg.googleClientId && (cfg.tabletEmail || []).length) { // no Google sign-in set up: pick this tablet's account on the start page
      const sel = $('#loginTab'); sel.textContent = '';
      const ph = document.createElement('option'); ph.value = ''; ph.textContent = t('Choose account…'); sel.append(ph);
      for (const e of cfg.tabletEmail) { const o = document.createElement('option'); o.value = e; o.textContent = e; sel.append(o); }
      sel.value = S.tablet && cfg.tabletEmail.includes(S.tablet) ? S.tablet : ''; sel.required = true; $('#tabRow').hidden = false;
      return;
    }
    if (!cfg || !cfg.googleClientId) return;
    nameStep(cfg.names || []);
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ok; s.onerror = no; document.head.append(s); });
    window.google.accounts.id.initialize({ client_id: cfg.googleClientId, auto_select: false, cancel_on_tap_outside: false, callback: async r => {
      const name = $('#loginName').value.trim();
      if (!name) { $('#loginErr').textContent = t('Please enter your name first, then sign in with Google.'); return; }
      $('#loginErr').textContent = '';
      try { await login(name, r.credential); await enter(true); }
      catch (er) { $('#loginErr').textContent = er.net ? t('No connection. Try again.') : (er.message || t('Could not sign in')); }
    } });
    window.google.accounts.id.renderButton($('#gbtn'), { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
    $('#loginGo').hidden = true; if ($('#nameStep').hidden) $('#gbox').hidden = false;
  } catch (e) { /* no connection or blocked: keep the name-only login */ }
}
subscribe(w => { if (w === 'auth') showLogin(); });
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
translateStatic();
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
