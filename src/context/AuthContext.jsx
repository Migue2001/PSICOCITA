import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const isDemoMode = !supabase;

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  // FIX #3: usamos un ref para evitar que initAuth y onAuthStateChange
  // se ejecuten en paralelo y se pisen mutuamente.
  const authInitialized = useRef(false);

  useEffect(() => {
    if (isDemoMode) {
      // Modo demo: solo leer de localStorage, sin Supabase
      const mockUser = localStorage.getItem('psicocita_mock_user');
      if (mockUser) {
        try {
          setUser(JSON.parse(mockUser));
        } catch {
          localStorage.removeItem('psicocita_mock_user');
        }
      }
      setLoading(false);
      return;
    }

    // FIX #1 y #3: dejamos que onAuthStateChange sea el ÚNICO responsable
    // de manejar el estado. No corremos initAuth en paralelo.
    // INITIAL_SESSION se dispara automáticamente con la sesión guardada.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);

        if (newSession?.user) {
          // Usamos setTimeout para evitar deadlock con Supabase internamente
          setTimeout(async () => {
            await fetchUserProfile(newSession.user.id, newSession.user.email);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId, fallbackEmail) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error?.name === 'AbortError') return;
        console.error('Error fetching profile:', error);
        // FIX #1: si falla el perfil, ponemos un usuario mínimo en vez de null
        // para que ProtectedRoute no redirija al login con sesión activa
        setUser({ id: userId, email: fallbackEmail, role: 'user' });
        return;
      }

      if (data?.is_active === false) {
        await signOut();
        return;
      }

      if (data) {
        setUser({ ...data, email: data.email || fallbackEmail });
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.error('fetchUserProfile error:', err);
      // FIX #1: igual que arriba, no dejar user en null si hay sesión
      setUser({ id: userId, email: fallbackEmail, role: 'user' });
    }
  };

  const signIn = async (email, password) => {
    if (isDemoMode && ['interna@demo.com', 'licenciada@demo.com', 'super@demo.com'].includes(email)) {
      const roleKey = email.split('@')[0];
      const map = {
        interna: { role: 'user', full_name: 'Equipo Interna' },
        licenciada: { role: 'admin', full_name: 'Dra. María Pérez' },
        super: { role: 'super_admin', full_name: 'Técnico TI' }
      };
      const mock = map[roleKey] || map.interna;
      const mockUser = { id: `mock-id-${roleKey}`, full_name: mock.full_name, role: mock.role, email };
      localStorage.setItem('psicocita_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { data: { user: mockUser }, error: null };
    }

    if (!supabase) {
      return { data: null, error: { message: 'Supabase no está configurado.' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // No llamamos fetchUserProfile aquí: onAuthStateChange lo hará automáticamente
    return { data, error };
  };

  const signUp = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase no está configurado.' } };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    // No llamamos fetchUserProfile aquí: onAuthStateChange lo hará automáticamente
    return { data, error };
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('psicocita_mock_user');
    }
    setUser(null);
    setSession(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      signIn,
      signUp,
      signOut,
      loading,
      isDemoMode,
      session,
      isSessionActive: !!session
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
