import React from 'react';
import { X, Shield } from 'lucide-react';

interface ProtocolModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    protocol: string;
    message: string;
    imageSrc: string;
}

export function ProtocolModal({ isOpen, onClose, type, protocol, message, imageSrc }: ProtocolModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface w-full max-w-md rounded-[40px] overflow-hidden flex flex-col shadow-2xl border border-white/5 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative px-6 py-8 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute left-8 top-8 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-6 h-6 text-primary opacity-70" />
                    </button>
                    <h2 className="text-secondary font-bold tracking-[0.15em] uppercase text-sm mt-1">
                        Protocolo Activado
                    </h2>
                </div>

                {/* Image Container */}
                <div className="px-8 flex justify-center">
                    <div className="w-full aspect-square rounded-[32px] overflow-hidden shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                        <img
                            src={imageSrc}
                            alt="Protocol Energy Flow"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-10 flex flex-col items-center text-center">
                    <h3 className="text-primary text-2xl font-bold mb-4">
                        Tipo: {protocol}
                    </h3>
                    <div className="space-y-1">
                        {message.split('. ').map((part, i, arr) => (
                            <p key={i} className="text-secondary text-lg font-medium leading-tight">
                                {part}{i < arr.length - 1 ? '.' : ''}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Footer and Button */}
                <div className="px-8 pb-10 flex flex-col items-center gap-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-5 rounded-[24px] shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                    >
                        Continuar
                    </button>
                    <div className="flex items-center gap-2 opacity-40">
                        <Shield className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                            Behavioral Coherence System
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
