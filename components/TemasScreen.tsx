
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, CourseTopics } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Toast from './ui/Toast';

const ROW_COLORS = [
    { border: 'border-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fas fa-rocket' },
    { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-50', icon: 'fas fa-flask' },
    { border: 'border-pink-500', text: 'text-pink-600', bg: 'bg-pink-50', icon: 'fas fa-heart' },
    { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', icon: 'fas fa-lightbulb' },
    { border: 'border-cyan-500', text: 'text-cyan-600', bg: 'bg-cyan-50', icon: 'fas fa-globe' },
    { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fas fa-leaf' },
];

const TemasScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [allCoursesData, setAllCoursesData] = useState<CourseTopics[]>([]);
    const [selectedTrimester, setSelectedTrimester] = useState('1');
    const [modifiedData, setModifiedData] = useState<Record<string, { planned: number; developed: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    const fetchData = useCallback(async () => {
        if (!selectedCourse) return;
        setIsLoading(true);
        try {
            const response = await api.getTemasData(selectedCourse, userId);
            if (response.success && Array.isArray(response.data)) {
                setAllCoursesData(response.data);
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsLoading(false); 
        }
    }, [selectedCourse, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (courseName: string, field: 'planned' | 'developed', value: string) => {
        const num = parseInt(value, 10);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        const valToSet = isNaN(num) ? 0 : num;

        setAllCoursesData(prev => prev.map(c => {
            if (c.course === courseName) {
                const key = `trimester${selectedTrimester}` as keyof CourseTopics;
                if (key === 'course') return c; // Safety check
                
                const currentData = c[key] as any;
                const newData = { ...currentData, [field]: valToSet };
                
                setModifiedData(prevM => ({ 
                    ...prevM, 
                    [courseName]: { 
                        planned: field === 'planned' ? valToSet : currentData.planned, 
                        developed: field === 'developed' ? valToSet : currentData.developed 
                    } 
                }));
                return { ...c, [key]: newData };
            }
            return c;
        }));
    };

    const handleSave = async () => {
        if (!Object.keys(modifiedData).length) return;
        setIsProcessing(true);
        try {
            const res = await api.saveTemasData(selectedTrimester, modifiedData, userId);
            if (res.success) {
                setToast({ show: true, message: 'El avance curricular se ha actualizado.' });
                setModifiedData({});
                await fetchData();
            } else {
                alert('Error al guardar: ' + res.message);
            }
        } catch (e) { 
            alert('Error de conexión'); 
        } finally { 
            setIsProcessing(false); 
        }
    };

    const stats = useMemo(() => {
        return allCoursesData.reduce((acc, curr) => {
             const key = `trimester${selectedTrimester}` as keyof CourseTopics;
             if (key === 'course') return acc;
             const data = (curr[key] as any) || { planned: 0, developed: 0 };
             acc.planned += (data.planned || 0);
             acc.developed += (data.developed || 0);
             return acc;
        }, { planned: 0, developed: 0 });
    }, [allCoursesData, selectedTrimester]);

    const globalPct = stats.planned > 0 ? Math.round((stats.developed / stats.planned) * 100) : 0;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
            
            <Header title="Avance Curricular" icon={<i className="fas fa-book-reader"></i>}>
                <div className="flex gap-2">
                    <Button onClick={handleSave} variant="success" isLoading={isProcessing} disabled={!Object.keys(modifiedData).length} className="shadow-lg shadow-green-500/30 text-xs py-2 px-4 rounded-xl border-none"><i className="fas fa-save mr-2"></i>GUARDAR CAMBIOS</Button>
                    <Button onClick={() => setView(View.Menu)} variant="secondary" className="shadow-md text-xs py-2 px-4 rounded-xl border-none"><i className="fas fa-arrow-left"></i></Button>
                </div>
            </Header>

            <main className="w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                <div className="bg-[#1e1b4b] rounded-[1.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/30 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                     <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                     <div className="relative z-10 flex flex-col xl:flex-row gap-8 xl:items-end justify-between">
                         <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3"><span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">Panel de Control</span><span className="w-1 h-1 bg-slate-500 rounded-full"></span><span><i className="far fa-calendar-alt mr-1"></i>Gestión 2024</span></div>
                             <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-6">Resumen General</h2>
                             <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1.5 backdrop-blur-md shadow-lg shadow-indigo-900/30 pr-4 max-w-full hover:bg-white/10 transition-colors group">
                                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"><span className="text-lg font-black leading-none text-white">{selectedTrimester}°</span><span className="text-[8px] font-bold uppercase text-pink-100">Trim</span></div>
                                  <div className="ml-3 flex flex-col justify-center min-w-0">
                                      <label className="text-[9px] font-bold text-pink-300 uppercase tracking-widest mb-0.5">Trabajando en:</label>
                                      <div className="relative"><select value={selectedTrimester} onChange={e => setSelectedTrimester(e.target.value)} className="bg-transparent text-lg sm:text-xl font-black uppercase text-white outline-none cursor-pointer appearance-none w-full pr-6 hover:text-pink-200 transition-colors"><option value="1" className="text-slate-900">Primer Trimestre</option><option value="2" className="text-slate-900">Segundo Trimestre</option><option value="3" className="text-slate-900">Tercer Trimestre</option></select><i className="fas fa-chevron-down absolute right-0 top-1/2 -translate-y-1/2 text-pink-500 text-xs pointer-events-none"></i></div>
                                  </div>
                             </div>
                         </div>
                         <div className="flex gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                             <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[140px] flex-1 backdrop-blur-md hover:bg-white/10 transition-colors"><div className="flex items-center gap-2 mb-2 text-slate-400"><i className="fas fa-list-ul text-[10px]"></i><span className="text-[9px] font-black uppercase tracking-widest">Total Planificado</span></div><div className="text-4xl font-black text-white tracking-tight">{stats.planned}</div></div>
                             <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-[140px] flex-1 backdrop-blur-md hover:bg-white/10 transition-colors"><div className="flex items-center gap-2 mb-2 text-emerald-400"><i className="fas fa-check text-[10px]"></i><span className="text-[9px] font-black uppercase tracking-widest">Desarrollado</span></div><div className="text-4xl font-black text-white tracking-tight">{stats.developed}</div></div>
                             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 min-w-[180px] flex-1 shadow-lg shadow-indigo-500/30 relative overflow-hidden group"><div className="relative z-10"><div className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-1">Progreso Global</div><div className="flex items-baseline gap-1"><span className="text-5xl font-black text-white tracking-tight">{globalPct}%</span><i className="fas fa-chart-line text-lg text-indigo-200 ml-auto"></i></div></div><div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div></div>
                         </div>
                     </div>
                </div>
                
                <div className="w-full">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4">{[1,2,3].map(i => (<div key={i} className="h-24 bg-white rounded-2xl animate-pulse shadow-sm"></div>))}</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <div className="col-span-3">Curso</div>
                                <div className="col-span-2 text-center">Temas Planificados</div>
                                <div className="col-span-2 text-center">Temas Desarrollados</div>
                                <div className="col-span-5 pl-4">Barra de Progreso</div>
                            </div>
                            {allCoursesData.map((c, index) => {
                                const key = `trimester${selectedTrimester}` as keyof CourseTopics;
                                if (key === 'course') return null;
                                const data = (c[key] as any) || { planned: 0, developed: 0 };
                                const pct = data.planned > 0 ? Math.round((data.developed / data.planned) * 100) : 0;
                                const theme = ROW_COLORS[index % ROW_COLORS.length];
                                return (
                                    <div key={c.course} className={`relative bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden group`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.bg.replace('50', '500')}`}></div>
                                        <div className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                            <div className="lg:col-span-3 flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center text-xl shadow-inner ${theme.text}`}><i className={theme.icon}></i></div>
                                                <div><h3 className="text-xl font-black text-slate-800 leading-none">{c.course}</h3><span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} opacity-70`}>Avance Académico</span></div>
                                            </div>
                                            <div className="lg:col-span-2 flex flex-col items-center">
                                                <div className="lg:hidden text-xs font-bold text-slate-400 uppercase mb-2">Planificado</div>
                                                <div className="relative group/input w-full max-w-[120px]">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-xl blur opacity-0 group-hover/input:opacity-50 transition duration-200"></div>
                                                    <input type="number" value={data.planned || ''} onChange={e => handleInputChange(c.course, 'planned', e.target.value)} className="relative w-full bg-indigo-50/50 border-2 border-indigo-100 hover:border-indigo-300 focus:border-indigo-500 text-indigo-900 font-black text-center text-xl rounded-xl py-3 outline-none transition-all focus:bg-white focus:shadow-lg"/>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-2 flex flex-col items-center">
                                                <div className="lg:hidden text-xs font-bold text-slate-400 uppercase mb-2">Desarrollado</div>
                                                <div className="relative group/input w-full max-w-[120px]">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-300 to-green-300 rounded-xl blur opacity-0 group-hover/input:opacity-50 transition duration-200"></div>
                                                    <input type="number" value={data.developed || ''} onChange={e => handleInputChange(c.course, 'developed', e.target.value)} className="relative w-full bg-emerald-50/50 border-2 border-emerald-100 hover:border-emerald-300 focus:border-emerald-500 text-emerald-900 font-black text-center text-xl rounded-xl py-3 outline-none transition-all focus:bg-white focus:shadow-lg"/>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-5 pl-0 lg:pl-6">
                                                <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso</span><span className={`text-sm font-black ${pct >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>{pct}%</span></div>
                                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner relative border border-slate-200">
                                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:4px_4px]"></div>
                                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${pct >= 100 ? 'bg-gradient-to-r from-emerald-400 to-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)]'}`} style={{ width: `${Math.min(pct, 100)}%` }}>
                                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
export default TemasScreen;
