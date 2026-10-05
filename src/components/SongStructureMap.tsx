import React from 'react';
import { SongComposition, SongSection, TimedLyric } from '../types/music';
import { audio } from '../audio/synthEngine';
import {
  TrendingUp,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Flame,
} from 'lucide-react';

interface SongStructureMapProps {
  composition: SongComposition;
  playbackTimeSec: number;
  fullDurationSec: number;
  isPlaying: boolean;
  currentSection: SongSection | null;
  currentLyric: TimedLyric | null;
  onSeek: (timeSec: number) => void;
  onToggleSectionInstrument?: (
    sectionId: string,
    instKey: keyof SongSection['activeInstruments']
  ) => void;
}

export const SongStructureMap: React.FC<SongStructureMapProps> = ({
  composition,
  playbackTimeSec,
  fullDurationSec,
  isPlaying,
  currentSection,
  currentLyric,
  onSeek,
  onToggleSectionInstrument,
}) => {
  const sections = composition.sections || [];
  const tempo = composition.tempo || 120;
  const progressPercent = Math.min(
    100,
    Math.max(0, (playbackTimeSec / Math.max(1, fullDurationSec)) * 100)
  );

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    audio.playClick('tick');
    onSeek(fraction * fullDurationSec);
  };

  const jumpToDrop = () => {
    audio.playClick('confirm');
    const dropSec = composition.primaryDropTimeSec || 32;
    onSeek(dropSec);
    if (!isPlaying) audio.play();
  };

  return (
    <div className="w-full bg-mono-950 border border-mono-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-mono-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mono-900 border border-mono-700 flex items-center justify-center text-white">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              BEAT, INSTRUMENT &amp; RISING DROP MAP
            </h3>
            <p className="text-[10px] text-mono-400 font-mono tracking-tight uppercase">
              TIMELINE TIMING OF HITS, BUILD-UP RISERS &amp; STEM ARRANGEMENTS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToDrop}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-mono-200 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow"
            title="Jump immediately to the rising drop impact"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>JUMP TO DROP ({formatTime(composition.primaryDropTimeSec || 0)})</span>
          </button>
        </div>
      </div>

      {/* Real-time Song Progress & Current Lyric Card */}
      <div className="bg-mono-900 border border-mono-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-white bg-mono-950 px-2.5 py-1 rounded-lg border border-mono-800">
            {formatTime(playbackTimeSec)} / {formatTime(fullDurationSec)}
          </span>
          <span className="text-xs font-mono text-mono-300 uppercase tracking-wider">
            CURRENT SECTION:{' '}
            <strong className="text-white">
              {currentSection?.name || 'Intro'}
            </strong>
          </span>
        </div>

        {/* Real-time Synced Lyric Display */}
        {currentLyric ? (
          <div className="text-xs font-mono text-mono-100 flex items-center gap-1.5 truncate max-w-sm uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="truncate">"{currentLyric.line}"</span>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-mono-500 uppercase tracking-widest">
            {currentSection?.type === 'drop' ? 'DROP IMPACT HIT ACTIVE' : 'INSTRUMENTAL SECTION'}
          </span>
        )}
      </div>

      {/* Master Interactive Timeline Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] font-mono text-mono-500 uppercase tracking-wider px-1">
          <span>00:00 START</span>
          <span className="text-white font-bold">
            DROPS AT {composition.hitTimingsSec?.map((t) => formatTime(t)).join(', ') || '0:32'}
          </span>
          <span>{formatTime(fullDurationSec)} END</span>
        </div>

        <div
          onClick={handleTimelineClick}
          className="relative h-12 w-full bg-mono-900 rounded-xl border border-mono-800 overflow-hidden cursor-pointer select-none group"
        >
          {/* Section Blocks Bar */}
          <div className="absolute inset-0 flex">
            {sections.map((sec) => {
              const durSec = (sec.bars * 4 * 60) / tempo;
              const widthPct = (durSec / Math.max(1, fullDurationSec)) * 100;
              const isCurrent = currentSection?.id === sec.id;

              return (
                <div
                  key={sec.id}
                  style={{ width: `${widthPct}%` }}
                  className={`relative h-full border-r border-mono-800 flex flex-col justify-center px-2 transition-all ${
                    isCurrent
                      ? 'bg-mono-800 text-white font-bold'
                      : sec.type === 'drop'
                      ? 'bg-mono-900/90 text-mono-200'
                      : sec.type === 'rising_build'
                      ? 'bg-mono-950/70 text-mono-300'
                      : 'bg-mono-950/40 text-mono-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider truncate">
                    <span className="truncate">{sec.name}</span>
                    {sec.hasDropHit && (
                      <span className="text-[9px] px-1 py-0.2 bg-white text-black font-bold rounded">
                        DROP
                      </span>
                    )}
                    {sec.hasRisingSweep && (
                      <span className="text-[9px] px-1 py-0.2 bg-mono-800 text-mono-200 rounded">
                        RISE
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-mono-500 mt-0.5">
                    {sec.bars} BARS
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stark White Playhead Cursor */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_10px_#ffffff] pointer-events-none transition-all duration-75"
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full -ml-1 -mt-1 shadow" />
          </div>
        </div>
      </div>

      {/* Stem Instrument Matrix */}
      <div className="flex flex-col gap-2 pt-2 border-t border-mono-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-mono-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-mono-300" />
            INSTRUMENT PRESENCE PER SECTION (TAP TO TOGGLE STEMS)
          </span>
          <span className="text-mono-500">REAL-TIME TIMED SEQUENCING</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {sections.map((sec) => {
            const isCurrent = currentSection?.id === sec.id;
            return (
              <div
                key={sec.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-mono-900 border-white shadow-md'
                    : 'bg-mono-950 border-mono-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {sec.name}
                  </span>
                  <span className="text-[9px] font-mono text-mono-500 uppercase">
                    {sec.bars} BARS
                  </span>
                </div>

                {/* Instrument Stems Toggles */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
                  {(['drums', 'bass', 'chords', 'lead', 'riserFx', 'vocals'] as const).map(
                    (instKey) => {
                      const isActive = sec.activeInstruments[instKey];
                      return (
                        <button
                          key={instKey}
                          onClick={() => {
                            audio.playClick('tick');
                            onToggleSectionInstrument?.(sec.id, instKey);
                          }}
                          className={`py-1 px-1.5 rounded uppercase flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'bg-mono-900 text-mono-500 hover:text-mono-300 border border-mono-800'
                          }`}
                        >
                          <span className="truncate">{instKey}</span>
                          {isActive ? (
                            <Volume2 className="w-2.5 h-2.5 text-black shrink-0" />
                          ) : (
                            <VolumeX className="w-2.5 h-2.5 text-mono-600 shrink-0" />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
