# DOMUS - Guía Visual de Animaciones

## Lo que VAS A VER en tu landing

---

## 1. CARGA INICIAL (Hero Section)

### Timeline:
```
t=0ms     → Logo sube/baja (flotante infinito)
          
t=200ms   → "DOMUS" aparece (fade-in)
          
t=400ms   → "Todo lo que hace de un lugar, hogar"
            aparece suavemente
            
t=600ms   → Descripción entra
          
t=900ms   → Botones con animación de entrada
```

### Qué ves:
```
        ↑ ↓        (logo flotando)
      D O M U S
    (apareciendo texto)
      
     [BUTTON]  [BUTTON]  (con animación fade-in)
```

### Hover en botones:
```
ANTES:  [Descubre nuestros packs]

HOVER:  [Descubre nuestros packs] ← brillo pasa
                                      de izquierda 
                                      a derecha
        
CLICK:  [Descubre nuestros packs] ← Ripple effect
        ⊙ (onda circular que expande)
```

---

## 2. HISTORIA SECTION (Scroll down)

### Elementos que aparecen al entrar en viewport:

```
┌─────────────────────────────────┐
│ Nuestra historia ←             │  (entra de
│ (texto aparece)                │   izquierda)
│                                │
│ "Somos una familia que cree..." │
│ (fade-in escalonado)           │
│                                │
│ "Nos conocimos en el yoga..."  │
│ (fade-in escalonado)           │
│                                │
│ ┌─ DESTACA CON GLOW ─────────┐ │
│ │ Suri nació con              │ │ ← Box brilla
│ │ parálisis cerebral...       │ │    pulsante
│ │ ⚡ ⚡ ⚡                       │ │
│ └────────────────────────────┘ │
│                                │
│ "Domus existe porque Suri..."  │
│ (fade-in escalonado)           │
└─────────────────────────────────┘
```

### 3 Pilares (debajo):

```
Antes de scroll:              Después de scroll:
(invisibles)                  (aparecen uno por uno)

                           ┌──────────────────┐
                           │ 🧘 Yoga & Balance│
                           │                  │
                           │ Cada práctica... │
                           └──────────────────┘
                           
                           ┌──────────────────┐
                           │ ❤️ Inclusión    │
                           │   genuina        │
                           │                  │
                           │ Nuestras hijas..│
                           └──────────────────┘
                           
                           ┌──────────────────┐
                           │ ✨ Creación     │
                           │   consciente     │
                           │                  │
                           │ Cada aroma...    │
                           └──────────────────┘
```

### Hover en Pilares:

```
NORMAL:                     HOVER:
┌──────────────────┐       ┌──────────────────┐
│ Yoga & Balance   │       │ Yoga & Balance   │ ↑ (sube 10px)
│                  │  →    │                  │
│ Cada práctica... │       │ Cada práctica... │ (sombra más fuerte)
└──────────────────┘       └──────────────────┘
```

---

## 3. PACKS SECTION (Scrollear más)

### Entrada de cards:

```
Delay 0ms         Delay 400ms        Delay 800ms
│                 │                  │
▼                 ▼                  ▼

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Pack Básico │  │ Pack        │  │ Pack Deluxe │
│             │  │ Premium ⭐   │  │             │
│ $1500/mes   │  │ $2500/mes   │  │ $3500/mes   │
│             │  │             │  │             │
│ • Aromas    │  │ • Todo +    │  │ • Todo +    │
│ • Yoga      │  │ • Tarot     │  │ • Pizzas    │
│ • Sorpresa  │  │ • Descuento │  │ • Prenda    │
│             │  │ • Box       │  │ • Video     │
│ [Comenzar]  │  │ [Comenzar]  │  │ [Comenzar]  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Card Premium (destaca):

```
NORMAL:                        HOVER:

┌─────────────────┐            ┌─────────────────┐
│ Pack Premium ⭐  │ (borde)     │ Pack Premium ⭐  │ (borde + escala)
│                 │            │                 │
│ $2500/mes       │    →       │ $2500/mes       │ ↑ (sube 15px)
│ ━━━━━━━━━━━━━  │            │ ━━━━━━━━━━━━━  │ (1.08x más grande)
│ • Aromas        │            │ • Aromas        │
│ • Yoga ilimitado│            │ • Yoga ilimitado│ (sombra realista)
│ • Tarot         │            │ • Tarot         │
│ • Pizzas        │            │ • Pizzas        │
│                 │            │                 │
│ [Comenzar]      │            │ [Comenzar]      │
└─────────────────┘            └─────────────────┘
```

### Features lista (dentro de cada card):

```
Para cada feature aparecen escalonadas:

t=0ms    → ✓ 3 sahumerios variados (slide-in de izquierda)

t=100ms  → ✓ Acceso a 1 clase de yoga (slide-in)

t=200ms  → ✓ Sorpresa sensorial (slide-in)

t=300ms  → ✓ Entrega en el mes (slide-in)
```

Ves como un efecto "máquina de escribir" visual pero suave.

### Precio con bounce sutil:

```
$1500/mes
   ↑ ↓ (el número sube y baja lentamente)
   
Al hover: PARA de rebotar y cambia a color marrón.
```

---

## 4. SCROLL REVEAL - Elementos generales

### En cualquier sección, cuando scrolleas:

```
FUERA DE VIEWPORT:     EN VIEWPORT:
(no visible)           (entra suavemente)

    X                     ✓
    
