import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, LogOut, Menu, X, Users,
  ArrowUpFromLine, ArrowDownToLine, Clock, UserCheck,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  label: 'Visão Geral',      icon: LayoutDashboard },
  { to: '/equipment',  label: 'Equipamentos',      icon: Package },
  { to: '/saida',      label: 'Saída',             icon: ArrowUpFromLine },
  { to: '/campo',      label: 'Pessoas em Campo',  icon: UserCheck },
  { to: '/retorno',    label: 'Retorno',           icon: ArrowDownToLine },
  { to: '/historico',  label: 'Histórico',         icon: Clock },
];

export default function Layout({ children }) {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }

  const allNav = currentUser?.role === 'admin'
    ? [...navItems, { to: '/usuarios', label: 'Usuários', icon: Users }]
    : navItems;

  const initials = currentUser?.name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-apple-bg flex">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-60 bg-apple-sidebar min-h-screen flex-shrink-0">
        {/* Logo */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-apple-blue rounded-[10px] flex items-center justify-center shadow-apple">
              <span className="text-white text-sm font-bold">FO</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Fibra Ótica</p>
              <p className="text-apple-text-3 text-xs">Inventário</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {allNav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-all duration-150 ${
                  active
                    ? 'bg-apple-sidebar-active text-white font-medium'
                    : 'text-apple-text-3 hover:bg-apple-sidebar-hover hover:text-white'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-5 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-apple-sidebar-hover group cursor-default">
            <div className="w-8 h-8 rounded-full bg-apple-blue flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-apple-text-3 text-xs">{currentUser?.role === 'admin' ? 'Admin' : 'Usuário'}</p>
            </div>
            <button onClick={handleLogout} className="text-apple-text-3 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-apple-blue rounded-[8px] flex items-center justify-center">
              <span className="text-white text-xs font-bold">FO</span>
            </div>
            <span className="text-white font-semibold text-sm">Inventário</span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-white p-1">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-apple-sidebar pt-14">
          <nav className="p-3 space-y-0.5">
            {allNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm ${
                  location.pathname === to ? 'bg-apple-sidebar-active text-white' : 'text-apple-text-3'
                }`}
              >
                <Icon size={17} /> {label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-apple-text-3 w-full">
              <LogOut size={17} /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden h-14" />
        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
