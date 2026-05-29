import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Saida() {
  const { equipment, createOuting } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(today());
  const [quantities, setQuantities] = useState({});

  const categories = [...new Set(equipment.map((e) => e.category).filter(Boolean))].sort();

  function setQty(id, val, maxAvailable) {
    const num = Math.max(0, Math.min(Number(val) || 0, maxAvailable));
    setQuantities((prev) => ({ ...prev, [id]: num }));
  }

  const selectedItems = equipment
    .map((e) => ({ ...e, qty: quantities[e.id] || 0, available: e.quantity - e.inUse }))
    .filter((e) => e.qty > 0);

  function handleConfirm() {
    createOuting(
      person,
      date,
      selectedItems.map((i) => ({ equipmentId: i.id, name: i.name, qty: i.qty }))
    );
    navigate('/campo');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Registrar Saída</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-gray-500">
          {step === 1 && 'Identificação'} {step === 2 && 'Itens'} {step === 3 && 'Conferência'}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Quem está retirando?</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da pessoa</label>
            <input
              required
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Nome completo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de retirada</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            disabled={!person.trim()}
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = equipment.filter((e) => e.category === cat);
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-700">{cat}</h3>
                </div>
                <div className="divide-y">
                  {items.map((item) => {
                    const available = item.quantity - item.inUse;
                    const qty = quantities[item.id] || 0;
                    const isEmpty = available === 0;
                    return (
                      <div key={item.id} className={`flex items-center justify-between px-4 py-3 gap-3 ${isEmpty ? 'opacity-40' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Disponível: {available}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQty(item.id, qty - 1, available)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            max={available}
                            value={qty}
                            onChange={(e) => setQty(item.id, e.target.value, available)}
                            className="w-12 text-center border border-gray-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => setQty(item.id, qty + 1, available)}
                            disabled={qty >= available || isEmpty}
                            className="w-7 h-7 rounded-lg border border-blue-300 text-blue-700 flex items-center justify-center hover:bg-blue-50 disabled:opacity-40"
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm">Voltar</button>
            <button
              disabled={selectedItems.length === 0}
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Próximo ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'})
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Conferência</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500">Pessoa</p>
                <p className="font-semibold text-blue-800">{person}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500">Data</p>
                <p className="font-semibold text-blue-800">{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens selecionados:</h3>
            <ul className="space-y-1">
              {selectedItems.map((i) => (
                <li key={i.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="text-gray-700">{i.name}</span>
                  <span className="font-semibold text-gray-800">{i.qty} un.</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm">Voltar</button>
            <button onClick={handleConfirm} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm hover:bg-green-700">
              Confirmar Saída
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
