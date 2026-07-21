/**
 * Generación y envío del presupuesto en PDF desde el móvil.
 *
 * Razón de ser: la misión de TuPresuListo es que el autónomo ENTREGUE el
 * presupuesto allí mismo, en casa del cliente. Antes la única salida era el
 * diálogo de impresión del navegador (guardar PDF → salir de la app → buscar
 * el archivo → adjuntarlo en WhatsApp). Aquí lo reducimos a un toque.
 */

/**
 * Convierte el documento A4 ya renderizado en pantalla a un PDF (Blob).
 *
 * Usamos html2canvas-pro (no el html2canvas clásico) porque Tailwind v4 genera
 * colores en oklch() y el original no sabe interpretarlos.
 *
 * @param {HTMLElement} node - El div del documento A4 (printableDocRef).
 * @returns {Promise<Blob>}
 */
export async function generateQuotePdfBlob(node) {
    if (!node) throw new Error('No se encontró el documento a exportar');

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
    ]);

    // En pantalla el documento se muestra escalado (zoom). Lo neutralizamos
    // durante la captura para exportar a resolución completa, y lo restauramos.
    const wrapper = node.closest('.print-scale-wrapper');
    const previousTransform = wrapper?.style.transform ?? null;
    if (wrapper) wrapper.style.transform = 'none';

    try {
        const canvas = await html2canvas(node, {
            scale: 2, // nitidez suficiente sin disparar el peso del archivo
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imageData = canvas.toDataURL('image/jpeg', 0.92);
        const imageHeight = (canvas.height * pageWidth) / canvas.width;

        // Primera página + tantas como haga falta si el presupuesto es largo.
        pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, imageHeight);
        let remaining = imageHeight - pageHeight;
        let offset = 0;
        while (remaining > 0) {
            offset -= pageHeight;
            pdf.addPage();
            pdf.addImage(imageData, 'JPEG', 0, offset, pageWidth, imageHeight);
            remaining -= pageHeight;
        }

        return pdf.output('blob');
    } finally {
        if (wrapper) wrapper.style.transform = previousTransform;
    }
}

/**
 * Normaliza un teléfono a formato internacional para enlaces wa.me.
 * Asume España (+34) cuando llegan 9 dígitos sin prefijo.
 *
 * @param {string} phone
 * @returns {string} sólo dígitos, con prefijo de país; '' si no es utilizable.
 */
export function toWhatsAppNumber(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9) return `34${digits}`;
    if (digits.startsWith('00')) return digits.slice(2);
    return digits;
}

/**
 * Nombre de archivo limpio y reconocible para el cliente.
 * @param {{ docType?: string, number?: string, clientName?: string }} params
 */
export function buildQuoteFilename({ docType, number, clientName }) {
    const label = docType === 'invoice' ? 'Factura' : 'Presupuesto';
    // NFD separa la tilde de la letra ("ó" -> "o" + acento) y el replace
    // siguiente descarta todo lo que no sea alfanumérico, acentos incluidos.
    const safeClient = String(clientName || 'Cliente')
        .normalize('NFD')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
    return `${label}-${number || 's-n'}-${safeClient}.pdf`;
}

/**
 * Mensaje que acompaña al PDF.
 * @param {{ docType?: string, number?: string, clientName?: string, total?: string, businessName?: string }} params
 */
export function buildQuoteMessage({ docType, number, clientName, total, businessName }) {
    const label = docType === 'invoice' ? 'la factura' : 'el presupuesto';
    const saludo = clientName ? `Hola ${clientName}` : 'Hola';
    const firma = businessName ? `\n\n${businessName}` : '';
    return `${saludo}, te envío ${label} ${number ? `nº ${number}` : ''}${total ? ` por un total de ${total}` : ''}.${firma}`;
}

/**
 * Comparte el PDF usando el menú nativo del móvil (WhatsApp, email, etc.).
 *
 * Si el dispositivo no admite compartir archivos (típico en escritorio),
 * descarga el PDF y abre WhatsApp con el mensaje escrito, para que el
 * profesional sólo tenga que adjuntar el archivo recién descargado.
 *
 * @returns {Promise<{ method: 'share'|'fallback', cancelled?: boolean }>}
 */
export async function shareQuotePdf({ blob, filename, message, phone }) {
    const file = new File([blob], filename, { type: 'application/pdf' });

    const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

    if (canShareFiles) {
        try {
            await navigator.share({ files: [file], text: message });
            return { method: 'share' };
        } catch (err) {
            // El usuario cerró el menú de compartir: no es un error real.
            if (err?.name === 'AbortError') return { method: 'share', cancelled: true };
            // Cualquier otro fallo: seguimos con el plan B.
        }
    }

    // Plan B: descargar el PDF y abrir WhatsApp con el mensaje preparado.
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    const number = toWhatsAppNumber(phone);
    const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    return { method: 'fallback' };
}
