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

    <div v-else-if="productosFiltrados.length === 0" class="admin-empty">
      {{ busqueda ? 'No se encontraron productos' : 'No hay productos. Creá el primero.' }}
    </div>

    <div v-else class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Margen</th>
            <th class="text-right">Stock</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prod in productosFiltrados" :key="prod.producto_id">
            <td><code>{{ prod.sku }}</code></td>
            <td>{{ prod.nombre }}</td>
            <td class="text-right">${{ prod.costo.toLocaleString() }}</td>
            <td class="text-right">${{ prod.precio_venta.toLocaleString() }}</td>
            <td class="text-right">
              {{ ((prod.precio_venta - prod.costo) / prod.precio_venta * 100).toFixed(1) }}%
            </td>
            <td class="text-right">
              <span
                class="stock-badge"
                :class="(prod.stock_actual ?? 0) < prod.stock_minimo ? 'stock-low' : 'stock-ok'"
              >
                {{ prod.stock_actual ?? 0 }}
              </span>
            </td>
            <td class="text-center">
              <a :href="`/admin/productos/${prod.producto_id}`" class="admin-btn admin-btn-ghost" style="padding: 0.375rem 0.75rem; font-size: 0.8125rem;">
                Editar
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ProductoConStock {
  producto_id: string;
  sku: string;
  nombre: string;
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
      p.sku.toLowerCase().includes(term)
  );
});
</script>
