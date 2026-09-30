<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { descargarComprobantePdf } from '@/lib/admin-pdf';
import {
  ETIQUETAS_METODO_PAGO,
  esPagoSinRecargo,
  precioEfectivo,
  RECARGO_TARJETA_DEFAULT,
} from '@/lib/precios';

type Producto = {
  producto_id: string;
  nombre: string;
  variante: string | null;
  sku: string | null;
  categoria: string | null;
  imagen_url: string | null;
  precio_venta: number;
  precio_oferta: number | null;
  es_oferta: boolean;
  recargo_tarjeta: number | null;
  stock_actual: number | null;
};

type ItemCarrito = {
  producto_id: string;
  nombre: string;
  variante: string | null;
  sku: string | null;
  imagen_url: string | null;
  recargo: number;
  precioEfectivo: number;
  precioTarjeta: number;
  cantidad: number;
  stock: number;
};

type ItemTicket = {
  nombre: string;
  variante?: string | null;
  cantidad: number;
  precio_unitario: number;
};

type Ticket = {
  id: string;
  fecha: string;
  total: number;
  metodo: string;
  estado: string;
  cliente?: string | null;
  items: ItemTicket[];
};

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MP', 'OTRO'] as const;
const BILLETES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

const productos = ref<Producto[]>([]);
const carrito = ref<ItemCarrito[]>([]);
const metodo = ref('');
const busqueda = ref('');
const barcode = ref('');
const categoria = ref('');
const clienteNombre = ref('');
const clienteTelefono = ref('');
const recibido = ref<number | null>(null);
const cerrarAlCobrar = ref(false);
const cargando = ref(true);
const procesando = ref(false);
const error = ref('');
const exito = ref('');
const editandoId = ref<string | null>(null);
const ticket = ref<Ticket | null>(null);
const barcodeRef = ref<HTMLInputElement | null>(null);
const carritoAbierto = ref(false);

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const varianteDe = (v?: string | null) => (v && v.trim() !== '' && v !== 'Única' ? ` — ${v}` : '');

function precioLista(p: Producto): number {
  const oferta = Number(p.precio_oferta);
  const venta = Number(p.precio_venta);
  return p.es_oferta && Number.isFinite(oferta) && oferta < venta ? oferta : venta;
}

function recargoDe(p: Producto): number {
  const r = Number(p.recargo_tarjeta);
  return Number.isFinite(r) ? r : RECARGO_TARJETA_DEFAULT;
}

