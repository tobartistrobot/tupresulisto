import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { verifyApiKey } from '@/lib/apiKeys';
import { calcPrice } from '@/utils/pricingEngine';
import {
    loadProducts, loadIva, loadHistory, deriveClients,
    appendQuote, generateQuoteNumber, todayEs,
} from '@/lib/agentData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Servidor MCP de TuPresuListo (fase 1) — https://www.tupresulisto.com/api/mcp
 *
 * Permite que un agente de IA trabaje sobre la cuenta del dueño de la clave
 * como un oficinista: consultar catálogo, clientes e historial, y CREAR
 * presupuestos calculados con el motor de precios real (tarifas, extras,
 * margen e IVA del usuario). El envío al cliente final queda en manos del
 * humano desde la app: el agente prepara, el usuario aprueba.
 *
 * Autenticación: Bearer con clave de API (`tpl_...`) creada en Configuración →
 * Agentes y API. Cada clave da acceso únicamente a los datos de su cuenta.
 * La ruta vive en /api/[transport] porque mcp-handler deriva el endpoint
 * /api/mcp de ese segmento; las rutas estáticas de /api/* tienen prioridad,
 * así que no interfiere con el resto de la API. SSE queda desactivado: solo
 * streamable HTTP (JSON), sin estado y sin Redis.
 */

/** Quita acentos y baja a minúsculas para comparar nombres con tolerancia. */
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Respuesta correcta: JSON legible para el agente. */
const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

/** Error accionable: el texto debe decirle al agente qué hacer a continuación. */
const fail = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

/** uid del dueño de la clave, inyectado por withMcpAuth. */
const uidFrom = (extra) => extra?.authInfo?.extra?.uid ?? null;

/**
 * Busca un producto por id exacto o por nombre (exacto y, si no, por
 * subcadena única). Devuelve { product } o { error } con alternativas.
 */
function resolveProduct(products, ref) {
    const byId = products.find(p => String(p.id) === String(ref));
    if (byId) return { product: byId };

    const wanted = norm(ref);
    const exact = products.filter(p => norm(p.name) === wanted);
    if (exact.length === 1) return { product: exact[0] };

    const partial = products.filter(p => norm(p.name).includes(wanted));
    if (partial.length === 1) return { product: partial[0] };

    const nombres = (partial.length > 1 ? partial : products).map(p => p.name).slice(0, 15);
    return {
        error: partial.length > 1
            ? `"${ref}" coincide con varios productos: ${nombres.join(' | ')}. Usa el nombre completo o el id de listar_productos.`
            : `No existe el producto "${ref}". Productos disponibles: ${nombres.join(' | ')}. Usa listar_productos para ver el catálogo completo.`,
    };
}

/** Vista de un producto para el agente: sin imagen (base64 enorme) ni margen interno. */
function productView(p) {
    const view = {
        id: p.id,
        nombre: p.name,
        categoria: p.category || null,
        tipoCalculo: p.priceType, // matrix | unit | simple_area | simple_linear
    };
    if (p.priceType === 'matrix' && p.matrix) {
        view.medidasMaximasMm = {
            ancho: p.matrix.widths?.[p.matrix.widths.length - 1] ?? null,
            alto: p.matrix.heights?.[p.matrix.heights.length - 1] ?? null,
        };
    } else {
        view.precioUnitario = p.unitPrice ?? null;
    }
    if (Array.isArray(p.extras) && p.extras.length > 0) {
        view.extras = p.extras.map(e => e.optionsList
            ? {
                id: e.id, nombre: e.name, desplegable: true,
                opciones: e.optionsList.map((o, i) => ({ indice: i, nombre: o.name, tipo: o.type, valor: o.value })),
            }
            : { id: e.id, nombre: e.name, tipo: e.type, valor: e.value });
    }
    return view;
}

