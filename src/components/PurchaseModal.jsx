import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus } from 'lucide-react';

function today() { return new Date().toISOString().split('T')[0]; }

export default function PurchaseModal({ outingId, defaultPerson, onClose }) {
  const { addPurchase } = useApp();
  const [responsible, setResponsible] = useState(defaultPerson || '');
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState([{ item: '', qty: 1 }]);
  const [total, setTotal] = useState('');
  const [obs, setObs] = useState('');

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  function handleSubmit(e) {
    e.preventDefault();
    addPurchase({ outingId, responsible, date, lines, total, obs });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-apple-border flex items-center justify-between">
          <h2 className="text-apple-text font-semibold">Registrar Compra</h2>
          <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Responsável</label>
              <input value={responsible} onChange={e => setResponsible(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-2">O que foi comprado</label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input placeholder="Item" value={line.item} onChange={e => setLines(l => l.map((x,j) => j===i ? {...x, item: e.target.value} : x))}
                    className="flex-1 bg-apple-bg border border-apple-border rounded-apple px-3 py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue" />
                  <input type="number" min={1} value={line.qty} onChange={e => setLines(l => l.map((x,j) => j===i ? {...x, qty: e.target.value} : x))}
                    className="w-16 text-center bg-apple-bg border border-apple-border rounded-apple py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40" />
                  <button type="button" onClick={() => setLines(l => l.filter((_,j) => j!==i))}
                    className="text-apple-text-3 hover:text-apple-red transition-colors"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLines(l => [...l, {item:'',qty:1}])}
              className="mt-2 flex items-center gap-1.5 text-sm text-apple-blue hover:underline font-medium">
              <Plus size={14} /> Adicionar linha
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Valor total (R$)</label>
            <input placeholder="0,00" value={total} onChange={e => setTotal(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
              className="w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple transition-all">Salvar Compra</button>
          </div>
        </form>
      </div>
    </div>
  );
}
