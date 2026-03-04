import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface CoherenceStatus {
    state: string;
    color: string;
    protocol: string;
    message: string;
}

export function useCoherence() {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<CoherenceStatus>({
        state: 'Estable',
        color: 'success',
        protocol: 'Mantenimiento',
        message: 'El sistema mantiene la sincronización entre los hábitos registrados y los ciclos biológicos.'
    });
    const [isLoading, setIsLoading] = useState(true);

    const analyze = useCallback((data: any[]) => {
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
                    message: 'Detectamos un vacío ayer. Es vital retomar hoy para mantener la inercia del hábito.'
                };
            }

            if (data.length >= 2) {
                const consecutiveDifficulty = data.every(log => log.status === 'DIFICULTAD');
                if (consecutiveDifficulty) {
                    return {
                        state: 'Inestable',
                        color: 'error',
                        protocol: 'Recuperación',
                        message: 'Se han detectado 2 o más días consecutivos donde te ha costado completar el hábito. Se recomienda activar el protocolo de regulación.'
                    };
                } else if (data[0].status === 'DIFICULTAD') {
                    return {
                        state: 'Atención',
                        color: 'warning',
                        protocol: 'Alerta',
                        message: 'El registro de hoy muestra que te ha costado un poco. Monitorea tu energía mañana para mantener la sincronización.'
                    };
                }
            } else if (data[0].status === 'DIFICULTAD') {
                return {
                    state: 'Atención',
                    color: 'warning',
                    protocol: 'Monitoreo',
                    message: 'El registro inicial indica dificultad. Mantente atento al balance energético para consolidar el hábito.'
                };
            }
        }

        return {
            state: 'Estable',
            color: 'success',
            protocol: 'Mantenimiento',
            message: data?.length === 0
                ? 'Bienvenido. Comienza tu registro diario para habilitar el análisis de coherencia.'
                : 'El sistema mantiene la sincronización entre los hábitos registrados y los ciclos biológicos.'
        };
    }, []);

    const fetchStatus = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);

            if (error) throw error;
            setStatus(analyze(data || []));
        } catch (err) {
            console.error('Error fetching coherence status:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, analyze]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, isLoading, refetch: fetchStatus };
}
