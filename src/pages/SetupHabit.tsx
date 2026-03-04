import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function SetupHabit() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!title.trim()) {
            setError('Por favor, ingresa un nombre para tu hábito');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('cycles')
                .insert([
                    {
                        user_id: user.id,
                        habit_title: title,
                        habit_description: description,
                        duration_days: 20,
                        start_date: (() => {
                            const now = new Date();
                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        })(),
                        is_active: true
                    }
                ]);

            if (insertError) throw insertError;

            // Redirect to Ciclo
            navigate('/');
        } catch (err: unknown) {
            const errorObj = err as Error;
            console.error('Error creating habit:', errorObj);
            setError(errorObj.message || 'Error al crear el hábito. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-main flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
                        <Sparkles className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight mb-2">Define tu Hábito</h1>
                    <p className="text-secondary text-sm">
                        Para comenzar tu primer ciclo de 20 días,<br />necesitamos saber qué quieres sostener.
                    </p>
                </div>

                <Card className="bg-surface border-transparent p-6 shadow-xl rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-tertiary uppercase tracking-widest mb-2 block pl-1">
                                Nombre del Hábito
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Meditación diaria"
                                className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-inner"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-tertiary uppercase tracking-widest mb-2 block pl-1">
                                ¿Por qué es importante? (Opcional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Para reducir el estrés y mejorar mi enfoque."
                                className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none h-24 shadow-inner"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-xl animate-shake">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-4 text-sm font-bold tracking-wide rounded-2xl shadow-lg flex items-center justify-center gap-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creando Ciclo...' : (
                                <>
                                    Comenzar Ciclo de 20 Días
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-[10px] text-tertiary mt-8 uppercase tracking-widest">
                    HumanHab v1.0 • Sistema de Coherencia
                </p>
            </div>
        </div>
    );
}
