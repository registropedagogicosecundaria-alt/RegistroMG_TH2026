
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, PrintConfig, Student, CourseTopics, ScheduleEntry } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';

const ReportScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [reportType, setReportType] = useState<'caratula' | 'centralizer' | 'attendance' | 'filiation' | 'progress' | 'schedule'>('caratula');
    const [selectedTrimester, setSelectedTrimester] = useState('1');
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [gradesData, setGradesData] = useState<any>({});
    const [progressData, setProgressData] = useState<CourseTopics[]>([]);
    const [filiationData, setFiliationData] = useState<any[][]>([]);
    const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
    const [caratula, setCaratula] = useState<any>(null);
    
    // Shield Logic
    const [shieldImage, setShieldImage] = useState<string | null>(null);
    const [shieldPos, setShieldPos] = useState({ x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [printConfig, setPrintConfig] = useState<PrintConfig>({
        paperSize: 'letter',
        orientation: 'portrait',
        margins: 'narrow',
        showCharts: true,
        showSummary: true
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const reportContainerRef = useRef<HTMLDivElement>(null);

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const caratulaResp = await api.getCaratulaData(userId);
            const caratulaArr = caratulaResp.datos.split(',');
            setCaratula({
                departamento: caratulaArr[0] || 'POTOSI',
                distrito: caratulaArr[1] || 'POTOSI',
                red: caratulaArr[2] || '501',
                sie: caratulaArr[3] || '81480116',
                telefono: caratulaArr[4] || '77472670',
                gestion: caratulaArr[5] || '2025',
                unidad: caratulaArr[6] || 'LICEO MARIA GUTIERREZ',
                distrital: caratulaArr[7] || 'LIC. ZAIDA MARITZA CHOQUE CONDO',
                director: caratulaArr[8] || 'LIC. JOSÉ IGNACIO MACHACA MACHUCA',
                profesor: caratulaArr[9] || 'ING. GERSSON FELIX CHAVARRIA CHOQUE',
                asignatura: caratulaArr[10] || 'EDUCACIÓN MUSICAL',
                nivel: "SECUNDARIO"
            });

            if (reportType === 'schedule') {
                const sched = await api.getScheduleData(userId);
                setScheduleData(sched || []);
            } else if (reportType !== 'caratula') {
                if (!selectedCourse) {
                    setIsLoading(false);
                    return;
                }
                const studentsList = await api.getStudentsForAttendance(selectedCourse, userId);
                setStudents(studentsList || []);
                if (reportType === 'centralizer') {
                    const res = await api.getGradesAndCriteria("", selectedTrimester, selectedCourse, userId);
                    if (res.success) setGradesData(res.data);
                } else if (reportType === 'attendance') {
                    const months = selectedTrimester === '1' ? [2,3,4,5] : selectedTrimester === '2' ? [5,6,7,8] : [9,10,11,12];
                    const allDays: any[] = [];
                    const allAttendance: any = {};
                    for (const m of months) {
                        const att = await api.getAttendanceMonthData(String(m), selectedCourse, userId);
                        att.days.filter((d: any) => d.enabled).forEach((d: any) => allDays.push({ ...d, month: m }));
                        Object.assign(allAttendance, att.attendance);
                    }
                    setAttendanceData({ days: allDays, attendance: allAttendance });
                } else if (reportType === 'filiation') {
                    const fil = await api.getFiliationData(selectedCourse, userId);
                    setFiliationData(fil.data || []);
                } else if (reportType === 'progress') {
                    const prog = await api.getTemasData(selectedCourse, userId);
                    setProgressData(prog.data || []);
                }
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, [reportType, selectedCourse, userId, selectedTrimester]);

    useEffect(() => { loadAllData(); }, [loadAllData, selectedTrimester, reportType]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (reportType !== 'caratula' || !shieldImage) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setIsDragging(true);
        target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !reportContainerRef.current) return;
        const containerRect = reportContainerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left - dragOffset.x;
        const y = e.clientY - containerRect.top - dragOffset.y;
        setShieldPos({ x, y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setShieldImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => window.print();

    const getPaperStyle = () => {
        const sizes = { letter: { w: '8.5in', h: '11in' }, legal: { w: '8.5in', h: '14in' }, a4: { w: '210mm', h: '297mm' } };
        const s = sizes[printConfig.paperSize];
        const isLandscape = printConfig.orientation === 'landscape';
        return {
            width: isLandscape ? s.h : s.w,
            minHeight: isLandscape ? s.w : s.h,
            padding: printConfig.margins === 'none' ? '0' : '0.4in'
        };
    };

    const renderCaratula = () => {
        if (!caratula) return null;
        const info = [
            { label: 'Unidad Educativa', val: caratula.unidad, primary: true },
            { label: 'Distrito Educativo', val: caratula.distrito },
            { label: 'Departamento', val: caratula.departamento },
            { label: 'Código SIE', val: caratula.sie },
            { label: 'Director(a)', val: caratula.director },
            { label: 'Catedrático(a)', val: caratula.profesor, primary: true },
            { label: 'Asignatura / Área', val: caratula.asignatura },
            { label: 'Nivel de Formación', val: caratula.nivel },
            { label: 'Gestión Académica', val: caratula.gestion, primary: true }
        ];

        return (
            <div className="relative w-full h-full flex flex-col items-center border-[12px] border-double border-slate-800 p-8 min-h-[10in]">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <span className="text-[25rem] font-black font-display rotate-[-45deg] border-slate-900 text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-transparent" style={{ WebkitTextStroke: '4px #000' }}>
                        {caratula.gestion}
                    </span>
                </div>

                {shieldImage ? (
                    <div 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{ left: `${shieldPos.x}px`, top: `${shieldPos.y}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
                        className="absolute z-50 w-48 h-48 transition-shadow hover:shadow-2xl"
                    >
                        <img src={shieldImage} alt="Logo" className="w-full h-full object-contain" />
                        <button onClick={() => setShieldImage(null)} className="no-print absolute -top-4 -right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"><i className="fas fa-times"></i></button>
                    </div>
                ) : (
                    <div className="no-print mt-10 p-10 border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-4 text-slate-300">
                        <i className="fas fa-university text-6xl"></i>
                        <p className="font-bold uppercase tracking-widest text-xs">Subir Escudo Institucional</p>
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="scale-75">Seleccionar Archivo</Button>
                    </div>
                )}

                <div className="mt-16 text-center space-y-4 relative z-10">
                    <h4 className="text-xs font-black tracking-[0.6em] text-slate-400 uppercase">Estado Plurinacional de Bolivia</h4>
                    <div className="h-px w-64 bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-auto"></div>
                    <h1 className="text-6xl font-display font-black text-slate-900 leading-none py-4">REGISTRO<br/><span className="text-slate-700">PEDAGÓGICO</span></h1>
                    <div className="inline-block px-8 py-2 bg-slate-900 text-white text-sm font-black tracking-[0.4em] uppercase rounded-full shadow-lg">Documento Oficial</div>
                </div>

                <div className="mt-20 w-full max-w-2xl space-y-6 relative z-10">
                    {info.map((item, i) => (
                        <div key={i} className={`flex flex-col border-b ${item.primary ? 'border-slate-800' : 'border-slate-200'} pb-2 group`}>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                {item.label}
                            </span>
                            <span className={`${item.primary ? 'text-2xl font-black text-slate-900' : 'text-lg font-bold text-slate-700'} uppercase tracking-tight`}>
                                {item.val || '---'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto mb-10 w-full flex justify-around items-end pt-10">
                    <div className="text-center w-48">
                         <div className="h-px bg-slate-400 mb-2"></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sello de la Institución</p>
                    </div>
                    <div className="text-center w-48">
                         <div className="h-px bg-slate-400 mb-2"></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Firma del Director(a)</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderTable = () => {
        if (reportType === 'caratula') return renderCaratula();
        
        switch (reportType) {
            case 'schedule':
                const days = [
                    { id: 1, name: 'LUNES' },
                    { id: 2, name: 'MARTES' },
                    { id: 3, name: 'MIÉRCOLES' },
                    { id: 4, name: 'JUEVES' },
                    { id: 5, name: 'VIERNES' }
                ];
                return (
                    <div className="border-2 border-slate-900 bg-white">
                        <div className="grid grid-cols-5 border-b-2 border-slate-900 bg-slate-50">
                            {days.map(d => (
                                <div key={d.id} className="p-3 text-center border-r-2 border-slate-900 last:border-0 font-black text-[10px] uppercase">{d.name}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 min-h-[500px]">
                            {days.map(d => (
                                <div key={d.id} className="border-r-2 border-slate-900 last:border-0 p-2 space-y-2">
                                    {scheduleData
                                        .filter(e => e.day_of_week === d.id)
                                        .sort((a,b) => a.start_time.localeCompare(b.start_time))
                                        .map(entry => (
                                            <div key={entry.id} className="p-2 border border-slate-300 rounded bg-white">
                                                <div className="text-[8px] font-black text-blue-700 border-b border-slate-100 mb-1">{entry.start_time} - {entry.end_time}</div>
                                                <div className="text-[9px] font-black uppercase text-slate-900 leading-tight">{entry.subject}</div>
                                                <div className="text-[8px] font-bold text-slate-500 uppercase">{entry.course_label}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'attendance':
                const attDays = attendanceData?.days || [];
                const monthNames = ["", "", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                return (
                    <div className="border-2 border-slate-900">
                        <table className="w-full border-collapse text-[10px]">
                            <thead className="bg-slate-900 text-white uppercase">
                                <tr>
                                    <th rowSpan={2} className="p-2 border-r border-slate-700 w-10">N°</th>
                                    <th rowSpan={2} className="p-2 border-r border-slate-700 text-left pl-4">Estudiante</th>
                                    {attDays.map((d: any, idx: number) => <th key={idx} className="p-1 border-r border-slate-700 text-[8px] w-6">{d.date}<br/>{monthNames[d.month].substring(0,3)}</th>)}
                                    <th className="p-2 w-12 bg-emerald-700">P</th>
                                    <th className="p-2 w-12 bg-red-700">F</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => {
                                    let p = 0, f = 0;
                                    return (
                                        <tr key={s.id} className="border-b border-slate-200">
                                            <td className="text-center p-2 border-r border-slate-200 font-bold">{idx+1}</td>
                                            <td className="p-2 border-r border-slate-200 font-black uppercase text-[11px] truncate pl-4">{s.name}</td>
                                            {attDays.map((d: any, dIdx: number) => {
                                                const status = attendanceData.attendance[`${s.id}-${d.date}`] || '';
                                                if (status === 'P') p++; else if (status === 'F') f++;
                                                return <td key={dIdx} className="border-r border-slate-100 text-center font-bold">{status === 'P' ? '•' : status}</td>;
                                            })}
                                            <td className="text-center font-black bg-emerald-50 text-emerald-700">{p}</td>
                                            <td className="text-center font-black bg-red-50 text-red-700">{f}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            case 'centralizer':
                const criteria = gradesData.criteriaTexts || { ser: [], saber: [], hacer: [], auto: [] };
                return (
                    <div className="border-2 border-slate-900">
                        <table className="w-full border-collapse text-[10px]">
                            <thead className="bg-slate-900 text-white uppercase text-center">
                                <tr>
                                    <th rowSpan={2} className="p-2 border-r border-slate-700 w-10">N°</th>
                                    <th rowSpan={2} className="p-2 border-r border-slate-700 text-left pl-4">Estudiante</th>
                                    <th colSpan={criteria.ser.length + 1} className="bg-emerald-600 border-r border-white/20">SER (10)</th>
                                    <th colSpan={criteria.saber.length + 1} className="bg-blue-600 border-r border-white/20">SABER (45)</th>
                                    <th colSpan={criteria.hacer.length + 1} className="bg-orange-600 border-r border-white/20">HACER (40)</th>
                                    <th colSpan={2} className="bg-purple-600 border-r border-white/20">AUTO (5)</th>
                                    <th rowSpan={2} className="p-2 bg-slate-900 border-l border-slate-700 w-16">NOTA</th>
                                </tr>
                                <tr className="bg-slate-100 text-slate-600 text-[8px] h-20">
                                    {['ser', 'saber', 'hacer'].map(dim => (
                                        <React.Fragment key={dim}>
                                            {criteria[dim].map((_: any, i: number) => <th key={i} className="border-r border-slate-300 w-10 rotate-[-90deg] uppercase">{criteria[dim][i] || `C${i+1}`}</th>)}
                                            <th className="bg-slate-200 font-black text-slate-900 w-12 border-r border-slate-300">PRO</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="border-r border-slate-300 w-10 rotate-[-90deg]">AUTOEV</th>
                                    <th className="bg-slate-200 font-black text-slate-900 w-12 border-r border-slate-300">PRO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => {
                                    const stGrades = gradesData.grades?.[s.id] || { ser: [], saber: [], hacer: [], auto: [] };
                                    const calc = (dim: string) => { const scores = stGrades[dim] || []; const sum = scores.reduce((a:any, b:any) => (parseFloat(a)||0) + (parseFloat(b)||0), 0); return scores.length > 0 ? Math.round(sum/scores.length) : 0; };
                                    const t = calc('ser') + calc('saber') + calc('hacer') + calc('auto');
                                    return (
                                        <tr key={s.id} className="border-b border-slate-200 h-8">
                                            <td className="text-center border-r border-slate-200 font-bold">{idx+1}</td>
                                            <td className="p-2 border-r border-slate-200 font-black uppercase text-[11px] truncate pl-4">{s.name}</td>
                                            {['ser', 'saber', 'hacer'].map(dim => (
                                                <React.Fragment key={dim}>
                                                    {criteria[dim].map((_: any, i: number) => <td key={i} className="border-r border-slate-100 text-center">{stGrades[dim][i] || '-'}</td>)}
                                                    <td className="bg-slate-50 text-center font-black border-r border-slate-200">{calc(dim)}</td>
                                                </React.Fragment>
                                            ))}
                                            <td className="border-r border-slate-100 text-center">{stGrades.auto[0] || '-'}</td>
                                            <td className="bg-slate-50 text-center font-black border-r border-slate-200">{calc('auto')}</td>
                                            <td className={`text-center font-black text-sm border-l-2 border-slate-800 ${t < 51 ? 'text-red-600' : 'text-emerald-700'}`}>{t}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            case 'filiation':
                return (
                    <div className="border-2 border-slate-900">
                        <table className="w-full border-collapse text-[10px]">
                            <thead className="bg-slate-900 text-white uppercase">
                                <tr><th className="p-3 w-10 border-r border-slate-700">N°</th><th className="p-3 text-left pl-6 border-r border-slate-700">Apellidos y Nombres</th><th className="p-3 w-16 border-r border-slate-700">Sexo</th><th className="p-3 w-32 border-r border-slate-700">C.I.</th><th className="p-3 w-40 border-r border-slate-700">RUDE</th><th className="p-3 w-28 border-r border-slate-700">Fec. Nac.</th><th className="p-3">Tutor / Celular</th></tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => (
                                    <tr key={s.id} className="border-b border-slate-200 h-10">
                                        <td className="text-center font-bold border-r border-slate-200">{idx+1}</td>
                                        <td className="pl-6 font-black uppercase text-[11px] border-r border-slate-200">{s.name}</td>
                                        <td className="text-center border-r border-slate-200">{filiationData[idx]?.[2]}</td>
                                        <td className="text-center font-bold border-r border-slate-200">{filiationData[idx]?.[3]}</td>
                                        <td className="text-center font-mono text-[9px] border-r border-slate-200">{filiationData[idx]?.[4]}</td>
                                        <td className="text-center border-r border-slate-200">{filiationData[idx]?.[5]}</td>
                                        <td className="pl-4 font-bold">{filiationData[idx]?.[7]} <span className="text-blue-600 ml-2">[{filiationData[idx]?.[9]}]</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'progress':
                return (
                    <div className="border-2 border-slate-900">
                        <table className="w-full border-collapse text-[10px]">
                            <thead className="bg-slate-900 text-white uppercase text-center">
                                <tr>
                                    <th className="p-3 border-r border-slate-700 w-10">N°</th>
                                    <th className="p-3 border-r border-slate-700 text-left pl-6">Curso / Área</th>
                                    <th className="p-3 border-r border-slate-700 w-32">Planificado</th>
                                    <th className="p-3 border-r border-slate-700 w-32">Desarrollado</th>
                                    <th className="p-3 w-20 text-center">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {progressData.map((c, idx) => {
                                    const tKey = `trimester${selectedTrimester}` as keyof CourseTopics;
                                    const data = (c as any)[tKey] || { planned: 0, developed: 0 };
                                    const pct = data.planned > 0 ? Math.round((data.developed / data.planned) * 100) : 0;
                                    return (
                                        <tr key={idx} className="border-b border-slate-200 h-12">
                                            <td className="text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                                            <td className="pl-6 font-black uppercase border-r border-slate-200">{c.course}</td>
                                            <td className="text-center font-bold border-r border-slate-200">{data.planned}</td>
                                            <td className="text-center font-bold border-r border-slate-200">{data.developed}</td>
                                            <td className={`text-center font-black ${pct >= 51 ? 'text-emerald-700' : 'text-red-700'}`}>{pct}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans">
            <style>{`
                @media print {
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    #report-container { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; padding: 0.5in !important; overflow: hidden !important; }
                    @page { size: ${printConfig.paperSize} ${printConfig.orientation}; margin: 0; }
                }
                .font-display { font-family: 'Archivo Black', sans-serif; }
                #report-container { background: white; transition: transform 0.2s; position: relative; }
            `}</style>

            <div className="no-print bg-slate-900 border-b border-white/5 shadow-xl">
                <Header title="Reportes Pro" icon={<i className="fas fa-print text-amber-400"></i>}>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="success" className="shadow-lg"><i className="fas fa-file-pdf mr-2"></i>PDF / IMPRIMIR</Button>
                        <Button onClick={() => setView(View.Menu)} variant="secondary" className="!bg-slate-800 border-slate-700 text-white"><i className="fas fa-arrow-left"></i></Button>
                    </div>
                </Header>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-72 bg-slate-800/50 p-6 flex flex-col gap-6 no-print border-r border-white/5 overflow-y-auto">
                    <section>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Trimestre (Si aplica)</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['1', '2', '3'].map(t => (
                                <button key={t} onClick={() => setSelectedTrimester(t)} className={`py-3 rounded-xl font-black transition-all border-2 ${selectedTrimester === t ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                    {t}°
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-1.5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Seleccionar Documento</h3>
                        {[
                            { id: 'caratula', label: 'Carátula Institucional', icon: 'fa-id-card' },
                            { id: 'schedule', label: 'Horario de Clases', icon: 'fa-clock' },
                            { id: 'centralizer', label: 'Calificaciones', icon: 'fa-table' },
                            { id: 'attendance', label: 'Asistencia Trim.', icon: 'fa-calendar-check' },
                            { id: 'filiation', label: 'Filiación Estudiantes', icon: 'fa-users' },
                            { id: 'progress', label: 'Avance Curricular', icon: 'fa-chart-line' }
                        ].map(btn => (
                            <button key={btn.id} onClick={() => setReportType(btn.id as any)} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-xs transition-all ${reportType === btn.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5'}`}>
                                <i className={`fas ${btn.icon} w-5`}></i> {btn.label}
                            </button>
                        ))}
                    </section>

                    <section className="pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Página</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setPrintConfig({...printConfig, orientation: 'portrait'})} className={`p-3 rounded-xl text-[10px] font-black border-2 transition-all ${printConfig.orientation === 'portrait' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500'}`}>VERT.</button>
                            <button onClick={() => setPrintConfig({...printConfig, orientation: 'landscape'})} className={`p-3 rounded-xl text-[10px] font-black border-2 transition-all ${printConfig.orientation === 'landscape' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500'}`}>HORIZ.</button>
                        </div>
                    </section>
                </aside>

                <main className="flex-1 overflow-auto bg-[#0a0f1c] p-10 flex flex-col items-center">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="loader-circle mb-4 !border-t-amber-500"></div>
                            <p className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Generando Reporte...</p>
                        </div>
                    ) : (
                        <div 
                            id="report-container" 
                            ref={reportContainerRef}
                            style={getPaperStyle()} 
                            className="shadow-2xl flex flex-col text-slate-900 paper-preview"
                        >
                            {reportType !== 'caratula' && (
                                <div className="flex justify-between items-start border-b-[4px] border-slate-900 pb-4 mb-6">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white text-2xl font-display font-black">UE</div>
                                        <div>
                                            <h1 className="text-2xl font-display font-black uppercase leading-none mb-1 tracking-tighter">{caratula?.unidad}</h1>
                                            <div className="flex gap-3 text-[9px] font-black uppercase text-slate-400">
                                                <span>{caratula?.distrito}</span>
                                                <span>•</span>
                                                <span>CURSO: {selectedCourse || 'GENERAL'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-slate-900 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest mb-1 rounded-md">REGISTRO OFICIAL</div>
                                        <h2 className="text-lg font-black uppercase text-slate-800 leading-tight">
                                            {reportType === 'schedule' ? 'Horario de Labores' : 
                                             reportType === 'centralizer' ? 'Evaluación Pedagógica' : 
                                             reportType === 'attendance' ? 'Registro Asistencia' : 
                                             reportType === 'filiation' ? 'Datos de Inscripción' : 'Avance Curricular'}
                                        </h2>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GESTIÓN {caratula?.gestion}</span>
                                    </div>
                                </div>
                            )}

                            {renderTable()}

                            {reportType !== 'caratula' && (
                                <div className="mt-auto grid grid-cols-3 gap-12 px-8 pt-10">
                                    <div className="text-center pt-4 border-t border-slate-900"><p className="text-[9px] font-black uppercase">Sello U.E.</p></div>
                                    <div className="text-center pt-4 border-t border-slate-900"><p className="text-[9px] font-black uppercase">Dirección</p></div>
                                    <div className="text-center pt-4 border-t border-slate-900">
                                        <p className="text-[9px] font-black uppercase">{caratula?.profesor}</p>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase">Firma del Docente</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
export default ReportScreen;
