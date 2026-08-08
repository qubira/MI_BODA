const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { Pool } = require('pg');

const app      = express();
const PORT     = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'miboda2026admin';

const DB_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_qmSGeP3VIY8p@ep-polished-meadow-awq79ayn-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: DB_URL });

app.use(express.json());

/* ── Visits API ───────────────────────────────────────────────── */
app.post('/api/track', async (req, res) => {
  try {
    const b = req.body || {};
    const forwarded = req.headers['x-forwarded-for'];
    const ip_real = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    await pool.query(
      `INSERT INTO visitas
        (ip_real, plan, fecha, ua_raw, dispositivo, os, navegador, gpu,
         idioma, pantalla, zona, referrer, conexion, velocidad,
         ip, pais, pais_cod, ciudad, region, isp,
         lat_ip, lon_ip, lat_gps, lon_gps, precision_gps)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
         $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        ip_real,
        b.plan        || null,
        b.fecha       ? new Date(b.fecha) : new Date(),
        b.ua_raw      || null,
        b.dispositivo || null,
        b.os          || null,
        b.navegador   || null,
        b.gpu         || null,
        b.idioma      || null,
        b.pantalla    || null,
        b.zona        || null,
        b.referrer    || null,
        b.conexion    || null,
        b.velocidad   || null,
        b.ip          || null,
        b.pais        || null,
        b.pais_cod    || null,
        b.ciudad      || null,
        b.region      || null,
        b.isp         || null,
        b.lat_ip      != null ? +b.lat_ip  : null,
        b.lon_ip      != null ? +b.lon_ip  : null,
        b.lat_gps     != null ? +b.lat_gps : null,
        b.lon_gps     != null ? +b.lon_gps : null,
        b.precision_gps != null ? +b.precision_gps : null,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('track error:', e.message);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/visits', async (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  try {
    const { rows } = await pool.query('SELECT * FROM visitas ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/visits', async (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  try {
    await pool.query('TRUNCATE TABLE visitas RESTART IDENTITY');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'db error' });
  }
});

/* ── RSVP exclusivo-13 ────────────────────────────────────────── */
app.post('/api/rsvp/exclusivo-13', async (req, res) => {
  try {
    const { nombre, correo, telefono, acompanantes, asiste, mensaje } = req.body || {};
    if (!nombre || !correo || asiste === undefined) return res.status(400).json({ error: 'Faltan campos' });
    await pool.query(
      `INSERT INTO rsvp_exclusivo_13 (nombre,correo,telefono,acompanantes,asiste,mensaje)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [nombre, correo, telefono||null, parseInt(acompanantes)||0, !!asiste, mensaje||null]
    );
    res.json({ ok: true });
  } catch (e) { console.error('rsvp error:', e.message); res.status(500).json({ error: 'db error' }); }
});

app.get('/api/rsvp/exclusivo-13', async (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  try {
    const { rows } = await pool.query('SELECT * FROM rsvp_exclusivo_13 ORDER BY id DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'db error' }); }
});

app.delete('/api/rsvp/exclusivo-13/:id', async (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  try {
    await pool.query('DELETE FROM rsvp_exclusivo_13 WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db error' }); }
});

/* ── Control panel & tracker script ──────────────────────────── */
app.get('/control', (req, res) =>
  res.sendFile(path.join(__dirname, 'CONTROL', 'control1dff.html'))
);
app.get('/tracker.js', (req, res) =>
  res.sendFile(path.join(__dirname, 'CONTROL', 'tracker.js'))
);

/* ── Inject tracker into plan pages ──────────────────────────── */
function serveWithTracker(res, filePath, slug) {
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return res.status(404).send('Página no encontrada');
    const injection = `<script>window._PLAN="${slug}";</script><script src="/tracker.js" defer></script>`;
    const modified = html.replace('</body>', injection + '</body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modified);
  });
}

