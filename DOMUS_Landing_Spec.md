# DOMUS - Landing Page Spec
## De Landing a E-commerce (Roadmap)

---

## 1. VISIÓN GENERAL

**Domus** no es solo un negocio: es una filosofía de vida centrada en crear un "hogar" emocional a través de los sentidos, impulsada por la historia de una familia que enfrenta desafíos y encuentra belleza en ellos.

**Tagline:** "Sentir tu hogar en cada detalle"

**Objetivo landing (30 días):** Contar la historia + validar interés en suscripción
**Objetivo ecommerce (60-90 días):** Productos individuales + carrito + pagos recurrentes

---

## 2. ESTRUCTURA DE NAVEGACIÓN

```
INICIO
├── Hero (historia + CTA)
├── Nuestra Historia (emocional)
├── Los Pilares (yoga + familia + inclusión)
├── Sectores (4 categorías con colores distintos)
│   ├── Aromas
│   ├── Comida
│   ├── Ropa
│   └── Experiencias (yoga)
├── Packs/Suscripción (destaque)
├── Blog/Testimonios (opcional fase 1)
└── Contacto + Newsletter

```

---

## 3. SECCIONES DETALLADAS

### 3.1 HERO (Primera sección - 100vh)

**Visual:**
- Fondo: degradado suave que mezcla los 4 colores
- Overlay con opacidad (para legibilidad)
- Foto/video: familia, yoga, algo cálido (NO triste, NO victimista)

**Texto:**
```
DOMUS
Sentir tu hogar en cada detalle

Cada producto, cada experiencia, cada momento 
diseñado para que te sientas como en casa.
Porque el hogar no es un lugar. Es una sensación.

[CTA: "Descubre nuestra historia"]
[CTA secundario: "Suscribirse - Primera box $XX"]
```

**Técnico:**
- Astro component: `<HeroSection />`
- Scroll → siguiente sección

---

### 3.2 NUESTRA HISTORIA (sección emocional)

**Estructura:**

```
NUESTRA HISTORIA

"Somos una familia que cree que la belleza florece en los desafíos.

Nos conocimos [año/contexto breve]. Formamos un hogar basado en:
- El equilibrio del yoga (mente, cuerpo, espíritu)
- La inclusión genuina (nuestras hijas nos enseñan cada día)
- La creación consciente (nada es por accidente)"

[Foto pequeña + nombre: "Mamá - Instructora de yoga"]
[Foto pequeña + nombre: "Papá - Creador digital"]
[Foto pequeña + nombre: "Nellas & Suri - Nuestras maestras"]

SURI - nuestra niña guerrera

Suri nació con parálisis cerebral, cardiopatía de Fallot (operada 4 veces),
y otras complejidades que la hacen ÚNICA.

Hoy, gracias a un equipo de enfermeras y profesionales que amamos,
Suri sigue siendo el corazón que mueve todo lo que hacemos.

Domus existe porque Suri existe.

[Botón: "Leer más sobre Suri" → blog post/página dedicada]
```

**Tone:** Honesto, vulnerable, pero NO deprimiente. Empoderante.

**Foto:** Suri sonriendo (O la familia en momento cotidiano, no "poses tristes")

---

### 3.3 LOS PILARES

**3 columnas o 3 secciones deslizables:**

#### Pilar 1: YOGA & BALANCE
- Ícono: om/meditación
- Texto: "Cada práctica comienza aquí. Equilibrio de mente, cuerpo y espíritu"
- CTA: "Ver clases" (link a sección de experiencias)

#### Pilar 2: INCLUSIÓN GENUINA
- Ícono: corazón/manos
- Texto: "Nuestras hijas nos enseñan que la diversidad es normalidad. Domus es para todes."
- CTA: "Nuestra misión"

#### Pilar 3: CREACIÓN CONSCIENTE
- Ícono: herramientas/luz
- Texto: "Cada aroma, cada pizza, cada prenda: pensada, creada, amada"
- CTA: "Cómo lo hacemos"

---

### 3.4 LOS 4 SECTORES (Núcleo de Domus)

Cada sector tiene:
- **Color único** (que vos ya definiste)
- **Emoji/ícono**
- **Descripción poética**
- **Preview de productos** (foto + nombre)
- **CTA: "Explorar"** (→ sección sectorial)

#### SECTOR 1: AROMAS 🌿
**Color:** Verde/tierra
**Descripción:** 
```
"El olfato es la puerta al recuerdo.
Nuestros sahumerios y aromas te conectan con emociones,
con momentos, con casa."
```
**Productos destacados:**
- Sahumerio de sándalo
- Difusor artemático
- Bloque de incienso

---

#### SECTOR 2: COMIDA 🍕
**Color:** Naranja/calidez
**Descripción:**
```
"La comida casera es acto de amor.
Pizzas congeladas para que disfrutes del resultado,
no de la tarea."
```
**Productos destacados:**
- Pack 5 pizzas variadas
- Masa Premium
- Salsa especial

---

