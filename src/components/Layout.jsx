import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, LogOut, Menu, X, Users,
  ArrowUpFromLine, ArrowDownToLine, Clock, UserCheck, Zap,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Geral',
    items: [
      { to: '/dashboard',  label: 'Visão Geral',  icon: LayoutDashboard, tint: '#0A84FF' },
      { to: '/equipment',  label: 'Equipamentos', icon: Package,          tint: '#5E5CE6' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { to: '/saida',     label: 'Saída',            icon: ArrowUpFromLine,  tint: '#FF9F0A' },
      { to: '/campo',     label: 'Pessoas em Campo', icon: UserCheck,        tint: '#30D158' },
      { to: '/retorno',   label: 'Retorno',          icon: ArrowDownToLine,  tint: '#64D2FF' },
      { to: '/historico', label: 'Histórico',        icon: Clock,            tint: '#BF5AF2' },
    ],
  },
];

const adminItem = { to: '/usuarios', label: 'Usuários', icon: Users, tint: '#FF453A' };

function NavLink({ to, label, icon: Icon, tint, active, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-2.5 py-2 rounded-[9px] text-[13.5px] font-medium transition-all duration-150 group relative"
      style={active ? { background: 'rgba(255,255,255,0.10)', color: '#fff' } : { color: 'rgba(255,255,255,0.55)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <span className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-active:scale-90"
        style={{ background: active ? tint : 'rgba(255,255,255,0.08)' }}>
        <Icon size={14.5} strokeWidth={2.1} style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)' }} />
      </span>
      <span style={!active ? { color: 'rgba(255,255,255,0.78)' } : undefined}>{label}</span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }

  const groups = currentUser?.role === 'admin'
    ? [...navGroups, { label: 'Administração', items: [adminItem] }]
    : navGroups;

  const initials = currentUser?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const SidebarInner = ({ onNav }) => (
    <div className="relative flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)', boxShadow: '0 2px 10px rgba(10,132,255,0.45)' }}>
            <Zap size={15} className="text-white" strokeWidth={2.4} fill="white" />
          </div>
          <div className="leading-none">
            <p className="text-white text-[14px] font-semibold tracking-tight">Fibra<span className="text-white/45">OS</span></p>
            <p className="text-white/35 text-[10.5px] mt-1 tracking-wide">Controle de Estoque</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2.5 overflow-y-auto space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] px-2.5 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} {...item} active={location.pathname === item.to} onClick={onNav} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-2.5 pb-4 pt-3">
        <div className="h-px bg-white/[0.06] mb-3" />
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[10px] cursor-default group transition-all duration-150"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 select-none"
            style={{ background: 'linear-gradient(135deg, #5E5CE6 0%, #0A84FF 100%)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-[12.5px] font-medium leading-none truncate">{currentUser?.name}</p>
            <p className="text-white/35 text-[10.5px] mt-1">{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
          </div>
          <button onClick={handleLogout}
            className="text-white/25 hover:text-white/70 transition-colors flex-shrink-0 p-1">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F5F7' }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-[228px] flex-shrink-0 sticky top-0 h-screen"
        style={{ background: 'linear-gradient(180deg, #1A1A1C 0%, #0E0E10 100%)' }}>
        <SidebarInner />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/[0.08]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)' }}>
              <Zap size={13} className="text-white" strokeWidth={2.4} fill="white" />
            </div>
            <span className="text-white font-semibold text-[14px] tracking-tight">Fibra<span className="text-white/45">OS</span></span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-white/70 hover:text-white p-1 transition-colors">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 pt-14"
          style={{ background: 'linear-gradient(180deg, #1A1A1C 0%, #0E0E10 100%)' }}>
          <div className="h-[calc(100vh-3.5rem)]">
            <SidebarInner onNav={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden h-[52px]" />
        <div className="px-5 py-6 md:px-10 md:py-9 max-w-[1180px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
