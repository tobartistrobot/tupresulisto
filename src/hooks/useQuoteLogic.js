import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { round2, sanitizeFloat } from '../utils/mathUtils';

export const useQuoteLogic = ({ initialData, cart, setCart, config, onSave, onReset, toast }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [dims, setDims] = useState({ w: 1000, h: 1000, q: 1 });
    const [locationLabel, setLocationLabel] = useState('');
    const [client, setClient] = useState(initialData?.client || { name: '', phone: '', email: '', address: '', city: '', source: '' });
    const [financials, setFinancials] = useState(initialData?.financials || { discountPercent: 0, deposit: 0 });
    const [quoteMeta, setQuoteMeta] = useState(initialData ? { number: initialData.number, date: initialData.date, status: initialData.status || 'pending' } : { number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
    const [saveStatus, setSaveStatus] = useState('idle');

    // Configurable VAT
    const vatRate = config?.iva !== undefined && config?.iva !== "" ? parseFloat(config.iva) : 21;

    useEffect(() => {
        if (initialData) {
            setClient(initialData.client || { name: '', phone: '', email: '', address: '', city: '', source: initialData.client?.source || '' });
            setFinancials(initialData.financials || { discountPercent: 0, deposit: 0 });
            setQuoteMeta({ number: initialData.number, date: initialData.date, status: initialData.status || 'pending' });
        } else {
            setClient({ name: '', phone: '', email: '', address: '', city: '', source: '' });
            setFinancials({ discountPercent: 0, deposit: 0 });
            setQuoteMeta({ number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
        }
    }, [initialData]);

    const [selectedExtras, setSelectedExtras] = useState([]);
    const [dropdownSelections, setDropdownSelections] = useState({});
    const [calculatedPrice, setCalculatedPrice] = useState(null);

    const calcPrice = useCallback((product, w, h, q, extras, dropdowns) => {
        let base = 0;
        if (product.priceType === 'matrix') {
            const ws = product.matrix.widths; const hs = product.matrix.heights; const ps = product.matrix.prices;
            let c = ws.findIndex(x => x >= w); if (c === -1) c = ws.length - 1;
            let r = hs.findIndex(x => x >= h); if (r === -1) r = hs.length - 1;
            base = sanitizeFloat(ps[r][c]);
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

        return round2((priceBeforeMargin + marginAmount) * q);
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            const total = calcPrice(selectedProduct, dims.w, dims.h, dims.q, selectedExtras, dropdownSelections);
            setCalculatedPrice(total);
        }
    }, [selectedProduct, dims, selectedExtras, dropdownSelections, calcPrice]);

    const toggleExtra = useCallback((extra) => {
        const exists = selectedExtras.find(e => e.id === extra.id);
        if (exists) setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
        else setSelectedExtras([...selectedExtras, { ...extra, qty: 1 }]);
    }, [selectedExtras]);

    const updateExtraQty = useCallback((extraId, delta) => {
        setSelectedExtras(prev => prev.map(e => { if (e.id === extraId) return { ...e, qty: Math.max(1, e.qty + delta) }; return e; }));
    }, []);

    const addToQuote = useCallback(() => {
        const it = { id: Date.now(), product: selectedProduct, width: dims.w, height: dims.h, quantity: dims.q, locationLabel, selectedExtras: [...selectedExtras], dropdownSelections: { ...dropdownSelections }, price: calculatedPrice, unitPriceCalc: calculatedPrice / dims.q };
        setCart(prev => [...prev, it]);
        setSelectedProduct(null);
        setLocationLabel('');
        setSelectedExtras([]);
        setDropdownSelections({});
        toast("Producto añadido", "success");
    }, [selectedProduct, dims, locationLabel, selectedExtras, dropdownSelections, calculatedPrice, setCart, toast]);

    const updateQuantity = useCallback((id, d) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + d), price: item.unitPriceCalc * Math.max(1, item.quantity + d) } : item)), [setCart]);
    const removeFromCart = useCallback((id) => setCart(prev => prev.filter(x => x.id !== id)), [setCart]);
    const moveCartItem = useCallback((idx, dir) => {
        if ((dir === -1 && idx === 0) || (dir === 1 && idx === cart.length - 1)) return;
        const newCart = [...cart];
        [newCart[idx], newCart[idx + dir]] = [newCart[idx + dir], newCart[idx]];
        setCart(newCart);
    }, [cart, setCart]);

    const grossTotal = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);
    const discountAmount = grossTotal * (financials.discountPercent / 100);
    const netTotal = grossTotal - discountAmount;
    const grandTotal = netTotal * (1 + vatRate / 100);
    const remainingBalance = grandTotal - financials.deposit;

    const isMounted = useRef(true);
    const saveTimeoutRef = useRef(null);
    const idleTimeoutRef = useRef(null);
    const printableDocRef = useRef(null);

    // Configure react-to-print with dynamic filename
    const reactToPrintFn = useReactToPrint({
        contentRef: printableDocRef,
        documentTitle: `${client.name?.replace(/\s+/g, '') || 'Cliente'}_${quoteMeta.number}`,
    });

    const handlePrintPDF = useCallback(() => {
        if (reactToPrintFn) {
            reactToPrintFn();
        }
    }, [reactToPrintFn]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, []);

    const handleSave = useCallback(() => {
        if (!client.name) {
            toast("Falta nombre cliente", "error");
            return;
        }
        if (cart.length === 0) {
            toast("Carrito vacío", "error");
            return;
        }

        try {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

            setSaveStatus('saving');

            onSave({
                id: initialData?.id || Date.now(),
                number: quoteMeta.number,
                date: quoteMeta.date,
                status: quoteMeta.status,
                client,
                financials,
                items: cart,
                grandTotal
            });

            saveTimeoutRef.current = setTimeout(() => {
                if (isMounted.current) {
                    setSaveStatus('saved');
                    idleTimeoutRef.current = setTimeout(() => {
                        if (isMounted.current) {
                            setSaveStatus('idle');
                        }
                    }, 2000);
                }
            }, 800);
        } catch (error) {
            console.error("Error saving quote:", error);
            toast(`Error: ${error.message}`, "error");
            setSaveStatus('idle');
        }
    }, [client, cart, initialData, quoteMeta, financials, grandTotal, onSave, toast]);

    const handleLocalReset = useCallback(() => {
        if (onReset) onReset();
        setClient({ name: '', phone: '', email: '', address: '', city: '', source: '' });
        setFinancials({ discountPercent: 0, deposit: 0 });
        setQuoteMeta({ number: `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, date: new Date().toLocaleDateString('es-ES'), status: 'pending' });
        setCart([]);
        setSelectedProduct(null);
        setLocationLabel('');
        setSelectedExtras([]);
        setDropdownSelections({});
        toast("Formulario limpio", "success");
    }, [onReset, setCart, toast]);

    return {
        selectedProduct, setSelectedProduct,
        dims, setDims,
        locationLabel, setLocationLabel,
        client, setClient,
        financials, setFinancials,
        quoteMeta, setQuoteMeta,
        saveStatus, setSaveStatus,
        vatRate,
        selectedExtras, toggleExtra, updateExtraQty,
        dropdownSelections, setDropdownSelections,
        calculatedPrice, addToQuote,
        updateQuantity, removeFromCart, moveCartItem,
        grossTotal, discountAmount, netTotal, grandTotal, remainingBalance,
        handleSave, handleLocalReset,
        saveTimeoutRef, idleTimeoutRef,
        printableDocRef, handlePrintPDF
    };
};
