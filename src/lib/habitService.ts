import { supabase } from './supabase';

export interface Habit {
    id: string;
    user_id: string;
    title: string;
    description: string;
    icon: string;
    is_active: boolean; // Legacy check, use status whenever possible
    status: 'active' | 'integrated' | 'paused';
    target_quantity?: number;
    target_unit?: string;
    domain: 'restaurador' | 'carga_cognitiva' | 'carga_fisica';
    created_at?: string;
    updated_at?: string;
}

export interface UserProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    level: string;
    habit_limit: number;
    rigidity_level: number;
    role: 'admin' | 'tester' | 'user';
    anchor_2_symptoms?: string;
    anchor_9_symptoms?: string;
    diagnostic_answers?: any;
    created_at?: string;
    updated_at?: string;
}

export interface HabitLog {
    id: string;
    habit_id: string;
    user_id: string;
    date: string;
    friction: number;
    is_completed: boolean;
    completed_quantity?: number;
    note?: string;
    created_at?: string;
}

export interface DailySummary {
    id?: string;
    user_id: string;
    date: string;
    energy: number;
    friction: number;
    note?: string;
    operational_state?: string;
    recovery_speed?: number;
    created_at?: string;
}

export interface EnergyEvent {
    id: string;
    user_id: string;
    event_date: string;
    type: 'friccion' | 'recarga';
    label: string;
    intensity: number;
    created_at?: string;
}

