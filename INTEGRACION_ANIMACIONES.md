# DOMUS - Guía de Integración de Animaciones

## Overview

Tenés 3 archivos nuevos que integrar:
1. **animations.css** - Estilos de animaciones
2. **animations.js** - Lógica interactiva
3. **components-updated.astro** - Componentes con clases reveal

---

## PASO 1: Crear la estructura de carpetas

```bash
# Estando en /domus-landing

# Crear carpeta para JS
mkdir -p src/js

# Copiar archivo de animaciones
# animations.js → src/js/animations.js
```

---

## PASO 2: Crear archivos CSS y JS

### 2A. Archivo: `src/styles/animations.css`

**Copiar TODO el contenido de `animations.css` que te pasé**

Debe quedar en:
```
src/
└── styles/
    ├── globals.css
    ├── animations.css  ← NUEVO
    └── colors.css (si lo tenés)
```

### 2B. Archivo: `src/js/animations.js`

**Copiar TODO el contenido de `animations.js` que te pasé**

Debe quedar en:
```
src/
└── js/
    └── animations.js  ← NUEVO
```

---

## PASO 3: Actualizar componentes

### 3A. `src/components/HeroSection.astro`

**CAMBIOS:**

1. Agregar clase `reveal` a elementos:

```astro
<!-- ANTES -->
<h1>D O M U S</h1>
<p class="subtitle">...</p>
<p class="description">...</p>
<div class="cta-buttons">...</div>

<!-- DESPUÉS -->
<h1 class="reveal">D O M U S</h1>
<p class="subtitle reveal">...</p>
<p class="description reveal">...</p>
<div class="cta-buttons reveal">...</div>
```

2. Mejorar SVG del logo (reemplazar línea por polígono):

```astro
<!-- ANTES -->
<svg viewBox="0 0 200 100" class="logo-roof">
  <line x1="50" y1="30" x2="100" y2="10" x2="150" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>

<!-- DESPUÉS -->
<svg viewBox="0 0 200 100" class="logo-roof">
  <polyline 
    points="50,50 100,20 150,50" 
    stroke="currentColor" 
    stroke-width="2" 
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
```

3. Agregar en `<style>`:

```astro
<style>
  @import '../styles/animations.css';
  
  /* Resto de estilos del hero... */
</style>
```

---

### 3B. `src/components/HistorySection.astro`

**CAMBIOS:**

Agregar clase `reveal` a:

```astro
<!-- ANTES -->
<h2>Nuestra historia</h2>
<p>Somos una familia...</p>
<p>Nos conocimos...</p>
<!-- etc -->

<div class="pillar">
  <h3>Yoga & Balance</h3>
  ...
</div>

<!-- DESPUÉS -->
<h2 class="reveal">Nuestra historia</h2>
<p class="reveal">Somos una familia...</p>
<p class="reveal">Nos conocimos...</p>
<!-- etc -->

<div class="pillar reveal">
  <h3>Yoga & Balance</h3>
  ...
</div>
```

2. Agregar en `<style>`:

```astro
<style is:global>
  @import '../styles/animations.css';
</style>
```

---

### 3C. `src/components/PacksSection.astro`

**CAMBIOS:**

1. Agregar clase `reveal` a heading:

```astro
<h2 class="reveal">Domus cada mes</h2>
<p class="section-subtitle reveal">Tu caja de sensaciones...</p>
```

2. En el map de packs, agregar clase y delay:

```astro
{packs.map((pack, index) => (
  <div class={`pack-card reveal ${pack.highlight ? 'highlight' : ''}`} 
       style={`animation-delay: ${index * 0.2}s`}>
    <!-- resto del contenido -->
  </div>
))}
```

3. Agregar `reveal` a features:

```astro
<ul class="features">
  {pack.features.map((feature) => (
    <li class="reveal">{feature}</li>
  ))}
</ul>
```

4. Agregar en `<style>`:

```astro
<style is:global>
  @import '../styles/animations.css';
</style>
```

---

### 3D. `src/components/Footer.astro`

**CAMBIOS:**

Agregar `reveal` a footer sections:

