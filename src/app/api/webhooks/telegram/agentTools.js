import { adminDb } from '@/lib/firebaseAdmin';
import { calcPrice } from '@/utils/pricingEngine';

export const defineTools = (isAdmin) => {
    const declarations = [
        {
            name: "buscar_producto",
            description: "Busca productos disponibles en el catálogo de Gova Ventanas y devuelve su ID, nombre y tipo de precio.",
            parameters: {
                type: "OBJECT",
                properties: {
                    query: { type: "STRING", description: "Nombre o tipo de producto a buscar (ej: mosquitera, ventana pvc)" }
                },
                required: ["query"]
            }
        },
        {
            name: "calcular_precio_exacto",
            description: "Calcula el precio matemático exacto de un producto dadas sus dimensiones milimétricas.",
            parameters: {
                type: "OBJECT",
                properties: {
                    productId: { type: "STRING", description: "El ID del producto obtenido previamente con buscar_producto" },
                    width: { type: "NUMBER", description: "Ancho en milímetros" },
                    height: { type: "NUMBER", description: "Alto en milímetros" },
                    quantity: { type: "NUMBER", description: "Cantidad (por defecto 1)" }
                },
                required: ["productId", "width", "height"]
            }
        }
    ];

    if (isAdmin) {
        declarations.push({
            name: "consultar_estado_presupuesto",
            description: "SOLO ADMINISTRADOR: Busca un presupuesto por el nombre del cliente o su ID para conocer su estado.",
            parameters: {
                type: "OBJECT",
                properties: {
                    query: { type: "STRING", description: "Nombre del cliente o ID del presupuesto" }
                },
                required: ["query"]
            }
        });
        declarations.push({
            name: "consultar_cliente",
            description: "SOLO ADMINISTRADOR: Busca la ficha de un cliente por su nombre o correo.",
            parameters: {
                type: "OBJECT",
                properties: {
                    query: { type: "STRING", description: "Nombre o email del cliente" }
                },
                required: ["query"]
            }
        });
    }

    return [{ functionDeclarations: declarations }];
};

export const executeTool = async (callName, args) => {
    try {
        if (callName === "buscar_producto") {
            const snapshot = await adminDb.collection('productos').get();
            const matches = [];
            const q = args.query.toLowerCase();
            snapshot.forEach(d => {
                const data = d.data();
                if (data.name && data.name.toLowerCase().includes(q)) {
                    matches.push({ id: d.id, name: data.name, priceType: data.priceType });
                }
            });
            return matches.length > 0 ? matches : { error: "No se encontraron productos que coincidan." };
        }
        
        if (callName === "calcular_precio_exacto") {
            const productDoc = await adminDb.collection('productos').doc(args.productId).get();
            if (!productDoc.exists) return { error: "Producto no encontrado." };
            const product = productDoc.data();
            const q = args.quantity || 1;
            const price = calcPrice(product, args.width, args.height, q, [], {});
            return { price: price, currency: "EUR" };
        }

        if (callName === "consultar_estado_presupuesto") {
            const snapshot = await adminDb.collection('presupuestos').get();
            const matches = [];
            const q = args.query.toLowerCase();
            snapshot.forEach(d => {
                const data = d.data();
                const clientName = data.client?.name?.toLowerCase() || '';
                if (d.id.toLowerCase().includes(q) || clientName.includes(q)) {
                    matches.push({ id: d.id, status: data.status, total: data.total, clientName: data.client?.name, date: data.createdAt?.toDate?.() });
                }
            });
            return matches.length > 0 ? matches : { error: "Presupuesto no encontrado." };
        }

        if (callName === "consultar_cliente") {
            const snapshot = await adminDb.collection('clientes').get();
            const matches = [];
            const q = args.query.toLowerCase();
            snapshot.forEach(d => {
                const data = d.data();
                if ((data.name && data.name.toLowerCase().includes(q)) || (data.email && data.email.toLowerCase().includes(q))) {
                    matches.push({ id: d.id, name: data.name, email: data.email, phone: data.phone });
                }
            });
            return matches.length > 0 ? matches : { error: "Cliente no encontrado." };
        }

        return { error: "Función no reconocida." };
    } catch (e) {
        console.error("Tool Execution Error:", e);
        return { error: "Error interno ejecutando la herramienta: " + e.message };
    }
};
