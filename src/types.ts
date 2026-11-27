// Tipos de dominio. Una sola fuente de verdad: los montos siempre son
// céntimos enteros (int) para no arrastrar errores de coma flotante.
// La app original y Supabase usan la misma convención.
//
// CORRECCIÓN VERIFICADA (diseñador, getState 2026-11-24): son 5 categorías,
// no 6. "Fuel, Parking & Salik" es UNA sola categoría.
export const CATEGORIES = [
  'Pantry & Grocery',
  'Fuel, Parking & Salik',
  'Food Expenses',
  'Printing & Stationery',
  'Other Expenses',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  monthId: string;
  date: string; // ISO yyyy-mm-dd
  amountCents: number; // > 0
  category: Category;
}

export interface Topup {
  id: string;
  monthId: string;
  date: string;
  amountCents: number; // > 0
  description: string;
}

export interface CategoryBreakdown {
  category: Category;
  amountCents: number;
}

export interface Month {
  id: string;
  /** Dueño del mes. Solo existe en Supabase (en local no se usa). */
  userId?: string;
  seq: number;
  tab: string; // EXP1, EXP2, ...
  label: string; // "Noviembre 2026"
  shortLabel: string; // "NOV"
  fromDate: string;
  toDate: string;
  refNo: string; // "2026-11/005"
  openingCents: number;
  recargasCents: number;
  totalCents: number;
  saldoCents: number;
  breakdown: CategoryBreakdown[];
  expenses: Expense[];
  topups: Topup[];
}

export interface TopSpender {
  userId: string;
  name: string;
  totalCents: number;
  expenseCount: number;
  isYou: boolean;
}

export type TopView = 'month' | 'total';

/** Roles de profiles.role (migración 02). Los hace cumplir RLS en la BD. */
export type Role = 'admin' | 'manager' | 'member' | 'viewer';

/** Persona visible en el selector "ver los gastos de…" y en el Top. */
export interface UserSummary {
  userId: string;
  name: string;
  isYou: boolean;
}

export interface ReportRow {
  date: string;
  description: string;
  receiptsCents: number | null;
  billsCents: number | null;
  runningCents: number;
}

export interface DashboardData {
  months: Month[];
  report: {
    rows: ReportRow[];
    totalReceiptsCents: number;
    totalBillsCents: number;
    balanceCents: number;
  };
}

/** Derivados que la UI calcula igual en local y en Supabase. */
export function availableCents(m: Month): number {
  return m.openingCents + m.recargasCents;
}

export function spentPct(m: Month): number {
  const avail = availableCents(m);
  if (avail <= 0) return m.totalCents > 0 ? 100 : 0;
  return (m.totalCents / avail) * 100;
}
