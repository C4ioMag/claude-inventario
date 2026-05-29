import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function PurchaseModal({ outingId, defaultPerson, onClose }) {
  const { addPurchase } = useApp();
  const [responsible, setResponsible] = useState(defaultPerson || '');
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState([{ item: '', qty: 1 }]);
  const [total, setTotal] = useState('');
  const [obs, setObs] = useState('');

  function addLine() {
    setLines((l) => [...l, { item: '', qty: 1 }]);
  }

  function removeLine(i) {
    setLines((l) => l.filter((_, idx) => idx !== i));
  }

  function updateLine(i, field, val) {
    setLines((l) => l.map((line, idx) => idx === i ? { ...line, [field]: val } : line));
  }

  function handleSubmit(e) {
    e.preventDefault();
    addPurchase({ outingId, responsible, date, lines, total, obs });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Registrar Compra</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            <input value={responsible} onChange={(e) => setResponsible(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">O que foi comprado</label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Descrição do item"
                    value={line.item}
                    onChange={(e) => updateLine(i, 'item', e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number" min={1} value={line.qty}
                    onChange={(e) => updateLine(i, 'qty', e.target.value)}
                    className="w-16 border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus size={14} /> Adicionar linha
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor total (R$)</label>
            <input
              placeholder="0,00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">Salvar Compra</button>
          </div>
        </form>
      </div>
    </div>
  );
}
