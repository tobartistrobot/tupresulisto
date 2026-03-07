'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch — only render after mount
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className={`w-9 h-9 ${className}`} />;

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
                text-slate-500 hover:text-slate-900 hover:bg-slate-100
                dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700
                ${className}`}
        >
            {isDark
                ? <Sun size={18} className="text-amber-400" />
                : <Moon size={18} />
            }
        </button>
    );
}
