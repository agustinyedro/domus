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

    <div class="pf-layout">
      <div class="pf-main">
        <div class="admin-section">
          <p class="admin-section-title">Foto del producto</p>
          <div class="pf-foto-row">
            <div v-if="previewImg" class="pf-foto-preview">
              <img :src="previewImg" alt="Vista previa" @error="onFotoPreviewError" />
            </div>
            <div class="pf-foto-actions">
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
          </div>
        </div>
        <div class="pf-duo">
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
        </div>

    <div class="admin-section">
      <p class="admin-section-title">Opciones del producto</p>
      <div class="admin-form-group">
        <label class="admin-form-label" for="pf-grupo-search">Pertenece al mismo producto que</label>
        <div class="product-picker" ref="grupoPickerRoot">
          <input
            id="pf-grupo-search"
            type="search"
            class="admin-input"
            data-product-search
            placeholder="Buscá por nombre, variante o SKU… (vacío = producto independiente)"
            aria-label="Buscar producto padre"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            autocomplete="off"
          />
          <div class="product-picker-results" data-product-results role="listbox" hidden></div>
          <select data-product-value tabindex="-1" aria-hidden="true" hidden></select>
        </div>
      </div>
      <div v-if="grupoBase" class="pf-grupo-pick">
        <img
          class="pf-grupo-foto"
          :src="fotoDe(grupoBase)"
          :alt="`Foto de ${grupoBase.nombre}`"
          loading="lazy"
          @error="onGrupoImgError"
        />
        <div class="pf-grupo-datos">
          <strong>{{ grupoBase.nombre }}</strong>
          <small>SKU {{ grupoBase.sku }} · {{ grupoBase.categoria || 'Sin categoría' }}</small>
        </div>
        <button type="button" class="admin-btn admin-btn-ghost admin-btn-sm" @click="limpiarGrupo">Quitar</button>
      </div>
      <p v-else class="pf-grupo-hint">
        Si es otro aroma o presentación de un producto existente, buscalo arriba: se completan nombre, categoría, opción y foto.
      </p>
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
      <label class="admin-form-label">Categoría principal</label>
      <div style="display: flex; gap: 0.5rem;">
        <select v-model="form.categoria" class="admin-input" style="flex: 1;" @change="alCambiarPrincipal">
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
      <div v-if="secundariasDisponibles.length" class="pf-secs">
        <span class="pf-secs-title">También aparece en:</span>
        <label v-for="c in secundariasDisponibles" :key="c" class="pf-sec-check">
          <input type="checkbox" :value="c" v-model="extras" />
          {{ c }}
        </label>
      </div>
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
      </div>
      <aside class="pf-aside">
        <div class="admin-section">
          <p class="admin-section-title">Precios</p>
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

    <p style="margin: 0.75rem 0 0; font-size: 0.875rem;">
      Precio con tarjeta: <strong>${{ precioTarjetaForm.toLocaleString('es-AR') }}</strong>
      <span style="color: var(--admin-text-muted);">(efectivo + {{ recargoNorm }}%) · en la tienda se muestra como «con tarjeta»</span>
    </p>
        </div>

        <div class="admin-section">
          <div class="admin-form-group" style="max-width: 11rem; margin-bottom: 0.75rem;">
            <label class="admin-form-label" for="pf-margen">% Margen (sobre el precio de efectivo) <span style="color: var(--admin-text-muted); font-weight: 400;">· por defecto {{ MARGEN_DEFAULT }}%</span></label>
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

    <div class="admin-section">
      <p class="admin-section-title">Stock</p>
      <div class="admin-form-group" style="margin-bottom: 0;">
        <label class="admin-form-label">Stock Mínimo</label>
        <input
          v-model.number="form.stock_minimo"
          type="number"
          class="admin-input"
          min="0"
          required
        />
      </div>
    </div>

    <div class="admin-section">
      <p class="admin-section-title">Tienda pública</p>

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
      </aside>
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
import { precioEfectivo, precioTarjeta, clampRecargo, RECARGO_TARJETA_DEFAULT, MARGEN_DEFAULT } from '@/lib/precios';
import { setupProductPicker, type ProductPicker, type ProductPickerItem } from '@/lib/admin-product-picker';
import { fotoDe, urlFallback } from '@/lib/fotos';

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
  categorias?: string[] | null;
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

