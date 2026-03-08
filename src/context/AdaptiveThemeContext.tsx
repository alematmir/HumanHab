import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCoherence } from '../hooks/useCoherence';
import { OPERATIONAL_STATES } from '../config/bioConfig';

interface ThemeVariables {
    '--theme-accent': string;
    '--theme-accent-rgb': string;
    '--theme-glow': string;
    '--theme-surface': string;
    '--theme-main': string;
    '--aura-intensity': string;
    '--aura-speed': string;
    '--ui-rigidity': string;
}

interface AdaptiveThemeContextType {
    state: string;
}

const AdaptiveThemeContext = createContext<AdaptiveThemeContextType | undefined>(undefined);

export const AdaptiveThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { status } = useCoherence();
    const [currentState, setCurrentState] = useState(OPERATIONAL_STATES.SOSTEN);

    useEffect(() => {
        if (status.state) {
            setCurrentState(status.state);
            updateCSSVariables(status.state);
        }
    }, [status.state]);

    const updateCSSVariables = (state: string) => {
        const root = document.documentElement;

        let vars: ThemeVariables = {
            '--theme-accent': '#8A80FF',
            '--theme-accent-rgb': '138, 128, 255',
            '--theme-glow': 'rgba(138, 128, 255, 0.15)',
            '--theme-surface': 'rgba(22, 38, 63, 0.5)',
            '--theme-main': '#0a0f18',
            '--aura-intensity': '0.4',
            '--aura-speed': '8s',
            '--ui-rigidity': '0px'
        };

        switch (state) {
            case OPERATIONAL_STATES.EXPANSION:
                vars = {
                    '--theme-accent': '#00F5A0',
                    '--theme-accent-rgb': '0, 245, 160',
                    '--theme-glow': 'rgba(0, 245, 160, 0.2)',
                    '--theme-surface': 'rgba(0, 245, 160, 0.05)',
                    '--theme-main': '#050c12',
                    '--aura-intensity': '0.8',
                    '--aura-speed': '4s',
                    '--ui-rigidity': '0px'
                };
                break;

            case OPERATIONAL_STATES.CASCADA:
                vars = {
                    ...vars,
                    '--aura-intensity': '0.3',
                    '--aura-speed': '12s',
                    '--ui-rigidity': '10px'
                };
                break;

            case OPERATIONAL_STATES.RIESGO:
            case OPERATIONAL_STATES.INESTABLE:
                vars = {
                    ...vars,
                    '--aura-intensity': '0.5',
                    '--aura-speed': '6s',
                    '--ui-rigidity': '4px'
                };
                break;

            case OPERATIONAL_STATES.REGULACION:
            case OPERATIONAL_STATES.ATENCION:
                vars = {
                    ...vars,
                    '--aura-intensity': '0.4',
                    '--aura-speed': '10s',
                    '--ui-rigidity': '2px'
                };
                break;

            default:
                // SOSTEN y otros usan las default vars (Color base, velocidad normal)
                break;
        }

        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };

    return (
        <AdaptiveThemeContext.Provider value={{ state: currentState }}>
            {children}
        </AdaptiveThemeContext.Provider>
    );
};

export const useAdaptiveTheme = () => {
    const context = useContext(AdaptiveThemeContext);
    if (context === undefined) {
        throw new Error('useAdaptiveTheme must be used within an AdaptiveThemeProvider');
    }
    return context;
};
