(function () {
  'use strict';

  // Skip if loaded inside an iframe (catalog preview cards)
  if (window.self !== window.top) return;

  const plan = window._PLAN || location.pathname.split('/').filter(Boolean)[0] || 'desconocido';

  /* ── UA Parser ─────────────────────────────────────────────── */
  function parseUA(ua) {
    if (!ua) return { os: '?', browser: '?', device: '?' };
    let os = '?', browser = '?', device = 'Desktop';

    if (/iPhone/.test(ua))        { os = 'iOS';      device = 'iPhone'; }
    else if (/iPad/.test(ua))     { os = 'iPadOS';   device = 'iPad'; }
    else if (/Android/.test(ua))  {
      os = 'Android';
      const m = ua.match(/Android [\d.]+;?\s*([^;)]+)/);
      device = m ? m[1].trim().split(' ').slice(0,3).join(' ') : 'Android';
    }
    else if (/Macintosh/.test(ua)) { os = 'macOS';   device = 'Mac'; }
    else if (/Windows NT/.test(ua)) {
      const v = ua.match(/Windows NT ([\d.]+)/)?.[1];
      const map = {'10.0':'Win 10/11','6.3':'Win 8.1','6.1':'Win 7'};
      os = map[v] || ('Win NT ' + (v||''));
      device = 'PC';
    }
    else if (/Linux/.test(ua))    { os = 'Linux';    device = 'Linux PC'; }
    else if (/CrOS/.test(ua))     { os = 'ChromeOS'; device = 'Chromebook'; }

    if      (/Edg\//.test(ua))                      browser = 'Edge';
    else if (/OPR\/|Opera/.test(ua))                browser = 'Opera';
    else if (/Chrome\//.test(ua))                   browser = 'Chrome';
    else if (/Firefox\//.test(ua))                  browser = 'Firefox';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/MSIE|Trident/.test(ua))               browser = 'IE';

    return { os, browser, device };
  }

  /* ── GPU via WebGL ─────────────────────────────────────────── */
  function getGPU() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return null;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    } catch (e) { return null; }
  }

  /* ── Connection info ───────────────────────────────────────── */
  function getConn() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return { tipo: 'desconocida', velocidad: null };
    return {
      tipo: c.type || c.effectiveType || 'desconocida',
      velocidad: c.downlink ? c.downlink + ' Mbps' : null,
    };
  }

  /* ── Build payload ─────────────────────────────────────────── */
  const ua = parseUA(navigator.userAgent);
  const conn = getConn();

  const data = {
    plan,
    fecha:        new Date().toISOString(),
    ua_raw:       navigator.userAgent,
    dispositivo:  ua.device,
    os:           ua.os,
    navegador:    ua.browser,
    gpu:          getGPU(),
    idioma:       navigator.language,
    pantalla:     screen.width + 'x' + screen.height,
    zona:         Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer:     document.referrer || 'directo',
    conexion:     conn.tipo,
    velocidad:    conn.velocidad,
    // filled async
    ip: null, pais: null, pais_cod: null,
    ciudad: null, region: null, isp: null,
    lat_ip: null, lon_ip: null,
    lat_gps: null, lon_gps: null, precision_gps: null,
  };

  let sent = false;
  function send() {
    if (sent) return;
    sent = true;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  }

  /* ── Phase 1: IP lookup ────────────────────────────────────── */
  fetch('https://ipapi.co/json/')
    .then(r => r.ok ? r.json() : null)
    .then(info => {
      if (info && !info.error) {
        data.ip        = info.ip;
        data.pais      = info.country_name;
        data.pais_cod  = info.country_code;
        data.ciudad    = info.city;
        data.region    = info.region;
        data.isp       = info.org;
        data.lat_ip    = info.latitude;
        data.lon_ip    = info.longitude;
      }
    })
    .catch(() => {})
    .finally(() => {
      /* ── Phase 2: GPS (optional, max 6 s) ── */
      if (!navigator.geolocation) { send(); return; }
      const t = setTimeout(send, 6000);
      navigator.geolocation.getCurrentPosition(
        pos => {
          clearTimeout(t);
          data.lat_gps       = +pos.coords.latitude.toFixed(6);
          data.lon_gps       = +pos.coords.longitude.toFixed(6);
          data.precision_gps = Math.round(pos.coords.accuracy);
          send();
        },
        () => { clearTimeout(t); send(); },
        { timeout: 6000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });
})();
