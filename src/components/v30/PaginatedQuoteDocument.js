'use client';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Documento del presupuesto paginado en folios A4 reales.
 *
 * Antes el documento era una hoja continua y el PDF se generaba rasterizándolo
 * entero a un canvas y troceándolo en alturas fijas de A4: el corte caía por
 * donde pillara y partía filas de producto y el bloque de totales por la mitad.
 *
 * Aquí repartimos las filas en páginas ANTES de pintar, midiendo su alto real,
 * con tres reglas: ninguna fila se parte, el bloque de totales va entero (salta
 * a la página siguiente si no cabe) y cada página nueva repite la cabecera de
 * columnas. Lo que se ve en pantalla (folios separados) es exactamente lo que
 * sale en el PDF, porque el exportador captura cada `.pdf-page` por separado.
 */

const formatCurrency = (amount) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);

// A4 a 96 dpi, con márgenes de 15mm, todo en píxeles CSS.
const PAGE_H = 1123;               // 297mm
const PAD = 56.7;                  // 15mm
const CONTENT_H = PAGE_H - PAD * 2; // alto útil de una página ≈ 1009px
const SAFETY = 16;                 // colchón para no rozar el margen inferior
const BUDGET = CONTENT_H - SAFETY;

// Separaciones verticales entre bloques. Son constantes (no clases de Tailwind)
// a propósito: el mismo número se usa para medir y para pintar, así el reparto
// no se puede desincronizar de lo que se ve.
const GAP_AFTER_HEADER = 24;
const GAP_BEFORE_TOTALS = 24;
const GAP_BEFORE_FOOTER = 40;

