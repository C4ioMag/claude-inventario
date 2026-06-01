import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_ADMIN, DEFAULT_GROUPS, INITIAL_EQUIPMENT } from '../data/initialData';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

function gid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── localStorage helpers (used only for users + currentUser) ─────────────────
function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ── DB ↔ App mapping ──────────────────────────────────────────────────────────
const dbToGroup = (r) => ({ id: r.id, name: r.name });
const groupToDb = (g) => ({ id: g.id, name: g.name });

const dbToEquipment = (r) => ({
  id: r.id, name: r.name, category: r.category, groupId: r.group_id,
  quantity: r.quantity, inUse: r.in_use, type: r.type,
  lastUnitPrice: r.last_unit_price, notes: r.notes, photo: r.photo,
});
const equipmentToDb = (e) => ({
  id: e.id, name: e.name, category: e.category, group_id: e.groupId,
  quantity: e.quantity, in_use: e.inUse ?? 0, type: e.type ?? 'returnable',
  last_unit_price: e.lastUnitPrice ?? 0, notes: e.notes ?? null, photo: e.photo ?? null,
});

const dbToOuting = (r) => ({
  id: r.id, person: r.person, location: r.location,
  startDate: r.start_date, endDate: r.end_date, status: r.status,
  returnedBy: r.returned_by, returnDate: r.return_date,
  items: (r.outing_items || []).map((i) => ({
    equipmentId: i.equipment_id, name: i.name,
    taken: i.taken, returned: i.returned, type: i.type,
  })),
  pendingItems: (r.outing_pending_items || []).length
    ? r.outing_pending_items.map((i) => ({ equipmentId: i.equipment_id, name: i.name, missing: i.missing }))
    : undefined,
  pendingResolved: (r.outing_pending_resolved || []).length
    ? r.outing_pending_resolved.map((i) => ({ equipmentId: i.equipment_id, name: i.name, qty: i.qty, mode: i.mode, date: i.date }))
    : undefined,
});

const dbToPurchase = (r) => ({
  id: r.id, date: r.date, location: r.location, notes: r.notes,
  outingId: r.outing_id, grandTotal: r.grand_total,
  receipt: r.receipt_data_url ? { dataUrl: r.receipt_data_url, type: r.receipt_type, name: r.receipt_name } : null,
  lines: (r.purchase_lines || []).map((l) => ({
    equipmentId: l.equipment_id, name: l.name, qty: l.qty, unitPrice: l.unit_price,
  })),
});

