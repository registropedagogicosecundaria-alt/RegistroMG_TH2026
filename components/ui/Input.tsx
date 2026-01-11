import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ icon, className, ...props }, ref) => {
    return (
        <div className="relative group w-full">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300 z-10">
                    {icon}
                </div>
            )}
            <input
                ref={ref}
                // Increased padding-left (pl-14) to prevent overlap with the icon
                className={`block w-full ${icon ? 'pl-16' : 'pl-6'} pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium shadow-sm hover:border-slate-300 ${className}`}
                {...props}
            />
        </div>
    );
});

Input.displayName = 'Input';
export default Input;