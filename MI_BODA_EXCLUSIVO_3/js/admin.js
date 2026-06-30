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
const REGALOS_KEY    = 'boda_regalos';
function getRegalos() { try { return JSON.parse(localStorage.getItem(REGALOS_KEY)) || null; } catch(e) { return null; } }
function setRegalos(r) { localStorage.setItem(REGALOS_KEY, JSON.stringify(r)); }

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
  dashboard:   ['Dashboard',            'Vista general del estado de la boda'],
  guests:      ['Lista de Invitados',   'Gestiona y organiza tus invitados'],
  mesas:       ['Administración de Mesas', 'Organiza la distribución de mesas'],
  mapa:        ['Mapa del Local',       'Visualiza el plano del salón'],
  cronograma:  ['Cronograma del Día',   'Itinerario completo de la boda'],
  presupuesto: ['Presupuesto',          'Control de gastos y pagos'],
  proveedores: ['Proveedores',          'Gestiona tus proveedores y contratos'],
  galeria:     ['Galería de Imágenes',  'Sube y organiza las fotos del evento'],
  mensajes:    ['Mensajes',             'Mensajes enviados por los invitados'],
  stats:       ['Estadísticas',         'Análisis visual de confirmaciones'],
  export:      ['Exportar Datos',       'Descarga listas y reportes'],
  config:      ['Configuración',        'Nombres, música y vestimenta'],
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
  if      (v==='dashboard')   refreshDashboard();
  else if (v==='guests')      refreshGuests();
  else if (v==='mesas')       refreshMesas();
  else if (v==='mapa')        refreshMapa();
  else if (v==='cronograma')  refreshCrono();
  else if (v==='presupuesto') refreshPresupuesto();
  else if (v==='proveedores') refreshProveedores();
  else if (v==='galeria')     refreshGaleria();
  else if (v==='mensajes')    refreshMensajes();
  else if (v==='stats')       refreshStats();
  else if (v==='config')      refreshConfig();
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
            <i class="fa-solid fa-folder-open" style="color:var(--gold)"></i> Usar archivo de la carpeta <code style="background:rgba(0,0,0,.06);padding:1px 5px;border-radius:4px">music/</code>
          </summary>
          <div class="cfg-field" style="margin-top:8px">
            <label class="cfg-label" style="font-size:.75rem">Nombre del archivo (ej: cancion.mp3)</label>
            <input type="text" class="cfg-input" id="cfg-music-local" value="${esc(getMusic().localFile||'')}" placeholder="mi-cancion.mp3" />
            <p style="font-size:.71rem;color:var(--text-soft);margin-top:5px">
              Copia tu MP3 a la carpeta <code style="background:rgba(0,0,0,.06);padding:1px 5px;border-radius:4px">music/</code> del proyecto y escribe el nombre aquí.
              Funciona en todos los dispositivos sin necesidad de subir el archivo.
            </p>
          </div>
        </details>
        <details style="margin-top:4px">
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
    </div>

    <div class="card mt-16">
      <h3 class="card-title"><i class="fa-solid fa-location-dot"></i> Ubicación del Evento</h3>
      <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:18px">
        Configura el lugar del evento. Se mostrará automáticamente en la página de invitados.
      </p>
      <div class="cfg-form">
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-building"></i> Nombre del local</label>
          <input type="text" class="cfg-input" id="cfg-venue-name" value="${esc(getVenue().name || 'Casa Hacienda Mamacona')}" placeholder="Ej: Casa Hacienda Mamacona" />
        </div>
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-map-pin"></i> Dirección</label>
          <input type="text" class="cfg-input" id="cfg-venue-addr" value="${esc(getVenue().address || 'Av. Mamacona s/n, Lurín, Lima')}" placeholder="Ej: Av. Mamacona s/n, Lurín, Lima" />
        </div>
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-map-location-dot"></i> URL de Google Maps (para el botón "Cómo llegar")</label>
          <input type="url" class="cfg-input" id="cfg-venue-url" value="${esc(getVenue().mapsUrl || '')}" placeholder="https://maps.google.com/..." />
        </div>
        <div class="cfg-field">
          <label class="cfg-label"><i class="fa-solid fa-map"></i> URL del iframe del mapa (Google Maps embed)</label>
          <input type="url" class="cfg-input" id="cfg-venue-embed" value="${esc(getVenue().embedUrl || '')}" placeholder="https://maps.google.com/maps?q=...&output=embed" />
          <p style="font-size:.72rem;color:var(--text-soft);margin-top:4px">En Google Maps: Compartir → Insertar un mapa → copia la URL del src="" del iframe</p>
        </div>
      </div>
      <button class="btn-cfg-save" id="saveVenueBtn" style="margin-top:16px">
        <i class="fa-solid fa-floppy-disk"></i> Guardar ubicación
      </button>
    </div>

    <div class="card mt-16">
      <h3 class="card-title"><i class="fa-solid fa-gift"></i> Lista de Regalos</h3>
      <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:18px">
        Personaliza la lista de regalos sugeridos que aparece en la página de invitados.
      </p>
      <div id="cfgRegalosList" class="cfg-regalos-list"></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn-cfg-save" id="addRegalosItem"><i class="fa-solid fa-plus"></i> Agregar item</button>
        <button class="btn-cfg-save" id="saveRegalosBtn"><i class="fa-solid fa-floppy-disk"></i> Guardar lista</button>
      </div>
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

  /* ── Ubicación ── */
  document.getElementById('saveVenueBtn').addEventListener('click', () => {
    const venue = {
      name:     document.getElementById('cfg-venue-name').value.trim(),
      address:  document.getElementById('cfg-venue-addr').value.trim(),
      mapsUrl:  document.getElementById('cfg-venue-url').value.trim(),
      embedUrl: document.getElementById('cfg-venue-embed').value.trim(),
    };
    setVenue(venue);
    toast('✅ Ubicación guardada');
  });

  /* ── Lista de Regalos ── */
  const DEFAULT_REGALOS = [
    {icon:'fa-blender',name:'Licuadora'},
    {icon:'fa-bed',name:'Juego de Cama'},
    {icon:'fa-tv',name:'Smart TV'},
    {icon:'fa-mobile-screen-button',name:'Celular'},
    {icon:'fa-kitchen-set',name:'Vajilla'},
    {icon:'fa-couch',name:'Muebles del Hogar'},
    {icon:'fa-suitcase-rolling',name:'Luna de Miel'},
    {icon:'fa-gift',name:'Sobre de Felicitación'},
  ];
  let regalos = getRegalos() || DEFAULT_REGALOS;

  function renderRegalosEditor() {
    const el = document.getElementById('cfgRegalosList');
    if (!el) return;
    el.innerHTML = regalos.map((r, i) => `
      <div class="cfg-regalo-row">
        <input type="text" value="${esc(r.icon)}" placeholder="fa-gift (clase FA6)" data-ri="${i}" data-rfield="icon" />
        <input type="text" value="${esc(r.name)}" placeholder="Nombre del regalo" data-ri="${i}" data-rfield="name" />
        <button class="cfg-regalo-del" data-rdel="${i}"><i class="fa-solid fa-trash-can"></i></button>
      </div>`).join('');
    el.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
      const idx = parseInt(inp.dataset.ri);
      const field = inp.dataset.rfield;
      regalos[idx][field] = inp.value;
    }));
    el.querySelectorAll('[data-rdel]').forEach(btn => btn.addEventListener('click', () => {
      regalos.splice(parseInt(btn.dataset.rdel), 1);
      renderRegalosEditor();
    }));
  }
  renderRegalosEditor();

  document.getElementById('addRegalosItem')?.addEventListener('click', () => {
    regalos.push({icon:'fa-gift', name:'Nuevo regalo'});
    renderRegalosEditor();
    document.getElementById('cfgRegalosList').lastElementChild?.querySelector('input:last-of-type')?.focus();
  });
  document.getElementById('saveRegalosBtn')?.addEventListener('click', () => {
    setRegalos(regalos);
    toast('✅ Lista de regalos guardada');
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
    const title     = document.getElementById('cfg-music-title').value.trim();
    const url       = (document.getElementById('cfg-music-url')||{}).value?.trim() || '';
    const localFile = (document.getElementById('cfg-music-local')||{}).value?.trim() || '';

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

    } else if (localFile) {
      // Usar archivo de la carpeta music/
      deleteAudioFile();
      setMusic({ localFile, title: title || localFile.replace(/\.[^.]+$/, '') });
      toast('✅ Archivo local configurado: music/' + localFile);
      refreshConfig();

    } else if (url) {
      // Guardar URL (YouTube / MP3 remoto)
      deleteAudioFile(); // limpiar cualquier archivo local
      setMusic({ url, title: title || 'Música de la boda' });
      toast('✅ URL de música guardada');
      refreshConfig();

    } else {
      toast('⚠️ Selecciona un archivo, escribe un nombre de la carpeta music/ o ingresa una URL');
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
  switchView('dashboard');
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

  /* Mesas */
  document.getElementById('addMesaBtn').addEventListener('click', () => openMesaModal(null));

  // Quick create mesas
  document.getElementById('quickCreateMesasBtn')?.addEventListener('click', () => {
    document.getElementById('quickMesaModal').classList.remove('hidden');
    updateQMPreview();
  });
  const closeQM = () => document.getElementById('quickMesaModal').classList.add('hidden');
  document.getElementById('quickMesaClose')?.addEventListener('click', closeQM);
  document.getElementById('quickMesaCancel')?.addEventListener('click', closeQM);
  document.getElementById('quickMesaModal')?.addEventListener('click', e => { if (e.target.id === 'quickMesaModal') closeQM(); });

  function updateQMPreview() {
    const n = parseInt(document.getElementById('qm-count')?.value) || 10;
    const s = parseInt(document.getElementById('qm-seats')?.value) || 8;
    const p = document.getElementById('qm-prefix')?.value.trim() || 'Mesa';
    const el = document.getElementById('qm-preview');
    if (el) el.textContent = `Se crearán: ${p} 1, ${p} 2... ${p} ${n} · ${s} asientos c/u`;
  }
  ['qm-count','qm-seats','qm-prefix'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateQMPreview);
  });

  document.getElementById('quickMesaConfirm')?.addEventListener('click', () => {
    const n    = Math.min(50, Math.max(1, parseInt(document.getElementById('qm-count').value) || 10));
    const seats = Math.min(30, Math.max(1, parseInt(document.getElementById('qm-seats').value) || 8));
    const forma = document.getElementById('qm-forma').value;
    const prefix = document.getElementById('qm-prefix').value.trim() || 'Mesa';
    const existing = getMesas();
    const newMesas = [];
    for (let i = 1; i <= n; i++) {
      newMesas.push({ id: uid(), nombre: `${prefix} ${i}`, capacidad: seats, forma, zona: '', guests: [] });
    }
    setMesas([...existing, ...newMesas]);
    closeQM();
    toast(`✅ ${n} mesas creadas`);
    refreshMesas();
  });

  // Mesas sidebar tabs and search
  document.getElementById('mesasSidebar')?.addEventListener('click', e => {
    const tab = e.target.closest('.ms-tab');
    if (!tab) return;
    document.querySelectorAll('.ms-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    refreshMesasSidebar();
  });
  document.getElementById('mesasSideSearch')?.addEventListener('input', refreshMesasSidebar);
  const closeMesa = () => document.getElementById('mesaModal').classList.add('hidden');
  document.getElementById('mesaModalClose').addEventListener('click',  closeMesa);
  document.getElementById('mesaModalCancel').addEventListener('click', closeMesa);
  document.getElementById('mesaModal').addEventListener('click', e => { if (e.target.id==='mesaModal') closeMesa(); });
  document.getElementById('mesaModalForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('ms-id').value;
    const checked = Array.from(document.querySelectorAll('#mesaGuestsList input:checked')).map(c => c.value);
    const mesa = {
      id: id || uid(),
      nombre: document.getElementById('ms-nombre').value.trim(),
      capacidad: parseInt(document.getElementById('ms-capacidad').value) || 8,
      forma: document.getElementById('ms-forma').value,
      zona: document.getElementById('ms-zona').value.trim(),
      guests: checked,
    };
    const mesas = getMesas();
    if (id) setMesas(mesas.map(m => m.id===id ? mesa : m));
    else setMesas([...mesas, mesa]);
    closeMesa();
    toast(id ? '✅ Mesa actualizada' : '✅ Mesa creada');
    refreshMesas();
  });

  /* Mapa */
  document.getElementById('resetMapaBtn')?.addEventListener('click', () => {
    if (!confirm('¿Restablecer posiciones del mapa?')) return;
    localStorage.removeItem('boda_mapa_pos');
    refreshMapa();
    toast('🔄 Mapa restablecido');
  });

  /* Galería */
  const galeriaInput = document.getElementById('galeriaFileInput');
  document.getElementById('uploadGaleriaBtn').addEventListener('click', () => galeriaInput.click());
  galeriaInput.addEventListener('change', () => {
    if (galeriaInput.files.length) handleGaleriaUpload(Array.from(galeriaInput.files));
    galeriaInput.value = '';
  });
  const galDropZone = document.getElementById('galeriaDropZone');
  galDropZone.addEventListener('click', () => galeriaInput.click());
  galDropZone.addEventListener('dragover', e => { e.preventDefault(); galDropZone.classList.add('galeria-upload-zone--drag'); });
  galDropZone.addEventListener('dragleave', () => galDropZone.classList.remove('galeria-upload-zone--drag'));
  galDropZone.addEventListener('drop', e => {
    e.preventDefault();
    galDropZone.classList.remove('galeria-upload-zone--drag');
    if (e.dataTransfer.files.length) handleGaleriaUpload(Array.from(e.dataTransfer.files));
  });
  document.getElementById('lightboxClose').addEventListener('click', () => document.getElementById('galeriaLightbox').classList.add('hidden'));
  document.getElementById('galeriaLightbox').addEventListener('click', e => {
    if (e.target.id==='galeriaLightbox') document.getElementById('galeriaLightbox').classList.add('hidden');
  });

  /* Presupuesto */
  document.getElementById('addPresupuestoBtn').addEventListener('click', () => openPresupuestoModal(null));
  const closePresupuesto = () => document.getElementById('presupuestoModal').classList.add('hidden');
  document.getElementById('presupuestoModalClose').addEventListener('click',  closePresupuesto);
  document.getElementById('presupuestoModalCancel').addEventListener('click', closePresupuesto);
  document.getElementById('presupuestoModal').addEventListener('click', e => { if (e.target.id==='presupuestoModal') closePresupuesto(); });
  document.getElementById('presupuestoModalForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('pr-id').value;
    const item = {
      id: id || uid(),
      categoria: document.getElementById('pr-categoria').value,
      concepto:  document.getElementById('pr-concepto').value.trim(),
      estimado:  parseFloat(document.getElementById('pr-estimado').value) || 0,
      real:      parseFloat(document.getElementById('pr-real').value) || 0,
      pagado:    document.getElementById('pr-pagado').value,
      notas:     document.getElementById('pr-notas').value.trim(),
    };
    const list = getPresupuesto();
    if (id) setPresupuesto(list.map(x => x.id===id ? item : x));
    else setPresupuesto([...list, item]);
    closePresupuesto();
    toast(id ? '✅ Item actualizado' : '✅ Item agregado');
    refreshPresupuesto();
  });

  /* Proveedores */
  document.getElementById('addProveedorBtn').addEventListener('click', () => openProveedorModal(null));
  const closeProveedor = () => document.getElementById('proveedorModal').classList.add('hidden');
  document.getElementById('proveedorModalClose').addEventListener('click',  closeProveedor);
  document.getElementById('proveedorModalCancel').addEventListener('click', closeProveedor);
  document.getElementById('proveedorModal').addEventListener('click', e => { if (e.target.id==='proveedorModal') closeProveedor(); });
  document.getElementById('proveedorModalForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('pv-id').value;
    const prov = {
      id:       id || uid(),
      nombre:   document.getElementById('pv-nombre').value.trim(),
      tipo:     document.getElementById('pv-tipo').value,
      contacto: document.getElementById('pv-contacto').value.trim(),
      telefono: document.getElementById('pv-telefono').value.trim(),
      email:    document.getElementById('pv-email').value.trim(),
      web:      document.getElementById('pv-web').value.trim(),
      estado:   document.getElementById('pv-estado').value,
      pago:     document.getElementById('pv-pago').value,
      monto:    parseFloat(document.getElementById('pv-monto').value) || 0,
      fecha:    document.getElementById('pv-fecha').value,
      notas:    document.getElementById('pv-notas').value.trim(),
    };
    const list = getProveedores();
    if (id) setProveedores(list.map(x => x.id===id ? prov : x));
    else setProveedores([...list, prov]);
    closeProveedor();
    toast(id ? '✅ Proveedor actualizado' : '✅ Proveedor agregado');
    refreshProveedores();
  });

  switchView('guests');
}

