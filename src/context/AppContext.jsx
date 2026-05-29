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
    // migrate: add groupId to old items that don't have it
    return existing.map((e) => e.groupId ? e : { ...e, groupId: 'campo' });
  }
  const equipment = INITIAL_EQUIPMENT.map((e) => ({ id: generateId(), ...e, inUse: 0, photo: null }));
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
    setEquipment((prev) => [...prev, { id: generateId(), inUse: 0, groupId: 'campo', ...item }]);
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
  function createOuting(person, date, items) {
    const id = generateId();
    const outing = {
      id,
      person,
      startDate: date,
      endDate: null,
      status: 'active',
      items: items.map((i) => ({ equipmentId: i.equipmentId, name: i.name, taken: i.qty, returned: 0 })),
    };
    setOutings((prev) => [...prev, outing]);
    setEquipment((prev) =>
      prev.map((e) => {
        const item = items.find((i) => i.equipmentId === e.id);
        if (!item) return e;
        return { ...e, inUse: e.inUse + item.qty };
      })
    );
    return id;
  }

  function registerReturn(outingId, returnedItems, returnedBy, returnDate, forceClose = false) {
    setOutings((prev) =>
      prev.map((o) => {
        if (o.id !== outingId) return o;
        const updatedItems = o.items.map((item) => {
          const ret = returnedItems.find((r) => r.equipmentId === item.equipmentId);
          return ret ? { ...item, returned: item.returned + ret.qty } : item;
        });
        const allReturned = updatedItems.every((i) => i.returned >= i.taken);
        const shouldClose = allReturned || forceClose;
        const pendingItems = shouldClose
          ? updatedItems.filter((i) => i.returned < i.taken).map((i) => ({ ...i, missing: i.taken - i.returned }))
          : [];
        return {
          ...o,
          items: updatedItems,
          status: shouldClose ? 'closed' : 'active',
          endDate: shouldClose ? returnDate : o.endDate,
          returnedBy,
          returnDate,
          pendingItems: pendingItems.length > 0 ? pendingItems : undefined,
        };
      })
    );
    setEquipment((prev) =>
      prev.map((e) => {
        const ret = returnedItems.find((r) => r.equipmentId === e.id);
        if (!ret) return e;
        return { ...e, inUse: Math.max(0, e.inUse - ret.qty) };
      })
    );
  }

  // PURCHASES
  function addPurchase(purchase) {
    const newPurchase = { id: generateId(), ...purchase };
    setPurchases((prev) => [...prev, newPurchase]);
    return newPurchase.id;
  }

  function getPurchasesForOuting(outingId) {
    return purchases.filter((p) => p.outingId === outingId);
  }

  const activeOutings = outings.filter((o) => o.status === 'active');

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, addUser, deleteUser,
      groups, addGroup, deleteGroup, renameGroup,
      equipment, addEquipment, updateEquipment, deleteEquipment, adjustStock,
      outings, activeOutings, createOuting, registerReturn,
      purchases, addPurchase, getPurchasesForOuting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
