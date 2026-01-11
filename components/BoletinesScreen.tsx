
import React, { useState, useEffect } from 'react';
import { View, Student } from '../types';
import * as api from '../services/googleAppsScript';
import Card from './ui/Card';
import Button from './ui/Button';
import Header from './ui/Header';

const BoletinesScreen: React.FC<{ setView: (view: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedTrimester, setSelectedTrimester] = useState<string>('1');
    const [grades, setGrades] = useState<Record<string, number> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (selectedCourse) {
            setIsLoading(true);
            // Pass userId
            api.getStudentsForAttendance(selectedCourse, userId).then(s => { setStudents(s); setIsLoading(false); }).catch(console.error);
        } else {
            setIsLoading(false);
        }
    }, [selectedCourse, userId]);
    
    useEffect(() => {
        if (selectedStudentId && selectedTrimester && selectedCourse) {
            setIsLoading(true);
            setGrades(null);
            // Pass userId
            api.getBoletinNotes(selectedStudentId, selectedTrimester, selectedCourse, userId)
               .then(notes => setGrades(Object.keys(notes).length ? notes : null))
               .catch(console.error)
               .finally(() => setIsLoading(false));
        }
    }, [selectedStudentId, selectedTrimester, selectedCourse, userId]);

    const handleGenerate = async () => {
        if (!grades) return;
        setIsGenerating(true);
        try {
            const student = students.find(s => String(s.id) === selectedStudentId);
            const url = await api.generateBoletinImage(student?.name || '', `Trimestre ${selectedTrimester}`, grades);
            window.open(url, '_blank');
        } catch (e) { alert('Error generating image'); } finally { setIsGenerating(false); }
    };

    const subjects = ["COMUNICACIÓN Y LENGUAJES", "CIENCIAS SOCIALES", "EDUCACIÓN FÍSICA Y DEPORTES", "EDUCACIÓN MUSICAL", "ARTES PLÁSTICAS Y VISUALES", "MATEMÁTICA", "TÉCNICA Y TECNOLÓGICA", "CIENCIAS NATURALES", "VALORES ESPIRITUALIDAD Y RELIGIONES"];

    return (
        <div className="flex flex-col h-screen bg-slate-50 w-full">
            <Header title="Boletines Trimestrales" icon={<i className="fas fa-certificate"></i>}>
                <Button onClick={() => setView(View.Menu)} variant="secondary" className="shadow-md"><i className="fas fa-arrow-left mr-2"></i>VOLVER</Button>
            </Header>
            <main className="p-4 sm:p-8 w-full mx-auto">
                {!selectedCourse ? (
                    <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <i className="fas fa-exclamation-triangle text-4xl text-slate-300 mb-2"></i>
                        <p className="text-slate-400 font-bold">Por favor seleccione un curso desde el menú principal.</p>
                    </div>
                ) : (
                    <>
                        <Card className="mb-8 border-l-4 border-l-red-500 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Estudiante</label>
                                    <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-blue-500 outline-none">
                                        <option value="">Seleccione...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Trimestre</label>
                                    <select value={selectedTrimester} onChange={e => setSelectedTrimester(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:border-blue-500 outline-none">
                                        <option value="1">1er Trimestre</option>
                                        <option value="2">2do Trimestre</option>
                                        <option value="3">3er Trimestre</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleGenerate} disabled={!grades} isLoading={isGenerating} variant="success" className="shadow-md"><i className="fas fa-image mr-2"></i>GENERAR IMAGEN</Button>
                            </div>
                        </Card>

                        {grades ? (
                            <Card className="!p-0 border-t-8 border-t-blue-600 overflow-hidden shadow-2xl w-full">
                                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                     <h3 className="font-black text-slate-800 uppercase tracking-wider text-lg">Reporte Oficial</h3>
                                     <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">CONFIDENCIAL</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {subjects.map(sub => (
                                        <div key={sub} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                            <span className="text-sm font-bold text-slate-600">{sub}</span>
                                            <span className={`text-lg font-black ${(grades[sub] || 0) >= 51 ? 'text-green-600' : 'text-red-500'}`}>{grades[sub] ?? '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ) : selectedStudentId && !isLoading ? (
                            <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
                                <i className="fas fa-folder-open text-4xl text-slate-300 mb-2"></i>
                                <p className="text-slate-400 font-bold">No hay notas registradas para este estudiante.</p>
                            </div>
                        ) : null}
                    </>
                )}
            </main>
        </div>
    );
};
export default BoletinesScreen;
