import {
  SongComposition,
  DrumPattern,
  NoteEvent,
  ChordEvent,
  GenrePreset,
  SongSection,
  TimedLyric,
} from '../types/music';

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'synthwave',
    name: 'Synthwave / Retrowave',
    defaultBpm: 114,
    scale: 'dorian',
    description: 'Nostalgic 80s analog synthesizers, driving 808 bassline, rising drop, and neon arpeggios.',
    tag: 'RETRO',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk / Dark Electro',
    defaultBpm: 128,
    scale: 'phrygian',
    description: 'Aggressive distorted acid bass, industrial punchy rhythm, riser sweeps, and massive impact drops.',
    tag: 'CYBER',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'trap',
    name: '808 Trap / Hip-Hop',
    defaultBpm: 140,
    scale: 'phrygian',
    description: 'Hard-hitting 808 sub bass, rapid rolling hi-hats, sharp claps, and explosive drop hits.',
    tag: 'BEATS',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chillhop',
    defaultBpm: 82,
    scale: 'minor',
    description: 'Mellow electric piano chords, vinyl warmth, lazy swing drums, and deep gentle sub-bass.',
    tag: 'CHILL',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'house',
    name: 'Future House / Club',
    defaultBpm: 126,
    scale: 'minor',
    description: 'Four-on-the-floor thumping kick, build-up riser sweeps, bouncy bassline, and massive energy drops.',
    tag: 'CLUB',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'ambient',
    name: 'Ambient Dreamscape',
    defaultBpm: 70,
    scale: 'major',
    description: 'Ethereal evolving pad layers, spatial reverberation, and gentle pulsing melodic motifs.',
    tag: 'MEDITATION',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'chiptune',
    name: '8-Bit Arcade Chiptune',
    defaultBpm: 148,
    scale: 'pentatonic_minor',
    description: 'Classic gaming sound chip emulator, high-speed pulse arpeggios, and crunch noise percussion.',
    tag: 'ARCADE',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'neosoul',
    name: 'Neo-Soul & Funk',
    defaultBpm: 92,
    scale: 'dorian',
    description: 'Rich jazz-extended chords, syncopated funk pocket bassline, and warm Rhodes piano feel.',
    tag: 'GROOVE',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'rock',
    name: 'Alternative / Hard Rock',
    defaultBpm: 134,
    scale: 'minor',
    description: 'Punchy acoustic rock drums, overdrive bass riffs, power chord progressions, and soaring leads.',
    tag: 'ROCK',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
  {
    id: 'techno',
    name: 'Peak Time Techno',
    defaultBpm: 132,
    scale: 'phrygian',
    description: 'Relentless driving kick, hypnotic acid 303 sequences, metallic percussion, and tense riser builds.',
    tag: 'TECHNO',
    badgeColor: 'border-mono-700 text-mono-200 bg-mono-900',
  },
];

export function createEmptyDrums(steps = 32): DrumPattern {
  return {
    kick: new Array(steps).fill(false),
    snare: new Array(steps).fill(false),
    hihatClosed: new Array(steps).fill(false),
    hihatOpen: new Array(steps).fill(false),
    clap: new Array(steps).fill(false),
    tom: new Array(steps).fill(false),
  };
}

export function detectGenreFromPrompt(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('trap') || p.includes('hiphop') || p.includes('hip-hop') || p.includes('rap') || p.includes('drill') || p.includes('808')) return 'trap';
  if (p.includes('cyber') || p.includes('dystop') || p.includes('industrial') || p.includes('dark electro')) return 'cyberpunk';
  if (p.includes('lofi') || p.includes('lo-fi') || p.includes('chill') || p.includes('study') || p.includes('sleep') || p.includes('mellow')) return 'lofi';
  if (p.includes('house') || p.includes('dance') || p.includes('edm') || p.includes('club') || p.includes('disco')) return 'house';
  if (p.includes('ambient') || p.includes('calm') || p.includes('meditat') || p.includes('space') || p.includes('relax') || p.includes('peaceful')) return 'ambient';
  if (p.includes('chiptune') || p.includes('8bit') || p.includes('8-bit') || p.includes('arcade') || p.includes('game') || p.includes('pixel')) return 'chiptune';
  if (p.includes('soul') || p.includes('funk') || p.includes('jazz') || p.includes('r&b') || p.includes('rhodes') || p.includes('groove')) return 'neosoul';
  if (p.includes('rock') || p.includes('metal') || p.includes('guitar') || p.includes('punk') || p.includes('heavy')) return 'rock';
  if (p.includes('techno') || p.includes('acid') || p.includes('rave') || p.includes('berlin')) return 'techno';
  if (p.includes('synth') || p.includes('retro') || p.includes('wave') || p.includes('80s') || p.includes('analog')) return 'synthwave';
  return 'synthwave';
}

