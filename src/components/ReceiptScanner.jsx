import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ScanLine, Loader, CheckCircle, AlertCircle, ChevronDown, FileText, ImageIcon, Pencil } from 'lucide-react';

// ─── PDF text extraction (pdfjs-dist) ─────────────────────────────────────────
async function extractPdfText(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(' ') + '\n';
  }
  return text;
}

// ─── Image OCR (Tesseract.js) ──────────────────────────────────────────────────
async function ocrImage(file, onProgress) {
  const Tesseract = (await import('tesseract.js')).default;
  const { data: { text } } = await Tesseract.recognize(file, 'por+eng', {
    workerPath:  'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js',
    langPath:    'https://tessdata.projectnaptha.com/4.0.0',
    corePath:    'https://unpkg.com/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js',
    logger: (m) => { if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100)); },
  });
  return text;
}

// ─── Parser ────────────────────────────────────────────────────────────────────
function parseText(raw) {
  const SKIP = /^(CNPJ|CPF|TOTAL|SUBTOTAL|DESCONTO|TROCO|PAGO|OBRIGADO|CUPOM|DANFE|NF-?E|ENDERE|CEP|FONE|FAX|IE:|IM:|VL\s|FORMA|VALOR|EMISS|CHAVE|SERIE|NUMERO|PROTOCOLO|INSC)/i;
  const UNIT = /\b(UN|KG|KGS|PC|PCS|CX|MT|M|LT|L|GL|SC|ROL|RL|FD|BD|PR|JG|KIT|CT|PAR|PCT)\b/i;

  const items = [];
  const seen = new Set();

  raw.split('\n').forEach((raw) => {
    const line = raw.trim().replace(/\s{2,}/g, ' ');
    if (line.length < 4) return;
    if (SKIP.test(line)) return;
    if (/^\d{6,}/.test(line)) return;          // barcode / long code
    if (/^[\d\s.,*\-\/R$%]+$/.test(line)) return; // purely numeric/punctuation

    let qty = 1;
    let name = line;

    // "5 UN CABO FIBRA" or "CABO FIBRA 5 UN"
    const withUnit = line.match(/^([\d.,]+)\s*x?\s*UN\b\s*(.+)$/i)
                  || line.match(/^(.+?)\s+([\d.,]+)\s*x?\s*UN\b/i);
    if (withUnit) {
      const q = parseFloat((withUnit[1] || withUnit[2]).replace(',', '.'));
      if (!isNaN(q) && q > 0 && q < 10000) { qty = Math.round(q); }
      name = (withUnit[2] || withUnit[1]).replace(UNIT, '').trim();
    } else {
      // Leading number: "3 CABO FIBRA OPTICA"
      const leading = line.match(/^(\d{1,4})\s+([A-ZÀ-Ö].{3,})$/i);
      if (leading) {
        qty = parseInt(leading[1]);
        name = leading[2].trim();
      } else {
        // Trailing number: "CABO FIBRA OPTICA 10"
        const trailing = line.match(/^([A-ZÀ-Ö].{3,}?)\s+(\d{1,4})$/i);
        if (trailing) {
          qty = parseInt(trailing[2]);
          name = trailing[1].trim();
        }
      }
    }

    // Strip price patterns (R$ 9,99)
    name = name.replace(/R\$\s*[\d.,]+/g, '').replace(UNIT, '').replace(/\s{2,}/g, ' ').trim();

    if (name.length < 3 || qty < 1 || qty > 9999) return;

    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); items.push({ name, quantity: qty }); }
  });

  return items;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ReceiptScanner({ onClose }) {
  const { equipment, adjustStock, addEquipment, groups } = useApp();
  const [stage, setStage] = useState('upload');   // upload | scanning | review
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [decisions, setDecisions] = useState({});
  const fileRef = useRef();

  const isPdf = file?.type === 'application/pdf';

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function handleScan() {
    if (!file) return;
    setStage('scanning');
    setProgress(0);
    setError(null);
    try {
      let text;
      if (isPdf) {
        setProgress(30);
        text = await extractPdfText(file);
        setProgress(90);
      } else {
        text = await ocrImage(file, setProgress);
      }

      const parsed = parseText(text);
      if (parsed.length === 0) {
        setError('Nenhum item reconhecido. Tente uma imagem mais nítida ou verifique se o PDF tem texto selecionável.');
        setStage('upload');
        return;
      }

      // Auto-match each parsed item to existing equipment
      const init = {};
      parsed.forEach((item, i) => {
        const nameLower = item.name.toLowerCase();
        const match = equipment.find((e) =>
          e.name.toLowerCase().includes(nameLower) || nameLower.includes(e.name.toLowerCase())
        );
        init[i] = {
          action: match ? 'match' : 'new',
          matchId: match?.id || '',
          qty: item.quantity || 1,
          newGroup: groups[0]?.id || 'campo',
          nameEdit: item.name,
        };
      });

      setItems(parsed);
      setDecisions(init);
      setStage('review');
    } catch (err) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
      setStage('upload');
    }
  }

  function setDecision(i, changes) {
    setDecisions((prev) => ({ ...prev, [i]: { ...prev[i], ...changes } }));
  }

  function handleConfirm() {
    items.forEach((item, i) => {
      const d = decisions[i];
      if (!d || d.action === 'skip') return;
      if (d.action === 'match' && d.matchId) {
        for (let j = 0; j < d.qty; j++) adjustStock(d.matchId, 1);
      } else if (d.action === 'new') {
        addEquipment({ name: d.nameEdit || item.name, description: '', category: '', quantity: d.qty, photo: null, groupId: d.newGroup });
      }
    });
    onClose();
  }

  const activeCount = Object.values(decisions).filter((d) => d?.action !== 'skip').length;
  const sel = 'w-full bg-[#F2F2F7] border-0 rounded-xl px-3 py-2 text-[13px] text-[#1D1D1F] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[92vh] flex flex-col"
        style={{boxShadow: '0 24px 64px rgba(0,0,0,0.18)'}}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#F2F2F7] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#EAF4FF] rounded-lg flex items-center justify-center">
              <ScanLine size={15} className="text-[#0071E3]" />
            </div>
            <h2 className="font-semibold text-[15px] text-[#1D1D1F]">Leitura de Nota / Invoice</h2>
          </div>
          <button onClick={onClose} className="text-[#AEAEB2] hover:text-[#1D1D1F] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* UPLOAD */}
          {(stage === 'upload') && (
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[#6E6E73]">
                Selecione uma foto da nota ou um PDF digital. PDFs com texto têm reconhecimento instantâneo e mais preciso.
              </p>

              {/* Drop zone */}
              <label className="flex flex-col items-center gap-3 border-2 border-dashed border-[#E5E5EA] rounded-2xl p-6 cursor-pointer hover:border-[#0071E3]/40 hover:bg-[#F2F2F7]/50 transition-all overflow-hidden">
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" capture="environment" />
                {preview ? (
                  <img src={preview} alt="preview" className="max-h-52 w-full object-contain rounded-xl" />
                ) : file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={40} className="text-[#0071E3]" />
                    <p className="text-[13px] font-medium text-[#1D1D1F]">{file.name}</p>
                    <p className="text-[12px] text-[#6E6E73]">PDF selecionado — clique para trocar</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="flex gap-3">
                      <ImageIcon size={28} className="text-[#AEAEB2]" />
                      <FileText size={28} className="text-[#AEAEB2]" />
                    </div>
                    <p className="text-[14px] font-medium text-[#0071E3]">Clique para selecionar</p>
                    <p className="text-[12px] text-[#AEAEB2]">Foto (JPG, PNG) ou PDF</p>
                  </div>
                )}
              </label>

              {error && (
                <div className="flex items-start gap-2.5 bg-[#FFF2F1] rounded-xl p-3">
                  <AlertCircle size={15} className="text-[#FF3B30] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[#FF3B30]">{error}</p>
                </div>
              )}

              <button onClick={handleScan} disabled={!file}
                className="w-full text-white text-[14px] font-semibold py-3 rounded-xl transition-all disabled:opacity-40 active:scale-[0.98]"
                style={{background: 'linear-gradient(180deg,#0071E3 0%,#0062C9 100%)', boxShadow: file ? '0 2px 8px rgba(0,113,227,0.35)' : 'none'}}>
                {isPdf ? '📄 Extrair texto do PDF' : '🔍 Ler com OCR'}
              </button>
            </div>
          )}

          {/* SCANNING */}
          {stage === 'scanning' && (
            <div className="p-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 bg-[#EAF4FF] rounded-2xl flex items-center justify-center">
                <Loader size={28} className="text-[#0071E3] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[15px] text-[#1D1D1F]">{isPdf ? 'Extraindo texto…' : 'Reconhecendo texto…'}</p>
                <p className="text-[13px] text-[#6E6E73] mt-1">{isPdf ? 'Processando PDF' : `OCR em andamento — ${progress}%`}</p>
              </div>
              {!isPdf && (
                <div className="w-full bg-[#F2F2F7] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-[#0071E3] rounded-full transition-all duration-300" style={{width: `${progress}%`}} />
                </div>
              )}
              <p className="text-[12px] text-[#AEAEB2] text-center">
                {isPdf ? 'Instantâneo' : 'Imagens claras e bem iluminadas têm melhor resultado'}
              </p>
            </div>
          )}

          {/* REVIEW */}
          {stage === 'review' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#34C759]" />
                <p className="text-[13px] font-semibold text-[#1D1D1F]">
                  {items.length} {items.length === 1 ? 'item encontrado' : 'itens encontrados'} — revise e confirme
                </p>
              </div>

              <div className="space-y-2.5">
                {items.map((item, i) => {
                  const d = decisions[i] || {};
                  const skipped = d.action === 'skip';
                  return (
                    <div key={i} className={`rounded-2xl border border-[#F2F2F7] p-3.5 space-y-3 transition-opacity ${skipped ? 'opacity-40' : ''}`}>
                      {/* Item header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Editable name */}
                          <input
                            value={d.nameEdit ?? item.name}
                            onChange={(e) => setDecision(i, { nameEdit: e.target.value })}
                            className="w-full text-[13px] font-semibold text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-[#E5E5EA] focus:border-[#0071E3] focus:outline-none pb-0.5 transition-colors"
                          />
                          <p className="text-[11px] text-[#AEAEB2] mt-0.5">Lido da nota — clique para editar</p>
                        </div>
                        <button
                          onClick={() => setDecision(i, { action: skipped ? (d.matchId ? 'match' : 'new') : 'skip' })}
                          className={`text-[11px] px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${
                            skipped ? 'bg-[#F2F2F7] text-[#6E6E73]' : 'bg-[#FFF2F1] text-[#FF3B30]'
                          }`}>
                          {skipped ? 'restaurar' : 'ignorar'}
                        </button>
                      </div>

                      {!skipped && (
                        <>
                          {/* Match or New */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {['match', 'new'].map((action) => (
                              <button key={action} onClick={() => setDecision(i, { action })}
                                className={`py-1.5 rounded-xl text-[12px] font-medium border transition-colors ${
                                  d.action === action
                                    ? action === 'match'
                                      ? 'bg-[#0071E3] text-white border-[#0071E3]'
                                      : 'bg-[#34C759] text-white border-[#34C759]'
                                    : 'border-[#E5E5EA] text-[#6E6E73] hover:border-[#AEAEB2]'
                                }`}>
                                {action === 'match' ? 'Vincular existente' : 'Criar novo'}
                              </button>
                            ))}
                          </div>

                          {d.action === 'match' && (
                            <div className="relative">
                              <select value={d.matchId || ''} onChange={(e) => setDecision(i, { matchId: e.target.value })} className={sel}>
                                <option value="">— selecione o item —</option>
                                {equipment.map((e) => (
                                  <option key={e.id} value={e.id}>{e.name} (estoque: {e.quantity})</option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] pointer-events-none" />
                            </div>
                          )}

                          {d.action === 'new' && (
                            <div className="relative">
                              <select value={d.newGroup || groups[0]?.id} onChange={(e) => setDecision(i, { newGroup: e.target.value })} className={sel}>
                                {groups.map((g) => <option key={g.id} value={g.id}>Grupo: {g.name}</option>)}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] pointer-events-none" />
                            </div>
                          )}

                          {/* Quantity */}
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#6E6E73] flex-shrink-0">Quantidade:</span>
                            <button onClick={() => setDecision(i, { qty: Math.max(1, (d.qty||1) - 1) })}
                              className="w-7 h-7 bg-[#F2F2F7] rounded-lg flex items-center justify-center text-[#1D1D1F] text-sm hover:bg-[#E5E5EA] transition-colors">−</button>
                            <input type="number" min={1} value={d.qty || 1}
                              onChange={(e) => setDecision(i, { qty: Math.max(1, Number(e.target.value)||1) })}
                              className="w-14 text-center bg-[#F2F2F7] rounded-lg py-1 text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
                            <button onClick={() => setDecision(i, { qty: (d.qty||1) + 1 })}
                              className="w-7 h-7 bg-[#0071E3] rounded-lg flex items-center justify-center text-white text-sm hover:bg-[#0077ED] transition-colors">+</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === 'review' && (
          <div className="p-5 border-t border-[#F2F2F7] flex gap-3 flex-shrink-0">
            <button onClick={() => setStage('upload')}
              className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors">
              ← Voltar
            </button>
            <button onClick={handleConfirm} disabled={activeCount === 0}
              className="flex-1 text-white py-2.5 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 active:scale-[0.98]"
              style={{background: 'linear-gradient(180deg,#34C759 0%,#28A745 100%)', boxShadow: activeCount > 0 ? '0 2px 8px rgba(52,199,89,0.35)' : 'none'}}>
              Aplicar {activeCount} {activeCount === 1 ? 'item' : 'itens'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
