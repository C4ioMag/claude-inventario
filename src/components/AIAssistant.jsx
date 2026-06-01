import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Bot, Sparkles, Key, AlertTriangle, Image, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

const STORAGE_KEY = 'claude_api_key';

function buildSystemPrompt(purchases, equipment, outings) {
  const fmtUSD = (n) => `$${Number(n || 0).toFixed(2)}`;
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

  const purchaseSummary = purchases.map((p) => {
    const total = p.grandTotal ?? (p.lines || []).reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);
    const linked = outings.find((o) => o.id === p.outingId);
    return {
      id: p.id,
      data: fmtDate(p.date),
      rawDate: p.date,
      local: p.location || '—',
      supervisor: linked?.person || null,
      total: fmtUSD(total),
      totalNum: total,
      itens: (p.lines || []).map((l) => `${l.qty}x ${l.name} @ ${fmtUSD(l.unitPrice)}`).join(', '),
      observacoes: p.notes || null,
      temNota: !!p.receipt,
    };
  });

  const equipSummary = equipment.map((e) => ({
    nome: e.name,
    categoria: e.category,
    quantidade: e.quantity,
    emUso: e.inUse || 0,
    tipo: e.type || 'returnable',
    ultimoPreco: e.lastUnitPrice ? fmtUSD(e.lastUnitPrice) : null,
  }));

  const outingSummary = outings.map((o) => ({
    supervisor: o.person,
    local: o.location || '—',
    inicio: fmtDate(o.startDate),
    ativa: !o.endDate,
  }));

  return `Você é um assistente especialista em controle de estoque e compras para uma empresa de perfuração para cabos de energia nos EUA.
Você tem acesso completo aos dados do sistema de inventário da empresa. Responda sempre em português brasileiro, de forma direta e profissional.

## COMPRAS REGISTRADAS (${purchases.length} total)
${JSON.stringify(purchaseSummary, null, 2)}

## ESTOQUE ATUAL (${equipment.length} itens)
${JSON.stringify(equipSummary, null, 2)}

## SUPERVISORES / EQUIPES (${outings.length} total)
${JSON.stringify(outingSummary, null, 2)}

## Suas capacidades:
- Analisar padrões de compra e identificar itens comprados com frequência excessiva
- Identificar possíveis desperdícios ou duplicatas para o mesmo job/supervisor
- Calcular gastos por período, supervisor ou local
- Ler e interpretar imagens de notas fiscais (o usuário pode te enviar a foto)
- Sugerir alertas e controles baseados no histórico
- Responder perguntas sobre estoque, custos e equipes

Quando o usuário enviar uma imagem de nota fiscal, extraia: data, itens com quantidades e preços, total.
Seja conciso mas completo. Use formatação em markdown quando ajudar a clareza.`;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
        isUser
          ? 'bg-[#0071E3] text-white rounded-tr-md'
          : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] rounded-tl-md'
      }`} style={!isUser ? { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } : {}}>
        {msg.imagePreview && (
          <img src={msg.imagePreview} alt="nota" className="rounded-xl mb-2 max-h-40 object-contain bg-[#F2F2F7] w-full" />
        )}
        <div className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: formatMd(msg.content) }} />
      </div>
    </div>
  );
}

function formatMd(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#F2F2F7] px-1 rounded text-[11px]">$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<div class="font-semibold text-[14px] mt-2 mb-1">$1</div>')
    .replace(/^[-*] (.+)$/gm, '<div class="flex gap-1.5 mt-0.5"><span class="text-[#AEAEB2]">\xb7</span><span>$1</span></div>');
}

export default function AIAssistant({ onClose }) {
  const { purchases, equipment, outings } = useApp();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [keyInput, setKeyInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { dataUrl, mediaType }
  const [showKeyForm, setShowKeyForm] = useState(!localStorage.getItem(STORAGE_KEY));
  const [error, setError] = useState('');
  const bottomRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (apiKey && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou seu assistente de compras e estoque. Tenho acesso a todos os ${purchases.length} registros de compras, ${equipment.length} itens do estoque e ${outings.length} supervisores.\n\nPosso ajudar com:\n- Analisar padrões e frequência de compras\n- Identificar gastos por supervisor ou job site\n- Ler notas fiscais (envie uma foto)\n- Sugerir alertas de duplicatas\n\nO que você quer saber?`,
      }]);
    }
  }, [apiKey]);

  function saveKey() {
    const k = keyInput.trim();
    if (!k.startsWith('sk-ant-')) {
      setError('Chave inválida. Deve começar com sk-ant-');
      return;
    }
    localStorage.setItem(STORAGE_KEY, k);
    setApiKey(k);
    setShowKeyForm(false);
    setError('');
    setKeyInput('');
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const mediaType = file.type;
      setPendingImage({ dataUrl, mediaType });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function send() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    if (loading) return;

    const userMsg = { role: 'user', content: text || '(analisar imagem)', imagePreview: pendingImage?.dataUrl };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const img = pendingImage;
    setPendingImage(null);
    setLoading(true);
    setError('');

    try {
      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Build API messages from history + new message
      const history = messages.filter((m) => !m.imagePreview || m._hasImage);
      const apiMessages = [
        ...history.map((m) => ({
          role: m.role,
          content: m.role === 'user' && m._hasImage
            ? m._apiContent
            : m.content,
        })),
      ];

      // Build current user message content
      const userContent = [];
      if (img) {
        const base64 = img.dataUrl.split(',')[1];
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: base64 },
        });
      }
      if (text) userContent.push({ type: 'text', text });
      else if (img) userContent.push({ type: 'text', text: 'Analise esta nota fiscal e extraia as informações: data, itens, quantidades, preços e total.' });

      apiMessages.push({ role: 'user', content: userContent });

      const resp = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: buildSystemPrompt(purchases, equipment, outings),
        messages: apiMessages,
      });

      const assistantText = resp.content[0]?.text || '…';

      // Store user message with image ref for future history
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const updated = [...prev.slice(0, -1), { ...last, _hasImage: !!img, _apiContent: userContent }];
        return [...updated, { role: 'assistant', content: assistantText }];
      });
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg.includes('401') ? 'Chave de API inválida ou sem permissão.' : msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const suggestedQuestions = [
    'Quais itens são comprados com mais frequência?',
    'Qual supervisor gastou mais este mês?',
    'Tem alguma duplicata suspeita nas compras?',
    'Resumo dos gastos por job site',
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-[#F2F2F7] w-full max-w-xl h-[90vh] sm:h-[680px] flex flex-col sm:rounded-[22px] rounded-t-[22px] overflow-hidden"
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
            <p className="text-[11px] text-white/70">Powered by Claude</p>
          </div>
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
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 bg-[#F2F2F7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#5E5CE6]/25 border-0"
                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              />
              <button onClick={saveKey}
                className="px-4 py-2.5 bg-[#5E5CE6] text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
                Salvar
              </button>
            </div>
            {error && <p className="text-[11px] text-[#FF3B30] mt-1.5">{error}</p>}
            {apiKey && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-[#34C759]">✓ Chave salva</p>
                <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setApiKey(''); setShowKeyForm(true); }}
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
              <p className="text-[15px] font-semibold text-[#1D1D1F]">Configure sua chave de API</p>
              <p className="text-[13px] text-[#6E6E73] mt-1 leading-relaxed">
                Clique no ícone 🔑 acima e insira sua chave Anthropic (sk-ant-…) para ativar o assistente.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="bg-white border border-[#E5E5EA] rounded-2xl rounded-tl-md px-4 py-3"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <Loader2 size={14} className="text-[#5E5CE6] animate-spin" />
                  </div>
                </div>
              )}
              {error && !loading && (
                <div className="flex items-center gap-2 bg-[#FFF2F1] border border-[#FFCCC9] rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-[#FF3B30] flex-shrink-0" />
                  <p className="text-[12px] text-[#FF3B30]">{error}</p>
                </div>
              )}
              {messages.length <= 1 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-[#AEAEB2] font-medium px-0.5">Sugestões:</p>
                  {suggestedQuestions.map((q) => (
                    <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="w-full text-left bg-white border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-[12px] text-[#1D1D1F] hover:border-[#5E5CE6] hover:text-[#5E5CE6] transition-colors"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Image preview */}
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
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[#AEAEB2] hover:text-[#5E5CE6] hover:bg-[#F2EEFF] transition-colors flex-shrink-0">
                  <Image size={16} />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre compras, estoque, padrões… ou envie uma foto de nota"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none py-1.5 leading-relaxed"
                  style={{ maxHeight: '96px' }}
                />
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
