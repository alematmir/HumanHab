import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Target } from 'lucide-react';

interface SetupHabitProps {
    onComplete: (habitInfo: { title: string, description: string }) => void;
}

export function SetupHabit({ onComplete }: SetupHabitProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete({ title, description });
    };

    return (
        <div className="flex flex-col flex-1 py-10 animate-in fade-in duration-500">
            <header className="mb-10 text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                    <Target className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-3xl font-bold text-primary tracking-tight">Nuevo Ciclo</h1>
                <p className="text-secondary text-sm mt-3 px-6">
                    Define el hábito que quieres cristalizar durante los próximos 20 días.
                </p>
            </header>

            <Card className="rounded-3xl border-transparent p-6 shadow-sm bg-surface mx-2">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        label="Nombre del Hábito"
                        placeholder="Ej: Meditar 10 minutos"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="bg-main border-transparent"
                    />

                    <Input
                        label="Propósito / Descripción"
                        placeholder="Ej: Sesión matutina enfocada en respiración"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="bg-main border-transparent"
                    />

                    <Button
                        type="submit"
                        disabled={!title || !description}
                        className="w-full mt-4 py-4 rounded-xl text-sm font-bold tracking-wide"
                    >
                        Iniciar Ciclo (20 días)
                    </Button>
                </form>
            </Card>
        </div>
    );
}
