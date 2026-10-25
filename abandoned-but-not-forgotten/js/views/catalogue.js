/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Equipment Catalogue and Multi-Filter Screen
 * Combined AND logic: Equipment Name, Working Status, Equipment Type, Destination, Coordinates, Launch Date.
 */

const CatalogueView = (() => {

  function render(container, queryParams = {}) {
    const allEquipment = DataService.getEquipmentList();

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Hardware Catalogue</span>
          <h1 class="section-title">Filters & Equipment Registry</h1>
          <p class="section-description">
            Narrow the catalogue by equipment name, working-status category, equipment type, destination, coordinates, and launch date.
            Results update instantly; users can clear filters and see an accessible empty-state message if nothing matches.
          </p>
        </div>

        <!-- Status Legend Bar -->
        <div class="status-legend-bar">
          <span class="legend-title">Preserved Status Legend:</span>
          <div class="legend-item"><span class="status-dot green"></span><strong>Green:</strong> Successful (Mission outcome)</div>
          <div class="legend-item"><span class="status-dot yellow"></span><strong>Yellow:</strong> Working (Currently operating)</div>
          <div class="legend-item"><span class="status-dot red"></span><strong>Red:</strong> Lost contact or stopped working</div>
        </div>

        <!-- Combined Filters Panel -->
        <div class="filters-panel">
          <div class="filters-header">
            <h2 style="font-size: 1.15rem; font-weight: 700;">Filter Hardware</h2>
            <button type="button" id="clear-all-filters-btn" class="btn btn-sm btn-secondary">Clear All Filters ↺</button>
          </div>

          <div class="filters-grid">
            <!-- 1. Equipment Name / Search -->
            <div class="filter-group">
              <label class="filter-label" for="filter-name">Equipment Name</label>
              <input type="text" id="filter-name" class="filter-input" placeholder="Search by hardware name...">
            </div>

            <!-- 2. Working Status -->
            <div class="filter-group">
              <label class="filter-label" for="filter-status">Working Status</label>
              <select id="filter-status" class="filter-select">
                <option value="ALL">All Statuses</option>
                <option value="Successful">Successful (Mission outcome)</option>
                <option value="Working">Working (Active)</option>
                <option value="Lost contact or stopped working">Lost contact or stopped working</option>
              </select>
            </div>

            <!-- 3. Equipment Type -->
            <div class="filter-group">
              <label class="filter-label" for="filter-type">Equipment Type</label>
              <select id="filter-type" class="filter-select">
                <option value="ALL">All Equipment Types</option>
                <option value="Rovers">Rovers</option>
                <option value="Landers">Landers</option>
                <option value="Orbiters">Orbiters</option>
                <option value="Space crafts">Space crafts</option>
                <option value="Helicopters">Helicopters</option>
                <option value="Descent stages">Descent stages</option>
              </select>
            </div>

            <!-- 4. Destination -->
            <div class="filter-group">
              <label class="filter-label" for="filter-dest">Destination</label>
              <select id="filter-dest" class="filter-select">
                <option value="ALL">All Destinations</option>
                <option value="Moon">Moon</option>
                <option value="Mars">Mars</option>
              </select>
            </div>

            <!-- 5. Coordinates -->
            <div class="filter-group">
              <label class="filter-label" for="filter-coords">Coordinates</label>
              <select id="filter-coords" class="filter-select">
                <option value="ALL">All Locations</option>
                <option value="SOURCED">Has Sourced Coordinates</option>
                <option value="APPROX">Named Region / Orbital Track</option>
              </select>
            </div>

            <!-- 6. Launch Date Range -->
            <div class="filter-group">
              <label class="filter-label" for="filter-era">Launch Era</label>
              <select id="filter-era" class="filter-select">
                <option value="ALL">All Eras</option>
                <option value="PRE_1970">Early Space Age (1960–1969)</option>
                <option value="1970_1999">Viking & Pathfinder Era (1970–1999)</option>
                <option value="2000_PRESENT">Modern Era (2000–Present)</option>
              </select>
            </div>
          </div>

          <div class="filter-actions">
            <span id="filter-count-badge" style="font-weight: 700; color: var(--color-text-main);">
              Showing ${allEquipment.length} of ${allEquipment.length} equipment records
            </span>
          </div>
        </div>

        <!-- Results Table Container -->
        <div id="catalogue-results-container">
          <!-- Dynamically rendered -->
        </div>
      </div>
    `;

    // DOM Elements
    const nameInput = container.querySelector('#filter-name');
    const statusSelect = container.querySelector('#filter-status');
    const typeSelect = container.querySelector('#filter-type');
    const destSelect = container.querySelector('#filter-dest');
    const coordsSelect = container.querySelector('#filter-coords');
    const eraSelect = container.querySelector('#filter-era');
    const clearBtn = container.querySelector('#clear-all-filters-btn');
    const countBadge = container.querySelector('#filter-count-badge');
    const resultsContainer = container.querySelector('#catalogue-results-container');

    // Preset initial query params (e.g. from Home category cards)
    if (queryParams.type) {
      typeSelect.value = queryParams.type;
    }
    if (queryParams.dest) {
      destSelect.value = queryParams.dest;
    }
    if (queryParams.status) {
      statusSelect.value = queryParams.status;
    }

    function applyFilters() {
      const qName = nameInput.value.toLowerCase().trim();
      const selStatus = statusSelect.value;
      const selType = typeSelect.value;
      const selDest = destSelect.value;
      const selCoords = coordsSelect.value;
      const selEra = eraSelect.value;

      const filtered = allEquipment.filter(eq => {
        // Name check
        if (qName && !eq.equipment_name.toLowerCase().includes(qName) && !eq.mission_name.toLowerCase().includes(qName)) {
          return false;
        }

        // Status check
        if (selStatus !== 'ALL') {
          if (selStatus === 'Successful') {
            if (!eq.is_successful_outcome) return false;
          } else if (selStatus === 'Working') {
            if (eq.working_status !== 'Working') return false;
          } else if (selStatus === 'Lost contact or stopped working') {
            if (eq.working_status !== 'Lost contact or stopped working') return false;
          }
        }

        // Type check
        if (selType !== 'ALL') {
          if (eq.category !== selType) {
            // Also check raw equipment_type for fuzzy match
            if (!eq.equipment_type.toLowerCase().includes(selType.toLowerCase().slice(0, -1))) {
              return false;
            }
          }
        }

        // Destination check
        if (selDest !== 'ALL') {
          if (eq.destination_group !== selDest) return false;
        }

        // Coordinates check
        if (selCoords === 'SOURCED' && !eq.has_coordinates) return false;
        if (selCoords === 'APPROX' && eq.has_coordinates) return false;

        // Launch Era check
        if (selEra !== 'ALL') {
          const y = eq.launch_year;
          if (!y) return false;
          if (selEra === 'PRE_1970' && y >= 1970) return false;
          if (selEra === '1970_1999' && (y < 1970 || y > 1999)) return false;
          if (selEra === '2000_PRESENT' && y < 2000) return false;
        }

        return true;
      });

      countBadge.textContent = `Showing ${filtered.length} of ${allEquipment.length} equipment records`;
      renderResults(filtered, resultsContainer);
    }

    function clearAll() {
      nameInput.value = '';
      statusSelect.value = 'ALL';
      typeSelect.value = 'ALL';
      destSelect.value = 'ALL';
      coordsSelect.value = 'ALL';
      eraSelect.value = 'ALL';
      applyFilters();
    }

    nameInput.addEventListener('input', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    typeSelect.addEventListener('change', applyFilters);
    destSelect.addEventListener('change', applyFilters);
    coordsSelect.addEventListener('change', applyFilters);
    eraSelect.addEventListener('change', applyFilters);
    clearBtn.addEventListener('click', clearAll);

    // Initial render
    applyFilters();
  }

  function renderResults(records, container) {
    if (records.length === 0) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); padding: 3.5rem 1.5rem; text-align: center; color: var(--color-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.5rem;">No equipment matches your selected filters</h3>
          <p style="font-size: 0.95rem; margin-bottom: 1.5rem;">Try broadening your search term or clearing one of the dropdown filters.</p>
          <button type="button" class="btn btn-primary" onclick="document.getElementById('clear-all-filters-btn')?.click()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table" aria-label="Filtered Equipment Catalogue Table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Status</th>
              <th>Equipment Type</th>
              <th>Destination</th>
              <th>Coordinates</th>
              <th>Launch Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(eq => `
              <tr>
                <td>
                  <a href="#/equipment/${eq.id}" class="data-table-link">${eq.equipment_name}</a>
                  <div style="font-size: 0.75rem; color: #64748b;">${eq.mission_name}</div>
                </td>
                <td>
                  <span class="status-badge ${eq.working_status_color}">
                    <span class="status-dot ${eq.working_status_color}"></span>
                    ${eq.working_status}
                  </span>
                </td>
                <td>${eq.category}</td>
                <td>${eq.destination.split('—')[0]}</td>
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
                  <a href="#/equipment/${eq.id}" class="btn btn-sm btn-secondary">Inspect</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return { render };
})();

window.CatalogueView = CatalogueView;
