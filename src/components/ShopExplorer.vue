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

      </aside>

      <!-- Resultados -->
      <div class="shop-results">
        <p class="shop-results-count" role="status">
          <template v-if="loading">Buscando productos…</template>
          <template v-else-if="grupos.length === 0">Sin resultados para esta combinación de filtros.</template>
          <template v-else>{{ grupos.length }} {{ grupos.length === 1 ? 'producto' : 'productos' }}</template>
        </p>

        <div v-if="error" class="shop-error">
          No pudimos cargar la tienda ahora mismo. Probá recargar la página.
        </div>

        <div v-else class="shop-grid">
          <article
            v-for="g in grupos"
            :key="g.grupo_id"
            class="shop-card"
            @click="abrirProducto(g)"
          >
            <button class="shop-card-media" type="button" @click.stop="abrirProducto(g)" :aria-label="`Ver ${g.principal.nombre}`">
              <img
                :src="fotoDe(g.principal)"
                :alt="g.principal.nombre"
                loading="lazy"
                @error="onImgError($event, g.principal.categoria)"
              />
              <span
                v-if="g.principal.stock_actual > 0 && g.principal.stock_actual <= g.principal.stock_minimo"
                class="shop-badge shop-badge-low"
              >🔥 ÚLTIMA{{ g.principal.stock_actual === 1 ? '' : 'S' }} {{ g.principal.stock_actual }} UNIDAD{{ g.principal.stock_actual === 1 ? '' : 'ES' }}</span>
              <span v-else-if="g.vendidos > 0" class="shop-badge shop-badge-sold">MÁS VENDIDO</span>
              <span v-if="g.principal.descuento_pct > 0" class="shop-badge shop-badge-off">-{{ g.principal.descuento_pct }}%</span>
            </button>

            <div class="shop-card-body">
              <p class="shop-card-cat">{{ g.principal.categoria || 'General' }}</p>
              <h3 class="shop-card-name">{{ g.principal.nombre }}</h3>

              <p v-if="g.variantes.length > 1" class="shop-variant-summary">{{ g.variantes.length }} opciones de {{ (g.principal.nombre_opcion || 'producto').toLowerCase() }}</p>
              <p v-if="g.principal.descripcion" class="shop-card-description">{{ g.principal.descripcion }}</p>

              <div class="shop-card-price">
                <template v-if="g.principal.descuento_pct > 0">
                  <span class="shop-price-old">${{ Number(g.principal.precio_venta).toLocaleString('es-AR') }}</span>
                  <span class="shop-price">${{ Number(g.principal.precio_final).toLocaleString('es-AR') }}</span>
                </template>
                <span v-else class="shop-price">${{ Number(g.principal.precio_final ?? g.principal.precio_venta).toLocaleString('es-AR') }}</span>
              </div>

              <p v-if="(g.principal.stock_actual ?? 0) <= 0" class="shop-stock shop-stock-out">Sin stock por ahora</p>
              <p v-else-if="(g.principal.stock_actual ?? 0) <= (g.principal.stock_minimo ?? 5)" class="shop-stock shop-stock-low">
                ¡Quedan {{ g.principal.stock_actual }}!
              </p>

              <button
                class="btn shop-add"
                @click.stop="agregarDesdeCard(g)"
              >
                Agregar
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modalGrupo && modalProducto" class="product-modal-backdrop" role="presentation" @click.self="cerrarProducto">
        <section class="product-modal" role="dialog" aria-modal="true" :aria-labelledby="`product-title-${modalGrupo.grupo_id}`">
          <button type="button" class="product-modal-close" aria-label="Cerrar" @click="cerrarProducto">×</button>
          <div class="product-modal-media">
            <img :src="fotoDe(modalProducto)" :alt="modalProducto.nombre" @error="onImgError($event, modalProducto.categoria)" />
            <span
              v-if="modalProducto.stock_actual > 0 && modalProducto.stock_actual <= modalProducto.stock_minimo"
              class="shop-badge shop-badge-low product-modal-low"
            >🔥 ÚLTIMA{{ modalProducto.stock_actual === 1 ? '' : 'S' }} {{ modalProducto.stock_actual }} UNIDAD{{ modalProducto.stock_actual === 1 ? '' : 'ES' }}</span>
          </div>
          <div class="product-modal-info">
            <p class="shop-card-cat">{{ modalProducto.categoria || 'General' }}</p>
            <div class="product-modal-heading">
              <h2 :id="`product-title-${modalGrupo.grupo_id}`">{{ modalProducto.nombre }}</h2>
              <button type="button" class="product-share" @click="compartirProducto" aria-label="Compartir producto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>
                </svg>
                Compartir
              </button>
            </div>
            <p v-if="shareStatus" class="product-share-status" role="status">{{ shareStatus }}</p>
            <p v-if="modalProducto.descripcion" class="product-modal-description">{{ modalProducto.descripcion }}</p>

            <div v-if="modalGrupo.variantes.length > 1" class="product-field">
              <span>{{ modalProducto.nombre_opcion }}</span>
              <div class="product-options" role="group" :aria-label="`Elegir ${modalProducto.nombre_opcion}`">
                <button
                  v-for="v in modalGrupo.variantes"
                  :key="v.producto_id"
                  type="button"
                  class="product-option"
                  :class="{ selected: modalVarianteId === v.producto_id, unavailable: v.stock_actual <= 0 }"
                  :aria-pressed="modalVarianteId === v.producto_id"
                  @click="modalVarianteId = v.producto_id; cantidad = 1"
                >
                  {{ v.variante }}
                  <small v-if="v.stock_actual <= 0">Sin stock</small>
                </button>
              </div>
            </div>
            <p v-else-if="modalProducto.variante && modalProducto.variante !== 'Única'" class="product-modal-variant">
              {{ modalProducto.variante }}
            </p>

            <div class="shop-card-price product-modal-price">
              <span v-if="modalProducto.descuento_pct > 0" class="shop-price-old">${{ Number(modalProducto.precio_venta).toLocaleString('es-AR') }}</span>
              <span class="shop-price">${{ Number(modalProducto.precio_final ?? modalProducto.precio_venta).toLocaleString('es-AR') }}</span>
            </div>

            <p v-if="modalProducto.stock_actual <= 0" class="shop-stock shop-stock-out">Sin stock por ahora</p>
            <p v-else class="product-available">Disponible</p>

            <div class="product-buy-row">
              <div class="product-quantity" aria-label="Cantidad">
                <button type="button" @click="cantidad = Math.max(1, cantidad - 1)" :disabled="cantidad <= 1">−</button>
                <span>{{ cantidad }}</span>
                <button type="button" @click="cantidad = Math.min(modalProducto.stock_actual, cantidad + 1)" :disabled="cantidad >= modalProducto.stock_actual">+</button>
              </div>
              <button class="btn product-modal-add" :disabled="modalProducto.stock_actual <= 0" @click="agregarDesdeModal">
                {{ modalProducto.stock_actual <= 0 ? 'No disponible' : `Agregar ${cantidad} al carrito` }}
              </button>
            </div>
            <p v-if="modalProducto.stock_actual > 0 && modalProducto.stock_actual <= modalProducto.stock_minimo" class="shop-stock shop-stock-low">
              Quedan {{ modalProducto.stock_actual }} unidades de esta opción.
            </p>
          </div>

          <div v-if="recomendados.length" class="product-recommendations">
            <div class="product-recommendations-heading">
              <p>También puede gustarte</p>
              <span>Descubrí otros productos DOMUS</span>
            </div>
            <div class="product-recommendations-grid">
              <button
                v-for="r in recomendados"
                :key="r.grupo_id"
                type="button"
                class="product-recommendation"
                @click="abrirProducto(r)"
              >
                <img :src="fotoDe(r.principal)" :alt="r.principal.nombre" loading="lazy" />
                <span>
                  <strong>{{ r.principal.nombre }}</strong>
                  <small>${{ Number(r.principal.precio_final ?? r.principal.precio_venta).toLocaleString('es-AR') }}</small>
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TiendaProducto {
  producto_id: string;
  id?: string;
  grupo_id: string;
  variante: string;
  nombre_opcion: string;
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
});

