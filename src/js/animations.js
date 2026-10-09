import { config } from '../config';

// DOMUS - Animaciones JavaScript (Simplificado y Corregido)

// ============================================
// 1. SCROLL REVEAL - Intersection Observer
// ============================================

const initScrollReveal = () => {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  
  if (!reveals.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Opcional: dejar de observar después de animar
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  reveals.forEach(el => observer.observe(el));
};

// ============================================
// 2. NAVBAR - Aparece al hacer scroll
// ============================================

const initNavbar = () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  let lastScroll = 0;
  const scrollThreshold = 100;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > scrollThreshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
};

// ============================================
// 3. NAVBAR - Sección activa
// ============================================

const initActiveSection = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (!sections.length || !navLinks.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px -50% 0px'
  });
  
  sections.forEach(section => observer.observe(section));
};

// ============================================
// 4. SMOOTH SCROLL - Links internos
// ============================================

const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Cerrar menú mobile si está abierto
        const mobileMenu = document.querySelector('.mobile-menu');
        const hamburger = document.querySelector('.hamburger');
        if (mobileMenu?.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          hamburger?.classList.remove('active');
          hamburger?.setAttribute('aria-expanded', 'false');
          hamburger?.setAttribute('aria-label', 'Abrir menú');
        }
      }
    });
  });
};

// ============================================
// 5. HAMBURGER MENU - Mobile
// ============================================

const initHamburger = () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (!hamburger || !mobileMenu) return;

  const setMenu = (open) => {
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      mobileMenu.querySelector('a')?.focus();
    }
  };

  hamburger.addEventListener('click', () => {
    setMenu(!mobileMenu.classList.contains('active'));
  });

  // Cerrar al hacer click en un link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setMenu(false);
      hamburger.focus();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
      setMenu(false);
      hamburger.focus();
    }
  });
};

// ============================================
// 6. PARALLAX SUTIL - Hero background
// ============================================

const initParallax = () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      hero.style.backgroundPositionY = `${scrolled * 0.3}px`;
    }
  }, { passive: true });
};

// ============================================
// 7. CARRITO - LocalStorage
// ============================================

