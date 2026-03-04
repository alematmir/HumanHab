import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Cycle {
    id: string;
    habit_title: string;
    habit_description: string;
    duration_days: number;
    start_date: string;
    is_active: boolean;
}

export function Ciclo() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [energy, setEnergy] = useState(5);
    const [friction, setFriction] = useState(5);
    const [status, setStatus] = useState<'DIFICULTAD' | 'CUMPLIDO'>('CUMPLIDO');
    const [note, setNote] = useState('');

    // Cycle state
    const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dayNumber, setDayNumber] = useState(1);

    useEffect(() => {
        if (!user) return;

        const fetchActiveCycle = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('cycles')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (!data) {
                    // No active cycle, redirect to setup
                    navigate('/setup');
                    return;
                }

                setActiveCycle(data as Cycle);

                // Helper to get local YYYY-MM-DD
                const getLocalDateStr = (d: Date) => {
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Calculate current day using local date parts to avoid TZ shifts
                const [sy, sm, sd] = data.start_date.split('-').map(Number);
                const localStart = new Date(sy, sm - 1, sd);
                localStart.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - localStart.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                setDayNumber(diffDays);
                setProgress(Math.min(Math.round((diffDays / data.duration_days) * 100), 100));

                // Check if today's log already exists (Local Date)
                const todayStr = getLocalDateStr(today);
                const { data: logData, error: logError } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', todayStr)
                    .maybeSingle();

                if (!logError && logData) {
                    setFriction(logData.friction);
                    setEnergy(logData.energy);
                    setStatus(logData.status);
                    setNote(logData.note || '');
                    setIsClosed(true);
                }
            } catch (err) {
                console.error('Error fetching cycle:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveCycle();
    }, [user, navigate]);

    const handleSaveLog = async () => {
        if (!user || !activeCycle || isClosed) return;

        setIsSaving(true);
        try {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const { error } = await supabase
                .from('daily_logs')
                .upsert({
                    user_id: user.id,
                    cycle_id: activeCycle.id,
                    date: todayStr,
                    friction,
                    energy,
                    status,
                    note: note.trim() || null
                }, { onConflict: 'user_id,date' });

            if (error) throw error;

            setIsClosed(true);
            alert('¡Registro diario guardado con éxito!');
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error saving log:', error);
            alert('Error al guardar el registro: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-tertiary animate-pulse uppercase tracking-widest text-[10px] font-bold">Iniciando Ciclo...</div>
            </div>
        );
    }

    if (!activeCycle) return null;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 pb-6">
            <header className="flex items-center justify-between mb-4 mt-2">
                <button className="p-2 -ml-2 text-primary hover:text-accent transition-colors">
                    <Calendar className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-primary tracking-tight uppercase">CICLO ACTUAL</h1>
                    <p className="text-accent text-sm font-medium">Día {dayNumber} / {activeCycle.duration_days}</p>
                </div>
                <button className="p-2 -mr-2 text-primary hover:text-accent transition-colors relative">
                    <Bell className="w-6 h-6" />
                    <div className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-main"></div>
                </button>
            </header>

            <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest pl-1">Progreso del ciclo</span>
                    <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                {/* Hábito Actual Card */}
                <Card className="rounded-3xl border-transparent p-0 overflow-hidden shadow-sm bg-surface">
                    <div className="bg-accent/10 p-3 flex flex-col items-center justify-center relative min-h-[100px]">
                        <div className="absolute top-3 left-4 bg-white dark:bg-black px-3 py-1 rounded-full shadow-sm">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none block pt-0,1">Hábito Actual</span>
                        </div>
                        <svg className="w-10 h-10 text-accent mt-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3331 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2ZM6.44917 12.0163C7.57551 11.2335 8.91037 10.9575 10.3392 10.7423C11.5367 10.562 12.1818 10.4552 13.0673 10.7495L13.1206 10.7686C14.0754 11.1396 15.3411 11.5168 16.9234 10.8715L17.2001 10.7588C17.7126 10.5501 18.2982 10.8354 18.4907 11.3323C18.6831 11.8293 18.3756 12.3789 17.8632 12.5877L17.5866 12.7003C15.3781 13.6009 13.57 13.0427 12.0743 12.2882C11.284 11.8895 10.7291 11.458 10.0402 11.2337C9.3757 11.0175 8.56272 11.4168 7.58552 12.0959L4.44917 14.2754L4.82136 17.1511C4.88795 17.6657 4.52643 18.138 4.01358 18.2045C3.50073 18.271 3.02821 17.9092 2.96162 17.3946L2.45783 13.5009C2.4206 13.2132 2.50853 12.9238 2.69466 12.6942C2.8808 12.4646 3.14819 12.3168 3.44078 12.302L6.44917 12.0163ZM12 11.6667C12.3682 11.6667 12.6667 11.9652 12.6667 12.3333V18C12.6667 18.9205 13.4127 19.6667 14.3333 19.6667C15.2539 19.6667 16 18.9205 16 18H18C18 20.025 16.3584 21.6667 14.3333 21.6667C12.3083 21.6667 10.6667 20.025 10.6667 18V12.3333C10.6667 11.9652 10.9652 11.6667 11.3333 11.6667H12Z" />
                        </svg>
                    </div>
                    <div className="p-4">
                        <h2 className="text-[16px] font-bold text-primary mb-1">{activeCycle.habit_title}</h2>
                        <p className="text-[12px] text-secondary leading-tight mb-3">
                            {activeCycle.habit_description}
                        </p>
                        <button className="text-[12px] w-full flex items-center justify-center gap-2 bg-accent/5 hover:bg-accent/10 text-accent py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-colors">
                            Ver Detalles <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </Card>

                {/* Fricción Hoy Slider */}
                <Card className="rounded-3xl p-4 shadow-sm border-transparent bg-surface">
                    <Slider
                        label="FRICCIÓN HOY"
                        value={friction}
                        onChange={setFriction}
                        colorClass="bg-accent"
                        disabled={isClosed}
                    />
                </Card>

                {/* Energía General Slider */}
                <Card className="rounded-3xl p-4 shadow-sm border-transparent bg-surface">
                    <Slider
                        label="ENERGÍA GENERAL HOY"
                        value={energy}
                        onChange={setEnergy}
                        colorClass="bg-success/80"
                        minLabel="Agotado"
                        maxLabel="Óptima"
                        isDynamic={true}
                        disabled={isClosed}
                    />
                </Card>

                {/* ¿Pudiste avanzar con tu hábito? Segmented Control */}
                <Card className="rounded-3xl p-4 shadow-sm border-transparent bg-surface">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="w-full sm:w-1/2 pr-2 text-center sm:text-left">
                            <h2 className="text-sm font-bold text-primary leading-tight mb-1">¿Pudiste avanzar con tu hábito?</h2>
                            <p className="text-[10px] text-tertiary leading-tight">Registra si el día queda abierto o cerrado</p>
                        </div>

                        <div className="w-full sm:w-1/2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl flex">
                            <button
                                onClick={() => !isClosed && setStatus('DIFICULTAD')}
                                disabled={isClosed}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200 ${status === 'DIFICULTAD'
                                    ? (isClosed ? 'bg-zinc-800 text-zinc-400' : 'bg-white dark:bg-white text-black shadow-sm scale-[1.02]')
                                    : (isClosed ? 'text-zinc-600' : 'text-tertiary hover:text-secondary')
                                    } ${isClosed ? 'cursor-not-allowed' : ''}`}
                            >
                                Me ha costado
                            </button>
                            <button
                                onClick={() => !isClosed && setStatus('CUMPLIDO')}
                                disabled={isClosed}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200 ${status === 'CUMPLIDO'
                                    ? (isClosed ? 'bg-zinc-800 text-accent/50' : 'bg-white dark:bg-white text-accent shadow-sm scale-[1.02]')
                                    : (isClosed ? 'text-zinc-600' : 'text-tertiary hover:text-secondary')
                                    } ${isClosed ? 'cursor-not-allowed' : ''}`}
                            >
                                Lo logré
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Optional Note */}
                <div className="px-2 pt-1">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-widest mb-1 block pl-1">
                        Nota del día (Opcional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isClosed}
                        placeholder={isClosed ? "Registro cerrado." : "📝 ¿Cómo te sentiste hoy? Ej: Tuve un buen día, pero me costó arrancar la meditación."}
                        className={`w-full bg-surface border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none h-16 shadow-sm transition-all ${isClosed ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : ''}`}
                    />
                </div>
            </div>

            <div className="mt-2 mb-1 sticky bottom-4 z-10">
                <Button
                    onClick={handleSaveLog}
                    disabled={isSaving || isClosed}
                    className={`w-full py-3 text-sm font-bold tracking-wide rounded-2xl shadow-lg transition-all ${isClosed ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/30' : ''}`}
                >
                    {isSaving ? 'Guardando...' : isClosed ? 'Registro Diario Completado ✓' : 'Finalizar Registro Diario'}
                </Button>
            </div>
        </div>
    );
}
