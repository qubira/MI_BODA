'use strict';

/* ===== CONSTANTS ===== */
const ADMIN_USER    = 'admin';
const ADMIN_PASS    = 'boda2026';
const DB_KEY        = 'boda_rsvp_guests';
const CRONO_KEY     = 'boda_cronograma';
const TOTAL_INVITED  = 120;
const WEDDING_KEY    = 'boda_wedding_config';
const MUSIC_KEY      = 'boda_musica';
const VENUE_KEY      = 'boda_ubicacion';

/* ===== WEDDING CONFIG ===== */
function getWeddingConfig() {
  try { return JSON.parse(localStorage.getItem(WEDDING_KEY))||{}; } catch(e){ return {}; }
}
function setWeddingConfig(cfg) { localStorage.setItem(WEDDING_KEY, JSON.stringify(cfg)); }
function getWeddingDate() {
  const cfg = getWeddingConfig();
  if (cfg.date && cfg.time) {
    const d = new Date(`${cfg.date}T${cfg.time}:00`);
    if (!isNaN(d)) return d;
  }
  return new Date('2027-02-14T17:00:00');
}
function updateSidebarDate() {
  const d   = getWeddingDate();
  const day = String(d.getDate()).padStart(2,'0');
  const mon = String(d.getMonth()+1).padStart(2,'0');
  const yr  = d.getFullYear();
  const el  = document.getElementById('sidebarWeddingDate');
  if (el) el.textContent = `${day} · ${mon} · ${yr}`;
}

function getMusic() { try { return JSON.parse(localStorage.getItem(MUSIC_KEY))||{}; } catch(e){ return {}; } }
function setMusic(m) { localStorage.setItem(MUSIC_KEY, JSON.stringify(m)); }
function getVenue() { try { return JSON.parse(localStorage.getItem(VENUE_KEY))||{}; } catch(e){ return {}; } }
function setVenue(v) { localStorage.setItem(VENUE_KEY, JSON.stringify(v)); }

/* ===== INDEXEDDB — AUDIO FILE ===== */
const AUDIO_IDB = 'bodaAudio';
const AUDIO_STORE = 'tracks';

function openAudioDB(cb) {
  const req = indexedDB.open(AUDIO_IDB, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
  req.onsuccess = e => cb(null, e.target.result);
  req.onerror   = e => cb(e.target.error);
}
function saveAudioFile(file, title, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    openAudioDB((err, db) => {
      if (err) return cb(err);
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      tx.objectStore(AUDIO_STORE).put({
        id: 'main', data: e.target.result,
        type: file.type, name: file.name,
        title: title || file.name.replace(/\.[^.]+$/, '')
      });
      tx.oncomplete = () => cb(null);
      tx.onerror    = ev => cb(ev.target.error);
    });
  };
  reader.onerror = () => cb(new Error('Error leyendo archivo'));
  reader.readAsArrayBuffer(file);
}
function deleteAudioFile(cb) {
  openAudioDB((err, db) => {
    if (err) return cb && cb();
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).delete('main');
    tx.oncomplete = () => cb && cb();
  });
}
function getAudioFileMeta(cb) {
  openAudioDB((err, db) => {
    if (err) return cb(null);
    const tx  = db.transaction(AUDIO_STORE, 'readonly');
    const req = tx.objectStore(AUDIO_STORE).get('main');
    req.onsuccess = e => {
      const r = e.target.result;
      cb(r ? { name: r.name, title: r.title } : null);
    };
    req.onerror = () => cb(null);
  });
}

function updateAdminNames() {
  const cfg   = getWeddingConfig();
  const bride = cfg.bride || 'Sofía';
  const groom = cfg.groom || 'Alejandro';
  const bi    = bride.trim().charAt(0).toUpperCase();
  const gi    = groom.trim().charAt(0).toUpperCase();
  const el    = document.getElementById('sidebarBrandText');
  if (el) el.innerHTML = `${bi} <span>&</span> ${gi}`;
}

function updateLoginDisplay() {
  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                    'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const cfg   = getWeddingConfig();
  const bride = cfg.bride || 'Sofía';
  const groom = cfg.groom || 'Alejandro';

  // Nombres en la imagen del login
  const elBride = document.getElementById('loginImgBride');
  const elGroom = document.getElementById('loginImgGroom');
  if (elBride) elBride.textContent = bride;
  if (elGroom) elGroom.textContent = groom;

  // Subtítulo del panel derecho
  const elSub = document.getElementById('loginSub');
  if (elSub) {
    const d   = getWeddingDate();
    const yr  = d.getFullYear();
    elSub.innerHTML = `${bride} <span>&amp;</span> ${groom} · ${yr}`;
  }

  // Fecha en la imagen del login
  const d   = getWeddingDate();
  const elDay   = document.getElementById('loginDateDay');
  const elMonth = document.getElementById('loginDateMonth');
  const elYear  = document.getElementById('loginDateYear');
  if (elDay)   elDay.textContent   = d.getDate();
  if (elMonth) elMonth.textContent = MESES_ES[d.getMonth()];
  if (elYear)  elYear.textContent  = d.getFullYear();
}

/* ===== CHART REGISTRY ===== */
const chartRegistry = {};
function destroyChart(id) {
  if (chartRegistry[id]) { try { chartRegistry[id].destroy(); } catch(e) {} delete chartRegistry[id]; }
}
function registerChartPlugins() {
  try { if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels); } catch(e) {}
}

/* ===== HELPERS ===== */
function uid()      { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function todayStr() { return new Date().toISOString().slice(0,10); }
function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}); } catch { return '—'; } }
function estadoLabel(s) { return {confirmado:'Confirmado',pendiente:'Pendiente',rechazado:'No asiste'}[s]||s||'—'; }
function grupoLabel(g)  { return {familia:'Familia',amigos:'Amigos',trabajo:'Trabajo',pareja:'Pareja',otro:'Otro'}[g]||g||'Otro'; }
function menuLabel(m)   { return {carne:'🥩 Res',pollo:'🍗 Pollo',pescado:'🐟 Pescado',vegetariano:'🥗 Vegetariano'}[m]||'—'; }

/* ===== DATA ACCESS ===== */
function getGuests() { try { return JSON.parse(localStorage.getItem(DB_KEY))||[]; } catch { return []; } }
function setGuests(a){ localStorage.setItem(DB_KEY, JSON.stringify(a)); }
function addGuest(g)    { const a=getGuests(); a.push(g); setGuests(a); }
function updateGuest(g) { setGuests(getGuests().map(x => x.id===g.id ? g : x)); }
function deleteGuest(id){ setGuests(getGuests().filter(x => x.id!==id)); }

function getCrono() {
  try {
    const d = JSON.parse(localStorage.getItem(CRONO_KEY));
    if (d && d.length) return d;
  } catch(e) {}
  const def = defaultCronograma();
  setCrono(def); // persist defaults so index.html can read them
  return def;
}
function setCrono(a){ localStorage.setItem(CRONO_KEY, JSON.stringify(a)); }

/* ===== SEED DATA CHECK ===== */
function checkAndSeed() {
  const g = getGuests();
  if (!g.length || !Object.prototype.hasOwnProperty.call(g[0],'apellido')) seedDemoData();
}

function calcStats(guests) {
  const confirmed  = guests.filter(g=>g.estado==='confirmado');
  const rejected   = guests.filter(g=>g.estado==='rechazado');
  const pending    = guests.filter(g=>g.estado==='pendiente');
  const totalPersons = confirmed.reduce((s,g)=>s+1+(parseInt(g.acompanantes)||0),0);
  const pct = guests.length ? Math.round((confirmed.length+rejected.length)/guests.length*100):0;
  return {total:guests.length,confirmed:confirmed.length,rejected:rejected.length,pending:pending.length,totalPersons,pct};
}

/* ===== DEMO DATA ===== */
function seedDemoData() {
  setGuests([
    {id:uid(),nombre:'María',    apellido:'García',   correo:'maria.garcia@mail.com',  telefono:'555-1001',acompanantes:2,estado:'confirmado',grupo:'familia',familia:'Familia García',    mesa:1,menu:'carne',       restricciones:'',           mensaje:'¡Muy emocionados!',       notas:'Mesa principal',fecha:daysAgo(5)},
    {id:uid(),nombre:'Carlos',   apellido:'García',   correo:'carlos.garcia@mail.com', telefono:'555-1002',acompanantes:1,estado:'confirmado',grupo:'familia',familia:'Familia García',    mesa:1,menu:'pollo',       restricciones:'',           mensaje:'Con mucho cariño',        notas:'',           fecha:daysAgo(4)},
    {id:uid(),nombre:'Ana',      apellido:'López',    correo:'ana.lopez@mail.com',     telefono:'555-1003',acompanantes:3,estado:'confirmado',grupo:'familia',familia:'Familia López',     mesa:2,menu:'pescado',     restricciones:'Sin gluten', mensaje:'',                        notas:'Alergia grave',fecha:daysAgo(6)},
    {id:uid(),nombre:'Pedro',    apellido:'López',    correo:'pedro.lopez@mail.com',   telefono:'555-1004',acompanantes:1,estado:'pendiente', grupo:'familia',familia:'Familia López',     mesa:2,menu:'',            restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(2)},
    {id:uid(),nombre:'Sofía',    apellido:'Martínez', correo:'sofia.m@mail.com',       telefono:'555-1005',acompanantes:0,estado:'confirmado',grupo:'amigos', familia:'Amigos del colegio',mesa:3,menu:'vegetariano', restricciones:'Vegetariana',mensaje:'¡No me lo perdería!',    notas:'',           fecha:daysAgo(7)},
    {id:uid(),nombre:'Diego',    apellido:'Martínez', correo:'diego.m@mail.com',       telefono:'555-1006',acompanantes:1,estado:'confirmado',grupo:'amigos', familia:'Amigos del colegio',mesa:3,menu:'carne',       restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(3)},
    {id:uid(),nombre:'Valentina',apellido:'Torres',   correo:'vale.t@mail.com',        telefono:'555-1007',acompanantes:2,estado:'confirmado',grupo:'amigos', familia:'Amigos del colegio',mesa:3,menu:'pollo',       restricciones:'',           mensaje:'Llevaré el brindis',     notas:'',           fecha:daysAgo(8)},
    {id:uid(),nombre:'Roberto',  apellido:'Hernández',correo:'roberto.h@mail.com',     telefono:'555-1008',acompanantes:0,estado:'rechazado', grupo:'trabajo',familia:'Trabajo Sofía',     mesa:0,menu:'',            restricciones:'',           mensaje:'Lo siento, no podré ir', notas:'Viaje',      fecha:daysAgo(1)},
    {id:uid(),nombre:'Laura',    apellido:'Hernández',correo:'laura.h@mail.com',       telefono:'555-1009',acompanantes:1,estado:'confirmado',grupo:'trabajo',familia:'Trabajo Sofía',     mesa:4,menu:'carne',       restricciones:'',           mensaje:'Felicidades',             notas:'',           fecha:daysAgo(9)},
    {id:uid(),nombre:'Miguel',   apellido:'Sánchez',  correo:'miguel.s@mail.com',      telefono:'555-1010',acompanantes:1,estado:'pendiente', grupo:'trabajo',familia:'Trabajo Sofía',     mesa:0,menu:'',            restricciones:'',           mensaje:'',                        notas:'Pendiente',  fecha:daysAgo(0)},
    {id:uid(),nombre:'Elena',    apellido:'Ramírez',  correo:'elena.r@mail.com',       telefono:'555-1011',acompanantes:2,estado:'confirmado',grupo:'familia',familia:'Familia Ramírez',   mesa:2,menu:'pollo',       restricciones:'',           mensaje:'¡Qué alegría!',          notas:'',           fecha:daysAgo(10)},
    {id:uid(),nombre:'Jorge',    apellido:'Jiménez',  correo:'jorge.j@mail.com',       telefono:'555-1012',acompanantes:0,estado:'confirmado',grupo:'amigos', familia:'Amigos universidad',mesa:4,menu:'pescado',     restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(11)},
    {id:uid(),nombre:'Patricia', apellido:'Flores',   correo:'paty.f@mail.com',        telefono:'555-1013',acompanantes:1,estado:'confirmado',grupo:'amigos', familia:'Amigos universidad',mesa:4,menu:'carne',       restricciones:'',           mensaje:'Cuento los días',        notas:'',           fecha:daysAgo(12)},
    {id:uid(),nombre:'Fernando', apellido:'Morales',  correo:'fer.m@mail.com',         telefono:'555-1014',acompanantes:3,estado:'confirmado',grupo:'familia',familia:'Familia Morales',   mesa:5,menu:'carne',       restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(13)},
    {id:uid(),nombre:'Isabela',  apellido:'Morales',  correo:'isa.m@mail.com',         telefono:'555-1015',acompanantes:0,estado:'pendiente', grupo:'familia',familia:'Familia Morales',   mesa:0,menu:'',            restricciones:'Sin lactosa',mensaje:'',                        notas:'',           fecha:daysAgo(2)},
    {id:uid(),nombre:'Andrés',   apellido:'Cruz',     correo:'andres.c@mail.com',      telefono:'555-1016',acompanantes:1,estado:'rechazado', grupo:'pareja', familia:'',                   mesa:0,menu:'',            restricciones:'',           mensaje:'Con pena, no podemos',   notas:'',           fecha:daysAgo(3)},
    {id:uid(),nombre:'Camila',   apellido:'Vega',     correo:'camila.v@mail.com',      telefono:'555-1017',acompanantes:2,estado:'confirmado',grupo:'amigos', familia:'Amigos del barrio',  mesa:5,menu:'vegetariano', restricciones:'Vegana',     mensaje:'Con amor',               notas:'Menú esp.',  fecha:daysAgo(14)},
    {id:uid(),nombre:'Ricardo',  apellido:'Guzmán',   correo:'ricardo.g@mail.com',     telefono:'555-1018',acompanantes:1,estado:'confirmado',grupo:'trabajo',familia:'Trabajo Alejandro',  mesa:5,menu:'carne',       restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(15)},
    {id:uid(),nombre:'Daniela',  apellido:'Reyes',    correo:'dani.r@mail.com',        telefono:'555-1019',acompanantes:0,estado:'pendiente', grupo:'amigos', familia:'Amigos del colegio', mesa:0,menu:'',            restricciones:'',           mensaje:'',                        notas:'',           fecha:daysAgo(1)},
    {id:uid(),nombre:'Manuel',   apellido:'Ortega',   correo:'manuel.o@mail.com',      telefono:'555-1020',acompanantes:2,estado:'confirmado',grupo:'familia',familia:'Familia Ortega',     mesa:1,menu:'carne',       restricciones:'',           mensaje:'Dios los bendiga',       notas:'',           fecha:daysAgo(16)},
  ]);
}

