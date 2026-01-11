
import React, { useState, useEffect, useCallback } from 'react';
import { View } from '../types';
import * as api from '../services/googleAppsScript';
import Header from './ui/Header';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Toast from './ui/Toast';

const calcularEdad = (fecha: string | Date | null): string => {
    if (!fecha) return '';
    try {
        const dateString = typeof fecha === 'string' && fecha.length === 10 ? `${fecha}T00:00:00` : fecha;
        const nacimiento = new Date(dateString);
        if (isNaN(nacimiento.getTime())) return '';
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) { edad--; }
        return edad >= 0 ? String(edad) : '';
    } catch (e) { return ''; }
};

const enforceUppercase = (value: string) => value.trim().toUpperCase();

const FiliationScreen: React.FC<{ setView: (v: View) => void, selectedCourse: string | null, userId: string }> = ({ setView, selectedCourse, userId }) => {
    const [students, setStudents] = useState<any[][]>([]);
    const [courseName, setCourseName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteContent, setPasteContent] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });

    const fetchData = useCallback(async () => {
        if (!selectedCourse) return;
        setIsLoading(true);
        try {
            const { data, courseName } = await api.getFiliationData(selectedCourse, userId);
            setStudents(data || []);
            setCourseName(courseName || selectedCourse);
        } catch (err) { 
            console.error(err);
        } finally { 
            setIsLoading(false); 
        }
    }, [selectedCourse, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        if (!selectedCourse) return;
        setIsProcessing(true);
        try {
            const dataToSave = students.map((row, index) => {
                const newRow = [...row];
                newRow[0] = index + 1;
                newRow[1] = enforceUppercase(newRow[1] || '');
                newRow[6] = calcularEdad(newRow[5]);
                return newRow;
            });
            await api.saveFiliationData(dataToSave, selectedCourse, userId);
            setToast({ show: true, message: 'Registros actualizados exitosamente.' });
            await fetchData();
        } catch (err) {
            alert("Error al sincronizar con el servidor");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddStudent = () => {
        const lastId = students.length > 0 ? parseInt(students[students.length - 1][0]) || students.length : 0;
        const newStudent = Array(12).fill('');
        newStudent[0] = lastId + 1;
        newStudent[11] = 'ACTIVE';
        setStudents([...students, newStudent]);
        setToast({ show: true, message: 'Se ha añadido un nuevo casillero.' });
    };

    const handleDelete = async (studentId: any, name: string, rowIndex: number) => {
        if (!window.confirm(`¿Seguro que desea eliminar a ${name || 'este registro'}??`)) return;
        
        if (studentId && studentId.length > 5) {
            setIsProcessing(true);
            try {
                await api.deleteStudentRow(studentId, selectedCourse!, userId);
                await fetchData();
                setToast({ show: true, message: 'Estudiante eliminado definitivamente.' });
            } finally {
                setIsProcessing(false);
            }
        } else {
            const updated = [...students];
            updated.splice(rowIndex, 1);
            setStudents(updated);
        }
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: any) => {
        const updated = students.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newRow = [...row];
                newRow[colIndex] = value;
                if (colIndex === 5) newRow[6] = calcularEdad(value);
                return newRow;
            }
            return row;
        });
        setStudents(updated);
    };

    const handlePasteProcess = () => {
        const lines = pasteContent.trim().split(/\r?\n/);
        const newStudents = [...students];
        lines.forEach((line) => {
            const cols = line.split('\t');
            if (cols.length < 1) return;
            const mapped = Array(12).fill('');
            mapped[0] = newStudents.length + 1;
            mapped[1] = enforceUppercase(cols[0] || '');
            mapped[2] = (cols[1] || '').trim().toUpperCase();
            mapped[3] = (cols[2] || '').trim();
            mapped[4] = (cols[3] || '').trim();
            mapped[5] = (cols[4] || '').trim();
            mapped[6] = calcularEdad(mapped[5]);
            mapped[7] = (cols[5] || '').trim().toUpperCase();
            mapped[8] = (cols[6] || '').trim().toUpperCase();
            mapped[9] = (cols[7] || '').trim();
            mapped[11] = 'ACTIVE';
            newStudents.push(mapped);
        });
        setStudents(newStudents);
        setIsPasteModalOpen(false);
        setPasteContent('');
    };

    const TableInput = ({ value, onChange, placeholder, isAmber = false, type = "text" }: any) => (
        <input 
            type={type}
            value={value || ''} 
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all shadow-sm ${isAmber ? 'focus:border-amber-400 focus:ring-4 focus:ring-amber-50' : 'focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
        />
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc]">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            
            <Header title="Filiación" icon={<i className="fas fa-users-cog"></i>}>
                <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 max-w-[90vw] sm:max-w-none">
                    <Button onClick={() => setIsPasteModalOpen(true)} variant="info" className="!rounded-xl shadow-md !px-2.5 sm:!px-4 !py-2.5">
                        <i className="fas fa-file-excel mr-1.5 sm:mr-2"></i>
                        <span className="text-[10px] sm:text-xs">EXCEL</span>
                    </Button>
                    <Button onClick={handleAddStudent} variant="primary" className="!rounded-xl shadow-md !px-2.5 sm:!px-4 !py-2.5">
                        <i className="fas fa-user-plus mr-1.5 sm:mr-2"></i>
                        <span className="text-[10px] sm:text-xs">NUEVO</span>
                    </Button>
                    <Button onClick={handleSave} variant="success" isLoading={isProcessing} className="!rounded-xl shadow-lg !px-2.5 sm:!px-4 !py-2.5">
                        <i className="fas fa-save mr-1.5 sm:mr-2"></i>
                        <span className="text-[10px] sm:text-xs">GUARDAR</span>
                    </Button>
                    <Button onClick={() => setView(View.CourseManagement)} variant="secondary" className="!rounded-xl shadow-md !px-2.5 sm:!px-4 !py-2.5">
                        <i className="fas fa-chevron-left mr-1.5 sm:mr-2"></i>
                        <span className="text-[10px] sm:text-xs">ATRÁS</span>
                    </Button>
                </div>
            </Header>

            <main className="p-4 md:p-8 flex-1">
                <div className="max-w-[100%] mx-auto">
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-1">{selectedCourse}</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{courseName}</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex gap-4">
                            <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Datos Alumno</div>
                            <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 text-[10px] font-black text-amber-600 uppercase tracking-widest">Datos Tutor</div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-xl border-2 border-slate-100">
                            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Sincronizando Base de Datos...</p>
                        </div>
                    ) : (
                        <>
                            {/* VISTA PC: TABLA CON ENCABEZADO UNIFICADO SLATE-900 */}
                            <div className="hidden lg:block bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-2xl overflow-hidden">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                            <th className="p-5 w-14 text-center border-r border-slate-800">#</th>
                                            <th className="p-5 text-left min-w-[280px] border-r border-slate-800">Estudiante</th>
                                            <th className="p-5 w-20 text-center border-r border-slate-800">Género</th>
                                            <th className="p-5 w-32 text-center border-r border-slate-800">Cédula</th>
                                            <th className="p-5 w-36 text-center border-r border-slate-800">RUDE</th>
                                            <th className="p-5 w-36 text-center border-r border-slate-800">Fec. Nac.</th>
                                            <th className="p-5 w-16 text-center border-r border-slate-800">Edad</th>
                                            <th className="p-5 text-left min-w-[220px] border-r border-slate-800">Tutor (Nombre)</th>
                                            <th className="p-5 w-28 text-center border-r border-slate-800">Parentesco</th>
                                            <th className="p-5 w-28 text-center border-r border-slate-800">Celular</th>
                                            <th className="p-5 w-20 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((student, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-3 text-center font-black text-slate-300 border-r border-slate-50">{idx + 1}</td>
                                                <td className="p-3 border-r border-slate-50">
                                                    <input 
                                                        value={student[1]} 
                                                        onChange={e => handleCellChange(idx, 1, e.target.value.toUpperCase())}
                                                        className="w-full bg-transparent font-black text-slate-800 outline-none border-b-2 border-transparent focus:border-blue-500 transition-all uppercase text-sm"
                                                        placeholder="APELLIDOS Y NOMBRES"
                                                    />
                                                </td>
                                                <td className="p-3 text-center border-r border-slate-50">
                                                    <select value={student[2]} onChange={e => handleCellChange(idx, 2, e.target.value)} className="bg-transparent font-bold outline-none text-center text-xs">
                                                        <option value="">-</option>
                                                        <option value="M">M</option>
                                                        <option value="F">F</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 bg-blue-50/10 border-r border-slate-50">
                                                    <TableInput value={student[3]} onChange={(e: any) => handleCellChange(idx, 3, e.target.value)} placeholder="C.I." />
                                                </td>
                                                <td className="p-3 bg-blue-50/10 border-r border-slate-50">
                                                    <TableInput value={student[4]} onChange={(e: any) => handleCellChange(idx, 4, e.target.value)} placeholder="RUDE" />
                                                </td>
                                                <td className="p-3 text-center border-r border-slate-50">
                                                    <input type="date" value={student[5]} onChange={e => handleCellChange(idx, 5, e.target.value)} className="text-[11px] font-bold text-slate-600 outline-none bg-transparent"/>
                                                </td>
                                                <td className="p-3 text-center border-r border-slate-50">
                                                    <div className="text-xs font-black text-slate-400">{student[6] || '--'}</div>
                                                </td>
                                                <td className="p-3 bg-amber-50/10 border-r border-slate-50">
                                                    <TableInput isAmber value={student[7]} onChange={(e: any) => handleCellChange(idx, 7, e.target.value.toUpperCase())} placeholder="TUTOR" />
                                                </td>
                                                <td className="p-3 bg-amber-50/10 border-r border-slate-50">
                                                    <TableInput isAmber value={student[8]} onChange={(e: any) => handleCellChange(idx, 8, e.target.value.toUpperCase())} placeholder="Vínculo" />
                                                </td>
                                                <td className="p-3 bg-amber-50/10 border-r border-slate-50">
                                                    <TableInput isAmber value={student[9]} onChange={(e: any) => handleCellChange(idx, 9, e.target.value)} placeholder="CELULAR" />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleDelete(student[10], student[1], idx)} className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center mx-auto"><i className="fas fa-trash-alt text-xs"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* VISTA CELULAR: FICHA DIRECTA (TEXTO SIEMPRE VISIBLE EN BOTONES) */}
                            <div className="lg:hidden space-y-8 pb-10">
                                {students.map((student, idx) => (
                                    <div key={idx} className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-200 overflow-hidden relative">
                                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">{idx + 1}</span>
                                                <h3 className="text-white font-black uppercase text-sm tracking-widest">Estudiante</h3>
                                            </div>
                                            <button onClick={() => handleDelete(student[10], student[1], idx)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center"><i className="fas fa-trash-alt"></i></button>
                                        </div>

                                        <div className="p-6 space-y-8">
                                            <div className="section-blue p-6 space-y-5">
                                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                                    <i className="fas fa-id-card"></i> Datos Personales
                                                </h4>
                                                <input 
                                                    value={student[1]} 
                                                    onChange={e => handleCellChange(idx, 1, e.target.value.toUpperCase())}
                                                    className="premium-input text-lg uppercase"
                                                    placeholder="NOMBRE COMPLETO"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cédula</label>
                                                        <input value={student[3]} onChange={e => handleCellChange(idx, 3, e.target.value)} className="premium-input" placeholder="C.I."/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">RUDE</label>
                                                        <input value={student[4]} onChange={e => handleCellChange(idx, 4, e.target.value)} className="premium-input" placeholder="RUDE"/>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nacimiento</label>
                                                        <input type="date" value={student[5]} onChange={e => handleCellChange(idx, 5, e.target.value)} className="premium-input !px-2"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Género</label>
                                                        <select value={student[2]} onChange={e => handleCellChange(idx, 2, e.target.value)} className="premium-input">
                                                            <option value="">-</option>
                                                            <option value="M">M</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="section-amber p-6 space-y-5">
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                    <i className="fas fa-hand-holding-heart"></i> Información del Tutor
                                                </h4>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tutor Responsable</label>
                                                    <input 
                                                        value={student[7]} 
                                                        onChange={e => handleCellChange(idx, 7, e.target.value.toUpperCase())}
                                                        className="premium-input premium-input-amber"
                                                        placeholder="NOMBRE COMPLETO"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Parentesco</label>
                                                        <input value={student[8]} onChange={e => handleCellChange(idx, 8, e.target.value.toUpperCase())} className="premium-input premium-input-amber" placeholder="EJ: MADRE"/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Celular</label>
                                                        <input value={student[9]} onChange={e => handleCellChange(idx, 9, e.target.value)} className="premium-input premium-input-amber" placeholder="CELULAR"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Modal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} title="Importación">
                <div className="space-y-4 p-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Pega datos de Excel:</p>
                    <textarea 
                        className="w-full h-56 border-2 border-slate-200 rounded-[1.5rem] p-4 font-mono text-xs focus:border-blue-500 outline-none shadow-inner bg-slate-50"
                        value={pasteContent}
                        onChange={e => setPasteContent(e.target.value)}
                        placeholder="Nombre [TAB] Sexo [TAB] C.I. ..."
                    ></textarea>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => setIsPasteModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handlePasteProcess} variant="primary">Importar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
export default FiliationScreen;
