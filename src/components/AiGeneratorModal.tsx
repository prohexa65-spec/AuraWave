import React, { useState } from 'react';
import { SongComposition } from '../types/music';
import { GENRE_PRESETS, generateProceduralSong } from '../audio/proceduralGenerator';
import { Sparkles, Wand2, Mic, X, Cpu, Zap, Music2, RefreshCw } from 'lucide-react';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyComposition: (comp: SongComposition) => void;
}

const SAMPLE_PROMPTS = [
  'Futuristic cyberpunk night drive with gritty 808 bass and sharp synth arpeggios',
  'Late night Tokyo lo-fi study beats with nostalgic jazz chords and vinyl rain warmth',
  'Energetic 80s retrowave synthpop with soaring melody and driving four-on-floor groove',
  'Dark 808 trap banger with rolling hi-hats, hard claps, and haunting bell melody',
  'Deep meditation ambient soundscape with cosmic evolving pads and crystal resonance',
  'Uplifting future house festival anthem with bouncy bass and bright supersaws',
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyComposition,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('synthwave');
  const [tempo, setTempo] = useState(115);
  const [mood, setMood] = useState('Energetic');
  const [keyScale, setKeyScale] = useState('A Minor');
  const [vocalLyrics, setVocalLyrics] = useState('');
  const [includeVocalHook, setIncludeVocalHook] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectGenre = (genreId: string) => {
    setSelectedGenre(genreId);
    const preset = GENRE_PRESETS.find((p) => p.id === genreId);
    if (preset) {
      setTempo(preset.defaultBpm);
    }
  };

  const handleOfflineGenerate = () => {
    setIsGenerating(true);
    setStatusMessage('Synthesizing procedural harmonic composition...');

    setTimeout(() => {
      const comp = generateProceduralSong(
        selectedGenre,
        prompt.trim() || undefined
      );
      comp.tempo = tempo;
      comp.key = keyScale;
      onApplyComposition(comp);
      setIsGenerating(false);
      onClose();
    }, 300);
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('Prompting Gemini AI Music Producer...');

    try {
      // 1. Call server AI compose
      const response = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || `Original ${selectedGenre} track with ${mood} vibe`,
          genre: selectedGenre,
          mood,
          tempo,
          scale: keyScale,
        }),
      });

      const data = await response.json();

      let comp: SongComposition;

      if (data.success && data.composition) {
        const raw = data.composition;
        const base = generateProceduralSong(selectedGenre, raw.title || prompt || undefined, vocalLyrics);
        comp = {
          ...base,
          id: `song_ai_${Date.now()}`,
          title: raw.title || 'AI Generated Masterpiece',
          genre: raw.genre || selectedGenre,
          mood: raw.mood || mood,
          tempo: raw.tempo || tempo,
          key: raw.key || keyScale,
          scaleType: raw.scaleType || 'minor',
          energy: raw.energy || 8,
          description: raw.description || prompt,
          drums: raw.drums || base.drums,
          bass: raw.bass || base.bass,
          chords: raw.chords || base.chords,
          lead: raw.lead || base.lead,
          synthSettings: raw.synthSettings || base.synthSettings,
          lyricsHook: raw.lyricsHook || vocalLyrics || base.lyricsHook,
        };
      } else {
        // Fallback to local procedural generator if server API key is not configured
        comp = generateProceduralSong(selectedGenre, prompt.trim() || undefined, vocalLyrics);
        comp.tempo = tempo;
      }

      // 2. If vocal hook is enabled and lyrics entered, generate AI vocal via Gemini TTS
      if (includeVocalHook && (vocalLyrics.trim() || comp.lyricsHook)) {
        setStatusMessage('Generating AI Vocal Hook with Gemini TTS...');
        try {
          const vocalRes = await fetch('/api/ai/vocal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: vocalLyrics.trim() || comp.lyricsHook,
              style: 'Punchy electronic music hook',
            }),
          });
          const vocalData = await vocalRes.json();
          if (vocalData.success && vocalData.audioBase64) {
            comp.vocalAudioBase64 = vocalData.audioBase64;
          }
        } catch (vErr) {
          console.warn('Vocal generation skipped:', vErr);
        }
      }

      onApplyComposition(comp);
      setIsGenerating(false);
      onClose();
    } catch (err) {
      console.warn('AI generate failed, using procedural fallback:', err);
      const fallback = generateProceduralSong(selectedGenre, prompt.trim() || undefined);
      fallback.tempo = tempo;
      onApplyComposition(fallback);
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow Header */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 font-mono flex items-center gap-2">
                AI MUSIC STUDIO COMPOSER
              </h2>
              <p className="text-xs text-neutral-400">
                Generate complete multi-track songs from prompts without any external sources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-300 block mb-1.5 flex items-center justify-between">
              <span>Song Prompt / Creative Vibe</span>
              <span className="text-[10px] text-neutral-500">Natural Language Description</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Dark synthwave cyber race with deep 808s, soaring analog lead, and melancholic harmonies..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono resize-none"
            />
          </div>

          {/* Quick inspiration prompts */}
          <div>
            <span className="text-[11px] font-mono text-neutral-400 block mb-2">
              Inspire me with preset ideas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="text-[10px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg text-left transition-colors"
                >
                  "{p.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Genre Selection */}
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-300 block mb-2">
              Select Sonic Genre
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GENRE_PRESETS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelectGenre(g.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedGenre === g.id
                      ? `${g.badgeColor} border-current ring-1 ring-current shadow-lg`
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">{g.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{g.defaultBpm} BPM</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls: BPM, Key, Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800">
            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                Tempo: <span className="text-cyan-400 font-bold">{tempo} BPM</span>
              </label>
              <input
                type="range"
                min="60"
                max="180"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                Key / Scale
              </label>
              <select
                value={keyScale}
                onChange={(e) => setKeyScale(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono focus:outline-none"
              >
                <option value="A Minor">A Minor (Natural)</option>
                <option value="D Dorian">D Dorian (Cyber Synth)</option>
                <option value="C Major">C Major (Bright)</option>
                <option value="C# Minor">C# Minor (Trap)</option>
                <option value="F Phrygian">F Phrygian (Dark)</option>
                <option value="G Minor">G Minor (Dance)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                Vibe / Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono focus:outline-none"
              >
                <option value="Energetic">Energetic & Punchy</option>
                <option value="Melancholic">Melancholic & Deep</option>
                <option value="Uplifting">Uplifting & Bright</option>
                <option value="Aggressive">Aggressive & Heavy</option>
                <option value="Relaxed">Chill & Relaxed</option>
              </select>
            </div>
          </div>

          {/* AI Vocal Hook (Gemini TTS) */}
          <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVocalHook}
                  onChange={(e) => setIncludeVocalHook(e.target.checked)}
                  className="rounded border-neutral-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs font-mono font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  Include AI Vocal Hook (Gemini TTS)
                </span>
              </label>
              <span className="text-[10px] text-pink-400 font-mono bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                gemini-3.8-flash-lite-tts
              </span>
            </div>

            {includeVocalHook && (
              <input
                type="text"
                value={vocalLyrics}
                onChange={(e) => setVocalLyrics(e.target.value)}
                placeholder="Enter vocal phrase: e.g. Drop the bass, welcome to the grid"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-pink-500"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleOfflineGenerate}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
            title="Instant procedural music generation (100% self-contained & offline)"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Instant Offline Compose</span>
          </button>

          <button
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{statusMessage || 'Composing Song...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate with Gemini AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
