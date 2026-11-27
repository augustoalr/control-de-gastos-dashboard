import seedJson from '../../public/data/seed.json';
import { supabase, isSupabaseConfigured } from './supabase';
import { CATEGORIES, type DashboardData, type Expense, type Month, type TopSpender, type Topup } from '../types';

// ─── Contrato de datos ──────────────────────────────────────────────────────
// La UI solo habla con este contrato. Hoy hay dos implementaciones:
//   LocalProvider    -> seed.json + localStorage (GitHub Pages, sin backend)
//   SupabaseProvider -> Postgres + RLS (producción)
// Cambiar de una a otra es cambiar VITE_DATA_SOURCE. La UI no cambia.
// Esto es lo que hace escalable el MVP: el día que haya API propia,
// se añade un tercer proveedor con este mismo contrato, sin tocar la UI.
export interface DataProvider {
  getDashboard(): Promise<DashboardData>;
  addExpense(input: NewExpense): Promise<Expense>;
  updateExpense(id: string, input: NewExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  addTopup(input: NewTopup): Promise<Topup>;
  createNextMonth(): Promise<Month>;
  deleteLastMonth(): Promise<void>;
  /** Top acumulado. monthId null = total de todos los meses. */
  getTopSpenders(monthId: string | null, limit?: number): Promise<TopSpender[]>;
}

export interface NewExpense {
  monthId: string;
  date: string;
  amountCents: number;
  category: Expense['category'];
}

export interface NewTopup {
  monthId: string;
  date: string;
  amountCents: number;
  description: string;
}

const STORAGE_KEY = 'control-de-gastos:v1';

// ─── Proveedor local (demo / GitHub Pages) ────────────────────────────────
function loadLocal(): DashboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DashboardData;
  } catch {
    // localStorage no disponible o corrupto: se usa la semilla.
  }
  return structuredClone(seedJson) as DashboardData;
}

function saveLocal(data: DashboardData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sin almacenamiento: los cambios viven solo en memoria en esta sesión.
  }
}

/** Recalcula totales, desglose, recargas y saldo de un mes desde sus filas. */
function recompute(month: Month): Month {
  const totalCents = month.expenses.reduce((s, e) => s + e.amountCents, 0);
  const recargasCents = month.topups.reduce((s, t) => s + t.amountCents, 0);
  const breakdown = month.breakdown.map((b) => ({
    ...b,
    amountCents: month.expenses
      .filter((e) => e.category === b.category)
      .reduce((s, e) => s + e.amountCents, 0),
  }));
  return {
    ...month,
    totalCents,
    recargasCents,
    saldoCents: month.openingCents + recargasCents - totalCents,
    breakdown,
  };
}