/* ================================================================
   NUEVAS SECCIONES — DATOS + LÓGICA
   ================================================================ */

/* â”€â”€ Claves localStorage â”€â”€ */
const MESAS_KEY        = 'boda_mesas';
const MESAS_INIT_KEY   = 'boda_mesas_initialized';
const PRES_KEY         = 'boda_presupuesto';
const PROV_KEY         = 'boda_proveedores';
const GAL_META_KEY   = 'boda_galeria_meta';
const MAPA_POS_KEY   = 'boda_mapa_pos';

/* â”€â”€ Acceso a datos â”€â”€ */
function getMesas()        { try { return JSON.parse(localStorage.getItem(MESAS_KEY))||[]; }      catch{return[];} }
function setMesas(a)       { localStorage.setItem(MESAS_KEY, JSON.stringify(a)); }
function getPresupuesto()  { try { return JSON.parse(localStorage.getItem(PRES_KEY))||[]; }       catch{return[];} }
function setPresupuesto(a) { localStorage.setItem(PRES_KEY, JSON.stringify(a)); }
function getProveedores()  { try { return JSON.parse(localStorage.getItem(PROV_KEY))||[]; }       catch{return[];} }
function setProveedores(a) { localStorage.setItem(PROV_KEY, JSON.stringify(a)); }
function getGalMeta()      { try { return JSON.parse(localStorage.getItem(GAL_META_KEY))||[]; }   catch{return[];} }
function setGalMeta(a)     { localStorage.setItem(GAL_META_KEY, JSON.stringify(a)); }
function getMapaPos()      { try { return JSON.parse(localStorage.getItem(MAPA_POS_KEY))||{}; }   catch{return {};} }
function setMapaPos(o)     { localStorage.setItem(MAPA_POS_KEY, JSON.stringify(o)); }

/* â”€â”€ Galería: IndexedDB â”€â”€ */
const GAL_IDB   = 'bodaGaleria';
const GAL_STORE = 'images';
function openGalDB(cb) {
  const req = indexedDB.open(GAL_IDB, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(GAL_STORE, { keyPath: 'id' });
  req.onsuccess = e => cb(null, e.target.result);
  req.onerror   = e => cb(e.target.error);
}
function saveGalImage(id, file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    openGalDB((err, db) => {
      if (err) return cb(err);
      const tx = db.transaction(GAL_STORE, 'readwrite');
      tx.objectStore(GAL_STORE).put({ id, data: e.target.result, type: file.type });
      tx.oncomplete = () => cb(null);
      tx.onerror    = ev => cb(ev.target.error);
    });
  };
  reader.onerror = () => cb(new Error('Error leyendo imagen'));
  reader.readAsDataURL(file);
}
function getGalImage(id, cb) {
  openGalDB((err, db) => {
    if (err) return cb(null);
    const tx  = db.transaction(GAL_STORE, 'readonly');
    const req = tx.objectStore(GAL_STORE).get(id);
    req.onsuccess = e => cb(e.target.result ? e.target.result.data : null);
    req.onerror   = () => cb(null);
  });
}
function deleteGalImage(id, cb) {
  openGalDB((err, db) => {
    if (err) return cb && cb();
    const tx = db.transaction(GAL_STORE, 'readwrite');
    tx.objectStore(GAL_STORE).delete(id);
    tx.oncomplete = () => cb && cb();
  });
}

