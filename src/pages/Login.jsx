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
    <div className="min-h-screen bg-apple-bg flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-apple-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Card */}
        <div className="bg-apple-card rounded-apple-xl shadow-apple-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-apple-blue rounded-[20px] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-apple">
              FO
            </div>
            <h1 className="text-apple-text text-2xl font-semibold tracking-tight">Bem-vindo</h1>
            <p className="text-apple-text-2 text-sm mt-1">Controle de Inventário — Fibra Ótica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-apple-text text-sm font-medium mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
                className="w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text placeholder:text-apple-text-3 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-apple-text text-sm font-medium mb-1.5">Senha</label>
              <input
                type="password" required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 text-sm text-apple-text placeholder:text-apple-text-3 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-apple px-3.5 py-2.5">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold py-2.5 rounded-apple text-sm transition-all shadow-apple disabled:opacity-70 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
