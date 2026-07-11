'use strict';
const DB_KEY = 'boda_rsvp_guests';
const WEDDING_KEY = 'boda_wedding_config';
function getGuests()  { try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } catch { return []; } }
function saveGuest(g) { const a = getGuests(); a.push(g); localStorage.setItem(DB_KEY, JSON.stringify(a)); }
;(function applyWeddingConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem(WEDDING_KEY)) || {};
    const bride = cfg.bride || '', groom = cfg.groom || '';
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
        document.querySelectorAll('.js-date').forEach(el => el.textContent = `${pad2(d.getDate())} · ${pad2(d.getMonth()+1)} · ${d.getFullYear()}`);
        document.querySelectorAll('.js-date-long').forEach(el => el.textContent = d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}));
        window._BODA_DATE = cfg.time ? new Date(`${cfg.date}T${cfg.time}:00`) : new Date(`${cfg.date}T17:00:00`);
      }
    }
    if (cfg.venue_name) document.querySelectorAll('.js-venue').forEach(el => el.textContent = cfg.venue_name);
  } catch(e) {}
})()

function toast(msg) {
  const el = document.getElementById('toastNotif');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('t-show');
  setTimeout(() => el.classList.remove('t-show'), 3200);
}

function makeQR(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 140;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 140, 140);
  const seed = [...text].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 0);
  const cell = 14; const grid = 10;
  ctx.fillStyle = '#6B6750';
  for (let r = 0; r < grid; r++) {
    for (let cc = 0; cc < grid; cc++) {
      const h = (Math.imul(seed ^ (r * grid + cc), 2654435769) >>> 0);
      if (h % 2 === 0 || (r < 3 && cc < 3) || (r < 3 && cc > 6) || (r > 6 && cc < 3))
        ctx.fillRect(cc * cell, r * cell, cell - 2, cell - 2);
    }
  }
  [[0,0],[0,7],[7,0]].forEach(([cr, cc]) => {
    ctx.fillStyle = '#6B6750'; ctx.fillRect(cc*cell, cr*cell, 3*cell-2, 3*cell-2);
    ctx.fillStyle = '#fff';    ctx.fillRect(cc*cell+2, cr*cell+2, 3*cell-6, 3*cell-6);
    ctx.fillStyle = '#C4A96A'; ctx.fillRect(cc*cell+5, cr*cell+5, 3*cell-12, 3*cell-12);
  });
  return c;
}

