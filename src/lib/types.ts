export type OperativeState = 'PROTEGER' | 'ESTABILIZAR' | 'EXPANDIR';

export interface DailyEnergy {
    id: string;
    user_id: string;
    value: number; // 1-10
    date: string; // YYYY-MM-DD
    updated_at: string;
    operative_state: OperativeState;
}

export type EventType = 'friction' | 'recovery';

export interface EnergyEvent {
    id: string;
    user_id: string;
    type: EventType;
    intensity: number; // 1-5
    note?: string;
    timestamp: string;
}

export interface UserPreferences {
    id: string;
    email: string;
    created_at: string;
    preferences: {
        rigor_level: number;
    };
}
