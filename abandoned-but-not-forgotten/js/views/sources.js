/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Sources and Evidence View:
 * Full methodology disclosure, audit protocols, and searchable source register.
 */

const SourcesView = (() => {

  function render(container) {
    const sources = DataService.getSources();

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Data Provenance & Audit Registry</span>
          <h1 class="section-title">Sources and Evidence Protocol</h1>
          <p class="section-description">
            Scientific rigor and factual traceability are the cornerstones of Abandoned but Not Forgotten.
            Every claim, date, coordinate, mass figure, and operational status in this prototype is grounded in official NASA and primary scientific documentation.
          </p>
        </div>

        <!-- Methodology Statement -->
        <div class="detail-card" style="margin-bottom: 2.5rem; background: #f8fafc;">
          <h3>Editorial Standards & Verification Protocols</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem; font-size: 0.92rem; color: #334155;">
            <div>
              <h4 style="font-weight: 700; color: var(--color-nasa-blue); margin-bottom: 4px;">1. NASA-Only Hardware Scope</h4>
              <p>The detailed equipment catalogue is strictly limited to NASA-led or NASA-operated missions on the Moon and Mars. Non-NASA missions were excluded from the catalogue to ensure direct provenance against NASA records.</p>
            </div>
            <div>
              <h4 style="font-weight: 700; color: var(--color-nasa-blue); margin-bottom: 4px;">2. Operational vs Outcome Separation</h4>
              <p>Successful mission outcome is not proof that hardware currently operates. We distinguish mission outcome ("Successful") from current operational status ("Working" vs "Lost contact or stopped working").</p>
            </div>
            <div>
              <h4 style="font-weight: 700; color: var(--color-nasa-blue); margin-bottom: 4px;">3. Mass & Coordinate Precision</h4>
              <p>We do not invent coordinates or sum incomparable mass values. Landed surface vehicle mass is kept distinct from launch vehicle mass, and unverified positions remain explicitly labelled as approximate or unmapped.</p>
            </div>
            <div>
              <h4 style="font-weight: 700; color: var(--color-nasa-blue); margin-bottom: 4px;">4. Verified Image Policy</h4>
              <p>If a suitable verified direct official NASA image asset, original source page, and credit/reuse conditions are unavailable, the image area is omitted entirely. No placeholder graphics or speculative illustrations are used.</p>
            </div>
          </div>
        </div>

        <!-- Searchable Sources Table -->
        <div class="detail-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 10px;">
            <h3>Primary Source Register (${sources.length} Cited Sources)</h3>
            <input type="text" id="source-search-input" class="filter-input" placeholder="Search sources or organisations..." style="max-width: 320px;">
          </div>

          <div class="table-responsive">
            <table class="data-table" aria-label="Official Sources Register Table">
              <thead>
                <tr>
                  <th style="width: 30%;">Source Title</th>
                  <th style="width: 25%;">Organisation</th>
                  <th style="width: 25%;">Supported Equipment & Missions</th>
                  <th style="width: 10%;">Last Audited</th>
                  <th style="width: 10%;">Action</th>
                </tr>
              </thead>
              <tbody id="sources-table-body">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const searchInput = container.querySelector('#source-search-input');
    const tbody = container.querySelector('#sources-table-body');

    function update() {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = sources.filter(s => {
        return !q ||
          s.title.toLowerCase().includes(q) ||
          s.organization.toLowerCase().includes(q) ||
          (s.equipment_supported && s.equipment_supported.some(eq => eq.toLowerCase().includes(q)));
      });

      tbody.innerHTML = filtered.map(s => `
        <tr>
          <td>
            <strong>${s.title}</strong>
            ${s.notes ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${s.notes.slice(0, 70)}...</div>` : ''}
          </td>
          <td>${s.organization}</td>
          <td style="font-size: 0.82rem; color: #334155;">
            ${s.equipment_supported ? s.equipment_supported.slice(0, 3).join(', ') + (s.equipment_supported.length > 3 ? ` (+${s.equipment_supported.length - 3} more)` : '') : 'General NASA Archive'}
          </td>
          <td style="font-size: 0.8rem; font-family: monospace;">${s.checked_date || '2026-10-23'}</td>
          <td>
            <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">Visit ↗</a>
          </td>
        </tr>
      `).join('');
    }

    searchInput.addEventListener('input', update);
    update();
  }

  return { render };
})();

window.SourcesView = SourcesView;
