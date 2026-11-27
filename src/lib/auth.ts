// Auth: inicio de sesión con Supabase Auth (correo + contraseña).
// La sesión la guarda supabase-js en el navegador (localStorage), así
// que al recargar la app, si hay sesión, se entra directo.
// La seguridad real está en RLS: la anon key es pública por diseño y
// nunca se usa la service_role en el frontend.
import { supabase } from './supabase';
import type { Role } from '../types';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'manager' || value === 'member' || value === 'viewer';
}

/** Traduce los errores de Supabase Auth a español claro. */
export function translateAuthError(error: { message: string }): string {
  const msg = error.message;
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(msg)) {
    return 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.';
  }
  if (/user not found/i.test(msg)) return 'No hay ninguna cuenta con ese correo.';
  if (/network|fetch failed|failed to fetch/i.test(msg)) {
    return 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.';
  }
  if (/too many requests|rate limit/i.test(msg)) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

/** Inicia sesión con correo y contraseña. Lanza Error en español si falla. */
export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error));
}

/** Cierra la sesión actual. */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(translateAuthError(error));
}

/**
 * Usuario con sesión + su rol (profiles.role, leído con my_role()).
 * Devuelve null si no hay sesión. Si el perfil o el rol no se pueden
 * leer (migración sin aplicar, perfil sin crear), el rol es 'member':
 * lo mínimo, nunca más permisos de los que tocan.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let role: Role = 'member';
  try {
    const { data: roleData } = await supabase.rpc('my_role');
    if (isRole(roleData)) role = roleData;
  } catch {
    // Sin my_role (migración 02 sin aplicar): se queda 'member'.
  }

  let displayName = user.email ?? 'Sin nombre';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    const name = (profile as { display_name?: unknown } | null)?.display_name;
    if (typeof name === 'string' && name.trim()) displayName = name.trim();
  } catch {
    // Sin perfil: se usa el correo como nombre.
  }

  return { id: user.id, email: user.email ?? '', displayName, role };
}

/** Suscripción a cambios de sesión (entrar / salir). Devuelve el desuscribir. */
export function onAuthChange(
  callback: (sessionUser: SessionUser | null) => void,
): () => void {
  if (!supabase) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }
    void getSessionUser().then(callback);
  });
  return () => subscription.unsubscribe();
}
