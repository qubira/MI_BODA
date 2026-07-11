'use strict';
/* ============================================================
   EXCLUSIVO_4 — invitación de boda · integrado con admin
   ============================================================ */

const DB_KEY = 'boda_rsvp_guests';
const WEDDING_KEY = 'boda_wedding_config';

function getGuests()  { try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } catch { return []; } }
function saveGuest(g) { const a = getGuests(); a.push(g); localStorage.setItem(DB_KEY, JSON.stringify(a)); }

/* ── APLICA CONFIG DEL ADMIN AL INDEX ── */
(function applyWeddingConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem(WEDDING_KEY)) || {};
    const bride = cfg.bride || '';
    const groom = cfg.groom || '';
    if (bride || groom) {
      const names = bride && groom ? `${bride} & ${groom}` : (bride || groom);
      document.querySelectorAll('.js-names').forEach(el => el.textContent = names);
      document.querySelectorAll('.js-bride').forEach(el => el.textContent = bride);
      document.querySelectorAll('.js-groom').forEach(el => el.textContent = groom);
    }
    if (cfg.date) {
      const d = new Date(cfg.date + 'T12:00:00');
      if (!isNaN(d)) {
        const pad2 = n => String(n).padStart(2,'0');
        const dateStr = `${pad2(d.getDate())} · ${pad2(d.getMonth()+1)} · ${d.getFullYear()}`;
        const dateStrLong = d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
        document.querySelectorAll('.js-date').forEach(el => el.textContent = dateStr);
        document.querySelectorAll('.js-date-long').forEach(el => el.textContent = dateStrLong);
        // Actualiza countdown
        window._BODA_DATE = cfg.time ? new Date(`${cfg.date}T${cfg.time}:00`) : new Date(`${cfg.date}T17:00:00`);
      }
    }
    if (cfg.venue_name) {
      document.querySelectorAll('.js-venue').forEach(el => el.textContent = cfg.venue_name);
    }
  } catch(e) {}
})()

/* ── TOAST ── */
function toast(msg) {
  const el = document.getElementById('toastNotif');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('t-show');
  setTimeout(() => el.classList.remove('t-show'), 3200);
}

/* ── QR CANVAS (decorativo) ── */
function makeQR(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 140;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 140, 140);
  const seed = [...text].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 0);
  const cell = 14; const grid = 10;
  ctx.fillStyle = '#243d18';
  for (let r = 0; r < grid; r++) {
    for (let cc = 0; cc < grid; cc++) {
      const h = (Math.imul(seed ^ (r * grid + cc), 2654435769) >>> 0);
      if (h % 2 === 0 || (r < 3 && cc < 3) || (r < 3 && cc > 6) || (r > 6 && cc < 3)) {
        ctx.fillRect(cc * cell, r * cell, cell - 2, cell - 2);
      }
    }
  }
  [[0,0],[0,7],[7,0]].forEach(([cr, cc]) => {
    ctx.fillStyle = '#243d18'; ctx.fillRect(cc*cell, cr*cell, 3*cell-2, 3*cell-2);
    ctx.fillStyle = '#fff';    ctx.fillRect(cc*cell+2, cr*cell+2, 3*cell-6, 3*cell-6);
    ctx.fillStyle = '#c4a35a'; ctx.fillRect(cc*cell+5, cr*cell+5, 3*cell-12, 3*cell-12);
  });
  return c;
}

