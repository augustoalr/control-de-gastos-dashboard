import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardData } from '../types';

// Estado del servidor: carga, error y recarga tras cada mutación.
// En una app mayor esto sería React Query; aquí el hook aísla ese cambio:
// la página no sabe si los datos vienen de local o de Supabase.
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getDashboard());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
