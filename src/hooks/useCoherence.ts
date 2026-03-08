import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { habitService } from '../lib/habitService';
import { BIO_THRESHOLDS, OPERATIONAL_STATES, PROTOCOLS } from '../config/bioConfig';
import { systemLogs } from '../lib/logService';

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
        state: OPERATIONAL_STATES.STABLE,
        color: 'success',
        protocol: PROTOCOLS.MAINTENANCE,
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
        systemLogs.addLog('Coherence', `Baseline dinámico calculado: ${computedBaseline}`, 'info');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (data && data.length > 0) {
            const [ly, lm, ld] = data[0].date.split('-').map(Number);
            const latestLogDate = new Date(ly, lm - 1, ld);
            latestLogDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - latestLogDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > BIO_THRESHOLDS.SYNC_BREACH_DAYS) {
                return {
                    state: OPERATIONAL_STATES.INESTABLE,
                    color: 'error',
                    protocol: PROTOCOLS.RECOVERY,
                    message: 'Varios días sin registro detectados. Prioriza la rapidez de recuperación para volver al ritmo basal.'
                };
            } else if (diffDays === BIO_THRESHOLDS.SYNC_BREACH_DAYS) {
                return {
                    state: OPERATIONAL_STATES.ATENCION,
                    color: 'warning',
                    protocol: PROTOCOLS.DESYNC,
                    message: 'Detectamos un vacío ayer. Es vital retomar hoy para mantener la inercia del sistema.'
                };
            }

            // --- 1. SPRINT 8: DISFUNCIÓN EN CASCADA (DETECCIÓN) ---
            // Si hay 2 días consecutivos recientes (ej: ayer y anteayer) con estado de "Regulación" o "Riesgo", o energía < 4
            if (data.length >= 2) {
                const day1 = data[0];
                const day2 = data[1];

                const isDay1Crisis = day1.operational_state === OPERATIONAL_STATES.REGULACION || day1.operational_state === OPERATIONAL_STATES.RIESGO || day1.energy < BIO_THRESHOLDS.CRISIS_ENERGY;
                const isDay2Crisis = day2.operational_state === OPERATIONAL_STATES.REGULACION || day2.operational_state === OPERATIONAL_STATES.RIESGO || day2.energy < BIO_THRESHOLDS.CRISIS_ENERGY;

                if (isDay1Crisis && isDay2Crisis) {
                    systemLogs.addLog('Coherence', 'ANOMALÍA: Cascada detectada (2 días de inestabilidad)', 'error');
                    return {
                        state: OPERATIONAL_STATES.CASCADA,
                        color: 'error',
                        protocol: PROTOCOLS.PREVENTIVE_INTERVENTION,
                        message: 'Disfunción en cascada detectada. El escudo adaptativo bloqueará nueva carga hasta estabilizar el sistema.'
                    };
                }
            }


            // --- 2. SPRINT 8: BASELINE DINÁMICO ---
            if (data[0].operational_state) {
                const state = data[0].operational_state;
                if (state === OPERATIONAL_STATES.RIESGO) {
                    return {
                        state: OPERATIONAL_STATES.RIESGO,
                        color: 'error',
                        protocol: PROTOCOLS.ACTIVE_PROTECTION,
                        message: 'Fricción inusual. Bajemos el peso antes de que se vuelva crónico.'
                    };
                }
                if (state === OPERATIONAL_STATES.REGULACION) {
                    return {
                        state: OPERATIONAL_STATES.REGULACION,
                        color: 'warning',
                        protocol: PROTOCOLS.SURVIVAL,
                        message: 'Tu sistema exige descanso. Todo es negociable hoy menos la constancia.'
                    };
                }
                if (state === OPERATIONAL_STATES.EXPANSION) {
                    // Prevent sudden jumps: Ensure the last 3 days do not contain chronic stress.
                    const recentInstability = data.slice(1, 4).some(d => d.operational_state === OPERATIONAL_STATES.REGULACION || d.operational_state === OPERATIONAL_STATES.RIESGO);
                    if (recentInstability) {
                        return {
                            state: OPERATIONAL_STATES.SOSTEN,
                            color: 'success',
                            protocol: PROTOCOLS.MAINTENANCE,
                            message: 'Sistema en equilibrio. Consolida esta base antes de buscar expansión (día a día).'
                        };
                    }

                    // Expansión ahora debería mirar el Baseline, pero en este MVP de transición,
                    // Si el sistema clasificó 'Expansión' pero tu energía real NO SUPERÓ (Baseline + 1.0)
                    // Y TAMPOCO tienes una energía alta estructural (>= 8), 
                    // lo anclamos a Sostén para no ser falsamente optimistas si estabas muy bajo.
                    if (data[0].energy < BIO_THRESHOLDS.EXPANSION_ENERGY && data[0].energy < (computedBaseline + 1)) {
                        return {
                            state: OPERATIONAL_STATES.SOSTEN,
                            color: 'success',
                            protocol: PROTOCOLS.MAINTENANCE,
                            message: 'Tu energía mejoró, pero aún está cerca de tu promedo basal. Consolida esta estabilidad.'
                        };
                    }

                    return {
                        state: OPERATIONAL_STATES.EXPANSION,
                        color: 'success',
                        protocol: PROTOCOLS.PROGRESSION,
                        message: 'Sistema vibrante por encima del promedio basal. Listo para absorber nueva carga.'
                    };
                }
                if (state === OPERATIONAL_STATES.SOSTEN || state === OPERATIONAL_STATES.STABLE) {
                    return {
                        state: OPERATIONAL_STATES.SOSTEN,
                        color: 'success',
                        protocol: PROTOCOLS.MAINTENANCE,
                        message: `Sistema en equilibrio cercano a tu media estructural (${computedBaseline}/10).`
                    };
                }
            }

            // Fallbacks si no hay operational state
            if (data.length >= 2) {
                const consecutiveHighFriction = data.slice(0, 2).every(s => s.friction >= BIO_THRESHOLDS.HIGH_FRICTION);
                if (consecutiveHighFriction) {
                    return {
                        state: OPERATIONAL_STATES.INESTABLE,
                        color: 'error',
                        protocol: PROTOCOLS.RECOVERY,
                        message: 'Se han detectado 2 o más días consecutivos de alta fricción ambiental. Activa protocolos de protección.'
                    };
                } else if (data[0].friction >= BIO_THRESHOLDS.HIGH_FRICTION || data[0].energy <= BIO_THRESHOLDS.CRISIS_ENERGY - 1) {
                    return {
                        state: OPERATIONAL_STATES.ATENCION,
                        color: 'warning',
                        protocol: PROTOCOLS.ALERT,
                        message: 'El balance de ayer mostró alta fricción. Monitoreo constante hoy.'
                    };
                }
            } else if (data[0].friction >= BIO_THRESHOLDS.HIGH_FRICTION) {
                return {
                    state: OPERATIONAL_STATES.ATENCION,
                    color: 'warning',
                    protocol: PROTOCOLS.MONITORING,
                    message: 'Fricción inicial elevada detectada. Enfócate en la simplicidad para consolidar tus hábitos.'
                };
            }
        }

        return {
            state: OPERATIONAL_STATES.STABLE,
            color: 'success',
            protocol: PROTOCOLS.MAINTENANCE,
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
                .limit(BIO_THRESHOLDS.RECOVERY_DAYS_WINDOW);

            if (error) throw error;
            const newState = analyze(data || []);
            systemLogs.addLog('Coherence', `Estado actualizado: ${newState.state}`, 'success');
            setStatus(newState);

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
