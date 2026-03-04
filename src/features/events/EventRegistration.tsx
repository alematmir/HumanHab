import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EventType } from '../../lib/types';

interface Props {
    onRegister: (type: EventType, intensity: number, note: string) => void;
}

export function EventRegistration({ onRegister }: Props) {
    const [type, setType] = useState<EventType>('friction');
    const [intensity, setIntensity] = useState<number>(3);
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister(type, intensity, note);
        setIntensity(3);
        setNote('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex border border-border rounded-sm overflow-hidden">
                <button
                    type="button"
                    onClick={() => setType('friction')}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${type === 'friction' ? 'bg-error text-white' : 'bg-surface text-secondary hover:text-primary'} border-r border-border`}
                >
                    Fricción
                </button>
                <button
                    type="button"
                    onClick={() => setType('recovery')}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${type === 'recovery' ? 'bg-success text-white' : 'bg-surface text-secondary hover:text-primary'}`}
                >
                    Recuperación
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-tertiary flex justify-between items-center">
                    <span>Magnitud</span>
                    <span className="text-primary font-mono">{intensity}/5</span>
                </label>
                <input
                    type="range"
                    min="1" max="5"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-tertiary">Anotación (Opcional)</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ej: Reunión tensa / Meditación 10m"
                    className="border border-border bg-main text-primary rounded-sm p-2 text-sm focus:outline-none focus:border-tertiary transition-colors"
                />
            </div>

            <Button type="submit" variant="secondary" className="mt-1 w-full border-border">
                Registrar
            </Button>
        </form>
    );
}
