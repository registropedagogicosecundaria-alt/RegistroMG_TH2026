import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
    className?: string;
    isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    isLoading = false,
    ...props
}) => {
    // Base classes for structure and 3D effect
    // We use border-b-4 to create the "side" of the 3D button
    // active:border-b-0 and translate-y simulate the press
    const baseClasses = "relative inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-wide uppercase rounded-xl transition-all duration-150 transform active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-4";

    // Colors: Main bg, Border-bottom color (darker shade), Text
    const variantClasses = {
        primary:   'bg-blue-500 border-b-4 border-blue-700 text-white hover:bg-blue-400 hover:border-blue-600',
        secondary: 'bg-slate-200 border-b-4 border-slate-400 text-slate-700 hover:bg-slate-100 hover:border-slate-300',
        danger:    'bg-red-500 border-b-4 border-red-700 text-white hover:bg-red-400 hover:border-red-600',
        success:   'bg-green-500 border-b-4 border-green-700 text-white hover:bg-green-400 hover:border-green-600',
        warning:   'bg-yellow-400 border-b-4 border-yellow-600 text-yellow-900 hover:bg-yellow-300 hover:border-yellow-500',
        info:      'bg-cyan-500 border-b-4 border-cyan-700 text-white hover:bg-cyan-400 hover:border-cyan-600',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            <span className="flex items-center gap-2">
                {isLoading && (
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </span>
        </button>
    );
};

export default Button;