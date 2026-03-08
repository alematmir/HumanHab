import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { Activity, ShieldCheck, Database, Zap, AlertTriangle, ChevronRight, Binary, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { systemLogs } from '../lib/logService';
import { Terminal } from 'lucide-react';
import { habitService } from '../lib/habitService';

export function Sistema() {
    const { user, role } = useAuthStore();
    const [stats, setStats] = useState({
        summaries: 0,
        habits: 0,
        logs: 0
    });
    const [isChecking, setIsChecking] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [logs, setLogs] = useState(systemLogs.getLogs());
    const [activeHabits, setActiveHabits] = useState<any[]>([]);
    const [integratedHabits, setIntegratedHabits] = useState<any[]>([]);
    const [selectedHabitId, setSelectedHabitId] = useState('');
    const [selectedIntegratedId, setSelectedIntegratedId] = useState('');

    useEffect(() => {
        const unsubscribe = systemLogs.subscribe(setLogs);
        return unsubscribe;
    }, []);

    const getLocalDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchStats = async () => {
        setIsChecking(true);
        try {
            const [summaries, habits, logs] = await Promise.all([
                supabase.from('daily_summaries').select('*', { count: 'exact', head: true }),
                supabase.from('habits').select('*', { count: 'exact', head: true }),
                supabase.from('habit_logs').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                summaries: summaries.count || 0,
                habits: habits.count || 0,
                logs: logs.count || 0
            });
        } catch (err) {
            console.error('Error fetching system stats:', err);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchStats();

        // Fetch habits for Layer B simulation
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true)
            .then(({ data }) => {
                if (data) {
                    setActiveHabits(data);
                    if (data.length > 0) setSelectedHabitId(data[0].id);
                }
            });

        // Fetch integrated habits for rollback testing
        supabase.from('habits').select('*').eq('user_id', user.id).eq('status', 'integrated')
            .then(({ data }) => {
                if (data) {
                    setIntegratedHabits(data);
                    if (data.length > 0) setSelectedIntegratedId(data[0].id);
                }
            });
    }, [user]);

    const forceRigidity = async (level: number) => {
        if (!user) return;
        setIsSimulating(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ rigidity_level: level })
                .eq('user_id', user.id);
            if (error) throw error;
            systemLogs.addLog('Profile', `Rigurosidad forzada a nivel ${level}`, 'warn');
            alert(`Nivel de rigurosidad forzado a nivel ${level} para pruebas.`);
        } catch (err) {
            systemLogs.addLog('Profile', `Error forzando rigurosidad: ${err}`, 'error');
            alert('Error al forzar rigurosidad');
        } finally {
            setIsSimulating(false);
        }
    };

    const forceLevel = async (level: string) => {
        if (!user) return;
        setIsSimulating(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ level })
                .eq('user_id', user.id);
            if (error) throw error;
            systemLogs.addLog('Profile', `Nivel de perfil forzado a ${level}`, 'warn');
            alert(`Nivel de perfil forzado a ${level} para pruebas.`);
        } catch (err) {
            systemLogs.addLog('Profile', `Error forzando nivel: ${err}`, 'error');
            alert('Error al forzar nivel');
        } finally {
            setIsSimulating(false);
        }
    };

    const simulateScenario = async (type: 'CASCADA' | 'RESILIENTE' | 'BURN_OUT' | 'OPTIMO' | 'VOLATIL' | 'LIMPIAR') => {
        if (!user) return;
        setIsSimulating(true);
        systemLogs.addLog('Simulation', `Iniciando escenario: ${type}`, 'info');

        const today = new Date();
        const summaries = [];

        if (type === 'LIMPIAR') {
            try {
                await supabase.from('daily_summaries').delete().eq('user_id', user.id);
                await supabase.from('habit_logs').delete().eq('user_id', user.id);
                systemLogs.addLog('Database', 'Historial del usuario limpiado', 'success');
                await fetchStats();
                window.location.reload();
            } catch (err) {
                systemLogs.addLog('Database', `Error limpiando historial: ${err}`, 'error');
            } finally {
                setIsSimulating(false);
            }
            return;
        }

        for (let i = 14; i >= 1; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dStr = getLocalDateStr(date);

            let friction = 3, energy = 7, state = 'Expansión';

            if (type === 'RESILIENTE') {
                if (i === 11 || i === 10) { state = 'Regulación'; energy = 3; friction = 8; }
                else if (i === 9) { state = 'Sostén'; energy = 6; friction = 4; }
                else if (i === 6) { state = 'Riesgo'; energy = 7; friction = 8; }
                else if (i === 5) { state = 'Sostén'; energy = 6; friction = 4; }
            } else if (type === 'BURN_OUT') {
                if (i <= 11) { state = 'Regulación'; energy = 2; friction = 9; }
            } else if (type === 'CASCADA') {
                if (i <= 2) { state = 'Regulación'; energy = 3; friction = 8; }
                else { state = 'Sostén'; energy = 6; friction = 5; }
            } else if (type === 'VOLATIL') {
                if (i % 3 === 0) { state = 'Regulación'; energy = 3; friction = 8; }
            } else if (type === 'OPTIMO') {
                state = 'Expansión'; energy = 9; friction = 1;
            }

            summaries.push({
                user_id: user.id,
                date: dStr,
                friction,
                energy,
                operational_state: state,
                note: `Simulación ${type}: Día -${i}`
            });
        }

        try {
            const { error } = await supabase.from('daily_summaries').upsert(summaries, { onConflict: 'user_id,date' });
            if (error) throw error;
            systemLogs.addLog('Simulation', `Escenario ${type} cargado`, 'success');
            await fetchStats();
            alert(`Escenario ${type} cargado correctamente.`);
        } catch (err) {
            systemLogs.addLog('Simulation', `Error en simulación: ${err}`, 'error');
            alert('Error en simulación');
        } finally {
            setIsSimulating(false);
        }
    };

    const simulateHabitFailure = async (habitId: string, daysFailing: number) => {
        if (!user || !habitId) return;
        setIsSimulating(true);
        systemLogs.addLog('Simulation', `Simulando falla en hábito ${habitId} por ${daysFailing} días`, 'info');

        try {
            const today = new Date();
            for (let i = 1; i <= daysFailing; i++) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                const dStr = getLocalDateStr(date);
                await habitService.upsertHabitLog({
                    user_id: user.id,
                    habit_id: habitId,
                    date: dStr,
                    is_completed: false,
                    completed_quantity: 0,
                    friction: 8 // Alta fricción para testear nivel máximo
                });
            }
            systemLogs.addLog('Simulation', `Fallos individuales simulados con éxito`, 'success');
            await fetchStats();
            alert(`Se simularon ${daysFailing} días de fallos en el hábito seleccionado.`);
        } catch (err: any) {
            systemLogs.addLog('Simulation', `Error simulando fallo de hábito: ${err.message || err}`, 'error');
            alert('Error en simulación');
        } finally {
            setIsSimulating(false);
        }
    };

    const rollbackIntegratedHabit = async (habitId: string) => {
        if (!user || !habitId) return;
        setIsSimulating(true);
        systemLogs.addLog('Simulation', `Restaurando hábito integrado ${habitId} a estado activo`, 'info');

        try {
            await habitService.updateHabit(habitId, { status: 'active', is_active: true });

            // Refetch to update UI
            const [activeRes, integratedRes] = await Promise.all([
                supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
                supabase.from('habits').select('*').eq('user_id', user.id).eq('status', 'integrated')
            ]);

            if (activeRes.data) {
                setActiveHabits(activeRes.data);
                if (activeRes.data.length > 0 && !selectedHabitId) setSelectedHabitId(activeRes.data[0].id);
            }
            if (integratedRes.data) {
                setIntegratedHabits(integratedRes.data);
                if (integratedRes.data.length > 0) {
                    setSelectedIntegratedId(integratedRes.data[0].id);
                } else {
                    setSelectedIntegratedId('');
                }
            }

            systemLogs.addLog('Simulation', `Hábito restaurado exitosamente`, 'success');
            await fetchStats();
            alert(`Hábito restaurado a estado Activo de forma correcta.`);
        } catch (err: any) {
            systemLogs.addLog('Simulation', `Error restaurando hábito: ${err.message || err}`, 'error');
            alert('Error al restaurar hábito integrado');
        } finally {
            setIsSimulating(false);
        }
    };

    if (role !== 'admin' && role !== 'tester') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-error/10 rounded-3xl flex items-center justify-center mb-6 border border-error/20">
                    <ShieldCheck className="w-8 h-8 text-error" />
                </div>
                <h1 className="text-xl font-bold text-primary tracking-tight mb-2">Acceso Restringido</h1>
                <p className="text-sm text-tertiary max-w-[240px]">
                    Tu arquitectura de permisos no tiene nivel de acceso a los núcleos del sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in duration-700">
            <header className="mb-8 mt-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/10 rounded-xl border border-accent/20">
                        <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">System Core v2.4</span>
                </div>
                <h1 className="text-3xl font-bold text-primary tracking-tight">Panel de Control</h1>
                <p className="text-tertiary text-sm mt-1">Monitoreo de integridad bio-sistémica</p>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="bg-surface/50 p-6 border-white/5 rounded-[32px] hover:bg-surface transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <Database className="w-5 h-5 text-secondary group-hover:text-accent transition-colors" />
                        <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Data</span>
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">{isChecking ? '...' : stats.summaries}</div>
                    <div className="text-[9px] font-black text-tertiary uppercase tracking-widest">Ciclos Totales</div>
                </Card>

                <Card className="bg-surface/50 p-6 border-white/5 rounded-[32px] hover:bg-surface transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <Binary className="w-5 h-5 text-secondary group-hover:text-accent transition-colors" />
                        <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Logs</span>
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">{isChecking ? '...' : stats.logs}</div>
                    <div className="text-[9px] font-black text-tertiary uppercase tracking-widest">Eventos Registrados</div>
                </Card>
            </div>

            <section className="space-y-4">
                <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    Estado de Módulos <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                </h2>

                {[
                    { name: 'Motor de Coherencia', status: 'Online', color: 'success', icon: Zap },
                    { name: 'Persistencia Supabase', status: 'Estable', color: 'success', icon: Database },
                    { name: 'Escudo de Cascada', status: 'Armado', color: 'accent', icon: ShieldCheck },
                    { name: 'IA Transcripción', status: 'Inactivo', color: 'tertiary', icon: Binary }
                ].map((mod, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-surface/30 rounded-3xl border border-white/5 group hover:bg-surface/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl bg-${mod.color}/10 border border-${mod.color}/20`}>
                                <mod.icon className={`w-4 h-4 text-${mod.color}`} />
                            </div>
                            <span className="text-sm font-bold text-primary">{mod.name}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest text-${mod.color}`}>
                            {mod.status}
                        </span>
                    </div>
                ))}
            </section>

            <section className="mt-12">
                <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                    Laboratorio de Simulación Bio-Sistémica
                </h2>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'CASCADA', label: 'Disfunción en Cascada', desc: 'Simula 2 días seguidos de caída brusca para activar el Escudo Preventivo.', color: 'error' },
                        { id: 'RESILIENTE', label: 'Historial Resiliente', desc: 'Simula 14 días con 2 ciclos de caída y recuperación exitosa.', color: 'success' },
                        { id: 'BURN_OUT', label: 'Agotamiento Crónico', desc: '14 días de inestabilidad profunda sin retorno al equilibrio.', color: 'error' },
                        { id: 'VOLATIL', label: 'Patrón de Inestabilidad', desc: 'Ciclos intermitentes de estrés cada 72 horas.', color: 'warning' },
                        { id: 'OPTIMO', label: 'Reloj Suizo (Ideal)', desc: '100% de consistencia en estado de Expansión/Sostén.', color: 'accent' },
                        { id: 'LIMPIAR', label: 'Reiniciar Historial', desc: 'Elimina todos los registros para empezar de cero.', color: 'secondary' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => simulateScenario(btn.id as any)}
                            disabled={isSimulating}
                            className="bg-surface/40 hover:bg-surface text-left p-4 rounded-3xl transition-all border border-white/5 group active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-[11px] font-black uppercase tracking-widest text-${btn.color} group-hover:translate-x-1 transition-transform`}>
                                    {btn.label}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full bg-${btn.color}/30 group-hover:bg-${btn.color} transition-colors`}></div>
                            </div>
                            <p className="text-[10px] text-tertiary leading-relaxed">
                                {btn.desc}
                            </p>
                        </button>
                    ))}
                </div>

                <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mt-8 mb-4 flex items-center gap-2">
                    Capa B: Pruebas de Micro-Protocolos
                </h3>
                {activeHabits.length > 0 ? (
                    <div className="bg-surface/30 p-4 rounded-3xl border border-white/5 space-y-4">
                        <select
                            value={selectedHabitId}
                            onChange={(e) => setSelectedHabitId(e.target.value)}
                            className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 font-bold"
                        >
                            {activeHabits.map(h => (
                                <option key={h.id} value={h.id}>{h.title} ({h.domain})</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => simulateHabitFailure(selectedHabitId, 2)}
                                disabled={isSimulating}
                                className="bg-surface border border-white/5 hover:border-accent/40 text-[9px] font-bold text-accent uppercase tracking-widest p-4 rounded-2xl transition-all active:scale-95"
                            >
                                Simular 2 Fallos
                            </button>
                            <button
                                onClick={() => simulateHabitFailure(selectedHabitId, 3)}
                                disabled={isSimulating}
                                className="bg-surface border border-white/5 hover:border-error/40 text-[9px] font-bold text-error uppercase tracking-widest p-4 rounded-2xl transition-all active:scale-95"
                            >
                                Simular 3 Fallos
                            </button>
                        </div>
                        <p className="text-[9px] text-tertiary italic p-1">
                            Simulá fallos crónicos en un solo hábito para ver cómo reacciona el Sistema de Rigurosidad aislando el hábito sin romper todo el sistema (Capa A).
                        </p>
                    </div>
                ) : (
                    <p className="text-[10px] text-tertiary italic">No hay hábitos activos para probar la Capa B.</p>
                )}

                <h3 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mt-8 mb-4 flex items-center gap-2">
                    Retroceso Bio-Sistémico (Vitrina)
                </h3>
                {integratedHabits.length > 0 ? (
                    <div className="bg-surface/30 p-4 rounded-3xl border border-white/5 space-y-4">
                        <select
                            value={selectedIntegratedId}
                            onChange={(e) => setSelectedIntegratedId(e.target.value)}
                            className="w-full bg-main border-transparent rounded-2xl p-4 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 font-bold"
                        >
                            {integratedHabits.map(h => (
                                <option key={h.id} value={h.id}>{h.title} (Integrado)</option>
                            ))}
                        </select>
                        <button
                            onClick={() => rollbackIntegratedHabit(selectedIntegratedId)}
                            disabled={isSimulating}
                            className="w-full bg-surface border border-white/5 hover:border-yellow-500/40 text-[9px] font-bold text-yellow-500 uppercase tracking-widest p-4 rounded-2xl transition-all active:scale-95"
                        >
                            Restaurar como Hábito Activo
                        </button>
                        <p className="text-[9px] text-tertiary italic p-1">
                            Saca un hábito de la Vitrina Dopamínica (ADN) y lo devuelve al panel operativo para testear lógicas de duplicación y Premios Evolutivos.
                        </p>
                    </div>
                ) : (
                    <p className="text-[10px] text-tertiary italic">No hay hábitos integrados actualmente en la Vitrina.</p>
                )}

                <h2 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-10 mb-6 flex items-center gap-3">
                    <div className="p-1.5 bg-accent/10 rounded-lg border border-accent/20">
                        <Sparkles className="w-3 h-3 text-accent" />
                    </div>
                    Overrides de Configuración
                </h2>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3 px-1">Rigurosidad (God Mode)</p>
                        <div className="flex gap-2">
                            {[1, 2, 3].map((level) => {
                                const labels = ['Compasivo', 'Equilibrado', 'Dureza'];
                                return (
                                    <button
                                        key={level}
                                        onClick={() => forceRigidity(level)}
                                        disabled={isSimulating}
                                        className="flex-1 bg-surface/40 hover:bg-surface text-[9px] font-bold text-accent uppercase tracking-widest p-4 rounded-2xl transition-all border border-accent/10 active:scale-95"
                                    >
                                        {labels[level - 1]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3 px-1">Nivel de Montaña</p>
                        <div className="flex gap-2">
                            {['Principiante', 'Intermedio', 'Avanzado'].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => forceLevel(lvl)}
                                    disabled={isSimulating}
                                    className="flex-1 bg-surface/40 hover:bg-surface text-[9px] font-bold text-accent uppercase tracking-widest p-4 rounded-2xl transition-all border border-accent/10 active:scale-95"
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-12 bg-[#050A14] border border-white/5 rounded-[32px] overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-surface/50">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-accent" />
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Kernel System Logs</h2>
                    </div>
                    <span className="text-[8px] font-bold text-tertiary uppercase bg-white/5 px-2 py-1 rounded-md">Real-time Stream</span>
                </div>
                <div className="p-4 h-[300px] overflow-y-auto font-mono text-[9px] space-y-2 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-tertiary italic opacity-50">
                            Esperando eventos del sistema...
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-4 group hover:bg-white/5 p-1 rounded transition-colors">
                                <span className="text-tertiary select-none shrink-0">[{log.timestamp}]</span>
                                <span className={`font-bold select-none shrink-0 w-16
                                    ${log.level === 'error' ? 'text-error' :
                                        log.level === 'warn' ? 'text-warning' :
                                            log.level === 'success' ? 'text-success' : 'text-accent'}`}
                                >
                                    {log.module}
                                </span>
                                <span className="text-secondary break-all">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <div className="pb-10"></div>
        </div>
    );
}
