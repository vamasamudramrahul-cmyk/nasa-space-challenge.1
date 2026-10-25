/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Celestial Map Visualizer:
 * Renders interactive celestial views for Moon, Mars, and 2D Solar System diagram.
 * Respects data semantics: only plots verified coordinates, indicates regions/orbital paths,
 * and maintains accessible text fallback.
 */

const CelestialMap = (() => {

  function renderDestinationMap(containerId, destination, equipmentList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isMoon = destination.toLowerCase().includes('moon');
    const bgGrad = isMoon
      ? 'radial-gradient(circle at 50% 50%, #475569 0%, #1e293b 70%, #0f172a 100%)'
      : 'radial-gradient(circle at 50% 50%, #c2410c 0%, #9a3412 60%, #431407 100%)';
    const bodyTitle = isMoon ? 'The Moon — Surface Landing Sites & Orbit' : 'Mars — Surface Landing Sites & Orbit';

    // Partition equipment into surface coordinates, surface regions, and orbiters
    const pinned = [];
    const regions = [];
    const orbiters = [];

    equipmentList.forEach(eq => {
      if (eq.map_coordinates && eq.map_coordinates.latitude !== undefined) {
        pinned.push(eq);
      } else if (eq.category === 'Orbiters' || eq.equipment_type.toLowerCase().includes('orbiter')) {
        orbiters.push(eq);
      } else {
        regions.push(eq);
      }
    });

    let pinsSvg = '';
    pinned.forEach((eq, idx) => {
      // Map latitude (-90 to +90) and longitude (-180 to +180) to 2D equirectangular projection (width 700, height 350)
      const lat = eq.map_coordinates.latitude;
      const lon = eq.map_coordinates.longitude;
      const x = ((lon + 180) / 360) * 640 + 30;
      const y = ((90 - lat) / 180) * 280 + 35;

      pinsSvg += `
        <g class="map-pin-group" tabindex="0" role="button" aria-label="${eq.equipment_name}: ${lat}°, ${lon}°" onclick="location.hash='#/equipment/${eq.id}'">
          <circle cx="${x}" cy="${y}" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.6">
            <animate attributeName="r" values="6;16;6" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite"/>
          </circle>
          <text x="${x + 10}" y="${y + 4}" fill="#ffffff" font-size="11" font-weight="700" style="text-shadow: 0 1px 3px rgba(0,0,0,0.9);">${eq.equipment_name.split(' ')[0]}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <div style="background: ${bgGrad}; border-radius: var(--radius-xl); padding: 1.75rem; color: #ffffff; box-shadow: var(--shadow-lg); margin-bottom: 2.5rem; position: relative; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #cbd5e1;">Celestial Exploration Map</span>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: #ffffff;">${bodyTitle}</h3>
          </div>
          <div style="font-size: 0.8rem; background: rgba(0,0,0,0.4); padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.15);">
            <span style="color: #ef4444; font-weight: 700;">● Verified Landing Site</span> &nbsp;|&nbsp; 
            <span style="color: #60a5fa; font-weight: 700;">○ Orbital Path</span>
          </div>
        </div>

        <!-- 2D Planetary Surface Canvas Projection -->
        <div style="position: relative; width: 100%; max-width: 700px; margin: 0 auto; background: rgba(0,0,0,0.25); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
          <svg viewBox="0 0 700 350" style="width: 100%; height: auto; display: block;">
            <!-- Grid lines -->
            <defs>
              <pattern id="grid" width="70" height="35" patternUnits="userSpaceOnUse">
                <path d="M 70 0 L 0 0 0 35" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="700" height="350" fill="url(#grid)" />
            <line x1="0" y1="175" x2="700" y2="175" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4" />
            <line x1="350" y1="0" x2="350" y2="350" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4" />

            <!-- Orbital paths -->
            ${orbiters.length > 0 ? `
              <ellipse cx="350" cy="175" rx="320" ry="140" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.65"/>
              <ellipse cx="350" cy="175" rx="290" ry="120" fill="none" stroke="#93c5fd" stroke-width="1" stroke-dasharray="4,4" opacity="0.45"/>
              <text x="355" y="45" fill="#93c5fd" font-size="10" font-weight="600">Active / Historical Orbital Tracks</text>
            ` : ''}

            <!-- Surface Pins -->
            ${pinsSvg}
          </svg>
        </div>

        <!-- Sourced Coordinates & Regions Breakdown -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; font-size: 0.85rem;">
          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #fca5a5; margin-bottom: 0.5rem;">Sourced Coordinates (${pinned.length})</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px;">
              ${pinned.map(p => `
                <li>
                  <a href="#/equipment/${p.id}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${p.equipment_name}</a>: 
                  <span style="color: #cbd5e1; font-family: monospace;">${p.map_coordinates.latitude}°, ${p.map_coordinates.longitude}°</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #fef08a; margin-bottom: 0.5rem;">Named Surface Regions (${regions.length})</h4>
            <p style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 4px;">Rovers & landers resting in named regions without static single coordinates:</p>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px;">
              ${regions.slice(0, 5).map(r => `
                <li>
                  <a href="#/equipment/${r.id}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${r.equipment_name}</a>: 
                  <span style="color: #cbd5e1;">${r.destination.split('—')[1] || r.destination}</span>
                </li>
              `).join('')}
              ${regions.length > 5 ? `<li style="color: #94a3b8; font-size: 0.75rem;">+ ${regions.length - 5} more in catalogue below</li>` : ''}
            </ul>
          </div>

          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #93c5fd; margin-bottom: 0.5rem;">Orbiters (${orbiters.length})</h4>
            <p style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 4px;">Hardware in orbit (ephemeris-dependent, no fixed surface pins):</p>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px;">
              ${orbiters.map(o => `
                <li>
                  <a href="#/equipment/${o.id}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${o.equipment_name}</a> 
                  <span style="color: #93c5fd;">(${o.working_status})</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function renderSolarSystem(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const planets = [
      { name: 'Sun', color: '#f59e0b', r: 16, x: 50 },
      { name: 'Mercury', color: '#94a3b8', r: 5, x: 120, mission: 'MESSENGER' },
      { name: 'Venus', color: '#fde047', r: 7, x: 180, mission: 'Magellan' },
      { name: 'Earth', color: '#3b82f6', r: 7.5, x: 250, mission: 'Home' },
      { name: 'Mars', color: '#ef4444', r: 6, x: 320, mission: 'Multiple Missions' },
      { name: 'Jupiter', color: '#d97706', r: 13, x: 420, mission: 'Galileo & Juno' },
      { name: 'Saturn', color: '#eab308', r: 11, x: 520, mission: 'Cassini-Huygens' },
      { name: 'Uranus', color: '#38bdf8', r: 8.5, x: 610, mission: 'Voyager 2' },
      { name: 'Neptune', color: '#2563eb', r: 8.5, x: 690, mission: 'Voyager 2' },
      { name: 'Pluto & Kuiper Belt', color: '#a8a29e', r: 4, x: 770, mission: 'New Horizons' }
    ];

    let planetsSvg = '';
    planets.forEach(p => {
      planetsSvg += `
        <g class="planet-node" style="cursor: pointer;" onclick="document.getElementById('planetary-card-${p.mission.toLowerCase().split(' ')[0]}')?.scrollIntoView({behavior: 'smooth'})">
          <line x1="${p.x}" y1="40" x2="${p.x}" y2="160" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2,2"/>
          <circle cx="${p.x}" cy="100" r="${p.r}" fill="${p.color}" stroke="#ffffff" stroke-width="1.5"/>
          <text x="${p.x}" y="130" fill="#ffffff" font-size="10" font-weight="700" text-anchor="middle">${p.name}</text>
          <text x="${p.x}" y="145" fill="#93c5fd" font-size="8.5" text-anchor="middle">${p.mission}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <div style="background: radial-gradient(ellipse at 50% 50%, #1e1b4b 0%, #0f172a 70%, #020617 100%); border-radius: var(--radius-xl); padding: 2rem; color: #ffffff; margin-bottom: 2.5rem; box-shadow: var(--shadow-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #93c5fd;">Interactive Solar System Schematic</span>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: #ffffff;">NASA Outer Planetary Exploration Route</h3>
          </div>
          <span style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">*Illustrative schematic; distances not to scale</span>
        </div>

        <div style="overflow-x: auto; padding-bottom: 1rem;">
          <svg viewBox="0 0 830 180" style="min-width: 780px; width: 100%; height: auto; display: block;">
            <line x1="20" y1="100" x2="810" y2="100" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            ${planetsSvg}
          </svg>
        </div>
      </div>
    `;
  }

  return {
    renderDestinationMap,
    renderSolarSystem
  };
})();

window.CelestialMap = CelestialMap;
