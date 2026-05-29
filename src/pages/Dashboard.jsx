import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { equipment } = useApp();

  const totalItems = equipment.length;
  const totalStock = equipment.reduce((s, e) => s + e.quantity, 0);
  const totalInUse = equipment.reduce((s, e) => s + e.inUse, 0);
  const totalAvailable = equipment.reduce((s, e) => s + (e.quantity - e.inUse), 0);
  const outOfStock = equipment.filter((e) => e.quantity - e.inUse === 0).length;
  const lowStock = equipment.filter((e) => e.quantity - e.inUse <= 1);

  const cards = [
    { label: 'Itens Cadastrados', value: totalItems, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Total em Estoque', value: totalStock, color: 'bg-gray-50 border-gray-200 text-gray-700' },
    { label: 'Em Uso', value: totalInUse, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { label: 'Disponível', value: totalAvailable, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Sem Estoque', value: outOfStock, color: 'bg-red-50 border-red-200 text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Itens com Baixo Estoque</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum item com estoque baixo.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{e.name}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                    e.quantity - e.inUse === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {e.quantity - e.inUse === 0 ? 'Sem estoque' : `${e.quantity - e.inUse} disponível`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Usage bars */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Uso por Item</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {equipment.filter((e) => e.quantity > 0).map((e) => {
              const pct = e.quantity > 0 ? Math.round((e.inUse / e.quantity) * 100) : 0;
              return (
                <div key={e.id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate max-w-[60%]">{e.name}</span>
                    <span>{e.inUse}/{e.quantity}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
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
