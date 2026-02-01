import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUS_STYLES, getStatusConfig } from '../../utils/statusStyles';

const StatusSelector = ({ currentStatus, onStatusChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const statusConfig = getStatusConfig(currentStatus);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`text-xs font-bold uppercase rounded py-1 px-3 border flex items-center gap-2 transition-colors ${statusConfig.className}`}
            >
                {statusConfig.label} <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-fade-in">
                    {Object.entries(STATUS_STYLES).map(([key, style]) => (
                        <button
                            key={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(key);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${style.className} border-0 rounded-none mb-0.5 last:mb-0`}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatusSelector;
