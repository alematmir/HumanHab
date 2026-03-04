import { EnergyEvent, OperativeState } from './types';

/**
 * Calcula el Balance Diario
 * Fórmula: Balance = Σ(Recuperaciones) - Σ(Fricciones)
 * @param events - Arreglo de eventos registrados en el día
 * @returns {number} Valor numérico del balance
 */
export function calculateDailyBalance(events: EnergyEvent[]): number {
    return events.reduce((balance, event) => {
        // Si es recovery suma, si es friction resta la intensidad
        const value = event.type === 'recovery' ? event.intensity : -event.intensity;
        return balance + value;
    }, 0);
}

/**
 * Determina el estado del sistema asignado para el día (Operative State)
 * Basado en la Energía reportada manualmente (1-10) y el Balance Diario
 * @param currentEnergy Nivel de energía reportado (1-10)
 * @param dailyBalance Balance calculado de fricciones y recuperaciones
 * @returns {OperativeState} Estado de regulación
 */
export function determineOperativeState(currentEnergy: number, dailyBalance: number): OperativeState {
    // PROTEGER: Energía crítica (<=4) o estrés/balance muy negativo
    if (currentEnergy <= 4 || dailyBalance <= -3) {
        return 'PROTEGER';
    }

    // EXPANDIR: Energía y claridad (balance) en tendencia positiva
    if (currentEnergy >= 7 && dailyBalance > 1) {
        return 'EXPANDIR';
    }

    // ESTABILIZAR: Zona media (no es estado de emergencia ni de alta propulsión)
    return 'ESTABILIZAR';
}
