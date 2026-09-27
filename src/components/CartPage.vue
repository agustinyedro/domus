<template>
  <section class="cp">
    <header class="cp-head">
      <h1 class="cp-title">Mi carrito</h1>
      <p v-if="items.length" class="cp-count">
        {{ items.length }} {{ items.length === 1 ? 'producto' : 'productos' }}
      </p>
    </header>

    <!-- Éxito -->
    <div v-if="exito" class="cp-done" tabindex="-1" ref="exitoRef">
      <p class="cp-done-mark" aria-hidden="true">✓</p>
      <h2>Tu pedido quedó registrado</h2>
      <p class="cp-done-text">{{ exito }}</p>
      <div class="cp-done-actions">
        <a v-if="whatsappUrl" class="cp-btn cp-btn-primary" :href="whatsappUrl" target="_blank" rel="noopener">
          Abrir WhatsApp
        </a>
        <a class="cp-btn cp-btn-ghost" href="/tienda">Seguir comprando</a>
      </div>
    </div>

    <!-- Vacío -->
    <div v-else-if="!items.length" class="cp-empty">
      <p>Tu carrito está vacío.</p>
      <a class="cp-btn cp-btn-primary" href="/tienda">Explorar la tienda</a>
    </div>

    <!-- Carrito con productos -->
    <div v-else class="cp-grid">
      <section class="cp-items" aria-label="Productos en el carrito">
        <article v-for="item in items" :key="item.id" class="cp-item">
          <img
            v-if="item.image"
            class="cp-thumb"
            :src="item.image"
            :alt="item.name"
            loading="lazy"
            @error="sinFoto"
          />
          <span v-else class="cp-thumb cp-thumb-ph" aria-hidden="true">D</span>

          <div class="cp-info">
            <h2 class="cp-name">{{ item.name }}</h2>
            <p class="cp-unit">${{ fmt(item.price) }} c/u</p>
            <div class="cp-controls">
              <div class="cp-stepper" role="group" :aria-label="`Cantidad de ${item.name}`">
                <button
                  class="cp-step"
                  type="button"
                  :disabled="item.quantity <= 1"
                  :aria-label="`Quitar uno de ${item.name}`"
                  @click="cambiar(item, -1)"
                >−</button>
                <span class="cp-qty">{{ item.quantity }}</span>
                <button
                  class="cp-step"
                  type="button"
                  :disabled="hayTope(item)"
                  :aria-label="`Agregar uno de ${item.name}`"
                  @click="cambiar(item, 1)"
                >+</button>
              </div>
              <button class="cp-remove" type="button" @click="quitar(item)">Eliminar</button>
            </div>
          </div>

          <p class="cp-subtotal">${{ fmt(item.price * item.quantity) }}</p>
        </article>

        <div class="cp-items-foot">
          <button class="cp-clear" type="button" @click="vaciar">Vaciar carrito</button>
          <a class="cp-back" href="/tienda">← Seguir comprando</a>
        </div>
      </section>

      <aside id="pago" class="cp-summary" aria-labelledby="cp-pago-title" tabindex="-1" ref="pagoRef">
        <h2 id="cp-pago-title" class="cp-sum-title">Finalizar compra</h2>

        <dl class="cp-totals">
          <div class="cp-row">
            <dt>Subtotal (efectivo)</dt>
            <dd>${{ fmt(base) }}</dd>
          </div>
          <div v-if="metodo === 'MP' && final > base" class="cp-row">
            <dt>Recargo tarjeta</dt>
            <dd>+${{ fmt(final - base) }}</dd>
          </div>
          <div class="cp-row cp-row-total">
            <dt>Total</dt>
            <dd aria-live="polite">${{ fmt(final) }}</dd>
          </div>
        </dl>

        <div class="cp-fields">
          <label for="cp-nombre">Tu nombre</label>
          <input
            id="cp-nombre"
            v-model.trim="nombre"
            type="text"
            autocomplete="name"
            placeholder="Ej: María"
            maxlength="255"
            @input="error = ''"
          />

          <label for="cp-tel">Teléfono / WhatsApp</label>
          <input
            id="cp-tel"
            v-model.trim="telefono"
            type="tel"
            autocomplete="tel"
            placeholder="Ej: 11 1234 5678"
            maxlength="50"
            @input="error = ''"
          />

          <fieldset class="cp-method">
            <legend>Método de pago</legend>
            <label class="cp-radio">
              <input v-model="metodo" type="radio" value="EFECTIVO" />
              <span>
                <strong>Efectivo · precio final</strong>
                <small>Sin recargos, coordinamos la entrega por WhatsApp</small>
              </span>
            </label>
            <label class="cp-radio">
              <input v-model="metodo" type="radio" value="MP" />
              <span>
                <strong>Mercado Pago</strong>
                <small>Tarjeta o débito · se agrega el recargo de tarjeta</small>
              </span>
            </label>
          </fieldset>
        </div>

        <p v-if="error" class="cp-error" role="alert">{{ error }}</p>

        <button class="cp-btn cp-btn-primary cp-confirm" type="button" :disabled="enviando" @click="confirmar">
          {{ enviando ? 'Procesando…' : 'Confirmar pedido' }}
        </button>
        <button class="cp-alt" type="button" @click="consultar">o consultanos por WhatsApp</button>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  abrirUrl,
  calcularTotales,
  enviarPedido,
  type ItemCarrito,
  leerCarrito,
  limpiarCarrito,
  type MetodoPago,
  mensajeWhatsAppConsultar,
  urlWhatsApp,
} from '@/js/checkout';

