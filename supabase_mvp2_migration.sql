-- SQL Migration for HumanHab MVP2 (Sprint 1 & 2)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de Perfiles de Usuario (Sprint 1)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    level TEXT NOT NULL DEFAULT 'Principiante',
    habit_limit INTEGER NOT NULL DEFAULT 1,
    diagnostic_answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 2. Tabla de Hábitos (Sprint 2)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Target',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
CREATE POLICY "Users can manage their own habits" 
ON public.habits FOR ALL 
USING (auth.uid() = user_id);


-- 3. Tabla de Logs de Hábitos (Sprint 2)
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    friction INTEGER DEFAULT 5,
    is_completed BOOLEAN DEFAULT false,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(habit_id, date)
);

-- Habilitar RLS para habit_logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habit logs" ON public.habit_logs;
CREATE POLICY "Users can manage their own habit logs" 
ON public.habit_logs FOR ALL 
USING (auth.uid() = user_id);

-- 4. Tabla de Resúmenes Diarios (Sprint 2)
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    energy INTEGER DEFAULT 5,
    friction INTEGER DEFAULT 5,
    note TEXT,
    operational_state TEXT, -- 'Expansión', 'Sostén', 'Regulación', 'Riesgo', 'Neutro'
    recovery_speed INTEGER, -- Days to recovery
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Habilitar RLS para daily_summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own summaries" ON public.daily_summaries;
CREATE POLICY "Users can manage their own summaries" 
ON public.daily_summaries FOR ALL 
USING (auth.uid() = user_id);
-- 5. Tabla de Eventos Energéticos (Sprint 3)
CREATE TABLE IF NOT EXISTS public.energy_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('friccion', 'recarga')),
    label TEXT NOT NULL,
    intensity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para energy_events
ALTER TABLE public.energy_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own energy events" ON public.energy_events;
CREATE POLICY "Users can manage their own energy events" 
ON public.energy_events FOR ALL 
USING (auth.uid() = user_id);
