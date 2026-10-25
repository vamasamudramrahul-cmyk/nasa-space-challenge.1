/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Universal Search Engine: Searches all indexed website content
 */

const UniversalSearch = (() => {
  let isModalOpen = false;

  function init() {
    const searchBtn = document.getElementById('header-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', openModal);
    }

    // Keyboard shortcut: Ctrl+K or / to open search
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openModal();
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openModal();
      } else if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    });
  }

  function openModal() {
    let backdrop = document.getElementById('search-modal-backdrop');
    if (!backdrop) {
      backdrop = createModalDOM();
      document.body.appendChild(backdrop);
    }

    backdrop.style.display = 'flex';
    isModalOpen = true;
    const input = document.getElementById('search-modal-input');
    if (input) {
      input.value = '';
      input.focus();
      renderResults('', document.getElementById('search-modal-results'));
    }
  }

  function closeModal() {
    const backdrop = document.getElementById('search-modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
      isModalOpen = false;
    }
  }

  function createModalDOM() {
    const backdrop = document.createElement('div');
    backdrop.id = 'search-modal-backdrop';
    backdrop.className = 'search-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Universal Site Search');

    backdrop.innerHTML = `
      <div class="search-modal" onclick="event.stopPropagation()">
        <div class="search-modal-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #64748b">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="search-modal-input" class="search-modal-input" placeholder="Search equipment, missions, planets, timeline, glossary..." autocomplete="off">
          <button type="button" class="btn btn-sm btn-secondary" id="search-modal-close" aria-label="Close search">Esc</button>
        </div>
        <div id="search-modal-results" class="search-modal-results"></div>
      </div>
    `;

    backdrop.addEventListener('click', closeModal);
    const closeBtn = backdrop.querySelector('#search-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const input = backdrop.querySelector('#search-modal-input');
    const resultsContainer = backdrop.querySelector('#search-modal-results');

    input.addEventListener('input', (e) => {
      renderResults(e.target.value.trim(), resultsContainer);
    });

    return backdrop;
  }

  function queryAll(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    // 1. Equipment
    const eqList = DataService.getEquipmentList();
    eqList.forEach(eq => {
      if (
        eq.equipment_name.toLowerCase().includes(q) ||
        eq.mission_name.toLowerCase().includes(q) ||
        eq.equipment_type.toLowerCase().includes(q) ||
        eq.destination.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Equipment',
          title: eq.equipment_name,
          subtitle: `${eq.destination} • ${eq.equipment_type} • ${eq.mission_name}`,
          url: `#/equipment/${eq.id}`
        });
      }
    });

    // 2. Missions
    const missions = DataService.getMissions();
    missions.forEach(m => {
      if (
        m.name.toLowerCase().includes(q) ||
        m.destination.toLowerCase().includes(q) ||
        (m.objective && m.objective.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'Mission',
          title: m.name,
          subtitle: `${m.destination} • ${m.status} • ${m.agency}`,
          url: `#/mission/${m.id}`
        });
      }
    });

    // 3. Planetary Missions
    const planetary = DataService.getPlanetaryMissions();
    planetary.forEach(pm => {
      if (
        pm.mission_name.toLowerCase().includes(q) ||
        pm.target.toLowerCase().includes(q) ||
        (pm.summary && pm.summary.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'Planetary Exploration',
          title: `${pm.mission_name} (${pm.target})`,
          subtitle: pm.summary.slice(0, 90) + '...',
          url: `#/destination/planets`
        });
      }
    });

    // 4. Timeline
    const events = DataService.getTimelineEvents();
    events.forEach(ev => {
      if (
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.summary && ev.summary.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'Timeline Event',
          title: `${ev.date}: ${ev.title}`,
          subtitle: ev.summary,
          url: ev.equipment_id ? `#/equipment/${ev.equipment_id}` : `#/timeline/all`
        });
      }
    });

    // 5. Glossary
    const terms = DataService.getGlossaryTerms();
    terms.forEach(t => {
      if (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Glossary',
          title: t.term,
          subtitle: `${t.category} — ${t.definition.slice(0, 90)}...`,
          url: `#/glossary?term=${encodeURIComponent(t.term)}`
        });
      }
    });

    // 6. Sources
    const sources = DataService.getSources();
    sources.forEach(s => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.organization.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Source & Evidence',
          title: s.title,
          subtitle: `${s.organization} — ${s.url}`,
          url: `#/sources`
        });
      }
    });

    return results;
  }

  function renderResults(query, container) {
    if (!query) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.9rem;">
          Type a search term to find equipment, missions, timeline events, or glossary definitions.
        </div>
      `;
      return;
    }

    const matches = queryAll(query);

    if (matches.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #64748b;">
          <p style="font-weight: 700; margin-bottom: 4px;">No results found for "${query}"</p>
          <p style="font-size: 0.85rem;">Try searching for "Apollo", "Curiosity", "Lander", "Rover", "Viking", or "Mars".</p>
        </div>
      `;
      return;
    }

    let html = `<div style="font-size: 0.8rem; color: #64748b; margin-bottom: 8px; font-weight: 700;">${matches.length} result(s) found</div>`;
    matches.slice(0, 25).forEach(m => {
      html += `
        <a href="${m.url}" class="search-result-item" onclick="UniversalSearch.closeModal()">
          <div>
            <div class="search-result-title">${escapeHtml(m.title)}</div>
            <div class="search-result-desc">${escapeHtml(m.subtitle)}</div>
          </div>
          <span class="search-type-pill">${m.type}</span>
        </a>
      `;
    });

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag] || tag));
  }

  return {
    init,
    openModal,
    closeModal,
    queryAll
  };
})();

window.UniversalSearch = UniversalSearch;