const items = ref<ItemCarrito[]>([]);
const nombre = ref('');
const telefono = ref('');
const metodo = ref<MetodoPago>('EFECTIVO');
const enviando = ref(false);
const error = ref('');
const exito = ref('');
const whatsappUrl = ref('');
const pagoRef = ref<HTMLElement | null>(null);
const exitoRef = ref<HTMLElement | null>(null);

const base = computed(() => calcularTotales(items.value, metodo.value).base);
const final = computed(() => calcularTotales(items.value, metodo.value).final);

function fmt(n: number): string {
  return Number(n).toLocaleString('es-AR');
}

function sincronizar() {
  items.value = leerCarrito();
}

function hayTope(item: ItemCarrito): boolean {
  const stock = Number(item.stock);
  return Number.isFinite(stock) && stock >= 0 && item.quantity >= stock;
}

function cambiar(item: ItemCarrito, delta: number) {
  const manager = (
    window as unknown as { CartManager?: { updateQuantity?: (id: string, q: number) => void } }
  ).CartManager;
  if (delta > 0 && hayTope(item)) return;
  manager?.updateQuantity?.(item.id, item.quantity + delta);
  sincronizar();
}

function quitar(item: ItemCarrito) {
  const manager = (window as unknown as { CartManager?: { removeItem?: (id: string) => void } }).CartManager;
  manager?.removeItem?.(item.id);
  sincronizar();
}

function vaciar() {
  const manager = (window as unknown as { CartManager?: { clearCart?: () => void } }).CartManager;
  manager?.clearCart?.();
  sincronizar();
}

