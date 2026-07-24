import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebaseAdmin';
import {
    loadProducts, loadIva, loadHistory, deriveClients,
    appendQuote, generateQuoteNumber, todayEs,
} from '@/lib/agentData';
import { norm, buildQuoteItems, calcTotales, lineaView, productView } from '@/lib/agentQuoting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Chat del agente IA integrado en la app (botón junto al modo oscuro).
 *
 * Mismo cerebro que el servidor MCP (/api/mcp) — mismas herramientas, misma
 * lógica compartida en agentQuoting — pero autenticado con la SESIÓN del
 * usuario (ID token de Firebase), no con clave de API: el usuario ya está
 * dentro de la app y todo opera únicamente sobre su uid. Es la lección del
 * agente de Telegram de mayo: sin scoping por usuario, no hay agente.
 *
 * El modelo (Gemini, nivel de pago: sin uso de datos para entrenamiento) se
 * llama por REST directamente para no depender de la versión del SDK. La
 * clave vive SOLO en el servidor (GEMINI_API_KEY, nunca NEXT_PUBLIC_*).
 *
 * Protecciones: máx. 8 vueltas de herramientas por mensaje, historial
 * recortado, y tope diario de mensajes por usuario (users/{uid}/data/agentUsage)
 * para que el coste por cuenta esté acotado.
 */

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_TOOL_ROUNDS = 8;
const MAX_MESSAGES = 30;          // últimos turnos que se envían al modelo
const DAILY_MESSAGE_LIMIT = 100;  // mensajes de usuario por día y cuenta

const SYSTEM_PROMPT = `Eres el asistente de oficina de TuPresuListo dentro de la app del usuario, un profesional de gremio (carpintería, ventanas, toldos, fontanería...). Le ayudas a consultar su catálogo, sus clientes y su historial, a calcular precios y a crear presupuestos MIENTRAS TRABAJA, muchas veces dictando por voz en una obra.

Reglas:
- Responde SIEMPRE en español de España, breve y al grano: está de pie con el móvil en la mano. Nada de párrafos largos ni tecnicismos.
- Las medidas de los productos van en MILÍMETROS (una "ventana de 120 por 100" dictada suele ser 1200 × 1000 mm; confírmalo si hay ambigüedad).
- Usa listar_productos antes de calcular si no conoces el catálogo exacto.
- Para "¿cuánto cuesta / costaría...?" usa calcular_precio (NO guarda nada).
- Usa crear_presupuesto SOLO cuando pida claramente crear/guardar el presupuesto. Antes de crearlo, si falta el nombre del cliente, pídeselo.
- Los totales pueden incluir el margen del producto y el IVA: explícalo con el desglose en vez de dudar del número.
- Si una herramienta devuelve error, corrige con la información del error (nombres de productos disponibles, límites de medidas...) en vez de rendirte.
- No inventes precios ni productos JAMÁS: todo sale de las herramientas.
- Si el usuario adjunta fotos (a menudo anotaciones manuscritas de obra) o PDF, extrae de ahí lo útil para el presupuesto: medidas, cantidades, productos, ubicaciones y datos del cliente. Resume SIEMPRE lo que has entendido (lista corta: producto, medidas, cantidad) para que lo confirme antes de calcular o crear nada. Si algo no se lee bien o es ambiguo, pregunta por esa parte en concreto en vez de adivinar. Casa lo extraído con el catálogo real usando listar_productos.`;

/** Adjuntos que aceptamos del cliente (fotos de notas y PDF). */
const ALLOWED_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENTS_BASE64 = 4_000_000; // caracteres base64 en total

/** Declaración de línea de presupuesto para Gemini (subset OpenAPI). */
const LINEA_SCHEMA = {
    type: 'OBJECT',
    properties: {
        producto: { type: 'STRING', description: 'Nombre o id del producto del catálogo' },
        metros: { type: 'NUMBER', description: 'Longitud en metros. SOLO para productos por metro lineal (simple_linear).' },
        ancho: { type: 'NUMBER', description: 'Ancho en mm (productos matrix y por m²)' },
        alto: { type: 'NUMBER', description: 'Alto en mm (productos matrix y por m²)' },
        cantidad: { type: 'INTEGER', description: 'Unidades (1 por defecto)' },
        ubicacion: { type: 'STRING', description: "Etiqueta, p. ej. 'Salón'" },
        extras: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    extra: { type: 'STRING', description: 'Nombre del extra (no desplegable)' },
                    cantidad: { type: 'INTEGER' },
                },
                required: ['extra'],
            },
        },
        opciones: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    extra: { type: 'STRING', description: 'Nombre del extra desplegable' },
                    opcion: { type: 'STRING', description: 'Nombre de la opción elegida' },
                },
                required: ['extra', 'opcion'],
            },
        },
    },
    required: ['producto'],
};