export const habitService = {
    async getActiveHabits(userId: string) {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            // Filtro hibrido por robustez durante transicion: status prioritario
            .eq('status', 'active')
            .eq('is_active', true);

        if (error) throw error;
        return data as Habit[];
    },

    async getHabitsByStatus(userId: string, status: 'active' | 'integrated' | 'paused') {
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('status', status)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as Habit[];
    },

    async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('habits')
            .insert(habit)
            .select()
            .single();

        if (error) throw error;
        return data as Habit;
    },

    async updateHabit(id: string, updates: Partial<Habit>) {
        const { data, error } = await supabase
            .from('habits')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Habit;
    },

    async getLogsForDate(userId: string, date: string) {
        const { data, error } = await supabase
            .from('habit_logs')
            .select('*, habits(title, icon)')
            .eq('user_id', userId)
            .eq('date', date);

        if (error) throw error;
        return data;
    },

    async upsertHabitLog(log: Omit<HabitLog, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('habit_logs')
            .upsert(log, { onConflict: 'habit_id, date' })
            .select()
            .single();

        if (error) throw error;
        return data as HabitLog;
    },

    async getEnergyEventsForDate(userId: string, date: string) {
        const { data, error } = await supabase
            .from('energy_events')
            .select('*')
            .eq('user_id', userId)
            .eq('event_date', date)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as EnergyEvent[];
    },

    async logEnergyEvent(event: Omit<EnergyEvent, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('energy_events')
            .insert({
                user_id: event.user_id,
                event_date: event.event_date,
                type: event.type,
                label: event.label,
                intensity: event.intensity
            })
            .select()
            .single();

        if (error) throw error;
        return data as EnergyEvent;
    },

    async deleteEnergyEvent(id: string) {
        const { error } = await supabase
            .from('energy_events')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getDailySummary(userId: string, date: string) {
        const { data, error } = await supabase
            .from('daily_summaries')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .maybeSingle();

        if (error) throw error;
        return data as DailySummary | null;
    },

    async upsertDailySummary(summary: DailySummary) {
        const { data, error } = await supabase
            .from('daily_summaries')
            .upsert(summary, { onConflict: 'user_id, date' })
            .select()
            .single();

        if (error) throw error;
        return data as DailySummary;
    },

    async getUserProfile(userId: string) {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data as UserProfile | null;
    },

    async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as UserProfile;
    },

    async getAverageEnergy(userId: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_summaries')
            .select('energy')
            .eq('user_id', userId)
            .gte('date', startDateStr);

        if (error) throw error;
        if (!data || data.length === 0) return 5; // Default middle ground

        const sum = data.reduce((acc, curr) => acc + curr.energy, 0);
        return sum / data.length;
    },

    async validateRigidityUpgrade(userId: string, currentLevel: number, newLevel: number) {
        // Law: Descents are always allowed (Safety first)
        if (newLevel <= currentLevel) {
            return { allowed: true, message: 'Descenso o mantenimiento de rigurosidad permitido.' };
        }

        // 1. Law: Bio-Base (requires avg energy >= 7 for 7 days to upgrade)
        const avgEnergy = await this.getAverageEnergy(userId, 7);
        if (avgEnergy < 7) {
            return {
                allowed: false,
                message: `Ascenso bloqueado. Tu promedio de energía (7 días) es ${avgEnergy.toFixed(1)}, necesitas 7.0 o más para subir la montaña.`
            };
        }

        // 2. Law: Biological Ceiling (Techo Biológico)
        // If target is level 3 (Dureza), we check external stressors.
        if (newLevel === 3) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('diagnostic_answers')
                .eq('user_id', userId)
                .single();

            // A. Check for Heavy Onboarding Load
            if (profile?.diagnostic_answers?.load === 'heavy') {
                return {
                    allowed: false,
                    message: "Techo Biológico alcanzado. Tu carga ambiental declarada es 'Al límite'. No permitimos el nivel Dureza hasta que tu contexto se despeje."
                };
            }

            // B. Check for Recent High-Friction Events (Last 48hs)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const { data: recentFriction } = await supabase
                .from('energy_events')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'friccion')
                .gte('created_at', twoDaysAgo.toISOString());

            if (recentFriction && recentFriction.length >= 3) {
                return {
                    allowed: false,
                    message: `Techo Biológico alcanzado. Has registrado ${recentFriction.length} eventos de fricción últimamente. Tu sistema necesita estabilidad, no más presión.`
                };
            }
        }

        return { allowed: true, message: 'Ascenso permitido. Tu biología y contexto tienen la reserva necesaria.' };
    },

    async calculateRecoverySpeed(userId: string) {
        const { data: summaries, error } = await supabase
            .from('daily_summaries')
            .select('date, operational_state')
            .eq('user_id', userId)
            .order('date', { ascending: true });

        if (error) throw error;
        if (!summaries || summaries.length < 2) return null;

        let totalRecoveryDays = 0;
        let recoveryCycles = 0;
        let inCrisis = false;
        let crisisStartDate: Date | null = null;

        for (const summary of summaries) {
            const isStable = summary.operational_state === 'Expansión' || summary.operational_state === 'Sostén';

            if (!isStable && !inCrisis) {
                // Crisis starts: drop from stability
                inCrisis = true;
                crisisStartDate = new Date(summary.date);
            } else if (isStable && inCrisis) {
                // Recovery complete: return to stability
                const recoveryEndDate = new Date(summary.date);
                const diffTime = Math.abs(recoveryEndDate.getTime() - crisisStartDate!.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                totalRecoveryDays += diffDays;
                recoveryCycles++;
                inCrisis = false;
                crisisStartDate = null;
            }
        }

        // If currently in crisis, we can't count the ongoing cycle for the average,
        // but it's useful to know the current duration.
        let currentCrisisDays = 0;
        if (inCrisis && crisisStartDate) {
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - crisisStartDate.getTime());
            currentCrisisDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
            averageDays: recoveryCycles > 0 ? (totalRecoveryDays / recoveryCycles).toFixed(1) : null,
            totalCycles: recoveryCycles,
            currentCrisisDuration: inCrisis ? currentCrisisDays : 0,
            isInCrisis: inCrisis
        };
    },

    async getHabitHealth(habitId: string, days: number = 3) {
        // Obtenemos los logs recientes del hábito para evaluar la Capa B
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: logs, error } = await supabase
            .from('habit_logs')
            .select('date, is_completed, friction')
            .eq('habit_id', habitId)
            .gte('date', startDateStr)
            .order('date', { ascending: false });

        if (error) throw error;

        let consecutiveFails = 0;
        let highFrictionDays = 0;

        // Logs are ordered by newest first
        if (logs && logs.length > 0) {
            for (const log of logs) {
                if (log.is_completed === false) {
                    consecutiveFails++;
                } else {
                    // Si se completó un día reciente, se corta la racha de fallos consecutivos
                    break;
                }
            }

            for (const log of logs) {
                if (log.friction >= 7) {
                    highFrictionDays++;
                } else {
                    break;
                }
            }
        }

        return {
            consecutiveFails,
            highFrictionDays,
            needsProtection: consecutiveFails >= 2, // Threshold default
            needsInertia: highFrictionDays >= 3 // Threshold default
        };
    }
};
