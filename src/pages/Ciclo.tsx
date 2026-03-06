import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Bell,
    CheckCircle2,
    XCircle,
    Sparkles,
    Droplets,
    BookOpen,
    Dumbbell,
    Moon,
    Target,
    ChevronRight,
    Zap,
    Plus,
    Info,
    X,
    AlertCircle,
    ShieldCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { habitService, Habit, HabitLog, EnergyEvent } from '../lib/habitService';

const ICON_MAP: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="w-5 h-5 text-accent" />,
    Droplets: <Droplets className="w-5 h-5 text-accent" />,
    BookOpen: <BookOpen className="w-5 h-5 text-accent" />,
    Dumbbell: <Dumbbell className="w-5 h-5 text-accent" />,
    Moon: <Moon className="w-5 h-5 text-accent" />,
    Target: <Target className="w-5 h-5 text-accent" />,
    Zap: <Zap className="w-5 h-5 text-accent" />,
    Plus: <Plus className="w-5 h-5 text-accent" />,
    Info: <Info className="w-5 h-5 text-accent" />,
};

export function Ciclo() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // State for data
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog>>({});
    const [summary, setSummary] = useState({ energy: 5, friction: 5, note: '' });
    const [energyEvents, setEnergyEvents] = useState<EnergyEvent[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDayClosed, setIsDayClosed] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventInput, setEventInput] = useState({ type: 'recarga' as 'recarga' | 'friccion', label: '' });
    const [todayStr] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [yesterdayStr] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [pendingIntervention, setPendingIntervention] = useState<{ type: string, message: string } | null>(null);
    const [protectionActive, setProtectionActive] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Get active habits
                const activeHabits = await habitService.getActiveHabits(user.id);
                setHabits(activeHabits);

                if (activeHabits.length === 0) {
                    navigate('/setup');
                    return;
                }

                // 2. Get today's habit logs
                const { data: logs } = await supabase
                    .from('habit_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', todayStr);

                const logsMap: Record<string, HabitLog> = {};
                (logs || []).forEach((l: HabitLog) => {
                    logsMap[l.habit_id] = l;
                });
                setHabitLogs(logsMap);

                // 3. Get today's summary
                const { data: sumData } = await supabase
                    .from('daily_summaries')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', todayStr)
                    .maybeSingle();

                if (sumData) {
                    setSummary({
                        energy: sumData.energy,
                        friction: sumData.friction,
                        note: sumData.note || ''
                    });
                    setIsDayClosed(true); // If summary exists, the day is "closed"
                }

                // 4. Get today's energy events
                const events = await habitService.getEnergyEventsForDate(user.id, todayStr);
                setEnergyEvents(events);

                // 5. Check for N+1 intervention (Yesterday's anomaly)
                if (!sumData) { // Only check if today isn't closed yet
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('created_at, anchor_2_symptoms, anchor_9_symptoms')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    const createdAt = new Date(profile?.created_at || user?.created_at || new Date());
                    const now = new Date();
                    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);

                    setIsCalibrating(diffDays <= 7);

                    if (diffDays > 7) {
                        const yesterdaySummary = await habitService.getDailySummary(user.id, yesterdayStr);
                        if (yesterdaySummary?.operational_state === 'Riesgo' || yesterdaySummary?.operational_state === 'Regulación') {
                            setPendingIntervention({
                                type: yesterdaySummary.operational_state,
                                message: yesterdaySummary.operational_state === 'Riesgo'
                                    ? `Ayer detectamos [${profile?.anchor_2_symptoms || 'fuga de enfoque'}]. Para no romper el hilo, hoy te propongo activar el Protocolo de Protección (10% de esfuerzo).`
                                    : 'Tu sistema estuvo bajo estrés ayer. Prioricemos la estabilidad hoy con el Protocolo de Protección.'
                            });
                        }
                    }
                }

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, navigate, todayStr]);

    const handleToggleHabit = async (habitId: string) => {
        if (isDayClosed || !user) return;

        const currentLog = habitLogs[habitId];
        const newStatus = !currentLog?.is_completed;

        try {
            const updatedLog = await habitService.upsertHabitLog({
                habit_id: habitId,
                user_id: user.id,
                date: todayStr,
                friction: 5, // Default for now
                is_completed: newStatus
            });

            setHabitLogs(prev => ({
                ...prev,
                [habitId]: updatedLog
            }));
        } catch (err) {
            console.error('Error toggling habit:', err);
        }
    };

    const handleCloseDay = async () => {
        if (!user || isDayClosed) return;
        setShowCloseConfirm(true);
    };

    const executeCloseDay = async () => {
        if (!user || isDayClosed) return;

        setIsSaving(true);
        setShowCloseConfirm(false);
        try {
            // Ensure all habits have a log record (even if failed)
            for (const habit of habits) {
                if (!habitLogs[habit.id]) {
                    await habitService.upsertHabitLog({
                        habit_id: habit.id,
                        user_id: user.id,
                        date: todayStr,
                        friction: 5,
                        is_completed: false // Default to failed if not interacted
                    });
                }
            }

            // Save global summary
            const { error } = await supabase
                .from('daily_summaries')
                .upsert({
                    user_id: user.id,
                    date: todayStr,
                    energy: summary.energy,
                    friction: summary.friction,
                    note: summary.note.trim() || null,
                    operational_state: getOperationalState()
                });

            if (error) throw error;

            setIsDayClosed(true);
        } catch (err: any) {
            console.error('Error closing day:', err);
            alert(`Error al cerrar el día: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogEnergyEvent = async () => {
        if (!user || !eventInput.label.trim()) return;
        setIsSaving(true);
        try {
            const newEvent = await habitService.logEnergyEvent({
                user_id: user.id,
                event_date: todayStr,
                type: eventInput.type,
                label: eventInput.label.trim(),
                intensity: 1
            });
            setEnergyEvents(prev => [...prev, newEvent]);
            setEventInput({ type: 'recarga', label: '' });
            setShowEventModal(false);
        } catch (err: any) {
            console.error('Error logging energy event:', err);
            alert(`Error al registrar evento: ${err.message || err.details || 'Error de base de datos'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const detectAnomalies = () => {
        const managedHabits = Object.values(habitLogs);
        const failedManaged = managedHabits.filter(l => !l.is_completed).length;

        // Incoherencia de Enfoque: Energía Alta (>7) + Fallo en Hábito
        if (summary.energy > 7 && failedManaged > 0) {
            return {
                type: 'Fuga de Enfoque',
                message: 'Detectamos energía disponible, pero falta de dirección en los hábitos.'
            };
        }

        // Erosión de Resistencia: Energía Baja (<4) + Fricción de Hábito Alta (>7)
        const hasHighFrictionHabit = managedHabits.some(l => l.friction > 7);
        if (summary.energy < 4 && (summary.friction > 7 || hasHighFrictionHabit)) {
            return {
                type: 'Estrés Sistémico',
                message: 'Tu sistema está al límite. La fricción supera tu capacidad de carga actual.'
            };
        }

        return null;
    };

    const getOperationalState = () => {
        const anomaly = detectAnomalies();
        if (anomaly?.type === 'Fuga de Enfoque') return 'Riesgo';
        if (anomaly?.type === 'Estrés Sistémico') return 'Regulación';

        if (summary.energy > 7) return 'Expansión';
        if (summary.energy > 4) return 'Sostén';
        return 'Regulación';
    };

    const handleDeleteEnergyEvent = async (id: string) => {
        // No restriction here anymore, data accuracy is priority
        try {
            await habitService.deleteEnergyEvent(id);
            setEnergyEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting energy event:', err);
        }
    };

    // Governance: Can only close if all habits are "interacted" (or we'll auto-interact them)
    // Actually, according to plan, the button only appears when "100% managed".
    const managedCount = Object.keys(habitLogs).length;
    const isFullyManaged = managedCount === habits.length;

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-tertiary text-[9px] font-bold uppercase tracking-[0.2em]">Sincronizando Hábitos hoy...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 pb-20">
            <header className="flex items-center justify-between mb-8 mt-2">
                <button className="p-2 -ml-2 text-primary hover:text-accent transition-colors">
                    <Calendar className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-primary tracking-tight uppercase">Hábitos de Hoy</h1>
                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button className="p-2 -mr-2 text-primary hover:text-accent transition-colors">
                    <Bell className="w-6 h-6" />
                </button>
            </header>

            {isCalibrating && !isDayClosed && (
                <div className="mb-6 mx-1 px-4 py-3 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Sincronización Biográfica</p>
                        <p className="text-[9px] text-tertiary font-medium">HumanHab está aprendiendo tus ritmos. Las intervenciones se activarán en unos días.</p>
                    </div>
                </div>
            )}

            {detectAnomalies() && !isDayClosed && (
                <div className="mb-6 mx-1 p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Detección de Anomalía: {detectAnomalies()?.type}</h4>
                        <p className="text-[11px] text-primary italic leading-relaxed">
                            "{detectAnomalies()?.message}"
                        </p>
                    </div>
                </div>
            )}

            {/* Habit Stack */}
            <section className="space-y-3 mb-10">
                <div className="flex items-center justify-between px-1 mb-4">
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Tus Micro-Intervenciones</h2>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-full">
                        {managedCount}/{habits.length} Gestionados
                    </span>
                </div>

                {habits.map((habit) => {
                    const log = habitLogs[habit.id];
                    const isCompleted = log?.is_completed;
                    const hasInteracted = !!log;

                    return (
                        <Card key={habit.id} className={`rounded-3xl border-transparent p-4 flex items-center gap-4 transition-all duration-300
                            ${isDayClosed ? 'opacity-80' : ''}
                            ${isCompleted ? 'bg-accent/5 ring-2 ring-accent' : 'bg-surface'}`}>

                            <div
                                onClick={() => setSelectedHabit(habit)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95
                                ${isCompleted ? 'bg-accent text-white shadow-lg' : 'bg-main text-secondary'}`}
                            >
                                {React.cloneElement(
                                    (ICON_MAP[habit.icon] || <Target className="w-6 h-6 text-accent" />) as React.ReactElement<any>,
                                    { className: `w-6 h-6 ${isCompleted ? 'text-white' : 'text-accent'}` }
                                )}
                            </div>

                            <div
                                onClick={() => setSelectedHabit(habit)}
                                className="flex-1 min-w-0 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-bold text-sm truncate ${isCompleted ? 'text-white' : 'text-primary'}`}>
                                        {habit.title}
                                    </h3>
                                    {protectionActive && (
                                        <span className="text-[7px] font-bold uppercase tracking-widest bg-accent/20 text-accent px-1.5 py-0.5 rounded-md border border-accent/30 animate-pulse">
                                            Micro-Protocolo
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[11px] truncate font-medium ${isCompleted ? 'text-white/70' : 'text-tertiary'}`}>
                                    {hasInteracted ? (isCompleted ? '¡Lo lograste!' : 'Se me complicó') : 'Estado: Pendiente'}
                                </p>
                            </div>

                            {!isDayClosed && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleHabit(habit.id)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                            ${hasInteracted && !isCompleted ? 'bg-error text-white' : 'bg-main text-tertiary/40 hover:text-error hover:bg-error/10'}`}
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleHabit(habit.id)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                            ${isCompleted ? 'bg-success text-white' : 'bg-main text-tertiary/40 hover:text-success hover:bg-success/10'}`}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {isDayClosed && (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-main
                                    ${isCompleted ? 'text-success' : 'text-error'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                            )}
                        </Card>
                    );
                })}

                {/* Eventos Rápidos */}
                <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between px-1 mb-4">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Eventos del Día</h2>
                        {!isDayClosed && (
                            <button
                                onClick={() => setShowEventModal(true)}
                                className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-accent/20 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                Log de Energía
                            </button>
                        )}
                    </div>

                    {energyEvents.length > 0 ? (
                        <div className="space-y-2">
                            {energyEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 bg-surface/50 border border-white/5 rounded-2xl p-3 animate-in slide-in-from-right duration-300"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                                        ${event.type === 'recarga' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                        {event.type === 'recarga' ? <Zap className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </div>
                                    <span className="flex-1 text-xs text-secondary font-medium">{event.label}</span>
                                    {!isDayClosed && (
                                        <button
                                            onClick={() => handleDeleteEnergyEvent(event.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-tertiary hover:text-error hover:bg-error/10 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[11px] text-tertiary text-center italic py-2">No hay eventos registrados.</p>
                    )}
                </div>
            </section>

            {/* Day Summary */}
            <section className="space-y-6">
                <div className="px-1 border-t border-surface pt-8">
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-6">Balance de Energía & Estado</h2>

                    <div className="space-y-8">
                        <Card className="rounded-3xl p-6 bg-surface border-transparent">
                            <Slider
                                label="Nivel de Vitalidad"
                                value={summary.energy}
                                onChange={(val) => setSummary(prev => ({ ...prev, energy: val }))}
                                colorClass="bg-success/80"
                                isDynamic={true}
                                disabled={isDayClosed}
                            />
                        </Card>

                        <Card className="rounded-3xl p-6 bg-surface border-transparent">
                            <Slider
                                label="Fricción de Hoy"
                                value={summary.friction}
                                onChange={(val) => setSummary(prev => ({ ...prev, friction: val }))}
                                colorClass="bg-accent"
                                disabled={isDayClosed}
                            />
                        </Card>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-2">Nota del Ciclo</label>
                            <textarea
                                value={summary.note}
                                onChange={(e) => setSummary(prev => ({ ...prev, note: e.target.value }))}
                                disabled={isDayClosed}
                                placeholder="Registra cualquier patrón o pensamiento..."
                                className="w-full bg-surface border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/20 h-24 resize-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-12 sticky bottom-4 z-10 px-1">
                {!isDayClosed ? (
                    <Button
                        onClick={handleCloseDay}
                        disabled={isSaving || !isFullyManaged}
                        className={`w-full py-4 text-sm font-bold tracking-widest uppercase rounded-2xl shadow-2xl group flex items-center justify-center gap-2
                            ${!isFullyManaged ? 'opacity-50 grayscale' : ''}`}
                    >
                        {isSaving ? 'Sincronizando...' : (
                            <>
                                {isFullyManaged ? 'Cerrar Balance y Registro Final' : `Aún te quedan gestionar ${habits.length - managedCount} hábitos para cerrar el día`}
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="w-full py-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sincronización de Hoy Completada</span>
                    </div>
                )}
            </div>

            {/* Habit Detail Modal */}
            {selectedHabit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-main/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border-accent/20 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedHabit(null)}
                            className="absolute top-6 right-6 p-2 rounded-2xl bg-main/50 text-tertiary hover:text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center mb-6">
                                {React.cloneElement(ICON_MAP[selectedHabit.icon] as React.ReactElement<any>, { className: 'w-10 h-10 text-accent' })}
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2 tracking-tight">{selectedHabit.title}</h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border
                                    ${habitLogs[selectedHabit.id]?.is_completed ? 'bg-success/10 border-success/20 text-success' : 'bg-tertiary/10 border-tertiary/20 text-tertiary'}`}>
                                    {habitLogs[selectedHabit.id]?.is_completed ? 'Completado hoy' : 'Pendiente'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-center">
                                <h4 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-3">Definición de Éxito</h4>
                                <p className="text-sm font-medium text-secondary leading-relaxed italic opacity-80">
                                    "{selectedHabit.description || 'Enfoque y coherencia para el micro-protocolo de hoy.'}"
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Slider
                                    label="¿Qué tanto te costó hoy?"
                                    value={habitLogs[selectedHabit.id]?.friction || 5}
                                    onChange={async (val) => {
                                        if (isDayClosed || !user) return;

                                        // Update local state immediately for responsiveness
                                        const currentLog = habitLogs[selectedHabit.id] || {
                                            habit_id: selectedHabit.id,
                                            user_id: user.id,
                                            date: todayStr,
                                            friction: val,
                                            is_completed: false
                                        };

                                        setHabitLogs(prev => ({
                                            ...prev,
                                            [selectedHabit.id]: { ...currentLog, friction: val }
                                        }));

                                        try {
                                            await habitService.upsertHabitLog({
                                                ...currentLog,
                                                friction: val
                                            });
                                        } catch (err) {
                                            console.error('Error updating habit friction:', err);
                                            // Optional: revert state on error
                                        }
                                    }}
                                    colorClass="bg-accent"
                                    disabled={isDayClosed}
                                />
                                <p className="text-[9px] text-tertiary px-1 italic">
                                    Determina la dificultad específica de este hábito hoy.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-main/30 rounded-2xl p-4 border border-white/5">
                                    <h4 className="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1">Inicio de Hilo</h4>
                                    <p className="text-xs font-bold text-primary">
                                        {new Date(selectedHabit.created_at || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <div className="bg-main/30 rounded-2xl p-4 border border-white/5">
                                    <h4 className="text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1">Días Activo</h4>
                                    <p className="text-xs font-bold text-primary">
                                        {Math.max(1, Math.floor((new Date().getTime() - new Date(selectedHabit.created_at || '').getTime()) / (1000 * 3600 * 24)))} Días
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={() => setSelectedHabit(null)}
                                    className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-2xl"
                                >
                                    Cerrar Detalle
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Closure Confirmation Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-main/95 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border-error/20 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-3xl bg-error/10 text-error flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-3">¿Confirmar Balance Final?</h2>
                        <p className="text-sm text-tertiary leading-relaxed mb-8">
                            Una vez cerrado, el registro de hoy será **inmutable** para tus hábitos y balances de energía. Sin embargo, podrás seguir agregando logs de eventos durante el resto del día.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={executeCloseDay}
                                className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-2xl bg-error hover:bg-error/90 border-transparent text-white"
                            >
                                Confirmar Sincronización
                            </Button>
                            <button
                                onClick={() => setShowCloseConfirm(false)}
                                className="w-full py-4 text-xs font-bold text-tertiary hover:text-primary uppercase tracking-[0.2em] transition-colors"
                            >
                                Volver y Revisar
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Event Log Modal */}
            {showEventModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-main/90 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border border-white/5 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-primary">Log de Energía</h2>
                            <button onClick={() => setShowEventModal(false)} className="text-tertiary hover:text-primary transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex p-1 bg-main rounded-2xl">
                                <button
                                    onClick={() => setEventInput(prev => ({ ...prev, type: 'recarga' }))}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                                        ${eventInput.type === 'recarga' ? 'bg-success text-white shadow-lg' : 'text-tertiary hover:text-secondary'}`}
                                >
                                    Recarga
                                </button>
                                <button
                                    onClick={() => setEventInput(prev => ({ ...prev, type: 'friccion' }))}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                                        ${eventInput.type === 'friccion' ? 'bg-error text-white shadow-lg' : 'text-tertiary hover:text-secondary'}`}
                                >
                                    Fricción
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-1">Detalle del Evento</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={eventInput.label}
                                    onChange={(e) => setEventInput(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder={eventInput.type === 'recarga' ? "Ej: Caminata solar, Lectura..." : "Ej: Tráfico, Discusión..."}
                                    className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-medium"
                                />
                            </div>

                            <Button
                                onClick={handleLogEnergyEvent}
                                disabled={!eventInput.label.trim() || isSaving}
                                className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-2xl border-transparent text-white bg-accent hover:bg-accent/90 disabled:opacity-50"
                            >
                                {isSaving ? 'Registrando...' : 'Registrar Evento'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* N+1 Intervention Modal */}
            {pendingIntervention && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-main/95 backdrop-blur-xl animate-in fade-in duration-500">
                    <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border-accent/20 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20">
                            <div className="h-full bg-accent animate-[shimmer_2s_infinite]" style={{ width: '40%' }}></div>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                                <ShieldCheck className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-bold text-primary mb-3">Protocolo de Protección Sugerido</h2>
                            <p className="text-sm text-tertiary leading-relaxed mb-8">
                                {pendingIntervention.message}
                            </p>

                            <div className="space-y-3 w-full">
                                <Button
                                    onClick={() => {
                                        setProtectionActive(true);
                                        setPendingIntervention(null);
                                    }}
                                    className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-2xl bg-accent hover:bg-accent/90 border-transparent text-white"
                                >
                                    Activar Protección (10%)
                                </Button>
                                <button
                                    onClick={() => setPendingIntervention(null)}
                                    className="w-full py-4 text-xs font-bold text-tertiary hover:text-primary uppercase tracking-[0.2em] transition-colors"
                                >
                                    No, hoy puedo con todo
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
