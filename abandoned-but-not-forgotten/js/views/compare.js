/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Equipment Comparison View:
 * Select 2 or 3 Moon/Mars equipment items and compare supported fields side by side.
 * Rules: Never treat missing values as zero; disclose mass scopes; link displayed claims to evidence.
 */

const CompareView = (() => {

  function render(container, queryParams = {}) {
    const allEquipment = DataService.getEquipmentList();

    // Default preselected items
    let selectedIds = [
      queryParams.item1 || (allEquipment[0] ? allEquipment[0].id : ''),
      queryParams.item2 || (allEquipment[1] ? allEquipment[1].id : ''),
      queryParams.item3 || ''
    ];

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Technical Evaluation</span>
          <h1 class="section-title">Equipment Comparison Matrix</h1>
          <p class="section-description">
            Select up to three NASA Moon and Mars equipment records to compare technical specifications, operational status,
            mobility capabilities, physical dimensions, and sourced coordinates side by side.
          </p>

          <div style="background: #f8fafc; border-left: 4px solid var(--color-nasa-blue); padding: 0.85rem 1.25rem; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-top: 1rem; font-size: 0.85rem; color: #334155;">
            <strong>Data Integrity Rule:</strong> Missing fields are displayed honestly as "Unknown / Not verified" or "Not applicable" and are never encoded as zero. Mass scopes are explicitly disclosed.
          </div>
        </div>

        <!-- Dropdown Selectors -->
        <div class="compare-selector-bar">
          <div class="filter-group">
            <label class="filter-label" for="compare-select-1">First Hardware Item</label>
            <select id="compare-select-1" class="filter-select">
              ${allEquipment.map(eq => `
                <option value="${eq.id}" ${eq.id === selectedIds[0] ? 'selected' : ''}>
                  ${eq.equipment_name} (${eq.destination_group})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="compare-select-2">Second Hardware Item</label>
            <select id="compare-select-2" class="filter-select">
              ${allEquipment.map(eq => `
                <option value="${eq.id}" ${eq.id === selectedIds[1] ? 'selected' : ''}>
                  ${eq.equipment_name} (${eq.destination_group})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="compare-select-3">Third Item (Optional)</label>
            <select id="compare-select-3" class="filter-select">
              <option value="">-- None Selected --</option>
              ${allEquipment.map(eq => `
                <option value="${eq.id}" ${eq.id === selectedIds[2] ? 'selected' : ''}>
                  ${eq.equipment_name} (${eq.destination_group})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Matrix Container -->
        <div id="compare-matrix-container">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const sel1 = container.querySelector('#compare-select-1');
    const sel2 = container.querySelector('#compare-select-2');
    const sel3 = container.querySelector('#compare-select-3');
    const matrixContainer = container.querySelector('#compare-matrix-container');

    function updateMatrix() {
      const id1 = sel1.value;
      const id2 = sel2.value;
      const id3 = sel3.value;

      const itemsToCompare = [
        DataService.getEquipmentById(id1),
        DataService.getEquipmentById(id2),
        DataService.getEquipmentById(id3)
      ].filter(Boolean);

      renderTable(itemsToCompare, matrixContainer);
    }

    sel1.addEventListener('change', updateMatrix);
    sel2.addEventListener('change', updateMatrix);
    sel3.addEventListener('change', updateMatrix);

    updateMatrix();
  }

  function renderTable(items, container) {
    if (items.length < 2) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); padding: 3rem; text-align: center; color: var(--color-text-muted);">
          <h3>Please select at least two equipment items to compare</h3>
        </div>
      `;
      return;
    }

    const rows = [
      {
        field: 'Equipment Name',
        getter: it => `<a href="#/equipment/${it.id}" class="data-table-link" style="font-weight: 800; font-size: 1.05rem;">${it.equipment_name}</a>`
      },
      {
        field: 'Destination',
        getter: it => it.destination || '<span class="unknown-badge">Unknown</span>'
      },
      {
        field: 'Equipment Type',
        getter: it => it.equipment_type || '<span class="unknown-badge">Unknown</span>'
      },
      {
        field: 'Associated Mission',
        getter: it => `<a href="#/mission/mis_${it.mission_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}" class="data-table-link">${it.mission_name}</a>`
      },
      {
        field: 'Operational Status',
        getter: it => `
          <span class="status-badge ${it.working_status_color}">
            <span class="status-dot ${it.working_status_color}"></span>
            ${it.working_status}
          </span>
          <div style="font-size: 0.8rem; color: #475569; margin-top: 4px;">${it.operational_status}</div>
        `
      },
      {
        field: 'Launch Date',
        getter: it => it.launch_date || '<span class="unknown-badge">Unknown / Not verified</span>'
      },
      {
        field: 'Arrival / Landing Date',
        getter: it => it.arrival_or_landing_date || '<span class="unknown-badge">Unknown / Not verified</span>'
      },
      {
        field: 'Mass & Scope Disclosure',
        getter: it => it.mass_display ? `
          <strong>${it.mass_display}</strong>
          ${it.mass && it.mass.basis ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Basis: ${it.mass.basis}</div>` : ''}
        ` : '<span class="unknown-badge">Unknown / Not verified</span>'
      },
      {
        field: 'Power Source',
        getter: it => it.power_source ? it.power_source : '<span class="unknown-badge">Unknown / Not verified</span>'
      },
      {
        field: 'Mobility Capabilities',
        getter: it => it.mobility_capabilities ? it.mobility_capabilities : '<span class="unknown-badge">None / Stationary</span>'
      },
      {
        field: 'Remaining Hardware',
        getter: it => it.remaining_hardware ? it.remaining_hardware : '<span class="unknown-badge">Unknown / Not verified</span>'
      },
      {
        field: 'Coordinates / Accuracy',
        getter: it => it.coordinates ? `
          <span style="font-family: monospace; font-weight: 700;">${it.coordinates.latitude}°, ${it.coordinates.longitude}°</span>
          <div style="font-size: 0.75rem; color: #64748b;">${it.coordinate_accuracy || 'NASA Sourced'}</div>
        ` : `<span class="unknown-badge">${it.coordinate_accuracy || 'Unavailable'}</span>`
      },
      {
        field: 'Official Source Reference',
        getter: it => it.source_url ? `
          <a href="${it.source_url}" target="_blank" rel="noopener noreferrer" class="data-table-link" style="font-size: 0.85rem;">
            ${it.source_note ? it.source_note.slice(0, 40) + '...' : 'NASA Portal ↗'}
          </a>
        ` : '<span class="unknown-badge">Archived</span>'
      }
    ];

    container.innerHTML = `
      <div class="table-responsive">
        <table class="compare-table" aria-label="Side-by-side comparison matrix">
          <thead>
            <tr>
              <th style="width: 22%;">Attribute</th>
              ${items.map(it => `
                <th style="text-align: left; background: #ffffff; color: var(--color-text-main); font-size: 1rem; border-left: 2px solid var(--color-border);">
                  ${it.equipment_name}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <th>${r.field}</th>
                ${items.map(it => `
                  <td style="border-left: 1px solid var(--color-border); vertical-align: top;">
                    ${r.getter(it)}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return { render };
})();

window.CompareView = CompareView;
