// Loads all JSON content once and exposes lookup helpers. No content lives in the interface code.
export const DB = { ready: false };
const FILES = ['equipment', 'missions', 'planetary', 'timeline', 'sources', 'site', 'glossary', 'quiz', 'updates'];

export async function loadData() {
  const res = await Promise.all(FILES.map(async (f) => {
    const r = await fetch(`data/${f}.json`);
    if (!r.ok) throw new Error(`Could not load data/${f}.json (HTTP ${r.status})`);
    return r.json();
  }));
  FILES.forEach((f, i) => { DB[f] = res[i]; });
  DB.equipmentById = new Map(DB.equipment.map((e) => [e.id, e]));
  DB.missionById = new Map(DB.missions.map((m) => [m.id, m]));
  DB.planetaryById = new Map(DB.planetary.missions.map((m) => [m.id, m]));
  DB.types = ['Rovers', 'Landers', 'Orbiters', 'Spacecraft', 'Helicopters', 'Descent stages'];
  DB.ready = true;
  return DB;
}
export const eqById = (id) => DB.equipmentById.get(id);
export const eligible = () => DB.equipment.filter((e) => e.destination === 'Moon' || e.destination === 'Mars');
export const typeCounts = () => Object.fromEntries(DB.types.map((t) => [t, eligible().filter((e) => e.type_categories.includes(t)).length]));

/** Stats computed at runtime from loaded records (nothing hard-coded). */
export function stats() {
  const list = eligible();
  const surf = list.filter((e) => e.abandoned_surface);
  const comp = surf.filter((e) => e.mass_comparable_scope && e.mass && e.mass.unit === 'kg' && typeof e.mass.value === 'number');
  const years = list.map((e) => e.artifact_year).filter((y) => Number.isInteger(y));
  return {
    count: list.length,
    massKg: comp.reduce((s, e) => s + e.mass.value, 0), massRecords: comp, surfaceRecords: surf,
    earliestArtifactYear: years.length ? Math.min(...years) : null, artifactYearCoverage: years.length,
  };
}
