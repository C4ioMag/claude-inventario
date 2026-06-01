import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { X, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';

// ─── Parse the workbook into structured sheet data ─────────────────────────────
function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const result = [];

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          // Find the header row (contains "Quantidade" or "Quantity" or "Nome")
          const headerIdx = rows.findIndex((r) =>
            r.some((c) =>
              /quantidade|quantity|nome|name/i.test(String(c))
            )
          );
          if (headerIdx < 0) return;

          const headers = rows[headerIdx].map((h) => String(h).toLowerCase());
          const nameCol  = headers.findIndex((h) => /nome|name/i.test(h));
          const descCol  = headers.findIndex((h) => /descri/i.test(h));
          const qtyCol   = headers.findIndex((h) => /quantidade|quantity/i.test(h));
          const priceCol = headers.findIndex((h) => /valor unit|unit.?price|unit.?value/i.test(h));
          const noteCol  = headers.findIndex((h) => /nota|note|invoice/i.test(h));

          if (nameCol < 0 || qtyCol < 0) return;

          // Aggregate rows by clean name
          const map = new Map();
          for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            const rawName = String(row[nameCol] || '').trim();
            if (!rawName) continue;

            // Use English part (before " / ") as primary name
            const name = rawName.split(' / ')[0].trim() || rawName;
            const desc = descCol >= 0 ? String(row[descCol] || '').trim() : '';
            const qty  = Math.max(1, parseInt(row[qtyCol]) || 1);
            const price = priceCol >= 0 ? parseFloat(String(row[priceCol]).replace(',', '.')) || 0 : 0;
            const note  = noteCol  >= 0 ? String(row[noteCol]  || '').trim() : '';

            if (map.has(name)) {
              const existing = map.get(name);
              existing.quantity += qty;
              if (desc) existing.descriptions.add(desc);
              if (price > 0) existing.unitPrice = price; // keep last price
            } else {
              map.set(name, {
                name,
                descriptions: desc ? new Set([desc]) : new Set(),
                quantity: qty,
                unitPrice: price,
                note,
              });
            }
          }

          const items = [...map.values()].map((item) => ({
            name: item.name,
            description: [...item.descriptions].join(' · ').slice(0, 200),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }));

          if (items.length > 0) {
            result.push({ sheetName, items });
          }
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Try to match sheet name to existing group ─────────────────────────────────
function matchGroup(sheetName, groups) {
  const s = sheetName.toLowerCase().replace(/[^a-záéíóúãâêôç]/g, '');
  return groups.find((g) => {
    const gn = g.name.toLowerCase().replace(/[^a-záéíóúãâêôç]/g, '');
    return gn === s || s.includes(gn) || gn.includes(s);
  }) || null;
}

