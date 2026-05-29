import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ScanLine, Loader, Plus, CheckCircle, AlertCircle, KeyRound, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'gemini_api_key';

function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key);
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
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

  // Try models in order until one works
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];
  let response, lastError;

  for (const model of models) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    if (response.ok) break;
    const errBody = await response.json().catch(() => ({}));
    lastError = errBody.error?.message || `Erro ${response.status}`;
    if (response.status === 400 || response.status === 403) break; // bad key, no point retrying
  }

  if (!response.ok) {
    throw new Error(`Google API: ${lastError}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Não foi possível interpretar a resposta. Tente novamente.');
  return JSON.parse(jsonMatch[0]);
}

// ─── API Key Setup Screen ──────────────────────────────────────────────────────
function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <KeyRound size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Configure sua chave do Google Gemini</p>
          <p>A leitura de notas usa IA para ler a imagem. É gratuito:</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside text-blue-700">
            <li>Acesse <strong>aistudio.google.com</strong></li>
            <li>Clique em <strong>Get API Key</strong></li>
            <li>Crie ou selecione um projeto</li>
            <li>Copie a chave e cole abaixo</li>
          </ol>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chave da API Gemini</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            {show ? 'ocultar' : 'ver'}
          </button>
        </div>
      </div>

      <button
        onClick={() => { saveApiKey(key.trim()); onSave(key.trim()); }}
        disabled={!key.trim()}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
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
  // extracted items from Gemini
  const [items, setItems] = useState([]);
  // per-item decisions: { action: 'match'|'new'|'skip', matchId, qty, newGroup }
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
      // Default decisions: try to auto-match each item
      const init = {};
      extracted.forEach((item, i) => {
        const name = item.name.toLowerCase();
        const match = equipment.find((e) =>
          e.name.toLowerCase().includes(name) || name.includes(e.name.toLowerCase())
        );
        init[i] = {
          action: match ? 'match' : 'new',
          matchId: match?.id || '',
          qty: item.quantity || 1,
          newGroup: groups[0]?.id || 'campo',
        };
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
        addEquipment({
          name: item.name,
          description: '',
          category: '',
          quantity: d.qty,
          photo: null,
          groupId: d.newGroup,
        });
      }
    });
    onClose();
  }

  const activeCount = Object.values(decisions).filter((d) => d?.action !== 'skip').length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-purple-600" />
            <h2 className="font-semibold text-gray-800">Leitura de Nota / Invoice</h2>
          </div>
          <div className="flex items-center gap-2">
            {stage !== 'setup' && (
              <button onClick={() => setStage('setup')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <KeyRound size={13} /> API
              </button>
            )}
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* SETUP */}
          {stage === 'setup' && (
            <ApiKeySetup onSave={(k) => { setApiKey(k); setStage('upload'); }} />
          )}

          {/* UPLOAD */}
          {stage === 'upload' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Selecione uma foto da nota fiscal ou invoice. Quanto mais nítida, melhor o resultado.</p>

              <label className="block border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors overflow-hidden">
                <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" capture="environment" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Nota" className="max-h-64 w-full object-contain" />
                ) : (
                  <div className="p-8 text-center">
                    <ScanLine size={40} className="text-purple-300 mx-auto mb-2" />
                    <p className="text-sm text-purple-600 font-medium">Clique para selecionar a foto</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC</p>
                  </div>
                )}
              </label>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={!imageFile || scanning}
                className="w-full bg-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <><Loader size={18} className="animate-spin" /> Lendo a nota...</>
                ) : (
                  <><ScanLine size={18} /> Ler Nota com IA</>
                )}
              </button>
            </div>
          )}

          {/* REVIEW */}
          {stage === 'review' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm font-semibold text-gray-700">
                  {items.length} {items.length === 1 ? 'item encontrado' : 'itens encontrados'} — revise e confirme
                </p>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => {
                  const d = decisions[i] || {};
                  const skipped = d.action === 'skip';
                  return (
                    <div key={i} className={`rounded-xl border p-3 space-y-2 transition-opacity ${skipped ? 'opacity-40' : 'border-gray-200'}`}>
                      {/* Item name from receipt */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">Lido da nota</p>
                        </div>
                        <button
                          onClick={() => setDecision(i, { action: skipped ? (decisions[i]?.matchId ? 'match' : 'new') : 'skip' })}
                          className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${skipped ? 'border-gray-300 text-gray-500' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                        >
                          {skipped ? 'restaurar' : 'ignorar'}
                        </button>
                      </div>

                      {!skipped && (
                        <>
                          {/* Action selector */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDecision(i, { action: 'match' })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                d.action === 'match' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                              }`}
                            >
                              Vincular a item existente
                            </button>
                            <button
                              onClick={() => setDecision(i, { action: 'new' })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                d.action === 'new' ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-300'
                              }`}
                            >
                              Criar item novo
                            </button>
                          </div>

                          {/* Match to existing */}
                          {d.action === 'match' && (
                            <div className="relative">
                              <select
                                value={d.matchId || ''}
                                onChange={(e) => setDecision(i, { matchId: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                              >
                                <option value="">— selecione o item —</option>
                                {equipment.map((e) => (
                                  <option key={e.id} value={e.id}>{e.name} (estoque: {e.quantity})</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          )}

                          {/* New item group */}
                          {d.action === 'new' && (
                            <div className="relative">
                              <select
                                value={d.newGroup || groups[0]?.id}
                                onChange={(e) => setDecision(i, { newGroup: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
                              >
                                {groups.map((g) => <option key={g.id} value={g.id}>Grupo: {g.name}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          )}

                          {/* Quantity */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 flex-shrink-0">Quantidade:</span>
                            <button onClick={() => setDecision(i, { qty: Math.max(1, (d.qty || 1) - 1) })}
                              className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm hover:bg-gray-50">−</button>
                            <input
                              type="number" min={1} value={d.qty || 1}
                              onChange={(e) => setDecision(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-16 text-center border rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button onClick={() => setDecision(i, { qty: (d.qty || 1) + 1 })}
                              className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm hover:bg-gray-50">+</button>
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
          <div className="p-5 border-t flex gap-3 flex-shrink-0">
            <button onClick={() => setStage('upload')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm">
              ← Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={activeCount === 0}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Aplicar {activeCount} {activeCount === 1 ? 'item' : 'itens'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
