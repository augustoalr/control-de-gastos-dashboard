import Dashboard from './pages/Dashboard';
import LoginForm from './components/LoginForm';
import { useAuth } from './hooks/useAuth';
import { DATA_SOURCE, isSupabaseConfigured } from './lib/supabase';

// Puerta de entrada (T-06):
// - Modo local: sin login, directo al dashboard con los datos de ejemplo.
// - Modo Supabase: sin sesión solo se ve el login; con sesión, el
//   dashboard. Al recargar, la sesión persistente entra directa.
export default function App() {
  if (DATA_SOURCE !== 'supabase') {
    return <Dashboard auth={null} />;
  }
  return <SupabaseGate />;
}

function SupabaseGate() {
  const { status, user, error, signOut } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <main className="main">
        <div className="error">
          Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el
          archivo .env.
        </div>
      </main>
    );
  }

  if (status === 'loading') {
    return (
      <main className="main">
        <p>Cargando…</p>
      </main>
    );
  }

  if (status === 'anon' || !user) {
    return <LoginForm initialError={error} />;
  }

  return <Dashboard auth={{ user, onSignOut: signOut }} />;
}
