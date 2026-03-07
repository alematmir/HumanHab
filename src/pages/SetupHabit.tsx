import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { habitService } from '../lib/habitService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    Sparkles,
    Droplets,
    BookOpen,
    Dumbbell,
    Moon,
    Plus,
    Check,
    ChevronRight,
    AlertCircle,
    Info,
    Target,
    Zap,
    History,
    Heart,
    Brain,
    Coffee,
    Sun
} from 'lucide-react';

interface ArsenalHabit {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconName: string;
    defaultQuantity: number;
    defaultUnit: string;
}

const ARSENAL: ArsenalHabit[] = [
    { id: 'ar_med', title: 'Meditación', description: 'Enfoca tu mente y reduce el ruido cognitivo.', icon: <Sparkles className="w-6 h-6" />, iconName: 'Sparkles', defaultQuantity: 10, defaultUnit: 'Minutos' },
    { id: 'ar_hid', title: 'Hidratación', description: 'Mantén tu sistema biológico en estado óptimo.', icon: <Droplets className="w-6 h-6" />, iconName: 'Droplets', defaultQuantity: 2, defaultUnit: 'Litros' },
    { id: 'ar_lec', title: 'Lectura', description: 'Expande tu base de conocimiento diario.', icon: <BookOpen className="w-6 h-6" />, iconName: 'BookOpen', defaultQuantity: 10, defaultUnit: 'Páginas' },
    { id: 'ar_exe', title: 'Ejercicio', description: 'Activa tu motor metabólico y energía.', icon: <Dumbbell className="w-6 h-6" />, iconName: 'Dumbbell', defaultQuantity: 45, defaultUnit: 'Minutos' },
    { id: 'ar_slp', title: 'Descanso', description: 'Optimiza tu recuperación nocturna.', icon: <Moon className="w-6 h-6" />, iconName: 'Moon', defaultQuantity: 8, defaultUnit: 'Horas' },
];

const LEVEL_CONFIG: Record<string, { limit: number; message: string }> = {
    'Principiante': {
        limit: 2,
        message: 'Tu energía actual exige foco. Consolidar hasta dos victorias consistentes te dará la base sólida que necesitas.'
    },
    'Intermedio': {
        limit: 3,
        message: 'Balance detectado. Tres hilos conductuales permiten estabilidad sin comprometer tu recuperación biológica.'
    },
    'Avanzado': {
        limit: 5,
        message: 'Capacidad de carga alta detectada. Puedes expandir tu arquitectura, pero recuerda que cada hilo aumenta la fricción ambiental.'
    }
};

import { useCoherence } from '../hooks/useCoherence';