// ── One-time migration from localStorage ─────────────────────────────────────
async function migrateFromLocalStorage() {
  try {
    const rawGroups = ls('groups', DEFAULT_GROUPS);
    const rawEquip  = ls('equipment', null);
    const rawOut    = ls('outings', []);
    const rawPurch  = ls('purchases', []);

    // Groups
    await supabase.from('groups').insert(rawGroups.map(groupToDb));

    // Equipment
    const equip = rawEquip
      ? rawEquip.map((e) => ({ ...e, groupId: e.groupId || 'campo', type: e.type || 'returnable' }))
      : INITIAL_EQUIPMENT.map((e) => ({ id: gid(), inUse: 0, type: 'returnable', ...e }));
    await supabase.from('equipment').insert(equip.map(equipmentToDb));

    // Outings + items
    for (const o of rawOut) {
      await supabase.from('outings').insert([{
        id: o.id, person: o.person, location: o.location ?? null,
        start_date: o.startDate, end_date: o.endDate ?? null,
        status: o.status ?? 'active', returned_by: o.returnedBy ?? null, return_date: o.returnDate ?? null,
      }]);
      if (o.items?.length) {
        await supabase.from('outing_items').insert(
          o.items.map((i) => ({ id: gid(), outing_id: o.id, equipment_id: i.equipmentId, name: i.name, taken: i.taken, returned: i.returned, type: i.type ?? 'returnable' }))
        );
      }
      if (o.pendingItems?.length) {
        await supabase.from('outing_pending_items').insert(
          o.pendingItems.map((i) => ({ id: gid(), outing_id: o.id, equipment_id: i.equipmentId, name: i.name, missing: i.missing }))
        );
      }
      if (o.pendingResolved?.length) {
        await supabase.from('outing_pending_resolved').insert(
          o.pendingResolved.map((i) => ({ id: gid(), outing_id: o.id, equipment_id: i.equipmentId, name: i.name, qty: i.qty, mode: i.mode, date: i.date }))
        );
      }
    }

    // Purchases + lines
    for (const p of rawPurch) {
      await supabase.from('purchases').insert([{
        id: p.id, date: p.date, location: p.location ?? null, notes: p.notes ?? null,
        outing_id: p.outingId ?? null, grand_total: p.grandTotal ?? 0,
        receipt_data_url: p.receipt?.dataUrl ?? null,
        receipt_type: p.receipt?.type ?? null,
        receipt_name: p.receipt?.name ?? null,
      }]);
      if (p.lines?.length) {
        await supabase.from('purchase_lines').insert(
          p.lines.map((l) => ({ id: gid(), purchase_id: p.id, equipment_id: l.equipmentId ?? null, name: l.name, qty: l.qty, unit_price: l.unitPrice ?? 0 }))
        );
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [ready, setReady]           = useState(false);
  const [currentUser, setCurrentUser] = useState(() => ls('currentUser', null));
  const [users, setUsers]           = useState(() => ls('users', [DEFAULT_ADMIN]));
  const [groups, setGroups]         = useState([]);
  const [equipment, setEquipment]   = useState([]);
  const [outings, setOutings]       = useState([]);
  const [purchases, setPurchases]   = useState([]);

  useEffect(() => { lsSet('users', users); }, [users]);
  useEffect(() => { lsSet('currentUser', currentUser); }, [currentUser]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [gr, eq, ot, pu] = await Promise.all([
          supabase.from('groups').select('*').order('created_at'),
          supabase.from('equipment').select('*').order('created_at'),
          supabase.from('outings').select('*, outing_items(*), outing_pending_items(*), outing_pending_resolved(*)').order('created_at'),
          supabase.from('purchases').select('*, purchase_lines(*)').order('created_at'),
        ]);

        let grData = gr.data || [];
        let eqData = eq.data || [];

        // First-time setup: migrate from localStorage
        if (grData.length === 0 && eqData.length === 0) {
          await migrateFromLocalStorage();
          const [gr2, eq2] = await Promise.all([
            supabase.from('groups').select('*').order('created_at'),
            supabase.from('equipment').select('*').order('created_at'),
          ]);
          grData = gr2.data || [];
          eqData = eq2.data || [];
        }

        setGroups(grData.map(dbToGroup));
        setEquipment(eqData.map(dbToEquipment));
        setOutings((ot.data || []).map(dbToOuting));
        setPurchases((pu.data || []).map(dbToPurchase));
      } catch (err) {
        console.error('Supabase load failed, using localStorage fallback:', err);
        const rawEquip = ls('equipment', null);
        setGroups(ls('groups', DEFAULT_GROUPS));
        setEquipment(rawEquip
          ? rawEquip.map((e) => ({ ...e, groupId: e.groupId || 'campo', type: e.type || 'returnable' }))
          : INITIAL_EQUIPMENT.map((e) => ({ id: gid(), inUse: 0, type: 'returnable', ...e }))
        );
        setOutings(ls('outings', []));
        setPurchases(ls('purchases', []));
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // ── AUTH ──────────────────────────────────────────────────────────────────
  function login(email, password) {
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }
  function logout() { setCurrentUser(null); localStorage.removeItem('currentUser'); }

  // ── USERS (localStorage only — no sensitive data in Supabase) ────────────
  function addUser(user) { setUsers((p) => [...p, { id: gid(), ...user }]); }
  function deleteUser(id) {
    if (id === DEFAULT_ADMIN.id) return;
    setUsers((p) => p.filter((u) => u.id !== id));
  }

  // ── GROUPS ────────────────────────────────────────────────────────────────
  function addGroup(name) {
    const id = gid();
    const g = { id, name };
    setGroups((p) => [...p, g]);
    supabase.from('groups').insert([groupToDb(g)]);
    return id;
  }
  function deleteGroup(id) {
    if (id === 'campo' || id === 'mecanica') return;
    setGroups((p) => p.filter((g) => g.id !== id));
    setEquipment((p) => p.map((e) => e.groupId === id ? { ...e, groupId: 'campo' } : e));
    supabase.from('groups').delete().eq('id', id);
    supabase.from('equipment').update({ group_id: 'campo' }).eq('group_id', id);
  }
  function renameGroup(id, name) {
    setGroups((p) => p.map((g) => g.id === id ? { ...g, name } : g));
    supabase.from('groups').update({ name }).eq('id', id);
  }

  // ── EQUIPMENT ─────────────────────────────────────────────────────────────
  function addEquipment(item) {
    const e = { id: gid(), inUse: 0, groupId: 'campo', type: 'returnable', ...item };
    setEquipment((p) => [...p, e]);
    supabase.from('equipment').insert([equipmentToDb(e)]);
  }
  function updateEquipment(id, changes) {
    setEquipment((p) => p.map((e) => e.id === id ? { ...e, ...changes } : e));
    const updated = equipment.find((e) => e.id === id);
    if (updated) supabase.from('equipment').update(equipmentToDb({ ...updated, ...changes })).eq('id', id);
  }
  function deleteEquipment(id) {
    setEquipment((p) => p.filter((e) => e.id !== id));
    supabase.from('equipment').delete().eq('id', id);
  }
  function adjustStock(id, delta) {
    setEquipment((p) => p.map((e) => {
      if (e.id !== id) return e;
      const newQty = Math.max(e.inUse, e.quantity + delta);
      supabase.from('equipment').update({ quantity: newQty }).eq('id', id);
      return { ...e, quantity: newQty };
    }));
  }

  // ── OUTINGS ───────────────────────────────────────────────────────────────
  async function createOuting(person, date, items, location = '') {
    const id = gid();
    const outing = {
      id, person, location, startDate: date,
      endDate: null, status: 'active',
      items: items.map((i) => ({
        equipmentId: i.equipmentId, name: i.name,
        taken: i.qty, type: i.type || 'returnable',
        returned: i.type === 'consumable' ? i.qty : 0,
      })),
    };
    setOutings((p) => [...p, outing]);
    setEquipment((p) => p.map((e) => {
      const item = items.find((i) => i.equipmentId === e.id);
      if (!item) return e;
      return item.type === 'consumable'
        ? { ...e, quantity: Math.max(0, e.quantity - item.qty) }
        : { ...e, inUse: e.inUse + item.qty };
    }));

    // Persist
    await supabase.from('outings').insert([{
      id, person, location: location || null, start_date: date,
      end_date: null, status: 'active',
    }]);
    if (outing.items.length) {
      await supabase.from('outing_items').insert(
        outing.items.map((i) => ({ id: gid(), outing_id: id, equipment_id: i.equipmentId, name: i.name, taken: i.taken, returned: i.returned, type: i.type }))
      );
    }
    // Update equipment in DB
    for (const item of items) {
      const eq = equipment.find((e) => e.id === item.equipmentId);
      if (!eq) continue;
      if (item.type === 'consumable') {
        await supabase.from('equipment').update({ quantity: Math.max(0, eq.quantity - item.qty) }).eq('id', eq.id);
      } else {
        await supabase.from('equipment').update({ in_use: eq.inUse + item.qty }).eq('id', eq.id);
      }
    }
    return id;
  }

  async function registerReturn(outingId, returnedItems, returnedBy, returnDate, forceClose = false) {
    const outing = outings.find((o) => o.id === outingId);
    if (!outing) return;

    const updatedItems = outing.items.map((item) => {
      const ret = returnedItems.find((r) => r.equipmentId === item.equipmentId);
      return ret ? { ...item, returned: item.returned + ret.qty } : item;
    });
    const allReturned = updatedItems.every((i) => i.returned >= i.taken);
    const shouldClose = allReturned || forceClose;
    const pendingItems = shouldClose
      ? updatedItems.filter((i) => i.returned < i.taken).map((i) => ({ ...i, missing: i.taken - i.returned }))
      : [];

    const updatedOuting = {
      ...outing, items: updatedItems,
      status: shouldClose ? 'closed' : 'active',
      endDate: shouldClose ? returnDate : outing.endDate,
      returnedBy, returnDate,
      pendingItems: pendingItems.length > 0 ? pendingItems : undefined,
    };
    setOutings((p) => p.map((o) => o.id !== outingId ? o : updatedOuting));
    setEquipment((p) => p.map((e) => {
      const ret     = returnedItems.find((r) => r.equipmentId === e.id);
      const pending = pendingItems.find((pi) => pi.equipmentId === e.id);
      if (!ret && !pending) return e;
      return {
        ...e,
        inUse:    Math.max(0, e.inUse    - (ret?.qty || 0) - (pending?.missing || 0)),
        quantity: Math.max(0, e.quantity -                   (pending?.missing || 0)),
      };
    }));

    // Persist outing
    await supabase.from('outings').update({
      status: updatedOuting.status,
      end_date: updatedOuting.endDate ?? null,
      returned_by: returnedBy, return_date: returnDate,
    }).eq('id', outingId);

    // Update outing_items returned counts
    for (const item of updatedItems) {
      await supabase.from('outing_items')
        .update({ returned: item.returned })
        .eq('outing_id', outingId)
        .eq('equipment_id', item.equipmentId);
    }

    // Replace pending items
    await supabase.from('outing_pending_items').delete().eq('outing_id', outingId);
    if (pendingItems.length) {
      await supabase.from('outing_pending_items').insert(
        pendingItems.map((i) => ({ id: gid(), outing_id: outingId, equipment_id: i.equipmentId, name: i.name, missing: i.missing }))
      );
    }

    // Update equipment in DB
    for (const e of equipment) {
      const ret     = returnedItems.find((r) => r.equipmentId === e.id);
      const pending = pendingItems.find((pi) => pi.equipmentId === e.id);
      if (!ret && !pending) continue;
      const newInUse    = Math.max(0, e.inUse    - (ret?.qty || 0) - (pending?.missing || 0));
      const newQuantity = Math.max(0, e.quantity -                   (pending?.missing || 0));
      await supabase.from('equipment').update({ in_use: newInUse, quantity: newQuantity }).eq('id', e.id);
    }
  }

  async function resolvePending(outingId, equipmentId, mode = 'dismiss') {
    const outing = outings.find((o) => o.id === outingId);
    const pending = outing?.pendingItems?.find((p) => p.equipmentId === equipmentId);
    if (!pending) return;
    const missingQty = pending.missing;
    const resolution = { equipmentId, name: pending.name, qty: missingQty, mode, date: new Date().toISOString().split('T')[0] };

    setOutings((p) => p.map((o) => {
      if (o.id !== outingId || !o.pendingItems) return o;
      return {
        ...o,
        items: o.items.map((it) => it.equipmentId === equipmentId ? { ...it, returned: it.returned + missingQty } : it),
        pendingItems: o.pendingItems.filter((pi) => pi.equipmentId !== equipmentId).length > 0
          ? o.pendingItems.filter((pi) => pi.equipmentId !== equipmentId)
          : undefined,
        pendingResolved: [...(o.pendingResolved || []), resolution],
      };
    }));
    if (mode === 'returned') {
      setEquipment((p) => p.map((e) => e.id === equipmentId ? { ...e, quantity: e.quantity + missingQty } : e));
    }

    // Persist
    await supabase.from('outing_pending_items').delete().eq('outing_id', outingId).eq('equipment_id', equipmentId);
    await supabase.from('outing_pending_resolved').insert([{ id: gid(), outing_id: outingId, ...resolution }]);
    await supabase.from('outing_items').update({ returned: (outing.items.find((i) => i.equipmentId === equipmentId)?.returned ?? 0) + missingQty })
      .eq('outing_id', outingId).eq('equipment_id', equipmentId);
    if (mode === 'returned') {
      const eq = equipment.find((e) => e.id === equipmentId);
      if (eq) await supabase.from('equipment').update({ quantity: eq.quantity + missingQty }).eq('id', equipmentId);
    }
  }

  // ── PURCHASES ─────────────────────────────────────────────────────────────
  async function addPurchase(purchase) {
    const lines = (purchase.lines || []).map((l) => ({ ...l, unitPrice: Number(l.unitPrice) || 0, qty: Number(l.qty) || 1 }));
    const grandTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const newPurchase = { id: gid(), ...purchase, lines, grandTotal };
    setPurchases((p) => [...p, newPurchase]);

    // Update equipment stock
    const updates = {};
    lines.forEach((l) => {
      if (!l.equipmentId || !l.qty) return;
      if (!updates[l.equipmentId]) updates[l.equipmentId] = { qty: 0, unitPrice: 0 };
      updates[l.equipmentId].qty += l.qty;
      if (l.unitPrice > 0) updates[l.equipmentId].unitPrice = l.unitPrice;
    });
    if (Object.keys(updates).length) {
      setEquipment((p) => p.map((e) => {
        const u = updates[e.id];
        if (!u) return e;
        return { ...e, quantity: e.quantity + u.qty, lastUnitPrice: u.unitPrice > 0 ? u.unitPrice : (e.lastUnitPrice || 0) };
      }));
    }

    // Persist purchase
    await supabase.from('purchases').insert([{
      id: newPurchase.id, date: purchase.date, location: purchase.location ?? null,
      notes: purchase.notes ?? null, outing_id: purchase.outingId ?? null,
      grand_total: grandTotal,
      receipt_data_url: purchase.receipt?.dataUrl ?? null,
      receipt_type: purchase.receipt?.type ?? null,
      receipt_name: purchase.receipt?.name ?? null,
    }]);
    if (lines.length) {
      await supabase.from('purchase_lines').insert(
        lines.map((l) => ({ id: gid(), purchase_id: newPurchase.id, equipment_id: l.equipmentId ?? null, name: l.name, qty: l.qty, unit_price: l.unitPrice }))
      );
    }
    // Update equipment in DB
    for (const [eqId, u] of Object.entries(updates)) {
      const eq = equipment.find((e) => e.id === eqId);
      if (!eq) continue;
      await supabase.from('equipment').update({
        quantity: eq.quantity + u.qty,
        last_unit_price: u.unitPrice > 0 ? u.unitPrice : (eq.lastUnitPrice || 0),
      }).eq('id', eqId);
    }
    return newPurchase.id;
  }

  async function deletePurchase(id) {
    const purchase = purchases.find((p) => p.id === id);
    if (purchase?.lines) {
      const updates = {};
      purchase.lines.forEach((l) => {
        if (!l.equipmentId || !l.qty) return;
        updates[l.equipmentId] = (updates[l.equipmentId] || 0) + l.qty;
      });
      if (Object.keys(updates).length) {
        setEquipment((p) => p.map((e) => {
          const remove = updates[e.id];
          if (!remove) return e;
          return { ...e, quantity: Math.max(e.inUse, e.quantity - remove) };
        }));
        for (const [eqId, remove] of Object.entries(updates)) {
          const eq = equipment.find((e) => e.id === eqId);
          if (!eq) continue;
          await supabase.from('equipment').update({ quantity: Math.max(eq.inUse, eq.quantity - remove) }).eq('id', eqId);
        }
      }
    }
    setPurchases((p) => p.filter((p) => p.id !== id));
    await supabase.from('purchases').delete().eq('id', id);
  }

  function getPurchasesForOuting(outingId) {
    return purchases.filter((p) => p.outingId === outingId);
  }

  const activeOutings = outings.filter((o) => o.status === 'active');
  const pendingReturns = outings
    .filter((o) => o.status === 'closed' && o.pendingItems?.length > 0)
    .flatMap((o) => o.pendingItems.map((i) => ({
      outingId: o.id, person: o.person, endDate: o.endDate, startDate: o.startDate,
      equipmentId: i.equipmentId, name: i.name, missing: i.missing,
    })))
    .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0071E3, #5E5CE6)' }}>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[15px] font-semibold text-[#1D1D1F]">Carregando…</p>
          <p className="text-[13px] text-[#6E6E73] mt-1">Conectando ao banco de dados</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, addUser, deleteUser,
      groups, addGroup, deleteGroup, renameGroup,
      equipment, addEquipment, updateEquipment, deleteEquipment, adjustStock,
      outings, activeOutings, createOuting, registerReturn,
      pendingReturns, resolvePending,
      purchases, addPurchase, deletePurchase, getPurchasesForOuting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
