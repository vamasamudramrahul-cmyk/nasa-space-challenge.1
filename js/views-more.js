// Planets, timeline, compare, quiz, glossary, sources, about, updates, search views.
import { DB, eqById, eligible, stats } from './data.js';
import { esc, statusChip, dateLabel, dateNote, UNKNOWN, fmtValue, extLink, num, qs, debounce, store, reducedMotion } from './util.js';
import { coordText, legendHTML } from './catalogue.js';
import { getCompare, setCompare, MAX_COMPARE } from './compare-state.js';
import { search, SEARCH_TYPES, indexSize } from './search.js';
import { notFound } from './views-core.js';

const h1 = (t, sub) => `<header class="page-head"><div class="wrap"><h1 id="page-title" tabindex="-1">${esc(t)}</h1>${sub ? `<p class="lead">${sub}</p>` : ''}</div></header>`;

/* ---------------- PLANETARY EXPLORATION ---------------- */
const BODIES = [['Mercury', ['mercury']], ['Venus', ['venus']], ['Jupiter', ['jupiter']], ['Saturn', ['saturn']], ['Uranus', ['uranus']], ['Neptune', ['neptune']], ['Pluto and the Kuiper Belt', ['pluto', 'kuiper']]];
const hitsBody = (m, kw) => kw.some((k) => m.target.toLowerCase().includes(k));

export function planetsView(params) {
  const sel = params.get('body') || '';
  const ms = DB.planetary.missions.filter((m) => { if (!sel) return true; const b = BODIES.find((x) => x[0] === sel); return b ? hitsBody(m, b[1]) : true; });
  const html = `${h1('Planetary Exploration', 'Explore NASA mission stories across the Solar System beyond the detailed Moon and Mars equipment catalogue.')}
  <section class="section"><div class="wrap"><p class="notice">These are mission-level cards, not equipment records. They are not part of the equipment catalogue or its filters. ${esc(DB.planetary.scope_note)}</p>
  <div class="chips" role="group" aria-label="Filter by destination"><a class="pill${sel ? '' : ' is-on'}" href="#/planets" ${sel ? '' : 'aria-current="true"'}>All (${DB.planetary.missions.length})</a>
   ${BODIES.map(([n, kw]) => { const c = DB.planetary.missions.filter((m) => hitsBody(m, kw)).length; return `<a class="pill${sel === n ? ' is-on' : ''}" href="#/planets?body=${encodeURIComponent(n)}" ${sel === n ? 'aria-current="true"' : ''}>${esc(n)} (${c})</a>`; }).join('')}</div>
  <p class="results-count" role="status" aria-live="polite">${ms.length} mission card${ms.length === 1 ? '' : 's'} shown</p>
  <div class="grid grid--cards">${ms.length ? ms.map(planetCard).join('') : '<div class="empty"><h3>No mission cards for this destination</h3><p>No card in the supplied data targets it. <a href="#/planets">Show all cards</a></p></div>'}</div></div></section>`;
  return { title: 'Planetary Exploration', html };
}
const planetCard = (m) => `<article class="card"><span class="eyebrow">${esc(m.target)}</span><h3 class="card__title"><a href="#/planets/${esc(m.id)}">${esc(m.mission_name)}</a></h3>
  <p class="muted small">${esc(m.mission_type)} · ${esc(m.mission_status)}</p><p>${esc(m.objective)}</p><p><a class="btn btn--small" href="#/planets/${esc(m.id)}">Read the mission story<span class="sr-only"> of ${esc(m.mission_name)}</span></a></p></article>`;

