const STORAGE_KEY = "marble-fighter:store";

export interface StoreState {
  money: number;
  ownedItems: string[];
}

function defaultState(): StoreState {
  return { money: 0, ownedItems: [] };
}

function readState(): StoreState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.money !== "number" || !Array.isArray(parsed.ownedItems)) return defaultState();
    return { money: parsed.money, ownedItems: parsed.ownedItems };
  } catch {
    return defaultState();
  }
}

function writeState(state: StoreState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState(): StoreState {
  return readState();
}

export function addMoney(amount: number): void {
  const state = readState();
  state.money += amount;
  writeState(state);
}

export function ownsItem(id: string): boolean {
  return readState().ownedItems.includes(id);
}

/** Deducts `price` and grants `id`, returning false without mutating state if already owned or unaffordable. */
export function buyItem(id: string, price: number): boolean {
  const state = readState();
  if (state.ownedItems.includes(id) || state.money < price) return false;
  state.money -= price;
  state.ownedItems.push(id);
  writeState(state);
  return true;
}

export function reset(): void {
  writeState(defaultState());
}
