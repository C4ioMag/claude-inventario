import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Flame } from 'lucide-react';

function today() { return new Date().toISOString().split('T')[0]; }

function Step({ n, active, done }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
      done ? 'bg-apple-green text-white' : active ? 'bg-apple-blue text-white' : 'bg-apple-border text-apple-text-2'
    }`}>
      {done ? '✓' : n}
    </div>
  );
}

function TypeBadge({ type }) {
  if (type === 'consumable') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FFF2F1] text-[#FF3B30]">
        <Flame size={9} /> Consumível
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EAF4FF] text-[#0071E3]">
      <RotateCcw size={9} /> Retornável
    </span>
  );
}

export default function Saida() {
  const { equipment, createOuting } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(today());
  const [quantities, setQuantities] = useState({});

  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))].sort();

  function setQty(id, val, max) {
    const n = Math.max(0, Math.min(Number(val) || 0, max));
    setQuantities(p => ({ ...p, [id]: n }));
  }

  const selectedItems = equipment
    .map(e => ({ ...e, qty: quantities[e.id] || 0, available: e.quantity - e.inUse }))
    .filter(e => e.qty > 0);

  const returnableSelected = selectedItems.filter(i => i.type !== 'consumable');
  const consumableSelected = selectedItems.filter(i => i.type === 'consumable');

  function handleConfirm() {
    createOuting(
      person,
      date,
      selectedItems.map(i => ({ equipmentId: i.id, name: i.name, qty: i.qty, type: i.type || 'returnable' }))
    );
    navigate('/campo');
  }

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Registrar Saída</h1>
        <p className="text-apple-text-2 text-sm mt-0.5">Registre os itens que estão saindo do estoque</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[1,2,3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <Step n={s} active={step === s} done={step > s} />
            {i < 2 && <div className={`h-px w-10 ${step > s ? 'bg-apple-green' : 'bg-apple-border'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-apple-text-2">
          {step === 1 && 'Identificação'}{step === 2 && 'Itens'}{step === 3 && 'Conferência'}
        </span>
      </div>

      {step === 1 && (
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-6 space-y-4">
          <h2 className="text-apple-text font-semibold">Quem está retirando?</h2>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Nome da pessoa</label>
            <input value={person} onChange={e => setPerson(e.target.value)}
              placeholder="Nome completo" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Data de retirada</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <button disabled={!person.trim()} onClick={() => setStep(2)}
            className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold py-2.5 rounded-apple text-sm transition-all shadow-apple disabled:opacity-50">
            Próximo
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex items-center gap-3 px-1">
            <TypeBadge type="returnable" />
            <span className="text-[11px] text-apple-text-2">deve voltar</span>
            <TypeBadge type="consumable" />
            <span className="text-[11px] text-apple-text-2">baixa imediata do estoque</span>
          </div>

          {categories.map(cat => {
            const items = equipment.filter(e => e.category === cat);
            return (
              <div key={cat} className="bg-apple-card rounded-apple shadow-apple-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-apple-bg border-b border-apple-border">
                  <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">{cat}</p>
                </div>
                <div className="divide-y divide-apple-border">
                  {items.map(item => {
                    const available = item.quantity - item.inUse;
                    const qty = quantities[item.id] || 0;
                    const isConsumable = item.type === 'consumable';
                    return (
                      <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${available === 0 ? 'opacity-35' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-apple-text truncate">{item.name}</p>
                            <TypeBadge type={item.type || 'returnable'} />
                          </div>
                          <p className="text-xs text-apple-text-2 mt-0.5">
                            {isConsumable ? `Disponível: ${available}` : `Disponível: ${available} · em uso: ${item.inUse}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(item.id, qty - 1, available)} disabled={qty === 0}
                            className="w-8 h-8 rounded-full border border-apple-border text-apple-text flex items-center justify-center text-lg font-light hover:bg-apple-bg disabled:opacity-30 transition-colors">−</button>
                          <input type="number" min={0} max={available} value={qty}
                            onChange={e => setQty(item.id, e.target.value, available)}
                            className="w-12 text-center bg-apple-bg border border-apple-border rounded-apple py-1 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/40" />
                          <button onClick={() => setQty(item.id, qty + 1, available)} disabled={qty >= available || available === 0}
                            className="w-8 h-8 rounded-full bg-apple-blue text-white flex items-center justify-center text-lg font-light hover:bg-apple-blue-hover disabled:opacity-30 transition-colors">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(1)} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Voltar</button>
            <button onClick={() => setStep(3)} disabled={selectedItems.length === 0}
              className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover disabled:opacity-50 shadow-apple transition-all">
              Próximo · {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-apple-card rounded-apple shadow-apple-sm p-6">
            <h2 className="text-apple-text font-semibold mb-4">Conferência</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-apple-blue/8 rounded-apple p-3">
                <p className="text-xs text-apple-blue font-medium">Pessoa</p>
                <p className="font-semibold text-apple-text mt-0.5">{person}</p>
              </div>
              <div className="bg-apple-blue/8 rounded-apple p-3">
                <p className="text-xs text-apple-blue font-medium">Data</p>
                <p className="font-semibold text-apple-text mt-0.5">{new Date(date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {returnableSelected.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <TypeBadge type="returnable" />
                  <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">Retornáveis (devem voltar)</p>
                </div>
                <div className="space-y-1 mb-4">
                  {returnableSelected.map(i => (
                    <div key={i.id} className="flex justify-between items-center py-2 border-b border-apple-border last:border-0">
                      <span className="text-sm text-apple-text">{i.name}</span>
                      <span className="text-sm font-semibold text-apple-text bg-apple-bg px-2.5 py-0.5 rounded-full">{i.qty} un.</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {consumableSelected.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <TypeBadge type="consumable" />
                  <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider">Consumíveis (baixa imediata)</p>
                </div>
                <div className="space-y-1">
                  {consumableSelected.map(i => (
                    <div key={i.id} className="flex justify-between items-center py-2 border-b border-apple-border last:border-0">
                      <span className="text-sm text-apple-text">{i.name}</span>
                      <span className="text-sm font-semibold text-[#FF3B30] bg-[#FFF2F1] px-2.5 py-0.5 rounded-full">{i.qty} un.</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Voltar</button>
            <button onClick={handleConfirm} className="flex-1 bg-apple-green text-white py-2.5 rounded-apple text-sm font-semibold hover:opacity-90 shadow-apple transition-all">
              Confirmar Saída
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
