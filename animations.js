// DOMUS - Animaciones Interactivas JavaScript

// ============================================
// 1. SCROLL REVEAL - Elementos entran en vista
// ============================================

const revealElements = () => {
  const reveals = document.querySelectorAll('.reveal');
  
  reveals.forEach(element => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;
    
    if (elementTop < windowHeight - elementVisible) {
      element.classList.add('active');
    }
  });
};

window.addEventListener('scroll', revealElements);
// Ejecutar también al cargar
revealElements();

// ============================================
// 2. PARALLAX EFFECT - Fondo se mueve más lento
// ============================================

const parallaxEffect = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    hero.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
  });
};

// Ejecutar al cargar
parallaxEffect();

// ============================================
// 3. SMOOTH SCROLL - Links suave
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============================================
// 4. HOVER EFFECT EN CARDS
// ============================================

const addCardHoverEffects = () => {
  const cards = document.querySelectorAll('.pack-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      // Efecto 3D sutil (solo en desktop)
      if (window.innerWidth > 768) {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      }
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'none';
    });
  });
};

addCardHoverEffects();

// ============================================
// 5. ANIMATED COUNTER - Para números si los necesitas
// ============================================

const animateCounter = (element, target, duration = 2000) => {
  let start = 0;
  const increment = target / (duration / 16);
  
  const counter = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(counter);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
};

// Usar si necesitas: <span class="counter" data-target="1500">0</span>
document.querySelectorAll('.counter').forEach(counter => {
  const target = parseInt(counter.dataset.target);
  // Animar cuando entra en viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  });
  observer.observe(counter);
});

// ============================================
// 6. EFECTOS DE HUMO FLOTANTE (dinámico)
// ============================================

const createSmokeEffects = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  // Crear partículas de humo
  for (let i = 0; i < 3; i++) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke-effect';
    smoke.style.top = Math.random() * 80 + 10 + '%';
    smoke.style.left = Math.random() * 80 + 10 + '%';
    smoke.style.animationDelay = Math.random() * 3 + 's';
    hero.appendChild(smoke);
  }
};

createSmokeEffects();

// ============================================
// 7. BOTONES CON FEEDBACK VISUAL
// ============================================

const enhanceButtons = () => {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Efecto ripple
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = '0';
      ripple.style.height = '0';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.pointerEvents = 'none';
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      // Animar ripple
      ripple.animate([
        { width: '0', height: '0', opacity: '1' },
        { width: '300px', height: '300px', opacity: '0' }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0, 0, 0.2, 1)'
      });
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
};

enhanceButtons();

// ============================================
// 8. OBSERVER PARA LAZY LOAD DE IMÁGENES
// ============================================

const observeImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

observeImages();

// ============================================
// 9. ANIMACIÓN AL CAMBIAR VIEWPORT
// ============================================

const handleResize = () => {
  // Recalcular animaciones si cambia el tamaño
  const isMobile = window.innerWidth < 768;
  
  document.querySelectorAll('.pack-card').forEach(card => {
    if (isMobile) {
      card.style.transform = 'none';
    }
  });
};

window.addEventListener('resize', handleResize);

// ============================================
// 10. MARCADO DE SECCIÓN ACTIVA EN NAV
// ============================================

const highlightActiveSection = () => {
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    // Aquí podrías actualizar nav links si los tienes
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
};

// highlightActiveSection(); // Descomentar si tienes nav

// ============================================
// 11. TOGGLE DARK/LIGHT MODE (opcional)
// ============================================

const initThemeToggle = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
};

// initThemeToggle(); // Descomentar si quieres dark mode

// ============================================
// 12. PERFORMANCE OPTIMIZATION
// ============================================

// Debounce para scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usar: window.addEventListener('scroll', debounce(miFunction, 150));

// ============================================
// 13. INICIALIZACIÓN GENERAL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🏠 DOMUS Landing - Animaciones activadas');
  
  // Agregar clase de loaded al body
  document.body.classList.add('loaded');
  
  // Inicializar Intersection Observer para todas las secciones
  const sections = document.querySelectorAll('section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });
  
  sections.forEach(section => sectionObserver.observe(section));
});

// ============================================
// 14. ANALYTICS / TRACKING (opcional)
// ============================================

// Trackear clicks en botones
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const packName = this.getAttribute('data-pack') || 'button';
    const price = this.getAttribute('data-price') || '0';
    
    // Aquí enviarías a Google Analytics, Mixpanel, etc.
    console.log(`Click en: ${packName} - Precio: $${price}`);
    
    // Ejemplo con GA4:
    // gtag('event', 'pack_click', {
    //   'pack_name': packName,
    //   'price': price
    // });
  });
});

// ============================================
// 15. FORM VALIDATION (cuando agregues forms)
// ============================================

const validateForm = (formId) => {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = form.querySelector('input[type="email"]');
    if (!email.value.includes('@')) {
      email.style.borderColor = '#E74C3C';
      email.classList.add('shake');
      setTimeout(() => email.classList.remove('shake'), 500);
      return;
    }
    
    // Si valida, enviar
    console.log('Form válido, enviando...');
  });
};

// ============================================
// 16. EFECTO DE SCROLL SUAVE EN TODO
// ============================================

// Ya está con scroll-behavior: smooth en CSS
// pero puedes mejorarlo con este polyfill si necesitas IE support

// ============================================
// 17. DETECCIÓN DE DISPOSITIVO TÁCTIL
// ============================================

const isTouchDevice = () => {
  return (('ontouchstart' in window) ||
          (navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints > 0));
};

if (isTouchDevice()) {
  document.body.classList.add('touch-device');
  // Reducir animaciones en touch devices
  document.documentElement.style.setProperty('--animation-duration', '0.5s');
}

// ============================================
// 18. PRELOAD DE RECURSOS
// ============================================

const preloadResources = () => {
  // Precargar fuentes
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700';
  document.head.appendChild(link);
};

preloadResources();

// ============================================
// FIN DE ANIMACIONES
// ============================================

console.log('✨ Todas las animaciones cargadas correctamente');
