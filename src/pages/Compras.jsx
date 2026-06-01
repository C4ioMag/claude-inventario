import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Search, FileDown, ChevronDown, ChevronUp, X,
  TrendingUp, DollarSign, ShoppingCart, MapPin, Trash2,
  BarChart2, Calendar, Package, Paperclip, Image, FileText, ZoomIn,
  Sparkles, AlertTriangle,
} from 'lucide-react';
import { exportComprasPDF } from '../utils/pdf';
import AIAssistant from '../components/AIAssistant';

// ─── Formatters ────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d) {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
}
function fmtUSD(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
}
function monthKey(d) { return d ? d.slice(0, 7) : ''; }
function thisMonth() { return new Date().toISOString().slice(0, 7); }
function thisYear()  { return new Date().getFullYear().toString(); }

// ─── Input class ───────────────────────────────────────────────────────────────
const ic = 'w-full bg-[#F2F2F7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 focus:bg-white transition-all border-0';

// ─── New Purchase Modal ────────────────────────────────────────────────────────
function NewPurchaseModal({ onClose }) {
  const { equipment, addPurchase, activeOutings, purchases } = useApp();
  const [date, setDate]         = useState(today());
  const [outingId, setOutingId] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes]       = useState('');
  const [lines, setLines]       = useState([{ name: '', equipmentId: '', qty: 1, unitPrice: '' }]);
  const [receipt, setReceipt]   = useState(null); // { dataUrl, type, name }
  const fileRef                 = useRef();

  // Detect duplicate: same equipmentId bought for same outing OR same location in last 90 days
  function getDuplicateWarning(equipmentId) {
    if (!equipmentId) return null;
    const eq = equipment.find((e) => e.id === equipmentId);
    if (!eq) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const prev = purchases.filter((p) => {
      const onDate = p.date ? new Date(p.date + 'T12:00:00') >= cutoff : false;
      if (!onDate) return false;
      const hasItem = (p.lines || []).some((l) => l.equipmentId === equipmentId);
      if (!hasItem) return false;
      if (outingId && p.outingId === outingId) return true;
      if (location && p.location && p.location.toLowerCase() === location.toLowerCase()) return true;
      return false;
    });
    if (prev.length === 0) return null;
    const linked = activeOutings.find((o) => o.id === prev[0].outingId);
    const where = prev[0].outingId === outingId
      ? `este supervisor (${linked?.person || 'mesmo job'})`
      : `este local (${prev[0].location})`;
    return `"${eq.name}" já foi comprado ${prev.length}× nos últimos 90 dias para ${where}.`;
  }

  function selectSupervisor(id) {
    setOutingId(id);
    if (id) {
      const o = activeOutings.find((o) => o.id === id);
      if (o?.location) setLocation(o.location);
    }
  }

  const grandTotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);

  function setLine(i, field, val) {
    setLines((prev) => prev.map((l, j) => j !== i ? l : { ...l, [field]: val }));
  }

  function linkEquipment(i, equipmentId) {
    const eq = equipment.find((e) => e.id === equipmentId);
    setLines((prev) => prev.map((l, j) => j !== i ? l : {
      ...l,
      equipmentId,
      name: eq ? eq.name : l.name,
      unitPrice: eq?.lastUnitPrice ? String(eq.lastUnitPrice) : l.unitPrice,
    }));
  }

  function handleReceiptFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReceipt({ dataUrl: ev.target.result, type: file.type, name: file.name });
    reader.readAsDataURL(file);
  }

  function addLine() {
    setLines((prev) => [...prev, { name: '', equipmentId: '', qty: 1, unitPrice: '' }]);
  }

  function removeLine(i) {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validLines = lines.filter((l) => l.name.trim() && Number(l.qty) > 0);
    if (!validLines.length) return;
    addPurchase({
      date, location, notes,
      outingId: outingId || null,
      receipt: receipt || null,
      lines: validLines.map((l) => ({
        equipmentId: l.equipmentId || null,
        name: l.name.trim(),
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice) || 0,
      })),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto sm:rounded-[22px] rounded-t-[22px]"
        style={{boxShadow: '0 24px 64px rgba(0,0,0,0.18)'}}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F2F2F7] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-[17px] font-semibold text-[#1D1D1F]">Nova Compra</h2>
          <button onClick={onClose} className="w-7 h-7 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full flex items-center justify-center text-[#6E6E73] transition-colors">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Supervisor link */}
          {activeOutings.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">
                Vincular ao supervisor <span className="text-[#AEAEB2] font-normal">(opcional)</span>
              </label>
              <select value={outingId} onChange={(e) => selectSupervisor(e.target.value)} className={ic}>
                <option value="">— compra geral, sem vínculo —</option>
                {activeOutings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.person}{o.location ? ` · ${o.location}` : ''}
                  </option>
                ))}
              </select>
              {outingId && (
                <p className="text-[11px] text-[#34C759] mt-1.5 ml-0.5">
                  ✓ Gasto aparecerá no card do supervisor em "Em Campo"
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">Data da compra *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={ic} required />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">Local de uso / Job Site</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={ic} placeholder="Ex: Austin TX, Job #42" />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-[#1D1D1F]">Itens comprados *</label>
              <span className="text-[11px] text-[#AEAEB2]">Vincule ao estoque para atualizar quantidade</span>
            </div>

            <div className="grid grid-cols-[1fr_160px_60px_100px_24px] gap-2 mb-1.5 px-0.5">
              {['Item', 'Vincular ao estoque', 'Qtd', 'Preço unit.', ''].map((h, i) => (
                <span key={i} className="text-[11px] text-[#AEAEB2] font-medium">{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {lines.map((line, i) => {
                const dupWarn = getDuplicateWarning(line.equipmentId);
                return (
                <div key={i} className="space-y-1">
                  <div className="grid grid-cols-[1fr_160px_60px_100px_24px] gap-2 items-center">
                  <input
                    value={line.name}
                    onChange={(e) => setLine(i, 'name', e.target.value)}
                    placeholder="Nome do item"
                    className={ic}
                    required={i === 0}
                  />
                  <select
                    value={line.equipmentId}
                    onChange={(e) => linkEquipment(i, e.target.value)}
                    className={`${ic} text-[12px] ${dupWarn ? 'ring-2 ring-[#FF9500]/40 border-[#FF9500]' : ''}`}
                  >
                    <option value="">— não vincular —</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={1} value={line.qty}
                    onChange={(e) => setLine(i, 'qty', e.target.value)}
                    className={`${ic} text-center px-2`}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#AEAEB2]">$</span>
                    <input
                      type="number" min={0} step="0.01" value={line.unitPrice}
                      onChange={(e) => setLine(i, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className={`${ic} pl-6`}
                    />
                  </div>
                  <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                    className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors disabled:opacity-20">
                    <X size={14} />
                  </button>
                </div>
                  {dupWarn && (
                    <div className="flex items-start gap-1.5 bg-[#FFF8EC] border border-[#FF9500]/30 rounded-xl px-3 py-2">
                      <AlertTriangle size={12} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#FF9500] leading-tight">{dupWarn}</p>
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            <button type="button" onClick={addLine}
              className="mt-2.5 flex items-center gap-1.5 text-[13px] font-medium text-[#0071E3] hover:underline">
              <Plus size={13} /> Adicionar linha
            </button>
          </div>

          {/* Grand total */}
          <div className="flex items-center justify-between bg-[#F2F2F7] rounded-xl px-4 py-3">
            <span className="text-[13px] font-medium text-[#6E6E73]">Total da compra</span>
            <span className="text-[20px] font-bold text-[#1D1D1F] tabular-nums">{fmtUSD(grandTotal)}</span>
          </div>

          {/* Receipt attachment */}
          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">
              Nota fiscal / Comprovante <span className="text-[#AEAEB2] font-normal">(opcional)</span>
            </label>
            {!receipt ? (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#E5E5EA] hover:border-[#0071E3] rounded-xl py-4 text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors">
                <Paperclip size={15} /> Anexar imagem ou PDF da nota
              </button>
            ) : (
              <div className="border border-[#E5E5EA] rounded-xl overflow-hidden">
                {receipt.type.startsWith('image/') ? (
                  <div className="relative">
                    <img src={receipt.dataUrl} alt="Nota fiscal" className="w-full max-h-48 object-contain bg-[#F2F2F7]" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <a href={receipt.dataUrl} target="_blank" rel="noreferrer"
                        className="w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                        <ZoomIn size={12} />
                      </a>
                      <button type="button" onClick={() => setReceipt(null)}
                        className="w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-[#FF3B30]/80 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#F2F2F7]">
                    <FileText size={20} className="text-[#FF3B30] flex-shrink-0" />
                    <span className="text-[13px] text-[#1D1D1F] flex-1 truncate">{receipt.name}</span>
                    <a href={receipt.dataUrl} target="_blank" rel="noreferrer"
                      className="text-[12px] font-medium text-[#0071E3] hover:underline flex-shrink-0">Abrir</a>
                    <button type="button" onClick={() => setReceipt(null)}
                      className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={handleReceiptFile} />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Nota fiscal nº, detalhes adicionais…"
              className={`${ic} resize-none`} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 text-white py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
              style={{background: 'linear-gradient(180deg,#34C759 0%,#28A745 100%)', boxShadow: '0 2px 8px rgba(52,199,89,0.35)'}}>
              Salvar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Purchase Row ──────────────────────────────────────────────────────────────
function PurchaseRow({ purchase, onDelete, outings }) {
  const [open, setOpen] = useState(false);
  const linesTotal = (purchase.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);
  const total = purchase.grandTotal ?? linesTotal;
  const linkedSupervisor = purchase.outingId
    ? outings.find((o) => o.id === purchase.outingId)
    : null;

  return (
    <div className="border-b border-[#F2F2F7] last:border-0">
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#F9F9F9] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Date */}
        <span className="text-[12px] text-[#6E6E73] w-24 flex-shrink-0 tabular-nums">{fmtDate(purchase.date)}</span>

        {/* Location + supervisor + item preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {purchase.location && (
              <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{purchase.location}</p>
            )}
            {linkedSupervisor && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EAF4FF] text-[#0071E3] flex-shrink-0">
                {linkedSupervisor.person}
              </span>
            )}
            {!purchase.location && !linkedSupervisor && (
              <span className="text-[#AEAEB2] text-[13px] font-normal">Sem local</span>
            )}
          </div>
          <p className="text-[11px] text-[#AEAEB2] mt-0.5 truncate">
            {(purchase.lines || []).map((l) => l.name || l.item).filter(Boolean).join(', ')}
          </p>
        </div>

        {/* Items count */}
        <span className="text-[12px] text-[#AEAEB2] flex-shrink-0 w-16 text-right">
          {(purchase.lines || []).length} {(purchase.lines || []).length === 1 ? 'item' : 'itens'}
        </span>

        {/* Total */}
        <span className="text-[14px] font-semibold text-[#1D1D1F] tabular-nums w-24 text-right flex-shrink-0">
          {fmtUSD(total)}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {purchase.receipt && <Paperclip size={12} className="text-[#AEAEB2]" />}
          {open ? <ChevronUp size={14} className="text-[#AEAEB2]" /> : <ChevronDown size={14} className="text-[#AEAEB2]" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-4 pt-1 bg-[#F9F9F9]">
          {/* Line items */}
          <div className="bg-white rounded-xl overflow-hidden mb-3" style={{boxShadow: '0 1px 4px rgba(0,0,0,0.06)'}}>
            <div className="grid grid-cols-[1fr_60px_90px_90px] gap-2 px-4 py-2 bg-[#F2F2F7] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wide">
              <span>Item</span><span className="text-right">Qtd</span><span className="text-right">Preço/un</span><span className="text-right">Total</span>
            </div>
            {(purchase.lines || []).map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_90px_90px] gap-2 px-4 py-2.5 border-t border-[#F2F2F7]">
                <div>
                  <span className="text-[13px] text-[#1D1D1F] font-medium">{l.name || l.item}</span>
                  {l.equipmentId && (
                    <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 bg-[#EAF4FF] text-[#0071E3] rounded-md">estoque vinculado</span>
                  )}
                </div>
                <span className="text-[13px] text-[#6E6E73] text-right tabular-nums">{l.qty}</span>
                <span className="text-[13px] text-[#6E6E73] text-right tabular-nums">
                  {l.unitPrice > 0 ? fmtUSD(l.unitPrice) : '—'}
                </span>
                <span className="text-[13px] font-semibold text-[#1D1D1F] text-right tabular-nums">
                  {l.unitPrice > 0 ? fmtUSD(l.qty * l.unitPrice) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Receipt */}
          {purchase.receipt && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Paperclip size={11} /> Nota fiscal anexada
              </p>
              {purchase.receipt.type?.startsWith('image/') ? (
                <a href={purchase.receipt.dataUrl} target="_blank" rel="noreferrer"
                  className="block relative group rounded-xl overflow-hidden border border-[#E5E5EA] max-w-xs">
                  <img src={purchase.receipt.dataUrl} alt="Nota" className="w-full max-h-40 object-contain bg-[#F2F2F7]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ) : (
                <a href={purchase.receipt.dataUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#0071E3] hover:border-[#0071E3] transition-colors">
                  <FileText size={14} className="text-[#FF3B30]" />
                  {purchase.receipt.name || 'Ver nota fiscal (PDF)'}
                </a>
              )}
            </div>
          )}

          {/* Meta */}
          {purchase.notes && (
            <p className="text-[12px] text-[#6E6E73]">📝 {purchase.notes}</p>
          )}

          <button onClick={(e) => { e.stopPropagation(); onDelete(purchase.id); }}
            className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[#FF3B30] hover:underline">
            <Trash2 size={12} /> Excluir compra
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Compras() {
  const { purchases, deletePurchase, equipment, outings, activeOutings } = useApp();
  const [showNew, setShowNew]       = useState(false);
  const [showAI, setShowAI]         = useState(false);
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return purchases
      .filter((p) => {
        if (dateFrom && p.date < dateFrom) return false;
        if (dateTo   && p.date > dateTo)   return false;
        if (search) {
          const q = search.toLowerCase();
          const inLocation = (p.location || '').toLowerCase().includes(q);
          const inLines    = (p.lines || []).some((l) => (l.name || l.item || '').toLowerCase().includes(q));
          const inNotes    = (p.notes || '').toLowerCase().includes(q);
          if (!inLocation && !inLines && !inNotes) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, search, dateFrom, dateTo]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = thisMonth();
    const year = thisYear();
    let monthTotal = 0, yearTotal = 0, allTotal = 0;
    purchases.forEach((p) => {
      const t = p.grandTotal ?? (p.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);
      allTotal += t;
      if (p.date?.startsWith(year))  yearTotal  += t;
      if (p.date?.startsWith(now))   monthTotal += t;
    });
    return { monthTotal, yearTotal, allTotal };
  }, [purchases]);

  // Inventory value
  const inventoryValue = useMemo(() =>
    equipment.reduce((s, e) => s + e.quantity * (e.lastUnitPrice || 0), 0),
    [equipment]
  );

  // ── Frequency analysis ───────────────────────────────────────────────────────
  const frequency = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      (p.lines || []).forEach((l) => {
        const name = (l.name || l.item || '').trim();
        if (!name) return;
        if (!map[name]) map[name] = { name, count: 0, totalQty: 0, totalValue: 0 };
        map[name].count++;
        map[name].totalQty   += Number(l.qty) || 0;
        map[name].totalValue += (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [purchases]);

  // ── Spend by month ───────────────────────────────────────────────────────────
  const byMonth = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      const mk = monthKey(p.date);
      if (!mk) return;
      const t = p.grandTotal ?? (p.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);
      map[mk] = (map[mk] || 0) + t;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);
  }, [purchases]);

  function handleDelete(id) {
    if (window.confirm('Excluir esta compra? O estoque vinculado será revertido.')) {
      deletePurchase(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Compras</h1>
        <p className="text-[#6E6E73] text-[14px] mt-1">Registro de notas, controle de gastos e estoque</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Este mês',       value: fmtUSD(stats.monthTotal), color: 'text-[#1D1D1F]' },
          { label: 'Este ano',        value: fmtUSD(stats.yearTotal),  color: 'text-[#0071E3]' },
          { label: 'Total histórico', value: fmtUSD(stats.allTotal),   color: 'text-[#5E5CE6]' },
          { label: 'Valor em estoque',value: fmtUSD(inventoryValue),   color: 'text-[#34C759]' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-[18px] p-5 flex flex-col gap-2"
            style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
            <p className={`text-[26px] font-bold tracking-tight leading-none tabular-nums ${c.color}`}>{c.value}</p>
            <p className="text-[12px] text-[#6E6E73] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por local ou item…"
            className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] border border-[#E5E5EA] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 transition-all" />
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-[#AEAEB2]" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25" />
          <span className="text-[#AEAEB2] text-[12px]">até</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2.5 text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors"><X size={14} /></button>
          )}
        </div>
        <button
          onClick={() => exportComprasPDF(filtered, { search, dateFrom, dateTo })}
          className="flex items-center gap-1.5 bg-white border border-[#E5E5EA] text-[#6E6E73] px-3 py-2.5 rounded-xl text-[13px] font-medium hover:border-[#AEAEB2] transition-colors">
          <FileDown size={14} /> PDF
        </button>
        <button onClick={() => setShowAI(true)}
          className="flex items-center gap-1.5 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{background: 'linear-gradient(135deg,#5E5CE6 0%,#0071E3 100%)', boxShadow: '0 2px 8px rgba(94,92,230,0.30)'}}>
          <Sparkles size={14} /> Analisar com IA
        </button>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{background: 'linear-gradient(180deg,#34C759 0%,#28A745 100%)', boxShadow: '0 2px 8px rgba(52,199,89,0.30)'}}>
          <Plus size={14} /> Nova Compra
        </button>
      </div>

      {/* Purchase list */}
      <div className="bg-white rounded-[18px] overflow-hidden"
        style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
        {/* List header */}
        <div className="grid grid-cols-[96px_1fr_64px_96px_20px] gap-2 px-5 py-3 border-b border-[#F2F2F7] bg-[#F9F9F9]">
          {['Data', 'Local / Itens', 'Qtd', 'Total', ''].map((h, i) => (
            <span key={i} className={`text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wide ${i >= 2 ? 'text-right' : ''}`}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="text-[#AEAEB2] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#6E6E73]">Nenhuma compra encontrada</p>
            <p className="text-[12px] text-[#AEAEB2] mt-1">
              {purchases.length === 0 ? 'Registre sua primeira nota fiscal.' : 'Ajuste os filtros de busca.'}
            </p>
          </div>
        ) : (
          filtered.map((p) => <PurchaseRow key={p.id} purchase={p} onDelete={handleDelete} outings={outings} />)
        )}
      </div>

      {/* Analysis section */}
      <div className="bg-white rounded-[18px] overflow-hidden"
        style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
        <button
          className="w-full px-6 pt-5 pb-4 flex items-center gap-3 border-b border-[#F2F2F7] text-left"
          onClick={() => setShowAnalysis((v) => !v)}>
          <div className="w-8 h-8 bg-[#F2EEFF] rounded-xl flex items-center justify-center">
            <BarChart2 size={15} className="text-[#5E5CE6]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">Análise de Frequência</h2>
            <p className="text-[12px] text-[#6E6E73]">O que é comprado com mais frequência</p>
          </div>
          {showAnalysis ? <ChevronUp size={16} className="text-[#AEAEB2]" /> : <ChevronDown size={16} className="text-[#AEAEB2]" />}
        </button>

        {showAnalysis && (
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Top items by frequency */}
            <div>
              <h3 className="text-[13px] font-semibold text-[#1D1D1F] mb-3 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#5E5CE6]" /> Mais comprados (por vezes)
              </h3>
              {frequency.length === 0 ? (
                <p className="text-[12px] text-[#AEAEB2]">Sem dados ainda.</p>
              ) : (
                <div className="space-y-2">
                  {frequency.slice(0, 8).map((item, i) => {
                    const maxCount = frequency[0].count;
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#1D1D1F] font-medium truncate max-w-[55%]">{item.name}</span>
                          <span className="text-[#AEAEB2] tabular-nums">{item.count}× · {item.totalQty} un.</span>
                        </div>
                        <div className="h-[5px] bg-[#F2F2F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#5E5CE6] rounded-full" style={{width: `${(item.count / maxCount) * 100}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top items by value */}
            <div>
              <h3 className="text-[13px] font-semibold text-[#1D1D1F] mb-3 flex items-center gap-1.5">
                <DollarSign size={13} className="text-[#34C759]" /> Maior gasto acumulado
              </h3>
              {frequency.length === 0 ? (
                <p className="text-[12px] text-[#AEAEB2]">Sem dados ainda.</p>
              ) : (
                <div className="space-y-2">
                  {[...frequency].sort((a, b) => b.totalValue - a.totalValue).slice(0, 8).map((item) => {
                    const maxVal = [...frequency].sort((a, b) => b.totalValue - a.totalValue)[0].totalValue;
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#1D1D1F] font-medium truncate max-w-[55%]">{item.name}</span>
                          <span className="text-[#AEAEB2] tabular-nums">{fmtUSD(item.totalValue)}</span>
                        </div>
                        <div className="h-[5px] bg-[#F2F2F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#34C759] rounded-full" style={{width: maxVal > 0 ? `${(item.totalValue / maxVal) * 100}%` : '0%'}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Spend by month */}
            {byMonth.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-[13px] font-semibold text-[#1D1D1F] mb-3 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#FF9500]" /> Gasto por mês
                </h3>
                <div className="space-y-2">
                  {byMonth.map(([mk, total]) => {
                    const maxMonth = Math.max(...byMonth.map(([, t]) => t));
                    const [year, month] = mk.split('-');
                    const label = new Date(Number(year), Number(month) - 1, 1)
                      .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    return (
                      <div key={mk}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-[#1D1D1F] font-medium capitalize">{label}</span>
                          <span className="text-[#AEAEB2] tabular-nums">{fmtUSD(total)}</span>
                        </div>
                        <div className="h-[5px] bg-[#F2F2F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FF9500] rounded-full" style={{width: `${(total / maxMonth) * 100}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNew && <NewPurchaseModal onClose={() => setShowNew(false)} />}
      {showAI  && <AIAssistant onClose={() => setShowAI(false)} />}
    </div>
  );
}
