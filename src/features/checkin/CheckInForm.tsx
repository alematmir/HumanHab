import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';

interface Props {
    onCheckIn: (value: number) => void;
    hasCheckedIn: boolean;
}

export function CheckInForm({ onCheckIn, hasCheckedIn }: Props) {
    const [energy, setEnergy] = useState<number>(5);

    if (hasCheckedIn) {
        return (
            <div className="text-sm text-secondary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                Calibración inicial completada y fijada.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-tertiary flex justify-between items-center">
                    <span>Capacidad Actual</span>
                    <span className="text-primary font-mono">{energy}/10</span>
                </label>

                <input
                    type="range"
                    min="1" max="10"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="w-full accent-accent"
                />
                <div className="flex justify-between text-2xs font-medium text-tertiary tracking-widest uppercase mt-1">
                    <span>Exhausto</span>
                    <span>Óptimo</span>
                </div>
            </div>
            <Button onClick={() => onCheckIn(energy)} className="w-full mt-2">Fijar Base Energética</Button>
        </div>
    );
}
