// Pantalla de inicio de sesión (correo + contraseña, Supabase Auth).
// Solo se muestra en modo Supabase y sin sesión. Los errores salen en
// español claro; nunca se muestra el texto técnico de Supabase.
import { useState } from 'react';
import { signIn } from '../lib/auth';

export default function LoginForm({ initialError }: { initialError?: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // Al entrar, onAuthStateChange actualiza la app y muestra el dashboard.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="main" style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Control de Gastos</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Inicia sesión para ver tus gastos.
        </p>
        {error && <div className="error">{error}</div>}
        <form className="form" onSubmit={onSubmit}>
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            disabled={busy}
          />
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            disabled={busy}
          />
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 12 }}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 16 }}>
          Si no tienes cuenta, pídele a un administrador que te cree una.
          La contraseña no se guarda en esta app.
        </p>
      </div>
    </main>
  );
}
