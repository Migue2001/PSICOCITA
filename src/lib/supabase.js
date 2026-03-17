import { createClient } from '@supabase/supabase-js';

const forceDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (forceDemo || !supabaseUrl || !supabaseAnonKey) {
  console.warn('Modo Demo activo: se usarán datos locales y logins demo.');
}

// Solo crear cliente si no estamos forzando demo y la URL es válida.
// Se desactiva multiTab para evitar locks de sesión (AbortError) en ciertos navegadores/ServiceWorkers.
export const supabase = (!forceDemo && supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'psicocita-auth',
        autoRefreshToken: true,
        persistSession: true,
        multiTab: false
      }
    })
  : null;
