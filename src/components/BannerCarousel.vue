<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type Banner = {
  id: string;
  titulo: string;
  descripcion: string | null;
  mostrar_descripcion: boolean;
  mostrar_precio: boolean;
  texto_cta: string | null;
  imagen_url: string | null;
  posicion_imagen: 'izquierda' | 'derecha';
  estilo: 'oliva' | 'tierra' | 'hueso' | 'oscuro';
  href: string;
  precio: number | null;
  producto_nombre: string | null;
};

const banners = ref<Banner[]>([]);
const index = ref(0);
const listo = ref(false);

let timer: number | undefined;
let touchX = 0;

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function fmtPrecio(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')}`;
}

function ir(i: number) {
  const total = banners.value.length;
  if (!total) return;
  index.value = (i + total) % total;
}

function prev() {
  ir(index.value - 1);
}

function next() {
  ir(index.value + 1);
}

function parar() {
  if (timer) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

function arrancar() {
  parar();
  if (reduceMotion || banners.value.length < 2) return;
  timer = window.setInterval(next, 6000);
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prev();
    arrancar();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    next();
    arrancar();
  }
}

function onTouchStart(e: TouchEvent) {
  touchX = e.changedTouches[0]?.clientX ?? 0;
  parar();
}

function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX;
  if (Math.abs(dx) > 40) {
    if (dx < 0) next();
    else prev();
  }
  arrancar();
}

function onVisibility() {
  if (document.hidden) parar();
  else arrancar();
}

onMounted(async () => {
  try {
    const res = await fetch('/api/tienda/banners', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as Banner[];
      banners.value = Array.isArray(data) ? data : [];
    }
  } catch {
    // Sin banners: no se renderiza nada
  } finally {
    listo.value = true;
    arrancar();
  }
  document.addEventListener('visibilitychange', onVisibility);
});

