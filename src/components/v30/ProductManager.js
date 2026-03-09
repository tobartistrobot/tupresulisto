'use client';
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Box, Edit, Trash, Plus, Percent, Wand, ArrowLeft, ArrowRight, List, GripVertical, Save } from 'lucide-react';
import MatrixEditor from './MatrixEditor';
import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableProductCard = ({ p, handleEdit, filterCategory, confirmDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.95 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`group bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/60 ${isDragging ? 'shadow-2xl scale-105 ring-4 ring-blue-500/20' : 'shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600'} overflow-hidden transition-all flex flex-col h-full relative`}>

            {/* Contextual Drag Area (Only if in "Todas") */}
            {filterCategory === 'Todas' && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-0 right-0 p-3 z-30 cursor-grab active:cursor-grabbing touch-none text-slate-400 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-colors focus:outline-none"
                    title="Mantén pulsado y arrastra para ordenar"
                >
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-slate-700 w-11 h-11 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <GripVertical size={20} />
                    </div>
                </div>
            )}

            {/* Image Section */}
            <div className="aspect-square bg-slate-50 dark:bg-slate-900/50 relative w-full border-b border-slate-100 dark:border-slate-700/50 overflow-hidden">
                {p.image ? (
                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={p.name} />
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600 transition-transform duration-700 group-hover:scale-110">
                        <Box size={40} strokeWidth={1.5} />
                    </div>
                )}

                <div className="absolute top-4 left-4 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-white/40 dark:border-slate-600/50">
                        {p.category}
                    </span>
                </div>
            </div>

            {/* Content & Clean Actions */}
            <div className="p-4 flex-1 flex flex-col bg-white dark:bg-slate-800 z-30">
                <h3 className="font-semibold text-sm md:text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-5 flex-1">
                    {p.name}
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-sm transition-all"
                    >
                        <Edit size={16} /> <span className="inline">Editar</span>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(p.id); }}
                        className="w-11 h-11 flex shrink-0 items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl transition-all"
                        title="Borrar"
                    >
                        <Trash size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const processImage = (file) => new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) return reject(new Error("No es un archivo de imagen"));
    const reader = new FileReader();
    reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const max_size = 800; let w = image.width; let h = image.height;
            if (w > h) { if (w > max_size) { h *= max_size / w; w = max_size; } } else { if (h > max_size) { w *= max_size / h; h = max_size; } }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(image, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        }
        image.onerror = () => reject(new Error("Error imagen"));
        image.src = ev.target.result;
    }
    reader.readAsDataURL(file);
});

