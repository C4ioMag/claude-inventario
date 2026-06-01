import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Loader2, Sparkles, AlertTriangle, CheckCircle, Plus, Package } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

const STORAGE_KEY = 'claude_api_key';

// HTS lookup happens inside the Claude prompt — no external API needed
function buildReceiptPrompt(equipment, outings, purchases) {
  const knownItems = equipment.map((e) => `id:${e.id} | "${e.name}" | grupo:${e.groupId} | qtd:${e.quantity}`).join('\n');
  const knownLocations = [...new Set([
    ...outings.map((o) => o.location).filter(Boolean),
    ...purchases.map((p) => p.location).filter(Boolean),
  ])].join(', ');
  const recentPurchases = purchases.slice(-20).map((p) =>
    `${p.date || 'sem data'} | ${p.location || '—'} | ${(p.lines || []).map((l) => l.name).join(', ')}`
  ).join('\n');

  return `Você é um especialista em importação, estoque e compras para uma empresa de perfuração para cabos de energia nos EUA.

Analise a nota fiscal fornecida e retorne um JSON estruturado seguindo EXATAMENTE o schema abaixo.

## ITENS JÁ NO ESTOQUE (para associação):
${knownItems || '(nenhum)'}

## LOCAIS JÁ UTILIZADOS:
${knownLocations || '(nenhum)'}

## COMPRAS RECENTES (para contexto de associação):
${recentPurchases || '(nenhuma)'}

## REGRAS:
1. Extraia data (formato YYYY-MM-DD), fornecedor, local de uso se identificável, número de invoice/nota
2. Para cada item: nome em INGLÊS e PORTUGUÊS, quantidade, preço unitário, total
3. Código HTS (Harmonized Tariff Schedule) americano de 10 dígitos — pesquise com base no produto. Se não tiver certeza, forneça o mais provável e indique com "~"
4. Se o item já existir no estoque (campo "existing_equipment_id"), use o id correspondente; caso contrário null
5. Se o local da nota bate com um local já usado (knownLocations), use-o exatamente como aparece na lista
6. Campo "has_destination": true se o item tem destino claro (truck, job site, local específico) — nesses casos NÃO criar no estoque
7. Campo "suggest_stock": true apenas se o item é equipamento reutilizável SEM destino claro e NÃO existe no estoque

Retorne APENAS o JSON, sem markdown, sem explicação:

{
  "date": "YYYY-MM-DD ou null",
  "supplier": "nome do fornecedor",
  "invoice_number": "número da nota ou null",
  "location": "local de uso identificado ou null",
  "currency": "USD",
  "notes": "observações relevantes ou null",
  "items": [
    {
      "name_en": "Nome em inglês",
      "name_pt": "Nome em português",
      "hts_code": "NNNN.NN.NNNN",
      "hts_description": "descrição HTS",
      "qty": 1,
      "unit_price": 0.00,
      "total": 0.00,
      "existing_equipment_id": null,
      "has_destination": false,
      "suggest_stock": false,
      "notes": null
    }
  ],
  "grand_total": 0.00
}`;
}

