<!-- src/components/admin/ProductForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="admin-form">
    <div class="admin-form-group">
      <label class="admin-form-label">SKU</label>
      <input
        v-model="form.sku"
        type="text"
        class="admin-input"
        placeholder="DIFUSOR001"
        required
      />
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Nombre</label>
      <input
        v-model="form.nombre"
        type="text"
        class="admin-input"
        placeholder="Difusor Aromanza"
        required
      />
    </div>

    <div class="admin-card" style="padding: 1rem; margin-bottom: 1rem;">
      <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600;">Opciones del producto</p>
      <div class="admin-form-group">
        <label class="admin-form-label">Pertenece al mismo producto que</label>
        <select v-model="form.grupo_id" class="admin-input" @change="aplicarGrupo">
          <option value="">Producto nuevo e independiente</option>
          <option v-for="g in gruposDisponibles" :key="g.grupo_id" :value="g.grupo_id">
            {{ g.nombre }}
          </option>
        </select>
        <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: var(--admin-text-muted);">
          Elegí un producto existente si este registro es otro aroma o presentación del mismo producto.
        </p>
      </div>
      <div class="admin-form-group" style="margin-bottom: 0;">
        <label class="admin-form-label">Cómo se llama esta opción</label>
        <input v-model="form.nombre_opcion" type="text" class="admin-input" maxlength="80" placeholder="Ej: Aroma, Tamaño, Sabor o Color" required />
        <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: var(--admin-text-muted);">
          Este nombre se mostrará en la tienda antes de las opciones.
        </p>
      </div>
      <div class="admin-form-group" style="margin: 0.75rem 0 0;">
        <label class="admin-form-label">Valor de la opción</label>
        <input v-model="form.variante" type="text" class="admin-input" maxlength="120" placeholder="Ej: Bambú" required />
      </div>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Categoría</label>
      <div style="display: flex; gap: 0.5rem;">
        <select v-model="form.categoria" class="admin-input" style="flex: 1;">
          <option value="">— Elegí —</option>
          <option v-for="c in categorias" :key="c.id" :value="c.nombre">
            {{ c.nombre }}{{ c.productos ? ` (${c.productos})` : '' }}
          </option>
          <option v-if="form.categoria && !categorias.some((c) => c.nombre === form.categoria)" :value="form.categoria">
            {{ form.categoria }}
          </option>
        </select>
        <button type="button" class="admin-btn admin-btn-ghost" style="white-space: nowrap;" @click="mostrarNuevaCat = !mostrarNuevaCat">
          + Nueva
        </button>
      </div>
      <div v-if="mostrarNuevaCat" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <input
          v-model="nuevaCategoria"
          type="text"
          class="admin-input"
          style="flex: 1;"
          placeholder="Nombre de la categoría"
          maxlength="100"
          @keyup.enter.prevent="crearCategoria"
        />
        <button type="button" class="admin-btn admin-btn-primary" :disabled="creandoCat" @click="crearCategoria">
          {{ creandoCat ? '…' : 'Crear' }}
        </button>
      </div>
      <p v-if="errorCat" class="admin-alert admin-alert-error" style="margin: 0.5rem 0 0;">{{ errorCat }}</p>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Descripción</label>
      <textarea
        v-model="form.descripcion"
        class="admin-input"
        rows="3"
        placeholder="Descripción del producto..."
      ></textarea>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="admin-form-group">
        <label class="admin-form-label">Costo ($)</label>
        <input
          v-model.number="form.costo"
          type="number"
          class="admin-input warning"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div class="admin-form-group">
        <label class="admin-form-label">Precio Venta ($)</label>
        <input
          v-model.number="form.precio_venta"
          type="number"
          class="admin-input warning"
          min="0"
          step="0.01"
          required
        />
      </div>
    </div>

    <div class="admin-card" style="padding: 1rem;">
      <p style="margin: 0; font-size: 0.875rem;">
        Margen: <strong :style="{ color: margen >= 30 ? '#48bb78' : margen >= 15 ? '#ed8936' : '#f56565' }">
          {{ margen.toFixed(1) }}%
        </strong>
        &nbsp;|&nbsp;
        Ganancia unitaria: <strong>${{ gananciaUnitaria.toLocaleString() }}</strong>
      </p>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Stock Mínimo</label>
      <input
        v-model.number="form.stock_minimo"
        type="number"
        class="admin-input"
        min="0"
        required
      />
    </div>

    <div class="admin-card" style="padding: 1rem;">
      <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600;">Tienda pública</p>

      <div style="margin-bottom: 0.75rem;">
        <div class="admin-form-group">
          <label class="admin-form-label">Precio Oferta ($, opcional)</label>
          <input
            v-model.number="form.precio_oferta"
            type="number"
            class="admin-input"
            min="0"
            step="0.01"
            placeholder="Vacío = sin oferta"
          />
        </div>

      </div>

      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.5rem;">
        <input type="checkbox" v-model="form.es_oferta" />
        En oferta (requiere precio oferta menor al precio venta)
      </label>

      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
        <input type="checkbox" v-model="form.destacado" />
        Destacado (prioridad en relevancia)
      </label>

      <p v-if="descuentoPreview > 0" style="margin: 0.75rem 0 0; font-size: 0.875rem;">
        Descuento en tienda: <strong>{{ descuentoPreview }}%</strong>
      </p>
    </div>

    <div class="admin-card" style="padding: 1rem;">
      <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600;">Foto del producto</p>

      <div v-if="previewImg" style="margin-bottom: 0.75rem;">
        <img :src="previewImg" alt="Vista previa" style="width: 100%; max-width: 280px; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; border: 1px solid var(--admin-border);" />
      </div>

      <div class="admin-form-group" style="margin-bottom: 0.75rem;">
        <label class="admin-form-label">Subir foto (JPG/PNG/WebP, máx 2 MB)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="admin-input"
          :disabled="subiendoImg"
          @change="onArchivo"
        />
        <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: var(--admin-text-muted);">
          Se comprime a máx 1200px antes de subir. Requiere SKU cargado.
        </p>
      </div>

      <div class="admin-form-group" style="margin-bottom: 0;">
        <label class="admin-form-label">…o pegar link de foto</label>
        <input
          v-model="form.imagen_url"
          type="url"
          class="admin-input"
          placeholder="https://…"
          maxlength="500"
        />
      </div>

      <p v-if="subiendoImg" style="margin: 0.5rem 0 0; font-size: 0.875rem;">Subiendo foto…</p>
      <p v-if="errorImg" class="admin-alert admin-alert-error" style="margin: 0.5rem 0 0;">{{ errorImg }}</p>
    </div>

    <div v-if="error" class="admin-alert admin-alert-error">{{ error }}</div>
    <div v-if="success" class="admin-alert admin-alert-success">{{ success }}</div>

    <button type="submit" class="admin-btn admin-btn-primary" :disabled="loading">
      {{ loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Categoria {
  id: string;
  nombre: string;
  productos?: number;
}

interface Producto {
  id: string;
  grupo_id: string;
  variante: string;
  nombre_opcion: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  imagen_url: string | null;
  costo: number;
  precio_venta: number;
  precio_oferta: number | null;
  es_oferta: boolean;
  destacado: boolean;
  rating_promedio: number;
  rating_cantidad: number;
  stock_minimo: number;
}

const props = defineProps<{ producto?: Producto | null }>();
const emit = defineEmits<{ saved: [] }>();

const form = ref({
  grupo_id: props.producto?.grupo_id || '',
  variante: props.producto?.variante || 'Única',
  nombre_opcion: props.producto?.nombre_opcion || 'Aroma o presentación',
  sku: props.producto?.sku || '',
  nombre: props.producto?.nombre || '',
  descripcion: props.producto?.descripcion || '',
  categoria: props.producto?.categoria || '',
  imagen_url: props.producto?.imagen_url || '',
  costo: props.producto?.costo || 0,
  precio_venta: props.producto?.precio_venta || 0,
  precio_oferta: props.producto?.precio_oferta ?? null as number | null,
  es_oferta: props.producto?.es_oferta || false,
  destacado: props.producto?.destacado || false,
  rating_promedio: props.producto?.rating_promedio || 0,
  rating_cantidad: props.producto?.rating_cantidad || 0,
  stock_minimo: props.producto?.stock_minimo ?? 5,
});

const loading = ref(false);
const error = ref('');
const success = ref('');
const catalogo = ref<Array<Producto & { producto_id?: string }>>([]);

const gruposDisponibles = computed(() => {
  const grupos = new Map<string, Producto>();
  for (const p of catalogo.value) {
    if (!p.grupo_id || grupos.has(p.grupo_id)) continue;
    grupos.set(p.grupo_id, p);
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
});

function aplicarGrupo() {
  if (!form.value.grupo_id) return;
  const base = catalogo.value.find((p) => p.grupo_id === form.value.grupo_id);
  if (!base) return;
  form.value.nombre = base.nombre;
  form.value.descripcion = base.descripcion || '';
  form.value.categoria = base.categoria || '';
  form.value.imagen_url = base.imagen_url || '';
  form.value.nombre_opcion = base.nombre_opcion || 'Aroma o presentación';
}

const margen = computed(() => {
  if (form.value.precio_venta === 0) return 0;
  return ((form.value.precio_venta - form.value.costo) / form.value.precio_venta) * 100;
});

const gananciaUnitaria = computed(() => form.value.precio_venta - form.value.costo);

const descuentoPreview = computed(() => {
  const po = form.value.precio_oferta;
  if (!form.value.es_oferta || po === null || po <= 0 || po >= form.value.precio_venta) return 0;
  return Math.round((1 - po / form.value.precio_venta) * 100);
});

watch(() => props.producto, (p) => {
  if (p) {
    form.value = {
      grupo_id: p.grupo_id || '',
      variante: p.variante || 'Única',
      nombre_opcion: p.nombre_opcion || 'Aroma o presentación',
      sku: p.sku,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      categoria: p.categoria || '',
      imagen_url: p.imagen_url || '',
      costo: p.costo,
      precio_venta: p.precio_venta,
      precio_oferta: p.precio_oferta,
      es_oferta: p.es_oferta,
      destacado: p.destacado,
      rating_promedio: p.rating_promedio,
      rating_cantidad: p.rating_cantidad,
      stock_minimo: p.stock_minimo,
    };
  }
});

// ---------- Categorías ----------
const categorias = ref<Categoria[]>([]);
const mostrarNuevaCat = ref(false);
const nuevaCategoria = ref('');
const creandoCat = ref(false);
const errorCat = ref('');

async function cargarCategorias() {
  try {
    const res = await fetch('/api/admin/categorias');
    if (res.ok) categorias.value = await res.json();
  } catch { /* noop */ }
}

async function cargarCatalogo() {
  try {
    const res = await fetch('/api/admin/productos');
    if (res.ok) catalogo.value = await res.json();
  } catch { /* noop */ }
}

async function crearCategoria() {
  const nombre = nuevaCategoria.value.trim().replace(/\s+/g, ' ');
  if (!nombre) return;
  creandoCat.value = true;
  errorCat.value = '';
  try {
    const res = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorCat.value = typeof data.error === 'string' ? data.error : 'No se pudo crear.';
      return;
    }
    if (!categorias.value.some((c) => c.id === data.id)) categorias.value.push(data);
    categorias.value.sort((a, b) => a.nombre.localeCompare(b.nombre));
    form.value.categoria = data.nombre;
    nuevaCategoria.value = '';
    mostrarNuevaCat.value = false;
  } catch {
    errorCat.value = 'Error de conexión';
  } finally {
    creandoCat.value = false;
  }
}

// ---------- Imagen ----------
const subiendoImg = ref(false);
const errorImg = ref('');

const previewImg = computed(() => form.value.imagen_url || '');

function redimensionar(archivo: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(archivo);
    img.onload = () => {
      const MAX = 1200;
      const escala = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objUrl);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('No se pudo procesar'))),
        'image/jpeg',
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Archivo inválido'));
    };
    img.src = objUrl;
  });
}

