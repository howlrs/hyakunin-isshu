'use client';

import { useVoice } from './VoiceProvider';

export function SpeakerToggle() {
  const { speaker, setSpeaker } = useVoice();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-koshoku/30 bg-washi p-1 font-sans text-xs">
      <span className="px-2 text-koshoku">朗詠</span>
      <button
        type="button"
        onClick={() => setSpeaker('female')}
        aria-pressed={speaker === 'female'}
        className={`rounded-full px-3 py-1 transition ${
          speaker === 'female' ? 'bg-shu text-washi' : 'text-sumi hover:text-shu'
        }`}
      >
        ♀ 女声
      </button>
      <button
        type="button"
        onClick={() => setSpeaker('male')}
        aria-pressed={speaker === 'male'}
        className={`rounded-full px-3 py-1 transition ${
          speaker === 'male' ? 'bg-shu text-washi' : 'text-sumi hover:text-shu'
        }`}
      >
        ♂ 男声
      </button>
    </div>
  );
}
