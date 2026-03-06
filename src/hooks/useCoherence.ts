import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { habitService } from '../lib/habitService';

export interface CoherenceStatus {
    state: string;
    color: string;
    protocol: string;
    message: string;
}

export interface RecoverySpeedData {
    averageDays: string | null;
    totalCycles: number;
    currentCrisisDuration: number;
    isInCrisis: boolean;
}

export function useCoherence() {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<CoherenceStatus>({
        state: 'Estable',
        color: 'success',
        protocol: 'Mantenimiento',
        message: 'El sistema mantiene la sincronización entre los hábitos registrados y los ciclos biológicos.'
    });
    const [recoverySpeed, setRecoverySpeed] = useState<RecoverySpeedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const analyze = useCallback((data: any[]) => {
        // ... (existing analysis logic remains the same)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (data && data.length > 0) {
            const [ly, lm, ld] = data[0].date.split('-').map(Number);
            const latestLogDate = new Date(ly, lm - 1, ld);
            latestLogDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - latestLogDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 2) {
                return {
                    state: 'Inestable',
                    color: 'error',
                    protocol: 'Recuperación',
                    message: 'Varios días sin registro detectados. Prioriza la rapidez de recuperación para volver al ritmo basal.'
                };
            } else if (diffDays === 2) {
                return {
                    state: 'Atención',
                    color: 'warning',
                    protocol: 'Desincronización',
                    message: 'Detectamos un vacío ayer. Es vital retomar hoy para mantener la inercia del sistema.'
                };
            }

            if (data[0].operational_state) {
                const state = data[0].operational_state;
                if (state === 'Riesgo') {
                    return {
                        state: 'Riesgo',
                        color: 'error',
                        protocol: 'Protección',
                        message: 'Se ha detectado una fuga de enfoque. Se recomienda simplificar hábitos al 10% para no romper el hilo.'
                    };
                }
                if (state === 'Regulación') {
                    return {
                        state: 'Regulación',
                        color: 'warning',
                        protocol: 'Recuperación',
                        message: 'Tu sistema está bajo estrés. Prioriza la estabilidad y el descanso sobre la expansión.'
                    };
                }
                if (state === 'Expansión') {
                    return {
                        state: 'Expansión',
                        color: 'success',
                        protocol: 'Mantenimiento',
                        message: 'Sincronización óptima detectada. Es un buen momento para consolidar o expandir.'
                    };
                }
            }

            if (data.length >= 2) {
                const consecutiveHighFriction = data.every(s => s.friction >= 7);
                if (consecutiveHighFriction) {
                    return {
                        state: 'Inestable',
                        color: 'error',
                        protocol: 'Recuperación',
                        message: 'Se han detectado 2 o más días consecutivos de alta fricción ambiental. Activa protocolos de protección.'
                    };
                } else if (data[0].friction >= 7 || data[0].energy <= 3) {
                    return {
                        state: 'Atención',
                        color: 'warning',
                        protocol: 'Alerta',
                        message: 'El balance de hoy muestra alta fricción o baja energía. Monitorea tu estado mañana.'
                    };
                }
            } else if (data[0].friction >= 7) {
                return {
                    state: 'Atención',
                    color: 'warning',
                    protocol: 'Monitoreo',
                    message: 'Fricción inicial elevada detectada. Enfócate en la simplicidad para consolidar tus hábitos.'
                };
            }
        }

        return {
            state: 'Estable',
            color: 'success',
            protocol: 'Mantenimiento',
            message: data?.length === 0
                ? 'Bienvenido. Completa tu primer registro diario para habilitar el análisis de coherencia.'
                : 'El sistema mantiene la sincronización entre los hábitos registrados y los ciclos biológicos.'
        };
    }, []);

    const fetchStatus = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // 1. Fetch Basic Status
            const { data, error } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);

            if (error) throw error;
            setStatus(analyze(data || []));

            // 2. Fetch Recovery Speed
            const rsData = await habitService.calculateRecoverySpeed(user.id);
            setRecoverySpeed(rsData);
        } catch (err) {
            console.error('Error fetching coherence status:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, analyze]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, recoverySpeed, isLoading, refetch: fetchStatus };
}