const FUNCTION_DECLARATIONS = [
    {
        name: 'listar_productos',
        description: 'Catálogo del usuario: tipos de cálculo, límites de medidas en mm y extras disponibles.',
        parameters: { type: 'OBJECT', properties: {} },
    },
    {
        name: 'listar_clientes',
        description: 'Cartera de clientes con teléfono, presupuestos y volumen. Útil para reutilizar datos de contacto.',
        parameters: {
            type: 'OBJECT',
            properties: { busqueda: { type: 'STRING', description: 'Filtro por nombre o teléfono' } },
        },
    },
    {
        name: 'listar_presupuestos',
        description: 'Historial de presupuestos, del más reciente al más antiguo.',
        parameters: {
            type: 'OBJECT',
            properties: {
                limite: { type: 'INTEGER', description: 'Máximo a devolver (20 por defecto)' },
                estado: { type: 'STRING', description: "Filtro por estado, p. ej. 'pending'" },
                cliente: { type: 'STRING', description: 'Filtro por nombre o teléfono del cliente' },
            },
        },
    },
    {
        name: 'calcular_precio',
        description: 'Calcula el precio de una o varias líneas con las tarifas reales SIN guardar nada. Para tantear.',
        parameters: {
            type: 'OBJECT',
            properties: {
                lineas: { type: 'ARRAY', items: LINEA_SCHEMA },
                descuentoPorcentaje: { type: 'NUMBER' },
            },
            required: ['lineas'],
        },
    },
    {
        name: 'crear_presupuesto',
        description: 'Crea y GUARDA un presupuesto como pendiente en el historial. Solo cuando el usuario lo pida claramente.',
        parameters: {
            type: 'OBJECT',
            properties: {
                cliente: {
                    type: 'OBJECT',
                    properties: {
                        nombre: { type: 'STRING' },
                        telefono: { type: 'STRING' },
                        email: { type: 'STRING' },
                        direccion: { type: 'STRING' },
                        ciudad: { type: 'STRING' },
                    },
                    required: ['nombre'],
                },
                lineas: { type: 'ARRAY', items: LINEA_SCHEMA },
                descuentoPorcentaje: { type: 'NUMBER' },
                entregaACuenta: { type: 'NUMBER' },
            },
            required: ['cliente', 'lineas'],
        },
    },
];

/** Redondeo a 2 decimales para las respuestas. */
const eur = (n) => Math.round(n * 100) / 100;

/**
 * Ejecuta una herramienta sobre el uid autenticado. Devuelve SIEMPRE un
 * objeto serializable; los errores van como { error } para que el modelo
 * pueda corregir (nombres disponibles, límites...) en la siguiente vuelta.
 */
