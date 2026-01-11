import React from 'react';

interface HeaderProps {
    title: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, icon, children }) => {
    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center group">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                            {icon}
                        </div>
                        <h1 className="ml-3 text-2xl font-bold leading-7 text-slate-800 sm:truncate tracking-tight">
                            {title}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end overflow-x-auto pb-1 md:pb-0">
                        {children}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;