/* â”€â”€ Seed demo data â”€â”€ */
function seedMesas() {
  if (localStorage.getItem(MESAS_INIT_KEY)) return;
  localStorage.setItem(MESAS_INIT_KEY, '1');
  const guests = getGuests();
  const getIds = fam => guests.filter(g => g.familia === fam).map(g => g.id);
  setMesas([
    {id:uid(),nombre:'Mesa 1',    capacidad:8,forma:'redonda',    zona:'Familia',   guests:getIds('Familia García')},
    {id:uid(),nombre:'Mesa 2',    capacidad:8,forma:'redonda',    zona:'Familia',   guests:getIds('Familia López')},
    {id:uid(),nombre:'Mesa 3',    capacidad:8,forma:'redonda',    zona:'Amigos',    guests:getIds('Amigos del colegio')},
    {id:uid(),nombre:'Mesa 4',    capacidad:8,forma:'redonda',    zona:'Amigos',    guests:getIds('Amigos universidad')},
    {id:uid(),nombre:'Mesa 5',    capacidad:8,forma:'redonda',    zona:'Trabajo',   guests:getIds('Trabajo Sofía')},
    {id:uid(),nombre:'Mesa VIP',  capacidad:6,forma:'rectangular',zona:'Novios',    guests:[]},
  ]);
}
function seedPresupuesto() {
  if (getPresupuesto().length) return;
  setPresupuesto([
    {id:uid(),categoria:'Venue',       concepto:'Alquiler Casa Hacienda Mamacona',estimado:8000,real:7500,pagado:'parcial', notas:'50% anticipo pagado'},
    {id:uid(),categoria:'Catering',    concepto:'Banquete 5 tiempos + bebidas',   estimado:6000,real:5800,pagado:'parcial', notas:'Menú degustado y aprobado'},
    {id:uid(),categoria:'Fotografía',  concepto:'FotÓgrafo + videÓgrafo',          estimado:3000,real:2800,pagado:'completo',notas:'Incluye Álbum digital'},
    {id:uid(),categoria:'Música',      concepto:'DJ + equipo de sonido',           estimado:1500,real:1400,pagado:'pendiente',notas:''},
    {id:uid(),categoria:'Flores',      concepto:'Arreglos florales y bouquet',     estimado:1200,real:1100,pagado:'pendiente',notas:'Rosas blancas y peonías'},
    {id:uid(),categoria:'Vestimenta',  concepto:'Vestido de novia',                estimado:2500,real:2200,pagado:'completo', notas:'Diseñadora Valentina Ruiz'},
    {id:uid(),categoria:'Vestimenta',  concepto:'Traje del novio',                 estimado:800, real:750, pagado:'completo', notas:''},
    {id:uid(),categoria:'Decoración',  concepto:'Centros de mesa y arcos florales',estimado:2000,real:1800,pagado:'pendiente',notas:''},
    {id:uid(),categoria:'Invitaciones',concepto:'Tarjetas e impresiÓn',            estimado:400, real:380, pagado:'completo', notas:'80 invitaciones premium'},
    {id:uid(),categoria:'Transporte',  concepto:'Limusina para novios',            estimado:600, real:550, pagado:'pendiente',notas:''},
  ]);
}
function seedProveedores() {
  if (getProveedores().length) return;
  setProveedores([
    {id:uid(),nombre:'Casa Hacienda Mamacona',tipo:'Venue',       contacto:'Jorge Ríos',   telefono:'555-2001',email:'info@mamacona.com',    web:'@haciendamamacona',estado:'contratado',pago:'parcial', monto:7500,fecha:'2027-02-14',notas:'Incluye jardines, salón y estacionamiento'},
    {id:uid(),nombre:'Catering Delicias SA',  tipo:'Catering',    contacto:'Chef Roberto', telefono:'555-2002',email:'catering@delicias.com', web:'www.delicias.com',  estado:'contratado',pago:'parcial', monto:5800,fecha:'2027-02-14',notas:'Menú aprobado en degustaciÓn Nov 2026'},
    {id:uid(),nombre:'Foto & Arte Studio',    tipo:'Fotografía',  contacto:'Ana Vargas',   telefono:'555-2003',email:'ana@fotoyarte.com',     web:'@fotoyarte',         estado:'contratado',pago:'completo',monto:2800,fecha:'2027-02-14',notas:'Álbum digital + 2 lienzos'},
    {id:uid(),nombre:'DJ Maestro Sounds',     tipo:'Música / DJ', contacto:'DJ Carlo',     telefono:'555-2004',email:'djcarlo@mail.com',      web:'@djcarlo',           estado:'contratado',pago:'pendiente',monto:1400,fecha:'2027-02-14',notas:'Sonido + luces incluidos'},
    {id:uid(),nombre:'Flores & Sueños',       tipo:'Flores',      contacto:'María Peña',   telefono:'555-2005',email:'flores@suenos.com',     web:'@floresysuenos',     estado:'contratado',pago:'pendiente',monto:1100,fecha:'2027-02-14',notas:'Rosas blancas, peonías y eucalipto'},
    {id:uid(),nombre:'Pastelería Le Gâteau',  tipo:'Pastelería',  contacto:'Chef Sophie',  telefono:'555-2006',email:'legateau@mail.com',     web:'@legateauperu',      estado:'cotizando', pago:'pendiente',monto:800, fecha:'2027-02-14',notas:'Pastel 5 pisos, sabor vainilla y maracuyÁ'},
  ]);
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function refreshDashboard() {
  const container = document.getElementById('dashboardContent');
  if (!container) return;
  const guests  = getGuests();
  const stats   = calcStats(guests);
  const wDate   = getWeddingDate();
  const diff    = wDate - Date.now();
  const daysLeft = diff > 0 ? Math.ceil(diff / 86400000) : 0;
  const pctConf  = guests.length ? Math.round(stats.confirmed / guests.length * 100) : 0;
  const recent   = [...guests].sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0)).slice(0, 6);
  const mesas    = getMesas();
  const presup   = getPresupuesto();
  const totalEst = presup.reduce((s,x) => s + x.estimado, 0);
  const totalReal= presup.reduce((s,x) => s + x.real, 0);
  const provContr= getProveedores().filter(p => p.estado === 'contratado').length;

  container.innerHTML = `
    <div class="dash-kpi-grid">
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--gold"><i class="fa-solid fa-users"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${stats.total}</div><div class="dash-kpi-label">Invitados totales</div></div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--green"><i class="fa-solid fa-circle-check"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${stats.confirmed}</div><div class="dash-kpi-label">Confirmados</div></div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--amber"><i class="fa-solid fa-clock"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${stats.pending}</div><div class="dash-kpi-label">Pendientes</div></div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--red"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${stats.rejected}</div><div class="dash-kpi-label">No asisten</div></div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--blue"><i class="fa-solid fa-person-walking"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${stats.totalPersons}</div><div class="dash-kpi-label">Personas totales</div></div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-icon dash-kpi-icon--purple"><i class="fa-solid fa-hourglass-half"></i></div>
        <div class="dash-kpi-body"><div class="dash-kpi-num">${daysLeft}</div><div class="dash-kpi-label">Días para la boda</div></div>
      </div>
    </div>

    <div class="dash-row">
      <div class="card">
        <h3 class="card-title"><i class="fa-solid fa-chart-pie" style="color:var(--gold)"></i> ConfirmaciÓn</h3>
        <p style="font-size:2rem;font-weight:700;color:var(--text-main);margin:8px 0 4px">${pctConf}%</p>
        <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:10px">${stats.confirmed} de ${stats.total} han respondido</p>
        <div class="dash-progress-bar-wrap">
          <div class="dash-progress-bar" style="width:${pctConf}%"></div>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fa-solid fa-wallet" style="color:var(--gold)"></i> Presupuesto</h3>
        <p style="font-size:2rem;font-weight:700;color:var(--text-main);margin:8px 0 2px">$${fmtMoney(totalReal)}</p>
        <p style="font-size:.78rem;color:var(--text-soft);margin-bottom:4px">Real Â· Estimado: $${fmtMoney(totalEst)}</p>
        <p style="font-size:.8rem;color:${totalReal<=totalEst?'#4caf50':'#f44336'};font-weight:600">
          ${totalReal<=totalEst?'✓ Dentro del presupuesto':'▲ Presupuesto excedido'} $${fmtMoney(Math.abs(totalReal-totalEst))}
        </p>
      </div>
    </div>

    <div class="dash-row">
      <div class="card">
        <h3 class="card-title"><i class="fa-solid fa-chair" style="color:var(--gold)"></i> Mesas &mdash; ${mesas.length} configuradas</h3>
        <p style="font-size:.82rem;color:var(--text-soft);margin:8px 0 12px">
          ${mesas.reduce((s,m)=>s+m.guests.length,0)} invitados asignados de ${mesas.reduce((s,m)=>s+m.capacidad,0)} lugares totales
        </p>
        <button class="dash-quick-btn" onclick="switchView('mesas')"><i class="fa-solid fa-chair"></i> Gestionar mesas</button>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fa-solid fa-handshake" style="color:var(--gold)"></i> Proveedores</h3>
        <p style="font-size:.82rem;color:var(--text-soft);margin:8px 0 12px">
          <strong>${provContr}</strong> contratados de <strong>${getProveedores().length}</strong> en total
        </p>
        <button class="dash-quick-btn" onclick="switchView('proveedores')"><i class="fa-solid fa-handshake"></i> Ver proveedores</button>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title"><i class="fa-solid fa-bolt" style="color:var(--gold)"></i> Acciones R&aacute;pidas</h3>
      <div class="dash-quick-actions">
        <button class="dash-quick-btn" onclick="switchView('guests');setTimeout(()=>openGuestModal(null),80)"><i class="fa-solid fa-user-plus"></i> Agregar invitado</button>
        <button class="dash-quick-btn" onclick="switchView('mesas');setTimeout(()=>openMesaModal(null),80)"><i class="fa-solid fa-chair"></i> Nueva mesa</button>
        <button class="dash-quick-btn" onclick="switchView('presupuesto');setTimeout(()=>openPresupuestoModal(null),80)"><i class="fa-solid fa-wallet"></i> Agregar gasto</button>
        <button class="dash-quick-btn" onclick="switchView('cronograma');setTimeout(()=>document.getElementById('addEventoBtn')?.click(),80)"><i class="fa-solid fa-calendar-plus"></i> Nuevo evento</button>
        <button class="dash-quick-btn" onclick="switchView('galeria')"><i class="fa-solid fa-images"></i> Ir a galería</button>
        <button class="dash-quick-btn" onclick="switchView('stats')"><i class="fa-solid fa-chart-bar"></i> Ver estadísticas</button>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h3 class="card-title"><i class="fa-solid fa-clock-rotate-left" style="color:var(--gold)"></i> Actividad Reciente</h3>
      <ul class="dash-activity">
        ${recent.length ? recent.map(g => `
          <li class="dash-activity-item">
            <span class="dash-activity-dot dash-activity-dot--${g.estado}"></span>
            <span><strong>${esc(g.nombre)} ${esc(g.apellido||'')}</strong> &mdash; ${estadoLabel(g.estado)}</span>
            <span style="margin-left:auto;font-size:.72rem;color:var(--text-soft)">${fmtDate(g.fecha)}</span>
          </li>`).join('') : '<li class="dash-activity-item" style="color:var(--text-soft)">Sin actividad aún.</li>'}
      </ul>
    </div>`;
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ============================================================
   MESAS
   ============================================================ */