export function SetupHabit() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { status: coherenceStatus, isLoading: coherenceLoading } = useCoherence();

    const [userLevel, setUserLevel] = useState<string>('Principiante');
    const [habitLimit, setHabitLimit] = useState<number>(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualIcon, setManualIcon] = useState('Plus');
    const [manualQuantity, setManualQuantity] = useState<number | string>(1);
    const [manualUnit, setManualUnit] = useState<string>('Vez');
    const [selectedConfigs, setSelectedConfigs] = useState<Record<string, { quantity: number | string; unit: string }>>({});

    const CUSTOM_ICONS = [
        { name: 'Plus', icon: <Plus className="w-5 h-5" /> },
        { name: 'Target', icon: <Target className="w-5 h-5" /> },
        { name: 'Zap', icon: <Zap className="w-5 h-5" /> },
        { name: 'History', icon: <History className="w-5 h-5" /> },
        { name: 'Heart', icon: <Heart className="w-5 h-5" /> },
        { name: 'Brain', icon: <Brain className="w-5 h-5" /> },
        { name: 'Coffee', icon: <Coffee className="w-5 h-5" /> },
        { name: 'Sun', icon: <Sun className="w-5 h-5" /> },
    ];

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('user_profiles')
                .select('level')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                const config = LEVEL_CONFIG[data.level] || LEVEL_CONFIG['Principiante'];
                setUserLevel(data.level);
                setHabitLimit(config.limit);
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [user]);

    const toggleSelection = (id: string | 'manual') => {
        if (id === 'manual') {
            if (!isManualMode) {
                if (selectedIds.length >= habitLimit) {
                    setError(`Tu nivel actual (${userLevel}) sugiere un límite de ${habitLimit} hábito(s) para prevenir la desincronización.`);
                    setTimeout(() => setError(null), 4000);
                    return;
                }
                setIsManualMode(true);
            } else {
                setIsManualMode(false);
                setManualTitle('');
                setManualDesc('');
                setManualIcon('Plus');
            }
            return;
        }

        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
            setSelectedConfigs(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } else {
            const currentTotal = selectedIds.length + (isManualMode ? 1 : 0);
            if (currentTotal >= habitLimit) {
                setError(`Tu nivel actual (${userLevel}) sugiere un límite de ${habitLimit} hábito(s) para prevenir la desincronización.`);
                setTimeout(() => setError(null), 4000);
                return;
            }
            setSelectedIds(prev => [...prev, id]);

            const arsenalItem = ARSENAL.find(a => a.id === id);
            if (arsenalItem) {
                setSelectedConfigs(prev => ({
                    ...prev,
                    [id]: { quantity: arsenalItem.defaultQuantity, unit: arsenalItem.defaultUnit }
                }));
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;
        const totalSelected = selectedIds.length + (isManualMode && manualTitle.trim() ? 1 : 0);

        if (totalSelected === 0) {
            setError('Por favor, selecciona o crea al menos un hábito para comenzar.');
            return;
        }

        setIsSaving(true);
        try {
            const habitsToSave = selectedIds.map(id => {
                const arsenal = ARSENAL.find(a => a.id === id);
                const config = selectedConfigs[id] || { quantity: arsenal?.defaultQuantity || 1, unit: arsenal?.defaultUnit || 'Vez' };
                return {
                    user_id: user.id,
                    title: arsenal?.title || 'Hábito',
                    description: arsenal?.description || '',
                    icon: arsenal?.iconName || 'Target',
                    is_active: true,
                    target_quantity: Number(config.quantity) || 1,
                    target_unit: config.unit
                };
            });

            if (isManualMode && manualTitle.trim()) {
                habitsToSave.push({
                    user_id: user.id,
                    title: manualTitle,
                    description: manualDesc,
                    icon: manualIcon,
                    is_active: true,
                    target_quantity: Number(manualQuantity) || 1,
                    target_unit: manualUnit
                });
            }

            for (const h of habitsToSave) {
                await habitService.createHabit(h);
            }

            window.location.href = '/';
        } catch (err) {
            console.error('Error saving habits:', err);
            setError('Error al configurar tus hábitos. Inténtalo de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || coherenceLoading) {
        return (
            <div className="min-h-screen bg-main flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-tertiary text-[10px] font-bold uppercase tracking-widest italic">Calibrando Arquitectura...</p>
                </div>
            </div>
        );
    }

    if (coherenceStatus.state === 'Cascada') {
        return (
            <div className="min-h-screen bg-main p-6 sm:p-12 flex items-center justify-center">
                <Card className="w-full max-w-sm bg-surface rounded-[40px] p-8 border-error/50 shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-error/20">
                        <div className="h-full bg-error animate-[shimmer_2s_infinite]" style={{ width: '100%' }}></div>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-error/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-error" />
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-3">Escudo Preventivo Activo</h2>
                    <p className="text-[12px] text-tertiary leading-relaxed mb-6">
                        Hemos detectado disfunción en cascada sostenida en tus últimos ciclos. Para proteger tu arquitectura biológica, la adición de nuevos hábitos se encuentra <strong>bloqueada</strong>.
                    </p>
                    <p className="text-[10px] text-secondary italic mb-8">
                        Tu única misión prioritaria es cumplir con tu micro-protocolo base diario de carga mínima hasta romper la racha y estabilizar el sistema &gt; 5 de energía.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-main border border-white/5 text-secondary hover:text-white py-4 rounded-2xl text-[10px] tracking-widest uppercase font-bold">
                        Volver al Ciclo
                    </Button>
                </Card>
            </div>
        );
    }

    const currentConfig = LEVEL_CONFIG[userLevel] || LEVEL_CONFIG['Principiante'];

    return (
        <div className="min-h-screen bg-main p-6 sm:p-12 overflow-y-auto">
            <div className="max-w-2xl mx-auto pt-8 pb-32">
                <header className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4 animate-in fade-in duration-500">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                            Nivel {userLevel} • Límite: {habitLimit}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-primary mb-3 tracking-tight">Configurar Hábitos</h1>
                    <p className="text-secondary text-sm font-medium leading-relaxed max-w-lg italic opacity-80">
                        "{currentConfig.message}"
                    </p>
                </header>

                {error && (
                    <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 text-error shrink-0" />
                        <p className="text-error text-[11px] font-bold leading-tight uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <section className="mb-12">
                    <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-6 flex items-center gap-2">
                        Selecciona tu Arsenal <Info className="w-3 h-3 opacity-50" />
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ARSENAL.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleSelection(item.id)}
                                    disabled={isSaving}
                                    className={`text-left p-6 rounded-3xl border transition-all duration-300 group
                                        ${isSelected
                                            ? 'bg-accent/10 border-accent/40 shadow-xl scale-[1.02]'
                                            : 'bg-surface border-transparent hover:border-accent/20 hover:bg-accent/[0.02]'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-accent text-white shadow-lg' : 'bg-main text-secondary group-hover:text-accent group-hover:bg-accent/10'}`}>
                                            {item.icon}
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                            ${isSelected ? 'bg-accent border-accent text-white shadow-md' : 'border-tertiary/20'}`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                    </div>
                                    <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-accent' : 'text-primary'}`}>{item.title}</h3>
                                    <p className="text-[11px] text-tertiary leading-tight group-hover:text-secondary transition-colors font-medium">
                                        {item.description}
                                    </p>

                                    {isSelected && (
                                        <div className="mt-4 flex gap-2 animate-in fade-in duration-300 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="number"
                                                min="1"
                                                value={selectedConfigs[item.id]?.quantity}
                                                onChange={(e) => setSelectedConfigs(prev => ({
                                                    ...prev,
                                                    [item.id]: { ...prev[item.id], quantity: e.target.value }
                                                }))}
                                                className="w-20 bg-main border border-white/5 rounded-xl p-2 text-[11px] text-primary font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                                            />
                                            <input
                                                type="text"
                                                value={selectedConfigs[item.id]?.unit || ''}
                                                onChange={(e) => setSelectedConfigs(prev => ({
                                                    ...prev,
                                                    [item.id]: { ...prev[item.id], unit: e.target.value }
                                                }))}
                                                placeholder="Unidad (ej. Páginas)"
                                                className="flex-1 bg-main border border-white/5 rounded-xl p-2 text-[11px] text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                                            />
                                        </div>
                                    )}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => toggleSelection('manual')}
                            className={`text-left p-6 rounded-3xl border border-dashed transition-all duration-300
                                ${isManualMode
                                    ? 'bg-surface border-accent shadow-inner'
                                    : 'border-tertiary/20 hover:border-accent/40 hover:bg-accent/[0.02]'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl transition-colors ${isManualMode ? 'bg-accent text-white' : 'bg-main text-tertiary group-hover:text-accent'}`}>
                                    <Plus className="w-6 h-6" />
                                </div>
                                {isManualMode && (
                                    <div className="w-6 h-6 rounded-full bg-accent border border-accent text-white flex items-center justify-center shadow-md">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-sm mb-1 text-primary">Hábito Propio</h3>
                            <p className="text-[11px] text-tertiary leading-tight font-medium">
                                Define una micro-intervención personalizada fuera del arsenal.
                            </p>
                        </button>
                    </div>
                </section>

                {isManualMode && (
                    <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 bg-surface border-accent/20 shadow-2xl rounded-[32px]">
                            <h3 className="text-[10px] font-bold text-accent uppercase mb-6 tracking-[0.2em] pl-1">Hábito Personalizado</h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Icono</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                        {CUSTOM_ICONS.map((icon) => (
                                            <button
                                                key={icon.name}
                                                onClick={() => setManualIcon(icon.name)}
                                                className={`p-3 rounded-xl border flex items-center justify-center transition-all
                                                    ${manualIcon === icon.name
                                                        ? 'bg-accent text-white border-accent shadow-md scale-110'
                                                        : 'bg-main border-transparent text-tertiary hover:border-accent/20'}`}
                                            >
                                                {icon.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Título</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Ayuno Intermitente, Lectura de Paper..."
                                        value={manualTitle}
                                        onChange={(e) => setManualTitle(e.target.value)}
                                        className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary/30 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Cantidad Meta</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={manualQuantity}
                                            onChange={(e) => setManualQuantity(e.target.value)}
                                            className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Unidad de Medida</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Páginas, Hs"
                                            value={manualUnit}
                                            onChange={(e) => setManualUnit(e.target.value)}
                                            className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary/30 focus:outline-none focus:ring-1 focus:ring-accent/30 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Detalle o Comentarios</label>
                                    <textarea
                                        placeholder="Pautas adicionales para tu hábito..."
                                        value={manualDesc}
                                        onChange={(e) => setManualDesc(e.target.value)}
                                        className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary placeholder:text-tertiary/30 focus:outline-none focus:ring-1 focus:ring-accent/30 h-28 resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-main via-main to-transparent z-50">
                    <div className="max-w-2xl mx-auto">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || (selectedIds.length === 0 && !manualTitle.trim())}
                            className="w-full py-5 text-sm font-bold tracking-[0.2em] uppercase rounded-[24px] shadow-2xl group flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {isSaving ? 'Sincronizando...' : (
                                <>
                                    Activar Hábitos de Hoy
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                        <div className="flex items-center justify-center gap-2 mt-5 opacity-60">
                            <Info className="w-3 h-3 text-tertiary" />
                            <p className="text-[9px] text-tertiary uppercase tracking-widest font-bold">
                                Sistema de coherencia adaptativo v2.1
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
