
import React, { useState, useEffect, useCallback } from 'react';
import { View } from '../types';
import * as api from '../services/googleAppsScript';
import Card from './ui/Card';
import Button from './ui/Button';

interface CourseManagementScreenProps {
    onCourseSelected: (course: string) => void;
    setView: (view: View) => void;
    targetView: View | null;
    userId: string; // Changed from userName to userId
}

const CourseManagementScreen: React.FC<CourseManagementScreenProps> = ({ onCourseSelected, setView, targetView, userId }) => {
    const [courses, setCourses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCourseGrade, setNewCourseGrade] = useState('1');
    const [newCourseParallel, setNewCourseParallel] = useState('A');
    const [isCreating, setIsCreating] = useState(false);

    // --- THEME CONFIGURATION BASED ON MODULE ---
    const getTheme = (view: View | null) => {
        switch (view) {
            case View.Filiation:
                return {
                    colorName: 'purple',
                    gradient: 'from-purple-600 to-indigo-900',
                    icon: 'fas fa-users',
                    title: 'Filiación',
                    description: 'Gestione la inscripción de estudiantes y cree nuevos cursos para la gestión académica.',
                    subtitle: 'Gestión de Listas',
                    border: 'border-purple-500',
                    borderRest: 'border-purple-100',
                    text: 'text-purple-700',
                    bgHover: 'hover:bg-purple-50',
                    shadow: 'hover:shadow-purple-500/20',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-600',
                    button: 'bg-purple-600 hover:bg-purple-500'
                };
            case View.Attendance:
                return {
                    colorName: 'emerald',
                    gradient: 'from-emerald-500 to-teal-800',
                    icon: 'fas fa-calendar-check',
                    title: 'Asistencia',
                    description: 'Realice el control diario de asistencia y genere reportes mensuales automáticos.',
                    subtitle: 'Control Diario',
                    border: 'border-emerald-500',
                    borderRest: 'border-emerald-100',
                    text: 'text-emerald-700',
                    bgHover: 'hover:bg-emerald-50',
                    shadow: 'hover:shadow-emerald-500/20',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    button: 'bg-emerald-600 hover:bg-emerald-500'
                };
            case View.Grades:
                return {
                    colorName: 'orange',
                    gradient: 'from-orange-500 to-red-700',
                    icon: 'fas fa-edit',
                    title: 'Notas',
                    description: 'Registre calificaciones por dimensiones (Ser, Saber, Hacer, Decidir) y centralice notas.',
                    subtitle: 'Registro Pedagógico',
                    border: 'border-orange-500',
                    borderRest: 'border-orange-100',
                    text: 'text-orange-700',
                    bgHover: 'hover:bg-orange-50',
                    shadow: 'hover:shadow-orange-500/20',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    button: 'bg-orange-600 hover:bg-orange-500'
                };
            default:
                return {
                    colorName: 'blue',
                    gradient: 'from-blue-600 to-indigo-800',
                    icon: 'fas fa-layer-group',
                    title: 'Cursos',
                    description: 'Seleccione un curso para acceder a la información.',
                    subtitle: 'Gestión General',
                    border: 'border-blue-500',
                    borderRest: 'border-blue-100',
                    text: 'text-blue-700',
                    bgHover: 'hover:bg-blue-50',
                    shadow: 'hover:shadow-blue-500/20',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-500'
                };
        }
    };

    const theme = getTheme(targetView);
    const allowCreation = targetView === View.Filiation;

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Updated to pass userId
            const courseList = await api.getCourses(userId);
            setCourses(courseList.sort());
        } catch (err: any) {
            setError(err.message || 'No se pudieron cargar los cursos.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if(userId) fetchCourses();
    }, [fetchCourses, userId]);

    const handleCreateCourse = async () => {
        setIsCreating(true);
        setError('');
        const courseLabel = `${newCourseGrade} ${newCourseParallel}`;
        if (courses.includes(courseLabel)) {
            setError(`El curso "${courseLabel}" ya existe.`);
            setIsCreating(false);
            return;
        }

        try {
            // Updated to pass userId
            const result = await api.createCourse(courseLabel, userId);
            if (result === 'OK') {
                await fetchCourses();
            } else {
                setError(result || 'Error al crear el curso.');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCourse = async (courseLabel: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!allowCreation) return;

        const confirmDelete = window.confirm(`¿Eliminar curso "${courseLabel}"? Se perderán todos los datos asociados.`);
        if (!confirmDelete) return;
        
        setError('');
        setIsLoading(true);
        try {
            // Updated to pass userId
            await api.deleteCourse(courseLabel, userId);
            await fetchCourses();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el curso.');
        } finally {
            setIsLoading(false);
        }
    };

    const gradeOptions = [
        { value: '1', label: 'PRIMERO' }, { value: '2', label: 'SEGUNDO' },
        { value: '3', label: 'TERCERO' }, { value: '4', label: 'CUARTO' },
        { value: '5', label: 'QUINTO' }, { value: '6', label: 'SEXTO' },
    ];
    const parallelOptions = ['A', 'B', 'C', 'D', 'E'];

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white font-sans overflow-hidden">
            
            {/* --- LEFT PANEL: MODULE CONTEXT --- */}
            <div className={`w-full lg:w-[350px] bg-gradient-to-br ${theme.gradient} text-white p-8 flex flex-col justify-between relative shadow-2xl z-20`}>
                
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                     <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                     <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
                </div>

                {/* Top Content */}
                <div className="relative z-10">
                    <button 
                        onClick={() => setView(View.Menu)} 
                        className="group flex items-center gap-3 text-white/80 hover:text-white transition-all mb-10 hover:-translate-x-1"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 border border-white/10">
                            <i className="fas fa-arrow-left text-sm"></i>
                        </div>
                        <span className="font-bold tracking-wide uppercase text-xs">Volver al Menú</span>
                    </button>

                    <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4 tracking-tight">
                        {theme.title}
                    </h1>
                    <p className="text-white/90 text-base font-medium leading-relaxed max-w-xs">
                        {theme.description}
                    </p>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 mt-10 lg:mt-0 hidden sm:block">
                    {/* Huge Background Icon */}
                    <div className="text-[10rem] text-white/10 absolute -bottom-10 -right-10 transform rotate-12 pointer-events-none">
                        <i className={theme.icon}></i>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg w-fit">
                            <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isLoading ? 'Sincronizando...' : 'Sistema Listo'}
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-white/50 pl-2">
                            ID: {userId}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: CONTENT --- */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                <div className="w-full h-full overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        
                        {/* Create Course - Only Filiation */}
                        {allowCreation && (
                            <div className="mb-10 animate-fade-in-up">
                                <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <i className="fas fa-plus"></i>
                                        </div>
                                        <h2 className="text-xl font-black text-purple-800 uppercase tracking-tight">Crear Nuevo Curso</h2>
                                    </div>
                                    
                                    {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-sm font-bold shadow-sm">{error}</div>}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Grado Escolar</label>
                                            <select value={newCourseGrade} onChange={e => setNewCourseGrade(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 text-lg rounded-xl p-4 focus:border-purple-500 focus:outline-none font-bold transition-all cursor-pointer">
                                                {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Paralelo</label>
                                            <select value={newCourseParallel} onChange={e => setNewCourseParallel(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 text-lg rounded-xl p-4 focus:border-purple-500 focus:outline-none font-bold transition-all cursor-pointer">
                                                {parallelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleCreateCourse} 
                                            disabled={isCreating}
                                            className="w-full h-[64px] bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-magic"></i> CREAR CURSO</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Title Section */}
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">Seleccione un Curso</h3>
                            <div className="h-px bg-slate-200 flex-1 ml-6"></div>
                        </div>

                        {/* Courses Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="h-64 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm animate-pulse"></div>
                                ))}
                            </div>
                        ) : courses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                                {courses.map((course, index) => {
                                    const parts = course.split(' ');
                                    const gradeNum = parts[0];
                                    const parallel = parts[1];
                                    const gradeLabel = gradeOptions.find(o => o.value === gradeNum)?.label || 'GRADO';

                                    return (
                                        <div 
                                            key={course} 
                                            onClick={() => { 
                                                // CRITICAL FIX: Do NOT call api.storeSelectedCourse.
                                                // This prevents backend global state pollution.
                                                // We rely purely on passing the courseName in future requests.
                                                onCourseSelected(course); 
                                            }}
                                            className={`group relative bg-white rounded-[1.5rem] border-2 ${theme.borderRest} hover:${theme.border} ${theme.bgHover} cursor-pointer p-6 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl ${theme.shadow} overflow-hidden flex flex-col justify-between min-h-[240px]`}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {/* Delete Button */}
                                            {allowCreation && (
                                                <button 
                                                    onClick={(e) => handleDeleteCourse(course, e)}
                                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-500 flex items-center justify-center transition-all z-20 hover:bg-red-50 shadow-sm"
                                                    title="Eliminar curso"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
                                            )}

                                            {/* Top: Number */}
                                            <div className="relative z-10 flex justify-center pt-4">
                                                <div className={`w-20 h-20 rounded-2xl ${theme.iconBg} flex items-center justify-center text-4xl font-black ${theme.iconColor} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                                    {gradeNum}
                                                </div>
                                            </div>

                                            {/* Bottom: Details */}
                                            <div className="relative z-10 text-center mt-6">
                                                <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{gradeLabel}</h3>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paralelo</span>
                                                    <span className={`text-xl font-black ${theme.text}`}>{parallel}</span>
                                                </div>
                                            </div>

                                            {/* Hover Action Indicator */}
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 group-hover:h-2 transition-all duration-300">
                                                <div className={`h-full w-0 group-hover:w-full ${theme.button} transition-all duration-500 ease-out`}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[2rem] border-4 border-dashed border-slate-200 opacity-70">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-4xl mb-6">
                                    <i className="fas fa-ghost"></i>
                                </div>
                                <p className="text-slate-400 font-bold text-xl">No se encontraron cursos</p>
                                <p className="text-xs text-slate-300 mt-2 font-mono">ID: {userId}</p>
                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <button 
                                        onClick={fetchCourses} 
                                        className="px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors"
                                    >
                                        <i className="fas fa-sync-alt mr-2"></i> Actualizar Lista
                                    </button>
                                    {!allowCreation && (
                                        <p className="text-slate-400 font-medium mt-2 text-sm">Vaya a "Filiación" para crear nuevos cursos.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseManagementScreen;