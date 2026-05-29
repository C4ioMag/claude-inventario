import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileDown, Search, X, ChevronRight } from 'lucide-react';
import { exportHistoricoPDF } from '../utils/pdf';

function daysDiff(start, end) {
  const s = new Date(start + 'T12:00:00');
  const e = end ? new Date(end + 'T12:00:00') : new Date();
  return Math.max(0, Math.floor((e - s) / 86400000));
}

function fmt(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

function DetailModal({ outing, purchases, onClose }) {
  const days = daysDiff(outing.startDate, outing.endDate);

  // itens com falta
  const missingItems = outing.items.filter((i) => i.returned < i.taken);
  const allReturned = missingItems.length === 0 && outing.status === 'closed';

  const totalCompras = purchases.reduce((s, p) => {
    const val = parseFloat(String(p.total).replace(',', '.'));
    return s + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{outing.person}</h2>
            <p className="text-sm text-gray-500">
              Saída: {fmt(outing.startDate)}
              {outing.endDate ? ` — Retorno: ${fmt(outing.endDate)}` : ' — ainda em campo'}
              {' · '}{days} dia(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              outing.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {outing.status === 'active' ? 'Em campo' : 'Encerrado'}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Itens retirados */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Itens retirados</h3>
            <div className="bg-gray-50 rounded-xl divide-y">
              {outing.items.map((item) => {
                const missing = item.taken - item.returned;
                const hasMissing = missing > 0 && outing.status === 'closed';
                return (
                  <div key={item.equipmentId} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">Retirado: <b className="text-gray-800">{item.taken}</b></span>
                      {outing.status === 'closed' && (
                        <span className="text-gray-500">Devolvido: <b className="text-green-700">{item.returned}</b></span>
                      )}
                      {hasMissing && (
                        <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                          faltou {missing}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pendências */}
            {outing.status === 'closed' && !allReturned && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">⚠ Itens não devolvidos</p>
                <ul className="space-y-1">
                  {missingItems.map((i) => (
                    <li key={i.equipmentId} className="flex justify-between text-sm text-red-700">
                      <span>{i.name}</span>
                      <span className="font-semibold">{i.taken - i.returned} un. faltando</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outing.status === 'closed' && allReturned && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-green-700">✓ Todos os itens foram devolvidos</p>
              </div>
            )}
          </div>

          {/* Compras */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Compras vinculadas</h3>
              {totalCompras > 0 && (
                <span className="text-sm font-semibold text-green-700">
                  Total: R$ {totalCompras.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            {purchases.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhuma compra registrada.</p>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">{fmt(p.date)}</span>
                      {p.total && (
                        <span className="text-sm font-bold text-green-700">R$ {p.total}</span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {p.lines.map((l, i) => (
                        <li key={i} className="text-sm text-gray-700 flex justify-between">
                          <span>{l.item}</span>
                          <span className="text-gray-500">× {l.qty}</span>
                        </li>
                      ))}
                    </ul>
                    {p.obs && (
                      <p className="text-xs text-gray-400 mt-2 border-t pt-2">Obs: {p.obs}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Historico() {
  const { outings, getPurchasesForOuting } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);

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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome da pessoa..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="active">Em campo</option>
          <option value="closed">Encerrado</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nenhum registro encontrado.</p>
      )}

      {/* Lista compacta */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y overflow-hidden">
        {filtered.map((outing) => {
          const purchases = getPurchasesForOuting(outing.id);
          const days = daysDiff(outing.startDate, outing.endDate);
          const totalItens = outing.items.reduce((s, i) => s + i.taken, 0);
          const hasMissing = outing.status === 'closed' && outing.items.some((i) => i.returned < i.taken);

          return (
            <button
              key={outing.id}
              onClick={() => setSelected({ outing, purchases })}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-gray-800">{outing.person}</p>
                  <p className="text-sm text-gray-500">
                    {fmt(outing.startDate)}
                    {outing.endDate ? ` → ${fmt(outing.endDate)}` : ' — em campo'}
                    {' · '}{days} dia(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">{totalItens} itens · {purchases.length} compra(s)</p>
                  {hasMissing && (
                    <p className="text-xs text-red-600 font-medium">⚠ itens faltando</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  outing.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {outing.status === 'active' ? 'Em campo' : 'Encerrado'}
                </span>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <DetailModal
          outing={selected.outing}
          purchases={selected.purchases}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
