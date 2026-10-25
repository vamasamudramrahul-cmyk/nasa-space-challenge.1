/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Data Service: Loads, caches, and provides access to verified structured datasets
 */

const DataService = (() => {
  const cache = {
    equipment: null,
    planetaryMissions: null,
    missions: null,
    timeline: null,
    glossary: null,
    quiz: null,
    sources: null,
    updates: null
  };

  async function fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${path}`);
      return await res.json();
    } catch (err) {
      console.error(`Failed to load ${path}:`, err);
      return [];
    }
  }

  async function init() {
    const [eq, pm, ms, tl, gl, qz, sc, up] = await Promise.all([
      fetchJson('data/equipment.json'),
      fetchJson('data/planetary_missions.json'),
      fetchJson('data/missions.json'),
      fetchJson('data/timeline.json'),
      fetchJson('data/glossary.json'),
      fetchJson('data/quiz.json'),
      fetchJson('data/sources.json'),
      fetchJson('data/updates.json')
    ]);

    cache.equipment = Array.isArray(eq) ? eq : [];
    cache.planetaryMissions = (pm && pm.missions) ? pm.missions : [];
    cache.missions = Array.isArray(ms) ? ms : [];
    cache.timeline = Array.isArray(tl) ? tl : [];
    cache.glossary = Array.isArray(gl) ? gl : [];
    cache.quiz = Array.isArray(qz) ? qz : [];
    cache.sources = Array.isArray(sc) ? sc : [];
    cache.updates = Array.isArray(up) ? up : [];

    return cache;
  }

  function getEquipmentList() {
    return cache.equipment || [];
  }

  function getEquipmentById(id) {
    if (!id || !cache.equipment) return null;
    return cache.equipment.find(e => e.id.toLowerCase() === id.toLowerCase()) || null;
  }

  function getPlanetaryMissions() {
    return cache.planetaryMissions || [];
  }

  function getMissions() {
    return cache.missions || [];
  }

  function getMissionById(id) {
    if (!id || !cache.missions) return null;
    return cache.missions.find(m => m.id.toLowerCase() === id.toLowerCase()) || null;
  }

  function getTimelineEvents() {
    return cache.timeline || [];
  }

  function getGlossaryTerms() {
    return cache.glossary || [];
  }

  function getQuizQuestions() {
    return cache.quiz || [];
  }

  function getSources() {
    return cache.sources || [];
  }

  function getUpdates() {
    return cache.updates || [];
  }

  /**
   * Runtime Statistics calculation per spec rules:
   * 1. Achieved equipment: runtime count of eligible equipment records
   * 2. Estimated Abandoned mass: calculated only from records with comparable sourced values;
   *    clearly mark partial coverage and scope.
   * 3. Earliest artifact year: source-backed artifact year in the eligible dataset.
   */
  function getStats() {
    const list = getEquipmentList();
    const count = list.length;

    let totalMass = 0;
    let massRecordCount = 0;
    let earliestYear = 9999;

    list.forEach(item => {
      // Mass
      if (item.mass_val !== null && item.mass_unit === 'kg') {
        totalMass += Number(item.mass_val);
        massRecordCount++;
      }
      // Earliest artifact year
      if (item.artifact_year && Number(item.artifact_year) < earliestYear) {
        earliestYear = Number(item.artifact_year);
      }
    });

    return {
      achievedEquipmentCount: count,
      estimatedMassKg: Math.round(totalMass),
      massRecordsWithValues: massRecordCount,
      massTotalRecords: count,
      massCoverageNote: `Partial coverage: ${massRecordCount} of ${count} records with verified vehicle mass (scopes vary by vehicle phase; launch stages excluded)`,
      earliestArtifactYear: earliestYear !== 9999 ? earliestYear : 1966
    };
  }

  return {
    init,
    getEquipmentList,
    getEquipmentById,
    getPlanetaryMissions,
    getMissions,
    getMissionById,
    getTimelineEvents,
    getGlossaryTerms,
    getQuizQuestions,
    getSources,
    getUpdates,
    getStats
  };
})();

window.DataService = DataService;
