import React, { useState } from 'react';
import { Mail, Lock, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import iconHumanHab from '../assets/IconHumanHab.png';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
        } else if (data.user && !data.session) {
            // Success but needs confirmation
            setError('¡Cuenta creada! Revisa tu email para confirmar y poder entrar.');
            setIsLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center p-6 sm:p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center">
                {/* Logo Area */}
                <Link to="/login" className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border overflow-hidden p-2 hover:scale-105 transition-transform">
                    <img src={iconHumanHab} alt="HumanHab Icon" className="w-full h-full object-contain" />
                </Link>

                <h1 className="text-4xl font-bold tracking-tight text-primary mb-1">Crea tu cuenta</h1>
                <p className="text-secondary mb-10 text-center">Únete al ecosistema de coherencia</p>

                <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
                    <Input
                        label="¿Cómo te llamas?"
                        type="text"
                        placeholder="Tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        icon={<User className="w-5 h-5" />}
                    />

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
                        className="w-full mt-2 py-3 rounded-xl text-base shadow-sm font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creando cuenta...' : 'Confirmar y Empezar'}
                        {!isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                </form>

                <div className="mt-8 flex items-center w-full gap-4">
                    <div className="h-px bg-border flex-1"></div>
                    <Link to="/login" className="text-xs text-secondary font-medium flex items-center hover:text-accent transition-colors">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Volver al Login
                    </Link>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                <p className="text-[10px] text-tertiary mt-12 tracking-wider">
                    MVP2 · BUILD 2.0.1 · HUMANHAB
                </p>
            </div>
        </div>
    );
}
