import React from 'react';

interface EnergyBarProps {
    level: number;
}

const EnergyBar: React.FC<EnergyBarProps> = ({ level }) => {
    const percentage = Math.min(Math.max(level, 0), 100);

    // Minimal color logic using standard Tailwind colors or project variables
    const getBarColor = (val: number) => {
        if (val <= 30) return 'bg-red-500';
        if (val <= 60) return 'bg-amber-500';
        return 'bg-indigo-500';
    };

    return (
        <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/50">
            <div
                className={`h-full ${getBarColor(level)} transition-all duration-700 ease-out`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

export default EnergyBar;
