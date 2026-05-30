import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle, TrendingUp, PackageX, UserCheck, RotateCcw, Trash2, X } from 'lucide-react';

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-[18px] p-5 flex flex-col gap-2"
      style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
      <p className={`text-[38px] font-bold tracking-tight leading-none tabular-nums ${color}`}>{value}</p>
      <p className="text-[13px] text-[#6E6E73] font-medium">{label}</p>
    </div>
  );
}

function fmt(d) {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '';
}

// Modal para resolver um item não devolvido
function ResolveModal({ item, onResolve, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}
        style={{boxShadow: '0 24px 64px rgba(0,0,0,0.18)'}}>
        <h2 className="text-[17px] font-semibold text-[#1D1D1F] mb-1">Resolver pendência</h2>
        <p className="text-[13px] text-[#6E6E73] mb-1">
          <strong className="text-[#1D1D1F]">{item.name}</strong> · {item.missing} un. · {item.person}
        </p>
        <p className="text-[12px] text-[#AEAEB2] mb-5">
          Estes itens já foram removidos do estoque total quando o retorno foi finalizado.
        </p>
        <div className="space-y-2.5">
          <button onClick={() => onResolve('returned')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F2F2F7] transition-colors text-left">
            <span className="w-8 h-8 rounded-lg bg-[#E8F8EC] flex items-center justify-center flex-shrink-0">
              <RotateCcw size={15} className="text-[#34C759]" />
            </span>
            <span>
              <span className="block text-[14px] font-medium text-[#1D1D1F]">Item foi devolvido</span>
              <span className="block text-[12px] text-[#6E6E73]">Adiciona de volta ao estoque disponível</span>
            </span>
          </button>
          <button onClick={() => onResolve('dismiss')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#FFF2F1] transition-colors text-left">
            <span className="w-8 h-8 rounded-lg bg-[#FFF2F1] flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} className="text-[#FF3B30]" />
            </span>
            <span>
              <span className="block text-[14px] font-medium text-[#1D1D1F]">Confirmar como perda</span>
              <span className="block text-[12px] text-[#6E6E73]">Remove da lista — estoque já está correto</span>
            </span>
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 text-[14px] text-[#6E6E73] font-medium hover:text-[#1D1D1F] transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { equipment, pendingReturns, resolvePending, activeOutings } = useApp();
  const [resolveTarget, setResolveTarget] = useState(null);

  const totalItems = equipment.length;
  const totalStock = equipment.reduce((s, e) => s + e.quantity, 0);
  const totalInUse = equipment.reduce((s, e) => s + e.inUse, 0);
  const totalAvail = equipment.reduce((s, e) => s + (e.quantity - e.inUse), 0);
  const lowStock   = equipment.filter((e) => e.quantity - e.inUse <= 1);
  const totalPending = pendingReturns.reduce((s, p) => s + p.missing, 0);

  function handleResolve(mode) {
    resolvePending(resolveTarget.outingId, resolveTarget.equipmentId, mode);
    setResolveTarget(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Visão Geral</h1>
        <p className="text-[#6E6E73] text-[14px] mt-1">Resumo do inventário em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Itens Cadastrados" value={totalItems} color="text-[#1D1D1F]" />
        <StatCard label="Total em Estoque"  value={totalStock} color="text-[#1D1D1F]" />
        <StatCard label="Disponível"        value={totalAvail} color="text-[#34C759]" />
        <StatCard label="Pessoas em Campo"  value={activeOutings.length} color="text-[#0071E3]" />
        <StatCard label="Não Devolvidos"    value={totalPending} color={totalPending > 0 ? 'text-[#FF3B30]' : 'text-[#1D1D1F]'} />
      </div>

      {/* Itens não devolvidos — destaque */}
      <div className="bg-white rounded-[18px] overflow-hidden"
        style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
        <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-[#F2F2F7]">
          <div className="w-8 h-8 bg-[#FFF2F1] rounded-xl flex items-center justify-center">
            <PackageX size={15} className="text-[#FF3B30]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">Itens Não Devolvidos</h2>
            <p className="text-[12px] text-[#6E6E73]">Pendências de retornos finalizados</p>
          </div>
          {totalPending > 0 && (
            <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF2F1] text-[#FF3B30]">
              {totalPending} un.
            </span>
          )}
        </div>
        <div className="px-6 py-4">
          {pendingReturns.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <CheckCircle size={18} className="text-[#34C759]" />
              <p className="text-[14px] text-[#6E6E73]">Nenhuma pendência. Todos os itens foram devolvidos.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F2F7]">
              {pendingReturns.map((p) => (
                <div key={p.outingId + p.equipmentId} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#1D1D1F] truncate">{p.name}</p>
                    <p className="text-[12px] text-[#6E6E73]">
                      <UserCheck size={11} className="inline mb-0.5 mr-1" />
                      {p.person} · finalizado {fmt(p.endDate)}
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF2F1] text-[#FF3B30] flex-shrink-0">
                    {p.missing} un.
                  </span>
                  <button onClick={() => setResolveTarget(p)}
                    className="text-[12px] font-medium text-[#0071E3] hover:underline flex-shrink-0">
                    Resolver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Low stock */}
        <div className="bg-white rounded-[18px] overflow-hidden"
          style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
          <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-[#F2F2F7]">
            <div className="w-8 h-8 bg-[#FFF8EC] rounded-xl flex items-center justify-center">
              <AlertCircle size={15} className="text-[#FF9500]" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">Estoque Baixo</h2>
          </div>
          <div className="px-6 py-4">
            {lowStock.length === 0 ? (
              <div className="flex items-center gap-3 py-3">
                <CheckCircle size={18} className="text-[#34C759]" />
                <p className="text-[14px] text-[#6E6E73]">Todos os itens com estoque adequado.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F2F2F7]">
                {lowStock.map((e) => {
                  const avail = e.quantity - e.inUse;
                  return (
                    <div key={e.id} className="flex items-center justify-between py-3">
                      <span className="text-[14px] text-[#1D1D1F] truncate max-w-[60%]">{e.name}</span>
                      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                        avail === 0 ? 'bg-[#FFF2F1] text-[#FF3B30]' : 'bg-[#FFF8EC] text-[#FF9500]'
                      }`}>
                        {avail === 0 ? 'Sem estoque' : `${avail} disponível`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div className="bg-white rounded-[18px] overflow-hidden"
          style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
          <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-[#F2F2F7]">
            <div className="w-8 h-8 bg-[#EAF4FF] rounded-xl flex items-center justify-center">
              <TrendingUp size={15} className="text-[#0071E3]" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1D1D1F]">Uso por Item</h2>
          </div>
          <div className="px-6 py-4 space-y-4 max-h-64 overflow-y-auto">
            {equipment.filter(e => e.quantity > 0).map((e) => {
              const pct = Math.round((e.inUse / e.quantity) * 100);
              return (
                <div key={e.id}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-[#1D1D1F] truncate max-w-[65%] font-medium">{e.name}</span>
                    <span className="text-[#AEAEB2] tabular-nums">{e.inUse}/{e.quantity}</span>
                  </div>
                  <div className="h-[5px] bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${pct}%`,
                      background: pct >= 90 ? '#FF3B30' : pct >= 60 ? '#FF9500' : '#34C759',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {resolveTarget && (
        <ResolveModal item={resolveTarget} onResolve={handleResolve} onClose={() => setResolveTarget(null)} />
      )}
    </div>
  );
}