```astro
<div class="footer-section reveal">
  <h4>D O M U S</h4>
  ...
</div>

<div class="footer-section reveal">
  <h4>Navegación</h4>
  ...
</div>

<div class="footer-section reveal">
  <h4>Conecta con nosotros</h4>
  ...
</div>
```

Y en `<style>`:

```astro
<style is:global>
  @import '../styles/animations.css';
</style>
```

---

## PASO 4: Actualizar `src/pages/index.astro`

**Este es el archivo PRINCIPAL**

```astro
---
import HeroSection from '../components/HeroSection.astro';
import HistorySection from '../components/HistorySection.astro';
import PacksSection from '../components/PacksSection.astro';
import Footer from '../components/Footer.astro';
import '../styles/globals.css';
import '../styles/animations.css';  ← AGREGAR
---

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOMUS - Todo lo que hace de un lugar, hogar</title>
  <meta name="description" content="Aromas, momentos y sensaciones para hacer de tu espacio, hogar.">
  <meta name="theme-color" content="#988C2D">
  
  <!-- Preload Fonts -->
  <link rel="preload" 
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Bricolage+Grotesque:wght@400;500&display=swap" 
        as="style">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Bricolage+Grotesque:wght@400;500&display=swap" 
        rel="stylesheet">
</head>
<body>
  <HeroSection />
  <HistorySection />
  <PacksSection />
  <Footer />
  
  <!-- Script de animaciones - AGREGAR ESTA LÍNEA -->
  <script src="../js/animations.js"></script>
</body>
</html>
```

---

## PASO 5: Agregar Contact Section (OPCIONAL pero recomendado)

Si quieres agregar un formulario de newsletter:

### 5A. Crear: `src/components/ContactSection.astro`

```astro
---
---

<section id="contact" class="contact-section">
  <div class="container">
    <h2 class="reveal">Mantente conectado</h2>
    <p class="section-subtitle reveal">
      Recibe historias, aromas y momentos directamente en tu inbox
    </p>
    
    <form class="newsletter-form reveal" id="newsletter">
      <div class="form-group">
        <input 
          type="email" 
          placeholder="Tu email" 
          required
          class="form-input"
        />
      </div>
      <div class="form-group">
        <select class="form-select">
          <option value="">¿Qué te interesa?</option>
          <option value="aromas">Aromas</option>
          <option value="experiencias">Experiencias</option>
          <option value="comida">Comida</option>
          <option value="todo">Todo</option>
        </select>
      </div>
      <button type="submit" class="btn">
        Suscribirse
      </button>
    </form>
  </div>
</section>

<style>
  .contact-section {
    background-color: var(--color-beige);
    padding: 6rem 2rem;
  }
  
  .section-subtitle {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .newsletter-form {
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .form-group {
    flex: 1;
    min-width: 200px;
  }
  
  .form-input,
  .form-select {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-olive);
    background-color: white;
    color: var(--color-text);
    font-family: 'Bricolage Grotesque', sans-serif;
    border-radius: 0;
    transition: all 0.3s ease;
  }
  
  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--color-brown);
    box-shadow: 0 0 0 3px rgba(152, 140, 45, 0.1);
  }
  
  @media (max-width: 768px) {
    .newsletter-form {
      flex-direction: column;
    }
  }
</style>

<script>
  document.getElementById('newsletter').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    
    // TODO: Conectar con Zapier / Google Sheets / tu backend
    console.log('Email:', email);
    
    // Feedback visual
    const btn = form.querySelector('.btn');
    btn.textContent = '✓ ¡Gracias!';
    setTimeout(() => {
      btn.textContent = 'Suscribirse';
      form.reset();
    }, 2000);
  });
</script>
```

### 5B. Importar en `index.astro`:

```astro
import ContactSection from '../components/ContactSection.astro';

<!-- En el body, agregar antes del footer: -->
<ContactSection />
<Footer />
```

---

## PASO 6: Estructura final esperada

