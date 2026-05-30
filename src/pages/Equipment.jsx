import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/initialData';
import { Plus, Minus, Trash2, Search, FileDown, Pencil, X, Settings, ScanLine } from 'lucide-react';
import { exportEquipmentPDF } from '../utils/pdf';
import ReceiptScanner from '../components/ReceiptScanner';

// ─── Group Manager Modal ───────────────────────────────────────────────────────
function GroupManager({ onClose }) {
  const { groups, addGroup, deleteGroup, renameGroup } = useApp();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (newName.trim()) { addGroup(newName.trim()); setNewName(''); }
  }

  function handleRename(e) {
    e.preventDefault();
    if (editName.trim()) { renameGroup(editing, editName.trim()); setEditing(null); }
  }

  const fixed = ['campo', 'mecanica'];
  const inputClass = "bg-apple-bg border border-apple-border rounded-apple px-3 py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-sm">
        <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between">
          <h2 className="font-semibold text-apple-text">Gerenciar Grupos</h2>
          <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-2.5">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              {editing === g.id ? (
                <form onSubmit={handleRename} className="flex gap-2 flex-1">
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className={`flex-1 ${inputClass}`} />
                  <button type="submit" className="bg-apple-blue text-white px-3 py-1.5 rounded-apple text-sm font-medium">OK</button>
                  <button type="button" onClick={() => setEditing(null)} className="bg-apple-bg border border-apple-border px-3 py-1.5 rounded-apple text-sm text-apple-text">✕</button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-apple-text">{g.name}</span>
                  {!fixed.includes(g.id) ? (
                    <>
                      <button onClick={() => { setEditing(g.id); setEditName(g.name); }}
                        className="text-apple-text-2 hover:text-apple-blue transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => deleteGroup(g.id)}
                        className="text-apple-text-2 hover:text-apple-red transition-colors"><Trash2 size={15} /></button>
                    </>
                  ) : (
                    <span className="text-xs text-apple-text-3 px-2">padrão</span>
                  )}
                </>
              )}
            </div>
          ))}

          <form onSubmit={handleAdd} className="flex gap-2 pt-2 border-t border-apple-border">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do novo grupo..."
              className={`flex-1 ${inputClass}`} />
            <button type="submit" className="bg-apple-blue text-white px-4 py-2 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover transition-colors">
              + Criar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Photo Input ───────────────────────────────────────────────────────────────
function PhotoInput({ current, onChange }) {
  const [preview, setPreview] = useState(current || null);
  function handle(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); onChange(ev.target.result); };
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <label className="block text-sm font-medium text-apple-text mb-1.5">Foto</label>
      <input type="file" accept="image/*" onChange={handle} className="text-sm w-full text-apple-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-apple file:border-0 file:text-xs file:font-medium file:bg-apple-bg file:text-apple-text hover:file:bg-apple-border/30" />
      {preview && <img src={preview} alt="" className="mt-2 h-28 w-full object-cover rounded-apple border border-apple-border" />}
    </div>
  );
}