window.openMesaModal = function(id) {
  seedMesas();
  const modal = document.getElementById('mesaModal');
  if (!modal) return;
  const mesa = id ? getMesas().find(m => m.id === id) : null;
  setText('mesaModalTitle', mesa ? 'Editar Mesa' : 'Nueva Mesa');
  document.getElementById('ms-id').value        = mesa?.id || '';
  document.getElementById('ms-nombre').value    = mesa?.nombre || '';
  document.getElementById('ms-capacidad').value = mesa?.capacidad || 8;
  document.getElementById('ms-forma').value     = mesa?.forma || 'redonda';
  document.getElementById('ms-zona').value      = mesa?.zona || '';
  const assigned = mesa?.guests || [];
  const guests   = getGuests().filter(g => g.estado !== 'rechazado');
  const listEl   = document.getElementById('mesaGuestsList');
  listEl.innerHTML = guests.length
    ? guests.map(g => `
        <label class="mesa-assign-row">
          <input type="checkbox" value="${g.id}" ${assigned.includes(g.id) ? 'checked' : ''} />
          <span>${esc(g.nombre)} ${esc(g.apellido || '')} <span style="color:var(--text-soft);font-size:.72rem">(${estadoLabel(g.estado)})</span></span>
        </label>`).join('')
    : '<p style="color:var(--text-soft);font-size:.8rem;padding:6px">No hay invitados disponibles.</p>';
  modal.classList.remove('hidden');
};

function refreshMesas() {
  seedMesas();
  const mesas  = getMesas();
  const grid   = document.getElementById('mesasGrid');
  const empty  = document.getElementById('mesasEmpty');
  if (!grid) return;
  if (!mesas.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  const guests    = getGuests();
  const shapeCls  = { redonda: 'mesa-shape--round', rectangular: 'mesa-shape--rect', cuadrada: 'mesa-shape--square' };
  const CIRC = 163.36; // 2π × r26

  grid.innerHTML = mesas.map(m => {
    const assigned = m.guests || [];
    const cap   = m.capacidad || 8;
    const pct   = Math.min(100, assigned.length / cap * 100);
    const offset = (CIRC * (1 - pct / 100)).toFixed(2);
    const ringCls = pct >= 100 ? 'mesa-ring__fill--full' : pct >= 75 ? 'mesa-ring__fill--near' : '';

    const gObjs = assigned.map(gid => guests.find(x => x.id === gid)).filter(Boolean);
    const SHOW  = 4;
    const guestSection = gObjs.length
      ? `<div class="mesa-card__guests">${
          gObjs.slice(0, SHOW).map(g => {
            const ini = ((g.nombre[0] || '') + (g.apellido?.[0] || '')).toUpperCase();
            const isPending = g.estado !== 'confirmado';
            return `<div class="mesa-chip${isPending ? ' mesa-chip--pending' : ''}"><span class="mesa-chip__av${isPending ? ' mesa-chip__av--pending' : ''}">${ini}</span>${esc((g.nombre + ' ' + (g.apellido || '')).trim())}</div>`;
          }).join('') +
          (gObjs.length > SHOW ? `<div class="mesa-chip mesa-chip--more">+${gObjs.length - SHOW} más</div>` : '')
        }</div>`
      : '<p class="mesa-no-guests">Sin invitados asignados</p>';

    return `<div class="mesa-card">
      <div class="mesa-card__hd">
        <div class="mesa-shape ${shapeCls[m.forma] || 'mesa-shape--round'}"></div>
        <div class="mesa-card__info">
          <div class="mesa-card__name">${esc(m.nombre)}</div>
          <span class="mesa-zona-tag">${esc(m.zona) || 'General'}</span>
        </div>
        <span class="mesa-cap"><i class="fa-solid fa-chair"></i>${cap}</span>
      </div>
      <div class="mesa-card__mid">
        <div class="mesa-ring">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <circle class="mesa-ring__bg"   cx="32" cy="32" r="26"/>
            <circle class="mesa-ring__fill ${ringCls}" cx="32" cy="32" r="26"
              stroke-dasharray="${CIRC.toFixed(2)}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="mesa-ring__lbl">
            <span class="mesa-ring__num">${assigned.length}</span>
            <span class="mesa-ring__cap">/${cap}</span>
          </div>
        </div>
        <div class="mesa-stats">
          <div class="mesa-stat-row"><span class="mesa-stat-row__lbl">Asignados</span><span class="mesa-stat-row__val">${assigned.length}</span></div>
          <div class="mesa-stat-row"><span class="mesa-stat-row__lbl">Capacidad</span><span class="mesa-stat-row__val">${cap}</span></div>
          <div class="mesa-stat-row"><span class="mesa-stat-row__lbl">Disponibles</span><span class="mesa-stat-row__val">${cap - assigned.length}</span></div>
        </div>
      </div>
      ${guestSection}
      <div class="mesa-card__ft">
        <button class="mesa-btn-edit" onclick="openMesaModal('${m.id}')"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
        <button class="mesa-btn-del"  onclick="deleteMesa('${m.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`;
  }).join('');
  refreshMesasSidebar();
}

window.deleteMesa = function(id) {
  if (!confirm('¿Eliminar esta mesa?')) return;
  setMesas(getMesas().filter(m => m.id !== id));
  toast('🗑️ Mesa eliminada');
  refreshMesas();
};

function refreshMesasSidebar() {
  const listEl = document.getElementById('mesasGuestList');
  if (!listEl) return;
  const guests = getGuests().filter(g => g.estado !== 'rechazado');
  const mesas  = getMesas();
  const assignedIds = new Set(mesas.flatMap(m => m.guests || []));
  const mesaOf = {};
  mesas.forEach(m => (m.guests || []).forEach(gid => { mesaOf[gid] = m.nombre; }));

  const activeTab = document.querySelector('.ms-tab.active')?.dataset?.tab || 'all';
  const q = (document.getElementById('mesasSideSearch')?.value || '').toLowerCase();

  let filtered = guests;
  if (activeTab === 'sin') filtered = filtered.filter(g => !assignedIds.has(g.id));
  if (q) filtered = filtered.filter(g =>
    (g.nombre + ' ' + (g.apellido || '')).toLowerCase().includes(q)
  );

  if (!filtered.length) { listEl.innerHTML = '<p style="font-size:.72rem;color:var(--text-soft);padding:8px">Sin resultados</p>'; return; }

  listEl.innerHTML = filtered.map(g => {
    const ini = ((g.nombre[0] || '') + (g.apellido?.[0] || '')).toUpperCase();
    const mesa = mesaOf[g.id];
    const assigned = assignedIds.has(g.id);
    return `<div class="mg-row mg-row--${g.estado}${assigned ? ' mg-row--asignado' : ''}">
      <div class="mg-av mg-av--${g.estado}">${ini}</div>
      <div class="mg-info">
        <div class="mg-name">${esc((g.nombre + ' ' + (g.apellido || '')).trim())}</div>
        <div class="mg-status">${g.estado === 'confirmado' ? '✓ Confirmado' : '⏳ Pendiente'}</div>
      </div>
      ${mesa ? `<span class="mg-mesa-tag">${esc(mesa)}</span>` : ''}
    </div>`;
  }).join('');
}

/* ============================================================
   MAPA DEL LOCAL
   ============================================================ */
function refreshMapa() {
  seedMesas();
  const stage  = document.getElementById('mapaStage');
  if (!stage) return;
  const mesas  = getMesas();
  const guests = getGuests();
  const pos    = getMapaPos();

  const defaultPos = (i, m) => {
    const cols = 3;
    const row  = Math.floor(i / cols);
    const col  = i % cols;
    return { x: 60 + col * 200, y: 60 + row * 160 };
  };

  stage.querySelectorAll('.mapa-table-node').forEach(n => n.remove());

  mesas.forEach((m, i) => {
    const assigned = (m.guests || []).length;
    const cap = m.capacidad || 8;
    const ratio = assigned / cap;
    const fillClass  = ratio >= 1 ? '--full' : ratio > 0 ? '--partial' : '--free';
    const shapeClass = m.forma === 'rectangular' ? 'mapa-table-inner--rect' : m.forma === 'cuadrada' ? 'mapa-table-inner--cuad' : '';
    const saved = pos[m.id] || defaultPos(i, m);

    const node = document.createElement('div');
    node.className   = 'mapa-table-node';
    node.dataset.id  = m.id;
    node.style.cssText = `left:${saved.x}px;top:${saved.y}px;`;
    node.innerHTML = `
      <div class="mapa-table-inner ${shapeClass} mapa-table-inner${fillClass}">
        <span class="mapa-table-name">${esc(m.nombre)}</span>
        <span class="mapa-table-count">${assigned}/${cap}</span>
      </div>`;
    makeDraggable(node, m.id);
    stage.appendChild(node);
  });
}

function makeDraggable(el, id) {
  let startX, startY, origX, origY, dragging = false;
  const onStart = e => {
    const ev = e.touches ? e.touches[0] : e;
    startX = ev.clientX; startY = ev.clientY;
    origX  = parseInt(el.style.left) || 0;
    origY  = parseInt(el.style.top)  || 0;
    dragging = true;
    el.style.zIndex = '10';
  };
  const onMove = e => {
    if (!dragging) return;
    const ev = e.touches ? e.touches[0] : e;
    el.style.left = Math.max(0, origX + ev.clientX - startX) + 'px';
    el.style.top  = Math.max(0, origY + ev.clientY - startY) + 'px';
  };
  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    el.style.zIndex = '';
    const pos = getMapaPos();
    pos[id] = { x: parseInt(el.style.left), y: parseInt(el.style.top) };
    setMapaPos(pos);
  };
  el.addEventListener('mousedown',  onStart);
  el.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('mousemove',  onMove);
  document.addEventListener('touchmove',  onMove, { passive: true });
  document.addEventListener('mouseup',    onEnd);
  document.addEventListener('touchend',   onEnd);
}

