import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, LogOut, Sun, Moon } from 'lucide-react';

export function Perfil() {
    const { signOut } = useAuthStore();
    const [isLight, setIsLight] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false
    );

    const toggleTheme = () => {
        const isCurrentlyLight = document.documentElement.classList.contains('light');
        if (isCurrentlyLight) {
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setIsLight(false);
        } else {
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
            setIsLight(true);
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500">
            <header className="mb-8 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Perfil</h1>
            </header>

            <div className="flex-1">
                <h2 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-4">Configuración de sistema</h2>

                <div className="bg-surface rounded-none sm:rounded-2xl border-y sm:border border-border divide-y divide-border -mx-4 sm:mx-0">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                        <span className="text-base font-medium text-primary">Tema: {isLight ? 'Claro' : 'Oscuro'}</span>
                        {isLight ? (
                            <Moon className="w-5 h-5 text-tertiary group-hover:text-secondary transition-colors" />
                        ) : (
                            <Sun className="w-5 h-5 text-tertiary group-hover:text-secondary transition-colors" />
                        )}
                    </button>
                    <button className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <span className="text-base font-medium text-primary">Ciclo actual</span>
                        <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-secondary transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <span className="text-base font-medium text-primary">Finalizar ciclo</span>
                        <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-secondary transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <span className="text-base font-medium text-primary">Reiniciar ciclo</span>
                        <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-secondary transition-colors" />
                    </button>
                </div>

                <div className="mt-8 bg-surface rounded-none sm:rounded-2xl border-y sm:border border-border -mx-4 sm:mx-0">
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-between p-5 text-left bg-transparent hover:bg-error/10 transition-colors group"
                    >
                        <span className="text-base font-medium text-error transition-colors">Cerrar sesión</span>
                        <LogOut className="w-5 h-5 text-error/50 group-hover:text-error transition-colors" />
                    </button>
                </div>
            </div>

            <div className="mt-12 mb-8 text-center flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-secondary">HumanHab MVP1 v1.0.6</p>
                <p className="text-xs text-tertiary mt-1">Behavioral Coherence System</p>
            </div>
        </div>
    );
}
