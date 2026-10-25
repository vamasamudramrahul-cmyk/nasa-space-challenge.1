/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Timeline View: Explore Moon Timeline, Explore Mars Timeline, NASA Mission Timeline
 */

const TimelineView = (() => {

  function render(container, activeTab = 'all') {
    const allEvents = DataService.getTimelineEvents();

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Chronological Milestones</span>
          <h1 class="section-title">Exploration Timelines</h1>
          <p class="section-description">
            Explore the historical milestones of NASA's lunar and Martian exploration alongside outer planetary journeys.
            Preserves source-backed date precision across launches, orbit insertions, landings, deployments, discoveries, and mission conclusions.
          </p>
        </div>

        <!-- Timeline Tabs -->
        <div class="timeline-tabs" role="tablist">
          <button type="button" class="timeline-tab-btn ${activeTab === 'moon' ? 'active' : ''}" data-tab="moon" role="tab">
            Explore Moon Timeline
          </button>
          <button type="button" class="timeline-tab-btn ${activeTab === 'mars' ? 'active' : ''}" data-tab="mars" role="tab">
            Explore Mars Timeline
          </button>
          <button type="button" class="timeline-tab-btn ${activeTab === 'all' ? 'active' : ''}" data-tab="all" role="tab">
            NASA Mission Timeline (All)
          </button>
        </div>

        <!-- Filter bar -->
        <div class="filters-panel" style="margin-bottom: 2rem;">
          <div class="filters-grid" style="grid-template-columns: 2fr 1fr;">
            <div class="filter-group">
              <label class="filter-label" for="timeline-search">Search Events</label>
              <input type="text" id="timeline-search" class="filter-input" placeholder="Search milestone title, mission, or hardware...">
            </div>
            <div class="filter-group">
              <label class="filter-label" for="timeline-dest-select">Destination View</label>
              <select id="timeline-dest-select" class="filter-select">
                <option value="all" ${activeTab === 'all' ? 'selected' : ''}>All Missions & Destinations</option>
                <option value="moon" ${activeTab === 'moon' ? 'selected' : ''}>Moon Only</option>
                <option value="mars" ${activeTab === 'mars' ? 'selected' : ''}>Mars Only</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Events Stream -->
        <div id="timeline-stream-container" class="timeline-events-container">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const tabBtns = container.querySelectorAll('.timeline-tab-btn');
    const searchInput = container.querySelector('#timeline-search');
    const destSelect = container.querySelector('#timeline-dest-select');
    const streamContainer = container.querySelector('#timeline-stream-container');

    let currentTab = activeTab;

    function update() {
      const q = searchInput.value.toLowerCase().trim();
      const selDest = destSelect.value;

      tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === currentTab);
      });

      const filtered = allEvents.filter(ev => {
        // Tab check
        if (currentTab === 'moon' && ev.destination !== 'Moon') return false;
        if (currentTab === 'mars' && ev.destination !== 'Mars') return false;

        // Select check
        if (selDest === 'moon' && ev.destination !== 'Moon') return false;
        if (selDest === 'mars' && ev.destination !== 'Mars') return false;

        // Search check
        if (q) {
          const matchTitle = ev.title && ev.title.toLowerCase().includes(q);
          const matchSum = ev.summary && ev.summary.toLowerCase().includes(q);
          const matchEq = ev.equipment_name && ev.equipment_name.toLowerCase().includes(q);
          const matchMis = ev.mission_name && ev.mission_name.toLowerCase().includes(q);
          if (!matchTitle && !matchSum && !matchEq && !matchMis) return false;
        }

        return true;
      });

      renderEvents(filtered, streamContainer);
    }

    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentTab = e.target.dataset.tab;
        destSelect.value = currentTab;
        update();
      });
    });

    destSelect.addEventListener('change', (e) => {
      currentTab = e.target.value;
      update();
    });

    searchInput.addEventListener('input', update);

    update();
  }

  function renderEvents(eventsList, container) {
    if (eventsList.length === 0) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); padding: 3rem; text-align: center; color: var(--color-text-muted);">
          <h3>No timeline events match the filter</h3>
          <p style="margin-top: 6px;">Try adjusting search terms or switching timeline tabs.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = eventsList.map(ev => `
      <article class="timeline-event-card">
        <div>
          <span class="timeline-date-badge">${ev.date || 'Historical Date'}</span>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
            ${ev.destination}
          </div>
        </div>

        <div class="timeline-event-body">
          <h4>${ev.title || ev.summary}</h4>
          <p>${ev.summary}</p>
        </div>

        <div style="text-align: right;">
          ${ev.equipment_id ? `
            <a href="#/equipment/${ev.equipment_id}" class="btn btn-sm btn-secondary">Inspect Hardware →</a>
          ` : (ev.source_url ? `
            <a href="${ev.source_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">Source ↗</a>
          ` : '')}
        </div>
      </article>
    `).join('');
  }

  return { render };
})();

window.TimelineView = TimelineView;
