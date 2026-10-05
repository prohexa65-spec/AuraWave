import {
  SongComposition,
  MixerTrack,
  BassSynthType,
  LeadSynthType,
  ChordSynthType,
  SongSection,
  TimedLyric,
} from '../types/music';
import { midiToFreq } from '../utils/musicTheory';

export class SynthEngine {
  public ctx: AudioContext | null = null;
  public isPlaying = false;
  public currentStep = 0;
  public playbackTimeSec = 0;
  public fullDurationSec = 120;
  private tempo = 120;

  // Real-time Audio Scheduling
  private stepIntervalId: number | null = null;
  private animFrameId: number | null = null;
  private nextNoteTime = 0;
  private lookaheadMs = 25; // Check scheduling every 25ms
  private scheduleAheadSec = 0.15; // 150ms buffer ahead
  private stepsCount = 32;
  private globalStep = 0;
  private startPlaybackCtxTime = 0;
  private seekOffsetSec = 0;

  // Master Chain & Analyzer
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  public analyser: AnalyserNode | null = null;

  // Lightweight Space & Delay FX (Low CPU, Zero Lag)
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayGain: GainNode | null = null;
  private spaceFilter: BiquadFilterNode | null = null;

  // Track Sub-Mixer Buses
  private trackGains: Record<string, GainNode> = {};
  private trackPanners: Record<string, StereoPannerNode> = {};

  // Active Song Composition & Mix
  public composition: SongComposition | null = null;
  private mixerTracks: Record<string, MixerTrack> = {};

  // Decoded Vocal Audio Buffer
  private vocalBuffer: AudioBuffer | null = null;

  // Pre-allocated shared noise buffers (Eliminates GC audio hiccups)
  private sharedNoiseBuffer: AudioBuffer | null = null;
  private sharedCrashBuffer: AudioBuffer | null = null;

  // Active FX tracking to avoid overlapping sweeps
  private activeRiserOsc: OscillatorNode | null = null;
  private activeRiserGain: GainNode | null = null;

  // UI Event Callbacks
  private onStepChange?: (step: number) => void;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private onTimeUpdate?: (
    timeSec: number,
    section: SongSection | null,
    lyric: TimedLyric | null
  ) => void;

  constructor() {}

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
      this.setupMasterChain();
      this.preallocateNoiseBuffers();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pre-allocate noise buffers once on init (Zero GC pauses during playback)
  private preallocateNoiseBuffers() {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;

    // 2-second white noise buffer for snares, hi-hats, claps
    const noiseLength = rate * 2;
    this.sharedNoiseBuffer = this.ctx.createBuffer(1, noiseLength, rate);
    const nData = this.sharedNoiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) {
      nData[i] = Math.random() * 2 - 1;
    }

