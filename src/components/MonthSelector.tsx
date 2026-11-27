import type { Month } from '../types';

export default function MonthSelector({
  months,
  selectedId,
  onSelect,
}: {
  months: Month[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="month-selector" role="tablist" aria-label="Meses">
      {months.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={m.id === selectedId}
          className={`month-btn${m.id === selectedId ? ' active' : ''}`}
          onClick={() => onSelect(m.id)}
        >
          {m.shortLabel}
        </button>
      ))}
      <button type="button" className="month-btn" disabled title="Se crea como EXP6 cuando empiece diciembre">
        DIC
      </button>
    </div>
  );
}
