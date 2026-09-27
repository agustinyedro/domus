<!-- src/components/ProductDetail.vue -->
<!-- Detalle de producto: variante elegida, selector de opciones y compra -->
<template>
  <section class="pdp">
    <div class="pdp-media">
      <img :src="fotoDe(producto)" :alt="alt" @error="onError" />
      <span v-if="stock <= 0" class="pdp-badge pdp-badge-out">Sin stock</span>
      <span v-else-if="producto.descuento_pct > 0" class="pdp-badge pdp-badge-off">-{{ producto.descuento_pct }}%</span>
      <span v-else-if="stock <= minimo" class="pdp-badge pdp-badge-low">🔥 Quedan {{ stock }}</span>
    </div>

    <div class="pdp-info">
      <p class="pdp-cat">{{ producto.categoria || 'General' }}</p>
      <h1 class="pdp-title">{{ producto.nombre }}</h1>
      <p v-if="esVariante" class="pdp-opcion">
        {{ producto.nombre_opcion }}: <strong>{{ producto.variante }}</strong>
      </p>

      <div class="pdp-price">
        <template v-if="producto.descuento_pct > 0">
          <s>${{ Number(producto.precio_venta).toLocaleString('es-AR') }}</s>
          <span class="pdp-price-now">${{ precioFinal.toLocaleString('es-AR') }}</span>
        </template>
        <span v-else class="pdp-price-now">${{ precioFinal.toLocaleString('es-AR') }}</span>
      </div>

      <p class="pdp-stock" :class="stock <= 0 ? 'pdp-stock-out' : stock <= minimo ? 'pdp-stock-low' : ''">
        {{ stock <= 0 ? 'Sin stock por ahora' : stock <= minimo ? `¡Quedan ${stock}!` : 'Disponible' }}
      </p>

      <p v-if="producto.descripcion" class="pdp-desc">{{ producto.descripcion }}</p>

      <div v-if="variantes.length > 1" class="pdp-campo">
        <p class="pdp-label">{{ producto.nombre_opcion }}</p>
        <div class="pdp-opciones">
          <template v-for="v in variantes" :key="v.producto_id">
            <a
              v-if="v.stock_actual > 0 || esElegida(v)"
              class="pdp-variante"
              :class="{ selected: esElegida(v) }"
              :href="urlDe(v)"
              :aria-current="esElegida(v) ? 'true' : undefined"
            >
              <img :src="fotoDe(v)" alt="" loading="lazy" @error="onError" />
              <span>
                {{ v.variante }}
                <small v-if="v.stock_actual <= 0">Sin stock</small>
              </span>
            </a>
            <span v-else class="pdp-variante unavailable" :aria-disabled="true">
              <img :src="fotoDe(v)" alt="" loading="lazy" @error="onError" />
              <span>
                {{ v.variante }}
                <small>Sin stock</small>
              </span>
            </span>
          </template>
        </div>
      </div>

      <div class="pdp-qty" role="group" aria-label="Cantidad">
        <button type="button" :disabled="stock <= 0 || cantidad <= 1" aria-label="Quitar uno" @click="cantidad--">−</button>
        <span>{{ cantidad }}</span>
        <button
          type="button"
          :disabled="stock <= 0 || cantidad >= stock"
          aria-label="Agregar uno"
          @click="cantidad++"
        >+</button>
      </div>

      <div class="pdp-actions">
        <button class="pdp-buy" type="button" :disabled="stock <= 0" @click="comprarAhora">
          {{ stock <= 0 ? 'Sin stock' : 'Realizar la compra' }}
        </button>
        <button
          class="pdp-add"
          :class="{ 'is-in-cart': enCarrito }"
          type="button"
          :disabled="stock <= 0"
          @click="agregarAlCarrito"
        >
          {{ stock <= 0 ? 'No disponible' : agregado ? 'Agregado ✓' : enCarrito ? 'En el carrito ✓' : 'Agregar al carrito' }}
        </button>
      </div>

      <p v-if="enCarrito" class="pdp-go-cart">
        <a href="/carrito">Ir al carrito →</a>
      </p>

      <p class="pdp-feedback" :class="{ 'pdp-feedback-error': !!mensaje }" role="status" aria-live="polite">{{ mensaje }}</p>

      <div class="pdp-footer">
        <a class="pdp-share" href="#" @click.prevent="compartir">Compartir</a>
        <a class="pdp-back" href="/tienda">← Seguir comprando</a>
      </div>
      <p v-if="shareStatus" class="pdp-share-status" role="status">{{ shareStatus }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fotoDe, urlFallback } from '@/lib/fotos';