/** Recalcula el Report acumulado (saldo corriente) desde los meses. */
function recomputeReport(months: Month[]): DashboardData['report'] {
  const rows: DashboardData['report']['rows'] = [];
  let running = 0;
  let totalReceipts = 0;
  let totalBills = 0;
  for (const m of months) {
    for (const t of m.topups) {
      running += t.amountCents;
      totalReceipts += t.amountCents;
      rows.push({
        date: t.date,
        description: t.description,
        receiptsCents: t.amountCents,
        billsCents: null,
        runningCents: running,
      });
    }
    if (m.totalCents > 0) {
      running -= m.totalCents;
      totalBills += m.totalCents;
      rows.push({
        date: m.toDate,
        description: `Total gastos ${m.label.toLowerCase()}`,
        receiptsCents: null,
        billsCents: m.totalCents,
        runningCents: running,
      });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  // El running se recalcula en orden cronológico para que el orden sea fiel.
  let r = 0;
  for (const row of rows) {
    r += (row.receiptsCents ?? 0) - (row.billsCents ?? 0);
    row.runningCents = r;
  }
  return { rows, totalReceiptsCents: totalReceipts, totalBillsCents: totalBills, balanceCents: r };
}

function withRecomputed(data: DashboardData): DashboardData {
  const months = data.months.map(recompute);
  return { months, report: recomputeReport(months) };
}

export class LocalProvider implements DataProvider {
  async getDashboard(): Promise<DashboardData> {
    await new Promise((r) => setTimeout(r, 120)); // simula red, sin mentir
    return withRecomputed(loadLocal());
  }

  async addExpense(input: NewExpense): Promise<Expense> {
    const data = loadLocal();
    const month = data.months.find((m) => m.id === input.monthId);
    if (!month) throw new Error('Mes no encontrado');
    if (month.expenses.length >= 16) {
      throw new Error('Este mes ya tiene 16 gastos, el máximo de la hoja EXP.');
    }
    const expense: Expense = { id: crypto.randomUUID(), ...input };
    month.expenses.push(expense);
    saveLocal(withRecomputed(data));
    return expense;
  }

  async updateExpense(id: string, input: NewExpense): Promise<Expense> {
    const data = loadLocal();
    for (const m of data.months) {
      const i = m.expenses.findIndex((e) => e.id === id);
      if (i >= 0) {
        const updated: Expense = { id, ...input };
        m.expenses[i] = updated;
        saveLocal(withRecomputed(data));
        return updated;
      }
    }
    throw new Error('Gasto no encontrado');
  }

  async deleteExpense(id: string): Promise<void> {
    const data = loadLocal();
    for (const m of data.months) {
      m.expenses = m.expenses.filter((e) => e.id !== id);
    }
    saveLocal(withRecomputed(data));
  }

  async addTopup(input: NewTopup): Promise<Topup> {
    const data = loadLocal();
    const month = data.months.find((m) => m.id === input.monthId);
    if (!month) throw new Error('Mes no encontrado');
    const topup: Topup = { id: crypto.randomUUID(), ...input };
    month.topups.push(topup);
    saveLocal(withRecomputed(data));
    return topup;
  }

  async getTopSpenders(monthId: string | null, limit = 10): Promise<TopSpender[]> {
    const data = loadLocal();
    // En local solo existe un usuario real (Augusto, seed.json).
    // El ranking se calcula igual que en Supabase; con usuarios reales
    // en Supabase saldrán tantas filas como subordinados visibles.
    const months = monthId ? data.months.filter((m) => m.id === monthId) : data.months;
    const total = months.reduce((s, m) => s + m.totalCents, 0);
    const count = months.reduce((s, m) => s + m.expenses.length, 0);
    if (total === 0) return [];
    return [
      { userId: 'u-augusto', name: 'Augusto', totalCents: total, expenseCount: count, isYou: true },
    ].slice(0, limit);
  }

  async createNextMonth(): Promise<Month> {
    const data = loadLocal();
    const last = data.months[data.months.length - 1];
    if (!last) throw new Error('No hay meses');
    const nextSeq = last.seq + 1;
    const parts = last.toDate.split('-').map(Number);
    const y = parts[0] ?? 2026;
    const mo = parts[1] ?? 1;
    const nextDate = new Date(y, mo, 1); // mo es 1-12; Date lo toma 0-11, así que es el mes siguiente
    const year = nextDate.getFullYear();
    const monthNum = nextDate.getMonth() + 1;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const label = nextDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const month: Month = {
      id: crypto.randomUUID(),
      seq: nextSeq,
      tab: `EXP${nextSeq}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      shortLabel: nextDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase(),
      fromDate: `${year}-${pad(monthNum)}-01`,
      toDate: `${year}-${pad(monthNum)}-${pad(lastDay)}`,
      refNo: `${year}-${pad(monthNum)}/${String(nextSeq).padStart(3, '0')}`,
      openingCents: last.saldoCents,
      recargasCents: 0,
      totalCents: 0,
      saldoCents: last.saldoCents,
      breakdown: last.breakdown.map((b) => ({ ...b, amountCents: 0 })),
      expenses: [],
      topups: [],
    };
    data.months.push(month);
    saveLocal(withRecomputed(data));
    return month;
  }

  async deleteLastMonth(): Promise<void> {
    const data = loadLocal();
    if (data.months.length <= 1) throw new Error('No se puede borrar el único mes.');
    data.months.pop();
    saveLocal(withRecomputed(data));
  }
}

// ─── Proveedor Supabase (producción) ───────────────────────────────────────
// Lee directamente de las tablas months / expenses / topups y escribe en
// expenses / topups / months. La vista month_summary de la migración es
// la referencia de verdad en la BD, pero este código no la lee: los
// totales se recalculan en cliente con withRecomputed, igual que en local.
// Las reglas (máx. 16 gastos, saldo = apertura + recargas - gastos) viven
// en la base de datos (triggers + vistas), no en el cliente.
export class SupabaseProvider implements DataProvider {
  private client() {
    if (!supabase) throw new Error('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
    return supabase;
  }

  async getDashboard(): Promise<DashboardData> {
    const db = this.client();
    // Tres lecturas RLS directas a las tablas (el usuario solo ve lo suyo
    // o lo de sus subordinados) y ensamblaje en cliente. Los totales se
    // recalculan en cliente igual que en local; no se lee month_summary.
    const [{ data: mRows, error: mErr }, { data: eRows, error: eErr }, { data: tRows, error: tErr }] =
      await Promise.all([
        db.from('months').select('*').order('seq', { ascending: true }),
        db.from('expenses').select('*').order('date', { ascending: true }),
        db.from('topups').select('*').order('date', { ascending: true }),
      ]);
    if (mErr) throw mErr;
    if (eErr) throw eErr;
    if (tErr) throw tErr;
    const months: Month[] = ((mRows ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      seq: r.seq as number,
      tab: r.tab as string,
      label: r.label as string,
      shortLabel: r.short_label as string,
      fromDate: r.from_date as string,
      toDate: r.to_date as string,
      refNo: r.ref_no as string,
      openingCents: r.opening_cents as number,
      recargasCents: 0,
      totalCents: 0,
      saldoCents: r.opening_cents as number,
      breakdown: CATEGORIES.map((c) => ({ category: c, amountCents: 0 })),
      expenses: ((eRows ?? []) as Record<string, unknown>[])
        .filter((e) => e.month_id === r.id)
        .map(mapExpense),
      topups: ((tRows ?? []) as Record<string, unknown>[])
        .filter((t) => t.month_id === r.id)
        .map((t) => ({
          id: t.id as string,
          monthId: t.month_id as string,
          date: t.date as string,
          amountCents: t.amount_cents as number,
          description: t.description as string,
        })),
    }));
    return withRecomputed({ months, report: recomputeReport(months) });
  }

  async addExpense(input: NewExpense): Promise<Expense> {
    const db = this.client();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error('No hay sesión iniciada.');
    const { data, error } = await db
      .from('expenses')
      .insert({
        user_id: user.id,
        month_id: input.monthId,
        date: input.date,
        amount_cents: input.amountCents,
        category: input.category,
      })
      .select()
      .single();
    if (error) throw error;
    return mapExpense(data);
  }

  async updateExpense(id: string, input: NewExpense): Promise<Expense> {
    const db = this.client();
    const { data, error } = await db
      .from('expenses')
      .update({
        month_id: input.monthId,
        date: input.date,
        amount_cents: input.amountCents,
        category: input.category,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapExpense(data);
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.client().from('expenses').delete().eq('id', id);
    if (error) throw error;
  }

  async addTopup(input: NewTopup): Promise<Topup> {
    const db = this.client();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error('No hay sesión iniciada.');
    const { data, error } = await db
      .from('topups')
      .insert({
        user_id: user.id,
        month_id: input.monthId,
        date: input.date,
        amount_cents: input.amountCents,
        description: input.description,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id as string,
      monthId: data.month_id as string,
      date: data.date as string,
      amountCents: data.amount_cents as number,
      description: data.description as string,
    };
  }

  async getTopSpenders(monthId: string | null, limit = 10): Promise<TopSpender[]> {
    const db = this.client();
    const { data, error } = await db.rpc('get_top_spenders', {
      p_month_id: monthId,
      p_limit: limit,
    });
    if (error) throw error;
    const { data: user } = await db.auth.getUser();
    const me = user?.user?.id;
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      userId: r.user_id as string,
      name: r.name as string,
      totalCents: r.total_cents as number,
      expenseCount: r.expense_count as number,
      isYou: me ? (r.user_id as string) === me : false,
    }));
  }

  async createNextMonth(): Promise<Month> {
    const { data, error } = await this.client().rpc('create_next_month');
    if (error) throw error;
    // La RPC devuelve una fila de public.months en snake_case; se mapea
    // a Month en camelCase igual que mapExpense/mapTopup. El mes nuevo
    // no tiene gastos ni recargas todavía.
    const row = data as Record<string, unknown>;
    const openingCents = row.opening_cents as number;
    return {
      id: row.id as string,
      seq: row.seq as number,
      tab: row.tab as string,
      label: row.label as string,
      shortLabel: row.short_label as string,
      fromDate: row.from_date as string,
      toDate: row.to_date as string,
      refNo: row.ref_no as string,
      openingCents,
      recargasCents: 0,
      totalCents: 0,
      saldoCents: openingCents,
      breakdown: CATEGORIES.map((c) => ({ category: c, amountCents: 0 })),
      expenses: [],
      topups: [],
    };
  }

  async deleteLastMonth(): Promise<void> {
    const { error } = await this.client().rpc('delete_last_month');
    if (error) throw error;
  }
}

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    monthId: row.month_id as string,
    date: row.date as string,
    amountCents: row.amount_cents as number,
    category: row.category as Expense['category'],
  };
}

// ─── Fábrica ───────────────────────────────────────────────────────────────
export function getProvider(): DataProvider {
  const source = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'local';
  if (source === 'supabase' && isSupabaseConfigured) return new SupabaseProvider();
  return new LocalProvider();
}

export const provider = getProvider();
