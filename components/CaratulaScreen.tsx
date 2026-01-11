
import { useState, useEffect, useCallback } from 'react';
import { View } from '../types';
import * as api from '../services/googleAppsScript';
import Button from './ui/Button';
import Toast from './ui/Toast';

// Mapeo exacto según el orden visual solicitado y la estructura de la base de datos
const fieldMapping = [
    'departamento', 'distrito', 
    'red', 'sie', 
    'telefono', 'gestion', 
    'unidad', 'distrital', 
    'director', 'profesor', 
    'asignatura'
];

const fieldLabels: Record<string, string> = {
    departamento: 'Departamento', 
    distrito: 'Distrito Educativo', 
    red: 'Red',
    sie: 'Código SIE', 
    telefono: 'Teléfono', 
    gestion: 'Gestión',
    unidad: 'Unidad Educativa', 
    distrital: 'Director/a Distrital', 
    director: 'Director/a U.E.', 
    profesor: 'Profesor/a',
    asignatura: 'Asignatura',
};

// Campos que el usuario puede editar en esta pantalla
const editableFields = ['departamento', 'distrito', 'red', 'sie', 'unidad', 'distrital', 'director'];
// Campos de solo lectura (Bloqueados: Profesor, Teléfono, Gestión y Asignatura/Computación)
const readonlyFields = ['profesor', 'telefono', 'asignatura', 'gestion'];

const CaratulaScreen: React.FC<{ setView: (view: View) => void, userId: string }> = ({ setView, userId }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.getCaratulaData(userId);
            if (response && response.datos) {
                const dataArray = response.datos.split(",");
                const newData: Record<string, string> = {};
                // Mapear los datos según el orden definido en el service
                fieldMapping.forEach((field, index) => { 
                    newData[field] = (dataArray[index] || '').trim(); 
                });
                setFormData(newData);
            }
        } catch (err: any) { 
            setError(err.message || 'Error al cargar datos.'); 
        } finally { 
            setIsLoading(false); 
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value.toUpperCase() }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            // Solo enviamos los campos editables para procesar, aunque el service maneja el mapeo
            const result = await api.saveCaratulaData(formData, userId);
            if (result !== 'OK') throw new Error(result);
            setToast({ show: true, message: 'Información institucional guardada.' });
        } catch (err: any) { 
            setError(err.message || 'Error al guardar.'); 
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white font-sans overflow-hidden">
            <Toast 
                isVisible={toast.show} 
                message={toast.message} 
                onClose={() => setToast({ ...toast, show: false })} 
            />

            {/* --- PANEL IZQUIERDO: ESTÉTICA --- */}
            <div className="w-full lg:w-[320px] xl:w-[350px] bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6 lg:p-10 flex flex-col justify-between relative shadow-2xl z-10">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                     <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                     <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-300 rounded-full mix-blend-overlay filter blur-2xl"></div>
                </div>

                <div className="relative z-10">
                    <button 
                        onClick={() => setView(View.Menu)} 
                        className="group flex items-center gap-3 text-white/80 hover:text-white transition-all mb-8 lg:mb-12 hover:-translate-x-1"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20">
                            <i className="fas fa-arrow-left text-sm"></i>
                        </div>
                        <span className="font-bold tracking-wide uppercase text-xs">Volver al Menú</span>
                    </button>
                    <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-3 tracking-tight">Datos<br/>Institucionales</h1>
                    <p className="text-blue-100 text-sm lg:text-base font-medium leading-relaxed">
                        Configure la información de su unidad educativa. Los campos con candado están protegidos y vinculados a su perfil.
                    </p>
                </div>

                <div className="relative z-10 mt-8 lg:mt-0 hidden sm:block">
                    <div className="text-8xl text-white/10 absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 rotate-12 pointer-events-none">
                        <i className="fas fa-school"></i>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {isLoading ? 'Sincronizando...' : 'Conectado'}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- PANEL DERECHO: FORMULARIO --- */}
            <div className="flex-1 bg-white relative overflow-hidden flex flex-col items-center justify-center">
                <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar flex flex-col items-center">
                    <div className="w-full max-w-5xl">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                                <div className="flex flex-col items-center">
                                    <div className="loader-circle mb-4 !w-10 !h-10 !border-4"></div>
                                    <span className="font-bold text-slate-500 text-sm">Obteniendo información...</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 w-full">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg shadow-sm flex items-center gap-3">
                                    <i className="fas fa-exclamation-circle text-red-500 text-lg"></i>
                                    <span className="text-red-700 font-bold text-sm">{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full pb-10">
                                {fieldMapping.map((field) => {
                                    const label = fieldLabels[field];
                                    const isReadOnly = readonlyFields.includes(field);
                                    
                                    return (
                                        <div key={field} className={`group relative w-full ${field === 'asignatura' ? 'md:col-span-2' : ''}`}>
                                            <label 
                                                htmlFor={field} 
                                                className={`inline-block text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-t-lg mb-0 relative top-[2px] z-10 shadow-sm ${isReadOnly ? 'bg-slate-500' : 'bg-blue-600'}`}
                                            >
                                                {label}
                                            </label>
                                            
                                            {isReadOnly ? (
                                                <div className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-400 font-bold text-lg sm:text-xl cursor-not-allowed flex items-center justify-between shadow-inner h-[64px] overflow-hidden">
                                                    <span className="truncate opacity-70 italic">{formData[field] || 'NO ASIGNADO'}</span>
                                                    <i className="fas fa-lock text-slate-300 text-sm"></i>
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-[64px]">
                                                    <input
                                                        type={field === 'sie' || field === 'gestion' ? 'number' : 'text'}
                                                        id={field}
                                                        value={formData[field] || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full h-full px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 font-bold text-lg sm:text-xl placeholder-slate-300 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-0 transition-all duration-300 shadow-sm hover:border-blue-300"
                                                    />
                                                    {formData[field] && (
                                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-lg">
                                                            <i className="fas fa-check-circle"></i>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="w-full p-4 sm:p-6 bg-white border-t border-slate-100 flex justify-between items-center z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="hidden sm:block text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        * Los datos de profesor, teléfono y asignatura son gestionados por administración.
                    </div>
                    <Button 
                        onClick={handleSave} 
                        isLoading={isSaving} 
                        variant="primary" 
                        className="w-full sm:w-auto px-10 py-4 text-lg font-black rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all"
                    >
                        <i className="fas fa-save mr-2"></i> GUARDAR CAMBIOS
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CaratulaScreen;
