'use client';

import { useEffect, useRef, useState } from 'react';
import type { Poem } from '@/data/types';
import { useVoice } from './VoiceProvider';
import { SpeakerToggle } from './SpeakerToggle';

type PlayState = 'idle' | 'playing-kami' | 'playing-shimo' | 'playing-both';

export function PoemReading({ poem }: { poem: Poem }) {
  const { speaker } = useVoice();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayState>('idle');
  // 「両方再生」のシーケンスを追跡 (kami 再生終了→shimo 再生)
  const [bothQueue, setBothQueue] = useState<'shimo' | null>(null);

  // 離脱で再生停止
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 話者切替時にAudio停止 (state は次の play でリセットされる)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [speaker]);

  function srcOf(half: 'kami' | 'shimo'): string {
    return `/audio/poems/${poem.slug}-${speaker}-${half}.mp3`;
  }

  function play(half: 'kami' | 'shimo', mode: PlayState, onEnd?: () => void) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const a = new Audio(srcOf(half));
    audioRef.current = a;
    setState(mode);
    a.addEventListener('ended', () => {
      if (audioRef.current === a) audioRef.current = null;
      if (onEnd) onEnd();
      else setState('idle');
    });
    a.addEventListener('error', () => {
      if (audioRef.current === a) audioRef.current = null;
      setState('idle');
      console.warn('audio playback error', srcOf(half));
    });
    void a.play().catch(() => {
      setState('idle');
    });
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState('idle');
    setBothQueue(null);
  }

  function handleKami() {
    if (state === 'playing-kami') {
      stop();
      return;
    }
    play('kami', 'playing-kami');
  }

  function handleShimo() {
    if (state === 'playing-shimo') {
      stop();
      return;
    }
    play('shimo', 'playing-shimo');
  }

  function handleBoth() {
    if (state === 'playing-both') {
      stop();
      return;
    }
    setBothQueue('shimo');
    play('kami', 'playing-both', () => {
      // 上の句が終わったら下の句
      // この時点で停止/話者切替されてないか確認
      if (audioRef.current !== null) return;
      play('shimo', 'playing-both', () => {
        setState('idle');
        setBothQueue(null);
      });
    });
  }

  const playingIcon = '◼';
  const playIcon = '▶';

  return (
    <section className="my-8 rounded-lg border border-koshoku/30 bg-washi p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-xl font-bold text-sumi">読み</h2>
        <SpeakerToggle />
      </div>

      {/* 読みテキスト */}
      <div className="space-y-1">
        <p className="font-klee text-base text-sumi md:text-lg" lang="ja">
          {poem.kamiKana}
        </p>
        <p className="font-klee text-base text-sumi md:text-lg" lang="ja">
          {poem.shimoKana}
        </p>
      </div>

      {/* 朗詠ボタン群 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleKami}
          className="inline-flex items-center gap-1 rounded-full border border-shu px-4 py-1.5 font-sans text-xs text-shu transition hover:bg-shu hover:text-washi"
          aria-label={`上の句「${poem.kamiKana}」を再生`}
        >
          <span>{state === 'playing-kami' ? playingIcon : playIcon}</span>
          <span>上の句</span>
        </button>
        <button
          type="button"
          onClick={handleShimo}
          className="inline-flex items-center gap-1 rounded-full border border-shu px-4 py-1.5 font-sans text-xs text-shu transition hover:bg-shu hover:text-washi"
          aria-label={`下の句「${poem.shimoKana}」を再生`}
        >
          <span>{state === 'playing-shimo' ? playingIcon : playIcon}</span>
          <span>下の句</span>
        </button>
        <button
          type="button"
          onClick={handleBoth}
          className="inline-flex items-center gap-1 rounded-full bg-shu px-4 py-1.5 font-sans text-xs text-washi transition hover:opacity-90"
          aria-label="上の句と下の句を続けて再生"
        >
          <span>{state === 'playing-both' ? playingIcon : playIcon}</span>
          <span>両方を続けて再生{state === 'playing-both' && bothQueue === 'shimo' ? '中' : ''}</span>
        </button>
      </div>
    </section>
  );
}
