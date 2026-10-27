// App shell: data loading, hash router, accessible navigation, header search, compare bar, notification check.
import { loadData, DB } from './data.js';
import { parseHash, esc, reducedMotion } from './util.js';
import { buildIndex } from './search.js';
import { homeView, destinationView, catalogueView, equipmentView, missionView, missionsListView, notFound } from './views-core.js';
import { planetsView, planetView, timelineView, compareView, quizView, glossaryView, sourcesView, aboutView, updatesView, searchView, unseenUpdates, notifySupported } from './views-more.js';
import { getCompare, onCompare } from './compare-state.js';
import { store } from './util.js';

const view = document.getElementById('view'); const heroSlot = document.getElementById('hero-slot');
const NAV_MAP = [['/', 'home'], ['/moon', 'dest'], ['/mars', 'dest'], ['/planets', 'dest'], ['/missions', 'dest'], ['/catalogue', null], ['/quiz', 'learn'], ['/glossary', 'learn'], ['/sources', 'learn'], ['/timeline', 'time'], ['/compare', 'compare'], ['/about', 'about'], ['/updates', 'updates']];

function resolve({ parts, params }) {
  const [a, b] = parts;
  switch (a) {
    case undefined: return homeView();
    case 'moon': return destinationView('Moon', params);
    case 'mars': return destinationView('Mars', params);
    case 'planets': return b ? planetView(b) : planetsView(params);
    case 'missions': return missionsListView(params);
    case 'mission': return missionView(b);
    case 'catalogue': return catalogueView(params);
    case 'equipment': return equipmentView(b);
    case 'timeline': return timelineView(b || 'nasa', params);
    case 'compare': return compareView(params);
    case 'quiz': return quizView();
    case 'glossary': return glossaryView(params);
    case 'sources': return sourcesView(params);
    case 'about': return aboutView(params);
    case 'updates': return updatesView();
    case 'search': return searchView(params);
    default: return notFound('Page', '/' + parts.join('/'), '#/', 'Go to the home page');
  }
}

let first = true;
function render() {
  const r = parseHash();
  const c = view.querySelector('#carousel'); if (c && c._cleanup) c._cleanup();
  let v;
  try { v = resolve(r); } catch (err) { console.error(err); v = { title: 'Error', html: `<div class="wrap section"><h1 id="page-title" tabindex="-1">Something went wrong</h1><p>This page could not be displayed. <a href="#/">Return home</a>.</p></div>` }; }
  heroSlot.hidden = !v.hero;
  view.innerHTML = v.html;
  document.body.classList.toggle('is-home', !!v.hero);
  document.title = (v.hero ? 'Abandoned but Not Forgotten — NASA Space Apps Challenge' : `${v.title} — Abandoned but Not Forgotten`);
  if (v.hero) window.dispatchEvent(new Event('resize')); // lets the hero canvas size itself once visible
  try { if (v.mount) v.mount(view); } catch (err) { console.error(err); }
  closeMenus(); updateNav(r); updateCompareBar();
  if (!first || location.hash.length > 2) { window.scrollTo({ top: 0, behavior: 'auto' }); }
  const sec = r.params.get('sec');
  if (!first) { const t = v.hero ? document.getElementById('main') : (view.querySelector('#page-title') || document.getElementById('main')); if (t && !sec) t.focus({ preventScroll: true }); }
  first = false;
}

/* ---- navigation ---- */
const nav = document.getElementById('nav'); const toggle = document.getElementById('nav-toggle');
function closeMenus(except) { nav.querySelectorAll('.nav__btn[aria-expanded=true]').forEach((b) => { if (b !== except) { b.setAttribute('aria-expanded', 'false'); } }); }
function updateNav(r) {
  const p = r.path; nav.querySelectorAll('a[href]').forEach((a) => { const h = a.getAttribute('href').replace(/^#/, '').split('?')[0]; const cur = h === p || (h !== '/' && p.startsWith(h + '/')); if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  nav.querySelectorAll('.nav__btn').forEach((b) => { const m = document.getElementById(b.getAttribute('aria-controls')); b.classList.toggle('is-active', !!m.querySelector('[aria-current=page]')); });
}
nav.addEventListener('click', (e) => {
  const b = e.target.closest('.nav__btn');
  if (b) { const open = b.getAttribute('aria-expanded') === 'true'; closeMenus(b); b.setAttribute('aria-expanded', String(!open)); return; }
  if (e.target.closest('a')) { closeMenus(); toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
});
nav.addEventListener('keydown', (e) => {
  const b = e.target.closest('.nav__btn'); const menu = e.target.closest('.nav__menu');
  if (e.key === 'Escape') { const owner = menu ? nav.querySelector(`[aria-controls="${menu.id}"]`) : b; if (owner && owner.getAttribute('aria-expanded') === 'true') { owner.setAttribute('aria-expanded', 'false'); owner.focus(); e.stopPropagation(); } return; }
  if (b && (e.key === 'ArrowDown')) { e.preventDefault(); closeMenus(b); b.setAttribute('aria-expanded', 'true'); const a = document.getElementById(b.getAttribute('aria-controls')).querySelector('a'); if (a) a.focus(); }
  if (menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const links = [...menu.querySelectorAll('a')]; const i = links.indexOf(document.activeElement); const n = e.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length; links[n].focus(); }
});
document.addEventListener('click', (e) => { if (!e.target.closest('.nav__item')) closeMenus(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) closeMenus(); });
toggle.addEventListener('click', () => { const o = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!o)); nav.classList.toggle('is-open', !o); });

/* ---- header search ---- */
document.getElementById('header-search').addEventListener('submit', (e) => { e.preventDefault(); const q = document.getElementById('hs-q').value.trim(); location.hash = '#/search' + (q ? '?q=' + encodeURIComponent(q) : ''); });

/* ---- compare bar ---- */
const bar = document.getElementById('compare-bar');
function updateCompareBar() { const n = getCompare().length; const on = parseHash().path.startsWith('/compare'); bar.hidden = n === 0 || on; bar.querySelector('#cb-n').textContent = `${n} selected for comparison`; }
onCompare(updateCompareBar);
bar.querySelector('#cb-clear').addEventListener('click', () => { import('./compare-state.js').then((m) => { m.setCompare([]); }); });

/* ---- updates badge + notification on visit ---- */
function updateBadge() { const n = DB.ready ? unseenUpdates().length : 0; const el = document.getElementById('upd-badge'); el.textContent = n ? String(n) : ''; el.hidden = !n; const l = document.getElementById('upd-link'); l.setAttribute('aria-label', n ? `Updates, ${n} new` : 'Updates'); }
window.addEventListener('abnf:updates-seen', updateBadge);
function visitNotification() {
  if (!notifySupported() || Notification.permission !== 'granted' || !store.get('abnf.notify', false)) return;
  const n = unseenUpdates(); if (!n.length) return;
  try { new Notification('Abandoned but Not Forgotten', { body: `${n.length} new update${n.length === 1 ? '' : 's'}: ${n[0].title}` }); } catch { /* notifications unavailable */ }
}

/* ---- boot ---- */
window.addEventListener('hashchange', render);
(async function boot() {
  try {
    await loadData(); buildIndex();
    document.getElementById('hs-q').disabled = false;
    updateBadge(); render(); visitNotification();
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="wrap section"><h1 id="page-title">The content could not be loaded</h1><p>${esc(err.message)}</p><p>This site loads its data files with <code>fetch</code>, so it must be served over HTTP (for example <code>python3 -m http.server</code>) rather than opened as a file. Reload the page after starting a server.</p></div>`;
  }
})();
