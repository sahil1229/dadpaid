import { useState, useEffect } from 'react';

function cleanForStorage<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: any) => {
      if (item && typeof item === 'object' && 'photo' in item) {
        const { photo, ...rest } = item;
        return { ...rest, hasPhoto: !!photo };
      }
      return item;
    }) as unknown as T;
  }
  return value;
}

function writeNow<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(cleanForStorage(value)));
    return true;
  } catch (e) {
    console.warn('persist failed', key, e);
    return false;
  }
}

export function usePersistedState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw) as T;
    } catch { return initial; }
  });

  const setState = (next: T | ((prev: T) => T)) => {
    setStateRaw((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeNow(key, resolved);
      return resolved;
    });
  };

  useEffect(() => {
    writeNow(key, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setState];
}
