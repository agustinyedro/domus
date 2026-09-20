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
                <span class="option-label">{{ prod.nombre_opcion || 'Opción' }}</span>
                <span class="option-badge">{{ prod.variante || 'Única' }}</span>
              </td>
              <td class="text-right">${{ Number(prod.costo).toLocaleString('es-AR') }}</td>
              <td class="text-right">${{ Number(prod.precio_venta).toLocaleString('es-AR') }}</td>
              <td class="text-right">
                {{ prod.precio_venta > 0 ? ((prod.precio_venta - prod.costo) / prod.precio_venta * 100).toFixed(1) : '0.0' }}%
              </td>
              <td class="text-right">
                <span class="stock-number" :class="estadoStock(prod)">{{ prod.stock_actual ?? 0 }}</span>
              </td>
              <td class="text-center">
                <a :href="`/admin/productos/${prod.producto_id}`" class="admin-btn admin-btn-ghost option-edit">Editar</a>
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

interface ProductoConStock {
  producto_id: string;
  grupo_id: string;
  sku: string;
  nombre: string;
  variante: string;
  nombre_opcion: string;
  categoria: string | null;
  costo: number;
  precio_venta: number;
  stock_minimo: number;
  stock_actual: number;
}

const productos = ref<ProductoConStock[]>([]);
const loading = ref(true);
const busqueda = ref('');

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

function estadoStock(p: ProductoConStock): string {
  const stock = Number(p.stock_actual || 0);
  if (stock <= 0) return 'stock-number-out';
  if (stock <= Number(p.stock_minimo || 0)) return 'stock-number-low';
  return 'stock-number-ok';
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
.option-label { display: block; margin-bottom: 0.25rem; color: var(--admin-text-muted); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; }
.option-badge { display: inline-flex; padding: 0.25rem 0.65rem; border: 1px solid rgba(96, 72, 17, 0.25); border-radius: 999px; background: #fffdf8; color: #604811; font-size: 0.8rem; font-weight: 700; }
.stock-number { display: inline-flex; min-width: 42px; justify-content: center; padding: 0.3rem 0.55rem; border-radius: 8px; font-size: 1rem; font-weight: 800; }
.stock-number-ok { background: #f0fff4; color: #22543d; }
.stock-number-low { background: #fffbeb; color: #744210; }
.stock-number-out { background: #fff5f5; color: #742a2a; }
.option-edit { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
</style>
