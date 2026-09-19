# DOMUS Astro Template - Setup Rápido

## 1. CREAR PROYECTO ASTRO

```bash
npm create astro@latest domus-landing
# Elegir: Minimal

cd domus-landing
npm install
```

---

## 2. INSTALAR DEPENDENCIAS FALTANTES

```bash
npm install mercadopago axios
```

---

## 3. ARCHIVOS A CREAR/MODIFICAR

### A. `/src/styles/globals.css`

```css
/* Fuentes */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Bricolage+Grotesque:wght@400;500&display=swap');

/* CSS Variables - Colores DOMUS */
:root {
  --color-olive: #988C2D;
  --color-brown: #604811;
  --color-beige: #DBD190;
  --color-text: #333;
  --color-light: #f9f7f3;
  --color-white: #ffffff;
}

/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Bricolage Grotesque', sans-serif;
  color: var(--color-text);
  background-color: var(--color-white);
  line-height: 1.6;
}

html {
  scroll-behavior: smooth;
}

/* Tipografía */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  line-height: 1.2;
}

h1 {
  font-size: 3.5rem;
  letter-spacing: 0.1em;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

h3 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.8;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 1rem 2.5rem;
  background-color: var(--color-olive);
  color: var(--color-white);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-radius: 0;
}

.btn:hover {
  background-color: var(--color-brown);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-olive);
  border: 2px solid var(--color-olive);
}

.btn-secondary:hover {
  background-color: var(--color-olive);
  color: var(--color-white);
}

/* Secciones */
section {
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Contenedor */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 3rem;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  section {
    padding: 3rem 1rem;
  }
}
```

---

### B. `/src/components/HeroSection.astro`

```astro
---
---

<section class="hero">
  <div class="hero-content">
    <div class="logo-header">
      <svg viewBox="0 0 200 100" class="logo-roof">
        <line x1="50" y1="30" x2="100" y2="10" x2="150" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    
    <h1>D O M U S</h1>
    
    <p class="subtitle">
      Todo lo que hace de un lugar, hogar.
    </p>
    
    <p class="description">
      Aromas, momentos y sensaciones diseñadas para que cada espacio se sienta verdaderamente tuyo.
    </p>
    
    <div class="cta-buttons">
      <button class="btn" onclick="document.getElementById('packs').scrollIntoView()">
        Descubre nuestros packs
      </button>
      <button class="btn btn-secondary" onclick="document.getElementById('history').scrollIntoView()">
        Nuestra historia
      </button>
    </div>
  </div>
</section>

<style>
  .hero {
    background: linear-gradient(135deg, var(--color-beige) 0%, var(--color-light) 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
  }
  
  .hero-content {
    text-align: center;
    max-width: 800px;
  }
  
  .logo-header {
    margin-bottom: 2rem;
  }
  
  .logo-roof {
    width: 120px;
    height: 60px;
    color: var(--color-olive);
    margin: 0 auto;
  }
  
  h1 {
    color: var(--color-olive);
    margin-bottom: 1rem;
  }
  
  .subtitle {
    font-size: 1.3rem;
    color: var(--color-brown);
    font-family: 'Montserrat', sans-serif;
    letter-spacing: 0.05em;
    margin-bottom: 1.5rem;
  }
  
  .description {
    font-size: 1.1rem;
    color: var(--color-text);
    margin-bottom: 3rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .cta-buttons {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  @media (max-width: 768px) {
    .hero {
      min-height: 80vh;
    }
    
    .cta-buttons {
      flex-direction: column;
    }
  }
</style>
```

---

### C. `/src/components/HistorySection.astro`