const categorias = computed(() => {
  const set = new Set<string>();
  for (const p of productos.value) {
    const c = (p.categoria || '').trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
});

const filtrados = computed(() => {
  const q = busqueda.value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return productos.value.filter((p) => {
    if (categoria.value && (p.categoria || '') !== categoria.value) return false;
    if (!q) return true;
    const texto = `${p.nombre || ''} ${p.variante || ''} ${p.sku || ''}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return texto.includes(q);
  });
});

const esSinRecargo = computed(() => esPagoSinRecargo(metodo.value));

const totalEfectivo = computed(() => carrito.value.reduce((s, i) => s + i.precioEfectivo * i.cantidad, 0));
const totalTarjeta = computed(() => carrito.value.reduce((s, i) => s + i.precioTarjeta * i.cantidad, 0));
const total = computed(() => (esSinRecargo.value ? totalEfectivo.value : totalTarjeta.value));
const unidades = computed(() => carrito.value.reduce((s, i) => s + i.cantidad, 0));
const vuelto = computed(() => {
  if (metodo.value !== 'EFECTIVO' || recibido.value == null) return null;
  return recibido.value - total.value;
});

function aItem(p: Producto): ItemCarrito {
  return {
    producto_id: p.producto_id,
    nombre: p.nombre,
    variante: p.variante,
    sku: p.sku,
    imagen_url: p.imagen_url,
    recargo: recargoDe(p),
    precioEfectivo: precioEfectivo(precioLista(p), recargoDe(p)),
    precioTarjeta: precioLista(p),
    cantidad: 1,
    stock: Number(p.stock_actual ?? 0),
  };
}

function agregar(p: Producto, cant = 1) {
  error.value = '';
  const stock = Number(p.stock_actual ?? 0);
  if (stock <= 0) {
    error.value = `"${p.nombre}" no tiene stock.`;
    return;
  }
  const existente = carrito.value.find((i) => i.producto_id === p.producto_id);
  if (existente) {
    if (existente.cantidad + cant > stock) {
      error.value = `Solo hay ${stock} u. de "${p.nombre}".`;
      return;
    }
    existente.cantidad += cant;
  } else {
    carrito.value.push({ ...aItem(p), cantidad: cant });
  }
}

function agregarPorSku() {
  const sku = barcode.value.trim().toUpperCase();
  barcode.value = '';
  if (!sku) return;
  const p = productos.value.find((x) => (x.sku || '').trim().toUpperCase() === sku);
  if (!p) {
    error.value = `No encontramos el SKU "${sku}".`;
    return;
  }
  agregar(p);
}

function quitar(productoId: string) {
  carrito.value = carrito.value.filter((i) => i.producto_id !== productoId);
}

function cambiar(productoId: string, delta: number) {
  const item = carrito.value.find((i) => i.producto_id === productoId);
  if (!item) return;
  const nueva = item.cantidad + delta;
  if (nueva <= 0) {
    quitar(productoId);
    return;
  }
  if (nueva > item.stock) {
    error.value = `Solo hay ${item.stock} u. de "${item.nombre}".`;
    return;
  }
  item.cantidad = nueva;
}

function setCantidad(productoId: string, valor: number) {
  const item = carrito.value.find((i) => i.producto_id === productoId);
  if (!item) return;
  const n = Math.max(1, Math.min(item.stock || 1, Math.round(valor) || 1));
  item.cantidad = n;
}

function vaciar() {
  carrito.value = [];
  recibido.value = null;
  error.value = '';
  exito.value = '';
  carritoAbierto.value = false;
}

function usarBillete(monto: number) {
  recibido.value = monto;
}

async function cargarProductos() {
  try {
    const res = await fetch('/api/admin/productos', { cache: 'no-store' });
    if (res.ok) productos.value = await res.json();
  } catch {
    /* noop */
  } finally {
    cargando.value = false;
  }
}

async function cargarEdicion(id: string) {
  try {
    const res = await fetch('/api/admin/ventas', { cache: 'no-store' });
    if (!res.ok) return;
    const ventas = (await res.json()) as Array<Record<string, unknown>>;
    const venta = ventas.find((v) => v.id === id);
    if (!venta) return;
    if ((venta.source || 'MANUAL') !== 'MANUAL' || venta.estado !== 'PAGADA') {
      error.value = 'Solo se pueden editar ventas manuales pagadas.';
      return;
    }
    editandoId.value = id;
    metodo.value = String(venta.metodo_pago || '');
    clienteNombre.value = String(venta.cliente_nombre || '');
    clienteTelefono.value = String(venta.cliente_telefono || '');
    const items = (venta.ventas_items as Array<Record<string, unknown>>) || [];
    carrito.value = items.map((it) => {
      const pid = String(it.producto_id);
      const p = productos.value.find((x) => x.producto_id === pid);
      if (p) return { ...aItem(p), cantidad: Number(it.cantidad) || 1 };
      return {
        producto_id: pid,
        nombre: String((it.productos as Record<string, unknown>)?.nombre || 'Producto'),
        variante: null,
        sku: null,
        imagen_url: null,
        recargo: RECARGO_TARJETA_DEFAULT,
        precioEfectivo: Number(it.precio_unitario) || 0,
        precioTarjeta: Number(it.precio_unitario) || 0,
        cantidad: Number(it.cantidad) || 1,
        stock: Number(it.cantidad) || 1,
      };
    });
  } catch {
    /* noop */
  }
}

async function cobrar() {
  error.value = '';
  exito.value = '';
  if (!metodo.value) {
    error.value = 'Elegí el medio de pago.';
    return;
  }
  if (!carrito.value.length) {
    error.value = 'Agregá al menos un producto.';
    return;
  }
  if (metodo.value === 'EFECTIVO' && (recibido.value == null || recibido.value < total.value)) {
    error.value = 'El monto recibido es menor al total.';
    return;
  }

  procesando.value = true;
  try {
    const items = carrito.value.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad }));
    const esEdicion = Boolean(editandoId.value);
    const url = esEdicion ? `/api/admin/ventas/${editandoId.value}` : '/api/admin/ventas';
    const body = esEdicion
      ? { accion: 'editar', items, metodo_pago: metodo.value }
      : {
          items,
          metodo_pago: metodo.value,
          cliente_nombre: clienteNombre.value.trim() || null,
          cliente_telefono: clienteTelefono.value.trim() || null,
        };

    const res = await fetch(url, {
      method: esEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.value = typeof data.error === 'string' ? data.error : 'No se pudo registrar la venta.';
      return;
    }

    const ventaId = String(data.id || editandoId.value);
    let estadoFinal = String(data.estado || 'PAGADA');

    if (!esEdicion && cerrarAlCobrar.value) {
      const resCierre = await fetch(`/api/admin/ventas/${ventaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'completar' }),
      });
      if (resCierre.ok) estadoFinal = 'COMPLETADA';
    }

    const itemsTicket: ItemTicket[] = (
      (data.items as Array<Record<string, unknown>>) ||
      carrito.value.map((i) => ({
        nombre: i.nombre,
        variante: i.variante,
        cantidad: i.cantidad,
        precio: esSinRecargo.value ? i.precioEfectivo : i.precioTarjeta,
      }))
    ).map((i) => ({
      nombre: String(i.nombre || ''),
      variante: (i.variante as string) || null,
      cantidad: Number(i.cantidad) || 0,
      precio_unitario: Number(i.precio ?? i.precio_unitario) || 0,
    }));

    exito.value = esEdicion ? 'Venta actualizada.' : `Venta registrada: ${fmt$(Number(data.total))}.`;
    ticket.value = {
      id: ventaId,
      fecha: String(data.fecha || new Date().toISOString()),
      total: Number(data.total) || total.value,
      metodo: metodo.value,
      estado: estadoFinal,
      cliente: clienteNombre.value.trim() || null,
      items: itemsTicket,
    };
    vaciar();
    editandoId.value = null;
    metodo.value = '';
    cerrarAlCobrar.value = false;
    await cargarProductos();
    abrirImpresion();
  } catch {
    error.value = 'Error de conexión.';
  } finally {
    procesando.value = false;
  }
}

