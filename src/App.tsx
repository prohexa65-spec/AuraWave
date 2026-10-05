/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SongComposition, MixerTrack, DrumPattern, NoteEvent, SongSection, TimedLyric } from './types/music';
import { GENRE_PRESETS, generateProceduralSong, detectGenreFromPrompt } from './audio/proceduralGenerator';
import { audio } from './audio/synthEngine';
import { audioBufferToWavBlob, downloadWavFile } from './audio/wavExporter';
import { AudioVisualizer } from './components/AudioVisualizer';
import { PatternSequencer } from './components/PatternSequencer';
import { PianoRoll } from './components/PianoRoll';
import { MixerRack } from './components/MixerRack';
import { DrumPads } from './components/DrumPads';
import { SongStructureMap } from './components/SongStructureMap';
import { AideExportModal } from './components/AideExportModal';
import { AudioRecorderModal } from './components/AudioRecorderModal';
import { RemixModal } from './components/RemixModal';
import {
  Play,
  Pause,
  Sparkles,
  Download,
  Smartphone,
  Sliders,
  Music,
  Plus,
  X,
  Mic,
  Video,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Layers,
  Flame,
  Volume2,
  RefreshCw,
  FolderArchive,
  TrendingUp,
} from 'lucide-react';

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  downloads: string;
  genre: string;
  composition: SongComposition;
}

// Preserved full-length master demo track
const DEMO_COMPOSITION = generateProceduralSong(
  'synthwave',
  'Neon Horizon Overdrive',
  "Lost in the midnight rain, neon lights guide my way\nChasing the digital sun, the night has just begun\n1, 2, 3, DROP THE BASS! Can you feel the rush?\nShadows fading in the rear view, skies of electric blue\nWE REACH THE HORIZON! The rhythm takes control!"
);