function sinFoto(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

function consultar() {
  if (!items.value.length) return;
  abrirUrl(urlWhatsApp(mensajeWhatsAppConsultar(items.value)));
}

function validar(): boolean {
  if (nombre.value.length < 2 || telefono.value.length < 6) {
    error.value = 'Contanos tu nombre y un teléfono válido para coordinar.';
    return false;
  }
  return true;
}

async function confirmar() {
  error.value = '';
  if (!validar()) return;
  if (!items.value.length) return;

  enviando.value = true;
  try {
    const data = await enviarPedido({
      items: items.value.map((i) => ({ producto_id: i.id, cantidad: i.quantity })),
      cliente: { nombre: nombre.value, telefono: telefono.value },
      metodo: metodo.value,
    });

    const url = metodo.value === 'EFECTIVO' ? data.whatsapp_url : data.init_point;
    if (!url) {
      error.value = 'Respuesta inesperada del servidor. Probá de nuevo.';
      return;
    }

    limpiarCarrito();

    if (metodo.value === 'MP') {
      window.location.href = url;
      return;
    }

    whatsappUrl.value = url;
    exito.value =
      'Abrimos WhatsApp con el detalle del pedido para que lo confirmes y coordinemos la entrega y el pago en efectivo.';
    window.open(url, '_blank', 'noopener');
    await nextTick();
    exitoRef.value?.focus();
  } catch (e) {
    error.value = e instanceof Error && e.message ? e.message : 'Error de conexión. Probá de nuevo.';
  } finally {
    enviando.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') error.value = '';
}

onMounted(() => {
  sincronizar();
  window.addEventListener('domus:cart-updated', sincronizar);
  window.addEventListener('domus:cart-cleared', sincronizar);
  window.addEventListener('storage', sincronizar);
  document.addEventListener('keydown', onKeydown);

  // /carrito?pago=1 -> "Realizar la compra" desde el detalle de producto
  if (new URLSearchParams(window.location.search).get('pago') === '1' && items.value.length) {
    const destino = pagoRef.value;
    destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    destino?.focus({ preventScroll: true });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('domus:cart-updated', sincronizar);
  window.removeEventListener('domus:cart-cleared', sincronizar);
  window.removeEventListener('storage', sincronizar);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.cp {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}

.cp-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.cp-title {
  margin: 0;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: var(--color-brown);
}

.cp-count {
  margin: 0;
  color: var(--color-brown-light);
  font-size: 0.9375rem;
}

.cp-empty,
.cp-done {
  text-align: center;
  background: white;
  border: 1px solid rgba(61, 43, 31, 0.1);
  border-radius: 16px;
  padding: clamp(2rem, 6vw, 3.5rem) 1.5rem;
}

.cp-empty p,
.cp-done p {
  margin: 0 0 1.25rem;
  color: var(--color-brown);
  font-size: 1.0625rem;
}

.cp-done h2 {
  margin: 0 0 0.5rem;
  font-size: 1.375rem;
  color: var(--color-brown);
}

.cp-done-mark {
  font-size: 2.5rem;
  line-height: 1;
  color: var(--color-olive);
  margin-bottom: 0.5rem !important;
}

.cp-done-text {
  max-width: 34rem;
  margin-left: auto !important;
  margin-right: auto !important;
  color: var(--color-brown-light) !important;
  font-size: 1rem !important;
}

.cp-done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.cp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 900px) {
  .cp-grid {
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 2rem;
  }

  .cp-summary {
    position: sticky;
    top: 96px;
  }
}

.cp-items {
  background: white;
  border: 1px solid rgba(61, 43, 31, 0.1);
  border-radius: 16px;
  padding: 0.5rem 1rem;
}

.cp-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 0.875rem;
  align-items: start;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(61, 43, 31, 0.08);
}

.cp-item:last-of-type {
  border-bottom: none;
}

.cp-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 10px;
  background: var(--color-beige);
  display: block;
}

.cp-thumb-ph {
  display: grid;
  place-items: center;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-weight: 700;
  color: var(--color-brown-light);
}

.cp-info {
  min-width: 0;
}

.cp-name {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-brown);
  line-height: 1.3;
}

.cp-unit {
  margin: 0 0 0.625rem;
  font-size: 0.8125rem;
  color: var(--color-brown-light);
}

.cp-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.cp-stepper {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid rgba(61, 43, 31, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.cp-step {
  width: 44px;
  height: 44px;
  border: none;
  background: white;
  color: var(--color-brown);
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
}

.cp-step:hover:not(:disabled) {
  background: rgba(152, 140, 45, 0.12);
}

.cp-step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cp-step:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: -3px;
}

.cp-qty {
  min-width: 2.25rem;
  text-align: center;
  font-weight: 600;
  color: var(--color-brown);
}

.cp-remove {
  min-height: 44px;
  padding: 0 0.5rem;
  border: none;
  background: none;
  color: var(--color-brown-light);
  font-family: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cp-remove:hover {
  color: var(--color-olive);
}

.cp-remove:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
  border-radius: 4px;
}

.cp-subtotal {
  margin: 0;
  font-weight: 700;
  color: var(--color-brown);
  white-space: nowrap;
  align-self: center;
}

.cp-items-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-top: 1px solid rgba(61, 43, 31, 0.08);
}

.cp-clear {
  min-height: 44px;
  padding: 0 1rem;
  border: 1.5px dashed rgba(61, 43, 31, 0.25);
  border-radius: 12px;
  background: transparent;
  color: var(--color-brown-light);
  font-family: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.cp-clear:hover {
  border-color: var(--color-olive);
  color: var(--color-olive);
}

.cp-clear:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
}

.cp-back {
  min-height: 44px;
  line-height: 44px;
  font-size: 0.875rem;
  color: var(--color-brown-light);
  text-decoration: none;
}

.cp-back:hover {
  color: var(--color-olive);
}

.cp-summary {
  background: white;
  border: 1px solid rgba(61, 43, 31, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.cp-summary:focus-visible {
  outline: 3px solid var(--color-olive);
  outline-offset: 3px;
}

.cp-sum-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: var(--color-brown);
}

.cp-totals {
  margin: 0 0 1.25rem;
  padding: 0 0 1rem;
  border-bottom: 1px solid rgba(61, 43, 31, 0.1);
}

.cp-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.cp-row dt,
.cp-row dd {
  margin: 0;
  color: var(--color-brown);
}

.cp-row-total {
  margin-top: 0.75rem;
  margin-bottom: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.cp-fields {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.cp-fields label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brown);
  margin-top: 0.5rem;
}

.cp-fields input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid rgba(61, 43, 31, 0.2);
  border-radius: 10px;
  font-family: inherit;
  font-size: 1rem;
  color: var(--color-brown);
  background: white;
}

.cp-fields input:focus {
  outline: 2px solid var(--color-olive);
  outline-offset: 1px;
  border-color: var(--color-olive);
}

.cp-method {
  border: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.cp-method legend {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brown);
  padding: 0;
  margin-bottom: 0.375rem;
}

.cp-radio {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.875rem;
  border: 1.5px solid rgba(61, 43, 31, 0.15);
  border-radius: 12px;
  cursor: pointer;
  min-height: 44px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.cp-radio:has(input:checked) {
  border-color: var(--color-olive);
  background: rgba(152, 140, 45, 0.06);
}

.cp-radio:focus-within {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
}

.cp-radio input {
  accent-color: var(--color-olive);
  width: 18px;
  height: 18px;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.cp-radio span {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.cp-radio small {
  color: var(--color-brown-light);
  font-size: 0.8125rem;
}

.cp-error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #742a2a;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}

.cp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: filter 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.cp-btn-primary {
  width: 100%;
  background: linear-gradient(135deg, var(--color-olive) 0%, #7a701f 100%);
  color: white;
  box-shadow: 0 6px 16px rgba(152, 140, 45, 0.35);
}

.cp-btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 8px 22px rgba(152, 140, 45, 0.45);
}

.cp-btn-primary:disabled {
  opacity: 0.6;
  cursor: wait;
}

.cp-btn-ghost {
  background: transparent;
  border-color: rgba(61, 43, 31, 0.25);
  color: var(--color-brown);
}

.cp-btn-ghost:hover {
  border-color: var(--color-olive);
  color: var(--color-olive);
}

.cp-confirm {
  margin-bottom: 0.5rem;
}

.cp-btn:focus-visible {
  outline: 2px solid var(--color-brown);
  outline-offset: 2px;
}

.cp-alt {
  width: 100%;
  min-height: 44px;
  background: none;
  border: none;
  color: var(--color-brown-light);
  font-family: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cp-alt:hover {
  color: var(--color-olive);
}

.cp-alt:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (max-width: 640px) {
  .cp-item {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .cp-thumb {
    width: 56px;
    height: 56px;
  }

  .cp-subtotal {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