const CartManager = {
  key: 'domus_cart_v2',
  
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },
  
  saveCart(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
    this.updateCartCount();
    this.updateCartDisplay();
    window.dispatchEvent(new CustomEvent('domus:cart-updated', { detail: { ids: cart.map(i => i.id) } }));
  },
  
  addItem(product) {
    const cart = this.getCart();
    const existing = cart.find(item => item.id === product.id);
    const stock = Number(product.stock);
    const tieneStock = Number.isFinite(stock) && stock >= 0;
    const cantidad = Math.max(1, Math.floor(Number(product.quantity) || 1));

    if (existing) {
      if (tieneStock && existing.quantity + cantidad > stock) {
        this.showNotification(stock > 0 ? `Solo quedan ${stock} de ${product.name}` : `${product.name} sin stock por ahora`);
        return;
      }
      existing.quantity += cantidad;
      if (product.image && !existing.image) existing.image = product.image;
      if (tieneStock) existing.stock = stock;
    } else {
      if (tieneStock && stock <= 0) {
        this.showNotification(`${product.name} sin stock por ahora`);
        return;
      }
      if (tieneStock && cantidad > stock) {
        this.showNotification(`Solo quedan ${stock} de ${product.name}`);
        return;
      }
      cart.push({ ...product, quantity: cantidad });
    }

    this.saveCart(cart);
    this.showNotification(`${product.name} agregado al carrito`, { label: 'Ir al carrito', href: '/carrito' });
  },

  removeItem(productId) {
    const cart = this.getCart().filter(item => item.id !== productId);
    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
    this.showNotification('Carrito vaciado');
  },
  
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        const stock = Number(item.stock);
        if (Number.isFinite(stock) && stock >= 0 && quantity > stock) {
          this.showNotification(stock > 0 ? `Solo quedan ${stock} de ${item.name}` : `${item.name} sin stock por ahora`);
          return;
        }
        item.quantity = quantity;
        this.saveCart(cart);
      }
    }
  },
  
  getTotal() {
    return this.getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  getCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },
  
  updateCartCount() {
    const countElements = document.querySelectorAll('.cart-count');
    const count = this.getCount();
    countElements.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },
  
  updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total-amount');
    const cartCountLabel = document.querySelector('.cart-count-label');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearBtn = document.getElementById('clear-cart-btn');

    if (!cartItems) return;

    const cart = this.getCart();
    const empty = cart.length === 0;

    if (empty) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <p>Tu carrito está vacío</p>
          <a href="/tienda" class="btn cart-empty-cta">Explorar la tienda</a>
        </div>`;
      if (cartTotal) cartTotal.textContent = '$0';
      if (cartCountLabel) cartCountLabel.textContent = '';
      if (checkoutBtn) checkoutBtn.setAttribute('hidden', '');
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    cartItems.innerHTML = cart.map(item => {
      const subtotal = Number(item.price) * item.quantity;
      const stock = Number(item.stock);
      const tope = Number.isFinite(stock) && stock >= 0 && item.quantity >= stock;
      const thumb = item.image
        ? `<img src="${item.image}" alt="" loading="lazy" class="cart-thumb" onerror="this.remove()" />`
        : `<span class="cart-thumb cart-thumb-ph" aria-hidden="true">D</span>`;
      return `
      <div class="cart-item" data-id="${item.id}">
        ${thumb}
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="cart-item-price">$${Number(item.price).toLocaleString('es-AR')} c/u</p>
          <div class="cart-item-controls">
            <button class="quantity-btn" aria-label="Quitar uno"
              ${item.quantity <= 1 ? 'disabled' : ''}
              onclick="CartManager.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span class="cart-quantity">${item.quantity}</span>
            <button class="quantity-btn" aria-label="Agregar uno"
              ${tope ? 'disabled title="Stock máximo"' : ''}
              onclick="CartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
            <button class="remove-btn" aria-label="Quitar del carrito" title="Quitar del carrito"
              onclick="CartManager.removeItem('${item.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <p class="cart-item-subtotal">$${subtotal.toLocaleString('es-AR')}</p>
      </div>`;
    }).join('');

    const count = this.getCount();
    if (cartTotal) cartTotal.textContent = `$${this.getTotal().toLocaleString('es-AR')}`;
    if (cartCountLabel) cartCountLabel.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
    if (checkoutBtn) checkoutBtn.removeAttribute('hidden');
    if (clearBtn) clearBtn.style.display = '';
  },
  
  // action opcional: { label, href? , onClick? } agrega un botón al toast
  showNotification(message, action) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');

    const texto = document.createElement('span');
    texto.className = 'cart-notification-text';
    texto.textContent = message;
    notification.appendChild(texto);

    let temporizador;
    const ocultar = () => {
      clearTimeout(temporizador);
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };

    if (action && action.label) {
      const control = document.createElement(action.href ? 'a' : 'button');
      control.className = 'cart-notification-action';
      if (action.href) control.setAttribute('href', action.href);
      else control.setAttribute('type', 'button');
      control.textContent = action.label;
      control.addEventListener('click', (e) => {
        if (!action.href) {
          e.preventDefault();
          action.onClick?.();
        }
        ocultar();
      });
      notification.appendChild(control);
    }

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);

    const espera = action && action.label ? 4500 : 2000;
    temporizador = setTimeout(ocultar, espera);

    // Con botón: pausar al pasar el mouse o al enfocarlo
    if (action && action.label) {
      const pausar = () => clearTimeout(temporizador);
      const reanudar = () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(ocultar, 2500);
      };
      notification.addEventListener('mouseenter', pausar);
      notification.addEventListener('focusin', pausar);
      notification.addEventListener('mouseleave', reanudar);
      notification.addEventListener('focusout', reanudar);
    }
  },
  
  toggleCart() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartOverlay = document.querySelector('.cart-overlay');
    if (cartSidebar) {
      const open = !cartSidebar.classList.contains('open');
      cartSidebar.classList.toggle('open', open);
      cartOverlay?.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        cartSidebar.querySelector('.cart-close')?.focus();
      }
    }
  }
};

// Hacer global para uso en onclick
window.CartManager = CartManager;

// ============================================
// 8. PACK BUTTONS - WhatsApp redirect
// ============================================

const initPackButtons = () => {
  const packBtns = document.querySelectorAll('.pack-btn');
  if (!packBtns.length) return;
  
  packBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const message = btn.dataset.message;
      const phoneNumber = config.whatsapp.phoneNumber;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    });
  });
};

// ============================================
// 9. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavbar();
  initActiveSection();
  initSmoothScroll();
  initHamburger();
  initParallax();
  initPackButtons();
  CartManager.updateCartCount();
  CartManager.updateCartDisplay();

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const cartSidebar = document.querySelector('.cart-sidebar');
    if (cartSidebar?.classList.contains('open')) {
      CartManager.toggleCart();
    }
  });

  // Marcar body como loaded
  document.body.classList.add('loaded');
});