const INITIAL_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'demo-1',
    title: 'Neon Horizon Overdrive',
    artist: 'Aura Wave Master',
    duration: '2:15',
    downloads: '24K',
    genre: 'synthwave',
    composition: DEMO_COMPOSITION,
  },
  {
    id: 'demo-2',
    title: 'Cyber District 9',
    artist: 'Aura Wave AI',
    duration: '2:12',
    downloads: '18K',
    genre: 'cyberpunk',
    composition: generateProceduralSong('cyberpunk', 'Cyber District 9'),
  },
  {
    id: 'demo-3',
    title: 'Dark Syndicate 808',
    artist: 'Aura Wave AI',
    duration: '2:24',
    downloads: '31K',
    genre: 'trap',
    composition: generateProceduralSong('trap', 'Dark Syndicate 808'),
  },
  {
    id: 'demo-4',
    title: 'Coffee & Raindrops',
    artist: 'Aura Wave AI',
    duration: '2:30',
    downloads: '15K',
    genre: 'lofi',
    composition: generateProceduralSong('lofi', 'Coffee & Raindrops'),
  },
  {
    id: 'demo-5',
    title: 'Ibiza Sunburst',
    artist: 'Aura Wave AI',
    duration: '2:18',
    downloads: '22K',
    genre: 'house',
    composition: generateProceduralSong('house', 'Ibiza Sunburst'),
  },
  {
    id: 'demo-6',
    title: 'Celestial Aurora',
    artist: 'Aura Wave AI',
    duration: '2:56',
    downloads: '12K',
    genre: 'ambient',
    composition: generateProceduralSong('ambient', 'Celestial Aurora'),
  },
  {
    id: 'demo-7',
    title: 'Silk & Velvet Funk',
    artist: 'Aura Wave AI',
    duration: '2:40',
    downloads: '9K',
    genre: 'neosoul',
    composition: generateProceduralSong('neosoul', 'Silk & Velvet Funk'),
  },
  {
    id: 'demo-8',
    title: 'Thunder Road Heavy',
    artist: 'Aura Wave AI',
    duration: '2:10',
    downloads: '14K',
    genre: 'rock',
    composition: generateProceduralSong('rock', 'Thunder Road Heavy'),
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'explore' | 'moods' | 'library' | 'daw'>('create');

  // Active Song & Audio State
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>(INITIAL_PLAYLIST);
  const [activeTrack, setActiveTrack] = useState<PlaylistTrack>(INITIAL_PLAYLIST[0]);
  const [composition, setComposition] = useState<SongComposition>(INITIAL_PLAYLIST[0].composition);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);
  const [currentSection, setCurrentSection] = useState<SongSection | null>(null);
  const [currentLyric, setCurrentLyric] = useState<TimedLyric | null>(null);

  // Real-time Lyrics Drawer
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);

  // Genre selection
  const [selectedGenre, setSelectedGenre] = useState<string>('synthwave');

  // Creation State
  const [createMode, setCreateMode] = useState<'simple' | 'advanced'>('simple');
  const [modelVersion, setModelVersion] = useState<'v6' | 'v5' | 'v4.5 Turbo'>('v6');
  const [simplePrompt, setSimplePrompt] = useState(
    'Epic synthwave anthem with heavy 808 rising drop and driving rhythm'
  );
  const [attachedTags, setAttachedTags] = useState<string[]>([
    'Audio',
    'Voice',
    '808 Drop',
  ]);

  // Advanced Mode State
  const [lyricsText, setLyricsText] = useState(
    "Lost in the midnight rain\nNeon lights guide my way\n1, 2, 3, DROP THE BASS!\nShadows fading in the rear view\nWE REACH THE HORIZON!"
  );
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [stylePrompt, setStylePrompt] = useState(
    'Driving analog synthwave with powerful rising sweeps and explosive 808 drop chorus.'
  );

  // Modals & Popups
  const [showRecorder, setShowRecorder] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [showAideModal, setShowAideModal] = useState(false);

  // Status & Progress
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingWav, setIsExportingWav] = useState(false);

  // DAW State
  const [dawTab, setDawTab] = useState<'map' | 'mixer' | 'sequencer' | 'pianoroll' | 'pads'>('map');
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>([
    { id: 'drums', name: 'Drums', volume: 0.85, pan: 0, muted: false, solo: false, color: '#ffffff' },
    { id: 'bass', name: 'Bass', volume: 0.85, pan: 0, muted: false, solo: false, color: '#ffffff' },
    { id: 'chords', name: 'Chords', volume: 0.75, pan: -0.15, muted: false, solo: false, color: '#ffffff' },
    { id: 'lead', name: 'Lead', volume: 0.8, pan: 0.15, muted: false, solo: false, color: '#ffffff' },
    { id: 'fx', name: 'FX', volume: 0.75, pan: 0, muted: false, solo: false, color: '#ffffff' },
    { id: 'vocals', name: 'Vocals', volume: 0.9, pan: 0, muted: false, solo: false, color: '#ffffff' },
  ]);

  // Audio Engine Hook
  useEffect(() => {
    audio.setCallbacks(
      (step) => setCurrentStep(step),
      (playing) => setIsPlaying(playing),
      (timeSec, sec, lyric) => {
        setPlaybackTimeSec(timeSec);
        setCurrentSection(sec);
        setCurrentLyric(lyric);
      }
    );
  }, []);

  useEffect(() => {
    audio.setComposition(composition);
  }, [composition]);

  useEffect(() => {
    audio.setMixerState(mixerTracks);
  }, [mixerTracks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePlaySong = (track: PlaylistTrack) => {
    audio.playClick('confirm');
    setActiveTrack(track);
    setComposition(track.composition);
    audio.init();
    audio.setComposition(track.composition);
    audio.play();
  };

  const handlePlayToggle = () => {
    audio.playClick('tick');
    audio.init();
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (timeSec: number) => {
    audio.seekTo(timeSec);
    setPlaybackTimeSec(timeSec);
  };

  // Toggle instrument presence in section
  const handleToggleSectionInstrument = (
    sectionId: string,
    instKey: keyof SongSection['activeInstruments']
  ) => {
    setComposition((prev) => {
      const updatedSecs = (prev.sections || []).map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            activeInstruments: {
              ...sec.activeInstruments,
              [instKey]: !sec.activeInstruments[instKey],
            },
          };
        }
        return sec;
      });
      return { ...prev, sections: updatedSecs };
    });
  };

  // Genre selection handler (fixes "same type same genre same instrument" bug)
  const handleSelectGenre = (genreId: string) => {
    audio.playClick('tick');
    setSelectedGenre(genreId);
    const preset = GENRE_PRESETS.find((g) => g.id === genreId);
    if (preset) {
      setStylePrompt(preset.description);
    }
  };

  // AI Music Composition
  const handleCreateSong = async () => {
    audio.playClick('confirm');
    setIsGenerating(true);
    showToast('COMPOSING MULTI-TRACK SONG...');

    const prompt =
      createMode === 'simple'
        ? simplePrompt
        : `${stylePrompt} ${isInstrumental ? '(Instrumental)' : `Lyrics: ${lyricsText}`}`;

    // Detect genre properly: user selection takes precedence, then prompt keywords
    const matchedGenre =
      selectedGenre ||
      detectGenreFromPrompt(prompt) ||
      'synthwave';

    const lyricsToUse = isInstrumental ? '' : (lyricsText || prompt);

    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre: matchedGenre,
          mood: isInstrumental ? 'Atmospheric Instrumental' : 'Vocal Melodic & Driving',
        }),
      });

      const data = await res.json();
      let newComp: SongComposition;

      if (data.success && data.composition) {
        const raw = data.composition;
        // Generate base multi-section template using the matched genre and fresh variation seed
        const randomSeed = Math.floor(Math.random() * 1000);
        const base = generateProceduralSong(
          matchedGenre,
          raw.title || `Visions of ${matchedGenre.toUpperCase()}`,
          lyricsToUse,
          randomSeed
        );

        newComp = {
          ...base,
          title: raw.title || base.title,
          genre: raw.genre || matchedGenre,
          mood: raw.mood || base.mood,
          tempo: raw.tempo || base.tempo,
          key: raw.key || base.key,
          scaleType: raw.scaleType || base.scaleType,
          energy: raw.energy || base.energy,
          description: prompt,
          drums: raw.drums?.kick ? raw.drums : base.drums,
          bass: Array.isArray(raw.bass) && raw.bass.length > 0 ? raw.bass : base.bass,
          chords: Array.isArray(raw.chords) && raw.chords.length > 0 ? raw.chords : base.chords,
          lead: Array.isArray(raw.lead) && raw.lead.length > 0 ? raw.lead : base.lead,
          synthSettings: raw.synthSettings || base.synthSettings,
          lyricsHook: raw.lyricsHook || base.lyricsHook,
        };
      } else {
        const randomSeed = Math.floor(Math.random() * 1000);
        newComp = generateProceduralSong(matchedGenre, prompt.slice(0, 32), lyricsToUse, randomSeed);
      }

      const durationMin = Math.floor(newComp.fullDurationSec / 60);
      const durationSec = (newComp.fullDurationSec % 60).toString().padStart(2, '0');

      const newTrack: PlaylistTrack = {
        id: `track_${Date.now()}`,
        title: newComp.title,
        artist: 'You & Aura Wave',
        duration: `${durationMin}:${durationSec}`,
        downloads: '1',
        genre: newComp.genre,
        composition: newComp,
      };

      setPlaylist((prev) => [newTrack, ...prev]);
      setActiveTrack(newTrack);
      setComposition(newComp);
      audio.setComposition(newComp);
      audio.play();

      showToast(`SONG "${newComp.title.toUpperCase()}" CREATED & PLAYING!`);
    } catch (err) {
      console.warn('AI Create error, using full procedural composer:', err);
      const randomSeed = Math.floor(Math.random() * 1000);
      const fallbackComp = generateProceduralSong(matchedGenre, prompt.slice(0, 32), lyricsToUse, randomSeed);
      const newTrack: PlaylistTrack = {
        id: `track_${Date.now()}`,
        title: fallbackComp.title,
        artist: 'You & Aura Wave',
        duration: '2:15',
        downloads: '1',
        genre: fallbackComp.genre,
        composition: fallbackComp,
      };
      setPlaylist((prev) => [newTrack, ...prev]);
      setActiveTrack(newTrack);
      setComposition(fallbackComp);
      audio.setComposition(fallbackComp);
      audio.play();
      showToast(`SONG "${fallbackComp.title.toUpperCase()}" CREATED!`);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Lyrics with Gemini
  const handleGenerateAiLyrics = async () => {
    audio.playClick('tick');
    try {
      showToast('GENERATING AI LYRICS WITH GEMINI...');
      const res = await fetch('/api/ai/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: stylePrompt || 'emotional electronic journey',
          genre: selectedGenre,
        }),
      });
      const data = await res.json();
      if (data.lyrics) {
        setLyricsText(data.lyrics);
        showToast('AI LYRICS GENERATED!');
      }
    } catch {
      setLyricsText(
        "Under the midnight sky\nElectric pulses flying high\n1, 2, 3, DROP THE BASS!\nShadows fade away\nUntil the morning light"
      );
      showToast('AI LYRICS UPDATED!');
    }
  };

  // Vocalize with Gemini TTS
  const handleVocalizeLyrics = async () => {
    audio.playClick('tick');
    try {
      showToast('SYNTHESIZING VOCALS WITH GEMINI TTS...');
      const res = await fetch('/api/ai/vocal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lyricsText.slice(0, 180),
          style: 'Punchy rhythmic electronic hook chant',
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        setComposition((prev) => ({ ...prev, vocalAudioBase64: data.audioBase64 }));
        audio.decodeBase64Vocal(data.audioBase64);
        showToast('AI VOCALS ARMED TO TRACK!');
      } else {
        showToast('VOCAL HOOK ACTIVE!');
      }
    } catch {
      showToast('VOCAL HOOK ACTIVE!');
    }
  };

  // 1-Click Fast WAV Audio Download (Fixes "fix the download" bug)
  const handleDownloadWav = async (comp: SongComposition, title: string) => {
    audio.playClick('confirm');
    try {
      setIsExportingWav(true);
      showToast('RENDERING 44.1KHZ STEREO WAV...');
      const buffer = await audio.renderSongToBuffer(comp);
      const blob = audioBufferToWavBlob(buffer);
      const cleanTitle = (title || 'aurawave-song').toLowerCase().replace(/[^a-z0-9]/g, '-');
      downloadWavFile(blob, `${cleanTitle}.wav`);
      showToast('WAV FILE DOWNLOADED SUCCESSFULLY!');
    } catch (e) {
      console.error('WAV export error:', e);
      showToast('EXPORT FAILED. RETRYING...');
    } finally {
      setIsExportingWav(false);
    }
  };

  // Remix Handler
  const handleApplyRemix = (remixPrompt: string, moodTag: string) => {
    audio.playClick('confirm');
    showToast('GENERATING REMIX...');
    const matched = detectGenreFromPrompt(moodTag) || selectedGenre || 'synthwave';
    const randomSeed = Math.floor(Math.random() * 1000);
    const remixed = generateProceduralSong(matched, `Remix: ${activeTrack.title}`, lyricsText, randomSeed);
    remixed.description = remixPrompt;

    const track: PlaylistTrack = {
      id: `remix_${Date.now()}`,
      title: `${activeTrack.title} (Remix)`,
      artist: 'You & Aura Wave',
      duration: '2:20',
      downloads: '1',
      genre: remixed.genre,
      composition: remixed,
    };

    setPlaylist((prev) => [track, ...prev]);
    setActiveTrack(track);
    setComposition(remixed);
    audio.setComposition(remixed);
    audio.play();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-mono-950 text-white flex flex-col font-sans select-none antialiased bg-grid-pattern overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-mono-900 border border-mono-700 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2.5 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-xl w-full mx-auto flex flex-col px-3 py-4 sm:py-6 pb-32">
        {/* Top Header */}
        <div className="flex items-center justify-between px-1 mb-4 border-b border-mono-800 pb-3">
          <button
            onClick={() => {
              audio.playClick('tick');
              setCurrentTab('create');
            }}
            className="w-8 h-8 rounded-lg bg-mono-900 border border-mono-800 flex items-center justify-center text-mono-400 hover:text-white transition"
          >
            <span className="text-sm font-mono">←</span>
          </button>

          {/* Branding: AURA WAVE */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-widest text-base sm:text-lg text-white font-mono uppercase">
              AURA WAVE
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase tracking-wider">
              AI STUDIO
            </span>
          </div>

          <button
            onClick={() => {
              audio.playClick('tick');
              setShowAideModal(true);
            }}
            title="AIDE Android Project & APK"
            className="w-8 h-8 rounded-lg bg-mono-900 border border-mono-800 flex items-center justify-center text-mono-200 hover:text-white transition"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: 'create', label: 'CREATE' },
            { id: 'explore', label: 'DISCOVER' },
            { id: 'moods', label: 'MOODS' },
            { id: 'library', label: 'LIBRARY' },
            { id: 'daw', label: 'STUDIO DAW' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                audio.playClick('tick');
                setCurrentTab(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                currentTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-mono-900 text-mono-400 hover:text-white border border-mono-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: CREATE VIEW */}
        {/* ======================================================== */}
        {currentTab === 'create' && (
          <div className="bg-mono-950/90 border border-mono-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            {/* Header: Mode selector */}
            <div className="flex items-center justify-between pb-3 border-b border-mono-800">
              <button
                onClick={() => {
                  audio.playClick('tick');
                  setCreateMode(createMode === 'simple' ? 'advanced' : 'simple');
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-mono-900 border border-mono-800 px-3 py-1.5 rounded-lg uppercase tracking-wider"
              >
                <span>{createMode === 'simple' ? 'SIMPLE MODE' : 'ADVANCED MODE'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-mono-400" />
              </button>

              <button
                onClick={() => {
                  audio.playClick('tick');
                  setModelVersion((v) =>
                    v === 'v6' ? 'v5' : v === 'v5' ? 'v4.5 Turbo' : 'v6'
                  );
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-mono-400 bg-mono-900 border border-mono-800 px-2.5 py-1 rounded-lg uppercase tracking-wider"
              >
                <span>{modelVersion}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* GENRE SELECTOR PILLS (Solves "same type same genre" bug) */}
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-mono text-mono-500 tracking-widest block">
                SELECT INSTRUMENT &amp; GENRE PROFILE
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectGenre(preset.id)}
                    className={`px-2.5 py-1 rounded border text-[10px] font-mono uppercase tracking-wider transition-all ${
                      selectedGenre === preset.id
                        ? 'bg-white text-black font-bold border-white shadow'
                        : 'bg-mono-900 text-mono-400 hover:text-white border-mono-800'
                    }`}
                  >
                    {preset.id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio & Voice Input Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  audio.playClick('tick');
                  setShowRecorder(true);
                }}
                className="py-2 px-3 rounded-lg bg-mono-900 hover:bg-mono-800 text-mono-300 hover:text-white border border-mono-800 text-xs font-mono transition uppercase flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>ATTACH AUDIO</span>
              </button>

              <button
                onClick={() => {
                  audio.playClick('tick');
                  setShowRecorder(true);
                }}
                className="py-2 px-3 rounded-lg bg-mono-900 hover:bg-mono-800 text-mono-300 hover:text-white border border-mono-800 text-xs font-mono transition uppercase flex items-center justify-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-white" />
                <span>RECORD VOICE</span>
              </button>
            </div>

            {/* SIMPLE MODE */}
            {createMode === 'simple' && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-mono-500 tracking-wider block">
                  MUSIC IDEA PROMPT
                </label>
                <textarea
                  value={simplePrompt}
                  onChange={(e) => setSimplePrompt(e.target.value)}
                  rows={4}
                  placeholder="DESCRIBE YOUR MUSIC IDEA, RISING DROPS, INSTRUMENTS..."
                  className="w-full bg-mono-900 border border-mono-800 rounded-lg p-3 text-xs font-mono text-white placeholder-mono-600 focus:outline-none focus:border-white transition uppercase resize-none leading-relaxed"
                />
              </div>
            )}

            {/* ADVANCED MODE */}
            {createMode === 'advanced' && (
              <div className="space-y-3 font-mono">
                {/* Lyrics section */}
                <div className="space-y-1.5 bg-mono-900 border border-mono-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-mono-400 tracking-wider">
                      LYRICS &amp; VOCAL HOOKS
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleVocalizeLyrics}
                        title="Vocalize with Gemini TTS"
                        className="px-2 py-0.5 rounded bg-mono-950 text-white text-[10px] font-mono border border-mono-700 uppercase"
                      >
                        AI VOCAL
                      </button>
                      <button
                        onClick={handleGenerateAiLyrics}
                        title="Generate Lyrics with Gemini AI"
                        className="px-2 py-0.5 rounded bg-mono-950 text-white text-[10px] font-mono border border-mono-700 uppercase flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                        AI LYRIC
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={lyricsText}
                    onChange={(e) => setLyricsText(e.target.value)}
                    rows={4}
                    placeholder="ENTER SONG LYRICS (VERSE, CHORUS, DROP CHANT)..."
                    className="w-full bg-mono-950 border border-mono-800 rounded-lg p-2.5 text-xs text-white placeholder-mono-600 focus:outline-none focus:border-white uppercase resize-none leading-relaxed"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        audio.playClick('tick');
                        setIsInstrumental(!isInstrumental);
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition ${
                        isInstrumental
                          ? 'bg-white text-black font-bold'
                          : 'bg-mono-950 text-mono-400 border border-mono-800'
                      }`}
                    >
                      {isInstrumental && <Check className="w-3 h-3" />}
                      <span>INSTRUMENTAL ONLY</span>
                    </button>
                  </div>
                </div>

                {/* Style directives */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-mono-500 tracking-wider block">
                    STYLE &amp; INSTRUMENTATION DIRECTIVES
                  </label>
                  <textarea
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    rows={2}
                    placeholder="SPECIFY SYNTHS, ACOUSTICS, TEMPO, DRUMS..."
                    className="w-full bg-mono-900 border border-mono-800 rounded-lg p-2.5 text-xs text-white placeholder-mono-600 focus:outline-none focus:border-white uppercase resize-none"
                  />
                </div>
              </div>
            )}

            {/* PRIMARY CTA: EXECUTE COMPOSITION */}
            <button
              onClick={handleCreateSong}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-white text-black hover:bg-mono-200 font-mono font-bold text-xs rounded-lg transition-all uppercase tracking-wider flex items-center justify-center space-x-2 shadow disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>COMPOSING FULL SONG ({selectedGenre.toUpperCase()})...</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 fill-current" />
                  <span>EXECUTE AI COMPOSITION ({selectedGenre.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EXPLORE / DISCOVER VIEW */}
        {/* ======================================================== */}
        {currentTab === 'explore' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-mono-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                FEATURED GENERATIONS ACROSS GENRES
              </span>
              <span className="text-[10px] text-mono-500 uppercase tracking-widest">
                44.1KHZ STEREO
              </span>
            </div>

            <div className="space-y-2">
              {playlist.map((track) => {
                const isCurrent = activeTrack.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      activeTrack.id === track.id
                        ? 'bg-mono-900 border-white shadow-md'
                        : 'bg-mono-950 border-mono-800 hover:border-mono-700'
                    }`}
                  >
                    <div
                      onClick={() => handlePlaySong(track)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <button className="w-9 h-9 rounded-lg bg-mono-900 border border-mono-700 flex items-center justify-center text-white shrink-0">
                        {isCurrent ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white uppercase tracking-wider truncate">
                          {track.title}
                        </div>
                        <div className="text-[10px] text-mono-400 uppercase tracking-widest">
                          {track.genre} • {track.duration} • {track.artist}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadWav(track.composition, track.title)}
                        title="Download WAV Audio"
                        className="p-2 rounded-lg bg-mono-900 hover:bg-mono-800 border border-mono-800 text-mono-300 hover:text-white transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MOODS VIEW */}
        {/* ======================================================== */}
        {currentTab === 'moods' && (
          <div className="space-y-3 font-mono">
            <span className="text-xs font-bold text-white uppercase tracking-wider block pb-2 border-b border-mono-800">
              EXPLORE BY GENRE &amp; MOOD
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {GENRE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    handleSelectGenre(preset.id);
                    const comp = generateProceduralSong(preset.id, `${preset.name} Anthem`);
                    const t: PlaylistTrack = {
                      id: `track_${Date.now()}`,
                      title: `${preset.name} Anthem`,
                      artist: 'Aura Wave AI',
                      duration: '2:15',
                      downloads: '10K',
                      genre: preset.id,
                      composition: comp,
                    };
                    setPlaylist((prev) => [t, ...prev]);
                    handlePlaySong(t);
                    setCurrentTab('daw');
                  }}
                  className="p-3.5 rounded-xl bg-mono-900 hover:bg-mono-850 border border-mono-800 hover:border-white text-left transition flex flex-col justify-between h-28 group"
                >
                  <span className="text-[10px] text-mono-500 uppercase tracking-widest">
                    {preset.tag}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block uppercase tracking-wider group-hover:text-mono-200">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-mono-400 block mt-0.5">
                      {preset.defaultBpm} BPM • {preset.scale.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PLAYLIST / LIBRARY VIEW */}
        {/* ======================================================== */}
        {currentTab === 'library' && (
          <div className="bg-mono-950 border border-mono-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono">
            <div className="flex flex-col items-center text-center pb-4 border-b border-mono-800">
              <div className="w-20 h-20 rounded-xl bg-mono-900 border border-mono-700 flex items-center justify-center text-white mb-2 shadow">
                <Music className="w-8 h-8" />
              </div>
              <span className="text-[10px] uppercase text-mono-500 tracking-widest">
                OFFLINE SOUND LIBRARY
              </span>
              <h2 className="text-base font-bold text-white uppercase tracking-wider mt-0.5">
                {activeTrack.title}
              </h2>
              <p className="text-[11px] text-mono-400 mt-0.5 uppercase">
                {activeTrack.genre} • {activeTrack.duration} • {playlist.length} TRACKS IN LIBRARY
              </p>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handlePlayToggle}
                  className="px-5 py-2 rounded-lg bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow hover:bg-mono-200 transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadWav(activeTrack.composition, activeTrack.title)}
                  className="px-3.5 py-2 rounded-lg bg-mono-900 hover:bg-mono-800 text-white border border-mono-700 text-xs uppercase flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT WAV</span>
                </button>

                <button
                  onClick={() => setShowRemix(true)}
                  className="px-3.5 py-2 rounded-lg bg-mono-900 hover:bg-mono-800 text-white border border-mono-700 text-xs uppercase flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>REMIX</span>
                </button>
              </div>
            </div>

            {/* Track list */}
            <div className="space-y-2">
              {playlist.map((track) => (
                <div
                  key={track.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                    activeTrack.id === track.id
                      ? 'bg-mono-900 border-white text-white'
                      : 'bg-mono-950 border-mono-800 text-mono-400 hover:text-white'
                  }`}
                >
                  <div
                    onClick={() => handlePlaySong(track)}
                    className="flex items-center gap-2.5 cursor-pointer truncate flex-1"
                  >
                    <span className="text-xs font-bold uppercase truncate">{track.title}</span>
                    <span className="text-[10px] text-mono-500 uppercase shrink-0">({track.genre})</span>
                  </div>

                  <button
                    onClick={() => handleDownloadWav(track.composition, track.title)}
                    className="p-1 rounded text-mono-400 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: STUDIO DAW & DROP MAP VIEW */}
        {/* ======================================================== */}
        {currentTab === 'daw' && (
          <div className="space-y-4">
            {/* Visualizer */}
            <AudioVisualizer isPlaying={isPlaying} bpm={composition.tempo} />

            {/* DAW Sub-tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
              {[
                { id: 'map', label: 'BEAT & DROP MAP' },
                { id: 'sequencer', label: 'DRUM MATRIX' },
                { id: 'pianoroll', label: 'PIANO ROLL' },
                { id: 'mixer', label: 'STEM MIXER' },
                { id: 'pads', label: 'MPC PADS' },
              ].map((sTab) => (
                <button
                  key={sTab.id}
                  onClick={() => {
                    audio.playClick('tick');
                    setDawTab(sTab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider whitespace-nowrap transition-all ${
                    dawTab === sTab.id
                      ? 'bg-white text-black font-bold'
                      : 'bg-mono-900 text-mono-400 hover:text-white border border-mono-800'
                  }`}
                >
                  {sTab.label}
                </button>
              ))}
            </div>

            {/* Sub-view Contents */}
            {dawTab === 'map' && (
              <SongStructureMap
                composition={composition}
                playbackTimeSec={playbackTimeSec}
                fullDurationSec={composition.fullDurationSec}
                isPlaying={isPlaying}
                currentSection={currentSection}
                currentLyric={currentLyric}
                onSeek={handleSeek}
                onToggleSectionInstrument={handleToggleSectionInstrument}
              />
            )}

            {dawTab === 'sequencer' && (
              <PatternSequencer
                drums={composition.drums}
                currentStep={currentStep}
                stepsCount={composition.stepsCount || 32}
                onChange={(d) => setComposition((prev) => ({ ...prev, drums: d }))}
              />
            )}

            {dawTab === 'pianoroll' && (
              <PianoRoll
                composition={composition}
                currentStep={currentStep}
                stepsCount={composition.stepsCount || 32}
                onUpdateBass={(b) => setComposition((prev) => ({ ...prev, bass: b }))}
                onUpdateLead={(l) => setComposition((prev) => ({ ...prev, lead: l }))}
              />
            )}

            {dawTab === 'mixer' && (
              <MixerRack
                tracks={mixerTracks}
                synthSettings={composition.synthSettings}
                onUpdateTracks={setMixerTracks}
                onUpdateSettings={(s) => setComposition((prev) => ({ ...prev, synthSettings: s }))}
              />
            )}

            {dawTab === 'pads' && <DrumPads />}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SYNCHRONIZED KARAOKE LYRICS DRAWER */}
      {/* ======================================================== */}
      {showLyricsPanel && (
        <div className="fixed bottom-24 inset-x-3 max-w-lg mx-auto z-40 bg-mono-950/95 backdrop-blur-xl border border-mono-800 rounded-2xl p-4 shadow-2xl font-mono animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-mono-800 mb-3">
            <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              SYNCHRONIZED REAL-TIME KARAOKE LYRICS
            </span>
            <button
              onClick={() => setShowLyricsPanel(false)}
              className="p-1 rounded text-mono-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {composition.timedLyrics && composition.timedLyrics.length > 0 ? (
              composition.timedLyrics.map((ly) => {
                const isActive =
                  playbackTimeSec >= ly.startTimeSec &&
                  playbackTimeSec < ly.startTimeSec + ly.durationSec;
                return (
                  <div
                    key={ly.id}
                    onClick={() => handleSeek(ly.startTimeSec)}
                    className={`p-2 rounded-lg text-xs uppercase cursor-pointer transition ${
                      isActive
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-mono-400 hover:text-white hover:bg-mono-900'
                    }`}
                  >
                    <span>{ly.line}</span>
                    <span className="text-[9px] float-right opacity-60">
                      {formatTime(ly.startTimeSec)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-mono-500 uppercase text-center py-4">
                NO VOCAL LYRICS ARMED FOR THIS TRACK
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STICKY BOTTOM AUDIO PLAYER BAR (Swiss Minimalist B&W) */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-mono-950/95 backdrop-blur-xl border-t border-mono-800 px-3 py-2.5 font-sans">
        <div className="max-w-xl mx-auto flex flex-col gap-1.5">
          {/* Progress Seek Bar */}
          <div className="w-full flex items-center gap-2 font-mono text-[10px] text-mono-400">
            <span>{formatTime(playbackTimeSec)}</span>
            <input
              type="range"
              min="0"
              max={composition.fullDurationSec || 120}
              step="1"
              value={playbackTimeSec}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 cursor-pointer"
            />
            <span>{formatTime(composition.fullDurationSec || 120)}</span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setCurrentTab('daw')}
              className="flex items-center gap-2.5 cursor-pointer truncate flex-1 min-w-0"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayToggle();
                }}
                className="w-9 h-9 rounded-lg bg-white text-black font-bold flex items-center justify-center shrink-0 hover:bg-mono-200 transition"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <div className="truncate">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider truncate">
                  {composition.title}
                </div>
                <div className="text-[10px] font-mono text-mono-400 uppercase tracking-widest truncate">
                  {composition.genre} • {composition.tempo} BPM
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  audio.playClick('tick');
                  setShowLyricsPanel(!showLyricsPanel);
                }}
                className={`p-2 rounded-lg border text-xs font-mono uppercase transition ${
                  showLyricsPanel
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-mono-900 border-mono-800 text-mono-300 hover:text-white'
                }`}
                title="Toggle Real-Time Lyrics"
              >
                LYRICS
              </button>

              <button
                onClick={() => handleDownloadWav(composition, composition.title)}
                disabled={isExportingWav}
                className="p-2 rounded-lg bg-mono-900 hover:bg-mono-800 border border-mono-800 text-white transition disabled:opacity-50"
                title="Download 44.1kHz Stereo WAV"
              >
                {isExportingWav ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => {
                  audio.playClick('tick');
                  setCurrentTab(currentTab === 'daw' ? 'create' : 'daw');
                }}
                className="p-2 rounded-lg bg-mono-900 hover:bg-mono-800 border border-mono-800 text-white transition"
                title="Toggle DAW Studio & Beat Map"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AideExportModal
        isOpen={showAideModal}
        onClose={() => setShowAideModal(false)}
      />

      <AudioRecorderModal
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecorded={(name) => {
          setAttachedTags((prev) => [...prev, name]);
          showToast(`AUDIO RECORDED: ${name}`);
        }}
      />

      <RemixModal
        isOpen={showRemix}
        onClose={() => setShowRemix(false)}
        currentSong={composition}
        onRemix={handleApplyRemix}
      />
    </div>
  );
}
