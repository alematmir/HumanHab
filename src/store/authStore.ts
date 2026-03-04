import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session, isLoading: false }),
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
}));

// Initialize auth state listening
supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setUser(session?.user ?? null);
});

supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setUser(session?.user ?? null);
});
