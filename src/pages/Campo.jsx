import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PurchaseModal from '../components/PurchaseModal';

function daysDiff(dateStr) {
  const start = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 86400000));
}

export default function Campo() {
  const { activeOutings, getPurchasesForOuting } = useApp();
  const [purchaseTarget, setPurchaseTarget] = useState(null);

  if (activeOutings.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Pessoas em Campo</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhuma pessoa em campo no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Pessoas em Campo</h1>

      <div className="grid gap-5 md:grid-cols-2">
        {activeOutings.map((outing) => {
          const purchases = getPurchasesForOuting(outing.id);
          const days = daysDiff(outing.startDate);
          const remaining = outing.items.filter((i) => i.returned < i.taken);

          return (
            <div key={outing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">{outing.person}</h2>
                    <p className="text-blue-200 text-sm">
                      Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} — {days} dia(s) em campo
                    </p>
                  </div>
                  <div className="bg-blue-500 rounded-full px-3 py-1 text-sm font-medium">
                    Em Campo
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens em campo</h3>
                  <div className="space-y-1">
                    {remaining.map((item) => (
                      <div key={item.equipmentId} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="text-gray-700">{item.name}</span>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>Retirado: <b className="text-gray-800">{item.taken}</b></span>
                          <span>Devolvido: <b className="text-green-700">{item.returned}</b></span>
                          <span>Em campo: <b className="text-orange-700">{item.taken - item.returned}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Compras registradas</h3>
                    <button
                      onClick={() => setPurchaseTarget(outing)}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                    >
                      + Registrar Compra
                    </button>
                  </div>
                  {purchases.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma compra registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {purchases.map((p) => (
                        <div key={p.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500 text-xs">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            {p.total && <span className="text-green-700 font-semibold text-xs">R$ {p.total}</span>}
                          </div>
                          <ul className="space-y-0.5">
                            {p.lines.map((l, i) => (
                              <li key={i} className="text-gray-700 text-xs">{l.item} × {l.qty}</li>
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

      {purchaseTarget && (
        <PurchaseModal
          outingId={purchaseTarget.id}
          defaultPerson={purchaseTarget.person}
          onClose={() => setPurchaseTarget(null)}
        />
      )}
    </div>
  );
}
