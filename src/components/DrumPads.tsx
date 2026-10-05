import React, { useState, useEffect } from 'react';
import { audio } from '../audio/synthEngine';
import { DrumSound } from '../types/music';

interface PadConfig {
  id: string;
  sound: DrumSound | 'bass' | 'lead';
  name: string;
  sub: string;
  key: string;
}

const PADS: PadConfig[] = [
  { id: '1', sound: 'kick', name: '808 KICK', sub: 'SUB PUNCH', key: '1 / Q' },
  { id: '2', sound: 'snare', name: 'SNARE', sub: 'CRISP BODY', key: '2 / W' },
  { id: '3', sound: 'clap', name: 'CLAP', sub: 'STEREO BURST', key: '3 / E' },
  { id: '4', sound: 'hihatClosed', name: 'CH HAT', sub: 'TIGHT METALLIC', key: '4 / R' },
  { id: '5', sound: 'hihatOpen', name: 'OH HAT', sub: 'SIZZLE RING', key: '5 / A' },
  { id: '6', sound: 'tom', name: '808 TOM', sub: 'RESONANT DIVE', key: '6 / S' },
  { id: '7', sound: 'bass', name: 'SUB BASS', sub: 'LOW END GLIDE', key: '7 / D' },
  { id: '8', sound: 'lead', name: 'SYNTH LEAD', sub: 'ANALOG SAW 440', key: '8 / F' },
];

export const DrumPads: React.FC = () => {
  const [activePad, setActivePad] = useState<string | null>(null);

  const trigger = (pad: PadConfig) => {
    audio.triggerPad(pad.sound);
    setActivePad(pad.id);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    setTimeout(() => {
      setActivePad((curr) => (curr === pad.id ? null : curr));
    }, 120);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();
      const map: Record<string, string> = {
        '1': '1', 'Q': '1',
        '2': '2', 'W': '2',
        '3': '3', 'E': '3',
        '4': '4', 'R': '4',
        '5': '5', 'A': '5',
        '6': '6', 'S': '6',
        '7': '7', 'D': '7',
        '8': '8', 'F': '8',
      };

      const padId = map[key];
      if (padId) {
        const found = PADS.find((p) => p.id === padId);
        if (found) trigger(found);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full bg-mono-950 rounded-2xl border border-mono-800 p-4 shadow-xl font-sans">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-mono-800">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
            TACTILE MPC PERFORMANCE PADS
          </h3>
          <p className="text-[11px] text-mono-400 font-mono tracking-tight uppercase">
            LOW-LATENCY DSP ENGINE (TOUCH &amp; KEYBOARD 1-8 / Q-F)
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mono-900 border border-mono-700 text-mono-300 uppercase tracking-wider">
          ZERO LATENCY DSP
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PADS.map((pad) => {
          const isActive = activePad === pad.id;

          return (
            <button
              key={pad.id}
              onPointerDown={() => trigger(pad)}
              className={`h-28 rounded-xl p-3 flex flex-col justify-between text-left transition-all duration-75 select-none touch-action-manipulation relative overflow-hidden active:scale-95 ${
                isActive
                  ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.8)] border-white scale-[0.98]'
                  : 'bg-mono-900 hover:bg-mono-800/80 border border-mono-800 hover:border-mono-600 text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isActive ? 'bg-black text-white font-bold' : 'bg-mono-950 text-mono-400 border border-mono-800'
                }`}>
                  {pad.key}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-black animate-ping' : 'bg-mono-700'
                }`} />
              </div>

              <div>
                <div className="text-xs font-mono font-bold tracking-wide uppercase">
                  {pad.name}
                </div>
                <div className={`text-[10px] font-mono uppercase tracking-widest ${
                  isActive ? 'text-black font-semibold' : 'text-mono-500'
                }`}>
                  {pad.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
