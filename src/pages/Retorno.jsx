import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PurchaseModal from '../components/PurchaseModal';
import { CheckCircle, AlertTriangle, X, Clock } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

function ReturnModal({ outing, onClose }) {
  const { registerReturn, getPurchasesForOuting } = useApp();
  const [returnedBy, setReturnedBy] = useState('');
  const [returnDate, setReturnDate] = useState(today());
  const [quantities, setQuantities] = useState({});
  const [showPurchase, setShowPurchase] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm'

  const purchases = getPurchasesForOuting(outing.id);
  const activeItems = outing.items.filter((i) => i.taken - i.returned > 0);

  function setQty(equipmentId, val, max) {
    const num = Math.max(0, Math.min(Number(val) || 0, max));
    setQuantities((prev) => ({ ...prev, [equipmentId]: num }));
  }

  const summary = activeItems.map((item) => {
    const stillOut = item.taken - item.returned;
    const qty = quantities[item.equipmentId] || 0;
    return { ...item, stillOut, qty, missing: stillOut - qty };
  });

  const totalReturning = summary.reduce((s, i) => s + i.qty, 0);
  const missingItems = summary.filter((i) => i.missing > 0);
  const allOk = missingItems.length === 0;

  function handleConfirm(forceClose) {
    const returnedItems = summary
      .map((item) => ({ equipmentId: item.equipmentId, qty: item.qty }))
      .filter((i) => i.qty > 0);
    registerReturn(outing.id, returnedItems, returnedBy, returnDate, forceClose);
    onClose();
  }

  if (showPurchase) {
    return (
      <PurchaseModal
        outingId={outing.id}
        defaultPerson={outing.person}
        onClose={() => setShowPurchase(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-800">
              {step === 'form' ? 'Registrar Retorno' : 'Revisar Retorno'}
            </h2>
            <p className="text-sm text-gray-500">
              {outing.person} — Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* ── FORM ── */}
        {step === 'form' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável pelo retorno</label>
                <input
                  value={returnedBy}
                  onChange={(e) => setReturnedBy(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do retorno</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Itens retornando</h3>
              <div className="space-y-2">
                {activeItems.map((item) => {
                  const stillOut = item.taken - item.returned;
                  const qty = quantities[item.equipmentId] || 0;
                  const ok = qty >= stillOut;
                  return (
                    <div key={item.equipmentId} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Em campo: {stillOut}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQty(item.equipmentId, qty - 1, stillOut)}
                          disabled={qty === 0}
                          className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40"
                        >−</button>
                        <input
                          type="number" min={0} max={stillOut} value={qty}
                          onChange={(e) => setQty(item.equipmentId, e.target.value, stillOut)}
                          className="w-12 text-center border rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => setQty(item.equipmentId, qty + 1, stillOut)}
                          disabled={qty >= stillOut}
                          className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-40"
                        >+</button>
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        ok ? 'bg-green-100 text-green-700' : qty === 0 ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ok ? '✓ ok' : qty === 0 ? 'nenhum' : `faltam ${stillOut - qty}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compras */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Compras desta saída</h3>
                <button onClick={() => setShowPurchase(true)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100">
                  + Registrar Compra
                </button>
              </div>
              {purchases.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma compra registrada.</p>
              ) : (
                <div className="space-y-2">
                  {purchases.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        {p.total && <span className="text-green-700 font-semibold text-xs">R$ {p.total}</span>}
                      </div>
                      <ul className="space-y-0.5">
                        {p.lines.map((l, i) => <li key={i} className="text-xs text-gray-700">{l.item} × {l.qty}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
              <button
                onClick={() => setStep('confirm')}
                disabled={totalReturning === 0}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar →
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <div className="p-5 space-y-5">
            {/* Status */}
            {allOk ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
                <div>
                  <p className="font-semibold text-green-800">Tudo certo!</p>
                  <p className="text-sm text-green-700">
                    {totalReturning} {totalReturning === 1 ? 'item devolvido' : 'itens devolvidos'} — nenhuma pendência.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={22} />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-800">Atenção: itens faltando</p>
                    <p className="text-sm text-yellow-700 mt-1 mb-3">
                      {totalReturning} {totalReturning === 1 ? 'item devolvido' : 'itens devolvidos'}, mas os seguintes itens não foram devolvidos:
                    </p>
                    <ul className="space-y-1.5">
                      {missingItems.map((i) => (
                        <li key={i.equipmentId} className="flex justify-between text-sm bg-yellow-100 rounded-lg px-3 py-1.5">
                          <span className="text-yellow-900 font-medium">{i.name}</span>
                          <span className="text-yellow-800 font-bold">{i.missing} un. faltando</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Itens que estão voltando */}
            {summary.some((i) => i.qty > 0) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Devolvendo agora</h3>
                <div className="bg-gray-50 rounded-xl divide-y">
                  {summary.filter((i) => i.qty > 0).map((i) => (
                    <div key={i.equipmentId} className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-gray-700">{i.name}</span>
                      <span className="font-medium text-gray-800">{i.qty} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="pt-2 space-y-3">
              <button onClick={() => setStep('form')} className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                ← Voltar e corrigir
              </button>

              {allOk ? (
                <button
                  onClick={() => handleConfirm(false)}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
                >
                  ✓ Confirmar Retorno
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleConfirm(false)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-blue-400 text-blue-700 bg-blue-50 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-100"
                  >
                    <Clock size={16} /> Deixar em espera
                    <span className="text-xs font-normal ml-1">(aguardar os itens que faltam)</span>
                  </button>
                  <button
                    onClick={() => handleConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600"
                  >
                    <AlertTriangle size={16} /> Finalizar com pendência
                    <span className="text-xs font-normal ml-1">(registrar falta no histórico)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Retorno() {
  const { activeOutings } = useApp();
  const [selected, setSelected] = useState(null);

  if (activeOutings.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-800">Retorno</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Nenhuma pessoa em campo no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Retorno</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {activeOutings.map((outing) => {
          const remaining = outing.items.filter((i) => i.returned < i.taken);
          return (
            <div key={outing.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-800">{outing.person}</h2>
                  <p className="text-sm text-gray-500">
                    Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(outing)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  Registrar Retorno
                </button>
              </div>
              <ul className="space-y-1">
                {remaining.map((item) => (
                  <li key={item.equipmentId} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name}</span>
                    <span className="text-orange-700 font-medium">{item.taken - item.returned} em campo</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {selected && <ReturnModal outing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
