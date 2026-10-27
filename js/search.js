// Universal search over everything that is actually indexed below. Nothing is searched that isn't listed here.
import { DB } from './data.js';
import { fmtValue } from './util.js';

let INDEX = null;
export const SEARCH_TYPES = ['Equipment', 'Mission', 'Planetary mission', 'Timeline event', 'Glossary', 'Source', 'Comparison', 'Page'];

export function buildIndex() {
  const idx = [];
  const push = (type, title, text, url, meta = '') => idx.push({ type, title, url, meta, hay: (title + ' ' + text).toLowerCase(), titleLow: title.toLowerCase() });
  for (const e of DB.equipment) {
    push('Equipment', e.name, [e.mission, e.type_raw, e.type_categories.join(' '), e.destination_detail, e.mission_objective, e.mission_outcome, e.operational_status,
      e.physical_location, e.instruments.join(' '), e.discoveries.join(' '), e.remaining_hardware || '', e.id].join(' '), `#/equipment/${e.id}`, `${e.destination} · ${e.type_categories[0]} · ${e.mission}`);
    push('Comparison', `Compare: ${e.name}`, `compare comparison side by side ${e.name} ${e.mission} ${e.destination}`, `#/compare?ids=${e.id}`, 'Add this record to the comparison table');
  }
  for (const m of DB.missions) push('Mission', m.name, [m.agency, m.destination, m.objective].join(' '), `#/mission/${m.id}`, `${m.destination} mission · ${m.equipment_ids.length} equipment record(s)`);
  for (const m of DB.planetary.missions) push('Planetary mission', m.mission_name, [m.target, m.mission_type, m.objective, m.summary, m.mission_status].join(' '), `#/planets/${m.id}`, `${m.target} · ${m.mission_type}`);
  for (const ev of DB.timeline) push('Timeline event', ev.title, [ev.mission, ev.event_type, ev.date.label, ev.destination].join(' '), `#/timeline/${ev.destination === 'Moon' ? 'moon' : ev.destination === 'Mars' ? 'mars' : 'nasa'}?event=${ev.id}`, `${ev.date.label} · ${ev.event_type} · ${ev.mission}`);
  for (const g of DB.glossary.terms) push('Glossary', g.term, g.definition, `#/glossary?term=${g.id}`, 'Glossary term');
  for (const s of DB.sources) push('Source', `${s.organisation}: ${s.url.replace(/^https?:\/\//, '')}`, [s.url, s.organisation, ...s.claims.map((c) => c.claim)].join(' '), `#/sources?src=${s.id}`, `${s.claims.length} claim(s) · ${s.record_level_for.length} record(s)`);
  const pages = [['Quiz', 'quiz test your knowledge questions', '#/quiz'], ['Glossary', 'glossary terms definitions', '#/glossary'], ['Sources and Evidence', 'sources evidence claims links verification', '#/sources'],
    ['About', 'about project methodology scope limitations status legend', '#/about'], ['Updates', 'updates feed notifications changes', '#/updates'], ['Compare equipment', 'compare comparison side by side', '#/compare'],
    ['Equipment catalogue', 'catalogue filters equipment search browse', '#/catalogue'], ['Explore Moon', 'moon lunar destination', '#/moon'], ['Explore Mars', 'mars martian destination', '#/mars'],
    ['Explore Planets', 'planets planetary exploration mercury venus jupiter saturn uranus neptune pluto', '#/planets'], ['NASA Space Missions', 'missions list nasa', '#/missions']];
  for (const [t, k, u] of pages) push('Page', t, k, u, 'Site page');
  INDEX = idx; return idx;
}

export function search(query, types = null) {
  if (!INDEX) buildIndex();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const out = [];
  for (const it of INDEX) {
    if (types && !types.includes(it.type)) continue;
    if (!terms.every((t) => it.hay.includes(t))) continue;
    let score = 0;
    for (const t of terms) { if (it.titleLow === t) score += 10; else if (it.titleLow.startsWith(t)) score += 5; else if (it.titleLow.includes(t)) score += 3; else score += 1; }
    out.push({ ...it, score });
  }
  return out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
export const indexSize = () => (INDEX || buildIndex()).length;