onBeforeUnmount(() => {
  parar();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <section
    v-if="listo && banners.length"
    class="domus-banners"
    role="region"
    aria-roledescription="carrusel"
    aria-label="Promociones DOMUS"
    tabindex="0"
    @keydown="onKey"
    @mouseenter="parar"
    @mouseleave="arrancar"
    @focusin="parar"
    @focusout="arrancar"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="db-viewport">
      <div class="db-track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <article
          v-for="(b, i) in banners"
          :key="b.id"
          class="db-slide"
          :class="[
            `db-estilo-${b.estilo}`,
            b.imagen_url ? `db-img-${b.posicion_imagen}` : 'db-sin-img',
          ]"
          :aria-hidden="i !== index"
        >
          <div class="db-inner">
            <div class="db-text">
              <p class="db-kicker">Selección DOMUS</p>
              <h2 class="db-title">{{ b.titulo }}</h2>
              <p v-if="b.mostrar_descripcion && b.descripcion" class="db-desc">{{ b.descripcion }}</p>
              <div class="db-actions">
                <p v-if="b.mostrar_precio && b.precio != null" class="db-price">
                  <span>Desde</span>{{ fmtPrecio(b.precio) }}
                </p>
                <a v-if="b.href" class="db-cta" :href="b.href" :tabindex="i === index ? 0 : -1">
                  {{ b.texto_cta || 'Ver más' }}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div v-if="b.imagen_url" class="db-media">
              <span class="db-orbit" aria-hidden="true" />
              <img :src="b.imagen_url" :alt="b.titulo" :loading="i === 0 ? 'eager' : 'lazy'" />
            </div>
          </div>
        </article>
      </div>
    </div>

    <button v-if="banners.length > 1" type="button" class="db-arrow db-arrow-prev" aria-label="Promoción anterior" @click="prev(); arrancar()">‹</button>
    <button v-if="banners.length > 1" type="button" class="db-arrow db-arrow-next" aria-label="Promoción siguiente" @click="next(); arrancar()">›</button>

    <div v-if="banners.length > 1" class="db-dots" role="group" aria-label="Elegir promoción">
      <button
        v-for="(b, i) in banners"
        :key="b.id"
        type="button"
        class="db-dot"
        :class="{ 'is-active': i === index }"
        :aria-current="i === index ? 'true' : undefined"
        :aria-label="`Ir a la promoción ${i + 1}`"
        @click="ir(i); arrancar()"
      />
    </div>
  </section>
</template>

<style scoped>
.domus-banners {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  box-shadow: inset 0 -1px 0 rgba(96, 72, 17, 0.08);
  outline: none;
}

.domus-banners:focus-visible {
  outline: 2px solid var(--color-oliva);
  outline-offset: -2px;
}

.db-viewport {
  overflow: hidden;
}

.db-track {
  display: flex;
  transition: transform 0.5s ease;
  will-change: transform;
}

.db-slide {
  position: relative;
  flex: 0 0 100%;
  min-width: 100%;
  background: var(--db-bg, var(--color-hueso));
  color: var(--db-fg, var(--color-tierra));
  overflow: hidden;
}

.db-slide::before,
.db-slide::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.db-slide::before {
  width: 34rem;
  height: 34rem;
  right: 18%;
  top: -21rem;
  background: rgba(255, 255, 255, 0.1);
}

.db-slide::after {
  width: 22rem;
  height: 22rem;
  left: -8rem;
  bottom: -18rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.db-inner {
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 2.25rem clamp(3.5rem, 8vw, 8.5rem) 4rem;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  min-height: 380px;
}

.db-text {
  min-width: 0;
  max-width: 620px;
}

.db-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  margin: 0 0 0.8rem;
  padding: 0.32rem 0.72rem;
  border: 1px solid color-mix(in srgb, var(--db-fg) 28%, transparent);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.db-title {
  max-width: 12ch;
  margin: 0 0 0.7rem;
  font-family: var(--font-heading);
  font-weight: 500;
  font-size: clamp(2.5rem, 5vw, 4.75rem);
  line-height: 0.96;
  letter-spacing: -0.045em;
  color: var(--db-fg, var(--color-tierra));
}

.db-desc {
  max-width: 45ch;
  margin: 0 0 1.35rem;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.45;
  color: var(--db-fg-soft, rgba(96, 72, 17, 0.82));
}

.db-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.db-price {
  display: flex;
  flex-direction: column;
  margin: 0;
  font-size: clamp(1.45rem, 2.8vw, 2.15rem);
  font-weight: 700;
  line-height: 1;
  color: var(--db-fg, var(--color-tierra));
}

.db-price span {
  margin-bottom: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.db-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 48px;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  background: var(--db-accent, var(--color-oliva));
  color: var(--db-accent-fg, #fff);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.db-cta:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.db-cta:focus-visible {
  outline: 2px solid var(--db-fg, var(--color-tierra));
  outline-offset: 3px;
}

.db-media {
  position: relative;
  min-width: 0;
  min-height: 300px;
  display: grid;
  place-items: center;
}

.db-orbit {
  position: absolute;
  width: min(31vw, 430px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: color-mix(in srgb, var(--db-accent) 17%, transparent);
  box-shadow: 0 0 0 28px color-mix(in srgb, var(--db-accent) 7%, transparent);
}

.db-media img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 320px;
  max-width: 620px;
  object-fit: contain;
  filter: drop-shadow(0 22px 25px rgba(41, 30, 10, 0.2));
  display: block;
  margin: 0 auto;
}

.db-img-izquierda .db-media {
  order: -1;
}

/* Variantes de estilo */
.db-estilo-oliva {
  --db-bg: var(--color-oliva);
  --db-fg: #fff;
  --db-fg-soft: rgba(255, 255, 255, 0.85);
  --db-accent: var(--color-hueso);
  --db-accent-fg: var(--color-tierra);
}

.db-estilo-tierra {
  --db-bg: var(--color-tierra);
  --db-fg: #fff;
  --db-fg-soft: rgba(255, 255, 255, 0.85);
  --db-accent: var(--color-hueso);
  --db-accent-fg: var(--color-tierra);
}

.db-estilo-oscuro {
  --db-bg: var(--color-tierra-dark);
  --db-fg: #fff;
  --db-fg-soft: rgba(255, 255, 255, 0.82);
  --db-accent: var(--color-hueso);
  --db-accent-fg: var(--color-tierra);
}

.db-estilo-hueso {
  --db-bg: var(--color-hueso);
  --db-fg: var(--color-tierra);
  --db-fg-soft: rgba(96, 72, 17, 0.8);
  --db-accent: var(--color-oliva);
  --db-accent-fg: #fff;
}

/* Sin imagen: texto centrado */
.db-sin-img .db-inner {
  justify-content: center;
  text-align: center;
  grid-template-columns: 1fr;
}

.db-sin-img .db-text {
  max-width: 720px;
  margin: 0 auto;
}

.db-sin-img .db-title,
.db-sin-img .db-desc {
  margin-left: auto;
  margin-right: auto;
}

.db-sin-img .db-actions {
  justify-content: center;
}

.db-arrow {
  position: absolute;
  z-index: 3;
  top: 50%;
  width: 48px;
  height: 64px;
  padding: 0;
  border: 0;
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-tierra);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transform: translateY(-50%);
  box-shadow: 0 5px 18px rgba(61, 43, 31, 0.14);
}

.db-arrow-prev {
  left: 0;
  border-radius: 0 999px 999px 0;
}

.db-arrow-next {
  right: 0;
  border-radius: 999px 0 0 999px;
}

.db-arrow:focus-visible {
  outline: 3px solid var(--color-tierra);
  outline-offset: -4px;
}

/* Dots */
.db-dots {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.db-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(96, 72, 17, 0.35);
  background: rgba(96, 72, 17, 0.18);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.db-dot.is-active {
  background: var(--color-oliva);
  border-color: var(--color-oliva);
  transform: scale(1.25);
}

.db-dot:focus-visible {
  outline: 2px solid var(--color-tierra);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .db-inner {
    grid-template-columns: 1fr;
    text-align: center;
    min-height: 0;
    gap: 0.5rem;
    padding: 1.6rem 1.25rem 3.25rem;
  }

  .db-media,
  .db-img-izquierda .db-media {
    order: -1;
    width: 100%;
    min-height: 190px;
  }

  .db-media img {
    height: 210px;
    max-width: 92%;
  }

  .db-orbit {
    width: 190px;
  }

  .db-text {
    margin: 0 auto;
  }

  .db-title {
    max-width: 14ch;
    margin-left: auto;
    margin-right: auto;
    font-size: clamp(2.15rem, 12vw, 3.4rem);
  }

  .db-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .db-actions {
    justify-content: center;
  }

  .db-arrow {
    width: 38px;
    height: 52px;
    font-size: 1.6rem;
  }

  .db-dots {
    bottom: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .db-track,
  .db-cta,
  .db-dot {
    transition: none;
  }
}
</style>
