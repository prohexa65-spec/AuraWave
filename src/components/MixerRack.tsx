import React from 'react';
import {
  MixerTrack,
  SynthSettings,
  BassSynthType,
  LeadSynthType,
  ChordSynthType,
} from '../types/music';
import { Sliders, Waves } from 'lucide-react';

interface MixerRackProps {
  tracks: MixerTrack[];
  synthSettings: SynthSettings;
  onUpdateTracks: (tracks: MixerTrack[]) => void;
  onUpdateSettings: (settings: SynthSettings) => void;
}

export const MixerRack: React.FC<MixerRackProps> = ({
  tracks,
  synthSettings,
  onUpdateTracks,
  onUpdateSettings,
}) => {
  const updateTrack = (id: string, partial: Partial<MixerTrack>) => {
    const updated = tracks.map((t) => (t.id === id ? { ...t, ...partial } : t));
    onUpdateTracks(updated);
  };

  const updateSetting = <K extends keyof SynthSettings>(
    key: K,
    value: SynthSettings[K]
  ) => {
    onUpdateSettings({
      ...synthSettings,
      [key]: value,
    });
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans">
      {/* 6-Channel Studio Mixer */}
      <div className="lg:col-span-2 bg-mono-950 rounded-2xl border border-mono-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-mono-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
              STUDIO STEM MIXER
            </h3>
          </div>
          <span className="text-xs text-mono-400 font-mono uppercase">6-CHANNEL STEMS</span>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-mono-900 rounded-xl p-3 border border-mono-800 flex flex-col items-center gap-2.5 relative overflow-hidden"
            >
              <div className="text-center mt-1">
                <span className="text-[11px] font-mono font-bold text-white block truncate uppercase tracking-wider">
                  {track.name}
                </span>
                <span className="text-[9px] text-mono-500 font-mono uppercase">
                  CH-{track.id}
                </span>
              </div>

              {/* Mute & Solo Buttons */}
              <div className="flex items-center gap-1 w-full justify-center font-mono">
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`w-6 h-6 rounded text-[10px] font-bold uppercase transition-all ${
                    track.muted
                      ? 'bg-white text-black font-bold'
                      : 'bg-mono-950 text-mono-400 hover:text-white border border-mono-800'
                  }`}
                  title="Mute Channel"
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { solo: !track.solo })}
                  className={`w-6 h-6 rounded text-[10px] font-bold uppercase transition-all ${
                    track.solo
                      ? 'bg-white text-black font-bold'
                      : 'bg-mono-950 text-mono-400 hover:text-white border border-mono-800'
                  }`}
                  title="Solo Channel"
                >
                  S
                </button>
              </div>

              {/* Vertical Volume Fader */}
              <div className="flex items-center justify-center h-32 my-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) =>
                    updateTrack(track.id, { volume: parseFloat(e.target.value) })
                  }
                  className="w-28 -rotate-90 origin-center cursor-pointer"
                />
              </div>

              {/* Pan Pot */}
              <div className="w-full text-center">
                <label className="text-[9px] text-mono-400 font-mono block mb-1 uppercase">
                  PAN:{' '}
                  {track.pan < 0
                    ? `L${Math.abs(Math.round(track.pan * 100))}`
                    : track.pan > 0
                    ? `R${Math.round(track.pan * 100)}`
                    : 'C'}
                </label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={track.pan}
                  onChange={(e) =>
                    updateTrack(track.id, { pan: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Volume Display */}
              <div className="text-[10px] font-mono text-mono-300 bg-mono-950 px-2 py-0.5 rounded border border-mono-800">
                {Math.round(track.volume * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DSP Sound Design Settings */}
      <div className="bg-mono-950 rounded-2xl border border-mono-800 p-4 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-mono-800">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
              DSP SOUND DESIGN
            </h3>
          </div>
          <span className="text-xs text-mono-400 font-mono uppercase">SYNTH ALGORITHM</span>
        </div>

        {/* Synth Models */}
        <div className="space-y-3 font-mono">
          <div>
            <label className="text-[10px] text-mono-400 uppercase tracking-wider block mb-1">
              BASS SYNTH MODEL
            </label>
            <select
              value={synthSettings.bassType}
              onChange={(e) =>
                updateSetting('bassType', e.target.value as BassSynthType)
              }
              className="w-full bg-mono-900 border border-mono-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-white transition"
            >
              <option value="sub808">808 Sub-Bass (Pitch Envelope)</option>
              <option value="synthwave">Analog Sawtooth Bass</option>
              <option value="acid">TB-303 Acid Resonant</option>
              <option value="pluck">Plucked Short Bass</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-mono-400 uppercase tracking-wider block mb-1">
              LEAD SYNTH MODEL
            </label>
            <select
              value={synthSettings.leadType}
              onChange={(e) =>
                updateSetting('leadType', e.target.value as LeadSynthType)
              }
              className="w-full bg-mono-900 border border-mono-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-white transition"
            >
              <option value="saw">Bright Sawtooth Lead</option>
              <option value="square">Pulse Width Square</option>
              <option value="fm">2-Op FM Bell Synthesis</option>
              <option value="plucked">Fast Pluck Attack</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-mono-400 uppercase tracking-wider block mb-1">
              CHORD / PAD MODEL
            </label>
            <select
              value={synthSettings.chordType}
              onChange={(e) =>
                updateSetting('chordType', e.target.value as ChordSynthType)
              }
              className="w-full bg-mono-900 border border-mono-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-white transition"
            >
              <option value="pad">Warm Ambient Pad</option>
              <option value="supersaw">Detuned Supersaw</option>
              <option value="electric_piano">Electric Rhodes EP</option>
              <option value="strings">Ensemble Strings</option>
            </select>
          </div>
        </div>

        {/* Filter & FX Sliders */}
        <div className="space-y-3 pt-2 border-t border-mono-800 font-mono">
          <div>
            <div className="flex justify-between text-[10px] text-mono-400 mb-1 uppercase tracking-wider">
              <span>LOWPASS CUTOFF</span>
              <span className="text-white">{synthSettings.filterCutoff} HZ</span>
            </div>
            <input
              type="range"
              min="200"
              max="8000"
              step="50"
              value={synthSettings.filterCutoff}
              onChange={(e) =>
                updateSetting('filterCutoff', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-mono-400 mb-1 uppercase tracking-wider">
              <span>FILTER RESONANCE (Q)</span>
              <span className="text-white">{synthSettings.resonance}</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              step="0.5"
              value={synthSettings.resonance}
              onChange={(e) =>
                updateSetting('resonance', parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-mono-400 mb-1 uppercase tracking-wider">
              <span>SPATIAL DELAY TIME</span>
              <span className="text-white">{synthSettings.delayTime}S</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.01"
              value={synthSettings.delayTime}
              onChange={(e) =>
                updateSetting('delayTime', parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