const props = defineProps<{ producto?: Producto | null; volverA?: string; grupoPreset?: string }>();
const emit = defineEmits<{ saved: [producto: Producto & { costo: number }] }>();

const form = ref({
  grupo_id: props.producto?.grupo_id || props.grupoPreset || '',
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
  heredarExtras(base);
  if (!props.producto && !form.value.sku.trim()) {
    const sugerido = sugerirSku(form.value.grupo_id);
    if (sugerido) form.value.sku = sugerido;
  }
}

// Sugiere el SKU siguiente del grupo (DIFUSOR001 → DIFUSOR002); editable.
function sugerirSku(grupoId: string): string {
  const skus = catalogo.value
    .filter((p) => p.grupo_id === grupoId && p.sku?.trim())
    .map((p) => p.sku.trim());
  const porPrefijo = new Map<string, Array<{ n: number; w: number }>>();
  const sinNumero: string[] = [];
  for (const sku of skus) {
    const m = sku.match(/^(.*?)(\d+)$/);
    if (m) {
      const arr = porPrefijo.get(m[1]) ?? [];
      arr.push({ n: Number(m[2]), w: m[2].length });
      porPrefijo.set(m[1], arr);
    } else {
      sinNumero.push(sku);
    }
  }
  let mejorPref = '';
  let mejor: Array<{ n: number; w: number }> = [];
  for (const [pref, arr] of porPrefijo) {
    const maxArr = arr.length ? Math.max(...arr.map((x) => x.n)) : 0;
    const maxMejor = mejor.length ? Math.max(...mejor.map((x) => x.n)) : 0;
    if (arr.length > mejor.length || (arr.length === mejor.length && maxArr > maxMejor)) {
      mejorPref = pref;
      mejor = arr;
    }
  }
  if (mejor.length) {
    const maxN = Math.max(...mejor.map((x) => x.n));
    const w = mejor.find((x) => x.n === maxN)?.w ?? Math.max(...mejor.map((x) => x.w));
    return `${mejorPref}${String(maxN + 1).padStart(w, '0')}`;
  }
  if (sinNumero.length) return `${sinNumero[0]}-2`;
  return '';
}

const grupoBase = computed(() =>
  form.value.grupo_id ? catalogo.value.find((p) => p.grupo_id === form.value.grupo_id) : undefined
);

const grupoItems = computed<ProductPickerItem[]>(() =>
  gruposDisponibles.value.map((g) => ({
    id: g.grupo_id,
    label: g.nombre,
    search: `${g.nombre} ${g.variante || ''} ${g.sku || ''} ${g.categoria || ''}`,
    meta: `SKU ${g.sku || '—'} · ${g.categoria || 'Sin categoría'}`,
  }))
);

const grupoPickerRoot = ref<HTMLElement | null>(null);
let grupoPicker: ProductPicker | null = null;

function onGrupoSelect(item: ProductPickerItem | null) {
  form.value.grupo_id = item?.id || '';
  aplicarGrupo();
}

function limpiarGrupo() {
  form.value.grupo_id = '';
}

function onGrupoImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  const fb = urlFallback(grupoBase.value?.categoria);
  if (img.src !== fb) img.src = fb;
}

function onFotoPreviewError(e: Event) {
  const img = e.target as HTMLImageElement;
  const fb = urlFallback(form.value.categoria);
  if (img.src !== fb) img.src = fb;
}

const margen = computed(() => {
  const ef = Number(efectivoInput.value);
  if (!Number.isFinite(ef) || ef === 0) return 0;
  return ((ef - form.value.costo) / ef) * 100;
});

const gananciaUnitaria = computed(() => (Number(efectivoInput.value) || 0) - form.value.costo);

// % de margen editable: efectivo = costo / (1 - %), redondeado a pesos enteros
// En productos nuevos arranca en el default y al cargar el costo se sugiere el precio solo.
const margenPct = ref(props.producto ? 0 : MARGEN_DEFAULT);
const margenInput = ref<HTMLInputElement | null>(null);

function aplicarMargen() {
  const p = Number(margenPct.value);
  if (!Number.isFinite(p) || p < 0 || p > 95 || form.value.costo <= 0) return;
  efectivoInput.value = Math.round(form.value.costo / (1 - p / 100));
}

watch([efectivoInput, () => form.value.costo], () => {
  if (margenInput.value && document.activeElement === margenInput.value) return;
  if (!(Number(efectivoInput.value) > 0)) return;
  margenPct.value = Math.round(margen.value * 10) / 10;
}, { immediate: true });