// ─── Sheet preview section ─────────────────────────────────────────────────────
function SheetSection({ sheet, groupId, groupName, isNew, enabled, onToggle, items, checkedItems, onCheckItem }) {
  const [open, setOpen] = useState(true);
  const checkedCount = items.filter((_, i) => checkedItems[i] !== false).length;

  return (
    <div className={`border rounded-xl overflow-hidden transition-opacity ${enabled ? '' : 'opacity-50'}`}
      style={{ borderColor: enabled ? '#E5E5EA' : '#F2F2F7' }}>

      {/* Sheet header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F9F9F9]">
        <input type="checkbox" checked={enabled} onChange={onToggle}
          className="w-4 h-4 accent-[#0071E3] cursor-pointer flex-shrink-0" />
        <button className="flex-1 flex items-center justify-between gap-2 text-left" onClick={() => setOpen(v => !v)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#1D1D1F]">{sheet.sheetName}</span>
            {isNew ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#E8F8EC] text-[#34C759]">
                + novo grupo
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EAF4FF] text-[#0071E3]">
                → {groupName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-[#AEAEB2]">{checkedCount}/{items.length} itens</span>
            {open ? <ChevronUp size={13} className="text-[#AEAEB2]" /> : <ChevronDown size={13} className="text-[#AEAEB2]" />}
          </div>
        </button>
      </div>

      {/* Item list */}
      {open && (
        <div className="divide-y divide-[#F2F2F7]">
          {items.map((item, i) => {
            const checked = checkedItems[i] !== false;
            return (
              <label key={i} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F9F9F9] transition-colors ${!checked ? 'opacity-40' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => onCheckItem(i)}
                  className="w-3.5 h-3.5 accent-[#0071E3] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-[11px] text-[#AEAEB2] truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  {item.unitPrice > 0 && (
                    <span className="text-[11px] text-[#34C759] font-medium">
                      ${item.unitPrice.toFixed(2)}/un
                    </span>
                  )}
                  <span className="text-[12px] font-semibold text-[#6E6E73] w-12">
                    × {item.quantity}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ExcelImporter({ onClose }) {
  const { groups, addGroup, addEquipment } = useApp();

  const [stage, setStage]       = useState('upload');   // upload | preview | done
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [sheets, setSheets]     = useState([]);         // parsed sheets
  const [enabled, setEnabled]   = useState({});         // sheetIdx → bool
  const [checked, setChecked]   = useState({});         // sheetIdx_itemIdx → bool
  const [totalImported, setTotalImported] = useState(0);

  // Map each sheet to a group
  function getGroupMapping(sheetName) {
    const match = matchGroup(sheetName, groups);
    return match
      ? { groupId: match.id, groupName: match.name, isNew: false }
      : { groupId: null, groupName: sheetName, isNew: true };
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseWorkbook(file);
      if (parsed.length === 0) {
        setError('Nenhuma aba com dados reconhecidos. Verifique se o arquivo tem as colunas Nome e Quantidade.');
        setLoading(false);
        return;
      }
      setSheets(parsed);
      // All sheets enabled, all items checked by default
      const en = {}, ch = {};
      parsed.forEach((s, si) => {
        en[si] = true;
        s.items.forEach((_, ii) => { ch[`${si}_${ii}`] = true; });
      });
      setEnabled(en);
      setChecked(ch);
      setStage('preview');
    } catch (err) {
      setError(err.message || 'Erro ao processar arquivo.');
    }
    setLoading(false);
  }

  function toggleSheet(si) {
    setEnabled((prev) => ({ ...prev, [si]: !prev[si] }));
  }

  function toggleItem(si, ii) {
    const key = `${si}_${ii}`;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleImport() {
    let count = 0;
    sheets.forEach((sheet, si) => {
      if (!enabled[si]) return;
      const { groupId, groupName, isNew } = getGroupMapping(sheet.sheetName);
      const finalGroupId = isNew ? addGroup(groupName) : groupId;

      sheet.items.forEach((item, ii) => {
        if (checked[`${si}_${ii}`] === false) return;
        addEquipment({
          name: item.name,
          description: item.description || '',
          category: sheet.sheetName,
          quantity: item.quantity,
          photo: null,
          groupId: finalGroupId,
          type: 'returnable',
          lastUnitPrice: item.unitPrice > 0 ? item.unitPrice : undefined,
        });
        count++;
      });
    });
    setTotalImported(count);
    setStage('done');
  }

  const totalToImport = sheets.reduce((s, sheet, si) => {
    if (!enabled[si]) return s;
    return s + sheet.items.filter((_, ii) => checked[`${si}_${ii}`] !== false).length;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto sm:rounded-[22px] rounded-t-[22px]"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F2F2F7] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#E8F8EC] rounded-lg flex items-center justify-center">
              <FileSpreadsheet size={15} className="text-[#34C759]" />
            </div>
            <h2 className="text-[17px] font-semibold text-[#1D1D1F]">Importar Planilha Excel</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full flex items-center justify-center text-[#6E6E73] transition-colors">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6">

          {/* UPLOAD */}
          {stage === 'upload' && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#6E6E73]">
                Selecione o arquivo <strong className="text-[#1D1D1F]">.xlsx</strong>. O sistema vai ler todas as abas automaticamente e criar os itens e grupos correspondentes.
              </p>

              <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                loading ? 'border-[#0071E3]/40 bg-[#F2F2F7]/50' : 'border-[#E5E5EA] hover:border-[#0071E3]/40 hover:bg-[#F9F9F9]'
              }`}>
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" disabled={loading} />
                {loading ? (
                  <>
                    <Loader size={32} className="text-[#0071E3] animate-spin" />
                    <p className="text-[13px] font-medium text-[#6E6E73]">Lendo planilha…</p>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={36} className="text-[#34C759]" />
                    <p className="text-[14px] font-medium text-[#0071E3]">Clique para selecionar o .xlsx</p>
                    <p className="text-[12px] text-[#AEAEB2]">Todas as abas serão lidas automaticamente</p>
                  </>
                )}
              </label>

              {error && (
                <div className="flex items-start gap-2.5 bg-[#FFF2F1] rounded-xl p-3">
                  <AlertCircle size={15} className="text-[#FF3B30] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[#FF3B30]">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {stage === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#6E6E73]">
                  <strong className="text-[#1D1D1F]">{sheets.length} abas</strong> encontradas.
                  Desmarque o que não quer importar.
                </p>
                <span className="text-[12px] font-semibold text-[#0071E3]">
                  {totalToImport} itens selecionados
                </span>
              </div>

              <div className="space-y-2.5">
                {sheets.map((sheet, si) => {
                  const { groupId, groupName, isNew } = getGroupMapping(sheet.sheetName);
                  const itemChecks = {};
                  sheet.items.forEach((_, ii) => { itemChecks[ii] = checked[`${si}_${ii}`] !== false; });
                  return (
                    <SheetSection
                      key={si}
                      sheet={sheet}
                      groupId={groupId}
                      groupName={groupName}
                      isNew={isNew}
                      enabled={enabled[si]}
                      onToggle={() => toggleSheet(si)}
                      items={sheet.items}
                      checkedItems={itemChecks}
                      onCheckItem={(ii) => toggleItem(si, ii)}
                    />
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button onClick={() => setStage('upload')}
                  className="flex-1 bg-[#F2F2F7] text-[#1D1D1F] py-3 rounded-xl text-[14px] font-medium hover:bg-[#E5E5EA] transition-colors">
                  ← Voltar
                </button>
                <button onClick={handleImport} disabled={totalToImport === 0}
                  className="flex-1 text-white py-3 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(180deg,#34C759 0%,#28A745 100%)', boxShadow: '0 2px 8px rgba(52,199,89,0.35)' }}>
                  Importar {totalToImport} {totalToImport === 1 ? 'item' : 'itens'}
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {stage === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#E8F8EC] rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-[#34C759]" />
              </div>
              <div>
                <p className="text-[18px] font-bold text-[#1D1D1F]">Importação concluída!</p>
                <p className="text-[14px] text-[#6E6E73] mt-1">
                  {totalImported} {totalImported === 1 ? 'item importado' : 'itens importados'} para o estoque.
                </p>
              </div>
              <button onClick={onClose}
                className="text-white px-8 py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(180deg,#0071E3 0%,#0062C9 100%)', boxShadow: '0 2px 8px rgba(0,113,227,0.35)' }}>
                Ver equipamentos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
