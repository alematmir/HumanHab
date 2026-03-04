import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DailyEnergy, EnergyEvent, EventType } from '../lib/types';
import { useAuthStore } from '../store/authStore';

export function useHabitData() {
    const { user } = useAuthStore();
    const [initialEnergy, setInitialEnergy] = useState<DailyEnergy | null>(null);
    const [events, setEvents] = useState<EnergyEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        const fetchData = async () => {
            setLoading(true);
            // Extraemos la energía inicial de hoy
            const { data: energyData } = await supabase
                .from('daily_energy')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

            if (energyData) setInitialEnergy(energyData as DailyEnergy);

            // Extraemos los eventos de hoy
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { data: eventsData } = await supabase
                .from('energy_events')
                .select('*')
                .eq('user_id', user.id)
                .gte('timestamp', startOfDay.toISOString());

            if (eventsData) setEvents(eventsData as EnergyEvent[]);

            setLoading(false);
        };

        fetchData();
    }, [user]);

    const saveInitialEnergy = async (value: number, operativeState: string) => {
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];

        const energyRow = {
            user_id: user.id,
            value,
            date: today,
            operative_state: operativeState,
            updated_at: new Date().toISOString()
        };

        const { data } = await supabase.from('daily_energy').insert(energyRow).select().single();
        if (data) setInitialEnergy(data as DailyEnergy);
    };

    const saveEvent = async (type: EventType, intensity: number, note: string) => {
        if (!user) return;
        const eventRow = {
            user_id: user.id,
            type,
            intensity,
            note,
            timestamp: new Date().toISOString()
        };

        const { data, error } = await supabase.from('energy_events').insert(eventRow).select().single();
        if (data) setEvents(prev => [...prev, data as EnergyEvent]);
        if (error) console.error("Error al registrar evento:", error);
    };

    return {
        initialEnergy,
        events,
        dbLoading: loading,
        saveInitialEnergy,
        saveEvent
    };
}
