// Home, destination, catalogue, equipment detail, mission views.
import { DB, eligible, eqById, stats, typeCounts } from './data.js';
import { esc, statusChip, dateLabel, dateNote, precisionText, UNKNOWN, fmtKey, fmtValue, extLink, typeIcon, num, qs, reducedMotion } from './util.js';
import { mountCatalogue, mapHTML, coordText, legendHTML, launchYear } from './catalogue.js';
import { getCompare } from './compare-state.js';

const h1 = (t, sub) => `<header class="page-head"><div class="wrap"><h1 id="page-title" tabindex="-1">${esc(t)}</h1>${sub ? `<p class="lead">${sub}</p>` : ''}</div></header>`;
export const wrap = (inner, cls = '') => `<div class="wrap ${cls}">${inner}</div>`;

/* ---------------- HOME ---------------- */
export function homeView() {
  const st = stats(); const tc = typeCounts(); const list = eligible();
  const moonN = list.filter((e) => e.destination === 'Moon').length, marsN = list.filter((e) => e.destination === 'Mars').length;
  const surf = st.surfaceRecords.length, cov = st.massRecords.length;
  const massVal = cov ? `${num(st.massKg)} kg` : 'Unavailable';
  const yearVal = st.earliestArtifactYear ?? 'Unavailable';
  const lm = DB.timeline.filter((e) => e.event_type === 'Landing / touchdown' && e.destination !== 'Planetary').slice(0, 3);
  const html = `
  <section class="home-cards" aria-labelledby="home-cards-h"><div class="wrap"><h2 id="home-cards-h" class="sr-only">Choose a destination</h2>
    <div class="home-cards__box">
      <a class="dest-card" href="#/moon"><span class="eyebrow">Destination</span><span class="dest-card__title">Explore Moon</span><span class="dest-card__text">Moon destination page with its eligible NASA equipment records.</span><span class="dest-card__count">${moonN} equipment records</span></a>
      <a class="dest-card" href="#/mars"><span class="eyebrow">Destination</span><span class="dest-card__title">Explore Mars</span><span class="dest-card__text">Mars destination page with its eligible NASA equipment records.</span><span class="dest-card__count">${marsN} equipment records</span></a>
      <a class="dest-card" href="#/planets"><span class="eyebrow">Destination</span><span class="dest-card__title">Explore Planets</span><span class="dest-card__text">Mission-level NASA stories beyond the Moon and Mars. Separate from the equipment catalogue.</span><span class="dest-card__count">${DB.planetary.missions.length} mission cards</span></a>
    </div></div></section>
  <section class="section" aria-labelledby="browse-h"><div class="wrap">
    <h2 id="browse-h">Browse equipment by their topic</h2>
    <p class="lead">Browse the Moon and Mars equipment catalogue by hardware type. Select a category to open a filtered grid, then choose an item to view its mission history, available specifications, status evidence, and sources.</p>
    <ul class="type-grid">${DB.types.map((t) => `<li><a class="type-card" href="#/catalogue${qs({ type: t })}">${typeIcon(t)}<span class="type-card__name">${esc(t)}</span><span class="type-card__n">${tc[t]} record${tc[t] === 1 ? '' : 's'}</span></a></li>`).join('')}</ul>
  </div></section>
  <section class="section section--tint" aria-labelledby="legacy-h"><div class="wrap">
    <h2 id="legacy-h">The Legacy at a Glance</h2>
    <div class="stats">
      <div class="stat"><span class="stat__label">Achieved equipment</span><span class="stat__value">${st.count}</span><span class="stat__note">Records loaded in the eligible Moon/Mars catalogue (a working subset, not a full inventory).</span></div>
      <div class="stat"><span class="stat__label">Estimated Abandoned mass</span><span class="stat__value">${massVal}${cov ? ' <span class="badge">partial</span>' : ''}</span><span class="stat__note">${cov ? `Sum of landed-vehicle masses for ${cov} of ${surf} records whose hardware remains on a surface. Other records have no comparable sourced mass, so this is not a total. <a href="#/about?sec=mass">How this is calculated</a>` : 'No comparable sourced mass values are loaded.'}</span></div>
      <div class="stat"><span class="stat__label">Earliest artifact year</span><span class="stat__value">${esc(yearVal)}</span><span class="stat__note">${st.earliestArtifactYear ? 'Earliest source-backed artifact year in the eligible dataset.' : 'The supplied dataset has no source-backed artifact-year field yet. A launch date is not used as a substitute.'}</span></div>
    </div></div></section>
  <section class="section" aria-labelledby="feat-h"><div class="wrap">
    <h2 id="feat-h">Featured equipment</h2>
    <div id="carousel" class="carousel" role="region" aria-roledescription="carousel" aria-label="Featured equipment"></div>
  </div></section>
  <section class="section section--tint" aria-labelledby="more-h"><div class="wrap">
    <h2 id="more-h">Keep exploring</h2>
    <div class="grid grid--3">
      <article class="panel"><h3>Timeline preview</h3><p class="muted">First recorded landings in the catalogue, with date precision as sourced.</p>
        <ol class="mini-list">${lm.map((e) => `<li><strong>${esc(dateLabel(e.date))}</strong> — ${esc(e.title)} <span class="muted">(${esc(e.mission)})</span></li>`).join('')}</ol>
        <p><a class="btn btn--small" href="#/timeline/nasa">Open NASA mission timeline</a></p></article>
      <article class="panel"><h3>Compare equipment</h3><p class="muted">Select up to four records and compare supported fields side by side. Missing values stay marked as unknown.</p><p><a class="btn btn--small" href="#/compare">Open comparison</a></p></article>
      <article class="panel"><h3>Take the quiz</h3><p class="muted">${DB.quiz.questions.length} questions, each with an explanation and a source link.</p><p><a class="btn btn--small" href="#/quiz">Start the quiz</a></p></article>
    </div>
    <h3 class="mt">Planetary mission highlights</h3>
    <div class="grid grid--3">${DB.planetary.missions.slice(0, 3).map((m) => `<article class="panel"><span class="eyebrow">${esc(m.target)}</span><h4><a href="#/planets/${esc(m.id)}">${esc(m.mission_name)}</a></h4><p class="muted">${esc(m.objective)}</p></article>`).join('')}</div>
  </div></section>`;
  return { title: 'Home', hero: true, html, mount: (el) => mountCarousel(el.querySelector('#carousel')) };
}