█ █ █                  (texto aparece
█ (invisible)          con fade-in
█ █ █                  y sube 20px)
```

**Timing por elemento:**

1er elemento: aparece en 0.1s
2do elemento: aparece en 0.2s
3er elemento: aparece en 0.3s
(etc)

Crea efecto "cascada" muy orgánico.

---

## 5. FOOTER

### Entrada escalonada:

```
Delay 200ms:        Delay 400ms:        Delay 600ms:
                    
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ D O M U S   │  →  │ Navegación  │  →  │ Conecta     │
│             │     │             │     │             │
│ Creado      │     │ • Nuestra   │     │ • Instagram │
│ por una...  │     │   historia  │     │ • WhatsApp  │
└─────────────┘     │ • Packs     │     └─────────────┘
                    │ • Contacto  │
                    └─────────────┘
```

### Links con underline animation:

```
NORMAL:               HOVER:

Nuestra historia      Nuestra historia
                      ━━━━━━━━━━━━━━━━━ ← subrayado aparece
                      
(sin underline)       (underline crece de izq a derecha)
```

---

## 6. EFECTOS ESPECIALES

### Parallax sutil (solo visual):

```
Cuando scrolleas, hay un gradiente de fondo 
que se mueve más lentamente que el contenido.

Efecto: sensación de "profundidad" 3D

Arriba:
█████████████████████████████
█ DOMUS (contenido)
█ moves fast
█████████████████████████████

Fondo:
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░ (gradiente translúcido)
░ moves slow (50% speed)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Efecto de humo flotante (en Hero):

```
Círculos translúcidos que "flotan" y desaparecen
Suave, no distrae, solo agrega atmósfera.

    ◯ (opaco=1)
   ◯ (opaco=0.5) ← flotando up
  ◯ (opaco=0)
 
(invisible)
```

### Ripple en botones:

```
CLICK en botón:

    [Botón]
    
    ⊚ ← onda circular que nace
    
  ⊚ ⊚ ← se expande
  
⊚     ⊚ ← desaparece

(todo en 600ms)
```

---

## 7. EFECTOS POR DISPOSITIVO

### Desktop (pantalla grande):

✅ TODAS las animaciones activas
✅ Parallax
✅ Efecto 3D en cards (sutil)
✅ Hover effects completos
✅ Transiciones largas (0.6s+)

### Tablet:

✅ Animaciones reducidas un poco
❌ No parallax (performance)
❌ No 3D en cards
✅ Hover effects simplificados
✅ Transiciones más cortas (0.3s)

### Mobile:

✅ Scroll reveal sigue funcionando
❌ Sin parallax
❌ Sin 3D
❌ Sin hover effects (sin mouse)
✅ Transiciones RÁPIDAS (0.2s)
✅ Humo flotante desactivado

**La experiencia se adapta sin perder calidad.**

---

## 8. REDUCED MOTION (accesibilidad)

Si el usuario tiene activado "Reduce motion" en SO:

```
Todas las animaciones se DESACTIVAN
(duration = 0.01ms, instantáneo)

Así personas con sensibilidad a movimiento
pueden usar el site sin mareos.
```

---

## 9. RESUMEN DE ANIMACIONES POR SECCIÓN

### HERO
- Logo: float infinito
- Títulos: fade-in escalonado
- Botones: fade-in + ripple al click

### HISTORY  
- Título: slide-in left
- Párrafos: fade-in escalonado
- Box Suri: glow pulse (brilla/oscurece)
- Pilares: fade-in + hover lift

### PACKS
- Título: slide-in left
- Cards: fade-in escalonado
- Premium: scale 1.05 destacada
- Features: slide-in escalonado dentro de card
- Precio: bounce sutil
- Cards: hover lift + shadow

### FOOTER
- Sections: fade-in escalonado
- Links: underline animation hover

### GLOBAL
- Scroll reveal en todo
- Parallax sutil
- Humo flotante
- Smooth scroll links

---

## 10. PERFORMANCE

Cada animación está optimizada:

✅ CSS Transforms (GPU acelerado)
✅ Opacity changes (rápido)
❌ Width/Height changes (lento - evitado)
❌ Layout shifts (evitado)

**Resultado: 60 FPS en la mayoría de dispositivos**

---

## 11. TESTING VISUAL

Para verificar que todo se ve bien:

```bash
npm run dev
# Visita http://localhost:3000

# 1. Carga inicial
# ↑ Verás fade-ins escalonados

# 2. Scrollea lentamente
# ↑ Scroll reveal de elementos

# 3. Scrollea rápido
# ↑ Parallax se nota

# 4. Hover en cards
# ↑ Cards suben, sombra aumenta

# 5. Click en botones
# ↑ Ripple effect

# 6. Resize ventana
# ↑ Animaciones se adaptan
```

---

## 12. CUSTOMIZACIÓN FÁCIL

Si querés cambiar algo:

```css
/* Cambiar velocidad de fade-in */
@keyframes fadeIn {
  ...
}
animation: fadeIn 1.2s ease-out;
                  ↓
            Cambiar aquí (en segundos)

/* Cambiar color de glow */
box-shadow: 0 0 10px rgba(152, 140, 45, 0.3);
                          ↓ ↓ ↓ ↓
                     RGB de color
                     
/* Cambiar distancia del hover lift */
.pillar:hover {
  transform: translateY(-10px);
                            ↑
                      Cambiar aquí (px)
}
```

---

## RESUMEN FINAL

**Tu landing no será estática.**

Cada elemento tiene una razón para moverse:
- Atrae atención ✓
- No abruma ✓
- Es accesible ✓
- Es rápida ✓
- Es sensorial (como Domus) ✓

**Cuando alguien entre, va a sentir que el sitio tiene VIDA. 🎨**

---

¡Ahora a integrar todo! 🚀
