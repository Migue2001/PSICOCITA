import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Modo demo forzado por env o por falta de Supabase
const isDemoMode = !supabase;

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const slowTimer = setTimeout(() => setSlow(true), 3000);

    const initAuth = async () => {
      try {
        if (supabase) {
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          if (error) throw error;
          console.log('Auth init session', initialSession);
          setSession(initialSession);
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id, initialSession.user.email);
          }
        } else if (isDemoMode) {
          const mockUser = localStorage.getItem('psicocita_mock_user');
          if (mockUser) {
            try {
              setUser(JSON.parse(mockUser));
            } catch {
              localStorage.removeItem('psicocita_mock_user');
            }
          }
        }
      } catch (err) {
        console.error('Initial auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const authListener = supabase?.auth?.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id, newSession.user.email);
        } else {
          if (!isDemoMode || !localStorage.getItem('psicocita_mock_user')) {
            setUser(null);
          }
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.data?.subscription?.unsubscribe();
      clearTimeout(slowTimer);
    };
  }, []); // ✅ Array vacío — solo corre una vez

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
    if (!error && data?.user) {
      await fetchUserProfile(data.user.id, data.user.email);
    }
    return { data, error };
  };

  const signUp = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase no está configurado.' } };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.user) {
      await fetchUserProfile(data.user.id, data.user.email);
    }
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
