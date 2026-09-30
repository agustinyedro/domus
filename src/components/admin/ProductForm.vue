<!-- src/components/admin/ProductForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="admin-form">
    <div v-if="volverA" class="pf-bar">
      <div class="pf-bar-row">
        <a href="/admin/productos" class="admin-btn admin-btn-ghost">Volver</a>
        <button type="submit" class="admin-btn admin-btn-primary" :disabled="loading">
          {{ loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto' }}
        </button>
      </div>
      <p v-if="error" class="admin-alert admin-alert-error pf-bar-alert">{{ error }}</p>
      <p v-if="success" class="admin-alert admin-alert-success pf-bar-alert">{{ success }}</p>
    </div>

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
        <input v-model="form.variante" ref="varianteInput" type="text" class="admin-input" maxlength="120" placeholder="Ej: Bambú" required />
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

    <div class="pf-precios">
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
        <label class="admin-form-label">Precio en efectivo ($)</label>
        <input
          v-model.number="efectivoInput"
          type="number"
          class="admin-input warning"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div class="admin-form-group">
        <label class="admin-form-label">Recargo tarjeta (%)</label>
        <input
          v-model.number="recargoInput"
          type="number"
          class="admin-input"
          min="0"
          max="95"
          step="1"
        />
      </div>
    </div>

    <p style="margin: -0.25rem 0 1rem; font-size: 0.875rem;">
      Precio con tarjeta: <strong>${{ precioTarjetaForm.toLocaleString('es-AR') }}</strong>
      <span style="color: var(--admin-text-muted);">(efectivo + {{ recargoNorm }}%) · en la tienda se muestra como «con tarjeta»</span>
    </p>

    <div class="admin-card" style="padding: 1rem;">
      <div class="admin-form-group" style="max-width: 11rem; margin-bottom: 0.75rem;">
        <label class="admin-form-label" for="pf-margen">% Margen (sobre el precio de efectivo)</label>
        <input
          id="pf-margen"
          ref="margenInput"
          v-model.number="margenPct"
          type="number"
          class="admin-input"
          min="0"
          max="95"
          step="any"
          placeholder="Ej: 30"
          @input="aplicarMargen"
        />
      </div>
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

      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.75rem;">
        <input type="checkbox" v-model="form.activo" />
        Visible en la tienda (producto activo)
      </label>

      <div style="margin-bottom: 0.75rem;">
        <div class="admin-form-group">
          <label class="admin-form-label">Precio de oferta en efectivo ($, opcional)</label>
          <input
            v-model.number="ofertaInput"
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
        En oferta (requiere precio oferta menor al precio en efectivo)
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

    <div v-if="!volverA && error" class="admin-alert admin-alert-error">{{ error }}</div>
    <div v-if="!volverA && success" class="admin-alert admin-alert-success">{{ success }}</div>

    <button v-if="!volverA" type="submit" class="admin-btn admin-btn-primary" :disabled="loading">
      {{ loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { precioEfectivo, precioTarjeta, clampRecargo, RECARGO_TARJETA_DEFAULT } from '@/lib/precios';

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
  recargo_tarjeta?: number;
  precio_oferta: number | null;
  es_oferta: boolean;
  destacado: boolean;
  rating_promedio: number;
  rating_cantidad: number;
  stock_minimo: number;
  activo?: boolean;
}

type VentanaAdmin = Window & { adminToast?: (mensaje: string) => void };

const props = defineProps<{ producto?: Producto | null; volverA?: string }>();
const emit = defineEmits<{ saved: [producto: Producto & { costo: number }] }>();

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
  activo: props.producto?.activo ?? true,
});

const loading = ref(false);
const error = ref('');
const success = ref('');
const varianteInput = ref<HTMLInputElement | null>(null);
const catalogo = ref<Array<Producto & { producto_id?: string }>>([]);

// Precios: el admin carga el precio EN EFECTIVO; el de tarjeta se deriva con el recargo.
const recargoInicial = clampRecargo(Number(props.producto?.recargo_tarjeta ?? RECARGO_TARJETA_DEFAULT));
const recargoInput = ref<number | string>(recargoInicial);
const efectivoInput = ref<number>(
  props.producto ? precioEfectivo(Number(props.producto.precio_venta), recargoInicial) : 0
);
const ofertaInput = ref<number | string | null>(
  props.producto?.precio_oferta != null && Number(props.producto.precio_oferta) > 0
    ? precioEfectivo(Number(props.producto.precio_oferta), recargoInicial)
    : null
);

const recargoNorm = computed(() => {
  const raw = recargoInput.value;
  const r = Number(raw);
  return String(raw).trim() !== '' && Number.isFinite(r) ? clampRecargo(r) : RECARGO_TARJETA_DEFAULT;
});

const precioTarjetaForm = computed(() => {
  const ef = Number(efectivoInput.value);
  return Number.isFinite(ef) && ef > 0 ? precioTarjeta(ef, recargoNorm.value) : 0;
});

function aplicarPrecios() {
  const ef = Number(efectivoInput.value);
  form.value.precio_venta = Number.isFinite(ef) && ef > 0 ? precioTarjeta(ef, recargoNorm.value) : 0;
  const of = Number(ofertaInput.value);
  form.value.precio_oferta = Number.isFinite(of) && of > 0 ? precioTarjeta(of, recargoNorm.value) : null;
}

watch([efectivoInput, recargoInput, ofertaInput], aplicarPrecios);

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
  const ef = Number(efectivoInput.value);
  if (!Number.isFinite(ef) || ef === 0) return 0;
  return ((ef - form.value.costo) / ef) * 100;
});

