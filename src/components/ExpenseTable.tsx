import { formatAED, formatDateEs } from '../lib/money';
import type { Expense } from '../types';

export default function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}) {
  if (expenses.length === 0) return <p className="muted">Sin gastos este mes.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Categoría</th>
          <th className="num">Monto</th>
          <th><span className="muted">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e) => (
          <tr key={e.id}>
            <td>{formatDateEs(e.date)}</td>
            <td>{e.category}</td>
            <td className="num">{formatAED(e.amountCents)}</td>
            <td className="row-actions">
              <button type="button" className="btn secondary" onClick={() => onEdit(e)}>Editar</button>
              <button type="button" className="btn danger" onClick={() => onDelete(e.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