function cerrarTicket() {
  ticket.value = null;
}

function imprimir() {
  window.print();
}

function descargarPdf() {
  if (!ticket.value) return;
  descargarComprobantePdf({
    id: ticket.value.id,
    fecha: ticket.value.fecha,
    total: ticket.value.total,
    titulo: 'Nota de venta',
    datos: [
      ['Medio de pago', ETIQUETAS_METODO_PAGO[ticket.value.metodo] || ticket.value.metodo],
      ['Estado', ticket.value.estado === 'COMPLETADA' ? 'Completada' : 'Pagada'],
      ...(ticket.value.cliente ? ([['Cliente', ticket.value.cliente]] as [string, string][]) : []),
    ],
    items: ticket.value.items,
  });
}

function abrirImpresion() {
  window.setTimeout(() => {
    try {
      window.print();
    } catch {
      /* impresión bloqueada */
    }
  }, 250);
}

onMounted(async () => {
  await cargarProductos();
  const editar = new URLSearchParams(window.location.search).get('editar');
  if (editar) await cargarEdicion(editar);
  barcodeRef.value?.focus();
});
</script>

<template>
  <div class="pos">
    <div class="pos-catalogo">
      <div class="pos-toolbar">
        <input
          ref="barcodeRef"
          v-model="barcode"
          type="text"
          class="admin-input pos-barcode"
          placeholder="Escaneá o escribí el SKU y Enter…"
          aria-label="Código de barras o SKU"
          autocomplete="off"
          @keydown.enter.prevent="agregarPorSku"
        />
        <input
          v-model="busqueda"
          type="search"
          class="admin-input pos-buscar"
          placeholder="Buscar por nombre, aroma o SKU…"
          aria-label="Buscar productos"
          autocomplete="off"
        />
      </div>

      <div class="pos-tabs" role="tablist" aria-label="Categorías">
        <button
          type="button"
          class="pos-tab"
          :class="{ 'is-active': !categoria }"
          role="tab"
          :aria-selected="!categoria"
          @click="categoria = ''"
        >
          Todos
        </button>
        <button
          v-for="c in categorias"
          :key="c"
          type="button"
          class="pos-tab"
          :class="{ 'is-active': categoria === c }"
          role="tab"
          :aria-selected="categoria === c"
          @click="categoria = c"
        >
          {{ c }}
        </button>
      </div>

      <p v-if="cargando" class="pos-vacio">Cargando productos…</p>
      <p v-else-if="!filtrados.length" class="pos-vacio">No hay productos que coincidan.</p>
      <div v-else class="pos-grid">
        <button
          v-for="p in filtrados"
          :key="p.producto_id"
          type="button"
          class="pos-card"
          :disabled="Number(p.stock_actual ?? 0) <= 0"
          @click="agregar(p)"
        >
          <span class="pos-card-img">
            <img v-if="p.imagen_url" :src="p.imagen_url" :alt="p.nombre" loading="lazy" />
            <span v-else class="pos-card-ph" aria-hidden="true">{{ (p.nombre || '?').charAt(0) }}</span>
            <span v-if="Number(p.stock_actual ?? 0) <= 0" class="pos-card-out">SIN STOCK</span>
          </span>
          <span class="pos-card-body">
            <span class="pos-card-name">{{ p.nombre }}{{ varianteDe(p.variante) }}</span>
            <span class="pos-card-price">{{ fmt$(precioEfectivo(precioLista(p), recargoDe(p))) }}</span>
            <span class="pos-card-stock">Stock {{ Number(p.stock_actual ?? 0) }}</span>
          </span>
        </button>
      </div>
    </div>

    <aside class="pos-carrito" :class="{ 'is-open': carritoAbierto }" aria-label="Venta en curso">
      <div class="pos-carrito-head">
        <span class="pos-handle" aria-hidden="true"></span>
        <h2>Venta{{ editandoId ? ` #${editandoId.slice(0, 8)}` : '' }}</h2>
        <span v-if="unidades" class="pos-count">{{ unidades }}</span>
        <button type="button" class="pos-close" aria-label="Cerrar venta en curso" @click="carritoAbierto = false">×</button>
      </div>

      <div class="pos-items">
        <p v-if="!carrito.length" class="pos-vacio">Tocá productos para agregarlos.</p>
        <div v-for="i in carrito" :key="i.producto_id" class="pos-item">
          <div class="pos-item-info">
            <span class="pos-item-name">{{ i.nombre }}{{ varianteDe(i.variante) }}</span>
            <span class="pos-item-unit">
              {{ fmt$(esSinRecargo ? i.precioEfectivo : i.precioTarjeta) }} c/u
            </span>
          </div>
          <div class="pos-item-qty">
            <button type="button" aria-label="Restar" @click="cambiar(i.producto_id, -1)">−</button>
            <input
              type="number"
              min="1"
              :value="i.cantidad"
              :max="i.stock"
              aria-label="Cantidad"
              @change="setCantidad(i.producto_id, Number(($event.target as HTMLInputElement).value))"
            />
            <button type="button" aria-label="Sumar" @click="cambiar(i.producto_id, 1)">+</button>
          </div>
          <div class="pos-item-right">
            <span class="pos-item-sub">{{ fmt$((esSinRecargo ? i.precioEfectivo : i.precioTarjeta) * i.cantidad) }}</span>
            <button type="button" class="pos-item-del" aria-label="Quitar" @click="quitar(i.producto_id)">×</button>
          </div>
        </div>
      </div>

      <div class="pos-pago">
        <div class="admin-form-group">
          <label class="admin-form-label" for="pos-metodo">Medio de pago</label>
          <select id="pos-metodo" v-model="metodo" class="admin-input">
            <option value="">— Elegí —</option>
            <option v-for="m in METODOS" :key="m" :value="m">{{ ETIQUETAS_METODO_PAGO[m] || m }}</option>
          </select>
        </div>

        <div class="pos-cliente">
          <input v-model="clienteNombre" type="text" class="admin-input" placeholder="Cliente (opcional)" aria-label="Nombre del cliente" maxlength="255" />
          <input v-model="clienteTelefono" type="tel" class="admin-input" placeholder="Teléfono (opcional)" aria-label="Teléfono del cliente" maxlength="50" />
        </div>

        <div v-if="metodo === 'EFECTIVO'" class="pos-efectivo">
          <label class="admin-form-label" for="pos-recibido">Recibido</label>
          <input id="pos-recibido" v-model.number="recibido" type="number" min="0" step="100" class="admin-input" placeholder="0" />
          <div class="pos-billetes">
            <button v-for="b in BILLETES" :key="b" type="button" class="pos-billete" @click="usarBillete(b)">
              {{ fmt$(b) }}
            </button>
          </div>
          <p v-if="vuelto != null" class="pos-vuelto" :class="{ 'is-neg': vuelto < 0 }">
            Vuelto: <strong>{{ fmt$(vuelto) }}</strong>
          </p>
        </div>

        <div class="pos-totales">
          <div v-if="!esSinRecargo && metodo" class="pos-total-row">
            <span>Total tarjeta</span><strong>{{ fmt$(totalTarjeta) }}</strong>
          </div>
          <div class="pos-total-row pos-total-final">
            <span>Total</span><strong>{{ fmt$(total) }}</strong>
          </div>
          <p v-if="esSinRecargo && metodo && totalTarjeta !== total" class="pos-total-note">
            Tarjeta: <s>{{ fmt$(totalTarjeta) }}</s>
          </p>
        </div>

        <label class="pos-check">
          <input v-model="cerrarAlCobrar" type="checkbox" />
          Cerrar la venta al cobrar (COMPLETADA)
        </label>

        <div v-if="error" class="admin-alert admin-alert-error" role="alert">{{ error }}</div>
        <div v-if="exito" class="admin-alert admin-alert-success" role="status">{{ exito }}</div>

        <div class="pos-acciones">
          <button type="button" class="admin-btn admin-btn-ghost" :disabled="!carrito.length || procesando" @click="vaciar">
            Vaciar
          </button>
          <button type="button" class="admin-btn admin-btn-success pos-cobrar" :disabled="procesando || !carrito.length" @click="cobrar">
            {{ procesando ? 'Procesando…' : (editandoId ? 'Guardar cambios' : 'Cobrar') }}
          </button>
        </div>
      </div>
    </aside>

    <div class="pos-overlay" :class="{ 'is-open': carritoAbierto }" @click="carritoAbierto = false"></div>

    <div class="pos-bar">
      <div class="pos-bar-info">
        <span>{{ unidades }} {{ unidades === 1 ? 'ítem' : 'ítems' }}</span>
        <strong>{{ fmt$(total) }}</strong>
      </div>
      <button
        type="button"
        class="admin-btn admin-btn-success"
        :disabled="!carrito.length"
        @click="carritoAbierto = true"
      >
        Ver venta
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="ticket" class="ticket-root">
      <div class="ticket-overlay" @click.self="cerrarTicket">
        <div class="ticket-card">
          <div class="remito">
            <div class="rm-head">
              <div>
                <p class="rm-logo">DOMUS</p>
                <p class="rm-sub">domus.com.ar</p>
              </div>
              <div class="rm-doc">
                <p class="rm-doctitle">NOTA DE VENTA</p>
                <p class="rm-num">#{{ ticket.id.slice(0, 8) }}</p>
                <p class="rm-fecha">{{ new Date(ticket.fecha).toLocaleString('es-AR') }}</p>
              </div>
            </div>
            <div class="rm-grid">
              <div><span>Medio de pago</span><strong>{{ ETIQUETAS_METODO_PAGO[ticket.metodo] || ticket.metodo }}</strong></div>
              <div><span>Estado</span><strong>{{ ticket.estado === 'COMPLETADA' ? 'Completada' : 'Pagada' }}</strong></div>
              <div v-if="ticket.cliente"><span>Cliente</span><strong>{{ ticket.cliente }}</strong></div>
            </div>
            <table class="rm-table">
              <thead><tr><th>Cant.</th><th>Detalle</th><th class="text-right">P. unit.</th><th class="text-right">Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="(i, idx) in ticket.items" :key="idx">
                  <td class="text-center">{{ i.cantidad }}</td>
                  <td>{{ i.nombre }}{{ varianteDe(i.variante) }}</td>
                  <td class="text-right">{{ fmt$(i.precio_unitario) }}</td>
                  <td class="text-right">{{ fmt$(i.precio_unitario * i.cantidad) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="rm-total"><span>TOTAL</span><strong>{{ fmt$(ticket.total) }}</strong></div>
            <p class="rm-foot">Gracias por tu compra · todo lo que hace de un lugar, hogar.</p>
          </div>
          <div class="ticket-actions no-print">
            <button class="admin-btn admin-btn-primary" type="button" @click="imprimir">Imprimir</button>
            <button class="admin-btn admin-btn-success" type="button" @click="descargarPdf">Descargar PDF</button>
            <button class="admin-btn admin-btn-ghost" type="button" @click="cerrarTicket">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 1rem;
  align-items: start;
  overflow-x: hidden;
}

.pos-overlay,
.pos-bar {
  display: none;
}

.pos-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.pos-barcode { flex: 0 0 40%; }
.pos-buscar { flex: 1 1 auto; }

.pos-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.pos-tab {
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--admin-border);
  border-radius: 999px;
  background: #fff;
  color: var(--admin-text);
  cursor: pointer;
  white-space: nowrap;
}

