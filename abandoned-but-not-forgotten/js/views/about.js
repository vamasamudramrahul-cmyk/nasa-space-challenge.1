/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * About View: Narrative, Challenge Context, Methodology, and Data Transparency
 */

const AboutView = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Project Background & Purpose</span>
          <h1 class="section-title">About Abandoned but Not Forgotten</h1>
          <p class="section-description">
            An archaeological and scientific registry of humanity's extraterrestrial footprint across the Moon, Mars, and beyond.
          </p>
        </div>

        <div class="detail-layout">
          <!-- Main Narrative Column -->
          <div>
            <div class="detail-card">
              <h3>The Extraterrestrial Heritage of Humanity</h3>
              <p style="font-size: 1.05rem; line-height: 1.75; color: var(--color-text-main); margin-bottom: 1.25rem;">
                When humanity leaves spacecraft, rovers, and landers on the surfaces of other celestial bodies, they do not merely become inactive machinery—they transform into permanent monuments of scientific endeavor.
                Resting in the eternal vacuum of the lunar regolith or the windswept sands of Mars, these artifacts represent the milestones of human curiosity, engineering audacity, and technological triumph.
              </p>
              <p style="font-size: 1rem; line-height: 1.7; color: var(--color-text-muted); margin-bottom: 1.25rem;">
                From the descent stage of Apollo 11's Lunar Module <em>Eagle</em> standing silently at Tranquility Base to the wheel tracks carved across Meridiani Planum by <em>Opportunity</em>, every piece of hardware left behind holds irreplaceable historical, scientific, and cultural value.
              </p>
              <p style="font-size: 1rem; line-height: 1.7; color: var(--color-text-muted);">
                <strong>Abandoned but Not Forgotten</strong> provides an open, evidence-grounded registry documenting these artifacts, their operational histories, their physical remains, and their lasting legacies.
              </p>
            </div>

            <div class="detail-card">
              <h3>NASA Space Apps Challenge 2026</h3>
              <p style="font-size: 1rem; line-height: 1.7; color: var(--color-text-muted); margin-bottom: 1rem;">
                Developed as a working prototype for the <strong>NASA Space Apps Challenge 2026</strong>, this project utilizes NASA's open scientific repositories, planetary science archives, and the NASA Space Science Data Coordinated Archive (NSSDC) to build an interactive, evidence-backed catalogue.
              </p>
              <div style="background: var(--color-bg-subtle); padding: 1rem 1.25rem; border-radius: var(--radius-md); font-size: 0.9rem; border-left: 3px solid var(--color-nasa-blue);">
                <strong>Secondary Label:</strong> NASA SPACE APPS CHALLENGE • Prototype Release October 2026
              </div>
            </div>

            <div class="detail-card">
              <h3>Data Transparency & Scientific Guardrails</h3>
              <ul style="margin-left: 1.25rem; font-size: 0.95rem; color: var(--color-text-muted); line-height: 1.7;">
                <li><strong>Working Seed Subset:</strong> The current catalogue features 19 NASA-led or NASA-operated Moon and Mars equipment items as an audited working subset. It does not claim to be an exhaustive inventory of all human space hardware.</li>
                <li><strong>No Fabricated Information:</strong> We do not guess or infer landing coordinates, mass numbers, launch dates, or operational statuses to make cards look cosmetically complete. Unsupported fields are labelled "Unknown / Not verified".</li>
                <li><strong>Separation of Operating Status from Outcome:</strong> A mission that succeeded in its primary scientific goals is marked with a "Successful" outcome, while its hardware is classified according to whether it currently operates ("Working" vs "Lost contact or stopped working").</li>
                <li><strong>Strict Image Integrity:</strong> Photographs are displayed only when a verified official direct NASA asset, source page, and credit/reuse review are confirmed. Unverified records omit the image area entirely.</li>
              </ul>
            </div>
          </div>

          <!-- Quick Information Sidebar -->
          <div>
            <div class="detail-card">
              <h3>Project Specifications</h3>
              <div class="quick-facts-list">
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Challenge:</span>
                  <span class="quick-fact-val">NASA Space Apps 2026</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Catalogue Scope:</span>
                  <span class="quick-fact-val">NASA Moon & Mars</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Planetary Scope:</span>
                  <span class="quick-fact-val">Mission-level Cards</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Seed Catalogue Size:</span>
                  <span class="quick-fact-val">19 Hardware Records</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Primary Sources:</span>
                  <span class="quick-fact-val">NASA Science & NSSDC</span>
                </div>
                <div class="quick-fact-item">
                  <span class="quick-fact-label">Architecture:</span>
                  <span class="quick-fact-val">Self-Contained Client SPA</span>
                </div>
              </div>

              <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 8px;">
                <a href="#/sources" class="btn btn-primary" style="width: 100%;">View Sources & Methodology →</a>
                <a href="#/quiz" class="btn btn-secondary" style="width: 100%;">Take the Heritage Quiz 🚀</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();

window.AboutView = AboutView;
