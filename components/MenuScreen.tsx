
import React, { useState } from 'react';
import { View } from '../types';
import { clearUserProperties } from '../services/googleAppsScript';
import Button from './ui/Button';

interface MenuScreenProps {
    setView: (view: View) => void;
    onLogout: () => void;
    navigateToCourseManagement: (targetView: View) => void;
    selectedCourse: string | null;
    userName: string;
    userId: string;
}

const MenuCard: React.FC<{
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
    delay: string;
    colorTheme: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo' | 'cyan';
}> = ({ icon, title, description, onClick, delay, colorTheme }) => {
    const themeStyles = {
        blue: { border: 'border-blue-500', borderRest: 'border-blue-100', text: 'text-blue-700', subText: 'text-slate-500 group-hover:text-blue-600/80', bgHover: 'group-hover:bg-blue-50', bgActive: 'active:bg-blue-100', shadowHover: 'group-hover:shadow-blue-500/20', iconColor: 'text-blue-500', iconBg: 'bg-blue-50', buttonRest: 'bg-blue-50 text-blue-600', buttonHover: 'group-hover:bg-blue-600 group-hover:text-white' },
        purple: { border: 'border-purple-500', borderRest: 'border-purple-100', text: 'text-purple-700', subText: 'text-slate-500 group-hover:text-purple-600/80', bgHover: 'group-hover:bg-purple-50', bgActive: 'active:bg-purple-100', shadowHover: 'group-hover:shadow-purple-500/20', iconColor: 'text-purple-500', iconBg: 'bg-purple-50', buttonRest: 'bg-purple-50 text-purple-600', buttonHover: 'group-hover:bg-purple-600 group-hover:text-white' },
        green: { border: 'border-emerald-500', borderRest: 'border-emerald-100', text: 'text-emerald-700', subText: 'text-slate-500 group-hover:text-emerald-600/80', bgHover: 'group-hover:bg-emerald-50', bgActive: 'active:bg-emerald-100', shadowHover: 'group-hover:shadow-emerald-500/20', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', buttonRest: 'bg-emerald-50 text-emerald-600', buttonHover: 'group-hover:bg-emerald-600 group-hover:text-white' },
        orange: { border: 'border-orange-500', borderRest: 'border-orange-100', text: 'text-orange-700', subText: 'text-slate-500 group-hover:text-orange-600/80', bgHover: 'group-hover:bg-orange-50', bgActive: 'active:bg-orange-100', shadowHover: 'group-hover:shadow-orange-500/20', iconColor: 'text-orange-500', iconBg: 'bg-orange-50', buttonRest: 'bg-orange-50 text-orange-600', buttonHover: 'group-hover:bg-orange-500 group-hover:text-white' },
        red: { border: 'border-rose-500', borderRest: 'border-rose-100', text: 'text-rose-700', subText: 'text-slate-500 group-hover:text-rose-600/80', bgHover: 'group-hover:bg-rose-50', bgActive: 'active:bg-rose-100', shadowHover: 'group-hover:shadow-rose-500/20', iconColor: 'text-rose-500', iconBg: 'bg-rose-50', buttonRest: 'bg-rose-50 text-rose-600', buttonHover: 'group-hover:bg-rose-600 group-hover:text-white' },
        indigo: { border: 'border-indigo-500', borderRest: 'border-indigo-100', text: 'text-indigo-700', subText: 'text-slate-500 group-hover:text-indigo-600/80', bgHover: 'group-hover:bg-indigo-50', bgActive: 'active:bg-indigo-100', shadowHover: 'group-hover:shadow-indigo-500/20', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-50', buttonRest: 'bg-indigo-50 text-indigo-600', buttonHover: 'group-hover:bg-indigo-600 group-hover:text-white' },
        cyan: { border: 'border-cyan-500', borderRest: 'border-cyan-100', text: 'text-cyan-700', subText: 'text-slate-500 group-hover:text-cyan-600/80', bgHover: 'group-hover:bg-cyan-50', bgActive: 'active:bg-cyan-100', shadowHover: 'group-hover:shadow-cyan-500/20', iconColor: 'text-cyan-500', iconBg: 'bg-cyan-50', buttonRest: 'bg-cyan-50 text-cyan-600', buttonHover: 'group-hover:bg-cyan-600 group-hover:text-white' }
    };
    const style = themeStyles[colorTheme];
    return (
        <div className="animate-fade-in-up w-full h-full" style={{ animationDelay: delay }} onClick={onClick}>
            <div className={`group relative w-full h-full min-h-[220px] sm:min-h-[240px] rounded-[1.5rem] cursor-pointer transition-all duration-300 ease-out bg-white border-2 ${style.borderRest} hover:${style.border} shadow-xl shadow-slate-200/50 ${style.shadowHover} ${style.bgHover} ${style.bgActive} hover:-translate-y-2 hover:scale-[1.01] active:scale-[0.98] overflow-hidden flex flex-col justify-between p-5 z-0`}>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                             <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center text-2xl shadow-sm ${style.iconColor} group-hover:scale-110 group-hover:bg-white transition-all duration-300 animate-float`}><i className={icon}></i></div>
                             <div className={`w-8 h-8 rounded-full border-2 ${style.border} bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-sm`}><i className={`fas fa-arrow-right text-xs ${style.text}`}></i></div>
                        </div>
                        <h3 className={`text-2xl sm:text-3xl font-black mb-2 tracking-tight leading-none ${style.text} transition-colors duration-300`}>{title}</h3>
                        <p className={`text-xs font-bold leading-relaxed transition-colors duration-300 ${style.subText} line-clamp-2`}>{description}</p>
                    </div>
                    <div className="mt-4 flex items-center">
                         <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm ${style.buttonRest} ${style.buttonHover}`}>Ingresar<i className="fas fa-chevron-right text-[8px]"></i></span>
                    </div>
                </div>
                <div className={`absolute -bottom-4 -right-4 text-[8rem] ${style.text} opacity-[0.03] group-hover:opacity-[0.08] transform rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 pointer-events-none`}><i className={icon}></i></div>
            </div>
        </div>
    );
};

const MenuScreen: React.FC<MenuScreenProps> = ({ setView, onLogout, navigateToCourseManagement, selectedCourse, userName, userId }) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    const handleLogoutClick = async () => {
        setIsLoggingOut(true);
        try { await clearUserProperties(); } finally { onLogout(); }
    };

    const menuItems: { icon: string; title: string; description: string; view?: View; target?: View; colorTheme: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo' | 'cyan' }[] = [
        { icon: 'fas fa-id-card', title: 'Carátula', description: 'Configuración general e información institucional.', view: View.Caratula, colorTheme: 'blue' },
        { icon: 'fas fa-clock', title: 'Horario', description: 'Gestión y organización de horarios semanales.', view: View.Horario, colorTheme: 'cyan' },
        { icon: 'fas fa-users', title: 'Filiación', description: 'Gestión de listas y creación de cursos.', target: View.Filiation, colorTheme: 'purple' },
        { icon: 'fas fa-calendar-alt', title: 'Asistencia', description: 'Control diario de asistencia y reportes.', target: View.Attendance, colorTheme: 'green' },
        { icon: 'fas fa-edit', title: 'Notas', description: 'Registro pedagógico por dimensiones.', target: View.Grades, colorTheme: 'orange' },
        { icon: 'fas fa-book-reader', title: 'Avance', description: 'Control de contenidos curriculares.', view: View.Temas, colorTheme: 'indigo' },
        { icon: 'fas fa-chart-pie', title: 'Reportes Pro', description: 'Dashboard analítico y exportado profesional.', target: View.Reports, colorTheme: 'red' },
    ];

    return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans">
            <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-2 sticky top-0 z-50 flex justify-between items-center shadow-sm h-14">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg"><i className="fas fa-cube text-xs"></i></div>
                    <h1 className="text-base font-black text-slate-800 leading-none">DASHBOARD</h1>
                </div>
                <button onClick={handleLogoutClick} disabled={isLoggingOut} className="px-3 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                    <span>Cerrar Sesión</span><i className={`fas ${isLoggingOut ? 'fa-spinner fa-spin' : 'fa-power-off'}`}></i>
                </button>
            </header>
            <main className="flex-grow w-full p-4 sm:p-6 max-w-7xl mx-auto flex flex-col justify-center">
                <div className="relative w-full bg-slate-900 rounded-3xl overflow-hidden mb-6 p-6 sm:p-8 shadow-2xl animate-fade-in-up">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-2">Panel de Control</div>
                            <h2 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tight">Bienvenido, {userName || 'Docente'}</h2>
                            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-xl leading-relaxed">Seleccione un módulo para comenzar. Todos los cambios se guardan automáticamente en la nube.</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {menuItems.map((item, index) => (
                        <MenuCard key={item.title} icon={item.icon} title={item.title} description={item.description} colorTheme={item.colorTheme} delay={`${index * 50}ms`} onClick={() => {
                            if (item.view !== undefined) setView(item.view);
                            else if (item.target) navigateToCourseManagement(item.target);
                        }} />
                    ))}
                </div>
            </main>
            <footer className="w-full text-center py-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest"><p>© 2024 GyG Educativa - v2.0</p></footer>
        </div>
    );
};
export default MenuScreen;