#### SECTOR 3: ROPA 👕
**Color:** Azul/comodidad
**Descripción:**
```
"Ropa que abraza, que respeta tu cuerpo,
que te hace sentir en casa incluso fuera de ella."
```
**Productos destacados:**
- Remeras mindfulness
- Joggers yoga
- Accesorios

---

#### SECTOR 4: EXPERIENCIAS 🧘‍♀️
**Color:** Púrpura/espiritualidad
**Descripción:**
```
"Las mejores sensaciones no se compran.
Se viven. Clases de yoga, talleres, conexión."
```
**Productos destacados:**
- Clase semanal de yoga
- Pack 4 clases
- Taller de fin de semana

---

### 3.5 PACKS / SUSCRIPCIÓN (Sección heroica)

**Destacado visual = esta es la estrella**

```
DOMUS CADA MES
Tu caja de sensaciones. Diseñada para ti.

[3 opciones de packs: Básico | Premium | Deluxe]

PACK BÁSICO - $XX/mes
├─ 3 sahumerios variados
├─ Acceso a 1 clase de yoga
└─ Sorpresa sensorial

PACK PREMIUM - $XX/mes
├─ 5 sahumerios + cartas tarot
├─ Acceso ilimitado a clases
├─ Descuento en pizzas
└─ Box exclusivo

PACK DELUXE - $XX/mes
├─ Todo lo anterior +
├─ Pack de 5 pizzas
├─ Prenda exclusiva
└─ Videollamada con instructora

[CTA gigante: "Comenzar suscripción"]
```

**Nota importante:**
```
"¿No estás seguro? Prueba un pack regalo.
Envíanos a un amigo. Total, la conexión es lo que importa."
```

---

### 3.6 CÓMO EMPEZÓ TODO (Formulario simple)

**Landing fase 1:** Google Form embebido
**Landing fase 2:** Supabase + form nativo

```
¿Quieres recibir noticias sobre Domus?

[Email]
[Nombre]
[¿Qué te interesa? ☐ Aromas ☐ Comida ☐ Yoga ☐ Todo]

[Botón: Suscribirse]
```

Esto va directo a Google Sheets + Airtable (automático vía Zapier)

---

### 3.7 FOOTER

```
DOMUS
Creado por una familia, para sentir más.

Navegación rápida:
- Inicio | Nuestra Historia | Sectores | Suscripción | Contacto

Redes sociales:
- Instagram | TikTok | WhatsApp

Newsletter:
[Email] [Suscribirse]

"Hecho con amor desde [Ciudad, Argentina]"
"© 2024 Domus. Todos los sentidos, todos los derechos"
```

---

## 4. ROADMAP: LANDING → E-COMMERCE

### FASE 1 (Semanas 1-4): LANDING ESTÁTICO
**Stack:**
- Carrd o Webflow (visual, sin código)
- O Astro puro (si quieres práctica)
- Google Forms → Google Sheets
- Stripe embedded (para pagar suscripción)

**Entregables:**
- ✅ Landing con historia
- ✅ Suscripción funcional
- ✅ Validación de demanda
- ❌ No hay carrito
- ❌ No hay inventario

---

### FASE 2 (Semanas 5-8): PRE-E-COMMERCE
**Agregar:**
- Astro + Supabase
- Base de datos: productos, packs, precios
- Carrito básico (localStorage, sin persistencia)
- Checkout → Stripe

**Nueva estructura:**
```
Landing existente +
/productos (listado con filtros)
/pack/[id] (detalle individual)
/carrito (visualizar)
/checkout (Stripe API)
```

---

### FASE 3 (Semanas 9+): ECOMMERCE COMPLETO
**Agregar:**
- Autenticación (Supabase Auth)
- Órdenes persistidas
- Historial de compras
- Suscripciones recurrentes (Stripe Billing)
- Admin panel (Supabase Studio)
- Stock real-time
- Reportes

---

## 5. VISUAL & BRANDING

### Paleta de colores (por sector)

| Sector | Color Primario | Hex | Uso |
|--------|---|---|---|
| Aromas | Verde tierra | #8B7355 | Background, bordes |
| Comida | Naranja calidez | #E8934F | Botones, highlights |
| Ropa | Azul cielo | #4A90E2 | Acentos, links |
| Experiencias | Púrpura espiritual | #9B59B6 | Suscripción, hero |

### Tipografía
- **Headers:** Montserrat Bold (moderna, legible)
- **Body:** Inter Regular (limpio, web-friendly)
- **Acentos:** Playfair Display (elegante, emocional)

### Ícono/Logo
- Incorpora: Casa (Domus) + Corazón + Onda/espiral (yoga)
- Versión simple para favicon
- Versión completa para header

---

## 6. CONTENIDO - PLAN PUBLICACIÓN

### Blog / Historias complementarias (para SEO + conexión)

**Día 1-7:**
- "Nuestra historia: Cómo nació Domus"
- "Quién es Suri y por qué cambió todo"

**Día 8-14:**
- "5 aromas para 5 emociones"
- "Yoga en familia: nuestra práctica diaria"

