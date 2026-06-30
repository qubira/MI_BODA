/* ============================================================
   MI BODA — JavaScript Principal v2
   Sofía & Alejandro 2026
   ============================================================ */

'use strict';

const DB_KEY = 'boda_rsvp_guests';
function getGuests()  { try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } catch { return []; } }
function saveGuest(g) { const a = getGuests(); a.push(g); localStorage.setItem(DB_KEY, JSON.stringify(a)); }

/* ===== INTRO CURTAIN ===== */
(function initIntro() {
  var overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  /* Rellenar nombres y fecha desde config */
  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('boda_wedding_config')) || {}; } catch(e) {}
  var bride = cfg.bride || 'Sofía';
  var groom = cfg.groom || 'Alejandro';

  var brideEl = document.getElementById('introCardBride');
  var groomEl = document.getElementById('introCardGroom');
  var dateEl  = document.getElementById('introCardDate');

  if (brideEl) brideEl.textContent = bride;
  if (groomEl) groomEl.textContent = groom;
  if (dateEl && cfg.date) {
    var d = new Date(cfg.date + 'T12:00:00');
    dateEl.textContent = String(d.getDate()).padStart(2,'0') + ' · ' +
      String(d.getMonth()+1).padStart(2,'0') + ' · ' + d.getFullYear();
  }

  document.body.style.overflow = 'hidden';
  var opened = false;

  function open() {
    if (opened) return;
    opened = true;
    overlay.classList.add('opening');
    document.body.style.overflow = '';
    /* Quitar overlay cuando termina la transición (1s paneles + buffer) */
    setTimeout(function() { overlay.style.display = 'none'; }, 1050);
  }

  overlay.addEventListener('click',      open);
  overlay.addEventListener('touchstart', open, { passive: true });
})();

/* ===== CURSOR — DOS ARGOLLAS ENTRELAZADAS ===== */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursorTrail');
  if (!cursor || !trail) return;
  if (!window.matchMedia('(pointer:fine)').matches) return;

  cursor.textContent = '💍';

  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  // Estela suave (sigue con retraso)
  function animTrail() {
    tx += (mx - tx) * .1;
    ty += (my - ty) * .1;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();

  // Las argollas se agrandan y rotan al pasar sobre elementos interactivos
  document.querySelectorAll('a, button, label, .mg-item, .rsvp-card, .menu-opt').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  // Al hacer click: compresión + destellos de joyas
  document.addEventListener('mousedown', () => {
    cursor.classList.add('cursor--click');
    setTimeout(() => cursor.classList.remove('cursor--click'), 220);
  });

  const sparks = ['💍','✨','💫','⭐','🌟','💎','✦'];
  document.addEventListener('click', e => {
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('div');
      s.className = 'cursor-spark';
      s.textContent = sparks[Math.floor(Math.random() * sparks.length)];
      const angle = (Math.PI * 2 / 6) * i + (Math.random() - .5) * .8;
      const dist  = 35 + Math.random() * 30;
      s.style.cssText = `
        left:${e.clientX}px; top:${e.clientY}px;
        --sx:${Math.cos(angle) * dist}px;
        --sy:${Math.sin(angle) * dist}px;
        font-size:${10 + Math.random() * 8}px;
        animation-delay:${i * 30}ms;
      `;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  });
})();