/* ============================================================
   GALERÍA
   ============================================================ */
function refreshGaleria() {
  const meta  = getGalMeta();
  const grid  = document.getElementById('galeriaGrid');
  const empty = document.getElementById('galeriaEmpty');
  if (!grid) return;
  if (!meta.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  grid.innerHTML = '';
  meta.forEach(item => {
    getGalImage(item.id, dataUrl => {
      if (!dataUrl) return;
      const div = document.createElement('div');
      div.className  = 'galeria-item';
      div.dataset.id = item.id;
      div.innerHTML  = `
        <img src="${dataUrl}" alt="${esc(item.caption || item.name)}" loading="lazy" />
        ${item.caption ? `<div class="galeria-item__caption">${esc(item.caption)}</div>` : ''}
        <div class="galeria-item__overlay">
          <button class="galeria-item__btn" title="Ver" onclick="openLightbox('${item.id}')">
            <i class="fa-solid fa-expand"></i>
          </button>
          <button class="galeria-item__btn galeria-item__btn--del" title="Eliminar" onclick="deleteGaleriaItem('${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`;
      grid.appendChild(div);
    });
  });
}

function handleGaleriaUpload(files) {
  const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 10485760);
  if (!valid.length) { toast('⚠️ Solo imÁgenes hasta 10 MB'); return; }
  let saved = 0;
  valid.forEach(file => {
    const id   = uid();
    const meta = { id, name: file.name, caption: '', date: new Date().toISOString() };
    saveGalImage(id, file, err => {
      if (err) { toast('Error: ' + err.message); return; }
      const metas = getGalMeta();
      metas.push(meta);
      setGalMeta(metas);
      saved++;
      if (saved === valid.length) { toast('✅ ' + saved + ' imagen(es) guardada(s)'); refreshGaleria(); }
    });
  });
}

window.openLightbox = function(id) {
  getGalImage(id, dataUrl => {
    if (!dataUrl) return;
    const meta = getGalMeta().find(m => m.id === id);
    document.getElementById('lightboxImg').src              = dataUrl;
    document.getElementById('lightboxCaption').textContent  = meta?.caption || meta?.name || '';
    document.getElementById('galeriaLightbox').classList.remove('hidden');
  });
};

window.deleteGaleriaItem = function(id) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  deleteGalImage(id, () => {
    setGalMeta(getGalMeta().filter(m => m.id !== id));
    toast('🗑️ Imagen eliminada');
    refreshGaleria();
  });
};

/* ============================================================
   PRESUPUESTO
   ============================================================ */
window.openPresupuestoModal = function(id) {
  seedPresupuesto();
  const modal = document.getElementById('presupuestoModal');
  if (!modal) return;
  const item = id ? getPresupuesto().find(x => x.id === id) : null;
  setText('presupuestoModalTitle', item ? 'Editar Item' : 'Nuevo Item');
  document.getElementById('pr-id').value        = item?.id || '';
  document.getElementById('pr-categoria').value = item?.categoria || 'Venue';
  document.getElementById('pr-concepto').value  = item?.concepto || '';
  document.getElementById('pr-estimado').value  = item?.estimado || '';
  document.getElementById('pr-real').value      = item?.real || '';
  document.getElementById('pr-pagado').value    = item?.pagado || 'pendiente';
  document.getElementById('pr-notas').value     = item?.notas || '';
  modal.classList.remove('hidden');
};

