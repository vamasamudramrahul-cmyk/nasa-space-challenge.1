/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * App Router & Core Controller
 */

const App = (() => {

  let isInitialized = false;

  async function init() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Loading State
    appContainer.innerHTML = `
      <div style="min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #64748b;">
        <div style="font-size: 2.5rem; animation: pulse 1.5s infinite;">🚀</div>
        <p style="font-weight: 600; font-size: 1.1rem; color: var(--color-text-main);">Loading Verified NASA Exploration Data...</p>
      </div>
    `;

    // Load data
    await DataService.init();

    // Init universal search
    UniversalSearch.init();

    // Setup navigation and mobile drawer
    setupNavigation();

    // Setup routing
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    isInitialized = true;
  }

  function setupNavigation() {
    // Dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const parentItem = toggle.closest('.nav-item');
        const isOpen = parentItem.classList.contains('dropdown-open');

        // Close other dropdowns
        document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
          if (item !== parentItem) item.classList.remove('dropdown-open');
        });

        parentItem.classList.toggle('dropdown-open', !isOpen);
        toggle.setAttribute('aria-expanded', !isOpen);
      });
    });

    // Close dropdowns on outside click or Esc
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item')) {
        closeAllDropdowns();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
        closeMobileDrawer();
      }
    });

    // Mobile Drawer Toggle
    const mobileToggleBtn = document.getElementById('mobile-nav-toggle');
    const drawerBackdrop = document.getElementById('mobile-drawer-backdrop');
    const drawerCloseBtn = document.getElementById('mobile-drawer-close');

    if (mobileToggleBtn && drawerBackdrop) {
      mobileToggleBtn.addEventListener('click', openMobileDrawer);
    }
    if (drawerCloseBtn && drawerBackdrop) {
      drawerCloseBtn.addEventListener('click', closeMobileDrawer);
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) closeMobileDrawer();
      });
    }

    // Close drawer when mobile links are clicked
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMobileDrawer);
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
      item.classList.remove('dropdown-open');
      const toggle = item.querySelector('.dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function openMobileDrawer() {
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeMobileDrawer() {
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  function parseHash() {
    const hash = window.location.hash || '#/';
    const [pathPart, queryPart] = hash.split('?');
    const path = pathPart.replace(/^#\/?/, '').toLowerCase().trim();

    const queryParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [k, v] of searchParams.entries()) {
        queryParams[k] = v;
      }
    }

    return { path, queryParams };
  }

  function handleRoute() {
    closeAllDropdowns();
    const { path, queryParams } = parseHash();
    const appContainer = document.getElementById('app-container');

    // Clean up Hero animation if leaving home
    if (window.HeroStarfield && path !== '' && path !== 'home') {
      window.HeroStarfield.destroy();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav active states
    updateActiveNav(path);

    // Route matching
    if (!path || path === '' || path === 'home') {
      HomeView.render(appContainer);
    } else if (path === 'destination/moon') {
      DestinationView.render(appContainer, 'moon');
    } else if (path === 'destination/mars') {
      DestinationView.render(appContainer, 'mars');
    } else if (path === 'destination/planets') {
      PlanetsView.render(appContainer);
    } else if (path === 'missions') {
      MissionsView.renderDirectory(appContainer);
    } else if (path.startsWith('mission/')) {
      const missionId = path.split('/')[1];
      MissionsView.renderDetail(appContainer, missionId);
    } else if (path === 'filters' || path === 'equipment') {
      CatalogueView.render(appContainer, queryParams);
    } else if (path.startsWith('equipment/')) {
      const eqId = path.split('/')[1];
      EquipmentDetailView.render(appContainer, eqId);
    } else if (path === 'timeline') {
      TimelineView.render(appContainer, 'all');
    } else if (path === 'timeline/moon') {
      TimelineView.render(appContainer, 'moon');
    } else if (path === 'timeline/mars') {
      TimelineView.render(appContainer, 'mars');
    } else if (path === 'timeline/all') {
      TimelineView.render(appContainer, 'all');
    } else if (path === 'compare') {
      CompareView.render(appContainer, queryParams);
    } else if (path === 'quiz') {
      QuizView.render(appContainer);
    } else if (path === 'glossary') {
      GlossaryView.render(appContainer, queryParams);
    } else if (path === 'sources') {
      SourcesView.render(appContainer);
    } else if (path === 'updates') {
      UpdatesView.render(appContainer);
    } else if (path === 'about') {
      AboutView.render(appContainer);
    } else {
      renderNotFound(appContainer, path);
    }
  }

  function updateActiveNav(path) {
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-toggle');
    navLinks.forEach(link => link.classList.remove('active'));

    if (!path || path === '' || path === 'home') {
      const homeLink = document.querySelector('a[href="#/"]');
      if (homeLink) homeLink.classList.add('active');
    } else if (path.startsWith('destination') || path.startsWith('mission')) {
      const destToggle = document.getElementById('nav-destination-toggle');
      if (destToggle) destToggle.classList.add('active');
    } else if (path === 'quiz' || path === 'glossary' || path === 'sources') {
      const learnToggle = document.getElementById('nav-learn-toggle');
      if (learnToggle) learnToggle.classList.add('active');
    } else if (path.startsWith('timeline')) {
      const timelineToggle = document.getElementById('nav-timeline-toggle');
      if (timelineToggle) timelineToggle.classList.add('active');
    } else {
      const directLink = document.querySelector(`a[href="#/${path}"]`);
      if (directLink) directLink.classList.add('active');
    }
  }

  function renderNotFound(container, requestedPath) {
    container.innerHTML = `
      <div class="section-container" style="text-align: center; padding: 6rem 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
        <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem;">404 — Coordinates Not Located</h1>
        <p style="font-size: 1.1rem; color: var(--color-text-muted); max-width: 600px; margin: 0 auto 2rem;">
          The route "#/${requestedPath}" does not correspond to any known extraterrestrial hardware, destination, or mission record.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="#/" class="btn btn-primary">Return to Home</a>
          <a href="#/filters" class="btn btn-secondary">Search Catalogue</a>
        </div>
      </div>
    `;
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
