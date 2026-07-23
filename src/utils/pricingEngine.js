import { round2, sanitizeFloat } from './mathUtils';

/**
 * Motor de precios de TuPresuListo — fuente única de verdad del cálculo.
 *
 * Lo usan la app (useQuoteLogic, en el navegador) y el servidor MCP (agentes
 * creando presupuestos por API). Cualquier cambio aquí afecta a ambos por
 * igual, que es exactamente lo que se quiere: un agente debe presupuestar
 * el mismo importe que saldría tocando la pantalla.
 *
 * Calcula el precio final de un producto según sus dimensiones, cantidad,
 * extras seleccionados, opciones desplegables y margen del producto.
 *
 * @param {object} product - Producto del catálogo (con matrix/unitPrice, extras, margen).
 * @param {number} w - Ancho en mm.
 * @param {number} h - Alto en mm.
 * @param {number} q - Cantidad.
 * @param {Array<object>} extras - Extras seleccionados: [{ id, type, value, qty }].
 * @param {Record<string, string|number>} dropdowns - Selecciones de desplegables: { [extraId]: índiceOpción }.
 * @returns {{ price: number | null, error: string | null }} Precio redondeado a 2 decimales, o error de validación.
 */
export const calcPrice = (product, w, h, q, extras, dropdowns) => {
    let base = 0;
    if (product.priceType === 'matrix') {
        const ws = product.matrix.widths; const hs = product.matrix.heights; const ps = product.matrix.prices;

        // Validate max limits
        if (w > ws[ws.length - 1] || h > hs[hs.length - 1]) {
            return { price: null, error: 'Medidas exceden el máximo permitido en tarifa.' };
        }

        let c = ws.findIndex(x => x >= w); if (c === -1) c = ws.length - 1;
        let r = hs.findIndex(x => x >= h); if (r === -1) r = hs.length - 1;
        base = sanitizeFloat(ps[r][c]);

        // Validate forbidden zone
        if (base === 0) {
            return { price: null, error: 'Rango de medidas desactivado o prohibido.' };
        }
    } else if (product.priceType === 'unit') {
        base = sanitizeFloat(product.unitPrice);
    } else if (product.priceType === 'simple_area') {
        base = (w * h / 1000000) * sanitizeFloat(product.unitPrice);
    } else if (product.priceType === 'simple_linear') {
        base = (Math.max(w, h) / 1000) * sanitizeFloat(product.unitPrice);
    }

    let extraTotal = 0;
    extras.forEach(e => {
        const val = sanitizeFloat(e.value);
        if (e.type === 'fixed') extraTotal += val * e.qty;
        else if (e.type === 'percent') extraTotal += base * (val / 100) * e.qty;
        else if (e.type === 'linear') extraTotal += (Math.max(w, h) / 1000) * val * e.qty;
        else if (e.type === 'area') extraTotal += (w * h / 1000000) * val * e.qty;
    });

    Object.keys(dropdowns).forEach(extraId => {
        const extra = product.extras.find(e => e.id.toString() === extraId);
        if (extra && extra.optionsList) {
            const optIndex = parseInt(dropdowns[extraId]);
            const opt = extra.optionsList[optIndex];
            if (opt) {
                const val = sanitizeFloat(opt.value);
                if (opt.type === 'fixed') extraTotal += val;
                else if (opt.type === 'percent') extraTotal += base * (val / 100);
                else if (opt.type === 'linear') extraTotal += (Math.max(w, h) / 1000) * val;
                else if (opt.type === 'area') extraTotal += (w * h / 1000000) * val;
            }
        }
    });

    let priceBeforeMargin = base + extraTotal;
    let marginAmount = 0;
    if (product.marginType === 'percent' && product.marginValue) {
        marginAmount = priceBeforeMargin * (sanitizeFloat(product.marginValue) / 100);
    } else if (product.marginType === 'fixed' && product.marginValue) {
        marginAmount = sanitizeFloat(product.marginValue);
    }

    return { price: round2((priceBeforeMargin + marginAmount) * q), error: null };
};
