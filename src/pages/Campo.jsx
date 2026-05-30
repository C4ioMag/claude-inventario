import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PurchaseModal from '../components/PurchaseModal';
import { MapPin, ShoppingBag, Calendar } from 'lucide-react';

function daysDiff(d) {
  return Math.max(0, Math.floor((new Date() - new Date(d + 'T12:00:00')) / 86400000));
}

export default function Campo() {
  const { activeOutings, getPurchasesForOuting } = useApp();
  const [purchaseTarget, setPurchaseTarget] = useState(null);

  if (activeOutings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Pessoas em Campo</h1>
          <p className="text-apple-text-2 text-sm mt-0.5">Equipe atualmente com itens retirados</p>
        </div>
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-16 text-center">
          <MapPin size={32} className="text-apple-text-3 mx-auto mb-3" />
          <p className="text-apple-text font-medium">Nenhuma pessoa em campo</p>
          <p className="text-apple-text-2 text-sm mt-1">Registre uma saída para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Pessoas em Campo</h1>
        <p className="text-apple-text-2 text-sm mt-0.5">{activeOutings.length} {activeOutings.length === 1 ? 'pessoa' : 'pessoas'} com itens retirados</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeOutings.map(outing => {
          const purchases = getPurchasesForOuting(outing.id);
          const days = daysDiff(outing.startDate);
          const remaining = outing.items.filter(i => i.returned < i.taken);

          return (
            <div key={outing.id} className="bg-apple-card rounded-apple shadow-apple overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-apple-blue/10 rounded-full flex items-center justify-center">
                    <span className="text-apple-blue text-sm font-semibold">{outing.person[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-apple-text font-semibold text-sm">{outing.person}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar size={11} className="text-apple-text-2" />
                      <p className="text-apple-text-2 text-xs">{new Date(outing.startDate+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-apple-orange/15 text-apple-orange font-semibold px-2.5 py-1 rounded-full">
                  {days}d em campo
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-2">Itens em campo</p>
                  <div className="space-y-1.5">
                    {remaining.map(item => (
                      <div key={item.equipmentId} className="flex justify-between items-center py-1.5 border-b border-apple-border/50 last:border-0">
                        <span className="text-sm text-apple-text">{item.name}</span>
                        <div className="flex gap-3 text-xs text-apple-text-2">
                          <span>Ret: <b className="text-apple-text">{item.taken}</b></span>
                          <span>Dev: <b className="text-apple-green">{item.returned}</b></span>
                          <span className="bg-apple-orange/10 text-apple-orange font-semibold px-1.5 py-0.5 rounded-full">
                            {item.taken - item.returned} campo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchases */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">Compras</p>
                    <button onClick={() => setPurchaseTarget(outing)}
                      className="text-xs text-apple-blue font-medium hover:underline flex items-center gap-1">
                      <ShoppingBag size={12} /> Registrar
                    </button>
                  </div>
                  {purchases.length === 0 ? (
                    <p className="text-xs text-apple-text-3">Nenhuma compra registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map(p => (
                        <div key={p.id} className="bg-apple-bg rounded-apple p-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-apple-text-2">{new Date(p.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            {p.total && <span className="text-xs font-semibold text-apple-green">R$ {p.total}</span>}
                          </div>
                          <ul className="space-y-0.5">
                            {p.lines.map((l, i) => <li key={i} className="text-xs text-apple-text">{l.item} × {l.qty}</li>)}
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

      {purchaseTarget && (
        <PurchaseModal outingId={purchaseTarget.id} defaultPerson={purchaseTarget.person} onClose={() => setPurchaseTarget(null)} />
      )}
    </div>
  );
}