/* ---- featured carousel: centre card active, 10 s autoplay, continuous wrap, manual + pause controls ---- */
function mountCarousel(root) {
  const items = DB.site.featured_ids.map(eqById).filter(Boolean);
  if (!items.length) { root.innerHTML = '<p class="muted">No featured equipment is configured.</p>'; return; }
  let cur = 0, playing = !reducedMotion(), timer = null, hoverPause = false;
  root.innerHTML = `<div class="carousel__stage" aria-live="off">${items.map((e, i) => `<article class="slide" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${items.length}">
    <span class="eyebrow">${esc(e.type_categories[0])}</span><h3>${esc(e.name)}</h3>
    <p>${esc(e.mission_objective)}</p><p>${statusChip(e.status_category)}</p>
    <a class="btn btn--small" href="#/equipment/${esc(e.id)}" tabindex="-1">Explore equipment<span class="sr-only"> ${esc(e.name)}</span></a></article>`).join('')}</div>
  <div class="carousel__controls"><button type="button" class="btn btn--ghost btn--small" data-act="prev" aria-label="Previous equipment">&#8592; Previous</button>
    <button type="button" class="btn btn--ghost btn--small" data-act="toggle" aria-pressed="${playing}">${playing ? 'Pause' : 'Play'} autoplay</button>
    <button type="button" class="btn btn--ghost btn--small" data-act="next" aria-label="Next equipment">Next &#8594;</button>
    <span class="muted small" id="car-status" role="status"></span></div>`;
  const slides = [...root.querySelectorAll('.slide')]; const stage = root.querySelector('.carousel__stage');
  const status = root.querySelector('#car-status'); const tog = root.querySelector('[data-act=toggle]');
  function layout() {
    const n = items.length;
    slides.forEach((s, i) => {
      let off = ((i - cur) % n + n) % n; if (off > n / 2) off -= n; // shortest wrapped offset: last -> first continues smoothly
      const a = Math.abs(off); s.dataset.pos = off === 0 ? 'c' : off === -1 ? 'l' : off === 1 ? 'r' : 'x';
      s.style.setProperty('--off', off); s.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
      s.querySelector('a').tabIndex = off === 0 ? 0 : -1;
    });
    status.textContent = `Showing ${cur + 1} of ${items.length}: ${items[cur].name}`;
  }
  const go = (d) => { cur = ((cur + d) % items.length + items.length) % items.length; layout(); restart(); };
  function restart() { clearInterval(timer); if (playing && !hoverPause) timer = setInterval(() => { if (document.hidden) return; cur = (cur + 1) % items.length; layout(); }, 10000); }
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (b) { const a = b.dataset.act; if (a === 'prev') go(-1); else if (a === 'next') go(1); else { playing = !playing; tog.setAttribute('aria-pressed', playing); tog.textContent = `${playing ? 'Pause' : 'Play'} autoplay`; restart(); } return; }
    const s = ev.target.closest('.slide'); if (s && s.dataset.pos !== 'c' && !ev.target.closest('a')) { cur = +s.dataset.i; layout(); restart(); }
  });
  stage.addEventListener('mouseenter', () => { hoverPause = true; restart(); }); stage.addEventListener('mouseleave', () => { hoverPause = false; restart(); });
  root.addEventListener('focusin', () => { hoverPause = true; restart(); }); root.addEventListener('focusout', () => { hoverPause = false; restart(); });
  root.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowLeft') go(-1); if (ev.key === 'ArrowRight') go(1); });
  layout(); restart();
  root._cleanup = () => clearInterval(timer);
}