// Producto nuevo: al cargar el costo y sin precio todavía, sugerir efectivo con el margen vigente
watch(() => form.value.costo, (costo) => {
  if (props.producto || !(Number(costo) > 0) || Number(efectivoInput.value) > 0) return;
  const p = Number(margenPct.value);
  const pct = Number.isFinite(p) && p >= 0 && p < 95 ? p : MARGEN_DEFAULT;
  efectivoInput.value = Math.round(Number(costo) / (1 - pct / 100));
});

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
    extras.value = [...new Set(((p as { categorias?: string[] | null }).categorias ?? []).filter((c) => c && c !== (p.categoria || '')))];
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
  grupoPicker?.setValue(form.value.grupo_id);
  // Alta de variante desde la lista: autocompletar datos del grupo
  if (!props.producto && form.value.grupo_id) aplicarGrupo();
}

// ---------- Categorías secundarias (la principal va en form.categoria) ----------
const extras = ref<string[]>([...new Set((props.producto?.categorias ?? []).filter((c) => c && c !== props.producto?.categoria))]);

const secundariasDisponibles = computed(() =>
  categorias.value.map((c) => c.nombre).filter((n) => n && n !== form.value.categoria)
);

function alCambiarPrincipal() {
  extras.value = extras.value.filter((c) => c !== form.value.categoria);
}

function heredarExtras(base: Producto) {
  const principal = base.categoria || '';
  extras.value = [...new Set(((base as { categorias?: string[] | null }).categorias ?? []).filter((c) => c && c !== principal))];
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
    alCambiarPrincipal();
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
  if (grupoPickerRoot.value) {
    grupoPicker = setupProductPicker(grupoPickerRoot.value, {
      items: grupoItems.value,
      value: form.value.grupo_id,
      onSelect: onGrupoSelect,
    });
  }
  watch(grupoItems, (items) => grupoPicker?.setItems(items));
  watch(() => form.value.grupo_id, (id) => {
    if (grupoPicker && grupoPicker.getValue() !== id) grupoPicker.setValue(id);
  });
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
    const principal = form.value.categoria.trim() || null;
    const lista = [...new Set([principal, ...extras.value.map((c) => c.trim())].filter(Boolean))].slice(0, 5);
    const payload = {
      ...form.value,
      grupo_id: form.value.grupo_id || null,
      imagen_url: form.value.imagen_url.trim() || null,
      categoria: principal,
      categorias: lista,
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

.pf-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
  gap: 1.25rem;
  align-items: start;
}

.pf-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.pf-aside {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  position: sticky;
  top: var(--admin-sticky-top);
}

.pf-aside .pf-precios {
  grid-template-columns: 1fr;
}

.pf-duo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.pf-grupo-pick {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.625rem;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  background: var(--admin-bg);
}

.pf-grupo-foto {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  background: white;
}

.pf-grupo-datos {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
  font-size: 0.875rem;
}

.pf-grupo-datos small {
  color: var(--admin-text-muted);
}

.pf-grupo-pick .admin-btn {
  flex-shrink: 0;
}

.pf-grupo-hint {
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  color: var(--admin-text-muted);
}

.pf-secs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 0.75rem;
  align-items: center;
  margin-top: 0.625rem;
}

.pf-secs-title {
  font-size: 0.75rem;
  color: var(--admin-text-muted);
}

.pf-sec-check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--admin-border);
  border-radius: 999px;
}

.pf-sec-check input {
  accent-color: var(--admin-primary);
  width: 16px;
  height: 16px;
}

.pf-foto-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.pf-foto-preview {
  flex: 0 0 200px;
}

.pf-foto-preview img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: white;
}

.pf-foto-actions {
  flex: 1;
  min-width: 0;
}

@media (max-width: 640px) {
  .pf-foto-row {
    flex-direction: column;
  }

  .pf-foto-preview {
    flex: none;
    width: 160px;
  }
}

@media (max-width: 900px) {
  .pf-layout {
    grid-template-columns: 1fr;
  }

  .pf-aside {
    position: static;
  }
}

@media (max-width: 640px) {
  .pf-precios {
    grid-template-columns: 1fr;
  }

  .pf-duo {
    grid-template-columns: 1fr;
  }
}
</style>
