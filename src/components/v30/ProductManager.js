'use client';
import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Box, Edit, Trash, Save, Plus, Percent, Wand, ArrowLeft, ArrowRight, List } from 'lucide-react';
import MatrixEditor from './MatrixEditor';

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

    if (isEditing) return (
        <div key="editor-mode" className={`p-4 md:p-8 max-w-6xl mx-auto ${className} animate-fade-in app-tab overflow-y-auto h-full`}>
            {/* ... content ... */}
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50 z-20 py-2"><h2 className="text-3xl font-black text-slate-800">Editor de Producto</h2><div className="flex gap-3"><button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button><button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"><Save size={18} /> Guardar Cambios</button></div></div>
            <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre del Producto</label><input className="w-full p-3 border rounded-xl font-bold text-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} /></div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Categoría</label>
                            <div className="flex gap-2">
                                <select className="w-full p-4 border rounded-xl bg-slate-50 outline-none" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={() => setShowCatManager(!showCatManager)} className="bg-blue-50 text-blue-600 border border-blue-100 p-4 rounded-xl hover:bg-blue-100 transition-colors" title="Nueva Categoría">
                                    <Plus size={20} />
                                </button>
                            </div>
                            {showCatManager && (
                                <div className="mt-2 flex gap-2 animate-fade-in-down">
                                    <input autoFocus placeholder="Nombre nueva categoría..." className="flex-1 p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addCategory(); setShowCatManager(false); } }} />
                                    <button onClick={() => { addCategory(); setShowCatManager(false); }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Añadir</button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 hover:bg-white transition-colors text-center cursor-pointer relative group"><input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer z-10" />{currentProduct.image ? <img src={currentProduct.image} className="h-40 w-full object-contain rounded-lg" /> : <div className="py-8 text-slate-400"><Box size={32} className="mx-auto mb-2" /><p className="text-xs">Arrastra o clica para subir imagen</p></div>}</div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Tipo de Precio</label><div className="grid grid-cols-2 gap-3"><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'matrix' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'matrix' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Matriz (m²)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'unit' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'unit' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Unitario (Und)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'simple_area' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'simple_area' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Metro (m²)</button><button onClick={() => setCurrentProduct({ ...currentProduct, priceType: 'simple_linear' })} className={`py-4 text-xs font-bold rounded-xl border transition-all ${currentProduct.priceType === 'simple_linear' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Metro (ml)</button></div></div>

                        {/* MARGIN SECTION ADDED HERE */}
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <label className="text-[10px] font-black uppercase text-blue-600 mb-2 block flex items-center gap-1"><Percent size={12} /> Margen Comercial (Beneficio)</label>
                            <div className="flex gap-2">
                                <div className="flex rounded-lg bg-white border overflow-hidden shrink-0">
                                    <button onClick={() => setCurrentProduct({ ...currentProduct, marginType: 'percent' })} className={`px-2 py-1 text-xs font-bold transition-colors ${currentProduct.marginType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>%</button>
                                    <button onClick={() => setCurrentProduct({ ...currentProduct, marginType: 'fixed' })} className={`px-2 py-1 text-xs font-bold transition-colors ${currentProduct.marginType === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>€</button>
                                </div>
                                <input type="number" className="w-full p-2 text-sm outline-none bg-white border rounded-lg" placeholder="0" value={currentProduct.marginValue} onChange={e => setCurrentProduct({ ...currentProduct, marginValue: e.target.value })} />
                            </div>
                            <p className="text-[10px] text-blue-400 mt-1 italic">Se añade al coste base + extras</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2 mb-2"><Wand size={16} className="text-purple-500" /><h3 className="font-bold text-sm">Extras y Acabados</h3></div>
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">{currentProduct.extras.map(e => (<div key={e.id} className="flex justify-between items-center p-2.5 bg-white border rounded-lg shadow-sm text-sm"><span className="font-medium">{e.name}</span><div className="flex gap-1"><button onClick={() => { setNewExtra({ name: e.name, type: e.type, value: e.value }); setTempOptionsList(e.optionsList || []); setEditingExtraId(e.id) }} className="text-slate-400 hover:text-blue-600 p-1"><Edit size={14} /></button><button onClick={() => setCurrentProduct({ ...currentProduct, extras: currentProduct.extras.filter(ex => ex.id !== e.id) })} className="text-slate-400 hover:text-red-600 p-1"><Trash size={14} /></button></div></div>))}</div>
                        <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm"><div className="flex flex-col gap-2"><input placeholder="Nombre del extra" className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white" value={newExtra.name} onChange={e => setNewExtra({ ...newExtra, name: e.target.value })} /><div className="flex gap-2"><select className="w-28 p-2 border rounded-lg text-xs bg-slate-50" value={newExtra.type} onChange={e => setNewExtra({ ...newExtra, type: e.target.value })}><option value="fixed">Precio (+€)</option><option value="percent">Porcen. (+%)</option><option value="linear">Por Metro (ml)</option><option value="area">Por m²</option><option value="selection">Lista Op.</option></select>{newExtra.type !== 'selection' && <input type="number" placeholder="0" className="flex-1 p-2 border rounded-lg text-sm bg-slate-50" value={newExtra.value} onChange={e => setNewExtra({ ...newExtra, value: e.target.value })} />}</div>{newExtra.type === 'selection' && <div className="bg-slate-50 p-2 rounded border"><div className="flex gap-1 mb-2"><input placeholder="Opción" className="flex-1 p-1 text-xs border rounded" value={newOption.name} onChange={e => setNewOption({ ...newOption, name: e.target.value })} /><input type="number" placeholder="Val" className="w-12 p-1 text-xs border rounded" value={newOption.value} onChange={e => setNewOption({ ...newOption, value: e.target.value })} /><select className="w-20 p-1 text-xs border rounded" value={newOption.type} onChange={e => setNewOption({ ...newOption, type: e.target.value })}><option value="fixed">€</option><option value="percent">%</option><option value="linear">€/ml</option><option value="area">€/m²</option></select><button onClick={() => { if (!newOption.name) return; setTempOptionsList([...tempOptionsList, { ...newOption }]); setNewOption({ name: '', value: 0, type: 'fixed' }) }} className="bg-blue-600 text-white rounded px-2">+</button></div><div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {tempOptionsList.map((o, i) => (
                                <div key={i} className="text-xs bg-white p-1.5 border rounded-lg flex justify-between items-center group hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="font-semibold text-slate-700">{o.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                            +{o.value}{o.type === 'percent' ? '%' : (o.type === 'linear' ? '€/ml' : (o.type === 'area' ? '€/m²' : '€'))}
                                        </span>
                                        <div className="flex gap-0.5 border-l pl-1">
                                            <button title="Editar" onClick={() => { setNewOption({ ...o }); setTempOptionsList(tempOptionsList.filter((_, idx) => idx !== i)); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit size={12} />
                                            </button>
                                            <button title="Borrar" onClick={() => setTempOptionsList(tempOptionsList.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div></div>}<button onClick={saveExtra} className={`w-full mt-2 py-1.5 text-xs rounded-lg font-bold flex items-center justify-center gap-2 ${editingExtraId ? 'bg-white border hover:bg-slate-50 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{editingExtraId ? 'Actualizar Extra' : 'Añadir Extra'}</button></div></div>
                    </div>
                </div>
                <div className="md:col-span-8 space-y-6"><div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full flex flex-col min-h-[500px]"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><div className="p-1 bg-blue-100 rounded text-blue-600"><Wand size={16} /></div> Configuración de Precios</h3>{currentProduct.priceType === 'unit' ? <div className="flex-1 flex items-center justify-center flex-col"><label className="text-sm font-bold text-slate-400 mb-2">PRECIO BASE UNITARIO</label><div className="flex items-center"><span className="text-4xl font-bold text-slate-300 mr-2">€</span><input type="number" className="text-6xl font-black border-b-2 border-slate-200 w-60 outline-none text-center focus:border-blue-500 transition-colors" value={currentProduct.unitPrice} onChange={e => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })} /></div></div> : (['simple_area', 'simple_linear'].includes(currentProduct.priceType) ? <div className="flex-1 flex items-center justify-center flex-col"><label className="text-sm font-bold text-slate-400 mb-2">PRECIO BASE POR {currentProduct.priceType === 'simple_area' ? 'METRO CUADRADO (m²)' : 'METRO LINEAL (ml)'}</label><div className="flex items-center"><span className="text-4xl font-bold text-slate-300 mr-2">€</span><input type="number" className="text-6xl font-black border-b-2 border-slate-200 w-60 outline-none text-center focus:border-blue-500 transition-colors" value={currentProduct.unitPrice} onChange={e => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })} /></div></div> : <MatrixEditor matrix={currentProduct.matrix} onChange={m => setCurrentProduct({ ...currentProduct, matrix: m })} />)}</div></div>
            </div>
        </div>
    );

    return (
        <div key="list-mode" className={`p-4 md:p-8 max-w-7xl mx-auto ${className} animate-fade-in app-tab overflow-y-auto h-full`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"><div><h2 className="text-3xl font-black text-slate-800">Catálogo de Productos</h2><p className="text-slate-500 text-sm">Gestiona tus precios y referencias</p></div><div className="flex gap-2"><button onClick={() => setShowCatManager(!showCatManager)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl flex items-center gap-2 min-h-[48px]"><List size={18} /> Categorías</button><button onClick={handleCreateNew} className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl shadow-lg flex items-center gap-2 min-h-[48px]"><Plus size={18} /> Nuevo Producto</button></div></div>
            {showCatManager && <div className="bg-white border p-4 rounded-xl shadow-xl mb-8 animate-slide-up max-w-md ml-auto"><div className="flex gap-2 mb-4"><input className="border p-2 rounded flex-1" placeholder="Nueva categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)} /><button onClick={addCategory} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Añadir</button></div><div className="space-y-2 max-h-40 overflow-y-auto">{categories.map((c, i) => <div key={c} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100"><span className="font-bold text-sm">{c}</span><div className="flex gap-1"><button onClick={() => moveCategory(i, -1)} className="text-slate-400 hover:text-blue-600 px-1">↑</button><button onClick={() => moveCategory(i, 1)} className="text-slate-400 hover:text-blue-600 px-1">↓</button><button onClick={() => confirm("Borrar?") && setCategories(categories.filter(x => x !== c))} className="text-slate-400 hover:text-red-500"><Trash size={14} /></button></div></div>)}</div></div>}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar"><button onClick={() => setFilterCategory('Todas')} className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${filterCategory === 'Todas' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>Todas</button>{categories.map(c => (<button key={c} onClick={() => setFilterCategory(c)} className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${filterCategory === c ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>{c}</button>))}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">{filteredProducts.map((p, i) => (<div key={p.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col"><div className="aspect-square bg-slate-50 relative w-full border-b border-slate-100">{p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Box size={40} /></div>}<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur p-1 rounded-lg shadow-sm"><button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button><button onClick={() => { if (confirm("¿Borrar?")) setProducts(products.filter(x => x.id !== p.id)) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash size={16} /></button></div></div><div className="p-4 flex-1 flex flex-col"><h3 className="font-bold text-sm leading-tight mb-auto">{p.name}</h3><div className="mt-2 flex justify-between items-end"><span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{p.category}</span><div className="flex gap-1 opacity-20 group-hover:opacity-100"><button onClick={() => moveProduct(i, -1)} className="text-xs font-bold hover:text-blue-600">←</button><button onClick={() => moveProduct(i, 1)} className="text-xs font-bold hover:text-blue-600">→</button></div></div></div></div>))}</div>
        </div>
    );
};

export default ProductManager;
