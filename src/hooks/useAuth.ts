// Estado de la sesión: cargando, con sesión o sin sesión.
// En modo local (VITE_DATA_SOURCE=local) este hook no se usa: la app
// entra directa al dashboard con los datos de ejemplo.
import { useCallback, useEffect, useState } from 'react';
import { getSessionUser, onAuthChange, signOut as authSignOut, type SessionUser } from '../lib/auth';

export type AuthStatus = 'loading' | 'authed' | 'anon';

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const u = await getSessionUser();
      setUser(u);
      setStatus(u ? 'authed' : 'anon');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo comprobar la sesión.');
      setStatus('anon');
    }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setStatus(u ? 'authed' : 'anon');
    });
    return unsubscribe;
  }, [load]);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión.');
      return;
    }
    setUser(null);
    setStatus('anon');
  }, []);

  return { status, user, error, refresh: load, signOut };
}
