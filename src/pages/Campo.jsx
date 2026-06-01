import { useApp } from '../context/AppContext';
import { MapPin, Calendar, DollarSign, Package, Flame } from 'lucide-react';

function daysDiff(d) {
  return Math.max(0, Math.floor((new Date() - new Date(d + 'T12:00:00')) / 86400000));
}

function fmtDate(d) {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
}

function fmtUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
}

export default function Campo() {
  const { activeOutings, purchases } = useApp();

  if (activeOutings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Em Campo</h1>
          <p className="text-[#6E6E73] text-[14px] mt-1">Supervisores com itens retirados</p>
        </div>
        <div className="bg-white rounded-[18px] p-16 text-center"
          style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
          <MapPin size={32} className="text-[#AEAEB2] mx-auto mb-3" />
          <p className="text-[15px] font-medium text-[#1D1D1F]">Nenhum supervisor em campo</p>
          <p className="text-[13px] text-[#6E6E73] mt-1">Registre uma saída para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Em Campo</h1>
        <p className="text-[#6E6E73] text-[14px] mt-1">
          {activeOutings.length} {activeOutings.length === 1 ? 'supervisor' : 'supervisores'} com itens retirados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeOutings.map((outing) => {
          const days = daysDiff(outing.startDate);

          // All purchases linked to this outing (via outingId)
          const outingPurchases = purchases.filter((p) => p.outingId === outing.id);
          const totalSpend = outingPurchases.reduce((s, p) => {
            return s + (p.grandTotal ?? (p.lines || []).reduce((a, l) => a + (l.qty * (l.unitPrice || 0)), 0));
          }, 0);

          // Only returnable items still out
          const returnableOut = outing.items.filter(
            (i) => i.type !== 'consumable' && i.taken - i.returned > 0
          );
          // Consumables taken (informational)
          const consumablesUsed = outing.items.filter((i) => i.type === 'consumable');

          return (
            <div key={outing.id} className="bg-white rounded-[18px] overflow-hidden"
              style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>

              {/* Header */}
              <div className="px-5 py-4 border-b border-[#F2F2F7]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[15px] font-bold"
                      style={{background: 'linear-gradient(135deg, #0071E3, #5E5CE6)'}}>
                      {outing.person[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#1D1D1F]">{outing.person}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} className="text-[#AEAEB2]" />
                        <span className="text-[12px] text-[#6E6E73]">desde {fmtDate(outing.startDate)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    days > 30 ? 'bg-[#FFF2F1] text-[#FF3B30]' : 'bg-[#FFF8EC] text-[#FF9500]'
                  }`}>
                    {days}d em campo
                  </span>
                </div>

                {/* Location */}
                {outing.location && (
                  <div className="flex items-center gap-1.5 mt-3 bg-[#F2F2F7] rounded-xl px-3 py-2">
                    <MapPin size={13} className="text-[#0071E3] flex-shrink-0" />
                    <span className="text-[13px] font-medium text-[#1D1D1F] truncate">{outing.location}</span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">

                {/* Spend stat */}
                <div className="flex items-center justify-between bg-[#F2F2F7] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-[#34C759]" />
                    <span className="text-[13px] font-medium text-[#6E6E73]">Gasto neste job</span>
                  </div>
                  <span className={`text-[16px] font-bold tabular-nums ${totalSpend > 0 ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'}`}>
                    {totalSpend > 0 ? fmtUSD(totalSpend) : '—'}
                  </span>
                </div>

                {/* Returnable items out */}
                {returnableOut.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Package size={11} /> Retornáveis em campo
                    </p>
                    <div className="space-y-1">
                      {returnableOut.map((item) => (
                        <div key={item.equipmentId} className="flex justify-between items-center py-1.5 border-b border-[#F2F2F7] last:border-0">
                          <span className="text-[13px] text-[#1D1D1F]">{item.name}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#FF9500]">
                            {item.taken - item.returned} em campo
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consumables used */}
                {consumablesUsed.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Flame size={11} /> Consumíveis utilizados
                    </p>
                    <div className="space-y-1">
                      {consumablesUsed.map((item) => (
                        <div key={item.equipmentId} className="flex justify-between items-center py-1.5 border-b border-[#F2F2F7] last:border-0">
                          <span className="text-[13px] text-[#6E6E73]">{item.name}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F2F2F7] text-[#6E6E73]">
                            {item.taken} usados
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent purchases */}
                {outingPurchases.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-2">
                      Compras vinculadas ({outingPurchases.length})
                    </p>
                    <div className="space-y-1.5">
                      {outingPurchases.slice(-3).reverse().map((p) => {
                        const t = p.grandTotal ?? (p.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);
                        return (
                          <div key={p.id} className="flex justify-between items-center text-[12px]">
                            <span className="text-[#6E6E73]">
                              {fmtDate(p.date)} · {(p.lines || []).map((l) => l.name).join(', ').slice(0, 40)}
                            </span>
                            <span className="font-semibold text-[#1D1D1F] tabular-nums flex-shrink-0 ml-2">
                              {t > 0 ? fmtUSD(t) : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
