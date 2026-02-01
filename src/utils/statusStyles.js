export const STATUS_STYLES = {
    pending: {
        label: 'PENDIENTE',
        className: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
        color: '#f59e0b' // amber-500
    },
    accepted: {
        label: 'ACEPTADO',
        className: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
        color: '#10b981' // emerald-500
    },
    rejected: {
        label: 'RECHAZADO',
        className: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
        color: '#ef4444' // red-500
    }
};

export const getStatusConfig = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending;
