/**
 * Fuente única de contenido para las páginas de aterrizaje por gremio.
 *
 * Cada entrada alimenta DOS páginas generadas por plantilla:
 *  - SEO:  /{seoSlug}  (indexable, contenido largo, FAQ con schema)
 *  - Ads:  /lp/{slug}  (noindex, corta, un solo CTA para campañas)
 *
 * Añadir un gremio nuevo = añadir una entrada aquí. Nada más: las rutas
 * dinámicas, el sitemap y el enlazado interno se generan de este objeto.
 *
 * Reglas del copy:
 *  - Español de España, tono directo de profesional a profesional.
 *  - Solo se afirma lo que el producto hace hoy. Los gremios que tarifan
 *    horas o mano de obra (fontanería, electricidad) se apoyan en el tipo
 *    de cálculo POR UNIDAD, que es como se montaría de verdad en la app.
 *  - El copy de `ads` es distinto del de `seo` a propósito: la página de
 *    campaña no debe duplicar contenido de la indexable.
 */

export const GREMIOS = {
    carpinteria: {
        slug: 'carpinteria',
        seoSlug: 'presupuestos-para-carpinteros',
        nombre: 'Carpintería y muebles a medida',
        profesional: 'carpinteros',
        seo: {
            title: 'Programa de presupuestos para carpinteros y muebles a medida',
            description:
                'Haz presupuestos de carpintería desde el móvil: armarios, cocinas y muebles a medida con tus precios por medidas. PDF con tu logo enviado por WhatsApp en el momento.',
            h1: 'Presupuestos de carpintería en el momento, delante del cliente',
            subtitulo:
                'Mide el hueco, elige el acabado y entrega el presupuesto del armario o la cocina antes de recoger el metro.',
            intro:
                'Un armario empotrado no tiene un precio fijo: depende del ancho, del alto, del interior y del acabado. Por eso los carpinteros acaban presupuestando de noche, con las medidas en un papel y el programa de turno en el ordenador de la oficina. TuPresuListo lleva tu tarifario completo en el móvil: cargas una vez tus precios por tabla de medidas o por metro cuadrado, y en casa del cliente solo eliges, metes ancho y alto, y el precio sale solo. Con tus números y tu margen, no con precios inventados.',
        },
        dolores: [
            {
                titulo: 'Cada mueble es un precio distinto',
                texto: 'Ancho, alto, fondo, interiores, acabados… calcularlo a mano cada vez es lento y da errores.',
            },
            {
                titulo: 'El presupuesto se hace de noche',
                texto: 'Vuelves del taller, cenas, y a montar el documento en el ordenador hasta las tantas.',
            },
            {
                titulo: 'El cliente se enfría esperando',
                texto: 'Entre que mides y entregas el papel pasan días. Otro carpintero llegó antes.',
            },
        ],
        beneficios: [
            'Tu tabla de precios por medidas (ancho × alto) para armarios, frentes y puertas',
            'Extras y acabados con su precio: lacado, cajoneras, iluminación, herrajes',
            'PDF con tu logo y tus condiciones, enviado por WhatsApp desde el salón del cliente',
            'Funciona sin cobertura: en el sótano o en la obra, la app sigue calculando',
        ],
        partidas: [
            { nombre: 'Armario empotrado 240 × 260', calculo: 'Tabla de medidas (ancho × alto)' },
            { nombre: 'Frente de armario corredero', calculo: 'Tabla de medidas + extras de acabado' },
            { nombre: 'Forrado de interior en melamina', calculo: 'Por metro cuadrado' },
            { nombre: 'Cajonera interior', calculo: 'Por unidad' },
        ],
        faq: [
            {
                p: '¿Sirve para muebles a medida o solo para estándar?',
                r: 'Está pensada justo para lo contrario del mueble estándar. Defines tu tabla de precios por tramos de medidas y la app aplica al hueco que midas el tramo que le corresponde, igual que harías tú con la tarifa en papel. Los extras (lacados, interiores, herrajes) se suman aparte, cada uno con su precio.',
            },
            {
                p: '¿Tengo que meter todo mi catálogo antes de empezar?',
                r: 'No. Con cargar los tres o cuatro productos que más presupuestas ya puedes salir a medir. El resto lo añades cuando te haga falta, incluso desde el móvil.',
            },
            {
                p: '¿Puedo aplicar descuentos o pedir señal?',
                r: 'Sí. Cada presupuesto admite un descuento porcentual y una entrega a cuenta, y el PDF desglosa el IVA como exige un presupuesto formal.',
            },
            {
                p: '¿Cómo le llega el presupuesto al cliente?',
                r: 'Generas el PDF en el móvil y se abre el menú de compartir: WhatsApp, email o lo que uses. El documento va con tu logo, tus datos y tus condiciones, no con los nuestros.',
            },
            {
                p: '¿Qué precio tiene?',
                r: 'Hay un plan gratuito con hasta 3 productos activos, suficiente para probarlo con tus muebles habituales. El plan PRO quita el límite y cuesta menos que una hora de taller al mes, sin permanencia.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // Al rellenarlos con clientes de verdad, las plantillas los vuelven a mostrar solas.
        // testimonios: [
        //     { nombre: 'J. Ramírez', negocio: 'Carpintería a medida, Sevilla', texto: 'Antes tardaba dos días en pasar un presupuesto de armario. Ahora lo dejo cerrado en casa del cliente y me quito el trabajo de noche.' },
        // ],
        ads: {
            titular: 'El presupuesto del armario, antes de guardar el metro',
            subtitulo: 'La app de presupuestos para carpinteros que calculan por medidas.',
            bullets: [
                'Tus precios por ancho × alto, con tus extras y tu margen',
                'PDF con tu logo enviado por WhatsApp en el momento',
                'Gratis para empezar, sin tarjeta',
            ],
            cta: 'Probar gratis con mis muebles',
        },
    },

    ventanas: {
        slug: 'ventanas',
        seoSlug: 'presupuestos-para-ventanas-pvc-aluminio',
        nombre: 'Ventanas y cerramientos de PVC y aluminio',
        profesional: 'instaladores de ventanas',
        seo: {
            title: 'Programa de presupuestos para ventanas de PVC y aluminio',
            description:
                'Presupuesta ventanas, cerramientos y correderas por medidas desde el móvil. Tabla de precios ancho × alto, extras de vidrio y persiana, y PDF por WhatsApp al momento.',
            h1: 'Presupuestos de ventanas por medidas, sin volver a la oficina',
            subtitulo:
                'Mides el hueco, eliges serie y vidrio, y el cliente tiene su presupuesto de PVC o aluminio antes de que salgas por la puerta.',
            intro:
                'El precio de una ventana sale de una tabla: ancho por alto, serie, vidrio, persiana, color. Esa tabla hoy vive en un Excel del ordenador de la oficina, así que cada visita genera un viaje de vuelta, una tarde de cálculos y días de espera para el cliente. TuPresuListo mete esa misma tabla en tu móvil: cargas tus precios por tramos de medidas una vez, y delante del cliente solo eliges el modelo, metes las medidas del hueco y añades los extras. El total sale al instante, con tu margen, y el PDF se va por WhatsApp antes de arrancar la furgoneta.',
        },
        dolores: [
            {
                titulo: 'La tarifa vive en un Excel de la oficina',
                texto: 'Sin la tabla delante no puedes dar precio, y la tabla no cabe en la cabeza.',
            },
            {
                titulo: 'Cada hueco es una combinación distinta',
                texto: 'Serie, vidrio, persiana, color, mosquitera… multiplicar todo eso a mano invita al error.',
            },
            {
                titulo: 'El cliente pide tres presupuestos',
                texto: 'Y se queda con el primero serio que recibe. Si el tuyo tarda una semana, pierdes.',
            },
        ],
        beneficios: [
            'Tabla de precios ancho × alto por serie: precio al instante para cualquier medida de hueco',
            'Extras con precio propio: vidrio bajo emisivo, persiana, mosquitera, color especial',
            'Presupuesto de obra completa: suma todas las ventanas de la vivienda en un documento',
            'PDF con tu marca y desglose de IVA, enviado por WhatsApp desde la misma visita',
        ],
        partidas: [
            { nombre: 'Ventana oscilobatiente 2 hojas 120 × 120', calculo: 'Tabla de medidas (ancho × alto)' },
            { nombre: 'Corredera de 2 hojas en aluminio', calculo: 'Tabla de medidas + extras' },
            { nombre: 'Cajón de persiana con motor', calculo: 'Por metro lineal' },
            { nombre: 'Mosquitera enrollable', calculo: 'Por unidad' },
        ],
        faq: [
            {
                p: '¿Cómo meto mi tarifa de fábrica en la app?',
                r: 'Creas un producto por cada serie (por ejemplo, oscilobatiente PVC) y rellenas su tabla de precios por tramos de ancho y alto, igual que la tarifa de tu proveedor. Para medidas intermedias, la app aplica el tramo que corresponde. Los extras se definen aparte y se suman al elegirlos.',
            },
            {
                p: '¿Puedo presupuestar una vivienda entera con varias ventanas?',
                r: 'Sí. Añades cada hueco como una línea con sus medidas y extras, y el presupuesto suma todo con su desglose. El cliente ve cada ventana identificada y el total de la obra.',
            },
            {
                p: '¿Y si el cliente quiere comparar PVC y aluminio?',
                r: 'Presupuesta las dos opciones en documentos separados: con las tarifas ya cargadas, repetir los mismos huecos con la otra serie lleva un par de minutos, y el cliente elige con los números delante.',
            },
            {
                p: '¿Sirve estando en una obra sin cobertura?',
                r: 'Sí. El catálogo y los presupuestos se guardan en el teléfono y la app funciona sin conexión; cuando vuelves a tener señal, se sincroniza sola.',
            },
            {
                p: '¿Cuánto cuesta?',
                r: 'Empiezas gratis con hasta 3 productos activos (tres series, por ejemplo). El plan PRO elimina el límite por menos de lo que cuesta un vidrio de cámara, y sin permanencia.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // testimonios: [
        //     { nombre: 'M. Ortega', negocio: 'Ventanas y cerramientos, Valencia', texto: 'Le doy el precio al cliente con la escalera todavía puesta. He cerrado obras la misma mañana de ir a medir.' },
        // ],
        ads: {
            titular: 'Mide el hueco. Da el precio. Cierra la venta.',
            subtitulo: 'Tu tarifa de ventanas por medidas, en el móvil.',
            bullets: [
                'Tabla ancho × alto por serie, como la de tu proveedor',
                'Extras de vidrio, persiana y color con su precio',
                'PDF por WhatsApp sin pasar por la oficina',
            ],
            cta: 'Probar gratis con mi tarifa',
        },
    },

    fontaneria: {
        slug: 'fontaneria',
        seoSlug: 'presupuestos-para-fontaneros',
        nombre: 'Fontanería',
        profesional: 'fontaneros',
        seo: {
            title: 'Programa de presupuestos para fontaneros',
            description:
                'Haz presupuestos de fontanería desde el móvil: tarifas por punto de agua, sanitario o intervención, mano de obra y desplazamiento. PDF con tu logo por WhatsApp.',
            h1: 'Presupuestos de fontanería en la primera visita',
            subtitulo:
                'Tus tarifas por punto de agua, sanitario e intervención en el móvil: presupuesta el baño delante del cliente y envíalo antes de irte.',
            intro:
                'En fontanería el presupuesto se monta por partidas: tantos puntos de agua, tantos sanitarios, la mano de obra, el desplazamiento. Nada que no sepas de memoria… hasta que hay que ponerlo por escrito con IVA y buena presentación, y eso siempre queda para la noche. TuPresuListo convierte tu lista de tarifas en un catálogo: cada intervención con su precio por unidad, la instalación de tubería por metro lineal, y tu hora de mano de obra como una partida más. En la visita marcas lo que lleva el trabajo, ajustas cantidades y el presupuesto sale con tu logo, listo para WhatsApp.',
        },
        dolores: [
            {
                titulo: 'El "ya te paso precio" se come ventas',
                texto: 'Sales de la visita sin cerrar nada y el cliente sigue llamando a otros fontaneros.',
            },
            {
                titulo: 'Presupuestar un baño lleva más que verlo',
                texto: 'Sumar puntos de agua, sanitarios, material y mano de obra a mano, cada vez, cansa.',
            },
            {
                titulo: 'El papel a boli resta seriedad',
                texto: 'Un precio garabateado no compite con el PDF con logo que envía la empresa grande.',
            },
        ],
        beneficios: [
            'Tarifario por unidad: punto de agua, sanitario instalado, desagüe, desplazamiento',
            'Tu hora de mano de obra como partida, con las horas como cantidad',
            'Tubería y canalización por metro lineal cuando el trabajo va por recorrido',
            'PDF profesional con IVA desglosado, enviado por WhatsApp en la misma visita',
        ],
        partidas: [
            { nombre: 'Punto de agua nuevo (toma + desagüe)', calculo: 'Por unidad' },
            { nombre: 'Instalación de sanitario o grifería', calculo: 'Por unidad' },
            { nombre: 'Tirada de tubería multicapa', calculo: 'Por metro lineal' },
            { nombre: 'Mano de obra', calculo: 'Por unidad (horas como cantidad)' },
        ],
        faq: [
            {
                p: 'Yo cobro por horas y materiales, ¿me sirve?',
                r: 'Sí. Das de alta "hora de mano de obra" como un producto por unidad con tu precio, y en cada presupuesto indicas las horas como cantidad. Los materiales, igual: cada uno con su precio por unidad, o por metro si va por recorrido.',
            },
            {
                p: '¿Puedo tener precios distintos para trabajos de urgencia?',
                r: 'Sí. Puedes crear partidas separadas (por ejemplo, "mano de obra" y "mano de obra urgente/festivo") cada una con su tarifa, y elegir la que toque en cada presupuesto.',
            },
            {
                p: '¿Cómo presupuesto una reforma de baño completa?',
                r: 'Añades cada partida al presupuesto: sanitarios, grifería, puntos de agua, tubería por metros y las horas de trabajo. La app lo suma todo con IVA y el cliente recibe un documento desglosado y serio.',
            },
            {
                p: '¿Funciona si el sótano no tiene cobertura?',
                r: 'Sí. La app guarda tu tarifario y tus presupuestos en el propio móvil, así que puedes presupuestar sin señal y enviar cuando salgas a la calle.',
            },
            {
                p: '¿Qué me cuesta?',
                r: 'Gratis para empezar, con hasta 3 partidas activas y sin tarjeta. Si necesitas el tarifario completo, el plan PRO es una suscripción pequeña sin permanencia: la recuperas con un solo trabajo cerrado antes que la competencia.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // testimonios: [
        //     { nombre: 'A. Molina', negocio: 'Fontanería e instalaciones, Zaragoza', texto: 'El cambio es simple: antes decía "te paso precio esta semana", ahora lo envío desde el portal. Se nota en los trabajos que cierro.' },
        // ],
        ads: {
            titular: 'Deja de decir "ya te paso el presupuesto"',
            subtitulo: 'Tarifas de fontanería en el móvil: presupuesta en la visita y envía por WhatsApp.',
            bullets: [
                'Punto de agua, sanitario y mano de obra con tu tarifa',
                'PDF con tu logo y el IVA desglosado',
                'Gratis para empezar, sin tarjeta',
            ],
            cta: 'Probar gratis con mis tarifas',
        },
    },

    electricidad: {
        slug: 'electricidad',
        seoSlug: 'presupuestos-para-electricistas',
        nombre: 'Electricidad',
        profesional: 'electricistas',
        seo: {
            title: 'Programa de presupuestos para electricistas',
            description:
                'Presupuestos de electricidad desde el móvil: puntos de luz, enchufes, cuadros y mano de obra con tus tarifas. PDF con tu logo por WhatsApp en la misma visita.',
            h1: 'Presupuestos de electricidad a pie de obra',
            subtitulo:
                'Puntos de luz, enchufes, cuadro y mano de obra con tus precios: el presupuesto de la instalación, entregado antes de salir de la vivienda.',
            intro:
                'Una instalación eléctrica se presupuesta contando: puntos de luz, tomas, líneas, el cuadro, las horas. La cuenta la haces de cabeza en la visita, pero el documento formal —con IVA, con membrete, con condiciones— espera a la noche. Y entre la visita y el email, el cliente llama a otro. TuPresuListo guarda tu tarifario por unidad: cada tipo de punto con su precio, la tirada de línea por metro lineal, tu hora de trabajo como una partida más. En la vivienda marcas cantidades habitación por habitación y el presupuesto queda hecho, con tu logo, listo para enviarse por WhatsApp desde el rellano.',
        },
        dolores: [
            {
                titulo: 'Cuentas los puntos dos veces',
                texto: 'Una en la visita para ti, y otra en casa para pasar la cuenta al papel. Doble trabajo.',
            },
            {
                titulo: 'La reforma no espera tu email',
                texto: 'El cliente compara varios electricistas; el presupuesto que llega tarde no compite.',
            },
            {
                titulo: 'El precio de cabeza no se defiende',
                texto: 'Sin desglose por escrito, cualquier cifra parece cara. Con partidas claras, se entiende.',
            },
        ],
        beneficios: [
            'Tarifario por unidad: punto de luz, toma, línea dedicada, cuadro, certificado',
            'Tu hora de mano de obra como partida, con las horas como cantidad',
            'Canalizaciones y tiradas de cable por metro lineal',
            'Desglose por partidas que justifica tu precio ante el cliente, con IVA incluido',
        ],
        partidas: [
            { nombre: 'Punto de luz sencillo o conmutado', calculo: 'Por unidad' },
            { nombre: 'Toma de corriente (enchufe)', calculo: 'Por unidad' },
            { nombre: 'Tirada de línea con canalización', calculo: 'Por metro lineal' },
            { nombre: 'Sustitución de cuadro eléctrico', calculo: 'Por unidad + horas de mano de obra' },
        ],
        faq: [
            {
                p: 'Trabajo por horas más materiales, ¿encaja con la app?',
                r: 'Sí. Creas "hora de mano de obra" como partida por unidad con tu precio y pones las horas como cantidad en cada presupuesto. Los materiales van igual, por unidad o por metro, con tu margen ya incluido en el precio que definas.',
            },
            {
                p: '¿Puedo presupuestar una reforma de instalación completa?',
                r: 'Sí: recorres la vivienda marcando cantidades (tantos puntos, tantas tomas, metros de línea, el cuadro) y la app monta el presupuesto completo con desglose e IVA. Es la manera de que una cifra grande se entienda y se acepte.',
            },
            {
                p: '¿Distingue precios de trabajo normal y de urgencia?',
                r: 'Puedes crear las partidas que necesites, cada una con su tarifa: mano de obra estándar, urgencia, festivo. En cada presupuesto eliges la que corresponde.',
            },
            {
                p: '¿Necesito ordenador?',
                r: 'No. Se instala en el móvil como una app y todo —catálogo, presupuestos, envío— se hace desde ahí. Si un día quieres usar el ordenador, la misma cuenta funciona en cualquier pantalla.',
            },
            {
                p: '¿Cuánto vale?',
                r: 'Hay plan gratuito con hasta 3 partidas activas para probarlo sin tarjeta. El PRO desbloquea el tarifario completo por una cuota pequeña sin permanencia.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // testimonios: [
        //     { nombre: 'R. Serrano', negocio: 'Instalaciones eléctricas, Madrid', texto: 'Recorro el piso contando puntos con el móvil en la mano y al llegar al portal el presupuesto ya está enviado. Los clientes lo comentan.' },
        // ],
        ads: {
            titular: 'Cuenta los puntos una sola vez',
            subtitulo: 'El presupuesto eléctrico se monta solo mientras recorres la vivienda.',
            bullets: [
                'Puntos, tomas y líneas con tus tarifas por unidad',
                'Desglose claro que defiende tu precio',
                'PDF por WhatsApp antes de salir del portal',
            ],
            cta: 'Probar gratis con mis precios',
        },
    },

    reformas: {
        slug: 'reformas',
        seoSlug: 'presupuestos-para-reformas',
        nombre: 'Reformas integrales',
        profesional: 'empresas de reformas',
        seo: {
            title: 'Programa de presupuestos para reformas integrales',
            description:
                'Presupuesta reformas por partidas desde el móvil: demolición, albañilería, alicatado por m², instalaciones y acabados. PDF profesional con tu logo por WhatsApp.',
            h1: 'Presupuestos de reformas por partidas, sin perder la semana',
            subtitulo:
                'Demolición, albañilería, alicatados por metro cuadrado e instalaciones: el presupuesto de la reforma, montado en la primera visita.',
            intro:
                'El presupuesto de una reforma es el documento que decide si la obra es tuya o de otro, y montarlo bien lleva horas: partidas de demolición, albañilería por metros cuadrados, instalaciones, acabados. TuPresuListo te deja tener todas esas partidas como catálogo con tus precios —por m², por metro lineal o por unidad— y componer el presupuesto en la propia visita: mides el baño, marcas las partidas, ajustas cantidades y el documento sale con tu logo y el IVA desglosado. La reforma se decide en días; tu presupuesto puede llegar el primero.',
        },
        dolores: [
            {
                titulo: 'Un presupuesto de reforma lleva horas',
                texto: 'Decenas de partidas, cada una con su medición y su precio. Una tarde entera por visita.',
            },
            {
                titulo: 'Quien entrega primero, gana',
                texto: 'El cliente pide tres presupuestos. Si el tuyo tarda dos semanas, decide sin él.',
            },
            {
                titulo: 'Los números sueltos no venden',
                texto: 'Una cifra global asusta; un desglose por partidas se entiende y se negocia.',
            },
        ],
        beneficios: [
            'Partidas por m² (alicatado, solado, pintura), por metro lineal y por unidad',
            'Compón la reforma completa: baño, cocina o vivienda entera en un documento',
            'Descuento y entrega a cuenta por presupuesto, con IVA desglosado',
            'PDF con tu marca enviado por WhatsApp el mismo día de la visita',
        ],
        partidas: [
            { nombre: 'Alicatado de baño', calculo: 'Por metro cuadrado' },
            { nombre: 'Solado con tarima o cerámica', calculo: 'Por metro cuadrado' },
            { nombre: 'Demolición y retirada de escombros', calculo: 'Por unidad o por m²' },
            { nombre: 'Sustitución de bañera por plato de ducha', calculo: 'Por unidad (partida cerrada)' },
        ],
        faq: [
            {
                p: '¿Puedo montar un presupuesto con muchas partidas distintas?',
                r: 'Sí, es el caso típico de una reforma: añades cada partida con su cantidad (metros, unidades u horas) y la app calcula el total con desglose. El cliente ve qué cuesta cada cosa, que es lo que hace que un presupuesto grande se acepte.',
            },
            {
                p: '¿Cómo manejo los precios por metro cuadrado?',
                r: 'Defines la partida con su precio por m² y en cada presupuesto introduces la medición. También hay precio por metro lineal (rodapiés, encimeras) y por unidad (sanitarios, puertas, partidas cerradas).',
            },
            {
                p: '¿Sirve para coordinar varios gremios en una obra?',
                r: 'Puedes organizar tu catálogo por categorías (albañilería, fontanería, electricidad, pintura) y componer el presupuesto mezclando partidas de todas. La app presupuesta; la coordinación de la obra sigue siendo tuya.',
            },
            {
                p: '¿El cliente puede pedir cambios sobre el presupuesto?',
                r: 'Editas el presupuesto guardado, ajustas partidas o cantidades y vuelves a enviarlo en minutos. Sin rehacer el documento desde cero.',
            },
            {
                p: '¿Qué cuesta la app?',
                r: 'Gratis con hasta 3 partidas activas para probar. El plan PRO, con partidas ilimitadas, cuesta al mes menos que media hora de albañil, sin permanencia.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // testimonios: [
        //     { nombre: 'L. Navarro', negocio: 'Reformas integrales, Bilbao', texto: 'Los presupuestos que antes entregaba en dos semanas ahora salen la misma semana de la visita. Solo con eso cierro más obras.' },
        // ],
        ads: {
            titular: 'La reforma se la lleva quien presupuesta primero',
            subtitulo: 'Partidas, mediciones y precios en el móvil. El presupuesto, el mismo día.',
            bullets: [
                'Partidas por m², metro lineal o unidad con tus precios',
                'Desglose profesional con IVA que genera confianza',
                'Gratis para empezar, sin tarjeta',
            ],
            cta: 'Probar gratis en mi próxima visita',
        },
    },

    toldos: {
        slug: 'toldos',
        seoSlug: 'presupuestos-para-toldos',
        nombre: 'Toldos y pérgolas',
        profesional: 'instaladores de toldos',
        seo: {
            title: 'Programa de presupuestos para toldos y pérgolas',
            description:
                'Presupuesta toldos por medidas desde el móvil: línea por línea, lona, motor y automatismos con tu tarifa. PDF con tu logo por WhatsApp en la misma visita.',
            h1: 'Presupuestos de toldos por medidas, en la misma terraza',
            subtitulo:
                'Mides la salida y la línea, eliges lona y motor, y el cliente tiene el precio del toldo antes de que pliegues el metro.',
            intro:
                'El precio de un toldo sale de su tabla: línea por salida, más la lona elegida, más el motor y los automatismos. Con la tarifa del fabricante en la oficina, cada terraza medida es una llamada pendiente y un cliente esperando. TuPresuListo lleva esas tablas en tu móvil: cargas la tarifa por tramos de medidas de cada modelo una vez, y en la visita eliges modelo, metes línea y salida, marcas los extras y el precio aparece con tu margen. La temporada de toldos es corta: cada presupuesto entregado en el acto es una instalación que no se enfría.',
        },
        dolores: [
            {
                titulo: 'La tarifa del fabricante no cabe en la cabeza',
                texto: 'Cada modelo tiene su tabla de línea × salida. Sin ella delante, no hay precio.',
            },
            {
                titulo: 'La temporada no espera',
                texto: 'En primavera todos quieren el toldo "ya". El presupuesto que tarda una semana llega frío.',
            },
            {
                titulo: 'Motor, lona, cofre… el precio baila',
                texto: 'Cada extra cambia el total y calcularlo a mano delante del cliente da inseguridad.',
            },
        ],
        beneficios: [
            'Tablas de precios línea × salida por modelo, como la tarifa de tu proveedor',
            'Extras con precio propio: motor, mando, sensor de viento, cofre, tipo de lona',
            'Presupuesto en el acto en plena temporada: cierras antes de que llame a otro',
            'PDF con tu marca y desglose, enviado por WhatsApp desde la propia terraza',
        ],
        partidas: [
            { nombre: 'Toldo extensible 400 × 300', calculo: 'Tabla de medidas (línea × salida)' },
            { nombre: 'Toldo cofre con motor', calculo: 'Tabla de medidas + extras' },
            { nombre: 'Motorización con mando a distancia', calculo: 'Por unidad' },
            { nombre: 'Lona vertical para pérgola', calculo: 'Por metro cuadrado' },
        ],
        faq: [
            {
                p: '¿Cómo meto las tarifas de mi fabricante?',
                r: 'Creas un producto por modelo de toldo y copias su tabla de precios por tramos de línea y salida. La app aplica el tramo correcto a las medidas que introduzcas. Motor, cofre y automatismos se añaden como extras con su precio.',
            },
            {
                p: '¿Puedo trabajar con varios fabricantes o calidades de lona?',
                r: 'Sí. Cada modelo o calidad es un producto con su propia tabla, y puedes organizarlos por categorías (extensibles, cofre, pérgolas, verticales) para encontrarlos rápido en la visita.',
            },
            {
                p: '¿Qué pasa con las medidas que no están en la tabla?',
                r: 'La app aplica el tramo de la tabla que corresponde a la medida real, igual que haces tú con la tarifa en papel, así que cualquier línea y salida dentro de tus tramos tiene precio al instante.',
            },
            {
                p: '¿Sirve también para pérgolas y cerramientos de terraza?',
                r: 'Sí: los productos por tabla de medidas o por metro cuadrado cubren pérgolas, toldos verticales y lonas. Si presupuestas por medidas, encaja.',
            },
            {
                p: '¿Cuánto cuesta?',
                r: 'Gratis para empezar con hasta 3 modelos activos y sin tarjeta. El plan PRO desbloquea el catálogo completo con una cuota pequeña sin permanencia, pensada para pagarse con una sola venta de temporada.',
            },
        ],
        // Testimonios desactivados hasta tener reales (decisión de Kevin, jul 2026).
        // testimonios: [
        //     { nombre: 'F. Cano', negocio: 'Toldos y protección solar, Málaga', texto: 'En plena campaña, dar el precio en la misma terraza marca la diferencia. El cliente firma con el sol encima.' },
        // ],
        ads: {
            titular: 'El precio del toldo, con el sol todavía apretando',
            subtitulo: 'Tu tarifa línea × salida en el móvil. Presupuesto en el acto, venta cerrada.',
            bullets: [
                'Tablas de tu fabricante con tu margen',
                'Motor, cofre y lona como extras con precio',
                'PDF por WhatsApp desde la misma terraza',
            ],
            cta: 'Probar gratis esta temporada',
        },
    },
};

/** Lista ordenada para iterar (rutas, sitemap, enlazado interno). */
export const LISTA_GREMIOS = Object.values(GREMIOS);

/** Busca un gremio por su slug de página SEO (p. ej. 'presupuestos-para-carpinteros'). */
export function gremioPorSeoSlug(seoSlug) {
    return LISTA_GREMIOS.find(g => g.seoSlug === seoSlug) ?? null;
}

/** Busca un gremio por su slug corto de página de campaña (p. ej. 'carpinteria'). */
export function gremioPorSlug(slug) {
    return GREMIOS[slug] ?? null;
}
