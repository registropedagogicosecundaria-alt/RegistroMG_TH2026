
import React, { useState, useEffect, useCallback } from 'react';
import { View } from './types';
import LoginScreen from './components/LoginScreen';
import MenuScreen from './components/MenuScreen';
import CaratulaScreen from './components/CaratulaScreen';
import CourseManagementScreen from './components/CourseManagementScreen';
import AttendanceScreen from './components/AttendanceScreen';
import GradesScreen from './components/GradesScreen';
import BoletinesScreen from './components/BoletinesScreen';
import FiliacionScreen from './components/FiliationScreen';
import TemasScreen from './components/TemasScreen';
import ReportScreen from './components/ReportScreen';
import ScheduleScreen from './components/ScheduleScreen';
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';

const App: React.FC = () => {
    const [view, setView] = useState<View>(View.Login);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [courseManagementTarget, setCourseManagementTarget] = useState<View | null>(null);
    const [isLoadingApp, setIsLoadingApp] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        const restoreSession = async () => {
            setIsLoadingApp(true);
            try {
                const storedUser = localStorage.getItem('app_userName');
                const storedUserId = localStorage.getItem('app_userId');
                const storedCourse = localStorage.getItem('app_selectedCourse');
                const storedView = localStorage.getItem('app_view');

                if (storedUser && storedUserId) {
                    setUserName(storedUser);
                    setUserId(storedUserId);
                    setIsLoggedIn(true);
                    if (storedCourse) setSelectedCourse(storedCourse);
                    if (storedView) {
                        const parsedView = parseInt(storedView);
                        if (!isNaN(parsedView)) setView(parsedView);
                        else setView(View.Menu);
                    } else setView(View.Menu);
                }
            } catch (e) {
                console.error("Error restoring session", e);
            } finally {
                setIsLoadingApp(false);
            }
        };
        restoreSession();
    }, []);

    useEffect(() => {
        if (isLoggedIn) localStorage.setItem('app_view', view.toString());
    }, [view, isLoggedIn]);

    const handleLoginSuccess = useCallback(async (nameFromLogin: string, uuidFromLogin: string) => {
        setIsLoadingApp(true);
        setUserName(nameFromLogin);
        setUserId(uuidFromLogin);
        localStorage.setItem('app_userName', nameFromLogin); 
        localStorage.setItem('app_userId', uuidFromLogin);
        setTimeout(() => {
            setIsLoggedIn(true);
            setView(View.Menu);
            setIsLoadingApp(false);
            setShowWelcome(true);
        }, 1500);
    }, []);

    const handleLogout = useCallback(() => {
        setIsLoadingApp(true);
        setTimeout(() => {
            setIsLoggedIn(false);
            setUserName('');
            setUserId('');
            setSelectedCourse(null);
            localStorage.removeItem('app_userName');
            localStorage.removeItem('app_userId');
            localStorage.removeItem('app_selectedCourse');
            localStorage.removeItem('app_view');
            setView(View.Login);
            setIsLoadingApp(false);
            setShowWelcome(false);
        }, 1000);
    }, []);

    const navigateToCourseManagement = useCallback((targetView: View) => {
        setCourseManagementTarget(targetView);
        setView(View.CourseManagement);
    }, []);

    const handleCourseSelected = useCallback((course: string) => {
        setIsLoadingApp(true);
        setTimeout(() => {
            setSelectedCourse(course);
            localStorage.setItem('app_selectedCourse', course);
            if (courseManagementTarget) setView(courseManagementTarget);
            else setView(View.Menu);
            setIsLoadingApp(false);
        }, 800);
    }, [courseManagementTarget]);

    const renderView = () => {
        if (!isLoggedIn) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        switch (view) {
            case View.Menu: return <MenuScreen setView={setView} onLogout={handleLogout} navigateToCourseManagement={navigateToCourseManagement} selectedCourse={selectedCourse} userName={userName} userId={userId} />;
            case View.Caratula: return <CaratulaScreen setView={setView} userId={userId} />;
            case View.CourseManagement: return <CourseManagementScreen targetView={courseManagementTarget} onCourseSelected={handleCourseSelected} setView={setView} userId={userId} />;
            case View.Filiation: return <FiliacionScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Attendance: return <AttendanceScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Grades: return <GradesScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Boletines: return <BoletinesScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Temas: return <TemasScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Reports: return <ReportScreen setView={setView} selectedCourse={selectedCourse} userId={userId} />;
            case View.Horario: return <ScheduleScreen setView={setView} userId={userId} />;
            default: return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }
    };

    return (
        <div className="min-h-screen relative font-sans text-slate-800">
            {isLoadingApp && (
                <div className="loader-container">
                    <div className="loader-circle mb-4"></div>
                    <h2 className="text-xl font-bold text-slate-700 tracking-wider">CARGANDO SISTEMA...</h2>
                </div>
            )}
            <div className="relative z-10">{renderView()}</div>
            <Modal
                isOpen={showWelcome}
                onClose={() => setShowWelcome(false)}
                title={<span className="text-emerald-600"><i className="fas fa-shield-alt mr-2"></i> Verificación de Identidad</span>}
                footer={<Button onClick={() => setShowWelcome(false)} className="w-full !bg-emerald-600 !border-b-emerald-800 hover:!bg-emerald-500 text-xl py-4">CONFIRMAR Y ACCEDER</Button>}
            >
                <div className="text-center py-6 space-y-6">
                    <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center animate-bounce-slight shadow-lg border-4 border-emerald-200">
                        <i className="fas fa-user-check text-5xl text-emerald-600"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-medium text-slate-500 mb-1">Bienvenido(a) a su Registro Personal</h2>
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight px-4 border-b-4 border-emerald-500 inline-block pb-1">{userName}</h1>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default App;
