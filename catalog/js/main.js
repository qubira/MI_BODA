/* ── Nav scroll & mobile ── */
const nav    = document.getElementById('mainNav');
const toggle = document.getElementById('navToggle');
const menu   = document.getElementById('navMenu');
const scrollBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  scrollBtn.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* Backdrop para el menú (z-index 999 = debajo del nav 1000) */
const backdrop = document.createElement('div');
Object.assign(backdrop.style, {
  position:'fixed', inset:'0', zIndex:'999',
  background:'rgba(0,0,0,.5)', opacity:'0',
  pointerEvents:'none', transition:'opacity .3s'
});
document.body.appendChild(backdrop);

function closeNav() {
  toggle.classList.remove('open');
  menu.classList.remove('open');
  backdrop.style.opacity = '0';
  backdrop.style.pointerEvents = 'none';
}
toggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const opening = !menu.classList.contains('open');
  toggle.classList.toggle('open');
  menu.classList.toggle('open');
  backdrop.style.opacity = opening ? '1' : '0';
  backdrop.style.pointerEvents = opening ? 'auto' : 'none';
});
backdrop.addEventListener('click', closeNav);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 20,
      behavior: 'smooth'
    });
  });
});

/* ── Partículas hero ── */
const particleContainer = document.getElementById('heroParticles');
for (let i = 0; i < 24; i++) {
  const p = document.createElement('span');
  p.className = 'particle';
  const size = Math.random() * 2.5 + 1;
  p.style.cssText = `
    width:${size}px;height:${size}px;
    left:${Math.random() * 100}%;
    animation-duration:${Math.random() * 16 + 10}s;
    animation-delay:${Math.random() * -22}s;
    opacity:${Math.random() * .4 + .1};
  `;
  particleContainer.appendChild(p);
}

/* ── Reveal on scroll ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-right');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => io.observe(el));

/* ── Contadores animados ── */
function animateCounter(el) {
  const target  = parseInt(el.dataset.target);
  const suffix  = el.dataset.suffix || '';
  const dur     = 1800;
  const start   = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(ease * target) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counterIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterIo.unobserve(e.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.hero__stat-num[data-target]').forEach(el => counterIo.observe(el));
