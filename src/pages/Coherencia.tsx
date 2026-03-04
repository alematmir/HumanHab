import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProtocolModal } from '../components/ui/ProtocolModal';
import protocolAsset from '../assets/protocol_energy_flow.png';
import { useCoherence } from '../hooks/useCoherence';

interface Log {
    id: string;
    friction: number;
    energy: number;
    status: string;
    date: string;
    note?: string;
}

export function Coherencia() {
    const { user } = useAuthStore();
    const { status, isLoading: isCoherenceLoading, refetch } = useCoherence();
    const [recentLogs, setRecentLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Protocol messages mapping
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

    const fetchRecentLogs = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);
            setRecentLogs(data || []);
        } catch (err) {
            console.error('Error fetching recent logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentLogs();
    }, [user, isCoherenceLoading]);

    const simulateScenario = async (type: 'ESTABLE' | 'ALERTA' | 'INESTABLE' | 'OLVIDADO') => {
        if (!user) return;

        const { data: cycleData } = await supabase
            .from('cycles')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .single();

        if (!cycleData) {
            alert('Necesitas tener un ciclo activo para simular.');
            return;
        }

        setIsSimulating(true);

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const tStr = getLocalDateStr(today);
        const yStr = getLocalDateStr(yesterday);

        const logs = [];

        if (type === 'ESTABLE') {
            logs.push(
                { user_id: user.id, cycle_id: cycleData.id, date: tStr, friction: 2, energy: 8, status: 'CUMPLIDO', note: 'Simulación: Estable' },
                { user_id: user.id, cycle_id: cycleData.id, date: yStr, friction: 3, energy: 7, status: 'CUMPLIDO', note: 'Simulación: Estable' }
            );
        } else if (type === 'ALERTA') {
            logs.push(
                { user_id: user.id, cycle_id: cycleData.id, date: tStr, friction: 8, energy: 3, status: 'DIFICULTAD', note: 'Simulación: Me ha costado hoy' },
                { user_id: user.id, cycle_id: cycleData.id, date: yStr, friction: 3, energy: 8, status: 'CUMPLIDO', note: 'Simulación: Logré ayer' }
            );
        } else if (type === 'INESTABLE') {
            logs.push(
                { user_id: user.id, cycle_id: cycleData.id, date: tStr, friction: 9, energy: 2, status: 'DIFICULTAD', note: 'Simulación: Crítico hoy' },
                { user_id: user.id, cycle_id: cycleData.id, date: yStr, friction: 8, energy: 3, status: 'DIFICULTAD', note: 'Simulación: Crítico ayer' }
            );
        } else if (type === 'OLVIDADO') {
            const dayBeforeYesterday = new Date();
            dayBeforeYesterday.setDate(today.getDate() - 2);
            const dbyStr = getLocalDateStr(dayBeforeYesterday);

            try {
                await supabase.from('daily_logs').delete().eq('user_id', user.id).in('date', [tStr, yStr]);
                logs.push({ user_id: user.id, cycle_id: cycleData.id, date: dbyStr, friction: 3, energy: 7, status: 'CUMPLIDO', note: 'Simulación: Día olvidado (hace 2 días)' });
            } catch (err) {
                console.error('Error clearing for forgotten day:', err);
            }
        }

        try {
            const { error } = await supabase.from('daily_logs').upsert(logs, { onConflict: 'user_id,date' });
            if (error) throw error;
            await refetch();
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

    const dotColorClass = status.color === 'success' ? 'bg-success' : status.color === 'warning' ? 'bg-warning' : 'bg-error';

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 pb-10">
            <header className="mb-6 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Coherencia</h1>
                <p className="text-tertiary text-sm mt-1">Estado de tu sistema bio-conductual</p>
            </header>

            <div className="space-y-4">
                <Card
                    className="rounded-3xl border-transparent p-0 overflow-hidden shadow-sm bg-surface cursor-pointer active:scale-[0.99] transition-all"
                    onClick={() => setIsModalOpen(true)}
                >
                    <div className="p-5 border-b border-border/50">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Estado Actual</h2>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${dotColorClass}`}></div>
                            <span className="text-2xl font-bold text-primary tracking-tight">{status.state}</span>
                        </div>
                    </div>

                    <div className="p-4 border-b border-border/50">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Último Protocolo Activado</h2>
                        <div className="flex items-center gap-2">
                            {status.color === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : status.color === 'warning' ? (
                                <Info className="w-5 h-5 text-warning" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-error" />
                            )}
                            <span className="text-lg font-medium text-primary">{status.protocol}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-black/5 dark:bg-white/5">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Resumen de Alineación</h2>
                        <p className="text-sm text-secondary leading-relaxed italic">
                            "{status.message}"
                        </p>
                    </div>
                </Card>

                {recentLogs.length > 0 && (
                    <div className="px-1">
                        <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4 pl-1">Métricas de entrada</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 rounded-2xl border-transparent shadow-sm flex flex-col items-center">
                                <span className="text-[9px] font-bold text-tertiary uppercase mb-1">Fricción Promedio</span>
                                <span className="text-xl font-bold text-primary">
                                    {(recentLogs.reduce((acc, log) => acc + log.friction, 0) / recentLogs.length).toFixed(1)}
                                </span>
                            </Card>
                            <Card className="p-4 rounded-2xl border-transparent shadow-sm flex flex-col items-center">
                                <span className="text-[9px] font-bold text-tertiary uppercase mb-1">Tu energia promedio</span>
                                <span className="text-xl font-bold text-accent">
                                    {(recentLogs.reduce((acc, log) => acc + log.energy, 0) / recentLogs.length).toFixed(1)}
                                </span>
                            </Card>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-border/30">
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                        Simulación de Escenarios (Tester)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => simulateScenario('ESTABLE')}
                            disabled={isSimulating}
                            className="bg-success/10 hover:bg-success/20 text-success text-[11px] font-bold py-3 px-4 rounded-2xl transition-all border border-success/20"
                        >
                            Escenario: Estable
                        </button>
                        <button
                            onClick={() => simulateScenario('ALERTA')}
                            disabled={isSimulating}
                            className="bg-warning/10 hover:bg-warning/20 text-warning text-[11px] font-bold py-3 px-4 rounded-2xl transition-all border border-warning/20"
                        >
                            Escenario: Alerta
                        </button>
                        <button
                            onClick={() => simulateScenario('INESTABLE')}
                            disabled={isSimulating}
                            className="bg-error/10 hover:bg-error/20 text-error text-[11px] font-bold py-3 px-4 rounded-2xl transition-all border border-error/20"
                        >
                            Escenario: Recuperación
                        </button>
                        <button
                            onClick={() => simulateScenario('OLVIDADO')}
                            disabled={isSimulating}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-bold py-3 px-4 rounded-2xl transition-all border border-indigo-500/20"
                        >
                            Escenario: Día Olvidado
                        </button>
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

            <p className="text-center text-[10px] text-tertiary mt-12 uppercase tracking-widest opacity-50">
                Análisis Cognitivo-Motor • MVP1
            </p>
        </div>
    );
}
