
import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import { validateUser } from '../services/googleAppsScript';

interface LoginScreenProps {
    onLoginSuccess: (name: string, userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [carnet, setCarnet] = useState('');
    const [celular, setCelular] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!carnet || !celular) {
            setError('Por favor, complete ambos campos.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await validateUser(carnet, celular);
            
            if (result && result.success === true) {
                // CRITICAL: Pasamos result.id (UUID) para que las consultas de cursos funcionen
                onLoginSuccess(result.nombre || 'DOCENTE', result.id);
            } else {
                // Mostramos el mensaje específico devuelto por la función
                setError(result?.message || 'Credenciales incorrectas o usuario inactivo.');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión con la base de datos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans bg-white overflow-hidden">
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes float-reverse {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(15px) rotate(-5deg); }
                }
                .floating-icon-1 { animation: float-slow 6s ease-in-out infinite; }
                .floating-icon-2 { animation: float-reverse 7s ease-in-out infinite; }
                .floating-icon-3 { animation: float-slow 8s ease-in-out infinite; }
            `}</style>

            {/* LEFT PANEL */}
            <div className="hidden xl:flex w-5/12 bg-[#0B0F19] relative flex-col justify-between p-12 text-white overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0">
                    <div className="absolute top-[15%] right-[10%] floating-icon-1">
                        <div className="text-8xl text-blue-500 opacity-80 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] transform rotate-12">
                            <i className="fas fa-book-open"></i>
                        </div>
                    </div>
                    <div className="absolute bottom-[20%] left-[10%] floating-icon-2">
                        <div className="text-8xl text-purple-500 opacity-80 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] transform -rotate-12">
                            <i className="fas fa-atom"></i>
                        </div>
                    </div>
                    <div className="absolute top-[40%] left-[5%] floating-icon-3">
                         <div className="text-7xl text-cyan-400 opacity-60 transform rotate-[25deg] blur-[1px]">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/50">
                            <i className="fas fa-cube"></i>
                        </div>
                        <span className="text-2xl font-bold tracking-wide">GyG Educativa</span>
                    </div>
                </div>
                <div className="relative z-10 max-w-lg mt-auto mb-8">
                    <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        Transformamos la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gestión Educativa.</span>
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed font-medium">
                        Plataforma integral para el control de asistencia, calificaciones y reportes académicos vinculado a Supabase.
                    </p>
                </div>
                <div className="relative z-10 text-sm text-slate-500 font-medium">
                    © 2024 Registro Pedagógico Digital v2.0
                </div>
            </div>

            {/* RIGHT PANEL - FORM */}
            <div className="w-full xl:w-7/12 flex items-center justify-center p-4 sm:p-8 relative bg-slate-100 overflow-hidden">
                 <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <svg className="absolute -left-10 top-0 h-full w-1/2 text-blue-200 opacity-60 transform -scale-x-100" viewBox="0 0 200 400" preserveAspectRatio="none">
                        <path d="M0 0 L200 200 M0 100 L200 300 M0 200 L200 400 M0 300 L200 500 M0 400 L200 600" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" fill="none" />
                    </svg>
                    <svg className="absolute -right-10 bottom-0 h-full w-1/2 text-blue-200 opacity-60" viewBox="0 0 200 400" preserveAspectRatio="none">
                        <path d="M0 0 L200 200 M0 100 L200 300 M0 200 L200 400 M0 300 L200 500 M0 400 L200 600" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" fill="none" />
                    </svg>
                 </div>
                 <div className="absolute top-6 left-6 xl:hidden flex items-center gap-3 z-20">
                     <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-base shadow-md">
                        <i className="fas fa-cube"></i>
                    </div>
                    <span className="font-bold text-slate-800 text-lg">GyG Educativa</span>
                 </div>
                <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-200 border-l-[8px] border-l-blue-600 my-auto relative z-10">
                    <div className="mb-6 space-y-3">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 tracking-tight">Bienvenido</h2>
                        <p className="text-slate-500 font-bold text-lg sm:text-xl">Ingrese sus credenciales para continuar</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xl font-black text-slate-700 mb-2 ml-1" htmlFor="carnet">
                                    Carnet de Identidad
                                </label>
                                <Input
                                    id="carnet"
                                    type="text"
                                    required
                                    value={carnet}
                                    onChange={(e) => setCarnet(e.target.value)}
                                    placeholder="1234569"
                                    className="!bg-slate-50 !border-slate-300 focus:!border-blue-600 !py-5 !pl-16 !pr-4 !rounded-xl text-2xl font-bold placeholder:text-slate-300 text-slate-900 shadow-inner"
                                    icon={<i className="fas fa-id-badge text-3xl text-slate-400 ml-1"></i>}
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-black text-slate-700 mb-2 ml-1" htmlFor="celular">
                                    Contraseña / Celular
                                </label>
                                <Input
                                    id="celular"
                                    type="password"
                                    required
                                    value={celular}
                                    onChange={(e) => setCelular(e.target.value)}
                                    placeholder="••••••"
                                    className="!bg-slate-50 !border-slate-300 focus:!border-blue-600 !py-5 !pl-16 !pr-4 !rounded-xl text-2xl font-bold placeholder:text-slate-300 text-slate-900 shadow-inner"
                                    icon={<i className="fas fa-lock text-3xl text-slate-400 ml-1"></i>}
                                />
                            </div>
                        </div>
                         {error && (
                             <div className="p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-700 text-lg font-bold flex items-center gap-3 shadow-sm">
                                 <i className="fas fa-exclamation-circle text-2xl"></i>
                                 {error}
                             </div>
                         )}
                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-16 text-2xl font-black tracking-widest uppercase !bg-blue-600 !border-b-[5px] !border-blue-800 hover:!bg-blue-500 !text-white !rounded-xl shadow-lg transition-transform active:scale-[0.98] active:border-b-0 active:translate-y-1" 
                                isLoading={isLoading} 
                                variant="primary" 
                            >
                                INICIAR SESIÓN
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
