<!-- src/components/admin/ProductList.vue -->
<template>
  <div>
    <input
      v-model="busqueda"
      type="text"
      class="admin-input"
      placeholder="Buscar por nombre o SKU..."
      style="margin-bottom: 1rem; width: 100%; max-width: 400px;"
    />

    <div v-if="loading" class="admin-empty">Cargando productos...</div>

    <div v-else-if="gruposFiltrados.length === 0" class="admin-empty">
      {{ busqueda ? 'No se encontraron productos' : 'No hay productos. Creá el primero.' }}
    </div>

    <div v-else class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto / aroma</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Margen</th>
            <th class="text-right">Stock</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="grupo in gruposFiltrados" :key="grupo.grupo_id">
            <tr class="product-group-row">
              <td colspan="5">
                <strong>{{ grupo.nombre }}</strong>
                <span v-if="grupo.categoria" class="product-category">{{ grupo.categoria }}</span>
                <span v-if="extrasGrupo(grupo) > 0" class="product-category" :title="nombresExtras(grupo)">+{{ extrasGrupo(grupo) }}</span>
                <small>{{ grupo.items.length }} {{ grupo.items.length === 1 ? 'opción' : 'opciones' }}</small>
              </td>
              <td class="text-right"><strong>{{ grupo.stock_total }} u.</strong></td>
              <td class="text-center">
                <a :href="`/admin/productos/nuevo?grupo=${grupo.grupo_id}`" class="tbl-icon-btn tbl-icon-add" :title="`Agregar variante de ${grupo.nombre}`" :aria-label="`Agregar variante de ${grupo.nombre}`">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Variante</span>
                </a>
              </td>
            </tr>
            <tr v-for="prod in grupo.items" :key="prod.producto_id" class="product-option-row">
              <td><code>{{ prod.sku }}</code></td>
              <td>
                <div class="option-cell">
                  <img
                    v-if="prod.imagen_url || prod.categoria"
                    class="option-thumb"
                    :src="fotoDe(prod)"
                    :alt="prod.imagen_url ? `Foto de ${prod.nombre}` : ''"
                    loading="lazy"
                    @error="onImgError($event, prod)"
                  />
                  <div>
                    <span class="option-label">{{ prod.nombre_opcion || 'Opción' }}</span>
                    <span class="option-badge">{{ prod.variante || 'Única' }}</span>
                    <span v-if="prod.activo === false" class="option-off">Inactivo</span>
                  </div>
                </div>
              </td>
              <td class="text-right">${{ Number(prod.costo).toLocaleString('es-AR') }}</td>
              <td class="text-right">
                <template v-if="prod.kit_id">
                  <div>${{ efectivoDe(prod).toLocaleString('es-AR') }}</div>
                  <div class="price-card" title="El precio del kit se gestiona desde la sección Kits">precio del kit</div>
                </template>
                <template v-else>
                  <div class="price-edit">
                    <span aria-hidden="true">$</span>
                    <input
                      :value="efectivoDe(prod)"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      class="admin-input price-input"
                      :aria-label="`Precio en efectivo de ${prod.sku}`"
                      :disabled="ocupado === prod.producto_id"
                      @change="onPrecioChange(prod, $event)"
                      @keydown.enter="blurOnEnter"
                    />
                  </div>
                  <div class="price-card">con tarjeta ${{ Number(prod.precio_venta).toLocaleString('es-AR') }}</div>
                </template>
              </td>
              <td class="text-right">
                <template v-if="prod.kit_id">
                  {{ margenTexto(prod) }}
                </template>
                <div v-else class="margen-edit">
                  <input
                    :value="margenValor(prod)"
                    type="number"
                    min="0"
                    max="95"
                    step="0.5"
                    inputmode="decimal"
                    class="admin-input margen-input"
                    :aria-label="`Margen en % de ${prod.sku}`"
                    :disabled="ocupado === prod.producto_id || Number(prod.costo) <= 0"
                    :title="Number(prod.costo) <= 0 ? 'Cargá el costo del producto para usar el margen' : 'Margen sobre el precio de efectivo'"
                    @change="onMargenChange(prod, $event)"
                    @keydown.enter="blurOnEnter"
                  />
                  <span aria-hidden="true">%</span>
                </div>
              </td>
              <td class="text-right">
                <span class="stock-number" :class="estadoStock(prod)">{{ prod.stock_actual ?? 0 }}</span>
              </td>
              <td class="text-center">
                <div class="option-actions">
                  <a :href="`/admin/productos/${prod.producto_id}`" class="tbl-icon-btn" title="Editar" :aria-label="`Editar ${prod.sku}`">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </a>
                  <button
                    type="button"
                    class="tbl-icon-btn"
                    :disabled="ocupado === prod.producto_id || Boolean(prod.kit_id)"
                    :title="prod.kit_id ? 'Gestioná la publicación del kit desde la sección Kits' : (prod.activo === false ? 'Activar' : 'Desactivar')"
                    :aria-label="`${prod.activo === false ? 'Activar' : 'Desactivar'} ${prod.sku}`"
                    @click="toggleActivo(prod)"
                  >
                    <svg v-if="prod.activo === false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  </button>
                  <button
                    type="button"
                    class="tbl-icon-btn danger"
                    :disabled="ocupado === prod.producto_id || Number(prod.stock_actual ?? 0) > 0 || Boolean(prod.kit_id)"
                    :title="prod.kit_id ? 'Despublicá el kit desde la sección Kits' : Number(prod.stock_actual ?? 0) > 0 ? 'Dejá el stock en 0 para poder eliminar' : 'Eliminar producto'"
                    :aria-label="`Eliminar ${prod.sku}`"
                    @click="eliminar(prod)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fotoDe, urlFallback } from '@/lib/fotos';
