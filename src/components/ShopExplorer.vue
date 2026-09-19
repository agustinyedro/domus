<!-- src/components/ShopExplorer.vue -->
<!-- Explorador de tienda: filtros + grilla de productos (datos de Supabase) -->
<template>
  <div class="shop-explorer">
    <!-- Barra superior: búsqueda + orden + toggle filtros (mobile) -->
    <div class="shop-toolbar">
      <div class="shop-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="filtros.q"
          type="search"
          placeholder="Buscar en DOMUS… (ej: sahumerio, pizza, vela)"
          aria-label="Buscar productos"
          @input="onFiltrosChange"
        />
        <button v-if="filtros.q" class="shop-clear-q" @click="filtros.q = ''; onFiltrosChange()" aria-label="Limpiar búsqueda">×</button>
      </div>

      <div class="shop-toolbar-actions">
        <button class="btn shop-filters-toggle" @click="mostrarFiltros = !mostrarFiltros" :aria-expanded="mostrarFiltros">
          {{ mostrarFiltros ? 'Ocultar filtros' : 'Filtros' }}
          <span v-if="filtrosActivos > 0" class="shop-filters-count">{{ filtrosActivos }}</span>
        </button>

        <label class="shop-orden">
          <span>Ordenar</span>
          <select v-model="filtros.orden" @change="onFiltrosChange" aria-label="Ordenar productos">
            <option value="relevancia">Más relevantes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="descuento">Mayor descuento</option>
            <option value="rating">Mejor valorados</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
        </label>
      </div>
    </div>

    <!-- Chips de filtros activos -->
    <div v-if="chips.length > 0" class="shop-chips">
      <button v-for="chip in chips" :key="chip.key" class="shop-chip" @click="chip.limpiar()">
        {{ chip.label }} <span aria-hidden="true">×</span>
      </button>
      <button class="shop-chip shop-chip-clear" @click="limpiarTodo()">Limpiar todo</button>
    </div>

    <div class="shop-layout">
      <!-- Sidebar de filtros -->
      <aside class="shop-filters" :class="{ open: mostrarFiltros }" aria-label="Filtros">
        <div class="shop-filter-group">
          <h3>Categoría</h3>
          <label v-for="cat in categorias" :key="cat.value" class="shop-check">
            <input
              type="radio"
              name="shop-sector"
              :value="cat.value"
              v-model="filtros.sector"
              @change="onFiltrosChange"
            />
            {{ cat.label }}
            <span class="shop-count">({{ cat.count }})</span>
          </label>
        </div>

        <div class="shop-filter-group">
          <h3>Precio</h3>
          <div class="shop-price-row">
            <input
              v-model.number="filtros.min"
              type="number"
              min="0"
              placeholder="Mín"
              aria-label="Precio mínimo"
              @change="onFiltrosChange"
            />
            <span>–</span>
            <input
              v-model.number="filtros.max"
              type="number"
              min="0"
              placeholder="Máx"
              aria-label="Precio máximo"
              @change="onFiltrosChange"
            />
          </div>
          <div class="shop-price-presets">
            <button
              v-for="p in presetsPrecio"
              :key="p.label"
              class="shop-preset"
              :class="{ active: filtros.min === p.min && filtros.max === p.max }"
              @click="filtros.min = p.min; filtros.max = p.max; onFiltrosChange()"
            >{{ p.label }}</button>
          </div>
        </div>

        <div class="shop-filter-group">
          <h3>Beneficios</h3>
          <label class="shop-check">
            <input type="checkbox" v-model="filtros.ofertas" @change="onFiltrosChange" />
            Solo ofertas
          </label>
          <label class="shop-check">
            <input type="checkbox" v-model="filtros.stock" @change="onFiltrosChange" />
            Solo disponibles
          </label>
        </div>

        <div class="shop-filter-group">
          <h3>Valoración mínima</h3>
          <label v-for="r in [4, 3, 0]" :key="r" class="shop-check">
            <input
              type="radio"
              name="shop-rating"
              :value="r"
              v-model.number="filtros.rating"
              @change="onFiltrosChange"
            />
            <span v-if="r > 0">{{ '★'.repeat(r) }}<span class="shop-stars-off">{{ '★'.repeat(5 - r) }}</span> o más</span>
            <span v-else>Todas</span>
          </label>
        </div>
      </aside>

      <!-- Resultados -->
      <div class="shop-results">
        <p class="shop-results-count" role="status">
          <template v-if="loading">Buscando productos…</template>
          <template v-else-if="productos.length === 0">Sin resultados para esta combinación de filtros.</template>
          <template v-else>{{ productos.length }} {{ productos.length === 1 ? 'producto' : 'productos' }}</template>
        </p>

        <div v-if="error" class="shop-error">
          No pudimos cargar la tienda ahora mismo. Probá recargar la página.
        </div>

        <div v-else class="shop-grid">
          <article v-for="p in productos" :key="p.producto_id || p.id" class="shop-card">
            <div class="shop-card-media">
              <img
                :src="fotoDe(p)"
                :alt="p.nombre"
                loading="lazy"
                @error="onImgError($event, p.categoria)"
              />
              <span v-if="p.vendidos_90d > 0" class="shop-badge shop-badge-sold">MÁS VENDIDO</span>
              <span v-if="p.descuento_pct > 0" class="shop-badge shop-badge-off">-{{ p.descuento_pct }}%</span>
            </div>

            <div class="shop-card-body">
              <p class="shop-card-cat">{{ p.categoria || 'General' }}</p>
              <h3 class="shop-card-name">{{ p.nombre }}</h3>

              <p class="shop-card-rating" :aria-label="`Valoración ${Number(p.rating_promedio || 0).toFixed(1)} de 5`">
                <span class="shop-stars">{{ estrellas(p.rating_promedio) }}</span>
                <span v-if="(p.rating_cantidad || 0) > 0" class="shop-rating-n">({{ p.rating_cantidad }})</span>
              </p>

              <div class="shop-card-price">
                <template v-if="p.descuento_pct > 0">
                  <span class="shop-price-old">${{ Number(p.precio_venta).toLocaleString('es-AR') }}</span>
                  <span class="shop-price">${{ Number(p.precio_final).toLocaleString('es-AR') }}</span>
                </template>
                <span v-else class="shop-price">${{ Number(p.precio_final ?? p.precio_venta).toLocaleString('es-AR') }}</span>
              </div>

              <p v-if="(p.stock_actual ?? 0) <= 0" class="shop-stock shop-stock-out">Sin stock por ahora</p>
              <p v-else-if="(p.stock_actual ?? 0) <= (p.stock_minimo ?? 5)" class="shop-stock shop-stock-low">
                ¡Quedan {{ p.stock_actual }}!
              </p>

              <button
                class="btn shop-add"
                :disabled="(p.stock_actual ?? 0) <= 0"
                @click="agregar(p)"
              >
                {{ (p.stock_actual ?? 0) <= 0 ? 'No disponible' : 'Agregar' }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TiendaProducto {
  producto_id: string;
  id?: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  imagen_url: string | null;
  precio_venta: number;
  precio_final: number;
  descuento_pct: number;
  rating_promedio: number;
  rating_cantidad: number;
  stock_actual: number;
  stock_minimo: number;
  vendidos_90d: number;
  destacado: boolean;
  es_oferta: boolean;
}

const props = defineProps<{ sectorInicial?: string }>();

const IMG_AROMAS = 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop';
const IMG_COMIDA = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop';
const IMG_ROPA = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop';
const IMG_EXPERIENCIAS = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop';

// Fallback por categoría mientras el producto no tenga foto propia
const FALLBACKS: Record<string, string> = {
  'Sahumerios': IMG_AROMAS,
  'Difusores': IMG_AROMAS,
  'Velas': IMG_AROMAS,
  'Aromas': IMG_AROMAS,
  'Comida': IMG_COMIDA,
  'Ropa': IMG_ROPA,
  'Experiencias': IMG_EXPERIENCIAS,
};

const fallbackImg = IMG_AROMAS;

function fotoDe(p: { categoria: string | null; imagen_url: string | null }): string {
  if (p.imagen_url) return p.imagen_url;
  const c = (p.categoria || '').trim();
  return FALLBACKS[c] || fallbackImg;
}

const filtros = ref({
  q: '',
  sector: props.sectorInicial || '',
  min: null as number | null,
  max: null as number | null,
  orden: 'relevancia',
  ofertas: false,
  stock: false,
  rating: 0,
});

const productos = ref<TiendaProducto[]>([]);
const loading = ref(true);
const error = ref(false);
const mostrarFiltros = ref(false);
let debounce: ReturnType<typeof setTimeout> | null = null;

const presetsPrecio = [
  { label: 'Hasta $1.000', min: null as number | null, max: 1000 as number | null },
  { label: '$1.000 – $2.500', min: 1000 as number | null, max: 2500 as number | null },
  { label: 'Más de $2.500', min: 2500 as number | null, max: null as number | null },
];

const categorias = computed(() => {
  const map = new Map<string, number>();
  // Conteo sobre el último resultado; la opción "Todas" siempre está
  for (const p of productos.value) {
    const c = p.categoria || 'General';
    map.set(c, (map.get(c) || 0) + 1);
  }
  const todas = { value: '', label: 'Todas', count: productos.value.length };
  return [todas, ...[...map.entries()].map(([value, count]) => ({ value, label: value, count }))];
});

const filtrosActivos = computed(() => {
  let n = 0;
  if (filtros.value.q) n++;
  if (filtros.value.sector) n++;
  if (filtros.value.min !== null || filtros.value.max !== null) n++;
  if (filtros.value.ofertas) n++;
  if (filtros.value.stock) n++;
  if (filtros.value.rating > 0) n++;
  return n;
});

const chips = computed(() => {
  const list: Array<{ key: string; label: string; limpiar: () => void }> = [];
  if (filtros.value.q) list.push({ key: 'q', label: `"${filtros.value.q}"`, limpiar: () => { filtros.value.q = ''; cargar(); } });
  if (filtros.value.sector) list.push({ key: 'sector', label: filtros.value.sector, limpiar: () => { filtros.value.sector = ''; cargar(); } });
  if (filtros.value.min !== null || filtros.value.max !== null) list.push({ key: 'precio', label: 'Precio', limpiar: () => { filtros.value.min = null; filtros.value.max = null; cargar(); } });
  if (filtros.value.ofertas) list.push({ key: 'ofertas', label: 'Ofertas', limpiar: () => { filtros.value.ofertas = false; cargar(); } });
  if (filtros.value.stock) list.push({ key: 'stock', label: 'Disponibles', limpiar: () => { filtros.value.stock = false; cargar(); } });
  if (filtros.value.rating > 0) list.push({ key: 'rating', label: `${filtros.value.rating}★+`, limpiar: () => { filtros.value.rating = 0; cargar(); } });
  return list;
});

function estrellas(rating: number | null | undefined): string {
  const r = Math.round(Number(rating) || 0);
  return '★'.repeat(Math.min(5, Math.max(0, r))) + '☆'.repeat(5 - Math.min(5, Math.max(0, r)));
}

function onImgError(e: Event, categoria: string | null = null) {
  const img = e.target as HTMLImageElement;
  const fb = (categoria && FALLBACKS[categoria.trim()]) || fallbackImg;
  if (img.src !== fb) img.src = fb;
}

function leerURL() {
  const params = new URLSearchParams(window.location.search);
  filtros.value.q = params.get('q') || '';
  filtros.value.sector = params.get('sector') || props.sectorInicial || '';
  filtros.value.min = params.get('min') ? Number(params.get('min')) : null;
  filtros.value.max = params.get('max') ? Number(params.get('max')) : null;
  filtros.value.orden = params.get('orden') || 'relevancia';
  filtros.value.ofertas = params.get('ofertas') === '1';
  filtros.value.stock = params.get('stock') === '1';
  filtros.value.rating = Number(params.get('rating')) || 0;
}

function escribirURL() {
  const params = new URLSearchParams();
  if (filtros.value.q) params.set('q', filtros.value.q);
  if (filtros.value.sector) params.set('sector', filtros.value.sector);
  if (filtros.value.min !== null) params.set('min', String(filtros.value.min));
  if (filtros.value.max !== null) params.set('max', String(filtros.value.max));
  if (filtros.value.orden !== 'relevancia') params.set('orden', filtros.value.orden);
  if (filtros.value.ofertas) params.set('ofertas', '1');
  if (filtros.value.stock) params.set('stock', '1');
  if (filtros.value.rating > 0) params.set('rating', String(filtros.value.rating));
  const qs = params.toString();
  window.history.replaceState(null, '', qs ? `/tienda?${qs}` : '/tienda');
}

function onFiltrosChange() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => cargar(), 350);
}