function spawnConfetti() {
  const box = document.getElementById('rsvpConfetti');
  if (!box) return; box.innerHTML = '';
  const colors = ['#6B6750','#C4A96A','#fff','#e8e0d0','#a0a090'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.7}s;animation-duration:${1.4+Math.random()*.6}s;border-radius:${Math.random()>.5?'50%':'2px'};`;
    box.appendChild(p);
  }
}

const GUEST_LIST_KEY = 'boda_guest_list';
function getGuestList() { try { return JSON.parse(localStorage.getItem(GUEST_LIST_KEY)) || []; } catch { return []; } }

/* ── RSVP — verificación por nombre ── */
(function initRSVP() {
  const form  = document.getElementById('rsvpForm');
  if (!form) return;

  const s1    = document.getElementById('rsvpStep1');
  const sConf = document.getElementById('rsvpStepConfirm');
  const sok   = document.getElementById('rsvpSuccess');
  let   found = null;

  function norm(n) {
    return (n||'').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z\s]/g,'').trim().replace(/\s+/g,' ');
  }

  function findGuest(input) {
    return getGuestList().find(g => norm(g.name) === norm(input)) || null;
  }

  function showStep(el) {
    [s1,sConf,sok].forEach(s => s && s.classList.remove('s-on'));
    if (el) el.classList.add('s-on');
    const sec = document.getElementById('rsvp');
    if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  document.getElementById('rsvpVerify').addEventListener('click', function() {
    const input = (document.getElementById('rNombre').value||'').trim();
    const err   = document.getElementById('errNombre');
    if (input.length < 2) { if(err) err.textContent='Ingresa tu nombre completo.'; return; }
    if (err) err.textContent = '';
    found = findGuest(input);
    if (!found) {
      if (err) err.textContent = 'Nombre no encontrado. Verifica cómo está escrito o contacta a los novios.';
      return;
    }
    document.getElementById('rsvpGreeting').textContent = `¡Hola, ${found.name}!`;
    const c = parseInt(found.companions)||0;
    document.getElementById('rsvpCompMsg').textContent =
      c === 0 ? 'Tu invitación es personal (sin acompañantes).'
      : c === 1 ? 'Puedes traer 1 acompañante.'
      : `Puedes traer hasta ${c} acompañantes.`;
    showStep(sConf);
  });

  function confirmAttend(asist) {
    if (!found) return;
    const isYes = asist === 'si';
    const rec = { id:Date.now(), nombre:found.name, companions:found.companions||0,
                  asistencia:asist, estado:isYes?'confirmado':'rechazado',
                  fecha_confirmacion:new Date().toISOString() };
    saveGuest(rec);
    showStep(sok);
    document.getElementById('rsvpOkTitle').textContent = isYes ? '¡Gracias por confirmar!' : 'Gracias por avisarnos';
    document.getElementById('rsvpOkMsg').textContent = isYes
      ? `Te esperamos con todo el amor, ${found.name}.`
      : `${found.name}, lamentamos que no puedas estar — tus buenos deseos nos alegran.`;
    const qrEl   = document.getElementById('rsvpQR');
    const qrNote = document.getElementById('rsvpQRNote');
    if (isYes) {
      qrEl.innerHTML=''; qrEl.appendChild(makeQR(`EXCL-${rec.id}-${found.name}`));
      if(qrNote) qrNote.style.display='';
      spawnConfetti();
    } else {
      qrEl.style.display='none';
      if(qrNote) qrNote.style.display='none';
    }
    toast('✓ Respuesta enviada correctamente');
  }

  document.getElementById('rsvpBtnYes').addEventListener('click', () => confirmAttend('si'));
  document.getElementById('rsvpBtnNo').addEventListener('click',  () => confirmAttend('no'));

  document.getElementById('rsvpReset').addEventListener('click', function() {
    found = null;
    document.getElementById('rNombre').value='';
    const err=document.getElementById('errNombre'); if(err) err.textContent='';
    const qrEl=document.getElementById('rsvpQR'); if(qrEl){qrEl.innerHTML='';qrEl.style.display='';}
    const qrNote=document.getElementById('rsvpQRNote'); if(qrNote) qrNote.style.display='';
    showStep(s1);
  });

  const nEl = document.getElementById('rNombre');
  if (nEl) {
    nEl.addEventListener('blur', function() {
      this.value = this.value.replace(/\s+/g,' ').trim()
        .replace(/\S+/g, w => w[0].toUpperCase()+w.slice(1).toLowerCase());
    });
    nEl.addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();document.getElementById('rsvpVerify').click();} });
  }
})();

(function initMusic() {
  var music;
  try { music = JSON.parse(localStorage.getItem('boda_musica')) || {}; } catch(e) { music = {}; }
  if (!music.localFile && !music.url && !music.savedFile)
    music = { localFile: 'Christina Perri - A Thousand Years.mp3', title: 'A Thousand Years — Christina Perri' };

  function openAudioDB(cb) {
    var req = indexedDB.open('bodaAudio', 1);
    req.onupgradeneeded = function(e) { e.target.result.createObjectStore('tracks', { keyPath: 'id' }); };
    req.onsuccess = function(e) { cb(null, e.target.result); };
    req.onerror   = function()  { cb(true); };
  }

  if (music.localFile && music.localFile.trim()) {
    startPlayer('music/' + music.localFile.trim(), music.title || music.localFile.replace(/\.[^.]+$/, ''));
    return;
  }
  openAudioDB(function(err, db) {
    if (err) { if (music.url) startPlayer(null, null); return; }
    var tx = db.transaction('tracks','readonly');
    var req = tx.objectStore('tracks').get('main');
    req.onsuccess = function(e) {
      var rec = e.target.result;
      if (rec && rec.data) {
        var blob = new Blob([rec.data], {type: rec.type||'audio/mpeg'});
        startPlayer(URL.createObjectURL(blob), rec.title||music.title||'Música de la boda');
      } else if (music.url) { startPlayer(null, null); }
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
    function setPlaying(v) { playing=v; if(playIc) playIc.className=v?'fa-solid fa-pause':'fa-solid fa-play'; if(eqEl) eqEl.classList.toggle('eq-play',v&&!muted); }
    function setMuted(v) { muted=v; if(volIc) volIc.className=v?'fa-solid fa-volume-xmark':'fa-solid fa-volume-high'; if(eqEl) eqEl.classList.toggle('eq-play',playing&&!v); }
    if (blobUrl) {
      audioEl = new Audio(blobUrl); audioEl.loop=true; audioEl.volume=0.75;
      audioEl.addEventListener('play', ()=>setPlaying(true));
      audioEl.addEventListener('pause',()=>setPlaying(false));
      playBtn.addEventListener('click',function(){ if(!playing){audioEl.muted=false;audioEl.play().catch(function(){});}else{audioEl.pause();} });
      volBtn.addEventListener('click',function(){ audioEl.muted=!audioEl.muted; setMuted(audioEl.muted); });
      audioEl.play().catch(function(){
        audioEl.muted=true;
        audioEl.play().then(function(){
          function unmute(){audioEl.muted=false;audioEl.volume=0.75;}
          document.addEventListener('click',unmute,{once:true,passive:true});
          document.addEventListener('touchstart',unmute,{once:true,passive:true});
        }).catch(function(){
          audioEl.muted=false;
          function go(){audioEl.play().catch(function(){});}
          document.addEventListener('click',go,{once:true});
          document.addEventListener('touchstart',go,{once:true});
        });
      });
    } else if (music.url) {
      audioEl = new Audio(music.url); audioEl.loop=true;
      audioEl.addEventListener('play',()=>setPlaying(true));
      audioEl.addEventListener('pause',()=>setPlaying(false));
      playBtn.addEventListener('click',function(){ if(!playing){audioEl.play().catch(function(){});}else{audioEl.pause();} });
    }
    if (closeBtn) closeBtn.addEventListener('click',function(){ if(audioEl)audioEl.pause(); player.classList.remove('mp-on'); });
  }
})();
