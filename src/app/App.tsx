import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { habitService } from '../lib/habitService';

import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Ciclo } from '../pages/Ciclo';
import { Registro } from '../pages/Registro';
import { Perfil } from '../pages/Perfil';
import { Coherencia } from '../pages/Coherencia';
import { SetupHabit } from '../pages/SetupHabit';
import { InitialDiagnostic } from '../pages/InitialDiagnostic';
import { Sistema } from '../pages/Sistema';
import { AdaptiveThemeProvider } from '../context/AdaptiveThemeContext';

import { MainLayout } from '../components/layout/MainLayout';
import { useCoherence } from '../hooks/useCoherence';
import { ProtocolModal } from '../components/ui/ProtocolModal';
import protocolAsset from '../assets/protocol_energy_flow.png';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OPERATIONAL_STATES, PROTOCOLS, PROTOCOL_MESSAGES } from '../config/bioConfig';

function App() {
  const { user, isLoading } = useAuthStore();
  const { status, isLoading: isCoherenceLoading } = useCoherence();
  const [showGlobalProtocol, setShowGlobalProtocol] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [hasHabits, setHasHabits] = useState<boolean | null>(null);

  const protocolContent = {
    [PROTOCOLS.RECOVERY]: PROTOCOL_MESSAGES.RECOVERY,
    [PROTOCOLS.ALERT]: PROTOCOL_MESSAGES.ALERT,
    [PROTOCOLS.DESYNC]: PROTOCOL_MESSAGES.DESYNC,
    [PROTOCOLS.MONITORING]: PROTOCOL_MESSAGES.MONITORING,
    [PROTOCOLS.MAINTENANCE]: PROTOCOL_MESSAGES.MAINTENANCE
  };

  // Ensure dark mode is active by default as per the brand identity
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  // Check for user profile and habits
  useEffect(() => {
    if (!user) {
      setHasProfile(null);
      setHasHabits(null);
      return;
    }

    const checkStatus = async () => {
      // Check Profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setHasProfile(true);
        useAuthStore.getState().setRole(profile.role || 'user');

        // Check Habits
        const { count } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);

        setHasHabits((count || 0) > 0);
      } else {
        setHasProfile(false);
        setHasHabits(false);
        useAuthStore.getState().setRole(null);
      }
    };

    checkStatus();
  }, [user]);

  // Trigger protocol modal if active and hasn't been shown in this window session
  useEffect(() => {
    if (user && status.protocol !== PROTOCOLS.MAINTENANCE && !sessionStorage.getItem('protocol_seen')) {
      setShowGlobalProtocol(true);
      sessionStorage.setItem('protocol_seen', 'true');
    }
  }, [user, status, isCoherenceLoading]);

  if (isLoading || (user && hasProfile === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main">
        <p className="text-tertiary text-sm tracking-widest uppercase animate-pulse">
          Inicializando Sistema...
        </p>
      </div>
    );
  }

  return (
    <AdaptiveThemeProvider>
      <BrowserRouter>
        <div className="adaptive-aura"></div>
        <div className="relative z-10 min-h-screen">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Register /> : <Navigate to="/" />} />

            {/* Diagnóstico Inicial */}
            <Route
              path="/diagnostic"
              element={user ? (hasProfile ? <Navigate to="/" /> : <InitialDiagnostic />) : <Navigate to="/login" />}
            />

            {/* Rutas Privadas / Main App */}
            <Route
              path="/"
              element={
                user ? (
                  hasProfile === false ? (
                    <Navigate to="/diagnostic" />
                  ) : hasHabits === false ? (
                    <Navigate to="/setup" />
                  ) : (
                    <MainLayout>
                      <Ciclo />
                    </MainLayout>
                  )
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
            <Route
              path="/sistema"
              element={
                user ? (
                  <MainLayout>
                    <Sistema />
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
        </div>
      </BrowserRouter>
    </AdaptiveThemeProvider>
  );
}

export default App;
