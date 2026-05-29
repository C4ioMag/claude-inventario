import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileDown, Search } from 'lucide-react';
import { exportHistoricoPDF } from '../utils/pdf';

function daysDiff(start, end) {
  const s = new Date(start + 'T12:00:00');
  const e = end ? new Date(end + 'T12:00:00') : new Date();
  return Math.max(0, Math.floor((e - s) / 86400000));
}

export default function Historico() {
  const { outings, getPurchasesForOuting } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = outings.filter((o) => {
    const matchName = o.person.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchFrom = !dateFrom || o.startDate >= dateFrom;
    const matchTo = !dateTo || o.startDate <= dateTo;
    return matchName && matchStatus && matchFrom && matchTo;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Histórico</h1>
        <button
          onClick={() => exportHistoricoPDF(filtered, getPurchasesForOuting, { search, statusFilter, dateFrom, dateTo })}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          <FileDown size={16} /> Exportar PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome da pessoa..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="active">Em campo</option>
          <option value="closed">Encerrado</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nenhum registro encontrado.</p>
      )}

      <div className="space-y-4">
        {filtered.map((outing) => {
          const purchases = getPurchasesForOuting(outing.id);
          const days = daysDiff(outing.startDate, outing.endDate);
          return (
            <div key={outing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <div>
                  <h2 className="font-semibold text-gray-800">{outing.person}</h2>
                  <p className="text-sm text-gray-500">
                    Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {outing.endDate && ` — Retorno: ${new Date(outing.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                    {' · '}{days} dia(s)
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  outing.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {outing.status === 'active' ? 'Em campo' : 'Encerrado'}
                </span>
              </div>

              <div className="p-5 grid md:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens retirados</h3>
                  <ul className="space-y-1">
                    {outing.items.map((item) => (
                      <li key={item.equipmentId} className="flex justify-between text-sm text-gray-600 py-0.5">
                        <span>{item.name}</span>
                        <span className="text-gray-800 font-medium">{item.taken} un.</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Compras vinculadas</h3>
                  {purchases.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma compra registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map((p) => (
                        <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            {p.total && <span className="text-xs font-semibold text-green-700">R$ {p.total}</span>}
                          </div>
                          <ul className="space-y-0.5">
                            {p.lines.map((l, i) => (
                              <li key={i} className="text-xs text-gray-700">{l.item} × {l.qty}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