export function planetView(id) {
  const m = DB.planetaryById.get(id); if (!m) return notFound('Planetary mission', id, '#/planets', 'Back to Planetary Exploration');
  const d = m.dates || {}; const rows = [['Launch', d.launch_date], ['Arrival', d.arrival_date], ['Mission end', d.mission_end_date]].filter(([, v]) => v);
  const ev = DB.timeline.filter((e) => e.mission_id === m.id);
  const srcs = [['Official NASA mission page', m.official_source_url], ['Status source', m.status_source_url], ['Recent status source', m.recent_status_source_url], ['End-of-mission source', m.official_end_of_mission_source_url], ['Current position source', m.current_position_source_url]].filter(([, u]) => u);
  return { title: m.mission_name, html: `<header class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/planets">Planetary Exploration</a> / <span>${esc(m.mission_name)}</span></nav><h1 id="page-title" tabindex="-1">${esc(m.mission_name)}</h1><p class="lead"><span class="muted">${esc(m.target)} · ${esc(m.mission_type)}</span></p></div></header>
  <section class="section"><div class="wrap narrow"><p class="notice">Mission-level story. It is not an equipment record and is not part of the Moon/Mars equipment catalogue.</p>
   <h2>Objective</h2><p>${esc(m.objective)}</p><h2>Summary</h2><p>${esc(m.summary)}</p>
   <h2>Status and dates</h2><dl class="kv"><div><dt>Mission status (as supplied)</dt><dd>${esc(m.mission_status)}<span class="note">${m.status_checked_as_of ? `Checked as of ${esc(m.status_checked_as_of)}. ` : ''}Time-sensitive: re-check the NASA page before relying on it.</span></dd></div>
   ${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(dateLabel(v))}${dateNote(v) ? `<span class="note">${esc(dateNote(v))}</span>` : ''}</dd></div>`).join('')}
   ${m.date_note ? `<div><dt>Date note</dt><dd>${esc(m.date_note)}</dd></div>` : ''}${m.status_note ? `<div><dt>Status note</dt><dd>${esc(m.status_note)}</dd></div>` : ''}</dl>
   ${ev.length ? `<h2>Events</h2><ol class="events">${ev.map((e) => `<li><strong>${esc(dateLabel(e.date))}</strong> — ${esc(e.title)} <span class="muted small">(${esc(e.event_type)})</span></li>`).join('')}</ol><p><a href="#/timeline/nasa?mission=${esc(m.id)}">Open on the NASA mission timeline</a></p>` : ''}
   <h2>Sources</h2><ul>${srcs.map(([t, u]) => `<li>${esc(t)}: ${extLink(u)}</li>`).join('')}</ul>
   <p class="muted small">No image is shown: no specific image asset with a verified credit and reuse review is available yet.</p></div></section>` };
}

/* ---------------- TIMELINE ---------------- */
const EV_STYLE = { 'Launch': ['t-launch', '▲'], 'Arrival / orbital insertion': ['t-arrive', '◆'], 'Landing / touchdown': ['t-land', '▼'], 'Deployment / release': ['t-deploy', '■'], 'Major mission operation': ['t-op', '●'],
  'Scientific discovery / result': ['t-sci', '★'], 'Last confirmed contact': ['t-contact', '✕'], 'Mission end / retirement / final shutdown': ['t-end', '■■'] };
export const EVENT_TYPES = Object.keys(EV_STYLE);

export function timelineView(kind, params) {
  const titles = { moon: 'Moon timeline', mars: 'Mars timeline', nasa: 'NASA mission timeline' };
  if (!titles[kind]) return notFound('Timeline', kind, '#/timeline/nasa', 'Open the NASA mission timeline');
  const base = DB.timeline.filter((e) => kind === 'nasa' || e.destination.toLowerCase() === kind);
  const missions = [...new Map(base.map((e) => [e.mission_id, e.mission])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const ys = base.map((e) => +e.date.value.slice(0, 4)); const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const f = { type: params.get('type') || '', mission: params.get('mission') || '', from: params.get('from') || '', to: params.get('to') || '', equip: params.get('equip') || '' };
  const focus = params.get('event') || '';
  const html = `${h1(titles[kind], kind === 'nasa' ? 'Source-linked events for Moon and Mars equipment records and the separate planetary mission cards, in date order. Dates keep the precision the source supports.' : `Source-linked ${kind === 'moon' ? 'Moon' : 'Mars'} events from the equipment records, in date order. Dates keep the precision the source supports.`)}
  <section class="section"><div class="wrap">
   <nav class="tabs" aria-label="Timeline views">${[['moon', 'Moon'], ['mars', 'Mars'], ['nasa', 'NASA mission']].map(([k, t]) => `<a class="tab${k === kind ? ' is-on' : ''}" href="#/timeline/${k}" ${k === kind ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
   <form class="filters" id="tl-f" novalidate><div class="filters__grid">
    <div class="field"><label for="tl-type">Event type</label><select id="tl-type" name="type"><option value="">All event types</option>${EVENT_TYPES.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
    <div class="field"><label for="tl-mission">Mission</label><select id="tl-mission" name="mission"><option value="">All missions</option>${missions.map(([i, n]) => `<option value="${esc(i)}">${esc(n)}</option>`).join('')}</select></div>
    <div class="field"><label for="tl-from">From year</label><input id="tl-from" name="from" type="number" min="${y0}" max="${y1}" placeholder="${y0}"></div>
    <div class="field"><label for="tl-to">To year</label><input id="tl-to" name="to" type="number" min="${y0}" max="${y1}" placeholder="${y1}"></div></div>
    <div class="filters__bar"><button type="button" class="btn btn--ghost" id="tl-clear">Clear filters</button></div></form>
   <h2 class="h3">Event type key</h2><ul class="legend legend--inline">${EVENT_TYPES.map((t) => `<li><span class="ev-key ${EV_STYLE[t][0]}" aria-hidden="true">${EV_STYLE[t][1]}</span>${esc(t)}</li>`).join('')}</ul>
   <p class="muted small">Event-type colours are separate from the working-status colours (green, yellow, red) and always come with a symbol and a text label.</p>
   <p class="results-count" id="tl-count" role="status" aria-live="polite"></p>
   <div class="rail-ctl"><button type="button" class="btn btn--small btn--ghost" data-rail="-1">&#8592; Earlier</button><button type="button" class="btn btn--small btn--ghost" data-rail="1">Later &#8594;</button></div>
   <div class="rail" id="tl-rail" tabindex="0" role="region" aria-label="Timeline events, scroll horizontally"></div></div></section>`;
  return { title: titles[kind], html, mount(el) {
    const form = el.querySelector('#tl-f'), rail = el.querySelector('#tl-rail'), cnt = el.querySelector('#tl-count');
    for (const k of Object.keys(f)) if (form.elements[k]) form.elements[k].value = f[k];
    const draw = (upd = true) => {
      for (const k of Object.keys(f)) if (form.elements[k]) f[k] = form.elements[k].value;
      const a = f.from ? +f.from : null, b = f.to ? +f.to : null;
      const res = base.filter((e) => (!f.type || e.event_type === f.type) && (!f.mission || e.mission_id === f.mission) && (!f.equip || e.equipment_ids.includes(f.equip)) && (a === null || +e.date.value.slice(0, 4) >= a) && (b === null || +e.date.value.slice(0, 4) <= b));
      cnt.textContent = `${res.length} of ${base.length} events shown`;
      let lastY = '';
      rail.innerHTML = res.length ? `<ol class="rail__list">${res.map((e) => { const y = e.date.value.slice(0, 4); const first = y !== lastY; lastY = y; const [cls, sym] = EV_STYLE[e.event_type];
        const eq = e.equipment_ids.map((id) => eqById(id)).filter(Boolean);
        return `<li class="ev ${cls}${focus === e.id ? ' is-focus' : ''}" id="${esc(e.id)}">${first ? `<span class="ev__year">${y}</span>` : '<span class="ev__year ev__year--ghost" aria-hidden="true"></span>'}
        <div class="ev__card"><span class="ev__type"><span class="ev-key ${cls}" aria-hidden="true">${sym}</span>${esc(e.event_type)}</span><strong class="ev__date">${esc(dateLabel(e.date))}</strong>
        <p>${esc(e.title)}</p><p class="muted small">${eq.length ? eq.map((q) => `<a href="#/equipment/${esc(q.id)}">${esc(q.name)}</a>`).join(', ') : `<a href="#/planets/${esc(e.mission_id)}">${esc(e.mission)}</a>`}</p>
        <p class="small">${extLink(e.source_url, 'Source')} <span class="muted">(${esc(e.source_scope)})</span></p></div></li>`; }).join('')}</ol>`
        : '<div class="empty"><h3>No events match these filters</h3><p>Widen the year range or clear the filters.</p></div>';
      if (upd) history.replaceState(null, '', `#/timeline/${kind}${qs({ ...f, event: '' })}`);
    };
    form.addEventListener('input', () => draw()); form.addEventListener('change', () => draw()); form.addEventListener('submit', (e) => e.preventDefault());
    el.querySelector('#tl-clear').addEventListener('click', () => { for (const k of Object.keys(f)) if (form.elements[k]) form.elements[k].value = ''; draw(); });
    el.querySelectorAll('[data-rail]').forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: +b.dataset.rail * rail.clientWidth * 0.8, behavior: reducedMotion() ? 'auto' : 'smooth' })));
    rail.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') rail.scrollBy({ left: 160 }); if (e.key === 'ArrowLeft') rail.scrollBy({ left: -160 }); });
    draw(false);
    const t = focus && rail.querySelector('#' + CSS.escape(focus)); if (t) t.scrollIntoView({ inline: 'center', block: 'nearest' });
  } };
}

