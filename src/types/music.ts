export type DrumSound = 'kick' | 'snare' | 'hihatClosed' | 'hihatOpen' | 'clap' | 'tom';

export interface NoteEvent {
  note: number; // MIDI note number (e.g. 60 = C4)
  step: number; // 0 to 31
  duration: number; // in steps (e.g. 1, 2, 4)
  velocity: number; // 0.1 to 1.0
}

export interface ChordEvent {
  name: string;
  notes: number[]; // MIDI note numbers
  step: number;
  duration: number;
}

export interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  hihatClosed: boolean[];
  hihatOpen: boolean[];
  clap: boolean[];
  tom: boolean[];
}

export type SectionType = 'intro' | 'verse' | 'rising_build' | 'drop' | 'break' | 'outro';

export interface SongSection {
  id: string;
  name: string;
  type: SectionType;
  bars: number; // e.g. 4, 8
  energy: number; // 1 to 10
  hasRisingSweep?: boolean; // Riser build-up effect
  hasDropHit?: boolean; // Heavy 808 sub impact hit
  hasSnareRoll?: boolean; // Accelerating snare roll before drop
  activeInstruments: {
    drums: boolean;
    bass: boolean;
    chords: boolean;
    lead: boolean;
    riserFx: boolean;
    vocals: boolean;
  };
  lyricsLines: string[];
}

export interface TimedLyric {
  id: string;
  line: string;
  sectionId: string;
  startTimeSec: number;
  durationSec: number;
}

export type BassSynthType = 'sub808' | 'synthwave' | 'acid' | 'pluck';
export type LeadSynthType = 'saw' | 'square' | 'fm' | 'plucked';
export type ChordSynthType = 'pad' | 'supersaw' | 'electric_piano' | 'strings';

export interface SynthSettings {
  bassType: BassSynthType;
  leadType: LeadSynthType;
  chordType: ChordSynthType;
  filterCutoff: number; // Hz, e.g. 2000
  resonance: number; // Q factor, e.g. 4
  reverbDecay: number; // seconds, e.g. 2.0
  delayTime: number; // seconds, e.g. 0.25
  distortion: number; // 0.0 to 1.0
}

export interface MixerTrack {
  id: string;
  name: string;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 to 1.0
  muted: boolean;
  solo: boolean;
  color: string;
}

export interface SongComposition {
  id: string;
  title: string;
  genre: string;
  mood: string;
  tempo: number; // BPM (60 - 200)
  key: string;
  scaleType: string;
  energy: number; // 1-10
  description?: string;
  stepsCount: number; // pattern resolution per 2 bars (32 steps)
  drums: DrumPattern;
  bass: NoteEvent[];
  chords: ChordEvent[];
  lead: NoteEvent[];
  synthSettings: SynthSettings;
  sections: SongSection[];
  timedLyrics: TimedLyric[];
  fullDurationSec: number; // Full song length in seconds (e.g. 120s - 180s)
  primaryDropTimeSec: number; // Timestamp of the main rising drop impact
  hitTimingsSec: number[]; // Array of drop/hit impact timestamps
  lyricsHook?: string;
  vocalAudioBase64?: string; // from AI TTS
  createdAt?: number;
}

export interface GenrePreset {
  id: string;
  name: string;
  defaultBpm: number;
  scale: string;
  description: string;
  tag: string;
  badgeColor: string;
}
