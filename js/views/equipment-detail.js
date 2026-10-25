/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Equipment Detail View:
 * Full evidence-linked record profile with technical specifications, milestones,
 * coordinates, claim-level sources, and strict image omission handling.
 */

const EquipmentDetailView = (() => {

  function render(container, equipmentId) {
    const eq = DataService.getEquipmentById(equipmentId);

    if (!eq) {
      container.innerHTML = `
        <div class="section-container" style="text-align: center; padding: 5rem 1.5rem;">
          <h2>Hardware Record Not Found</h2>
          <p style="margin: 1rem 0 2rem; color: var(--color-text-muted);">
            No hardware record exists with identifier "${equipmentId}".
          </p>
          <a href="#/filters" class="btn btn-primary">Return to Equipment Catalogue</a>
        </div>
      `;
      return;
    }

    // Build Technical Specifications rows
    const specsList = [];
    if (eq.mass_display) {
      specsList.push({ label: 'Mass', value: eq.mass_display });
    }
    if (eq.dimensions) {
      let dimStr = typeof eq.dimensions === 'object' ? JSON.stringify(eq.dimensions).replace(/[{"}]/g, ' ') : String(eq.dimensions);
      specsList.push({ label: 'Dimensions', value: dimStr });
    }
    if (eq.power_source) {
      specsList.push({ label: 'Power Source', value: eq.power_source });
    }
    if (eq.mobility_capabilities) {
      specsList.push({ label: 'Mobility Capabilities', value: eq.mobility_capabilities });
    }
    if (eq.remaining_hardware) {
      specsList.push({ label: 'Remaining Hardware', value: eq.remaining_hardware });
    }

    // Parse technical specifications object
    if (eq.technical_specifications && typeof eq.technical_specifications === 'object') {
      Object.entries(eq.technical_specifications).forEach(([k, v]) => {
        if (!k.includes('mass') && typeof v !== 'object') {
          const prettyKey = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          specsList.push({ label: prettyKey, value: String(v) });
        }
      });
    }

    // Image Area Policy:
    // "If a suitable verified official NASA image is unavailable, omit the image area entirely.
    // Do not show image placeholders or generic substitute illustrations."
    const imageAreaHtml = (eq.image_url && eq.image_url.trim() !== '') ? `
      <div class="detail-card" style="padding: 0; overflow: hidden;">
        <img src="${eq.image_url}" alt="${eq.equipment_name}" style="width: 100%; height: auto; display: block;">
        <div style="padding: 1rem; font-size: 0.8rem; color: #64748b; background: #fafafa;">
          <strong>Image Credit:</strong> ${eq.image_credit || 'NASA'}
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="section-container">
        <!-- Breadcrumb Navigation -->
        <nav style="font-size: 0.85rem; margin-bottom: 1.5rem; color: #64748b;" aria-label="Breadcrumb">
          <a href="#/filters" style="color: var(--color-nasa-blue); text-decoration: none;">Equipment Catalogue</a> &gt; 
          <a href="#/destination/${eq.destination_group.toLowerCase()}" style="color: var(--color-nasa-blue); text-decoration: none;">${eq.destination_group}</a> &gt; 
          <span style="color: var(--color-text-main); font-weight: 600;">${eq.equipment_name}</span>
        </nav>

        <!-- Record Title Bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="section-eyebrow">${eq.human_or_robotic} Hardware • ${eq.category}</span>
            <h1 class="section-title" style="margin-bottom: 0.5rem;">${eq.equipment_name}</h1>
            <p style="font-size: 1.1rem; color: var(--color-text-muted); max-width: 820px; line-height: 1.6;">
              Associated with the <strong>${eq.mission_name}</strong> mission (${eq.agency_country})
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span class="status-badge ${eq.working_status_color}" style="font-size: 0.95rem; padding: 7px 16px;">
              <span class="status-dot ${eq.working_status_color}"></span>
              ${eq.working_status}
            </span>
            <a href="#/compare?item1=${eq.id}" class="btn btn-secondary">Compare This Item ⚖️</a>
          </div>
        </div>

        <!-- Detail Layout (Main Left / Facts Right) -->
        <div class="detail-layout">
          <!-- Main Left Column -->
          <div>
            ${imageAreaHtml}

            <!-- Mission Overview & Objective -->
            <div class="detail-card">
              <h3>Mission Objective & Summary</h3>
              <p style="font-size: 1.05rem; color: var(--color-text-main); line-height: 1.7; margin-bottom: 1rem;">
                ${eq.operational_status}
              </p>
              ${eq.mission_objective ? `
                <div style="background: var(--color-bg-subtle); padding: 1rem 1.25rem; border-radius: var(--radius-md); font-size: 0.95rem; margin-top: 1rem; border-left: 3px solid var(--color-nasa-blue);">
                  <strong>Mission Objective:</strong> ${eq.mission_objective}
                </div>
              ` : ''}
              <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
                <strong>Mission Outcome:</strong> ${eq.mission_outcome}
              </div>
            </div>

            <!-- Technical Specifications Table -->
            <div class="detail-card">
              <h3>Technical Specifications & Physical Properties</h3>
              <div class="table-responsive">
                <table class="data-table" aria-label="Technical Specifications Table">
                  <tbody>
                    ${specsList.map(s => `
                      <tr>
                        <th style="width: 35%;">${s.label}</th>
                        <td>${s.value}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${eq.mass && eq.mass.basis ? `
                <p style="font-size: 0.78rem; color: #64748b; margin-top: 8px;">
                  *<strong>Mass Scope Disclosure:</strong> ${eq.mass.basis}. Avoid summing with differing mission phases.
                </p>
              ` : ''}
            </div>

            <!-- Scientific Instruments & Discoveries -->
            ${(eq.scientific_instruments && eq.scientific_instruments.length > 0) || (eq.major_discoveries && eq.major_discoveries.length > 0) ? `
              <div class="detail-card">
                <h3>Science Instrumentation & Legacy</h3>
                ${eq.scientific_instruments && eq.scientific_instruments.length > 0 ? `
                  <div style="margin-bottom: 1.25rem;">
                    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.5rem;">Scientific Instruments:</h4>
                    <ul style="margin-left: 1.25rem; font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.6;">
                      ${eq.scientific_instruments.map(inst => `<li>${inst}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${eq.major_discoveries && eq.major_discoveries.length > 0 ? `
                  <div>
                    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.5rem;">Major Scientific Discoveries:</h4>
                    <ul style="margin-left: 1.25rem; font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.6;">
                      ${eq.major_discoveries.map(disc => `<li>${disc}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Chronological Milestones Timeline -->
            ${eq.mission_history && eq.mission_history.length > 0 ? `
              <div class="detail-card">
                <h3>Chronological Mission Milestones</h3>
                <ol class="milestone-timeline">
                  ${eq.mission_history.map(mh => `
                    <li class="milestone-item">
                      <div class="milestone-date">${mh.date || 'Historical Milestone'}</div>
                      <div class="milestone-text">${mh.event}</div>
                    </li>
                  `).join('')}
                </ol>
              </div>
            ` : ''}

            <!-- Claim-Level Sources & Evidence -->
            <div class="detail-card">
              <h3>Sources & Evidence Register</h3>
              <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-bottom: 1rem;">
                Official NASA records and field-level claims supporting this equipment entry:
              </p>

              ${eq.source_claims && eq.source_claims.length > 0 ? `
                <div class="table-responsive" style="margin-bottom: 1.25rem;">
                  <table class="data-table" aria-label="Source Claims Table">
                    <thead>
                      <tr>
                        <th>Specific Claim</th>
                        <th>Confidence</th>
                        <th>Source Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${eq.source_claims.map(c => `
                        <tr>
                          <td style="font-size: 0.88rem;">${c.claim}</td>
                          <td>
                            <span class="status-badge ${c.confidence === 'High' ? 'green' : 'yellow'}" style="font-size: 0.75rem;">
                              ${c.confidence || 'Audited'}
                            </span>
                          </td>
                          <td>
                            <a href="${c.source_url}" target="_blank" rel="noopener noreferrer" class="data-table-link" style="font-size: 0.8rem;">
                              NASA Citation ↗
                            </a>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; font-size: 0.85rem;">
                <div><strong>Primary Record Source:</strong> ${eq.source_note || 'NASA Official Mission Archive'}</div>
                <div><strong>Source URL:</strong> <a href="${eq.source_url}" target="_blank" rel="noopener noreferrer" class="data-table-link">${eq.source_url}</a></div>
                <div style="color: #64748b; margin-top: 4px;">Last Audited / Checked Date: ${eq.source_checked_date}</div>
              </div>
            </div>
          </div>

          <!-- Quick Facts & Location Sidebar Right -->
          <div>
            <!-- Quick Facts Card -->
            <div class="detail-card">
              <h3>Quick Facts</h3>
              <div class="quick-facts-list">
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Hardware ID:</span>
                  <span class="quick-fact-val" style="font-family: monospace;">${eq.id}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Destination:</span>
                  <span class="quick-fact-val">${eq.destination}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Mission:</span>
                  <span class="quick-fact-val">
                    <a href="#/mission/mis_${eq.mission_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}" class="data-table-link">${eq.mission_name}</a>
                  </span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Launch Date:</span>
                  <span class="quick-fact-val">${eq.launch_date || 'Unknown'}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Arrival / Landing:</span>
                  <span class="quick-fact-val">${eq.arrival_or_landing_date || 'Unknown / In Transit'}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Last Communication:</span>
                  <span class="quick-fact-val">${eq.last_communication_date}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Mission Lifecycle:</span>
                  <span class="quick-fact-val">${eq.mission_end_date}</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Physical Disposition:</span>
                  <span class="quick-fact-val">${eq.physical_location_category || 'Surface / Orbit'}</span>
                </div>
              </div>
            </div>

            <!-- Coordinates & Location Card -->
            <div class="detail-card">
              <h3>Extraterrestrial Location</h3>
              ${eq.coordinates ? `
                <div style="font-size: 0.9rem; margin-bottom: 0.75rem;">
                  <div><strong>Latitude:</strong> <span style="font-family: monospace;">${eq.coordinates.latitude}°</span></div>
                  <div><strong>Longitude:</strong> <span style="font-family: monospace;">${eq.coordinates.longitude}°</span></div>
                  <div style="font-size: 0.78rem; color: #64748b; margin-top: 6px;">
                    <strong>Precision:</strong> ${eq.coordinate_accuracy || 'NASA Sourced Coordinate'}
                  </div>
                </div>
              ` : `
                <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">
                  ${eq.destination.split('—')[1] || 'Orbital hardware in motion or named landing region without static pin.'}
                </p>
                <span class="unknown-badge" style="font-size: 0.8rem;">
                  ${eq.coordinate_accuracy || 'Time-dependent or unmapped single pin'}
                </span>
              `}

              ${eq.uncertainty_notes && eq.uncertainty_notes.length > 0 ? `
                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--color-border); font-size: 0.8rem; color: #64748b;">
                  <strong>Uncertainty Notes:</strong>
                  <ul style="margin-left: 1rem; margin-top: 4px;">
                    ${eq.uncertainty_notes.map(un => `<li>${un}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            <!-- Navigation Actions -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <a href="#/compare?item1=${eq.id}" class="btn btn-primary" style="width: 100%;">Compare with Other Hardware ⚖️</a>
              <a href="#/filters" class="btn btn-secondary" style="width: 100%;">← Return to Full Catalogue</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();

window.EquipmentDetailView = EquipmentDetailView;
