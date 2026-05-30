import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileDown, Search, X, ChevronRight, Clock } from 'lucide-react';
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
  const totalCompras = purchases.reduce((s, p) => {
    const val = parseFloat(String(p.total).replace(',', '.'));
    return s + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-apple-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-apple-text font-semibold">{outing.person}</h2>
            <p className="text-xs text-apple-text-2 mt-0.5">
              Saída: {fmt(outing.startDate)}
              {outing.endDate ? ` — Retorno: ${fmt(outing.endDate)}` : ' — ainda em campo'}
              {' · '}{days} dia(s)
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              outing.status === 'active'
                ? 'bg-apple-orange/10 text-apple-orange'
                : outing.pendingItems?.length > 0
                ? 'bg-apple-red/10 text-apple-red'
                : 'bg-apple-green/10 text-apple-green'
            }`}>
              {outing.status === 'active' ? 'Em campo' : outing.pendingItems?.length > 0 ? 'c/ pendência' : 'Encerrado'}
            </span>
            <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-3">Itens retirados</p>
            <div className="bg-apple-bg rounded-apple divide-y divide-apple-border">
              {outing.items.map((item) => {
                const missing = item.taken - item.returned;
                const hasMissing = missing > 0 && outing.status === 'closed';
                return (
                  <div key={item.equipmentId} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-apple-text">{item.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-apple-text-2">Ret: <b className="text-apple-text">{item.taken}</b></span>
                      {outing.status === 'closed' && (
                        <span className="text-apple-text-2">Dev: <b className="text-apple-green">{item.returned}</b></span>
                      )}
                      {hasMissing && (
                        <span className="bg-apple-red/10 text-apple-red font-semibold px-2 py-0.5 rounded-full">
                          faltou {missing}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {outing.status === 'closed' && outing.pendingItems?.length > 0 && (
              <div className="mt-3 bg-apple-red/6 border border-apple-red/20 rounded-apple p-4">
                <p className="text-sm font-semibold text-apple-red mb-2">⚠ Itens não devolvidos — pendência registrada</p>
                <ul className="space-y-1.5">
                  {outing.pendingItems.map((i) => (
                    <li key={i.equipmentId} className="flex justify-between text-sm bg-apple-red/8 rounded-apple px-3 py-1.5">
                      <span className="text-apple-text font-medium">{i.name}</span>
                      <span className="text-apple-red font-semibold">{i.missing} un. não devolvida(s)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outing.status === 'closed' && !outing.pendingItems?.length && (
              <div className="mt-3 bg-apple-green/8 border border-apple-green/20 rounded-apple px-4 py-3">
                <p className="text-sm font-semibold text-apple-green">✓ Todos os itens foram devolvidos</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">Compras vinculadas</p>
              {totalCompras > 0 && (
                <span className="text-sm font-semibold text-apple-green">
                  Total: R$ {totalCompras.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            {purchases.length === 0 ? (
              <p className="text-xs text-apple-text-3">Nenhuma compra registrada.</p>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="bg-apple-bg rounded-apple p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-apple-text-2">{fmt(p.date)}</span>
                      {p.total && <span className="text-sm font-semibold text-apple-green">R$ {p.total}</span>}
                    </div>
                    <ul className="space-y-1">
                      {p.lines.map((l, i) => (
                        <li key={i} className="text-sm text-apple-text flex justify-between">
                          <span>{l.item}</span>
                          <span className="text-apple-text-2">× {l.qty}</span>
                        </li>
                      ))}
                    </ul>
                    {p.obs && <p className="text-xs text-apple-text-3 mt-2 border-t border-apple-border pt-2">Obs: {p.obs}</p>}
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
  }).sort((a, b) => {
    // Finalizados: ordena por data de fim (mais recente primeiro)
    // Em campo: aparecem por último, ordenados por data de saída
    const aKey = a.endDate || '0000-00-00';
    const bKey = b.endDate || '0000-00-00';
    return bKey.localeCompare(aKey) || b.startDate.localeCompare(a.startDate);
  });

  const inputClass = "bg-apple-bg border border-apple-border rounded-apple px-3 py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="text-apple-text-2 text-sm mt-0.5">{outings.length} registro(s)</p>
        </div>
        <button
          onClick={() => exportHistoricoPDF(filtered, getPurchasesForOuting, { search, statusFilter, dateFrom, dateTo })}
          className="flex items-center gap-2 bg-apple-bg border border-apple-border text-apple-text px-3 py-2 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
          <FileDown size={15} /> Exportar PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-text-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome da pessoa..."
            className={`${inputClass} pl-9`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="">Todos os status</option>
          <option value="active">Em campo</option>
          <option value="closed">Encerrado</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-16 text-center">
          <Clock size={32} className="text-apple-text-3 mx-auto mb-3" />
          <p className="text-apple-text font-medium">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="bg-apple-card rounded-apple shadow-apple-sm overflow-hidden">
          <div className="divide-y divide-apple-border">
            {filtered.map((outing) => {
              const purchases = getPurchasesForOuting(outing.id);
              const days = daysDiff(outing.startDate, outing.endDate);
              const totalItens = outing.items.reduce((s, i) => s + i.taken, 0);
              const hasMissing = outing.status === 'closed' && outing.items.some((i) => i.returned < i.taken);

              return (
                <button key={outing.id} onClick={() => setSelected({ outing, purchases })}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-apple-bg/60 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-apple-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-apple-blue text-xs font-semibold">{outing.person[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-apple-text text-sm">{outing.person}</p>
                      <p className="text-xs text-apple-text-2">
                        {fmt(outing.startDate)}
                        {outing.endDate ? ` → ${fmt(outing.endDate)}` : ' — em campo'}
                        {' · '}{days} dia(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-apple-text-2">{totalItens} itens · {purchases.length} compra(s)</p>
                      {hasMissing && <p className="text-xs text-apple-red font-medium">⚠ itens faltando</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      outing.status === 'active'
                        ? 'bg-apple-orange/10 text-apple-orange'
                        : outing.pendingItems?.length > 0
                        ? 'bg-apple-red/10 text-apple-red'
                        : 'bg-apple-green/10 text-apple-green'
                    }`}>
                      {outing.status === 'active' ? 'Em campo' : outing.pendingItems?.length > 0 ? 'c/ pendência' : 'Encerrado'}
                    </span>
                    <ChevronRight size={15} className="text-apple-text-3 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <DetailModal outing={selected.outing} purchases={selected.purchases} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