/* ---------------- COMPARE ---------------- */
export function compareView(params) {
  const fromUrl = (params.get('ids') || '').split(',').filter((id) => eqById(id));
  if (fromUrl.length) setCompare([...new Set([...getCompare(), ...fromUrl])].slice(0, MAX_COMPARE));
  const html = `${h1('Compare equipment', `Choose two to ${MAX_COMPARE} records. Values the dataset does not have are shown as "${UNKNOWN}", never as zero.`)}
  <section class="section"><div class="wrap"><fieldset class="picker"><legend>Select equipment (up to ${MAX_COMPARE})</legend>
   <div class="picker__grid">${eligible().map((e) => `<label class="check"><input type="checkbox" value="${esc(e.id)}"> <span>${esc(e.name)} <span class="muted small">(${esc(e.destination)})</span></span></label>`).join('')}</div>
   <p><button type="button" class="btn btn--ghost btn--small" id="cmp-clear">Clear selection</button></p></fieldset>
   <p class="results-count" id="cmp-msg" role="status" aria-live="polite"></p><div id="cmp-out"></div></div></section>`;
  return { title: 'Compare', html, mount(el) {
    const boxes = [...el.querySelectorAll('input[type=checkbox]')], out = el.querySelector('#cmp-out'), msg = el.querySelector('#cmp-msg');
    const sync = () => { const ids = getCompare(); boxes.forEach((b) => { b.checked = ids.includes(b.value); b.disabled = !b.checked && ids.length >= MAX_COMPARE; }); draw(); };
    function draw() {
      const recs = getCompare().map(eqById).filter(Boolean);
      msg.textContent = recs.length ? `${recs.length} selected` : '';
      if (recs.length < 2) { out.innerHTML = `<div class="empty"><h3>Select at least two records</h3><p>${recs.length ? 'Choose one more record to start comparing.' : 'Use the list above, or add records from the catalogue with "Add to compare".'}</p></div>`; return; }
      const cell = (e, v, src = true) => `<td>${v}${src ? ` <a class="src" href="${esc(e.source_url)}" target="_blank" rel="noopener noreferrer" title="Record-level source">source<span class="sr-only"> (record-level, opens in a new tab) for ${esc(e.name)}</span></a>` : ''}</td>`;
      const U = `<span class="unknown">${esc(UNKNOWN)}</span>`;
      const rows = [
        ['Destination', (e) => esc(e.destination_detail)], ['Equipment type', (e) => esc(e.type_categories.join(' · '))], ['Mission', (e) => esc(e.mission)],
        ['Working-status category', (e) => statusChip(e.status_category)], ['Operational status (as recorded)', (e) => esc(e.operational_status)], ['Mission outcome', (e) => esc(e.mission_outcome)],
        ['Physical location', (e) => esc(e.physical_location)],
        ['Launch', (e) => esc(dateLabel(e.dates.launch))], ['Arrival / landing', (e) => esc(dateLabel(e.dates.arrival_or_landing))], ['Last confirmed communication', (e) => (e.dates.last_communication ? esc(dateLabel(e.dates.last_communication)) : U)], ['Mission end', (e) => (e.dates.mission_end ? esc(dateLabel(e.dates.mission_end)) : U)],
        ['Mass and its scope', (e) => (e.mass ? `${num(e.mass.value)} ${esc(e.mass.unit)}<br><span class="small muted">Scope: ${esc(e.mass.basis)}</span>` : U)],
        ['Dimensions', (e) => (e.dimensions && typeof e.dimensions === 'object' ? esc(fmtValue(e.dimensions)) : U)], ['Power source', (e) => (e.power_source ? esc(e.power_source) : U)], ['Mobility', (e) => (e.mobility ? esc(e.mobility) : U)],
        ['Remaining hardware', (e) => (e.remaining_hardware ? esc(e.remaining_hardware) : U)], ['Sourced coordinate', (e) => (e.coordinates ? esc(coordText(e)) : `<span class="unknown">Unavailable</span>`)],
      ];
      const scopes = new Set(recs.filter((e) => e.mass).map((e) => e.mass.basis));
      out.innerHTML = `${scopes.size > 1 ? '<p class="notice">Mass values here use different scopes (for example rover vs launch vs landing mass). Do not treat them as equivalent.</p>' : ''}
      <div class="table-wrap"><table class="table table--compare"><caption class="sr-only">Comparison of selected equipment</caption><thead><tr><th scope="col">Field</th>${recs.map((e) => `<th scope="col"><a href="#/equipment/${esc(e.id)}">${esc(e.name)}</a></th>`).join('')}</tr></thead>
      <tbody>${rows.map(([k, fn]) => `<tr><th scope="row">${esc(k)}</th>${recs.map((e) => cell(e, fn(e), k !== 'Working-status category')).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="muted small">Source links point to each record's NASA source; a record-level source does not verify every field. Open the detail page for claim-level evidence.</p>`;
      history.replaceState(null, '', '#/compare' + qs({ ids: recs.map((e) => e.id).join(',') }));
    }
    boxes.forEach((b) => b.addEventListener('change', () => { const ids = boxes.filter((x) => x.checked).map((x) => x.value); setCompare(ids); sync(); }));
    el.querySelector('#cmp-clear').addEventListener('click', () => { setCompare([]); sync(); history.replaceState(null, '', '#/compare'); });
    sync();
  } };
}

/* ---------------- QUIZ ---------------- */
export function quizView() {
  const Q = DB.quiz.questions;
  return { title: 'Quiz', html: `${h1('Quiz', `${Q.length} questions built from the catalogue records. Each answer includes an explanation and a source link.`)}<section class="section"><div class="wrap narrow"><p class="muted small">${esc(DB.quiz.note)}</p><div id="quiz"></div></div></section>`,
    mount(el) {
      const root = el.querySelector('#quiz'); let i = 0, score = 0, answered = false;
      function show() {
        if (i >= Q.length) { root.innerHTML = `<div class="panel" tabindex="-1" id="qz-end"><h2>Your score: ${score} of ${Q.length}</h2><p>${score === Q.length ? 'Every answer correct.' : 'Review the explanations and sources, then try again.'}</p><button class="btn" id="qz-restart">Restart quiz</button></div>`; root.querySelector('#qz-end').focus(); root.querySelector('#qz-restart').onclick = () => { i = 0; score = 0; show(); }; return; }
        const q = Q[i]; answered = false;
        root.innerHTML = `<form class="panel" id="qz-form"><p class="muted small">Question ${i + 1} of ${Q.length}</p><fieldset><legend class="h3">${esc(q.question)}</legend>
          ${q.options.map((o, n) => `<label class="radio"><input type="radio" name="a" value="${n}" required> <span>${esc(o)}</span></label>`).join('')}</fieldset>
          <p><button class="btn" type="submit">Check answer</button></p><div id="qz-fb" role="status" aria-live="polite"></div></form>`;
        const form = root.querySelector('#qz-form'), fb = root.querySelector('#qz-fb'); form.querySelector('input').focus();
        form.addEventListener('submit', (ev) => { ev.preventDefault(); if (answered) return; const v = form.elements.a.value; if (v === '') { fb.textContent = 'Choose an answer first.'; return; }
          answered = true; const ok = +v === q.answer; if (ok) score++;
          form.querySelectorAll('input').forEach((x) => { x.disabled = true; }); form.querySelectorAll('.radio').forEach((l, n) => { if (n === q.answer) l.classList.add('is-right'); else if (n === +v) l.classList.add('is-wrong'); });
          fb.innerHTML = `<p class="${ok ? 'fb-ok' : 'fb-bad'}"><strong>${ok ? 'Correct.' : `Not quite. The answer is: ${esc(q.options[q.answer])}.`}</strong></p><p>${esc(q.explanation)}</p><p>Source: ${extLink(q.source_url)} · <a href="#/equipment/${esc(q.equipment_id)}">Related record</a></p>
          <p><button type="button" class="btn" id="qz-next">${i + 1 < Q.length ? 'Next question' : 'See score'}</button></p>`;
          form.querySelector('button[type=submit]').disabled = true; const nx = fb.querySelector('#qz-next'); nx.focus(); nx.onclick = () => { i++; show(); }; });
      }
      show();
    } };
}

/* ---------------- GLOSSARY ---------------- */
export function glossaryView(params) {
  const T = [...DB.glossary.terms].sort((a, b) => a.term.localeCompare(b.term)); const focus = params.get('term') || '';
  return { title: 'Glossary', html: `${h1('Glossary', 'Plain-language terms used on this site.')}<section class="section"><div class="wrap narrow"><p class="notice">${esc(DB.glossary.note)}</p>
    <div class="field"><label for="g-q">Filter terms</label><input id="g-q" type="search" placeholder="e.g. lander"></div><p class="results-count" id="g-c" role="status" aria-live="polite"></p><dl class="gloss" id="g-list"></dl></div></section>`,
    mount(el) { const q = el.querySelector('#g-q'), list = el.querySelector('#g-list'), c = el.querySelector('#g-c');
      const draw = () => { const t = q.value.toLowerCase().trim(); const r = T.filter((g) => !t || (g.term + ' ' + g.definition).toLowerCase().includes(t)); c.textContent = `${r.length} of ${T.length} terms shown`;
        list.innerHTML = r.length ? r.map((g) => { const rel = g.related_equipment.map(eqById).filter(Boolean); return `<div class="gloss__item${focus === g.id ? ' is-focus' : ''}" id="${esc(g.id)}"><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}<p class="small muted">Used in: ${rel.map((e) => `<a href="#/equipment/${esc(e.id)}">${esc(e.name)}</a>`).join(', ')}. Context sources: ${rel.slice(0, 2).map((e) => extLink(e.source_url, e.mission)).join(', ')}. <em>${esc(DB.glossary.review_status)}</em></p></dd></div>`; }).join('') : '<div class="empty"><h3>No terms match</h3><p>Clear the filter to see every term.</p></div>'; };
      q.addEventListener('input', draw); draw(); const t = focus && el.querySelector('#' + CSS.escape(focus)); if (t) t.scrollIntoView({ block: 'center' }); } };
}

/* ---------------- SOURCES AND EVIDENCE ---------------- */
export function sourcesView(params) {
  const S = DB.sources; const focus = params.get('src') || '';
  return { title: 'Sources and Evidence', html: `${h1('Sources and Evidence', 'Every source recorded in the data, with the records and claims it supports. A record-level source does not verify every field of that record.')}
   <section class="section"><div class="wrap"><ul class="rules"><li>NASA sources are preferred; source titles were not recorded in the seed data, so the organisation and exact link are shown.</li><li>Image reuse review is separate from fact verification. No equipment image is shown until an exact asset, credit and reuse review exist.</li><li>Conflicting or unverified values are kept visible instead of being resolved silently.</li></ul>
   <div class="field"><label for="s-q">Filter sources</label><input id="s-q" type="search" placeholder="Organisation, URL or claim text"></div><p class="results-count" id="s-c" role="status" aria-live="polite"></p><div id="s-list" class="src-list"></div></div></section>`,
    mount(el) { const q = el.querySelector('#s-q'), list = el.querySelector('#s-list'), c = el.querySelector('#s-c');
      const draw = () => { const t = q.value.toLowerCase().trim(); const r = S.filter((s) => !t || (s.url + s.organisation + s.claims.map((x) => x.claim).join(' ')).toLowerCase().includes(t)); c.textContent = `${r.length} of ${S.length} sources shown`;
        list.innerHTML = r.length ? r.map((s) => { const rec = s.record_level_for.map((id) => eqById(id) ? `<a href="#/equipment/${esc(id)}">${esc(eqById(id).name)}</a>` : DB.planetaryById.get(id) ? `<a href="#/planets/${esc(id)}">${esc(DB.planetaryById.get(id).mission_name)}</a>` : esc(id)).join(', ');
          return `<article class="card${focus === s.id ? ' is-focus' : ''}" id="${esc(s.id)}"><span class="eyebrow">${esc(s.organisation)}</span><h3 class="card__title">${extLink(s.url)}</h3>
          <dl class="kv kv--compact"><div><dt>Record-level source for</dt><dd>${rec || '<span class="muted">Not used as a record-level source</span>'}</dd></div><div><dt>Checked</dt><dd>${s.checked.length ? esc(s.checked.join(', ')) : UNKNOWN}</dd></div></dl>
          ${s.claims.length ? `<details><summary>${s.claims.length} claim${s.claims.length === 1 ? '' : 's'} supported</summary><ul>${s.claims.map((x) => `<li>${esc(x.claim)} <span class="muted small">(${eqById(x.equipment_id) ? esc(eqById(x.equipment_id).name) : ''}${x.confidence ? ', confidence: ' + esc(x.confidence) : ''})</span></li>`).join('')}</ul></details>` : '<p class="muted small">No claim-level entries in the data for this source.</p>'}</article>`; }).join('') : '<div class="empty"><h3>No sources match</h3><p>Clear the filter to see all sources.</p></div>'; };
      q.addEventListener('input', draw); draw(); const t = focus && el.querySelector('#' + CSS.escape(focus)); if (t) t.scrollIntoView({ block: 'center' }); } };
}

/* ---------------- ABOUT ---------------- */
export function aboutView(params) {
  const st = stats();
  return { title: 'About', html: `${h1('About Abandoned but Not Forgotten', 'An educational prototype from the NASA Space Apps Challenge. It is not an official NASA website.')}
  <section class="section"><div class="wrap narrow">
   <h2>What this is</h2><p>An interactive look at NASA missions and the hardware their legacies left behind. It has two separate layers: a Planetary Exploration section of mission-level stories, and a detailed equipment catalogue limited to NASA-led or NASA-operated Moon and Mars mission hardware.</p>
   <h2>Status colours</h2>${legendHTML()}
   <h2 id="mass">How the statistics are calculated</h2><ul><li><strong>Achieved equipment</strong> counts the ${st.count} eligible records loaded when the page opens.</li>
   <li><strong>Estimated Abandoned mass</strong> adds only sourced landed-vehicle masses (rover or lander mass, with the scope kept on each record) for records whose hardware remains on a surface. ${st.massRecords.length} of ${st.surfaceRecords.length} such records qualify (${st.massRecords.map((e) => esc(e.name)).join('; ')}). Masses with a launch, wet or unverified basis are left out, so this is a partial figure, not a total.</li>
   <li><strong>Earliest artifact year</strong> needs a source-backed artifact-year field. None exists in the current data, so it shows as unavailable rather than guessing from launch dates.</li></ul>
   <h2>Data and limits</h2><ul><li>The catalogue is a working subset of ${st.count} records, not a full inventory, and several fields remain unverified.</li><li>No equipment images are shown because no exact asset with a verified credit and reuse review exists yet.</li>
   <li>The Updates feed is a static list that changes when the site is redeployed. It is not live.</li><li>Working-status categories are an editorial mapping of the recorded status text onto the original three-colour legend; the reason is recorded on each record.</li></ul>
   <p><a href="#/sources">See sources and evidence</a> · <a href="#/glossary">Glossary</a></p></div></section>`,
    mount(el) { const s = params.get('sec'); const t = s && el.querySelector('#' + CSS.escape(s)); if (t) setTimeout(() => t.scrollIntoView({ block: 'start' }), 0); } };
}

/* ---------------- UPDATES + notifications ---------------- */
export const unseenUpdates = () => { const seen = store.get('abnf.updates.seen', []) || []; return DB.updates.updates.filter((u) => !seen.includes(u.id)); };
export const markUpdatesSeen = () => store.set('abnf.updates.seen', DB.updates.updates.map((u) => u.id));
export const notifySupported = () => 'Notification' in window;

export function updatesView() {
  const html = `${h1('Updates', 'New additions and changes to this website.')}<section class="section"><div class="wrap narrow">
   <p class="notice">${esc(DB.updates.note)}</p>
   <div class="panel" id="notif"></div>
   <ol class="feed">${DB.updates.updates.map((u) => `<li class="feed__item"><time datetime="${esc(u.date)}">${esc(u.date)}</time><h2 class="h3"><a href="${esc(u.link)}">${esc(u.title)}</a></h2><p>${esc(u.summary)}</p></li>`).join('')}</ol></div></section>`;
  return { title: 'Updates', html, mount(el) {
    const box = el.querySelector('#notif');
    const draw = () => {
      if (!notifySupported()) { box.innerHTML = '<h2 class="h3">Browser notifications</h2><p>This browser does not support notifications. The feed below works without them.</p>'; return; }
      const perm = Notification.permission; const on = store.get('abnf.notify', false);
      if (perm === 'denied') box.innerHTML = '<h2 class="h3">Browser notifications</h2><p>Notifications are blocked for this site in your browser settings. The feed below keeps working without them.</p>';
      else if (perm === 'granted' && on) box.innerHTML = '<h2 class="h3">Browser notifications</h2><p>Notifications are on. You will see one when you open the site and new entries have been added since your last visit (no background or live push).</p><button class="btn btn--ghost btn--small" id="n-off">Turn off notifications</button>';
      else box.innerHTML = '<h2 class="h3">Browser notifications (optional)</h2><p>Get a browser notification on your next visit if new entries were added. Nothing is requested until you press the button.</p><button class="btn btn--small" id="n-on">Turn on notifications</button><p class="muted small" id="n-msg" role="status" aria-live="polite"></p>';
    };
    box.addEventListener('click', async (ev) => {
      if (ev.target.id === 'n-off') { store.set('abnf.notify', false); draw(); return; }
      if (ev.target.id !== 'n-on') return;
      try { const p = await Notification.requestPermission();
        if (p === 'granted') { store.set('abnf.notify', true); draw(); try { new Notification('Notifications on', { body: 'You will be told about new site updates when you next visit.' }); } catch { /* ignore */ } }
        else { draw(); const m = box.querySelector('#n-msg'); if (m) m.textContent = 'Permission was not granted. The feed still works.'; }
      } catch { box.querySelector('#n-msg').textContent = 'Notifications could not be enabled. The feed still works.'; }
    });
    draw(); markUpdatesSeen(); window.dispatchEvent(new Event('abnf:updates-seen'));
  } };
}

/* ---------------- SEARCH ---------------- */
export function searchView(params) {
  const q0 = params.get('q') || ''; const t0 = params.get('type') || '';
  return { title: 'Search', html: `${h1('Search', `Searches ${indexSize()} indexed items: equipment, missions, planetary mission cards, timeline events, glossary terms, sources, comparison entries and site pages.`)}
   <section class="section"><div class="wrap"><form role="search" class="searchform" id="s-form"><label for="s-q2" class="sr-only">Search the site</label><input id="s-q2" type="search" value="${esc(q0)}" placeholder="Search the site" autocomplete="off"><button class="btn" type="submit">Search</button></form>
   <div class="chips" id="s-types" role="group" aria-label="Filter results by type"></div><p class="results-count" id="s-count" role="status" aria-live="polite"></p><ul class="results" id="s-res"></ul></div></section>`,
    mount(el) { const input = el.querySelector('#s-q2'), res = el.querySelector('#s-res'), cnt = el.querySelector('#s-count'), chips = el.querySelector('#s-types'); let type = t0;
      const draw = (upd = true) => { const q = input.value.trim();
        if (!q) { chips.innerHTML = ''; cnt.textContent = ''; res.innerHTML = '<li class="empty"><h3>Type to search</h3><p>Try a mission, hardware or place name, for example "Viking", "rover" or "Gusev".</p></li>'; return; }
        const all = search(q); const by = {}; all.forEach((r) => { by[r.type] = (by[r.type] || 0) + 1; });
        chips.innerHTML = `<button type="button" class="pill${type ? '' : ' is-on'}" data-t="" aria-pressed="${!type}">All (${all.length})</button>${SEARCH_TYPES.filter((t) => by[t]).map((t) => `<button type="button" class="pill${type === t ? ' is-on' : ''}" data-t="${esc(t)}" aria-pressed="${type === t}">${esc(t)} (${by[t]})</button>`).join('')}`;
        const shown = type ? all.filter((r) => r.type === type) : all;
        cnt.textContent = `${shown.length} result${shown.length === 1 ? '' : 's'} for "${q}"`;
        res.innerHTML = shown.length ? shown.slice(0, 100).map((r) => `<li class="result"><span class="badge">${esc(r.type)}</span> <a href="${esc(r.url)}">${esc(r.title)}</a><span class="muted small block">${esc(r.meta)}</span></li>`).join('') : `<li class="empty"><h3>No results for "${esc(q)}"</h3><p>Check the spelling or try a shorter word. Only the indexed content listed above is searched.</p></li>`;
        if (upd) history.replaceState(null, '', '#/search' + qs({ q, type })); };
      el.querySelector('#s-form').addEventListener('submit', (e) => { e.preventDefault(); draw(); }); input.addEventListener('input', debounce(() => draw(), 150));
      chips.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { type = b.dataset.t; draw(); } });
      draw(false); input.focus(); } };
}
