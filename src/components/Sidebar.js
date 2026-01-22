import React from 'react';
import { Home, FileText, Users, Box, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ user, activeTab, setTab, onLogout }) => {
    return (
        <aside className="w-64 glass-sidebar hidden md:flex flex-col text-slate-300 z-20 shadow-2xl h-screen">
            <div className="p-6">
                <h2 className="text-2xl font-black text-white tracking-tight">tupresulisto<span className="text-sky-500">.com</span></h2>
                <div className="mt-4 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'UD'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario Demo'}</p>
                        <p className="text-[10px] text-sky-400 font-bold tracking-wider">PLAN {user?.plan || 'FREE'}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <MenuBtn label="Panel Principal" icon={Home} active={activeTab === 'dashboard'} onClick={() => setTab('dashboard')} />
                <MenuBtn label="Presupuestos" icon={FileText} active={activeTab === 'quotes'} onClick={() => setTab('quotes')} />
                <MenuBtn label="Clientes" icon={Users} active={activeTab === 'clients'} onClick={() => setTab('clients')} />
                <MenuBtn label="Catálogo / Stock" icon={Box} active={activeTab === 'products'} onClick={() => setTab('products')} />
            </nav>

            <div className="p-4 border-t border-white/10">
                <MenuBtn label="Configuración" icon={Settings} active={activeTab === 'settings'} onClick={() => setTab('settings')} />
                <button onClick={onLogout} className="mt-2 w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

const MenuBtn = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <Icon size={18} />
        {label}
    </button>
);

export default Sidebar;