```
domus-landing/
├── src/
│   ├── components/
│   │   ├── HeroSection.astro          ✓ ACTUALIZADO
│   │   ├── HistorySection.astro       ✓ ACTUALIZADO
│   │   ├── PacksSection.astro         ✓ ACTUALIZADO
│   │   ├── ContactSection.astro       ✓ NUEVO (opcional)
│   │   └── Footer.astro               ✓ ACTUALIZADO
│   ├── pages/
│   │   └── index.astro                ✓ ACTUALIZADO
│   ├── styles/
│   │   ├── globals.css                
│   │   └── animations.css             ✓ NUEVO
│   └── js/
│       └── animations.js              ✓ NUEVO
├── public/
│   └── logo.svg
├── astro.config.mjs
├── package.json
└── .env
```

---

## PASO 7: Testear localmente

```bash
# Detener servidor si está corriendo
# Ctrl + C

# Limpiar caché
rm -rf node_modules/.vite

# Reiniciar dev server
npm run dev
```

**Luego:**
1. Abre http://localhost:3000
2. Scrollea por la página
3. Verás:
   - ✨ Fade-in en títulos
   - 🎨 Colores cambiando suavemente
   - 🎭 Cards que flotan
   - 📱 Botones con ripple
   - 🌊 Parallax subtle
   - ✅ Elementos apareciendo al scroll

---

## PASO 8: Problemas comunes y soluciones

### Problema: Las animaciones no se ven

**Solución:**
```bash
# 1. Limpiar cache
rm -rf .astro

# 2. Reinstalar node_modules
rm -rf node_modules
npm install

# 3. Reiniciar dev server
npm run dev
```

### Problema: El script de JS no carga

**Verificar:**
```astro
<!-- En index.astro -->
<script src="../js/animations.js"></script>

<!-- Debería ser: -->
<script>
  import animations from '../js/animations.js';
</script>

<!-- O en lugar de src, usar: -->
<script is:inline src="/animations.js"></script>
```

### Problema: Las clases `.reveal` no funcionan

**Solución:**
- Verificar que `animations.css` esté importado
- Verificar que `animations.js` esté cargando
- Abrir DevTools → Console → ver si hay errores

---

## PASO 9: Optimizar para producción

Antes de deployar a Vercel:

```bash
# 1. Build local
npm run build

# 2. Preview
npm run preview

# 3. Verificar que todo funciona
# Visitar http://localhost:3000
```

---

## PASO 10: Deploy en Vercel (igual que antes)

```bash
git add .
git commit -m "Agregar animaciones interactivas"
git push origin main

# Vercel auto-detecta cambios y redeploy
```

---

## ANIMACIONES DISPONIBLES (summary)

### En Hero:
- ✨ Fade-in escalonado (h1 → subtitle → description → botones)
- 🎈 Logo flotante
- ⚡ Botones con ripple effect

### En History:
- 📄 Párrafos que entran de izquierda
- 💚 Box de Suri con glow pulse
- 🎯 Pillars que suben al hover

### En Packs:
- 🎪 Cards con entrada escalonada
- 💫 Precio con bounce sutil
- 🔆 Features con slide-in
- 🎁 Premium card con scale al hover

### Global:
- 📜 Scroll reveal (elementos aparecen al scroll)
- 🌊 Parallax subtle
- 🪶 Efecto de humo flotante
- ♿ Reduce-motion para accesibilidad

---

## TIPS DE CUSTOMIZACIÓN

### Cambiar duración de animaciones:

En `animations.css`, cambiar:
```css
animation: fadeIn 1.2s ease-out;
           ↓
         (duración)
```

### Cambiar velocidad de scroll reveal:

En `animations.js`, línea ~30:
```javascript
const elementVisible = 150;  // Cambiar este número
                              // Más pequeño = más pronto
                              // Más grande = más tarde
```

### Desactivar ciertas animaciones en mobile:

En `animations.css` al final, sección "@media":
```css
@media (max-width: 768px) {
  .pack-card.highlight:hover {
    transform: none;  /* Desactivar */
  }
}
```

---

## ¿Necesitas más?

Si querés:
- Animaciones en MouseMove
- Animaciones de confetti
- Animaciones de contador de números
- Efectos de sonido
- Integración con AOS (Animate On Scroll librería)

Avisame y lo agregamos.

---

**¡Listo! Las animaciones están integradas y tu landing tiene VIDA 🎨**
