import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

interface Step {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const steps: Step[] = [
    {
        title: "Bienvenido a HumanHab",
        description: "Tu guardián bio-conductual. Aquí no solo tachas tareas, gestionas tu energía vital para evitar el burnout.",
        icon: <Sparkles className="w-8 h-8 text-accent" />,
        color: "bg-accent/10"
    },
    {
        title: "Energía vs Fricción",
        description: "Registra tu vitalidad (1-10) y el esfuerzo (Fricción) de cada hábito. El sistema aprende tus límites reales.",
        icon: <Zap className="w-8 h-8 text-warning" />,
        color: "bg-warning/10"
    },
    {
        title: "Escudo de Coherencia",
        description: "Si tu energía cae por 2 días, activamos el Escudo: bloqueamos nuevas cargas y bajamos el rigor automáticamente.",
        icon: <ShieldCheck className="w-8 h-8 text-success" />,
        color: "bg-success/10"
    },
    {
        title: "Arquitecto de Ritmos",
        description: "Recuerda: El éxito es tu capacidad de recuperación, no solo de ejecución. ¡Comencemos!",
        icon: <CheckCircle2 className="w-8 h-8 text-accent" />,
        color: "bg-accent/10"
    }
];

export function OnboardingTutorial() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('humanhab_onboarding_done');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        localStorage.setItem('humanhab_onboarding_done', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-main/98 backdrop-blur-2xl"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-sm bg-surface rounded-[48px] p-8 border border-white/5 shadow-2xl relative overflow-hidden text-center"
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-8 pt-6">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-full flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-accent shadow-[0_0_10px_rgba(138,128,255,0.5)]' : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleClose}
                        className="absolute top-10 right-8 text-tertiary/40 hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="mt-12"
                        >
                            <div className={`w-20 h-20 rounded-[32px] ${steps[currentStep].color} flex items-center justify-center mx-auto mb-8`}>
                                {steps[currentStep].icon}
                            </div>

                            <h2 className="text-2xl font-bold text-primary mb-4 tracking-tight">
                                {steps[currentStep].title}
                            </h2>

                            <p className="text-sm text-tertiary leading-relaxed mb-10 px-2 font-medium">
                                {steps[currentStep].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="space-y-4">
                        <Button
                            onClick={handleNext}
                            className="w-full py-5 text-sm font-bold tracking-[0.15em] uppercase rounded-[24px] bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20"
                        >
                            {currentStep === steps.length - 1 ? "Empezar" : "Siguiente"}
                        </Button>

                        {currentStep < steps.length - 1 && (
                            <button
                                onClick={handleClose}
                                className="text-[10px] font-bold text-tertiary/40 hover:text-tertiary uppercase tracking-[0.2em] transition-colors"
                            >
                                Saltar Tutorial
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
