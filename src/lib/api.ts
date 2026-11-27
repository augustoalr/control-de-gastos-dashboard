// Capa API: validación + llamadas al proveedor. La UI nunca llama
// directamente a Supabase ni a localStorage; pasa siempre por aquí.
// Así, si mañana hay una API REST propia, solo cambia esta capa.
import { CATEGORIES } from '../types';
import { provider, type NewExpense, type NewTopup } from './dataProvider';
import type { Category } from '../types';

export function validateExpense(input: {
  monthId: string;
  date: string;
  amountAed: number;
  category: string;
}): NewExpense {
  if (!input.monthId) throw new Error('Falta el mes.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Fecha inválida (yyyy-mm-dd).');
  if (!Number.isFinite(input.amountAed) || input.amountAed <= 0) {
    throw new Error('El monto tiene que ser mayor que 0.');
  }
  if (input.amountAed > 100000) throw new Error('Monto demasiado grande para un gasto.');
  if (!(CATEGORIES as readonly string[]).includes(input.category)) {
    throw new Error('Categoría no válida.');
  }
  return {
    monthId: input.monthId,
    date: input.date,
    amountCents: Math.round(input.amountAed * 100),
    category: input.category as Category,
  };
}

export function validateTopup(input: {
  monthId: string;
  date: string;
  amountAed: number;
  description: string;
}): NewTopup {
  if (!input.monthId) throw new Error('Falta el mes.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Fecha inválida (yyyy-mm-dd).');
  if (!Number.isFinite(input.amountAed) || input.amountAed <= 0) {
    throw new Error('La recarga tiene que ser mayor que 0.');
  }
  return {
    monthId: input.monthId,
    date: input.date,
    amountCents: Math.round(input.amountAed * 100),
    description: input.description.trim() || 'Cash top-up',
  };
}

export const api = {
  getDashboard: () => provider.getDashboard(),
  addExpense: (input: NewExpense) => provider.addExpense(input),
  updateExpense: (id: string, input: NewExpense) => provider.updateExpense(id, input),
  deleteExpense: (id: string) => provider.deleteExpense(id),
  addTopup: (input: NewTopup) => provider.addTopup(input),
  createNextMonth: () => provider.createNextMonth(),
  deleteLastMonth: () => provider.deleteLastMonth(),
  getTopSpenders: (monthId: string | null, limit = 10) => provider.getTopSpenders(monthId, limit),
  setViewUser: (userId: string | null) => provider.setViewUserId(userId),
  getViewableUsers: () => provider.getViewableUsers(),
  getCurrentUserId: () => provider.getCurrentUserId(),
};
