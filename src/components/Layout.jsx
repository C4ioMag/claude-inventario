import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, LogOut, Menu, X, Users,
  ArrowUpFromLine, ArrowDownToLine, Clock, UserCheck,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  label: 'Visão Geral',     icon: LayoutDashboard },
  { to: '/equipment',  label: 'Equipamentos',     icon: Package },
  { to: '/saida',      label: 'Saída',            icon: ArrowUpFromLine },
  { to: '/campo',      label: 'Pessoas em Campo', icon: UserCheck },
  { to: '/retorno',    label: 'Retorno',          icon: ArrowDownToLine },
  { to: '/historico',  label: 'Histórico',        icon: Clock },
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
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen flex-shrink-0 bg-apple-sidebar relative">
        {/* Subtle top gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* Logo / brand */}
          <div className="px-4 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{background: 'linear-gradient(135deg, #0071E3 0%, #005BB5 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.40)'}}>
                <span className="text-white text-[11px] font-bold tracking-tight">FO</span>
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold leading-none tracking-tight">Fibra Ótica</p>
                <p className="text-white/35 text-[11px] mt-0.5">Inventário</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-white/[0.07] mb-2" />

          {/* Nav */}
          <nav className="flex-1 px-2.5 space-y-px overflow-y-auto">
            {allNav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 group ${
                    active
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                  style={active ? {background: 'rgba(255,255,255,0.13)'} : undefined}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = ''; }}
                >
                  <Icon size={15} strokeWidth={active ? 2.3 : 1.8}
                    className={active ? 'text-[#5AC8FA]' : ''} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="px-2.5 pb-5 pt-2">
            <div className="h-px bg-white/[0.07] mb-2.5" />
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-default group transition-all duration-150"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 select-none"
                style={{background: 'linear-gradient(135deg, #5E5CE6 0%, #0071E3 100%)'}}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-[13px] font-medium leading-none truncate">{currentUser?.name}</p>
                <p className="text-white/35 text-[11px] mt-0.5 capitalize">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </div>
              <button onClick={handleLogout}
                className="text-white/25 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/[0.08]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{background: 'linear-gradient(135deg, #0071E3 0%, #005BB5 100%)'}}>
              <span className="text-white text-[10px] font-bold">FO</span>
            </div>
            <span className="text-white font-semibold text-[14px] tracking-tight">Inventário</span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-white/70 hover:text-white p-1 transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-apple-sidebar pt-14">
          <nav className="p-3 space-y-px">
            {allNav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium transition-colors ${
                    active ? 'text-white' : 'text-white/40'
                  }`}
                  style={active ? {background: 'rgba(255,255,255,0.13)'} : undefined}>
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-[#5AC8FA]' : ''} />
                  {label}
                </Link>
              );
            })}
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-[14px] text-white/40 w-full mt-2">
              <LogOut size={16} /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden h-[52px]" />
        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
