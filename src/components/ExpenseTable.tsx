import { formatAED, formatDateEs } from '../lib/money';
import type { Expense } from '../types';

export default function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  /** Solo lectura: viendo los gastos de otra persona, sin editar ni borrar. */
  readOnly?: boolean;
}) {
  if (expenses.length === 0) return <p className="muted">Sin gastos este mes.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Categoría</th>
          <th className="num">Monto</th>
          {!readOnly && <th><span className="muted">Acciones</span></th>}
        </tr>
      </thead>
      <tbody>
        {expenses.map((e) => (
          <tr key={e.id}>
            <td>{formatDateEs(e.date)}</td>
            <td>{e.category}</td>
            <td className="num">{formatAED(e.amountCents)}</td>
            {!readOnly && (
              <td className="row-actions">
                <button type="button" className="btn secondary" onClick={() => onEdit(e)}>Editar</button>
                <button type="button" className="btn danger" onClick={() => onDelete(e.id)}>Eliminar</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
