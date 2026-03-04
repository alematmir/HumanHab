import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { X, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import EnergyBar from '../components/ui/EnergyBar';

interface Log {
    id: string;
    date: string;
    friction: number;
    energy: number;
    status: 'DIFICULTAD' | 'CUMPLIDO';
    note?: string;
}

export function Registro() {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false });

                if (error) throw error;
                setLogs(data as Log[] || []);
            } catch (err) {
                console.error('Error fetching logs:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getFrictionLabel = (val: number) => {
        if (val === 0) return 'Nula';
        if (val <= 3) return 'Baja';
        if (val <= 6) return 'Media';
        return 'Alta';
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-tertiary animate-pulse uppercase tracking-widest text-[10px] font-bold">Cargando Historial...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-500 relative">
            <header className="mb-6 mt-2">
                <h1 className="text-3xl font-bold text-primary tracking-tight">Historial</h1>
                <p className="text-tertiary text-sm mt-1">Registros de tus ciclos anteriores</p>
            </header>

            <div className="flex-1 -mx-4 sm:mx-0 overflow-y-auto pb-10">
                <div className="flex px-5 py-3 border-b border-border bg-main/50 backdrop-blur-sm sticky top-0 z-10">
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest">Fecha</span>
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest text-center">Fricción</span>
                    <span className="w-1/3 text-[10px] font-bold text-tertiary uppercase tracking-widest text-right">Estado</span>
                </div>

                <div className="divide-y divide-border/50">
                    {logs.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <p className="text-secondary text-sm italic">No hay registros aún.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className="flex px-5 py-6 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer active:scale-[0.98]"
                            >
                                <span className="w-1/3 text-sm font-medium text-primary flex items-center gap-2">
                                    <CalendarIcon className="w-3.5 h-3.5 text-tertiary" />
                                    {formatDate(log.date)}
                                </span>
                                <span className="w-1/3 text-xs text-secondary text-center">
                                    {getFrictionLabel(log.friction)} ({log.friction})
                                </span>

                                <div className="w-1/3 flex items-center justify-end gap-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${log.status === 'DIFICULTAD' ? 'text-tertiary' : 'text-accent'}`}>
                                        {log.status === 'CUMPLIDO' ? 'Lo logré' : 'Me ha costado'}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all
                                        ${log.status === 'DIFICULTAD' ? 'border border-tertiary/40 bg-transparent' : 'bg-accent shadow-sm shadow-accent/40'}
                                    `}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal Overlay */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm bg-surface p-6 rounded-[32px] border-transparent shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-4 right-4 p-2 bg-main rounded-full text-tertiary hover:text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-primary mb-1">{formatDate(selectedLog.date)}</h2>
                            <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Resumen Diario</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-tertiary uppercase tracking-widest">Energía del Día</span>
                                    <span className="text-sm font-bold text-accent">{selectedLog.energy}/10</span>
                                </div>
                                <EnergyBar level={selectedLog.energy * 10} />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 bg-main/50 p-4 rounded-2xl border border-border/10">
                                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Fricción</p>
                                    <p className="text-lg font-bold text-primary">{selectedLog.friction}/10</p>
                                    <p className="text-[10px] text-secondary">{getFrictionLabel(selectedLog.friction)}</p>
                                </div>
                                <div className="flex-1 bg-main/50 p-4 rounded-2xl border border-border/10">
                                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">Estado</p>
                                    <p className={`text-lg font-bold ${selectedLog.status === 'CUMPLIDO' ? 'text-accent' : 'text-primary'}`}>
                                        {selectedLog.status === 'CUMPLIDO' ? 'Lo logré' : 'Me ha costado'}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.note && (
                                <div>
                                    <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2">Nota</h3>
                                    <p className="text-sm text-secondary leading-relaxed bg-main/30 p-4 rounded-2xl italic border border-border/5">
                                        "{selectedLog.note}"
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
