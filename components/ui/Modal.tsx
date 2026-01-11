
import React, { useEffect, ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
             document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex justify-center items-end sm:items-center p-0 sm:p-4 transition-opacity duration-200"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg transform transition-all scale-100 shadow-2xl border-t sm:border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Indicador de arrastre para móviles */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

                <div className="flex justify-between items-center px-6 py-4 sm:p-6 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10 flex items-center justify-center transition-colors"
                        aria-label="Close modal"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto text-slate-600 custom-scrollbar flex-1">
                    {children}
                </div>

                {footer && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-[2.5rem] flex flex-col sm:flex-row justify-end items-center gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