function refreshPresupuesto() {
  seedPresupuesto();
  const list  = getPresupuesto();
  const body  = document.getElementById('presupuestoBody');
  const empty = document.getElementById('presupuestoEmpty');
  const sumEl = document.getElementById('presupuestoSummary');
  const totalEst  = list.reduce((s, x) => s + x.estimado, 0);
  const totalReal = list.reduce((s, x) => s + x.real, 0);
  const diff      = totalReal - totalEst;
  const pagados   = list.filter(x => x.pagado === 'completo').reduce((s, x) => s + x.real, 0);
  if (sumEl) sumEl.innerHTML = `
    <div class="pres-kpi"><div class="pres-kpi__label">Total estimado</div><div class="pres-kpi__num pres-kpi__num--gold">$${fmtMoney(totalEst)}</div></div>
    <div class="pres-kpi"><div class="pres-kpi__label">Total real</div><div class="pres-kpi__num">$${fmtMoney(totalReal)}</div></div>
    <div class="pres-kpi"><div class="pres-kpi__label">Diferencia</div><div class="pres-kpi__num ${diff <= 0 ? 'pres-kpi__num--green' : 'pres-kpi__num--red'}">${diff <= 0 ? '✓' : '▲'} $${fmtMoney(Math.abs(diff))}</div></div>
    <div class="pres-kpi"><div class="pres-kpi__label">Ya pagado</div><div class="pres-kpi__num pres-kpi__num--green">$${fmtMoney(pagados)}</div></div>`;
  if (!body) return;
  if (!list.length) { body.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  const catEmoji = {Venue:'🏛️',Catering:'🍽️','Fotografía':'📸','Música':'🎵',Flores:'💐',Vestimenta:'👗',Transporte:'🚗','Decoración':'🎀',Invitaciones:'💌','Luna de Miel':'✈️',Otros:'📦'};
  body.innerHTML = list.map(x => {
    const d = x.real - x.estimado;
    return `<tr>
      <td><span class="cat-badge">${catEmoji[x.categoria] || '📦'} ${esc(x.categoria)}</span></td>
      <td>${esc(x.concepto)}</td>
      <td>$${fmtMoney(x.estimado)}</td>
      <td>$${fmtMoney(x.real)}</td>
      <td style="color:${d > 0 ? '#f44336' : '#4caf50'};font-weight:600">${d > 0 ? '▲' : '✓'} $${fmtMoney(Math.abs(d))}</td>
      <td><span class="pago-badge pago-badge--${x.pagado || 'pendiente'}">${{pendiente:'⏳ Pendiente',parcial:'🔄 Parcial',completo:'✅ Completo'}[x.pagado] || x.pagado}</span></td>
      <td style="font-size:.78rem;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.notas || '—')}</td>
      <td><div class="action-btns">
        <button class="action-btn action-btn--edit" onclick="openPresupuestoModal('${x.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn action-btn--del"  onclick="deletePresupuestoItem('${x.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('');
}

window.deletePresupuestoItem = function(id) {
  if (!confirm('¿Eliminar este item?')) return;
  setPresupuesto(getPresupuesto().filter(x => x.id !== id));
  toast('🗑️ Item eliminado');
  refreshPresupuesto();
};

/* ============================================================
   PROVEEDORES
   ============================================================ */
window.openProveedorModal = function(id) {
  seedProveedores();
  const modal = document.getElementById('proveedorModal');
  if (!modal) return;
  const prov = id ? getProveedores().find(x => x.id === id) : null;
  setText('proveedorModalTitle', prov ? 'Editar Proveedor' : 'Nuevo Proveedor');
  document.getElementById('pv-id').value        = prov?.id || '';
  document.getElementById('pv-nombre').value    = prov?.nombre || '';
  document.getElementById('pv-tipo').value      = prov?.tipo || 'Venue';
  document.getElementById('pv-contacto').value  = prov?.contacto || '';
  document.getElementById('pv-telefono').value  = prov?.telefono || '';
  document.getElementById('pv-email').value     = prov?.email || '';
  document.getElementById('pv-web').value       = prov?.web || '';
  document.getElementById('pv-estado').value    = prov?.estado || 'cotizando';
  document.getElementById('pv-pago').value      = prov?.pago || 'pendiente';
  document.getElementById('pv-monto').value     = prov?.monto || '';
  document.getElementById('pv-fecha').value     = prov?.fecha || '';
  document.getElementById('pv-notas').value     = prov?.notas || '';
  modal.classList.remove('hidden');
};

function refreshProveedores() {
  seedProveedores();
  const list  = getProveedores();
  const grid  = document.getElementById('proveedoresGrid');
  const empty = document.getElementById('proveedoresEmpty');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  const tipoEmoji = {Venue:'🏛️',Catering:'🍽️','Fotografía':'📸',Video:'🎥','Música / DJ':'🎵',Flores:'💐',Vestimenta:'👗',Transporte:'🚗','Decoración':'🎀','Pastelería':'🎂',Maquillaje:'💄',Otros:'📦'};
  const estadoLbl = {cotizando:'🔍 Cotizando',contratado:'✅ Contratado',cancelado:'❌ Cancelado'};
  const pagoLbl   = {pendiente:'⏳ Pendiente',parcial:'🔄 Anticipo',completo:'💚 Completo'};
  grid.innerHTML = list.map(p => `
    <div class="proveedor-card">
      <div class="proveedor-card__head">
        <div class="proveedor-card__icon">${tipoEmoji[p.tipo] || '📦'}</div>
        <div>
          <div class="proveedor-card__name">${esc(p.nombre)}</div>
          <div class="proveedor-card__tipo">${esc(p.tipo || 'Otros')}</div>
        </div>
      </div>
      <div class="proveedor-card__badges">
        <span class="proveedor-estado proveedor-estado--${p.estado || 'cotizando'}">${estadoLbl[p.estado] || p.estado}</span>
        <span class="pago-badge pago-badge--${p.pago || 'pendiente'}">${pagoLbl[p.pago] || p.pago}</span>
      </div>
      <div class="proveedor-card__contact">
        ${p.contacto ? '<span><i class="fa-solid fa-user" style="width:14px;color:var(--gold)"></i> ' + esc(p.contacto) + '</span>' : ''}
        ${p.telefono ? '<span><i class="fa-solid fa-phone" style="width:14px;color:var(--gold)"></i> ' + esc(p.telefono) + '</span>' : ''}
        ${p.email    ? '<a href="mailto:' + esc(p.email) + '"><i class="fa-solid fa-envelope" style="width:14px"></i> ' + esc(p.email) + '</a>' : ''}
      </div>
      ${p.monto ? '<div class="proveedor-card__monto"><i class="fa-solid fa-tag" style="color:var(--gold);margin-right:5px"></i> $' + fmtMoney(p.monto) + '</div>' : ''}
      ${p.notas ? '<p style="font-size:.76rem;color:var(--text-soft);margin-bottom:10px;font-style:italic">' + esc(p.notas) + '</p>' : ''}
      <div class="proveedor-card__actions">
        <button class="prov-btn-edit" onclick="openProveedorModal('${p.id}')"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
        <button class="prov-btn-del"  onclick="deleteProveedor('${p.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`).join('');
}

window.deleteProveedor = function(id) {
  if (!confirm('¿Eliminar este proveedor?')) return;
  setProveedores(getProveedores().filter(x => x.id !== id));
  toast('🗑️ Proveedor eliminado');
  refreshProveedores();
};

/* ============================================================
   MENSAJES
   ============================================================ */
function refreshMensajes() {
  const guests = getGuests().filter(g => g.mensaje && g.mensaje.trim());
  const grid   = document.getElementById('mensajesGrid');
  const empty  = document.getElementById('mensajesEmpty');
  if (!grid) return;
  if (!guests.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  grid.innerHTML = guests.map(g => {
    const initials = ((g.nombre || '?').charAt(0) + (g.apellido || '').charAt(0)).toUpperCase();
    return `<div class="mensaje-card">
      <div class="mensaje-card__quote">"</div>
      <p class="mensaje-card__text">${esc(g.mensaje)}</p>
      <div class="mensaje-card__footer">
        <div class="mensaje-card__avatar">${initials}</div>
        <div>
          <div class="mensaje-card__author">${esc(g.nombre)} ${esc(g.apellido || '')}</div>
          <div class="mensaje-card__date">${fmtDate(g.fecha)}</div>
        </div>
        <span class="mensaje-card__estado">
          <span class="status-badge status-badge--${g.estado}">${estadoLabel(g.estado)}</span>
        </span>
      </div>
    </div>`;
  }).join('');
}

/* ================================================================
   MESAS — ASIGNACIÓN INTELIGENTE + PDF
   ================================================================ */

window.autoAssignGuests = function() {
  const mesas  = getMesas();
  const guests = getGuests().filter(g => g.estado === 'confirmado');
  if (!mesas.length)  { toast('⚠️ Crea mesas primero'); return; }
  if (!guests.length) { toast('⚠️ No hay invitados confirmados'); return; }

  // Clear assignments
  const newMesas = mesas.map(m => ({ ...m, guests: [] }));

  // Group by family (familia field), sort largest first
  const famMap = {};
  guests.forEach(g => {
    const key = (g.familia && g.familia.trim()) ? g.familia.trim() : '__solo__' + g.id;
    if (!famMap[key]) famMap[key] = [];
    famMap[key].push(g);
  });
  const groups = Object.values(famMap).sort((a, b) => b.length - a.length);

  // Greedy assignment: place each group in the table with most remaining space that can fit them
  groups.forEach(group => {
    let target = newMesas
      .filter(m => (m.capacidad - m.guests.length) >= group.length)
      .sort((a, b) => (b.capacidad - b.guests.length) - (a.capacidad - a.guests.length))[0];
    if (!target) {
      // Split group
      group.forEach(g => {
        target = newMesas.filter(m => m.guests.length < m.capacidad)
          .sort((a, b) => (b.capacidad - b.guests.length) - (a.capacidad - a.guests.length))[0];
        if (target) target.guests.push(g.id);
      });
    } else {
      group.forEach(g => target.guests.push(g.id));
    }
  });

  setMesas(newMesas);
  toast('✅ Invitados asignados automÁticamente por familias');
  refreshMesas();
};

window.clearMesaAssignments = function() {
  if (!confirm('¿Quitar todas las asignaciones de invitados?')) return;
  setMesas(getMesas().map(m => ({ ...m, guests: [] })));
  toast('🗑️ Asignaciones eliminadas');
  refreshMesas();
};

window.exportMesasPDF = function() {
  const mesas  = getMesas();
  const guests = getGuests();
  const cfg    = getWeddingConfig();
  const bride  = cfg.bride || 'Sofía';
  const groom  = cfg.groom || 'Alejandro';
  const d      = getWeddingDate();
  const dateStr = d.toLocaleDateString('es-ES', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  const allAssigned = new Set(mesas.flatMap(m => m.guests || []));
  const unassigned  = guests.filter(g => g.estado === 'confirmado' && !allAssigned.has(g.id));

  const mesaRows = mesas.map(m => {
    const assigned = (m.guests || []).map(id => guests.find(g => g.id === id)).filter(Boolean);
    const rows = assigned.length
      ? assigned.map(g => {
          const total = 1 + (parseInt(g.acompanantes) || 0);
          return `<tr><td>${esc(g.nombre)} ${esc(g.apellido || '')}</td><td>${esc(g.grupo || '')}</td><td style="text-align:center">${total}</td><td>${esc(g.menu ? ({carne:'Res',pollo:'Pollo',pescado:'Pescado',vegetariano:'Vegeta.'}[g.menu] || g.menu) : '—')}</td></tr>`;
        }).join('')
      : '<tr><td colspan="4" style="color:#bbb;font-style:italic">Sin invitados asignados</td></tr>';
    return `
      <div class="mesa-block">
        <div class="mesa-block-header">
          <strong>${esc(m.nombre)}</strong>
          <span>${m.forma || 'Redonda'} Â· ${assigned.length}/${m.capacidad} lugares</span>
          ${m.zona ? `<span class="mesa-zona">${esc(m.zona)}</span>` : ''}
        </div>
        <table><thead><tr><th>Invitado</th><th>Grupo</th><th>Pers.</th><th>Menú</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>`;
  }).join('');

  const unassignedBlock = unassigned.length ? `
    <div class="mesa-block" style="border-color:#ff9800">
      <div class="mesa-block-header" style="background:rgba(255,152,0,.08)">
        <strong>⚠️ Sin asignar</strong>
        <span>${unassigned.length} invitado(s) confirmado(s) sin mesa</span>
      </div>
      <table><thead><tr><th>Invitado</th><th>Grupo</th><th>Pers.</th><th>Menú</th></tr></thead>
      <tbody>${unassigned.map(g => {
        const total = 1 + (parseInt(g.acompanantes) || 0);
        return `<tr><td>${esc(g.nombre)} ${esc(g.apellido || '')}</td><td>${esc(g.grupo || '')}</td><td style="text-align:center">${total}</td><td>${esc(g.menu ? ({carne:'Res',pollo:'Pollo',pescado:'Pescado',vegetariano:'Vegeta.'}[g.menu] || g.menu) : '—')}</td></tr>`;
      }).join('')}</tbody></table>
    </div>` : '';

  const totalPersonas = guests.filter(g => g.estado === 'confirmado').reduce((s, g) => s + 1 + (parseInt(g.acompanantes) || 0), 0);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Mesas — ${bride} & ${groom}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #2c2c2c; padding: 24px; }
    h1 { text-align:center; font-size:1.7rem; color:#c9a96e; margin-bottom:4px; font-family:Georgia,serif; }
    .subtitle { text-align:center; font-size:.85rem; color:#888; margin-bottom:6px; }
    .meta { text-align:center; font-size:.78rem; color:#bbb; margin-bottom:24px; }
    .stats { display:flex; gap:20px; justify-content:center; margin-bottom:20px; flex-wrap:wrap; }
    .stat { text-align:center; }
    .stat-num { font-size:1.4rem; font-weight:700; color:#c9a96e; }
    .stat-lbl { font-size:.7rem; color:#888; }
    .mesa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .mesa-block { border:1px solid #e0d5c0; border-radius:10px; overflow:hidden; break-inside:avoid; }
    .mesa-block-header { background:rgba(201,169,110,.08); padding:10px 14px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; border-bottom:1px solid #e0d5c0; }
    .mesa-block-header strong { font-size:.95rem; color:#c9a96e; }
    .mesa-block-header span { font-size:.72rem; color:#888; }
    .mesa-zona { background:rgba(201,169,110,.15); border-radius:20px; padding:2px 8px; color:#c9a96e !important; font-size:.68rem !important; }
    table { width:100%; border-collapse:collapse; }
    th { font-size:.7rem; font-weight:700; color:#888; text-align:left; padding:6px 10px; border-bottom:1px solid #f0ebe0; background:#fafaf8; }
    td { font-size:.78rem; padding:6px 10px; border-bottom:1px solid #f8f4ee; }
    tr:last-child td { border-bottom:none; }
    hr { border:none; border-top:1px solid #e0d5c0; margin:20px 0; }
    @media print { body{padding:10px;} @page{margin:.8cm;} }
  </style>
</head>
<body>
  <h1>💍 Plan de Mesas</h1>
  <p class="subtitle">${bride} &amp; ${groom}</p>
  <p class="meta">${dateStr}</p>
  <div class="stats">
    <div class="stat"><div class="stat-num">${mesas.length}</div><div class="stat-lbl">Mesas</div></div>
    <div class="stat"><div class="stat-num">${guests.filter(g=>g.estado==='confirmado').length}</div><div class="stat-lbl">Confirmados</div></div>
    <div class="stat"><div class="stat-num">${totalPersonas}</div><div class="stat-lbl">Personas totales</div></div>
    <div class="stat"><div class="stat-num">${unassigned.length}</div><div class="stat-lbl">Sin asignar</div></div>
  </div>
  <div class="mesa-grid">${mesaRows}${unassignedBlock}</div>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) { toast('⚠️ Permite pop-ups para exportar'); return; }
  win.document.write(html);
  win.document.close();
};

/* ================================================================
   MAPA DEL LOCAL — CONSTRUCTOR INTERACTIVO V2
   ================================================================ */
const MAPA_EL_KEY = 'boda_mapa_elements_v2';

const MAPA_CATS = [
  {
    cat: 'Mesas', icon: '🪑',
    items: [
      { src:'img/mesa_invitados.png',  lbl:'Invitados',  w:90, h:90 },
      { src:'img/mesa_novios.png',     lbl:'Novios',     w:90, h:80 },
      { src:'img/mesa_padrinos.png',   lbl:'Padrinos',   w:90, h:80 },
      { src:'img/mesa_pastel.png',     lbl:'Pastel',     w:80, h:80 },
    ]
  },
  {
    cat: 'Escena', icon: '💍',
    items: [
      { src:'img/altar.png',      lbl:'Altar',       w:100, h:120 },
      { src:'img/pista_baile.png',lbl:'Pista Baile', w:130, h:100 },
      { src:'img/entrada.png',    lbl:'Entrada',     w:80,  h:80  },
    ]
  },
  {
    cat: 'Servicios', icon: '🍹',
    items: [
      { src:'img/bar.png',        lbl:'Bar',         w:90, h:80 },
      { src:'img/dj.png',         lbl:'DJ',          w:90, h:90 },
      { src:'img/photo_booth.png',lbl:'Photo Booth', w:90, h:90 },
      { src:'img/zona_lounge.png',lbl:'Lounge',      w:110,h:90 },
    ]
  },
  {
    cat: 'Decoración', icon: '🌸',
    items: [
      { src:'img/decoracion_arco_de_entrada.png',     lbl:'Arco',        w:80, h:110 },
      { src:'img/decoracion_camino_de_flores.png',    lbl:'Camino',      w:130,h:50  },
      { src:'img/decoracion_cartel_de_bienbenida.png',lbl:'Cartel 1',    w:80, h:80  },
      { src:'img/decoracion_cartel_de_bienbenida_2.png',lbl:'Cartel 2',  w:80, h:80  },
      { src:'img/decoracion_cartel_de_bienbenida_3.png',lbl:'Cartel 3',  w:80, h:80  },
      { src:'img/decoracion_corazon_de_flores.png',   lbl:'CorazÓn',     w:80, h:80  },
      { src:'img/decoracion_cortinas.png',            lbl:'Cortinas',    w:90, h:100 },
      { src:'img/decoracion_flores_5.png',            lbl:'Flores',      w:70, h:80  },
      { src:'img/decoracion_fuente.png',              lbl:'Fuente',      w:70, h:90  },
      { src:'img/decoracion_iluminaria_y_sonido.png', lbl:'Luces&Audio', w:90, h:80  },
      { src:'img/decoracion_luces.png',               lbl:'Luces v1',    w:70, h:80  },
      { src:'img/decoracion_luces_2.png',             lbl:'Luces v2',    w:70, h:80  },
      { src:'img/decoracion_luces_3.png',             lbl:'Luces v3',    w:70, h:80  },
      { src:'img/decoracion_lugar_de_regalos.png',    lbl:'Regalos 1',   w:80, h:80  },
      { src:'img/decoracion_lugar_de_regalos_2.png',  lbl:'Regalos 2',   w:80, h:80  },
      { src:'img/decoracion_lugar_de_regalos_3.png',  lbl:'Regalos 3',   w:80, h:80  },
      { src:'img/decoracion_lugar_de_regalos_4.png',  lbl:'Regalos 4',   w:80, h:80  },
      { src:'img/decoracion_mesa_decorativa.png',     lbl:'Mesa Deco',   w:80, h:80  },
      { src:'img/decoracion_mosos.png',               lbl:'Meseros',     w:70, h:90  },
      { src:'img/decoracion_planta.png',              lbl:'Planta 1',    w:60, h:90  },
      { src:'img/decoracion_planta_3.png',            lbl:'Planta 2',    w:60, h:90  },
      { src:'img/decoracion_planta_4.png',            lbl:'Planta 3',    w:60, h:90  },
      { src:'img/decoracion_plata_2.png',             lbl:'Planta 4',    w:60, h:90  },
      { src:'img/decoracion_torta_2.png',             lbl:'Torta',       w:70, h:80  },
    ]
  },
];

function getMapaEls()  { try { return JSON.parse(localStorage.getItem(MAPA_EL_KEY)) || []; } catch { return []; } }
function setMapaEls(a) { localStorage.setItem(MAPA_EL_KEY, JSON.stringify(a)); }

/* State */
let _selMapaId = null;
let _mapaDrag  = null;
let _mapaGhost = null;
let _pendingPanel = null; // component selected in panel (mobile tap)

function refreshMapa() {
  buildMapaPanel();
  renderMapaEls();
  initMapaEvents();
}

/* â”€â”€ Panel builder â”€â”€ */
function buildMapaPanel() {
  const catsEl = document.getElementById('mapaPanelCats');
  if (!catsEl) return;
  const q = (document.getElementById('mapaPanelSearch')?.value || '').toLowerCase();
  catsEl.innerHTML = '';
  MAPA_CATS.forEach(cat => {
    const items = cat.items.filter(it => !q || it.lbl.toLowerCase().includes(q) || cat.cat.toLowerCase().includes(q));
    if (!items.length) return;
    const catDiv = document.createElement('div');
    catDiv.className = 'mapa-cat';
    catDiv.innerHTML = `<div class="mapa-cat__title">${cat.icon} ${cat.cat}</div><div class="mapa-cat__items" id="mcat-${cat.cat}"></div>`;
    catsEl.appendChild(catDiv);
    const itemsEl = catDiv.querySelector('.mapa-cat__items');
    items.forEach(it => {
      const comp = document.createElement('div');
      comp.className = 'mapa-comp';
      comp.dataset.src = it.src;
      comp.dataset.lbl = it.lbl;
      comp.dataset.w   = it.w;
      comp.dataset.h   = it.h;
      comp.innerHTML = `<img src="${it.src}" alt="${esc(it.lbl)}" /><span class="mapa-comp__lbl">${esc(it.lbl)}</span>`;
      itemsEl.appendChild(comp);
    });
  });
}

/* â”€â”€ Render elements on stage â”€â”€ */
function renderMapaEls() {
  const stage = document.getElementById('mapaStage');
  const hint  = document.getElementById('mapaHint');
  if (!stage) return;
  stage.querySelectorAll('.mapa-el').forEach(n => n.remove());
  const els = getMapaEls();
  if (hint) hint.classList.toggle('hidden', els.length > 0);
  els.forEach(el => {
    const node = createMapaNode(el);
    stage.appendChild(node);
  });
}

function createMapaNode(el) {
  const node = document.createElement('div');
  node.className = 'mapa-el' + (_selMapaId === el.id ? ' selected' : '');
  node.id        = 'mel-' + el.id;
  node.dataset.id = el.id;
  node.style.cssText = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;transform:rotate(${el.rot||0}deg);z-index:${el.zIndex||1};`;
  node.innerHTML = `
    <img class="mapa-el__img" src="${el.src}" alt="${esc(el.lbl||'')}" draggable="false" />
    ${el.lbl ? `<div class="mapa-el__label" style="transform:rotate(${-(el.rot||0)}deg)">${esc(el.lbl)}</div>` : ''}
    <div class="mapa-el-handles">
      <div class="mapa-handle mapa-handle--tl" data-handle="tl"></div>
      <div class="mapa-handle mapa-handle--tr" data-handle="tr"></div>
      <div class="mapa-handle mapa-handle--bl" data-handle="bl"></div>
      <div class="mapa-handle mapa-handle--br" data-handle="br"></div>
      <div class="mapa-handle mapa-handle--rot" data-handle="rot" title="Rotar"></div>
      <button class="mapa-el__del" data-del="${el.id}" title="Eliminar">✕</button>
    </div>`;
  return node;
}

/* â”€â”€ Place element â”€â”€ */
function placeMapaEl(comp, stageX, stageY) {
  const els  = getMapaEls();
  const maxZ = els.length ? Math.max(...els.map(e => e.zIndex || 1)) : 1;
  const w = parseInt(comp.dataset.w) || 80;
  const h = parseInt(comp.dataset.h) || 80;
  const newEl = {
    id:     uid(),
    src:    comp.dataset.src,
    lbl:    comp.dataset.lbl,
    x:      Math.max(0, stageX - w / 2),
    y:      Math.max(0, stageY - h / 2),
    w, h,
    rot:    0,
    zIndex: maxZ + 1,
  };
  els.push(newEl);
  setMapaEls(els);
  _selMapaId = newEl.id;
  renderMapaEls();
  const hint = document.getElementById('mapaHint');
  if (hint) hint.classList.add('hidden');
}

/* â”€â”€ Delete element â”€â”€ */
function deleteMapaElById(id) {
  setMapaEls(getMapaEls().filter(e => e.id !== id));
  if (_selMapaId === id) _selMapaId = null;
  renderMapaEls();
  toast('🗑️ Elemento eliminado');
}
window.deleteMapaElById = deleteMapaElById;

/* â”€â”€ Clear all â”€â”€ */
window.clearMapaElements = function() {
  if (!confirm('¿Limpiar todo el plano?')) return;
  setMapaEls([]);
  _selMapaId = null;
  renderMapaEls();
  toast('🗑️ Plano limpiado');
};

/* â”€â”€ Export image â”€â”€ */
window.exportMapaImage = function() {
  const stage = document.getElementById('mapaStage');
  if (!stage) return;
  // Temporarily deselect
  const prevSel = _selMapaId;
  _selMapaId = null;
  renderMapaEls();

  const btn = document.querySelector('[onclick="exportMapaImage()"]');
  if (btn) btn.textContent = '⏳ Generando...';

  const promise = (typeof html2canvas !== 'undefined')
    ? html2canvas(stage, { backgroundColor: '#f9f6f0', scale: 2, useCORS: true, allowTaint: true, logging: false })
    : Promise.reject(new Error('html2canvas no disponible'));

  promise.then(canvas => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'mapa-boda.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (btn) btn.innerHTML = '<i class="fa-solid fa-image"></i><span class="mapa-btn-lbl"> Exportar PNG</span>';
      _selMapaId = prevSel;
      renderMapaEls();
    });
  }).catch(err => {
    toast('❌ Error al exportar: ' + err.message);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-image"></i><span class="mapa-btn-lbl"> Exportar PNG</span>';
    _selMapaId = prevSel;
    renderMapaEls();
  });
};

/* â”€â”€ Events â”€â”€ */
let _mapaEventsInited = false;
function initMapaEvents() {
  if (_mapaEventsInited) return;
  _mapaEventsInited = true;

  const stage     = document.getElementById('mapaStage');
  const stageWrap = document.getElementById('mapaStageWrap');
  const panel     = document.getElementById('mapaPanel');
  const search    = document.getElementById('mapaPanelSearch');
  const toggleBtn = document.getElementById('mapaTogglePanel');
  const closeBtn  = document.getElementById('mapaClosePanel');

  // Search
  if (search) {
    search.addEventListener('input', () => buildMapaPanel());
  }

  // Toggle panel
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      panel?.classList.toggle('hidden');
      toggleBtn.classList.toggle('mapa-btn--active', !panel?.classList.contains('hidden'));
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel?.classList.add('hidden');
      toggleBtn?.classList.remove('mapa-btn--active');
    });
  }

  // Panel search setup
  if (search) search.addEventListener('input', buildMapaPanel);

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     POINTER EVENTS (mouse + touch unified)
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  // â”€â”€ Panel component: pointerdown â†’ start panel drag (or tap on mobile)
  document.getElementById('mapaPanelCats')?.addEventListener('pointerdown', e => {
    const comp = e.target.closest('.mapa-comp');
    if (!comp) return;

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Mobile: tap to select comp, then tap stage to place
      document.querySelectorAll('.mapa-comp').forEach(c => c.style.outline = '');
      comp.style.outline = '2px solid var(--gold)';
      _pendingPanel = comp;
      toast('💡 Toca el plano para colocar el elemento');
      return;
    }

    // Desktop: start ghost drag
    e.preventDefault();
    const w = parseInt(comp.dataset.w) || 80;
    const h = parseInt(comp.dataset.h) || 80;
    _mapaGhost = document.createElement('div');
    _mapaGhost.className = 'mapa-ghost';
    _mapaGhost.style.width  = w + 'px';
    _mapaGhost.style.height = h + 'px';
    _mapaGhost.innerHTML = `<img src="${comp.dataset.src}" style="width:100%;height:100%;object-fit:contain;pointer-events:none" />`;
    document.body.appendChild(_mapaGhost);
    _mapaDrag = { type: 'panel', comp };
    comp.classList.add('dragging-source');
    _mapaGhost.style.left = e.clientX + 'px';
    _mapaGhost.style.top  = e.clientY + 'px';
  });

  // â”€â”€ Stage: pointerdown on placed element or background
  if (stage) {
    stage.addEventListener('pointerdown', e => {
      // Mobile pending placement
      if (_pendingPanel) {
        const rect = stage.getBoundingClientRect();
        const wrap = document.getElementById('mapaStageWrap');
        const sx = e.clientX - rect.left + (wrap?.scrollLeft || 0);
        const sy = e.clientY - rect.top  + (wrap?.scrollTop  || 0);
        placeMapaEl(_pendingPanel, sx, sy);
        _pendingPanel.style.outline = '';
        _pendingPanel = null;
        return;
      }

      // Delete button
      if (e.target.dataset.del) {
        deleteMapaElById(e.target.dataset.del);
        return;
      }

      // Handle click
      const handle = e.target.closest('[data-handle]');
      const elNode = e.target.closest('.mapa-el');

      if (!elNode) {
        // Click on stage background â†’ deselect
        _selMapaId = null;
        renderMapaEls();
        return;
      }

      // Select element
      const id = elNode.dataset.id;
      _selMapaId = id;
      renderMapaEls();

      if (handle) {
        e.preventDefault();
        const elData = getMapaEls().find(x => x.id === id);
        if (!elData) return;
        const wrap = document.getElementById('mapaStageWrap');
        const stageRect = stage.getBoundingClientRect();
        const cx = stageRect.left - (wrap?.scrollLeft || 0) + elData.x + elData.w / 2;
        const cy = stageRect.top  - (wrap?.scrollTop  || 0) + elData.y + elData.h / 2;
        const hType = handle.dataset.handle;
        if (hType === 'rot') {
          _mapaDrag = {
            type: 'rotate', id,
            cx, cy,
            startRot:   elData.rot || 0,
            startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI,
          };
        } else {
          // Resize
          _mapaDrag = {
            type: 'resize', id, corner: hType,
            startPX: e.clientX, startPY: e.clientY,
            startW: elData.w, startH: elData.h,
            startX: elData.x, startY: elData.y,
          };
        }
        stage.setPointerCapture(e.pointerId);
        return;
      }

      // Move element
      e.preventDefault();
      _mapaDrag = {
        type: 'move', id,
        startPX: e.clientX, startPY: e.clientY,
        startEX: parseInt(elNode.style.left) || 0,
        startEY: parseInt(elNode.style.top)  || 0,
      };
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', e => {
      if (!_mapaDrag) return;
      e.preventDefault();

      if (_mapaDrag.type === 'panel') {
        if (_mapaGhost) {
          _mapaGhost.style.left = e.clientX + 'px';
          _mapaGhost.style.top  = e.clientY + 'px';
        }
        return;
      }

      const els = getMapaEls();
      const idx = els.findIndex(x => x.id === _mapaDrag.id);
      if (idx < 0) return;

      if (_mapaDrag.type === 'move') {
        const dx = e.clientX - _mapaDrag.startPX;
        const dy = e.clientY - _mapaDrag.startPY;
        els[idx].x = Math.max(0, _mapaDrag.startEX + dx);
        els[idx].y = Math.max(0, _mapaDrag.startEY + dy);
        const node = document.getElementById('mel-' + _mapaDrag.id);
        if (node) { node.style.left = els[idx].x + 'px'; node.style.top = els[idx].y + 'px'; }

      } else if (_mapaDrag.type === 'rotate') {
        const angle = Math.atan2(e.clientY - _mapaDrag.cy, e.clientX - _mapaDrag.cx) * 180 / Math.PI;
        let rot = _mapaDrag.startRot + (angle - _mapaDrag.startAngle);
        if (e.shiftKey) rot = Math.round(rot / 15) * 15; // snap to 15Â°
        els[idx].rot = rot;
        const node = document.getElementById('mel-' + _mapaDrag.id);
        if (node) node.style.transform = `rotate(${rot}deg)`;

      } else if (_mapaDrag.type === 'resize') {
        const dx = e.clientX - _mapaDrag.startPX;
        const dy = e.clientY - _mapaDrag.startPY;
        const c  = _mapaDrag.corner;
        let newW = _mapaDrag.startW;
        let newH = _mapaDrag.startH;
        let newX = _mapaDrag.startX;
        let newY = _mapaDrag.startY;

        if (c === 'br') { newW = Math.max(30, _mapaDrag.startW + dx); newH = Math.max(30, _mapaDrag.startH + dy); }
        if (c === 'bl') { newW = Math.max(30, _mapaDrag.startW - dx); newH = Math.max(30, _mapaDrag.startH + dy); newX = _mapaDrag.startX + (_mapaDrag.startW - newW); }
        if (c === 'tr') { newW = Math.max(30, _mapaDrag.startW + dx); newH = Math.max(30, _mapaDrag.startH - dy); newY = _mapaDrag.startY + (_mapaDrag.startH - newH); }
        if (c === 'tl') { newW = Math.max(30, _mapaDrag.startW - dx); newH = Math.max(30, _mapaDrag.startH - dy); newX = _mapaDrag.startX + (_mapaDrag.startW - newW); newY = _mapaDrag.startY + (_mapaDrag.startH - newH); }

        if (e.shiftKey) {
          const ratio = _mapaDrag.startW / _mapaDrag.startH;
          newH = newW / ratio;
        }

        els[idx].w = newW; els[idx].h = newH;
        els[idx].x = newX; els[idx].y = newY;
        const node = document.getElementById('mel-' + _mapaDrag.id);
        if (node) { node.style.width = newW + 'px'; node.style.height = newH + 'px'; node.style.left = newX + 'px'; node.style.top = newY + 'px'; }
      }

      setMapaEls(els);
    });

    stage.addEventListener('pointerup', e => {
      if (!_mapaDrag) return;

      if (_mapaDrag.type === 'panel') {
        // Check if dropped over stage
        const stageRect = stage.getBoundingClientRect();
        const wrap = document.getElementById('mapaStageWrap');
        if (e.clientX >= stageRect.left && e.clientX <= stageRect.right &&
            e.clientY >= stageRect.top  && e.clientY <= stageRect.bottom) {
          const sx = e.clientX - stageRect.left + (wrap?.scrollLeft || 0);
          const sy = e.clientY - stageRect.top  + (wrap?.scrollTop  || 0);
          placeMapaEl(_mapaDrag.comp, sx, sy);
        }
        _mapaDrag.comp.classList.remove('dragging-source');
        _mapaGhost?.remove();
        _mapaGhost = null;
      }

      _mapaDrag = null;
    });

    stage.addEventListener('pointercancel', () => {
      if (_mapaDrag?.comp) _mapaDrag.comp.classList.remove('dragging-source');
      _mapaGhost?.remove();
      _mapaGhost = null;
      _mapaDrag = null;
    });
  }

  // Global pointerup for panel ghost drag (in case it ends outside stage)
  document.addEventListener('pointerup', () => {
    if (_mapaDrag?.type === 'panel') {
      _mapaDrag.comp?.classList.remove('dragging-source');
      _mapaGhost?.remove();
      _mapaGhost = null;
      _mapaDrag = null;
    }
  });
}
