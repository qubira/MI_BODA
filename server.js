const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Catálogo principal ── */
app.use(express.static(path.join(__dirname, 'catalog')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'catalog', 'index.html'))
);

/* ── Sub-proyectos ── */
const projects = [
  { slug: 'basico-1',   dir: 'MI_BODA_PLAN_BASICO_1',  admin: false },
  { slug: 'basico-2',   dir: 'MI_BODA_PLAN_BASICO_2',  admin: false },
  { slug: 'basico-3',   dir: 'MI_BODA_PLAN_BASICO_3',  admin: false },
  { slug: 'plus-1',     dir: 'MI_BODA _PLAN_PLUS_1',   admin: true  },
  { slug: 'plus-2',     dir: 'MI_BODA _PLAN_PLUS_2',   admin: true  },
  { slug: 'plus-3',     dir: 'MI_BODA _PLAN_PLUS_3',   admin: true  },
  { slug: 'exclusivo-1',dir: 'MI_BODA_EXCLUSIVO_1',    admin: true  },
  { slug: 'exclusivo-2',dir: 'MI_BODA_EXCLUSIVO_2',    admin: true  },
  { slug: 'exclusivo-3',dir: 'MI_BODA_EXCLUSIVO_3',    admin: true  },
  { slug: 'basico-4',   dir: 'MI_BODA_PLAN_BASICO_4', admin: false },
  { slug: 'basico-5',   dir: 'MI_BODA_PLAN_BASICO_5', admin: false },
  { slug: 'basico-6',   dir: 'MI_BODA_PLAN_BASICO_6', admin: false },
  { slug: 'basico-7',   dir: 'MI_BODA_PLAN_BASICO_7', admin: false },
  { slug: 'basico-8',   dir: 'MI_BODA_PLAN_BASICO_8', admin: false },
  { slug: 'basico-9',   dir: 'MI_BODA_PLAN_BASICO_9',  admin: false },
  { slug: 'basico-10',  dir: 'MI_BODA_PLAN_BASICO_10', admin: false },
  { slug: 'basico-11',  dir: 'MI_BODA_PLAN_BASICO_11', admin: false },
  { slug: 'basico-12',  dir: 'MI_BODA_PLAN_BASICO_12', admin: false },
  { slug: 'plus-4',    dir: 'MI_BODA _PLAN_PLUS_4',   admin: true  },
  { slug: 'plus-5',    dir: 'MI_BODA _PLAN_PLUS_5',   admin: true  },
  { slug: 'plus-6',    dir: 'MI_BODA _PLAN_PLUS_6',   admin: true  },
  { slug: 'plus-7',    dir: 'MI_BODA _PLAN_PLUS_7',   admin: true  },
  { slug: 'plus-8',    dir: 'MI_BODA _PLAN_PLUS_8',   admin: true  },
  { slug: 'plus-9',    dir: 'MI_BODA _PLAN_PLUS_9',   admin: true  },
  { slug: 'plus-10',   dir: 'MI_BODA _PLAN_PLUS_10',  admin: true  },
  { slug: 'plus-11',   dir: 'MI_BODA _PLAN_PLUS_11',  admin: true  },
  { slug: 'plus-12',   dir: 'MI_BODA _PLAN_PLUS_12',  admin: true  },
  { slug: 'exclusivo-4',  dir: 'MI_BODA_EXCLUSIVO_4',  admin: true  },
  { slug: 'exclusivo-5',  dir: 'MI_BODA_EXCLUSIVO_5',  admin: true  },
  { slug: 'exclusivo-6',  dir: 'MI_BODA_EXCLUSIVO_6',  admin: true  },
  { slug: 'exclusivo-7',  dir: 'MI_BODA_EXCLUSIVO_7',  admin: true  },
  { slug: 'exclusivo-8',  dir: 'MI_BODA_EXCLUSIVO_8',  admin: true  },
  { slug: 'exclusivo-9',  dir: 'MI_BODA_EXCLUSIVO_9',  admin: true  },
  { slug: 'exclusivo-10', dir: 'MI_BODA_EXCLUSIVO_10', admin: true  },
  { slug: 'exclusivo-11', dir: 'MI_BODA_EXCLUSIVO_11', admin: true  },
  { slug: 'exclusivo-12', dir: 'MI_BODA_EXCLUSIVO_12', admin: true  },
];

projects.forEach(({ slug, dir, admin }) => {
  const root = path.join(__dirname, dir);

  /* Archivos estáticos bajo /<slug>/ */
  app.use(`/${slug}`, express.static(root));

  /* index.html */
  app.get(`/${slug}`, (req, res) => res.sendFile(path.join(root, 'index.html')));
  app.get(`/${slug}/`, (req, res) => res.sendFile(path.join(root, 'index.html')));

  /* admin.html (sólo los planes que lo tienen) */
  if (admin) {
    app.get(`/${slug}/admin`, (req, res) => res.sendFile(path.join(root, 'admin.html')));
    app.get(`/${slug}/admin.html`, (req, res) => res.sendFile(path.join(root, 'admin.html')));
  }
});

/* ── 404 ── */
app.use((req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () =>
  console.log(`✦ Catálogo Mi Boda corriendo en http://localhost:${PORT}`)
);
