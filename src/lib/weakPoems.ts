export const WEAK_POEMS_STORAGE_KEY = 'hyakunin-isshu:weak-poems:v1';

export interface WeakPoemsSnapshot {
  version: 1;
  poemIds: number[];
}

const EMPTY_SNAPSHOT: WeakPoemsSnapshot = { version: 1, poemIds: [] };
const listeners = new Set<() => void>();

function sanitizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= 100)),
  ];
}

export function parseWeakPoems(value: string | null): WeakPoemsSnapshot {
  if (!value) return EMPTY_SNAPSHOT;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('poemIds' in parsed)
    ) {
      return EMPTY_SNAPSHOT;
    }
    return { version: 1, poemIds: sanitizeIds(parsed.poemIds) };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function readWeakPoems(storage: Pick<Storage, 'getItem'> = localStorage): WeakPoemsSnapshot {
  try {
    return parseWeakPoems(storage.getItem(WEAK_POEMS_STORAGE_KEY));
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function writeWeakPoems(
  update: (current: number[]) => number[],
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): WeakPoemsSnapshot {
  const current = readWeakPoems(storage).poemIds;
  const next = { version: 1 as const, poemIds: sanitizeIds(update(current)) };
  storage.setItem(WEAK_POEMS_STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
  return next;
}

export function subscribeWeakPoems(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === WEAK_POEMS_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getWeakPoemsSnapshot(): string {
  try {
    return localStorage.getItem(WEAK_POEMS_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function getWeakPoemsServerSnapshot(): string {
  return '';
}