const productos = ref<TiendaProducto[]>([]);
type GrupoProducto = {
  grupo_id: string;
  variantes: TiendaProducto[];
  principal: TiendaProducto;
  vendidos: number;
};

const modalGrupo = ref<GrupoProducto | null>(null);
const modalVarianteId = ref('');
const cantidad = ref(1);
const shareStatus = ref('');
const productoCompartido = ref('');
const modalProducto = computed(() => {
  if (!modalGrupo.value) return null;
  return modalGrupo.value.variantes.find((v) => v.producto_id === modalVarianteId.value)
    || modalGrupo.value.principal;
});
const recomendados = computed(() => {
  if (!modalGrupo.value || !modalProducto.value) return [];
  const otros = grupos.value.filter((g) => g.grupo_id !== modalGrupo.value?.grupo_id);
  const mismaCategoria = otros.filter((g) => g.principal.categoria === modalProducto.value?.categoria);
  return [...mismaCategoria, ...otros.filter((g) => !mismaCategoria.includes(g))].slice(0, 3);
});

const grupos = computed(() => {
  const agrupados = new Map<string, TiendaProducto[]>();
  for (const p of productos.value) {
    const clave = p.grupo_id || p.producto_id;
    const items = agrupados.get(clave) || [];
    items.push(p);
    agrupados.set(clave, items);
  }
  return [...agrupados.entries()].map(([grupo_id, variantes]) => {
    variantes.sort((a, b) => a.variante.localeCompare(b.variante));
    const principal = variantes.find((v) => v.stock_actual > 0)
      || variantes[0];
    return {
      grupo_id,
      variantes,
      principal,
      vendidos: variantes.reduce((total, v) => total + Number(v.vendidos_90d || 0), 0),
    };
  });
});
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
  return n;
});

