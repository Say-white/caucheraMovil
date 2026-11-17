/**
 * CAUCHERA MÓVIL - LÓGICA PRINCIPAL MODULAR (OPTIMIZADA)
 */
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initScrollReveal();
  initProductFilters();
  initUrlProductPreselection();
  initContactForm();
});

/* 1. Efecto de elevación en Header al hacer scroll */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* 2. Menú de navegación móvil accesible */
function initMobileNav() {
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!isExpanded));
    nav.classList.toggle('open', !isExpanded);
    menuBtn.textContent = !isExpanded ? 'Cerrar ✕' : 'Menú ☰';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      menuBtn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      menuBtn.textContent = 'Menú ☰';
      menuBtn.focus();
    }
  });
}

/* 3. Animaciones Scroll Reveal sin contaminar la latencia de hover posterior */
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.hero .wrap > div, .hero-visual, .section-head, .list li, .grid .item, .card-box, #contacto-form, dl.info, .cta .wrap'
  );

  // Agrupar índice de escalonado por contenedor padre en vez de índice global
  const parentCounts = new Map();

  elements.forEach((el) => {
    el.setAttribute('data-reveal', '');
    const parent = el.parentElement;
    const count = parentCounts.get(parent) || 0;
    parentCounts.set(parent, count + 1);

    const stagger = (count % 4) * 55;
    el.style.transitionDelay = `${stagger}ms`;
  });

  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => {
      el.classList.add('is-visible');
      el.style.transitionDelay = '';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.classList.add('is-visible');

          // Limpiar transitionDelay tras completar la entrada para que el :hover sea instantáneo
          const cleanupDelay = () => {
            target.style.transitionDelay = '';
            target.removeEventListener('transitionend', cleanupDelay);
          };
          target.addEventListener('transitionend', cleanupDelay);

          obs.unobserve(target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -35px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* 4. Filtrado interactivo de productos de alta respuesta */
function initProductFilters() {
  const filterButtons = document.querySelectorAll('.filters button[data-cat]');
  const items = document.querySelectorAll('.grid .item[data-cat]');
  if (!filterButtons.length || !items.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.cat;

      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      items.forEach((item) => {
        const matches = category === 'todos' || item.dataset.cat === category;
        item.classList.remove('fade-in');
        item.style.transitionDelay = '';

        if (matches) {
          item.classList.remove('is-hidden');
          void item.offsetWidth;
          item.classList.add('fade-in');
        } else {
          item.classList.add('is-hidden');
        }
      });
    });
  });
}

/* 5. Autocompletado inteligente en contacto.html si viene desde productos.html */
function initUrlProductPreselection() {
  const form = document.getElementById('contacto-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const producto = params.get('producto');
  if (!producto) return;

  const selectServicio = form.querySelector('select[name="servicio"]');
  const textareaMensaje = form.querySelector('textarea[name="mensaje"]');

  if (selectServicio) {
    const lower = producto.toLowerCase();
    if (lower.includes('parche') || lower.includes('cámara')) {
      selectServicio.value = 'Reparación de pinchazo';
    } else {
      selectServicio.value = 'Compra de neumáticos';
    }
  }

  if (textareaMensaje && !textareaMensaje.value.trim()) {
    textareaMensaje.value = `Hola, me interesa consultar disponibilidad y precio de: ${producto}. Mi vehículo es: `;
    textareaMensaje.focus();
  }
}

/* 6. Validación en tiempo real y envío a WhatsApp */
function initContactForm() {
  const form = document.getElementById('contacto-form');
  const okBanner = document.getElementById('gracias');
  if (!form) return;

  const WHATSAPP_NUMBER = '584247127244';

  const validators = {
    nombre: (val) => (val.trim().length >= 3 ? '' : 'Ingresa tu nombre completo (mínimo 3 caracteres).'),
    telefono: (val) => (/^[0-9+\-\s()]{7,16}$/.test(val.trim()) ? '' : 'Ingresa un número telefónico válido.'),
    mensaje: (val) => (val.trim().length >= 8 ? '' : 'Detalla tu ubicación o el problema con tu neumático.')
  };

  const validateField = (field) => {
    const rule = validators[field.name];
    if (!rule) return true;
    const errorMsg = rule(field.value);
    const errSpan = document.getElementById(`e-${field.name}`);
    if (errSpan) errSpan.textContent = errorMsg;
    field.classList.toggle('invalid', Boolean(errorMsg));
    return !errorMsg;
  };

  form.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('input', () => validateField(input));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = ['nombre', 'telefono', 'mensaje'].map((name) => form.elements[name]);
    const allValid = fields.map(validateField).every(Boolean);

    if (!allValid) {
      const firstInvalid = fields.find((f) => f.classList.contains('invalid'));
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const nombre = form.elements['nombre'].value.trim();
    const telefono = form.elements['telefono'].value.trim();
    const servicio = form.elements['servicio'].value;
    const mensaje = form.elements['mensaje'].value.trim();

    const text = [
      '🔧 *SOLICITUD DE SERVICIO - CAUCHERA MÓVIL*',
      `👤 *Cliente:* ${nombre}`,
      `📞 *Teléfono:* ${telefono}`,
      `🛞 *Servicio:* ${servicio}`,
      `📍 *Detalle / Ubicación:* ${mensaje}`
    ].join('\n');

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (okBanner) okBanner.hidden = false;
    form.reset();
  });
}