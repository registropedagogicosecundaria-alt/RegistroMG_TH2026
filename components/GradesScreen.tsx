
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Student, CriteriaConfig, AllGradesData, Dimension, CentralizerData } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Toast from './ui/Toast';

const initialCriteriaConfig: CriteriaConfig = {
    ser: { count: 1, maxPoints: 10, titles: [''] },
    saber: { count: 1, maxPoints: 45, titles: [''] },
    hacer: { count: 1, maxPoints: 40, titles: [''] },
    auto: { count: 1, maxPoints: 5, titles: ['AUTOEVALUACIÓN'] } 
};

const DIMENSIONS: { 
    key: Dimension; 
    name: string; 
    shortName: string;
    colorText: string; 
    borderColor: string; 
    cellBorder: string;  
    headerBg: string;    
    badgeBg: string;
    colBg: string;       
    proColBg: string;    
    maxPoints: number; 
    maxCount: number 
}[] = [
    { key: 'ser', name: 'SER (10 PTS)', shortName: 'SER', colorText: 'text-green-700', borderColor: 'border-green-600', cellBorder: 'border-green-500', headerBg: 'bg-green-600', badgeBg: 'bg-green-600', colBg: 'bg-green-50', proColBg: 'bg-slate-50', maxPoints: 10, maxCount: 3 },
    { key: 'saber', name: 'SABER (45 PTS)', shortName: 'SABER', colorText: 'text-blue-700', borderColor: 'border-blue-600', cellBorder: 'border-blue-500', headerBg: 'bg-blue-600', badgeBg: 'bg-blue-600', colBg: 'bg-blue-50', proColBg: 'bg-slate-50', maxPoints: 45, maxCount: 8 },
    { key: 'hacer', name: 'HACER (40 PTS)', shortName: 'HACER', colorText: 'text-orange-700', borderColor: 'border-orange-600', cellBorder: 'border-orange-500', headerBg: 'bg-orange-600', badgeBg: 'bg-orange-600', colBg: 'bg-orange-50', proColBg: 'bg-slate-50', maxPoints: 40, maxCount: 8 },
    { key: 'auto', name: 'AUTO (5 PTS)', shortName: 'AUTO', colorText: 'text-purple-700', borderColor: 'border-purple-600', cellBorder: 'border-purple-500', headerBg: 'bg-purple-600', badgeBg: 'bg-purple-600', colBg: 'bg-purple-50', proColBg: 'bg-slate-50', maxPoints: 5, maxCount: 1 },
];

interface PickerState {
    isOpen: boolean;
    rect: DOMRect | null;
    studentId: number;
    dimKey: Dimension;
    index: number;
    maxPoints: number;
}

const GradesScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [students, setStudents] = useState<any[]>([]); 
    const [criteriaConfig, setCriteriaConfig] = useState<CriteriaConfig>(initialCriteriaConfig);
    const [gradesData, setGradesData] = useState<AllGradesData>({});
    const [selectedTerm, setSelectedTerm] = useState('1');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [visibleDimensions, setVisibleDimensions] = useState<Record<Dimension, boolean>>({
        ser: true, saber: true, hacer: true, auto: true
    });
    
    const [loadedContext, setLoadedContext] = useState<{ course: string | null, term: string | null }>({ course: null, term: null });
    const [toast, setToast] = useState({ show: false, message: '' });
    const [pickerState, setPickerState] = useState<PickerState | null>(null);
    const [mobileActiveDim, setMobileActiveDim] = useState<Dimension | 'final'>('ser');
    
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteTargetDimension, setPasteTargetDimension] = useState<Dimension | null>(null);
    const [pasteContent, setPasteContent] = useState('');

    const [isCentralizerModalOpen, setIsCentralizerModalOpen] = useState(false);
    const [centralizerData, setCentralizerData] = useState<CentralizerData[]>([]);
    const [isLoadingCentralizer, setIsLoadingCentralizer] = useState(false);

    useEffect(() => {
        if (!selectedCourse) return;
        let isActive = true;
        const loadData = async () => {
            setIsLoading(true);
            setLoadError(null);
            setGradesData({});
            setStudents([]);
            setCriteriaConfig(JSON.parse(JSON.stringify(initialCriteriaConfig)));
            setLoadedContext({ course: null, term: null }); 

            try {
                const [studentsList, gradesResponse] = await Promise.all([
                    api.getStudentsForAttendance(selectedCourse, userId),
                    api.getGradesAndCriteria("A", selectedTerm, selectedCourse, userId)
                ]);

                if (isActive) {
                    setStudents(studentsList || []);
                    if (gradesResponse.success && gradesResponse.data) {
                        const payload = gradesResponse.data.criteriaTexts ? gradesResponse.data : gradesResponse.data.data;
                        if (payload) {
                            const { criteriaTexts, grades } = payload;
                            const newConfig = JSON.parse(JSON.stringify(initialCriteriaConfig)); 
                            if (criteriaTexts) {
                                Object.keys(criteriaTexts).forEach(key => {
                                    const dim = key as Dimension;
                                    if (newConfig[dim]) {
                                        const titles = criteriaTexts[dim] || [];
                                        const count = dim === 'auto' ? 1 : (titles.length || 1);
                                        newConfig[dim] = { ...newConfig[dim], count: count, titles: titles.length ? titles : Array(count).fill('') };
                                    }
                                });
                            }
                            setCriteriaConfig(newConfig);
                            setGradesData(grades || {});
                        }
                    }
                    setLoadedContext({ course: selectedCourse, term: selectedTerm });
                }
            } catch (err: any) { 
                if (isActive) setLoadError(err.message || 'Error desconocido al cargar.');
            } finally { 
                if (isActive) setIsLoading(false); 
            }
        };
        loadData();
        return () => { isActive = false; };
    }, [selectedTerm, selectedCourse, userId]);

    const calculatedScores = useMemo(() => {
        const scores: Record<string, any> = {};
        students.forEach(student => {
            let finalGrade = 0;
            scores[student.id] = {};
            DIMENSIONS.forEach(({ key: dim, maxPoints }) => {
                const config = criteriaConfig[dim];
                const studentGrades = gradesData[student.id]?.[dim] || [];
                let sum = 0;
                let validCount = 0;
                for(let i=0; i < config.count; i++) {
                    const val = parseFloat(studentGrades[i]);
                    if (!isNaN(val)) { sum += val; validCount++; }
                }
                let weighted = 0;
                if (validCount > 0) {
                    const avg = sum / validCount;
                    weighted = Math.round(avg);
                    if (weighted > maxPoints) weighted = maxPoints;
                }
                scores[student.id][`${dim}_weighted`] = weighted;
                finalGrade += weighted;
            });
            scores[student.id].final = finalGrade;
        });
        return scores;
    }, [students, gradesData, criteriaConfig]);

    const handleGradeChange = (studentId: number, dim: Dimension, index: number, value: string) => {
        setGradesData(prev => {
            const newGrades = { ...prev };
            if (!newGrades[studentId]) newGrades[studentId] = {};
            if (!newGrades[studentId][dim]) newGrades[studentId][dim] = Array(criteriaConfig[dim].count).fill('');
            const arr = [...(newGrades[studentId][dim] || [])];
            arr[index] = value;
            newGrades[studentId][dim] = arr;
            return newGrades;
        });
    };

    const handleCriteriaCountChange = (dim: Dimension, newCount: number) => {
        setCriteriaConfig(prev => {
            const newConfig = { ...prev };
            const currentTitles = prev[dim].titles;
            let newTitles = [...currentTitles];
            if (newCount > currentTitles.length) {
                newTitles = [...newTitles, ...Array(newCount - currentTitles.length).fill('')];
            } else {
                newTitles = newTitles.slice(0, newCount);
            }
            newConfig[dim] = { ...prev[dim], count: newCount, titles: newTitles };
            return newConfig;
        });
    };

    const handleCriteriaTitleChange = (dim: Dimension, index: number, val: string) => {
        setCriteriaConfig(prev => {
            const newConfig = { ...prev };
            const newTitles = [...prev[dim].titles];
            newTitles[index] = val.toUpperCase();
            newConfig[dim] = { ...prev[dim], titles: newTitles };
            return newConfig;
        });
    };

    const handleSave = async () => {
        if (!selectedCourse) return;
        if (loadedContext.course !== selectedCourse || loadedContext.term !== selectedTerm) {
            alert(`SEGURIDAD: No se puede guardar. Los datos en pantalla no coinciden con el curso seleccionado.`);
            return;
        }

        setIsProcessing(true);
        try {
            const criteriaTitlesPayload: any = {};
            DIMENSIONS.forEach(d => { criteriaTitlesPayload[d.key] = criteriaConfig[d.key].titles; });
            await api.saveGradesAndCriteria("A", selectedTerm, criteriaTitlesPayload, gradesData, selectedCourse, userId);
            setToast({ show: true, message: 'Calificaciones guardadas correctamente.' });
        } catch (e: any) { alert('Error al guardar: ' + e.message); } finally { setIsProcessing(false); }
    };

    const openPasteModal = (dim: Dimension) => {
        setPasteTargetDimension(dim);
        setPasteContent('');
        setIsPasteModalOpen(true);
    };

    const handlePasteProcess = () => {
        if (!pasteTargetDimension) return;
        const dim = pasteTargetDimension;
        const dimConfig = DIMENSIONS.find(d => d.key === dim);
        const maxPoints = dimConfig ? dimConfig.maxPoints : 100;
        const rows = pasteContent.split(/\r?\n/);
        const parsedData = rows.map(row => row.split('\t'));
        
        setGradesData(prev => {
            const newGrades = { ...prev };
            students.forEach((student, idx) => {
                if ((student.status || 'ACTIVE') === 'WITHDRAWN') return;
                
                if (idx < parsedData.length) {
                    const notes = parsedData[idx];
                    if (!newGrades[student.id]) newGrades[student.id] = {};
                    if (!newGrades[student.id][dim]) newGrades[student.id][dim] = Array(criteriaConfig[dim].count).fill('');
                    const arr = [...(newGrades[student.id][dim] || [])];
                    for(let i=0; i<criteriaConfig[dim].count; i++) {
                        if (i < notes.length) {
                            let val = notes[i].trim();
                            if (val === '0') val = '';
                            if (val !== '') {
                                const n = parseFloat(val);
                                if (!isNaN(n)) { if (n > maxPoints) val = maxPoints.toString(); }
                            }
                            arr[i] = val;
                        }
                    }
                    newGrades[student.id][dim] = arr;
                }
            });
            return newGrades;
        });
        setIsPasteModalOpen(false);
    };

    const handleOpenCentralizer = async () => {
        if (!selectedCourse) return;
        setIsCentralizerModalOpen(true);
        setCentralizerData([]);
        setIsLoadingCentralizer(true);
        try {
            const response = await api.getCentralizadorData(selectedCourse, userId);
            if (response.success && response.data) {
                const finalData = response.data.map(row => {
                    const liveScore = calculatedScores[row.id]?.final || 0;
                    let t1 = row.t1;
                    let t2 = row.t2;
                    let t3 = row.t3;
                    if (selectedTerm === '1') t1 = liveScore;
                    if (selectedTerm === '2') t2 = liveScore;
                    if (selectedTerm === '3') t3 = liveScore;
                    const trimesters = [t1, t2, t3].filter(t => t > 0);
                    const anual = trimesters.length > 0 ? Math.round((t1 + t2 + t3) / 3) : 0;
                    return { ...row, t1, t2, t3, anual };
                });
                setCentralizerData(finalData);
            }
        } catch (error: any) { 
            alert('Error al cargar centralizador: ' + error.message); 
        } finally { 
            setIsLoadingCentralizer(false); 
        }
    };

    const handlePickerTrigger = (e: React.MouseEvent, studentId: number, dimKey: Dimension, index: number, maxPoints: number) => {
        const student = students.find(s => s.id === studentId);
        if (student?.status === 'WITHDRAWN') return;

        e.stopPropagation();
        const parent = (e.currentTarget.parentElement as HTMLElement);
        const rect = parent.getBoundingClientRect();
        if (pickerState && pickerState.studentId === studentId && pickerState.dimKey === dimKey && pickerState.index === index) {
            setPickerState(null);
            return;
        }
        setPickerState({ isOpen: true, rect, studentId, dimKey, index, maxPoints });
    };

    const handlePickerSelect = (val: string) => {
        if (!pickerState) return;
        handleGradeChange(pickerState.studentId, pickerState.dimKey, pickerState.index, val);
        setPickerState(null);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            <Header title="Registro de Notas" icon={<i className="fas fa-edit"></i>}>
                <div className="flex items-center gap-2 mr-2 md:mr-6">
                    <div className="flex flex-col items-end justify-center border-r-2 border-slate-200 pr-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Periodo Actual</span>
                        <div className="text-red-600 font-black text-xl leading-none uppercase tracking-tight">
                            {selectedTerm === '1' ? "1er Trimestre" : selectedTerm === '2' ? "2do Trimestre" : "3er Trimestre"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleOpenCentralizer} variant="info" className="shadow-md text-xs py-2 px-4 !bg-indigo-600 !border-b-indigo-800 hover:!bg-indigo-500"><i className="fas fa-table mr-2"></i>CENTRALIZADOR</Button>
                    <Button onClick={handleSave} variant="success" isLoading={isProcessing} className="shadow-md text-xs py-2 px-4"><i className="fas fa-save mr-2"></i>GUARDAR</Button>
                    <Button onClick={() => setView(View.Menu)} variant="secondary" className="shadow-md text-xs py-2 px-4"><i className="fas fa-arrow-left"></i></Button>
                </div>
            </Header>

            <main className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-4">
                <Card className="bg-white border border-slate-200 shadow-sm relative overflow-visible p-4 sm:p-6 mb-2">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedCourse}</h2>
                            <p className="text-sm text-slate-500 font-bold">Criterios de Evaluación 2024</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                             <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 shadow-inner w-full sm:w-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Periodo:</span>
                                <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="bg-transparent text-slate-800 font-bold text-base focus:outline-none cursor-pointer uppercase w-full">
                                    <option value="1">1er Trimestre</option>
                                    <option value="2">2do Trimestre</option>
                                    <option value="3">3er Trimestre</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {DIMENSIONS.map(dim => (
                            <div key={dim.key} className={`p-4 rounded-xl border-2 bg-white shadow-sm ${dim.borderColor} flex flex-col`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={`font-black text-sm uppercase ${dim.colorText}`}>{dim.name}</h3>
                                    <button onClick={() => openPasteModal(dim.key)} className={`text-sm bg-white border-2 ${dim.borderColor} hover:bg-slate-50 p-2 rounded-lg transition-colors ${dim.colorText}`} title="Pegar desde Excel"><i className="fas fa-paste"></i></button>
                                </div>
                                {dim.key !== 'auto' ? (
                                    <>
                                        <select value={criteriaConfig[dim.key].count} onChange={(e) => handleCriteriaCountChange(dim.key, parseInt(e.target.value))} className={`w-full mb-3 text-sm p-2 rounded border-2 bg-white font-bold text-slate-700 outline-none ${dim.borderColor}`}>
                                            {Array.from({length: dim.maxCount}, (_, i) => i + 1).map(n => (<option key={n} value={n}>{n} Casillas</option>))}
                                        </select>
                                        <div className="space-y-2 w-full">
                                            {Array.from({length: criteriaConfig[dim.key].count}).map((_, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <span className={`text-xs font-black w-8 text-center text-white rounded py-2 ${dim.badgeBg}`}>C{i+1}</span>
                                                    <input type="text" placeholder={`C${i+1}: Título...`} value={criteriaConfig[dim.key].titles[i] || ''} onChange={(e) => handleCriteriaTitleChange(dim.key, i, e.target.value)} className={`w-full text-[10px] p-2 border-2 rounded outline-none uppercase font-black text-slate-600 ${dim.borderColor} bg-white h-8 focus:border-slate-800 tracking-tight`} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className={`text-xs font-medium italic border-2 p-2 rounded bg-white ${dim.borderColor} ${dim.colorText}`}>Autoevaluación única sobre 5 pts.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="w-full pb-20">
                    {isLoading ? (
                        <div className="p-20 text-center bg-white rounded-2xl border border-slate-200"><div className="loader-circle mx-auto mb-4"></div><p className="text-slate-500 font-bold">Cargando Planilla...</p></div>
                    ) : (
                    <>
                         <div className="lg:hidden flex flex-col gap-4">
                             <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur shadow-sm p-1 rounded-xl flex overflow-x-auto custom-scrollbar border border-slate-200">
                                {DIMENSIONS.map(dim => (
                                    <button key={dim.key} onClick={() => setMobileActiveDim(dim.key)} className={`flex-1 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${mobileActiveDim === dim.key ? `${dim.badgeBg} text-white shadow-md transform scale-105` : 'text-slate-400 bg-transparent hover:bg-white'}`}>{dim.shortName}</button>
                                ))}
                                <button onClick={() => setMobileActiveDim('final')} className={`flex-1 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${mobileActiveDim === 'final' ? 'bg-slate-800 text-white shadow-md transform scale-105' : 'text-slate-400 bg-transparent hover:bg-white'}`}>NOTA FINAL</button>
                             </div>
                             <div className="space-y-3">
                                {students.map((student, idx) => {
                                    const scores = calculatedScores[student.id] || {};
                                    const isWithdrawn = student.status === 'WITHDRAWN';

                                    if (mobileActiveDim === 'final') {
                                        const finalScore = scores.final || 0;
                                        return (
                                            <div key={student.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${finalScore >= 51 ? 'border-l-green-500' : 'border-l-red-500'} p-4 flex flex-col gap-4 border-y border-r border-slate-100 ${isWithdrawn ? 'opacity-50' : ''}`}>
                                                 <div className="flex justify-between items-center border-b border-slate-100 pb-2"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</div><h3 className="text-sm font-black text-slate-800 uppercase">{student.name} {isWithdrawn && "(R)"}</h3></div></div>
                                                 {/* Nota Final Movil igualada a PRO */}
                                                 <div className="flex flex-col items-center py-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota Final</span><div className={`text-xl font-black ${finalScore >= 51 ? 'text-green-600' : 'text-red-600'}`}>{finalScore}</div></div>
                                            </div>
                                        );
                                    }
                                    const dim = DIMENSIONS.find(d => d.key === mobileActiveDim)!;
                                    return (
                                        <div key={student.id} className={`bg-white rounded-xl shadow-sm border-2 ${dim.borderColor} p-4 flex flex-col gap-3 ${isWithdrawn ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="flex justify-between items-start"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</div><h3 className="text-sm font-black text-slate-800 uppercase">{student.name} {isWithdrawn && "(RETIRADO)"}</h3></div><div className={`text-xl font-black px-3 py-1 rounded-lg ${dim.headerBg} text-white`}>{scores[`${mobileActiveDim}_weighted`] ?? 0} pts</div></div>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-50 p-2 rounded-lg">
                                                 {Array.from({length: criteriaConfig[dim.key].count}).map((_, i) => (
                                                    <input key={i} type="text" inputMode="decimal" disabled={isWithdrawn} value={gradesData[student.id]?.[dim.key]?.[i] || ''} onChange={e => { const val = e.target.value; if (val === '' || /^\d{0,2}(\.\d{0,1})?$/.test(val)) { if (parseFloat(val) > dim.maxPoints) return; handleGradeChange(student.id, dim.key, i, val); } }} className={`w-full h-12 text-center text-sm font-bold ${dim.colorText} bg-white border-2 border-slate-200 rounded-lg outline-none shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed`} placeholder={isWithdrawn ? "R" : "-"} />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>

                        <div className="hidden lg:block neo-table-container overflow-auto h-[calc(100vh-140px)] custom-scrollbar shadow-inner bg-white rounded-xl border-2 border-slate-300 relative">
                            <table className="neo-table border-separate border-spacing-0 w-full">
                                <thead className="sticky top-0 !z-[100]">
                                    <tr className="uppercase text-[10px] tracking-widest font-black">
                                        <th rowSpan={2} className="sticky left-0 top-0 !z-[100] bg-slate-100 text-slate-700 border-b-2 border-r-2 border-slate-400 w-12 text-center">N°</th>
                                        <th rowSpan={2} className="sticky left-12 top-0 !z-[100] bg-slate-100 text-slate-700 border-b-2 border-r-2 border-slate-400 min-w-[300px] text-left pl-4">ESTUDIANTE</th>
                                        {DIMENSIONS.map(dim => visibleDimensions[dim.key] && (
                                            <th key={dim.key} colSpan={criteriaConfig[dim.key].count + 1} className={`text-center py-2 border-r-2 border-b-2 ${dim.cellBorder} text-white ${dim.headerBg}`}>{dim.name}</th>
                                        ))}
                                        <th rowSpan={2} className="bg-slate-800 text-white border-b-2 border-l-2 border-slate-600 w-28 text-center sticky right-0 top-0 !z-[100]">NOTA FINAL</th>
                                    </tr>
                                    <tr className="text-[9px] font-black uppercase">
                                        {DIMENSIONS.map(dim => visibleDimensions[dim.key] && (
                                            <React.Fragment key={dim.key}>
                                                {Array.from({length: criteriaConfig[dim.key].count}).map((_, i) => (
                                                    <th key={i} className={`p-1 border-b-2 border-r-2 ${dim.cellBorder} ${dim.colBg} min-w-[60px] text-center`}><span className={`inline-block px-2 py-0.5 rounded text-white text-[8px] ${dim.badgeBg}`}>C{i+1}</span></th>
                                                ))}
                                                <th className={`p-1 border-b-2 border-r-2 ${dim.cellBorder} ${dim.proColBg} min-w-[50px] text-center ${dim.colorText}`}>PRO</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {students.map((student, idx) => {
                                        const scores = calculatedScores[student.id] || {};
                                        const isWithdrawn = student.status === 'WITHDRAWN';
                                        return (
                                            <tr key={student.id} className={`group relative transition-all duration-200 ${isWithdrawn ? 'bg-red-50/20 grayscale-[0.5]' : 'hover:bg-slate-50 focus-within:bg-orange-50/60'}`}>
                                                <td className={`sticky left-0 !z-[40] text-center font-bold text-slate-400 border-r-2 border-b-2 border-slate-400 p-2 transition-colors ${isWithdrawn ? 'bg-red-50/50' : 'bg-white group-focus-within:bg-orange-100 group-focus-within:border-b-orange-300'}`}>{idx + 1}</td>
                                                <td className={`sticky left-12 !z-[40] font-black p-2 uppercase border-r-2 border-b-2 border-slate-400 text-[11px] truncate max-w-[300px] transition-colors border-l-4 border-l-transparent group-focus-within:border-l-orange-500 group-focus-within:bg-orange-100 group-focus-within:text-slate-900 group-focus-within:border-b-orange-300 ${isWithdrawn ? 'bg-red-50/50 text-red-300 italic' : 'bg-white text-slate-700'}`}>
                                                    {student.name} {isWithdrawn && <span className="ml-1 text-[8px] font-black uppercase text-red-500">(R)</span>}
                                                </td>
                                                {DIMENSIONS.map(dim => visibleDimensions[dim.key] && (
                                                    <React.Fragment key={dim.key}>
                                                        {Array.from({length: criteriaConfig[dim.key].count}).map((_, i) => (
                                                            <td key={i} className={`p-1 border-r-2 border-b-2 ${dim.cellBorder} text-center ${dim.colBg} ${isWithdrawn ? 'bg-red-50/10' : ''}`}> 
                                                                <div className="relative w-full h-8 flex items-center">
                                                                    <input type="text" disabled={isWithdrawn} inputMode="decimal" value={gradesData[student.id]?.[dim.key]?.[i] || ''} onChange={e => { const val = e.target.value; if (val === '' || /^\d{0,2}(\.\d{0,1})?$/.test(val)) { if (parseFloat(val) > dim.maxPoints) return; handleGradeChange(student.id, dim.key, i, val); } }} className={`w-full h-full text-center text-sm font-bold ${dim.colorText} bg-transparent border-2 border-transparent rounded focus:bg-white focus:border-orange-500 outline-none transition-all disabled:text-slate-200 disabled:cursor-not-allowed shadow-[inset_0_0_0_1px_transparent] focus:shadow-[0_0_0_2px_rgba(249,115,22,0.2)]`} placeholder={isWithdrawn ? "R" : "-"} />
                                                                    {!isWithdrawn && (
                                                                        <div className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-pointer text-slate-300 hover:text-orange-600" onMouseDown={(e) => handlePickerTrigger(e, student.id, dim.key, i, dim.maxPoints)}><i className="fas fa-chevron-down text-[8px]"></i></div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        ))}
                                                        <td className={`p-1 border-r-2 border-b-2 ${dim.cellBorder} text-center font-black text-xl ${dim.proColBg} ${dim.colorText} ${isWithdrawn ? 'bg-red-50/30 text-red-100' : ''}`}>{scores[`${dim.key}_weighted`] ?? 0}</td>
                                                    </React.Fragment>
                                                ))}
                                                {/* Nota Final Escritorio igualada a text-xl */}
                                                <td className={`sticky right-0 !z-[40] font-black text-xl text-center p-2 border-b-2 border-l-2 border-slate-600 ${isWithdrawn ? 'bg-red-50/50 text-red-100' : scores.final < 51 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{scores.final ?? 0}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                    )}
                </div>
            </main>

            {pickerState && pickerState.rect && (
                <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setPickerState(null)}></div>
                    <div className="fixed z-[201] bg-white border-2 border-slate-300 rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ top: pickerState.rect.bottom + 5, left: pickerState.rect.left - 10, width: pickerState.rect.width + 20, maxHeight: '200px' }}>
                        <div className="bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-500 text-center border-b border-slate-200 uppercase">Seleccionar</div>
                        <div className="overflow-y-auto p-1 space-y-1 custom-scrollbar">
                            {Array.from({ length: pickerState.maxPoints }, (_, i) => i + 1).reverse().map(num => (
                                <button key={num} onClick={() => handlePickerSelect(num.toString())} className="w-full text-center py-2 rounded-lg font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">{num}</button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <Modal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} title={<span><i className="fas fa-paste text-blue-600 mr-2"></i> Pegar Notas - {pasteTargetDimension?.toUpperCase()}</span>} footer={<><Button variant="secondary" onClick={() => setIsPasteModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={handlePasteProcess} className="ml-2">Procesar</Button></>}>
                <div className="space-y-4 text-slate-700">
                    <p className="text-sm font-medium">Copie la columna desde Excel y péguela aquí para distribuirla automáticamente.</p>
                    <textarea className="w-full h-64 border-2 border-slate-300 rounded-xl p-4 font-mono text-sm text-black bg-slate-50 focus:bg-white focus:border-blue-500 outline-none shadow-inner" placeholder="Pega tus notas aquí..." value={pasteContent} onChange={e => setPasteContent(e.target.value)}></textarea>
                </div>
            </Modal>
            
            <Modal isOpen={isCentralizerModalOpen} onClose={() => setIsCentralizerModalOpen(false)} title={<span><i className="fas fa-table text-indigo-600 mr-2"></i> Centralizador Anual</span>} footer={<Button variant="secondary" onClick={() => setIsCentralizerModalOpen(false)} className="w-full">Cerrar</Button>}>
                {isLoadingCentralizer ? (
                     <div className="flex flex-col items-center justify-center py-10"><div className="loader-circle mb-4 !w-12 !h-12 !border-4"></div><p className="text-slate-500 font-bold animate-pulse">Calculando...</p></div>
                ) : (
                    <div className="neo-table-container shadow-none border-0 overflow-x-auto">
                        <table className="neo-table w-full">
                            <thead><tr><th className="w-10 text-center bg-slate-100 text-slate-600">N°</th><th className="text-left bg-slate-100 text-slate-600 pl-4">Estudiante</th><th className="text-center bg-indigo-50 text-indigo-700">T1</th><th className="text-center bg-indigo-50 text-indigo-700">T2</th><th className="text-center bg-indigo-50 text-indigo-700">T3</th><th className="text-center bg-slate-800 text-white">PRO</th></tr></thead>
                            <tbody>{centralizerData.map((student, idx) => {
                                const isWithdrawn = student.status === 'WITHDRAWN';
                                return (
                                    <tr key={student.id} className={`hover:bg-slate-50 ${isWithdrawn ? 'bg-red-50/30 opacity-60' : ''}`}><td className="text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td><td className={`font-black text-[11px] uppercase border-r border-slate-100 pl-4 ${isWithdrawn ? 'text-red-300' : 'text-slate-700'}`}>{student.name} {isWithdrawn && "(R)"}</td><td className="text-center font-bold text-slate-500 border-r border-slate-100">{student.t1 || '-'}</td><td className="text-center font-bold text-slate-500 border-r border-slate-100">{student.t2 || '-'}</td><td className="text-center font-bold text-slate-500 border-r border-slate-100">{student.t3 || '-'}</td><td className={`text-center font-black text-xl ${isWithdrawn ? 'text-red-200 bg-red-50' : student.anual >= 51 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{student.anual}</td></tr>
                                );
                            })}</tbody>
                        </table>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default GradesScreen;
