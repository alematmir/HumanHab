-- SQL Migration for HumanHab MVP3 (Sprint 7)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar columnas de Escalado Dinámico a la tabla 'habits'
ALTER TABLE public.habits
ADD COLUMN target_quantity NUMERIC DEFAULT 1,
ADD COLUMN target_unit TEXT DEFAULT 'vez/veces';

-- 2. Agregar columna de progreso a la tabla 'habit_logs'
ALTER TABLE public.habit_logs
ADD COLUMN completed_quantity NUMERIC DEFAULT 0;

-- Nota:
-- target_quantity (ej: 10)
-- target_unit (ej: 'Páginas', 'Minutos', 'Litros')
-- completed_quantity registrará cuánto hizo realmente el usuario, vital para el Slider Inteligente.