const chips = computed(() => {
  const list: Array<{ key: string; label: string; limpiar: () => void }> = [];
  if (filtros.value.q) list.push({ key: 'q', label: `"${filtros.value.q}"`, limpiar: () => { filtros.value.q = ''; cargar(); } });
  if (filtros.value.sector) list.push({ key: 'sector', label: filtros.value.sector, limpiar: () => { filtros.value.sector = ''; cargar(); } });
  if (filtros.value.min !== null || filtros.value.max !== null) list.push({ key: 'precio', label: 'Precio', limpiar: () => { filtros.value.min = null; filtros.value.max = null; cargar(); } });
  if (filtros.value.ofertas) list.push({ key: 'ofertas', label: 'Ofertas', limpiar: () => { filtros.value.ofertas = false; cargar(); } });
  if (filtros.value.stock) list.push({ key: 'stock', label: 'Disponibles', limpiar: () => { filtros.value.stock = false; cargar(); } });
  return list;
});

function onImgError(e: Event, categoria: string | null = null) {
  const img = e.target as HTMLImageElement;
  const fb = (categoria && FALLBACKS[categoria.trim()]) || fallbackImg;
  if (img.src !== fb) img.src = fb;
}

function leerURL() {
  const params = new URLSearchParams(window.location.search);
  productoCompartido.value = params.get('producto') || '';
  filtros.value.q = params.get('q') || '';
  filtros.value.sector = params.get('sector') || props.sectorInicial || '';
  filtros.value.min = params.get('min') ? Number(params.get('min')) : null;
  filtros.value.max = params.get('max') ? Number(params.get('max')) : null;
  filtros.value.orden = params.get('orden') || 'relevancia';
  filtros.value.ofertas = params.get('ofertas') === '1';
  filtros.value.stock = params.get('stock') === '1';
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

  try {
    const res = await fetch(`/api/tienda/productos?${params.toString()}`);
    if (!res.ok) throw new Error('fetch failed');
    productos.value = await res.json();
    if (productoCompartido.value) {
      const grupo = grupos.value.find((g) => g.grupo_id === productoCompartido.value);
      productoCompartido.value = '';
      if (grupo) abrirProducto(grupo);
    }
  } catch {
    error.value = true;
    productos.value = [];
  } finally {
    loading.value = false;
  }
}

function limpiarTodo() {
  filtros.value = { q: '', sector: '', min: null, max: null, orden: 'relevancia', ofertas: false, stock: false };
  cargar();
}

function abrirProducto(grupo: GrupoProducto) {
  modalGrupo.value = grupo;
  const primeraDisponible = grupo.variantes.find((v) => v.stock_actual > 0) || grupo.principal;
  modalVarianteId.value = primeraDisponible.producto_id;
  cantidad.value = 1;
  shareStatus.value = '';
  document.body.style.overflow = 'hidden';
}

