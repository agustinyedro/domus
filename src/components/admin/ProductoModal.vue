<template>
  <div
    v-if="abierto"
    class="pm-overlay"
    @click.self="cerrar"
  >
    <div
      ref="dialogo"
      class="pm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-titulo"
      @keydown="onKeydown"
    >
      <header class="pm-head">
        <div class="pm-head-text">
          <p class="pm-eyebrow">Alta rápida</p>
          <h2 id="pm-titulo" class="pm-title">Crear producto</h2>
          <p class="pm-sub">Se crea con costo $0: la compra actual le pone el costo.</p>
        </div>
        <button type="button" class="pm-close" aria-label="Cerrar" @click="cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <div class="pm-body">
        <ProductForm @saved="onSaved" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import ProductForm from './ProductForm.vue';

interface ProductoNuevo {
  id: string;
  nombre: string;
  costo?: number;
  grupo_id?: string | null;
  variante?: string;
}

const abierto = ref(false);
const dialogo = ref<HTMLElement | null>(null);
let anterior: HTMLElement | null = null;

function abrir() {
  if (abierto.value) return;
  anterior = (document.activeElement as HTMLElement | null) ?? null;
  abierto.value = true;
  document.body.style.overflow = 'hidden';
  void nextTick(() => {
    const focable = dialogo.value?.querySelector<HTMLElement>('input, select, textarea, button, [href]');
    focable?.focus();
  });
}

function cerrar() {
  if (!abierto.value) return;
  abierto.value = false;
  document.body.style.overflow = '';
  anterior?.focus?.();
}

function onSaved(producto: ProductoNuevo) {
  cerrar();
  document.dispatchEvent(new CustomEvent('domus:producto-creado', { detail: producto }));
}

function focables(): HTMLElement[] {
  if (!dialogo.value) return [];
  return [
    ...dialogo.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    cerrar();
    return;
  }
  if (event.key !== 'Tab') return;
  const lista = focables();
  if (!lista.length) return;
  const primero = lista[0];
  const ultimo = lista[lista.length - 1];
  if (event.shiftKey && document.activeElement === primero) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault();
    primero.focus();
  }
}

onMounted(() => {
  window.addEventListener('domus:abrir-producto-modal', abrir);
});

onBeforeUnmount(() => {
  window.removeEventListener('domus:abrir-producto-modal', abrir);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.pm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(30, 22, 8, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(1rem, 4vh, 3rem) 1rem;
  overflow-y: auto;
}

.pm-dialog {
  width: min(720px, 100%);
  background: var(--admin-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.pm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(0, 0, 0, 0.1));
}

.pm-eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--admin-text-muted, #666);
}

.pm-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--admin-text, #1f1f1f);
}

.pm-sub {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  color: var(--admin-text-muted, #666);
}

.pm-close {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text-muted, #666);
  cursor: pointer;
}

.pm-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--admin-text, #1f1f1f);
}

.pm-close:focus-visible {
  outline: 2px solid var(--admin-accent, #6b5cff);
  outline-offset: 2px;
}

.pm-body {
  padding: 1.5rem;
  max-height: calc(100vh - 10rem);
  overflow-y: auto;
}
</style>
