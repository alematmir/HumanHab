import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import iconHumanHab from '../assets/IconHumanHab.png';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Intenta hacer login
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // Si falla porque el usuario no existe, tratamos de registrarlo automáticamente
        if (signInError && signInError.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
            }
        } else if (signInError) {
            setError(signInError.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center">
                {/* Logo / Icon Area */}
                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border overflow-hidden p-2">
                    <img src={iconHumanHab} alt="HumanHab Icon" className="w-full h-full object-contain" />
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-primary mb-1">HumanHab</h1>
                <p className="text-secondary mb-10 text-center">Coherencia conductual</p>

                <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<Mail className="w-5 h-5" />}
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        icon={<Lock className="w-5 h-5" />}
                    />

                    {error && (
                        <p className="text-sm text-error bg-error/10 p-3 rounded-xl border border-error/20">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full mt-2 py-3 rounded-xl text-base shadow-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cargando...' : 'Continuar'}
                    </Button>
                </form>

                <div className="mt-8 flex items-center w-full gap-4">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs text-secondary font-medium">Acceso de sistema</span>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                <p className="text-xs text-secondary text-center mt-6">
                    Al continuar, aceptas nuestros<br />
                    <a href="#" className="text-accent hover:text-accent-hover transition-colors">Términos de Servicio</a> y <a href="#" className="text-accent hover:text-accent-hover transition-colors">Privacidad</a>
                </p>

                <p className="text-[10px] text-tertiary mt-12 tracking-wider">
                    MVP1 · BUILD 1.0.4 · HUMANHAB
                </p>
            </div>
        </div>
    );
}
