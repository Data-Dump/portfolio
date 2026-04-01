/* AOS init */
AOS.init({ duration: 800, easing: 'ease-in-out', once: true });

/* Navbar shrink on scroll + progress bar */
const navbar = document.getElementById('navbar');
const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 20) navbar.classList.add('shrink'); else navbar.classList.remove('shrink');
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = Math.min(100, (y / max) * 100) + '%';
}, { passive: true });

/* Mobile menu */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    menuBtn.innerHTML = mobileMenu.classList.contains('hidden') ? '<i class="fa-solid fa-bars"></i>' : '<i class="fa-solid fa-xmark"></i>';
  });
}
document.querySelectorAll('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.add('hidden'); menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

/* Smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Preloader */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  if (pre) pre.style.display = 'none';
});

/* Back to top */
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 350) backToTop.classList.add('show'); else backToTop.classList.remove('show');
}, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* Counters */
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'), 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const value = Math.floor(target * progress);
      counter.textContent = value + (target >= 50 ? '+' : '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
const statsObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounters(); obs.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
const anyStat = document.querySelector('.stat-number');
if (anyStat) statsObserver.observe(anyStat.parentElement.parentElement);

/* Gallery filtering */
const filterButtons = document.querySelectorAll('.filter-btn');
const items = document.querySelectorAll('.gallery-item');
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  const f = btn.dataset.filter;
  filterButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  items.forEach((it, i) => {
    const ok = f === 'all' || it.dataset.category === f;
    it.style.display = ok ? 'block' : 'none';
    if (ok) {
      setTimeout(() => it.classList.add('loaded'), i * 50);
    } else {
      it.classList.remove('loaded');
    }
  });
}));

/* Modal (reuse the new clean modal) */
let modal;
function ensureModal() {
  if (modal) return modal;
  const m = document.createElement('div');
  m.id = 'imageModal';
  m.className = 'fixed inset-0 z-[1600] hidden bg-[rgba(0,0,0,0.9)] backdrop-blur-sm p-4';
  m.innerHTML = `
    <div class="relative mx-auto w-full max-w-4xl top-1/2 -translate-y-1/2">
      <button id="modalClose" class="absolute -top-10 right-0 text-white text-3xl leading-none" aria-label="Close">×</button>
      <img id="modalImage" src="" alt="" class="w-full h-auto rounded-lg shadow-2xl" />
      <div class="text-center mt-4 text-white">
        <h3 id="modalTitle" class="text-2xl font-bold mb-1"></h3>
        <p id="modalDescription" class="text-gray-300"></p>
      </div>
    </div>`;
  document.body.appendChild(m);
  modal = m;
  document.getElementById('modalClose').addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
  return m;
}
function openModalFrom(el) {
  const m = ensureModal();
  const img = el.querySelector('img');
  const title = el.querySelector('h4')?.textContent || '';
  const desc = el.querySelector('p')?.textContent || '';
  m.querySelector('#modalImage').src = img.src;
  m.querySelector('#modalImage').alt = img.alt || title;
  m.querySelector('#modalTitle').textContent = title;
  m.querySelector('#modalDescription').textContent = desc;
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}
items.forEach(it => it.addEventListener('click', () => openModalFrom(it)));

/* Lazy loading observer (progressive) */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, ob) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const ds = img.getAttribute('data-src');
        if (ds) { img.src = ds; img.removeAttribute('data-src'); }
        img.classList.remove('loading');
        ob.unobserve(img);
      }
    });
  }, { rootMargin: '100px' });
  document.querySelectorAll('img[loading="lazy"]').forEach(img => io.observe(img));
}

/* Toast helpers */
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const toastClose = document.getElementById('toastClose');
function showToast(text, timeout = 2500) {
  toastText.textContent = text;
  toast.classList.remove('hidden');
  const t = setTimeout(() => toast.classList.add('hidden'), timeout);
  toastClose.onclick = () => { toast.classList.add('hidden'); clearTimeout(t); };
}

/* Forms (AJAX) */
function ajaxForm(form, successCb, errorCb) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    fetch(form.action, { method: form.method, body: fd }).then(res => {
      if (res.ok) return res.text();
      throw new Error('FormSubmit failed');
    }).then(() => {
      successCb && successCb();
    }).catch(() => {
      errorCb && errorCb();
    });
  });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const ok = document.getElementById('formSuccess');
  const err = document.getElementById('formError');
  ajaxForm(contactForm, () => {
    ok.classList.remove('hidden'); err.classList.add('hidden'); contactForm.reset();
    showToast('Message sent. I will reply within 24 hours.');
  }, () => { err.classList.remove('hidden'); ok.classList.add('hidden'); showToast('Something went wrong. Try again.'); });
}

const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
  const msg = document.getElementById('newsletterMsg');
  ajaxForm(newsletterForm, () => {
    msg.textContent = 'Thanks for subscribing!'; msg.classList.remove('hidden'); showToast('Subscribed!');
    newsletterForm.reset();
  }, () => { msg.textContent = 'Subscription failed. Try again.'; msg.classList.remove('hidden'); showToast('Subscription failed.'); });
}

const footerNewsletter = document.getElementById('footerNewsletter');
if (footerNewsletter) {
  const msg = document.getElementById('footerMsg');
  ajaxForm(footerNewsletter, () => {
    msg.textContent = 'Subscribed!'; msg.classList.remove('hidden'); showToast('Subscribed!');
    footerNewsletter.reset();
  }, () => { msg.textContent = 'Subscription failed. Try again.'; msg.classList.remove('hidden'); showToast('Subscription failed.'); });
}