async function cargar() {
  loading.value = true;
  error.value = false;
  escribirURL();

  const params = new URLSearchParams();
  if (filtros.value.q) params.set('q', filtros.value.q);
  if (filtros.value.sector) params.set('sector', filtros.value.sector);
  if (filtros.value.min !== null && filtros.value.min !== undefined) params.set('min', String(filtros.value.min));
  if (filtros.value.max !== null && filtros.value.max !== undefined) params.set('max', String(filtros.value.max));
  params.set('orden', filtros.value.orden);
  if (filtros.value.ofertas) params.set('ofertas', '1');
  if (filtros.value.stock) params.set('stock', '1');
  if (filtros.value.rating > 0) params.set('rating', String(filtros.value.rating));

  try {
    const res = await fetch(`/api/tienda/productos?${params.toString()}`);
    if (!res.ok) throw new Error('fetch failed');
    productos.value = await res.json();
  } catch {
    error.value = true;
    productos.value = [];
  } finally {
    loading.value = false;
  }
}

function limpiarTodo() {
  filtros.value = { q: '', sector: '', min: null, max: null, orden: 'relevancia', ofertas: false, stock: false, rating: 0 };
  cargar();
}

function agregar(p: TiendaProducto) {
  const w = window as unknown as { CartManager?: { addItem: (item: { id: string; name: string; price: number }) => void } };
  w.CartManager?.addItem({
    id: p.producto_id || (p.id as string),
    name: p.nombre,
    price: Number(p.precio_final ?? p.precio_venta),
    image: fotoDe(p),
  });
}

