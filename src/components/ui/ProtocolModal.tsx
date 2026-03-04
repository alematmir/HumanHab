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
            <div className="bg-[#f5f6ff] dark:bg-[#0a0a0f] w-full max-w-md rounded-[40px] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative px-6 py-8 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute left-8 top-8 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-6 h-6 text-[#1a1c2e] dark:text-white/70" />
                    </button>
                    <h2 className="text-[#1a1c2e] dark:text-white font-bold tracking-[0.15em] uppercase text-sm mt-1">
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
                    <h3 className="text-[#1a1c2e] dark:text-white text-2xl font-bold mb-4">
                        Tipo: {protocol}
                    </h3>
                    <div className="space-y-1">
                        {message.split('. ').map((part, i, arr) => (
                            <p key={i} className="text-[#4a4d6b] dark:text-tertiary text-lg font-medium leading-tight">
                                {part}{i < arr.length - 1 ? '.' : ''}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Footer and Button */}
                <div className="px-8 pb-10 flex flex-col items-center gap-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-5 rounded-[24px] shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
                    >
                        Continuar
                    </button>
                    <div className="flex items-center gap-2 opacity-40">
                        <Shield className="w-3.5 h-3.5 text-[#4f46e5]" />
                        <span className="text-[10px] font-bold text-[#1a1c2e] dark:text-white uppercase tracking-[0.2em]">
                            Behavioral Coherence System
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
