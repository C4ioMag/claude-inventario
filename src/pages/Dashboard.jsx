import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-[18px] p-5 flex flex-col gap-2"
      style={{boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'}}>
      <p className={`text-[38px] font-bold tracking-tight leading-none tabular-nums ${color}`}>{value}</p>
      <p className="text-[13px] text-[#6E6E73] font-medium">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { equipment } = useApp();

  const totalItems = equipment.length;
  const totalStock = equipment.reduce((s, e) => s + e.quantity, 0);
  const totalInUse = equipment.reduce((s, e) => s + e.inUse, 0);
  const totalAvail = equipment.reduce((s, e) => s + (e.quantity - e.inUse), 0);
  const outOfStock = equipment.filter((e) => e.quantity - e.inUse === 0).length;
  const lowStock   = equipment.filter((e) => e.quantity - e.inUse <= 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">Visão Geral</h1>
        <p className="text-[#6E6E73] text-[14px] mt-1">Resumo do inventário em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Itens Cadastrados" value={totalItems} color="text-[#1D1D1F]" />
        <StatCard label="Total em Estoque"  value={totalStock} color="text-[#1D1D1F]" />
        <StatCard label="Em Uso"            value={totalInUse} color="text-[#FF9500]" />
        <StatCard label="Disponível"        value={totalAvail} color="text-[#34C759]" />
        <StatCard label="Sem Estoque"       value={outOfStock} color="text-[#FF3B30]" />
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
    </div>
  );
}
