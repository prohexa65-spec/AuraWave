import React, { useState } from 'react';
import { NoteEvent, SongComposition } from '../types/music';
import { midiToNoteName, midiToFreq } from '../utils/musicTheory';
import { audio } from '../audio/synthEngine';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface PianoRollProps {
  composition: SongComposition;
  currentStep: number;
  stepsCount: number;
  onUpdateBass: (bass: NoteEvent[]) => void;
  onUpdateLead: (lead: NoteEvent[]) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  composition,
  currentStep,
  stepsCount,
  onUpdateBass,
  onUpdateLead,
}) => {
  const [activeTrack, setActiveTrack] = useState<'lead' | 'bass'>('lead');
  const [noteDuration, setNoteDuration] = useState<number>(2);

  const isBass = activeTrack === 'bass';
  const startMidi = isBass ? 24 : 60;
  const countNotes = 24;

  const pitches: number[] = [];
  for (let i = startMidi + countNotes - 1; i >= startMidi; i--) {
    pitches.push(i);
  }

  const currentNotes = isBass ? composition.bass : composition.lead;
  const setNotes = isBass ? onUpdateBass : onUpdateLead;

  const handleCellClick = (pitch: number, step: number) => {
    const existingIndex = currentNotes.findIndex(
      (n) => n.note === pitch && step >= n.step && step < n.step + n.duration
    );

    if (existingIndex >= 0) {
      const filtered = currentNotes.filter((_, idx) => idx !== existingIndex);
      audio.playClick('pop');
      setNotes(filtered);
    } else {
      const durSec = (60 / composition.tempo) * (noteDuration / 4);
      if (isBass) {
        audio.playBassNote(
          midiToFreq(pitch),
          audio.ctx ? audio.ctx.currentTime : 0,
          durSec,
          0.85,
          composition.synthSettings?.bassType || 'synthwave'
        );
      } else {
        audio.playLeadNote(
          midiToFreq(pitch),
          audio.ctx ? audio.ctx.currentTime : 0,
          durSec,
          0.85,
          composition.synthSettings?.leadType || 'saw'
        );
      }

      const newNote: NoteEvent = {
        note: pitch,
        step,
        duration: noteDuration,
        velocity: 0.85,
      };
      setNotes([...currentNotes, newNote]);
    }
  };

  const handleKeyAudition = (pitch: number) => {
    if (isBass) {
      audio.playBassNote(
        midiToFreq(pitch),
        audio.ctx ? audio.ctx.currentTime : 0,
        0.4,
        0.85,
        composition.synthSettings?.bassType || 'synthwave'
      );
    } else {
      audio.playLeadNote(
        midiToFreq(pitch),
        audio.ctx ? audio.ctx.currentTime : 0,
        0.4,
        0.85,
        composition.synthSettings?.leadType || 'saw'
      );
    }
  };

  const transpose = (semitones: number) => {
    audio.playClick('tick');
    const shifted = currentNotes.map((n) => ({
      ...n,
      note: Math.max(12, Math.min(108, n.note + semitones)),
    }));
    setNotes(shifted);
  };

  const clearNotes = () => {
    audio.playClick('pop');
    setNotes([]);
  };

  return (
    <div className="w-full bg-mono-950 rounded-2xl border border-mono-800 p-4 shadow-xl font-sans">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-mono-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
              POLYPHONIC PIANO ROLL
            </h3>
            <p className="text-[11px] text-mono-400 font-mono tracking-tight uppercase">
              MELODY &amp; BASSLINE NOTE MATRIX
            </p>
          </div>
        </div>

        {/* Track switch tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-mono-900 p-1 rounded-lg border border-mono-800 text-xs font-mono">
            <button
              onClick={() => {
                audio.playClick('tick');
                setActiveTrack('lead');
              }}
              className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider transition-all ${
                activeTrack === 'lead'
                  ? 'bg-white text-black'
                  : 'text-mono-400 hover:text-white'
              }`}
            >
              LEAD SYNTH
            </button>
            <button
              onClick={() => {
                audio.playClick('tick');
                setActiveTrack('bass');
              }}
              className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider transition-all ${
                activeTrack === 'bass'
                  ? 'bg-white text-black'
                  : 'text-mono-400 hover:text-white'
              }`}
            >
              BASSLINE
            </button>
          </div>

          {/* Note duration picker */}
          <div className="hidden sm:flex items-center gap-1.5 bg-mono-900 px-2 py-1 rounded-lg border border-mono-800 text-xs font-mono">
            <span className="text-mono-500 uppercase">LEN:</span>
            {[1, 2, 4].map((d) => (
              <button
                key={d}
                onClick={() => {
                  audio.playClick('tick');
                  setNoteDuration(d);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  noteDuration === d
                    ? 'bg-white text-black'
                    : 'text-mono-400 hover:text-white'
                }`}
              >
                {d === 1 ? '1/16' : d === 2 ? '1/8' : '1/4'}
              </button>
            ))}
          </div>

          {/* Transpose buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => transpose(12)}
              title="Octave Up"
              className="px-2 py-1 rounded bg-mono-900 hover:bg-mono-800 text-mono-300 hover:text-white border border-mono-800 text-xs font-mono flex items-center gap-1 uppercase"
            >
              <ArrowUp className="w-3 h-3" /> +1 OCT
            </button>
            <button
              onClick={() => transpose(-12)}
              title="Octave Down"
              className="px-2 py-1 rounded bg-mono-900 hover:bg-mono-800 text-mono-300 hover:text-white border border-mono-800 text-xs font-mono flex items-center gap-1 uppercase"
            >
              <ArrowDown className="w-3 h-3" /> -1 OCT
            </button>
            <button
              onClick={clearNotes}
              title="Clear all notes"
              className="p-1.5 rounded bg-mono-900 hover:bg-mono-800 text-mono-400 hover:text-white border border-mono-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Piano Roll Grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[380px] -mx-2 px-2">
        <div className="min-w-[700px] flex flex-col">
          {pitches.map((pitch) => {
            const noteName = midiToNoteName(pitch);
            const isSharp = noteName.includes('#');

            return (
              <div key={pitch} className="flex h-5 border-b border-mono-900/80">
                {/* Piano Key */}
                <button
                  onClick={() => handleKeyAudition(pitch)}
                  className={`w-16 h-full text-[10px] font-mono font-medium px-1 flex items-center justify-between border-r border-mono-800 transition ${
                    isSharp
                      ? 'bg-mono-950 text-mono-400 hover:bg-mono-900'
                      : 'bg-mono-900 text-white hover:bg-mono-800'
                  }`}
                >
                  <span>{noteName}</span>
                  <span className="text-[9px] text-mono-600">{pitch}</span>
                </button>

                {/* Grid cells */}
                <div className="flex-1 flex">
                  {Array.from({ length: stepsCount }).map((_, stepIdx) => {
                    const activeNote = currentNotes.find(
                      (n) =>
                        n.note === pitch &&
                        stepIdx >= n.step &&
                        stepIdx < n.step + n.duration
                    );
                    const isStart = activeNote && activeNote.step === stepIdx;
                    const isCurrent = currentStep === stepIdx;
                    const isBarStart = stepIdx % 4 === 0;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleCellClick(pitch, stepIdx)}
                        className={`flex-1 h-full border-r border-mono-900/60 cursor-pointer transition-all relative ${
                          isBarStart ? 'border-r-mono-800' : ''
                        } ${
                          activeNote
                            ? 'bg-white text-black font-bold'
                            : isCurrent
                            ? 'bg-mono-800/40'
                            : isSharp
                            ? 'bg-black/40 hover:bg-mono-900/40'
                            : 'bg-mono-950/40 hover:bg-mono-900/40'
                        }`}
                      >
                        {isStart && (
                          <div className="absolute inset-y-0 left-0 right-0 flex items-center px-1 text-[8px] font-mono text-black font-bold uppercase truncate">
                            {noteName}
                          </div>
                        )}
                      </div>
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