/* ---------------- DESTINATION (Moon / Mars) ---------------- */
export function destinationView(dest, params) {
  const list = eligible().filter((e) => e.destination === dest);
  const missions = DB.missions.filter((m) => m.destination === dest);
  const ev = DB.timeline.filter((e) => e.destination === dest);
  const html = `${h1(`Explore ${dest}`, `NASA-led or NASA-operated ${dest} mission hardware in the current working catalogue: <strong>${list.length}</strong> records across <strong>${missions.length}</strong> missions. This is a working subset, not a complete inventory.`)}
  <section class="section"><div class="wrap"><h2>Where the hardware is</h2><div id="dest-map"></div></div></section>
  <section class="section section--tint"><div class="wrap"><h2>${esc(dest)} timeline</h2><p class="muted">${ev.length} source-linked events from ${missions.length} missions, earliest ${esc(dateLabel(ev[0] && ev[0].date))}, latest ${esc(dateLabel(ev[ev.length - 1] && ev[ev.length - 1].date))}.</p>
    <p><a class="btn" href="#/timeline/${dest.toLowerCase()}">Open the ${esc(dest)} timeline</a></p></div></section>
  <section class="section"><div class="wrap"><h2>${esc(dest)} equipment catalogue</h2><div id="dest-cat"></div></div></section>
  <section class="section section--tint"><div class="wrap"><h2>${esc(dest)} missions</h2><ul class="link-list">${missions.map((m) => `<li><a href="#/mission/${esc(m.id)}">${esc(m.name)}</a> <span class="muted">— ${m.equipment_ids.length} equipment record${m.equipment_ids.length === 1 ? '' : 's'}</span></li>`).join('')}</ul></div></section>`;
  return { title: `Explore ${dest}`, html, mount(el) {
    const mapEl = el.querySelector('#dest-map'); mapEl.innerHTML = mapHTML(dest, list);
    mountCatalogue(el.querySelector('#dest-cat'), { dest, params, basePath: `#/${dest.toLowerCase()}`, onResults: (res) => { mapEl.innerHTML = mapHTML(dest, res); } });
  } };
}

/* ---------------- CATALOGUE ---------------- */
export function catalogueView(params) {
  return { title: 'Equipment catalogue', html: `${h1('Equipment catalogue', 'NASA-led or NASA-operated Moon and Mars mission hardware. Combine filters to narrow the list; all filters apply together (AND). The Planetary Exploration section is separate and is never part of this catalogue.')}
  <section class="section"><div class="wrap"><div id="cat"></div></div></section>`,
    mount: (el) => mountCatalogue(el.querySelector('#cat'), { params, basePath: '#/catalogue' }) };
}

