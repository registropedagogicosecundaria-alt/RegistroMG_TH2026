
import React, { useState, useEffect, useCallback } from 'react';
import { View, WorkingDay, AttendanceData } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Toast from './ui/Toast';

const getStatusProps = (status: string) => {
    switch (status) {
        case 'F': return { text: 'F', label: 'FALTA', color: 'text-red-500', bg: 'bg-red-500', btnClass: 'border-red-200 text-red-600 bg-red-50', tableBtn: 'bg-red-600 text-white border-red-700 shadow-[0_4px_0_rgb(185,28,28)]' };
        case 'R': return { text: 'R', label: 'RETRASO', color: 'text-amber-500', bg: 'bg-amber-500', btnClass: 'border-amber-200 text-amber-600 bg-amber-50', tableBtn: 'bg-amber-500 text-white border-amber-600 shadow-[0_4px_0_rgb(217,119,6)]' };
        case 'L': return { text: 'L', label: 'LICENCIA', color: 'text-blue-500', bg: 'bg-blue-500', btnClass: 'border-blue-200 text-blue-600 bg-blue-50', tableBtn: 'bg-blue-500 text-white border-blue-600 shadow-[0_4px_0_rgb(37,99,235)]' };
        case 'P': 
        default: return { text: 'P', label: 'PRESENTE', color: 'text-emerald-500', bg: 'bg-emerald-500', btnClass: 'border-emerald-200 text-emerald-600 bg-emerald-50', tableBtn: 'border-2 border-emerald-100 text-emerald-600 bg-white hover:bg-emerald-50' };
    }
};

const AttendanceScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [students, setStudents] = useState<any[]>([]);
    const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
    const [attendance, setAttendance] = useState<AttendanceData>({});
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    const loadData = useCallback(async (month: string) => {
        if (!selectedCourse) return;
        setIsLoading(true);
        try {
            const [studentList, monthData] = await Promise.all([
                api.getStudentsForAttendance(selectedCourse, userId), 
                api.getAttendanceMonthData(month, selectedCourse, userId)
            ]);
            
            setStudents(studentList || []);
            setWorkingDays(monthData.days || []);
            setAttendance(monthData.attendance || {});
            
            const enabledDays = monthData.days.filter((d: any) => d.enabled);
            if (enabledDays.length > 0) {
                const today = new Date().getDate();
                const todayIdx = monthData.days.findIndex((d: any) => d.date === today && d.enabled);
                setActiveDayIndex(todayIdx !== -1 ? todayIdx : monthData.days.findIndex((d: any) => d.enabled));
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsLoading(false); 
        }
    }, [selectedCourse, userId]);

    useEffect(() => { loadData(selectedMonth); }, [selectedMonth, loadData]);

    const handleSave = async () => {
        if (!selectedCourse) return;
        setIsProcessing(true);
        try {
            const enabledDaysArray = workingDays.filter(d => d.enabled).map(d => d.date);
            const result = await api.saveAttendanceData(selectedMonth, attendance, enabledDaysArray, selectedCourse, userId);
            if (result === 'OK') {
                setToast({ show: true, message: '¡Asistencia guardada correctamente!' });
                await loadData(selectedMonth);
            }
        } catch (e) { 
            alert('Error al guardar'); 
        } finally { 
            setIsProcessing(false); 
        }
    };

    const handleToggleAttendance = (studentId: number, date: number) => {
        const key = `${studentId}-${date}`;
        const statuses = ['P', 'F', 'R', 'L'];
        const current = attendance[key] || 'P';
        const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
        setAttendance(prev => ({ ...prev, [key]: next }));
    };

    const toggleDayEnabled = (date: number) => {
        setWorkingDays(prev => prev.map(d => d.date === date ? { ...d, enabled: !d.enabled } : d));
    };

    const months = [
        { v: "2", l: "Febrero" }, { v: "3", l: "Marzo" }, { v: "4", l: "Abril" },
        { v: "5", l: "Mayo" }, { v: "6", l: "Junio" }, { v: "7", l: "Julio" },
        { v: "8", l: "Agosto" }, { v: "9", l: "Septiembre" }, { v: "10", l: "Octubre" },
        { v: "11", l: "Noviembre" }, { v: "12", l: "Diciembre" }
    ];

    const activeDay = workingDays[activeDayIndex];
    const enabledDays = workingDays.filter(d => d.enabled);

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-10">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            
            <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm">
                        <i className="fas fa-calendar-alt"></i>
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Registro de Asistencia</h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="success" isLoading={isProcessing} className="!bg-[#22c55e] !border-b-[#16a34a] !px-6 !py-2.5 !rounded-xl !text-sm">
                        <i className="fas fa-save mr-2"></i> GUARDAR
                    </Button>
                    <Button onClick={() => setView(View.Menu)} variant="secondary" className="!bg-[#e2e8f0] !border-b-[#cbd5e1] !px-4 !py-2.5 !rounded-xl">
                        <i className="fas fa-arrow-left text-slate-600"></i>
                    </Button>
                </div>
            </div>

            <main className="p-4 sm:p-6 space-y-4 max-w-[100%] lg:max-w-7xl mx-auto w-full">
                
                <div className="bg-white rounded-[2rem] border-2 border-emerald-500 p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <h2 className="text-2xl font-black text-slate-900">{selectedCourse || 'SIN CURSO'}</h2>
                        <div className="w-full lg:w-48">
                            <select 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-2 font-black text-slate-800 appearance-none outline-none focus:border-blue-500 shadow-sm transition-all"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%231e293b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                            >
                                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            DÍAS LABORABLES <span className="text-slate-300 font-bold">(TOQUE PARA HABILITAR/DESHABILITAR)</span>
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {workingDays.map((day) => (
                                <button 
                                    key={day.date}
                                    onClick={() => toggleDayEnabled(day.date)}
                                    className={`flex-shrink-0 w-14 h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${day.enabled ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}
                                >
                                    <span className="text-[9px] font-black uppercase mb-0.5">{day.label.split(' ')[0]}</span>
                                    <span className="text-xl font-black leading-none">{day.date}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- VISTA PC: TABLA MENSUAL --- */}
                <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                    <th className="p-4 w-12 text-center">#</th>
                                    <th className="p-4 text-left min-w-[250px] sticky left-0 bg-slate-50 z-10">Estudiante</th>
                                    {enabledDays.map(day => (
                                        <th key={day.date} className="p-4 text-center min-w-[70px]">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-[9px] opacity-60 font-black mb-1">{day.label.split(' ')[0]}</span>
                                                <span className="text-lg text-slate-800 font-black leading-none">{day.date}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={enabledDays.length + 2} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Cargando Planilla...</td></tr>
                                ) : (
                                    students.map((student, idx) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-center font-bold text-slate-300">{idx + 1}</td>
                                            <td className="p-4 font-black text-slate-700 uppercase tracking-tight sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-50">
                                                {student.name}
                                                {student.status === 'WITHDRAWN' && <span className="ml-2 text-[8px] text-red-500 font-black">(RETIRADO)</span>}
                                            </td>
                                            {enabledDays.map(day => {
                                                const status = attendance[`${student.id}-${day.date}`] || 'P';
                                                const props = getStatusProps(status);
                                                const isWithdrawn = student.status === 'WITHDRAWN';
                                                return (
                                                    <td key={day.date} className="p-2 text-center">
                                                        <div className="flex items-center justify-center w-full">
                                                            {!isWithdrawn && (
                                                                <button 
                                                                    onClick={() => handleToggleAttendance(student.id, day.date)}
                                                                    className={`w-11 h-11 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center text-lg mx-auto ${props.tableBtn}`}
                                                                >
                                                                    {props.text}
                                                                </button>
                                                            )}
                                                            {isWithdrawn && <span className="text-slate-200 font-black">--</span>}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- VISTA CELULAR: TARJETAS + LLAMANDO LISTA --- */}
                <div className="lg:hidden space-y-4">
                    {enabledDays.length > 0 && (
                        <div className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm border border-slate-100">
                            <button 
                                onClick={() => setActiveDayIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeDayIndex === 0}
                                className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 disabled:opacity-30 active:scale-95 transition-all"
                            >
                                <i className="fas fa-chevron-left text-xl"></i>
                            </button>
                            
                            <div className="text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">LLAMANDO LISTA</span>
                                <div className="text-2xl font-black text-emerald-700 uppercase tracking-tight">
                                    {activeDay?.label || 'DÍA'}
                                </div>
                            </div>

                            <button 
                                onClick={() => setActiveDayIndex(prev => Math.min(workingDays.length - 1, prev + 1))}
                                disabled={activeDayIndex === workingDays.length - 1}
                                className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 disabled:opacity-30 active:scale-95 transition-all"
                            >
                                <i className="fas fa-chevron-right text-xl"></i>
                            </button>
                        </div>
                    )}

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center py-10 opacity-50">
                                <div className="loader-circle mb-4 !w-8 !h-8"></div>
                                <span className="text-xs font-black text-slate-400 uppercase">Cargando Estudiantes...</span>
                            </div>
                        ) : (
                            students.map((student, idx) => {
                                const currentStatus = attendance[`${student.id}-${activeDay?.date}`] || 'P';
                                const statusProps = getStatusProps(currentStatus);
                                const isWithdrawn = student.status === 'WITHDRAWN';

                                return (
                                    <div 
                                        key={student.id} 
                                        className={`bg-white rounded-[1.5rem] p-5 flex items-center gap-4 shadow-sm border border-slate-100 transition-all ${isWithdrawn ? 'opacity-50' : 'hover:border-emerald-200 active:bg-slate-50'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-md flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-[#1e293b] leading-tight truncate uppercase tracking-tight">
                                                {student.name}
                                            </h3>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${statusProps.color}`}>
                                                {isWithdrawn ? 'RETIRADO' : statusProps.label}
                                            </p>
                                        </div>

                                        {!isWithdrawn && activeDay?.enabled && (
                                            <button 
                                                onClick={() => handleToggleAttendance(student.id, activeDay.date)}
                                                className={`w-16 h-16 rounded-[1.2rem] border-2 flex items-center justify-center text-2xl font-black shadow-inner transition-all active:scale-90 ${statusProps.btnClass}`}
                                            >
                                                {statusProps.text}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="text-center pt-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                        Sincronización en la nube activa
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AttendanceScreen;
