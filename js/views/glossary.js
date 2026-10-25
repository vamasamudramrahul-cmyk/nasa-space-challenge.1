/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Glossary View: Searchable, categorized space terminology with citations
 */

const GlossaryView = (() => {

  function render(container, queryParams = {}) {
    const allTerms = DataService.getGlossaryTerms();
    const categories = ['ALL', ...new Set(allTerms.map(t => t.category))];

    container.innerHTML = `
      <div class="section-container">
        <!-- Header -->
        <div class="section-header">
          <span class="section-eyebrow">Reference Library</span>
          <h1 class="section-title">Glossary of Space Exploration Terms</h1>
          <p class="section-description">
            Explore verified terminology covering mission operations, hardware types, orbital trajectories, and extraterrestrial archaeological concepts.
            Click any entry to view its complete definition and primary reference source.
          </p>
        </div>

        <!-- Controls -->
        <div class="glossary-controls">
          <input type="text" id="glossary-search" class="filter-input" placeholder="Search terminology or definitions..." value="${queryParams.term ? decodeURIComponent(queryParams.term) : ''}">

          <div class="category-pills" id="glossary-category-pills">
            ${categories.map(cat => `
              <button type="button" class="category-pill ${cat === 'ALL' ? 'active' : ''}" data-category="${cat}">
                ${cat === 'ALL' ? 'All Categories' : cat}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Terms List -->
        <div class="glossary-list" id="glossary-list-container">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const searchInput = container.querySelector('#glossary-search');
    const pills = container.querySelectorAll('.category-pill');
    const listContainer = container.querySelector('#glossary-list-container');

    let currentCategory = 'ALL';

    function update() {
      const q = searchInput.value.toLowerCase().trim();

      const filtered = allTerms.filter(item => {
        const matchesCat = currentCategory === 'ALL' || item.category === currentCategory;
        const matchesQ = !q || item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q);
        return matchesCat && matchesQ;
      });

      renderTerms(filtered, listContainer);
    }

    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.dataset.category;
        update();
      });
    });

    searchInput.addEventListener('input', update);

    update();
  }

  function renderTerms(terms, container) {
    if (terms.length === 0) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); padding: 3rem; text-align: center; color: var(--color-text-muted);">
          <h3>No glossary terms match your search</h3>
          <p style="margin-top: 6px;">Try searching for "Lander", "Rover", "Sol", or "Orbit".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = terms.map((item, idx) => `
      <article class="glossary-item" id="term-${idx}">
        <div class="glossary-item-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <h3 class="glossary-term">${item.term}</h3>
            <span class="glossary-cat-badge">${item.category}</span>
          </div>
          <span style="font-size: 1.1rem; color: #64748b; font-weight: 700;">▾</span>
        </div>
        <div class="glossary-def">
          <p>${item.definition}</p>
          <div class="glossary-source">
            <strong>Source Reference:</strong> 
            <a href="${item.source_url}" target="_blank" rel="noopener noreferrer" class="data-table-link">${item.source} ↗</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  return { render };
})();

window.GlossaryView = GlossaryView;