/* ---------------- EQUIPMENT DETAIL ---------------- */
const row = (k, v, note = '') => `<div><dt>${esc(k)}</dt><dd>${v}${note ? `<span class="note">${esc(note)}</span>` : ''}</dd></div>`;
const dRow = (k, d) => row(k, esc(dateLabel(d)) + (d && d.precision && d.precision !== 'unknown' && d.precision !== 'conflicting' ? ` <span class="muted small">(${esc(precisionText(d))})</span>` : ''), dateNote(d));
const list = (arr) => (arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(typeof x === 'string' ? x : fmtValue(x))}</li>`).join('')}</ul>` : '');

export function equipmentView(id) {
  const e = eqById(id);
  if (!e) return notFound('Equipment record', id, '#/catalogue', 'Back to the equipment catalogue');
  const m = DB.missionById.get(e.mission_id);
  const mass = e.mass ? `${num(e.mass.value)} ${esc(e.mass.unit)}` : esc(UNKNOWN);
  const specs = Object.entries(e.specs || {});
  const dims = e.dimensions && typeof e.dimensions === 'object' ? fmtValue(e.dimensions) : null;
  const events = DB.timeline.filter((t) => t.equipment_ids.includes(e.id));
  const sections = [['overview', 'Overview'], ['mission', 'Mission'], ['dates', 'Dates'], ['location', 'Location'], ['tech', 'Technical details'], ['history', 'History'], ['contrib', 'Discoveries'], ['evidence', 'Sources and evidence']];
  const html = `<header class="page-head"><div class="wrap"><nav aria-label="Breadcrumb" class="crumbs"><a href="#/">Home</a> / <a href="#/${e.destination.toLowerCase()}">${esc(e.destination)}</a> / <span>${esc(e.name)}</span></nav>
    <h1 id="page-title" tabindex="-1">${esc(e.name)}</h1><p class="lead">${statusChip(e.status_category)} <span class="muted">${esc(e.type_categories.join(' · '))} · ${esc(e.destination)} · ${esc(e.mission)}</span></p>
    <p><button type="button" class="btn btn--small" data-compare-detail="${esc(e.id)}">Add to comparison</button></p></div></header>
  <div class="wrap detail"><nav class="detail__nav" aria-label="On this page"><ul>${sections.map(([k, t]) => `<li><button type="button" data-scroll="sec-${k}">${t}</button></li>`).join('')}</ul></nav>
  <div class="detail__body">
    <section id="sec-overview" class="dsec"><h2>Overview</h2><p>${esc(e.mission_objective)}</p>
      <p><strong>Mission outcome (as recorded):</strong> ${esc(e.mission_outcome)}</p>
      <p class="muted small">Mission outcome, current operational status and physical location are separate facts. One does not prove another.</p></section>
    <section id="sec-mission" class="dsec"><h2>Mission information</h2><dl class="kv">
      ${row('Mission', m ? `<a href="#/mission/${esc(m.id)}">${esc(e.mission)}</a>` : esc(e.mission))}
      ${row('Agency', esc(e.agency))}${row('Destination', esc(e.destination_detail))}${row('Crew', esc(e.crew))}
      ${row('Equipment type (as recorded)', esc(e.type_raw))}
      ${row('Mission objective', esc(e.mission_objective))}${row('Mission outcome', esc(e.mission_outcome))}
      ${row('Mission lifecycle class', esc(e.mission_status_class))}
      ${row('Operational status', esc(e.operational_status))}
      ${row('Working-status category', statusChip(e.status_category), e.status_category_basis)}
      ${row('Hardware status class', esc(e.hardware_status_class))}</dl></section>
    <section id="sec-dates" class="dsec"><h2>Dates</h2><dl class="kv">${dRow('Launch', e.dates.launch)}${dRow('Arrival / landing', e.dates.arrival_or_landing)}${dRow('Last confirmed communication', e.dates.last_communication)}${dRow('Mission end', e.dates.mission_end)}</dl>
      <p class="muted small">Launch, arrival or landing, last contact and formal mission end are different events and are not merged.</p></section>
    <section id="sec-location" class="dsec"><h2>Location</h2><dl class="kv">
      ${row('Physical location category', esc(e.physical_location))}
      ${row('Sourced coordinate', e.coordinates ? esc(coordText(e)) : '<span class="muted">Unavailable: no verified coordinate in the dataset</span>', e.coordinates && e.coordinates.reference ? 'Reference: ' + e.coordinates.reference : '')}
      ${row('Coordinate precision / meaning', esc(e.coordinate_note || UNKNOWN))}${row('Map status (data field)', esc(e.map_location_status))}
      ${row('Remaining hardware', e.remaining_hardware ? esc(e.remaining_hardware) : esc(UNKNOWN))}</dl>
      <p class="muted small">A landing-site or target coordinate is not the current position of a moving rover, and an orbiter has no fixed surface coordinate.</p></section>
    <section id="sec-tech" class="dsec"><h2>Technical details</h2><dl class="kv">
      ${row('Mass', mass, e.mass ? `Scope/basis: ${e.mass.basis}` : 'No sourced mass in the dataset (not zero).')}
      ${row('Dimensions', dims ? esc(dims) : esc(UNKNOWN))}${row('Power source', esc(e.power_source || UNKNOWN))}${row('Mobility', esc(e.mobility || UNKNOWN))}
      ${specs.map(([k, v]) => row(fmtKey(k), esc(fmtValue(v)))).join('')}</dl>
      ${e.instruments.length ? `<h3>Scientific instruments (as recorded)</h3>${list(e.instruments)}` : '<p class="muted">No instrument list in the dataset for this record.</p>'}
      ${e.associated.length ? `<h3>Associated components</h3>${list(e.associated)}` : ''}</section>
    <section id="sec-history" class="dsec"><h2>History and important events</h2>${e.history.length ? `<ol class="events">${e.history.map((h) => `<li><strong>${esc(h.date)}</strong> — ${esc(h.event)}${h.source_url ? ` ${extLink(h.source_url, 'source')}` : ''}</li>`).join('')}</ol>` : '<p class="muted">No events recorded.</p>'}
      <p><a href="#/timeline/${e.destination.toLowerCase()}?equip=${esc(e.id)}">Open on the ${esc(e.destination)} timeline</a></p></section>
    <section id="sec-contrib" class="dsec"><h2>Discoveries and contributions</h2>${e.discoveries.length ? list(e.discoveries) : '<p class="muted">None recorded.</p>'}</section>
    <section id="sec-evidence" class="dsec"><h2>Sources and evidence</h2>
      <p><strong>Record-level source:</strong> ${extLink(e.source_url)} <span class="muted small">(checked ${esc(e.source_checked)}). ${esc(e.source_note)}</span></p>
      <p class="muted small">A record-level source does not verify every field. Claim-level evidence is listed below where the dataset provides it.</p>
      ${e.claims.length ? `<table class="table"><caption class="sr-only">Claim-level evidence</caption><thead><tr><th scope="col">Claim</th><th scope="col">Confidence</th><th scope="col">Source</th></tr></thead><tbody>${e.claims.map((c) => `<tr><td>${esc(c.claim)}</td><td>${esc(c.confidence || 'Not stated')}</td><td>${c.source_url ? extLink(c.source_url, 'Open') : ''}</td></tr>`).join('')}</tbody></table>` : ''}
      <dl class="kv">${row('Record confidence', esc(e.confidence), e.confidence_notes)}${row('Review state', esc(e.review_state))}${row('Last audited', esc(e.last_audited))}</dl>
      ${e.uncertainty_notes.length ? `<h3>Uncertainty notes</h3>${list(e.uncertainty_notes)}` : ''}
      ${e.missing_data_notes.length ? `<h3>Missing data</h3>${list(e.missing_data_notes)}` : ''}
      ${e.audit_flags.length ? `<h3>Open audit flags</h3>${list(e.audit_flags)}` : ''}
      <p class="muted small">No image is shown for this record: no exact image asset with a verified credit and reuse review is available yet.</p></section>
  </div></div>`;
  return { title: e.name, html, mount(el) {
    el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-scroll]'); if (b) { const t = el.querySelector('#' + b.dataset.scroll); if (t) { t.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } } });
    el.querySelector('[data-compare-detail]').addEventListener('click', () => { location.hash = `#/compare?ids=${[...new Set([...getCompare(), e.id])].slice(0, 4).join(',')}`; });
  } };
}

