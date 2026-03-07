import React, { useState } from 'react';
import { Mail, Lock, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import iconHumanHab from '../assets/logohuman.png.png';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength += 25;
        if (/[A-Z]/.test(pass)) strength += 25;
        if (/[0-9]/.test(pass)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
        return strength;
    };

    const strength = getPasswordStrength(password);
    const passwordsMatch = password === confirmPassword && password !== '';
    const isPasswordValid = password.length >= 8;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) {
            setError('La clave de coherencia debe tener al menos 8 caracteres.');
            setIsLoading(false);
            return;
        }

        if (!passwordsMatch) {
            setError('Las claves no coinciden. Verifica tu entrada.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`.trim()
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
                    <div className="flex gap-3">
                        <Input
                            label="Nombre"
                            type="text"
                            placeholder="Ej: Alejandro"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            icon={<User className="w-5 h-5" />}
                        />
                        <Input
                            label="Apellido"
                            type="text"
                            placeholder="Ej: Maturano"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<Mail className="w-5 h-5" />}
                    />

                    <div className="space-y-1">
                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            icon={<Lock className="w-5 h-5" />}
                        />
                        {password.length > 0 && (
                            <div className="px-1 pt-1">
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                                    <div
                                        className={`h-full transition-all duration-500 ${strength <= 25 ? 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            strength <= 50 ? 'bg-warning shadow-[0_0_8px_rgba(242,153,74,0.5)]' :
                                                strength <= 75 ? 'bg-accent shadow-[0_0_8px_rgba(138,128,255,0.5)]' :
                                                    'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                            }`}
                                        style={{ width: `${strength}%` }}
                                    ></div>
                                </div>
                                <p className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-60">
                                    Fortaleza: {
                                        strength <= 25 ? 'Vulnerable' :
                                            strength <= 50 ? 'Base' :
                                                strength <= 75 ? 'Robusta' :
                                                    'Coherente'
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Confirmar Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        icon={<Lock className="w-5 h-5" />}
                        className={confirmPassword.length > 0 && !passwordsMatch ? 'ring-1 ring-error/50' : ''}
                    />

                    {error && (
                        <p className="text-sm text-error bg-error/10 p-3 rounded-xl border border-error/20">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full mt-2 py-3 rounded-xl text-base shadow-sm font-bold"
                        disabled={isLoading || !isPasswordValid || !passwordsMatch}
                    >
                        {isLoading ? 'Sincronizando...' : 'Confirmar y Empezar'}
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