async function compartirProducto() {
  if (!modalGrupo.value || !modalProducto.value) return;
  const url = `${window.location.origin}/tienda?producto=${encodeURIComponent(modalGrupo.value.grupo_id)}`;
  const shareData = {
    title: `${modalProducto.value.nombre} | DOMUS`,
    text: modalProducto.value.variante && modalProducto.value.variante !== 'Única'
      ? `Mirá ${modalProducto.value.nombre}, aroma o presentación ${modalProducto.value.variante}, en DOMUS.`
      : `Mirá ${modalProducto.value.nombre} en DOMUS.`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      shareStatus.value = 'Producto compartido.';
    } else {
      await navigator.clipboard.writeText(url);
      shareStatus.value = 'Enlace copiado.';
    }
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') shareStatus.value = 'No pudimos compartir el enlace.';
  }
}

function cerrarProducto() {
  modalGrupo.value = null;
  modalVarianteId.value = '';
  cantidad.value = 1;
  document.body.style.overflow = '';
}

function agregar(p: TiendaProducto, unidades = 1) {
  const w = window as unknown as { CartManager?: { addItem: (item: { id: string; name: string; price: number; image?: string; stock?: number; quantity?: number }) => void } };
  w.CartManager?.addItem({
    id: p.producto_id || (p.id as string),
    name: p.variante && p.variante !== 'Única' ? `${p.nombre} — ${p.variante}` : p.nombre,
    price: Number(p.precio_final ?? p.precio_venta),
    image: fotoDe(p),
    stock: Number(p.stock_actual ?? 0),
    quantity: unidades,
  });
}

function agregarDesdeModal() {
  if (!modalProducto.value) return;
  agregar(modalProducto.value, cantidad.value);
  cerrarProducto();
}

function agregarDesdeCard(grupo: GrupoProducto) {
  if (grupo.variantes.length > 1) {
    abrirProducto(grupo);
    return;
  }
  agregar(grupo.principal, 1);
}

onMounted(() => {
  leerURL();
  cargar();
  // Stock siempre fresco: recargar al volver a la pestaña y tras confirmar una compra
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) cargar();
  });
  window.addEventListener('domus:cart-cleared', () => cargar());
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalGrupo.value) cerrarProducto();
  });
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
  padding: 1rem 1.125rem;
  box-shadow: 0 2px 12px rgba(61, 43, 31, 0.06);
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(96, 72, 17, 0.35) transparent;
}

.shop-filter-group {
  padding-bottom: 0.875rem;
  margin-bottom: 0.875rem;
  border-bottom: 1px solid rgba(61, 43, 31, 0.08);
}

.shop-filter-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.shop-filter-group h3 {
  margin: 0 0 0.5rem;
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
  padding: 0.25rem 0;
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
  margin-bottom: 0.5rem;
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
  cursor: pointer;
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
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--color-beige);
  cursor: pointer;
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