**Día 15-21:**
- "Pizza congelada, tiempo de calidad"
- "Inclusión genuina: lo que aprendimos"

**Formatos:**
- Blog post (500-800 palabras)
- Mini-video (TikTok/Instagram Reel)
- Carrusel (5-7 slides)

---

## 7. SECCIÓN "PRÓXIMAMENTE" (E-COMMERCE)

Agregar a landing fase 1:

```
🔮 EN CONSTRUCCIÓN

Estamos armando nuestra tienda.
Mientras tanto, reservá tu pack o envíanos un DM.

[Foto: "Equipo trabajando en Domus"]

¿Querés ser de los primeros?
[Email] [Notificarme]
```

**NO es "sorry, coming soon"**
**ES: "Mira lo que estamos creando"**

---

## 8. ESTRUCTURA TÉCNICA (Astro + Supabase)

### Carpetas Astro

```
/src
├── /layouts
│   ├── BaseLayout.astro
│   └── DocsLayout.astro
├── /components
│   ├── HeroSection.astro
│   ├── HistorySection.astro
│   ├── PillarCard.astro
│   ├── SectorCard.astro
│   ├── SubscriptionPacks.astro
│   └── Newsletter.astro
├── /pages
│   ├── index.astro (landing)
│   ├── historia.astro
│   ├── productos.astro
│   ├── [sector].astro (dinámico)
│   ├── pack/[id].astro
│   └── blog/[slug].astro
├── /styles
│   ├── globals.css
│   ├── colors.css
│   └── animations.css
└── /lib
    ├── supabase.ts (client)
    └── stripe.ts (helper)
```

### Supabase Schema (básico fase 2)

```sql
-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  price DECIMAL,
  sector TEXT, -- 'aromas', 'comida', 'ropa', 'experiencias'
  image_url TEXT,
  created_at TIMESTAMP
);

-- Packs
CREATE TABLE packs (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  price DECIMAL,
  products UUID[], -- array de product IDs
  is_subscription BOOLEAN,
  created_at TIMESTAMP
);

-- Órdenes
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_email TEXT,
  pack_id UUID,
  status TEXT, -- 'pending', 'paid', 'shipped'
  created_at TIMESTAMP
);
```

---

## 9. CHECKLIST IMPLEMENTACIÓN

### Semana 1 (Landing MVP)
- [ ] Definir 4 colores finales con cliente
- [ ] Recolectar fotos (familia, productos, Suri)
- [ ] Redactar copy para cada sección
- [ ] Armar en Carrd o Webflow
- [ ] Setup Google Form + Zapier → Sheets

### Semana 2 (Lanzamiento)
- [ ] Instagram preparado (templates, content calendar)
- [ ] Testing en mobile/desktop
- [ ] Primera campaña: WhatsApp a amigos/familia
- [ ] Activar UptimeRobot si usa Supabase

### Semanas 3-4 (Validación)
- [ ] Analizar respuestas del formulario
- [ ] Recibir primeros packs regalo/prueba
- [ ] Recopilar feedback
- [ ] Decidir: ¿escalamos a ecommerce?

---

## 10. DISEÑO VISUAL - WIREFRAME (CONCEPTUAL)

```
[HERO - 100vh]
Domus Logo - Fondo degradado 4 colores
Tagline + Foto familia
CTA x2

[HISTORIA - 80vh]
Foto Suri + historia en prosa
Pilares (3 col)

[4 SECTORES - 80vh cada uno]
Sector 1: Verde + Aromas
Sector 2: Naranja + Comida
Sector 3: Azul + Ropa
Sector 4: Púrpura + Yoga

[PACKS - 60vh]
3 cards: Básico | Premium | Deluxe
CTA gigante

[NEWSLETTER + FOOTER - 40vh]
Email form
Social links
Copyright
```

---

## 11. CONSIDERACIONES SENSIBLES

**Tono sobre Suri:**
- ✅ Empoderador, no victimista
- ✅ Honesto, no "inspirational porn"
- ✅ Su historia es parte, no el producto
- ❌ No fotos clínicas, no detalles médicos innecesarios
- ❌ No "feel good" forzado

**Ejemplo bueno:**
"Suri nació con desafíos. Hoy es nuestra mayor maestra."

**Ejemplo malo:**
"Nuestra hija enferma nos inspiró a ayudar a otros"

---

## 12. PRÓXIMOS PASOS

1. **Esta semana:** 
   - Consolidar colores exactos
   - Recolectar fotos/videos
   - Redactar copy final

2. **Semana que viene:**
   - Armar landing en Carrd/Webflow
   - Setup Google Forms + Stripe
   - Primera publicación Instagram

3. **Dentro de 2 semanas:**
   - Lanzar landing
   - Validar con 10 personas (presencial + Instagram)
   - Decidir: ¿Astro + Supabase ya?

---

**Domus no es un ecommerce.**
**Domus es una invitación a sentirse en casa.**

El negocio viene después.
