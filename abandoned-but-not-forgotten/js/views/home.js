/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Home View:
 * Screen-1: Scoped dark animated universe hero (canvas stars, nebula, shooting stars)
 * Screen-2: Straddling 3-card container (Explore Moon, Explore Mars, Explore Planets)
 * Screen-3: Browse equipment by their topic (6 category cards)
 * Screen-4: The Legacy at a Glance (3 runtime statistics cards)
 * Screen-5: Featured Equipment Continuous Sliding Carousel
 * Screen-6: Catalogue Preview & Filter Entry
 */

const HomeView = (() => {

  function render(container) {
    const stats = DataService.getStats();
    const equipmentList = DataService.getEquipmentList();

    container.innerHTML = `
      <!-- HOME SCREEN-1: SCOPED DARK ANIMATED UNIVERSE HERO -->
      <section class="universe" aria-labelledby="hero-title">
        <div class="nebula nebula-one" aria-hidden="true"></div>
        <div class="nebula nebula-two" aria-hidden="true"></div>
        <div class="nebula nebula-three" aria-hidden="true"></div>
        <div class="distant-stars" aria-hidden="true"></div>
        <canvas id="stars" aria-hidden="true"></canvas>
        <div class="shooting-star" aria-hidden="true"></div>
        <div class="shooting-star two" aria-hidden="true"></div>
        <div class="atmosphere" aria-hidden="true"></div>
        <div class="center-content">
          <p class="hero-eyebrow">NASA SPACE APPS CHALLENGE</p>
          <h1 id="hero-title">ABANDONED BUT NOT FORGOTTEN</h1>
          <p class="hero-description">Explore the forgotten history of space exploration. Discover the missions, spacecraft, rovers, landers, and scientific instruments that shaped our understanding of the Moon, Mars, and beyond. Uncover their stories, explore their legacies, and learn what remains after their missions end.</p>
        </div>
      </section>

      <!-- HOME SCREEN-2: STRADDLING 3-CARD CONTAINER -->
      <div class="straddling-container">
        <div class="straddling-box">
          <div class="straddling-grid">
            <!-- Explore Moon Card -->
            <a href="#/destination/moon" class="destination-card" aria-label="Explore Moon catalogue and landing sites">
              <div>
                <div class="destination-card-header">
                  <h2 class="destination-card-title">Explore Moon</h2>
                  <div class="destination-card-arrow">→</div>
                </div>
                <p class="destination-card-desc">Journey through NASA's historic lunar exploration from early Surveyor soft landings and the Apollo landings to the active Lunar Reconnaissance Orbiter.</p>
              </div>
              <div class="destination-card-meta">
                <span>View Lunar Hardware</span>
              </div>
            </a>

            <!-- Explore Mars Card -->
            <a href="#/destination/mars" class="destination-card" aria-label="Explore Mars catalogue and landing sites">
              <div>
                <div class="destination-card-header">
                  <h2 class="destination-card-title">Explore Mars</h2>
                  <div class="destination-card-arrow">→</div>
                </div>
                <p class="destination-card-desc">Discover robotic explorers on the Red Planet, including Viking landers, the pioneering Sojourner, MER rovers Spirit & Opportunity, Curiosity, and Ingenuity.</p>
              </div>
              <div class="destination-card-meta">
                <span>View Martian Hardware</span>
              </div>
            </a>

            <!-- Explore Planets Card -->
            <a href="#/destination/planets" class="destination-card" aria-label="Explore Planetary missions beyond Moon and Mars">
              <div>
                <div class="destination-card-header">
                  <h2 class="destination-card-title">Explore Planets</h2>
                  <div class="destination-card-arrow">→</div>
                </div>
                <p class="destination-card-desc">Separate NASA mission-level stories and trajectories across the Solar System: MESSENGER, Magellan, Galileo, Cassini, Juno, Voyager 2, and New Horizons.</p>
              </div>
              <div class="destination-card-meta">
                <span>View Planetary Missions</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div class="section-container">
        <!-- HOME SCREEN-3: BROWSE EQUIPMENT BY THEIR TOPIC -->
        <section class="section-header">
          <span class="section-eyebrow">Categorized Exploration</span>
          <h2 class="section-title">Browse equipment by their topic</h2>
          <p class="section-description">Browse the Moon and Mars equipment catalogue by hardware type. Select a category to open a filtered grid, then choose an item to view its mission history, available specifications, status evidence, and sources.</p>
          
          <div class="topic-grid">
            <a href="#/filters?type=Rovers" class="topic-card">
              <div class="topic-icon-wrap">🛞</div>
              <div class="topic-info">
                <h3>Rovers</h3>
                <span>Mobile wheeled surface explorers (Apollo LRV, Sojourner, Spirit, Opportunity, Curiosity, Perseverance)</span>
              </div>
            </a>

            <a href="#/filters?type=Landers" class="topic-card">
              <div class="topic-icon-wrap">🛰️</div>
              <div class="topic-info">
                <h3>Landers</h3>
                <span>Stationary surface platforms (Surveyor 1, Viking 1 & 2, Pathfinder, Phoenix, InSight)</span>
              </div>
            </a>

            <a href="#/filters?type=Orbiters" class="topic-card">
              <div class="topic-icon-wrap">🪐</div>
              <div class="topic-info">
                <h3>Orbiters</h3>
                <span>Mapping and science orbiters (Lunar Orbiter 1, LRO, Mars Odyssey, MRO, MAVEN)</span>
              </div>
            </a>

            <a href="#/filters?type=Space%20crafts" class="topic-card">
              <div class="topic-icon-wrap">🚀</div>
              <div class="topic-info">
                <h3>Space crafts</h3>
                <span>Planetary spacecraft platforms and exploration systems</span>
              </div>
            </a>

            <a href="#/filters?type=Helicopters" class="topic-card">
              <div class="topic-icon-wrap">🚁</div>
              <div class="topic-info">
                <h3>Helicopters</h3>
                <span>Atmospheric aerial demonstrator (Ingenuity Mars Helicopter)</span>
              </div>
            </a>

            <a href="#/filters?type=Descent%20stages" class="topic-card">
              <div class="topic-icon-wrap">🪜</div>
              <div class="topic-info">
                <h3>Descent stages</h3>
                <span>Lunar landing platforms left on the surface (Apollo 11 Lunar Module Eagle)</span>
              </div>
            </a>
          </div>
        </section>

        <!-- HOME SCREEN-4: THE LEGACY AT A GLANCE (STATISTICS) -->
        <section class="stats-container" aria-labelledby="stats-heading">
          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd;">Extraterrestrial Registry</span>
          <h2 id="stats-heading" style="font-size: 2rem; font-weight: 800; color: #ffffff; margin-top: 4px;">The Legacy at a Glance</h2>
          <p style="color: #cbd5e1; font-size: 0.95rem; margin-top: 4px;">Dynamic registry metrics calculated directly from the verified NASA Moon and Mars equipment seed catalogue.</p>

          <div class="stats-grid">
            <!-- Achieved Equipment -->
            <div class="stat-card">
              <div class="stat-number">${stats.achievedEquipmentCount}</div>
              <div class="stat-label">Achieved equipment</div>
              <div class="stat-subtext">Verified NASA Moon and Mars mission hardware records catalogued at runtime.</div>
            </div>

            <!-- Estimated Abandoned Mass -->
            <div class="stat-card">
              <div class="stat-number">${stats.estimatedMassKg.toLocaleString()} kg</div>
              <div class="stat-label">Estimated Abandoned mass</div>
              <div class="stat-subtext">${stats.massCoverageNote}</div>
            </div>

            <!-- Earliest Artifact Year -->
            <div class="stat-card">
              <div class="stat-number">${stats.earliestArtifactYear}</div>
              <div class="stat-label">Earliest artifact year</div>
              <div class="stat-subtext">Established by Surveyor 1 (soft landing June 1966) & Lunar Orbiter 1 (October 1966).</div>
            </div>
          </div>
        </section>

        <!-- HOME SCREEN-5: FEATURED EQUIPMENT CAROUSEL -->
        <section id="home-carousel-container" class="carousel-section" aria-label="Featured Equipment Carousel">
          <!-- Populated by EquipmentCarousel -->
        </section>

        <!-- HOME SCREEN-6: CATALOGUE PREVIEW & STATUS LEGEND -->
        <section style="margin-top: 3.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="section-eyebrow">Equipment Catalogue Overview</span>
              <h2 class="section-title">Verified Hardware Inventory</h2>
            </div>
            <a href="#/filters" class="btn btn-primary">Open Full Catalogue & Filters →</a>
          </div>

          <!-- Status Legend Bar -->
          <div class="status-legend-bar">
            <span class="legend-title">Equipment Status Legend:</span>
            <div class="legend-item">
              <span class="status-dot green"></span>
              <strong>Green:</strong> Successful (Mission outcome)
            </div>
            <div class="legend-item">
              <span class="status-dot yellow"></span>
              <strong>Yellow:</strong> Working (Currently operational)
            </div>
            <div class="legend-item">
              <span class="status-dot red"></span>
              <strong>Red:</strong> Lost contact or stopped working (Mission ended)
            </div>
          </div>

          <!-- Quick Table Preview -->
          <div class="table-responsive">
            <table class="data-table" aria-label="Equipment Catalogue Sample Table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Status</th>
                  <th>Equipment Type</th>
                  <th>Destination</th>
                  <th>Coordinates</th>
                  <th>Launch Date</th>
                </tr>
              </thead>
              <tbody>
                ${equipmentList.slice(0, 8).map(eq => `
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
                        <span style="font-family: monospace; font-size: 0.8rem;">${eq.coordinates.latitude}°, ${eq.coordinates.longitude}°</span>
                      ` : `
                        <span class="unknown-badge">${eq.coordinate_accuracy ? eq.coordinate_accuracy.slice(0, 35) + '...' : 'Unavailable'}</span>
                      `}
                    </td>
                    <td>${eq.launch_date || 'Unknown'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 1.5rem;">
            <a href="#/filters" class="btn btn-secondary">Browse All ${equipmentList.length} Moon & Mars Records with Filters</a>
          </div>
        </section>
      </div>
    `;

    // Initialize Hero Starfield
    if (window.HeroStarfield) {
      window.HeroStarfield.init();
    }

    // Initialize Equipment Carousel
    if (window.EquipmentCarousel) {
      window.EquipmentCarousel.init(document.getElementById('home-carousel-container'), equipmentList);
    }
  }

  return { render };
})();

window.HomeView = HomeView;