.pos-tab.is-active {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  color: #fff;
}

.pos-vacio {
  color: var(--admin-text-muted);
  font-size: 0.875rem;
  padding: 1rem 0;
}

.pos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.pos-card {
  font: inherit;
  text-align: left;
  padding: 0;
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.pos-card:hover:not(:disabled) {
  border-color: var(--admin-primary);
  box-shadow: 0 6px 18px rgba(61, 43, 31, 0.12);
  transform: translateY(-2px);
}

.pos-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pos-card:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}

.pos-card-img {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--admin-bg, #f7fafc);
  display: block;
  overflow: hidden;
  flex-shrink: 0;
}

.pos-card-img img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pos-card-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--admin-primary);
}

.pos-card-out {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  background: #4a5568;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.pos-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.625rem 0.625rem;
}

.pos-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--admin-text);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pos-card-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--admin-text);
}

.pos-card-stock {
  font-size: 0.6875rem;
  color: var(--admin-text-muted);
}

/* Carrito */
.pos-carrito {
  position: sticky;
  top: var(--admin-sticky-top);
  background: #fff;
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - var(--admin-sticky-top) - 1rem);
}

.pos-carrito-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--admin-border);
}

.pos-handle,
.pos-close {
  display: none;
}

.pos-carrito-head h2 {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1rem;
}

