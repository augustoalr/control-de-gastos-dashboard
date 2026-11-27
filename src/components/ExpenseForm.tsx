import { useEffect, useState } from 'react';
import { CATEGORIES, type Expense } from '../types';
import { api, validateExpense } from '../lib/api';

export default function ExpenseForm({
  monthId,
  monthLabel,
  editing,
  onDone,
  onCancel,
}: {
  monthId: string;
  monthLabel: string;
  editing: Expense | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Pantry & Grocery');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setAmount(String(editing.amountCents / 100));
      setCategory(editing.category);
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount('');
      setCategory('Pantry & Grocery');
    }
  }, [editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = validateExpense({
        monthId,
        date,
        amountAed: Number(amount.replace(',', '.')),
        category,
      });
      if (editing) await api.updateExpense(editing.id, input);
      else await api.addExpense(input);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <strong style={{ width: '100%' }}>
        {editing ? 'Editar gasto' : `Añadir gasto — ${monthLabel}`}
      </strong>
      <label>
        Fecha
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Monto (AED)
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
        />
      </label>
      <label>
        Categoría
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir gasto'}
      </button>
      <button className="btn secondary" type="button" onClick={onCancel}>Cancelar</button>
      {error && <span className="error" style={{ width: '100%' }}>{error}</span>}
    </form>
  );
}
