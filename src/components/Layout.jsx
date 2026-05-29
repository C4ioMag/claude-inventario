import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, LogOut, Menu, X, Users,
  ArrowUpFromLine, ArrowDownToLine, Clock, UserCheck,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/equipment', label: 'Equipamentos', icon: Package },
  { to: '/saida', label: 'Saída', icon: ArrowUpFromLine },
  { to: '/campo', label: 'Pessoas em Campo', icon: UserCheck },
  { to: '/retorno', label: 'Retorno', icon: ArrowDownToLine },
  { to: '/historico', label: 'Histórico', icon: Clock },
];

export default function Layout({ children }) {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const allNav = currentUser?.role === 'admin'
    ? [...navItems, { to: '/usuarios', label: 'Usuários', icon: Users }]
    : navItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-900 text-white min-h-screen">
        <div className="p-5 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">FO</div>
            <div>
              <p className="font-semibold text-sm">Fibra Ótica</p>
              <p className="text-xs text-blue-300">Controle de Inventário</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {allNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === to
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-blue-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-blue-300">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-200 hover:bg-blue-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-400 rounded flex items-center justify-center text-xs font-bold">FO</div>
          <span className="font-semibold text-sm">Inventário</span>
        </div>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-blue-900 text-white pt-14">
          <nav className="p-4 space-y-1">
            {allNav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  location.pathname === to ? 'bg-blue-700' : 'text-blue-200'
                }`}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-blue-200 w-full"
            >
              <LogOut size={18} /> Sair
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 md:overflow-auto">
        <div className="md:hidden h-14" />
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