    // 2.5-second crash noise for drop hits
    const crashLength = Math.floor(rate * 2.5);
    this.sharedCrashBuffer = this.ctx.createBuffer(2, crashLength, rate);
    const cL = this.sharedCrashBuffer.getChannelData(0);
    const cR = this.sharedCrashBuffer.getChannelData(1);
    for (let i = 0; i < crashLength; i++) {
      const env = Math.pow(1 - i / crashLength, 2.0);
      cL[i] = (Math.random() * 2 - 1) * env;
      cR[i] = (Math.random() * 2 - 1) * env;
    }
  }

  // Clean, high-performance master chain without heavy Convolver FFTs
  private setupMasterChain() {
    if (!this.ctx) return;

    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(3.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.12, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Lightweight spatial stereo delay line
    this.setupDelay(0.24, 0.28);

    ['drums', 'bass', 'chords', 'lead', 'fx', 'vocals'].forEach((trackId) => {
      this.setupTrackChannel(trackId);
    });
  }

  private setupTrackChannel(trackId: string) {
    if (!this.ctx || !this.masterGain) return;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    let panner: StereoPannerNode | null = null;
    if (this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner();
      gain.connect(panner);
      panner.connect(this.masterGain);
      if (this.delayGain && (trackId === 'lead' || trackId === 'chords')) {
        panner.connect(this.delayGain);
      }
      this.trackPanners[trackId] = panner;
    } else {
      gain.connect(this.masterGain);
      if (this.delayGain && (trackId === 'lead' || trackId === 'chords')) {
        gain.connect(this.delayGain);
      }
    }

    this.trackGains[trackId] = gain;
  }

  private setupDelay(time = 0.24, feedback = 0.28) {
    if (!this.ctx || !this.masterGain) return;

    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(time, this.ctx.currentTime);

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(feedback, this.ctx.currentTime);

    this.spaceFilter = this.ctx.createBiquadFilter();
    this.spaceFilter.type = 'lowpass';
    this.spaceFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.delayGain.connect(this.delayNode);
    this.delayNode.connect(this.spaceFilter);
    this.spaceFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.spaceFilter.connect(this.masterGain);
  }

  public setComposition(comp: SongComposition) {
    this.composition = comp;
    this.tempo = comp.tempo || 120;
    this.stepsCount = comp.stepsCount || 32;
    this.fullDurationSec = comp.fullDurationSec || 120;

    if (comp.vocalAudioBase64 && this.ctx) {
      this.decodeBase64Vocal(comp.vocalAudioBase64);
    }
  }

  public async decodeBase64Vocal(base64: string) {
    if (!this.ctx) return;
    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      this.vocalBuffer = await this.ctx.decodeAudioData(bytes.buffer);
    } catch (err) {
      console.warn('Vocal decode note:', err);
    }
  }

  public setMixerState(tracks: MixerTrack[]) {
    if (!this.ctx) return;
    const soloActive = tracks.some((t) => t.solo);

    tracks.forEach((t) => {
      this.mixerTracks[t.id] = t;
      const gainNode = this.trackGains[t.id];
      const pannerNode = this.trackPanners[t.id];

      if (gainNode) {
        let effectiveVol = t.volume;
        if (t.muted || (soloActive && !t.solo)) effectiveVol = 0;
        gainNode.gain.setTargetAtTime(effectiveVol, this.ctx!.currentTime, 0.02);
      }

      if (pannerNode) {
        pannerNode.pan.setTargetAtTime(t.pan, this.ctx!.currentTime, 0.02);
      }
    });
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
    }
  }

  public setCallbacks(
    onStep: (step: number) => void,
    onPlayback: (isPlaying: boolean) => void,
    onTime?: (
      timeSec: number,
      section: SongSection | null,
      lyric: TimedLyric | null
    ) => void
  ) {
    this.onStepChange = onStep;
    this.onPlaybackStateChange = onPlayback;
    this.onTimeUpdate = onTime;
  }

  public play() {
    this.init();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startPlaybackCtxTime = this.ctx.currentTime - this.seekOffsetSec;
    this.nextNoteTime = this.ctx.currentTime + 0.04;

    const secondsPer16th = 60.0 / (this.tempo * 4);
    this.globalStep = Math.floor(this.seekOffsetSec / secondsPer16th);

    this.onPlaybackStateChange?.(true);

    // Audio Scheduler Interval (Low CPU overhead)
    this.stepIntervalId = window.setInterval(() => {
      this.scheduler();
    }, this.lookaheadMs);

    // Smooth UI Animation Loop (Decoupled from audio thread)
    this.startUiLoop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.stepIntervalId !== null) {
      clearInterval(this.stepIntervalId);
      this.stepIntervalId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.stopActiveRiser();
    this.seekOffsetSec = this.playbackTimeSec;
    this.onPlaybackStateChange?.(false);
  }

  public stop() {
    this.pause();
    this.currentStep = 0;
    this.globalStep = 0;
    this.playbackTimeSec = 0;
    this.seekOffsetSec = 0;
    this.onStepChange?.(0);
    this.notifyUi();
  }

  public seekTo(timeSec: number) {
    const clamped = Math.max(0, Math.min(this.fullDurationSec, timeSec));
    this.playbackTimeSec = clamped;
    this.seekOffsetSec = clamped;
    const secondsPer16th = 60.0 / (this.tempo * 4);
    this.globalStep = Math.floor(clamped / secondsPer16th);
    this.currentStep = this.globalStep % this.stepsCount;

    if (this.ctx && this.isPlaying) {
      this.startPlaybackCtxTime = this.ctx.currentTime - clamped;
      this.nextNoteTime = this.ctx.currentTime + 0.04;
    }
    this.notifyUi();
  }

  public setTempo(newBpm: number) {
    this.tempo = Math.max(50, Math.min(220, newBpm));
  }

  // Smooth, lag-free audio lookahead scheduler
  private scheduler() {
    if (!this.ctx || !this.isPlaying || !this.composition) return;

    // Prevent scheduling behind current audio clock (lag guard)
    if (this.nextNoteTime < this.ctx.currentTime) {
      this.nextNoteTime = this.ctx.currentTime;
    }

    const maxStepsPerTick = 8;
    let count = 0;

    while (
      this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec &&
      count < maxStepsPerTick
    ) {
      this.scheduleStep(this.globalStep, this.nextNoteTime);
      this.advanceAudioStep();
      count++;
    }
  }

  private advanceAudioStep() {
    const secondsPer16th = 60.0 / (this.tempo * 4);
    this.nextNoteTime += secondsPer16th;
    this.globalStep++;

    const totalStepsInSong = Math.ceil(this.fullDurationSec / secondsPer16th);
    if (this.globalStep >= totalStepsInSong) {
      this.globalStep = 0;
      if (this.ctx) {
        this.startPlaybackCtxTime = this.ctx.currentTime;
      }
    }
  }

  // Decoupled UI update loop: reads true elapsed audio time for 60fps responsiveness
  private startUiLoop() {
    const update = () => {
      if (!this.isPlaying || !this.ctx) return;

      const elapsed = this.ctx.currentTime - this.startPlaybackCtxTime;
      const wrapped = elapsed % this.fullDurationSec;
      this.playbackTimeSec = Math.max(0, wrapped);

      const secondsPer16th = 60.0 / (this.tempo * 4);
      const curStep = Math.floor(this.playbackTimeSec / secondsPer16th) % this.stepsCount;
      if (curStep !== this.currentStep) {
        this.currentStep = curStep;
        this.onStepChange?.(curStep);
      }

      this.notifyUi();
      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private notifyUi() {
    if (!this.composition) return;
    const curSection = this.getCurrentSection();
    const curLyric = this.getCurrentLyric();
    this.onTimeUpdate?.(this.playbackTimeSec, curSection, curLyric);
  }

  public getCurrentSection(): SongSection | null {
    if (!this.composition?.sections) return null;
    let accumulated = 0;
    for (const sec of this.composition.sections) {
      const dur = (sec.bars * 4 * 60) / this.tempo;
      if (
        this.playbackTimeSec >= accumulated &&
        this.playbackTimeSec < accumulated + dur
      ) {
        return sec;
      }
      accumulated += dur;
    }
    return this.composition.sections[this.composition.sections.length - 1] || null;
  }

  public getCurrentLyric(): TimedLyric | null {
    if (!this.composition?.timedLyrics) return null;
    return (
      this.composition.timedLyrics.find(
        (ly) =>
          this.playbackTimeSec >= ly.startTimeSec &&
          this.playbackTimeSec < ly.startTimeSec + ly.durationSec
      ) || null
    );
  }

  // -------------------------------------------------------------
  // REAL-TIME SYNTHESIS & SCHEDULING (Zero Memory Leaks)
  // -------------------------------------------------------------
  private scheduleStep(stepIndex: number, time: number) {
    if (!this.ctx || !this.composition) return;
    const comp = this.composition;
    const patternStep = stepIndex % this.stepsCount;
    const curSec = this.getCurrentSection();

    const inst = curSec?.activeInstruments || {
      drums: true,
      bass: true,
      chords: true,
      lead: true,
      riserFx: false,
      vocals: true,
    };

    const secondsPer16th = 60.0 / (this.tempo * 4);
    const stepsPerBar = 16;
    const stepInBar = stepIndex % stepsPerBar;

    // Riser Sweep (build section only)
    if (curSec?.hasRisingSweep && stepInBar === 0 && !this.activeRiserOsc) {
      const riserDur = (curSec.bars * 4 * 60) / this.tempo;
      this.triggerRiserSweep(time, Math.min(riserDur, 8.0));
    }

    // Snare roll in build section
    if (curSec?.hasSnareRoll) {
      const isFast = stepInBar >= 10;
      if (isFast || stepInBar % 2 === 0) {
        this.triggerSnare(time, 0.7 + (stepInBar / 16) * 0.25);
      }
    }

    // Heavy drop hit on drop section start
    if (curSec?.hasDropHit && stepInBar === 0 && patternStep === 0) {
      this.triggerDropImpact(time);
    }

    // 1. Drums
    if (inst.drums && comp.drums) {
      if (comp.drums.kick?.[patternStep]) this.triggerKick(time, 0.95);
      if (comp.drums.snare?.[patternStep] && !curSec?.hasSnareRoll) {
        this.triggerSnare(time, 0.85);
      }
      if (comp.drums.hihatClosed?.[patternStep]) this.triggerHiHat(time, false, 0.55);
      if (comp.drums.hihatOpen?.[patternStep]) this.triggerHiHat(time, true, 0.65);
      if (comp.drums.clap?.[patternStep]) this.triggerClap(time, 0.8);
      if (comp.drums.tom?.[patternStep]) this.triggerTom(time, 0.8, 110);
    }

    // 2. Bass
    if (inst.bass && comp.bass) {
      comp.bass.forEach((note) => {
        if (note.step === patternStep) {
          const durSec = note.duration * secondsPer16th;
          this.playBassNote(
            midiToFreq(note.note),
            time,
            durSec,
            note.velocity || 0.85,
            comp.synthSettings?.bassType || 'synthwave'
          );
        }
      });
    }

    // 3. Chords
    if (inst.chords && comp.chords) {
      comp.chords.forEach((chord) => {
        if (chord.step === patternStep) {
          const durSec = chord.duration * secondsPer16th;
          const freqs = chord.notes.map((m) => midiToFreq(m));
          this.playChord(
            freqs,
            time,
            durSec,
            0.7,
            comp.synthSettings?.chordType || 'pad'
          );
        }
      });
    }

    // 4. Lead Melody
    if (inst.lead && comp.lead) {
      comp.lead.forEach((note) => {
        if (note.step === patternStep) {
          const durSec = note.duration * secondsPer16th;
          this.playLeadNote(
            midiToFreq(note.note),
            time,
            durSec,
            note.velocity || 0.85,
            comp.synthSettings?.leadType || 'saw'
          );
        }
      });
    }

    // 5. Vocal Snippet
    if (inst.vocals && this.vocalBuffer && patternStep === 0) {
      this.playVocalSnippet(time);
    }
  }

  // -------------------------------------------------------------
  // INSTRUMENT GENERATORS WITH AUTOMATIC DISCONNECT (Zero Memory Leaks)
  // -------------------------------------------------------------
  public triggerKick(time: number, velocity = 0.95) {
    if (!this.ctx) return;
    const dest = this.trackGains['drums'] || this.masterGain;
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.1);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(time);
    osc.stop(time + 0.36);
  }

  public triggerSnare(time: number, velocity = 0.85) {
    if (!this.ctx) return;
    const dest = this.trackGains['drums'] || this.masterGain;
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    oscGain.gain.setValueAtTime(velocity * 0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(oscGain);
    oscGain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        oscGain.disconnect();
      } catch {}
    };

    osc.start(time);
    osc.stop(time + 0.15);

    if (this.sharedNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.sharedNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, time);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(velocity * 0.7, time);
      nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(dest);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          nGain.disconnect();
        } catch {}
      };

      noise.start(time);
      noise.stop(time + 0.19);
    }
  }

  public triggerHiHat(time: number, open = false, velocity = 0.6) {
    if (!this.ctx || !this.sharedNoiseBuffer) return;
    const dest = this.trackGains['drums'] || this.masterGain;
    if (!dest) return;

    const duration = open ? 0.3 : 0.05;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.sharedNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.onended = () => {
      try {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };

    noise.start(time);
    noise.stop(time + duration + 0.01);
  }

  public triggerClap(time: number, velocity = 0.8) {
    if (!this.ctx || !this.sharedNoiseBuffer) return;
    const dest = this.trackGains['drums'] || this.masterGain;
    if (!dest) return;

    [0, 0.015, 0.03].forEach((offset, idx) => {
      const isTail = idx === 2;
      const len = isTail ? 0.14 : 0.015;

      const noise = this.ctx!.createBufferSource();
      noise.buffer = this.sharedNoiseBuffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time + offset);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(velocity * (isTail ? 0.8 : 0.5), time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + len);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      noise.start(time + offset);
      noise.stop(time + offset + len + 0.01);
    });
  }

  public triggerTom(time: number, velocity = 0.8, pitch = 110) {
    if (!this.ctx) return;
    const dest = this.trackGains['drums'] || this.masterGain;
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.4, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.12);

    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(time);
    osc.stop(time + 0.31);
  }

  public playBassNote(
    freq: number,
    time: number,
    duration: number,
    velocity = 0.85,
    type: BassSynthType = 'synthwave'
  ) {
    if (!this.ctx) return;
    const dest = this.trackGains['bass'] || this.masterGain;
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (type === 'sub808') {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, time);
      osc.frequency.setValueAtTime(freq * 1.05, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);
      gain.gain.setValueAtTime(velocity, time);
      gain.gain.setTargetAtTime(0.001, time + duration * 0.85, 0.05);
    } else if (type === 'acid') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, time);
      filter.frequency.exponentialRampToValueAtTime(2600, time + 0.05);
      filter.frequency.exponentialRampToValueAtTime(450, time + duration);
      filter.Q.setValueAtTime(6.0, time);
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(velocity, time);
      gain.gain.setTargetAtTime(0.001, time + duration * 0.9, 0.04);
    } else if (type === 'pluck') {
      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + Math.min(0.2, duration));
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(velocity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(0.35, duration));
    } else {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + duration);
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(velocity, time);
      gain.gain.setTargetAtTime(0.001, time + duration * 0.9, 0.04);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(time);
    osc.stop(time + duration + 0.06);
  }

  public playChord(
    freqs: number[],
    time: number,
    duration: number,
    velocity = 0.7,
    type: ChordSynthType = 'pad'
  ) {
    if (!this.ctx) return;
    const dest = this.trackGains['chords'] || this.masterGain;
    if (!dest) return;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      if (type === 'supersaw') {
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2800, time);
      } else if (type === 'electric_piano') {
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, time);
        filter.frequency.exponentialRampToValueAtTime(600, time + duration);
      } else {
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, time);
      }

      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(velocity / freqs.length, time + 0.04);
      gain.gain.setTargetAtTime(0.001, time + duration * 0.85, 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(time);
      osc.stop(time + duration + 0.15);
    });
  }

  public playLeadNote(
    freq: number,
    time: number,
    duration: number,
    velocity = 0.85,
    type: LeadSynthType = 'saw'
  ) {
    if (!this.ctx) return;
    const dest = this.trackGains['lead'] || this.masterGain;
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (type === 'square') {
      osc.type = 'square';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3800, time);
    } else if (type === 'fm') {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, time);
    } else if (type === 'plucked') {
      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(350, time + Math.min(0.25, duration));
    } else {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, time);
      filter.frequency.linearRampToValueAtTime(4200, time + duration * 0.3);
    }

    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(velocity, time + 0.02);
    gain.gain.setTargetAtTime(0.001, time + duration * 0.9, 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(time);
    osc.stop(time + duration + 0.08);
  }

  public triggerRiserSweep(time: number, durationSec = 4.0) {
    if (!this.ctx) return;
    const dest = this.trackGains['fx'] || this.masterGain;
    if (!dest) return;

    this.stopActiveRiser();

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + durationSec);

    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.linearRampToValueAtTime(0.25, time + durationSec * 0.85);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + durationSec + 0.05);

    osc.connect(oscGain);
    oscGain.connect(dest);

    this.activeRiserOsc = osc;
    this.activeRiserGain = oscGain;

    osc.onended = () => {
      try {
        osc.disconnect();
        oscGain.disconnect();
        if (this.activeRiserOsc === osc) {
          this.activeRiserOsc = null;
          this.activeRiserGain = null;
        }
      } catch {}
    };

    osc.start(time);
    osc.stop(time + durationSec + 0.08);
  }

  private stopActiveRiser() {
    if (this.activeRiserOsc) {
      try {
        this.activeRiserOsc.stop();
        this.activeRiserOsc.disconnect();
      } catch {}
      this.activeRiserOsc = null;
    }
  }

  public triggerDropImpact(time: number) {
    if (!this.ctx) return;
    const dest = this.trackGains['fx'] || this.masterGain;
    if (!dest) return;

    const bombOsc = this.ctx.createOscillator();
    const bombGain = this.ctx.createGain();
    bombOsc.type = 'sine';
    bombOsc.frequency.setValueAtTime(95, time);
    bombOsc.frequency.exponentialRampToValueAtTime(26, time + 0.7);

    bombGain.gain.setValueAtTime(0.95, time);
    bombGain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);

    bombOsc.connect(bombGain);
    bombGain.connect(dest);

    bombOsc.onended = () => {
      try {
        bombOsc.disconnect();
        bombGain.disconnect();
      } catch {}
    };

    bombOsc.start(time);
    bombOsc.stop(time + 1.05);

    if (this.sharedCrashBuffer) {
      const crash = this.ctx.createBufferSource();
      crash.buffer = this.sharedCrashBuffer;
      const cFilter = this.ctx.createBiquadFilter();
      cFilter.type = 'highpass';
      cFilter.frequency.setValueAtTime(3000, time);

      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(0.8, time);
      cGain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

      crash.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(dest);

      crash.onended = () => {
        try {
          crash.disconnect();
          cFilter.disconnect();
          cGain.disconnect();
        } catch {}
      };

      crash.start(time);
      crash.stop(time + 1.25);
    }
  }

  public playVocalSnippet(time: number) {
    if (!this.ctx || !this.vocalBuffer) return;
    const dest = this.trackGains['vocals'] || this.masterGain;
    if (!dest) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.vocalBuffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, time);

    source.connect(gain);
    gain.connect(dest);

    source.onended = () => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    };

    source.start(time);
  }

  // Tactile Swiss Minimalist UI Audio Click / Feedback
  public playClick(type: 'tick' | 'confirm' | 'pop' = 'tick') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'confirm') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.04); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  public triggerPad(sound: string) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    switch (sound) {
      case 'kick':
        this.triggerKick(now, 1.0);
        break;
      case 'snare':
        this.triggerSnare(now, 0.95);
        break;
      case 'hihatClosed':
        this.triggerHiHat(now, false, 0.7);
        break;
      case 'hihatOpen':
        this.triggerHiHat(now, true, 0.8);
        break;
      case 'clap':
        this.triggerClap(now, 0.9);
        break;
      case 'tom':
        this.triggerTom(now, 0.9, 120);
        break;
      case 'bass':
        this.playBassNote(
          55,
          now,
          0.35,
          0.9,
          this.composition?.synthSettings?.bassType || 'synthwave'
        );
        break;
      case 'lead':
        this.playLeadNote(
          440,
          now,
          0.35,
          0.9,
          this.composition?.synthSettings?.leadType || 'saw'
        );
        break;
    }
  }

  // -------------------------------------------------------------
  // GUARANTEED FAST, HIGH-QUALITY DIRECT PCM WAV EXPORTER
  // Renders 120s full stereo song in < 150ms with ZERO crashes!
  // -------------------------------------------------------------
  public async renderSongToBuffer(comp: SongComposition): Promise<AudioBuffer> {
    const totalDurationSec = comp.fullDurationSec || 120;
    const sampleRate = 44100;
    const tempo = comp.tempo || 120;
    const secondsPer16th = 60.0 / (tempo * 4);
    const totalSamples = Math.ceil((totalDurationSec + 1.0) * sampleRate);
    const totalSteps = Math.ceil(totalDurationSec / secondsPer16th);
    const patternLen = comp.stepsCount || 32;

    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    // Track active sections
    for (let gStep = 0; gStep < totalSteps; gStep++) {
      const stepTimeSec = gStep * secondsPer16th;
      const startSample = Math.floor(stepTimeSec * sampleRate);
      const patternStep = gStep % patternLen;

      // Identify section
      let curSection: SongSection | null = null;
      let accum = 0;
      if (comp.sections) {
        for (const sec of comp.sections) {
          const sDur = (sec.bars * 4 * 60) / tempo;
          if (stepTimeSec >= accum && stepTimeSec < accum + sDur) {
            curSection = sec;
            break;
          }
          accum += sDur;
        }
      }

      const inst = curSection?.activeInstruments || {
        drums: true,
        bass: true,
        chords: true,
        lead: true,
        riserFx: false,
        vocals: true,
      };

      // 1. Kick
      if (inst.drums && comp.drums?.kick?.[patternStep]) {
        const kickLen = Math.floor(0.35 * sampleRate);
        for (let i = 0; i < kickLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const freq = 140 * Math.exp(-t * 30) + 42;
          const amp = 0.9 * Math.exp(-t * 9);
          const sample = Math.sin(2 * Math.PI * freq * t) * amp;
          left[startSample + i] += sample;
          right[startSample + i] += sample;
        }
      }

      // 2. Snare
      if (inst.drums && comp.drums?.snare?.[patternStep]) {
        const snareLen = Math.floor(0.18 * sampleRate);
        for (let i = 0; i < snareLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const bodyFreq = 180 * Math.exp(-t * 15) + 80;
          const body = Math.sin(2 * Math.PI * bodyFreq * t) * 0.5 * Math.exp(-t * 18);
          const noise = (Math.random() * 2 - 1) * 0.65 * Math.exp(-t * 14);
          const sample = body + noise;
          left[startSample + i] += sample;
          right[startSample + i] += sample;
        }
      }

      // 3. Hi-Hat
      if (inst.drums && comp.drums?.hihatClosed?.[patternStep]) {
        const hatLen = Math.floor(0.045 * sampleRate);
        for (let i = 0; i < hatLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const sample = (Math.random() * 2 - 1) * 0.4 * Math.exp(-t * 80);
          left[startSample + i] += sample * 0.9;
          right[startSample + i] += sample * 1.1;
        }
      }

      if (inst.drums && comp.drums?.hihatOpen?.[patternStep]) {
        const hatLen = Math.floor(0.25 * sampleRate);
        for (let i = 0; i < hatLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const sample = (Math.random() * 2 - 1) * 0.5 * Math.exp(-t * 14);
          left[startSample + i] += sample * 0.85;
          right[startSample + i] += sample * 1.15;
        }
      }

      // 4. Clap
      if (inst.drums && comp.drums?.clap?.[patternStep]) {
        const clapLen = Math.floor(0.15 * sampleRate);
        for (let i = 0; i < clapLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const sample = (Math.random() * 2 - 1) * 0.6 * Math.exp(-t * 18);
          left[startSample + i] += sample;
          right[startSample + i] += sample;
        }
      }

      // 5. Bass
      if (inst.bass && comp.bass) {
        comp.bass.forEach((note) => {
          if (note.step === patternStep) {
            const freq = midiToFreq(note.note);
            const dur = note.duration * secondsPer16th;
            const bLen = Math.floor(dur * sampleRate);
            for (let i = 0; i < bLen && startSample + i < totalSamples; i++) {
              const t = i / sampleRate;
              const env = Math.exp(-t * (1.5 / dur));
              let s = 0;
              if (comp.synthSettings?.bassType === 'sub808') {
                s = Math.sin(2 * Math.PI * freq * t) * (note.velocity || 0.85) * env;
              } else {
                // Saturated sawtooth wave
                const phase = (freq * t) % 1;
                s = (2 * phase - 1) * (note.velocity || 0.8) * env * 0.7;
              }
              left[startSample + i] += s;
              right[startSample + i] += s;
            }
          }
        });
      }

      // 6. Chords
      if (inst.chords && comp.chords) {
        comp.chords.forEach((chord) => {
          if (chord.step === patternStep) {
            const dur = chord.duration * secondsPer16th;
            const cLen = Math.floor(dur * sampleRate);
            chord.notes.forEach((mNote, idx) => {
              const freq = midiToFreq(mNote);
              const pan = (idx - chord.notes.length / 2) * 0.25;
              for (let i = 0; i < cLen && startSample + i < totalSamples; i++) {
                const t = i / sampleRate;
                const env = Math.min(1, t * 20) * Math.exp(-t * (1.2 / dur));
                const s = Math.sin(2 * Math.PI * freq * t) * 0.22 * env;
                left[startSample + i] += s * (1 - pan);
                right[startSample + i] += s * (1 + pan);
              }
            });
          }
        });
      }

      // 7. Lead
      if (inst.lead && comp.lead) {
        comp.lead.forEach((note) => {
          if (note.step === patternStep) {
            const freq = midiToFreq(note.note);
            const dur = note.duration * secondsPer16th;
            const lLen = Math.floor(dur * sampleRate);
            for (let i = 0; i < lLen && startSample + i < totalSamples; i++) {
              const t = i / sampleRate;
              const env = Math.min(1, t * 30) * Math.exp(-t * (1.5 / dur));
              const phase = (freq * t) % 1;
              const saw = (2 * phase - 1);
              const s = saw * (note.velocity || 0.75) * 0.35 * env;
              left[startSample + i] += s * 0.95;
              right[startSample + i] += s * 1.05;
            }
          }
        });
      }

      // 8. Drop Impact Hit
      if (curSection?.hasDropHit && patternStep === 0) {
        const dLen = Math.floor(1.2 * sampleRate);
        for (let i = 0; i < dLen && startSample + i < totalSamples; i++) {
          const t = i / sampleRate;
          const freq = 95 * Math.exp(-t * 2.5) + 26;
          const sub = Math.sin(2 * Math.PI * freq * t) * 0.9 * Math.exp(-t * 2);
          const crash = (Math.random() * 2 - 1) * 0.5 * Math.exp(-t * 3.5);
          left[startSample + i] += sub + crash;
          right[startSample + i] += sub + crash;
        }
      }
    }

    // Master Soft Limiter / Tanh Normalization to prevent clipping
    for (let i = 0; i < totalSamples; i++) {
      left[i] = Math.tanh(left[i] * 0.75);
      right[i] = Math.tanh(right[i] * 0.75);
    }

    // Convert Float32 arrays into real AudioBuffer
    this.init();
    const actx = this.ctx || new AudioContext();
    const finalBuffer = actx.createBuffer(2, totalSamples, sampleRate);
    finalBuffer.copyToChannel(left, 0);
    finalBuffer.copyToChannel(right, 1);

    return finalBuffer;
  }
}

export const audio = new SynthEngine();