async function executeTool(uid, name, args = {}) {
    if (name === 'listar_productos') {
        const products = await loadProducts(uid, { conFoto: false });
        if (products.length === 0) return { error: 'El catálogo está vacío. El usuario debe crear productos en la app antes de poder presupuestar.' };
        return { unidadMedidas: 'mm', productos: products.map(productView) };
    }

    if (name === 'listar_clientes') {
        const history = await loadHistory(uid);
        let clientes = deriveClients(history);
        if (args.busqueda) {
            const q = norm(args.busqueda);
            clientes = clientes.filter(c => norm(c.name).includes(q) || String(c.phone).includes(String(args.busqueda).trim()));
        }
        return {
            total: clientes.length,
            clientes: clientes.map(c => ({
                nombre: c.name, telefono: c.phone, email: c.email || null,
                direccion: c.address || null, ciudad: c.city || null,
                presupuestos: c.presupuestos, volumenTotal: eur(c.volumenTotal),
            })),
        };
    }

    if (name === 'listar_presupuestos') {
        let history = await loadHistory(uid);
        if (args.estado) history = history.filter(q => q.status === args.estado);
        if (args.cliente) {
            const q = norm(args.cliente);
            history = history.filter(x => norm(x.client?.name).includes(q) || String(x.client?.phone || '').includes(String(args.cliente).trim()));
        }
        history.sort((a, b) => (b.id || 0) - (a.id || 0));
        return {
            total: history.length,
            presupuestos: history.slice(0, args.limite || 20).map(x => ({
                id: x.id, numero: x.number, fecha: x.date, estado: x.status,
                cliente: x.client?.name || null, total: x.grandTotal ?? null, numLineas: x.items?.length ?? 0,
            })),
        };
    }

    if (name === 'calcular_precio') {
        // Sin fotos: aquí solo se calcula, no se guarda nada.
        const [products, iva] = await Promise.all([loadProducts(uid, { conFoto: false }), loadIva(uid)]);
        if (products.length === 0) return { error: 'El catálogo está vacío: no hay productos con los que presupuestar.' };
        const { items, error } = buildQuoteItems(products, args.lineas || []);
        if (error) return { error };
        const desc = args.descuentoPorcentaje || 0;
        const { grossTotal, discountAmount, netTotal, grandTotal } = calcTotales(items, iva, desc);
        return {
            calculado: true,
            lineas: items.map(lineaView),
            totales: { bruto: eur(grossTotal), descuento: eur(discountAmount), neto: eur(netTotal), ivaPorcentaje: iva, total: eur(grandTotal) },
            nota: 'Cálculo informativo, NO guardado.',
        };
    }

    if (name === 'crear_presupuesto') {
        if (!args.cliente?.nombre) return { error: 'Falta el nombre del cliente.' };
        // CON fotos: la foto del producto se guarda en la línea y sale en el PDF.
        const [products, iva, history] = await Promise.all([loadProducts(uid, { conFoto: true }), loadIva(uid), loadHistory(uid)]);
        if (products.length === 0) return { error: 'El catálogo está vacío: no hay productos con los que presupuestar.' };
        const { items, error } = buildQuoteItems(products, args.lineas || []);
        if (error) return { error };
        const desc = args.descuentoPorcentaje || 0;
        const { grossTotal, discountAmount, netTotal, grandTotal } = calcTotales(items, iva, desc);

        const quote = {
            id: Date.now(),
            number: generateQuoteNumber(history),
            date: todayEs(),
            status: 'pending',
            client: {
                name: args.cliente.nombre,
                phone: args.cliente.telefono || '',
                email: args.cliente.email || '',
                address: args.cliente.direccion || '',
                city: args.cliente.ciudad || '',
                source: 'agente',
            },
            financials: { discountPercent: desc, deposit: args.entregaACuenta || 0 },
            items: items.map(({ _desglose, ...it }) => it),
            grandTotal,
        };
        await appendQuote(uid, quote);
        return {
            creado: true,
            numero: quote.number,
            cliente: quote.client.name,
            lineas: items.map(lineaView),
            totales: { bruto: eur(grossTotal), descuento: eur(discountAmount), neto: eur(netTotal), ivaPorcentaje: iva, total: eur(grandTotal) },
            nota: 'Guardado como PENDIENTE; aparece en el historial de la app en unos segundos. El envío al cliente lo hace el usuario desde la app.',
        };
    }

    return { error: `Herramienta desconocida: ${name}` };
}

/**
 * Tope diario por cuenta (transaccional). El coste por mensaje es bajo pero
 * no está acotado sin esto: un bucle de cliente o un abuso dispararía la
 * factura de la API sin que nadie lo viera.
 */
async function checkDailyLimit(adminDb, uid) {
    const ref = adminDb.collection('users').doc(uid).collection('data').doc('agentUsage');
    const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
    return adminDb.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : {};
        const count = data.date === hoy ? (data.count || 0) : 0;
        if (count >= DAILY_MESSAGE_LIMIT) return false;
        tx.set(ref, { date: hoy, count: count + 1 });
        return true;
    });
}

