import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Servicio para encapsular la lógica de Firestore relacionada con presupuestos.
 */
export const budgetService = {
    /**
     * Crea un nuevo presupuesto en la base de datos.
     * @param {Object} data - Datos del presupuesto.
     * @returns {Promise<string>} El ID del documento creado.
     */
    async createBudget(data) {
        const presupuestosRef = collection(db, 'presupuestos');
        const { client, products, total, ...otherData } = data;
        
        const newDocRef = await addDoc(presupuestosRef, {
            client: client || {},
            products: products || [],
            total: total || 0,
            ...otherData,
            createdBy: 'AI_AGENT',
            agentEmail: 'presupuestos@govaventanas.es',
            status: 'pending_approval',
            adminNotificationSent: false,
            createdAt: serverTimestamp()
        });

        return newDocRef.id;
    }
};
