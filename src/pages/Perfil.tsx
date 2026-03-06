import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, LogOut, Sun, Moon, User, Settings, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { habitService } from '../lib/habitService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Perfil() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<{ first_name: string, last_name: string, level: string, rigidity_level: number } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showRigidityConfirm, setShowRigidityConfirm] = useState<{ level: number, label: string } | null>(null);
    const [isLight, setIsLight] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false
    );

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            const data = await habitService.getUserProfile(user.id);
            if (data) setProfile(data as any);
        };
        fetchProfile();
    }, [user]);

    const handleRigidityChange = async (newLevel: number, force: boolean = false) => {
        if (!user || !profile || isSaving) return;

        // If it's a downgrade and not forced, show confirmation
        if (newLevel < profile.rigidity_level && !force) {
            const labels = ['Compasivo', 'Equilibrado', 'Dureza'];
            setShowRigidityConfirm({ level: newLevel, label: labels[newLevel - 1] });
            return;
        }

        setIsSaving(true);
        setErrorMsg(null);
        setShowRigidityConfirm(null);

        try {
            const validation = await habitService.validateRigidityUpgrade(user.id, profile.rigidity_level, newLevel);

            if (!validation.allowed) {
                setErrorMsg(validation.message);
                // Reset error after 5s
                setTimeout(() => setErrorMsg(null), 5000);
                return;
            }

            await habitService.updateUserProfile(user.id, { rigidity_level: newLevel });
            setProfile(prev => prev ? { ...prev, rigidity_level: newLevel } : null);
        } catch (err) {
            console.error('Error changing rigidity:', err);
        } finally {
            setIsSaving(false);
        }
    };

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
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 pb-10">
            <header className="mb-10 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Perfil</h1>
            </header>

            <div className="flex-1 space-y-8">
                {/* User Info Header */}
                <div className="flex items-center gap-5 px-1">
                    <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary tracking-tight">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
                        </h2>
                        <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest bg-main px-2 py-0.5 rounded-full border border-border">
                            Nivel {profile?.level || '...'}
                        </span>
                    </div>
                </div>

                <section>
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4 px-1">Configuración del Sistema</h2>
                    <div className="bg-surface rounded-3xl border border-surface divide-y divide-white/5 overflow-hidden">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <Settings className="w-5 h-5 text-tertiary opacity-50" />
                                <span className="text-sm font-bold text-primary">Tema: {isLight ? 'Claro' : 'Oscuro'}</span>
                            </div>
                            {isLight ? (
                                <Moon className="w-4 h-4 text-tertiary" />
                            ) : (
                                <Sun className="w-4 h-4 text-tertiary" />
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/setup')}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <Layers className="w-5 h-5 text-accent opacity-50" />
                                <span className="text-sm font-bold text-primary">Gestionar Hábitos</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-tertiary" />
                        </button>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Rigurosidad del Sistema</h2>
                        {errorMsg && (
                            <span className="text-[8px] font-bold text-error uppercase animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Ley de Base Biológica activa
                            </span>
                        )}
                    </div>

                    <div className="bg-surface rounded-[32px] p-1.5 border border-surface flex gap-1">
                        {[1, 2, 3].map((level) => {
                            const labels = ['Compasivo', 'Equilibrado', 'Dureza'];
                            const isActive = profile?.rigidity_level === level;

                            return (
                                <button
                                    key={level}
                                    onClick={() => handleRigidityChange(level)}
                                    disabled={isSaving}
                                    className={`flex-1 py-4 rounded-[26px] transition-all duration-300 relative
                                        ${isActive ? 'bg-accent text-white shadow-lg' : 'text-tertiary hover:text-secondary'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest block">
                                        {labels[level - 1]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {errorMsg && (
                        <p className="mt-4 px-4 py-3 bg-error/5 border border-error/10 rounded-2xl text-[10px] text-error font-medium leading-relaxed italic animate-in slide-in-from-top-2">
                            ⚠️ {errorMsg}
                        </p>
                    )}
                    <p className="mt-4 text-[10px] text-tertiary/60 leading-relaxed px-1">
                        * El ascenso de nivel requiere un promedio de energía &gt; 7.0 en los últimos 7 días.
                    </p>
                </section>

                <section>
                    <div className="bg-surface rounded-3xl border border-surface overflow-hidden">
                        <button
                            onClick={signOut}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-error/5 transition-colors group"
                        >
                            <span className="text-sm font-bold text-error">Finalizar Sesión Operativa</span>
                            <LogOut className="w-4 h-4 text-error opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </section>
            </div>

            {/* Rigidity Confirmation Modal */}
            {showRigidityConfirm && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-main/95 backdrop-blur-xl animate-in fade-in duration-500">
                    <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border-warning/20 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-warning/10 text-warning flex items-center justify-center mb-6">
                                <AlertCircle className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-bold text-primary mb-3">¿Bajar Rigurosidad a {showRigidityConfirm.label}?</h2>
                            <p className="text-sm text-tertiary leading-relaxed mb-8">
                                Estás activando la <strong>Ley de Descenso</strong>. Podrás volver a subir de nivel únicamente si cumples con la **Ley de Base Biológica** (Energía prom. &gt; 7.0 por 7 días).
                            </p>

                            <div className="space-y-3 w-full">
                                <Button
                                    onClick={() => handleRigidityChange(showRigidityConfirm.level, true)}
                                    className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-2xl bg-warning hover:bg-warning/90 border-transparent text-white"
                                >
                                    Confirmar Descenso
                                </Button>
                                <button
                                    onClick={() => setShowRigidityConfirm(null)}
                                    className="w-full py-4 text-xs font-bold text-tertiary hover:text-primary uppercase tracking-[0.2em] transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="mt-16 text-center">
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em]">HumanHab MVP2 • v2.0.0</p>
                <p className="text-[9px] text-tertiary/40 mt-1 uppercase tracking-widest italic">Adaptive Bio-Hacking Interface</p>
            </div>
        </div>
    );
}