onMounted(() => {
  leerURL();
  cargar();
});
</script>

<style scoped>
.shop-explorer {
  width: 100%;
}

.shop-toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.shop-search {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.shop-search svg {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-brown-light);
  pointer-events: none;
}

.shop-search input {
  width: 100%;
  padding: 0.875rem 2.5rem 0.875rem 2.75rem;
  border: 1px solid rgba(61, 43, 31, 0.2);
  border-radius: 8px;
  font-size: 1.0625rem;
  font-family: inherit;
  background: white;
  color: var(--color-brown);
}

.shop-search input:focus {
  outline: 2px solid var(--color-olive);
  outline-offset: 1px;
  border-color: var(--color-olive);
}

.shop-clear-q {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-brown-light);
  padding: 0.25rem 0.5rem;
}

.shop-toolbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.shop-filters-toggle {
  display: none;
  position: relative;
}

.shop-filters-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: white;
  color: var(--color-olive);
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 0.25rem;
  padding: 0 0.375rem;
}

.shop-orden {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-brown-light);
}

.shop-orden select {
  padding: 0.625rem 0.75rem;
  border: 1px solid rgba(61, 43, 31, 0.2);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  background: white;
  color: var(--color-brown);
  cursor: pointer;
}

.shop-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.shop-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-olive);
  background: rgba(152, 140, 45, 0.08);
  color: var(--color-brown);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
}