/* ===== PÉTALOS DE ROSA SVG ===== */
(function initPetals() {
  const container = document.getElementById('petalsContainer');
  const isMobile  = window.matchMedia('(max-width:768px)').matches;
  const count     = isMobile ? 24 : 48;
  const NS        = 'http://www.w3.org/2000/svg';
  let   uid       = 0;

  /* --- 5 siluetas orgánicas de pétalo de rosa --- */
  /* viewBox 0 0 22 30  — base abajo, punta arriba */
  const SHAPES = [
    {
      /* Clásico: redondeado arriba, base estrecha */
      outer: 'M 11,29 C 2,22 0,12 3,5 C 5,1 8,0 11,2 C 14,0 17,1 19,5 C 22,12 20,22 11,29 Z',
      inner: 'M 11,29 C 3,22 2,12 5,5',          // nervadura izquierda
      inner2:'M 11,29 C 19,22 20,12 17,5',        // nervadura derecha
      vein:  'M 11,29 C 11,19 11,9 11,2',         // nervio central
    },
    {
      /* Corazón suave en la punta */
      outer: 'M 11,29 C 1,21 0,10 4,4 C 7,0 9,0 11,3 C 13,0 15,0 18,4 C 22,10 21,21 11,29 Z',
      inner: 'M 11,29 C 4,21 3,11 6,4',
      inner2:'M 11,29 C 18,21 19,11 16,4',
      vein:  'M 11,29 C 11,18 11,9 11,3',
    },
    {
      /* Alargado y fino */
      outer: 'M 10,30 C 2,23 0,13 3,6 C 5,1 8,0 10,2 C 12,0 15,2 17,6 C 20,13 18,23 10,30 Z',
      inner: 'M 10,30 C 3,23 2,13 5,6',
      inner2:'M 10,30 C 17,23 18,13 15,6',
      vein:  'M 10,30 C 10,20 10,10 10,2',
    },
    {
      /* Ancho y redondeado */
      outer: 'M 11,28 C 1,20 0,9 4,3 C 7,-1 10,0 11,2 C 12,0 15,-1 18,3 C 22,9 21,20 11,28 Z',
      inner: 'M 11,28 C 3,20 2,10 5,3',
      inner2:'M 11,28 C 19,20 20,10 17,3',
      vein:  'M 11,28 C 11,19 11,10 11,2',
    },
    {
      /* Asimétrico natural */
      outer: 'M 10,29 C 1,21 -1,10 3,4 C 6,0 9,0 11,3 C 14,0 17,1 19,5 C 22,12 21,22 10,29 Z',
      inner: 'M 10,29 C 2,21 1,10 5,4',
      inner2:'M 10,29 C 18,21 20,11 17,5',
      vein:  'M 10,29 C 11,19 11,9 11,3',
    },
  ];

  /* --- Paletas de color para cada tipo --- */
  const REDS = [
    { base:'#6B0000', mid:'#B71C1C', tip:'#EF5350', edge:'#FF8A80', vein:'rgba(40,0,0,.5)' },
    { base:'#7F0000', mid:'#C62828', tip:'#E53935', edge:'#FF5252', vein:'rgba(50,0,0,.45)' },
    { base:'#880E4F', mid:'#C2185B', tip:'#E91E63', edge:'#FF80AB', vein:'rgba(60,0,30,.4)' },
    { base:'#4A0000', mid:'#9B0000', tip:'#D32F2F', edge:'#EF9A9A', vein:'rgba(30,0,0,.5)' },
  ];
  const WHITES = [
    { base:'#F8C8D0', mid:'#FFE8EC', tip:'#FFFFFF', edge:'#FFFFFF', vein:'rgba(180,100,110,.22)' },
    { base:'#FADADD', mid:'#FFF0F3', tip:'#FFFFFF', edge:'#FFFFFF', vein:'rgba(200,120,130,.18)' },
    { base:'#F5B8C4', mid:'#FFE0E8', tip:'#FFF8FA', edge:'#FFFFFF', vein:'rgba(160,80,90,.2)' },
    { base:'#EDD5D8', mid:'#FAF0F1', tip:'#FFFFFF', edge:'#FFFFFF', vein:'rgba(150,90,100,.15)' },
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
  function swing()    { return (Math.random() > .5 ? 1 : -1) * rnd(6, 22); }

  for (let i = 0; i < count; i++) {
    const isRed  = Math.random() > .38;   // 62% rojos, 38% blancos
    const palette= isRed ? pick(REDS) : pick(WHITES);
    const shape  = pick(SHAPES);
    const id     = `p${uid++}`;

    /* Tamaño: varía para dar sensación de profundidad */
    const w   = rnd(14, 28);
    const h   = w * rnd(1.3, 1.7);
    const op  = rnd(.65, .95);
    const dur = rnd(8, 16);
    const del = -rnd(0, dur);   // comienzan ya en movimiento
    const left= rnd(0, 101);
    const blur= Math.random() > .65 ? rnd(.5, 1.2) : 0;

    /* Movimiento lateral orgánico */
    const xs = [swing(), swing(), swing(), swing(), swing(), swing()];
    /* Rotaciones progresivas */
    const r0 = rnd(0, 360);
    const rs  = [r0, r0+rnd(30,70), r0+rnd(90,150), r0+rnd(160,220),
                 r0+rnd(230,290), r0+rnd(300,350), r0+rnd(350,400)];

    /* --- SVG --- */
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 22 30');
    svg.setAttribute('width',  `${w}px`);
    svg.setAttribute('height', `${h}px`);
    svg.style.cssText = `
      left:${left}%; overflow:visible;
      filter:${blur > 0 ? `blur(${blur}px)` : 'none'};
      --dur:${dur}s; --delay:${del}s; --op:${op};
      --r0:${rs[0]}deg;--r1:${rs[1]}deg;--r2:${rs[2]}deg;
      --r3:${rs[3]}deg;--r4:${rs[4]}deg;--r5:${rs[5]}deg;--r6:${rs[6]}deg;
      --x1:${xs[0]}px;--x2:${xs[1]}px;--x3:${xs[2]}px;
      --x4:${xs[3]}px;--x5:${xs[4]}px;--x6:${xs[5]}px;
    `;
    svg.classList.add('petal');

    /* DEFS */
    const defs = document.createElementNS(NS, 'defs');

    /* Gradiente principal base→punta */
    const lg = document.createElementNS(NS, 'linearGradient');
    lg.setAttribute('id', id);
    lg.setAttribute('x1','50%'); lg.setAttribute('y1','100%');
    lg.setAttribute('x2','50%'); lg.setAttribute('y2','0%');
    [
      [0,   palette.base, 1   ],
      [0.35, palette.mid, .97 ],
      [0.72, palette.tip, .92 ],
      [1,    palette.edge,.8  ],
    ].forEach(([off, col, sop]) => {
      const s = document.createElementNS(NS, 'stop');
      s.setAttribute('offset', `${off*100}%`);
      s.setAttribute('stop-color', col);
      s.setAttribute('stop-opacity', sop);
      lg.appendChild(s);
    });
    defs.appendChild(lg);

    /* Gradiente lateral: brillo en el lado izquierdo */
    const rg = document.createElementNS(NS, 'radialGradient');
    rg.setAttribute('id', `${id}s`);
    rg.setAttribute('cx','30%'); rg.setAttribute('cy','25%'); rg.setAttribute('r','55%');
    [
      [0,   'rgba(255,255,255,.40)'],
      [0.5, 'rgba(255,255,255,.12)'],
      [1,   'rgba(255,255,255,0)'  ],
    ].forEach(([off, col]) => {
      const s = document.createElementNS(NS, 'stop');
      s.setAttribute('offset', `${off*100}%`);
      s.setAttribute('stop-color', col);
      rg.appendChild(s);
    });
    defs.appendChild(rg);

    /* Sombra suave para dar volumen */
    const filt = document.createElementNS(NS, 'filter');
    filt.setAttribute('id', `${id}f`);
    filt.setAttribute('x','-15%'); filt.setAttribute('y','-15%');
    filt.setAttribute('width','130%'); filt.setAttribute('height','130%');
    const fe = document.createElementNS(NS, 'feDropShadow');
    fe.setAttribute('dx','0.4'); fe.setAttribute('dy','0.8');
    fe.setAttribute('stdDeviation','0.6');
    fe.setAttribute('flood-color', isRed ? 'rgba(80,0,0,.35)' : 'rgba(180,80,90,.2)');
    filt.appendChild(fe);
    defs.appendChild(filt);

    svg.appendChild(defs);

    /* Cuerpo del pétalo */
    const body = document.createElementNS(NS, 'path');
    body.setAttribute('d', shape.outer);
    body.setAttribute('fill', `url(#${id})`);
    body.setAttribute('filter', `url(#${id}f)`);
    svg.appendChild(body);

    /* Brillo especular (reflejo de luz) */
    const sheen = document.createElementNS(NS, 'path');
    sheen.setAttribute('d', shape.outer);
    sheen.setAttribute('fill', `url(#${id}s)`);
    svg.appendChild(sheen);

    /* Nervio central */
    const vein = document.createElementNS(NS, 'path');
    vein.setAttribute('d', shape.vein);
    vein.setAttribute('fill', 'none');
    vein.setAttribute('stroke', palette.vein);
    vein.setAttribute('stroke-width', '0.45');
    vein.setAttribute('stroke-linecap', 'round');
    svg.appendChild(vein);

    /* Nervadura secundaria izquierda */
    const v2 = document.createElementNS(NS, 'path');
    v2.setAttribute('d', shape.inner);
    v2.setAttribute('fill', 'none');
    v2.setAttribute('stroke', palette.vein);
    v2.setAttribute('stroke-width', '0.28');
    v2.setAttribute('stroke-linecap', 'round');
    v2.setAttribute('opacity', '0.7');
    svg.appendChild(v2);

    /* Nervadura secundaria derecha */
    const v3 = document.createElementNS(NS, 'path');
    v3.setAttribute('d', shape.inner2);
    v3.setAttribute('fill', 'none');
    v3.setAttribute('stroke', palette.vein);
    v3.setAttribute('stroke-width', '0.28');
    v3.setAttribute('stroke-linecap', 'round');
    v3.setAttribute('opacity', '0.7');
    svg.appendChild(v3);

    /* Contorno del borde (muy sutil) */
    const outline = document.createElementNS(NS, 'path');
    outline.setAttribute('d', shape.outer);
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', isRed ? 'rgba(120,0,0,.25)' : 'rgba(200,150,155,.2)');
    outline.setAttribute('stroke-width', '0.3');
    svg.appendChild(outline);

    container.appendChild(svg);
  }
})();

/* ===== NAV ===== */
(function initNav() {
  const nav    = document.getElementById('mainNav');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 400);
  });

  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
})();

