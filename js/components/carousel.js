/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Featured Equipment Continuous Sliding Carousel
 * Spec: Center card is active; autoplay every 10 seconds; wrap continuously from last to first;
 * accessible manual controls; omit image area when direct verified asset is unavailable.
 */

const EquipmentCarousel = (() => {
  let currentIndex = 0;
  let items = [];
  let timer = null;
  let isHovered = false;
  const AUTOPLAY_MS = 10000; // 10 seconds as specified

  function init(containerEl, equipmentList) {
    if (!containerEl || !equipmentList || equipmentList.length === 0) return;
    items = equipmentList;
    currentIndex = 0;

    render(containerEl);
    startAutoplay();
  }

  function render(containerEl) {
    const current = items[currentIndex];

    // Build slide HTML adhering to image omission rule:
    // If no verified direct image asset URL, omit the image area entirely!
    const imageHtml = (current.image_url && current.image_url.trim() !== '') ? `
      <div style="margin-top: 1.5rem; border-radius: var(--radius-md); overflow: hidden; max-height: 280px;">
        <img src="${current.image_url}" alt="${current.equipment_name}" style="width: 100%; height: auto; object-fit: cover;">
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Image credit: ${current.image_credit || 'NASA'}</p>
      </div>
    ` : '';

    containerEl.innerHTML = `
      <div class="carousel-header">
        <div>
          <span class="slide-eyebrow">Featured Equipment • ${current.category}</span>
          <h2 class="slide-title">${current.equipment_name}</h2>
        </div>
        <div class="carousel-controls">
          <button type="button" class="carousel-btn" id="carousel-prev" aria-label="Previous equipment slide">❮</button>
          <button type="button" class="carousel-btn" id="carousel-next" aria-label="Next equipment slide">❯</button>
        </div>
      </div>

      <div class="carousel-stage" id="carousel-stage">
        <div class="carousel-slide">
          <p class="slide-description">${current.operational_status || current.mission_objective || 'Historical extraterrestrial exploration hardware.'}</p>
          
          <div class="slide-meta-row">
            <span class="status-badge ${current.working_status_color}">
              <span class="status-dot ${current.working_status_color}"></span>
              ${current.working_status}
            </span>
            <span style="font-size: 0.88rem; color: #475569;">
              <strong>Destination:</strong> ${current.destination}
            </span>
            <span style="font-size: 0.88rem; color: #475569;">
              <strong>Mission:</strong> ${current.mission_name}
            </span>
            ${current.launch_date ? `
              <span style="font-size: 0.88rem; color: #475569;">
                <strong>Launch:</strong> ${current.launch_date}
              </span>
            ` : ''}
          </div>

          ${imageHtml}

          <div style="margin-top: 1.5rem;">
            <a href="#/equipment/${current.id}" class="btn btn-primary">Explore Equipment Details →</a>
          </div>
        </div>
      </div>

      <div class="carousel-indicators" role="tablist" aria-label="Carousel Slides">
        ${items.map((it, idx) => `
          <button type="button" class="carousel-dot ${idx === currentIndex ? 'active' : ''}" 
                  data-index="${idx}" 
                  aria-label="Go to slide ${idx + 1}: ${it.equipment_name}" 
                  role="tab" 
                  aria-selected="${idx === currentIndex ? 'true' : 'false'}"></button>
        `).join('')}
      </div>
    `;

    // Event listeners
    const prevBtn = containerEl.querySelector('#carousel-prev');
    const nextBtn = containerEl.querySelector('#carousel-next');
    const stage = containerEl.querySelector('#carousel-stage');

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    const dots = containerEl.querySelectorAll('.carousel-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        goToSlide(idx);
      });
    });

    if (stage) {
      stage.addEventListener('mouseenter', () => { isHovered = true; });
      stage.addEventListener('mouseleave', () => { isHovered = false; });
      stage.addEventListener('focusin', () => { isHovered = true; });
      stage.addEventListener('focusout', () => { isHovered = false; });
    }
  }

  function nextSlide() {
    // Continuous wraparound from last to first
    currentIndex = (currentIndex + 1) % items.length;
    updateView();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateView();
  }

  function goToSlide(idx) {
    if (idx >= 0 && idx < items.length) {
      currentIndex = idx;
      updateView();
    }
  }

  function updateView() {
    const containerEl = document.getElementById('home-carousel-container');
    if (containerEl) {
      render(containerEl);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => {
      if (!isHovered && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        nextSlide();
      }
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    init,
    nextSlide,
    prevSlide,
    stopAutoplay
  };
})();

window.EquipmentCarousel = EquipmentCarousel;