import type { ProductoTienda } from '@/lib/tienda-catalogo';

const props = defineProps<{ producto: ProductoTienda; variantes: ProductoTienda[] }>();

const cantidad = ref(1);
const agregado = ref(false);
const mensaje = ref('');
const shareStatus = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

const stock = computed(() => Number(props.producto.stock_actual ?? 0));
const minimo = computed(() => Number(props.producto.stock_minimo ?? 5));
const esVariante = computed(() => !!props.producto.variante && props.producto.variante !== 'Única');
const precioFinal = computed(() => Number(props.producto.precio_final ?? props.producto.precio_venta));
const alt = computed(() =>
  esVariante.value ? `${props.producto.nombre} ${props.producto.variante}` : props.producto.nombre
);
const nombreCarrito = computed(() =>
  esVariante.value ? `${props.producto.nombre} — ${props.producto.variante}` : props.producto.nombre
);

const esElegida = (v: ProductoTienda) => v.producto_id === props.producto.producto_id;
const urlDe = (v: ProductoTienda) => `/tienda/producto/${encodeURIComponent(String(v.sku || '').trim())}`;

// Estado persistente: ¿este producto ya está en el carrito?
const enCarrito = ref(false);

function sincronizarCarrito() {
  try {
    const cart = JSON.parse(localStorage.getItem('domus_cart') || '[]');
    enCarrito.value = Array.isArray(cart) && cart.some((item) => String(item?.id) === props.producto.producto_id);
  } catch {
    enCarrito.value = false;
  }
}

function onError(e: Event) {
  const img = e.target as HTMLImageElement;
  const fb = urlFallback(props.producto.categoria);
  if (img.src !== fb) img.src = fb;
}

type Carrito = {
  addItem: (item: { id: string; name: string; price: number; image?: string; stock?: number; quantity?: number }) => void;
  getCount?: () => number;
};
const carrito = (): Carrito | undefined =>
  (window as unknown as { CartManager?: Carrito }).CartManager;

// Devuelve true sólo si el carrito realmente cambió (evita falso éxito)
function alCarrito(unidades: number): boolean {
  const c = carrito();
  if (!c) return false;
  const antes = c.getCount?.() ?? 0;
  c.addItem({
    id: props.producto.producto_id,
    name: nombreCarrito.value,
    price: precioFinal.value,
    image: fotoDe(props.producto),
    stock: stock.value,
    quantity: unidades,
  });
  return (c.getCount?.() ?? antes) > antes;
}

function confirmarAgregado() {
  agregado.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    agregado.value = false;
  }, 2200);
}

function agregarAlCarrito() {
  if (stock.value <= 0) return;
  if (alCarrito(cantidad.value)) {
    mensaje.value = '';
    confirmarAgregado();
  } else {
    mensaje.value = `No pudimos agregar ${nombreCarrito.value}: revisá el stock disponible.`;
  }
}

function comprarAhora() {
  if (stock.value <= 0) return;
  if (!alCarrito(cantidad.value)) {
    mensaje.value = `No pudimos agregar ${nombreCarrito.value}: revisá el stock disponible.`;
    return;
  }
  window.location.href = '/carrito?pago=1';
}

