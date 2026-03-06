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
    const [baselineEnergy, setBaselineEnergy] = useState<number>(7); // Default fallback
    const [isLoading, setIsLoading] = useState(true);

    const analyze = useCallback((data: any[]) => {
        // Calculate 14-day dynamic baseline (or whatever data we have up to 14 days)
        let computedBaseline = 7;
        if (data && data.length > 0) {
            const sum = data.reduce((acc, curr) => acc + (curr.energy || 5), 0);
            computedBaseline = Number((sum / data.length).toFixed(1));
        }
        setBaselineEnergy(computedBaseline);

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

            // --- 1. SPRINT 8: DISFUNCIÓN EN CASCADA (DETECCIÓN) ---
            // Si hay 2 días consecutivos recientes (ej: ayer y anteayer) con estado de "Regulación" o "Riesgo", o energía < 4
            if (data.length >= 2) {
                const day1 = data[0];
                const day2 = data[1];

                const isDay1Crisis = day1.operational_state === 'Regulación' || day1.operational_state === 'Riesgo' || day1.energy < 4;
                const isDay2Crisis = day2.operational_state === 'Regulación' || day2.operational_state === 'Riesgo' || day2.energy < 4;

                if (isDay1Crisis && isDay2Crisis) {
                    return {
                        state: 'Cascada',
                        color: 'error',
                        protocol: 'Intervención Preventiva',
                        message: 'Disfunción en cascada detectada. El escudo adaptativo bloqueará nueva carga hasta estabilizar el sistema.'
                    };
                }
            }


            // --- 2. SPRINT 8: BASELINE DINÁMICO ---
            if (data[0].operational_state) {
                const state = data[0].operational_state;
                if (state === 'Riesgo') {
                    return {
                        state: 'Riesgo',
                        color: 'error',
                        protocol: 'Protección Activa',
                        message: 'Fricción inusual. Bajemos el peso antes de que se vuelva crónico.'
                    };
                }
                if (state === 'Regulación') {
                    return {
                        state: 'Regulación',
                        color: 'warning',
                        protocol: 'Supervivencia',
                        message: 'Tu sistema exige descanso. Todo es negociable hoy menos la constancia.'
                    };
                }
                if (state === 'Expansión') {
                    // Prevent sudden jumps: Ensure the last 3 days do not contain chronic stress.
                    const recentInstability = data.slice(1, 4).some(d => d.operational_state === 'Regulación' || d.operational_state === 'Riesgo');
                    if (recentInstability) {
                        return {
                            state: 'Sostén',
                            color: 'success',
                            protocol: 'Mantenimiento',
                            message: 'Sistema en equilibrio. Consolida esta base antes de buscar expansión (día a día).'
                        };
                    }

                    // Expansión ahora debería mirar el Baseline, pero en este MVP de transición,
                    // Si el sistema clasificó 'Expansión' pero tu energía real NO SUPERÓ (Baseline + 1.0)
                    // Y TAMPOCO tienes una energía alta estructural (>= 8), 
                    // lo anclamos a Sostén para no ser falsamente optimistas si estabas muy bajo.
                    if (data[0].energy < 8 && data[0].energy < (computedBaseline + 1)) {
                        return {
                            state: 'Sostén',
                            color: 'success',
                            protocol: 'Mantenimiento',
                            message: 'Tu energía mejoró, pero aún está cerca de tu promedo basal. Consolida esta estabilidad.'
                        };
                    }

                    return {
                        state: 'Expansión',
                        color: 'success',
                        protocol: 'Progresión',
                        message: 'Sistema vibrante por encima del promedio basal. Listo para absorber nueva carga.'
                    };
                }
                if (state === 'Sostén' || state === 'Estable') {
                    return {
                        state: 'Sostén',
                        color: 'success',
                        protocol: 'Mantenimiento',
                        message: `Sistema en equilibrio cercano a tu media estructural (${computedBaseline}/10).`
                    };
                }
            }

            // Fallbacks si no hay operational state
            if (data.length >= 2) {
                const consecutiveHighFriction = data.slice(0, 2).every(s => s.friction >= 7);
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
                        message: 'El balance de ayer mostró alta fricción. Monitoreo constante hoy.'
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
                ? 'Bienvenido a HumanHab. Comenzaremos a medir tu bio-ritmo.'
                : `Sistema calibrado en baseline (${computedBaseline}/10).`
        };
    }, []);

    const fetchStatus = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // SPRINT 8: Fetch 14 days history for Dynamic Baseline and Cascading analysis
            const { data, error } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(14);

            if (error) throw error;
            setStatus(analyze(data || []));

            // Fetch Recovery Speed
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

    return { status, recoverySpeed, baselineEnergy, isLoading, refetch: fetchStatus };
}