```astro
---
---

<section id="history" class="history">
  <div class="container">
    <h2>Nuestra historia</h2>
    
    <div class="story-content">
      <p>
        Somos una familia que cree que la belleza florece en los desafíos.
      </p>
      
      <p>
        Nos conocimos en el yoga. Formamos un hogar basado en el equilibrio, 
        la inclusión genuina y la creación consciente. Hoy somos cuatro: 
        nosotros dos, Nellas y Suri.
      </p>
      
      <p class="highlight">
        Suri nació con parálisis cerebral, cardiopatía de Fallot 
        (operada cuatro veces) y otras complejidades que la hacen ÚNICA. 
        Hoy, con un equipo de profesionales que amamos, Suri sigue siendo 
        el corazón que mueve todo lo que hacemos.
      </p>
      
      <p>
        <strong>Domus existe porque Suri existe.</strong>
      </p>
      
      <p>
        La marca nace de la necesidad de crear algo que tenga sentido, 
        que acompañe la vida cotidiana y que, simplemente, haga que un lugar 
        se sienta como hogar.
      </p>
    </div>
    
    <div class="pillars">
      <div class="pillar">
        <h3>Yoga & Balance</h3>
        <p>Cada práctica comienza aquí. Equilibrio de mente, cuerpo y espíritu.</p>
      </div>
      
      <div class="pillar">
        <h3>Inclusión genuina</h3>
        <p>Nuestras hijas nos enseñan que la diversidad es normalidad.</p>
      </div>
      
      <div class="pillar">
        <h3>Creación consciente</h3>
        <p>Cada aroma, cada momento: pensado, creado, amado.</p>
      </div>
    </div>
  </div>
</section>

<style>
  .history {
    background-color: var(--color-white);
  }
  
  .story-content {
    max-width: 700px;
    margin: 2rem auto;
    line-height: 2;
  }
  
  .story-content p {
    font-size: 1.05rem;
    margin-bottom: 1.5rem;
  }
  
  .highlight {
    color: var(--color-olive);
    font-weight: 600;
    padding: 1.5rem;
    background-color: var(--color-beige);
    border-left: 4px solid var(--color-olive);
  }
  
  .pillars {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .pillar {
    padding: 2rem;
    background-color: var(--color-light);
    border-top: 3px solid var(--color-olive);
    text-align: center;
  }
  
  .pillar h3 {
    color: var(--color-olive);
    margin-bottom: 1rem;
  }
  
  .pillar p {
    font-size: 0.95rem;
  }
</style>
```

---

### D. `/src/components/PacksSection.astro`