// ─── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ defaultGroupId, onClose }) {
  const { addEquipment, groups } = useApp();
  const [form, setForm] = useState({ name: '', description: '', category: '', quantity: 1, photo: null, groupId: defaultGroupId || groups[0]?.id || 'campo' });

  function handleSubmit(e) {
    e.preventDefault();
    addEquipment({ ...form, quantity: Number(form.quantity) });
    onClose();
  }

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between">
          <h2 className="font-semibold text-apple-text">Adicionar Equipamento</h2>
          <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoInput current={null} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Categoria</label>
            <input list="categories-add" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            <datalist id="categories-add">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Grupo</label>
            <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} className={inputClass}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Quantidade inicial</label>
            <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple transition-all">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ item, onClose }) {
  const { updateEquipment, groups } = useApp();
  const [form, setForm] = useState({
    name: item.name,
    description: item.description || '',
    category: item.category || '',
    photo: item.photo || null,
    groupId: item.groupId || 'campo',
  });

  function handleSubmit(e) {
    e.preventDefault();
    updateEquipment(item.id, form);
    onClose();
  }

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between">
          <h2 className="font-semibold text-apple-text">Editar — {item.name}</h2>
          <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoInput current={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`} rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Categoria</label>
            <input list="categories-edit" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            <datalist id="categories-edit">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-apple-text mb-1.5">Grupo</label>
            <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} className={inputClass}>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple transition-all">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onEdit, onDelete, currentUser, adjustStock }) {
  const available = item.quantity - item.inUse;
  const pct = item.quantity > 0 ? Math.round((item.inUse / item.quantity) * 100) : 0;
  const [adjQty, setAdjQty] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {item.photo ? (
          <img src={item.photo} alt={item.name} className="w-full h-52 object-cover rounded-t-apple-lg" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-apple-blue/8 to-apple-blue/15 rounded-t-apple-lg flex items-center justify-center">
            <span className="text-6xl opacity-20">📦</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.category && (
                <span className="text-xs bg-apple-blue/10 text-apple-blue px-2.5 py-0.5 rounded-full font-medium">{item.category}</span>
              )}
              <h2 className="text-xl font-semibold text-apple-text mt-1">{item.name}</h2>
            </div>
            <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors mt-1"><X size={20} /></button>
          </div>

          {item.description && <p className="text-sm text-apple-text-2 leading-relaxed">{item.description}</p>}

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-apple-bg rounded-apple py-4">
              <p className="text-3xl font-semibold text-apple-text">{item.quantity}</p>
              <p className="text-xs text-apple-text-2 mt-1">Total</p>
            </div>
            <div className="bg-apple-orange/8 rounded-apple py-4">
              <p className="text-3xl font-semibold text-apple-orange">{item.inUse}</p>
              <p className="text-xs text-apple-orange/70 mt-1">Em uso</p>
            </div>
            <div className={`rounded-apple py-4 ${available === 0 ? 'bg-apple-red/8' : 'bg-apple-green/8'}`}>
              <p className={`text-3xl font-semibold ${available === 0 ? 'text-apple-red' : 'text-apple-green'}`}>{available}</p>
              <p className={`text-xs mt-1 ${available === 0 ? 'text-apple-red/70' : 'text-apple-green/70'}`}>Disponível</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-apple-text-2 mb-1.5">
              <span>Taxa de uso</span><span>{pct}%</span>
            </div>
            <div className="h-2 bg-apple-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-apple-red' : pct >= 50 ? 'bg-apple-orange' : 'bg-apple-green'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-apple-text-2 uppercase tracking-wider mb-1.5">Ajustar Estoque</p>
            <p className="text-xs text-apple-text-3 mb-2.5">Digite a quantidade a ser adicionada ou retirada</p>
            <input
              type="number"
              min={1}
              placeholder="Quantidade"
              value={adjQty}
              onChange={e => setAdjQty(e.target.value)}
              className="w-full text-center bg-apple-bg border border-apple-border rounded-apple py-2.5 text-base text-apple-text placeholder:text-apple-text-3 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all mb-3"
            />
            <div className="flex gap-3">
              <button onClick={() => { const n = Math.max(1, Number(adjQty) || 1); adjustStock(item.id, -n); }}
                disabled={item.quantity - Math.max(1, Number(adjQty)||1) < item.inUse}
                className="flex-1 flex items-center justify-center gap-2 border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Minus size={15} /> Retirar
              </button>
              <button onClick={() => { const n = Math.max(1, Number(adjQty) || 1); adjustStock(item.id, n); }}
                className="flex-1 flex items-center justify-center gap-2 border border-apple-blue/40 text-apple-blue py-2.5 rounded-apple text-sm font-medium hover:bg-apple-blue/5 transition-colors">
                <Plus size={15} /> Adicionar
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1 border-t border-apple-border">
            <button onClick={() => { onClose(); onEdit(item); }}
              className="flex-1 flex items-center justify-center gap-2 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
              <Pencil size={14} /> Editar
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => { onClose(); onDelete(item); }}
                className="flex-1 flex items-center justify-center gap-2 border border-apple-red/30 text-apple-red py-2.5 rounded-apple text-sm font-medium hover:bg-apple-red/5 transition-colors">
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ item, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-apple-text mb-2">Excluir Equipamento</h2>
        {item.inUse > 0 ? (
          <p className="text-sm text-apple-text-2 mb-5">
            Este item possui <span className="font-semibold text-apple-orange">{item.inUse} unidade(s) em uso</span>. Deseja excluir mesmo assim?
          </p>
        ) : (
          <p className="text-sm text-apple-text-2 mb-5">Tem certeza que deseja excluir <strong className="text-apple-text">{item.name}</strong>?</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-apple-red text-white py-2.5 rounded-apple text-sm font-semibold hover:opacity-90 shadow-apple transition-all">Excluir</button>
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

  const groupEquipment = equipment.filter((e) => (e.groupId || 'campo') === activeGroup);
  const categories = [...new Set(groupEquipment.map((e) => e.category).filter(Boolean))].sort();
  const filtered = groupEquipment.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  function handleDelete(item) {
    deleteEquipment(item.id);
    setDeleteTarget(null);
  }

  const detailItem = detailTarget ? equipment.find((e) => e.id === detailTarget.id) : null;

  const filterInputClass = "bg-apple-bg border border-apple-border rounded-apple px-3 py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Equipamentos</h1>
          <p className="text-apple-text-2 text-sm mt-0.5">{equipment.length} itens cadastrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-apple-bg border border-apple-border text-apple-text px-3 py-2 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
            <ScanLine size={15} /> Ler Nota
          </button>
          <button onClick={() => exportEquipmentPDF(equipment)}
            className="flex items-center gap-2 bg-apple-bg border border-apple-border text-apple-text px-3 py-2 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
            <FileDown size={15} /> PDF
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-apple-blue hover:bg-apple-blue-hover text-white px-4 py-2 rounded-apple text-sm font-semibold shadow-apple transition-all">
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((g) => (
          <button key={g.id} onClick={() => { setActiveGroup(g.id); setCatFilter(''); setSearch(''); }}
            className={`px-4 py-2 rounded-apple text-sm font-medium transition-all ${
              activeGroup === g.id
                ? 'bg-apple-blue text-white shadow-apple'
                : 'bg-apple-card border border-apple-border text-apple-text-2 hover:border-apple-blue/40 hover:text-apple-blue'
            }`}>
            {g.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeGroup === g.id ? 'bg-white/20 text-white' : 'bg-apple-bg text-apple-text-3'
            }`}>
              {equipment.filter((e) => (e.groupId || 'campo') === g.id).length}
            </span>
          </button>
        ))}
        {currentUser?.role === 'admin' && (
          <button onClick={() => setShowGroupManager(true)}
            className="px-3 py-2 rounded-apple text-sm text-apple-text-3 hover:text-apple-text-2 border border-dashed border-apple-border hover:border-apple-blue/30 flex items-center gap-1.5 transition-colors">
            <Settings size={13} /> Grupos
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-text-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar equipamento..."
            className={`${filterInputClass} pl-9`} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={filterInputClass}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const available = item.quantity - item.inUse;
          return (
            <div key={item.id}
              className="bg-apple-card rounded-apple shadow-apple-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-apple hover:-translate-y-0.5 transition-all"
              onClick={() => setDetailTarget(item)}>
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 bg-gradient-to-br from-apple-blue/6 to-apple-blue/12 flex items-center justify-center">
                  <span className="text-4xl opacity-20">📦</span>
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                  {item.category && (
                    <span className="text-xs bg-apple-blue/10 text-apple-blue px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                  )}
                  <h3 className="font-semibold text-apple-text mt-1 text-sm">{item.name}</h3>
                  {item.description && <p className="text-xs text-apple-text-2 mt-0.5 line-clamp-2">{item.description}</p>}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                  <div className="bg-apple-bg rounded-apple py-2">
                    <p className="font-semibold text-apple-text">{item.quantity}</p>
                    <p className="text-apple-text-3">Total</p>
                  </div>
                  <div className="bg-apple-orange/8 rounded-apple py-2">
                    <p className="font-semibold text-apple-orange">{item.inUse}</p>
                    <p className="text-apple-orange/60">Em uso</p>
                  </div>
                  <div className={`rounded-apple py-2 ${available === 0 ? 'bg-apple-red/8' : 'bg-apple-green/8'}`}>
                    <p className={`font-semibold ${available === 0 ? 'text-apple-red' : 'text-apple-green'}`}>{available}</p>
                    <p className={available === 0 ? 'text-apple-red/60' : 'text-apple-green/60'}>Disp.</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setEditTarget(item)}
                    className="flex-1 flex items-center justify-center gap-1 bg-apple-bg border border-apple-border text-apple-text-2 py-1.5 rounded-apple text-xs font-medium hover:bg-apple-border/30 transition-colors">
                    <Pencil size={12} /> Editar
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => setDeleteTarget(item)}
                      className="flex items-center justify-center px-3 border border-apple-red/25 text-apple-red py-1.5 rounded-apple text-xs hover:bg-apple-red/5 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-apple-card rounded-apple shadow-apple-sm p-16 text-center">
          <p className="text-apple-text font-medium">Nenhum equipamento neste grupo.</p>
          <button onClick={() => setShowAdd(true)} className="mt-2 text-sm text-apple-blue hover:underline font-medium">
            + Adicionar equipamento
          </button>
        </div>
      )}

      {showAdd && <AddModal defaultGroupId={activeGroup} onClose={() => setShowAdd(false)} />}
      {editTarget && <EditModal item={editTarget} onClose={() => setEditTarget(null)} />}
      {showGroupManager && <GroupManager onClose={() => setShowGroupManager(false)} />}
      {showScanner && <ReceiptScanner onClose={() => setShowScanner(false)} />}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailTarget(null)} onEdit={setEditTarget}
          onDelete={setDeleteTarget} currentUser={currentUser} adjustStock={adjustStock} />
      )}
      {deleteTarget && (
        <DeleteConfirm item={deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