/* ===== DEFAULT CRONOGRAMA ===== */
function defaultCronograma() {
  return [
    {id:uid(),hora:'11:00',icon:'💐',nombre:'Llegada de invitados',        lugar:'Jardín principal',        responsable:'Coordinadora',    color:'#C9A96E',notas:'Bienvenida con champán y jazz en vivo'},
    {id:uid(),hora:'12:00',icon:'💍',nombre:'Ceremonia civil',             lugar:'Casa Hacienda Mamacona',  responsable:'Juez de Registro', color:'#E91E63',notas:'Duración aprox. 40 minutos'},
    {id:uid(),hora:'13:00',icon:'📸',nombre:'Sesión de fotos',             lugar:'Jardín de las rosas',     responsable:'Fotógrafo',       color:'#9C27B0',notas:'Fotos familiares y con invitados'},
    {id:uid(),hora:'14:00',icon:'🍽️',nombre:'Cocktail & aperitivos',       lugar:'Terraza principal',       responsable:'Chef catering',   color:'#FF9800',notas:'Bebidas y canapés de bienvenida'},
    {id:uid(),hora:'15:30',icon:'🥂',nombre:'Recepción & banquete',        lugar:'Salón Imperial',          responsable:'Maître',          color:'#4CAF50',notas:'5 tiempos. Música suave de fondo'},
    {id:uid(),hora:'17:00',icon:'🎂',nombre:'Corte del pastel',            lugar:'Salón Imperial',          responsable:'Organizadora',    color:'#F44336',notas:'Brindis con champán'},
    {id:uid(),hora:'17:30',icon:'💃',nombre:'Primer baile de los novios',  lugar:'Pista central',           responsable:'DJ / Banda',      color:'#3F51B5',notas:'"Perfect" - Ed Sheeran'},
    {id:uid(),hora:'18:00',icon:'🎵',nombre:'Fiesta & baile libre',        lugar:'Pista central',           responsable:'DJ',              color:'#009688',notas:'Playlist especial de los novios'},
    {id:uid(),hora:'21:00',icon:'🎆',nombre:'Show de fuegos artificiales', lugar:'Jardín posterior',        responsable:'Pirotecnia',      color:'#FF5722',notas:'8 minutos de espectáculo'},
    {id:uid(),hora:'23:00',icon:'🌙',nombre:'Cierre & despedida de novios',lugar:'Entrada principal',       responsable:'Coordinadora',    color:'#607D8B',notas:'Pétalos y mariposas en la salida'},
  ];
}

/* ===== THEME ===== */
let darkMode = localStorage.getItem('admin_dark') === '1';
function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  const icon = document.getElementById('adminThemeIcon');
  if (icon) icon.className = darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/* ===== TOAST ===== */
function toast(msg, dur=2800) {
  const el = document.getElementById('adminToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

/* ===== CHARTS ===== */
const CC = {gold:'#C9A96E',green:'#4CAF50',amber:'#FF9800',red:'#F44336',blue:'#2196F3',purple:'#9C27B0',teal:'#009688',pink:'#E91E63'};
function chartText() { return darkMode ? '#c8bfa8' : '#5a4f3f'; }
function chartGrid() { return darkMode ? 'rgba(201,169,110,.09)' : 'rgba(0,0,0,.06)'; }
function chartBg()   { return darkMode ? '#1a2035' : '#ffffff'; }

function makeDonut(id, labels, data, colors) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx || typeof Chart==='undefined') return;
  try {
    chartRegistry[id] = new Chart(ctx, {
      type:'doughnut',
      data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:3,borderColor:chartBg(),hoverBorderWidth:4}]},
      options:{
        responsive:true,maintainAspectRatio:false,cutout:'64%',
        plugins:{
          legend:{position:'bottom',labels:{color:chartText(),padding:14,font:{family:"'Montserrat',sans-serif",size:11},boxWidth:12}},
          datalabels:{
            color:'#fff',anchor:'center',align:'center',clamp:true,
            font:{family:"'Montserrat',sans-serif",weight:'700',size:11},
            display:ctx=>ctx.dataset.data[ctx.dataIndex]>0,
            formatter:(v,ctx)=>{const sum=ctx.dataset.data.reduce((a,b)=>a+b,0);return sum>0&&v>0?`${v}\n${Math.round(v/sum*100)}%`:'';},
          },
        },
      },
    });
  } catch(e) {}
}

function makeBar(id, labels, data, colors, opts={}) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx || typeof Chart==='undefined') return;
  try {
    chartRegistry[id] = new Chart(ctx, {
      type:'bar',
      data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:6,borderSkipped:false}]},
      options:{
        indexAxis:opts.horizontal?'y':'x',
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          datalabels:{
            color:darkMode?'#c8bfa8':'#5a4f3f',anchor:'end',align:'top',clamp:true,
            font:{family:"'Montserrat',sans-serif",weight:'700',size:11},
            display:ctx=>ctx.dataset.data[ctx.dataIndex]>0,
            formatter:v=>v>0?v:'',
          },
        },
        scales:{
          x:{grid:{color:chartGrid()},ticks:{color:chartText(),font:{size:10}}},
          y:{grid:{color:chartGrid()},ticks:{color:chartText(),font:{size:10}},beginAtZero:true},
        },
      },
    });
  } catch(e) {}
}

function makeLine(id, labels, data) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx || typeof Chart==='undefined') return;
  try {
    chartRegistry[id] = new Chart(ctx, {
      type:'line',
      data:{labels,datasets:[{label:'Respuestas',data,borderColor:CC.gold,backgroundColor:'rgba(201,169,110,.12)',fill:true,tension:.35,pointRadius:4,pointBackgroundColor:CC.gold}]},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{labels:{color:chartText()}},
          datalabels:{color:darkMode?'#c8bfa8':'#5a4f3f',anchor:'end',align:'top',clamp:true,font:{family:"'Montserrat',sans-serif",weight:'700',size:11},display:ctx=>ctx.dataset.data[ctx.dataIndex]>0,formatter:v=>v>0?v:''},
        },
        scales:{
          x:{grid:{color:chartGrid()},ticks:{color:chartText(),font:{size:10}}},
          y:{grid:{color:chartGrid()},ticks:{color:chartText()},beginAtZero:true},
        },
      },
    });
  } catch(e) {}
}

/* ===== NAVIGATION ===== */
const VIEW_LABELS = {
  guests:     ['Lista de Invitados',   'Gestiona y organiza tus invitados'],
  cronograma: ['Cronograma del Día',   'Itinerario completo de la boda'],
  stats:      ['Estadísticas',         'Análisis visual de confirmaciones'],
  export:     ['Exportar Datos',       'Descarga listas y reportes'],
  config:     ['Configuración',        'Nombres, música y vestimenta'],
};
let currentView = '';
let configCDTimer = null;

function switchView(view) {
  if (configCDTimer) { clearInterval(configCDTimer); configCDTimer = null; }
  currentView = view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.sidebar__link[data-view]').forEach(l=>l.classList.remove('active'));
  const vEl = document.getElementById('view-'+view);
  const lEl = document.querySelector(`.sidebar__link[data-view="${view}"]`);
  if (vEl) vEl.classList.add('active');
  if (lEl) lEl.classList.add('active');
  const [title,sub] = VIEW_LABELS[view]||['Panel',''];
  setText('viewTitle', title);
  setText('viewSubtitle', sub);
  renderView(view);
}

function renderView(v) {
  if      (v==='guests')     refreshGuests();
  else if (v==='cronograma') refreshCrono();
  else if (v==='stats')      refreshStats();
  else if (v==='config')     refreshConfig();
}

/* ===== GUESTS ===== */
let guestFilter='all', guestSort='nombre', guestGroupFilter='all', guestSortDir=1;

function refreshGuests() { renderTable(); }

