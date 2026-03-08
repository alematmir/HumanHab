import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ProtocolModal } from '../components/ui/ProtocolModal';
import protocolAsset from '../assets/protocol_energy_flow.png';
import { useCoherence } from '../hooks/useCoherence';
import { habitService } from '../lib/habitService';
import { OPERATIONAL_STATES, PROTOCOLS, PROTOCOL_MESSAGES } from '../config/bioConfig';

interface LogSummary {
    id: string;
    friction: number;
    energy: number;
    date: string;
    note?: string;
}

export function Coherencia() {
    const { user } = useAuthStore();
    const { status, recoverySpeed, isLoading: isCoherenceLoading } = useCoherence();
    const [recentSummaries, setRecentSummaries] = useState<LogSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const protocolContent = {
        [PROTOCOLS.RECOVERY]: PROTOCOL_MESSAGES.RECOVERY,
        [PROTOCOLS.ALERT]: PROTOCOL_MESSAGES.ALERT,
        [PROTOCOLS.DESYNC]: PROTOCOL_MESSAGES.DESYNC,
        [PROTOCOLS.MONITORING]: PROTOCOL_MESSAGES.MONITORING,
        [PROTOCOLS.MAINTENANCE]: PROTOCOL_MESSAGES.MAINTENANCE
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-[calc(100vh-120px)] pb-10"
        >
            <header className="mb-6 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Coherencia</h1>
                <p className="text-tertiary text-sm mt-1">Estado de tu sistema bio-conductual</p>
            </header>

            <div className="space-y-4">
                <Card
                    className="p-8 overflow-hidden cursor-pointer active:scale-[0.99] transition-all space-y-8 reveal-card"
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
                            <Card className="p-5 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-tertiary uppercase mb-2">Fricción Promedio</span>
                                <span className="text-2xl font-bold text-primary">
                                    {(recentSummaries.reduce((acc, s) => acc + s.friction, 0) / recentSummaries.length).toFixed(1)}
                                </span>
                            </Card>
                            <Card className="p-5 flex flex-col items-center">
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
        </motion.div>
    );
}


