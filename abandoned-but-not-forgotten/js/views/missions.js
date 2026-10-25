/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * NASA Space Missions Directory and Detail Views
 */

const MissionsView = (() => {

  function renderDirectory(container) {
    const missions = DataService.getMissions();

    container.innerHTML = `
      <div class="section-container">
        <div class="section-header">
          <span class="section-eyebrow">Mission Register</span>
          <h1 class="section-title">NASA Space Missions Directory</h1>
          <p class="section-description">
            Explore the historic and active NASA space missions represented across the Moon, Mars, and outer Solar System.
            Inspect their objectives, mission lifecycles, and linked scientific hardware.
          </p>
        </div>

        <!-- Controls -->
        <div class="filters-panel" style="margin-bottom: 2rem;">
          <div class="filters-grid" style="grid-template-columns: 2fr 1fr 1fr;">
            <div class="filter-group">
              <label class="filter-label" for="mission-search">Search Missions</label>
              <input type="text" id="mission-search" class="filter-input" placeholder="Search by mission name or objective...">
            </div>
            <div class="filter-group">
              <label class="filter-label" for="mission-dest-filter">Destination</label>
              <select id="mission-dest-filter" class="filter-select">
                <option value="ALL">All Destinations</option>
                <option value="Moon">Moon</option>
                <option value="Mars">Mars</option>
                <option value="Planetary">Outer Solar System</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label" for="mission-status-filter">Status</label>
              <select id="mission-status-filter" class="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Ended">Ended / Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div id="missions-grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const searchInput = container.querySelector('#mission-search');
    const destSelect = container.querySelector('#mission-dest-filter');
    const statusSelect = container.querySelector('#mission-status-filter');
    const gridContainer = container.querySelector('#missions-grid-container');

    function applyFilters() {
      const q = searchInput.value.toLowerCase().trim();
      const dest = destSelect.value;
      const stat = statusSelect.value;

      const filtered = missions.filter(m => {
        const matchesQ = !q || m.name.toLowerCase().includes(q) || (m.objective && m.objective.toLowerCase().includes(q));
        let matchesDest = true;
        if (dest === 'Moon') matchesDest = m.destination === 'Moon';
        else if (dest === 'Mars') matchesDest = m.destination === 'Mars';
        else if (dest === 'Planetary') matchesDest = m.destination !== 'Moon' && m.destination !== 'Mars';

        const matchesStat = stat === 'ALL' || m.status.toLowerCase().includes(stat.toLowerCase());
        return matchesQ && matchesDest && matchesStat;
      });

      renderMissionsCards(filtered, gridContainer);
    }

    searchInput.addEventListener('input', applyFilters);
    destSelect.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);

    applyFilters();
  }

  function renderMissionsCards(missionsList, container) {
    if (missionsList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--color-text-muted);">
          <h3>No missions match the selected filters</h3>
          <p style="margin-top: 6px;">Try clearing search terms or selecting 'All Destinations'.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = missionsList.map(m => {
      const isEnded = m.status.toLowerCase().includes('ended');
      const badgeClass = isEnded ? 'red' : 'yellow';

      return `
        <article class="detail-card" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--color-nasa-blue);">
                ${m.destination}
              </span>
              <span class="status-badge ${badgeClass}">
                <span class="status-dot ${badgeClass}"></span>
                ${m.status}
              </span>
            </div>

            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 0.5rem;">
              <a href="#/mission/${m.id}" style="color: inherit; text-decoration: none;">${m.name}</a>
            </h3>

            <p style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.55; margin-bottom: 1rem;">
              ${m.objective ? m.objective.slice(0, 140) + '...' : m.outcome.slice(0, 140) + '...'}
            </p>

            <div style="font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem;">
              <div><strong>Launch Date:</strong> ${m.launch_date || 'Unknown'}</div>
              <div><strong>Agency:</strong> ${m.agency}</div>
            </div>

            ${m.related_equipment && m.related_equipment.length > 0 ? `
              <div style="background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.8rem; margin-bottom: 1rem;">
                <strong style="color: var(--color-text-main);">Related Hardware:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${m.related_equipment.map(eq => `
                    <a href="#/equipment/${eq.id}" class="data-table-link" style="font-size: 0.8rem;">
                      ${eq.name}
                    </a>
                  `).join(', ')}
                </div>
              </div>
            ` : ''}
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
            <a href="#/mission/${m.id}" class="btn btn-sm btn-secondary">View Mission Full Story</a>
            ${m.source_url ? `
              <a href="${m.source_url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; color: #64748b; text-decoration: none;">NASA Source ↗</a>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderDetail(container, missionId) {
    const mission = DataService.getMissionById(missionId);
    if (!mission) {
      container.innerHTML = `
        <div class="section-container" style="text-align: center; padding: 5rem 1rem;">
          <h2>Mission Not Found</h2>
          <p style="margin: 1rem 0 2rem;">No NASA mission record exists with identifier "${missionId}".</p>
          <a href="#/missions" class="btn btn-primary">Return to Missions Directory</a>
        </div>
      `;
      return;
    }

    const isEnded = mission.status.toLowerCase().includes('ended');
    const badgeClass = isEnded ? 'red' : 'yellow';

    // Find timeline milestones for this mission
    const allEvents = DataService.getTimelineEvents();
    const missionEvents = allEvents.filter(ev => ev.mission_name && ev.mission_name.toLowerCase() === mission.name.toLowerCase());

    container.innerHTML = `
      <div class="section-container">
        <!-- Breadcrumb -->
        <nav style="font-size: 0.85rem; margin-bottom: 1.5rem; color: #64748b;">
          <a href="#/missions" style="color: var(--color-nasa-blue); text-decoration: none;">Missions Directory</a> &gt; 
          <span style="color: var(--color-text-main); font-weight: 600;">${mission.name}</span>
        </nav>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="section-eyebrow">NASA Mission Profile • ${mission.destination}</span>
            <h1 class="section-title">${mission.name}</h1>
            <p style="font-size: 1.1rem; color: var(--color-text-muted); max-width: 800px;">
              ${mission.objective || mission.outcome}
            </p>
          </div>
          <span class="status-badge ${badgeClass}" style="font-size: 0.95rem; padding: 6px 14px;">
            <span class="status-dot ${badgeClass}"></span>
            ${mission.status}
          </span>
        </div>

        <div class="detail-layout">
          <!-- Main Content Left -->
          <div>
            <div class="detail-card">
              <h3>Mission Narrative & Outcome</h3>
              <p style="font-size: 1rem; color: var(--color-text-muted); line-height: 1.7; margin-bottom: 1.25rem;">
                ${mission.outcome || mission.objective}
              </p>
              ${mission.source_url ? `
                <div style="margin-top: 1rem;">
                  <a href="${mission.source_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                    View Official NASA Mission Page ↗
                  </a>
                </div>
              ` : ''}
            </div>

            <!-- Associated Mission Hardware -->
            ${mission.related_equipment && mission.related_equipment.length > 0 ? `
              <div class="detail-card">
                <h3>Associated Hardware Artifacts (${mission.related_equipment.length})</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
                  ${mission.related_equipment.map(eq => `
                    <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; background: #fafafa;">
                      <span class="status-badge ${eq.working_status_color}" style="margin-bottom: 6px;">
                        <span class="status-dot ${eq.working_status_color}"></span>
                        ${eq.working_status}
                      </span>
                      <h4 style="font-size: 1.05rem; font-weight: 700; margin: 4px 0;">
                        <a href="#/equipment/${eq.id}" class="data-table-link">${eq.name}</a>
                      </h4>
                      <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 8px;">${eq.type}</p>
                      <a href="#/equipment/${eq.id}" class="btn btn-sm btn-secondary">Inspect Hardware Details →</a>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Milestone Timeline -->
            ${missionEvents.length > 0 ? `
              <div class="detail-card">
                <h3>Key Mission Milestones</h3>
                <ol class="milestone-timeline">
                  ${missionEvents.map(ev => `
                    <li class="milestone-item">
                      <div class="milestone-date">${ev.date || 'Historical Event'}</div>
                      <div class="milestone-text">${ev.title || ev.summary}</div>
                    </li>
                  `).join('')}
                </ol>
              </div>
            ` : ''}
          </div>

          <!-- Quick Facts Sidebar Right -->
          <div>
            <div class="detail-card">
              <h3>Quick Facts</h3>
              <div class="quick-facts-list">
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Agency:</span>
                  <span class="quick-fact-val">${mission.agency}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Destination:</span>
                  <span class="quick-fact-val">${mission.destination}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Launch Date:</span>
                  <span class="quick-fact-val">${mission.launch_date || 'Unknown'}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Mission Lifecycle:</span>
                  <span class="quick-fact-val">${mission.end_date || mission.status}</span>
                </div>
              </div>

              <div style="margin-top: 1.5rem;">
                <a href="#/missions" class="btn btn-secondary" style="width: 100%;">← Back to Missions Directory</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return {
    renderDirectory,
    renderDetail
  };
})();

window.MissionsView = MissionsView;