/* ===== PARALLAX HERO ===== */
(function initParallax() {
  const bg1 = document.querySelector('.hero__bg--1');
  const bg2 = document.querySelector('.hero__bg--2');
  if (!bg1) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        bg1.style.transform = `translateY(${y * .4}px)`;
        if (bg2) bg2.style.transform = `translateY(${y * .25}px)`;
        ticking = false;
      });
      ticking = true;
    }
  });
})();

/* ===== NOMBRES DINÁMICOS ===== */
(function updateWeddingNames() {
  let cfg;
  try { cfg = JSON.parse(localStorage.getItem('boda_wedding_config')) || {}; } catch(e) { cfg = {}; }
  const bride = (cfg.bride || 'Sofía').trim();
  const groom = (cfg.groom || 'Alejandro').trim();

  const bi = bride.charAt(0).toUpperCase();
  const gi = groom.charAt(0).toUpperCase();

  // Iniciales en nav (encabezado)
  const elNavBride = document.getElementById('navBrideInitial');
  const elNavGroom = document.getElementById('navGroomInitial');
  if (elNavBride) elNavBride.textContent = bi;
  if (elNavGroom) elNavGroom.textContent = gi;

  // Nombres en hero
  const elBride = document.getElementById('heroBride');
  const elGroom = document.getElementById('heroGroom');
  if (elBride) elBride.textContent = bride;
  if (elGroom) elGroom.textContent = groom;

  // Footer nombres
  const elFooterNames = document.getElementById('footerNames');
  if (elFooterNames) elFooterNames.innerHTML = `${bride} <span>&</span> ${groom}`;

  // Hashtags (elimina espacios de los nombres para el hashtag)
  const brideSlug = bride.replace(/\s+/g, '');
  const groomSlug = groom.replace(/\s+/g, '');
  const yr = cfg.date ? cfg.date.split('-')[0] : '2026';
  const hashtag = `#${brideSlug}Y${groomSlug}${yr}`;

  const elHeroHashtag   = document.getElementById('heroHashtag');
  const elFooterHashtag = document.getElementById('footerHashtag');
  if (elHeroHashtag)   elHeroHashtag.textContent   = hashtag;
  if (elFooterHashtag) elFooterHashtag.textContent = hashtag;

  // Título de la página
  document.title = `${bride} & ${groom} · ${bi}·${gi}·${yr}`;
})();

