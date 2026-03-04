# HUMANHAB -- MVP1

## Documento Maestro de Ejecución

------------------------------------------------------------------------

## 1. OBJETIVO

Validar el sistema base de energía como producto funcional.

Debe permitir: - Medición diaria de energía - Registro de eventos
(fricción / recuperación) - Cálculo de balance energético simple -
Visualización clara del estado diario

Sin IA. Sin predicción. Precisión \> complejidad.

------------------------------------------------------------------------

## 2. ALCANCE FUNCIONAL

### Sistema de Usuarios

-   Login funcional
-   Persistencia por usuario
-   Sesión persistente

### Bloque 1 -- Medición Base

-   Check-in diario (1--10)
-   Un registro por día
-   Edición dentro del día
-   Respeto de timezone

### Bloque 2 -- Eventos

-   Tipo: fricción \| recuperación
-   Intensidad 1--5 (lineal)
-   Nota opcional
-   Timestamp automático
-   Eventos ilimitados
-   Editables

Balance diario = Σ recuperaciones − Σ fricciones

### Bloque 3 -- Visualización

-   Energía base
-   Balance diario
-   Lista de eventos
-   Indicador simple (positivo / neutro / negativo)

------------------------------------------------------------------------

## 3. CRITERIO DE COMPLETO

-   Flujo completo funcional
-   Cálculo consistente
-   Sin bugs críticos

------------------------------------------------------------------------

## 4. PROPÓSITO

Validar el modelo energético.
