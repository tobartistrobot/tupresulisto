import { calcPrice } from '@/utils/pricingEngine';

/**
 * Lógica de presupuestación para agentes de IA, compartida por el servidor
 * MCP (/api/mcp, agentes externos con clave tpl_...) y el chat integrado en
 * la app (/api/agent/chat, usuario autenticado). Vive aquí para que ambos
 * caminos resuelvan productos, extras y totales EXACTAMENTE igual: un mismo
 * pedido debe costar lo mismo se pregunte por donde se pregunte.
 */

/** Quita acentos y baja a minúsculas para comparar nombres con tolerancia. */
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Busca un producto por id exacto o por nombre (exacto y, si no, por
 * subcadena única). Devuelve { product } o { error } con alternativas.
 */
export function resolveProduct(products, ref) {
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

/**
 * Resuelve las líneas de un presupuesto contra el catálogo y calcula cada
 * precio con el motor real (calcPrice, el mismo que usa la app). Compartido
 * por calcular_precio (no persiste) y crear_presupuesto (sí persiste): así
 * los dos caminos dan SIEMPRE el mismo número para las mismas líneas.
 *
 * @returns {{ items: Array<object> } | { error: string }}
 */
export function buildQuoteItems(products, lineas) {
    const items = [];
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const res = resolveProduct(products, linea.producto);
        if (res.error) return { error: `Línea ${i + 1}: ${res.error}` };
        const product = res.product;

        // Medidas según el tipo de cálculo (el motor trabaja en mm):
        //  - unit: sin medidas
        //  - simple_linear: una sola longitud → 'metros' (o ancho en mm)
        //  - matrix / simple_area: ancho y alto en mm
        let w, h;
        if (product.priceType === 'unit') {
            w = 0; h = 0;
        } else if (product.priceType === 'simple_linear') {
            const mm = linea.metros != null ? linea.metros * 1000 : linea.ancho;
            if (!mm) return { error: `Línea ${i + 1}: "${product.name}" se cobra por metro lineal; indica la longitud en "metros".` };
            w = mm; h = 0; // el cálculo lineal usa solo la longitud
        } else {
            if (!linea.ancho || !linea.alto) {
                return { error: `Línea ${i + 1}: "${product.name}" se calcula por medidas; indica ancho y alto en mm.` };
            }
            w = linea.ancho; h = linea.alto;
        }
        const q = linea.cantidad ?? 1;

        // Extras sueltos (no desplegables)
        const selectedExtras = [];
        for (const sel of linea.extras || []) {
            const def = (product.extras || []).find(e =>
                String(e.id) === String(sel.extra) || norm(e.name) === norm(sel.extra));
            if (!def) {
                const disponibles = (product.extras || []).map(e => e.name).join(' | ') || 'ninguno';
                return { error: `Línea ${i + 1}: el extra "${sel.extra}" no existe en "${product.name}". Extras disponibles: ${disponibles}.` };
            }
            if (def.optionsList) {
                return { error: `Línea ${i + 1}: "${def.name}" es un desplegable; selecciónalo con "opciones" indicando la opción elegida.` };
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
                return { error: `Línea ${i + 1}: el desplegable "${sel.extra}" no existe en "${product.name}". Desplegables disponibles: ${desplegables}.` };
            }
            let idx = /^\d+$/.test(sel.opcion.trim()) ? parseInt(sel.opcion.trim()) : def.optionsList.findIndex(o => norm(o.name) === norm(sel.opcion));
            if (idx < 0 || idx >= def.optionsList.length) {
                return { error: `Línea ${i + 1}: la opción "${sel.opcion}" no existe en "${def.name}". Opciones: ${def.optionsList.map((o, j) => `${j}=${o.name}`).join(' | ')}.` };
            }
            dropdownSelections[def.id] = String(idx);
        }

        const { price, error, desglose } = calcPrice(product, w, h, q, selectedExtras, dropdownSelections);
        if (error) {
            const limites = product.priceType === 'matrix' && product.matrix
                ? ` Máximos de tarifa: ${product.matrix.widths?.at(-1)} × ${product.matrix.heights?.at(-1)} mm.`
                : '';
            return { error: `Línea ${i + 1} ("${product.name}", ${w}×${h} mm): ${error}${limites}` };
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
            _desglose: desglose, // solo para la respuesta al agente; no se guarda
        });
    }
    return { items };
}

/** Totales a partir de las líneas ya calculadas, con la misma aritmética que la app (useQuoteLogic). */
export function calcTotales(items, iva, descuentoPorcentaje) {
    const grossTotal = items.reduce((s, it) => s + it.price, 0);
    const discountAmount = grossTotal * (descuentoPorcentaje / 100);
    const netTotal = grossTotal - discountAmount;
    const grandTotal = netTotal * (1 + iva / 100);
    return { grossTotal, discountAmount, netTotal, grandTotal };
}

/** Formato de línea para la respuesta al agente (compartido por ambas herramientas). */
export function lineaView(it) {
    return {
        producto: it.product.name,
        medida: it.product.priceType === 'simple_linear'
            ? `${it.width / 1000} m`
            : it.product.priceType === 'unit'
                ? `${it.quantity} ud`
                : `${it.width}×${it.height} mm`,
        cantidad: it.quantity,
        // Desglose para que el agente EXPLIQUE el total en vez de dudar
        desglose: it._desglose
            ? { base: it._desglose.base, extras: it._desglose.extras, margen: it._desglose.margen }
            : undefined,
        precio: it.price,
    };
}

/** Cómo se le indican las medidas al agente según el tipo de cálculo. */
export const COMO_PRESUPUESTAR = {
    matrix: 'Indica ancho y alto en mm.',
    simple_area: 'Indica ancho y alto en mm (se cobra por m²).',
    simple_linear: "Indica la longitud en metros con el campo 'metros'.",
    unit: 'Indica solo la cantidad (no lleva medidas).',
};

/** Vista de un producto para el agente: sin imagen (base64 enorme). */
export function productView(p) {
    const view = {
        id: p.id,
        nombre: p.name,
        categoria: p.category || null,
        tipoCalculo: p.priceType, // matrix | unit | simple_area | simple_linear
        comoPresupuestar: COMO_PRESUPUESTAR[p.priceType] || COMO_PRESUPUESTAR.matrix,
    };
    if (p.priceType === 'matrix' && p.matrix) {
        view.medidasMaximasMm = {
            ancho: p.matrix.widths?.[p.matrix.widths.length - 1] ?? null,
            alto: p.matrix.heights?.[p.matrix.heights.length - 1] ?? null,
        };
    } else if (p.priceType === 'simple_linear') {
        view.precioPorMetro = p.unitPrice ?? null;
    } else if (p.priceType === 'simple_area') {
        view.precioPorM2 = p.unitPrice ?? null;
    } else {
        view.precioUnitario = p.unitPrice ?? null;
    }
    // Margen del propio dueño: se muestra para que el agente pueda explicar el
    // total (base + margen), no darlo por un error como pasó antes.
    if (p.marginType === 'fixed' && Number(p.marginValue)) view.margen = `+${p.marginValue} € por unidad`;
    else if (p.marginType === 'percent' && Number(p.marginValue)) view.margen = `+${p.marginValue} %`;

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
