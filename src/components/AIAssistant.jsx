import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Bot, Sparkles, Key, AlertTriangle, Image, Loader2, RefreshCw } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

const STORAGE_KEY = 'claude_api_key';

// ── Pre-compute analytics so Claude gets rich structured data ─────────────────
function buildContext(purchases, equipment, outings) {
  const fmtUSD = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

  // Total per purchase
  const withTotal = purchases.map((p) => ({
    ...p,
    _total: p.grandTotal ?? (p.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0),
  }));

  // Spend per supervisor
  const spendBySupervisor = {};
  withTotal.forEach((p) => {
    const o = outings.find((o) => o.id === p.outingId);
    const name = o?.person || '(sem vínculo)';
    spendBySupervisor[name] = (spendBySupervisor[name] || 0) + p._total;
  });

  // Spend per location
  const spendByLocation = {};
  withTotal.forEach((p) => {
    if (p.location) spendByLocation[p.location] = (spendByLocation[p.location] || 0) + p._total;
  });

  // Item frequency (count purchases + total qty + total value)
  const itemFreq = {};
  withTotal.forEach((p) => {
    (p.lines || []).forEach((l) => {
      const key = (l.name || '').trim();
      if (!key) return;
      if (!itemFreq[key]) itemFreq[key] = { name: key, purchaseCount: 0, totalQty: 0, totalValue: 0, supervisors: new Set(), locations: new Set() };
      itemFreq[key].purchaseCount++;
      itemFreq[key].totalQty += Number(l.qty) || 0;
      itemFreq[key].totalValue += (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
      const o = outings.find((o) => o.id === p.outingId);
      if (o?.person) itemFreq[key].supervisors.add(o.person);
      if (p.location) itemFreq[key].locations.add(p.location);
    });
  });
  const topItems = Object.values(itemFreq)
    .map((i) => ({ ...i, supervisors: [...i.supervisors], locations: [...i.locations] }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, 20);

  // Duplicate alerts: same item, same supervisor, within 60 days
  const duplicateAlerts = [];
  const seen = {};
  withTotal.forEach((p) => {
    const o = outings.find((o) => o.id === p.outingId);
    if (!o) return;
    (p.lines || []).forEach((l) => {
      const key = `${o.person}::${(l.name || '').trim().toLowerCase()}`;
      if (!seen[key]) { seen[key] = []; }
      seen[key].push({ date: p.date, location: p.location });
    });
  });
  Object.entries(seen).forEach(([key, entries]) => {
    if (entries.length < 2) return;
    const [supervisor, item] = key.split('::');
    duplicateAlerts.push({ supervisor, item, occurrences: entries.length, dates: entries.map((e) => fmtDate(e.date)) });
  });

  // Spend by month
  const byMonth = {};
  withTotal.forEach((p) => {
    const mk = p.date ? p.date.slice(0, 7) : null;
    if (mk) byMonth[mk] = (byMonth[mk] || 0) + p._total;
  });
  const spendByMonth = Object.entries(byMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([month, total]) => ({ month, total: fmtUSD(total) }));

  // Low stock (quantity <= 2)
  const lowStock = equipment
    .filter((e) => e.type !== 'consumable' && e.quantity - (e.inUse || 0) <= 2)
    .map((e) => ({ nome: e.name, disponivel: e.quantity - (e.inUse || 0), emUso: e.inUse || 0 }));

  const totalSpend = withTotal.reduce((s, p) => s + p._total, 0);

  return {
    resumo: {
      totalCompras: purchases.length,
      totalGasto: fmtUSD(totalSpend),
      totalItensEstoque: equipment.length,
      supervisoresAtivos: outings.filter((o) => !o.endDate).length,
    },
    gastosPorSupervisor: Object.entries(spendBySupervisor)
      .sort((a, b) => b[1] - a[1])
      .map(([s, v]) => ({ supervisor: s, total: fmtUSD(v) })),
    gastosPorLocal: Object.entries(spendByLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([l, v]) => ({ local: l, total: fmtUSD(v) })),
    itensMaisComprados: topItems,
    alertasDuplicatas: duplicateAlerts,
    gastoPorMes: spendByMonth,
    estoqueBaixo: lowStock,
    todasCompras: withTotal.map((p) => ({
      data: fmtDate(p.date),
      local: p.location || '—',
      supervisor: outings.find((o) => o.id === p.outingId)?.person || null,
      total: fmtUSD(p._total),
      itens: (p.lines || []).map((l) => `${l.qty}x ${l.name} @ ${fmtUSD(l.unitPrice)}`).join(', '),
      observacoes: p.notes || null,
    })),
  };
}

function buildSystemPrompt(ctx) {
  return `Você é um assistente especialista em controle de estoque e compras para uma empresa de perfuração para cabos de energia nos EUA.
Responda SEMPRE em português brasileiro, de forma direta, clara e profissional.
Use markdown para formatar tabelas, listas e destaques quando ajudar a clareza.

## DADOS COMPLETOS DO SISTEMA
${JSON.stringify(ctx, null, 2)}

## O que você pode fazer:
- Gerar relatórios automáticos de desempenho financeiro e estoque
- Identificar padrões, desperdícios e compras duplicadas
- Alertar sobre itens comprados excessivamente para o mesmo supervisor/job
- Analisar fotos de notas fiscais — extraia data, itens, quantidades, preços e total
- Responder qualquer pergunta sobre gastos, estoque, equipes ou tendências
- Sugerir ações corretivas baseadas nos dados

Seja objetivo. Quando detectar problemas, aponte claramente com dados concretos.`;
}

const AUTO_PROMPT = `Analise todos os dados do sistema e me entregue um relatório executivo completo com:

1. **Resumo financeiro** — total gasto, média mensal, mês com maior gasto
2. **Top supervisores por gasto** — quem gastou mais e em quê
3. **Alertas de duplicatas** — itens comprados repetidamente para o mesmo supervisor/local
4. **Itens mais comprados** — frequência e valor acumulado
5. **Estoque em atenção** — itens com pouca disponibilidade
6. **Tendência mensal** — os últimos meses lado a lado

Se não houver dados suficientes para algum item, diga brevemente e pule.`;

function formatMd(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#F2F2F7] px-1 rounded text-[11px]">$1</code>')
    .replace(/^#{1,4} (.+)$/gm, '<div class="font-semibold text-[14px] mt-3 mb-1 text-[#1D1D1F]">$1</div>')
    .replace(/^[-*] (.+)$/gm, '<div class="flex gap-1.5 mt-0.5 ml-1"><span class="text-[#AEAEB2] flex-shrink-0">\xb7</span><span>$1</span></div>');
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
        isUser
          ? 'bg-[#0071E3] text-white rounded-tr-md'
          : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] rounded-tl-md'
      }`} style={!isUser ? { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } : {}}>
        {msg.imagePreview && (
          <img src={msg.imagePreview} alt="nota" className="rounded-xl mb-2 max-h-40 object-contain bg-[#F2F2F7] w-full" />
        )}
        <div dangerouslySetInnerHTML={{ __html: formatMd(msg.content) }} />
      </div>
    </div>
  );
}

export default function AIAssistant({ onClose }) {
  const { purchases, equipment, outings } = useApp();
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [keyInput, setKeyInput]   = useState('');
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [showKeyForm, setShowKeyForm]   = useState(!localStorage.getItem(STORAGE_KEY));
  const [error, setError]         = useState('');
  const [streaming, setStreaming] = useState('');
  const bottomRef = useRef();
  const fileRef   = useRef();
  const inputRef  = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streaming]);

  // Auto-analyze when key is set and no messages yet
  useEffect(() => {
    if (apiKey && messages.length === 0) {
      runAnalysis();
    }
  }, [apiKey]);

  function buildClient() {
    return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  function getSystemPrompt() {
    return buildSystemPrompt(buildContext(purchases, equipment, outings));
  }

  async function runAnalysis() {
    setLoading(true);
    setError('');
    setStreaming('');
    try {
      const client = buildClient();
      let full = '';
      const stream = client.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: getSystemPrompt(),
        messages: [{ role: 'user', content: AUTO_PROMPT }],
      });
      stream.on('text', (chunk) => {
        full += chunk;
        setStreaming(full);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
      await stream.finalMessage();
      setMessages([
        { role: 'user', content: AUTO_PROMPT, _hidden: true },
        { role: 'assistant', content: full },
      ]);
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg.includes('401') ? 'Chave de API inválida ou sem permissão.' : msg);
    } finally {
      setLoading(false);
      setStreaming('');
    }
  }

  async function send() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    if (loading) return;

    const img = pendingImage;
    const userMsg = { role: 'user', content: text || '(analisar imagem)', imagePreview: img?.dataUrl };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingImage(null);
    setLoading(true);
    setStreaming('');
    setError('');

    try {
      const client = buildClient();

      // Build history for API (skip hidden auto-prompt, include assistant reply)
      const apiMessages = messages
        .filter((m) => !m._hidden)
        .map((m) => ({
          role: m.role,
          content: m._apiContent || m.content,
        }));

      // New user turn
      const userContent = [];
      if (img) {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.dataUrl.split(',')[1] },
        });
      }
      userContent.push({ type: 'text', text: text || 'Analise esta nota fiscal: extraia data, itens, quantidades, preços e total.' });
      apiMessages.push({ role: 'user', content: userContent });

      let full = '';
      const stream = client.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: getSystemPrompt(),
        messages: apiMessages,
      });
      stream.on('text', (chunk) => {
        full += chunk;
        setStreaming(full);
      });
      await stream.finalMessage();

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const updated = [...prev.slice(0, -1), { ...last, _apiContent: userContent }];
        return [...updated, { role: 'assistant', content: full }];
      });
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg.includes('401') ? 'Chave de API inválida ou sem permissão.' : msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setStreaming('');
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingImage({ dataUrl: ev.target.result, mediaType: file.type });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function saveKey() {
    const k = keyInput.trim();
    if (!k.startsWith('sk-ant-')) { setError('Chave inválida. Deve começar com sk-ant-'); return; }
    localStorage.setItem(STORAGE_KEY, k);
    setApiKey(k);
    setShowKeyForm(false);
    setError('');
    setKeyInput('');
  }

  const quickQuestions = [
    'Quais duplicatas devo investigar?',
    'Qual job site teve mais gastos?',
    'Como está meu estoque crítico?',
    'Projeção de gasto para o próximo mês',
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-[#F2F2F7] w-full max-w-xl h-[92vh] sm:h-[700px] flex flex-col sm:rounded-[22px] rounded-t-[22px] overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5E5CE6 0%, #0071E3 100%)' }}>
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-white">Assistente IA</p>
            <p className="text-[11px] text-white/70">
              {loading ? 'Analisando…' : `${purchases.length} compras · ${equipment.length} itens`}
            </p>
          </div>
          {apiKey && (
            <button onClick={() => { setMessages([]); setError(''); }}
              title="Nova análise"
              className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
              <RefreshCw size={13} className="text-white" />
            </button>
          )}
          <button onClick={() => setShowKeyForm((v) => !v)}
            className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
            <Key size={13} className="text-white" />
          </button>
          <button onClick={onClose}
            className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* API Key form */}
        {showKeyForm && (
          <div className="px-5 py-4 bg-white border-b border-[#E5E5EA] flex-shrink-0">
            <p className="text-[12px] font-semibold text-[#1D1D1F] mb-2">Chave de API Anthropic</p>
            <div className="flex gap-2">
              <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-api03-…"
                className="flex-1 bg-[#F2F2F7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#5E5CE6]/25 border-0"
                onKeyDown={(e) => e.key === 'Enter' && saveKey()} />
              <button onClick={saveKey}
                className="px-4 py-2.5 bg-[#5E5CE6] text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
                Salvar
              </button>
            </div>
            {error && <p className="text-[11px] text-[#FF3B30] mt-1.5">{error}</p>}
            {apiKey && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-[#34C759]">✓ Chave salva</p>
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setApiKey(''); setShowKeyForm(true); setMessages([]); }}
                  className="text-[11px] text-[#FF3B30] hover:underline">Remover</button>
              </div>
            )}
          </div>
        )}

        {!apiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-14 h-14 bg-[#F2EEFF] rounded-2xl flex items-center justify-center">
              <Key size={24} className="text-[#5E5CE6]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1D1D1F]">Configure sua chave Anthropic</p>
              <p className="text-[13px] text-[#6E6E73] mt-1.5 leading-relaxed max-w-xs mx-auto">
                Clique no ícone 🔑 acima, insira sua chave <code className="bg-[#F2F2F7] px-1 rounded text-[12px]">sk-ant-…</code> e o assistente analisa tudo automaticamente.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.filter((m) => !m._hidden).map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {/* Streaming bubble */}
              {(loading || streaming) && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="max-w-[88%] bg-white border border-[#E5E5EA] rounded-2xl rounded-tl-md px-4 py-3 text-[13px] leading-relaxed"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {streaming
                      ? <div dangerouslySetInnerHTML={{ __html: formatMd(streaming) }} />
                      : <Loader2 size={14} className="text-[#5E5CE6] animate-spin" />
                    }
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="flex items-center gap-2 bg-[#FFF2F1] border border-[#FFCCC9] rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-[#FF3B30] flex-shrink-0" />
                  <p className="text-[12px] text-[#FF3B30]">{error}</p>
                </div>
              )}

              {/* Quick questions — show after analysis completes */}
              {!loading && messages.length >= 2 && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {quickQuestions.map((q) => (
                    <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0); }}
                      className="text-left bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 text-[11px] text-[#1D1D1F] hover:border-[#5E5CE6] hover:text-[#5E5CE6] transition-colors leading-tight"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Pending image preview */}
            {pendingImage && (
              <div className="px-4 pb-1 flex-shrink-0">
                <div className="relative inline-block">
                  <img src={pendingImage.dataUrl} alt="anexo" className="h-16 rounded-xl border border-[#E5E5EA] object-cover" />
                  <button onClick={() => setPendingImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF3B30] rounded-full flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0">
              <div className="flex gap-2 bg-white border border-[#E5E5EA] rounded-2xl px-3 py-2"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <button onClick={() => fileRef.current.click()}
                  title="Enviar foto de nota fiscal"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[#AEAEB2] hover:text-[#5E5CE6] hover:bg-[#F2EEFF] transition-colors flex-shrink-0">
                  <Image size={16} />
                </button>
                <textarea ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte qualquer coisa ou envie foto de nota…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none py-1.5 leading-relaxed"
                  style={{ maxHeight: '96px' }} />
                <button onClick={send} disabled={loading || (!input.trim() && !pendingImage)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                  {loading ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