/* ---------------- MISSION (Moon/Mars equipment missions) ---------------- */
export function missionView(id) {
  const m = DB.missionById.get(id); if (!m) return notFound('Mission', id, '#/missions', 'Back to NASA Space Missions');
  const eq = m.equipment_ids.map(eqById); const ev = DB.timeline.filter((t) => t.mission_id === m.id);
  return { title: m.name, html: `${h1(m.name, `${esc(m.agency)} · ${esc(m.destination)} mission`)}
  <section class="section"><div class="wrap"><h2>Objective</h2><p>${esc(m.objective)}</p><p>${extLink(m.source_url, 'NASA source recorded for this mission')} <span class="muted small">(record-level)</span></p>
  <h2>Equipment records</h2><div class="grid grid--cards">${eq.map((e) => `<article class="card"><h3 class="card__title"><a href="#/equipment/${esc(e.id)}">${esc(e.name)}</a></h3><p>${statusChip(e.status_category)}</p><p class="muted small">${esc(e.type_categories.join(' · '))}</p></article>`).join('')}</div>
  <h2>Mission events</h2><ol class="events">${ev.map((t) => `<li><strong>${esc(dateLabel(t.date))}</strong> — ${esc(t.title)} <span class="muted small">(${esc(t.event_type)})</span></li>`).join('')}</ol></div></section>` };
}

