import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ScanLine, Loader, Plus, CheckCircle, AlertCircle, KeyRound, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'gemini_api_key';

function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
function saveApiKey(key) { localStorage.setItem(STORAGE_KEY, key); }

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readReceiptWithGemini(apiKey, base64Image, mimeType) {
  const prompt = `Analise esta imagem de nota fiscal ou invoice. Extraia TODOS os itens/produtos listados com suas quantidades.

Retorne APENAS um JSON array neste formato exato:
[
  {"name": "nome do item exatamente como escrito", "quantity": 2},
  {"name": "outro item", "quantity": 1}
]

Regras:
- Inclua TODOS os itens que conseguir ver
- Se a quantidade não estiver clara, use 1
- Não inclua valores monetários, apenas itens e quantidades
- Retorne SOMENTE o JSON, sem explicações`;

  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];
  let response, lastError;

  for (const model of models) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Image } }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    if (response.ok) break;
    const errBody = await response.json().catch(() => ({}));
    lastError = errBody.error?.message || `Erro ${response.status}`;
    if (response.status === 400 || response.status === 403) break;
  }

  if (!response.ok) throw new Error(`Google API: ${lastError}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Não foi possível interpretar a resposta. Tente novamente.');
  return JSON.parse(jsonMatch[0]);
}

// ─── API Key Setup ─────────────────────────────────────────────────────────────
function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3 bg-apple-blue/6 border border-apple-blue/20 rounded-apple p-4">
        <KeyRound size={18} className="text-apple-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-apple-text">
          <p className="font-semibold mb-1">Configure sua chave do Google Gemini</p>
          <p className="text-apple-text-2">A leitura de notas usa IA para ler a imagem. É gratuito:</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside text-apple-text-2">
            <li>Acesse <strong className="text-apple-text">aistudio.google.com</strong></li>
            <li>Clique em <strong className="text-apple-text">Get API Key</strong></li>
            <li>Crie ou selecione um projeto</li>
            <li>Copie a chave e cole abaixo</li>
          </ol>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-apple-text mb-1.5">Chave da API Gemini</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-apple-bg border border-apple-border rounded-apple px-3.5 py-2.5 pr-16 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 focus:border-apple-blue transition-all"
          />
          <button onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-2 text-xs font-medium hover:text-apple-text">
            {show ? 'ocultar' : 'ver'}
          </button>
        </div>
      </div>

      <button onClick={() => { saveApiKey(key.trim()); onSave(key.trim()); }} disabled={!key.trim()}
        className="w-full bg-apple-blue text-white py-2.5 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover shadow-apple disabled:opacity-50 transition-all">
        Salvar e Continuar
      </button>
    </div>
  );
}

// ─── Main Scanner ──────────────────────────────────────────────────────────────
export default function ReceiptScanner({ onClose }) {
  const { equipment, adjustStock, addEquipment, groups } = useApp();
  const [apiKey, setApiKey] = useState(getApiKey());
  const [stage, setStage] = useState(apiKey ? 'upload' : 'setup');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [decisions, setDecisions] = useState({});

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleScan() {
    if (!imageFile) return;
    setScanning(true);
    setError(null);
    try {
      const base64 = await fileToBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';
      const extracted = await readReceiptWithGemini(apiKey, base64, mimeType);
      setItems(extracted);
      const init = {};
      extracted.forEach((item, i) => {
        const name = item.name.toLowerCase();
        const match = equipment.find((e) =>
          e.name.toLowerCase().includes(name) || name.includes(e.name.toLowerCase())
        );
        init[i] = { action: match ? 'match' : 'new', matchId: match?.id || '', qty: item.quantity || 1, newGroup: groups[0]?.id || 'campo' };
      });
      setDecisions(init);
      setStage('review');
    } catch (err) {
      setError(err.message || 'Erro ao ler a nota. Tente novamente.');
    } finally {
      setScanning(false);
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
        addEquipment({ name: item.name, description: '', category: '', quantity: d.qty, photo: null, groupId: d.newGroup });
      }
    });
    onClose();
  }

  const activeCount = Object.values(decisions).filter((d) => d?.action !== 'skip').length;
  const selectClass = "w-full bg-apple-bg border border-apple-border rounded-apple px-3 py-2 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40 appearance-none pr-8 transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-apple-card rounded-apple-lg shadow-apple-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-apple-blue" />
            <h2 className="font-semibold text-apple-text">Leitura de Nota / Invoice</h2>
          </div>
          <div className="flex items-center gap-3">
            {stage !== 'setup' && (
              <button onClick={() => setStage('setup')} className="text-xs text-apple-text-2 hover:text-apple-text flex items-center gap-1 transition-colors">
                <KeyRound size={13} /> API
              </button>
            )}
            <button onClick={onClose} className="text-apple-text-2 hover:text-apple-text transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {stage === 'setup' && (
            <ApiKeySetup onSave={(k) => { setApiKey(k); setStage('upload'); }} />
          )}

          {stage === 'upload' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-apple-text-2">Selecione uma foto da nota fiscal ou invoice. Quanto mais nítida, melhor o resultado.</p>

              <label className="block border-2 border-dashed border-apple-border rounded-apple cursor-pointer hover:border-apple-blue/40 hover:bg-apple-blue/3 transition-colors overflow-hidden">
                <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" capture="environment" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Nota" className="max-h-64 w-full object-contain" />
                ) : (
                  <div className="p-8 text-center">
                    <ScanLine size={36} className="text-apple-text-3 mx-auto mb-2" />
                    <p className="text-sm text-apple-blue font-medium">Clique para selecionar a foto</p>
                    <p className="text-xs text-apple-text-3 mt-1">JPG, PNG, HEIC</p>
                  </div>
                )}
              </label>

              {error && (
                <div className="flex items-start gap-2.5 bg-apple-red/6 border border-apple-red/20 rounded-apple p-3">
                  <AlertCircle size={16} className="text-apple-red flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-apple-red">{error}</p>
                </div>
              )}

              <button onClick={handleScan} disabled={!imageFile || scanning}
                className="w-full bg-apple-blue text-white py-3 rounded-apple text-sm font-semibold hover:bg-apple-blue-hover disabled:opacity-50 shadow-apple flex items-center justify-center gap-2 transition-all">
                {scanning ? (
                  <><Loader size={16} className="animate-spin" /> Lendo a nota...</>
                ) : (
                  <><ScanLine size={16} /> Ler Nota com IA</>
                )}
              </button>
            </div>
          )}

          {stage === 'review' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-apple-green" />
                <p className="text-sm font-semibold text-apple-text">
                  {items.length} {items.length === 1 ? 'item encontrado' : 'itens encontrados'} — revise e confirme
                </p>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => {
                  const d = decisions[i] || {};
                  const skipped = d.action === 'skip';
                  return (
                    <div key={i} className={`rounded-apple border border-apple-border p-3.5 space-y-2.5 transition-opacity ${skipped ? 'opacity-40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-apple-text">{item.name}</p>
                          <p className="text-xs text-apple-text-3">Lido da nota</p>
                        </div>
                        <button
                          onClick={() => setDecision(i, { action: skipped ? (decisions[i]?.matchId ? 'match' : 'new') : 'skip' })}
                          className={`text-xs px-2.5 py-1 rounded-apple border flex-shrink-0 transition-colors ${
                            skipped ? 'border-apple-border text-apple-text-2 hover:bg-apple-bg' : 'border-apple-red/25 text-apple-red hover:bg-apple-red/5'
                          }`}>
                          {skipped ? 'restaurar' : 'ignorar'}
                        </button>
                      </div>

                      {!skipped && (
                        <>
                          <div className="flex gap-2">
                            <button onClick={() => setDecision(i, { action: 'match' })}
                              className={`flex-1 py-1.5 rounded-apple text-xs font-medium border transition-colors ${
                                d.action === 'match' ? 'bg-apple-blue text-white border-apple-blue' : 'border-apple-border text-apple-text-2 hover:border-apple-blue/40 hover:text-apple-blue'
                              }`}>
                              Vincular a item existente
                            </button>
                            <button onClick={() => setDecision(i, { action: 'new' })}
                              className={`flex-1 py-1.5 rounded-apple text-xs font-medium border transition-colors ${
                                d.action === 'new' ? 'bg-apple-green text-white border-apple-green' : 'border-apple-border text-apple-text-2 hover:border-apple-green/40 hover:text-apple-green'
                              }`}>
                              Criar item novo
                            </button>
                          </div>

                          {d.action === 'match' && (
                            <div className="relative">
                              <select value={d.matchId || ''} onChange={(e) => setDecision(i, { matchId: e.target.value })} className={selectClass}>
                                <option value="">— selecione o item —</option>
                                {equipment.map((e) => (
                                  <option key={e.id} value={e.id}>{e.name} (estoque: {e.quantity})</option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-3 pointer-events-none" />
                            </div>
                          )}

                          {d.action === 'new' && (
                            <div className="relative">
                              <select value={d.newGroup || groups[0]?.id} onChange={(e) => setDecision(i, { newGroup: e.target.value })} className={selectClass}>
                                {groups.map((g) => <option key={g.id} value={g.id}>Grupo: {g.name}</option>)}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-3 pointer-events-none" />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-apple-text-2 flex-shrink-0">Quantidade:</span>
                            <button onClick={() => setDecision(i, { qty: Math.max(1, (d.qty || 1) - 1) })}
                              className="w-7 h-7 border border-apple-border rounded-apple bg-apple-bg flex items-center justify-center text-sm text-apple-text hover:bg-apple-border/30 transition-colors">−</button>
                            <input type="number" min={1} value={d.qty || 1}
                              onChange={(e) => setDecision(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-14 text-center bg-apple-bg border border-apple-border rounded-apple py-1 text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue/40" />
                            <button onClick={() => setDecision(i, { qty: (d.qty || 1) + 1 })}
                              className="w-7 h-7 bg-apple-blue text-white rounded-apple flex items-center justify-center text-sm hover:bg-apple-blue-hover transition-colors">+</button>
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

        {stage === 'review' && (
          <div className="p-5 border-t border-apple-border flex gap-3 flex-shrink-0">
            <button onClick={() => setStage('upload')} className="flex-1 bg-apple-bg border border-apple-border text-apple-text py-2.5 rounded-apple text-sm font-medium hover:bg-apple-border/30 transition-colors">
              ← Voltar
            </button>
            <button onClick={handleConfirm} disabled={activeCount === 0}
              className="flex-1 bg-apple-green text-white py-2.5 rounded-apple text-sm font-semibold hover:opacity-90 shadow-apple disabled:opacity-50 transition-all">
              Aplicar {activeCount} {activeCount === 1 ? 'item' : 'itens'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
