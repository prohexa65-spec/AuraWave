import React from 'react';
import { DrumPattern, DrumSound } from '../types/music';
import { audio } from '../audio/synthEngine';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface PatternSequencerProps {
  drums: DrumPattern;
  currentStep: number;
  stepsCount: number;
  onChange: (drums: DrumPattern) => void;
}

interface DrumMeta {
  key: DrumSound;
  label: string;
  sub: string;
}

const DRUM_TRACKS: DrumMeta[] = [
  { key: 'kick', label: '808 KICK', sub: 'SUB PUNCH' },
  { key: 'snare', label: 'SNARE', sub: 'CRISP BODY' },
  { key: 'clap', label: 'CLAP', sub: 'STEREO BURST' },
  { key: 'hihatClosed', label: 'CH HAT', sub: '16TH CLOSE' },
  { key: 'hihatOpen', label: 'OH HAT', sub: 'OPEN RING' },
  { key: 'tom', label: '808 TOM', sub: 'LOW RESONANT' },
];

export const PatternSequencer: React.FC<PatternSequencerProps> = ({
  drums,
  currentStep,
  stepsCount,
  onChange,
}) => {
  const toggleStep = (sound: DrumSound, stepIdx: number) => {
    const updated = { ...drums };
    const arr = [...(updated[sound] || [])];
    arr[stepIdx] = !arr[stepIdx];
    updated[sound] = arr;
    onChange(updated);

    if (arr[stepIdx]) {
      audio.triggerPad(sound);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const previewSound = (sound: DrumSound) => {
    audio.triggerPad(sound);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const clearRow = (sound: DrumSound) => {
    const updated = { ...drums };
    updated[sound] = new Array(stepsCount).fill(false);
    audio.playClick('pop');
    onChange(updated);
  };

  const randomizeRow = (sound: DrumSound) => {
    const updated = { ...drums };
    const arr = new Array(stepsCount).fill(false);
    for (let i = 0; i < stepsCount; i++) {
      if (sound === 'kick') {
        arr[i] = i % 4 === 0 || (Math.random() > 0.75 && i % 2 === 0);
      } else if (sound === 'snare' || sound === 'clap') {
        arr[i] = i % 8 === 4;
      } else if (sound === 'hihatClosed') {
        arr[i] = i % 2 === 0 || Math.random() > 0.5;
      } else {
        arr[i] = Math.random() > 0.85;
      }
    }
    updated[sound] = arr;
    audio.playClick('confirm');
    onChange(updated);
  };

  return (
    <div className="w-full bg-mono-950 rounded-2xl border border-mono-800 p-4 shadow-xl overflow-hidden font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-mono-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
              POLYPHONIC DRUM MATRIX
            </h3>
            <p className="text-[11px] text-mono-400 font-mono tracking-tight uppercase">
              {stepsCount}-STEP RHYTHM GRID (4/4 BAR RESOLUTION)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-mono-500 font-mono uppercase tracking-wider">CURRENT STEP:</span>
          <span className="px-2.5 py-0.5 rounded bg-mono-900 text-white font-mono font-bold border border-mono-700">
            {currentStep + 1} / {stepsCount}
          </span>
        </div>
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[700px] flex flex-col gap-2">
          {/* Header step counter numbers */}
          <div className="flex items-center pl-36">
            {Array.from({ length: stepsCount }).map((_, stepIdx) => {
              const isCurrent = currentStep === stepIdx;
              const isMeasureStart = stepIdx % 4 === 0;
              return (
                <div
                  key={stepIdx}
                  className={`flex-1 text-center font-mono text-[9px] uppercase transition-all ${
                    isCurrent
                      ? 'text-white font-bold scale-110'
                      : isMeasureStart
                      ? 'text-mono-300 font-semibold'
                      : 'text-mono-600'
                  }`}
                >
                  {stepIdx + 1}
                </div>
              );
            })}
          </div>

          {/* Drum Rows */}
          {DRUM_TRACKS.map((track) => {
            const pattern = drums[track.key] || [];

            return (
              <div
                key={track.key}
                className="flex items-center gap-2 bg-mono-900 p-1.5 rounded-xl border border-mono-800 hover:border-mono-700 transition-all"
              >
                {/* Track Label & Control */}
                <div className="w-34 flex items-center justify-between pr-2 border-r border-mono-800">
                  <button
                    onClick={() => previewSound(track.key)}
                    className="flex flex-col text-left group"
                  >
                    <span className="text-xs font-mono font-bold text-white group-hover:text-mono-200 uppercase tracking-wider flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current opacity-70 group-hover:opacity-100" />
                      {track.label}
                    </span>
                    <span className="text-[9px] font-mono text-mono-500 uppercase tracking-widest">
                      {track.sub}
                    </span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => randomizeRow(track.key)}
                      title="Randomize rhythm pattern"
                      className="p-1 rounded text-mono-500 hover:text-white hover:bg-mono-800 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => clearRow(track.key)}
                      title="Clear all steps"
                      className="p-1 rounded text-mono-500 hover:text-white hover:bg-mono-800 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 32 Step Buttons */}
                <div className="flex-1 flex gap-1 items-center">
                  {Array.from({ length: stepsCount }).map((_, stepIdx) => {
                    const isActive = pattern[stepIdx];
                    const isCurrent = currentStep === stepIdx;
                    const isMeasureStart = stepIdx % 4 === 0;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleStep(track.key, stepIdx)}
                        className={`h-8 flex-1 rounded transition-all flex items-center justify-center relative touch-action-manipulation ${
                          isActive
                            ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.6)] font-bold'
                            : isMeasureStart
                            ? 'bg-mono-950 border border-mono-700 hover:border-mono-500'
                            : 'bg-mono-950/70 border border-mono-800/80 hover:border-mono-600'
                        } ${isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
                      >
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
