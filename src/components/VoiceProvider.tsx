'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Speaker = 'female' | 'male';

interface VoiceContextValue {
  speaker: Speaker;
  setSpeaker: (s: Speaker) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

const STORAGE_KEY = 'hyakunin-voice-speaker';

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function getSnapshot(): Speaker {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'female' || v === 'male') return v;
  } catch {
    // ignore
  }
  return 'female';
}

function getServerSnapshot(): Speaker {
  return 'female';
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const speaker = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setSpeaker = useCallback((s: Speaker) => {
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      // ignore
    }
    // 同一タブ内の listeners に通知 (storage イベントは別タブのみ)
    listeners.forEach((cb) => cb());
  }, []);

  return (
    <VoiceContext.Provider value={{ speaker, setSpeaker }}>{children}</VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return ctx;
}
