// Formato de dinero: AED, coma decimal, como en el Excel de Augusto.
// Ej.: 29135 céntimos -> "291,35 AED" ; 59730 -> "597,30 AED".
export function formatAED(cents: number): string {
  const value = cents / 100;
  return (
    value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' AED'
  );
}

export function formatAEDShort(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPct(pct: number): string {
  return pct.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
}

/** "2026-11-04" -> "04/11/2026" */
export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function toCents(amountAed: number): number {
  return Math.round(amountAed * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