export function missionsListView(params) {
  const rows = [...DB.missions.map((m) => ({ kind: 'm', id: m.id, name: m.name, dest: m.destination, n: m.equipment_ids.length, info: `${m.equipment_ids.length} equipment record${m.equipment_ids.length === 1 ? '' : 's'}`, href: `#/mission/${m.id}` })),
    ...DB.planetary.missions.map((m) => ({ kind: 'p', id: m.id, name: m.mission_name, dest: m.target, info: m.mission_status, href: `#/planets/${m.id}` }))].sort((a, b) => a.name.localeCompare(b.name));
  return { title: 'NASA Space Missions', html: `${h1('NASA Space Missions', 'Missions behind the catalogue records (Moon and Mars) and the separate planetary mission cards. Only Moon and Mars missions link to equipment records.')}
  <section class="section"><div class="wrap"><div class="filters"><div class="filters__grid"><div class="field"><label for="m-q">Filter missions</label><input id="m-q" type="search" placeholder="Mission or destination"></div>
  <div class="field"><label for="m-k">Section</label><select id="m-k"><option value="">All</option><option value="m">Moon and Mars (equipment)</option><option value="p">Planetary exploration</option></select></div></div></div>
  <p class="results-count" id="m-count" role="status" aria-live="polite"></p>
  <div class="table-wrap"><table class="table"><thead><tr><th scope="col">Mission</th><th scope="col">Destination / target</th><th scope="col">Section</th><th scope="col">Details</th></tr></thead><tbody id="m-body"></tbody></table></div></div></section>`,
    mount(el) {
      const q = el.querySelector('#m-q'), k = el.querySelector('#m-k'), body = el.querySelector('#m-body'), c = el.querySelector('#m-count');
      const draw = () => { const t = q.value.toLowerCase().trim(); const r = rows.filter((x) => (!k.value || x.kind === k.value) && (!t || (x.name + ' ' + x.dest).toLowerCase().includes(t)));
        c.textContent = `${r.length} of ${rows.length} missions shown`;
        body.innerHTML = r.length ? r.map((x) => `<tr><th scope="row"><a href="${x.href}">${esc(x.name)}</a></th><td>${esc(x.dest)}</td><td>${x.kind === 'm' ? 'Moon/Mars equipment' : 'Planetary exploration'}</td><td>${esc(x.info)}</td></tr>`).join('') : '<tr><td colspan="4">No missions match. Clear the filter to see all missions.</td></tr>'; };
      q.addEventListener('input', draw); k.addEventListener('change', draw); draw();
    } };
}

export function notFound(what, id, href, label) {
  return { title: 'Not found', html: `${h1('Not found', `The ${esc(what)} "${esc(id)}" does not exist.`)}<div class="wrap section"><p><a class="btn" href="${href}">${esc(label)}</a> <a class="btn btn--ghost" href="#/search">Search the site</a></p></div>` };
}
