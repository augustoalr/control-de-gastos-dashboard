const NAV = ['Panel', 'Meses', 'Gastos', 'Recargas', 'Metas', 'Report'];

export default function Sidebar({ source }: { source: string }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        Control de Gastos
        <small>Personal Finance · AED</small>
      </div>
      {NAV.map((item, i) => (
        <button key={item} type="button" className={`nav-item${i === 0 ? ' active' : ''}`}>
          {item}
        </button>
      ))}
      <div className="sidebar-foot">
        Fuente de datos: {source}
        <br />
        Dinero en céntimos enteros.
        <br />
        Máx. 16 gastos por mes.
      </div>
    </aside>
  );
}
