/**
 * Bio-Feedback Algorithm Configuration
 * Centralized constants for the HumanHab system.
 */

export const BIO_THRESHOLDS = {
    CRISIS_ENERGY: 4,          // Energy level below which a crisis state may be triggered
    EXPANSION_ENERGY: 8,       // Energy level required to stay in Expansion (structurally)
    HIGH_FRICTION: 7,          // Friction level considered "High"
    RECOVERY_DAYS_WINDOW: 14,  // Window for dynamic baseline and history analysis
    SYNC_BREACH_DAYS: 2,       // Days without logs before triggering 'Desincronización'
};

export const OPERATIONAL_STATES = {
    STABLE: 'Estable',
    EXPANSION: 'Expansión',
    SOSTEN: 'Sostén',
    REGULACION: 'Regulación',
    RIESGO: 'Riesgo',
    CASCADA: 'Cascada',
    ATENCION: 'Atención',
    INESTABLE: 'Inestable',
};

export const PROTOCOLS = {
    MAINTENANCE: 'Mantenimiento',
    RECOVERY: 'Recuperación',
    DESYNC: 'Desincronización',
    SURVIVAL: 'Supervivencia',
    ACTIVE_PROTECTION: 'Protección Activa',
    PREVENTIVE_INTERVENTION: 'Intervención Preventiva',
    PROGRESSION: 'Progresión',
    MONITORING: 'Monitoreo',
    ALERT: 'Alerta',
};

export const PROTOCOL_MESSAGES = {
    RECOVERY: 'Hoy hubo fricción. No es ruptura. Es ajuste. Retomá desde el punto mínimo.',
    ALERT: 'El sistema detectó una baja leve. Prioriza estabilidad sobre expansión. Mantén el ritmo.',
    DESYNC: 'El silencio es señal. Detectamos un vacío ayer. Retomá hoy para cerrar la brecha.',
    MONITORING: 'Registro inicial con alta fricción. Enfócate en la simplicidad para consolidar la base.',
    MAINTENANCE: 'Sincronización óptima detectada. Continúa con el flujo actual del sistema.',
    SURVIVAL: 'Tu sistema exige descanso. Todo es negociable hoy menos la constancia.',
    PROTECTION: 'Fricción inusual. Bajemos el peso antes de que se vuelva crónico.',
    PREVENTIVE: 'Disfunción en cascada detectada. El escudo adaptativo bloqueará nueva carga hasta estabilizar el sistema.',
    PROGRESSION: 'Sistema vibrante por encima del promedio basal. Listo para absorber nueva carga.',
};