.shop-badge-low {
  left: 0.625rem;
  background: #a74424;
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

.shop-variant {
  display: grid;
  gap: 0.3rem;
  margin: 0.25rem 0;
  font-size: 0.75rem;
  color: var(--color-brown-light);
}

.shop-variant select {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid rgba(61, 43, 31, 0.2);
  border-radius: 7px;
  background: white;
  color: var(--color-brown);
  font: inherit;
}

.shop-variant-single {
  margin: 0.15rem 0;
  color: var(--color-brown-light);
  font-size: 0.875rem;
}

.shop-variant-summary {
  margin: 0.15rem 0;
  color: var(--color-brown-light);
  font-size: 0.875rem;
}

.shop-card-description {
  margin: 0.15rem 0;
  color: var(--color-brown-light);
  font-size: 0.875rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.product-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(35, 25, 15, 0.62);
  backdrop-filter: blur(4px);
}

.product-modal {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  width: min(1040px, calc(100vw - 2rem));
  max-width: 100%;
  max-height: calc(100vh - 2rem);
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 18px;
  background: #fffdf8;
  box-shadow: 0 24px 70px rgba(35, 25, 15, 0.28);
}

.product-recommendations {
  grid-column: 1 / -1;
  min-width: 0;
  width: 100%;
  padding: 1.5rem;
  border-top: 1px solid rgba(61, 43, 31, 0.1);
  background: #f7f2e7;
}

.product-recommendations-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.product-recommendations-heading p {
  margin: 0;
  color: var(--color-brown);
  font-size: 1.1rem;
  font-weight: 700;
}

.product-recommendations-heading span {
  color: var(--color-brown-light);
  font-size: 0.8rem;
}

.product-recommendations-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.product-recommendation {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem;
  border: 1px solid rgba(61, 43, 31, 0.1);
  border-radius: 10px;
  background: #fffdf8;
  color: var(--color-brown);
  text-align: left;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
}

.product-recommendation img {
  width: 64px;
  height: 64px;
  border-radius: 7px;
  object-fit: cover;
}

.product-recommendation span {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.product-recommendation strong {
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: anywhere;
}

.product-recommendation small {
  color: var(--color-olive);
  font-weight: 700;
}

.product-modal-close {
  position: absolute;
  z-index: 2;
  top: 0.75rem;
  right: 0.75rem;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 253, 248, 0.94);
  color: var(--color-brown);
  font-size: 1.65rem;
  line-height: 1;
  cursor: pointer;
}

.product-modal-media {
  position: relative;
  min-height: 520px;
  background: var(--color-beige);
}

.product-modal-low {
  top: 1rem;
  left: 1rem;
  font-size: 0.75rem;
  padding: 0.4rem 0.75rem;
}

.product-modal-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-modal-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.product-modal-info h2 {
  margin: 0.35rem 0 0.75rem;
  color: var(--color-brown);
  font-size: clamp(1.7rem, 4vw, 2.6rem);
  line-height: 1.08;
}

.product-modal-heading {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
  min-width: 0;
  margin-bottom: 0.75rem;
}

.product-modal-heading h2 {
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: normal;
  margin-bottom: 0;
}

.product-share {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: auto;
  min-width: max-content;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(61, 43, 31, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--color-brown);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.product-share svg {
  width: 17px;
  height: 17px;
}

.product-share-status {
  margin: -0.35rem 0 0.75rem;
  color: var(--color-olive);
  font-size: 0.8rem;
}

.product-modal-description {
  margin: 0 0 1.25rem;
  color: var(--color-brown-light);
  line-height: 1.6;
}

.product-field {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 1rem;
  color: var(--color-brown);
  font-size: 0.875rem;
  font-weight: 600;
}

.product-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.product-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid rgba(61, 43, 31, 0.24);
  border-radius: 999px;
  background: white;
  color: var(--color-brown);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.product-option:hover {
  border-color: var(--color-olive);
}

.product-option.selected {
  border-color: var(--color-brown);
  background: var(--color-brown);
  color: var(--color-beige);
}

.product-option.unavailable {
  opacity: 0.55;
  text-decoration: line-through;
}

.product-option small {
  font-size: 0.65rem;
  text-decoration: none;
  text-transform: uppercase;
}

.product-modal-variant,
.product-available {
  margin: 0 0 0.75rem;
  color: var(--color-olive);
  font-weight: 600;
}

.product-modal-price {
  margin: 0.35rem 0 0.75rem;
}

.product-buy-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1.25rem;
}

.product-quantity {
  display: grid;
  grid-template-columns: 38px 42px 38px;
  align-items: center;
  border: 1px solid rgba(61, 43, 31, 0.22);
  border-radius: 8px;
  overflow: hidden;
  background: white;
  text-align: center;
}

.product-quantity button {
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--color-brown);
  font-size: 1.25rem;
  cursor: pointer;
}

.product-quantity button:disabled {
  opacity: 0.3;
  cursor: default;
}

.product-modal-add {
  width: 100%;
}

@media (max-width: 720px) {
  .product-modal {
    grid-template-columns: 1fr;
    max-height: calc(100vh - 1rem);
  }

  .product-modal-media {
    min-height: 0;
    aspect-ratio: 4/3;
  }

  .product-modal-info {
    padding: 1.25rem;
  }

  .product-buy-row {
    grid-template-columns: 1fr;
  }

  .product-recommendations-grid {
    grid-template-columns: 1fr;
  }

  .product-recommendations-heading {
    display: block;
  }

  .product-quantity {
    height: 46px;
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (min-width: 721px) and (max-height: 760px) {
  .product-modal-media {
    min-height: 430px;
  }

  .product-modal-info {
    padding: 1.5rem;
  }
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
