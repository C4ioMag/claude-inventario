import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    if (login(form.email, form.password)) {
      navigate('/dashboard');
    } else {
      setError('Email ou senha incorretos.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-apple-bg flex items-center justify-center p-4"
      style={{background: 'linear-gradient(160deg, #F2F2F7 0%, #E8EAF0 100%)'}}>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full opacity-40"
          style={{background: 'radial-gradient(circle, rgba(0,113,227,0.12) 0%, transparent 70%)'}} />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full opacity-30"
          style={{background: 'radial-gradient(circle, rgba(94,92,230,0.10) 0%, transparent 70%)'}} />
      </div>

      <div className="w-full max-w-[360px] relative">
        <div className="bg-white rounded-[24px] p-8" style={{boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'}}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{background: 'linear-gradient(135deg, #0071E3 0%, #005BB5 100%)', boxShadow: '0 4px 16px rgba(0,113,227,0.40)'}}>
              <span className="text-white text-[22px] font-bold tracking-tight">FO</span>
            </div>
            <h1 className="text-[#1D1D1F] text-[22px] font-bold tracking-tight">Bem-vindo</h1>
            <p className="text-[#6E6E73] text-[14px] mt-1.5">Controle de Inventário · Fibra Ótica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[#1D1D1F] text-[13px] font-medium mb-1.5 ml-0.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
                className="input-apple w-full"
              />
            </div>
            <div>
              <label className="block text-[#1D1D1F] text-[13px] font-medium mb-1.5 ml-0.5">Senha</label>
              <input
                type="password" required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-apple w-full"
              />
            </div>

            {error && (
              <div className="bg-[#FFF2F1] rounded-xl px-4 py-3">
                <p className="text-[#FF3B30] text-[13px] font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white text-[15px] font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 mt-2 active:scale-[0.98]"
              style={{
                background: loading ? '#5BA3F5' : 'linear-gradient(180deg, #0071E3 0%, #0062C9 100%)',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(0,113,227,0.35)',
              }}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