.shop-chip-clear {
  border-style: dashed;
  background: transparent;
  color: var(--color-brown-light);
}

.shop-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.shop-filters {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 12px rgba(61, 43, 31, 0.06);
  position: sticky;
  top: 100px;
}

.shop-filter-group {
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(61, 43, 31, 0.08);
}

.shop-filter-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.shop-filter-group h3 {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-brown);
}

.shop-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-brown-light);
  padding: 0.375rem 0;
  cursor: pointer;
}

.shop-check input {
  accent-color: var(--color-olive);
  width: 16px;
  height: 16px;
}

.shop-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.shop-stars-off {
  opacity: 0.3;
}

.shop-price-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.shop-price-row input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(61, 43, 31, 0.2);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
}

.shop-price-presets {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.shop-preset {
  text-align: left;
  background: none;
  border: 1px solid rgba(61, 43, 31, 0.15);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--color-brown-light);
  cursor: pointer;
}

.shop-preset.active,
.shop-preset:hover {
  border-color: var(--color-olive);
  color: var(--color-olive);
  background: rgba(152, 140, 45, 0.06);
}

.shop-results-count {
  margin: 0 0 1rem;
  color: var(--color-brown-light);
  font-size: 1rem;
}

.shop-error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #742a2a;
  border-radius: 8px;
  padding: 1rem;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.shop-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(61, 43, 31, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@media (max-width: 1200px) {
  .shop-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.shop-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(61, 43, 31, 0.14);
}

.shop-card-media {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--color-beige);
}

.shop-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.shop-badge {
  position: absolute;
  top: 0.625rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  color: white;
}

.shop-badge-sold {
  left: 0.625rem;
  background: var(--color-olive);
}

.shop-badge-off {
  right: 0.625rem;
  background: #e53e3e;
}

.shop-card-body {
  padding: 1rem 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.shop-card-cat {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-olive);
  font-weight: 600;
}

.shop-card-name {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-brown);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.3em * 2);
}

.shop-card-rating {
  margin: 0;
  font-size: 0.875rem;
}

.shop-stars {
  color: #d69e2e;
  letter-spacing: 0.1em;
}

.shop-rating-n {
  color: var(--color-brown-light);
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.shop-card-price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.shop-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-brown);
}

.shop-price-old {
  font-size: 0.9375rem;
  color: var(--color-brown-light);
  text-decoration: line-through;
}

.shop-stock {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

.shop-stock-low {
  color: #c05621;
}

.shop-stock-out {
  color: #9b2c2c;
}

.shop-add {
  margin-top: auto;
  width: 100%;
}

.shop-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .shop-layout {
    grid-template-columns: 1fr;
  }

  .shop-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .shop-search {
    min-width: 0;
  }

  .shop-toolbar-actions {
    justify-content: space-between;
  }

  .shop-filters-toggle {
    display: inline-flex;
    flex: 1;
  }

  .shop-orden {
    flex: 1;
  }

  .shop-orden select {
    flex: 1;
  }

  .shop-filters {
    display: none;
    position: static;
  }

  .shop-filters.open {
    display: block;
  }

  .shop-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
  }

  .shop-card-body {
    padding: 0.875rem 0.875rem 1rem;
  }

  .shop-card-name {
    font-size: 1rem;
  }

  .shop-price {
    font-size: 1.25rem;
  }
}
</style>