async function compartir() {
  const url = `${window.location.origin}${urlDe(props.producto)}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `${props.producto.nombre} | DOMUS`, text: alt.value, url });
      shareStatus.value = 'Producto compartido.';
    } else {
      await navigator.clipboard.writeText(url);
      shareStatus.value = 'Enlace copiado.';
    }
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') shareStatus.value = 'No pudimos compartir el enlace.';
  }
}

onMounted(() => {
  sincronizarCarrito();
  window.addEventListener('domus:cart-updated', sincronizarCarrito);
  window.addEventListener('domus:cart-cleared', sincronizarCarrito);
  window.addEventListener('storage', sincronizarCarrito);
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  window.removeEventListener('domus:cart-updated', sincronizarCarrito);
  window.removeEventListener('domus:cart-cleared', sincronizarCarrito);
  window.removeEventListener('storage', sincronizarCarrito);
});
</script>

<style scoped>
.pdp {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.25rem 3.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.pdp-media {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: var(--color-beige);
  box-shadow: 0 10px 30px rgba(61, 43, 31, 0.12);
}

.pdp-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pdp-badge {
  position: absolute;
  top: 0.875rem;
  left: 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  color: white;
}

.pdp-badge-off { background: #e53e3e; }
.pdp-badge-low { background: #a74424; }
.pdp-badge-out { background: var(--color-brown); }

.pdp-info {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pdp-cat {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-olive);
  font-weight: 600;
}

.pdp-title {
  margin: 0;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-weight: 400;
  font-size: clamp(1.75rem, 3.4vw, 2.5rem);
  line-height: 1.15;
  color: var(--color-brown);
}

.pdp-opcion {
  margin: 0;
  color: var(--color-brown-light);
  font-size: 0.9375rem;
}

.pdp-price {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-top: 0.35rem;
}

.pdp-price s {
  color: var(--color-brown-light);
  font-size: 1.05rem;
}

.pdp-price-now {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: var(--color-brown);
}

.pdp-stock {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-olive);
}

.pdp-stock-low { color: #c05621; }
.pdp-stock-out { color: #9b2c2c; }

.pdp-desc {
  margin: 0.25rem 0 0;
  color: var(--color-brown-light);
  line-height: 1.6;
}

.pdp-campo {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.pdp-label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-brown);
}

.pdp-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pdp-variante {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem 0.45rem 0.45rem;
  border: 1.5px solid rgba(61, 43, 31, 0.22);
  border-radius: 999px;
  background: white;
  color: var(--color-brown);
  font-size: 0.9375rem;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.pdp-variante:hover {
  border-color: var(--color-olive);
}

.pdp-variante img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-beige);
  flex-shrink: 0;
}

.pdp-variante span {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.pdp-variante small {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pdp-variante.selected {
  border-color: var(--color-olive);
  background: var(--color-olive);
  color: white;
}

.pdp-variante.unavailable {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(1);
}

.pdp-variante:focus-visible,
.pdp-qty button:focus-visible,
.pdp-buy:focus-visible,
.pdp-add:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
}

.pdp-qty {
  display: inline-flex;
  align-self: start;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.35rem;
  border: 1.5px solid rgba(61, 43, 31, 0.18);
  border-radius: 999px;
  background: var(--color-beige-light);
}

.pdp-qty span {
  min-width: 28px;
  text-align: center;
  font-weight: 700;
  color: var(--color-brown);
}

.pdp-qty button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid rgba(61, 43, 31, 0.18);
  background: white;
  color: var(--color-brown);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.pdp-qty button:hover:not(:disabled) {
  background: var(--color-olive);
  border-color: var(--color-olive);
  color: white;
}

.pdp-qty button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pdp-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.pdp-buy,
.pdp-add {
  width: 100%;
  min-height: 52px;
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.pdp-buy {
  background: linear-gradient(135deg, var(--color-olive) 0%, #7a701f 100%);
  color: white;
  border: 0;
  box-shadow: 0 6px 16px rgba(152, 140, 45, 0.35);
}

.pdp-buy:hover:not(:disabled) {
  box-shadow: 0 8px 22px rgba(152, 140, 45, 0.45);
  transform: translateY(-1px);
}

.pdp-add {
  background: white;
  color: var(--color-olive);
  border: 2px solid var(--color-olive);
}

.pdp-add:hover:not(:disabled) {
  background: var(--color-olive);
  color: white;
}

.pdp-add.is-in-cart {
  background: var(--color-olive);
  color: white;
  border-color: var(--color-olive);
}

.pdp-add.is-in-cart:hover:not(:disabled) {
  filter: brightness(1.06);
}

.pdp-go-cart {
  margin: 0;
  text-align: center;
}

.pdp-go-cart a {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--color-olive);
  text-decoration: none;
}

.pdp-go-cart a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pdp-go-cart a:focus-visible {
  outline: 2px solid var(--color-olive);
  outline-offset: 2px;
  border-radius: 4px;
}

.pdp-add:disabled,
.pdp-buy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.pdp-feedback {
  min-height: 1.25rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-olive);
}

.pdp-feedback-error {
  color: #9b2c2c;
}

.pdp-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(61, 43, 31, 0.1);
}

.pdp-share,
.pdp-back {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-olive);
  text-decoration: none;
}

.pdp-share:hover,
.pdp-back:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pdp-share-status {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-brown-light);
}

@media (max-width: 860px) {
  .pdp {
    grid-template-columns: 1fr;
    padding-bottom: 2.5rem;
  }

  .pdp-actions {
    grid-template-columns: 1fr;
  }
}
</style>
