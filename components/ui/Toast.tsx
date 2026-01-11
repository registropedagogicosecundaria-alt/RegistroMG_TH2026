
import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
    const [show, setShow] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        let progressInterval: ReturnType<typeof setInterval>;

        if (isVisible) {
            setShow(true);
            setProgress(100);

            // Animate Progress Bar (4 seconds = 4000ms)
            // Update every 40ms to get 100 steps
            progressInterval = setInterval(() => {
                setProgress((prev) => Math.max(0, prev - 1));
            }, 40);

            // Auto close after 4 seconds
            timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, 4000);
        } else {
            setShow(false);
        }

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [isVisible, onClose]);

    if (!isVisible && !show) return null;

    return (
        // Wrapper: Fixed overlay covering the screen, but allowing clicks to pass through empty space if needed
        <div 
            className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all duration-300 ${
                show ? 'opacity-100 backdrop-blur-sm bg-slate-900/20' : 'opacity-0 pointer-events-none'
            }`}
        >
            <style>{`
                @keyframes check-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                @keyframes success-pop {
                    0% { transform: scale(0.8) translateY(20px); opacity: 0; }
                    60% { transform: scale(1.05) translateY(-5px); opacity: 1; }
                    100% { transform: scale(1) translateY(0); }
                }
                .animate-success-pop {
                    animation: success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .animate-check {
                    animation: check-bounce 0.6s infinite;
                }
            `}</style>

            {/* The Toast Box */}
            <div 
                className={`
                    relative w-full max-w-md bg-white/95 backdrop-blur-xl 
                    border-2 border-emerald-500/20 rounded-[2.5rem] 
                    shadow-[0_20px_60px_-10px_rgba(16,185,129,0.4)]
                    overflow-hidden transform transition-all duration-300
                    flex flex-col items-center justify-center
                    text-center p-8 pointer-events-auto
                    ${show ? 'animate-success-pop scale-100' : 'scale-90 opacity-0 translate-y-10'}
                `}
            >
                {/* Close Button (Top Right) */}
                <button 
                    onClick={() => { setShow(false); setTimeout(onClose, 200); }} 
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                {/* Big Animated Icon */}
                <div className="mb-6 relative">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-check">
                        <i className="fas fa-check text-5xl text-white"></i>
                    </div>
                    {/* Decorative Rings */}
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-emerald-100 animate-ping opacity-20"></div>
                </div>

                {/* Text Content */}
                <div className="space-y-2 mb-6">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        ¡Guardado!
                    </h2>
                    <p className="text-xl text-slate-600 font-medium leading-relaxed px-4">
                        {message}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                        className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-[40ms] ease-linear rounded-full"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
