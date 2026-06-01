import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_ADMIN, DEFAULT_GROUPS, INITIAL_EQUIPMENT } from '../data/initialData';

const AppContext = createContext(null);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initEquipment() {
  const existing = loadStorage('equipment', null);
  if (existing) {
    // migrate: add groupId + type to old items
    return existing.map((e) => ({
      ...e,
      groupId: e.groupId || 'campo',
      type: e.type || 'returnable',
    }));
  }
  const equipment = INITIAL_EQUIPMENT.map((e) => ({ id: generateId(), type: 'returnable', ...e, inUse: 0, photo: null }));
  saveStorage('equipment', equipment);
  return equipment;
}

function initUsers() {
  const existing = loadStorage('users', null);
  if (existing) return existing;
  saveStorage('users', [DEFAULT_ADMIN]);
  return [DEFAULT_ADMIN];
}

function initGroups() {
  const existing = loadStorage('groups', null);
  if (existing) return existing;
  saveStorage('groups', DEFAULT_GROUPS);
  return DEFAULT_GROUPS;
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadStorage('currentUser', null));
  const [users, setUsers] = useState(initUsers);
  const [equipment, setEquipment] = useState(initEquipment);
  const [groups, setGroups] = useState(initGroups);
  const [outings, setOutings] = useState(() => loadStorage('outings', []));
  const [purchases, setPurchases] = useState(() => loadStorage('purchases', []));

  useEffect(() => { saveStorage('users', users); }, [users]);
  useEffect(() => { saveStorage('equipment', equipment); }, [equipment]);
  useEffect(() => { saveStorage('groups', groups); }, [groups]);
  useEffect(() => { saveStorage('outings', outings); }, [outings]);
  useEffect(() => { saveStorage('purchases', purchases); }, [purchases]);
  useEffect(() => { saveStorage('currentUser', currentUser); }, [currentUser]);

  // AUTH
  function login(email, password) {
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }

  // USERS
  function addUser(user) {
    setUsers((prev) => [...prev, { id: generateId(), ...user }]);
  }

  function deleteUser(id) {
    if (id === DEFAULT_ADMIN.id) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // GROUPS
  function addGroup(name) {
    const id = generateId();
    setGroups((prev) => [...prev, { id, name }]);
    return id;
  }

  function deleteGroup(id) {
    if (id === 'campo' || id === 'mecanica') return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    // move items from deleted group to 'campo'
    setEquipment((prev) => prev.map((e) => e.groupId === id ? { ...e, groupId: 'campo' } : e));
  }

  function renameGroup(id, name) {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, name } : g));
  }

  // EQUIPMENT
  function addEquipment(item) {
    setEquipment((prev) => [...prev, { id: generateId(), inUse: 0, groupId: 'campo', type: 'returnable', ...item }]);
  }

  function updateEquipment(id, changes) {
    setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
  }

  function deleteEquipment(id) {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  }

  function adjustStock(id, delta) {
    setEquipment((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newQty = Math.max(e.inUse, e.quantity + delta);
        return { ...e, quantity: newQty };
      })
    );
  }

  // OUTINGS
  // items: [{ equipmentId, name, qty, type }]
  // Returnable  → tracked in inUse, must come back via Retorno
  // Consumable  → deducted from quantity immediately, returned=taken so they skip Retorno
  function createOuting(person, date, items) {
    const id = generateId();
    const outing = {
      id,
      person,
      startDate: date,
      endDate: null,
      status: 'active',
      items: items.map((i) => ({
        equipmentId: i.equipmentId,
        name: i.name,
        taken: i.qty,
        type: i.type || 'returnable',
        // consumables are marked as already returned so they're invisible in Retorno
        returned: i.type === 'consumable' ? i.qty : 0,
      })),
    };
    setOutings((prev) => [...prev, outing]);
    setEquipment((prev) =>
      prev.map((e) => {
        const item = items.find((i) => i.equipmentId === e.id);
        if (!item) return e;
        if (item.type === 'consumable') {
          // consumed immediately — reduce stock, don't touch inUse
          return { ...e, quantity: Math.max(0, e.quantity - item.qty) };
        }
        return { ...e, inUse: e.inUse + item.qty };
      })
    );
    return id;
  }

  function registerReturn(outingId, returnedItems, returnedBy, returnDate, forceClose = false) {
    // Compute everything up-front from current state — no stale closures.
    const outing = outings.find((o) => o.id === outingId);
    if (!outing) return;

    const updatedItems = outing.items.map((item) => {
      const ret = returnedItems.find((r) => r.equipmentId === item.equipmentId);
      return ret ? { ...item, returned: item.returned + ret.qty } : item;
    });

    const allReturned = updatedItems.every((i) => i.returned >= i.taken);
    const shouldClose = allReturned || forceClose;

    // Items that are still missing after this return (only relevant when closing)
    const pendingItems = shouldClose
      ? updatedItems
          .filter((i) => i.returned < i.taken)
          .map((i) => ({ ...i, missing: i.taken - i.returned }))
      : [];

    setOutings((prev) =>
      prev.map((o) =>
        o.id !== outingId ? o : {
          ...o,
          items: updatedItems,
          status: shouldClose ? 'closed' : 'active',
          endDate: shouldClose ? returnDate : o.endDate,
          returnedBy,
          returnDate,
          pendingItems: pendingItems.length > 0 ? pendingItems : undefined,
        }
      )
    );

    setEquipment((prev) =>
      prev.map((e) => {
        const ret     = returnedItems.find((r) => r.equipmentId === e.id);
        const pending = pendingItems.find((p) => p.equipmentId === e.id);
        if (!ret && !pending) return e;
        // Returned qty  → reduces inUse
        // Pending qty   → reduces BOTH inUse AND quantity (item is lost/unaccounted)
        return {
          ...e,
          inUse:    Math.max(0, e.inUse    - (ret?.qty || 0) - (pending?.missing || 0)),
          quantity: Math.max(0, e.quantity -                   (pending?.missing || 0)),
        };
      })
    );
  }

  // PURCHASES
  // lines: [{ equipmentId?, name, qty, unitPrice }]
  // When equipmentId is set, adds qty to that equipment's stock and updates lastUnitPrice.
  function addPurchase(purchase) {
    const lines = (purchase.lines || []).map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice) || 0,
      qty: Number(l.qty) || 1,
    }));
    const grandTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const newPurchase = { id: generateId(), ...purchase, lines, grandTotal };
    setPurchases((prev) => [...prev, newPurchase]);

    // Update inventory: add stock + record last price for linked items
    const updates = {};
    lines.forEach((l) => {
      if (!l.equipmentId || !l.qty) return;
      if (!updates[l.equipmentId]) updates[l.equipmentId] = { qty: 0, unitPrice: 0 };
      updates[l.equipmentId].qty += l.qty;
      if (l.unitPrice > 0) updates[l.equipmentId].unitPrice = l.unitPrice;
    });
    if (Object.keys(updates).length > 0) {
      setEquipment((prev) =>
        prev.map((e) => {
          const u = updates[e.id];
          if (!u) return e;
          return {
            ...e,
            quantity: e.quantity + u.qty,
            lastUnitPrice: u.unitPrice > 0 ? u.unitPrice : (e.lastUnitPrice || 0),
          };
        })
      );
    }
    return newPurchase.id;
  }

  function deletePurchase(id) {
    // Reverse stock changes for linked lines
    const purchase = purchases.find((p) => p.id === id);
    if (purchase?.lines) {
      const updates = {};
      purchase.lines.forEach((l) => {
        if (!l.equipmentId || !l.qty) return;
        if (!updates[l.equipmentId]) updates[l.equipmentId] = 0;
        updates[l.equipmentId] += l.qty;
      });
      if (Object.keys(updates).length > 0) {
        setEquipment((prev) =>
          prev.map((e) => {
            const remove = updates[e.id];
            if (!remove) return e;
            return { ...e, quantity: Math.max(e.inUse, e.quantity - remove) };
          })
        );
      }
    }
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }

  function getPurchasesForOuting(outingId) {
    return purchases.filter((p) => p.outingId === outingId);
  }

  // Resolve a pending (not-returned) item.
  // At force-close time the item was ALREADY deducted from both inUse AND quantity,
  // so inventory is always accurate. Resolve only changes the tracking list.
  //
  // mode 'returned' → person brought it back → restore quantity (add back to stock)
  // mode 'dismiss'  → confirmed as lost/written off → just remove from the list (stock already correct)
  function resolvePending(outingId, equipmentId, mode = 'dismiss') {
    const outing = outings.find((o) => o.id === outingId);
    const pending = outing?.pendingItems?.find((p) => p.equipmentId === equipmentId);
    if (!pending) return;
    const missingQty = pending.missing;

    // Remove from pending list and record resolution
    setOutings((prev) =>
      prev.map((o) => {
        if (o.id !== outingId || !o.pendingItems) return o;
        const newPending = o.pendingItems.filter((p) => p.equipmentId !== equipmentId);
        const updatedItems = o.items.map((it) =>
          it.equipmentId === equipmentId ? { ...it, returned: it.returned + missingQty } : it
        );
        return {
          ...o,
          items: updatedItems,
          pendingItems: newPending.length > 0 ? newPending : undefined,
          pendingResolved: [
            ...(o.pendingResolved || []),
            { equipmentId, name: pending.name, qty: missingQty, mode, date: new Date().toISOString().split('T')[0] },
          ],
        };
      })
    );

    // Only touch equipment if the item actually came back — restore quantity to stock
    if (mode === 'returned') {
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === equipmentId ? { ...e, quantity: e.quantity + missingQty } : e
        )
      );
    }
    // mode 'dismiss': quantity already correct (deducted at force-close), nothing to change
  }

  const activeOutings = outings.filter((o) => o.status === 'active');

  // Itens não devolvidos — agregados de todas as saídas encerradas com pendência
  const pendingReturns = outings
    .filter((o) => o.status === 'closed' && o.pendingItems?.length > 0)
    .flatMap((o) =>
      o.pendingItems.map((i) => ({
        outingId: o.id,
        person: o.person,
        endDate: o.endDate,
        startDate: o.startDate,
        equipmentId: i.equipmentId,
        name: i.name,
        missing: i.missing,
      }))
    )
    .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));

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
