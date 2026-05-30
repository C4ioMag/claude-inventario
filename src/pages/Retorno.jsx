import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PurchaseModal from '../components/PurchaseModal';
import { CheckCircle, AlertTriangle, X, Clock, RotateCcw } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

function ReturnModal({ outing, onClose }) {
  const { registerReturn, getPurchasesForOuting } = useApp();
  const [returnedBy, setReturnedBy] = useState('');
  const [returnDate, setReturnDate] = useState(today());
  const [quantities, setQuantities] = useState({});
  const [showPurchase, setShowPurchase] = useState(false);
  const [step, setStep] = useState('form');

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

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-apple-border flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-apple-text">
              {step === 'form' ? 'Registrar Retorno' : 'Revisar Retorno'}
            </h2>
            <p className="text-xs text-apple-text-2 mt-0.5">
              {outing.person} — Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors mt-0.5"><X size={20} /></button>
        </div>

        {step === 'form' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1.5">Responsável pelo retorno</label>
                <input value={returnedBy} onChange={(e) => setReturnedBy(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-text mb-1.5">Data do retorno</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-3">Itens retornando</p>
              <div className="space-y-1">
                {activeItems.map((item) => {
                  const stillOut = item.taken - item.returned;
                  const qty = quantities[item.equipmentId] || 0;
                  const ok = qty >= stillOut;
                  return (
                    <div key={item.equipmentId} className="flex items-center gap-3 py-2.5 border-b border-apple-border/60 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-apple-text truncate">{item.name}</p>
                        <p className="text-xs text-apple-text-2">Em campo: {stillOut}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setQty(item.equipmentId, qty - 1, stillOut)} disabled={qty === 0}
                          className="w-7 h-7 border border-apple-border rounded-apple bg-apple-bg flex items-center justify-center text-sm text-apple-text hover:bg-apple-border/30 disabled:opacity-30 transition-colors">−</button>
                        <input type="number" min={0} max={stillOut} value={qty}
                          onChange={(e) => setQty(item.equipmentId, e.target.value, stillOut)}
                          className="w-12 text-center bg-apple-bg border border-apple-border rounded-apple py-1 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40" />
                        <button onClick={() => setQty(item.equipmentId, qty + 1, stillOut)} disabled={qty >= stillOut}
                          className="w-7 h-7 bg-apple-blue text-white rounded-apple flex items-center justify-center text-sm hover:bg-apple-blue-hover disabled:opacity-30 transition-colors">+</button>
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        ok ? 'bg-apple-green/10 text-apple-green' : qty === 0 ? 'bg-apple-bg text-apple-text-3' : 'bg-apple-orange/10 text-apple-orange'
                      }`}>
                        {ok ? '✓ ok' : qty === 0 ? 'nenhum' : `faltam ${stillOut - qty}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">Compras desta saída</p>
                <button onClick={() => setShowPurchase(true)} className="text-xs text-apple-blue font-medium hover:underline">
                  + Registrar Compra
                </button>
              </div>
              {purchases.length === 0 ? (
                <p className="text-xs text-apple-text-3">Nenhuma compra registrada.</p>
              ) : (
                <div className="space-y-2">
                  {purchases.map((p) => (
                    <div key={p.id} className="bg-apple-bg rounded-apple p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-apple-text-2">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        {p.total && <span className="text-apple-green font-semibold text-xs">R$ {p.total}</span>}
                      </div>
                      <ul className="space-y-0.5">
                        {p.lines.map((l, i) => <li key={i} className="text-xs text-apple-text">{l.item} × {l.qty}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
              <button onClick={() => setStep('confirm')} disabled={totalReturning === 0}
                className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple disabled:opacity-50 transition-all">
                Revisar →
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6 space-y-5">
            {allOk ? (
              <div className="flex items-center gap-3 bg-apple-green/8 border border-apple-green/25 rounded-apple p-4">
                <CheckCircle className="text-apple-green flex-shrink-0" size={26} />
                <div>
                  <p className="font-semibold text-apple-text">Tudo certo!</p>
                  <p className="text-sm text-apple-text-2 mt-0.5">
                    {totalReturning} {totalReturning === 1 ? 'item devolvido' : 'itens devolvidos'} — nenhuma pendência.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-apple-orange/8 border border-apple-orange/25 rounded-apple p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-apple-orange flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-apple-text">Atenção: itens faltando</p>
                    <p className="text-sm text-apple-text-2 mt-1 mb-3">
                      {totalReturning} {totalReturning === 1 ? 'item devolvido' : 'itens devolvidos'}, mas os seguintes itens não foram devolvidos:
                    </p>
                    <ul className="space-y-1.5">
                      {missingItems.map((i) => (
                        <li key={i.equipmentId} className="flex justify-between text-sm bg-apple-orange/10 rounded-apple px-3 py-1.5">
                          <span className="text-apple-text font-medium">{i.name}</span>
                          <span className="text-apple-orange font-semibold">{i.missing} un. faltando</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {summary.some((i) => i.qty > 0) && (
              <div>
                <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-2">Devolvendo agora</p>
                <div className="bg-apple-bg rounded-apple divide-y divide-apple-border">
                  {summary.filter((i) => i.qty > 0).map((i) => (
                    <div key={i.equipmentId} className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-apple-text">{i.name}</span>
                      <span className="font-semibold text-apple-text">{i.qty} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button onClick={() => setStep('form')} className="w-full bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
                ← Voltar e corrigir
              </button>

              {allOk ? (
                <button onClick={() => handleConfirm(false)}
                  className="w-full bg-apple-green text-white py-2.5 rounded-apple text-sm font-semibold hover:opacity-90 shadow-apple transition-all">
                  ✓ Confirmar Retorno
                </button>
              ) : (
                <>
                  <button onClick={() => handleConfirm(false)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-apple-blue/40 text-apple-blue bg-apple-blue/5 py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue/10 transition-colors">
                    <Clock size={15} /> Deixar em espera
                    <span className="text-xs font-normal ml-1 text-apple-text-2">(aguardar itens que faltam)</span>
                  </button>
                  <button onClick={() => handleConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-apple-orange text-white py-2.5 rounded-apple text-sm font-semibold hover:opacity-90 shadow-apple transition-all">
                    <AlertTriangle size={15} /> Finalizar com pendência
                    <span className="text-xs font-normal ml-1">(vai para "Itens Não Devolvidos")</span>
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
      <div className="space-y-6">
        <div>
          <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Retorno</h1>
          <p className="text-apple-text-2 text-sm mt-0.5">Registre o retorno de equipamentos</p>
        </div>
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-16 text-center">
          <RotateCcw size={32} className="text-apple-text-3 mx-auto mb-3" />
          <p className="text-apple-text font-medium">Nenhuma pessoa em campo</p>
          <p className="text-apple-text-2 text-sm mt-1">Registre uma saída para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Retorno</h1>
        <p className="text-apple-text-2 text-sm mt-0.5">{activeOutings.length} {activeOutings.length === 1 ? 'pessoa' : 'pessoas'} em campo</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {activeOutings.map((outing) => {
          const remaining = outing.items.filter((i) => i.returned < i.taken);
          return (
            <div key={outing.id} className="bg-apple-card rounded-apple shadow-apple overflow-hidden">
              <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-apple-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-apple-blue text-sm font-semibold">{outing.person[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-apple-text font-semibold text-sm">{outing.person}</p>
                    <p className="text-apple-text-2 text-xs">
                      Saída: {new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelected(outing)}
                  className="bg-apple-blue hover:bg-apple-blue-hover text-white px-3 py-1.5 rounded-apple text-xs font-semibold shadow-apple transition-all flex-shrink-0">
                  Registrar Retorno
                </button>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-2">Itens em campo</p>
                <div className="space-y-1">
                  {remaining.map((item) => (
                    <div key={item.equipmentId} className="flex justify-between items-center py-1.5 border-b border-apple-border/50 last:border-0">
                      <span className="text-sm text-apple-text">{item.name}</span>
                      <span className="text-xs bg-apple-orange/10 text-apple-orange font-semibold px-2 py-0.5 rounded-full">
                        {item.taken - item.returned} em campo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selected && <ReturnModal outing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
