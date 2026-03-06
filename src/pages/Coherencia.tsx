import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProtocolModal } from '../components/ui/ProtocolModal';
import protocolAsset from '../assets/protocol_energy_flow.png';
import { useCoherence } from '../hooks/useCoherence';

interface LogSummary {
    id: string;
    friction: number;
    energy: number;
    date: string;
    note?: string;
}

export function Coherencia() {
    const { user } = useAuthStore();
    const { status, recoverySpeed, isLoading: isCoherenceLoading, refetch } = useCoherence();
    const [recentSummaries, setRecentSummaries] = useState<LogSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const protocolContent = {
        'Recuperación': 'Hoy hubo fricción. No es ruptura. Es ajuste. Retomá desde el punto mínimo.',
        'Alerta': 'El sistema detectó una baja leve. Prioriza estabilidad sobre expansión. Mantén el ritmo.',
        'Desincronización': 'El silencio es señal. Detectamos un vacío ayer. Retomá hoy para cerrar la brecha.',
        'Monitoreo': 'Registro inicial con alta fricción. Enfócate en la simplicidad para consolidar la base.',
        'Mantenimiento': 'Sincronización óptima detectada. Continúa con el flujo actual del sistema.'
    };

    const getLocalDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchRecentSummaries = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);
            setRecentSummaries(data || []);
        } catch (err) {
            console.error('Error fetching recent summaries:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentSummaries();
    }, [user, isCoherenceLoading]);

    const forceRigidity = async (level: number) => {
        if (!user) return;
        setIsSimulating(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ rigidity_level: level })
                .eq('user_id', user.id);
            if (error) throw error;
            alert(`Nivel de rigurosidad forzado a nivel ${level} para pruebas.`);
        } catch (err) {
            console.error('Error forcing rigidity:', err);
            alert('Error al forzar rigurosidad');
        } finally {
            setIsSimulating(false);
        }
    };

    const forceLevel = async (level: string) => {
        if (!user) return;
        setIsSimulating(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ level })
                .eq('user_id', user.id);
            if (error) throw error;
            alert(`Nivel de perfil forzado a ${level} para pruebas.`);
        } catch (err) {
            console.error('Error forcing level:', err);
            alert('Error al forzar nivel');
        } finally {
            setIsSimulating(false);
        }
    };

    const simulateScenario = async (type: 'CASCADA' | 'RESILIENTE' | 'BURN_OUT' | 'OPTIMO' | 'VOLATIL' | 'LIMPIAR') => {
        if (!user) return;
        setIsSimulating(true);

        const today = new Date();
        const summaries = [];

        if (type === 'LIMPIAR') {
            try {
                await supabase.from('daily_summaries').delete().eq('user_id', user.id);
                await supabase.from('habit_logs').delete().eq('user_id', user.id);
                await supabase.from('energy_events').delete().eq('user_id', user.id);
                await refetch();
                await fetchRecentSummaries();
                window.location.reload(); // Hard reload to clear all local states
            } catch (err) {
                console.error('Error clearing:', err);
            } finally {
                setIsSimulating(false);
            }
            return;
        }

        // Generate 14 days of history (excluding today)
        for (let i = 14; i >= 1; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dStr = getLocalDateStr(date);

            let friction = 3, energy = 7, state = 'Expansión';

            if (type === 'RESILIENTE') {
                // Drop on day -10/-9, recover on -8
                if (i === 11 || i === 10) { state = 'Regulación'; energy = 3; friction = 8; }
                else if (i === 9) { state = 'Sostén'; energy = 6; friction = 4; }
                // Drop on day -5, recover on -4
                else if (i === 6) { state = 'Riesgo'; energy = 7; friction = 8; }
                else if (i === 5) { state = 'Sostén'; energy = 6; friction = 4; }
            } else if (type === 'BURN_OUT') {
                if (i <= 11) { state = 'Regulación'; energy = 2; friction = 9; }
            } else if (type === 'CASCADA') {
                // For a 14 day history, we just need the LAST TWO DAYS (i=2 and i=1) to be bad. The rest can be ok.
                if (i <= 2) { state = 'Regulación'; energy = 3; friction = 8; }
                else { state = 'Sostén'; energy = 6; friction = 5; }
            } else if (type === 'VOLATIL') {
                if (i % 3 === 0) { state = 'Regulación'; energy = 3; friction = 8; }
            } else if (type === 'OPTIMO') {
                state = 'Expansión'; energy = 9; friction = 1;
            }

            summaries.push({
                user_id: user.id,
                date: dStr,
                friction,
                energy,
                operational_state: state,
                note: `Simulación ${type}: Día -${i}`
            });
        }

        try {
            const { error } = await supabase.from('daily_summaries').upsert(summaries, { onConflict: 'user_id,date' });
            if (error) throw error;
            await refetch();
            await fetchRecentSummaries();
        } catch (err) {
            console.error('Error simulating:', err);
            alert('Error en simulación');
        } finally {
            setIsSimulating(false);
        }
    };

    if (isLoading || isCoherenceLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-tertiary animate-pulse uppercase tracking-widest text-xs">Analizando Coherencia...</div>
            </div>
        );
    }

    const dotColorClass = status.color === 'success' ? 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.4)]' :
        status.color === 'warning' ? 'bg-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
            'bg-error shadow-[0_0_12px_rgba(239,68,68,0.4)]';

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 pb-10">
            <header className="mb-6 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Coherencia</h1>
                <p className="text-tertiary text-sm mt-1">Estado de tu sistema bio-conductual</p>
            </header>

            <div className="space-y-4">
                <Card
                    className="rounded-[32px] border-transparent p-8 overflow-hidden shadow-2xl bg-surface cursor-pointer active:scale-[0.99] transition-all space-y-8"
                    onClick={() => setIsModalOpen(true)}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-4">Estado del Sistema</h2>
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full animate-pulse ${dotColorClass}`}></div>
                                <span className="text-3xl font-bold text-primary tracking-tight">{status.state}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-main rounded-2xl border border-white/5">
                            {status.color === 'success' ? (
                                <CheckCircle2 className="w-6 h-6 text-success" />
                            ) : status.color === 'warning' ? (
                                <Info className="w-6 h-6 text-warning" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-error" />
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-4">Protocolo Biológico</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-accent">{status.protocol}</span>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-4">Alineación Conductual</h2>
                        <p className="text-sm text-secondary leading-relaxed italic pr-4">
                            "{status.message}"
                        </p>
                    </div>
                </Card>

                {recentSummaries.length > 0 && (
                    <div className="px-2 pt-4">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-4 text-center">Métricas de Sincronización</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Card className="p-5 rounded-3xl border-transparent shadow-sm flex flex-col items-center bg-surface">
                                <span className="text-[9px] font-bold text-tertiary uppercase mb-2">Fricción Promedio</span>
                                <span className="text-2xl font-bold text-primary">
                                    {(recentSummaries.reduce((acc, s) => acc + s.friction, 0) / recentSummaries.length).toFixed(1)}
                                </span>
                            </Card>
                            <Card className="p-5 rounded-3xl border-transparent shadow-sm flex flex-col items-center bg-surface">
                                <span className="text-[9px] font-bold text-tertiary uppercase mb-2">Vitalidad Promedio</span>
                                <span className="text-2xl font-bold text-accent">
                                    {(recentSummaries.reduce((acc, s) => acc + s.energy, 0) / recentSummaries.length).toFixed(1)}
                                </span>
                            </Card>
                        </div>

                        {recoverySpeed && (
                            <Card className="p-6 rounded-[32px] border-accent/10 shadow-sm flex flex-col items-center bg-accent/[0.03] border relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap className="w-12 h-12 text-accent" />
                                </div>
                                <span className="text-[9px] font-bold text-accent uppercase mb-3 tracking-[0.2em]">Velocidad de Recuperación (Avg)</span>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-black tracking-tighter ${!recoverySpeed.averageDays ? 'text-primary/20' : 'text-primary'}`}>
                                            {recoverySpeed.averageDays || '0.0'}
                                        </span>
                                        <span className="text-xs font-bold text-tertiary uppercase">Días</span>
                                    </div>
                                    {!recoverySpeed.averageDays && (
                                        <span className="text-[8px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-full">
                                            {recoverySpeed.isInCrisis ? 'Crisis Detectada' : 'Calibrando Primer Ciclo'}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${recoverySpeed.isInCrisis ? 'bg-error animate-pulse' : 'bg-success'}`}></div>
                                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest leading-none">
                                        {recoverySpeed.isInCrisis
                                            ? `Crisis Actual: ${recoverySpeed.currentCrisisDuration}d`
                                            : 'Sistema en Equilibrio'}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5">
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        Laboratorio de Simulación Bio-Sistémica
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'CASCADA', label: 'Disfunción en Cascada', desc: 'Simula 2 días seguidos de caída brusca para activar el Escudo Preventivo.', color: 'error' },
                            { id: 'RESILIENTE', label: 'Historial Resiliente', desc: 'Simula 14 días con 2 ciclos de caída y recuperación exitosa.', color: 'success' },
                            { id: 'BURN_OUT', label: 'Agotamiento Crónico', desc: '14 días de inestabilidad profunda sin retorno al equilibrio.', color: 'error' },
                            { id: 'VOLATIL', label: 'Patrón de Inestabilidad', desc: 'Ciclos intermitentes de estrés cada 72 horas.', color: 'warning' },
                            { id: 'OPTIMO', label: 'Reloj Suizo (Ideal)', desc: '100% de consistencia en estado de Expansión/Sostén.', color: 'accent' },
                            { id: 'LIMPIAR', label: 'Reiniciar Historial', desc: 'Elimina todos los registros para empezar de cero.', color: 'secondary' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => simulateScenario(btn.id as any)}
                                disabled={isSimulating}
                                className="bg-surface/40 hover:bg-surface text-left p-4 rounded-3xl transition-all border border-white/5 group active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[11px] font-black uppercase tracking-widest text-${btn.color} group-hover:translate-x-1 transition-transform`}>
                                        {btn.label}
                                    </span>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${btn.color}/30 group-hover:bg-${btn.color} transition-colors`}></div>
                                </div>
                                <p className="text-[10px] text-tertiary leading-relaxed">
                                    {btn.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-8 mb-4 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        Overrides de Rigurosidad (God Mode)
                    </h2>
                    <p className="text-[10px] text-tertiary mb-4 italic">
                        Bypassea las Leyes Biológicas de Perfil. Cambia la rigurosidad instantáneamente para probar el Slider de Ciclo.
                    </p>
                    <div className="flex gap-2">
                        {[1, 2, 3].map((level) => {
                            const labels = ['Compasivo (N1)', 'Equilibrado (N2)', 'Dureza (N3)'];
                            return (
                                <button
                                    key={level}
                                    onClick={() => forceRigidity(level)}
                                    disabled={isSimulating}
                                    className="flex-1 bg-surface/40 hover:bg-surface text-[9px] font-bold text-accent uppercase tracking-widest p-3 rounded-2xl transition-all border border-accent/20 active:scale-95"
                                >
                                    {labels[level - 1]}
                                </button>
                            );
                        })}
                    </div>

                    <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-6 mb-4 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        Overrides de Nivel de Montaña
                    </h2>
                    <div className="flex gap-2">
                        {['Principiante', 'Intermedio', 'Avanzado'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => forceLevel(lvl)}
                                disabled={isSimulating}
                                className="flex-1 bg-surface/40 hover:bg-surface text-[9px] font-bold text-accent uppercase tracking-widest p-3 rounded-2xl transition-all border border-accent/20 active:scale-95"
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <ProtocolModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={status.state}
                protocol={status.protocol}
                message={protocolContent[status.protocol as keyof typeof protocolContent] || status.message}
                imageSrc={protocolAsset}
            />

            <p className="text-center text-[10px] text-tertiary/40 mt-16 uppercase tracking-[0.3em] font-bold">
                Motor de Coherencia • v2.0 • Lab Mode
            </p>
        </div>
    );
}

const Zap = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);