.pos-count {
  background: var(--admin-primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.4rem;
}

.pos-items {
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
  flex: 1;
  min-height: 80px;
}

.pos-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--admin-border);
}

.pos-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pos-item-name {
  font-size: 0.8125rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.pos-item-unit {
  font-size: 0.6875rem;
  color: var(--admin-text-muted);
}

.pos-item-qty {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pos-item-qty button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 1.15rem;
  line-height: 1;
}

.pos-item-qty input {
  width: 52px;
  height: 40px;
  text-align: center;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  font: inherit;
  appearance: textfield;
  -moz-appearance: textfield;
}

.pos-item-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pos-item-sub {
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

.pos-item-del {
  border: none;
  background: none;
  color: var(--admin-text-muted);
  font-size: 1.35rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.pos-item-del:hover {
  color: var(--admin-danger, #e53e3e);
}

.pos-pago {
  border-top: 1px solid var(--admin-border);
  padding: 0.875rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pos-cliente {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pos-cliente .admin-input {
  flex: 1 1 8rem;
  width: auto;
  min-width: 0;
}

.pos-efectivo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pos-billetes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pos-billete {
  font: inherit;
  font-size: 0.8125rem;
  min-height: 40px;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.pos-billete:hover {
  border-color: var(--admin-primary);
  color: var(--admin-primary);
}

.pos-vuelto {
  margin: 0;
  font-size: 0.9375rem;
  color: #22543d;
}

.pos-vuelto.is-neg {
  color: #742a2a;
}

.pos-totales {
  border-top: 1px dashed var(--admin-border);
  padding-top: 0.6rem;
}

.pos-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--admin-text-muted);
}

.pos-total-final {
  font-size: 1.25rem;
  color: var(--admin-text);
  font-weight: 700;
}

.pos-total-note {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--admin-text-muted);
}

.pos-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
}

.pos-check input {
  width: 16px;
  height: 16px;
}

.pos-acciones {
  display: flex;
  gap: 0.5rem;
}

.pos-cobrar {
  flex: 1;
}

@media (max-width: 900px) {
  /* App-like: la grilla de productos scrollea sola; toolbar, tabs y barra inferior quedan fijos */
  .pos {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    height: calc(100vh - var(--admin-topbar-h) - 6.5rem);
    height: calc(100dvh - var(--admin-topbar-h) - 6.5rem);
    padding-bottom: 0;
  }

  .pos-catalogo {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    width: 100%;
    min-width: 0;
  }

  .pos-toolbar {
    flex-direction: column;
    flex-shrink: 0;
  }

  .pos-barcode,
  .pos-buscar {
    flex: 1 1 auto;
  }

  .pos-tabs {
    flex-shrink: 0;
  }

  .pos-grid {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: max-content;
    gap: 0.875rem;
    align-content: start;
  }

  /* Tarjetas con el mismo look que /tienda en mobile */
  .pos-card-img {
    aspect-ratio: 4 / 3;
  }

  .pos-card-body {
    padding: 0.75rem 0.75rem 0.875rem;
    gap: 0.2rem;
  }

  .pos-card-name {
    font-size: 0.9rem;
  }

  .pos-card-price {
    font-size: 1.15rem;
  }

  .pos-card-stock {
    font-size: 0.6875rem;
  }

  /* Barra inferior fija */
  .pos-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 190;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem calc(0.6rem + env(safe-area-inset-bottom));
    background: var(--admin-card-bg);
    border-top: 1px solid var(--admin-border);
    box-shadow: 0 -6px 20px rgb(0 0 0 / 0.08);
  }

  .pos-bar-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .pos-bar-info span {
    font-size: 0.75rem;
    color: var(--admin-text-muted);
  }

  .pos-bar-info strong {
    font-size: 1.125rem;
  }

  .pos-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 195;
    background: rgb(0 0 0 / 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .pos-overlay.is-open {
    opacity: 1;
    pointer-events: auto;
  }

  /* Carrito como hoja inferior */
  .pos-carrito {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    z-index: 200;
    max-height: 88dvh;
    border: none;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -12px 40px rgb(0 0 0 / 0.25);
    transform: translateY(105%);
    transition: transform 0.25s ease;
    overflow: hidden;
  }

  .pos-carrito.is-open {
    transform: translateY(0);
  }

  .pos-handle {
    display: block;
    position: absolute;
    top: 0.45rem;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    border-radius: 999px;
    background: var(--admin-border);
  }

  .pos-carrito-head {
    padding-top: 1.35rem;
  }

  .pos-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border: none;
    background: none;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--admin-text-muted);
    cursor: pointer;
  }

  .pos-item-qty button {
    width: 44px;
    height: 44px;
  }

  .pos-item-qty input {
    width: 56px;
    height: 44px;
  }

  .pos-item-del {
    width: 44px;
    height: 44px;
  }

  .pos-billete {
    min-height: 44px;
  }

  .pos-acciones {
    position: sticky;
    bottom: 0;
    padding-top: 0.5rem;
    background: #fff;
  }

  .pos-cobrar {
    width: 100%;
  }
}
</style>
