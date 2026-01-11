
import React, { useState, useEffect, useCallback } from 'react';
import { View, Student, WorkingDay, AttendanceData } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Card from './ui/Card';
import Toast from './ui/Toast';

const TRIMESTER_CONFIG = {
    '1': { label: '1er Trimestre', start: { m: 2, d: 2 }, end: { m: 5, d: 8 }, color: 'from-blue-500 to-cyan-500', icon: 'fa-seedling' },
    '2': { label: '2do Trimestre', start: { m: 5, d: 11 }, end: { m: 8, d: 31 }, color: 'from-orange-400 to-pink-500', icon: 'fa-fan' },
    '3': { label: '3er Trimestre', start: { m: 9, d: 1 }, end: { m: 12, d: 2 }, color: 'from-emerald-500 to-green-600', icon: 'fa-tree' }
};

const getStatusProps = (status: string) => {
    switch (status) {
        case 'F': return { text: 'F', label: 'FALTA', className: 'bg-red-600 text-white border-red-600 shadow-md font-black', rowClass: 'bg-red-50' };
        case 'R': return { text: 'R', label: 'RETRASO', className: 'bg-yellow-400 text-white border-yellow-400 shadow-md font-black', rowClass: 'bg-yellow-50' };
        case 'L': return { text: 'L', label: 'LICENCIA', className: 'bg-blue-600 text-white border-blue-600 shadow-md font-black', rowClass: 'bg-blue-50' };
        case 'P': return { text: 'P', label: 'PRESENTE', className: 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black', rowClass: 'bg-emerald-50' };
        default: return { text: 'P', label: 'PRESENTE', className: 'bg-white text-emerald-600 border border-emerald-200 font-bold', rowClass: 'bg-white' };
    }
};

const AttendanceScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [students, setStudents] = useState<any[]>([]); // Cambiado a any[] para recibir status
    const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
    const [attendance, setAttendance] = useState<AttendanceData>({});
    const [selectedTrimester, setSelectedTrimester] = useState<string>('1');
    const [selectedMonth, setSelectedMonth] = useState<string>('2');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [currentMobileDayIndex, setCurrentMobileDayIndex] = useState(0);

    const getAvailableMonths = useCallback(() => {
        const config = (TRIMESTER_CONFIG as any)[selectedTrimester];
        const months = [];
        const monthNames = ["", "", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        for (let m = config.start.m; m <= config.end.m; m++) {
            months.push({ value: String(m), label: monthNames[m] });
        }
        return months;
    }, [selectedTrimester]);

    useEffect(() => {
        const available = getAvailableMonths();
        if (!available.find(m => m.value === selectedMonth)) {
            setSelectedMonth(available[0].value);
        }
    }, [selectedTrimester, getAvailableMonths, selectedMonth]);

    const loadData = useCallback(async (month: string) => {
        if (!selectedCourse) return;
        setIsLoading(true);
        try {
            const [studentList, monthData] = await Promise.all([
                api.getStudentsForAttendance(selectedCourse, userId), 
                api.getAttendanceMonthData(month, selectedCourse, userId)
            ]);
            
            const config = (TRIMESTER_CONFIG as any)[selectedTrimester];
            const m = parseInt(month);
            
            const filteredDays = monthData.days.filter((day: any) => {
                if (m === config.start.m && day.date < config.start.d) return false;
                if (m === config.end.m && day.date > config.end.d) return false;
                return true;
            });

            setStudents(studentList || []);
            setWorkingDays(filteredDays || []);
            setAttendance(monthData.attendance || {});
            
            const firstEnabled = filteredDays.findIndex((d: any) => d.enabled);
            setCurrentMobileDayIndex(firstEnabled !== -1 ? firstEnabled : 0);
            
        } catch (err) { console.error(err); } 
        finally { setIsLoading(false); }
    }, [selectedCourse, userId, selectedTrimester]);

    useEffect(() => { loadData(selectedMonth); }, [selectedMonth, loadData]);

    const handleSave = async () => {
        if (!selectedCourse) return;
        setIsProcessing(true);
        try {
            const enabledDaysArray = workingDays.filter(d => d.enabled).map(d => d.date);
            const result = await api.saveAttendanceData(selectedMonth, attendance, enabledDaysArray, selectedCourse, userId);
            if (result === 'OK') {
                setToast({ show: true, message: '¡Asistencia guardada con éxito!' });
                await loadData(selectedMonth);
            }
        } catch (e) { alert('Error al guardar'); } 
        finally { setIsProcessing(false); }
    };

    const handleToggleAttendance = (studentId: number, date: number) => {
        const key = `${studentId}-${date}`;
        const statuses = ['P', 'F', 'R', 'L'];
        const current = attendance[key] || 'P';
        const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
        setAttendance(prev => ({ ...prev, [key]: next }));
    };

    const enabledDays = workingDays.filter(d => d.enabled).sort((a, b) => a.date - b.date);
    const currentConfig = (TRIMESTER_CONFIG as any)[selectedTrimester];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans h-screen overflow-hidden">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            <Header title="Control de Asistencia" icon={<i className="fas fa-calendar-check"></i>}>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="success" isLoading={isProcessing} className="shadow-md text-xs px-6"><i className="fas fa-save mr-2"></i>GUARDAR</Button>
                    <Button onClick={() => setView(View.CourseManagement)} className="!bg-slate-700 flex items-center gap-3 border-b-4 border-slate-900 shadow-lg px-5 active:translate-y-1 active:border-b-0 transition-all">
                        <i className="fas fa-arrow-left text-white text-lg"></i>
                        <span className="text-white font-black text-xs hidden sm:inline uppercase">Atrás</span>
                    </Button>
                </div>
            </Header>

            <main className="w-full flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(TRIMESTER_CONFIG).map(([key, config]) => (
                        <button 
                            key={key}
                            onClick={() => setSelectedTrimester(key)}
                            className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedTrimester === key ? `bg-gradient-to-br ${config.color} text-white border-white/20 shadow-xl scale-[1.02]` : 'bg-white border-slate-200 text-slate-400 opacity-60'}`}
                        >
                            <i className={`fas ${config.icon} text-2xl mb-1`}></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                            <div className="absolute -bottom-2 -right-2 text-4xl opacity-10"><i className={`fas ${config.icon}`}></i></div>
                        </button>
                    ))}
                </div>

                <Card className="flex flex-col gap-4 mb-4 border-l-4 border-emerald-600 shadow-md flex-shrink-0 !p-4 bg-white">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentConfig.color} flex flex-col items-center justify-center text-white shadow-lg`}>
                                <span className="text-xs font-black">{selectedTrimester}°</span>
                                <span className="text-[8px] font-bold uppercase">Trim</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase leading-none">{selectedCourse}</h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Periodo: {getAvailableMonths()[0].label} - {getAvailableMonths().slice(-1)[0].label}</p>
                            </div>
                        </div>
                        <div className="w-full sm:w-48">
                            <select 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(e.target.value)} 
                                className="w-full bg-slate-100 border-2 border-slate-200 text-slate-800 font-black p-3 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                            >
                                {getAvailableMonths().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {workingDays.map(day => (
                                <button 
                                    key={day.date} 
                                    onClick={() => setWorkingDays(prev => prev.map(d => d.date === day.date ? {...d, enabled: !d.enabled} : d))} 
                                    className={`flex-shrink-0 w-10 h-14 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${day.enabled ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 opacity-40'}`}
                                >
                                    <span className="text-[8px] font-black uppercase mb-1">{day.label.split(' ')[0]}</span>
                                    <span className="text-lg font-black leading-none">{day.date}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-slate-100">
                        <div className="loader-circle mb-4"></div>
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Sincronizando rango de fechas...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto rounded-3xl border-2 border-slate-200 shadow-inner bg-white">
                        <table className="neo-table w-full border-separate border-spacing-0">
                            <thead className="sticky top-0 z-50">
                                <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                                    <th className="sticky left-0 bg-slate-100 w-12 text-center border-b-2 border-r-2 border-slate-200 py-3">#</th>
                                    <th className="sticky left-12 bg-slate-100 text-left pl-4 min-w-[280px] border-b-2 border-r-2 border-slate-200">Estudiante</th>
                                    {enabledDays.map(d => (
                                        <th key={d.date} className="text-center w-12 border-b-2 border-r border-slate-200 bg-emerald-50/50 text-emerald-800">
                                            <div className="flex flex-col items-center py-1">
                                                <span className="text-[8px] opacity-60">{d.label.split(' ')[0]}</span>
                                                <span className="text-sm">{d.date}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => {
                                    const isWithdrawn = s.status === 'WITHDRAWN';
                                    return (
                                        <tr key={s.id} className={`transition-colors ${isWithdrawn ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                                            <td className={`sticky left-0 group-hover:bg-slate-50 text-center font-bold text-slate-400 text-[10px] border-r-2 border-b border-slate-100 ${isWithdrawn ? 'bg-red-50/30' : 'bg-white'}`}>{idx+1}</td>
                                            <td className={`sticky left-12 font-black text-slate-700 text-[11px] uppercase border-r-2 border-b border-slate-100 px-4 py-2 truncate ${isWithdrawn ? 'bg-red-50/30 text-red-400 italic' : 'bg-white'}`}>
                                                {s.name}
                                                {isWithdrawn && <span className="ml-2 px-1 rounded bg-red-100 text-red-600 text-[8px] font-black">RETIRADO</span>}
                                            </td>
                                            {enabledDays.map(d => {
                                                const { text, className } = getStatusProps(attendance[`${s.id}-${d.date}`]);
                                                return (
                                                    <td key={d.date} className="text-center border-r border-b border-slate-100 p-1">
                                                        {isWithdrawn ? (
                                                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-red-100 flex items-center justify-center text-[10px] text-red-200 font-black mx-auto">R</div>
                                                        ) : (
                                                            <button onClick={() => handleToggleAttendance(s.id, d.date)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all mx-auto ${className}`}>{text}</button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};
export default AttendanceScreen;