/* ===== DRESS CODE DINÁMICO ===== */
(function initDressCode() {
  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('boda_wedding_config')) || {}; } catch(e) {}

  function setPalette(id, colors) {
    var el = document.getElementById(id);
    if (!el || !colors || !colors.length) return;
    el.innerHTML = colors.map(function(c) {
      return '<span style="background:' + c.hex + '" title="' + (c.name || '') + '"></span>';
    }).join('');
  }
  function setNote(id, text, iconClass) {
    var el = document.getElementById(id);
    if (!el || text === undefined) return;
    if (text) {
      el.innerHTML = '<i class="' + iconClass + '"></i> ' + text;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  var generalType = document.getElementById('dressCodeType');
  if (generalType && cfg.dressCode) generalType.textContent = cfg.dressCode;

  var ladiesType = document.getElementById('dressLadiesType');
  if (ladiesType && cfg.dressLadiesType) ladiesType.textContent = cfg.dressLadiesType;
  setPalette('dressLadiesPalette', cfg.dressLadiesColors);
  setNote('dressLadiesNote', cfg.dressLadiesNote, 'fa-solid fa-triangle-exclamation');

  var gentsType = document.getElementById('dressGentsType');
  if (gentsType && cfg.dressGentsType) gentsType.textContent = cfg.dressGentsType;
  setPalette('dressGentsPalette', cfg.dressGentsColors);
  setNote('dressGentsNote', cfg.dressGentsNote, 'fa-solid fa-circle-info');
})();

/* ===== FECHAS DINÁMICAS ===== */
(function updateWeddingDates() {
  const DIAS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                    'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let d;
  try {
    const cfg = JSON.parse(localStorage.getItem('boda_wedding_config'));
    if (cfg && cfg.date) {
      d = new Date(cfg.date + 'T12:00:00');
      if (isNaN(d)) d = null;
    }
  } catch(e) {}
  if (!d) d = new Date('2026-02-14T12:00:00');

  const day       = d.getDate();
  const month     = d.getMonth();
  const year      = d.getFullYear();
  const dow       = d.getDay();
  const dayName   = DIAS_ES[dow];
  const monthName = MESES_ES[month];
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  const CAL = '<i class="fa-regular fa-calendar"></i>';

  const hero = document.getElementById('heroBodaDate');
  if (hero) hero.textContent = `${dayName} · ${day} · ${monthName} · ${year}`;

  const ceremonia = document.getElementById('ceremoniaBodaDate');
  if (ceremonia) ceremonia.innerHTML = `${CAL} ${dayName}, ${day} de ${monthName} ${year}`;

  const recepcion = document.getElementById('recepcionBodaDate');
  if (recepcion) recepcion.innerHTML = `${CAL} ${dayName}, ${day} de ${monthName} ${year}`;

  const footer = document.getElementById('footerBodaDate');
  if (footer) footer.textContent = `${dd} · ${mm} · ${year}`;
})();

/* ===== COUNTDOWN ===== */
(function initCountdown() {
  function getTargetTime() {
    try {
      const cfg = JSON.parse(localStorage.getItem('boda_wedding_config'));
      if (cfg && cfg.date && cfg.time) {
        const d = new Date(`${cfg.date}T${cfg.time}:00`);
        if (!isNaN(d)) return d.getTime();
      }
    } catch(e) {}
    return new Date('2026-02-14T18:00:00').getTime();
  }
  const target = getTargetTime();

  function pad(n) { return String(n).padStart(2, '0'); }

  function flip(id, val) {
    const el  = document.getElementById(id);
    const old = el.textContent;
    const str = pad(val);
    if (old !== str) {
      el.style.transform = 'translateY(-100%)';
      el.style.opacity   = '0';
      setTimeout(() => {
        el.textContent     = str;
        el.style.transition = 'none';
        el.style.transform  = 'translateY(20px)';
        el.style.opacity    = '0';
        requestAnimationFrame(() => {
          el.style.transition = 'transform .4s ease, opacity .4s ease';
          el.style.transform  = 'translateY(0)';
          el.style.opacity    = '1';
        });
      }, 200);
    }
  }

  function update() {
    const diff = target - Date.now();
    if (diff <= 0) {
      document.getElementById('countdown').innerHTML =
        `<p style="color:var(--gold-light);font-family:var(--font-script);font-size:2rem">¡Hoy es el gran día! 💍</p>`;
      return;
    }
    flip('cd-days',    Math.floor(diff / 86400000));
    flip('cd-hours',   Math.floor((diff % 86400000) / 3600000));
    flip('cd-minutes', Math.floor((diff % 3600000) / 60000));
    flip('cd-seconds', Math.floor((diff % 60000) / 1000));
  }
  update();
  setInterval(update, 1000);
})();

/* ===== UBICACIÓN DINÁMICA ===== */
(function renderLocation() {
  let venue;
  try { venue = JSON.parse(localStorage.getItem('boda_ubicacion')) || {}; } catch(e) { venue = {}; }
  if (!venue.nombre && !venue.direccion) return;

  const query   = encodeURIComponent(venue.direccion || venue.nombre);
  const titleEl = document.getElementById('venueTitle');
  const addrEl  = document.getElementById('venueAddress');
  const mapEl   = document.getElementById('venueMapIframe');
  const dirBtn  = document.getElementById('venueDirections');

  if (titleEl) titleEl.textContent = venue.nombre || '';
  if (addrEl)  addrEl.textContent  = venue.direccion || '';
  if (mapEl)   mapEl.src = `https://maps.google.com/maps?q=${query}&output=embed&hl=es`;
  if (dirBtn) {
    dirBtn.href = `https://www.google.com/maps/search/${query}`;
  }
})();