/* ── Catálogo principal ──────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'catalog')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'catalog', 'index.html'))
);

/* ── Sub-proyectos ───────────────────────────────────────────── */
const projects = [
  { slug: 'basico-1',      dir: 'MI_BODA_PLAN_BASICO_1',  admin: false },
  { slug: 'basico-2',      dir: 'MI_BODA_PLAN_BASICO_2',  admin: false },
  { slug: 'basico-3',      dir: 'MI_BODA_PLAN_BASICO_3',  admin: false },
  { slug: 'basico-4',      dir: 'MI_BODA_PLAN_BASICO_4',  admin: false },
  { slug: 'basico-5',      dir: 'MI_BODA_PLAN_BASICO_5',  admin: false },
  { slug: 'basico-6',      dir: 'MI_BODA_PLAN_BASICO_6',  admin: false },
  { slug: 'basico-7',      dir: 'MI_BODA_PLAN_BASICO_7',  admin: false },
  { slug: 'basico-8',      dir: 'MI_BODA_PLAN_BASICO_8',  admin: false },
  { slug: 'basico-9',      dir: 'MI_BODA_PLAN_BASICO_9',  admin: false },
  { slug: 'basico-10',     dir: 'MI_BODA_PLAN_BASICO_10', admin: false },
  { slug: 'basico-11',     dir: 'MI_BODA_PLAN_BASICO_11', admin: false },
  { slug: 'basico-12',     dir: 'MI_BODA_PLAN_BASICO_12', admin: false },
  { slug: 'plus-1',        dir: 'MI_BODA _PLAN_PLUS_1',   admin: true  },
  { slug: 'plus-2',        dir: 'MI_BODA _PLAN_PLUS_2',   admin: true  },
  { slug: 'plus-3',        dir: 'MI_BODA _PLAN_PLUS_3',   admin: true  },
  { slug: 'plus-4',        dir: 'MI_BODA _PLAN_PLUS_4',   admin: true  },
  { slug: 'plus-5',        dir: 'MI_BODA _PLAN_PLUS_5',   admin: true  },
  { slug: 'plus-6',        dir: 'MI_BODA _PLAN_PLUS_6',   admin: true  },
  { slug: 'plus-7',        dir: 'MI_BODA _PLAN_PLUS_7',   admin: true  },
  { slug: 'plus-8',        dir: 'MI_BODA _PLAN_PLUS_8',   admin: true  },
  { slug: 'plus-9',        dir: 'MI_BODA _PLAN_PLUS_9',   admin: true  },
  { slug: 'plus-10',       dir: 'MI_BODA _PLAN_PLUS_10',  admin: true  },
  { slug: 'plus-11',       dir: 'MI_BODA _PLAN_PLUS_11',  admin: true  },
  { slug: 'plus-12',       dir: 'MI_BODA _PLAN_PLUS_12',  admin: true  },
  { slug: 'exclusivo-1',   dir: 'MI_BODA_EXCLUSIVO_1',    admin: true  },
  { slug: 'exclusivo-2',   dir: 'MI_BODA_EXCLUSIVO_2',    admin: true  },
  { slug: 'exclusivo-3',   dir: 'MI_BODA_EXCLUSIVO_3',    admin: true  },
  { slug: 'exclusivo-4',   dir: 'MI_BODA_EXCLUSIVO_4',    admin: true  },
  { slug: 'exclusivo-5',   dir: 'MI_BODA_EXCLUSIVO_5',    admin: true  },
  { slug: 'exclusivo-6',   dir: 'MI_BODA_EXCLUSIVO_6',    admin: true  },
  { slug: 'exclusivo-7',   dir: 'MI_BODA_EXCLUSIVO_7',    admin: true  },
  { slug: 'exclusivo-8',   dir: 'MI_BODA_EXCLUSIVO_8',    admin: true  },
  { slug: 'exclusivo-9',   dir: 'MI_BODA_EXCLUSIVO_9',    admin: true  },
  { slug: 'exclusivo-10',  dir: 'MI_BODA_EXCLUSIVO_10',   admin: true  },
  { slug: 'exclusivo-11',  dir: 'MI_BODA_EXCLUSIVO_11',   admin: true  },
  { slug: 'exclusivo-12',  dir: 'MI_BODA_EXCLUSIVO_12',   admin: true  },
  { slug: 'exclusivo-13',  dir: 'MI_BODA_EXCLUSIVO_13',   admin: true  },
];

projects.forEach(({ slug, dir, admin }) => {
  const root = path.join(__dirname, dir);

  app.use(`/${slug}`, express.static(root, { index: false }));

  const indexFile = path.join(root, 'index.html');
  app.get(`/${slug}`,  (req, res) => serveWithTracker(res, indexFile, slug));
  app.get(`/${slug}/`, (req, res) => serveWithTracker(res, indexFile, slug));

  if (admin) {
    app.get(`/${slug}/admin`,      (req, res) => res.sendFile(path.join(root, 'admin.html')));
    app.get(`/${slug}/admin.html`, (req, res) => res.sendFile(path.join(root, 'admin.html')));
  }
});

/* ── 404 ─────────────────────────────────────────────────────── */
app.use((req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () =>
  console.log(`✦ Catálogo Mi Boda corriendo en http://localhost:${PORT}`)
);
