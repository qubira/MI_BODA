'use strict';

/* ── Configuración ──────────────────────────────────────── */
const FECHA_BODA = new Date('2027-01-31T12:00:00');
const RSVP_ENDPOINT = '/api/rsvp/exclusivo-13';

/* ══════════════════════════════════════════════════════════
   INTRO VIDEO
   ══════════════════════════════════════════════════════════ */
const introSection = document.getElementById('intro-video');
const mainContent  = document.getElementById('main-content');
const introVid     = document.getElementById('intro-vid');
const skipBtn      = document.getElementById('skip-btn');

function lanzarSitio() {
  introSection.classList.add('fade-out');
  mainContent.classList.remove('hidden');
  // Intenta reproducir música tras gesto de usuario
  intentarMusica();
  // Remover intro del DOM tras transición
  setTimeout(() => introSection.remove(), 900);
}

// Saltar con botón
skipBtn.addEventListener('click', lanzarSitio);

// Al terminar el video, pasar automáticamente
introVid.addEventListener('ended', lanzarSitio);

// Si el video no carga (sin archivo), pasar igual tras 1.5s
introVid.addEventListener('error', () => setTimeout(lanzarSitio, 1500));

// Fallback: si después de 8s el video no terminó, pasar
setTimeout(() => {
  if (!mainContent.classList.contains('hidden')) return; // ya pasó
  lanzarSitio();
}, 8000);

/* ══════════════════════════════════════════════════════════
   MÚSICA DE FONDO
   ══════════════════════════════════════════════════════════ */
const audio    = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
let musicaInicializada = false;

function intentarMusica() {
  if (musicaInicializada) return;
  audio.volume = 0.35;
  audio.play()
    .then(() => {
      musicaInicializada = true;
      musicBtn.classList.add('playing');
      musicBtn.textContent = '';
      musicBtn.innerHTML = '<span class="waves"></span>🎵';
    })
    .catch(() => {
      // Navegador bloqueó autoplay; el botón ya está visible para que el usuario lo toque
      musicBtn.title = '▶ Activar música';
    });
}

musicBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().then(() => {
      musicaInicializada = true;
      musicBtn.classList.add('playing');
      musicBtn.innerHTML = '<span class="waves"></span>🎵';
    });
  } else {
    audio.pause();
    musicBtn.classList.remove('playing');
    musicBtn.innerHTML = '🔇';
  }
});

/* ══════════════════════════════════════════════════════════
   PÉTALOS FLOTANTES
   ══════════════════════════════════════════════════════════ */
function crearPetalos() {
  const wrap = document.getElementById('petals-wrap');
  if (!wrap) return;

  // Emojis de pétalos/flores
  const tipos = ['🌸', '🌺', '🌼', '🍃', '✨'];
  const total = window.innerWidth < 600 ? 8 : 14;

  for (let i = 0; i < total; i++) {
    const p = document.createElement('span');
    p.classList.add('petal');
    p.textContent = tipos[Math.floor(Math.random() * tipos.length)];
    p.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `font-size: ${10 + Math.random() * 14}px`,
      `animation-duration: ${6 + Math.random() * 8}s`,
      `animation-delay: ${Math.random() * 6}s`,
    ].join(';');
    wrap.appendChild(p);
  }
}
crearPetalos();

/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver
   ══════════════════════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
// Ejecutar cuando el sitio sea visible
const mainObs = new MutationObserver(() => {
  if (!mainContent.classList.contains('hidden')) {
    initReveal();
    mainObs.disconnect();
  }
});
mainObs.observe(mainContent, { attributes: true });

/* ══════════════════════════════════════════════════════════
   CUENTA REGRESIVA
   ══════════════════════════════════════════════════════════ */
function calcularDias() {
  const hoy   = new Date();
  const diff  = FECHA_BODA - hoy;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function animarContador(el, meta) {
  const duracion = 1800; // ms
  const fps = 60;
  const pasos = Math.ceil(duracion / (1000 / fps));
  let frame = 0;
  const timer = setInterval(() => {
    frame++;
    const progreso = frame / pasos;
    const ease = 1 - Math.pow(1 - progreso, 3); // ease-out cubic
    el.textContent = Math.round(meta * ease);
    if (frame >= pasos) {
      el.textContent = meta;
      clearInterval(timer);
    }
  }, 1000 / fps);
}

const daysEl = document.getElementById('days-counter');
const cntSection = document.getElementById('countdown-section');
let contadorActivado = false;

const cntObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !contadorActivado) {
    contadorActivado = true;
    animarContador(daysEl, calcularDias());
    cntObs.disconnect();
  }
}, { threshold: 0.3 });
cntObs.observe(cntSection);

// Actualizar contador cada minuto por si la página queda abierta
setInterval(() => { daysEl.textContent = calcularDias(); }, 60000);

/* ══════════════════════════════════════════════════════════
   MODAL DE REGALO
   ══════════════════════════════════════════════════════════ */
const modalRegalo = document.getElementById('modal-regalo');
const btnRegalo   = document.getElementById('btn-regalo');
const modalClose  = document.getElementById('modal-close');

btnRegalo.addEventListener('click', () => modalRegalo.classList.add('open'));
modalClose.addEventListener('click', () => modalRegalo.classList.remove('open'));
modalRegalo.addEventListener('click', (e) => {
  if (e.target === modalRegalo) modalRegalo.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') modalRegalo.classList.remove('open');
});

/* ══════════════════════════════════════════════════════════
   FORMULARIO RSVP
   ══════════════════════════════════════════════════════════ */
const form     = document.getElementById('rsvp-form');
const formMsg  = document.getElementById('form-msg');
const submitBtn = document.getElementById('rsvp-submit');

function mostrarMsg(texto, tipo) {
  formMsg.textContent = texto;
  formMsg.className = 'form-msg ' + tipo;
  formMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validarForm(data) {
  const errores = [];
  if (!data.nombre.trim())                    errores.push('El nombre es requerido.');
  if (!data.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo))
                                               errores.push('Correo inválido.');
  if (data.acompanantes === '')               errores.push('Indica cuántos acompañantes.');
  if (!data.asiste)                           errores.push('Por favor indica si asistirás.');
  return errores;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const radioAsiste = form.querySelector('input[name="asiste"]:checked');
  const data = {
    nombre:       form.rsvp_nombre ? '' : document.getElementById('rsvp-nombre').value,
    correo:       document.getElementById('rsvp-correo').value,
    telefono:     document.getElementById('rsvp-telefono').value,
    acompanantes: document.getElementById('rsvp-acompanantes').value,
    asiste:       radioAsiste ? radioAsiste.value : '',
  };
  // corregir nombre
  data.nombre = document.getElementById('rsvp-nombre').value;

  const errores = validarForm(data);
  if (errores.length) {
    mostrarMsg('⚠️ ' + errores[0], 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  try {
    const r = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:        data.nombre.trim(),
        correo:        data.correo.trim(),
        telefono:      data.telefono.trim() || null,
        acompanantes:  parseInt(data.acompanantes) || 0,
        asiste:        data.asiste === 'si',
      }),
    });

    const json = await r.json();
    if (r.ok && json.ok) {
      mostrarMsg('🎉 ¡Gracias! Tu respuesta fue registrada. ¡Te esperamos!', 'success');
      form.reset();
    } else {
      throw new Error(json.error || 'Error del servidor');
    }
  } catch (err) {
    mostrarMsg('❌ Hubo un error al enviar. Intenta de nuevo.', 'error');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirmar asistencia';
  }
});
