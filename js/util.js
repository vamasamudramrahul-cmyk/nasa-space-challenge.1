// Small shared helpers. All data-derived strings must pass through esc() before being put in HTML.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const UNKNOWN = 'Unknown / not verified';

export function safeStore(kind = 'localStorage') {
  try { const s = window[kind]; const k = '__abnf_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch { return null; }
}
export const store = {
  get(k, d = null) { const s = safeStore(); if (!s) return d; try { const v = s.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { const s = safeStore(); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
export const session = {
  get(k, d = null) { const s = safeStore('sessionStorage'); if (!s) return d; try { const v = s.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { const s = safeStore('sessionStorage'); if (!s) return false; try { s.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

/** Label for a {value, precision, label, raw} date object; never invents precision. */
export function dateLabel(d) {
  if (!d) return UNKNOWN;
  if (d.precision === 'conflicting') return 'Sources differ';
  return d.label || UNKNOWN;
}
export function dateNote(d) {
  if (!d || !d.raw) return '';
  if (d.precision === 'conflicting') return d.raw;
  if (d.raw !== d.label && d.raw !== d.value) return d.raw;
  return '';
}
export const precisionText = (d) => (!d ? '' : d.precision === 'conflicting' ? 'conflicting sources' : d.precision === 'unknown' ? '' : `${d.precision} precision`);

export function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = h.split('?');
  const params = new URLSearchParams(qs);
  return { path: path.startsWith('/') ? path : '/' + path, parts: path.split('/').filter(Boolean), params };
}
export const qs = (obj) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); }); const s = p.toString(); return s ? '?' + s : ''; };

export function fmtKey(k) {
  const units = { kg: 'kg', m: 'm', km: 'km', hours: 'hours', approx: '', s: 's', w: 'W', mph: 'mph' };
  const parts = k.split('_'); const out = []; let unit = '';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i >= parts.length - 2 && units[p] !== undefined && i > 0) { if (units[p]) unit = units[p]; continue; }
    out.push(p);
  }
  const s = out.join(' '); return s.charAt(0).toUpperCase() + s.slice(1) + (unit ? ` (${unit})` : '') + (parts.includes('approx') ? ', approx.' : '');
}
export function fmtValue(v) {
  if (v === null || v === undefined || v === '') return UNKNOWN;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.map(fmtValue).join('; ');
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${fmtKey(k)}: ${fmtValue(x)}`).join(', ');
  return String(v);
}
export const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const num = (n) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(n);

export const STATUS_TEXT = { green: 'Successful', yellow: 'Working', red: 'Lost contact or stopped working' };
export function statusChip(cat) {
  if (!STATUS_TEXT[cat]) return '<span class="chip chip--none"><span class="chip__dot" aria-hidden="true"></span>Status category not assigned</span>';
  const shape = { green: '&#10003;', yellow: '&#9679;', red: '&#10005;' }[cat];
  return `<span class="chip chip--${cat}"><span class="chip__dot" aria-hidden="true">${shape}</span>${STATUS_TEXT[cat]}</span>`;
}
export function extLink(url, label) { return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label ?? url)}<span class="sr-only"> (opens in a new tab)</span></a>`; }

const ICONS = {
  Rovers: '<circle cx="8" cy="19" r="3"/><circle cx="24" cy="19" r="3"/><circle cx="16" cy="19" r="3"/><path d="M5 15h22l-3-6H9z"/>',
  Landers: '<path d="M16 5l8 10H8z"/><path d="M10 15l-4 11M22 15l4 11M12 26h-8M28 26h-8"/>',
  Orbiters: '<ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(-25 16 16)"/><circle cx="16" cy="16" r="4"/>',
  Spacecraft: '<path d="M16 3c4 4 5 10 4 17h-8c-1-7 0-13 4-17z"/><path d="M12 20l-4 6 6-2M20 20l4 6-6-2"/>',
  Helicopters: '<path d="M4 8h24M16 8v6"/><rect x="9" y="14" width="14" height="8" rx="3"/><path d="M23 18h6M12 25h8"/>',
  'Descent stages': '<path d="M8 8h16l3 9H5z"/><path d="M9 17l-3 9M23 17l3 9M13 17v6M19 17v6"/>',
};
export const typeIcon = (t) => `<svg class="icon" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[t] || ''}</svg>`;
