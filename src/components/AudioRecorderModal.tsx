import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { audio } from '../audio/synthEngine';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecorded: (memoName: string) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onRecorded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setSeconds(0);
    }
  }, [isOpen]);

  const startRecording = async () => {
    audio.playClick('tick');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      }
    } catch (e) {
      console.warn('Microphone stream access note:', e);
    }

    setIsRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    audio.playClick('pop');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
  };

  const handleFinish = () => {
    audio.playClick('confirm');
    stopRecording();
    const memoName = `VoiceMemo_${Date.now().toString().slice(-4)}`;
    onRecorded(memoName);
    onClose();
  };

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-sm bg-mono-950 border border-mono-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        {/* Header Title */}
        <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider text-center mb-1">
          RECORD AUDIO INPUT
        </h2>
        <span className="text-xs text-mono-400 font-mono mb-6">
          {formatTime(seconds)}
        </span>

        {/* Animated Waveform Bars */}
        <div className="w-full h-24 bg-mono-900 rounded-xl flex items-center justify-center gap-1 px-3 mb-6 border border-mono-800 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => {
            const height = isRecording
              ? Math.max(12, Math.sin(i * 0.5 + seconds * 4) * 45 + 50)
              : 8;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isRecording ? 'bg-white' : 'bg-mono-800'
                }`}
              />
            );
          })}
        </div>

        <p className="text-[11px] text-mono-400 font-mono uppercase tracking-wider mb-6 text-center">
          {isRecording ? 'RECORDING IN PROGRESS...' : 'TAP RECORD TO CAPTURE AUDIO HOOK'}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-mono-900 hover:bg-mono-800 border border-mono-800 text-mono-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-mono-900 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)]'
                : 'bg-mono-900 border border-mono-700 hover:border-white'
            }`}
          >
            <div
              className={`transition-all ${
                isRecording ? 'w-5 h-5 rounded-sm bg-white' : 'w-8 h-8 rounded-full bg-white'
              }`}
            />
          </button>

          <button
            onClick={handleFinish}
            disabled={seconds === 0}
            className="w-10 h-10 rounded-lg bg-mono-900 hover:bg-mono-800 disabled:opacity-30 border border-mono-800 text-mono-200 hover:text-white flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
