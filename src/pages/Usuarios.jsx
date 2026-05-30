import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Plus, ShieldCheck, User } from 'lucide-react';

const DEFAULT_ADMIN_ID = 'admin-1';

export default function Usuarios() {
  const { users, addUser, deleteUser, currentUser } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });

  if (currentUser?.role !== 'admin') {
    return <p className="text-apple-text-2 p-8">Acesso restrito a administradores.</p>;
  }

  function handleAdd(e) {
    e.preventDefault();
    addUser(form);
    setForm({ name: '', email: '', password: '', role: 'user' });
    setShowAdd(false);
  }

  const inputClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-apple-text-2 text-sm mt-0.5">{users.length} {users.length === 1 ? 'usuário' : 'usuários'} cadastrados</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-apple-blue hover:bg-apple-blue-hover text-white px-4 py-2.5 rounded-apple text-sm font-semibold shadow-apple transition-all">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-apple-card rounded-apple shadow-apple-sm p-6 space-y-4">
          <h2 className="text-apple-text font-semibold">Adicionar Usuário</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Nome</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Senha</label>
              <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-text mb-1.5">Tipo</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={inputClass}>
                <option value="user">Usuário comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple transition-all">Adicionar</button>
          </div>
        </form>
      )}

      <div className="bg-apple-card rounded-apple shadow-apple-sm overflow-hidden">
        <div className="divide-y divide-apple-border">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-apple-bg/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-apple-blue/10 flex items-center justify-center flex-shrink-0">
                <span className="text-apple-blue text-sm font-semibold">{u.name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-apple-text font-medium text-sm">{u.name}</p>
                <p className="text-apple-text-2 text-xs truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {u.role === 'admin' ? <ShieldCheck size={14} className="text-apple-blue" /> : <User size={14} className="text-apple-text-2" />}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  u.role === 'admin' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-apple-bg text-apple-text-2'
                }`}>
                  {u.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
              </div>
              {u.id !== DEFAULT_ADMIN_ID && (
                <button onClick={() => deleteUser(u.id)} className="text-apple-text-3 hover:text-apple-red transition-colors p-1">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