/* ===== MUSIC PLAYER ===== */
(function renderMusicPlayer() {
  var music;
  try { music = JSON.parse(localStorage.getItem('boda_musica')) || {}; } catch(e) { music = {}; }

  /* Si no hay configuración de música, usa el archivo por defecto de la carpeta music/ */
  if (!music.localFile && !music.url && !music.savedFile) {
    music = { localFile: 'Christina Perri - A Thousand Years.mp3', title: 'A Thousand Years - Christina Perri' };
  }

  /* Abre IndexedDB de audio */
  function openAudioDB(cb) {
    var req = indexedDB.open('bodaAudio', 1);
    req.onupgradeneeded = function(e) { e.target.result.createObjectStore('tracks', { keyPath: 'id' }); };
    req.onsuccess = function(e) { cb(null, e.target.result); };
    req.onerror   = function()  { cb(true); };
  }

  /* 1) Archivo local en carpeta music/ (funciona en todos los dispositivos) */
  if (music.localFile && music.localFile.trim()) {
    startPlayer('music/' + music.localFile.trim(), music.title || music.localFile.replace(/\.[^.]+$/, ''));
    return;
  }

  /* 2) Intenta cargar archivo subido en IndexedDB; si no hay, usa URL */
  openAudioDB(function(err, db) {
    if (err) { if (music.url) startPlayer(null, null); return; }
    var tx  = db.transaction('tracks', 'readonly');
    var req = tx.objectStore('tracks').get('main');
    req.onsuccess = function(e) {
      var rec = e.target.result;
      if (rec && rec.data) {
        var blob    = new Blob([rec.data], { type: rec.type || 'audio/mpeg' });
        var blobUrl = URL.createObjectURL(blob);
        startPlayer(blobUrl, rec.title || music.title || 'Música de la boda');
      } else if (music.url) {
        startPlayer(null, null);
      }
    };
    req.onerror = function() { if (music.url) startPlayer(null, null); };
  });

  function startPlayer(blobUrl, fileTitle) {
    var player   = document.getElementById('musicPlayer');
    var titleEl  = document.getElementById('musicTitle');
    var playBtn  = document.getElementById('musicPlayBtn');
    var playIcon = document.getElementById('musicPlayIcon');
    var volBtn   = document.getElementById('musicVolBtn');
    var volIcon  = document.getElementById('musicVolIcon');
    var closeBtn = document.getElementById('musicClose');
    var eqEl     = document.getElementById('musicEq');
    if (!player) return;

    var songTitle = fileTitle || music.title || 'Música de la boda';
    if (titleEl) titleEl.textContent = songTitle;

    var playing       = false;
    var muted         = false;
    var ytPlayer      = null;
    var playerReady   = false;
    var playWhenReady = false;
    var audioEl       = null;

    function setPlaying(val) {
      playing = val;
      playIcon.className = val ? 'fa-solid fa-pause' : 'fa-solid fa-play';
      eqEl.classList.toggle('music-eq--active', val && !muted);
    }
    function setMuted(val) {
      muted = val;
      volIcon.className = val ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      eqEl.classList.toggle('music-eq--active', playing && !val);
    }
    function setLoading(val) {
      playIcon.className = val ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play';
      playBtn.disabled = val;
    }

    /* Mostrar barra del player siempre */
    player.classList.add('music-player--active');

    /* ─────────── ARCHIVO DE AUDIO (IndexedDB blob) ─────────── */
    if (blobUrl) {
      audioEl = new Audio(blobUrl);
      audioEl.loop   = true;
      audioEl.volume = 0.8;
      audioEl.addEventListener('play',  function() { setPlaying(true);  });
      audioEl.addEventListener('pause', function() { setPlaying(false); });
      audioEl.addEventListener('ended', function() { audioEl.currentTime = 0; audioEl.play(); });
      audioEl.addEventListener('volumechange', function() {
        setMuted(audioEl.muted || audioEl.volume === 0);
      });

      playBtn.addEventListener('click', function() {
        if (!playing) {
          audioEl.muted = false;
          audioEl.play().then(function(){ setPlaying(true); }).catch(function(){});
        } else {
          audioEl.pause(); setPlaying(false);
        }
      });

      volBtn.addEventListener('click', function() {
        audioEl.muted = !audioEl.muted;
        setMuted(audioEl.muted);
      });

      /* ── Estrategia de autoplay automático ──
         Nivel 1: reproducción directa con sonido (visitas recurrentes / navegador permisivo)
         Nivel 2: reproducción silenciada → quitar mute en primer clic/toque (siempre en desktop)
         Nivel 3: reproducir en primer clic/toque (iOS y navegadores muy estrictos)
      */
      audioEl.play()
        .then(function() {
          /* Nivel 1 OK: suena de una */
        })
        .catch(function() {
          /* Nivel 2: autoplay muted — el navegador siempre lo permite */
          audioEl.muted = true;
          audioEl.play()
            .then(function() {
              /* Muted OK: en el primer gesto del usuario quitamos el mute */
              function activarSonido() {
                audioEl.muted  = false;
                audioEl.volume = 0.8;
              }
              document.addEventListener('click',      activarSonido, { once: true, passive: true });
              document.addEventListener('touchstart', activarSonido, { once: true, passive: true });
              document.addEventListener('keydown',    activarSonido, { once: true });
            })
            .catch(function() {
              /* Nivel 3: ni muted funciona (iOS Safari) → reproducir en primer gesto */
              audioEl.muted = false;
              function iniciarConSonido() {
                audioEl.play().catch(function(){});
              }
              document.addEventListener('click',      iniciarConSonido, { once: true });
              document.addEventListener('touchstart', iniciarConSonido, { once: true });
            });
        });

    /* ─────────── YOUTUBE / URL remota ─────────── */
    } else {

      var getYtId = function(url) {
        var m = url.match(/(?:[?&]v=|youtu\.be\/|\/embed\/)([^?&#\s]{5,})/);
        return m ? m[1] : null;
      };
      var ytId = getYtId(music.url || '');

      if (ytId) {
        var ytWrap = document.createElement('div');
        ytWrap.style.cssText = 'position:fixed;left:-640px;top:0;width:480px;height:270px;pointer-events:none;';
        var ytDiv  = document.createElement('div');
        ytDiv.id   = 'ytMusicContainer';
        ytWrap.appendChild(ytDiv);
        document.body.appendChild(ytWrap);
        setLoading(true);

        var initYT = function() {
          ytPlayer = new YT.Player('ytMusicContainer', {
            height: 270, width: 480, videoId: ytId,
            playerVars: { autoplay: 0, mute: 0, rel: 0, enablejsapi: 1,
              origin: location.origin || 'https://localhost' },
            events: {
              onReady: function(e) {
                playerReady = true; setLoading(false); e.target.setVolume(80);
                if (playWhenReady) { e.target.playVideo(); }
              },
              onStateChange: function(e) {
                setPlaying(e.data === YT.PlayerState.PLAYING);
                if (e.data === YT.PlayerState.ENDED) { e.target.seekTo(0); e.target.playVideo(); }
              },
              onError: function(e) {
                setLoading(false);
                if (titleEl) titleEl.textContent = (e.data === 101 || e.data === 150)
                  ? '⚠ Video bloqueado — sube un MP3 en Admin'
                  : '⚠ Error ' + e.data + ' — sube un MP3 en Admin';
              }
            }
          });
        }

        if (window.YT && window.YT.Player) { initYT(); }
        else {
          var prev = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = function() { if (typeof prev === 'function') prev(); initYT(); };
          if (!document.getElementById('ytApiScript')) {
            var s = document.createElement('script');
            s.id = 'ytApiScript'; s.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(s);
          }
        }

        playBtn.addEventListener('click', function() {
          if (!playerReady) { playWhenReady = true; setLoading(true); return; }
          if (!playing) { ytPlayer.unMute(); ytPlayer.setVolume(80); ytPlayer.playVideo(); }
          else          { ytPlayer.pauseVideo(); }
        });
        volBtn.addEventListener('click', function() {
          if (!ytPlayer || !playerReady) return;
          if (!muted) { ytPlayer.mute(); setMuted(true); } else { ytPlayer.unMute(); setMuted(false); }
        });

      } else {
        /* ─── URL directa de audio (MP3 remoto) ─── */
        audioEl = new Audio(music.url);
        audioEl.loop = true;
        volBtn.style.display = 'none';
        audioEl.addEventListener('play',  function() { setPlaying(true);  });
        audioEl.addEventListener('pause', function() { setPlaying(false); });
        playBtn.addEventListener('click', function() {
          if (!playing) { audioEl.play().then(function(){ setPlaying(true); }).catch(function(){}); }
          else          { audioEl.pause(); setPlaying(false); }
        });
      }
    }

    /* ─── Cerrar ─── */
    closeBtn.addEventListener('click', function() {
      if (audioEl)              { audioEl.pause(); }
      if (ytPlayer && playerReady) { try { ytPlayer.stopVideo(); } catch(e){} }
      player.classList.remove('music-player--active');
    });
  }
})();

/* ===== CRONOGRAMA DINÁMICO ===== */
(function renderCronograma() {
  const container = document.getElementById('mainTimeline');
  if (!container) return;

  const CRONO_DEFAULTS = [
    {hora:'11:00',icon:'💐',nombre:'Llegada de invitados',         lugar:'Jardín principal',        color:'#C9A96E',notas:'Bienvenida con champán y jazz en vivo'},
    {hora:'12:00',icon:'💍',nombre:'Ceremonia civil',              lugar:'Capilla de Los Laureles', color:'#E91E63',notas:'Duración aprox. 40 minutos'},
    {hora:'13:00',icon:'📸',nombre:'Sesión de fotos',              lugar:'Jardín de las rosas',     color:'#9C27B0',notas:'Fotos familiares y con invitados'},
    {hora:'14:00',icon:'🍽️',nombre:'Cocktail & aperitivos',        lugar:'Terraza principal',       color:'#FF9800',notas:'Bebidas y canapés de bienvenida'},
    {hora:'15:30',icon:'🥂',nombre:'Recepción & banquete',         lugar:'Salón Imperial',          color:'#4CAF50',notas:'5 tiempos. Música suave de fondo'},
    {hora:'17:00',icon:'🎂',nombre:'Corte del pastel',             lugar:'Salón Imperial',          color:'#F44336',notas:'Brindis con champán'},
    {hora:'17:30',icon:'💃',nombre:'Primer baile de los novios',   lugar:'Pista central',           color:'#3F51B5',notas:'"Perfect" - Ed Sheeran'},
    {hora:'18:00',icon:'🎵',nombre:'Fiesta & baile libre',         lugar:'Pista central',           color:'#009688',notas:'Playlist especial de los novios'},
    {hora:'21:00',icon:'🎆',nombre:'Show de fuegos artificiales',  lugar:'Jardín posterior',        color:'#FF5722',notas:'8 minutos de espectáculo'},
    {hora:'23:00',icon:'🌙',nombre:'Cierre & despedida de novios', lugar:'Entrada principal',       color:'#607D8B',notas:'Pétalos y mariposas en la salida'},
  ];

  let events;
  try { events = JSON.parse(localStorage.getItem('boda_cronograma')); } catch(e) { events = null; }
  if (!events || !events.length) events = CRONO_DEFAULTS;

  function to12h(t) {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const sorted = [...events].sort((a, b) => a.hora.localeCompare(b.hora));

  container.innerHTML = sorted.map(ev => {
    const time     = to12h(ev.hora || '00:00');
    const color    = ev.color || '#C9A96E';
    const icon     = ev.icon  || '📌';
    const subtitle = [ev.lugar, ev.notas].filter(Boolean).join(' · ');
    return `<div class="tl-item reveal">
      <div class="tl-time">${time}</div>
      <div class="tl-dot" style="background:${color};box-shadow:0 0 0 6px ${color}33,0 4px 16px rgba(0,0,0,.3)">${esc(icon)}</div>
      <div class="tl-body">
        <h4>${esc(ev.nombre)}</h4>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
      </div>
    </div>`;
  }).join('');
})();

/* ===== SCROLL REVEAL ===== */
(function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 100);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ===== TEMA ===== */
(function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  const saved = localStorage.getItem('boda_theme') || 'light';

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    icon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('boda_theme', t);
  }
  apply(saved);
  btn.addEventListener('click', () => apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

/* ===== SCROLL TOP ===== */
document.getElementById('scrollTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ===== TOAST ===== */
function toast(msg, dur = 3500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

/* ===== QR CANVAS ===== */
function makeQR(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFF';
  ctx.fillRect(0, 0, 160, 160);

  const seed = [...text].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 0);
  const cell = 16; const grid = 10;
  ctx.fillStyle = '#1E1E3A';

  for (let r = 0; r < grid; r++) {
    for (let c2 = 0; c2 < grid; c2++) {
      const h = (Math.imul(seed ^ (r * grid + c2), 2654435769) >>> 0);
      if (h % 2 === 0 || (r < 3 && c2 < 3) || (r < 3 && c2 > 6) || (r > 6 && c2 < 3)) {
        ctx.fillRect(c2 * cell, r * cell, cell - 2, cell - 2);
      }
    }
  }
  [[0,0],[0,7],[7,0]].forEach(([cr, cc]) => {
    ctx.fillStyle = '#1E1E3A';  ctx.fillRect(cc*cell, cr*cell, 3*cell-2, 3*cell-2);
    ctx.fillStyle = '#FFF';     ctx.fillRect(cc*cell+2, cr*cell+2, 3*cell-6, 3*cell-6);
    ctx.fillStyle = '#C9A96E';  ctx.fillRect(cc*cell+5, cr*cell+5, 3*cell-12, 3*cell-12);
  });

  const img = new Image();
  img.src = c.toDataURL();
  img.alt = 'QR de confirmación';
  return img;
}

/* ===== CONFETI ===== */
function spawnConfetti() {
  const container = document.getElementById('successConfetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#C9A96E','#E8D5B7','#D4A5A5','#B5C8C0','#4CAF50','#FFF'];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*.8}s;
      animation-duration:${1.5 + Math.random()}s;
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
    `;
    container.appendChild(piece);
  }
}

/* ===== VALIDACIÓN ===== */
function validate(fieldId, errId, rules) {
  const field = document.getElementById(fieldId);
  if (!field) return true;
  const val = field.value.trim();
  const err = document.getElementById(errId);
  let msg = '';
  if (rules.required && !val) msg = 'Este campo es obligatorio.';
  else if (rules.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Ingresa un correo válido.';
  else if (rules.minLen && val.length < rules.minLen) msg = `Mínimo ${rules.minLen} caracteres.`;
  field.classList.toggle('error', !!msg);
  if (err) err.textContent = msg;
  return !msg;
}

/* ===== RSVP FORM ===== */
(function initForm() {
  const form = document.getElementById('rsvpForm');
  const steps = {
    s1:  document.getElementById('step1'),
    s2si:document.getElementById('step2si'),
    s2no:document.getElementById('step2no'),
    ok:  document.getElementById('stepSuccess'),
  };

  function setStep(current, next) {
    current.classList.remove('active');
    next.classList.add('active');
    document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function markStep(n) {
    document.querySelectorAll('.step-dot').forEach(d => {
      const dn = parseInt(d.dataset.step);
      d.classList.toggle('active', dn === n);
      d.classList.toggle('done', dn < n);
    });
  }

  // Paso 1 → Paso 2
  document.getElementById('nextStep1').addEventListener('click', () => {
    const v1 = validate('nombre', 'err-nombre', { required: true, minLen: 2 });
    const v2 = validate('correo', 'err-correo', { required: true, email: true });
    const v3 = validate('acompanantes', 'err-acompanantes', { required: true });
    const asist = form.querySelector('[name="asistencia"]:checked');
    const errAs = document.getElementById('err-asistencia');

    if (!asist) { errAs.textContent = 'Por favor selecciona una opción.'; return; }
    errAs.textContent = '';
    if (!v1 || !v2 || !v3) return;

    markStep(2);
    if (asist.value === 'si') setStep(steps.s1, steps.s2si);
    else                       setStep(steps.s1, steps.s2no);
  });

  document.getElementById('prev2si').addEventListener('click', () => { markStep(1); setStep(steps.s2si, steps.s1); });
  document.getElementById('prev2no').addEventListener('click', () => { markStep(1); setStep(steps.s2no, steps.s1); });

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    const asist = form.querySelector('[name="asistencia"]:checked');
    if (!asist) return;

    const isYes = asist.value === 'si';
    const guest = {
      id:      Date.now(),
      nombre:  document.getElementById('nombre').value.trim(),
      correo:  document.getElementById('correo').value.trim(),
      telefono:document.getElementById('telefono').value.trim(),
      acompanantes: parseInt(document.getElementById('acompanantes').value) || 0,
      asistencia: asist.value,
      estado:     isYes ? 'confirmado' : 'rechazado',
      menu:       isYes ? ((form.querySelector('[name="menu"]:checked') || {}).value || '') : '',
      restricciones: isYes ? (document.getElementById('restricciones').value || '') : '',
      mensaje: isYes
        ? (document.getElementById('mensaje').value || '')
        : (document.getElementById('mensaje-no').value || ''),
      fecha_confirmacion: new Date().toISOString(),
    };
    saveGuest(guest);

    markStep(3);
    steps.s2si.classList.remove('active');
    steps.s2no.classList.remove('active');
    steps.ok.classList.add('active');

    document.getElementById('successTitle').textContent = isYes ? '¡Gracias por confirmar!' : 'Gracias por avisarnos';
    document.getElementById('successMsg').textContent   = isYes
      ? `¡${guest.nombre}, te esperamos con todo el amor del mundo el 14 de Febrero!`
      : `${guest.nombre}, lamentamos que no puedas estar, ¡tus buenos deseos nos alegran!`;

    if (isYes) {
      const qrEl = document.getElementById('successQR');
      qrEl.innerHTML = '';
      qrEl.appendChild(makeQR(`BODA2026-${guest.id}-${guest.nombre}`));
      document.getElementById('qrNote').style.display = '';
      spawnConfetti();
    } else {
      document.getElementById('successQR').style.display = 'none';
      document.getElementById('qrNote').style.display = 'none';
    }

    toast('✓ Respuesta enviada correctamente');
    document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('resetForm').addEventListener('click', () => {
    form.reset();
    steps.ok.classList.remove('active');
    steps.s2si.classList.remove('active');
    steps.s2no.classList.remove('active');
    steps.s1.classList.add('active');
    markStep(1);
    document.getElementById('successQR').style.display = '';
    document.getElementById('qrNote').style.display = '';
  });

  // NOMBRE: solo letras + espacios, Title Case al salir del campo
  const nombreInp = document.getElementById('nombre');
  nombreInp.addEventListener('input', function() {
    const pos = this.selectionStart;
    const filtered = this.value.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '');
    if (filtered !== this.value) {
      const diff = this.value.length - filtered.length;
      this.value = filtered;
      this.setSelectionRange(Math.max(0, pos - diff), Math.max(0, pos - diff));
    }
  });
  nombreInp.addEventListener('blur', function() {
    this.value = this.value
      .replace(/\s+/g, ' ').trim()
      .replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    validate('nombre', 'err-nombre', { required: true, minLen: 2 });
  });

  // CORREO: validación al salir
  document.getElementById('correo').addEventListener('blur', () => validate('correo', 'err-correo', { required: true, email: true }));

  // TELÉFONO: solo dígitos, +, espacios y guiones
  document.getElementById('telefono').addEventListener('input', function() {
    this.value = this.value.replace(/[^\d\s+\-()]/g, '');
  });

  // CARDS ASISTENCIA: verde al elegir sí, rojo al elegir no
  const cYes = document.getElementById('cardYes');
  const cNo  = document.getElementById('cardNo');
  form.querySelectorAll('[name="asistencia"]').forEach(radio => {
    radio.addEventListener('change', () => {
      cYes.classList.remove('rsvp-card--sel-yes', 'rsvp-card--sel-no', 'rsvp-card--sel-dim');
      cNo.classList.remove('rsvp-card--sel-yes', 'rsvp-card--sel-no', 'rsvp-card--sel-dim');
      if (radio.value === 'si') {
        cYes.classList.add('rsvp-card--sel-yes');
        cNo.classList.add('rsvp-card--sel-dim');
      } else {
        cNo.classList.add('rsvp-card--sel-no');
        cYes.classList.add('rsvp-card--sel-dim');
      }
    });
  });
})();

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ===== GALERÍA LIGHTBOX SIMPLE ===== */
(function initLightbox() {
  const items = document.querySelectorAll('.mg-item');
  if (!items.length) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;
    display:none;align-items:center;justify-content:center;cursor:zoom-out;
    backdrop-filter:blur(8px);
  `;
  const imgEl = document.createElement('img');
  imgEl.style.cssText = 'max-width:90vw;max-height:88vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.6);transform:scale(.9);transition:transform .3s ease;';
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeBtn.style.cssText = 'position:fixed;top:20px;right:24px;color:#fff;font-size:1.6rem;background:none;border:none;cursor:pointer;z-index:10000;';
  overlay.appendChild(imgEl);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  function open(src) {
    overlay.style.display = 'flex';
    imgEl.src = src;
    setTimeout(() => imgEl.style.transform = 'scale(1)', 50);
    document.body.style.overflow = 'hidden';
  }
  function close() {
    imgEl.style.transform = 'scale(.9)';
    setTimeout(() => { overlay.style.display = 'none'; document.body.style.overflow = ''; }, 200);
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.querySelector('img')?.src;
      if (src) open(src);
    });
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
