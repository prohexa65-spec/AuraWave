import React, { useState } from 'react';
import { SongComposition } from '../types/music';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { audio } from '../audio/synthEngine';

interface RemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: SongComposition;
  onRemix: (remixPrompt: string, moodTag: string) => void;
}

const REMIX_TAGS = ['piano', 'hard rock', 'aggressive', 'dreamy', 'faster tempo', 'chill ambient', 'heavy 808', 'synthwave'];

export const RemixModal: React.FC<RemixModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  onRemix,
}) => {
  const [remixPrompt, setRemixPrompt] = useState('Slow this down and make it dreamier with lush reverb');
  const [selectedTag, setSelectedTag] = useState('dreamy');
  const [hasHook, setHasHook] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    audio.playClick('confirm');
    onRemix(remixPrompt, selectedTag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-mono-950 border border-mono-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Top Handle */}
        <div className="w-10 h-1 bg-mono-800 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-mono-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mono-900 border border-mono-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-mono-500 font-mono uppercase tracking-wider">REMIXING:</span>
                <span className="text-xs font-bold text-white font-mono uppercase">{currentSong.title}</span>
              </div>
              <p className="text-[10px] text-mono-400 font-mono uppercase tracking-wider">{currentSong.genre} • {currentSong.tempo} BPM</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-mono-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tags */}
        <div className="py-4 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase text-mono-500 tracking-wider">MODIFIER TAGS:</span>
            <button
              onClick={() => {
                audio.playClick('tick');
                setHasHook(!hasHook);
              }}
              className={`text-[10px] px-2.5 py-1 rounded border uppercase tracking-wider transition-colors ${
                hasHook ? 'bg-white text-black font-bold border-white' : 'bg-mono-900 text-mono-400 border-mono-800'
              }`}
            >
              + HOOK {hasHook ? '✓' : ''}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {REMIX_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  audio.playClick('tick');
                  setSelectedTag(tag);
                }}
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border transition-all ${
                  selectedTag === tag
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-mono-900 text-mono-400 hover:text-white border-mono-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Remix Prompt Textarea */}
          <label className="text-[10px] uppercase text-mono-500 tracking-wider block mb-1.5">
            REMIX INSTRUCTIONS
          </label>
          <div className="relative">
            <textarea
              value={remixPrompt}
              onChange={(e) => setRemixPrompt(e.target.value)}
              rows={3}
              placeholder="ENTER REMIX DIRECTIVES..."
              className="w-full bg-mono-900 border border-mono-800 rounded-xl p-3 text-xs text-white placeholder-mono-600 focus:outline-none focus:border-white font-mono uppercase resize-none"
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg bg-white text-black hover:bg-mono-200 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>GENERATE REMIX</span>
        </button>
      </div>
    </div>
  );
};