import { precioEfectivo, precioTarjeta, clampRecargo, RECARGO_TARJETA_DEFAULT } from '@/lib/precios';

interface ProductoConStock {
  producto_id: string;
  grupo_id: string;
  sku: string;
  nombre: string;
  variante: string;
  nombre_opcion: string;
  categoria: string | null;
  categorias?: string[] | null;
  imagen_url: string | null;
  costo: number;
  precio_venta: number;
  precio_efectivo?: number | null;
  recargo_tarjeta?: number | null;
  stock_minimo: number;
  stock_actual: number;
  activo: boolean;
  kit_id?: string | null;
}

type VentanaAdmin = Window & { adminToast?: (mensaje: string) => void };

function avisar(mensaje: string) {
  (window as VentanaAdmin).adminToast?.(mensaje);
}

const productos = ref<ProductoConStock[]>([]);
const loading = ref(true);
const busqueda = ref('');
const ocupado = ref('');

onMounted(async () => {
  try {
    const res = await fetch('/api/admin/productos');
    if (res.ok) {
      productos.value = await res.json();
    }
  } catch (e) {
    console.error('Error cargando productos:', e);
  } finally {
    loading.value = false;
  }
});

const productosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return productos.value;
  const term = busqueda.value.toLowerCase();
  return productos.value.filter(
    (p) =>
      p.nombre.toLowerCase().includes(term) ||
      (p.variante || '').toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)
  );
});

