import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente Supabase. Solo usa la ANON KEY pública; nunca la service_role
// en el frontend. La seguridad real está en RLS (ver supabase/migrations).
// Si no hay variables, el cliente es null y la app usa el proveedor local
// (data/seed.json + localStorage), que es lo que se publica en GitHub Pages
// hasta que Supabase esté conectado.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const DATA_SOURCE =
  (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'local';