/* ── CONFETTI ── */
function spawnConfetti() {
  const box = document.getElementById('rsvpConfetti');
  if (!box) return;
  box.innerHTML = '';
  const colors = ['#3a6430','#c4a35a','#b0c9a8','#faf8f3','#e2c98a','#5c7f52'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.7}s;animation-duration:${1.4+Math.random()*.6}s;border-radius:${Math.random()>.5?'50%':'2px'};`;
    box.appendChild(p);
  }
}

/* ── STEPS INDICATOR ── */
function markSteps(active) {
  [1,2,3].forEach(n => {
    const d = document.getElementById('rsvpDot' + n);
    if (!d) return;
    d.classList.toggle('s-active', n === active);
    d.classList.toggle('s-done',   n < active);
  });
}

/* ── RSVP FORM ── */
(function initRSVP() {
  const form = document.getElementById('rsvpForm');
  if (!form) return;

  const s1   = document.getElementById('rsvpStep1');
  const s2si = document.getElementById('rsvpStep2si');
  const s2no = document.getElementById('rsvpStep2no');
  const sok  = document.getElementById('rsvpSuccess');

  function show(el) {
    [s1, s2si, s2no, sok].forEach(s => s.classList.remove('s-on'));
    el.classList.add('s-on');
    document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fieldErr(id, errId, msg) {
    const f = document.getElementById(id);
    const e = document.getElementById(errId);
    if (f) f.classList.toggle('err', !!msg);
    if (e) e.textContent = msg || '';
    return !msg;
  }

  function validateStep1() {
    const nombre = document.getElementById('rNombre').value.trim();
    const correo = document.getElementById('rCorreo').value.trim();
    const acomp  = document.getElementById('rAcomp').value;
    const asist  = form.querySelector('[name="asistencia"]:checked');

    let ok = true;
    ok = fieldErr('rNombre', 'errNombre', nombre.length < 2 ? 'Mínimo 2 caracteres.' : '') && ok;
    ok = fieldErr('rCorreo', 'errCorreo', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? 'Correo inválido.' : '') && ok;
    ok = fieldErr('rAcomp',  'errAcomp',  !acomp ? 'Selecciona una opción.' : '') && ok;
    const errA = document.getElementById('errAsist');
    if (!asist) { if (errA) errA.textContent = 'Selecciona una opción.'; ok = false; }
    else         { if (errA) errA.textContent = ''; }
    return { ok, asistencia: asist ? asist.value : null };
  }

  document.getElementById('rsvpNext1').addEventListener('click', () => {
    const { ok, asistencia } = validateStep1();
    if (!ok) return;
    markSteps(2);
    show(asistencia === 'si' ? s2si : s2no);
  });

  document.getElementById('rsvpPrev2si').addEventListener('click', () => { markSteps(1); show(s1); });
  document.getElementById('rsvpPrev2no').addEventListener('click', () => { markSteps(1); show(s1); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const asist = form.querySelector('[name="asistencia"]:checked');
    if (!asist) return;
    const isYes = asist.value === 'si';

    const guest = {
      id:             Date.now(),
      nombre:         document.getElementById('rNombre').value.trim(),
      correo:         document.getElementById('rCorreo').value.trim(),
      telefono:       document.getElementById('rTel').value.trim(),
      acompanantes:   parseInt(document.getElementById('rAcomp').value) || 0,
      asistencia:     asist.value,
      estado:         isYes ? 'confirmado' : 'rechazado',
      menu:           isYes ? ((form.querySelector('[name="menu"]:checked') || {}).value || '') : '',
      restricciones:  isYes ? (document.getElementById('rRestr').value || '') : '',
      mensaje:        isYes
        ? (document.getElementById('rMsg').value || '')
        : (document.getElementById('rMsgNo').value || ''),
      fecha_confirmacion: new Date().toISOString(),
    };
    saveGuest(guest);

    markSteps(3);
    show(sok);

    document.getElementById('rsvpOkTitle').textContent = isYes ? '¡Gracias por confirmar!' : 'Gracias por avisarnos';
    document.getElementById('rsvpOkMsg').textContent   = isYes
      ? `¡${guest.nombre}, te esperamos con todo el amor del mundo el 14 de Febrero!`
      : `${guest.nombre}, lamentamos que no puedas estar — tus buenos deseos nos alegran.`;

    const qrEl   = document.getElementById('rsvpQR');
    const qrNote = document.getElementById('rsvpQRNote');
    if (isYes) {
      qrEl.innerHTML = '';
      qrEl.appendChild(makeQR(`PLUS4-${guest.id}-${guest.nombre}`));
      if (qrNote) qrNote.style.display = '';
      spawnConfetti();
    } else {
      qrEl.style.display = 'none';
      if (qrNote) qrNote.style.display = 'none';
    }
    toast('✓ Respuesta enviada correctamente');
  });

  document.getElementById('rsvpReset').addEventListener('click', () => {
    form.reset();
    const qrEl = document.getElementById('rsvpQR');
    if (qrEl) { qrEl.innerHTML = ''; qrEl.style.display = ''; }
    const qrNote = document.getElementById('rsvpQRNote');
    if (qrNote) qrNote.style.display = '';
    markSteps(1);
    show(s1);
  });

  /* Card coloring on radio change */
  form.querySelectorAll('[name="asistencia"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const cYes = document.getElementById('rcYes');
      const cNo  = document.getElementById('rcNo');
      cYes.classList.remove('rc-yes','rc-no','rc-dim');
      cNo.classList.remove('rc-yes','rc-no','rc-dim');
      if (radio.value === 'si') { cYes.classList.add('rc-yes'); cNo.classList.add('rc-dim'); }
      else                       { cNo.classList.add('rc-no');  cYes.classList.add('rc-dim'); }
      const errA = document.getElementById('errAsist');
      if (errA) errA.textContent = '';
    });
  });

  /* Menu option highlight */
  form.querySelectorAll('[name="menu"]').forEach(radio => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('.menu-opt').forEach(m => m.classList.remove('mo-sel'));
      if (radio.checked) radio.closest('.menu-opt').classList.add('mo-sel');
    });
  });

  /* Name: title-case on blur */
  const nombreInp = document.getElementById('rNombre');
  if (nombreInp) {
    nombreInp.addEventListener('blur', function() {
      this.value = this.value.replace(/\s+/g,' ').trim()
        .replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    });
  }
})();

/* ── MUSIC PLAYER ── */
(function initMusic() {
  var music;
  try { music = JSON.parse(localStorage.getItem('boda_musica')) || {}; } catch(e) { music = {}; }
  if (!music.localFile && !music.url && !music.savedFile) {
    music = { localFile: 'Christina Perri - A Thousand Years.mp3', title: 'A Thousand Years — Christina Perri' };
  }

  function openAudioDB(cb) {
    var req = indexedDB.open('bodaAudio', 1);
    req.onupgradeneeded = function(e) { e.target.result.createObjectStore('tracks', { keyPath: 'id' }); };
    req.onsuccess = function(e) { cb(null, e.target.result); };
    req.onerror   = function()  { cb(true); };
  }

  if (music.localFile && music.localFile.trim()) {
    startPlayer('audio/' + music.localFile.trim(), music.title || music.localFile.replace(/\.[^.]+$/, ''));
    return;
  }

  openAudioDB(function(err, db) {
    if (err) { if (music.url) startPlayer(null, null); return; }
    var tx  = db.transaction('tracks', 'readonly');
    var req = tx.objectStore('tracks').get('main');
    req.onsuccess = function(e) {
      var rec = e.target.result;
      if (rec && rec.data) {
        var blob = new Blob([rec.data], { type: rec.type || 'audio/mpeg' });
        startPlayer(URL.createObjectURL(blob), rec.title || music.title || 'Música de la boda');
      } else if (music.url) {
        startPlayer(null, null);
      }
    };
    req.onerror = function() { if (music.url) startPlayer(null, null); };
  });

  function startPlayer(blobUrl, fileTitle) {
    var player  = document.getElementById('musicPlayer');
    var titleEl = document.getElementById('musicTitle');
    var playBtn = document.getElementById('musicPlay');
    var playIc  = document.getElementById('musicPlayIc');
    var volBtn  = document.getElementById('musicVol');
    var volIc   = document.getElementById('musicVolIc');
    var closeBtn= document.getElementById('musicClose');
    var eqEl    = document.getElementById('musicEq');
    if (!player) return;

    if (titleEl) titleEl.textContent = fileTitle || music.title || 'Música de la boda';
    player.classList.add('mp-on');

    var playing = false, muted = false, audioEl = null;

    function setPlaying(v) {
      playing = v;
      if (playIc) playIc.className = v ? 'fa-solid fa-pause' : 'fa-solid fa-play';
      if (eqEl)   eqEl.classList.toggle('eq-play', v && !muted);
    }
    function setMuted(v) {
      muted = v;
      if (volIc) volIc.className = v ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      if (eqEl)  eqEl.classList.toggle('eq-play', playing && !v);
    }

    if (blobUrl) {
      audioEl = new Audio(blobUrl);
      audioEl.loop = true; audioEl.volume = 0.75;
      audioEl.addEventListener('play',  () => setPlaying(true));
      audioEl.addEventListener('pause', () => setPlaying(false));

      playBtn.addEventListener('click', function() {
        if (!playing) { audioEl.muted = false; audioEl.play().catch(function(){}); }
        else           { audioEl.pause(); }
      });
      volBtn.addEventListener('click', function() {
        audioEl.muted = !audioEl.muted; setMuted(audioEl.muted);
      });

      audioEl.play().catch(function() {
        audioEl.muted = true;
        audioEl.play().then(function() {
          function unmute() { audioEl.muted = false; audioEl.volume = 0.75; }
          document.addEventListener('click',      unmute, { once: true, passive: true });
          document.addEventListener('touchstart', unmute, { once: true, passive: true });
        }).catch(function() {
          audioEl.muted = false;
          function startOnGesture() { audioEl.play().catch(function(){}); }
          document.addEventListener('click',      startOnGesture, { once: true });
          document.addEventListener('touchstart', startOnGesture, { once: true });
        });
      });

    } else if (music.url) {
      audioEl = new Audio(music.url);
      audioEl.loop = true;
      audioEl.addEventListener('play',  () => setPlaying(true));
      audioEl.addEventListener('pause', () => setPlaying(false));
      playBtn.addEventListener('click', function() {
        if (!playing) { audioEl.play().catch(function(){}); }
        else           { audioEl.pause(); }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        if (audioEl) audioEl.pause();
        player.classList.remove('mp-on');
      });
    }
  }
})();
