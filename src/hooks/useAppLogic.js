import { useMemo } from 'react';

/**
 * Custom hook to manage the business logic for standard Quote and Client operations.
 * Extracted from AppV30.js to separate UI from Data flow logic in accordance with SOLID.
 */
export const useAppLogic = ({ history, setHistory, deletedHistory, setDeletedHistory, toast }) => {
    // Derived clients from history
    const clients = useMemo(() => {
        const unique = new Map();
        history.forEach(q => {
            if (q.client && q.client.phone) unique.set(q.client.phone, q.client);
        });
        return Array.from(unique.values());
    }, [history]);

    const handleSaveQuote = (quote, setEditQuoteData) => {
        const exists = history.find(q => q.id === quote.id);
        if (exists) {
            setHistory(history.map(q => q.id === quote.id ? quote : q));
        } else {
            setHistory([quote, ...history]);
        }
        // Keep user in editor with updated data
        if (setEditQuoteData) setEditQuoteData(quote);
        toast("Presupuesto guardado correctamente", "success");
    };

    const handleDeleteQuote = (quote) => {
        setHistory(history.filter(q => q.id !== quote.id));
        setDeletedHistory([{ type: 'quote', data: quote, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Presupuesto movido a papelera", "info");
    };

    const handleDeleteClient = (client) => {
        // Remove all quotes for this client
        const clientQuotes = history.filter(q => (q.client.name + q.client.phone) === (client.name + client.phone));
        setHistory(history.filter(q => (q.client.name + q.client.phone) !== (client.name + client.phone)));

        // Add to deleted as a single client block
        setDeletedHistory([{ type: 'client', data: { ...client, quotes: clientQuotes }, deletedAt: new Date().toISOString() }, ...deletedHistory]);
        toast("Cliente y sus pedidos movidos a papelera", "info");
    };

    const handleRestore = (item) => {
        setDeletedHistory(deletedHistory.filter(d => d.deletedAt !== item.deletedAt));
        if (item.type === 'quote') {
            setHistory([item.data, ...history]);
        } else if (item.type === 'client') {
            setHistory([...item.data.quotes, ...history]);
        }
        toast("Elemento restaurado", "success");
    };

    const handlePermanentDelete = (item) => {
        setDeletedHistory(deletedHistory.filter(x => x.deletedAt !== item.deletedAt));
    };

    const handleUpdateQuoteStatus = (id, status) => {
        setHistory(history.map(x => x.id === id ? { ...x, status } : x));
    };

    return {
        clients,
        handleSaveQuote,
        handleDeleteQuote,
        handleDeleteClient,
        handleRestore,
        handlePermanentDelete,
        handleUpdateQuoteStatus
    };
};
