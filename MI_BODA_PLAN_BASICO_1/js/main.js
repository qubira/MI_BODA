/* ============================================================
   MI BODA — JavaScript Principal v2
   Sofía & Alejandro 2027
   ============================================================ */

'use strict';

/* ============================================================
   CONFIGURACIÓN MANUAL DE LA BODA
   Plan Básico: sin admin/login — edita estos valores directamente.
   ============================================================ */
const WEDDING = {
  bride: 'Sofía',
  groom: 'Alejandro',
  date:  '2027-02-14', // YYYY-MM-DD
  time:  '18:00',      // HH:MM (hora objetivo del countdown)
};

/* ===== INTRO CURTAIN ===== */
(function initIntro() {
  var overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  var brideEl = document.getElementById('introCardBride');
  var groomEl = document.getElementById('introCardGroom');
  var dateEl  = document.getElementById('introCardDate');

  if (brideEl) brideEl.textContent = WEDDING.bride;
  if (groomEl) groomEl.textContent = WEDDING.groom;
  if (dateEl) {
    var d = new Date(WEDDING.date + 'T12:00:00');
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
  document.querySelectorAll('a, button, label, .mg-item').forEach(el => {
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
  const bride = WEDDING.bride.trim();
  const groom = WEDDING.groom.trim();

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
  const yr = WEDDING.date.split('-')[0];
  const hashtag = `#${brideSlug}Y${groomSlug}${yr}`;

  const elHeroHashtag   = document.getElementById('heroHashtag');
  const elFooterHashtag = document.getElementById('footerHashtag');
  if (elHeroHashtag)   elHeroHashtag.textContent   = hashtag;
  if (elFooterHashtag) elFooterHashtag.textContent = hashtag;

  // Título de la página
  document.title = `${bride} & ${groom} · ${bi}·${gi}·${yr}`;
})();

/* ===== FECHAS DINÁMICAS ===== */
(function updateWeddingDates() {
  const DIAS_ES  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                    'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const d = new Date(WEDDING.date + 'T12:00:00');

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
  const target = new Date(`${WEDDING.date}T${WEDDING.time}:00`).getTime();

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