const gruposFiltrados = computed(() => {
  const mapa = new Map<string, ProductoConStock[]>();
  for (const p of productosFiltrados.value) {
    const key = p.grupo_id || p.producto_id;
    const items = mapa.get(key) || [];
    items.push(p);
    mapa.set(key, items);
  }
  return [...mapa.entries()].map(([grupo_id, items]) => ({
    grupo_id,
    nombre: items[0].nombre,
    categoria: items[0].categoria,
    stock_total: items.reduce((total, p) => total + Number(p.stock_actual || 0), 0),
    items: items.sort((a, b) => (a.variante || '').localeCompare(b.variante || '', 'es')),
  })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
});

function efectivoDe(p: ProductoConStock): number {
  const col = Number(p.precio_efectivo);
  if (Number.isFinite(col) && col > 0) return col;
  const r = Number.isFinite(Number(p.recargo_tarjeta)) ? Number(p.recargo_tarjeta) : RECARGO_TARJETA_DEFAULT;
  return precioEfectivo(Number(p.precio_venta), r);
}

function recargoDe(p: ProductoConStock): number {
  return Number.isFinite(Number(p.recargo_tarjeta)) ? clampRecargo(Number(p.recargo_tarjeta)) : RECARGO_TARJETA_DEFAULT;
}

function extrasDelGrupo(items: ProductoConStock[], principal: string | null): string[] {
  const todas = new Set<string>();
  for (const p of items) {
    for (const c of p.categorias ?? []) {
      if (c && c !== principal) todas.add(c);
    }
  }
  return [...todas];
}

function extrasGrupo(grupo: { items: ProductoConStock[]; categoria: string | null }): number {
  return extrasDelGrupo(grupo.items, grupo.categoria).length;
}

function nombresExtras(grupo: { items: ProductoConStock[]; categoria: string | null }): string {
  return extrasDelGrupo(grupo.items, grupo.categoria).join(', ');
}

function margenDe(p: ProductoConStock): number {
  const ef = efectivoDe(p);
  if (!Number.isFinite(ef) || ef <= 0) return 0;
  return ((ef - Number(p.costo)) / ef) * 100;
}

function margenValor(p: ProductoConStock): string {
  return (Math.round(margenDe(p) * 10) / 10).toFixed(1);
}

function margenTexto(p: ProductoConStock): string {
  return `${margenValor(p)}%`;
}

function blurOnEnter(e: Event) {
  (e.target as HTMLInputElement).blur();
}

function onPrecioChange(p: ProductoConStock, e: Event) {
  const input = e.target as HTMLInputElement;
  const efectivo = Math.round(Number(input.value));
  if (!Number.isFinite(efectivo) || efectivo < 0) {
    avisar('Precio inválido: usá pesos enteros >= 0.');
    input.value = String(efectivoDe(p));
    return;
  }
  if (efectivo === efectivoDe(p)) return;
  void guardarPrecio(p, precioTarjeta(efectivo, recargoDe(p)));
}

function onMargenChange(p: ProductoConStock, e: Event) {
  const input = e.target as HTMLInputElement;
  const pct = Number(input.value);
  if (!Number.isFinite(pct) || pct < 0 || pct > 95) {
    avisar('Margen inválido: usá un % entre 0 y 95.');
    input.value = margenValor(p);
    return;
  }
  if (Number(p.costo) <= 0) {
    avisar('Cargá el costo del producto para usar el margen.');
    input.value = margenValor(p);
    return;
  }
  const efectivo = Math.round(Number(p.costo) / (1 - pct / 100));
  if (efectivo === efectivoDe(p)) return;
  void guardarPrecio(p, precioTarjeta(efectivo, recargoDe(p)));
}

async function guardarPrecio(p: ProductoConStock, precioVenta: number) {
  ocupado.value = p.producto_id;
  try {
    const res = await fetch(`/api/admin/productos/${p.producto_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precio_venta: precioVenta }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      avisar(typeof data.error === 'string' ? data.error : 'No se pudo actualizar el precio.');
      return;
    }
    // Releer la fila fresca: precio_efectivo viene calculado de la vista y si no
    // se actualiza se sigue mostrando el valor viejo hasta recargar.
    try {
      const rf = await fetch(`/api/admin/productos/${p.producto_id}`);
      if (rf.ok) {
        const fresco = await rf.json();
        p.precio_venta = Number(fresco.precio_venta ?? data.precio_venta ?? precioVenta);
        p.precio_efectivo = Number(fresco.precio_efectivo ?? NaN);
        if (!Number.isFinite(p.precio_efectivo)) p.precio_efectivo = null;
        if (fresco.costo != null) p.costo = Number(fresco.costo);
      } else {
        throw new Error('sin fresco');
      }
    } catch {
      p.precio_venta = Number(data.precio_venta ?? precioVenta);
      p.precio_efectivo = null;
    }
    avisar(`«${p.sku}» actualizado: efectivo $${efectivoDe(p).toLocaleString('es-AR')}.`);
  } catch {
    avisar('Error de conexión.');
  } finally {
    ocupado.value = '';
  }
}
function estadoStock(p: ProductoConStock): string {
  const stock = Number(p.stock_actual || 0);
  if (stock <= 0) return 'stock-number-out';
  if (stock <= Number(p.stock_minimo || 0)) return 'stock-number-low';
  return 'stock-number-ok';
}

function onImgError(e: Event, p: ProductoConStock) {
  const img = e.target as HTMLImageElement;
  const fb = urlFallback(p.categoria);
  if (img.src !== fb) img.src = fb;
}

async function toggleActivo(p: ProductoConStock) {
  const nuevo = !p.activo;
  ocupado.value = p.producto_id;
  try {
    const res = await fetch(`/api/admin/productos/${p.producto_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: nuevo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      avisar(typeof data.error === 'string' ? data.error : 'No se pudo actualizar el producto.');
      return;
    }
    p.activo = nuevo;
    avisar(
      nuevo
        ? `«${p.sku}» activado: ya se muestra en la tienda.`
        : `«${p.sku}» desactivado: se ocultó de la tienda.`
    );
  } catch {
    avisar('Error de conexión.');
  } finally {
    ocupado.value = '';
  }
}

async function eliminar(p: ProductoConStock) {
  if (Number(p.stock_actual ?? 0) > 0) {
    avisar(`No se puede eliminar «${p.sku}»: quedan ${p.stock_actual} unidades en stock.`);
    return;
  }
  if (!confirm(`¿Eliminar «${p.sku}» (${p.nombre_opcion || p.variante})? Esta acción no se puede deshacer.`)) {
    return;
  }
  ocupado.value = p.producto_id;
  try {
    const res = await fetch(`/api/admin/productos/${p.producto_id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      avisar(typeof data.error === 'string' ? data.error : 'No se pudo eliminar el producto.');
      return;
    }
    productos.value = productos.value.filter((x) => x.producto_id !== p.producto_id);
    avisar(`«${p.sku}» eliminado.`);
  } catch {
    avisar('Error de conexión.');
  } finally {
    ocupado.value = '';
  }
}
</script>

<style scoped>
.product-group-row td {
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
  background: rgba(152, 140, 45, 0.11);
  border-top: 2px solid rgba(152, 140, 45, 0.28);
  color: var(--admin-text);
}
.product-group-row strong { font-size: 0.95rem; }
.product-group-row small { margin-left: 0.6rem; color: var(--admin-text-muted); }
.product-category { margin-left: 0.65rem; padding: 0.18rem 0.5rem; border-radius: 999px; background: white; color: var(--admin-text-muted); font-size: 0.7rem; }
.product-option-row td:first-child { padding-left: 1.35rem; }
.option-cell { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.option-cell > div { min-width: 0; }
.option-thumb { width: 44px; height: 44px; flex-shrink: 0; border-radius: 8px; object-fit: cover; border: 1px solid rgba(96, 72, 17, 0.18); background: #fffdf8; }
.option-label { display: block; margin-bottom: 0.25rem; color: var(--admin-text-muted); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; }
.option-badge { display: inline-flex; padding: 0.25rem 0.65rem; border: 1px solid rgba(96, 72, 17, 0.25); border-radius: 999px; background: #fffdf8; color: #604811; font-size: 0.8rem; font-weight: 700; }
.stock-number { display: inline-flex; min-width: 42px; justify-content: center; padding: 0.3rem 0.55rem; border-radius: 8px; font-size: 1rem; font-weight: 800; }
.stock-number-ok { background: #f0fff4; color: #22543d; }
.stock-number-low { background: #fffbeb; color: #744210; }
.stock-number-out { background: #fff5f5; color: #742a2a; }
.option-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; }
.tbl-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-card-bg);
  color: var(--admin-sidebar-text);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.tbl-icon-btn:hover:not(:disabled) {
  border-color: var(--admin-primary);
  color: var(--admin-primary);
}
.tbl-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tbl-icon-btn:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}
.tbl-icon-btn svg { width: 16px; height: 16px; }
.tbl-icon-btn.danger { color: var(--admin-danger); }
.tbl-icon-btn.danger:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #fed7d7;
  color: var(--admin-danger);
}
.tbl-icon-add { width: auto; padding: 0 0.6rem; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; }
.option-off {
  display: inline-flex;
  margin-left: 0.4rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid rgba(116, 42, 42, 0.35);
  border-radius: 999px;
  background: #fff5f5;
  color: #742a2a;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.price-card { color: var(--admin-text-muted); font-size: 0.72rem; margin-top: 0.15rem; }
.price-edit { display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.2rem; font-weight: 800; }
.price-input { width: 92px; min-height: 44px; text-align: right; font-weight: 800; padding: 0.375rem 0.5rem; }
.margen-edit { display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.2rem; font-weight: 700; }
.margen-input { width: 76px; min-height: 44px; text-align: right; font-weight: 700; padding: 0.375rem 0.5rem; }
.price-input:disabled, .margen-input:disabled { opacity: 0.55; }
</style>
