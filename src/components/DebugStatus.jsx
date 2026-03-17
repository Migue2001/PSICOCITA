import React from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const DebugStatus = () => {
  const { user, loading, session } = useAuth();
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 12,
        zIndex: 9999,
        maxWidth: 260,
        lineHeight: 1.4
      }}
    >
      <div>DBG</div>
      <div>loading: {String(loading)}</div>
      <div>user: {user ? user.id : 'null'}</div>
      <div>role: {user?.role || '-'}</div>
      <div>session: {session ? 'yes' : 'no'}</div>
      <div>supabase: {supabase ? 'ok' : 'null'}</div>
    </div>
  );
};
