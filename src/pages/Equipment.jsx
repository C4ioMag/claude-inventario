import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/initialData';
import { Plus, Minus, Trash2, Search, FileDown, Pencil, X, Settings, ScanLine, Package, RotateCcw, Flame } from 'lucide-react';
import { exportEquipmentPDF } from '../utils/pdf';
import ReceiptScanner from '../components/ReceiptScanner';

function TypeToggle({ value, onChange }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5 ml-0.5">Tipo de item</label>
      <div className="flex rounded-xl overflow-hidden border border-[#E5E5EA]">
        <button type="button" onClick={() => onChange('returnable')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors ${
            value !== 'consumable' ? 'bg-[#0071E3] text-white' : 'bg-white text-[#6E6E73] hover:bg-[#F2F2F7]'
          }`}>
          <RotateCcw size={13} /> Retornável
        </button>
        <button type="button" onClick={() => onChange('consumable')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors border-l border-[#E5E5EA] ${
            value === 'consumable' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#6E6E73] hover:bg-[#F2F2F7]'
          }`}>
          <Flame size={13} /> Consumível
        </button>
      </div>
      <p className="text-[11px] text-[#AEAEB2] mt-1.5 ml-0.5">
        {value === 'consumable'
          ? 'Baixa imediata ao sair — peças, materiais, cabos.'
          : 'Deve ser devolvido — ferramentas, máquinas, equipamentos.'}
      </p>
    </div>
  );
}

const MODAL_SHADOW = '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)';

// ─── Shared input class ────────────────────────────────────────────────────────
const ic = 'w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[14px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 focus:bg-white transition-all duration-200 border-0';

// ─── Label ─────────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5 ml-0.5">{children}</label>;
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function ModalWrap({ children, onClose, maxW = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className={`bg-white w-full ${maxW} max-h-[92vh] overflow-y-auto sm:rounded-[22px] rounded-t-[22px]`}
        style={{boxShadow: MODAL_SHADOW}}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="px-6 py-5 flex items-center justify-between border-b border-[#F2F2F7] sticky top-0 bg-white z-10">
      <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">{title}</h2>
      <button onClick={onClose}
        className="w-7 h-7 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full flex items-center justify-center text-[#6E6E73] transition-colors">
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Group Manager ─────────────────────────────────────────────────────────────
function GroupManager({ onClose }) {
  const { groups, addGroup, deleteGroup, renameGroup } = useApp();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const fixed = ['campo', 'mecanica'];

  return (
    <ModalWrap onClose={onClose} maxW="max-w-sm">
      <ModalHeader title="Gerenciar Grupos" onClose={onClose} />
      <div className="p-6 space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-2 py-1">
            {editing === g.id ? (
              <form onSubmit={e => { e.preventDefault(); if (editName.trim()) { renameGroup(editing, editName.trim()); setEditing(null); }}}
                className="flex gap-2 flex-1">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={`flex-1 ${ic}`} style={{padding: '8px 14px'}} />
                <button type="submit" className="bg-[#0071E3] text-white px-3 py-2 rounded-xl text-[13px] font-medium">OK</button>
                <button type="button" onClick={() => setEditing(null)} className="bg-[#F2F2F7] px-3 py-2 rounded-xl text-[13px] text-[#1D1D1F]">✕</button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-[14px] font-medium text-[#1D1D1F]">{g.name}</span>
                {!fixed.includes(g.id) ? (
                  <>
                    <button onClick={() => { setEditing(g.id); setEditName(g.name); }}
                      className="text-[#AEAEB2] hover:text-[#0071E3] transition-colors p-1"><Pencil size={14} /></button>
                    <button onClick={() => deleteGroup(g.id)}
                      className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors p-1"><Trash2 size={14} /></button>
                  </>
                ) : (
                  <span className="text-[11px] text-[#AEAEB2] px-2 py-0.5 bg-[#F2F2F7] rounded-full">padrão</span>
                )}
              </>
            )}
          </div>
        ))}
        <form onSubmit={e => { e.preventDefault(); if (newName.trim()) { addGroup(newName.trim()); setNewName(''); }}}
          className="flex gap-2 pt-4 mt-2 border-t border-[#F2F2F7]">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do novo grupo…" className={`flex-1 ${ic}`} />
          <button type="submit" className="bg-[#0071E3] text-white px-4 py-3 rounded-xl text-[13px] font-semibold hover:bg-[#0077ED] transition-colors whitespace-nowrap">
            + Criar
          </button>
        </form>
      </div>
    </ModalWrap>
  );
}