function PaginatedQuoteDocument({ config, docType, quoteMeta, client, cart, financials, totals }) {
    const { grossTotal, discountAmount, netTotal, grandTotal, remainingBalance, vatRate } = totals;

    const headerRef = useRef(null);
    const colheadRef = useRef(null);
    const rowRefs = useRef([]);
    const totalsRef = useRef(null);
    const footerRef = useRef(null);

    const [mounted, setMounted] = useState(false);
    const [pages, setPages] = useState(null); // null = todavía midiendo

    useLayoutEffect(() => { setMounted(true); }, []);

    // ── Bloques del documento, reutilizados por el pase de medición y por las
    //    páginas visibles para que midan y pinten exactamente lo mismo. ──────
    const renderHeader = () => (
        <div className="flex justify-between items-start border-b-2 pb-6" style={{ borderColor: config.color }}>
            <div>{config.logo ? <img src={config.logo} className="h-16 mb-4 object-contain" alt="" /> : <h1 className="text-4xl font-black mb-2" style={{ color: config.color }}>{config.name}</h1>}
                <div className="text-xs text-slate-500 space-y-1"><p>{config.address}</p>{config.cif && <p>CIF/NIF: {config.cif}</p>}<p>{config.phone} • {config.email}</p><p>{config.website}</p></div>
            </div>
            <div className="text-right"><h2 className="text-4xl font-black tracking-tight text-slate-800 mb-2">{docType === 'invoice' ? 'FACTURA' : 'PRESUPUESTO'}</h2>
                <div className="flex flex-col items-end my-2"><span className="text-lg font-bold text-slate-600">#{quoteMeta.number}</span><span className="text-sm text-slate-400">{quoteMeta.date}</span></div>
                <div className="mt-4 text-left bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-[250px]"><p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Facturar a</p><p className="font-bold text-slate-800 text-lg leading-none mb-1">{client.name}</p><p className="text-sm text-slate-600">{client.phone}</p><p className="text-sm text-slate-600">{client.address}</p></div>
            </div>
        </div>
    );

    const renderColHead = () => (
        <tr className="border-b-2 text-xs uppercase text-slate-500 font-bold tracking-wider"><th className="text-left py-3 pl-2">Concepto</th><th className="text-center py-3">Medidas</th><th className="text-center py-3">Cant.</th><th className="text-right py-3 pr-2">Total</th></tr>
    );

    const renderRow = (i) => (
        <tr key={i.id} className="border-b border-slate-100 last:border-0">
            <td className="py-4 pl-2"><div className="flex items-start gap-4">{i.product.image && <img src={i.product.image} className="w-16 h-16 object-cover rounded-lg border border-slate-200" alt="" />}<div><p className="font-bold text-slate-800 text-base">{i.product.name}</p><p className="text-xs text-slate-500 mt-1">{i.product.category} {i.locationLabel && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">{i.locationLabel}</span>}</p>{i.selectedExtras?.length > 0 && <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-1">{i.selectedExtras.map((e, k) => <span key={k} className="bg-slate-50 px-1 border border-slate-200 rounded">+{e.qty > 1 ? e.qty + 'x ' : ''}{e.name}</span>)}</div>}</div></div></td>
            <td className="text-center text-sm py-4 text-slate-600 font-medium">{i.width} x {i.height}</td>
            <td className="text-center font-bold text-slate-800 py-4">{i.quantity}</td>
            <td className="text-right font-bold text-slate-800 py-4 pr-2">{formatCurrency(i.price)}</td>
        </tr>
    );

    const renderTotals = () => (
        <div className="flex justify-end"><div className="w-80 space-y-2">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-medium">{formatCurrency(grossTotal)}</span></div>
            {financials.discountPercent > 0 && <div className="flex justify-between text-sm font-bold text-emerald-600"><span>Descuento ({financials.discountPercent}%)</span><span>-{formatCurrency(discountAmount)}</span></div>}
            {financials.discountPercent > 0 && <div className="flex justify-between text-sm text-slate-600 pb-2 border-b border-dashed"><span>Base imponible</span><span className="font-medium">{formatCurrency(netTotal)}</span></div>}
            <div className="flex justify-between text-sm text-slate-600 pb-3 border-b"><span>IVA ({vatRate}%)</span><span className="font-medium">{formatCurrency(netTotal * (vatRate / 100))}</span></div>
            <div className="flex justify-between text-3xl font-black bg-slate-50 p-2 rounded-lg -mx-2" style={{ color: config.color }}><span>TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>
            {financials.deposit > 0 && <div className="flex justify-between text-sm font-bold text-slate-500 pt-2 border-t border-dashed mt-1"><span>Entrega a cuenta</span><span>-{formatCurrency(financials.deposit)}</span></div>}
            {financials.deposit > 0 && <div className="flex justify-between font-black text-lg border-t pt-2"><span>PENDIENTE</span><span>{formatCurrency(remainingBalance)}</span></div>}
        </div></div>
    );

    const renderFooter = () => (
        <div className="pt-6 border-t-2 border-slate-100 text-[10px] text-slate-500 grid grid-cols-2 gap-12"><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Método de Pago</b><div className="p-3 bg-slate-50 rounded border">{config.bankAccount || 'Consultar'}</div></div><div><b className="block mb-2 text-slate-800 uppercase tracking-wider">Términos y Condiciones</b><p style={{ whiteSpace: 'pre-line' }} className="leading-relaxed">{config.legalText}</p></div></div>
    );

    // ── Pase de medición → reparto en páginas ──────────────────────────────
    useLayoutEffect(() => {
        // El pase de medición vive en un portal que solo existe tras montar;
        // hasta entonces los refs son null y no hay nada que medir.
        if (!mounted) return;
        let cancelled = false;

        const measure = () => {
            if (cancelled) return;
            const h = (el) => (el ? el.getBoundingClientRect().height : 0);
            const H_header = h(headerRef.current);
            const H_colhead = h(colheadRef.current);
            const H_totals = h(totalsRef.current);
            const H_footer = h(footerRef.current);
            const rowH = cart.map((_, i) => h(rowRefs.current[i]));

            const built = [];
            // La primera página abre con la cabecera del documento; todas abren
            // con la cabecera de columnas.
            let cur = { rows: [], height: H_header + GAP_AFTER_HEADER + H_colhead, showHeader: true };
            cart.forEach((_, i) => {
                if (cur.rows.length > 0 && cur.height + rowH[i] > BUDGET) {
                    built.push(cur);
                    cur = { rows: [], height: H_colhead }; // página nueva: repite columnas
                }
                cur.rows.push(i);
                cur.height += rowH[i];
            });

            // Totales: bloque indivisible. Si no cabe tras la última fila, salta
            // entero a una página nueva (sin cabecera de columnas, no hay filas).
            if (cur.height + GAP_BEFORE_TOTALS + H_totals <= BUDGET) {
                cur.showTotals = true;
                cur.height += GAP_BEFORE_TOTALS + H_totals;
            } else {
                built.push(cur);
                cur = { rows: [], height: H_totals, showTotals: true };
            }

            // Pie (método de pago + términos): una sola vez, al final.
            if (cur.height + GAP_BEFORE_FOOTER + H_footer <= BUDGET) {
                cur.showFooter = true;
            } else {
                built.push(cur);
                cur = { rows: [], showFooter: true };
            }
            built.push(cur);

            if (!cancelled) setPages(built);
        };

        // Medir ya (las fuentes suelen estar listas) y de nuevo cuando terminen
        // de cargar: si midiéramos antes, las alturas cambiarían al aplicarse la
        // tipografía y el reparto saldría desfasado.
        measure();
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            document.fonts.ready.then(() => measure());
        }
        return () => { cancelled = true; };
    }, [mounted, config, docType, quoteMeta, client, cart, financials, grossTotal, discountAmount, netTotal, grandTotal, remainingBalance, vatRate]);

    // Pase de medición: fuera del flujo y a escala 1 (por eso va en un portal al
    // body; dentro del contenedor con zoom, getBoundingClientRect devolvería las
    // alturas escaladas y el reparto sería erróneo).
    const measurePass = mounted && createPortal(
        <div aria-hidden className="text-sm" style={{ position: 'absolute', left: -99999, top: 0, width: '210mm', padding: '0 15mm', visibility: 'hidden', pointerEvents: 'none' }}>
            <div ref={headerRef}>{renderHeader()}</div>
            <table className="w-full text-sm">
                <thead><tr ref={colheadRef} className="border-b-2 text-xs uppercase text-slate-500 font-bold tracking-wider"><th className="text-left py-3 pl-2">Concepto</th><th className="text-center py-3">Medidas</th><th className="text-center py-3">Cant.</th><th className="text-right py-3 pr-2">Total</th></tr></thead>
                <tbody>{cart.map((i, idx) => (
                    <tr key={i.id} ref={el => { rowRefs.current[idx] = el; }} className="border-b border-slate-100 last:border-0">
                        <td className="py-4 pl-2"><div className="flex items-start gap-4">{i.product.image && <img src={i.product.image} className="w-16 h-16 object-cover rounded-lg border border-slate-200" alt="" />}<div><p className="font-bold text-slate-800 text-base">{i.product.name}</p><p className="text-xs text-slate-500 mt-1">{i.product.category} {i.locationLabel && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">{i.locationLabel}</span>}</p>{i.selectedExtras?.length > 0 && <div className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-1">{i.selectedExtras.map((e, k) => <span key={k} className="bg-slate-50 px-1 border border-slate-200 rounded">+{e.qty > 1 ? e.qty + 'x ' : ''}{e.name}</span>)}</div>}</div></div></td>
                        <td className="text-center text-sm py-4 text-slate-600 font-medium">{i.width} x {i.height}</td>
                        <td className="text-center font-bold text-slate-800 py-4">{i.quantity}</td>
                        <td className="text-right font-bold text-slate-800 py-4 pr-2">{formatCurrency(i.price)}</td>
                    </tr>
                ))}</tbody>
            </table>
            <div ref={totalsRef}>{renderTotals()}</div>
            <div ref={footerRef}>{renderFooter()}</div>
        </div>,
        document.body
    );

    // Mientras se mide (primer fotograma), pintamos el documento en una sola
    // hoja continua para que no haya parpadeo; el pase de medición lo sustituye
    // por las páginas en cuanto termina.
    return (
        <>
            {measurePass}
            {pages
                ? pages.map((pg, k) => (
                    <div
                        key={k}
                        className="pdf-page bg-white shadow-2xl mx-auto mb-6 last:mb-0 relative overflow-hidden"
                        style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
                    >
                        {pg.showHeader && renderHeader()}
                        {pg.showHeader && <div style={{ height: GAP_AFTER_HEADER }} />}
                        {pg.rows.length > 0 && (
                            <table className="w-full">
                                <thead>{renderColHead()}</thead>
                                <tbody>{pg.rows.map(idx => renderRow(cart[idx]))}</tbody>
                            </table>
                        )}
                        {pg.showTotals && <><div style={{ height: GAP_BEFORE_TOTALS }} />{renderTotals()}</>}
                        {pg.showFooter && <><div style={{ height: GAP_BEFORE_FOOTER }} />{renderFooter()}</>}
                    </div>
                ))
                : (
                    <div className="pdf-page bg-white shadow-2xl mx-auto relative" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                        {renderHeader()}
                        <div style={{ height: GAP_AFTER_HEADER }} />
                        <table className="w-full"><thead>{renderColHead()}</thead><tbody>{cart.map(renderRow)}</tbody></table>
                        <div style={{ height: GAP_BEFORE_TOTALS }} />{renderTotals()}
                        <div style={{ height: GAP_BEFORE_FOOTER }} />{renderFooter()}
                    </div>
                )}
        </>
    );
}

// memo: durante el arrastre/zoom el padre se repinta a 60fps; sin esto el pase
// de medición se dispararía en cada fotograma. Solo nos importa cuando cambian
// los datos del documento.
export default React.memo(PaginatedQuoteDocument);