export function generateProceduralSong(
  genreId = 'synthwave',
  customTitle?: string,
  userLyrics?: string,
  seed?: number
): SongComposition {
  const stepsCount = 32;
  const drums = createEmptyDrums(stepsCount);
  const bass: NoteEvent[] = [];
  const chords: ChordEvent[] = [];
  const lead: NoteEvent[] = [];

  // Deterministic or time-based variation seed
  const varSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000);
  const variationIndex = varSeed % 3;

  let title = customTitle || '';
  let tempo = 120;
  let key = 'A Minor';
  let scaleType = 'minor';
  let energy = 8;
  let description = '';

  let bassType: SongComposition['synthSettings']['bassType'] = 'synthwave';
  let leadType: SongComposition['synthSettings']['leadType'] = 'saw';
  let chordType: SongComposition['synthSettings']['chordType'] = 'supersaw';
  let filterCutoff = 3200;
  let resonance = 4;
  let reverbDecay = 2.2;
  let delayTime = 0.25;

  let lyrics1 = 'Lost in the midnight rain, neon lights guide my way';
  let lyrics2 = 'Chasing the digital sun, the night has just begun';
  let dropHook = '1, 2, 3, DROP THE BASS! Can you feel the rush?';
  let lyrics3 = 'Shadows fading in the rear view, skies of electric blue';
  let climaxHook = 'WE REACH THE HORIZON! The rhythm takes control!';

  if (userLyrics && userLyrics.trim().length > 0) {
    const lines = userLyrics.split('\n').filter((l) => l.trim().length > 0);
    if (lines[0]) lyrics1 = lines[0];
    if (lines[1]) lyrics2 = lines[1];
    if (lines[2]) dropHook = lines[2];
    if (lines[3]) lyrics3 = lines[3];
    if (lines[4]) climaxHook = lines[4];
  }

  switch (genreId) {
    case 'synthwave': {
      title = title || (variationIndex === 0 ? 'Neon Horizon Overdrive' : variationIndex === 1 ? 'Midnight Velocity' : 'Sunset Boulevard 1984');
      tempo = variationIndex === 0 ? 114 : variationIndex === 1 ? 118 : 110;
      key = variationIndex === 0 ? 'A Minor' : variationIndex === 1 ? 'D Minor' : 'F# Minor';
      scaleType = 'dorian';
      energy = 8;
      description = '80s analog synthesizer anthem with driving bassline, rising drop tension, and soaring saw leads.';
      bassType = 'synthwave';
      leadType = 'saw';
      chordType = 'supersaw';
      filterCutoff = 3400;

      for (let s = 0; s < stepsCount; s++) {
        if (s % 4 === 0) drums.kick[s] = true;
        if (s % 8 === 4) drums.snare[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
        if (s === 14 || s === 30) drums.hihatOpen[s] = true;
        if (s === 30 || s === 31) drums.tom[s] = true;
      }

      if (variationIndex === 0) {
        chords.push(
          { name: 'Am', notes: [57, 60, 64], step: 0, duration: 8 },
          { name: 'F', notes: [53, 57, 60], step: 8, duration: 8 },
          { name: 'C', notes: [48, 52, 55], step: 16, duration: 8 },
          { name: 'G', notes: [55, 59, 62], step: 24, duration: 8 }
        );
        for (let s = 0; s < stepsCount; s += 2) {
          const root = s < 8 ? 33 : s < 16 ? 29 : s < 24 ? 36 : 31;
          const note = s % 4 === 2 ? root + 12 : root;
          bass.push({ note, step: s, duration: 2, velocity: 0.85 });
        }
        lead.push(
          { note: 69, step: 0, duration: 3, velocity: 0.9 },
          { note: 72, step: 4, duration: 3, velocity: 0.85 },
          { note: 71, step: 8, duration: 4, velocity: 0.9 },
          { note: 67, step: 12, duration: 3, velocity: 0.8 },
          { note: 64, step: 16, duration: 4, velocity: 0.9 },
          { note: 67, step: 20, duration: 2, velocity: 0.85 },
          { note: 69, step: 24, duration: 6, velocity: 0.95 }
        );
      } else {
        chords.push(
          { name: 'Dm', notes: [50, 53, 57], step: 0, duration: 8 },
          { name: 'Bb', notes: [46, 50, 53], step: 8, duration: 8 },
          { name: 'F', notes: [53, 57, 60], step: 16, duration: 8 },
          { name: 'C', notes: [48, 52, 55], step: 24, duration: 8 }
        );
        for (let s = 0; s < stepsCount; s += 2) {
          const root = s < 8 ? 26 : s < 16 ? 34 : s < 24 ? 29 : 24;
          const note = s % 4 === 2 ? root + 12 : root;
          bass.push({ note, step: s, duration: 2, velocity: 0.85 });
        }
        lead.push(
          { note: 62, step: 0, duration: 4, velocity: 0.9 },
          { note: 65, step: 4, duration: 2, velocity: 0.85 },
          { note: 67, step: 8, duration: 4, velocity: 0.9 },
          { note: 65, step: 14, duration: 2, velocity: 0.8 },
          { note: 69, step: 16, duration: 6, velocity: 0.95 },
          { note: 67, step: 24, duration: 6, velocity: 0.85 }
        );
      }
      break;
    }

    case 'cyberpunk': {
      title = title || (variationIndex === 0 ? 'Cyber District 9' : variationIndex === 1 ? 'Neural Overload' : 'Chrome Infiltration');
      tempo = 128;
      key = 'D Phrygian';
      scaleType = 'phrygian';
      energy = 9;
      description = 'Dystopian industrial acid bass banger with escalating riser tension and ferocious drop impact.';
      bassType = 'acid';
      leadType = 'fm';
      chordType = 'pad';
      filterCutoff = 4200;
      resonance = 7;

      for (let s = 0; s < stepsCount; s++) {
        if (s === 0 || s === 6 || s === 16 || s === 22) drums.kick[s] = true;
        if (s === 4 || s === 12 || s === 20 || s === 28) drums.snare[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
        if (s % 4 === 2) drums.hihatOpen[s] = true;
        if (s === 14 || s === 30) drums.clap[s] = true;
      }

      chords.push(
        { name: 'Dm', notes: [50, 53, 57], step: 0, duration: 8 },
        { name: 'Eb', notes: [51, 55, 58], step: 8, duration: 8 },
        { name: 'Gm', notes: [55, 58, 62], step: 16, duration: 8 },
        { name: 'Dm', notes: [50, 53, 57], step: 24, duration: 8 }
      );

      for (let s = 0; s < stepsCount; s += 2) {
        let n = s >= 8 && s < 16 ? 27 : s >= 16 && s < 24 ? 31 : 26;
        if (s % 4 === 2) n += 12;
        bass.push({ note: n, step: s, duration: 2, velocity: 0.9 });
      }

      lead.push(
        { note: 62, step: 0, duration: 2, velocity: 0.9 },
        { note: 65, step: 4, duration: 4, velocity: 0.95 },
        { note: 63, step: 8, duration: 2, velocity: 0.85 },
        { note: 62, step: 10, duration: 4, velocity: 0.9 },
        { note: 74, step: 16, duration: 4, velocity: 0.9 },
        { note: 75, step: 20, duration: 4, velocity: 0.9 }
      );
      break;
    }

    case 'trap': {
      title = title || (variationIndex === 0 ? 'Dark Syndicate 808' : variationIndex === 1 ? 'Phantom Vault' : 'No Mercy');
      tempo = 140;
      key = 'C# Minor';
      scaleType = 'phrygian';
      energy = 9;
      description = 'Hard-hitting 808 sub slides, rolling hi-hats, sharp claps, and dark atmospheric chords.';
      bassType = 'sub808';
      leadType = 'fm';
      chordType = 'pad';
      filterCutoff = 3800;

      drums.kick[0] = true;
      drums.kick[6] = true;
      drums.kick[16] = true;
      drums.kick[20] = true;
      drums.kick[28] = true;
      drums.clap[8] = true;
      drums.clap[24] = true;
      drums.snare[8] = true;
      drums.snare[24] = true;
      for (let s = 0; s < stepsCount; s++) drums.hihatClosed[s] = true;
      drums.hihatOpen[4] = true;
      drums.hihatOpen[20] = true;

      chords.push(
        { name: 'C#m', notes: [49, 52, 56], step: 0, duration: 16 },
        { name: 'A', notes: [45, 49, 52], step: 16, duration: 16 }
      );

      bass.push(
        { note: 25, step: 0, duration: 5, velocity: 1.0 },
        { note: 25, step: 6, duration: 2, velocity: 0.95 },
        { note: 28, step: 16, duration: 3, velocity: 1.0 },
        { note: 27, step: 20, duration: 4, velocity: 0.9 }
      );

      lead.push(
        { note: 61, step: 0, duration: 2, velocity: 0.85 },
        { note: 64, step: 3, duration: 2, velocity: 0.85 },
        { note: 68, step: 6, duration: 3, velocity: 0.9 },
        { note: 73, step: 16, duration: 4, velocity: 0.95 }
      );
      break;
    }

    case 'lofi': {
      title = title || (variationIndex === 0 ? 'Coffee & Raindrops' : variationIndex === 1 ? 'Midnight Study Session' : 'Vinyl Memories');
      tempo = 82;
      key = 'C Major';
      scaleType = 'major';
      energy = 6;
      description = 'Warm electric piano jazz chords, laid-back boom-bap rhythm, and relaxing melody.';
      bassType = 'sub808';
      leadType = 'plucked';
      chordType = 'electric_piano';
      filterCutoff = 2200;

      drums.kick[0] = true;
      drums.kick[10] = true;
      drums.kick[16] = true;
      drums.snare[8] = true;
      drums.snare[24] = true;
      for (let s = 0; s < stepsCount; s += 2) drums.hihatClosed[s] = true;
      drums.hihatOpen[6] = true;
      drums.hihatOpen[22] = true;

      chords.push(
        { name: 'Dm9', notes: [50, 53, 57, 60, 64], step: 0, duration: 8 },
        { name: 'G13', notes: [47, 53, 57, 59, 64], step: 8, duration: 8 },
        { name: 'Cmaj7', notes: [48, 52, 55, 59], step: 16, duration: 8 },
        { name: 'Am7', notes: [45, 52, 55, 60], step: 24, duration: 8 }
      );

      bass.push(
        { note: 38, step: 0, duration: 6, velocity: 0.8 },
        { note: 35, step: 8, duration: 6, velocity: 0.8 },
        { note: 36, step: 16, duration: 6, velocity: 0.85 },
        { note: 33, step: 24, duration: 6, velocity: 0.8 }
      );

      lead.push(
        { note: 64, step: 2, duration: 2, velocity: 0.7 },
        { note: 67, step: 4, duration: 3, velocity: 0.75 },
        { note: 71, step: 10, duration: 4, velocity: 0.8 },
        { note: 72, step: 20, duration: 4, velocity: 0.75 }
      );
      break;
    }

    case 'house': {
      title = title || (variationIndex === 0 ? 'Ibiza Sunburst' : variationIndex === 1 ? 'Underground Groove' : 'Deep Echoes');
      tempo = 126;
      key = 'F Minor';
      scaleType = 'minor';
      energy = 9;
      description = 'Four-on-the-floor driving kick, offbeat open hats, bouncy bass, and euphoric piano stabs.';
      bassType = 'pluck';
      leadType = 'saw';
      chordType = 'electric_piano';
      filterCutoff = 3600;

      for (let s = 0; s < stepsCount; s++) {
        if (s % 4 === 0) drums.kick[s] = true;
        if (s % 8 === 4) drums.clap[s] = true;
        if (s % 4 === 2) drums.hihatOpen[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
      }

      chords.push(
        { name: 'Fm', notes: [53, 56, 60], step: 0, duration: 4 },
        { name: 'Ab', notes: [56, 60, 63], step: 8, duration: 4 },
        { name: 'Eb', notes: [51, 55, 58], step: 16, duration: 4 },
        { name: 'Db', notes: [49, 53, 56], step: 24, duration: 4 }
      );

      for (let s = 0; s < stepsCount; s += 2) {
        const root = s < 8 ? 29 : s < 16 ? 32 : s < 24 ? 27 : 25;
        const note = s % 4 === 2 ? root + 12 : root;
        bass.push({ note, step: s, duration: 1, velocity: 0.9 });
      }

      lead.push(
        { note: 65, step: 2, duration: 2, velocity: 0.85 },
        { note: 68, step: 6, duration: 2, velocity: 0.85 },
        { note: 70, step: 10, duration: 3, velocity: 0.9 },
        { note: 72, step: 18, duration: 4, velocity: 0.95 }
      );
      break;
    }

    case 'ambient': {
      title = title || (variationIndex === 0 ? 'Celestial Aurora' : variationIndex === 1 ? 'Cosmic Horizon' : 'Deep Space Drift');
      tempo = 70;
      key = 'E Major';
      scaleType = 'major';
      energy = 5;
      description = 'Ethereal evolving pad layers, spatial reverberation, and gentle pulsing melodic motifs.';
      bassType = 'sub808';
      leadType = 'plucked';
      chordType = 'pad';
      filterCutoff = 1800;

      // Gentle sparse percussion
      drums.kick[0] = true;
      drums.kick[16] = true;
      drums.hihatOpen[8] = true;
      drums.hihatOpen[24] = true;

      chords.push(
        { name: 'Emaj9', notes: [52, 56, 59, 63, 66], step: 0, duration: 16 },
        { name: 'Amaj7', notes: [45, 52, 56, 57, 64], step: 16, duration: 16 }
      );

      bass.push(
        { note: 28, step: 0, duration: 14, velocity: 0.75 },
        { note: 33, step: 16, duration: 14, velocity: 0.75 }
      );

      lead.push(
        { note: 64, step: 4, duration: 6, velocity: 0.7 },
        { note: 71, step: 12, duration: 6, velocity: 0.75 },
        { note: 68, step: 20, duration: 8, velocity: 0.7 }
      );
      break;
    }

    case 'chiptune': {
      title = title || (variationIndex === 0 ? 'Super Pixel Quest' : variationIndex === 1 ? 'Boss Battle 8-Bit' : 'Level 99 Warp');
      tempo = 148;
      key = 'A Minor';
      scaleType = 'pentatonic_minor';
      energy = 9;
      description = 'Fast 8-bit retro gaming pulse arpeggios, triangle bass, and crunchy percussion.';
      bassType = 'sub808';
      leadType = 'square';
      chordType = 'supersaw';
      filterCutoff = 4800;

      for (let s = 0; s < stepsCount; s++) {
        if (s % 8 === 0) drums.kick[s] = true;
        if (s % 8 === 4) drums.snare[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
      }

      chords.push(
        { name: 'Am', notes: [57, 60, 64], step: 0, duration: 8 },
        { name: 'C', notes: [48, 52, 55], step: 8, duration: 8 },
        { name: 'D', notes: [50, 54, 57], step: 16, duration: 8 },
        { name: 'F', notes: [53, 57, 60], step: 24, duration: 8 }
      );

      for (let s = 0; s < stepsCount; s += 2) {
        const root = s < 8 ? 33 : s < 16 ? 36 : s < 24 ? 38 : 41;
        bass.push({ note: root, step: s, duration: 2, velocity: 0.9 });
      }

      // Fast arpeggiated lead sequence
      const arpNotes = [69, 72, 76, 81, 76, 72];
      for (let s = 0; s < stepsCount; s++) {
        lead.push({
          note: arpNotes[s % arpNotes.length],
          step: s,
          duration: 1,
          velocity: 0.85,
        });
      }
      break;
    }

    case 'neosoul': {
      title = title || (variationIndex === 0 ? 'Silk & Velvet' : variationIndex === 1 ? 'Golden Hour Groove' : 'Midnight Rhodes');
      tempo = 92;
      key = 'E Minor';
      scaleType = 'dorian';
      energy = 7;
      description = 'Syncopated funk bass pocket, rich 9th chords, smooth electric piano, and vocal pocket.';
      bassType = 'pluck';
      leadType = 'plucked';
      chordType = 'electric_piano';
      filterCutoff = 2600;

      drums.kick[0] = true;
      drums.kick[6] = true;
      drums.kick[16] = true;
      drums.kick[22] = true;
      drums.snare[8] = true;
      drums.snare[24] = true;
      drums.clap[24] = true;
      for (let s = 0; s < stepsCount; s += 2) drums.hihatClosed[s] = true;
      drums.hihatOpen[4] = true;
      drums.hihatOpen[20] = true;

      chords.push(
        { name: 'Em9', notes: [52, 55, 59, 62, 66], step: 0, duration: 8 },
        { name: 'A13', notes: [45, 52, 55, 57, 62, 66], step: 8, duration: 8 },
        { name: 'Cmaj9', notes: [48, 52, 55, 59, 62], step: 16, duration: 8 },
        { name: 'B7alt', notes: [47, 53, 57, 61], step: 24, duration: 8 }
      );

      bass.push(
        { note: 28, step: 0, duration: 3, velocity: 0.9 },
        { note: 35, step: 4, duration: 2, velocity: 0.85 },
        { note: 33, step: 8, duration: 4, velocity: 0.9 },
        { note: 36, step: 16, duration: 3, velocity: 0.9 },
        { note: 35, step: 24, duration: 4, velocity: 0.9 }
      );

      lead.push(
        { note: 67, step: 2, duration: 3, velocity: 0.8 },
        { note: 71, step: 6, duration: 2, velocity: 0.85 },
        { note: 74, step: 10, duration: 4, velocity: 0.9 },
        { note: 71, step: 18, duration: 4, velocity: 0.85 }
      );
      break;
    }

    case 'rock': {
      title = title || (variationIndex === 0 ? 'Thunder Road' : variationIndex === 1 ? 'Adrenaline Rush' : 'Electric Riot');
      tempo = 134;
      key = 'E Minor';
      scaleType = 'minor';
      energy = 9;
      description = 'Driving rock rhythm, aggressive bass drive, power chords, and searing melodic lead.';
      bassType = 'acid';
      leadType = 'saw';
      chordType = 'supersaw';
      filterCutoff = 4200;

      for (let s = 0; s < stepsCount; s++) {
        if (s % 8 === 0 || s % 8 === 6) drums.kick[s] = true;
        if (s % 8 === 4) drums.snare[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
        if (s === 14 || s === 30) drums.hihatOpen[s] = true;
      }

      chords.push(
        { name: 'E5', notes: [40, 47, 52], step: 0, duration: 8 },
        { name: 'G5', notes: [43, 50, 55], step: 8, duration: 8 },
        { name: 'A5', notes: [45, 52, 57], step: 16, duration: 8 },
        { name: 'C5', notes: [48, 55, 60], step: 24, duration: 8 }
      );

      for (let s = 0; s < stepsCount; s += 2) {
        const root = s < 8 ? 28 : s < 16 ? 31 : s < 24 ? 33 : 36;
        bass.push({ note: root, step: s, duration: 2, velocity: 0.9 });
      }

      lead.push(
        { note: 64, step: 0, duration: 4, velocity: 0.9 },
        { note: 67, step: 4, duration: 2, velocity: 0.85 },
        { note: 69, step: 8, duration: 4, velocity: 0.95 },
        { note: 71, step: 16, duration: 6, velocity: 1.0 },
        { note: 69, step: 24, duration: 4, velocity: 0.9 }
      );
      break;
    }

    case 'techno':
    default: {
      title = title || (variationIndex === 0 ? 'Subterranean Pulse' : variationIndex === 1 ? 'Industrial Acid' : 'Dark Matter');
      tempo = 132;
      key = 'F# Minor';
      scaleType = 'phrygian';
      energy = 9;
      description = 'Hypnotic acid 303 sequence, relentless driving industrial kick, and dark atmosphere.';
      bassType = 'acid';
      leadType = 'fm';
      chordType = 'pad';
      filterCutoff = 3800;

      for (let s = 0; s < stepsCount; s++) {
        if (s % 4 === 0) drums.kick[s] = true;
        if (s % 8 === 4) drums.clap[s] = true;
        if (s % 4 === 2) drums.hihatOpen[s] = true;
        if (s % 2 === 0) drums.hihatClosed[s] = true;
      }

      chords.push(
        { name: 'F#m', notes: [54, 57, 61], step: 0, duration: 16 },
        { name: 'G', notes: [55, 59, 62], step: 16, duration: 16 }
      );

      for (let s = 0; s < stepsCount; s += 2) {
        const root = s < 16 ? 30 : 31;
        const note = s % 4 === 2 ? root + 12 : root;
        bass.push({ note, step: s, duration: 2, velocity: 0.92 });
      }

      lead.push(
        { note: 66, step: 2, duration: 2, velocity: 0.85 },
        { note: 67, step: 6, duration: 2, velocity: 0.85 },
        { note: 71, step: 10, duration: 4, velocity: 0.9 },
        { note: 73, step: 18, duration: 4, velocity: 0.95 }
      );
      break;
    }
  }

  // -------------------------------------------------------------
  // FULL MULTI-SECTION SONG STRUCTURE (8 SECTIONS, ~2-3 MINS)
  // -------------------------------------------------------------
  const sections: SongSection[] = [
    {
      id: 'sec_intro',
      name: 'Intro',
      type: 'intro',
      bars: 4,
      energy: 4,
      hasRisingSweep: false,
      hasDropHit: false,
      hasSnareRoll: false,
      activeInstruments: {
        drums: false,
        bass: false,
        chords: true,
        lead: true,
        riserFx: false,
        vocals: false,
      },
      lyricsLines: ['(Ambient intro melody)'],
    },
    {
      id: 'sec_verse1',
      name: 'Verse 1',
      type: 'verse',
      bars: 8,
      energy: 6,
      hasRisingSweep: false,
      hasDropHit: false,
      hasSnareRoll: false,
      activeInstruments: {
        drums: true,
        bass: true,
        chords: true,
        lead: false,
        riserFx: false,
        vocals: true,
      },
      lyricsLines: [lyrics1, lyrics2],
    },
    {
      id: 'sec_build1',
      name: 'Rising Build-Up',
      type: 'rising_build',
      bars: 4,
      energy: 8,
      hasRisingSweep: true,
      hasDropHit: false,
      hasSnareRoll: true,
      activeInstruments: {
        drums: true,
        bass: false,
        chords: true,
        lead: true,
        riserFx: true,
        vocals: true,
      },
      lyricsLines: ['Feel the tension rise, get ready for the drop!'],
    },
    {
      id: 'sec_drop1',
      name: 'THE DROP / Chorus',
      type: 'drop',
      bars: 8,
      energy: 10,
      hasRisingSweep: false,
      hasDropHit: true,
      hasSnareRoll: false,
      activeInstruments: {
        drums: true,
        bass: true,
        chords: true,
        lead: true,
        riserFx: false,
        vocals: true,
      },
      lyricsLines: [dropHook, 'All night long, the energy is electric!'],
    },
    {
      id: 'sec_verse2',
      name: 'Verse 2 / Break',
      type: 'verse',
      bars: 8,
      energy: 6,
      hasRisingSweep: false,
      hasDropHit: false,
      hasSnareRoll: false,
      activeInstruments: {
        drums: true,
        bass: true,
        chords: true,
        lead: false,
        riserFx: false,
        vocals: true,
      },
      lyricsLines: [lyrics3, 'Memories echoing across the endless soundscape'],
    },
    {
      id: 'sec_build2',
      name: 'Final Build-Up',
      type: 'rising_build',
      bars: 4,
      energy: 9,
      hasRisingSweep: true,
      hasDropHit: false,
      hasSnareRoll: true,
      activeInstruments: {
        drums: true,
        bass: false,
        chords: true,
        lead: true,
        riserFx: true,
        vocals: true,
      },
      lyricsLines: ['One last breath before the sound explodes!'],
    },
    {
      id: 'sec_drop2',
      name: 'CLIMAX DROP',
      type: 'drop',
      bars: 8,
      energy: 10,
      hasRisingSweep: false,
      hasDropHit: true,
      hasSnareRoll: false,
      activeInstruments: {
        drums: true,
        bass: true,
        chords: true,
        lead: true,
        riserFx: false,
        vocals: true,
      },
      lyricsLines: [climaxHook, 'Maximum power! Never fade away!'],
    },
    {
      id: 'sec_outro',
      name: 'Outro',
      type: 'outro',
      bars: 4,
      energy: 4,
      hasRisingSweep: false,
      hasDropHit: false,
      hasSnareRoll: false,
      activeInstruments: {
        drums: false,
        bass: false,
        chords: true,
        lead: true,
        riserFx: false,
        vocals: false,
      },
      lyricsLines: ['(Smooth melodic fadeout)'],
    },
  ];

  // Calculate section durations & timing
  let totalDurationSec = 0;
  let primaryDropTimeSec = 0;
  const hitTimingsSec: number[] = [];

  sections.forEach((sec) => {
    const sDur = (sec.bars * 4 * 60) / tempo;
    if (sec.hasDropHit) {
      hitTimingsSec.push(Math.round(totalDurationSec));
      if (!primaryDropTimeSec) {
        primaryDropTimeSec = Math.round(totalDurationSec);
      }
    }
    totalDurationSec += sDur;
  });

  // Calculate synchronized lyrics timestamps
  const timedLyrics: TimedLyric[] = [];
  let tAccum = 0;
  sections.forEach((sec) => {
    const sDur = (sec.bars * 4 * 60) / tempo;
    if (sec.lyricsLines && sec.lyricsLines.length > 0) {
      const lineDur = sDur / sec.lyricsLines.length;
      sec.lyricsLines.forEach((line, idx) => {
        timedLyrics.push({
          id: `ly_${sec.id}_${idx}`,
          sectionId: sec.id,
          line,
          startTimeSec: Math.round(tAccum + idx * lineDur),
          durationSec: Math.round(lineDur),
        });
      });
    }
    tAccum += sDur;
  });

  return {
    id: `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    genre: genreId,
    mood: energy >= 8 ? 'High Energy & Driving' : 'Relaxed & Melodic',
    tempo,
    key,
    scaleType,
    energy,
    description,
    stepsCount,
    drums,
    bass,
    chords,
    lead,
    synthSettings: {
      bassType,
      leadType,
      chordType,
      filterCutoff,
      resonance,
      reverbDecay,
      delayTime,
      distortion: energy > 8 ? 0.4 : 0.1,
    },
    sections,
    timedLyrics,
    fullDurationSec: Math.round(totalDurationSec),
    primaryDropTimeSec: primaryDropTimeSec || 32,
    hitTimingsSec: hitTimingsSec.length > 0 ? hitTimingsSec : [32, 80],
    lyricsHook: dropHook,
    createdAt: Date.now(),
  };
}
