// Reusable catalogue: filters + result grid (+ optional synchronised map). Reads records from the loaded data.
import { DB, eligible, eqById } from './data.js';
import { esc, statusChip, dateLabel, UNKNOWN, qs, typeIcon } from './util.js';
import { inCompare, toggleCompare, MAX_COMPARE, getCompare } from './compare-state.js';

export const launchYear = (e) => { const v = e.dates.launch && e.dates.launch.value; return v ? parseInt(v.slice(0, 4), 10) : null; };

export function applyFilters(list, f) {
  const q = (f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const from = f.from ? parseInt(f.from, 10) : null; const to = f.to ? parseInt(f.to, 10) : null;
  return list.filter((e) => {
    if (f.name && e.id !== f.name) return false;
    if (f.status && e.status_category !== f.status) return false;
    if (f.type && !e.type_categories.includes(f.type)) return false;
    if (f.dest && e.destination !== f.dest) return false;
    if (f.coords === 'yes' && !e.coordinates) return false;
    if (f.coords === 'no' && e.coordinates) return false;
    if (from !== null || to !== null) { const y = launchYear(e); if (y === null) return false; if (from !== null && y < from) return false; if (to !== null && y > to) return false; }
    if (q.length) { const hay = [e.name, e.mission, e.type_raw, e.type_categories.join(' '), e.destination_detail, e.physical_location, e.id].join(' ').toLowerCase(); if (!q.every((t) => hay.includes(t))) return false; }
    return true;
  });
}

export function coordText(e) {
  if (!e.coordinates) return 'Unavailable (no verified coordinate)';
  const c = e.coordinates; const lat = `${Math.abs(c.latitude)}°${c.latitude >= 0 ? 'N' : 'S'}`;
  return `${lat}, ${c.longitude}° lon. (${c.convention || 'convention not stated'})`;
}

export function cardHTML(e) {
  const on = inCompare(e.id);
  return `<article class="card eq-card" data-id="${esc(e.id)}">
    <div class="card__top">${typeIcon(e.type_categories[0])}<span class="eyebrow">${esc(e.type_categories.join(' · '))}</span></div>
    <h3 class="card__title"><a href="#/equipment/${esc(e.id)}">${esc(e.name)}</a></h3>
    <p class="card__chip">${statusChip(e.status_category)}</p>
    <dl class="kv kv--compact">
      <div><dt>Destination</dt><dd>${esc(e.destination)}</dd></div>
      <div><dt>Mission</dt><dd>${esc(e.mission)}</dd></div>
      <div><dt>Launch date</dt><dd>${esc(dateLabel(e.dates.launch))}</dd></div>
      <div><dt>Coordinates</dt><dd>${e.coordinates ? esc(coordText(e)) : '<span class="muted">Unavailable</span>'}</dd></div>
    </dl>
    <div class="card__actions"><a class="btn btn--small" href="#/equipment/${esc(e.id)}">View details<span class="sr-only"> of ${esc(e.name)}</span></a>
    <button type="button" class="btn btn--small btn--ghost" data-compare="${esc(e.id)}" aria-pressed="${on}">${on ? 'Remove from compare' : 'Add to compare'}<span class="sr-only"> ${esc(e.name)}</span></button></div>
  </article>`;
}

/** Mount a catalogue into `el`. opts: { dest (locked destination), params (URLSearchParams), basePath, onResults(list) } */
export function mountCatalogue(el, opts = {}) {
  const base = eligible().filter((e) => !opts.dest || e.destination === opts.dest);
  const p = opts.params || new URLSearchParams();
  const state = { q: p.get('q') || '', name: p.get('name') || '', status: p.get('status') || '', type: p.get('type') || '', dest: opts.dest || p.get('dest') || '', coords: p.get('coords') || '', from: p.get('from') || '', to: p.get('to') || '' };
  const names = [...base].sort((a, b) => a.name.localeCompare(b.name));
  const years = base.map(launchYear).filter((y) => y !== null);
  const minY = Math.min(...years), maxY = Math.max(...years);
  el.innerHTML = `
  <form class="filters" id="cat-filters" role="search" aria-label="Filter equipment catalogue" novalidate>
    <div class="filters__grid">
      <div class="field"><label for="f-q">Keyword</label><input id="f-q" type="search" name="q" placeholder="Name, mission, type, location" autocomplete="off"></div>
      <div class="field"><label for="f-name">Equipment name</label><select id="f-name" name="name"><option value="">All equipment (${base.length})</option>${names.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="f-status">Working status</label><select id="f-status" name="status"><option value="">All statuses</option>${DB.site.legend.map((l) => `<option value="${l.key}">${esc(l.label)}</option>`).join('')}</select></div>
      <div class="field"><label for="f-type">Equipment type</label><select id="f-type" name="type"><option value="">All types</option>${DB.types.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
      ${opts.dest ? '' : `<div class="field"><label for="f-dest">Destination</label><select id="f-dest" name="dest"><option value="">Moon and Mars</option><option>Moon</option><option>Mars</option></select></div>`}
      <div class="field"><label for="f-coords">Coordinates</label><select id="f-coords" name="coords"><option value="">Any</option><option value="yes">Sourced coordinates available</option><option value="no">Coordinates unavailable</option></select></div>
      <div class="field"><label for="f-from">Launch year from</label><input id="f-from" type="number" name="from" min="${minY}" max="${maxY}" placeholder="${minY}" inputmode="numeric"></div>
      <div class="field"><label for="f-to">Launch year to</label><input id="f-to" type="number" name="to" min="${minY}" max="${maxY}" placeholder="${maxY}" inputmode="numeric"></div>
    </div>
    <div class="filters__bar"><button type="button" class="btn btn--ghost" id="f-clear">Clear all filters</button>
      <details class="legend-details"><summary>Working-status colour key and definitions</summary>${legendHTML()}</details></div>
  </form>
  <p class="results-count" id="cat-count" role="status" aria-live="polite"></p>
  <div class="grid grid--cards" id="cat-grid"></div>`;
  const form = el.querySelector('#cat-filters');
  for (const [k, v] of Object.entries(state)) { const c = form.elements[k]; if (c) c.value = v; }
  const grid = el.querySelector('#cat-grid'); const count = el.querySelector('#cat-count');

  function render(updateUrl = true) {
    const res = applyFilters(base, state);
    count.textContent = `${res.length} of ${base.length} equipment record${base.length === 1 ? '' : 's'} shown`;
    grid.innerHTML = res.length ? res.map(cardHTML).join('') : `<div class="empty" role="alert"><h3>No equipment matches these filters</h3><p>Try removing a filter, widening the launch-year range, or clearing all filters.</p><button type="button" class="btn" data-clear>Clear all filters</button></div>`;
    if (opts.onResults) opts.onResults(res);
    if (updateUrl && opts.basePath) { const o = { ...state }; if (opts.dest) delete o.dest; history.replaceState(null, '', opts.basePath + qs(o)); }
  }
  const read = () => { for (const k of Object.keys(state)) { const c = form.elements[k]; if (c) state[k] = c.value.trim(); } };
  form.addEventListener('input', () => { read(); render(); });
  form.addEventListener('change', () => { read(); render(); });
  form.addEventListener('submit', (ev) => ev.preventDefault());
  const clear = () => { for (const k of Object.keys(state)) { const c = form.elements[k]; if (c) c.value = ''; state[k] = opts.dest && k === 'dest' ? opts.dest : ''; } render(); form.elements.q.focus(); };
  el.querySelector('#f-clear').addEventListener('click', clear);
  el.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-clear]')) return clear();
    const b = ev.target.closest('[data-compare]'); if (!b) return;
    const id = b.dataset.compare; const ok = toggleCompare(id);
    if (!ok) { count.textContent = `You can compare up to ${MAX_COMPARE} records. Remove one first.`; return; }
    const on = inCompare(id); b.setAttribute('aria-pressed', on); b.firstChild.textContent = on ? 'Remove from compare' : 'Add to compare';
  });
  render(false);
  return { state, render };
}

