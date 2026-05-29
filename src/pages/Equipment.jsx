import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/initialData';
import { Plus, Minus, Trash2, Search, FileDown, Pencil, X } from 'lucide-react';
import { exportEquipmentPDF } from '../utils/pdf';

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
      <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
      <input type="file" accept="image/*" onChange={handle} className="text-sm w-full" />
      {preview && <img src={preview} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border" />}
    </div>
  );
}

function AddModal({ onClose }) {
  const { addEquipment } = useApp();
  const [form, setForm] = useState({ name: '', description: '', category: '', quantity: 1, photo: null });

  function handleSubmit(e) {
    e.preventDefault();
    addEquipment({ ...form, quantity: Number(form.quantity) });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Adicionar Equipamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoInput current={null} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input list="categories-add" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <datalist id="categories-add">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade inicial</label>
            <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ item, onClose }) {
  const { updateEquipment } = useApp();
  const [form, setForm] = useState({
    name: item.name,
    description: item.description || '',
    category: item.category || '',
    photo: item.photo || null,
  });

  function handleSubmit(e) {
    e.preventDefault();
    updateEquipment(item.id, form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Editar — {item.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PhotoInput current={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input list="categories-edit" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <datalist id="categories-edit">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose, onEdit, onDelete, currentUser, adjustStock }) {
  const available = item.quantity - item.inUse;
  const pct = item.quantity > 0 ? Math.round((item.inUse / item.quantity) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Foto */}
        {item.photo ? (
          <img src={item.photo} alt={item.name} className="w-full h-56 object-cover rounded-t-2xl" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-2xl flex items-center justify-center">
            <span className="text-6xl text-blue-200">📦</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.category && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.category}</span>
              )}
              <h2 className="text-xl font-bold text-gray-800 mt-1">{item.name}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1"><X size={20} /></button>
          </div>

          {/* Descrição */}
          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl py-4">
              <p className="text-3xl font-bold text-gray-800">{item.quantity}</p>
              <p className="text-xs text-gray-500 mt-1">Total em estoque</p>
            </div>
            <div className="bg-orange-50 rounded-xl py-4">
              <p className="text-3xl font-bold text-orange-600">{item.inUse}</p>
              <p className="text-xs text-orange-400 mt-1">Em uso</p>
            </div>
            <div className={`rounded-xl py-4 ${available === 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-3xl font-bold ${available === 0 ? 'text-red-600' : 'text-green-600'}`}>{available}</p>
              <p className={`text-xs mt-1 ${available === 0 ? 'text-red-400' : 'text-green-400'}`}>Disponível</p>
            </div>
          </div>

          {/* Barra de uso */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Taxa de uso</span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Ações de estoque */}
          <div className="flex gap-3">
            <button
              onClick={() => adjustStock(item.id, -1)}
              disabled={item.quantity <= item.inUse}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={16} /> Remover do estoque
            </button>
            <button
              onClick={() => adjustStock(item.id, 1)}
              className="flex-1 flex items-center justify-center gap-2 border border-blue-300 text-blue-700 py-2.5 rounded-xl text-sm hover:bg-blue-50"
            >
              <Plus size={16} /> Adicionar ao estoque
            </button>
          </div>

          {/* Editar / Excluir */}
          <div className="flex gap-3 pt-1 border-t">
            <button
              onClick={() => { onClose(); onEdit(item); }}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:bg-gray-50"
            >
              <Pencil size={15} /> Editar
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { onClose(); onDelete(item); }}
                className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2 rounded-xl text-sm hover:bg-red-50"
              >
                <Trash2 size={15} /> Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ item, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Excluir Equipamento</h2>
        {item.inUse > 0 ? (
          <p className="text-sm text-gray-600 mb-4">
            Este item possui <span className="font-semibold text-orange-600">{item.inUse} unidade(s) em uso</span>. Deseja excluir mesmo assim?
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja excluir <strong>{item.name}</strong>?</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700">Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function Equipment() {
  const { equipment, adjustStock, deleteEquipment, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = [...new Set(equipment.map((e) => e.category).filter(Boolean))].sort();

  const filtered = equipment.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  function handleDelete(item) {
    deleteEquipment(item.id);
    setDeleteTarget(null);
  }

  // Sync detail view when equipment changes (e.g. after adjustStock)
  const detailItem = detailTarget ? equipment.find((e) => e.id === detailTarget.id) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Equipamentos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportEquipmentPDF(equipment)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar equipamento..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const available = item.quantity - item.inUse;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => setDetailTarget(item)}
            >
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <span className="text-4xl text-blue-200">📦</span>
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                  {item.category && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.category}</span>
                  )}
                  <h3 className="font-semibold text-gray-800 mt-1">{item.name}</h3>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                  <div className="bg-gray-50 rounded-lg py-1.5">
                    <p className="font-semibold text-gray-800">{item.quantity}</p>
                    <p className="text-gray-500">Total</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg py-1.5">
                    <p className="font-semibold text-orange-700">{item.inUse}</p>
                    <p className="text-orange-500">Em uso</p>
                  </div>
                  <div className={`rounded-lg py-1.5 ${available === 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`font-semibold ${available === 0 ? 'text-red-700' : 'text-green-700'}`}>{available}</p>
                    <p className={available === 0 ? 'text-red-400' : 'text-green-500'}>Disponível</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => adjustStock(item.id, -1)}
                    disabled={item.quantity <= item.inUse}
                    className="flex-1 flex items-center justify-center border border-gray-300 text-gray-700 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => adjustStock(item.id, 1)}
                    className="flex-1 flex items-center justify-center border border-blue-300 text-blue-700 py-1.5 rounded-lg text-sm hover:bg-blue-50"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setEditTarget(item)}
                    className="flex items-center justify-center px-2 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="flex items-center justify-center px-2 border border-red-300 text-red-600 py-1.5 rounded-lg text-sm hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nenhum equipamento encontrado.</p>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      {editTarget && <EditModal item={editTarget} onClose={() => setEditTarget(null)} />}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailTarget(null)}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          currentUser={currentUser}
          adjustStock={adjustStock}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
