import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import { Login } from '../pages/Login';
import { Ciclo } from '../pages/Ciclo';
import { Registro } from '../pages/Registro';
import { Perfil } from '../pages/Perfil';
import { Coherencia } from '../pages/Coherencia';
import { SetupHabit } from '../pages/SetupHabit';

import { MainLayout } from '../components/layout/MainLayout';
import { useCoherence } from '../hooks/useCoherence';
import { ProtocolModal } from '../components/ui/ProtocolModal';
import protocolAsset from '../assets/protocol_energy_flow.png';
import { useState, useEffect } from 'react';

function App() {
  const { user, isLoading } = useAuthStore();
  const { status, isLoading: isCoherenceLoading } = useCoherence();
  const [showGlobalProtocol, setShowGlobalProtocol] = useState(false);

  // Protocol messages mapping
  const protocolContent = {
    'Recuperación': 'Hoy hubo fricción. No es ruptura. Es ajuste. Retomá desde el punto mínimo.',
    'Alerta': 'El sistema detectó una baja leve. Prioriza estabilidad sobre expansión. Mantén el ritmo.',
    'Desincronización': 'El silencio es señal. Detectamos un vacío ayer. Retomá hoy para cerrar la brecha.',
    'Monitoreo': 'Registro inicial con alta fricción. Enfócate en la simplicidad para consolidar la base.',
    'Mantenimiento': 'Sincronización óptima detectada. Continúa con el flujo actual del sistema.'
  };

  // Theme and Protocol initialization
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      if (!savedTheme) localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Trigger protocol modal if active and hasn't been shown in this window session
  useEffect(() => {
    if (user && status.protocol !== 'Mantenimiento' && !sessionStorage.getItem('protocol_seen')) {
      setShowGlobalProtocol(true);
      sessionStorage.setItem('protocol_seen', 'true');
    }
  }, [user, status, isCoherenceLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main">
        <p className="text-tertiary text-sm tracking-widest uppercase animate-pulse">
          Inicializando Sistema...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        {/* Rutas Privadas / Main App */}
        <Route
          path="/"
          element={
            user ? (
              <MainLayout>
                <Ciclo />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/registro"
          element={
            user ? (
              <MainLayout>
                <Registro />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/coherencia"
          element={
            user ? (
              <MainLayout>
                <Coherencia />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/setup"
          element={user ? <SetupHabit /> : <Navigate to="/login" />}
        />
        <Route
          path="/perfil"
          element={
            user ? (
              <MainLayout>
                <Perfil />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <ProtocolModal
        isOpen={showGlobalProtocol}
        onClose={() => setShowGlobalProtocol(false)}
        type={status.state}
        protocol={status.protocol}
        message={protocolContent[status.protocol as keyof typeof protocolContent] || status.message}
        imageSrc={protocolAsset}
      />
    </BrowserRouter>
  );
}

export default App;
