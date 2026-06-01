import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://pyvewaqtvaxpkfbycpmj.supabase.co',
  'sb_publishable_txs5nhnfkN4J-ai2RFGZUQ_xRXRlyoP'
);

function gid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function eng(s) { return String(s || '').split('/')[0].trim(); }
function num(v) { const n = parseFloat(String(v || '0').replace(/[^0-9.]/g,'')); return isNaN(n) ? 0 : n; }
function qty(v) { const n = parseInt(String(v || '1')); return isNaN(n) || n <= 0 ? 1 : n; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Read workbook ─────────────────────────────────────────────────────────────
const wb = XLSX.readFile('inventory.xlsx');

function rows(sheetName) {
  const ws = wb.Sheets[sheetName];
  const all = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Find header row (has "Nome" or "Name")
  const hi = all.findIndex(r => r.some(c => /nome|name/i.test(String(c))));
  if (hi < 0) return [];
  return all.slice(hi + 1).filter(r => {
    const first = String(r[0] || '');
    // Skip empty, totals, subtotals, tax lines
    return first && /^\d+$/.test(first.trim());
  });
}

// ── 1. CLEAR existing data ────────────────────────────────────────────────────
console.log('Limpando dados existentes…');
await supabase.from('purchase_lines').delete().neq('id','__none__');
await supabase.from('purchases').delete().neq('id','__none__');
await supabase.from('outing_pending_resolved').delete().neq('id','__none__');
await supabase.from('outing_pending_items').delete().neq('id','__none__');
await supabase.from('outing_items').delete().neq('id','__none__');
await supabase.from('outings').delete().neq('id','__none__');
await supabase.from('equipment').delete().neq('id','__none__');
await supabase.from('groups').delete().neq('id','__none__');
console.log('✓ Banco limpo\n');

// ── 2. ESTOQUE sheets (sem valor) ─────────────────────────────────────────────
const stockSheets = [
  { sheet: 'Verizon GPS', groupId: 'verizon-gps',   groupName: 'Verizon GPS',   cat: 'Rastreamento' },
  { sheet: 'Materiais',   groupId: 'materiais',      groupName: 'Materiais',     cat: 'Materiais' },
  { sheet: 'Campo',       groupId: 'campo',           groupName: 'Campo',         cat: 'Campo' },
  { sheet: 'Mecanica',    groupId: 'mecanica',        groupName: 'Mecânica',      cat: 'Mecânica' },
  { sheet: 'Elier',       groupId: 'elier',           groupName: 'Elier',         cat: 'Mecânica' },
  { sheet: 'Diesel Laptop',groupId:'diesel-laptop',  groupName: 'Diesel Laptop', cat: 'Eletrônicos' },
];

const groupsToInsert = stockSheets.map(s => ({ id: s.groupId, name: s.groupName }));
const { error: ge } = await supabase.from('groups').insert(groupsToInsert);
if (ge) console.error('Grupos error:', ge.message);
else console.log(`✓ ${groupsToInsert.length} grupos criados`);

const equipmentToInsert = [];

for (const { sheet, groupId, cat } of stockSheets) {
  const data = rows(sheet);
  // Aggregate duplicate names (Verizon GPS has 17 same-name rows)
  const agg = {};
  for (const r of data) {
    const name = eng(r[1]);
    if (!name) continue;
    const desc = String(r[2] || '').trim();
    const q    = qty(r[3]);
    if (!agg[name]) agg[name] = { name, descriptions: [], totalQty: 0 };
    agg[name].totalQty += q;
    if (desc) agg[name].descriptions.push(desc);
  }
  for (const item of Object.values(agg)) {
    const notes = item.descriptions.length > 1
      ? item.descriptions.slice(0, 5).join(' | ') + (item.descriptions.length > 5 ? ` (+${item.descriptions.length-5} mais)` : '')
      : (item.descriptions[0] || null);
    equipmentToInsert.push({
      id: gid(),
      name: item.name,
      category: cat,
      group_id: groupId,
      quantity: item.totalQty,
      in_use: 0,
      type: 'returnable',
      last_unit_price: 0,
      notes: notes,
      photo: null,
    });
    await sleep(1); // ensure unique gid
  }
  console.log(`  ${sheet}: ${Object.keys(agg).length} itens`);
}

const { error: ee } = await supabase.from('equipment').insert(equipmentToInsert);
if (ee) console.error('Equipment error:', ee.message);
else console.log(`✓ ${equipmentToInsert.length} itens de estoque inseridos\n`);

// ── 3. COMPRAS sheets (com valor) ─────────────────────────────────────────────
// Ford Parts = same as OReilly invoice 4397-402240 → skip (avoid duplicate)
// Tires & Wheels → group by invoice number (no date)
// Trailer Parts → one purchase, date from note 05/26/2026
// AutoZone → one purchase per invoice, date from column
// Home Depot → one purchase, date from column
// OReilly → two invoices: 4397-402692 (06/01) and 4397-402240 (05/29)

const purchasesToInsert = [];
const linesToInsert = [];

function addPurchase({ date, location, notes, lines }) {
  const id = gid();
  const grandTotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  purchasesToInsert.push({ id, date: date || null, location: location || null, notes: notes || null, outing_id: null, grand_total: grandTotal, receipt_data_url: null, receipt_type: null, receipt_name: null });
  for (const l of lines) {
    linesToInsert.push({ id: gid(), purchase_id: id, equipment_id: null, name: l.name, qty: l.qty, unit_price: l.unit_price });
  }
  return id;
}

// — Tires & Wheels (group by invoice) ——————————————————
{
  const data = rows('Tires & Wheels');
  const byInvoice = {};
  for (const r of data) {
    const name   = eng(r[1]);
    const desc   = String(r[2] || '').trim();
    const q      = num(r[3]) || 1;
    const price  = num(r[4]);
    const invoice= String(r[6] || '').replace('Invoice ','').trim();
    if (!name || !invoice) continue;
    if (!byInvoice[invoice]) byInvoice[invoice] = [];
    byInvoice[invoice].push({ name: desc ? `${name} (${desc})` : name, qty: q, unit_price: price });
    await sleep(1);
  }
  for (const [invoice, lines] of Object.entries(byInvoice)) {
    addPurchase({ date: null, location: 'Tires & Wheels Shop', notes: `Invoice ${invoice}`, lines });
    await sleep(1);
  }
  console.log(`Tires & Wheels: ${Object.keys(byInvoice).length} compras (${Object.keys(byInvoice).join(', ')})`);
}

// — Trailer Parts ——————————————————————————————————————
{
  const data = rows('Trailer Parts');
  const lines = data.map(r => ({ name: eng(r[1]), qty: num(r[3]) || 1, unit_price: num(r[4]) })).filter(l => l.name);
  addPurchase({ date: '2026-05-26', location: 'Walker Customer', notes: 'Walker Customer - Trailer Parts', lines });
  await sleep(1);
  console.log(`Trailer Parts: 1 compra (${lines.length} itens)`);
}

// — AutoZone ————————————————————————————————————————————
{
  const data = rows('AutoZone Parts');
  const lines = data.map(r => ({
    name: eng(r[1]) + (r[2] ? ` — ${r[2]}` : ''),
    qty: num(r[3]) || 1,
    unit_price: num(r[4]),
  })).filter(l => l.name);
  // Add tax as line
  const tax = 7.06;
  lines.push({ name: 'Tax', qty: 1, unit_price: tax });
  const invoice = 'AutoZone Invoice 03666652168';
  addPurchase({ date: '2026-06-01', location: 'TRK-016', notes: invoice, lines });
  await sleep(1);
  console.log(`AutoZone: 1 compra (${lines.length} itens)`);
}

// — Home Depot ——————————————————————————————————————————
{
  const data = rows('Home Depot');
  const lines = data.map(r => ({
    name: eng(r[1]) + (r[2] ? ` — ${r[2]}` : ''),
    qty: num(r[3]) || 1,
    unit_price: num(r[4]),
  })).filter(l => l.name);
  addPurchase({ date: '2026-06-01', location: 'office', notes: 'Home Depot receipt 8926 62 33613', lines });
  await sleep(1);
  console.log(`Home Depot: 1 compra (${lines.length} itens)`);
}

// — OReilly (2 invoices) ———————————————————————————————
{
  const allRows = rows('OReilly Parts');
  // Split by invoice (detect by date column change)
  const inv1 = [], inv2 = [];
  for (const r of allRows) {
    const dateStr = String(r[7] || '');
    const name = eng(r[1]);
    if (!name) continue;
    const line = { name: name + (r[2] ? ` — ${r[2]}` : ''), qty: num(r[3]) || 1, unit_price: num(r[4]) };
    if (dateStr === '06/01/2026') inv1.push(line);
    else if (dateStr === '05/29/2026') inv2.push(line);
  }
  inv1.push({ name: 'Tax', qty: 1, unit_price: 0 }); // no tax on this one
  inv2.push({ name: 'Tax', qty: 1, unit_price: 2.60 });
  addPurchase({ date: '2026-06-01', location: 'TRK-016', notes: "O'Reilly Invoice 4397-402692", lines: inv1 });
  await sleep(1);
  addPurchase({ date: '2026-05-29', location: 'TRK-021', notes: "O'Reilly Invoice 4397-402240", lines: inv2 });
  await sleep(1);
  console.log(`OReilly: 2 compras`);
}

// Ford Parts = duplicata da OReilly 4397-402240 → pulando
console.log('Ford Parts: pulado (mesmo que O\'Reilly Invoice 4397-402240)');

// ── Insert purchases ──────────────────────────────────────────────────────────
console.log(`\nInserindo ${purchasesToInsert.length} compras e ${linesToInsert.length} linhas…`);
const { error: pe } = await supabase.from('purchases').insert(purchasesToInsert);
if (pe) { console.error('Purchases error:', pe.message); process.exit(1); }

const { error: le } = await supabase.from('purchase_lines').insert(linesToInsert);
if (le) { console.error('Lines error:', le.message); process.exit(1); }

console.log(`\n✅ IMPORTAÇÃO CONCLUÍDA`);
console.log(`   ${equipmentToInsert.length} itens de estoque`);
console.log(`   ${groupsToInsert.length} grupos`);
console.log(`   ${purchasesToInsert.length} compras`);
console.log(`   ${linesToInsert.length} linhas de compra`);