const gananciaUnitaria = computed(() => (Number(efectivoInput.value) || 0) - form.value.costo);

// % de margen editable: efectivo = costo / (1 - %), redondeado a pesos enteros
const margenPct = ref(0);
const margenInput = ref<HTMLInputElement | null>(null);

function aplicarMargen() {
  const p = Number(margenPct.value);
  if (!Number.isFinite(p) || p < 0 || p > 95 || form.value.costo <= 0) return;
  efectivoInput.value = Math.round(form.value.costo / (1 - p / 100));
}

watch([efectivoInput, () => form.value.costo], () => {
  if (margenInput.value && document.activeElement === margenInput.value) return;
  margenPct.value = Number(efectivoInput.value) > 0
    ? Math.round(margen.value * 10) / 10
    : 0;
}, { immediate: true });

const descuentoPreview = computed(() => {
  const ef = Number(efectivoInput.value);
  const of = Number(ofertaInput.value);
  if (!form.value.es_oferta || !Number.isFinite(of) || of <= 0 || !Number.isFinite(ef) || ef <= 0 || of >= ef) return 0;
  return Math.round((1 - of / ef) * 100);
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
      activo: p.activo ?? true,
    };
    const r = clampRecargo(Number(p.recargo_tarjeta ?? RECARGO_TARJETA_DEFAULT));
    recargoInput.value = r;
    efectivoInput.value = precioEfectivo(Number(p.precio_venta), r);
    ofertaInput.value = p.precio_oferta != null && Number(p.precio_oferta) > 0
      ? precioEfectivo(Number(p.precio_oferta), r)
      : null;
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

    aplicarPrecios();
    const payload = {
      ...form.value,
      grupo_id: form.value.grupo_id || null,
      imagen_url: form.value.imagen_url.trim() || null,
      categoria: form.value.categoria.trim() || null,
      recargo_tarjeta: recargoNorm.value,
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as Producto & { error?: unknown };

    if (!res.ok) {
      error.value = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      return;
    }

    const esVariante = !props.producto && Boolean(form.value.grupo_id);
    const mensaje = props.producto
      ? 'Cambios guardados'
      : esVariante
        ? `Variante «${data.variante}» creada`
        : `«${data.nombre}» creado`;

    success.value = mensaje;
    emit('saved', { ...data, costo: Number(data.costo ?? payload.costo ?? 0) });

    if (!props.volverA) return;

    if (esVariante) {
      form.value.sku = '';
      form.value.variante = '';
      cargarCatalogo();
      (window as VentanaAdmin).adminToast?.(mensaje);
      varianteInput.value?.focus();
      return;
    }

    try {
      sessionStorage.setItem('domus:admin-flash', mensaje);
    } catch { /* sin sessionStorage */ }
    window.location.assign(props.volverA);
  } catch {
    error.value = 'Error de conexión';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.pf-bar {
  position: sticky;
  top: var(--admin-sticky-top);
  z-index: 30;
  padding: 0.75rem 0 0.5rem;
  background: var(--admin-card-bg);
  border-bottom: 1px solid var(--admin-border);
}

.pf-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pf-bar-alert {
  margin: 0.625rem 0 0;
}

.admin-input {
  width: 100%;
  min-width: 0;
}

.pf-precios {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .pf-precios {
    grid-template-columns: 1fr;
  }
}
</style>
