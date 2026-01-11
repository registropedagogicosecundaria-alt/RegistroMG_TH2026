
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScheduleEntry } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Toast from './ui/Toast';

const DAYS = [
    { id: 1, name: 'LUNES', short: 'LUN' },
    { id: 2, name: 'MARTES', short: 'MAR' },
    { id: 3, name: 'MIÉRCOLES', short: 'MIE' },
    { id: 4, name: 'JUEVES', short: 'JUE' },
    { id: 5, name: 'VIERNES', short: 'VIE' }
];

const ScheduleScreen: React.FC<{ setView: (v: View) => void, userId: string }> = ({ setView, userId }) => {
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
    const [courses, setCourses] = useState<string[]>([]);
    const [activeMobileDay, setActiveMobileDay] = useState(new Date().getDay() || 1);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [scheduleData, courseList] = await Promise.all([
                api.getScheduleData(userId),
                api.getCourses(userId)
            ]);
            setSchedule(scheduleData || []);
            setCourses(courseList || []);
        } catch (err) { 
            console.error("Error reloading schedule:", err); 
        } finally { 
            setIsLoading(false); 
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (entry?: ScheduleEntry) => {
        setEditingEntry(entry || {
            teacher_id: userId,
            day_of_week: activeMobileDay > 5 ? 1 : activeMobileDay,
            start_time: '08:00',
            end_time: '08:45',
            course_label: '',
            subject: ''
        });
        setIsModalOpen(true);
    };

    const handleSaveEntry = async () => {
        if (!editingEntry) return;
        
        if (!editingEntry.subject || editingEntry.subject.trim() === "") {
            alert("Debe ingresar el nombre de la materia.");
            return;
        }
        if (!editingEntry.course_label || editingEntry.course_label === "") {
            alert("Debe seleccionar un curso.");
            return;
        }

        const payload = { ...editingEntry, teacher_id: userId };

        setIsProcessing(true);
        try {
            const res = await api.saveScheduleEntry(payload);
            if (res === 'OK') {
                setToast({ show: true, message: '¡Horario actualizado!' });
                setIsModalOpen(false);
                setEditingEntry(null);
                await fetchData();
            } else {
                alert("Error de Seguridad/Base de Datos: " + res);
            }
        } catch (e: any) { 
            alert('Error crítico de red: ' + (e.message || 'Desconocido')); 
        } finally { 
            setIsProcessing(false); 
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (window.confirm('¿Desea eliminar este bloque de clases definitivamente?')) {
            setIsProcessing(true);
            try {
                const res = await api.deleteScheduleEntry(id);
                if (res === 'OK') {
                    setToast({ show: true, message: 'Registro eliminado.' });
                    await fetchData();
                } else {
                    alert("No se pudo eliminar: " + res);
                }
            } finally { 
                setIsProcessing(false); 
            }
        }
    };

    const renderDayColumn = (dayId: number) => {
        const dayEntries = schedule
            .filter(e => e.day_of_week === dayId)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
            <div className="flex flex-col gap-3 h-full">
                {dayEntries.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] h-48 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 p-6">
                        <i className="fas fa-calendar-minus text-3xl mb-2 opacity-20"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Sin actividades para hoy</span>
                    </div>
                ) : (
                    dayEntries.map(entry => (
                        <div 
                            key={entry.id} 
                            className="group relative bg-white border-2 border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer entry-card active:scale-[0.98]" 
                            onClick={() => handleOpenModal(entry)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest time-badge">
                                    <i className="far fa-clock mr-1.5"></i> {entry.start_time} - {entry.end_time}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id!); }} 
                                    className="text-red-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase leading-tight mb-2">{entry.subject || 'MATERIA'}</h4>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                    <i className="fas fa-users"></i>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{entry.course_label || 'CURSO'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
            <style>{`
                .custom-tabs::-webkit-scrollbar { display: none; }
                .custom-tabs { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            
            <Header title="Gestión Horario" icon={<i className="fas fa-clock"></i>}>
                <div className="flex items-center gap-1.5">
                    <Button onClick={() => handleOpenModal()} variant="primary" className="!rounded-xl shadow-lg !px-4 sm:!px-6 !py-2.5">
                        <i className="fas fa-plus sm:mr-2"></i>
                        <span className="hidden sm:inline text-xs font-black uppercase">Nuevo Bloque</span>
                    </Button>
                    <Button onClick={() => setView(View.Menu)} variant="secondary" className="!rounded-xl shadow-lg !px-4 !py-2.5">
                        <i className="fas fa-chevron-left"></i>
                    </Button>
                </div>
            </Header>

            {/* Selector de Días para Móvil */}
            <div className="lg:hidden bg-white border-b border-slate-200 p-2 sticky top-14 z-30">
                <div className="flex gap-2 overflow-x-auto custom-tabs px-2">
                    {DAYS.map(day => (
                        <button 
                            key={day.id}
                            onClick={() => setActiveMobileDay(day.id)}
                            className={`flex-shrink-0 px-5 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${activeMobileDay === day.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-slate-50 text-slate-400'}`}
                        >
                            {day.short}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
                <div className="max-w-[100%] mx-auto">
                    {/* Vista Desktop */}
                    <div className="hidden lg:block bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl overflow-hidden">
                        <div className="grid grid-cols-5 bg-slate-900 text-white">
                            {DAYS.map(day => (
                                <div key={day.id} className="p-5 text-center border-r border-slate-800 last:border-0">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">{day.name}</h2>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 p-6 gap-6 bg-slate-50/30 min-h-[600px]">
                            {DAYS.map(day => (
                                <div key={day.id} className="h-full">
                                    {renderDayColumn(day.id)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vista Móvil */}
                    <div className="lg:hidden">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {DAYS.find(d => d.id === activeMobileDay)?.name}
                            </h2>
                        </div>
                        {renderDayColumn(activeMobileDay)}
                    </div>

                    <div className="mt-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[1em] px-4 leading-relaxed">
                        Edite los bloques aquí. Para imprimir use Reportes Pro.
                    </div>
                </div>
            </main>

            {isModalOpen && editingEntry && (
                <Modal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    title={
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                                <i className="fas fa-calendar-plus text-lg"></i>
                            </div>
                            <span className="text-lg">Configurar Horario</span>
                        </div>
                    }
                    footer={
                        <div className="flex gap-2 w-full">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 !rounded-2xl !py-4">CERRAR</Button>
                            <Button variant="primary" onClick={handleSaveEntry} isLoading={isProcessing} className="flex-[2] !rounded-2xl !py-4">GUARDAR</Button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Día</label>
                                <div className="relative">
                                    <select 
                                        value={editingEntry.day_of_week} 
                                        onChange={e => setEditingEntry({...editingEntry, day_of_week: parseInt(e.target.value)})}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none transition-all shadow-sm"
                                    >
                                        {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curso</label>
                                <div className="relative">
                                    <select 
                                        value={editingEntry.course_label} 
                                        onChange={e => setEditingEntry({...editingEntry, course_label: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none transition-all shadow-sm"
                                    >
                                        <option value="">-- ELIJA --</option>
                                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materia</label>
                            <Input 
                                value={editingEntry.subject} 
                                onChange={e => setEditingEntry({...editingEntry, subject: e.target.value.toUpperCase()})}
                                placeholder="EJ: FÍSICA - QUÍMICA"
                                icon={<i className="fas fa-book"></i>}
                                className="!py-4 !rounded-2xl !bg-slate-50 !border-slate-200 !font-black !text-base"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                                <Input 
                                    type="time"
                                    value={editingEntry.start_time} 
                                    onChange={e => setEditingEntry({...editingEntry, start_time: e.target.value})}
                                    className="!py-4 !bg-slate-50 !border-slate-200 !font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                                <Input 
                                    type="time"
                                    value={editingEntry.end_time} 
                                    onChange={e => setEditingEntry({...editingEntry, end_time: e.target.value})}
                                    className="!py-4 !bg-slate-50 !border-slate-200 !font-bold"
                                />
                            </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-start gap-4">
                            <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                            <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                                Los cambios se verán reflejados inmediatamente en sus reportes pro de horario.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ScheduleScreen;