const ProductManager = ({ products, setProducts, categories, setCategories, className, canCreate, onLimitReached }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [newExtra, setNewExtra] = useState({ name: '', type: 'fixed', value: 0 });
    const [newOption, setNewOption] = useState({ name: '', value: 0, type: 'fixed' });
    const [tempOptionsList, setTempOptionsList] = useState([]);
    const [editingExtraId, setEditingExtraId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [showCatManager, setShowCatManager] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const toast = useToast();

    const handleCreateNew = () => {
        if (!canCreate) {
            if (onLimitReached) onLimitReached();
            return;
        }
        setCurrentProduct({ id: Date.now().toString(), name: '', category: categories[0] || 'General', image: null, priceType: 'matrix', unitPrice: 0, marginType: 'percent', marginValue: 0, matrix: { widths: [600, 1000, 1400], heights: [600, 1000, 1400], prices: [[100, 150, 200], [150, 200, 250], [200, 250, 300]] }, extras: [] }); setIsEditing(true); setEditingExtraId(null); setNewExtra({ name: '', type: 'fixed', value: 0 }); setTempOptionsList([]);
    };
    const handleEdit = (p) => { const pr = JSON.parse(JSON.stringify(p)); if (!pr.extras) pr.extras = []; setCurrentProduct(pr); setIsEditing(true); setEditingExtraId(null); setNewExtra({ name: '', type: 'fixed', value: 0 }); setTempOptionsList([]); };
    const handleSave = () => { if (!currentProduct.name) return toast("Nombre obligatorio", "error"); setProducts(prev => { const idx = prev.findIndex(p => p.id === currentProduct.id); return idx >= 0 ? prev.map((x, i) => i === idx ? currentProduct : x) : [...prev, currentProduct]; }); setIsEditing(false); toast("Producto guardado", "success"); };
    const handleImage = async (e) => { try { const b64 = await processImage(e.target.files[0]); setCurrentProduct({ ...currentProduct, image: b64 }); } catch (err) { toast(err.message, "error"); } };
    const addCategory = () => { if (newCatName && !categories.includes(newCatName)) { setCategories([...categories, newCatName]); setCurrentProduct({ ...currentProduct, category: newCatName }); setNewCatName(''); } };
    const saveExtra = () => { if (!newExtra.name) return; const extraData = { ...newExtra, id: editingExtraId || Date.now(), optionsList: tempOptionsList }; setCurrentProduct({ ...currentProduct, extras: editingExtraId ? currentProduct.extras.map(e => e.id === editingExtraId ? extraData : e) : [...currentProduct.extras, extraData] }); setEditingExtraId(null); setNewExtra({ name: '', type: 'fixed', value: 0 }); setTempOptionsList([]); };
    const moveProduct = (idx, dir) => { if ((dir === -1 && idx === 0) || (dir === 1 && idx === products.length - 1)) return; const n = [...products];[n[idx], n[idx + dir]] = [n[idx + dir], n[idx]]; setProducts(n); };
    const moveCategory = (idx, dir) => { if ((dir === -1 && idx === 0) || (dir === 1 && idx === categories.length - 1)) return; const n = [...categories];[n[idx], n[idx + dir]] = [n[idx + dir], n[idx]]; setCategories(n); };
    const filteredProducts = filterCategory === 'Todas' ? products : products.filter(p => p.category === filterCategory);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setProducts((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const confirmDelete = (id) => {
        if (confirm("¿Seguro que deseas borrar este producto?")) {
            setProducts(products.filter(x => x.id !== id));
        }
    };

    if (isEditing) return (
        <div key="editor-mode" className={`p-4 md:p-8 max-w-6xl mx-auto ${className} animate-fade-in app-tab overflow-y-auto h-full`}>
            {/* ... content ... */}
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50 dark:bg-slate-900 z-20 py-2"><h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Editor de Producto</h2><div className="flex gap-3"><button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button><button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"><Save size={18} /> Guardar Cambios</button></div></div>
            <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 block">Nombre del Producto</label><input className="w-full p-3 border dark:border-slate-700 rounded-xl font-bold text-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} /></div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 block">Categoría</label>
                            <div className="flex gap-2">
                                <select className="w-full p-4 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-slate-100 outline-none" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={() => setShowCatManager(!showCatManager)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 p-4 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Nueva Categoría">
                                    <Plus size={20} />
                                </button>
                            </div>
                            {showCatManager && (
                                <div className="mt-2 flex gap-2 animate-fade-in-down">
                                    <input autoFocus placeholder="Nombre nueva categoría..." className="flex-1 p-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 outline-none text-sm" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addCategory(); setShowCatManager(false); } }} />
                                    <button onClick={() => { addCategory(); setShowCatManager(false); }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Áñadir</button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-2 border-dashed dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 transition-colors text-center cursor-pointer relative group"><input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer z-10" />{currentProduct.image ? <img src={currentProduct.image} className="h-40 w-full object-contain rounded-lg" /> : <div className="py-8 text-slate-400 dark:text-slate-500"><Box size={32} className="mx-auto mb-2" /><p className="text-xs">Arrastra o clica para subir imagen</p></div>}</div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 block">Tipo de Precio</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'matrix' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'matrix' ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Matriz (m²)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'unit' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'unit' ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Unitario (Und)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'simple_area' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'simple_area' ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Metro (m²)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'simple_linear' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'simple_linear' ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Metro (ml)</button></div></div>

                        {/* MARGIN SECTION */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/40">
                            <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 block flex items-center gap-1"><Percent size={12} /> Margen Comercial (Beneficio)</label>
                            <div className="flex gap-2">
                                <div className="flex rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 overflow-hidden shrink-0">
                                    <button onClick={() => setCurrentProduct({ ...currentProduct, marginType: 'percent' })} className={`px-2 py-1 text-xs font-bold transition-colors ${currentProduct.marginType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>%</button>
                                    <button onClick={() => setCurrentProduct({ ...currentProduct, marginType: 'fixed' })} className={`px-2 py-1 text-xs font-bold transition-colors ${currentProduct.marginType === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>€</button>
                                </div>
                                <input type="number" className="w-full p-2 text-sm outline-none bg-white dark:bg-slate-800 dark:text-slate-100 border dark:border-slate-700 rounded-lg" placeholder="0" value={currentProduct.marginValue} onChange={e => setCurrentProduct({ ...currentProduct, marginValue: e.target.value })} />
                            </div>
                            <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1 italic">Se añade al coste base + extras</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"><div className="flex items-center gap-2 mb-2"><Wand size={16} className="text-purple-500" /><h3 className="font-bold text-sm dark:text-slate-100">Extras y Acabados</h3></div>
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">{currentProduct.extras.map(e => (<div key={e.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg shadow-sm text-sm"><span className="font-medium dark:text-slate-200">{e.name}</span><div className="flex gap-1"><button onClick={() => { setNewExtra({ name: e.name, type: e.type, value: e.value }); setTempOptionsList(e.optionsList || []); setEditingExtraId(e.id) }} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"><Edit size={14} /></button><button onClick={() => setCurrentProduct({ ...currentProduct, extras: currentProduct.extras.filter(ex => ex.id !== e.id) })} className="text-slate-400 hover:text-red-600 p-1"><Trash size={14} /></button></div></div>))}</div>
                        <div className="p-3 bg-white dark:bg-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-600 shadow-sm"><div className="flex flex-col gap-2"><input placeholder="Nombre del extra" className="w-full p-2 border dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700" value={newExtra.name} onChange={e => setNewExtra({ ...newExtra, name: e.target.value })} /><div className="flex gap-2"><select className="w-28 p-2 border dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 dark:text-slate-200" value={newExtra.type} onChange={e => setNewExtra({ ...newExtra, type: e.target.value })}><option value="fixed">Precio (+€)</option><option value="percent">Porcen. (+%)</option><option value="linear">Por Metro (ml)</option><option value="area">Por m²</option><option value="selection">Lista Op.</option></select>{newExtra.type !== 'selection' && <input type="number" placeholder="0" className="flex-1 p-2 border dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 dark:text-slate-100" value={newExtra.value} onChange={e => setNewExtra({ ...newExtra, value: e.target.value })} />}</div>{newExtra.type === 'selection' && <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border dark:border-slate-600"><div className="flex gap-1 mb-2"><input placeholder="Opción" className="flex-1 p-1 text-xs border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-100" value={newOption.name} onChange={e => setNewOption({ ...newOption, name: e.target.value })} /><input type="number" placeholder="Val" className="w-12 p-1 text-xs border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-100" value={newOption.value} onChange={e => setNewOption({ ...newOption, value: e.target.value })} /><select className="w-20 p-1 text-xs border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-100" value={newOption.type} onChange={e => setNewOption({ ...newOption, type: e.target.value })}><option value="fixed">€</option><option value="percent">%</option><option value="linear">€/ml</option><option value="area">€/m²</option></select><button onClick={() => { if (!newOption.name) return; setTempOptionsList([...tempOptionsList, { ...newOption }]); setNewOption({ name: '', value: 0, type: 'fixed' }) }} className="bg-blue-600 text-white rounded px-2">+</button></div><div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {tempOptionsList.map((o, i) => (
                                <div key={i} className="text-xs bg-white dark:bg-slate-700 p-1.5 border dark:border-slate-600 rounded-lg flex justify-between items-center group hover:border-blue-200 dark:hover:border-blue-600 transition-colors">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{o.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                            +{o.value}{o.type === 'percent' ? '%' : (o.type === 'linear' ? '€/ml' : (o.type === 'area' ? '€/m²' : '€'))}
                                        </span>
                                        <div className="flex gap-0.5 border-l dark:border-slate-600 pl-1">
                                            <button title="Editar" onClick={() => { setNewOption({ ...o }); setTempOptionsList(tempOptionsList.filter((_, idx) => idx !== i)); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                                <Edit size={12} />
                                            </button>
                                            <button title="Borrar" onClick={() => setTempOptionsList(tempOptionsList.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div></div>}<button onClick={saveExtra} className={`w-full mt-2 py-1.5 text-xs rounded-lg font-bold flex items-center justify-center gap-2 ${editingExtraId ? 'bg-white dark:bg-slate-700 border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{editingExtraId ? 'Actualizar Extra' : 'Añadir Extra'}</button></div></div>
                    </div>
                </div>
                <div className="md:col-span-8 space-y-6"><div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 h-full flex flex-col min-h-[500px]"><h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-slate-100"><div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"><Wand size={16} /></div> Configuración de Precios</h3>{currentProduct.priceType === 'unit' ? <div className="flex-1 flex items-center justify-center flex-col"><label className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-2">PRECIO BASE UNITARIO</label><div className="flex items-center"><span className="text-4xl font-bold text-slate-300 dark:text-slate-600 mr-2">€</span><input type="number" className="text-6xl font-black border-b-2 border-slate-200 dark:border-slate-600 w-60 outline-none text-center focus:border-blue-500 transition-colors bg-transparent dark:text-slate-100" value={currentProduct.unitPrice} onChange={e => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })} /></div></div> : (['simple_area', 'simple_linear'].includes(currentProduct.priceType) ? <div className="flex-1 flex items-center justify-center flex-col"><label className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-2">PRECIO BASE POR {currentProduct.priceType === 'simple_area' ? 'METRO CUADRADO (m²)' : 'METRO LINEAL (ml)'}</label><div className="flex items-center"><span className="text-4xl font-bold text-slate-300 dark:text-slate-600 mr-2">€</span><input type="number" className="text-6xl font-black border-b-2 border-slate-200 dark:border-slate-600 w-60 outline-none text-center focus:border-blue-500 transition-colors bg-transparent dark:text-slate-100" value={currentProduct.unitPrice} onChange={e => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })} /></div></div> : <MatrixEditor matrix={currentProduct.matrix} onChange={m => setCurrentProduct({ ...currentProduct, matrix: m })} />)}</div></div>
            </div>
        </div>
    );

    return (
        <div key="list-mode" className={`p-4 md:p-8 max-w-7xl mx-auto ${className} animate-fade-in app-tab overflow-y-auto h-full`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div><h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Catálogo de Productos</h2><p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona tus precios y referencias</p></div><div className="flex w-full md:w-auto gap-3"><button onClick={() => setShowCatManager(!showCatManager)} className="flex-1 justify-center md:flex-none px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-xl flex items-center gap-2 min-h-[48px] transition-colors"><List size={18} /> Categorías</button><button onClick={handleCreateNew} className="flex-1 justify-center md:flex-none px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl shadow-lg flex items-center gap-2 min-h-[48px] transition-colors"><Plus size={18} /> <span className="whitespace-nowrap">Nuevo Producto</span></button></div></div>
            {showCatManager && <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-xl shadow-xl mb-8 animate-slide-up max-w-md ml-auto"><div className="flex gap-2 mb-4"><input className="border dark:border-slate-700 p-2 rounded flex-1 dark:bg-slate-900 dark:text-slate-100" placeholder="Nueva categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)} /><button onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Áñadir</button></div><div className="space-y-2 max-h-40 overflow-y-auto">{categories.map((c, i) => <div key={c} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><span className="font-bold text-sm dark:text-slate-200">{c}</span><div className="flex gap-1"><button onClick={() => moveCategory(i, -1)} className="text-slate-400 hover:text-blue-600 px-1">↑</button><button onClick={() => moveCategory(i, 1)} className="text-slate-400 hover:text-blue-600 px-1">↓</button><button onClick={() => confirm("Borrar?") && setCategories(categories.filter(x => x !== c))} className="text-slate-400 hover:text-red-500"><Trash size={14} /></button></div></div>)}</div></div>}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar snap-x"><button onClick={() => setFilterCategory('Todas')} className={`flex-shrink-0 snap-start h-11 flex items-center px-6 rounded-full whitespace-nowrap text-sm font-bold transition-all ${filterCategory === 'Todas' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Todas</button>{categories.map(c => (<button key={c} onClick={() => setFilterCategory(c)} className={`flex-shrink-0 snap-start h-11 flex items-center px-6 rounded-full whitespace-nowrap text-sm font-bold transition-all ${filterCategory === c ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{c}</button>))}</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredProducts.map(p => p.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                        {filteredProducts.map((p) => (
                            <SortableProductCard key={p.id} p={p} handleEdit={handleEdit} filterCategory={filterCategory} confirmDelete={confirmDelete} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default ProductManager;