```astro
---
interface Props {
  mercadoPagoId?: string;
}

const { mercadoPagoId } = Astro.props;

const packs = [
  {
    name: "Pack Básico",
    price: 1500,
    description: "Tu primer paso en Domus",
    features: [
      "3 sahumerios variados",
      "Acceso a 1 clase de yoga",
      "Sorpresa sensorial",
      "Entrega en el mes"
    ]
  },
  {
    name: "Pack Premium",
    price: 2500,
    description: "La experiencia completa",
    features: [
      "5 sahumerios curados",
      "Cartas de tarot mensual",
      "Acceso ilimitado a yoga",
      "Descuento en pizzas",
      "Box exclusivo"
    ],
    highlight: true
  },
  {
    name: "Pack Deluxe",
    price: 3500,
    description: "Lo máximo de Domus",
    features: [
      "Todo lo anterior +",
      "Pack de 5 pizzas congeladas",
      "Prenda exclusiva",
      "Videollamada con instructora",
      "Sorpresas mensuales"
    ]
  }
];
---

<section id="packs" class="packs-section">
  <div class="container">
    <h2>Domus cada mes</h2>
    <p class="section-subtitle">Tu caja de sensaciones. Diseñada para ti.</p>
    
    <div class="packs-grid">
      {packs.map((pack) => (
        <div class={`pack-card ${pack.highlight ? 'highlight' : ''}`}>
          <h3>{pack.name}</h3>
          <p class="pack-description">{pack.description}</p>
          
          <div class="price">
            ${pack.price}
            <span class="frequency">/mes</span>
          </div>
          
          <ul class="features">
            {pack.features.map((feature) => (
              <li>✓ {feature}</li>
            ))}
          </ul>
          
          <button 
            class="btn" 
            data-pack={pack.name}
            data-price={pack.price}
          >
            Comenzar
          </button>
        </div>
      ))}
    </div>
    
    <p class="cta-note">
      ¿No estás seguro? Prueba un pack regalo. Envíanos a un amigo.
      <br/>
      Total, la conexión es lo que importa.
    </p>
  </div>
</section>

<style>
  .packs-section {
    background: linear-gradient(135deg, var(--color-beige) 0%, var(--color-light) 100%);
  }
  
  .section-subtitle {
    text-align: center;
    font-size: 1.2rem;
    color: var(--color-text);
    margin-bottom: 3rem;
  }
  
  .packs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .pack-card {
    background: var(--color-white);
    padding: 2rem;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .pack-card:hover {
    box-shadow: 0 10px 30px rgba(152, 140, 45, 0.15);
  }
  
  .pack-card.highlight {
    border: 2px solid var(--color-olive);
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(152, 140, 45, 0.2);
  }
  
  .pack-card h3 {
    color: var(--color-olive);
    margin-bottom: 0.5rem;
  }
  
  .pack-description {
    font-size: 0.9rem;
    color: var(--color-text);
    font-style: italic;
    margin-bottom: 1.5rem;
  }
  
  .price {
    font-size: 2rem;
    color: var(--color-olive);
    font-weight: 700;
    margin-bottom: 1.5rem;
    font-family: 'Montserrat', sans-serif;
  }
  
  .frequency {
    font-size: 1rem;
    color: var(--color-text);
    font-weight: 400;
  }
  
  .features {
    list-style: none;
    margin-bottom: 2rem;
  }
  
  .features li {
    padding: 0.5rem 0;
    color: var(--color-text);
    font-size: 0.95rem;
  }
  
  .cta-note {
    text-align: center;
    color: var(--color-brown);
    font-style: italic;
    margin-top: 2rem;
  }
  
  @media (max-width: 768px) {
    .pack-card.highlight {
      transform: scale(1);
    }
  }
</style>

<script>
  // Mercado Pago Integration
  document.querySelectorAll('.btn[data-price]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const packName = e.target.getAttribute('data-pack');
      const price = parseInt(e.target.getAttribute('data-price'));
      
      // Crear preferencia en Mercado Pago
      try {
        // Aquí va la lógica de MP
        // Por ahora, mostrar en consola
        console.log(`Pack: ${packName}, Precio: $${price}`);
        alert(`Iniciando pago para: ${packName}`);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  });
</script>
```

---

### E. `/src/components/Footer.astro`

```astro
---
---

<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-section">
        <h4>D O M U S</h4>
        <p>Creado por una familia, para sentir más.</p>
      </div>
      
      <div class="footer-section">
        <h4>Navegación</h4>
        <ul>
          <li><a href="#history">Nuestra historia</a></li>
          <li><a href="#packs">Packs</a></li>
          <li><a href="#contact">Contacto</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>Conecta con nosotros</h4>
        <ul>
          <li><a href="https://instagram.com" target="_blank">Instagram</a></li>
          <li><a href="https://wa.me" target="_blank">WhatsApp</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>
        Hecho con amor desde Argentina 🧡
      </p>
      <p>
        © 2024 Domus. Todo lo que hace hogar.
      </p>
    </div>
  </div>
</footer>

<style>
  .footer {
    background-color: var(--color-brown);
    color: var(--color-beige);
    padding: 4rem 2rem 2rem;
  }
  
  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 3rem;
    margin-bottom: 3rem;
  }
  
  .footer-section h4 {
    color: var(--color-beige);
    margin-bottom: 1rem;
    font-size: 1rem;
  }
  
  .footer-section p {
    margin: 0;
    font-size: 0.95rem;
  }
  
  .footer-section ul {
    list-style: none;
  }
  
  .footer-section li {
    margin-bottom: 0.5rem;
  }
  
  .footer-section a {
    color: var(--color-beige);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  
  .footer-section a:hover {
    color: var(--color-olive);
  }
  
  .footer-bottom {
    border-top: 1px solid rgba(219, 209, 144, 0.2);
    padding-top: 2rem;
    text-align: center;
  }
  
  .footer-bottom p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }
</style>
```

---

### F. `/src/pages/index.astro` (Principal)

