/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Planetary Exploration View:
 * Sourced NASA mission-level stories across the Solar System beyond Moon and Mars.
 * Explicit scope rule: Mission-level cards only; never loaded into Moon/Mars equipment catalogue.
 */

const PlanetsView = (() => {

  function render(container) {
    const planetaryMissions = DataService.getPlanetaryMissions();

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Outer Solar System Exploration</span>
          <h1 class="section-title">Planetary Exploration</h1>
          <p class="section-description">
            Explore NASA mission stories across the Solar System beyond the detailed Moon and Mars equipment catalogue.
            Discover human ingenuity extending across Mercury, Venus, Jupiter, Saturn, Uranus, Neptune, and Pluto.
          </p>

          <!-- Explicit Scope Disclosure Alert -->
          <div style="background: #eff6ff; border-left: 4px solid var(--color-nasa-blue); padding: 1rem 1.25rem; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-top: 1.25rem; font-size: 0.88rem; color: #1e3a8a;">
            <strong>Data Scope Rule:</strong> These are mission-level story cards for destinations beyond the Moon/Mars equipment catalogue.
            Under project decisions, detailed hardware records are restricted to NASA Moon and Mars equipment, and these planetary mission cards are kept strictly separate.
          </div>
        </div>

        <!-- Interactive 2D Solar System Schematic -->
        <div id="solar-system-container"></div>

        <!-- Mission-level Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem; margin-top: 2rem;">
          ${planetaryMissions.map(pm => {
            const isEnded = pm.mission_status.toLowerCase().includes('ended');
            const statusClass = isEnded ? 'red' : 'yellow';

            return `
              <article class="detail-card" id="planetary-card-${pm.mission_name.toLowerCase().split('-')[0].split(' ')[0]}" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                      <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-nasa-blue);">
                        Target: ${pm.target}
                      </span>
                      <h3 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text-main); margin-top: 2px;">
                        ${pm.mission_name}
                      </h3>
                    </div>
                    <span class="status-badge ${statusClass}">
                      <span class="status-dot ${statusClass}"></span>
                      ${pm.mission_status.split('(')[0].trim()}
                    </span>
                  </div>

                  <p style="font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 1.25rem;">
                    ${pm.summary}
                  </p>

                  <div class="quick-facts-list" style="margin-bottom: 1.25rem;">
                    <div class="quick-fact-item">
                      <span class="quick-fact-label">Mission Type:</span>
                      <span class="quick-fact-val">${pm.mission_type}</span>
                    </div>
                    <div class="quick-fact-item">
                      <span class="quick-fact-label">Launch Date:</span>
                      <span class="quick-fact-val">${pm.launch_date_display || pm.launch_date || pm.launch_year || 'Unknown'}</span>
                    </div>
                    ${pm.arrival_date ? `
                      <div class="quick-fact-item">
                        <span class="quick-fact-label">Arrival Date:</span>
                        <span class="quick-fact-val">${pm.arrival_date}</span>
                      </div>
                    ` : ''}
                    <div class="quick-fact-item">
                      <span class="quick-fact-label">Mission Lifecycle:</span>
                      <span class="quick-fact-val">${pm.mission_end_date ? 'Concluded: ' + pm.mission_end_date : pm.mission_status}</span>
                    </div>
                  </div>

                  ${pm.key_milestones ? `
                    <div style="background: var(--color-bg-subtle); padding: 10px 14px; border-radius: var(--radius-md); margin-bottom: 1.25rem; font-size: 0.85rem;">
                      <strong style="color: var(--color-text-main);">Key Milestones:</strong>
                      <ul style="margin-left: 1.2rem; margin-top: 4px; color: var(--color-text-muted);">
                        ${pm.key_milestones.map(km => `<li><strong>${km.date}:</strong> ${km.event}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>

                <div style="border-top: 1px solid var(--color-border); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
                  <a href="${pm.official_source_url}" target="_blank" rel="noopener noreferrer" class="data-table-link" style="display: flex; align-items: center; gap: 4px;">
                    Official NASA Page ↗
                  </a>
                  <span style="color: #64748b;">Verified as of 2026-10-25</span>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Render Solar System schematic
    CelestialMap.renderSolarSystem('solar-system-container');
  }

  return { render };
})();

window.PlanetsView = PlanetsView;