const handler = createMcpHandler(
    (server) => {
        server.registerTool(
            'listar_productos',
            {
                title: 'Listar productos del catálogo',
                description:
                    'Devuelve el catálogo de productos del usuario con su tipo de cálculo (matrix = tabla ancho × alto, unit = por unidad, simple_area = por m², simple_linear = por metro lineal), límites de medidas en mm y extras disponibles (fijos o desplegables con opciones). Úsalo antes de crear_presupuesto para conocer ids, nombres y extras exactos.',
                inputSchema: {},
                annotations: { readOnlyHint: true },
            },
            async (_args, extra) => {
                const uid = uidFrom(extra);
                if (!uid) return fail('Clave de API no válida.');
                const products = await loadProducts(uid);
                if (products.length === 0) return fail('El catálogo está vacío. El usuario debe crear productos en la app antes de poder presupuestar.');
                return ok({ unidadMedidas: 'mm', productos: products.map(productView) });
            }
        );

        server.registerTool(
            'listar_clientes',
            {
                title: 'Listar clientes',
                description:
                    'Devuelve la cartera de clientes (derivada del historial de presupuestos, únicos por teléfono) con número de presupuestos y volumen total. Útil para reutilizar los datos de contacto de un cliente existente en crear_presupuesto.',
                inputSchema: {
                    busqueda: z.string().optional().describe('Filtro por nombre o teléfono (subcadena, sin distinguir mayúsculas ni acentos)'),
                },
                annotations: { readOnlyHint: true },
            },
            async ({ busqueda }, extra) => {
                const uid = uidFrom(extra);
                if (!uid) return fail('Clave de API no válida.');
                const history = await loadHistory(uid);
                let clientes = deriveClients(history);
                if (busqueda) {
                    const q = norm(busqueda);
                    clientes = clientes.filter(c => norm(c.name).includes(q) || String(c.phone).includes(busqueda.trim()));
                }
                return ok({
                    total: clientes.length,
                    clientes: clientes.map(c => ({
                        nombre: c.name, telefono: c.phone, email: c.email || null,
                        direccion: c.address || null, ciudad: c.city || null,
                        presupuestos: c.presupuestos, volumenTotal: Math.round(c.volumenTotal * 100) / 100,
                    })),
                });
            }
        );

        server.registerTool(
            'listar_presupuestos',
            {
                title: 'Listar presupuestos',
                description: 'Devuelve el historial de presupuestos, del más reciente al más antiguo, con número, fecha, cliente, estado y total. Para el detalle de uno concreto usa consultar_presupuesto.',
                inputSchema: {
                    limite: z.number().int().min(1).max(100).default(20).describe('Máximo de presupuestos a devolver'),
                    estado: z.string().optional().describe("Filtro por estado, p. ej. 'pending'"),
                    cliente: z.string().optional().describe('Filtro por nombre o teléfono del cliente'),
                },
                annotations: { readOnlyHint: true },
            },
            async ({ limite, estado, cliente }, extra) => {
                const uid = uidFrom(extra);
                if (!uid) return fail('Clave de API no válida.');
                let history = await loadHistory(uid);
                if (estado) history = history.filter(q => q.status === estado);
                if (cliente) {
                    const q = norm(cliente);
                    history = history.filter(x => norm(x.client?.name).includes(q) || String(x.client?.phone || '').includes(cliente.trim()));
                }
                history.sort((a, b) => (b.id || 0) - (a.id || 0));
                return ok({
                    total: history.length,
                    presupuestos: history.slice(0, limite).map(x => ({
                        id: x.id, numero: x.number, fecha: x.date, estado: x.status,
                        cliente: x.client?.name || null, telefono: x.client?.phone || null,
                        total: x.grandTotal ?? null, numLineas: x.items?.length ?? 0,
                    })),
                });
            }
        );

        server.registerTool(
            'consultar_presupuesto',
            {
                title: 'Consultar un presupuesto',
                description: 'Devuelve el detalle completo de un presupuesto: cliente, líneas con medidas y extras, descuento, entrega a cuenta y total. Identifícalo por id o por numero (uno de los dos).',
                inputSchema: {
                    id: z.number().optional().describe('Id interno del presupuesto (de listar_presupuestos)'),
                    numero: z.string().optional().describe("Número visible del presupuesto, p. ej. '2026-3137'"),
                },
                annotations: { readOnlyHint: true },
            },
            async ({ id, numero }, extra) => {
                const uid = uidFrom(extra);
                if (!uid) return fail('Clave de API no válida.');
                if (id === undefined && !numero) return fail('Indica id o numero. Puedes obtenerlos con listar_presupuestos.');
                const history = await loadHistory(uid);
                const quote = history.find(x => (id !== undefined && x.id === id) || (numero && x.number === numero));
                if (!quote) return fail(`No se encontró el presupuesto ${numero || id}. Comprueba el listado con listar_presupuestos.`);

                return ok({
                    id: quote.id, numero: quote.number, fecha: quote.date, estado: quote.status,
                    cliente: quote.client,
                    lineas: (quote.items || []).map(it => ({
                        producto: it.product?.name || null,
                        anchoMm: it.width, altoMm: it.height, cantidad: it.quantity,
                        ubicacion: it.locationLabel || null,
                        extras: (it.selectedExtras || []).map(e => ({ nombre: e.name, cantidad: e.qty })),
                        opciones: Object.entries(it.dropdownSelections || {}).map(([extraId, optIdx]) => {
                            const def = it.product?.extras?.find(e => String(e.id) === String(extraId));
                            return { extra: def?.name || extraId, opcion: def?.optionsList?.[parseInt(optIdx)]?.name ?? optIdx };
                        }),
                        precio: it.price,
                    })),
                    descuentoPorcentaje: quote.financials?.discountPercent ?? 0,
                    entregaACuenta: quote.financials?.deposit ?? 0,
                    total: quote.grandTotal ?? null,
                });
            }
        );

        server.registerTool(
            'crear_presupuesto',
            {
                title: 'Crear un presupuesto',
                description:
                    'Crea un presupuesto calculado con las tarifas, extras, margen e IVA reales del usuario, y lo guarda como pendiente en su historial. El envío al cliente final lo hace el usuario desde la app tras revisarlo. Consulta antes listar_productos para usar los nombres/ids y extras exactos. Las medidas van en milímetros.',
                inputSchema: {
                    cliente: z.object({
                        nombre: z.string().min(1).describe('Nombre del cliente (obligatorio)'),
                        telefono: z.string().optional(),
                        email: z.string().optional(),
                        direccion: z.string().optional(),
                        ciudad: z.string().optional(),
                    }),
                    lineas: z.array(z.object({
                        producto: z.string().describe('Nombre o id del producto del catálogo'),
                        ancho: z.number().positive().optional().describe('Ancho en mm (obligatorio salvo productos por unidad)'),
                        alto: z.number().positive().optional().describe('Alto en mm (obligatorio salvo productos por unidad)'),
                        cantidad: z.number().int().min(1).default(1),
                        ubicacion: z.string().optional().describe("Etiqueta de ubicación, p. ej. 'Salón' o 'Baño planta 1'"),
                        extras: z.array(z.object({
                            extra: z.string().describe('Nombre o id del extra (no desplegable)'),
                            cantidad: z.number().int().min(1).default(1),
                        })).optional(),
                        opciones: z.array(z.object({
                            extra: z.string().describe('Nombre o id del extra desplegable'),
                            opcion: z.string().describe('Nombre de la opción o su índice'),
                        })).optional(),
                    })).min(1),
                    descuentoPorcentaje: z.number().min(0).max(100).default(0),
                    entregaACuenta: z.number().min(0).default(0),
                },
                annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
            },
            async ({ cliente, lineas, descuentoPorcentaje, entregaACuenta }, extra) => {
                const uid = uidFrom(extra);
                if (!uid) return fail('Clave de API no válida.');

                const [products, iva, history] = await Promise.all([
                    loadProducts(uid), loadIva(uid), loadHistory(uid),
                ]);
                if (products.length === 0) return fail('El catálogo está vacío: no hay productos con los que presupuestar.');

                const items = [];
                for (let i = 0; i < lineas.length; i++) {
                    const linea = lineas[i];
                    const res = resolveProduct(products, linea.producto);
                    if (res.error) return fail(`Línea ${i + 1}: ${res.error}`);
                    const product = res.product;

                    const needsDims = product.priceType !== 'unit';
                    if (needsDims && (!linea.ancho || !linea.alto)) {
                        return fail(`Línea ${i + 1}: "${product.name}" se calcula por medidas y faltan ancho y/o alto (en mm).`);
                    }
                    const w = linea.ancho ?? 1000;
                    const h = linea.alto ?? 1000;
                    const q = linea.cantidad ?? 1;

                    // Extras sueltos (no desplegables)
                    const selectedExtras = [];
                    for (const sel of linea.extras || []) {
                        const def = (product.extras || []).find(e =>
                            String(e.id) === String(sel.extra) || norm(e.name) === norm(sel.extra));
                        if (!def) {
                            const disponibles = (product.extras || []).map(e => e.name).join(' | ') || 'ninguno';
                            return fail(`Línea ${i + 1}: el extra "${sel.extra}" no existe en "${product.name}". Extras disponibles: ${disponibles}.`);
                        }
                        if (def.optionsList) {
                            return fail(`Línea ${i + 1}: "${def.name}" es un desplegable; selecciónalo con "opciones" indicando la opción elegida.`);
                        }
                        selectedExtras.push({ ...def, qty: sel.cantidad ?? 1 });
                    }

                    // Desplegables → dropdownSelections { [extraId]: índice }
                    const dropdownSelections = {};
                    for (const sel of linea.opciones || []) {
                        const def = (product.extras || []).find(e =>
                            (String(e.id) === String(sel.extra) || norm(e.name) === norm(sel.extra)) && e.optionsList);
                        if (!def) {
                            const desplegables = (product.extras || []).filter(e => e.optionsList).map(e => e.name).join(' | ') || 'ninguno';
                            return fail(`Línea ${i + 1}: el desplegable "${sel.extra}" no existe en "${product.name}". Desplegables disponibles: ${desplegables}.`);
                        }
                        let idx = /^\d+$/.test(sel.opcion.trim()) ? parseInt(sel.opcion.trim()) : def.optionsList.findIndex(o => norm(o.name) === norm(sel.opcion));
                        if (idx < 0 || idx >= def.optionsList.length) {
                            return fail(`Línea ${i + 1}: la opción "${sel.opcion}" no existe en "${def.name}". Opciones: ${def.optionsList.map((o, j) => `${j}=${o.name}`).join(' | ')}.`);
                        }
                        dropdownSelections[def.id] = String(idx);
                    }

                    const { price, error } = calcPrice(product, w, h, q, selectedExtras, dropdownSelections);
                    if (error) {
                        const limites = product.priceType === 'matrix' && product.matrix
                            ? ` Máximos de tarifa: ${product.matrix.widths?.at(-1)} × ${product.matrix.heights?.at(-1)} mm.`
                            : '';
                        return fail(`Línea ${i + 1} ("${product.name}", ${w}×${h} mm): ${error}${limites}`);
                    }

                    items.push({
                        id: Date.now() + i,
                        product,
                        width: w, height: h, quantity: q,
                        locationLabel: linea.ubicacion || '',
                        selectedExtras,
                        dropdownSelections,
                        price,
                        unitPriceCalc: price / q,
                    });
                }

                // Totales con la misma aritmética que la app (useQuoteLogic)
                const grossTotal = items.reduce((s, it) => s + it.price, 0);
                const discountAmount = grossTotal * (descuentoPorcentaje / 100);
                const netTotal = grossTotal - discountAmount;
                const grandTotal = netTotal * (1 + iva / 100);

                const quote = {
                    id: Date.now(),
                    number: generateQuoteNumber(history),
                    date: todayEs(),
                    status: 'pending',
                    client: {
                        name: cliente.nombre,
                        phone: cliente.telefono || '',
                        email: cliente.email || '',
                        address: cliente.direccion || '',
                        city: cliente.ciudad || '',
                        source: 'agente',
                    },
                    financials: { discountPercent: descuentoPorcentaje, deposit: entregaACuenta },
                    items,
                    grandTotal,
                };

                await appendQuote(uid, quote);

                return ok({
                    creado: true,
                    numero: quote.number,
                    id: quote.id,
                    fecha: quote.date,
                    cliente: quote.client.name,
                    lineas: items.map(it => ({ producto: it.product.name, medidas: `${it.width}×${it.height} mm`, cantidad: it.quantity, precio: it.price })),
                    totales: {
                        bruto: Math.round(grossTotal * 100) / 100,
                        descuento: Math.round(discountAmount * 100) / 100,
                        neto: Math.round(netTotal * 100) / 100,
                        ivaPorcentaje: iva,
                        total: Math.round(grandTotal * 100) / 100,
                    },
                    nota: 'Guardado como PENDIENTE en el historial. El usuario debe revisarlo y enviarlo al cliente desde la app (si la tenía abierta, debe recargarla para verlo).',
                });
            }
        );
    },
    {
        serverInfo: { name: 'tupresulisto', version: '1.0.0' },
    },
    {
        basePath: '/api',
        disableSse: true,
        maxDuration: 60,
    }
);

/**
 * Verificación del Bearer: clave de API de la colección api_keys. El uid del
 * dueño viaja en authInfo.extra y las herramientas SOLO operan sobre ese uid.
 */
const verifyToken = async (_req, bearerToken) => {
    if (!bearerToken) return undefined;
    const info = await verifyApiKey(`Bearer ${bearerToken}`);
    if (!info) return undefined;
    return {
        token: bearerToken,
        clientId: info.uid,
        scopes: ['presupuestos'],
        extra: { uid: info.uid, keyId: info.keyId },
    };
};

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