```astro
---
import HeroSection from '../components/HeroSection.astro';
import HistorySection from '../components/HistorySection.astro';
import PacksSection from '../components/PacksSection.astro';
import Footer from '../components/Footer.astro';
import '../styles/globals.css';
---

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOMUS - Todo lo que hace de un lugar, hogar</title>
  <meta name="description" content="Aromas, momentos y sensaciones para hacer de tu espacio, hogar.">
  
  <!-- Mercado Pago SDK (agregar después) -->
  <!-- <script src="https://sdk.mercadopago.com/js/v2"></script> -->
</head>
<body>
  <HeroSection />
  <HistorySection />
  <PacksSection />
  <Footer />
</body>
</html>
```

---

## 4. CONFIGURAR MERCADO PAGO

### Paso 1: Crear cuenta en MP
1. Ve a https://www.mercadopago.com.ar
2. Registra con tu email + DNI
3. Accede a tu dashboard

### Paso 2: Obtener credenciales
1. En dashboard → Configuración
2. Busca "Credenciales"
3. Copia:
   - `PUBLIC_KEY` (comienza con "APP_")
   - `ACCESS_TOKEN` (privada, nunca la compartas)

### Paso 3: Crear archivo `.env`

```bash
# .env (en raíz del proyecto)
PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_xxxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_xxxxxxxxxxxxx
```

### Paso 4: Crear preferencia de pago

Crear archivo `/src/pages/api/mercadopago-preference.json.ts`:

```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { packName, price } = await request.json();
    
    const preference = {
      items: [
        {
          title: `DOMUS - ${packName}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: price,
        }
      ],
      payer: {
        name: "Cliente DOMUS",
        email: "cliente@domus.com",
      },
      back_urls: {
        success: "https://tudominio.com/success",
        failure: "https://tudominio.com/failure",
        pending: "https://tudominio.com/pending"
      },
      auto_return: "approved",
    };
    
    // Aquí iría la llamada a MP API
    // Por ahora, retornar mock
    return new Response(JSON.stringify({
      id: "mock-preference-id",
      init_point: "https://www.mercadopago.com/checkout/pay/mock"
    }));
    
  } catch (error) {
    return new Response(JSON.stringify({ error }), { status: 400 });
  }
};
```

---

## 5. DESPLEGAR EN VERCEL

```bash
# 1. Inicializar Git
git init
git add .
git commit -m "Initial commit"

# 2. Crear repo en GitHub
# (ir a github.com → New repository → copiar instrucciones)

# 3. Push a GitHub
git remote add origin https://github.com/tuusuario/domus-landing.git
git branch -M main
git push -u origin main

# 4. Deploy en Vercel
# Ir a https://vercel.com
# Conectar GitHub → seleccionar repo → Deploy
# (Vercel lee astro.config.mjs automáticamente)

# 5. Agregar variables de entorno en Vercel
# Settings → Environment Variables
# MERCADOPAGO_ACCESS_TOKEN = APP_xxxxx
```

---

## 6. ESTRUCTURA FINAL

```
domus-landing/
├── src/
│   ├── components/
│   │   ├── HeroSection.astro
│   │   ├── HistorySection.astro
│   │   ├── PacksSection.astro
│   │   └── Footer.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       └── mercadopago-preference.json.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── logo.svg (tu logo Domus)
├── astro.config.mjs
├── package.json
└── .env
```

---

## 7. PRÓXIMOS PASOS

✅ **Esta semana:**
- [ ] Crear proyecto Astro
- [ ] Copiar componentes
- [ ] Agregar fotos (hero, historia)
- [ ] Setup Mercado Pago
- [ ] Deploy en Vercel

✅ **Semana 2:**
- [ ] Probar pagos con Mercado Pago
- [ ] Publicar en Instagram
- [ ] Validar con 10 personas

✅ **Semana 3:**
- [ ] Agregar Supabase si hay demanda
- [ ] Crear formulario de suscriptores
- [ ] Análisis de primeros interesados

---

## 8. COMANDOS ÚTILES

```bash
# Desarrollo local
npm run dev
# → http://localhost:3000

# Build para producción
npm run build

# Preview de build
npm run preview

# Instalar dependencia
npm install nombre-paquete
```

---

**¿Dudas con algo? Preguntame directamente.**

Esto es lo más importante: **empieza esta semana, mide en 30 días.**
