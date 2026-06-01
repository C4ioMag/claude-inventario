import XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const wb = XLSX.readFile('inventory.xlsx');

let sql = `-- ============================================================
-- IMPORTAÇÃO DO INVENTARIO
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

-- Limpar dados existentes
DELETE FROM purchase_lines;
DELETE FROM purchases;
DELETE FROM outing_pending_resolved;
DELETE FROM outing_pending_items;
DELETE FROM outing_items;
DELETE FROM outings;
DELETE FROM equipment;
DELETE FROM groups;

`;

let idCounter = 1;
function gid() { return 'id' + String(idCounter++).padStart(5,'0'); }
function esc(s) { return String(s||'').replace(/'/g,"''"); }
function eng(s) { return esc(String(s||'').split(' / ')[0].trim()); }
function num(v) { const n = parseFloat(String(v||'0').replace(/[^0-9.]/g,'')); return isNaN(n)?0:n; }
function qty(v) { const n = parseInt(String(v||'1')); return (isNaN(n)||n<=0)?1:n; }

function rows(sheetName) {
  const ws = wb.Sheets[sheetName];
  const all = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
  const hi = all.findIndex(r => r.some(c => /nome|name/i.test(String(c))));
  if (hi < 0) return [];
  return all.slice(hi+1).filter(r => /^\d+$/.test(String(r[0]||'').trim()));
}

// ── GROUPS ────────────────────────────────────────────────────────────────────
const stockSheets = [
  { sheet:'Verizon GPS',   gid:'verizon-gps',   name:'Verizon GPS',   cat:'Rastreamento' },
  { sheet:'Materiais',     gid:'materiais',      name:'Materiais',     cat:'Materiais' },
  { sheet:'Campo',         gid:'campo',          name:'Campo',         cat:'Campo' },
  { sheet:'Mecanica',      gid:'mecanica',       name:'Mecânica',      cat:'Mecânica' },
  { sheet:'Elier',         gid:'elier',          name:'Elier',         cat:'Mecânica' },
  { sheet:'Diesel Laptop', gid:'diesel-laptop',  name:'Diesel Laptop', cat:'Eletrônicos' },
];

sql += `-- GRUPOS\n`;
for (const s of stockSheets) {
  sql += `INSERT INTO groups (id, name) VALUES ('${s.gid}', '${esc(s.name)}');\n`;
}

// ── EQUIPMENT ─────────────────────────────────────────────────────────────────
sql += `\n-- ESTOQUE\n`;
let totalEquip = 0;

for (const { sheet, gid: groupId, cat } of stockSheets) {
  const data = rows(sheet);
  const agg = {};
  for (const r of data) {
    const name = String(r[1]||'').split(' / ')[0].trim();
    if (!name) continue;
    const desc = String(r[2]||'').trim();
    const q = qty(r[3]);
    if (!agg[name]) agg[name] = { name, descs:[], totalQty:0 };
    agg[name].totalQty += q;
    if (desc) agg[name].descs.push(desc);
  }
  for (const item of Object.values(agg)) {
    const id = gid();
    const notes = item.descs.length > 1
      ? item.descs.slice(0,5).join(' | ') + (item.descs.length>5 ? ` (+${item.descs.length-5} mais)` : '')
      : (item.descs[0]||'');
    sql += `INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('${id}','${esc(item.name)}','${esc(cat)}','${groupId}',${item.totalQty},0,'returnable',0,${notes?`'${esc(notes)}'`:'NULL'});\n`;
    totalEquip++;
  }
}

// ── PURCHASES ─────────────────────────────────────────────────────────────────
sql += `\n-- COMPRAS\n`;
let totalPurch = 0, totalLines = 0;

function addPurchase({ date, location, notes, lines }) {
  const id = gid();
  const grand = lines.reduce((s,l)=>s+l.qty*l.price,0);
  sql += `INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('${id}',${date?`'${date}'`:'NULL'},${location?`'${esc(location)}'`:'NULL'},${notes?`'${esc(notes)}'`:'NULL'},NULL,${grand.toFixed(2)});\n`;
  for (const l of lines) {
    const lid = gid();
    sql += `INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('${lid}','${id}',NULL,'${esc(l.name)}',${l.qty},${l.price.toFixed(2)});\n`;
    totalLines++;
  }
  totalPurch++;
}

// Tires & Wheels — group by invoice
{
  const data = rows('Tires & Wheels');
  const byInv = {};
  for (const r of data) {
    const name  = String(r[1]||'').split(' / ')[0].trim();
    const desc  = String(r[2]||'').trim();
    const q     = num(r[3])||1;
    const price = num(r[4]);
    const inv   = String(r[6]||'').replace('Invoice ','').trim();
    if (!name||!inv) continue;
    if (!byInv[inv]) byInv[inv]=[];
    byInv[inv].push({ name: desc?`${name} (${desc})`:name, qty:q, price });
  }
  for (const [inv, lines] of Object.entries(byInv)) {
    addPurchase({ date:null, location:'Tires & Wheels Shop', notes:`Invoice ${inv}`, lines });
  }
}

// Trailer Parts — 05/26/2026
{
  const lines = rows('Trailer Parts').map(r=>({ name:String(r[1]||'').split(' / ')[0].trim(), qty:num(r[3])||1, price:num(r[4]) })).filter(l=>l.name);
  addPurchase({ date:'2026-05-26', location:'Walker Customer', notes:'Walker Customer — Trailer Parts', lines });
}

// AutoZone — 06/01/2026
{
  const lines = rows('AutoZone Parts').map(r=>({ name:String(r[1]||'').split(' / ')[0].trim()+(r[2]?` — ${String(r[2]).trim()}`:''), qty:num(r[3])||1, price:num(r[4]) })).filter(l=>l.name);
  lines.push({ name:'Tax', qty:1, price:7.06 });
  addPurchase({ date:'2026-06-01', location:'TRK-016', notes:"AutoZone Invoice 03666652168", lines });
}

// Home Depot — 06/01/2026
{
  const lines = rows('Home Depot').map(r=>({ name:String(r[1]||'').split(' / ')[0].trim()+(r[2]?` — ${String(r[2]).trim()}`:''), qty:num(r[3])||1, price:num(r[4]) })).filter(l=>l.name);
  addPurchase({ date:'2026-06-01', location:'office', notes:"Home Depot receipt 8926 62 33613", lines });
}

// OReilly — 2 invoices
{
  const inv1=[], inv2=[];
  for (const r of rows('OReilly Parts')) {
    const d = String(r[7]||'');
    const line = { name:String(r[1]||'').split(' / ')[0].trim()+(r[2]?` — ${String(r[2]).trim()}`:''), qty:num(r[3])||1, price:num(r[4]) };
    if (!line.name) continue;
    if (d==='06/01/2026') inv1.push(line);
    else if (d==='05/29/2026') inv2.push(line);
  }
  addPurchase({ date:'2026-06-01', location:'TRK-016', notes:"O'Reilly Invoice 4397-402692", lines:inv1 });
  addPurchase({ date:'2026-05-29', location:'TRK-021', notes:"O'Reilly Invoice 4397-402240 + Tax $2.60", lines:[...inv2,{name:'Tax',qty:1,price:2.60}] });
}
// Ford Parts = same as OReilly 4397-402240 → skip

sql += `\n-- FIM\n-- Resultado: ${totalEquip} itens estoque, ${totalPurch} compras, ${totalLines} linhas\n`;

writeFileSync('import-data.sql', sql);
console.log(`✅ Arquivo gerado: import-data.sql`);
console.log(`   ${stockSheets.length} grupos`);
console.log(`   ${totalEquip} itens de estoque`);
console.log(`   ${totalPurch} compras`);
console.log(`   ${totalLines} linhas de compra`);
