// MIDI Note utilities and Music Theory helpers

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 60; // Default C4
  const note = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

export const SCALES: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
  major: [0, 2, 4, 5, 7, 9, 11], // Major
  dorian: [0, 2, 3, 5, 7, 9, 10], // Dorian (Synthwave vibe)
  phrygian: [0, 1, 3, 5, 7, 8, 10], // Phrygian (Dark/Cyberpunk/Trap vibe)
  pentatonic_minor: [0, 3, 5, 7, 10], // Blues/Rock/Trap
  pentatonic_major: [0, 2, 4, 7, 9], // Bright pop
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // Cinematic/Neoclassical
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getScaleMidiNotes(rootNoteName: string, scaleName: string, startOctave = 2, octavesCount = 4): number[] {
  const rootIndex = NOTE_NAMES.indexOf(rootNoteName.toUpperCase());
  const intervals = SCALES[scaleName] || SCALES.minor;
  const result: number[] = [];

  for (let oct = startOctave; oct < startOctave + octavesCount; oct++) {
    const baseMidi = (oct + 1) * 12 + (rootIndex >= 0 ? rootIndex : 0);
    for (const interval of intervals) {
      const note = baseMidi + interval;
      if (note <= 108) {
        result.push(note);
      }
    }
  }

  return result;
}
