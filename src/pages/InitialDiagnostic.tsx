import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles, Zap, Target, History, Layout } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Question {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    options: { label: string; value: any; description?: string }[];
}

export function InitialDiagnostic() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (user) {
            const initialName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
            setDisplayName(initialName);
        }
    }, [user]);

    const questions: Question[] = [
        {
            id: 'identity',
            title: '¿Cómo definirías tu relación con tus hábitos hoy?',
            description: 'Esto nos ayuda a ajustar el tono de las micro-intervenciones.',
            icon: <Target className="w-8 h-8 text-accent" />,
            options: [
                { label: 'Buscando orden', value: 'seeker', description: 'Tengo caos y quiero estructura.' },
                { label: 'En construcción', value: 'builder', description: 'Tengo algunos hábitos pero soy inconstante.' },
                { label: 'Consolidado', value: 'pro', description: 'Soy disciplinado y busco optimizar.' }
            ]
        },
        {
            id: 'capacity',
            title: '¿Cuántos hábitos de bienestar sostienes hoy sin esfuerzo?',
            description: 'Esto definirá el límite inicial de tu arquitectura diaria.',
            icon: <Layout className="w-8 h-8 text-accent" />,
            options: [
                { label: 'Ninguno', value: 0, description: 'Estoy empezando de cero o después de un parate.' },
                { label: '1 a 2 hábitos', value: 2, description: 'Tengo una base mínima que ya es automática.' },
                { label: '3 o más', value: 3, description: 'Tengo una rutina sólida establecida.' }
            ]
        },
        {
            id: 'energy',
            title: '¿Cuál ha sido tu nivel de vitalidad esta última semana?',
            description: 'Un promedio honesto de tu energía física y mental.',
            icon: <Zap className="w-8 h-8 text-accent" />,
            options: [
                { label: 'Baja (1-3)', value: 3, description: 'Me siento agotado o con poca reserva.' },
                { label: 'Media (4-7)', value: 6, description: 'Funciono bien pero con altibajos.' },
                { label: 'Óptima (8-10)', value: 9, description: 'Me siento con excedente para empujar.' }
            ]
        },
        {
            id: 'resilience',
            title: 'Cuando fallas un día, ¿cuánto tardas en retomar?',
            description: 'Este es tu "Recovery Speed", la métrica maestra de HumanHab.',
            icon: <History className="w-8 h-8 text-accent" />,
            options: [
                { label: 'Al día siguiente', value: 'fast', description: 'Vuelvo rápido, el fallo no me frena.' },
                { label: '3 a 4 días', value: 'medium', description: 'Me cuesta un poco recuperar el ritmo.' },
                { label: 'Me cuesta volver solo', value: 'slow', description: 'Suelo abandonar cuando pierdo la racha.' }
            ]
        },
        {
            id: 'load',
            title: '¿Qué tan saturada sientes tu agenda y mente ahora?',
            description: 'La carga ambiental influye en tu capacidad de éxito.',
            icon: <Sparkles className="w-8 h-8 text-accent" />,
            options: [
                { label: 'Despejada', value: 'light', description: 'Tengo espacio mental para nuevos desafíos.' },
                { label: 'Ocupada', value: 'normal', description: 'Ritmo normal, sin mucho espacio extra.' },
                { label: 'Al límite', value: 'heavy', description: 'Mucho estrés o compromisos acumulados.' }
            ]
        }
    ];

    const handleNext = () => {
        if (step < questions.length) {
            setStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(prev => prev - 1);
    };

    const selectOption = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setTimeout(() => handleNext(), 300);
    };

    const handleFinish = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Calculate level
            let level = 'Principiante';
            let habitLimit = 1;

            if (answers.capacity >= 2 && answers.energy >= 6) {
                level = 'Intermedio';
                habitLimit = 2;
            }
            if (answers.capacity >= 3 && answers.resilience === 'fast' && answers.energy >= 8) {
                level = 'Avanzado';
                habitLimit = 3;
            }

            const profileData = {
                user_id: user.id,
                display_name: displayName,
                level,
                habit_limit: habitLimit,
                diagnostic_answers: answers,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_profiles')
                .upsert(profileData);

            if (error) throw error;

            navigate('/setup');
        } catch (err) {
            console.error('Error saving diagnostic:', err);
            alert('Error al guardar tu perfil. Inténtalo de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const progress = (step / questions.length) * 100;

    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Logout safety valve */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => useAuthStore.getState().signOut()}
                    className="text-[10px] font-bold text-tertiary/60 uppercase tracking-widest hover:text-error transition-colors p-2"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* Background blur decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-success/5 rounded-full blur-3xl animate-pulse duration-700"></div>

            <div className="w-full max-w-xl z-10">
                {step === 0 ? (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-8 flex justify-center">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                                <Sparkles className="w-10 h-10 text-accent" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
                            ¡Hola, {displayName.split(' ')[0]}!
                        </h1>
                        <div className="mb-8 group">
                            <label className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2 block group-focus-within:text-accent transition-colors">
                                Nombre de preferencia
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Tu nombre..."
                                className="w-full bg-surface border border-transparent focus:border-accent/30 rounded-2xl py-4 px-6 text-center text-xl font-bold text-primary placeholder:text-tertiary/30 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <p className="text-secondary text-lg leading-relaxed mb-10 max-w-md mx-auto">
                            Soy <span className="text-accent font-bold">HumanHab</span>, tu guía de coherencia.
                            Necesito entender tu estado basal para diseñarte el camino con <span className="italic">menos fricción</span>.
                        </p>
                        <Button
                            onClick={handleNext}
                            className="w-full py-4 text-sm font-bold tracking-widest uppercase rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                        >
                            Continuar <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <header className="mb-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                                    Paso {step} de {questions.length}
                                </span>
                                <div className="flex gap-1 h-1 w-32 bg-surface rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <button
                                onClick={handleBack}
                                className="flex items-center text-tertiary text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                            </button>
                        </header>

                        <div className="mb-8">
                            <div className="mb-4">{questions[step - 1].icon}</div>
                            <h2 className="text-2xl font-bold text-primary mb-2 tracking-tight">
                                {questions[step - 1].title}
                            </h2>
                            <p className="text-secondary text-sm leading-relaxed">
                                {questions[step - 1].description}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {questions[step - 1].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectOption(questions[step - 1].id, option.value)}
                                    className={`w-full text-left p-5 rounded-3xl border transition-all duration-200 group flex items-center justify-between
                                        ${answers[questions[step - 1].id] === option.value
                                            ? 'bg-accent/10 border-accent/40 shadow-sm'
                                            : 'bg-surface border-transparent hover:border-accent/20 hover:bg-accent/[0.02]'}`}
                                >
                                    <div>
                                        <div className={`font-bold text-sm mb-1 ${answers[questions[step - 1].id] === option.value ? 'text-accent' : 'text-primary'}`}>
                                            {option.label}
                                        </div>
                                        {option.description && (
                                            <div className="text-[11px] text-tertiary tracking-tight leading-none group-hover:text-secondary transition-colors">
                                                {option.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all 
                                        ${answers[questions[step - 1].id] === option.value
                                            ? 'bg-accent border-accent text-white scale-110'
                                            : 'border-tertiary/20 group-hover:border-accent/40'}`}>
                                        {answers[questions[step - 1].id] === option.value && <Zap className="w-3 h-3 fill-current" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {step === questions.length && Object.keys(answers).length === questions.length && (
                            <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
                                <Button
                                    onClick={handleFinish}
                                    disabled={isSaving}
                                    className="w-full py-4 text-sm font-bold tracking-widest uppercase rounded-2xl shadow-2xl"
                                >
                                    {isSaving ? 'Configurando Arquitectura...' : 'Finalizar y Calibrar Sistema'}
                                </Button>
                                <p className="text-center text-[10px] text-tertiary mt-4 uppercase tracking-widest font-bold">
                                    Tu perfil será guardado de forma segura y privada.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer label */}
            <div className="fixed bottom-8 text-[9px] font-bold text-tertiary/40 uppercase tracking-[0.2em] pointer-events-none">
                HumanHab Adaptive System • v2.0
            </div>
        </div>
    );
}
