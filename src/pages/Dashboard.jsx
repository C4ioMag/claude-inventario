import { useApp } from '../context/AppContext';

function StatCard({ label, value, color, sub }) {
  return (
    <div className="bg-apple-card rounded-apple shadow-apple-sm p-5">
      <p className={`text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
      <p className="text-apple-text text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-apple-text-2 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { equipment } = useApp();

  const totalItems    = equipment.length;
  const totalStock    = equipment.reduce((s, e) => s + e.quantity, 0);
  const totalInUse    = equipment.reduce((s, e) => s + e.inUse, 0);
  const totalAvail    = equipment.reduce((s, e) => s + (e.quantity - e.inUse), 0);
  const outOfStock    = equipment.filter((e) => e.quantity - e.inUse === 0).length;
  const lowStock      = equipment.filter((e) => e.quantity - e.inUse <= 1);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Visão Geral</h1>
        <p className="text-apple-text-2 text-sm mt-0.5">Resumo do inventário em tempo real</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Itens Cadastrados" value={totalItems}  color="text-apple-text" />
        <StatCard label="Total em Estoque"  value={totalStock}  color="text-apple-text" />
        <StatCard label="Em Uso"            value={totalInUse}  color="text-apple-orange" />
        <StatCard label="Disponível"        value={totalAvail}  color="text-apple-green" />
        <StatCard label="Sem Estoque"       value={outOfStock}  color="text-apple-red" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Low stock */}
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-5">
          <h2 className="text-apple-text font-semibold text-base mb-4">Estoque Baixo</h2>
          {lowStock.length === 0 ? (
            <div className="flex items-center gap-2 text-apple-green">
              <span className="text-xl">✓</span>
              <p className="text-sm">Todos os itens com estoque adequado.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((e) => {
                const avail = e.quantity - e.inUse;
                return (
                  <li key={e.id} className="flex items-center justify-between">
                    <span className="text-apple-text text-sm truncate max-w-[60%]">{e.name}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      avail === 0 ? 'bg-red-100 text-apple-red' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {avail === 0 ? 'Sem estoque' : `${avail} disponível`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Usage bars */}
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-5">
          <h2 className="text-apple-text font-semibold text-base mb-4">Uso por Item</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {equipment.filter(e => e.quantity > 0).map((e) => {
              const pct = Math.round((e.inUse / e.quantity) * 100);
              return (
                <div key={e.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-apple-text truncate max-w-[65%]">{e.name}</span>
                    <span className="text-apple-text-2">{e.inUse}/{e.quantity}</span>
                  </div>
                  <div className="h-1.5 bg-apple-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      pct >= 90 ? 'bg-apple-red' : pct >= 60 ? 'bg-apple-orange' : 'bg-apple-green'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
