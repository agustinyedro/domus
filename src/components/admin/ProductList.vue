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
                <small>{{ grupo.items.length }} {{ grupo.items.length === 1 ? 'opción' : 'opciones' }}</small>
              </td>
              <td class="text-right"><strong>{{ grupo.stock_total }} u.</strong></td>
              <td></td>
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
                <template v-if="efectivoDe(prod) > 0">
                  <div>${{ efectivoDe(prod).toLocaleString('es-AR') }}</div>
                  <div class="price-card">con tarjeta ${{ Number(prod.precio_venta).toLocaleString('es-AR') }}</div>
                </template>
                <template v-else>—</template>
              </td>
              <td class="text-right">
                {{ efectivoDe(prod) > 0 ? ((efectivoDe(prod) - prod.costo) / efectivoDe(prod) * 100).toFixed(1) : '0.0' }}%
              </td>
              <td class="text-right">
                <span class="stock-number" :class="estadoStock(prod)">{{ prod.stock_actual ?? 0 }}</span>
              </td>
              <td class="text-center">
                <div class="option-actions">
                  <a :href="`/admin/productos/${prod.producto_id}`" class="admin-btn admin-btn-ghost option-edit">Editar</a>
                  <button
                    type="button"
                    class="admin-btn admin-btn-ghost option-edit"
                    :disabled="ocupado === prod.producto_id || Boolean(prod.kit_id)"
                    :title="prod.kit_id ? 'Gestioná la publicación del kit desde la sección Kits' : undefined"
                    @click="toggleActivo(prod)"
                  >
                    {{ prod.activo === false ? 'Activar' : 'Desactivar' }}
                  </button>
                  <button
                    type="button"
                    class="admin-btn admin-btn-danger option-edit"
                    :disabled="ocupado === prod.producto_id || Number(prod.stock_actual ?? 0) > 0 || Boolean(prod.kit_id)"
                    :title="prod.kit_id ? 'Despublicá el kit desde la sección Kits' : Number(prod.stock_actual ?? 0) > 0 ? 'Dejá el stock en 0 para poder eliminar' : 'Eliminar producto'"
                    @click="eliminar(prod)"
                  >
                    Eliminar
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
import { precioEfectivo, RECARGO_TARJETA_DEFAULT } from '@/lib/precios';

interface ProductoConStock {
  producto_id: string;
  grupo_id: string;
  sku: string;
  nombre: string;
  variante: string;
  nombre_opcion: string;
  categoria: string | null;
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
.option-edit { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.option-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; }
.option-actions .admin-btn:disabled { opacity: 0.45; cursor: not-allowed; }
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
</style>