// ─── Photo Input ───────────────────────────────────────────────────────────────
function PhotoInput({ current, onChange }) {
  const [preview, setPreview] = useState(current || null);
  function handle(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); onChange(ev.target.result); };
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <Label>Foto</Label>
      <label className="block border-2 border-dashed border-[#E5E5EA] hover:border-[#0071E3]/40 rounded-xl overflow-hidden cursor-pointer transition-colors">
        <input type="file" accept="image/*" onChange={handle} className="hidden" />
        {preview ? (
          <img src={preview} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-1">
            <Package size={22} className="text-[#AEAEB2]" />
            <span className="text-[12px] text-[#AEAEB2]">Clique para adicionar foto</span>
          </div>
        )}
      </label>
    </div>
  );
}

// ─── Shared form fields ────────────────────────────────────────────────────────
function ItemForm({ form, setForm, groups, datalistId }) {
  return (
    <>
      <div>
        <Label>Nome *</Label>
        <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={ic} placeholder="Ex: Cabo de fibra óptica" />
      </div>
      <div>
        <Label>Descrição</Label>
        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
          className={`${ic} resize-none`} style={{minHeight: 80}} placeholder="Detalhes sobre o item…" />
      </div>
      <div>
        <Label>Categoria</Label>
        <input list={datalistId} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={ic} placeholder="Ex: Cabos" />
        <datalist id={datalistId}>{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
      </div>
      <div>
        <Label>Grupo</Label>
        <select value={form.groupId} onChange={e => setForm(f => ({...f, groupId: e.target.value}))} className={ic}>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
    </>
  );
}

// ─── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ defaultGroupId, onClose }) {
  const { addEquipment, groups } = useApp();
  const [form, setForm] = useState({ name: '', description: '', category: '', quantity: 1, photo: null, groupId: defaultGroupId || groups[0]?.id || 'campo', type: 'returnable' });

  function handleSubmit(e) {
    e.preventDefault();
    addEquipment({ ...form, quantity: Number(form.quantity) });
    onClose();
  }

  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="Adicionar Equipamento" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <PhotoInput current={null} onChange={v => setForm(f => ({...f, photo: v}))} />
        <TypeToggle value={form.type} onChange={v => setForm(f => ({...f, type: v}))} />
        <ItemForm form={form} setForm={setForm} groups={groups} datalistId="cats-add" />
        <div>
          <Label>Quantidade inicial</Label>
          <input type="number" min={0} value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} className={ic} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors active:scale-[0.98]">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 text-white py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
            style={{background: 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.30)'}}>
            Adicionar
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onDelete, currentUser }) {
  const { updateEquipment, groups } = useApp();
  const [form, setForm] = useState({
    name: item.name, description: item.description || '',
    category: item.category || '', photo: item.photo || null, groupId: item.groupId || 'campo',
    type: item.type || 'returnable',
  });

  function handleSubmit(e) {
    e.preventDefault();
    updateEquipment(item.id, form);
    onClose();
  }

  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title={`Editar — ${item.name}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <PhotoInput current={form.photo} onChange={v => setForm(f => ({...f, photo: v}))} />
        <TypeToggle value={form.type} onChange={v => setForm(f => ({...f, type: v}))} />
        <ItemForm form={form} setForm={setForm} groups={groups} datalistId="cats-edit" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors active:scale-[0.98]">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 text-white py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
            style={{background: 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.30)'}}>
            Salvar
          </button>
        </div>
        {currentUser?.role === 'admin' && (
          <button type="button" onClick={() => { onClose(); onDelete(item); }}
            className="w-full py-2.5 rounded-xl text-[13px] font-medium text-[#FF3B30] hover:bg-[#FFF2F1] transition-colors">
            Excluir equipamento
          </button>
        )}
      </form>
    </ModalWrap>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onEdit, adjustStock }) {
  const available = item.quantity - item.inUse;
  const pct = item.quantity > 0 ? Math.round((item.inUse / item.quantity) * 100) : 0;
  const [adjQty, setAdjQty] = useState('');

  return (
    <ModalWrap onClose={onClose} maxW="max-w-lg">
      {item.photo ? (
        <img src={item.photo} alt={item.name} className="w-full h-56 object-cover sm:rounded-t-[22px]" />
      ) : (
        <div className="w-full h-44 sm:rounded-t-[22px] flex items-center justify-center"
          style={{background: 'linear-gradient(135deg, #EAF4FF 0%, #D6EAFF 100%)'}}>
          <Package size={48} className="text-[#0071E3]/20" />
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            {item.category && (
              <span className="text-[11px] font-semibold text-[#0071E3] bg-[#EAF4FF] px-2.5 py-1 rounded-full uppercase tracking-wide">
                {item.category}
              </span>
            )}
            <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight mt-1.5">{item.name}</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full flex items-center justify-center text-[#6E6E73] transition-colors flex-shrink-0 mt-1">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {item.description && (
          <p className="text-[14px] text-[#6E6E73] leading-relaxed -mt-2">{item.description}</p>
        )}

        {/* Stats */}
        <div className="flex rounded-2xl overflow-hidden border border-[#F2F2F7]">
          <div className="flex-1 py-4 text-center">
            <p className="text-[28px] font-bold text-[#1D1D1F] leading-none tabular-nums">{item.quantity}</p>
            <p className="text-[11px] text-[#AEAEB2] font-medium mt-1.5 uppercase tracking-wider">Total</p>
          </div>
          <div className="w-px bg-[#F2F2F7]" />
          <div className="flex-1 py-4 text-center">
            <p className="text-[28px] font-bold text-[#FF9500] leading-none tabular-nums">{item.inUse}</p>
            <p className="text-[11px] text-[#AEAEB2] font-medium mt-1.5 uppercase tracking-wider">Em uso</p>
          </div>
          <div className="w-px bg-[#F2F2F7]" />
          <div className="flex-1 py-4 text-center">
            <p className={`text-[28px] font-bold leading-none tabular-nums ${available === 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>{available}</p>
            <p className="text-[11px] text-[#AEAEB2] font-medium mt-1.5 uppercase tracking-wider">Livre</p>
          </div>
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex justify-between text-[12px] mb-2">
            <span className="text-[#AEAEB2] font-medium">Taxa de uso</span>
            <span className="text-[#6E6E73] font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="h-[6px] bg-[#F2F2F7] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{width: `${pct}%`, background: pct >= 90 ? '#FF3B30' : pct >= 60 ? '#FF9500' : '#34C759'}} />
          </div>
        </div>

        {/* Adjust stock */}
        <div>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-1">Ajustar Estoque</p>
          <p className="text-[12px] text-[#AEAEB2] mb-3">Digite a quantidade a ser adicionada ou retirada</p>
          <input type="number" min={1} placeholder="Quantidade" value={adjQty}
            onChange={e => setAdjQty(e.target.value)}
            className="w-full text-center rounded-xl py-3 text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/25 focus:bg-white transition-all duration-200 mb-3 bg-[#F2F2F7] border-0"
          />
          <div className="flex gap-2.5">
            <button onClick={() => { const n = Math.max(1, Number(adjQty)||1); adjustStock(item.id, -n); }}
              disabled={item.quantity - Math.max(1, Number(adjQty)||1) < item.inUse}
              className="flex-1 flex items-center justify-center gap-2 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.97]">
              <Minus size={15} /> Retirar
            </button>
            <button onClick={() => { const n = Math.max(1, Number(adjQty)||1); adjustStock(item.id, n); }}
              className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.97]"
              style={{background: 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.30)'}}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>

        {/* Edit */}
        <button onClick={() => { onClose(); onEdit(item); }}
          className="w-full flex items-center justify-center gap-2 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors active:scale-[0.98]">
          <Pencil size={14} /> Editar
        </button>
      </div>
    </ModalWrap>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ item, onConfirm, onClose }) {
  return (
    <ModalWrap onClose={onClose} maxW="max-w-sm">
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-[#FFF2F1] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-[#FF3B30]" />
        </div>
        <h2 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">Excluir Equipamento</h2>
        {item.inUse > 0 ? (
          <p className="text-[14px] text-[#6E6E73] mb-6">
            Este item tem <strong className="text-[#FF9500]">{item.inUse} un. em uso</strong>. Deseja excluir mesmo assim?
          </p>
        ) : (
          <p className="text-[14px] text-[#6E6E73] mb-6">Tem certeza que deseja excluir <strong className="text-[#1D1D1F]">{item.name}</strong>?</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-[#FF3B30] text-white py-3 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-all">
            Excluir
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ─── Equipment Card ────────────────────────────────────────────────────────────
function EquipCard({ item, onClick }) {
  const available = item.quantity - item.inUse;
  return (
    <div className="bg-white rounded-[18px] overflow-hidden cursor-pointer group transition-all duration-300"
      style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}
      onClick={onClick}>

      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {item.photo ? (
          <img src={item.photo} alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{background: 'linear-gradient(135deg, #EAF4FF 0%, #D6EAFF 100%)'}}>
            <Package size={36} className="text-[#0071E3]/25" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute inset-0 flex items-end justify-between p-3 pointer-events-none">
          {item.category && (
            <span className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-full"
              style={{background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)'}}>
              {item.category}
            </span>
          )}
          {available === 0 && (
            <span className="text-[11px] font-semibold text-white bg-[#FF3B30] px-2.5 py-1 rounded-full ml-auto">
              Sem estoque
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-[14px] font-semibold text-[#1D1D1F] leading-tight truncate">{item.name}</h3>
          {item.type === 'consumable' ? (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#FFF2F1] text-[#FF3B30]">
              <Flame size={9} /> Consumível
            </span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EAF4FF] text-[#0071E3]">
              <RotateCcw size={9} /> Retornável
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[12px] text-[#AEAEB2] mt-0.5 line-clamp-1">{item.description}</p>
        )}

        {/* Stats */}
        <div className="flex mt-3 pt-3 border-t border-[#F2F2F7]">
          <div className="flex-1 text-center">
            <p className="text-[18px] font-bold text-[#1D1D1F] leading-none tabular-nums">{item.quantity}</p>
            <p className="text-[10px] text-[#AEAEB2] font-medium mt-1 uppercase tracking-wide">Total</p>
          </div>
          <div className="w-px bg-[#F2F2F7]" />
          {item.type !== 'consumable' && (
            <>
              <div className="flex-1 text-center">
                <p className="text-[18px] font-bold text-[#FF9500] leading-none tabular-nums">{item.inUse}</p>
                <p className="text-[10px] text-[#AEAEB2] font-medium mt-1 uppercase tracking-wide">Em uso</p>
              </div>
              <div className="w-px bg-[#F2F2F7]" />
            </>
          )}
          <div className="flex-1 text-center">
            <p className={`text-[18px] font-bold leading-none tabular-nums ${available === 0 ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>{available}</p>
            <p className="text-[10px] text-[#AEAEB2] font-medium mt-1 uppercase tracking-wide">Livre</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Equipment() {
  const { equipment, adjustStock, deleteEquipment, currentUser, groups } = useApp();
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id || 'campo');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const groupEquipment = equipment.filter(e => (e.groupId || 'campo') === activeGroup);
  const categories = [...new Set(groupEquipment.map(e => e.category).filter(Boolean))].sort();
  const filtered = groupEquipment.filter(e => {
    return e.name.toLowerCase().includes(search.toLowerCase()) && (!catFilter || e.category === catFilter);
  });

  const detailItem = detailTarget ? equipment.find(e => e.id === detailTarget.id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Equipamentos</h1>
          <p className="text-[#6E6E73] text-[14px] mt-0.5">{equipment.length} itens cadastrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-white border border-[#E5E5EA] text-[#1D1D1F] px-3.5 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#F2F2F7] transition-colors"
            style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}}>
            <ScanLine size={15} /> Ler Nota
          </button>
          <button onClick={() => exportEquipmentPDF(equipment)}
            className="flex items-center gap-2 bg-white border border-[#E5E5EA] text-[#1D1D1F] px-3.5 py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#F2F2F7] transition-colors"
            style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}}>
            <FileDown size={15} /> PDF
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97]"
            style={{background: 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.35)'}}>
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map(g => {
          const active = activeGroup === g.id;
          const count = equipment.filter(e => (e.groupId || 'campo') === g.id).length;
          return (
            <button key={g.id} onClick={() => { setActiveGroup(g.id); setCatFilter(''); setSearch(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all active:scale-[0.97]"
              style={active
                ? {background: 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)', color: 'white', boxShadow: '0 2px 8px rgba(0,113,227,0.30)'}
                : {background: 'white', color: '#6E6E73', border: '1px solid #E5E5EA', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}
              }>
              {g.name}
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold"
                style={active ? {background: 'rgba(255,255,255,0.22)', color: 'white'} : {background: '#F2F2F7', color: '#AEAEB2'}}>
                {count}
              </span>
            </button>
          );
        })}
        {currentUser?.role === 'admin' && (
          <button onClick={() => setShowGroupManager(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] text-[#AEAEB2] hover:text-[#6E6E73] border border-dashed border-[#E5E5EA] hover:border-[#C7C7CC] transition-colors">
            <Settings size={13} /> Grupos
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipamento…"
            className="w-full bg-white border border-[#E5E5EA] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
            style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white border border-[#E5E5EA] rounded-xl px-3.5 py-2.5 text-[13px] text-[#6E6E73] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
          style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04)'}}>
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-[18px] p-16 text-center"
          style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
          <Package size={36} className="text-[#AEAEB2] mx-auto mb-3" />
          <p className="text-[#1D1D1F] font-medium text-[15px]">Nenhum equipamento neste grupo</p>
          <button onClick={() => setShowAdd(true)}
            className="mt-3 text-[13px] text-[#0071E3] hover:underline font-medium">
            + Adicionar equipamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <EquipCard key={item.id} item={item} onClick={() => setDetailTarget(item)} />
          ))}
        </div>
      )}

      {showAdd       && <AddModal defaultGroupId={activeGroup} onClose={() => setShowAdd(false)} />}
      {editTarget    && <EditModal item={editTarget} onClose={() => setEditTarget(null)} onDelete={setDeleteTarget} currentUser={currentUser} />}
      {showGroupManager && <GroupManager onClose={() => setShowGroupManager(false)} />}
      {showScanner   && <ReceiptScanner onClose={() => setShowScanner(false)} />}
      {detailItem    && <DetailModal item={detailItem} onClose={() => setDetailTarget(null)} onEdit={setEditTarget} adjustStock={adjustStock} />}
      {deleteTarget  && <DeleteConfirm item={deleteTarget} onConfirm={() => { deleteEquipment(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