export function legendHTML() {
  return `<ul class="legend">${DB.site.legend.map((l) => `<li>${statusChip(l.key)}<span>${esc(l.definition)}</span></li>`).join('')}</ul>
  <p class="muted small">Mission outcome, current operational status and physical location are separate fields on every record. A successful outcome is not proof that hardware still operates.</p>`;
}

/** Schematic equirectangular plot of published landing-site coordinates. Not a surface map. */
export function mapHTML(dest, list) {
  const W = 720, H = 360;
  const pts = list.filter((e) => e.coordinates && e.destination === dest);
  const X = (lon) => { let l = lon; if (l > 180) l -= 360; return ((l + 180) / 360) * W; };
  const Y = (lat) => ((90 - lat) / 180) * H;
  let g = '';
  for (let lon = -180; lon <= 180; lon += 30) g += `<line x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="${H}" class="map__grid"/><text x="${X(lon) + 2}" y="${H - 4}" class="map__lbl">${lon}°</text>`;
  for (let lat = -90; lat <= 90; lat += 30) g += `<line x1="0" y1="${Y(lat)}" x2="${W}" y2="${Y(lat)}" class="map__grid"/><text x="3" y="${Y(lat) - 3}" class="map__lbl">${lat}°</text>`;
  const marks = pts.map((e) => { const x = X(e.coordinates.longitude), y = Y(e.coordinates.latitude); const flip = x > W - 190;
    return `<a href="#/equipment/${esc(e.id)}" class="map__pin" aria-label="${esc(e.name)}, landing-site coordinate ${esc(coordText(e))}"><circle cx="${x}" cy="${y}" r="7" class="pin pin--${e.status_category || 'none'}"/><text x="${x + (flip ? -11 : 11)}" y="${y + 4}" text-anchor="${flip ? 'end' : 'start'}" class="map__name">${esc(e.name)}</text></a>`; }).join('');
  const missing = list.filter((e) => e.destination === dest && !e.coordinates).length;
  return `<figure class="map"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Schematic plot of ${esc(dest)} landing-site coordinates, ${pts.length} marked"><rect width="${W}" height="${H}" class="map__bg"/>${g}${marks}</svg>
  <figcaption>Schematic latitude/longitude plot of ${pts.length} published landing-site coordinate${pts.length === 1 ? '' : 's'} (east-positive longitude shown −180° to +180°). It is not a surface map or imagery. ${missing} ${esc(dest)} record${missing === 1 ? '' : 's'} in the current results ${missing === 1 ? 'has' : 'have'} no verified coordinate and ${missing === 1 ? 'is' : 'are'} not plotted. Orbiters and moving rovers are never plotted from a fixed point.</figcaption></figure>`;
}
