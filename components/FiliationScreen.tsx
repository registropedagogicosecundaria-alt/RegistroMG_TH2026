
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
    
    // Estados para Modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteContent, setPasteContent] = useState('');
    const [currentStudent, setCurrentStudent] = useState<any>(null);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    
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

    // Abrir formulario para Nuevo o Editar
    const handleOpenForm = (student?: any[], index?: number) => {
        if (student) {
            setCurrentStudent([...student]);
            setCurrentIndex(index!);
        } else {
            const newStudent = Array(12).fill('');
            newStudent[0] = students.length + 1;
            newStudent[11] = 'ACTIVE';
            setCurrentStudent(newStudent);
            setCurrentIndex(null);
        }
        setIsFormModalOpen(true);
    };

    const handleSaveStudentFromForm = async () => {
        if (!currentStudent) return;
        if (!currentStudent[1]) {
            alert("El nombre del estudiante es obligatorio.");
            return;
        }

        const updatedStudents = [...students];
        const studentToSave = [...currentStudent];
        studentToSave[1] = enforceUppercase(studentToSave[1]);
        studentToSave[6] = calcularEdad(studentToSave[5]);

        if (currentIndex !== null) {
            updatedStudents[currentIndex] = studentToSave;
        } else {
            updatedStudents.push(studentToSave);
        }

        setIsProcessing(true);
        try {
            // Re-enumerar
            const finalData = updatedStudents.map((s, i) => {
                const row = [...s];
                row[0] = i + 1;
                return row;
            });

            await api.saveFiliationData(finalData, selectedCourse!, userId);
            setToast({ show: true, message: 'Estudiante guardado correctamente.' });
            setIsFormModalOpen(false);
            await fetchData();
        } catch (err) {
            alert("Error al guardar en el servidor");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (studentId: any, name: string, rowIndex: number) => {
        if (!window.confirm(`¿Seguro que desea eliminar a ${name || 'este registro'} definitivamente?`)) return;
        
        setIsProcessing(true);
        try {
            if (studentId && studentId.toString().length > 5) {
                await api.deleteStudentRow(studentId, selectedCourse!, userId);
            }
            const updated = [...students];
            updated.splice(rowIndex, 1);
            // Re-enumerar localmente antes de guardar el set completo (opcional pero recomendado)
            const finalData = updated.map((s, i) => {
                const row = [...s];
                row[0] = i + 1;
                return row;
            });
            await api.saveFiliationData(finalData, selectedCourse!, userId);
            setToast({ show: true, message: 'Estudiante eliminado.' });
            await fetchData();
        } finally {
            setIsProcessing(false);
        }
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
        setToast({ show: true, message: 'Datos importados. No olvide Guardar cambios.' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc]">
            <Toast isVisible={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
            
            <Header title="Filiación de Estudiantes" icon={<i className="fas fa-users-cog"></i>}>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button onClick={() => setIsPasteModalOpen(true)} variant="info" className="!rounded-xl shadow-md !px-4">
                        <i className="fas fa-file-excel mr-2"></i> IMPORTAR
                    </Button>
                    <Button onClick={() => handleOpenForm()} variant="primary" className="!rounded-xl shadow-lg !px-6">
                        <i className="fas fa-user-plus mr-2"></i> NUEVO
                    </Button>
                    <Button onClick={() => setView(View.CourseManagement)} variant="secondary" className="!rounded-xl shadow-md !px-4">
                        <i className="fas fa-chevron-left mr-2"></i> ATRÁS
                    </Button>
                </div>
            </Header>

            <main className="p-4 md:p-8 flex-1 flex flex-col items-center">
                <div className="w-full max-w-7xl">
                    <div className="mb-8 flex justify-between items-end bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-1">{selectedCourse}</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{courseName}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estudiantes</div>
                             <div className="text-3xl font-black text-blue-600">{students.length}</div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] shadow-xl border-2 border-slate-100">
                            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Sincronizando Base de Datos...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-2xl overflow-hidden relative">
                            {/* CONTENEDOR DE TABLA CON SCROLL Y COLUMNAS FIJAS */}
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse text-xs min-w-max">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                            {/* Columna Fija Izquierda: # */}
                                            <th className="sticky left-0 z-20 bg-slate-900 p-5 w-14 text-center border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">#</th>
                                            {/* Columna Fija Izquierda: Estudiante */}
                                            <th className="sticky left-14 z-20 bg-slate-900 p-5 text-left min-w-[300px] border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Estudiante</th>
                                            
                                            {/* Columnas con Scroll */}
                                            <th className="p-5 w-24 text-center border-r border-slate-800">Género</th>
                                            <th className="p-5 w-32 text-center border-r border-slate-800">Cédula</th>
                                            <th className="p-5 w-40 text-center border-r border-slate-800">RUDE</th>
                                            <th className="p-5 w-36 text-center border-r border-slate-800">Fec. Nac.</th>
                                            <th className="p-5 w-20 text-center border-r border-slate-800">Edad</th>
                                            <th className="p-5 text-left min-w-[250px] border-r border-slate-800">Tutor Responsable</th>
                                            <th className="p-5 w-32 text-center border-r border-slate-800">Parentesco</th>
                                            <th className="p-5 w-32 text-center border-r border-slate-800">Celular</th>
                                            
                                            {/* Columna Fija Derecha: Acciones */}
                                            <th className="sticky right-0 z-20 bg-slate-900 p-5 w-32 text-center shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((student, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50 text-center font-black text-slate-300 border-r border-slate-50 p-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{student[0]}</td>
                                                <td className="sticky left-14 z-10 bg-white group-hover:bg-blue-50 p-4 border-r border-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-black text-slate-800 uppercase text-sm truncate max-w-[300px]">
                                                    {student[1]}
                                                </td>
                                                
                                                <td className="p-4 text-center border-r border-slate-50 font-bold text-slate-600">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] ${student[2] === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {student[2] || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 font-bold text-slate-700">{student[3] || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50 font-mono text-[10px] text-slate-400">{student[4] || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50 font-medium text-slate-600">{student[5] || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50 font-black text-slate-400">{student[6] || '--'}</td>
                                                <td className="p-4 text-left border-r border-slate-50 font-bold text-slate-700 uppercase">{student[7] || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50 italic text-slate-500">{student[8] || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50 font-bold text-blue-600">{student[9] || '-'}</td>
                                                
                                                <td className="sticky right-0 z-10 bg-white group-hover:bg-blue-50 p-4 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleOpenForm(student, idx)} 
                                                            className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 flex items-center justify-center"
                                                            title="Editar Estudiante"
                                                        >
                                                            <i className="fas fa-edit text-xs"></i>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(student[10], student[1], idx)} 
                                                            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center"
                                                            title="Eliminar Estudiante"
                                                        >
                                                            <i className="fas fa-trash-alt text-xs"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[1em] px-4 leading-relaxed">
                        Sistema de Filiación Segura • Sincronización Automática
                    </div>
                </div>
            </main>

            {/* MODAL DE FORMULARIO DE ESTUDIANTE */}
            {isFormModalOpen && currentStudent && (
                <Modal 
                    isOpen={isFormModalOpen} 
                    onClose={() => setIsFormModalOpen(false)} 
                    title={
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <i className={`fas ${currentIndex !== null ? 'fa-user-edit' : 'fa-user-plus'}`}></i>
                            </div>
                            <span className="text-lg">{currentIndex !== null ? 'Editar Estudiante' : 'Nuevo Estudiante'}</span>
                        </div>
                    }
                    footer={
                        <div className="flex gap-2 w-full">
                            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)} className="flex-1">Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveStudentFromForm} isLoading={isProcessing} className="flex-[2]">Guardar Datos</Button>
                        </div>
                    }
                >
                    <div className="space-y-8">
                        {/* SECCIÓN 1: DATOS DEL ALUMNO */}
                        <div className="section-blue p-6 space-y-5">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-id-card"></i> Datos Personales
                            </h4>
                            <div className="space-y-4">
                                {/* Fix: Added separate label and removed unsupported label prop from Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                                    <Input 
                                        value={currentStudent[1]} 
                                        onChange={e => {
                                            const updated = [...currentStudent];
                                            updated[1] = e.target.value.toUpperCase();
                                            setCurrentStudent(updated);
                                        }}
                                        placeholder="APELLIDOS Y NOMBRES"
                                        icon={<i className="fas fa-user"></i>}
                                        className="!py-4 !text-base"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cédula (CI)</label>
                                        <Input 
                                            value={currentStudent[3]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[3] = e.target.value;
                                                setCurrentStudent(updated);
                                            }}
                                            placeholder="C.I."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">RUDE</label>
                                        <Input 
                                            value={currentStudent[4]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[4] = e.target.value;
                                                setCurrentStudent(updated);
                                            }}
                                            placeholder="Código RUDE"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Nacimiento</label>
                                        <Input 
                                            type="date"
                                            value={currentStudent[5]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[5] = e.target.value;
                                                updated[6] = calcularEdad(e.target.value);
                                                setCurrentStudent(updated);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Género</label>
                                        <select 
                                            value={currentStudent[2]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[2] = e.target.value;
                                                setCurrentStudent(updated);
                                            }}
                                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: DATOS DEL TUTOR */}
                        <div className="section-amber p-6 space-y-5">
                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-hand-holding-heart"></i> Datos del Tutor
                            </h4>
                            <div className="space-y-4">
                                {/* Fix: Added separate label and removed unsupported label prop from Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre del Tutor</label>
                                    <Input 
                                        value={currentStudent[7]} 
                                        onChange={e => {
                                            const updated = [...currentStudent];
                                            updated[7] = e.target.value.toUpperCase();
                                            setCurrentStudent(updated);
                                        }}
                                        placeholder="NOMBRE COMPLETO DEL TUTOR"
                                        icon={<i className="fas fa-user-friends"></i>}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Parentesco</label>
                                        <Input 
                                            value={currentStudent[8]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[8] = e.target.value.toUpperCase();
                                                setCurrentStudent(updated);
                                            }}
                                            placeholder="EJ: MADRE"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Celular Tutor</label>
                                        <Input 
                                            value={currentStudent[9]} 
                                            onChange={e => {
                                                const updated = [...currentStudent];
                                                updated[9] = e.target.value;
                                                setCurrentStudent(updated);
                                            }}
                                            placeholder="70000000"
                                            icon={<i className="fas fa-mobile-alt"></i>}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL DE IMPORTACIÓN */}
            <Modal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} title="Importar desde Excel">
                <div className="space-y-4 p-2">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                         <p className="text-[10px] font-black text-blue-700 uppercase leading-relaxed">
                            Pegue las columnas en este orden: Nombre, Sexo, C.I., RUDE, Fec. Nac., Tutor, Vínculo, Celular.
                         </p>
                    </div>
                    <textarea 
                        className="w-full h-56 border-2 border-slate-200 rounded-[1.5rem] p-4 font-mono text-[10px] focus:border-blue-500 outline-none shadow-inner bg-slate-50"
                        value={pasteContent}
                        onChange={e => setPasteContent(e.target.value)}
                        placeholder="ALEMAN ARIAS JUAN [TAB] M [TAB] 1234567..."
                    ></textarea>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button onClick={() => setIsPasteModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handlePasteProcess} variant="primary" disabled={!pasteContent.trim()}>Procesar Datos</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FiliationScreen;
