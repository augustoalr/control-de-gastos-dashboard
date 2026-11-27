import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { api } from '../lib/api';
import { DATA_SOURCE } from '../lib/supabase';
import type { SessionUser } from '../lib/auth';
import { formatAED, formatPct } from '../lib/money';
import { availableCents, spentPct, type Expense, type UserSummary } from '../types';
import Sidebar from '../components/Sidebar';
import MonthSelector from '../components/MonthSelector';
import ExpenseChart from '../components/ExpenseChart';
import Donut from '../components/Donut';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import TopupForm from '../components/TopupForm';
import ReportPanel from '../components/ReportPanel';
import { CATEGORY_COLORS } from '../components/categoryColors';

// Página única del MVP. Estado de UI local (mes seleccionado, formularios);
// estado del servidor en useDashboard. El mes por defecto es noviembre,
// el último mes (EXP5), como en la maqueta del diseñador.
//
// Auth (T-06): en modo Supabase, `auth` trae al usuario con su rol.
// Solo admin/manager ven el selector "ver los gastos de…" y pueden tocar
// un nombre del Top para ver sus gastos. En ese caso la vista es de solo
// lectura: la escritura sigue siendo solo lo propio (RLS lo impone en la
// BD). Un member o viewer nunca ve el selector ni el detalle de otros.
// En modo local no hay login: es la demo con datos de ejemplo.
export default function Dashboard({
  auth,
}: {
  auth: { user: SessionUser; onSignOut: () => void } | null;
}) {
  const { data, loading, error, refresh } = useDashboard();
  const [selectedId, setSelectedId] = useState('m5');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [viewUserName, setViewUserName] = useState<string | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const role = auth?.user.role ?? 'member';
  const canManageUsers = role === 'admin' || role === 'manager';
  const viewingOther = viewUserId !== null && viewUserId !== auth?.user.id;
  const readOnly = viewingOther;

  // Lista de usuarios visibles para el selector (solo admin/manager).
  useEffect(() => {
    if (!canManageUsers) return;
    let cancelled = false;
    api
      .getViewableUsers()
      .then((u) => {
        if (!cancelled) setUsers(u);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canManageUsers]);

  const month = useMemo(
    () => data?.months.find((m) => m.id === selectedId) ?? data?.months[data.months.length - 1],
    [data, selectedId],
  );

  if (loading) return <main className="main"><p>Cargando gastos…</p></main>;
  if (error || !data || !month) {
    return (
      <main className="main">
        <div className="error">{error ?? 'No hay datos.'}</div>
        <button className="btn" type="button" onClick={() => void refresh()}>Reintentar</button>
      </main>
    );
  }

  const pct = spentPct(month);
  const overBudget = pct > 100;

  async function run(fn: () => Promise<unknown>) {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'La acción falló.');
    } finally {
      setBusy(false);
    }
  }

  /** Cambia de quién se ven los gastos y recarga el dashboard. */
  async function changeViewUser(userId: string | null, name: string | null) {
    setActionError(null);
    setBusy(true);
    try {
      api.setViewUser(userId);
      setViewUserId(userId);
      setViewUserName(name);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo cambiar de usuario.');
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!month) return;
    const rows = [['fecha', 'monto_aed', 'categoria']];
    for (const e of month.expenses) {
      rows.push([e.date, (e.amountCents / 100).toFixed(2).replace('.', ','), e.category]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-${month.tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="layout">
      <Sidebar source={DATA_SOURCE === 'supabase' ? 'Supabase' : 'Local (seed.json)'} />
      <main className="main">
        <div className="topbar">
          <div>
            <h1>Panel — {month.label}</h1>
            <p>
              {month.tab} · {month.refNo} · {month.expenses.length} de 16 gastos
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {auth ? (
              <>
                <span className="muted" style={{ fontSize: 13 }}>
                  {auth.user.displayName} · {auth.user.role}
                </span>
                <button className="btn secondary" type="button" onClick={() => void auth.onSignOut()}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>Demo · datos de ejemplo</span>
            )}
            <MonthSelector months={data.months} selectedId={month.id} onSelect={setSelectedId} />
          </div>
        </div>

        {canManageUsers && users.length > 1 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <label htmlFor="view-user" style={{ fontSize: 13, fontWeight: 600 }}>
              Ver los gastos de…
            </label>{' '}
            <select
              id="view-user"
              value={viewUserId ?? ''}
              disabled={busy}
              onChange={(e) => {
                const id = e.target.value || null;
                const name = users.find((u) => u.userId === id)?.name ?? null;
                void changeViewUser(id, name);
              }}
            >
              <option value="">Mis gastos</option>
              {users
                .filter((u) => !u.isYou)
                .map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {viewingOther && (
          <div className="error" style={{ background: '#101E33', borderColor: '#3B82F6', color: '#EAF0F8' }}>
            Viendo los gastos de {viewUserName ?? 'esta persona'} (solo lectura, no se puede añadir
            ni editar nada).{' '}
            <button className="btn secondary" type="button" onClick={() => void changeViewUser(null, null)}>
              Volver a mis gastos
            </button>
          </div>
        )}

        {actionError && <div className="error">{actionError}</div>}

        <section className="kpis">
          <div className="card">
            <h3>Saldo total</h3>
            <div className={`big${month.saldoCents < 0 ? ' negative' : ' positive'}`}>
              {formatAED(month.saldoCents)}
            </div>
            {month.saldoCents < 0 && <div className="alert">Hace falta una recarga.</div>}
          </div>
          <div className="card">
            <h3>Total gastos</h3>
            <div className="big">{formatAED(month.totalCents)}</div>
            <div className="sub">Presupuesto del mes: {formatAED(availableCents(month))}</div>
          </div>
          <div className="card">
            <h3>Recarga del mes</h3>
            <div className="big">{formatAED(month.recargasCents)}</div>
            <div className="sub">Saldo inicial: {formatAED(month.openingCents)}</div>
          </div>
          <div className="card">
            <h3>% gastado del disponible</h3>
            <div className={`big${overBudget ? ' negative' : ''}`}>{formatPct(pct)}</div>
            <div className="sub">{overBudget ? 'Superado: gastaste más de lo disponible.' : 'Dentro de lo disponible.'}</div>
          </div>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>Gastos por mes · línea rosa = recarga</h3>
            <ExpenseChart months={data.months} selectedId={month.id} onSelect={setSelectedId} />
          </div>
          <div className="card">
            <h3>% gastado del disponible</h3>
            <Donut
              segments={[
                { label: 'Gastado', value: Math.min(pct, 100), color: overBudget ? '#F87171' : '#3B82F6' },
                { label: 'Disponible', value: Math.max(0, 100 - pct), color: '#1E2F4A' },
              ]}
              centerTop={formatPct(pct)}
              centerBottom="del disponible"
            />
          </div>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>Desglose por categoría</h3>
            <Donut
              segments={month.breakdown.map((b) => ({
                label: b.category,
                value: b.amountCents,
                color: CATEGORY_COLORS[b.category],
              }))}
              centerTop={formatAED(month.totalCents)}
              centerBottom="total del mes"
            />
            <p className="note">
              Las categorías en 0,00 se muestran en gris, no se ocultan.
            </p>
          </div>
          <div className="card">
            <h3>Meta del mes</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>
              No gastar más de lo disponible ({formatAED(availableCents(month))}).
            </p>
            <p className={overBudget ? 'alert' : ''}>
              {overBudget
                ? `Superada en ${formatAED(month.totalCents - availableCents(month))}.`
                : `Te quedan ${formatAED(availableCents(month) - month.totalCents)}.`}
            </p>
            <p className="note">
              No hay una meta con cifra fijada en la app original; si quieres una,
              se añade como campo del mes en Fase 2, sin inventarla.
            </p>
          </div>
        </section>

        <section className="card">
          <h3>Gastos — {month.label}{viewingOther ? ` · ${viewUserName ?? ''}` : ''}</h3>
          {!readOnly && (
            <div className="actions">
              <button className="btn" type="button" onClick={() => { setEditing(null); setShowExpenseForm((v) => !v); }}>
                Añadir gasto
              </button>
              <button className="btn secondary" type="button" onClick={() => setShowTopupForm((v) => !v)}>
                Registrar recarga
              </button>
              <button className="btn secondary" type="button" disabled={busy} onClick={() => void run(() => api.createNextMonth())}>
                Crear mes nuevo
              </button>
              <button className="btn secondary" type="button" disabled={busy} onClick={() => void run(() => api.deleteLastMonth())}>
                Borrar último mes
              </button>
              <button className="btn secondary" type="button" onClick={exportCsv}>
                Descargar CSV del mes
              </button>
            </div>
          )}
          {readOnly && (
            <div className="actions">
              <button className="btn secondary" type="button" onClick={exportCsv}>
                Descargar CSV del mes
              </button>
            </div>
          )}
          {!readOnly && (showExpenseForm || editing) && (
            <ExpenseForm
              monthId={month.id}
              monthLabel={month.label}
              editing={editing}
              onDone={() => { setShowExpenseForm(false); setEditing(null); void refresh(); }}
              onCancel={() => { setShowExpenseForm(false); setEditing(null); }}
            />
          )}
          {!readOnly && showTopupForm && (
            <TopupForm monthId={month.id} monthLabel={month.label} onDone={() => { setShowTopupForm(false); void refresh(); }} />
          )}
          <ExpenseTable
            expenses={month.expenses}
            readOnly={readOnly}
            onEdit={(e) => { setEditing(e); setShowExpenseForm(true); }}
            onDelete={(id) => void run(() => api.deleteExpense(id))}
          />
          <p className="note">
            {month.expenses.length} de 16 filas · {month.tab} · Los cambios en modo local se guardan
            en este navegador; en modo Supabase, en la base de datos.
          </p>
        </section>
      </main>
      <ReportPanel
        month={month}
        data={data}
        canDrillDown={canManageUsers}
        onSelectUser={(userId, name) => void changeViewUser(userId, name)}
      />
    </div>
  );
}
