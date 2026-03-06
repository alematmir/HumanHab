import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { X, Calendar as CalendarIcon, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import EnergyBar from '../components/ui/EnergyBar';

interface DailySummary {
    id: string;
    date: string;
    friction: number;
    energy: number;
    note?: string;
    operational_state?: string;
}

interface HabitPerformance {
    title: string;
    icon: string;
    is_completed: boolean;
}

export function Registro() {
    const { user } = useAuthStore();
    const [summaries, setSummaries] = useState<DailySummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
    const [selectedHabits, setSelectedHabits] = useState<HabitPerformance[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchSummaries = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('daily_summaries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false });

                if (error) throw error;
                setSummaries(data || []);
            } catch (err) {
                console.error('Error fetching summaries:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummaries();
    }, [user]);

    const fetchDayDetails = async (summary: DailySummary) => {
        setSelectedSummary(summary);
        setIsLoadingDetails(true);
        try {
            const { data, error } = await supabase
                .from('habit_logs')
                .select(`
                    is_completed,
                    habits (
                        title,
                        icon
                    )
                `)
                .eq('user_id', user?.id)
                .eq('date', summary.date);

            if (error) throw error;

            const performance = (data || []).map((d: any) => ({
                title: d.habits.title,
                icon: d.habits.icon,
                is_completed: d.is_completed
            }));

            setSelectedHabits(performance);
        } catch (err) {
            console.error('Error fetching day details:', err);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    };

    const getFrictionLabel = (val: number) => {
        if (val <= 3) return 'Baja';
        if (val <= 6) return 'Media';
        return 'Alta';
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-tertiary animate-pulse uppercase tracking-widest text-[10px] font-bold">Sincronizando Historial...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 relative">
            <header className="mb-6 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Historial</h1>
                <p className="text-tertiary text-sm mt-1">Registros de tu evolución bio-conductual</p>
            </header>

            <div className="flex-1 -mx-4 sm:mx-0 overflow-y-auto pb-10">
                <div className="flex px-5 py-3 border-b border-surface bg-main/50 backdrop-blur-sm sticky top-0 z-10">
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest">Fecha</span>
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest text-center">Fricción</span>
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest text-right">Energía</span>
                </div>

                <div className="divide-y divide-surface">
                    {summaries.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-tertiary text-sm italic">Sin registros de ciclos multihábito aún.</p>
                        </div>
                    ) : (
                        summaries.map((summary) => (
                            <div
                                key={summary.id}
                                onClick={() => fetchDayDetails(summary)}
                                className="flex px-5 py-6 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer active:scale-[0.98]"
                            >
                                <span className="w-1/3 text-sm font-bold text-primary flex items-center gap-2">
                                    <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                                    {formatDate(summary.date)}
                                </span>
                                <div className="w-1/3 flex flex-col items-center">
                                    <span className="text-xs text-secondary text-center">
                                        {getFrictionLabel(summary.friction)}
                                    </span>
                                    {summary.operational_state && (
                                        <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded-full border
                                            ${summary.operational_state === 'Expansión' ? 'bg-success/5 border-success/20 text-success' :
                                                summary.operational_state === 'Riesgo' ? 'bg-error/5 border-error/20 text-error' :
                                                    'bg-warning/5 border-warning/20 text-warning'}`}>
                                            {summary.operational_state}
                                        </span>
                                    )}
                                </div>

                                <div className="w-1/3 flex items-center justify-end gap-3">
                                    <span className="text-sm font-bold text-primary">{summary.energy}/10</span>
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 
                                        ${summary.energy >= 7 ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                            summary.energy >= 4 ? 'bg-accent shadow-[0_0_8px_rgba(0,195,255,0.4)]' :
                                                'bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]'}
                                    `}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-surface p-6 rounded-[32px] border-transparent shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedSummary(null)}
                            className="absolute top-4 right-4 p-2 bg-main rounded-full text-tertiary hover:text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-primary mb-1">{formatDate(selectedSummary.date)}</h2>
                            <p className="text-[10px] text-accent uppercase tracking-widest font-bold">Estado del Sistema</p>
                        </div>

                        <div className="space-y-8">
                            {/* Energy Bar */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-tertiary uppercase tracking-widest">Nivel de Vitalidad</span>
                                    <span className="text-sm font-bold text-primary">{selectedSummary.energy}/10</span>
                                </div>
                                <EnergyBar level={selectedSummary.energy * 10} />
                            </div>

                            {/* Habit Performance Stack */}
                            <div>
                                <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4">Hábitos Realizados</h3>
                                {isLoadingDetails ? (
                                    <p className="text-[10px] text-tertiary uppercase tracking-widest animate-pulse">Cargando performance...</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedHabits.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-main/30 rounded-2xl border border-white/5">
                                                <span className="text-xs font-bold text-primary">{h.title}</span>
                                                {h.is_completed ? (
                                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-error opacity-50" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedSummary.note && (
                                <div>
                                    <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2">Nota de Coherencia</h3>
                                    <p className="text-xs text-secondary leading-relaxed bg-main/30 p-4 rounded-2xl italic border border-white/5">
                                        "{selectedSummary.note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