export async function POST(req) {
    // 1. Autenticación: SIEMPRE el uid del token, nunca del cuerpo. El token
    // se comprueba ANTES de tocar el Admin SDK: así una petición sin sesión
    // recibe su 401 aunque el servidor esté a medio configurar.
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

    let adminDb, admin;
    try {
        ({ adminDb, admin } = getAdmin());
    } catch (err) {
        console.error('Firebase Admin no configurado:', err?.message);
        return NextResponse.json({ error: 'El agente no está disponible en este entorno (faltan credenciales del servidor).' }, { status: 503 });
    }

    let uid;
    try {
        ({ uid } = await admin.auth().verifyIdToken(idToken));
    } catch {
        return NextResponse.json({ error: 'Sesión no válida. Recarga la app.' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'El agente no está configurado todavía (falta GEMINI_API_KEY en el servidor).' }, { status: 503 });
    }

    if (!(await checkDailyLimit(adminDb, uid))) {
        return NextResponse.json({ error: `Has llegado al límite de ${DAILY_MESSAGE_LIMIT} mensajes de hoy. Mañana se reinicia.` }, { status: 429 });
    }

    // 2. Historial del chat → formato Gemini (solo user/model, recortado).
    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Petición mal formada.' }, { status: 400 }); }
    const mensajes = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
    if (mensajes.length === 0) return NextResponse.json({ error: 'No hay mensajes.' }, { status: 400 });

    const contents = mensajes
        .filter(m => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
        .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 4000) }] }));

    // 2b. Adjuntos (fotos de anotaciones, PDF): van como inline_data en el
    // ÚLTIMO mensaje del usuario — solo el turno actual los lleva; el cliente
    // marca en texto los de turnos anteriores. Validación estricta: tipos en
    // lista blanca, tope de cantidad y de peso, y base64 saneado.
    const adjuntosRaw = Array.isArray(body?.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) : [];
    if (adjuntosRaw.length > 0) {
        const validos = [];
        let totalChars = 0;
        for (const a of adjuntosRaw) {
            if (!a || !ALLOWED_ATTACHMENT_TYPES.has(a.mimeType) || typeof a.data !== 'string') continue;
            const data = a.data.replace(/^data:[^,]+,/, '').replace(/\s/g, '');
            if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) continue;
            totalChars += data.length;
            if (totalChars > MAX_ATTACHMENTS_BASE64) {
                return NextResponse.json({ error: 'Los archivos adjuntos pesan demasiado. Envíalos por separado.' }, { status: 413 });
            }
            validos.push({ inline_data: { mime_type: a.mimeType, data } });
        }
        const lastUser = contents.findLast?.(c => c.role === 'user') ?? [...contents].reverse().find(c => c.role === 'user');
        if (validos.length > 0 && lastUser) {
            // Los archivos delante del texto: el modelo lee primero el material
            // y después la instrucción sobre qué hacer con él.
            lastUser.parts = [...validos, ...lastUser.parts];
        }
    }

    // 3. Bucle de herramientas.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const acciones = []; // resumen de herramientas usadas, para la interfaz

    try {
        for (let ronda = 0; ronda <= MAX_TOOL_ROUNDS; ronda++) {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents,
                    tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
                    generationConfig: { temperature: 0.2 },
                }),
            });

            if (!res.ok) {
                const detalle = await res.text();
                console.error('Gemini error:', res.status, detalle.slice(0, 500));
                const msg = res.status === 429
                    ? 'El servicio de IA está saturado ahora mismo. Espera un momento y reintenta.'
                    : 'El servicio de IA ha fallado. Inténtalo de nuevo.';
                return NextResponse.json({ error: msg }, { status: 502 });
            }

            const data = await res.json();
            const content = data?.candidates?.[0]?.content;
            const parts = content?.parts || [];
            const calls = parts.filter(p => p.functionCall);

            if (calls.length === 0) {
                const texto = parts.map(p => p.text || '').join('').trim();
                return NextResponse.json({
                    text: texto || 'No he podido generar respuesta. Prueba a reformular.',
                    acciones,
                });
            }

            // Ejecutar las llamadas y devolver los resultados al modelo.
            contents.push({ role: 'model', parts });
            const responseParts = [];
            for (const p of calls) {
                const { name, args } = p.functionCall;
                acciones.push(name);
                let result;
                try {
                    result = await executeTool(uid, name, args || {});
                } catch (err) {
                    console.error(`Tool ${name} error:`, err);
                    result = { error: 'Fallo interno ejecutando la herramienta.' };
                }
                responseParts.push({ functionResponse: { name, response: { result } } });
            }
            contents.push({ role: 'user', parts: responseParts });
        }

        return NextResponse.json({ error: 'La consulta necesita demasiados pasos. Divídela en partes más pequeñas.' }, { status: 422 });
    } catch (err) {
        console.error('Agent chat error:', err);
        return NextResponse.json({ error: 'Error inesperado del agente.' }, { status: 500 });
    }
}
