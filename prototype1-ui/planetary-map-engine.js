/*
 * Abandoned but Not Forgotten — NASA-backed Planetary Map Engine
 * Uses Three.js for textured 3D globes; falls back to procedural texture if remote imagery fails.
 * Global textures: NASA SVS LROC (Moon) and NASA/JPL Solar System Simulator planetary maps.
 * Regional high-resolution surface analysis remains available through NASA Solar System Treks.
 */
(function (window, document) {
  'use strict';

  const NASA_MOON_TEXTURE = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg';
  const NASA_JPL_TEXTURES = {
    mercury: { url: 'https://space.jpl.nasa.gov/tmaps/pix/mer0muu2.jpg', credit: 'NASA/JPL/USGS; Mariner 10 global map, partial coverage' },
    venus: { url: 'https://space.jpl.nasa.gov/tmaps/pix/ven0ajj2.jpg', credit: 'NASA/JPL/Caltech; Magellan radar-derived map' },
    earth: { url: 'https://space.jpl.nasa.gov/tmaps/pix/ear0xuu2.jpg', credit: 'Caltech/JPL/USGS' },
    mars: { url: 'https://space.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg', credit: 'NASA/JPL/USGS; Viking image mosaic' },
    jupiter: { url: 'https://space.jpl.nasa.gov/tmaps/pix/jup0vss1.jpg', credit: 'NASA/JPL/Caltech; Voyager-derived representative texture' },
    saturn: { url: 'https://space.jpl.nasa.gov/tmaps/pix/sat0fds1.jpg', credit: 'NASA/JPL/Caltech; illustrative Saturn texture (not scientific data)' },
    uranus: { url: 'https://space.jpl.nasa.gov/tmaps/pix/ura0fss1.jpg', credit: 'NASA/JPL/Caltech; representative blue texture' },
    neptune: { url: 'https://space.jpl.nasa.gov/tmaps/pix/nep0fds1.jpg', credit: 'NASA/JPL/Caltech; representative cloud texture' }
  };
  const NASA_TREK = {
    moon: 'https://trek.nasa.gov/moon/',
    mars: 'https://trek.nasa.gov/mars/',
    planets: 'https://trek.nasa.gov/'
  };
  const bodies = {
    moon: { label: 'Moon', texture: NASA_MOON_TEXTURE, credit: 'NASA/GSFC/Arizona State University; LRO Wide Angle Camera color mosaic', color: '#aaa69c', mapKey: 'moon' },
    mars: { label: 'Mars', texture: NASA_JPL_TEXTURES.mars.url, credit: NASA_JPL_TEXTURES.mars.credit, color: '#b94a32', mapKey: 'mars' },
    mercury: { label: 'Mercury', texture: NASA_JPL_TEXTURES.mercury.url, credit: NASA_JPL_TEXTURES.mercury.credit, color: '#938d85' },
    venus: { label: 'Venus', texture: NASA_JPL_TEXTURES.venus.url, credit: NASA_JPL_TEXTURES.venus.credit, color: '#c77b37' },
    earth: { label: 'Earth', texture: NASA_JPL_TEXTURES.earth.url, credit: NASA_JPL_TEXTURES.earth.credit, color: '#247ab8' },
    jupiter: { label: 'Jupiter', texture: NASA_JPL_TEXTURES.jupiter.url, credit: NASA_JPL_TEXTURES.jupiter.credit, color: '#bb9a6b' },
    saturn: { label: 'Saturn', texture: NASA_JPL_TEXTURES.saturn.url, credit: NASA_JPL_TEXTURES.saturn.credit, color: '#cead78' },
    uranus: { label: 'Uranus', texture: NASA_JPL_TEXTURES.uranus.url, credit: NASA_JPL_TEXTURES.uranus.credit, color: '#3f9cce' },
    neptune: { label: 'Neptune', texture: NASA_JPL_TEXTURES.neptune.url, credit: NASA_JPL_TEXTURES.neptune.credit, color: '#4267bd' },
    sun: { label: 'Sun', texture: '', credit: 'Procedural visualization; use NASA Solar System Treks for mission/solar data', color: '#f59e0b' }
  };

  const instances = {};
  let sourceData = { equipment: [], planets: [] };
  let moonTrekWmtsCanvasPromise = null;
  let didMount = false;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeText(value, fallback) { return value == null || value === '' ? (fallback || '') : String(value); }
  function byId(id) { return document.getElementById(id); }

  function normalizeCoordinates(item) {
    if (!item || item.hasLocation === false || item.latitude == null || item.longitude == null || item.latitude === '' || item.longitude === '') return null;
    const latitude = Number(item.latitude);
    const rawLongitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(rawLongitude) || latitude < -90 || latitude > 90) return null;
    let longitude = rawLongitude;
    while (longitude > 180) longitude -= 360;
    while (longitude < -180) longitude += 360;
    return { latitude, longitude };
  }

  function textureCanvas(bodyKey, mode) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const body = bodies[bodyKey] || bodies.mars;
    ctx.fillStyle = body.color || '#a2a2a2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bodyKey === 'sun') {
      const solar = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      solar.addColorStop(0, '#f97316'); solar.addColorStop(.28, '#fbbf24'); solar.addColorStop(.55, '#ffdf75'); solar.addColorStop(.8, '#f97316'); solar.addColorStop(1, '#b91c1c');
      ctx.fillStyle = solar; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 250; i++) {
        const x = (i * 157) % canvas.width, y = (i * 79) % canvas.height;
        ctx.strokeStyle = `rgba(255,${110 + i % 120},30,${.05 + (i % 6) * .025})`;
        ctx.lineWidth = 1 + i % 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 55, y - 18, x - 32, y + 28, x + 96, y + 58); ctx.stroke();
      }
      return canvas;
    }
    if (bodyKey === 'moon' || bodyKey === 'mercury') {
      let seed = bodyKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 600; i++) {
        const x = rand() * canvas.width, y = rand() * canvas.height;
        const r = 1 + rand() * (bodyKey === 'moon' ? 15 : 9);
        const gradient = ctx.createRadialGradient(x - r * .24, y - r * .22, r * .08, x, y, r);
        const shade = Math.floor(70 + rand() * 80);
        gradient.addColorStop(0, `rgba(${shade + 12},${shade + 12},${shade + 12},.6)`);
        gradient.addColorStop(.76, `rgba(${shade},${shade},${shade},.38)`);
        gradient.addColorStop(1, 'rgba(12,12,12,0)');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = .18;
      for (let i = 0; i < 110; i++) {
        const y = rand() * canvas.height;
        ctx.fillStyle = i % 2 ? '#ffffff' : '#000000'; ctx.fillRect(0, y, canvas.width, 1);
      }
      ctx.globalAlpha = 1;
    } else {
      // A clearly marked visual fallback, never presented as a scientific basemap.
      for (let y = 0; y < canvas.height; y += 2) {
        const wave = Math.sin(y / 21) * 11 + Math.cos(y / 9) * 4;
        ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.abs(wave) / 420})`;
        ctx.fillRect(0, y, canvas.width, 2);
      }
      let seed = 54321;
      for (let i = 0; i < 160; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        const x = seed / 233280 * canvas.width;
        seed = (seed * 9301 + 49297) % 233280;
        const y = seed / 233280 * canvas.height;
        const r = 2 + (seed % 17);
        ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, y, r * 2.1, r, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    return canvas;
  }

  function setStatus(key, text) {
    const node = byId(`${key}MapLayerStatus`);
    if (node) node.textContent = text;
  }

  function setLoading(key, show, text) {
    const overlay = byId(`${key}MapLoading`);
    if (!overlay) return;
    if (text) {
      const span = overlay.querySelector('span');
      if (span) span.textContent = text;
    }
    overlay.classList.toggle('is-visible', !!show);
    overlay.hidden = !show;
  }

  function getItemsForMap(key, bodyKey) {
    let destination = null;
    if (key === 'moon') destination = 'Moon';
    else if (key === 'mars') destination = 'Mars';
    else if (key === 'planets' && bodyKey === 'moon') destination = 'Moon';
    else if (key === 'planets' && bodyKey === 'mars') destination = 'Mars';
    if (!destination) return [];
    return sourceData.equipment.filter(item => item.destination === destination && normalizeCoordinates(item));
  }

  function positionOnSphere(latitude, longitude, radius) {
    const lat = latitude * Math.PI / 180;
    const lon = (longitude + 180) * Math.PI / 180;
    // Matches Three.js SphereGeometry's longitude convention and keeps markers attached while the body rotates.
    return new window.THREE.Vector3(
      -Math.cos(lon) * Math.cos(lat) * radius,
      Math.sin(lat) * radius,
      Math.sin(lon) * Math.cos(lat) * radius
    );
  }

  function makeLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const label = safeText(text, 'Location').slice(0, 32);
    ctx.font = '600 26px system-ui, sans-serif';
    const width = Math.ceil(ctx.measureText(label).width + 28);
    canvas.width = Math.min(440, width); canvas.height = 58;
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgba(2, 8, 23, .82)';
    c.strokeStyle = color || '#7dd3fc'; c.lineWidth = 2;
    const r = 12, w = canvas.width, h = canvas.height;
    c.beginPath(); c.moveTo(r, 0); c.lineTo(w-r, 0); c.quadraticCurveTo(w,0,w,r); c.lineTo(w,h-r); c.quadraticCurveTo(w,h,w-r,h); c.lineTo(r,h); c.quadraticCurveTo(0,h,0,h-r); c.lineTo(0,r); c.quadraticCurveTo(0,0,r,0); c.closePath(); c.fill(); c.stroke();
    c.font = '600 26px system-ui, sans-serif'; c.fillStyle = '#f8fafc'; c.textBaseline = 'middle'; c.fillText(label, 14, h / 2);
    const tex = new window.THREE.CanvasTexture(canvas);
    tex.minFilter = window.THREE.LinearFilter;
    const sprite = new window.THREE.Sprite(new window.THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(canvas.width / 175, canvas.height / 175, 1);
    sprite.userData.isMapLabel = true;
    return sprite;
  }

  function createGrid(group, radius) {
    const T = window.THREE;
    const material = new T.LineBasicMaterial({ color: 0x9ac8ed, transparent: true, opacity: .18, depthWrite: false });
    const lines = [];
    // Latitude lines
    [-60, -30, 0, 30, 60].forEach(lat => {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 4) points.push(positionOnSphere(lat, lon, radius * 1.003));
      const line = new T.Line(new T.BufferGeometry().setFromPoints(points), material);
      line.userData.isMapGrid = true; group.add(line); lines.push(line);
    });
    // Longitude lines
    for (let lon = -180; lon < 180; lon += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 3) points.push(positionOnSphere(lat, lon, radius * 1.003));
      const line = new T.Line(new T.BufferGeometry().setFromPoints(points), material);
      line.userData.isMapGrid = true; group.add(line); lines.push(line);
    }
    return lines;
  }

  function createProceduralSunMaterial() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, '#ff7b00'); g.addColorStop(.45, '#ffd13b'); g.addColorStop(1, '#df3d00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 220; i++) {
      const x = (i * 157) % c.width, y = (i * 79) % c.height;
      ctx.strokeStyle = `rgba(255,${90 + i % 150},20,${.06 + (i % 5) * .02})`;
      ctx.lineWidth = 1 + i % 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x+80, y-20, x-50, y+25, x+120, y+60); ctx.stroke();
    }
    return new window.THREE.CanvasTexture(c);
  }

  function chooseTextureSource(instance) {
    const key = instance.key;
    if (key === 'planets') {
      const body = bodies[instance.bodyKey] || bodies.mars;
      return { url: body.texture, credit: body.credit, color: body.color };
    }
    if (key === 'moon' && instance.layer === 'base-surface') return { mode: 'moon-trek-wmts', url: '', credit: 'NASA/GSFC/Arizona State University LRO WAC global mosaic; tiles delivered through NASA/JPL Solar System Treks WMTS' };
    const body = bodies[key];
    return { url: body.texture, credit: body.credit, color: body.color };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Map tile could not be loaded: ${src}`));
      img.src = src;
    });
  }

  // NASA Moon Trek publishes the LRO WAC global mosaic as WMTS tiles. Build a level-1
  // equirectangular overview (4 columns × 2 rows) for the current surface-view and globe
  // texture interfaces. Fine regional analysis remains available in the official Moon Trek UI.
  function loadMoonTrekWmtsCanvas() {
    if (!moonTrekWmtsCanvasPromise) {
      const layer = 'LRO_WAC_Mosaic_Global_303ppd_v02';
      const bases = [
        `https://trek.nasa.gov/tiles/Moon/EQ/${layer}/1.0.0/default/default028mm/1`,
        `https://moontrek.jpl.nasa.gov/trektiles/Moon/EQ/${layer}/1.0.0/default/default028mm/1`
      ];
      const build = async base => {
        const tasks = [];
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) tasks.push(loadImage(`${base}/${row}/${col}.jpg`));
        }
        const images = await Promise.all(tasks);
        const tileWidth = images[0].naturalWidth || images[0].width;
        const tileHeight = images[0].naturalHeight || images[0].height;
        if (!tileWidth || !tileHeight || images.some(image => (image.naturalWidth || image.width) !== tileWidth || (image.naturalHeight || image.height) !== tileHeight)) {
          throw new Error('Moon Trek WMTS tiles have inconsistent dimensions');
        }
        const canvas = document.createElement('canvas');
        canvas.width = tileWidth * 4;
        canvas.height = tileHeight * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas is unavailable');
        images.forEach((image, index) => ctx.drawImage(image, (index % 4) * tileWidth, Math.floor(index / 4) * tileHeight, tileWidth, tileHeight));
        // Validate that the external tiles are CORS-readable before enabling export/download.
        canvas.toDataURL('image/png');
        return canvas;
      };
      moonTrekWmtsCanvasPromise = build(bases[0]).catch(() => build(bases[1])).catch(error => {
        console.warn('NASA Moon Trek WMTS tiles were unavailable; use the NASA LRO WAC texture fallback.', error);
        return null;
      });
    }
    return moonTrekWmtsCanvasPromise;
  }

  function applyTexture(instance, source) {
    if (!instance.renderer || !instance.sphere) return;
    const T = window.THREE;
    const setMap = (texture, sourceCredit) => {
      texture.colorSpace = T.SRGBColorSpace || undefined;
      if (T.sRGBEncoding !== undefined) texture.encoding = T.sRGBEncoding;
      texture.anisotropy = Math.min(8, instance.renderer.capabilities.getMaxAnisotropy());
      const oldMap = instance.sphere.material.map;
      instance.sphere.material.map = texture;
      instance.sphere.material.color.set('#ffffff');
      instance.sphere.material.needsUpdate = true;
      if (oldMap && oldMap !== texture) oldMap.dispose();
      instance.texture = texture;
      instance.hasTexture = true;
      instance.credit = sourceCredit || instance.credit;
      updateSourceFootnote(instance);
      setStatus(instance.key, `${instance.bodyKey ? bodies[instance.bodyKey].label : bodies[instance.key].label} texture loaded`);
      setLoading(instance.key, false);
      updateSurfaceImage(instance);
    };

    if (instance.bodyKey === 'sun' && instance.key === 'planets') {
      setMap(createProceduralSunMaterial(), 'Procedural solar appearance; not a scientific solar image');
      setStatus(instance.key, 'Sun visualization ready');
      return;
    }

    if (source.mode === 'moon-trek-wmts') {
      setStatus(instance.key, 'Loading NASA Moon Trek WMTS tiles…');
      loadMoonTrekWmtsCanvas().then(canvas => {
        if (instance.layer !== 'base-surface' || instance.key !== 'moon') return;
        if (canvas) {
          setMap(new T.CanvasTexture(canvas), source.credit);
          setStatus(instance.key, 'NASA Moon Trek WMTS layer loaded · LRO WAC global mosaic');
          return;
        }
        // Keep the map usable if the external WMTS is unavailable from the user's browser.
        const loader = new T.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(NASA_MOON_TEXTURE, texture => {
          setMap(texture, 'NASA/GSFC/Arizona State University; LRO WAC global mosaic (direct-texture fallback; Moon Trek WMTS unavailable)');
          setStatus(instance.key, 'Moon Trek WMTS unavailable · using NASA LRO global texture fallback');
        }, undefined, () => {
          setMap(new T.CanvasTexture(textureCanvas('moon', 'surface')), 'Illustrative fallback texture; NASA Moon Trek WMTS and NASA LRO texture could not be loaded');
          setStatus(instance.key, 'NASA Moon imagery unavailable · illustrative fallback shown');
        });
      });
      return;
    }

    const loader = new T.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(source.url, texture => setMap(texture, source.credit), undefined, () => {
      // Fallback texture prevents a blank globe if external image permissions or availability changes.
      const fallback = source.fallbackUrl;
      if (fallback && fallback !== source.url) {
        loader.load(fallback, texture => setMap(texture, `${source.credit} (fallback texture: NASA/JPL/USGS Viking mosaic)`), undefined, () => {
          setMap(new T.CanvasTexture(textureCanvas(instance.bodyKey || instance.key, instance.layer)), 'Procedural fallback texture; live NASA/JPL imagery unavailable in this browser session');
          setStatus(instance.key, 'Remote texture unavailable · fallback view shown');
        });
      } else {
        setMap(new T.CanvasTexture(textureCanvas(instance.bodyKey || instance.key, instance.layer)), 'Procedural fallback texture; live NASA/JPL imagery unavailable in this browser session');
        setStatus(instance.key, 'Remote texture unavailable · fallback view shown');
      }
    });
  }

  function updateSourceFootnote(instance) {
    const id = instance.key === 'planets' ? 'planetMapSourceFootnote' : `${instance.key}MapSourceFootnote`;
    const el = byId(id);
    if (el) {
      const caveat = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(instance.bodyKey) ? ' Outer-planet texture is representative/illustrative and not a current scientific observation.' : '';
      el.textContent = `Map data / texture credit: ${instance.credit || 'NASA/JPL/GSFC'}.${caveat}`;
    }
  }

  function updateSurfaceImage(instance) {
    const img = byId(`${instance.key}SurfaceImage`);
    if (!img) return;
    const source = chooseTextureSource(instance);
    if (instance.key === 'moon' && instance.layer === 'base-surface') {
      img.onerror = null;
      img.alt = 'NASA Moon Trek LRO Wide Angle Camera global lunar mosaic (WMTS surface map)';
      if (img.dataset.wmtsLayerState === 'loading') { renderSurfaceMarkers(instance); return; }
      if (img.dataset.wmtsLayerState !== 'loaded' && img.dataset.wmtsLayerState !== 'fallback') {
        img.dataset.wmtsLayerState = 'loading';
        img.dataset.mapLayer = 'base-surface';
        setStatus(instance.key, 'Loading NASA Moon Trek WMTS surface tiles…');
        loadMoonTrekWmtsCanvas().then(canvas => {
          if (!img.isConnected || instance.layer !== 'base-surface') { img.dataset.wmtsLayerState = ''; return; }
          if (canvas) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              img.dataset.mapSrc = dataUrl;
              img.dataset.wmtsLayerState = 'loaded';
              img.src = dataUrl;
              setStatus(instance.key, 'NASA Moon Trek WMTS layer loaded · LRO WAC global mosaic');
            } catch (error) {
              img.dataset.wmtsLayerState = 'fallback';
              img.dataset.mapSrc = NASA_MOON_TEXTURE;
              img.src = NASA_MOON_TEXTURE;
              setStatus(instance.key, 'Moon Trek tiles could not be exported · using NASA LRO texture fallback');
            }
          } else {
            img.dataset.wmtsLayerState = 'fallback';
            img.dataset.mapSrc = NASA_MOON_TEXTURE;
            img.src = NASA_MOON_TEXTURE;
            img.onerror = () => {
              img.onerror = null;
              const fallback = textureCanvas('moon', 'surface').toDataURL('image/png');
              img.dataset.mapSrc = fallback; img.src = fallback;
              setStatus(instance.key, 'Moon Trek and NASA image unavailable · illustrative fallback shown');
            };
            setStatus(instance.key, 'Moon Trek WMTS unavailable · using NASA LRO global texture fallback');
          }
        });
      } else if (img.dataset.wmtsLayerState === 'loaded') {
        setStatus(instance.key, 'NASA Moon Trek WMTS layer loaded · LRO WAC global mosaic');
      } else {
        setStatus(instance.key, 'Moon Trek WMTS unavailable · using NASA LRO global texture fallback');
      }
      renderSurfaceMarkers(instance);
      return;
    }
    if (instance.key === 'moon') { img.dataset.wmtsLayerState = ''; img.dataset.mapLayer = instance.layer; img.onerror = null; }
    if ((instance.bodyKey || instance.key) === 'sun') {
      const dataUrl = textureCanvas('sun', 'surface').toDataURL('image/png');
      if (img.dataset.mapSrc !== dataUrl) { img.dataset.mapSrc = dataUrl; img.src = dataUrl; }
    } else if (source.url && img.dataset.mapSrc !== source.url) {
      img.dataset.mapSrc = source.url;
      img.src = source.url;
      img.onerror = () => {
        img.onerror = null;
        const fallback = textureCanvas(instance.bodyKey || instance.key, instance.layer).toDataURL('image/png');
        img.dataset.mapSrc = fallback;
        img.src = fallback;
        setStatus(instance.key, 'Remote surface image unavailable · illustrative fallback shown');
      };
    }
    img.alt = `${instance.bodyKey ? bodies[instance.bodyKey].label : bodies[instance.key].label} global surface texture map`;
    renderSurfaceMarkers(instance);
  }

  function renderSurfaceMarkers(instance) {
    const el = byId(`${instance.key}SurfaceMarkers`);
    if (!el) return;
    el.replaceChildren();
    const dataKey = instance.key;
    const items = getItemsForMap(dataKey, instance.bodyKey);
    const active = instance.layers.equipment || instance.layers.missions;
    el.classList.toggle('show-labels', !!instance.layers.labels);
    if (!active) return;
    items.forEach(item => {
      const coords = normalizeCoordinates(item); if (!coords) return;
      const isMissionLayer = instance.layers.missions && !instance.layers.equipment;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `map-surface-marker${(instance.key === 'mars' || instance.bodyKey === 'mars') ? ' is-mars-marker' : ''}${isMissionLayer ? ' is-mission-marker' : ''}`;
      marker.style.left = `${(coords.longitude + 180) / 360 * 100}%`;
      marker.style.top = `${(90 - coords.latitude) / 180 * 100}%`;
      marker.setAttribute('aria-label', `${item.name}, ${item.missionName || 'NASA mission'}`);
      marker.title = item.name;
      marker.innerHTML = `<span class="map-marker-dot"></span><span class="map-marker-label">${escapeHTML(item.name)}</span>`;
      marker.addEventListener('click', () => showMarkerPopup(instance, item, null, null));
      el.appendChild(marker);
    });
    syncLayerVisibility(instance);
  }

  function escapeHTML(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
  }

  function createMarkerMeshes(instance) {
    const T = window.THREE;
    instance.markerGroup.children.slice().forEach(obj => {
      instance.markerGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    instance.markerMeshes = [];
    const items = getItemsForMap(instance.key, instance.bodyKey);
    items.forEach(item => {
      const coords = normalizeCoordinates(item); if (!coords) return;
      const pos = positionOnSphere(coords.latitude, coords.longitude, 1.016);
      const marker = new T.Mesh(
        new T.SphereGeometry(.021, 14, 12),
        new T.MeshBasicMaterial({ color: (instance.key === 'mars' || instance.bodyKey === 'mars') ? 0xff8870 : 0x80e8cb, depthTest: true })
      );
      marker.position.copy(pos);
      marker.userData = { mapItem: item, isMapMarker: true };
      instance.markerGroup.add(marker);
      instance.markerMeshes.push(marker);
      const label = makeLabelSprite(item.name, (instance.key === 'mars' || instance.bodyKey === 'mars') ? '#fb8069' : '#6ee7c5');
      label.position.copy(pos.clone().multiplyScalar(1.08));
      label.userData.mapItem = item;
      label.visible = false;
      instance.markerGroup.add(label);
      instance.labelSprites.push(label);
    });
    syncLayerVisibility(instance);
  }

  function syncLayerVisibility(instance) {
    if (!instance) return;
    if (instance.gridGroup) instance.gridGroup.visible = !!instance.layers.grid;
    if (instance.markerGroup) {
      instance.markerMeshes.forEach(m => { m.visible = !!instance.layers.equipment || !!instance.layers.missions; });
      instance.labelSprites.forEach(s => { s.visible = !!instance.layers.labels && (!!instance.layers.equipment || !!instance.layers.missions); });
      instance.markerMeshes.forEach(m => {
        if (instance.layers.missions && !instance.layers.equipment) m.material.color.set('#f6c96a');
        else m.material.color.set((instance.key === 'mars' || instance.bodyKey === 'mars') ? '#ff8870' : '#80e8cb');
      });
    }
    const panel = byId(`${instance.key}MapLayers`);
    if (panel) {
      const layerInputs = panel.querySelectorAll('[data-map-layer]');
      const hasMappedLocations = getItemsForMap(instance.key, instance.bodyKey).length > 0;
      layerInputs.forEach(input => {
        const layer = input.dataset.mapLayer;
        if (['equipment','missions'].includes(layer)) {
          input.checked = !!instance.layers[layer];
          input.disabled = !hasMappedLocations;
          input.title = hasMappedLocations ? '' : 'No coordinates for this body are available in the current catalog.';
          const label = input.closest('label');
          if (label) label.classList.toggle('is-layer-disabled', !hasMappedLocations);
        }
        if (['grid','labels'].includes(layer)) input.checked = !!instance.layers[layer];
        if (layer === 'base-surface') input.checked = instance.layer === 'base-surface';
      });
      let locationNote = panel.querySelector('.map-location-layer-note');
      if (!hasMappedLocations) {
        if (!locationNote) { locationNote = document.createElement('p'); locationNote.className = 'map-layer-status-note map-location-layer-note'; panel.appendChild(locationNote); }
        locationNote.textContent = `The current catalogue has no mapped equipment/site coordinates for ${bodies[instance.bodyKey]?.label || 'this body'}. Location layers are disabled rather than inventing markers.`;
      } else if (locationNote) locationNote.remove();
    }
    const labels = instance.key === 'planets' ? [] : [byId(`${instance.key}SurfaceMarkers`)];
    labels.filter(Boolean).forEach(layer => layer.classList.toggle('is-markers-hidden', !instance.layers.equipment && !instance.layers.missions));
  }

  function resize(instance) {
    if (!instance || !instance.renderer || !instance.camera || !instance.container) return;
    const rect = instance.container.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width || instance.container.clientWidth || 800));
    const height = Math.max(300, Math.floor(rect.height || instance.container.clientHeight || 560));
    instance.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    instance.renderer.setSize(width, height, false);
    instance.camera.aspect = width / height;
    instance.camera.updateProjectionMatrix();
  }

  function getPopupElements(instance) {
    const prefix = instance.key === 'planets' ? 'planetBody' : instance.key;
    return {
      root: byId(`${prefix}MarkerPopup`),
      title: byId(`${prefix}PopupTitle`),
      button: byId(`${prefix}PopupBtnDetails`)
    };
  }

  function showMarkerPopup(instance, item, x, y) {
    const nodes = getPopupElements(instance);
    if (!nodes.root || !item) return;
    nodes.title.textContent = item.name;
    nodes.button.onclick = () => { window.location.hash = `#equipment/${encodeURIComponent(item.id)}`; };
    if (Number.isFinite(x) && Number.isFinite(y)) {
      const rect = instance.container.getBoundingClientRect();
      const rootW = Math.min(260, rect.width - 24);
      nodes.root.style.left = `${Math.max(12, Math.min(rect.width - rootW - 12, x - rootW / 2))}px`;
      nodes.root.style.top = `${Math.max(18, Math.min(rect.height - 138, y - 120))}px`;
    } else {
      nodes.root.style.left = '12px'; nodes.root.style.top = '64px';
    }
    nodes.root.classList.add('active');
    instance.selectedItem = item;
  }

  function hideMarkerPopup(instance) {
    const nodes = getPopupElements(instance);
    if (nodes.root) nodes.root.classList.remove('active');
  }

  function openInfo(instance) {
    instance.active = true;
    const modal = byId('mapInfoModal');
    const title = byId('mapInfoTitle');
    const desc = byId('mapInfoDescription');
    const accuracy = byId('mapInfoAccuracy');
    const link = byId('mapInfoSourceLink');
    const label = instance.key === 'planets' ? bodies[instance.bodyKey].label : bodies[instance.key].label;
    if (title) title.textContent = `${label} map information`;
    if (desc) desc.textContent = `${label} is shown as a rotatable 3D globe and, on Moon and Mars screens, a 2D global surface-imagery view. Drag to rotate in 3D or use zoom controls. Select a mapped marker to identify the artifact and open its full details.`;
    if (accuracy) accuracy.textContent = 'Markers are shown only where a record includes valid latitude/longitude values. A marker may refer to a landing site or region rather than a surveyed position for each piece of hardware; missing coordinates are never invented. The mission-linked layer uses these mapped records, not fabricated mission trajectories. Surface views use global appearance imagery only. Terrain/elevation layers and their associated data are intentionally not included.';
    if (link) {
      const bodyKey = instance.key === 'planets' ? instance.bodyKey : instance.key;
      link.href = bodyKey === 'moon' ? NASA_TREK.moon : bodyKey === 'mars' ? NASA_TREK.mars : NASA_TREK.planets;
      link.textContent = bodyKey === 'moon' ? 'NASA Moon Trek ↗' : bodyKey === 'mars' ? 'NASA Mars Trek ↗' : 'NASA Solar System Treks ↗';
    }
    if (modal) modal.classList.add('active');
    updateSourceFootnote(instance);
  }

  function switchView(instance, mode) {
    instance.mode = mode === 'surface' ? 'surface' : '3d';
    const viewport = instance.container;
    const canvas = viewport.querySelector('canvas');
    const surface = byId(`${instance.key}SurfaceView`);
    viewport.classList.toggle('surface-mode', instance.mode === 'surface');
    if (canvas) canvas.style.display = instance.mode === 'surface' ? 'none' : 'block';
    if (surface) surface.hidden = instance.mode !== 'surface';
    document.querySelectorAll(`[data-map-mode][data-map-key="${instance.key}"]`).forEach(btn => {
      const active = btn.dataset.mapMode === instance.mode;
      btn.classList.toggle('is-active', active); btn.setAttribute('aria-pressed', String(active));
    });
    if (instance.mode === 'surface') updateSurfaceImage(instance);
    else resize(instance);
  }

  function buildInstance(key, canvasId, containerId) {
    const T = window.THREE;
    const canvas = byId(canvasId), container = byId(containerId);
    if (!canvas || !container || !T) return null;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    } catch (error) {
      setStatus(key, 'WebGL unavailable · interactive globe fallback unavailable');
      setLoading(key, false);
      return null;
    }
    renderer.setClearColor(0x020713, 0);
    if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36, 1, .1, 100);
    camera.position.set(0, 0, 4.15);
    const root = new T.Group(); scene.add(root);
    const sphereGeo = new T.SphereGeometry(1, 128, 96);
    const sphereMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .94, metalness: 0.01 });
    const sphere = new T.Mesh(sphereGeo, sphereMat); root.add(sphere);
    const halo = new T.Mesh(new T.SphereGeometry(1.025, 64, 48), new T.MeshBasicMaterial({ color: key === 'mars' ? 0xff654d : 0x82bdf7, transparent: true, opacity: .09, side: T.BackSide, depthWrite: false }));
    root.add(halo);
    scene.add(new T.AmbientLight(0xffffff, .95));
    const keyLight = new T.DirectionalLight(0xfff5de, 2.0); keyLight.position.set(-3.8, 1.8, 4.4); scene.add(keyLight);
    const fillLight = new T.DirectionalLight(0x789bda, .42); fillLight.position.set(4, -2, -3); scene.add(fillLight);
    const starCanvas = document.createElement('canvas'); starCanvas.width = 512; starCanvas.height = 512;
    const starCtx = starCanvas.getContext('2d'); starCtx.fillStyle = '#020713'; starCtx.fillRect(0,0,512,512);
    let seed = key.length * 843;
    for (let i = 0; i < 420; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed / 4294967296 * 512;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = seed / 4294967296 * 512;
      starCtx.fillStyle = `rgba(224,238,255,${.12 + (seed % 70) / 100})`;
      starCtx.beginPath(); starCtx.arc(x,y,seed % 19 === 0 ? 1.35 : .55,0,Math.PI*2); starCtx.fill();
    }
    const starTexture = new T.CanvasTexture(starCanvas);
    scene.background = new T.Color(0x020713);
    const starField = new T.Mesh(new T.SphereGeometry(30, 32, 20), new T.MeshBasicMaterial({ map: starTexture, side: T.BackSide, depthWrite: false }));
    scene.add(starField);

    const gridGroup = new T.Group(); root.add(gridGroup);
    createGrid(gridGroup, 1.006);
    const markerGroup = new T.Group(); root.add(markerGroup);
    const instance = {
      key, canvas, container, renderer, scene, camera, root, sphere, halo,
      gridGroup, markerGroup, markerMeshes: [], labelSprites: [], texture: null,
      zoom: 4.15, mode: '3d', layer: 'base-surface', bodyKey: key === 'planets' ? (byId('planetBodySelector')?.value || 'mars') : key,
      layers: { equipment: true, missions: false, grid: true, labels: true },
      selectedItem: null, pointerDown: false, dragged: false, pointerStart: null, last: null,
      credit: '', active: false, hasTexture: false
    };
    instance.raycaster = new T.Raycaster(); instance.pointer = new T.Vector2();
    instance.planetBody = instance.bodyKey;
    instances[key] = instance;
    return instance;
  }

  function loadInstanceTexture(instance) {
    if (!instance) return;
    if (!instance.renderer) {
      setStatus(instance.key, 'WebGL unavailable · illustrative globe shown; surface imagery remains available where supported');
      setLoading(instance.key, false);
      if (instance.mode === 'surface') updateSurfaceImage(instance);
      return;
    }
    setLoading(instance.key, true, 'Loading NASA planetary imagery');
    const source = chooseTextureSource(instance);
    setStatus(instance.key, 'Loading global texture…');
    applyTexture(instance, source);
    updateSurfaceImage(instance);
  }

  function updateZoom(instance, direction) {
    if (!instance) return;
    if (instance.mode === 'surface') {
      instance.surfaceZoom = Math.max(1, Math.min(4, (instance.surfaceZoom || 1) + direction * .25));
      applySurfaceTransform(instance);
      return;
    }
    instance.zoom = Math.max(1.9, Math.min(7.5, instance.zoom - direction * .38));
    if (instance.camera) instance.camera.position.z = instance.zoom;
    else if (instance.canvas) instance.canvas.style.transform = `scale(${Math.max(.82, Math.min(1.18, 1 + (4.15 - instance.zoom) * .07))})`;
  }

  function applySurfaceTransform(instance) {
    const stage = byId(`${instance.key}SurfaceStage`);
    if (!stage) return;
    const zoom = instance.surfaceZoom || 1;
    stage.style.transform = `translate(${instance.panX || 0}px, calc(-50% + ${instance.panY || 0}px)) scale(${zoom})`;
  }

  function setBaseLayer(instance, layer) {
    if (!instance) return;
    instance.layer = 'base-surface';
    loadInstanceTexture(instance);
    syncLayerVisibility(instance);
    if (instance.mode === 'surface') updateSurfaceImage(instance);
  }

  function bindSurfaceInteraction(instance) {
    const stage = byId(`${instance.key}SurfaceStage`);
    const viewport = byId(`${instance.key}SurfaceView`);
    if (!stage || !viewport) return;
    let down = false, startX = 0, startY = 0, oldX = 0, oldY = 0;
    viewport.addEventListener('pointerdown', event => {
      if (event.target.closest('.map-surface-marker')) return;
      down = true; startX = event.clientX; startY = event.clientY; oldX = instance.panX || 0; oldY = instance.panY || 0;
      viewport.setPointerCapture?.(event.pointerId); viewport.classList.add('is-panning');
    });
    viewport.addEventListener('pointermove', event => {
      if (!down) return;
      instance.panX = oldX + event.clientX - startX; instance.panY = oldY + event.clientY - startY;
      applySurfaceTransform(instance);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name => viewport.addEventListener(name, () => { down = false; viewport.classList.remove('is-panning'); }));
    viewport.addEventListener('wheel', event => { event.preventDefault(); updateZoom(instance, event.deltaY < 0 ? 1 : -1); }, { passive: false });
  }

  function bindGlobeInteractions(instance) {
    const canvas = instance.canvas;
    canvas.addEventListener('pointerdown', event => {
      if (instance.mode !== '3d') return;
      instance.pointerDown = true; instance.dragged = false; instance.pointerStart = { x: event.clientX, y: event.clientY }; instance.last = instance.pointerStart;
      canvas.setPointerCapture?.(event.pointerId); canvas.classList.add('is-grabbing');
    });
    canvas.addEventListener('pointermove', event => {
      if (!instance.pointerDown || instance.mode !== '3d') return;
      const dx = event.clientX - instance.last.x, dy = event.clientY - instance.last.y;
      if (Math.abs(event.clientX - instance.pointerStart.x) + Math.abs(event.clientY - instance.pointerStart.y) > 4) instance.dragged = true;
      instance.root.rotation.y += dx * .006;
      instance.root.rotation.x += dy * .006;
      instance.root.rotation.x = Math.max(-1.45, Math.min(1.45, instance.root.rotation.x));
      instance.last = { x: event.clientX, y: event.clientY };
    });
    const endDrag = event => {
      if (!instance.pointerDown) return;
      instance.pointerDown = false; canvas.classList.remove('is-grabbing');
      if (!instance.dragged && event && instance.mode === '3d') selectAtPoint(instance, event.clientX, event.clientY);
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => { instance.pointerDown = false; canvas.classList.remove('is-grabbing'); });
    canvas.addEventListener('wheel', event => { event.preventDefault(); updateZoom(instance, event.deltaY < 0 ? 1 : -1); }, { passive: false });
    canvas.addEventListener('pointermove', event => {
      if (instance.pointerDown || !instance.markerMeshes.length || instance.mode !== '3d') return;
      const rect = canvas.getBoundingClientRect();
      instance.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      instance.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      instance.raycaster.setFromCamera(instance.pointer, instance.camera);
      const hits = instance.raycaster.intersectObjects(instance.markerMeshes, false);
      canvas.style.cursor = hits.length ? 'pointer' : 'grab';
      const item = hits.length ? hits[0].object.userData.mapItem : null;
      const coord = byId(`${instance.key}GlobeHoverCoords`);
      if (coord) coord.textContent = item ? `${item.name} · ${item.latitude}°, ${item.longitude}°` : `Rotate ${bodies[instance.bodyKey || instance.key].label} · select a marker for details`;
    });
  }

  function selectAtPoint(instance, clientX, clientY) {
    const rect = instance.canvas.getBoundingClientRect();
    instance.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    instance.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    instance.raycaster.setFromCamera(instance.pointer, instance.camera);
    const hit = instance.raycaster.intersectObjects(instance.markerMeshes.filter(m => m.visible), false)[0];
    if (!hit) { hideMarkerPopup(instance); return; }
    const item = hit.object.userData.mapItem;
    const vector = hit.object.getWorldPosition(new window.THREE.Vector3()).project(instance.camera);
    const x = (vector.x * .5 + .5) * rect.width;
    const y = (-vector.y * .5 + .5) * rect.height;
    showMarkerPopup(instance, item, x, y);
  }

  function bindLayerControls(instance) {
    const panel = byId(`${instance.key}MapLayers`);
    if (!panel) return;
    panel.querySelectorAll('[data-map-layer]').forEach(input => {
      input.addEventListener('change', () => {
        const layer = input.dataset.mapLayer;
        if (layer === 'base-surface') {
          if (input.checked) setBaseLayer(instance, layer);
          return;
        }
        if (['equipment','missions','grid','labels'].includes(layer)) {
          instance.layers[layer] = !!input.checked;
          syncLayerVisibility(instance);
          if (instance.mode === 'surface') renderSurfaceMarkers(instance);
        }
      });
    });
  }

  function bindSearch(instance) {
    const input = byId(`${instance.key}MapSearch`), results = byId(`${instance.key}MapSearchResults`);
    if (!input || !results) return;
    const findResults = () => {
      const q = input.value.trim().toLowerCase();
      let resultItems = [];
      if (instance.key === 'planets') {
        const bodyMatches = sourceData.planets.filter(p => !q || `${p.name} ${p.type} ${p.description} ${p.notableMissions || ''}`.toLowerCase().includes(q))
          .map(item => ({ item, kind: 'body' }));
        resultItems = bodyMatches;
        // When the user enters a query, include catalog equipment tied to the currently selected
        // Moon/Mars body. Blank search still starts with celestial-body choices for easier browsing.
        if (q && ['moon', 'mars'].includes(instance.bodyKey)) {
          const destination = instance.bodyKey === 'moon' ? 'Moon' : 'Mars';
          const equipmentMatches = sourceData.equipment.filter(item => item.destination === destination &&
            `${item.name} ${item.missionName || ''} ${item.equipmentType || ''} ${item.physicalLocationCategory || ''}`.toLowerCase().includes(q))
            .map(item => ({ item, kind: 'equipment' }));
          resultItems = [...equipmentMatches, ...bodyMatches];
        }
      } else {
        const destination = instance.key === 'moon' ? 'Moon' : 'Mars';
        resultItems = sourceData.equipment.filter(item => item.destination === destination &&
          (!q || `${item.name} ${item.missionName || ''} ${item.equipmentType || ''} ${item.physicalLocationCategory || ''}`.toLowerCase().includes(q)))
          .map(item => ({ item, kind: 'equipment' }));
      }
      resultItems = resultItems.slice(0, 10);
      results.replaceChildren();
      if (!resultItems.length) {
        const empty = document.createElement('div'); empty.className = 'map-search-empty'; empty.textContent = 'No matching catalog records found.'; results.appendChild(empty);
      } else {
        resultItems.forEach(({ item, kind }) => {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'map-search-result'; button.setAttribute('role','option');
          const name = document.createElement('span'); name.className = 'map-search-result-name'; name.textContent = item.name;
          const meta = document.createElement('span'); meta.className = 'map-search-result-meta';
          if (kind === 'body') meta.textContent = `${item.type || 'Celestial body'} · ${item.notableMissions || 'Body dossier'}`;
          else meta.textContent = `${item.missionName || 'NASA mission'} · ${normalizeCoordinates(item) ? 'Recorded location' : 'No fixed surface coordinate in this record'}`;
          button.append(name, meta);
          button.addEventListener('click', () => {
            results.hidden = true; input.setAttribute('aria-expanded','false');
            if (kind === 'body') {
              selectBody(item.id);
              const dest = byId('planetBodyHudTitle'); if (dest) dest.textContent = `${item.name} · Planetary Surface Explorer`;
              return;
            }
            if (instance.key === 'planets' && (item.destination === 'Moon' || item.destination === 'Mars')) {
              selectBody(item.destination.toLowerCase());
            }
            if (normalizeCoordinates(item)) {
              const coords = normalizeCoordinates(item);
              if (instance.root && instance.camera) {
                instance.root.rotation.x = Math.PI / 2 - coords.latitude * Math.PI / 180;
                instance.root.rotation.y = -(coords.longitude * Math.PI / 180);
                instance.zoom = Math.min(instance.zoom, 3.2); instance.camera.position.z = instance.zoom;
              }
              const coord = byId(`${instance.key === 'planets' ? 'planetBody' : instance.key}HoverCoords`) || byId(`${instance.key}GlobeHoverCoords`);
              if (coord) coord.textContent = `${item.name} · ${coords.latitude}°, ${coords.longitude}°`;
              showMarkerPopup(instance, item, null, null);
            } else {
              window.location.hash = `#equipment/${encodeURIComponent(item.id)}`;
            }
          });
          results.appendChild(button);
        });
      }
      results.hidden = false; input.setAttribute('aria-expanded','true');
    };
    input.addEventListener('focus', findResults); input.addEventListener('click', findResults); input.addEventListener('input', findResults);
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { results.hidden = true; input.setAttribute('aria-expanded','false'); }
      if (event.key === 'Enter' && !results.hidden) { const first = results.querySelector('.map-search-result'); if (first) { event.preventDefault(); first.click(); } }
    });
    document.addEventListener('click', event => {
      if (!input.contains(event.target) && !results.contains(event.target)) { results.hidden = true; input.setAttribute('aria-expanded','false'); }
    });
  }

  function selectBody(bodyKey) {
    const instance = instances.planets;
    if (!instance || !bodies[bodyKey]) return;
    instance.bodyKey = bodyKey;
    instance.layer = 'base-surface';
    if (sourceData.planets.some(planet => planet.id === bodyKey) && window.__ABN_SOLAR_MAP && typeof window.__ABN_SOLAR_MAP.select === 'function') window.__ABN_SOLAR_MAP.select(bodyKey);
    if (instance.renderer) createMarkerMeshes(instance);
    syncLayerVisibility(instance);
    const selector = byId('planetBodySelector'); if (selector) selector.value = bodyKey;
    const title = byId('planetBodyHudTitle'); if (title) title.textContent = `${bodies[bodyKey].label} · Planetary Surface Explorer`;
    const coord = byId('planetBodyHoverCoords'); if (coord) coord.textContent = `Rotate ${bodies[bodyKey].label} · source: ${bodies[bodyKey].credit}`;
    const titleNode = byId('planetBodyExplorerTitle'); if (titleNode) titleNode.textContent = `${bodies[bodyKey].label} Globe Explorer`;
    const status = byId('planetsMapLayerStatus'); if (status) status.textContent = 'Loading body texture…';
    loadInstanceTexture(instance);
    const foot = byId('planetMapSourceFootnote'); if (foot) foot.textContent = `Texture credit: ${bodies[bodyKey].credit}. Global textures can have gaps or be representative; use the official NASA Solar System Treks portal for available science layers.`;
    const layersPanel = byId('planetsMapLayers');
    if (layersPanel) { const note = layersPanel.querySelector('.map-layer-status-note'); if (note) note.remove(); }
    if (instance.mode === 'surface') updateSurfaceImage(instance);
    const search = byId('planetsMapSearch'); if (search && search.value.toLowerCase() !== bodyKey) search.value = bodies[bodyKey].label;
  }

  function bindFallbackGlobeInteractions(instance) {
    if (!instance.canvas) return;
    let start = null;
    instance.canvas.addEventListener('pointerdown', event => { start = { x: event.clientX, y: event.clientY, old: instance.canvas.style.transform || '' }; });
    instance.canvas.addEventListener('pointermove', event => {
      if (!start || instance.mode !== '3d') return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      instance.canvas.style.transform = `rotateY(${dx * .08}deg) rotateX(${Math.max(-12, Math.min(12, dy * -.08))}deg) ${start.old}`;
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name => instance.canvas.addEventListener(name, () => { start = null; }));
  }

  function bindTools(instance) {
    const key = instance.key;
    document.querySelectorAll(`[data-map-action][data-map-key="${key}"]`).forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.mapAction;
        if (action === 'info') openInfo(instance);
        if (action === 'layers') {
          const panel = byId(`${key}MapLayers`);
          if (panel) { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); const leftToggle = document.querySelector(`[data-map-controls-toggle=\"${key}\"]`); if (leftToggle) { leftToggle.setAttribute('aria-expanded', String(!panel.hidden)); leftToggle.setAttribute('aria-label', panel.hidden ? `Open ${key} map controls` : `Close ${key} map controls`); leftToggle.textContent = panel.hidden ? '»' : '«'; } }
        }
        if (action === 'zoom-in') updateZoom(instance, 1);
        if (action === 'zoom-out') updateZoom(instance, -1);
        if (action === 'fullscreen') {
          const target = instance.container;
          if (document.fullscreenElement === target) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => setStatus(key, 'Could not exit fullscreen mode in this browser.'));
          } else if (target && target.requestFullscreen) {
            target.requestFullscreen().catch(() => setStatus(key, 'Fullscreen is unavailable in this browser or file:// context.'));
          } else {
            setStatus(key, 'Fullscreen is unavailable in this browser.');
          }
        }
      });
    });
    document.querySelectorAll(`[data-map-mode][data-map-key="${key}"]`).forEach(button => button.addEventListener('click', () => switchView(instance, button.dataset.mapMode)));
    document.querySelectorAll(`[data-map-controls-toggle="${key}"]`).forEach(button => button.addEventListener('click', () => { const panel = byId(`${key}MapLayers`); if (!panel) return; panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); button.setAttribute('aria-label', panel.hidden ? `Open ${key} map controls` : `Close ${key} map controls`); button.textContent = panel.hidden ? '»' : '«'; }));
    const dl = byId(`${key}MapDownload`);
    if (dl) dl.addEventListener('click', () => downloadMap(instance));
    bindLayerControls(instance);
    bindSearch(instance);
    if (instance.renderer) bindGlobeInteractions(instance);
    else bindFallbackGlobeInteractions(instance);
    bindSurfaceInteraction(instance);
  }

  function downloadMap(instance) {
    try {
      if (instance.mode === 'surface') {
        const img = byId(`${instance.key}SurfaceImage`);
        const viewport = byId(`${instance.key}SurfaceView`);
        if (!img || !img.complete || !img.naturalWidth || !viewport) throw new Error('The map image has not finished loading yet.');
        const viewW = Math.max(1, viewport.clientWidth), viewH = Math.max(1, viewport.clientHeight);
        const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        const out = document.createElement('canvas'); out.width = Math.round(viewW * scale); out.height = Math.round(viewH * scale);
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#040913'; ctx.fillRect(0, 0, out.width, out.height);
        const stageW = viewW, stageH = viewW / 2, zoom = instance.surfaceZoom || 1;
        const panX = instance.panX || 0, panY = instance.panY || 0;
        const left = viewW / 2 + panX - stageW * zoom / 2;
        const top = viewH / 2 + panY - stageH * zoom / 2;
        ctx.drawImage(img, left * scale, top * scale, stageW * zoom * scale, stageH * zoom * scale);
        const layer = byId(`${instance.key}SurfaceMarkers`);
        if (layer && (instance.layers.equipment || instance.layers.missions)) {
          layer.querySelectorAll('.map-surface-marker').forEach(marker => {
            const x = (viewW / 2 + panX + (parseFloat(marker.style.left) / 100 - .5) * stageW * zoom) * scale;
            const y = (viewH / 2 + panY + (parseFloat(marker.style.top) / 100 - .5) * stageH * zoom) * scale;
            if (x < 0 || y < 0 || x > out.width || y > out.height) return;
            ctx.fillStyle = instance.layers.missions && !instance.layers.equipment ? '#f6c96a' : ((instance.key === 'mars' || instance.bodyKey === 'mars') ? '#ff816a' : '#5edfc0');
            ctx.beginPath(); ctx.arc(x, y, Math.max(4 * scale, out.width / 300), 0, Math.PI * 2); ctx.fill();
            if (instance.layers.labels) { ctx.fillStyle = '#fff'; ctx.font = `${Math.max(12, out.width / 100)}px system-ui`; ctx.fillText(marker.title || '', x + 7 * scale, y - 7 * scale); }
          });
        }
        saveCanvas(out, `${instance.key === 'planets' ? instance.bodyKey : instance.key}-surface-map.png`);
      } else {
        if (instance.renderer && instance.scene && instance.camera) instance.renderer.render(instance.scene, instance.camera);
        const out = document.createElement('canvas'); out.width = Math.max(1, instance.canvas.width); out.height = Math.max(1, instance.canvas.height);
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#020713'; ctx.fillRect(0,0,out.width,out.height);
        ctx.drawImage(instance.canvas,0,0);
        saveCanvas(out, `${instance.key === 'planets' ? instance.bodyKey : instance.key}-3d-globe.png`, instance.key);
      }
    } catch (error) {
      setStatus(instance.key, `Map image download unavailable: ${error.message || 'the browser blocked image export'}.`);
    }
  }

  function saveCanvas(canvas, filename, mapKey) {
    const finish = blob => {
      if (!blob) {
        setStatus(mapKey || (filename.startsWith('moon') ? 'moon' : filename.startsWith('mars') ? 'mars' : 'planets'), 'Image export was blocked or unavailable in this browser. Try again or use your browser screenshot tool.');
        return;
      }
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    if (canvas.toBlob) canvas.toBlob(finish, 'image/png'); else {
      const a = document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=filename; a.click();
    }
  }

  function makeFallbackForCanvas(key) {
    const canvas = byId(key === 'moon' ? 'moonGlobeCanvas' : key === 'mars' ? 'marsGlobeCanvas' : 'planetBodyGlobeCanvas');
    if (!canvas || canvas.dataset.fallbackDrawn === '1') return;
    canvas.dataset.fallbackDrawn = '1';
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const draw = () => {
      if (!document.body.contains(canvas)) return;
      const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) { requestAnimationFrame(draw); return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width*dpr); canvas.height = Math.floor(rect.height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,rect.width,rect.height);
      const r = Math.min(rect.width,rect.height)*.34, cx=rect.width/2, cy=rect.height/2;
      const bodyKey = key === 'planets' ? (instances.planets?.bodyKey || byId('planetBodySelector')?.value || 'mars') : key;
      const selectedBody = bodies[bodyKey] || bodies.mars;
      const grad=ctx.createRadialGradient(cx-r*.32,cy-r*.35,r*.07,cx,cy,r);
      if (bodyKey==='mars') { grad.addColorStop(0,'#efa26c');grad.addColorStop(.55,'#b95636');grad.addColorStop(1,'#36151a'); }
      else if (bodyKey==='moon') {grad.addColorStop(0,'#e4e0d6');grad.addColorStop(.65,'#898b8b');grad.addColorStop(1,'#222b36');}
      else if (bodyKey==='sun') {grad.addColorStop(0,'#fff4ad');grad.addColorStop(.45,'#fbbf24');grad.addColorStop(1,'#b91c1c');}
      else { const base=selectedBody.color || '#45699c'; grad.addColorStop(0,'#d9e9fb');grad.addColorStop(.58,base);grad.addColorStop(1,'#071225'); }
      ctx.fillStyle='#020713';ctx.fillRect(0,0,rect.width,rect.height);
      ctx.fillStyle=grad;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      let seed=99;for(let i=0;i<180;i++){seed=(seed*1664525+1013904223)>>>0;let x=cx-r+(seed/4294967296)*(2*r);seed=(seed*1664525+1013904223)>>>0;let y=cy-r+(seed/4294967296)*(2*r);let rr=1+(seed%9);if((x-cx)**2+(y-cy)**2<(r-rr)**2){ctx.strokeStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.stroke();}}
      ctx.strokeStyle='rgba(142,206,245,.22)';ctx.lineWidth=1;for(let lat of [-60,-30,0,30,60]){const yy=cy+Math.sin(lat*Math.PI/180)*r; const width=Math.cos(lat*Math.PI/180)*r;ctx.beginPath();ctx.ellipse(cx,yy,width,r*.25,0,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();ctx.ellipse(cx,cy,r*.42,r,0,0,Math.PI*2);ctx.stroke();
      if (key==='planets') {ctx.fillStyle='#e8eefc';ctx.font='600 16px system-ui';ctx.textAlign='center';ctx.fillText('Texture view needs WebGL',cx,cy+r+36);}
      requestAnimationFrame(draw);
    }; draw();
  }

  function animate() {
    Object.values(instances).forEach(instance => {
      if (!instance || !instance.renderer) return;
      const visible = !!instance.container.getClientRects().length && instance.container.getBoundingClientRect().width > 0;
      if (visible && instance.mode === '3d') {
        if (!reducedMotion && !instance.pointerDown) instance.root.rotation.y += .00055;
        instance.renderer.render(instance.scene, instance.camera);
        updateLabels(instance);
      }
    });
    window.requestAnimationFrame(animate);
  }

  function updateLabels(instance) {
    if (!instance.layers.labels || !instance.labelSprites.length) return;
    // Keep sprite labels behind/through the globe from showing by relying on depthTest and marker visibility.
    instance.labelSprites.forEach(label => { label.visible = !!instance.layers.labels && (!!instance.layers.equipment || !!instance.layers.missions); });
  }

  function mount(options) {
    if (options) {
      sourceData.equipment = Array.isArray(options.equipment) ? options.equipment : sourceData.equipment;
      sourceData.planets = Array.isArray(options.planets) ? options.planets : sourceData.planets;
    }
    if (didMount) {
      Object.values(instances).forEach(instance => { if (instance) { createMarkerMeshes(instance); resize(instance); } });
      return;
    }
    didMount = true;
    const defs = [ ['moon','moonGlobeCanvas','moonGlobeContainer'], ['mars','marsGlobeCanvas','marsGlobeContainer'], ['planets','planetBodyGlobeCanvas','planetBodyGlobeContainer'] ];
    defs.forEach(([key,canvas,container]) => {
      let instance = null;
      if (window.THREE) instance = buildInstance(key,canvas,container);
      if (!instance) {
        makeFallbackForCanvas(key);
        const fallbackCanvas = byId(canvas);
        const fallbackContainer = byId(container);
        instance = {
          key, canvas: fallbackCanvas, container: fallbackContainer, renderer: null, camera: null, scene: null, root: null,
          sphere: null, gridGroup: null, markerGroup: null, markerMeshes: [], labelSprites: [], texture: null,
          zoom: 4.15, mode: '3d', layer: 'base-surface', bodyKey: key === 'planets' ? (byId('planetBodySelector')?.value || 'mars') : key,
          layers: { equipment: true, missions: false, grid: true, labels: true }, selectedItem: null,
          credit: 'Illustrative fallback globe; NASA/JPL appearance imagery unavailable', active: true, hasTexture: false
        };
        instances[key] = instance;
        bindTools(instance);
        updateSurfaceImage(instance);
        setStatus(key, 'WebGL unavailable · illustrative fallback shown; NASA imagery may be unavailable in this browser session');
        setLoading(key,false);
        return;
      }
      instance.active = true;
      if (key === 'planets') instance.bodyKey = byId('planetBodySelector')?.value || 'mars';
      createMarkerMeshes(instance);
      bindTools(instance);
      loadInstanceTexture(instance); resize(instance);
      updateSurfaceImage(instance);
    });
    const selector = byId('planetBodySelector');
    if (selector) selector.addEventListener('change', () => selectBody(selector.value));
    document.addEventListener('click', event => {
      ['moon','mars','planets'].forEach(key => {
        const instance = instances[key], panel = byId(`${key}MapLayers`);
        const toggle = document.querySelector(`[data-map-action="layers"][data-map-key="${key}"]`);
        const leftToggle = document.querySelector(`[data-map-controls-toggle="${key}"]`);
        if (panel && !panel.hidden && !panel.contains(event.target) && (!toggle || !toggle.contains(event.target)) && (!leftToggle || !leftToggle.contains(event.target))) { panel.hidden = true; if(toggle)toggle.setAttribute('aria-expanded','false'); if(leftToggle){leftToggle.setAttribute('aria-expanded','false');leftToggle.setAttribute('aria-label',`Open ${key} map controls`);leftToggle.textContent='»';} }
      });
    });
    window.addEventListener('resize', () => Object.values(instances).forEach(resize));
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(entries => entries.forEach(entry => { const key = entry.target.id === 'moonGlobeContainer' ? 'moon' : entry.target.id === 'marsGlobeContainer' ? 'mars' : 'planets'; resize(instances[key]); }));
      ['moonGlobeContainer','marsGlobeContainer','planetBodyGlobeContainer'].forEach(id => { const el=byId(id);if(el)ro.observe(el); });
    }
    animate();
  }

  function onRoute(route) {
    const key = route === 'destination-moon' ? 'moon' : route === 'destination-mars' ? 'mars' : route === 'planets' ? 'planets' : null;
    if (!key) return;
    const instance = instances[key];
    const overlay = byId(`${key}MapLoading`);
    if (overlay && instance && instance.hasTexture) { overlay.classList.remove('is-visible'); overlay.hidden = true; }
    if (instance) {
      instance.active = true;
      resize(instance);
      // handleRoute is called before the selected .view-section becomes visible; resize again
      // on the next frame so the WebGL buffer matches the actual destination panel dimensions.
      window.requestAnimationFrame(() => { resize(instance); window.requestAnimationFrame(() => resize(instance)); });
    }
  }

  window.ABNPlanetaryMaps = { mount, onRoute, selectBody, getInstances: () => instances };
})(window, document);
