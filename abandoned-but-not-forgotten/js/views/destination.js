/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Destination View: Explore Moon and Explore Mars
 */

const DestinationView = (() => {

  function render(container, destinationName) {
    const isMoon = destinationName.toLowerCase() === 'moon';
    const destTitle = isMoon ? 'Explore Moon' : 'Explore Mars';
    const destGroup = isMoon ? 'Moon' : 'Mars';

    const allEquipment = DataService.getEquipmentList();
    const destEquipment = allEquipment.filter(eq => eq.destination_group === destGroup);

    const description = isMoon
      ? "NASA's lunar exploration spans early uncrewed reconnaissance, historic Apollo human landings, and continuous modern orbital science. The lunar surface preserves robotic and human exploration hardware in high vacuum conditions across Tranquility Base, Oceanus Procellarum, and the Hadley–Apennine highlands."
      : "NASA's Martian exploration encompasses stationary environmental landers, pioneering surface rovers, aerial demonstrators, and orbital communication relays. The Martian surface hosts archaeological sites from Chryse Planitia and Ares Vallis to Gusev Crater, Meridiani Planum, and Jezero Crater.";

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="section-eyebrow">NASA Destination Profile</span>
            <h1 class="section-title">${destTitle}</h1>
            <p class="section-description">${description}</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="#/timeline/${destGroup.toLowerCase()}" class="btn btn-secondary">View ${destGroup} Timeline ⏱️</a>
            <a href="#/filters?dest=${destGroup}" class="btn btn-primary">Filter ${destGroup} Catalogue 🔍</a>
          </div>
        </div>

        <!-- Interactive Celestial Map Component -->
        <div id="dest-map-container"></div>

        <!-- Status Legend Bar -->
        <div class="status-legend-bar">
          <span class="legend-title">Status Key:</span>
          <div class="legend-item"><span class="status-dot green"></span><strong>Green:</strong> Successful</div>
          <div class="legend-item"><span class="status-dot yellow"></span><strong>Yellow:</strong> Working (Operational)</div>
          <div class="legend-item"><span class="status-dot red"></span><strong>Red:</strong> Lost contact or stopped working</div>
        </div>

        <!-- Equipment Grid -->
        <div style="margin-top: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--color-text-main);">
              ${destGroup} Mission Hardware (${destEquipment.length} Items)
            </h2>
          </div>

          <div class="table-responsive">
            <table class="data-table" aria-label="${destGroup} Equipment Table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Mission</th>
                  <th>Coordinates / Region</th>
                  <th>Launch Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${destEquipment.map(eq => `
                  <tr>
                    <td>
                      <a href="#/equipment/${eq.id}" class="data-table-link">${eq.equipment_name}</a>
                      <div style="font-size: 0.75rem; color: #64748b;">${eq.human_or_robotic} mission hardware</div>
                    </td>
                    <td>
                      <span class="status-badge ${eq.working_status_color}">
                        <span class="status-dot ${eq.working_status_color}"></span>
                        ${eq.working_status}
                      </span>
                    </td>
                    <td>${eq.category}</td>
                    <td>${eq.mission_name}</td>
                    <td>
                      ${eq.coordinates ? `
                        <span style="font-family: monospace; font-size: 0.8rem; font-weight: 600;">${eq.coordinates.latitude}°, ${eq.coordinates.longitude}°</span>
                        <div style="font-size: 0.7rem; color: #64748b;">${eq.coordinate_accuracy ? eq.coordinate_accuracy.slice(0, 30) + '...' : 'Sourced site'}</div>
                      ` : `
                        <span class="unknown-badge">${eq.destination.split('—')[1] || 'Orbital / Ephemeris'}</span>
                      `}
                    </td>
                    <td>${eq.launch_date || 'Unknown'}</td>
                    <td>
                      <a href="#/equipment/${eq.id}" class="btn btn-sm btn-secondary">Details</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render interactive celestial map
    CelestialMap.renderDestinationMap('dest-map-container', destGroup, destEquipment);
  }

  return { render };
})();

window.DestinationView = DestinationView;
