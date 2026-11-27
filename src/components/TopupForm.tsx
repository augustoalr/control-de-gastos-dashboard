import { useState } from 'react';
import { api, validateTopup } from '../lib/api';

export default function TopupForm({
  monthId,
  monthLabel,
  onDone,
}: {
  monthId: string;
  monthLabel: string;
  onDone: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Cash top-up');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = validateTopup({
        monthId,
        date,
        amountAed: Number(amount.replace(',', '.')),
        description,
      });
      await api.addTopup(input);
      setAmount('');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la recarga.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <strong style={{ width: '100%' }}>Registrar recarga — {monthLabel}</strong>
      <label>
        Fecha
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Monto (AED)
        <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
      </label>
      <label>
        Descripción
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Registrar recarga'}
      </button>
      {error && <span className="error" style={{ width: '100%' }}>{error}</span>}
    </form>
  );
}
