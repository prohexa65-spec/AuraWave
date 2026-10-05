import React, { useState, useEffect } from 'react';
import { SongComposition } from '../types/music';
import { GENRE_PRESETS, generateProceduralSong } from '../audio/proceduralGenerator';
import { FolderHeart, Play, Trash2, Download, Upload, Plus, X, Disc } from 'lucide-react';

interface SongLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: SongComposition;
  onLoadSong: (song: SongComposition) => void;
}

const STORAGE_KEY = 'aurawave_saved_songs';

export const SongLibraryModal: React.FC<SongLibraryModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  onLoadSong,
}) => {
  const [savedSongs, setSavedSongs] = useState<SongComposition[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedSongs(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Could not read saved songs:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveCurrentSong = () => {
    const updated = [currentSong, ...savedSongs.filter((s) => s.id !== currentSong.id)];
    setSavedSongs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save song:', e);
    }
    setActiveTab('saved');
  };

  const deleteSong = (id: string) => {
    const updated = savedSongs.filter((s) => s.id !== id);
    setSavedSongs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not delete song:', e);
    }
  };

  const loadPreset = (genreId: string) => {
    const comp = generateProceduralSong(genreId);
    onLoadSong(comp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <FolderHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 font-mono">
                SONG VAULT & PRESETS
              </h2>
              <p className="text-xs text-neutral-400">
                Switch presets or load saved projects from your device
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

        {/* Tab switcher & Save current button */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'presets'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Curated Presets ({GENRE_PRESETS.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              My Saved Tracks ({savedSongs.length})
            </button>
          </div>

          <button
            onClick={saveCurrentSong}
            className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-pink-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Save Current Project
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GENRE_PRESETS.map((p) => (
                <div
                  key={p.id}
                  className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-neutral-200">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {p.defaultBpm} BPM
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => loadPreset(p.id)}
                    className="mt-3 w-full py-1.5 rounded-xl bg-neutral-900 hover:bg-cyan-500 hover:text-neutral-950 text-neutral-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Disc className="w-3.5 h-3.5" /> Load Preset
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {savedSongs.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-xs font-mono">
                  No saved songs yet. Click "Save Current Project" to store your track!
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSongs.map((song) => (
                    <div
                      key={song.id}
                      className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-neutral-200">
                          {song.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {song.genre} • {song.tempo} BPM • {song.key}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadSong(song);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-neutral-950 text-xs font-mono font-semibold transition-all flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Load
                        </button>
                        <button
                          onClick={() => deleteSong(song.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
