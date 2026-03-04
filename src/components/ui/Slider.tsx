import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    colorClass: string;
    minLabel?: string;
    maxLabel?: string;
    valueColorClass?: string;
    isDynamic?: boolean;
    disabled?: boolean;
}

export function Slider({
    label,
    value,
    min = 0,
    max = 10,
    onChange,
    minLabel = 'Mínima',
    maxLabel = 'Máxima',
    isDynamic = false,
    disabled = false
}: SliderProps) {
    // Generate an ID to isolate the inline styles so they don't leak globally
    const uniqueId = React.useId().replace(/:/g, '');

    // Dynamic color calculation for Energy (Agotado -> Óptima)
    const getDynamicColor = (val: number) => {
        if (!isDynamic) return 'var(--color-brand-accent)';
        if (val <= 3) return 'var(--color-error)';
        if (val <= 6) return 'var(--color-warning)';
        return 'var(--color-success)';
    };

    const sliderColor = getDynamicColor(value);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-primary tracking-tight uppercase">{label}</h2>
                <div
                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-sm transition-colors duration-300`}
                    style={{ backgroundColor: sliderColor }}
                >
                    {value}
                </div>
            </div>

            <div className="relative pt-2 pb-6">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className={`slider-${uniqueId} w-full h-1.5 bg-border rounded-lg appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} focus:outline-none transition-all`}
                    style={{
                        backgroundImage: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${(value / max) * 100}%, transparent ${(value / max) * 100}%, transparent 100%)`
                    }}
                />
                <style>{`
                    .slider-${uniqueId}::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 22px;
                        height: 22px;
                        background: ${sliderColor} !important;
                        border-radius: 50%;
                        border: 4px solid var(--color-bg-surface);
                        box-shadow: 0 0 0 1px ${sliderColor};
                        cursor: pointer;
                        transition: transform 0.1s, background 0.3s;
                    }
                    /* Ensure Firefox also works */
                    .slider-${uniqueId}::-moz-range-thumb {
                        width: 22px;
                        height: 22px;
                        background: ${sliderColor} !important;
                        border-radius: 50%;
                        border: 4px solid var(--color-bg-surface);
                        box-shadow: 0 0 0 1px ${sliderColor};
                        cursor: pointer;
                    }
                    .slider-${uniqueId}:active::-webkit-slider-thumb {
                        transform: scale(1.2);
                    }
                `}</style>
                <div className="absolute w-full flex justify-between top-10 text-[10px] font-bold text-tertiary uppercase tracking-widest">
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                </div>
            </div>
        </div>
    );
}