export default function ReceiptAnalyzer({ onClose, onApply }) {
  const { equipment, outings, purchases } = useApp();
  const apiKey = localStorage.getItem(STORAGE_KEY) || '';

  const [step, setStep] = useState('upload'); // upload | analyzing | review | confirm_stock
  const [imageData, setImageData] = useState(null); // { dataUrl, mediaType }
  const [result, setResult] = useState(null);       // parsed JSON from Claude
  const [error, setError] = useState('');
  const [newStockItems, setNewStockItems] = useState([]); // items user confirmed to add to stock
  const [pendingStock, setPendingStock] = useState([]);   // items waiting confirmation

  async function analyze() {
    if (!imageData) return;
    if (!apiKey) { setError('Configure a chave de API Claude no Assistente IA primeiro.'); return; }
    setStep('analyzing');
    setError('');
    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const systemPrompt = buildReceiptPrompt(equipment, outings, purchases);

      const resp = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageData.mediaType, data: imageData.dataUrl.split(',')[1] } },
            { type: 'text', text: 'Analise esta nota fiscal e retorne o JSON conforme instruído.' },
          ],
        }],
      });

      const raw = resp.content[0]?.text || '';
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      setResult(parsed);

      // Find items that might need to be added to stock
      const toConfirm = (parsed.items || []).filter((i) => i.suggest_stock && !i.existing_equipment_id);
      if (toConfirm.length > 0) {
        setPendingStock(toConfirm.map((i) => ({ ...i, _addToStock: true })));
        setStep('confirm_stock');
      } else {
        setStep('review');
      }
    } catch (err) {
      setError('Erro ao analisar: ' + (err?.message || String(err)));
      setStep('upload');
    }
  }

  function confirmStock() {
    const confirmed = pendingStock.filter((i) => i._addToStock);
    setNewStockItems(confirmed);
    setStep('review');
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageData({ dataUrl: ev.target.result, mediaType: file.type });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function applyToForm() {
    if (!result) return;
    onApply({
      date: result.date || '',
      location: result.location || '',
      notes: [result.supplier, result.invoice_number].filter(Boolean).join(' — '),
      lines: (result.items || []).map((item) => ({
        name: `${item.name_en} / ${item.name_pt}`,
        name_en: item.name_en,
        name_pt: item.name_pt,
        hts_code: item.hts_code,
        equipmentId: item.existing_equipment_id || '',
        qty: item.qty,
        unitPrice: item.unit_price,
        notes: item.notes,
      })),
      newStockItems: newStockItems.map((i) => ({
        name: `${i.name_en} / ${i.name_pt}`,
        qty: i.qty,
        lastUnitPrice: i.unit_price,
      })),
      receipt: imageData ? { dataUrl: imageData.dataUrl, type: imageData.mediaType, name: 'nota-fiscal' } : null,
    });
    onClose();
  }

  const ic = 'bg-[#F2F2F7] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1D1D1F]';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[22px]"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F2F2F7] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1D1D1F]">Analisar Nota Fiscal com IA</p>
              <p className="text-[11px] text-[#6E6E73]">Extração automática · HTS · Associação de itens</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* STEP: upload */}
          {(step === 'upload' || step === 'analyzing') && (
            <>
              <div
                className="border-2 border-dashed border-[#D1D1D6] rounded-2xl p-8 text-center cursor-pointer hover:border-[#5E5CE6] hover:bg-[#F2EEFF]/30 transition-all"
                onClick={() => document.getElementById('receipt-file-input').click()}>
                {imageData ? (
                  <img src={imageData.dataUrl} alt="nota" className="max-h-48 mx-auto rounded-xl object-contain" />
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-[#F2EEFF] rounded-2xl flex items-center justify-center mx-auto">
                      <Sparkles size={22} className="text-[#5E5CE6]" />
                    </div>
                    <p className="text-[14px] font-medium text-[#1D1D1F]">Clique para selecionar a nota fiscal</p>
                    <p className="text-[12px] text-[#6E6E73]">Imagem ou PDF — a IA extrai tudo automaticamente</p>
                  </div>
                )}
              </div>
              <input id="receipt-file-input" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />

              {error && (
                <div className="flex items-center gap-2 bg-[#FFF2F1] border border-[#FFCCC9] rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-[#FF3B30]" />
                  <p className="text-[12px] text-[#FF3B30]">{error}</p>
                </div>
              )}

              <button
                onClick={analyze}
                disabled={!imageData || step === 'analyzing'}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                {step === 'analyzing'
                  ? <><Loader2 size={16} className="animate-spin" /> Analisando nota…</>
                  : <><Sparkles size={16} /> Analisar com IA</>}
              </button>
            </>
          )}

          {/* STEP: confirm stock items */}
          {step === 'confirm_stock' && (
            <>
              <div className="bg-[#FFF9EC] border border-[#FFCC00]/30 rounded-2xl p-4">
                <p className="text-[13px] font-semibold text-[#1D1D1F] mb-1">Itens novos encontrados</p>
                <p className="text-[12px] text-[#6E6E73]">Esses itens não existem no estoque e não têm destino fixo. Deseja adicioná-los ao estoque?</p>
              </div>

              <div className="space-y-2">
                {pendingStock.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#F2F2F7] rounded-2xl p-4">
                    <input
                      type="checkbox"
                      checked={item._addToStock}
                      onChange={(e) => setPendingStock((prev) => prev.map((x, j) => j !== i ? x : { ...x, _addToStock: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-[#5E5CE6]"
                    />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-[#1D1D1F]">{item.name_en} / {item.name_pt}</p>
                      <p className="text-[11px] text-[#6E6E73]">Qtd: {item.qty} · ${item.unit_price?.toFixed(2)} cada · HTS: {item.hts_code}</p>
                    </div>
                    <Package size={16} className="text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>

              <button onClick={confirmStock}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                <CheckCircle size={16} /> Confirmar e continuar
              </button>
            </>
          )}

          {/* STEP: review result */}
          {step === 'review' && result && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Fornecedor', value: result.supplier || '—' },
                  { label: 'Data', value: result.date || '—' },
                  { label: 'Total', value: `$${Number(result.grand_total || 0).toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-[#6E6E73] mb-0.5">{label}</p>
                    <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">{value}</p>
                  </div>
                ))}
              </div>

              {result.location && (
                <div className="flex items-center gap-2 bg-[#F0FFF4] border border-[#34C759]/25 rounded-xl px-4 py-2.5">
                  <CheckCircle size={13} className="text-[#34C759]" />
                  <p className="text-[12px] text-[#1D1D1F]">Local identificado: <strong>{result.location}</strong></p>
                </div>
              )}

              {/* Items table */}
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-[#1D1D1F]">Itens extraídos</p>
                {(result.items || []).map((item, i) => {
                  const linked = item.existing_equipment_id
                    ? equipment.find((e) => e.id === item.existing_equipment_id)
                    : null;
                  const addingToStock = newStockItems.some((x) => x.name_en === item.name_en);
                  return (
                    <div key={i} className="border border-[#E5E5EA] rounded-2xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1D1D1F]">{item.name_en}</p>
                          <p className="text-[11px] text-[#6E6E73]">{item.name_pt}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[13px] font-semibold text-[#1D1D1F]">${Number(item.total || 0).toFixed(2)}</p>
                          <p className="text-[11px] text-[#6E6E73]">{item.qty}x ${Number(item.unit_price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-[#F2F2F7] text-[#6E6E73] px-2 py-0.5 rounded-full font-mono">
                          HTS {item.hts_code}
                        </span>
                        {linked && (
                          <span className="text-[10px] bg-[#F0FFF4] text-[#34C759] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={9} /> Associado: {linked.name}
                          </span>
                        )}
                        {addingToStock && (
                          <span className="text-[10px] bg-[#F2EEFF] text-[#5E5CE6] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Plus size={9} /> Adicionar ao estoque
                          </span>
                        )}
                        {item.has_destination && !linked && (
                          <span className="text-[10px] bg-[#FFF9EC] text-[#FF9500] px-2 py-0.5 rounded-full">
                            Consumível com destino
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-[11px] text-[#6E6E73] italic">{item.notes}</p>}
                    </div>
                  );
                })}
              </div>

              {result.notes && (
                <div className="bg-[#F2F2F7] rounded-xl px-4 py-3">
                  <p className="text-[12px] text-[#6E6E73]">{result.notes}</p>
                </div>
              )}

              <button onClick={applyToForm}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #5E5CE6, #0071E3)' }}>
                <CheckCircle size={16} /> Preencher formulário de compra
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
