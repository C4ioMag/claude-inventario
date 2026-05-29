import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ScanLine, CheckCircle, Loader, Plus, Minus } from 'lucide-react';
import Fuse from 'fuse.js';

export default function ReceiptScanner({ onClose }) {
  const { equipment, adjustStock } = useApp();
  const [stage, setStage] = useState('upload'); // upload | scanning | review
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [matches, setMatches] = useState([]);
  const [qtys, setQtys] = useState({});
  const [selected, setSelected] = useState({});
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const fuse = new Fuse(equipment, {
    keys: ['name'],
    threshold: 0.45,
    includeScore: true,
  });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setError(null);
  }

  async function runScan() {
    if (!imageFile) return;
    setStage('scanning');
    setProgress(0);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'por'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      setOcrText(text);
      parseAndMatch(text);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar a imagem. Tente uma foto mais nítida.');
      setStage('upload');
    }
  }

  function parseAndMatch(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    const found = new Map();

    for (const line of lines) {
      // Try matching each inventory item against this line
      const results = fuse.search(line);
      if (results.length > 0 && results[0].score < 0.4) {
        const item = results[0].item;
        if (!found.has(item.id)) {
          // Extract quantity: look for numbers in the line
          const nums = line.match(/\b(\d+)\b/g);
          // Pick the smallest number > 0 as likely qty (avoid prices like 150)
          let qty = 1;
          if (nums) {
            const candidates = nums.map(Number).filter((n) => n > 0 && n <= 999);
            if (candidates.length > 0) qty = Math.min(...candidates);
          }
          found.set(item.id, { item, qty, line });
        }
      }
    }

    const matchList = Array.from(found.values());
    setMatches(matchList);
    const initQtys = {};
    const initSelected = {};
    matchList.forEach(({ item, qty }) => {
      initQtys[item.id] = qty;
      initSelected[item.id] = true;
    });
    setQtys(initQtys);
    setSelected(initSelected);
    setStage('review');
  }

  function setQty(id, val) {
    const num = Math.max(1, Math.min(999, Number(val) || 1));
    setQtys((prev) => ({ ...prev, [id]: num }));
  }

  function handleConfirm() {
    matches.forEach(({ item }) => {
      if (selected[item.id]) {
        const qty = qtys[item.id] || 1;
        for (let i = 0; i < qty; i++) adjustStock(item.id, 1);
      }
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Leitura de Nota Fiscal</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* UPLOAD */}
        {stage === 'upload' && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-gray-600">
              Tire uma foto ou selecione um arquivo da nota fiscal. O sistema irá identificar os itens e atualizar o estoque automaticamente.
            </p>

            <label className="block border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {imagePreview ? (
                <img src={imagePreview} alt="Nota" className="max-h-56 mx-auto rounded-lg object-contain" />
              ) : (
                <div>
                  <ScanLine size={40} className="text-blue-300 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 font-medium">Clique para selecionar a foto</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — tire uma foto clara e bem iluminada</p>
                </div>
              )}
            </label>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

            {imagePreview && (
              <button
                onClick={runScan}
                className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ScanLine size={18} /> Analisar Nota
              </button>
            )}
          </div>
        )}

        {/* SCANNING */}
        {stage === 'scanning' && (
          <div className="p-8 text-center space-y-4">
            <Loader size={40} className="text-blue-500 mx-auto animate-spin" />
            <p className="font-semibold text-gray-700">Lendo a nota fiscal...</p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{progress}% concluído</p>
          </div>
        )}

        {/* REVIEW */}
        {stage === 'review' && (
          <div className="p-5 space-y-5">
            {matches.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 font-medium">Nenhum item identificado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tente uma foto mais clara ou com melhor iluminação.
                </p>
                {ocrText && (
                  <details className="mt-4 text-left">
                    <summary className="text-xs text-gray-400 cursor-pointer">Ver texto extraído</summary>
                    <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">{ocrText}</pre>
                  </details>
                )}
                <button onClick={() => setStage('upload')} className="mt-4 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">
                    {matches.length} {matches.length === 1 ? 'item identificado' : 'itens identificados'} — confirme as quantidades
                  </p>
                </div>

                <div className="space-y-2">
                  {matches.map(({ item, line }) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        selected[item.id] ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!selected[item.id]}
                          onChange={(e) => setSelected((s) => ({ ...s, [item.id]: e.target.checked }))}
                          className="mt-1 accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400 truncate">Linha da nota: "{line}"</p>
                          <p className="text-xs text-gray-500 mt-0.5">Estoque atual: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setQty(item.id, (qtys[item.id] || 1) - 1)}
                            disabled={!selected[item.id] || qtys[item.id] <= 1}
                            className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm disabled:opacity-40 hover:bg-white"
                          ><Minus size={12} /></button>
                          <input
                            type="number"
                            min={1}
                            value={qtys[item.id] || 1}
                            onChange={(e) => setQty(item.id, e.target.value)}
                            disabled={!selected[item.id]}
                            className="w-12 text-center border rounded-lg py-1 text-sm focus:outline-none bg-white disabled:opacity-40"
                          />
                          <button
                            onClick={() => setQty(item.id, (qtys[item.id] || 1) + 1)}
                            disabled={!selected[item.id]}
                            className="w-7 h-7 border rounded-lg flex items-center justify-center text-sm disabled:opacity-40 hover:bg-white"
                          ><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {ocrText && (
                  <details className="text-left">
                    <summary className="text-xs text-gray-400 cursor-pointer">Ver texto completo extraído</summary>
                    <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">{ocrText}</pre>
                  </details>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStage('upload')} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">
                    Tentar novamente
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!Object.values(selected).some(Boolean)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    Adicionar ao Estoque
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
