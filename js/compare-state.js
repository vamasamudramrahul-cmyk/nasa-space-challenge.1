// Selection state for the comparison table (kept in sessionStorage when available).
import { session } from './util.js';
export const MAX_COMPARE = 4;
let ids = session.get('abnf.compare', []) || [];
const subs = new Set();
const emit = () => { session.set('abnf.compare', ids); subs.forEach((f) => f(ids)); };
export const getCompare = () => [...ids];
export const inCompare = (id) => ids.includes(id);
export function setCompare(list) { ids = [...new Set(list)].slice(0, MAX_COMPARE); emit(); }
export function toggleCompare(id) {
  if (ids.includes(id)) ids = ids.filter((x) => x !== id);
  else if (ids.length < MAX_COMPARE) ids = [...ids, id];
  else return false;
  emit(); return true;
}
export const onCompare = (f) => { subs.add(f); return () => subs.delete(f); };
