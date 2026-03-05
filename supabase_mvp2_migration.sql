-- SQL Migration for HumanHab MVP2 (Sprint 1 & 2)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de Perfiles de Usuario (Sprint 1)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    level TEXT NOT NULL DEFAULT 'Principiante',
    habit_limit INTEGER NOT NULL DEFAULT 1,
    diagnostic_answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

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

CREATE POLICY "Users can manage their own habit logs" 
ON public.habit_logs FOR ALL 
USING (auth.uid() = user_id);