async function onArchivo(e: Event) {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  errorImg.value = '';

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
    errorImg.value = 'Formato no permitido. Usá JPG, PNG o WebP.';
    return;
  }
  if (!form.value.sku.trim()) {
    errorImg.value = 'Cargá el SKU primero: la foto se guarda con ese nombre.';
    return;
  }

  subiendoImg.value = true;
  try {
    const blob = await redimensionar(archivo);
    const fd = new FormData();
    fd.append('archivo', blob, 'foto.jpg');
    fd.append('sku', form.value.sku.trim());

    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      errorImg.value = typeof data.error === 'string' ? data.error : 'No se pudo subir.';
      return;
    }
    form.value.imagen_url = data.url;
  } catch {
    errorImg.value = 'No se pudo procesar la imagen.';
  } finally {
    subiendoImg.value = false;
  }
}

onMounted(() => {
  cargarCategorias();
  cargarCatalogo();
});

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const url = props.producto
      ? `/api/admin/productos/${props.producto.id}`
      : '/api/admin/productos';
    const method = props.producto ? 'PUT' : 'POST';

    const payload = {
      ...form.value,
      grupo_id: form.value.grupo_id || null,
      imagen_url: form.value.imagen_url.trim() || null,
      categoria: form.value.categoria.trim() || null,
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      return;
    }

    success.value = props.producto ? 'Producto actualizado' : 'Producto creado';
    emit('saved');
  } catch {
    error.value = 'Error de conexión';
  } finally {
    loading.value = false;
  }
};
</script>