function renderTable() {
  const search = (document.getElementById('guestSearch')?.value||'').toLowerCase();
  let guests = getGuests();
  if (guestFilter!=='all')      guests = guests.filter(g=>g.estado===guestFilter);
  if (guestGroupFilter!=='all') guests = guests.filter(g=>g.grupo===guestGroupFilter);
  if (search) guests = guests.filter(g=>JSON.stringify(g).toLowerCase().includes(search));
  guests.sort((a,b)=>{
    const va=a[guestSort]??'', vb=b[guestSort]??'';
    if (!isNaN(va)&&!isNaN(vb)) return (Number(va)-Number(vb))*guestSortDir;
    return String(va).localeCompare(String(vb),'es')*guestSortDir;
  });
  const tbody=document.getElementById('guestsBody'), empty=document.getElementById('tableEmpty'), footer=document.getElementById('tableFooter');
  if (!tbody) return;
  if (!guests.length) { tbody.innerHTML=''; empty?.classList.remove('hidden'); if(footer) footer.textContent=''; return; }
  empty?.classList.add('hidden');
  const totalP = guests.reduce((s,g)=>s+1+(parseInt(g.acompanantes)||0),0);
  tbody.innerHTML = guests.map((g,i)=>{
    const total=1+(parseInt(g.acompanantes)||0);
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${esc(g.nombre)}</strong></td>
      <td>${esc(g.apellido||'—')}</td>
      <td>${esc(g.correo||'—')}</td>
      <td>${esc(g.telefono||'—')}</td>
      <td style="text-align:center">${parseInt(g.acompanantes)||0}</td>
      <td style="text-align:center"><strong>${total}</strong></td>
      <td><span class="status-badge status-badge--${g.estado}">${estadoLabel(g.estado)}</span></td>
      <td><span class="grupo-badge grupo--${g.grupo||'otro'}">${grupoLabel(g.grupo)}</span></td>
      <td>${esc(g.familia||'—')}</td>
      <td>${menuLabel(g.menu)}</td>
      <td>${fmtDate(g.fecha)}</td>
      <td><div class="action-btns">
        <button class="action-btn action-btn--edit" onclick="openGuestModal('${g.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn action-btn--del"  onclick="confirmDelete('${g.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');
  if (footer) footer.textContent = `${guests.length} invitado(s) · ${totalP} personas en total`;
}

function openGuestModal(id) {
  const modal = document.getElementById('guestModal');
  if (!modal) return;
  const g = id ? getGuests().find(x=>x.id===id) : null;
  setText('modalTitle', g?'Editar Invitado':'Agregar Invitado');
  document.getElementById('m-id').value          = g?.id||'';
  document.getElementById('m-nombre').value      = g?.nombre||'';
  document.getElementById('m-apellido').value    = g?.apellido||'';
  document.getElementById('m-correo').value      = g?.correo||'';
  document.getElementById('m-telefono').value    = g?.telefono||'';
  document.getElementById('m-acompanantes').value= g?.acompanantes??0;
  document.getElementById('m-estado').value      = g?.estado||'pendiente';
  document.getElementById('m-menu').value        = g?.menu||'';
  document.getElementById('m-restricciones').value=g?.restricciones||'';
  document.getElementById('m-grupo').value       = g?.grupo||'familia';
  document.getElementById('m-familia').value     = g?.familia||'';
  document.getElementById('m-mensaje').value     = g?.mensaje||'';
  document.getElementById('m-notas').value       = g?.notas||'';
  modal.classList.remove('hidden');
}
window.openGuestModal = openGuestModal;

window.confirmDelete = function(id) {
  if (!confirm('¿Eliminar este invitado permanentemente?')) return;
  deleteGuest(id);
  toast('🗑️ Invitado eliminado');
  renderTable();
};

/* ===== CRONOGRAMA ===== */
function refreshCrono() {
  const crono = getCrono().sort((a,b)=>a.hora.localeCompare(b.hora));
  const timeline = document.getElementById('cronoTimeline');
  if (!timeline) return;
  timeline.innerHTML = crono.length ? crono.map(ev=>`
    <div class="crono-item">
      <div class="crono-item-header">
        <div class="crono-item-main">
          <div class="crono-icon-hora">
            <span class="crono-icon">${ev.icon||'📌'}</span>
            <span class="crono-hora" style="background:${ev.color||'#C9A96E'}">${ev.hora}</span>
          </div>
          <div class="crono-name">${esc(ev.nombre)}</div>
          <div class="crono-meta">
            ${ev.lugar?`<span class="crono-meta-item"><i class="fa-solid fa-location-dot"></i> ${esc(ev.lugar)}</span>`:''}
            ${ev.responsable?`<span class="crono-meta-item"><i class="fa-solid fa-user"></i> ${esc(ev.responsable)}</span>`:''}
          </div>
          ${ev.notas?`<div class="crono-notes">${esc(ev.notas)}</div>`:''}
        </div>
        <div class="crono-actions-btns">
          <button class="action-btn action-btn--edit" onclick="openEventoModal('${ev.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn action-btn--del"  onclick="deleteEvento('${ev.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('')
  : '<p style="color:var(--text-soft);padding:20px 0">Sin eventos. Agrega el primero.</p>';
}

function openEventoModal(id) {
  const modal = document.getElementById('eventoModal');
  if (!modal) return;
  const ev = id ? getCrono().find(x=>x.id===id) : null;
  setText('eventoModalTitle', ev?'Editar Evento':'Nuevo Evento');
  document.getElementById('ev-id').value          = ev?.id||'';
  document.getElementById('ev-hora').value        = ev?.hora||'';
  document.getElementById('ev-icon').value        = ev?.icon||'';
  document.getElementById('ev-nombre').value      = ev?.nombre||'';
  document.getElementById('ev-lugar').value       = ev?.lugar||'';
  document.getElementById('ev-responsable').value = ev?.responsable||'';
  document.getElementById('ev-color').value       = ev?.color||'#C9A96E';
  document.getElementById('ev-notas').value       = ev?.notas||'';
  document.querySelectorAll('.cp-dot').forEach(d=>d.classList.toggle('active',d.dataset.color===(ev?.color||'#C9A96E')));
  modal.classList.remove('hidden');
}
window.openEventoModal = openEventoModal;

window.deleteEvento = function(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  setCrono(getCrono().filter(x=>x.id!==id));
  toast('🗑️ Evento eliminado');
  refreshCrono();
};

function printCrono() {
  const crono = getCrono().sort((a,b)=>a.hora.localeCompare(b.hora));
  const w = window.open('','_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cronograma 2027</title>
  <style>body{font-family:'Segoe UI',sans-serif;margin:36px;color:#2c2417}h1{color:#C9A96E;text-align:center;margin:0}p.sub{text-align:center;color:#888;font-size:.8rem;margin:4px 0 28px}.item{display:flex;gap:14px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #e8e2d6}.hora{font-weight:700;min-width:56px;color:#fff;padding:3px 8px;border-radius:6px;font-size:.8rem;text-align:center;flex-shrink:0;margin-top:2px}.icon{font-size:1.1rem;padding-top:2px}.info h3{margin:0 0 2px;font-size:.9rem}.info p{margin:0;font-size:.73rem;color:#666}@media print{body{margin:16px}}</style></head><body>
  <h1>💍 Cronograma de la Boda</h1><p class="sub">Sofía &amp; Alejandro · 14 de Febrero de 2027 · Casa Hacienda Mamacona</p>
  ${crono.map(ev=>`<div class="item"><span class="hora" style="background:${ev.color||'#C9A96E'}">${ev.hora}</span><span class="icon">${ev.icon||'📌'}</span><div class="info"><h3>${ev.nombre}</h3>${ev.lugar?`<p>📍 ${ev.lugar}</p>`:''} ${ev.responsable?`<p>👤 ${ev.responsable}</p>`:''} ${ev.notas?`<p><em>${ev.notas}</em></p>`:''}</div></div>`).join('')}
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),600);
}

/* ===== STATS ===== */
function refreshStats() {
  const guests = getGuests();
  const s = calcStats(guests);
  makeDonut('pieChart',['Confirmados','Pendientes','No asisten'],[s.confirmed,s.pending,s.rejected],[CC.green,CC.amber,CC.red]);
  const gK=['familia','amigos','trabajo','pareja','otro'];
  makeBar('barGroupChart',['Familia','Amigos','Trabajo','Pareja','Otro'],gK.map(g=>guests.filter(x=>x.grupo===g).length),[CC.pink,CC.blue,CC.green,CC.purple,CC.amber]);
  const mK=['carne','pollo','pescado','vegetariano',''];
  makeBar('barMenuChart',['Res','Pollo','Pescado','Vegetariano','Sin elección'],mK.map(k=>guests.filter(g=>(g.menu||'')===k).length),[CC.red,CC.amber,CC.blue,CC.green,'#aaa']);
  const acMap={};
  guests.forEach(g=>{const n=parseInt(g.acompanantes)||0;acMap[n]=(acMap[n]||0)+1;});
  const acK=Object.keys(acMap).sort((a,b)=>Number(a)-Number(b));
  makeBar('barAccompChart',acK.map(k=>`${k} acomp.`),acK.map(k=>acMap[k]),acK.map(()=>CC.gold));
  const dayMap={};
  guests.filter(g=>g.estado!=='pendiente').forEach(g=>{const d=g.fecha?g.fecha.slice(0,10):'?';dayMap[d]=(dayMap[d]||0)+1;});
  const days=Object.keys(dayMap).sort();
  makeLine('lineChart',days,days.map(d=>dayMap[d]));
}

/* ===== EXPORT ===== */
function buildXLSXBlob(cfg) {
  const { title, subtitle, headers, rows, statusCol, menuCol, groupCol, totalsRow, brideRaw, groomRaw, genDate, colCount } = cfg;

  // ── Utilidades binarias ─────────────────────────────────────────────────────
  const _enc = new TextEncoder();
  function _u8(s)  { return _enc.encode(s); }
  function _u16(n) { return new Uint8Array([n&255,(n>>8)&255]); }
  function _u32(n) { return new Uint8Array([n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255]); }
  function _cat()  { const A=Array.from(arguments),len=A.reduce((s,a)=>s+a.length,0),r=new Uint8Array(len);let o=0;A.forEach(a=>{r.set(a,o);o+=a.length;});return r; }

  // CRC-32
  const _CRT=new Uint32Array(256);
  for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?0xEDB88320^(c>>>1):c>>>1;_CRT[i]=c>>>0;}
  function _crc(b){let c=~0;for(let i=0;i<b.length;i++)c=(c>>>8)^_CRT[(c^b[i])&255];return(~c)>>>0;}

  // ZIP STORE (sin compresión)
  function _makeZip(files) {
    const ents=files.map(([n,d])=>{const nm=_u8(n),data=typeof d==='string'?_u8(d):d,crcV=_crc(data),sz=data.length;return{nm,data,crcV,sz};});
    let off=0; const lh=[],cd=[];
    ents.forEach(e=>{
      const l=_cat(new Uint8Array([0x50,0x4B,3,4]),_u16(20),_u16(0),_u16(0),_u16(0),_u16(0),_u32(e.crcV),_u32(e.sz),_u32(e.sz),_u16(e.nm.length),_u16(0),e.nm,e.data);
      cd.push(_cat(new Uint8Array([0x50,0x4B,1,2]),_u16(20),_u16(20),_u16(0),_u16(0),_u16(0),_u16(0),_u32(e.crcV),_u32(e.sz),_u32(e.sz),_u16(e.nm.length),_u16(0),_u16(0),_u16(0),_u16(0),_u32(0),_u32(off),e.nm));
      off+=l.length; lh.push(l);
    });
    const cdOff=off,cdSz=cd.reduce((s,p)=>s+p.length,0);
    return _cat(...lh,...cd,_cat(new Uint8Array([0x50,0x4B,5,6]),_u16(0),_u16(0),_u16(ents.length),_u16(ents.length),_u32(cdSz),_u32(cdOff),_u16(0)));
  }

  // ── XML helpers ─────────────────────────────────────────────────────────────
  function xe(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function cl(n){let s='';n++;while(n>0){const r=n%26||26;s=String.fromCharCode(64+r)+s;n=Math.floor((n-r)/26);}return s;}

  // ── Shared strings ─────────────────────────────────────────────────────────
  const ssi={},ssa=[];
  function ss(v){const k=String(v??'');if(ssi[k]===undefined){ssi[k]=ssa.length;ssa.push(k);}return ssi[k];}

  // ── Helpers de celda ───────────────────────────────────────────────────────
  function mTxt(v){const s=String(v||'');if(!s||s==='—')return'—';const l=s.toLowerCase();if(l.includes('res'))return'🥩 '+s;if(l.includes('pollo'))return'🍗 '+s;if(l.includes('pescado'))return'🐟 '+s;if(l.includes('vegetar'))return'🥗 '+s;return s;}

  // ── Construcción de filas ──────────────────────────────────────────────────
  const xRws=[],mrgs=[];
  let xRi=1;
  function pRow(cells,ht){xRws.push({r:xRi++,cells,ht});}
  function mRow(val,sid,ht){
    const r=xRi;
    pRow([{c:0,v:ss(String(val??'')),s:sid,t:'s'},...Array.from({length:colCount-1},(_,i)=>({c:i+1,v:null,s:sid,t:null}))],ht);
    mrgs.push(`${cl(0)}${r}:${cl(colCount-1)}${r}`);
  }

  mRow(`${brideRaw} & ${groomRaw}`,1,44);
  mRow(title,2,28);
  mRow(subtitle||'',3,20);
  mRow('',4,8);
  pRow(headers.map((h,i)=>({c:i,v:ss(h),s:5,t:'s'})),22);

  let lGrp=null;
  rows.forEach((row,ri)=>{
    const ev=ri%2===0;
    if(groupCol!==undefined){const gv=String(row[groupCol]??'');if(gv!==lGrp){lGrp=gv;mRow(gv,6,20);}}
    pRow(row.map((v,ci)=>{
      if(ci===statusCol){const lv=String(v||'').toLowerCase();const s=lv==='confirmado'?13:lv==='rechazado'||lv==='no asiste'?14:lv==='pendiente'?15:ev?7:8;return{c:ci,v:ss(String(v||'—')),s,t:'s'};}
      if(ci===menuCol)return{c:ci,v:ss(mTxt(v)),s:ev?7:8,t:'s'};
      if(ci===0&&groupCol===undefined)return{c:ci,v:typeof v==='number'?v:ss(String(v??'')),s:ev?9:10,t:typeof v==='number'?'n':'s'};
      if(ci===groupCol)return{c:ci,v:ss(String(v??'')),s:ev?11:12,t:'s'};
      return{c:ci,v:typeof v==='number'?v:ss(String(v??'')),s:ev?7:8,t:typeof v==='number'?'n':'s'};
    }),18);
  });
  if(totalsRow)pRow(totalsRow.map((v,ci)=>({c:ci,v:typeof v==='number'?v:ss(String(v??'')),s:16,t:typeof v==='number'?'n':'s'})),22);
  mRow('',4,8);
  mRow(`${brideRaw} & ${groomRaw} — ${genDate}`,17,18);

  // ── XMLs del XLSX ──────────────────────────────────────────────────────────
  const CT=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`;
  const RR=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const WR=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const WB=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xe(title.substring(0,31))}" sheetId="1" r:id="rId3"/></sheets></workbook>`;
  const ST=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="14"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="22"/><color rgb="FFC9A96E"/><name val="Calibri"/></font><font><sz val="14"/><color rgb="FFB89660"/><name val="Calibri"/></font><font><i/><sz val="9"/><color rgb="FF8A8A8A"/><name val="Calibri"/></font><font><b/><sz val="9"/><color rgb="FFC9A96E"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFC9A96E"/><name val="Calibri"/></font><font><sz val="10.5"/><name val="Calibri"/></font><font><b/><sz val="10.5"/><color rgb="FF1A1F3A"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF8A7A62"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FF155724"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FF721C24"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FF856404"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFC9A96E"/><name val="Calibri"/></font><font><sz val="8"/><color rgb="FF666666"/><name val="Calibri"/></font></fonts><fills count="9"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1A1F3A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFAF8F5"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD4EDDA"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8D7DA"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF3CD"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2C2417"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom><color rgb="FFE0D8CC"/></bottom><diagonal/></border><border><left/><right/><top/><bottom><color rgb="FFC9A96E"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="18"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="4" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="5" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="7" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="7" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="8" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="8" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="9" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" horizontal="center"/></xf><xf numFmtId="0" fontId="10" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" horizontal="center"/></xf><xf numFmtId="0" fontId="11" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" horizontal="center"/></xf><xf numFmtId="0" fontId="12" fillId="8" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="13" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" horizontal="center"/></xf></cellXfs></styleSheet>`;
  const SS=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${ssa.length}" uniqueCount="${ssa.length}">${ssa.map(s=>`<si><t xml:space="preserve">${xe(s)}</t></si>`).join('')}</sst>`;
  const CW=headers.map((h,i)=>{const w=i===(statusCol??-99)?14:i===(menuCol??-99)?15:i===(groupCol??-99)?18:Math.max(8,Math.min(h.length*1.4,28));return`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`;}).join('');
  const RX=xRws.map(row=>{const cx=row.cells.map(c=>{if(c.v===null||c.v===undefined)return`<c r="${cl(c.c)}${row.r}" s="${c.s}"/>`;if(c.t==='n')return`<c r="${cl(c.c)}${row.r}" s="${c.s}"><v>${c.v}</v></c>`;return`<c r="${cl(c.c)}${row.r}" s="${c.s}" t="s"><v>${c.v}</v></c>`;}).join('');return`<row r="${row.r}" ht="${row.ht}" customHeight="1">${cx}</row>`;}).join('');
  const MX=mrgs.length?`<mergeCells count="${mrgs.length}">${mrgs.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:'';
  const SH=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetFormatPr defaultRowHeight="15"/><cols>${CW}</cols><sheetData>${RX}</sheetData>${MX}</worksheet>`;

  return _makeZip([['[Content_Types].xml',CT],['_rels/.rels',RR],['xl/workbook.xml',WB],['xl/_rels/workbook.xml.rels',WR],['xl/styles.xml',ST],['xl/sharedStrings.xml',SS],['xl/worksheets/sheet1.xml',SH]]);
}

function openStyledExport(cfg) {
  const { title, subtitle, headers, rows, filename, statusCol, menuCol, groupCol, totalsRow } = cfg;
  const wCfg = getWeddingConfig();
  const brideRaw = wCfg.bride || 'Sofía';
  const groomRaw = wCfg.groom || 'Alejandro';
  const bride = esc(brideRaw);
  const groom = esc(groomRaw);
  const genDate = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const colCount = headers.length;

  // ─── XLSX nativo (.xlsx real con diseño) ─────────────────────────────────────

  const xlsxData = buildXLSXBlob({ title, subtitle, headers, rows, statusCol, menuCol, groupCol, totalsRow, brideRaw, groomRaw, genDate, colCount });
  const xlsFilename = filename.replace(/\.(csv|xml|xls)$/i, '.xlsx');
  const xlsUrl = URL.createObjectURL(new Blob([xlsxData], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

  // ─── Vista previa en navegador ─────────────────────────────────────────────
  function cellHtml(cell, ci) {
    const v = String(cell??'');
    if (ci===statusCol) {
      const lv = v.toLowerCase();
      if (lv==='confirmado') return '<span class="bdg bdg--g">✓ Confirmado</span>';
      if (lv==='rechazado'||lv==='no asiste') return '<span class="bdg bdg--r">✗ No asiste</span>';
      if (lv==='pendiente') return '<span class="bdg bdg--a">⏳ Pendiente</span>';
      return '<span class="bdg bdg--n">—</span>';
    }
    if (ci===menuCol) {
      if (!v||v==='—') return '<span class="bdg bdg--n">—</span>';
      const lv = v.toLowerCase();
      if (lv.includes('res'))     return '🥩 '+esc(v);
      if (lv.includes('pollo'))   return '🍗 '+esc(v);
      if (lv.includes('pescado')) return '🐟 '+esc(v);
      if (lv.includes('vegetar')) return '🥗 '+esc(v);
    }
    return esc(v);
  }
  let lastGrpHtml = null;
  const tbody = rows.map((row, ri) => {
    let grpHdr = '';
    if (groupCol !== undefined) {
      const gv = String(row[groupCol]??'');
      if (gv !== lastGrpHtml) { lastGrpHtml = gv; grpHdr = `<tr class="grp-hdr"><td colspan="${colCount}">${esc(gv)}</td></tr>`; }
    }
    const cells = row.map((cell, ci) => {
      const isFirst = ci===0 && groupCol===undefined;
      const isGrp   = ci===groupCol;
      return `<td${isFirst?' class="first"':isGrp?' class="grp-val"':''}>${cellHtml(cell,ci)}</td>`;
    }).join('');
    return grpHdr+`<tr class="${ri%2===0?'ev':'od'}">${cells}</tr>`;
  }).join('');

  const totHtml = totalsRow
    ? `<tr class="tf">${totalsRow.map(c=>`<td>${esc(String(c??''))}</td>`).join('')}</tr>`
    : '';
  const thCells = headers.map(h=>`<th>${esc(h)}</th>`).join('');

  const w = window.open('','_blank');
  if (!w) { toast('⚠️ Activa los popups del navegador para ver el reporte'); return; }

  w.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · ${bride} &amp; ${groom}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Montserrat',sans-serif;background:#f5f3ef;color:#2c2417;font-size:11.5px;line-height:1.5}
.hd{background:#1a1f3a;padding:30px 48px 22px;text-align:center;border-bottom:4px solid #C9A96E}
.hd-eye{font-size:.56rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(201,169,110,.5);margin-bottom:6px}
.hd-title{font-family:'Cormorant Garamond',serif;font-size:2.1rem;color:#C9A96E;font-weight:400;line-height:1.1;margin-bottom:4px}
.hd-names{font-size:.65rem;color:rgba(255,255,255,.3);letter-spacing:.14em;text-transform:uppercase}
.hd-gen{margin-top:6px;font-size:.57rem;color:rgba(255,255,255,.18);letter-spacing:.05em}
.act{background:#fff;padding:10px 48px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e8e2d6;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(0,0,0,.07)}
.act-info{font-size:.68rem;color:#9a8e7e;margin-right:auto;font-style:italic}
.btn{padding:8px 20px;border-radius:8px;font-size:.7rem;font-weight:600;font-family:'Montserrat',sans-serif;letter-spacing:.06em;border:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.btn-dl{background:#f5f3ef;border:1.5px solid #C9A96E;color:#2c2417}
.btn-pr{background:#1a1f3a;color:#C9A96E}
.wrap{padding:30px 48px 48px}
.sec-lbl{font-family:'Cormorant Garamond',serif;font-size:1.35rem;color:#1a1f3a;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid rgba(201,169,110,.25)}
.sec-lbl small{font-family:'Montserrat',sans-serif;font-size:.62rem;color:#aaa;font-weight:400;margin-left:10px;letter-spacing:.07em}
.tw{border-radius:12px;overflow:auto;box-shadow:0 2px 20px rgba(0,0,0,.07);border:1px solid rgba(201,169,110,.12)}
table{width:100%;border-collapse:collapse;background:#fff}
thead th{background:#1a1f3a;color:#C9A96E;padding:11px 14px;text-align:left;font-size:.59rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase;white-space:nowrap}
tr.ev{background:#fff}
tr.od{background:#faf8f5}
tbody tr:hover{background:#f5ede0}
td{padding:9px 14px;border-bottom:1px solid #f0ebe2;vertical-align:middle;white-space:nowrap}
td.first{font-weight:700;color:#1a1f3a}
td.grp-val{font-weight:600;color:#8a7a62;font-size:.75rem}
tr.grp-hdr td{background:#1a1f3a;color:#C9A96E;font-size:.63rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:9px 14px;border:none}
tr.tf td{background:#2c2417;color:#C9A96E;font-weight:700;font-size:.72rem;padding:10px 14px;border-top:2px solid rgba(201,169,110,.4)}
.bdg{display:inline-block;padding:2px 10px;border-radius:20px;font-size:.66rem;font-weight:600;white-space:nowrap}
.bdg--g{background:#d4edda;color:#155724}
.bdg--r{background:#f8d7da;color:#721c24}
.bdg--a{background:#fff3cd;color:#856404}
.bdg--n{background:#e9ecef;color:#6c757d}
.foot{background:#1a1f3a;text-align:center;padding:18px;font-size:.58rem;color:rgba(255,255,255,.22);letter-spacing:.1em;text-transform:uppercase;border-top:3px solid #C9A96E;margin-top:32px}
@media print{
  .act{display:none!important}
  body{background:#fff!important}
  .tw{box-shadow:none!important;border-radius:0!important}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
</style></head>
<body>
<div class="hd">
  <div class="hd-eye">Reporte de Invitados</div>
  <div class="hd-title">${esc(title)}</div>
  <div class="hd-names">${bride} &amp; ${groom}</div>
  <div class="hd-gen">Generado el ${genDate}</div>
</div>
<div class="act">
  <span class="act-info">${esc(subtitle||'')}</span>
  <a class="btn btn-dl" href="${xlsUrl}" download="${esc(xlsFilename)}">📊 Descargar XLSX</a>
  <button class="btn btn-pr" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</div>
<div class="wrap">
  <div class="sec-lbl">${esc(title)}<small>${esc(subtitle||'')}</small></div>
  <div class="tw">
    <table>
      <thead><tr>${thCells}</tr></thead>
      <tbody>${tbody}${totHtml}</tbody>
    </table>
  </div>
</div>
<div class="foot">${bride} &amp; ${groom} · Reporte de invitados</div>
</body></html>`);
  w.document.close();
}

function exportCSV() {
  const g = getGuests();
  const headers = ['#','Nombre','Apellido','Correo','Teléfono','Acomp.','Total','Estado','Grupo','Familia/Grupo','Menú','Restricciones','Mensaje','Notas','Fecha'];
  const rows = g.map((x, i) => [i+1, x.nombre, x.apellido||'', x.correo||'', x.telefono||'', x.acompanantes||0, 1+(parseInt(x.acompanantes)||0), estadoLabel(x.estado), grupoLabel(x.grupo), x.familia||'', menuLabel(x.menu), x.restricciones||'', x.mensaje||'', x.notas||'', fmtDate(x.fecha)]);
  openStyledExport({ title:'Lista Completa de Invitados', subtitle:`${g.length} invitados registrados`, headers, rows, filename:`invitados_${todayStr()}.csv`, statusCol:7, menuCol:10 });
}

function exportAcomp() {
  const g = getGuests().filter(x => x.estado === 'confirmado');
  const total = g.reduce((s, x) => s + 1 + (parseInt(x.acompanantes)||0), 0);
  const headers = ['Nombre','Apellido','Grupo','Acomp.','Total Personas'];
  const rows = g.map(x => [x.nombre, x.apellido||'', grupoLabel(x.grupo), x.acompanantes||0, 1+(parseInt(x.acompanantes)||0)]);
  openStyledExport({ title:'Lista con Acompañantes', subtitle:`${g.length} confirmados · ${total} personas en total`, headers, rows, filename:`acompanantes_${todayStr()}.csv`, totalsRow:['TOTAL CONFIRMADOS','','','',total] });
}

function exportFamilia() {
  const g = getGuests();
  const fams = [...new Set(g.map(x => x.familia || grupoLabel(x.grupo) || 'Sin clasificar'))].sort();
  const headers = ['Grupo/Familia','Nombre','Apellido','Estado','Acomp.','Total'];
  const rows = [];
  fams.forEach(f => g.filter(x => (x.familia || grupoLabel(x.grupo) || 'Sin clasificar') === f).forEach(x => rows.push([f, x.nombre, x.apellido||'', estadoLabel(x.estado), x.acompanantes||0, 1+(parseInt(x.acompanantes)||0)])));
  openStyledExport({ title:'Lista por Grupo / Familia', subtitle:`${fams.length} grupos · ${g.length} invitados`, headers, rows, filename:`grupos_${todayStr()}.csv`, statusCol:3, groupCol:0 });
}
function exportJSON() {
  const data={guests:getGuests(),cronograma:getCrono(),exportDate:new Date().toISOString()};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download=`boda_backup_${todayStr()}.json`; a.click(); URL.revokeObjectURL(a.href);
  toast('📥 Backup JSON descargado');
}
function exportPDF() {
  const g   = getGuests();
  const s   = calcStats(g);
  const cfg = getWeddingConfig();
  const bride   = esc(cfg.bride || 'Sofía');
  const groom   = esc(cfg.groom || 'Alejandro');
  const wDate   = cfg.date
    ? new Date(cfg.date+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})
    : '14 de Febrero de 2027';
  const genDate = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const confirmed = g.filter(x => x.estado==='confirmado');

  const bdg = st => st==='confirmado'
    ? '<span class="bdg bdg--g">✓ Confirmado</span>'
    : st==='rechazado'
    ? '<span class="bdg bdg--r">✗ No asiste</span>'
    : '<span class="bdg bdg--a">⏳ Pendiente</span>';

  const mc = key => confirmed.filter(x => x.menu===key).length;

  const w = window.open('','_blank');
  if (!w) { toast('⚠️ Activa los popups del navegador para generar el reporte'); return; }

  w.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Reporte · ${bride} &amp; ${groom}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Montserrat',sans-serif;background:#f5f3ef;color:#2c2417;font-size:11px;line-height:1.5}
/* ─── CABECERA ─── */
.rpt-hd{background:#1a1f3a;padding:40px 48px 32px;text-align:center;border-bottom:4px solid #C9A96E;position:relative}
.rpt-hd::before{content:'💍';position:absolute;left:48px;top:50%;transform:translateY(-50%);font-size:2rem;opacity:.25}
.rpt-eyebrow{font-size:.58rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(201,169,110,.55);margin-bottom:6px}
.rpt-names{font-family:'Cormorant Garamond',serif;font-size:2.8rem;color:#C9A96E;font-weight:400;letter-spacing:.04em;line-height:1}
.rpt-names em{font-style:italic;color:rgba(201,169,110,.6);font-size:.55em;margin:0 .35em;vertical-align:middle}
.rpt-date-badge{display:inline-block;margin-top:8px;font-size:.62rem;letter-spacing:.18em;color:rgba(255,255,255,.35);text-transform:uppercase}
.rpt-gen{margin-top:10px;font-size:.6rem;color:rgba(255,255,255,.22);letter-spacing:.05em}
/* ─── BARRA ACCIONES ─── */
.actions{background:white;padding:10px 48px;display:flex;align-items:center;gap:14px;border-bottom:1px solid #e8e2d6;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.07)}
.btn-pr{display:inline-flex;align-items:center;gap:7px;padding:8px 20px;background:linear-gradient(135deg,#C9A96E,#a87d3e);color:#1a1208;border:none;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;letter-spacing:.03em;box-shadow:0 3px 10px rgba(201,169,110,.4)}
.btn-pr:hover{background:linear-gradient(135deg,#b8934a,#9a6e30)}
.hint{font-size:.67rem;color:#bbb;font-style:italic}
/* ─── CUERPO ─── */
.rpt-body{padding:32px 48px 48px;max-width:1140px;margin:0 auto}
/* KPIs */
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:32px}
.kpi{background:white;border-radius:12px;padding:18px 12px;text-align:center;border:1px solid #e8e2d6;border-top:3px solid #C9A96E;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.kpi.g{border-top-color:#4CAF50}.kpi.a{border-top-color:#FF9800}.kpi.r{border-top-color:#F44336}.kpi.b{border-top-color:#2196F3}
.kpi b{display:block;font-size:2rem;font-family:'Cormorant Garamond',serif;font-weight:600;line-height:1;margin-bottom:3px;color:#C9A96E}
.kpi.g b{color:#2E7D32}.kpi.a b{color:#E65100}.kpi.r b{color:#B71C1C}.kpi.b b{color:#1565C0}
.kpi small{font-size:.58rem;color:#bbb;text-transform:uppercase;letter-spacing:.08em}
/* Secciones */
.sec{margin-bottom:28px;background:white;border-radius:12px;padding:24px 28px;border:1px solid #e8e2d6;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.sec-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:#2c2417;border-bottom:2px solid #f0ece4;padding-bottom:8px;margin-bottom:18px;display:flex;align-items:center;gap:9px}
.sec-title span{color:#C9A96E}
/* Tabla */
table{width:100%;border-collapse:collapse}
th{background:#faf9f6;color:#bbb;font-size:.58rem;text-transform:uppercase;letter-spacing:.07em;padding:8px 10px;border-bottom:2px solid #e8e2d6;text-align:left;white-space:nowrap}
td{padding:7px 10px;border-bottom:1px solid #f5f2ec;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#fdfcfa}
.n{color:#ddd;font-size:.65rem}
.fw{font-weight:600}
.ta-c{text-align:center}
/* Badges */
.bdg{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:99px;font-size:.6rem;font-weight:700;white-space:nowrap}
.bdg--g{background:rgba(76,175,80,.12);color:#2E7D32}
.bdg--a{background:rgba(255,152,0,.12);color:#E65100}
.bdg--r{background:rgba(244,67,54,.12);color:#B71C1C}
/* Menú */
.menu-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.mc{background:#faf9f6;border:1px solid #e8e2d6;border-radius:10px;padding:18px 14px;text-align:center}
.mc em{font-size:1.8rem;display:block;margin-bottom:6px}
.mc b{font-size:1.5rem;font-family:'Cormorant Garamond',serif;font-weight:600;color:#2c2417;display:block;line-height:1}
.mc small{font-size:.58rem;color:#bbb;text-transform:uppercase;letter-spacing:.06em;display:block;margin-top:3px}
/* Restricciones */
.sec-mini{margin-bottom:28px;background:white;border-radius:12px;padding:20px 28px;border:1px solid #e8e2d6;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.restr-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.restr-item{background:#fff9f0;border:1px solid #fde8c2;border-radius:8px;padding:10px 14px;font-size:.72rem}
.restr-item b{color:#2c2417;display:block;margin-bottom:2px}
.restr-item span{color:#e67e22}
/* FOOTER */
.rpt-ft{background:#1a1f3a;color:rgba(255,255,255,.25);text-align:center;padding:16px 40px;font-size:.6rem;letter-spacing:.1em;border-top:3px solid #C9A96E;margin-top:40px}
@media print{
  .actions{display:none!important}
  body{background:white;font-size:9.5px}
  .rpt-body{padding:16px}
  .sec,.sec-mini{box-shadow:none;page-break-inside:avoid}
  .rpt-hd{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rpt-ft{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpi{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bdg--g,.bdg--a,.bdg--r{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style></head><body>

<div class="rpt-hd">
  <p class="rpt-eyebrow">Reporte Oficial · Gestión de Invitados</p>
  <h1 class="rpt-names">${bride} <em>&amp;</em> ${groom}</h1>
  <p class="rpt-date-badge">${wDate}</p>
  <p class="rpt-gen">Generado el ${genDate}</p>
</div>

<div class="actions">
  <button class="btn-pr" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <span class="hint">Ctrl+P (o Cmd+P en Mac) → Destino: "Guardar como PDF"</span>
</div>

<div class="rpt-body">

  <div class="kpis">
    <div class="kpi"><b>${s.total}</b><small>Total invitados</small></div>
    <div class="kpi g"><b>${s.confirmed}</b><small>Confirmados</small></div>
    <div class="kpi a"><b>${s.pending}</b><small>Pendientes</small></div>
    <div class="kpi r"><b>${s.rejected}</b><small>No asisten</small></div>
    <div class="kpi b"><b>${s.totalPersons}</b><small>Total personas</small></div>
  </div>

  <div class="sec">
    <h2 class="sec-title"><span>📋</span> Lista Completa de Invitados (${g.length})</h2>
    <table>
      <thead><tr>
        <th>#</th><th>Nombre</th><th>Apellido</th><th>Correo</th><th>Teléfono</th>
        <th class="ta-c">Acomp.</th><th class="ta-c">Total</th><th>Estado</th>
        <th>Grupo</th><th>Familia</th><th>Menú</th>
      </tr></thead>
      <tbody>${g.map((x,i)=>`<tr>
        <td class="n">${i+1}</td>
        <td class="fw">${esc(x.nombre)}</td>
        <td>${esc(x.apellido||'—')}</td>
        <td style="font-size:.65rem;color:#888">${esc(x.correo||'—')}</td>
        <td style="font-size:.65rem;color:#888">${esc(x.telefono||'—')}</td>
        <td class="ta-c">${x.acompanantes||0}</td>
        <td class="ta-c fw">${1+(parseInt(x.acompanantes)||0)}</td>
        <td>${bdg(x.estado)}</td>
        <td>${grupoLabel(x.grupo)}</td>
        <td>${esc(x.familia||'—')}</td>
        <td>${menuLabel(x.menu)||'—'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>

  <div class="sec">
    <h2 class="sec-title"><span>🍽️</span> Preferencias de Menú — Confirmados (${confirmed.length})</h2>
    <div class="menu-cards">
      <div class="mc"><em>🥩</em><b>${mc('carne')}</b><small>Res</small></div>
      <div class="mc"><em>🍗</em><b>${mc('pollo')}</b><small>Pollo</small></div>
      <div class="mc"><em>🐟</em><b>${mc('pescado')}</b><small>Pescado</small></div>
      <div class="mc"><em>🥗</em><b>${mc('vegetariano')}</b><small>Vegetariano</small></div>
    </div>
  </div>

  ${confirmed.filter(x=>x.restricciones).length ? `<div class="sec-mini">
    <h2 class="sec-title" style="margin-bottom:14px"><span>⚠️</span> Restricciones Alimenticias</h2>
    <div class="restr-list">
      ${confirmed.filter(x=>x.restricciones).map(x=>`<div class="restr-item">
        <b>${esc(x.nombre)} ${esc(x.apellido||'')}</b>
        <span>${esc(x.restricciones)}</span>
      </div>`).join('')}
    </div>
  </div>` : ''}

</div>

<div class="rpt-ft">💍 ${bride} &amp; ${groom} &nbsp;·&nbsp; ${wDate} &nbsp;·&nbsp; Sistema de Gestión de Boda</div>
</body></html>`);
  w.document.close();
}
function clearAll() {
  toast('🔒 Función deshabilitada en modo demo');
  return;
  // eslint-disable-next-line no-unreachable
  if (!confirm('¿Eliminar TODOS los invitados y datos?')) return;
  if (!confirm('Confirmación final: ¿Seguro?')) return;
  localStorage.removeItem(DB_KEY); localStorage.removeItem(CRONO_KEY);
  toast('🗑️ Todos los datos eliminados');
  renderView(currentView);
}

/* ===================================================
   INIT — DOMContentLoaded
   =================================================== */
document.addEventListener('DOMContentLoaded', () => {
  registerChartPlugins();
  applyTheme();
  buildLoginParticles();
  startLoginSlideshow();
  startSidebarCountdown();
  updateSidebarDate();
  updateAdminNames();
  updateLoginDisplay();

  document.getElementById('togglePass').addEventListener('click', () => {
    const inp=document.getElementById('adminPass'), icon=document.getElementById('eyeIcon');
    inp.type=inp.type==='password'?'text':'password';
    icon.className=inp.type==='password'?'fa-regular fa-eye':'fa-regular fa-eye-slash';
  });

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const user=document.getElementById('adminUser').value.trim();
    const pass=document.getElementById('adminPass').value;
    if (user===ADMIN_USER && pass===ADMIN_PASS) {
      document.getElementById('loginError').textContent='';
      sessionStorage.setItem('boda_admin_logged','1');
      showDashboard();
    } else {
      document.getElementById('loginError').textContent='Usuario o contraseña incorrectos';
      document.getElementById('adminPass').value='';
    }
  });

  if (sessionStorage.getItem('boda_admin_logged')==='1') showDashboard();
});

let sidebarCDTimer = null;
function startSidebarCountdown() {
  if (sidebarCDTimer) { clearInterval(sidebarCDTimer); sidebarCDTimer = null; }
  const pad = n => String(n).padStart(2,'0');
  function tick() {
    const diff = getWeddingDate() - Date.now();
    const cd   = document.getElementById('sidebarCountdown');
    if (!cd) return;
    if (diff <= 0) {
      cd.innerHTML = '<span style="color:var(--gold);font-size:.72rem;text-align:center;padding:4px 8px">💍 ¡Hoy es el gran día!</span>';
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);
    const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('scd-days',  String(days));
    set('scd-hours', pad(hours));
    set('scd-mins',  pad(mins));
    set('scd-secs',  pad(secs));
  }
  tick();
  sidebarCDTimer = setInterval(tick, 1000);
}

/* ===== CONFIG VIEW ===== */
function refreshConfig() {
  if (configCDTimer) { clearInterval(configCDTimer); configCDTimer = null; }
  const cfg  = getWeddingConfig();
  const container = document.querySelector('#view-config .cfg-content');
  if (!container) return;

  /* Dress code helpers — Damas + Caballeros */
  const dressCode    = cfg.dressCode        || 'Formal Elegante';
  const ladiesType   = cfg.dressLadiesType   || 'Vestido largo de noche';
  const ladiesNote   = cfg.dressLadiesNote   !== undefined ? cfg.dressLadiesNote : 'Evitar el blanco — reservado para la novia';
  const ladiesColors = cfg.dressLadiesColors || [
    {hex:'#D4A5A5',name:'Rosa polvo'},{hex:'#C8A2C8',name:'Lila'},
    {hex:'#E8D5B7',name:'Champagne'},{hex:'#C9A96E',name:'Dorado'},{hex:'#B5C8C0',name:'Salvia'}
  ];
  const gentsType    = cfg.dressGentsType    || 'Traje formal';
  const gentsNote    = cfg.dressGentsNote    !== undefined ? cfg.dressGentsNote : 'Corbata o moño obligatorio';
  const gentsColors  = cfg.dressGentsColors  || [
    {hex:'#2C2C2C',name:'Negro'},{hex:'#4A4A6A',name:'Marino'},
    {hex:'#7B2D3B',name:'Burdeos'},{hex:'#C9A96E',name:'Dorado'},{hex:'#6B7C4E',name:'Verde olivo'}
  ];

  const DRESS_TYPES   = ['Formal Elegante','Formal','Semi-formal','Cocktail','Garden Party','Casual Elegante','Black Tie','White Tie'];
  const LADIES_TYPES  = ['Vestido largo de noche','Vestido cocktail','Vestido formal','Vestido midi','Semi-formal'];
  const GENTS_TYPES   = ['Traje formal','Smoking / Tuxedo','Traje oscuro','Guayabera formal','Semi-formal'];
  const LADIES_PRESETS = [
    {hex:'#D4A5A5',name:'Rosa polvo'},{hex:'#C8A2C8',name:'Lila'},{hex:'#E8D5B7',name:'Champagne'},
    {hex:'#F5E6D0',name:'Crema'},{hex:'#C9A96E',name:'Dorado'},{hex:'#B5C8C0',name:'Salvia'},
    {hex:'#7B2D3B',name:'Burdeos'},{hex:'#87CEEB',name:'Azul cielo'},{hex:'#DDA0DD',name:'Ciruela'},
    {hex:'#F4A460',name:'Arena'},{hex:'#C0C0C0',name:'Plateado'},{hex:'#F08080',name:'Coral'},
  ];
  const GENTS_PRESETS = [
    {hex:'#2C2C2C',name:'Negro'},{hex:'#4A4A6A',name:'Marino'},{hex:'#7B2D3B',name:'Burdeos'},
    {hex:'#C9A96E',name:'Dorado'},{hex:'#6B7C4E',name:'Verde olivo'},{hex:'#708090',name:'Gris pizarra'},
    {hex:'#C0C0C0',name:'Plateado'},{hex:'#4682B4',name:'Azul acero'},{hex:'#8B6914',name:'Café dorado'},
    {hex:'#36454F',name:'Gris carbón'},{hex:'#556B2F',name:'Oliva oscuro'},{hex:'#E8D5B7',name:'Champagne'},
  ];
  const dressTypesHTML    = DRESS_TYPES.map(t  => `<option value="${t}"${t===dressCode?' selected':''}>${t}</option>`).join('');
  const ladiesTypesHTML   = LADIES_TYPES.map(t => `<option value="${t}"${t===ladiesType?' selected':''}>${t}</option>`).join('');
  const gentsTypesHTML    = GENTS_TYPES.map(t  => `<option value="${t}"${t===gentsType?' selected':''}>${t}</option>`).join('');
  const ladiesPaletteHTML = LADIES_PRESETS.map(c => {
    const on = ladiesColors.some(d => d.hex.toLowerCase()===c.hex.toLowerCase());
    return `<button type="button" class="dress-preset${on?' active':''}" data-hex="${c.hex}" data-name="${esc(c.name)}" style="--dc:${c.hex}" title="${esc(c.name)}">${on?'✓':''}</button>`;
  }).join('');
  const gentsPaletteHTML  = GENTS_PRESETS.map(c => {
    const on = gentsColors.some(d => d.hex.toLowerCase()===c.hex.toLowerCase());
    return `<button type="button" class="dress-preset${on?' active':''}" data-hex="${c.hex}" data-name="${esc(c.name)}" style="--dc:${c.hex}" title="${esc(c.name)}">${on?'✓':''}</button>`;
  }).join('');

  container.innerHTML = `
    <div class="card cfg-countdown-card">
      <div class="cfg-countdown-header">
        <i class="fa-solid fa-hourglass-half cfg-hg-icon"></i>
        <div>
          <h3 class="card-title" style="margin:0">Cuenta Regresiva</h3>
          <p style="font-size:.75rem;color:var(--text-soft);margin:3px 0 0">Tiempo restante hasta el gran día</p>
        </div>
      </div>
      <div class="cfg-countdown" id="cfgCountdown"></div>
    </div>

    <div class="card mt-16">
      <h3 class="card-title"><i class="fa-solid fa-user-group"></i> Nombres de los Novios</h3>
      <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:18px">
        Estos nombres aparecen en el héroe, footer y hashtag de la página de invitados, y en las iniciales del panel.
      </p>
      <div class="cfg-form">
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-venus"></i> Nombre de la novia</label>
          <input type="text" class="cfg-input" id="cfg-bride" value="${cfg.bride||'Sofía'}" placeholder="Ej: Sofía" maxlength="40" />
        </div>
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-mars"></i> Nombre del novio</label>
          <input type="text" class="cfg-input" id="cfg-groom" value="${cfg.groom||'Alejandro'}" placeholder="Ej: Alejandro" maxlength="40" />
        </div>
      </div>
      <button class="btn-cfg-save" id="saveNamesBtn" style="margin-top:4px">
        <i class="fa-solid fa-floppy-disk"></i> Guardar nombres
      </button>
    </div>

    <div class="card mt-16" id="musicCard">
      <h3 class="card-title"><i class="fa-solid fa-music"></i> Música de Fondo</h3>
      <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:18px">
        Sube un archivo de audio (MP3) desde tu computadora. Se reproducirá en la página de invitados cuando den clic en "Entrar".
      </p>

      <!-- Zona de subida -->
      <div class="cfg-upload-zone" id="musicDropZone">
        <i class="fa-solid fa-cloud-arrow-up" style="font-size:2rem;color:var(--gold);margin-bottom:8px;display:block"></i>
        <strong>Arrastra tu canción aquí</strong>
        <span style="display:block;font-size:.8rem;color:var(--text-soft);margin-top:4px">o haz clic para seleccionar</span>
        <span style="display:block;font-size:.75rem;color:var(--text-soft);margin-top:2px">MP3 · M4A · AAC · OGG · máx. 50 MB</span>
        <input type="file" id="musicFileInput" accept="audio/mp3,audio/mpeg,audio/aac,audio/ogg,audio/m4a,audio/*" style="display:none" />
      </div>

      <!-- Archivo guardado (se llena dinámicamente) -->
      <div class="cfg-music-saved" id="musicSavedStatus" style="display:none">
        <i class="fa-solid fa-file-audio" style="color:var(--gold)"></i>
        <span id="musicSavedName">cancion.mp3</span>
        <button class="cfg-btn-icon cfg-btn-icon--danger" id="deleteMusicFileBtn" title="Eliminar archivo">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>

      <div class="cfg-field" style="margin-top:14px">
        <label class="cfg-label"><i class="fa-solid fa-tag"></i> Nombre de la canción (opcional)</label>
        <input type="text" class="cfg-input" id="cfg-music-title" value="${esc(getMusic().title||'')}" placeholder="Ej: Perfect - Ed Sheeran" />
      </div>

      <div style="margin-top:6px">
        <details>
          <summary style="cursor:pointer;font-size:.8rem;color:var(--text-soft);user-select:none;padding:6px 0">
            Usar link de YouTube en vez de archivo
          </summary>
          <div class="cfg-field" style="margin-top:8px">
            <input type="url" class="cfg-input" id="cfg-music-url" value="${esc(getMusic().url||'')}" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
        </details>
      </div>

      <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-cfg-save" id="saveMusicBtn">
          <i class="fa-solid fa-floppy-disk"></i> Guardar
        </button>
        <button class="btn-cfg-save" id="deleteMusicBtn" style="background:rgba(231,76,60,.15);color:#e74c3c;border-color:#e74c3c;display:none">
          <i class="fa-solid fa-trash-can"></i> Quitar música
        </button>
      </div>

      <div id="musicProgressWrap" style="display:none;margin-top:12px">
        <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
          <div id="musicProgressBar" style="height:100%;width:0%;background:var(--gold);transition:width .2s;border-radius:3px"></div>
        </div>
        <p style="font-size:.75rem;color:var(--text-soft);margin-top:6px" id="musicProgressLabel">Guardando...</p>
      </div>
    </div>

    <div class="card mt-16" id="dressCodeCard">
      <h3 class="card-title"><i class="fa-solid fa-shirt"></i> Código de Vestimenta</h3>
      <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:20px">
        Configura por separado la vestimenta para damas y caballeros.<br>
        Se mostrará en la sección del evento de la página de invitados.
      </p>
      <div class="cfg-field" style="margin-bottom:22px">
        <label class="cfg-label"><i class="fa-solid fa-tag"></i> Estilo general del evento</label>
        <select class="cfg-input" id="cfg-dress-type">${dressTypesHTML}</select>
      </div>
      <div class="cfg-dress-cols">
        <div class="cfg-dress-group cfg-dress-group--ladies">
          <div class="cfg-dress-group__header">
            <span class="cfg-dress-group__emoji">👗</span>
            <h4 class="cfg-dress-group__title">Damas</h4>
          </div>
          <div class="cfg-field">
            <label class="cfg-label"><i class="fa-solid fa-tag"></i> Tipo de vestido</label>
            <select class="cfg-input" id="cfg-ladies-type">${ladiesTypesHTML}</select>
          </div>
          <div class="cfg-field" style="margin-top:12px">
            <label class="cfg-label"><i class="fa-solid fa-palette"></i> Colores sugeridos</label>
            <p style="font-size:.74rem;color:var(--text-soft);margin:4px 0 8px">Clic para activar / desactivar</p>
            <div class="cfg-dress-palette" id="cfgLadiesPalette">${ladiesPaletteHTML}</div>
          </div>
          <div class="cfg-field" style="margin-top:12px">
            <label class="cfg-label"><i class="fa-solid fa-triangle-exclamation"></i> Nota / colores a evitar</label>
            <input type="text" class="cfg-input" id="cfg-ladies-note"
              value="${esc(ladiesNote)}"
              placeholder="Ej: Evitar el blanco — reservado para la novia" />
          </div>
        </div>
        <div class="cfg-dress-group cfg-dress-group--gents">
          <div class="cfg-dress-group__header">
            <span class="cfg-dress-group__emoji">🤵</span>
            <h4 class="cfg-dress-group__title">Caballeros</h4>
          </div>
          <div class="cfg-field">
            <label class="cfg-label"><i class="fa-solid fa-tag"></i> Tipo de traje</label>
            <select class="cfg-input" id="cfg-gents-type">${gentsTypesHTML}</select>
          </div>
          <div class="cfg-field" style="margin-top:12px">
            <label class="cfg-label"><i class="fa-solid fa-palette"></i> Colores sugeridos</label>
            <p style="font-size:.74rem;color:var(--text-soft);margin:4px 0 8px">Clic para activar / desactivar</p>
            <div class="cfg-dress-palette" id="cfgGentsPalette">${gentsPaletteHTML}</div>
          </div>
          <div class="cfg-field" style="margin-top:12px">
            <label class="cfg-label"><i class="fa-solid fa-circle-info"></i> Nota / recomendación</label>
            <input type="text" class="cfg-input" id="cfg-gents-note"
              value="${esc(gentsNote)}"
              placeholder="Ej: Corbata o moño obligatorio" />
          </div>
        </div>
      </div>
      <button class="btn-cfg-save" id="saveDressCodeBtn" style="margin-top:24px">
        <i class="fa-solid fa-floppy-disk"></i> Guardar vestimenta
      </button>
    </div>`;

  const pad = n => String(n).padStart(2,'0');
  function updateCfgCD() {
    const diff = getWeddingDate() - Date.now();
    const el   = document.getElementById('cfgCountdown');
    if (!el) { clearInterval(configCDTimer); configCDTimer=null; return; }
    if (diff <= 0) {
      el.innerHTML = '<p class="cfg-day-of">💍 ¡El gran día ha llegado!</p>'; return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);
    el.innerHTML = `
      <div class="cfg-cd-unit"><div class="cfg-cd-num">${days}</div><div class="cfg-cd-label">Días</div></div>
      <span class="cfg-cd-sep">:</span>
      <div class="cfg-cd-unit"><div class="cfg-cd-num">${pad(hours)}</div><div class="cfg-cd-label">Horas</div></div>
      <span class="cfg-cd-sep">:</span>
      <div class="cfg-cd-unit"><div class="cfg-cd-num">${pad(mins)}</div><div class="cfg-cd-label">Min</div></div>
      <span class="cfg-cd-sep">:</span>
      <div class="cfg-cd-unit"><div class="cfg-cd-num">${pad(secs)}</div><div class="cfg-cd-label">Seg</div></div>`;
  }
  updateCfgCD();
  configCDTimer = setInterval(updateCfgCD, 1000);

  document.getElementById('saveNamesBtn').addEventListener('click', () => {
    const bride = document.getElementById('cfg-bride').value.trim();
    const groom = document.getElementById('cfg-groom').value.trim();
    if (!bride || !groom) { toast('⚠️ Ingresa ambos nombres'); return; }
    const cfg = getWeddingConfig();
    setWeddingConfig({...cfg, bride, groom});
    updateAdminNames();
    toast('✅ Nombres guardados correctamente');
  });

  /* ── Música: cargar estado guardado ── */
  let pendingAudioFile = null;

  getAudioFileMeta(meta => {
    const status  = document.getElementById('musicSavedStatus');
    const nameEl  = document.getElementById('musicSavedName');
    const delBtn  = document.getElementById('deleteMusicBtn');
    if (meta) {
      if (status) { status.style.display = 'flex'; }
      if (nameEl) nameEl.textContent = meta.name;
      if (delBtn) delBtn.style.display = '';
      const titleIn = document.getElementById('cfg-music-title');
      if (titleIn && !titleIn.value) titleIn.value = meta.title || '';
    }
  });

  /* ── Zona de arrastrar / clic ── */
  const dropZone   = document.getElementById('musicDropZone');
  const fileInput  = document.getElementById('musicFileInput');

  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput && fileInput.click());
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('cfg-upload-zone--drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('cfg-upload-zone--drag'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('cfg-upload-zone--drag');
      const f = e.dataTransfer.files[0];
      if (f) handleAudioFileSelect(f);
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleAudioFileSelect(fileInput.files[0]);
    });
  }

  function handleAudioFileSelect(file) {
    if (file.size > 52428800) { toast('⚠️ El archivo supera 50 MB'); return; }
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|aac|ogg|wav|flac)$/i)) {
      toast('⚠️ Selecciona un archivo de audio válido'); return;
    }
    pendingAudioFile = file;
    const status = document.getElementById('musicSavedStatus');
    const nameEl = document.getElementById('musicSavedName');
    if (status) status.style.display = 'flex';
    if (nameEl) nameEl.textContent = file.name;
    const titleIn = document.getElementById('cfg-music-title');
    if (titleIn && !titleIn.value) {
      titleIn.value = file.name.replace(/\.[^.]+$/, '');
    }
    toast('📁 Archivo seleccionado — pulsa Guardar para confirmar');
  }

  /* ── Botón Guardar ── */
  document.getElementById('saveMusicBtn').addEventListener('click', () => {
    const title = document.getElementById('cfg-music-title').value.trim();
    const url   = (document.getElementById('cfg-music-url')||{}).value?.trim() || '';

    if (pendingAudioFile) {
      // Guardar archivo en IndexedDB
      const prog      = document.getElementById('musicProgressWrap');
      const bar       = document.getElementById('musicProgressBar');
      const label     = document.getElementById('musicProgressLabel');
      if (prog) prog.style.display = '';
      if (bar)  bar.style.width = '30%';
      if (label) label.textContent = 'Guardando archivo...';

      saveAudioFile(pendingAudioFile, title || pendingAudioFile.name.replace(/\.[^.]+$/, ''), err => {
        if (prog) prog.style.display = 'none';
        if (err) { toast('❌ Error al guardar: ' + err.message); return; }
        // Guardar también en localStorage el meta (sin el blob)
        setMusic({ title: title || pendingAudioFile.name.replace(/\.[^.]+$/, ''), savedFile: pendingAudioFile.name });
        pendingAudioFile = null;
        const delBtn = document.getElementById('deleteMusicBtn');
        if (delBtn) delBtn.style.display = '';
        toast('✅ Música guardada correctamente');
      });
      // Barra de progreso animada (simulada)
      let pct = 30;
      const ticker = setInterval(() => {
        pct = Math.min(pct + 15, 90);
        if (bar) bar.style.width = pct + '%';
      }, 300);
      setTimeout(() => clearInterval(ticker), 3000);

    } else if (url) {
      // Guardar URL (YouTube / MP3 remoto)
      deleteAudioFile(); // limpiar cualquier archivo local
      setMusic({ url, title: title || 'Música de la boda' });
      toast('✅ URL de música guardada');
      refreshConfig();

    } else {
      toast('⚠️ Selecciona un archivo o ingresa una URL');
    }
  });

  /* ── Eliminar archivo ── */
  const delMusicFileBtn = document.getElementById('deleteMusicFileBtn');
  if (delMusicFileBtn) {
    delMusicFileBtn.addEventListener('click', () => {
      deleteAudioFile(() => {
        setMusic({});
        pendingAudioFile = null;
        toast('🗑 Música eliminada');
        refreshConfig();
      });
    });
  }
  const delMusicBtn = document.getElementById('deleteMusicBtn');
  if (delMusicBtn) {
    delMusicBtn.addEventListener('click', () => {
      deleteAudioFile(() => {
        setMusic({});
        pendingAudioFile = null;
        toast('🗑 Música eliminada');
        refreshConfig();
      });
    });
  }

  /* ── Dress Code (palettes toggle) ── */
  ['cfgLadiesPalette', 'cfgGentsPalette'].forEach(pid => {
    document.getElementById(pid).addEventListener('click', e => {
      const btn = e.target.closest('.dress-preset');
      if (!btn) return;
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '✓' : '';
    });
  });

  document.getElementById('saveDressCodeBtn').addEventListener('click', () => {
    const type       = document.getElementById('cfg-dress-type').value;
    const ladiesType = document.getElementById('cfg-ladies-type').value;
    const ladiesNote = document.getElementById('cfg-ladies-note').value.trim();
    const gentsType  = document.getElementById('cfg-gents-type').value;
    const gentsNote  = document.getElementById('cfg-gents-note').value.trim();
    const la = Array.from(document.querySelectorAll('#cfgLadiesPalette .dress-preset.active')).map(b => ({hex:b.dataset.hex, name:b.dataset.name}));
    const ga = Array.from(document.querySelectorAll('#cfgGentsPalette .dress-preset.active')).map(b  => ({hex:b.dataset.hex, name:b.dataset.name}));
    const c = getWeddingConfig();
    setWeddingConfig({...c,
      dressCode:        type,
      dressLadiesType:  ladiesType, dressLadiesNote: ladiesNote, dressLadiesColors: la,
      dressGentsType:   gentsType,  dressGentsNote:  gentsNote,  dressGentsColors:  ga,
    });
    toast('✅ Vestimenta guardada correctamente');
  });
}

function startLoginSlideshow() {
  const slides = document.querySelectorAll('.login-img-slide');
  const dotsEl = document.getElementById('loginSlideDots');
  if (!slides.length) return;
  slides.forEach((_,i)=>{
    const d=document.createElement('span');
    d.className='login-slide-dot'+(i===0?' active':'');
    d.onclick=()=>goToSlide(i);
    dotsEl?.appendChild(d);
  });
  let cur=0;
  function goToSlide(n) {
    slides[cur].classList.remove('active');
    document.querySelectorAll('.login-slide-dot')[cur]?.classList.remove('active');
    cur=n;
    slides[cur].classList.add('active');
    document.querySelectorAll('.login-slide-dot')[cur]?.classList.add('active');
  }
  setInterval(()=>goToSlide((cur+1)%slides.length), 4500);
}

function buildLoginParticles() {
  const pc=document.getElementById('loginParticles');
  if (!pc) return;
  '💍💐✨🌹🕊️💫🌸🥂💎🎀'.split('').filter(e=>e.trim()).concat(['💍','💐','✨','🌹']).slice(0,20).forEach(emoji=>{
    const el=document.createElement('div');
    el.className='login-particle'; el.textContent=emoji;
    el.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${10+Math.random()*10}s;--del:${-Math.random()*12}s`;
    pc.appendChild(el);
  });
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  checkAndSeed();
  initDashboard();
}

function initDashboard() {
  document.querySelectorAll('.sidebar__link[data-view]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault(); switchView(link.dataset.view);
      if (window.innerWidth<820) document.getElementById('sidebar').classList.remove('open');
    });
  });
  document.getElementById('adminTheme').addEventListener('click', ()=>{
    darkMode=!darkMode; localStorage.setItem('admin_dark',darkMode?'1':'0'); applyTheme();
    setTimeout(()=>renderView(currentView),60);
  });
  document.getElementById('sidebarToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarClose').addEventListener('click', ()=>document.getElementById('sidebar').classList.remove('open'));
  document.getElementById('logoutBtn').addEventListener('click',()=>{ sessionStorage.removeItem('boda_admin_logged'); location.href='index.html'; });
  document.getElementById('globalSearch').addEventListener('input', e=>{
    if (currentView!=='guests') switchView('guests');
    const gs=document.getElementById('guestSearch');
    if (gs) gs.value=e.target.value;
    renderTable();
  });

  /* Guests */
  document.getElementById('guestSearch').addEventListener('input', renderTable);
  document.getElementById('sortSelect').addEventListener('change', e=>{ guestSort=e.target.value; guestSortDir=1; renderTable(); });
  document.getElementById('groupFilterSelect').addEventListener('change', e=>{ guestGroupFilter=e.target.value; renderTable(); });
  document.querySelectorAll('#view-guests .pill').forEach(pill=>{
    pill.addEventListener('click',()=>{ document.querySelectorAll('#view-guests .pill').forEach(p=>p.classList.remove('active')); pill.classList.add('active'); guestFilter=pill.dataset.filter; renderTable(); });
  });
  document.querySelectorAll('#guestsTable th.sortable').forEach(th=>{
    th.addEventListener('click',()=>{ if(guestSort===th.dataset.col)guestSortDir*=-1; else{guestSort=th.dataset.col;guestSortDir=1;} document.getElementById('sortSelect').value=guestSort; renderTable(); });
  });
  document.getElementById('addGuestBtn').addEventListener('click',()=>openGuestModal(null));
  document.getElementById('guestModalForm').addEventListener('submit', e=>{
    e.preventDefault();
    const id=document.getElementById('m-id').value;
    const g={id:id||uid(),nombre:document.getElementById('m-nombre').value.trim(),apellido:document.getElementById('m-apellido').value.trim(),correo:document.getElementById('m-correo').value.trim(),telefono:document.getElementById('m-telefono').value.trim(),acompanantes:parseInt(document.getElementById('m-acompanantes').value)||0,estado:document.getElementById('m-estado').value,menu:document.getElementById('m-menu').value,restricciones:document.getElementById('m-restricciones').value.trim(),grupo:document.getElementById('m-grupo').value,familia:document.getElementById('m-familia').value.trim(),mensaje:document.getElementById('m-mensaje').value.trim(),notas:document.getElementById('m-notas').value.trim(),fecha:id?(getGuests().find(x=>x.id===id)?.fecha||new Date().toISOString()):new Date().toISOString()};
    if (id){updateGuest(g);toast('✅ Invitado actualizado');}
    else   {addGuest(g);toast('✅ Invitado agregado');}
    document.getElementById('guestModal').classList.add('hidden');
    renderTable();
  });
  const closeModal=()=>document.getElementById('guestModal').classList.add('hidden');
  document.getElementById('modalClose').addEventListener('click',  closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('guestModal').addEventListener('click',  e=>{ if(e.target.id==='guestModal')closeModal(); });

  /* Cronograma */
  document.getElementById('addEventoBtn').addEventListener('click', ()=>openEventoModal(null));
  document.getElementById('exportCronoBtn').addEventListener('click', printCrono);
  document.getElementById('resetCronoBtn').addEventListener('click',()=>{if(!confirm('¿Restaurar cronograma?'))return;setCrono(defaultCronograma());toast('🔄 Cronograma restaurado');refreshCrono();});
  document.querySelectorAll('.cp-dot').forEach(dot=>{
    dot.addEventListener('click',()=>{ document.querySelectorAll('.cp-dot').forEach(d=>d.classList.remove('active'));dot.classList.add('active');document.getElementById('ev-color').value=dot.dataset.color; });
  });
  document.getElementById('eventoModalForm').addEventListener('submit', e=>{
    e.preventDefault();
    const id=document.getElementById('ev-id').value;
    const ev={id:id||uid(),hora:document.getElementById('ev-hora').value,icon:document.getElementById('ev-icon').value.trim()||'📌',nombre:document.getElementById('ev-nombre').value.trim(),lugar:document.getElementById('ev-lugar').value.trim(),responsable:document.getElementById('ev-responsable').value.trim(),color:document.getElementById('ev-color').value,notas:document.getElementById('ev-notas').value.trim()};
    const crono=getCrono();
    if(id){setCrono(crono.map(x=>x.id===id?ev:x));toast('✅ Evento actualizado');}
    else  {setCrono([...crono,ev]);toast('✅ Evento agregado');}
    document.getElementById('eventoModal').classList.add('hidden');refreshCrono();
  });
  const closeEv=()=>document.getElementById('eventoModal').classList.add('hidden');
  document.getElementById('eventoModalClose').addEventListener('click', closeEv);
  document.getElementById('eventoCancel').addEventListener('click',    closeEv);
  document.getElementById('eventoModal').addEventListener('click',     e=>{if(e.target.id==='eventoModal')closeEv();});

  /* Export */
  document.getElementById('exportCSV').addEventListener('click',     exportCSV);
  document.getElementById('exportPDF').addEventListener('click',     exportPDF);
  document.getElementById('exportAcomp').addEventListener('click',   exportAcomp);
  document.getElementById('exportFamilia').addEventListener('click', exportFamilia);
  document.getElementById('exportJSON').addEventListener('click',    exportJSON);
  document.getElementById('clearData').addEventListener('click',     clearAll);

  switchView('guests');
}
