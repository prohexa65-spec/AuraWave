import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/synthEngine';
import { Activity, BarChart3, Radio } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  bpm: number;
}

export function AudioVisualizer({ isPlaying, bpm }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'spectrum' | 'oscilloscope' | 'vumeter'>('spectrum');
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 100);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 100;
      }
    };
    window.addEventListener('resize', handleResize);

    const analyser = audio.analyser;
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Deep monochrome canvas
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Fine precision grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 20; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!analyser || !isPlaying) {
        // Idle gentle waveform in monochrome zinc
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        const time = Date.now() * 0.002;
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.02 + time) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#71717a';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AUDIO DSP READY • PRESS PLAY TO MONITOR', width / 2, height / 2 + 22);
        return;
      }

      if (visualMode === 'spectrum') {
        analyser.getByteFrequencyData(dataArray);

        const barCount = Math.min(64, Math.floor(width / 6));
        const barWidth = Math.max(3, (width - barCount * 2) / barCount);
        const step = Math.floor(bufferLength / (barCount * 1.2));

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(2, percent * (height - 16));
          const x = i * (barWidth + 2);
          const y = height - barHeight - 4;

          // Swiss High Contrast: Solid White with Zinc Falloff
          const barGrad = ctx.createLinearGradient(0, y, 0, height);
          barGrad.addColorStop(0, '#ffffff');
          barGrad.addColorStop(0.5, '#d4d4d8');
          barGrad.addColorStop(1, '#3f3f46');

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [1.5, 1.5, 0, 0]);
          ctx.fill();

          // High Peak White Dot
          if (percent > 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 2, barWidth, 1.5);
          }
        }
      } else if (visualMode === 'oscilloscope') {
        analyser.getByteTimeDomainData(timeDomainArray);

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualMode === 'vumeter') {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const levelPercent = Math.min(1.0, (avg / 128) * 1.3);

        const meterW = Math.min(width - 40, 480);
        const startX = (width - meterW) / 2;
        const totalSegments = 36;
        const litSegments = Math.round(levelPercent * totalSegments);
        const segW = (meterW - totalSegments * 2) / totalSegments;

        // Left Channel
        for (let s = 0; s < totalSegments; s++) {
          const segX = startX + s * (segW + 2);
          const isLit = s < litSegments;
          ctx.fillStyle = isLit ? '#ffffff' : '#27272a';
          ctx.fillRect(segX, height / 2 - 12, segW, 8);
        }

        // Right Channel
        for (let s = 0; s < totalSegments; s++) {
          const segX = startX + s * (segW + 2);
          const isLit = s < Math.max(0, litSegments - 1);
          ctx.fillStyle = isLit ? '#ffffff' : '#27272a';
          ctx.fillRect(segX, height / 2 + 4, segW, 8);
        }

        ctx.fillStyle = '#71717a';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('L', startX - 16, height / 2 - 5);
        ctx.fillText('R', startX - 16, height / 2 + 11);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, visualMode]);

  return (
    <div className="w-full bg-mono-950 border border-mono-800 rounded-xl overflow-hidden p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-mono text-mono-400 uppercase tracking-widest">
            MASTER STEREO MONITOR • {bpm} BPM
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              audio.playClick('tick');
              setVisualMode('spectrum');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition ${
              visualMode === 'spectrum'
                ? 'bg-white text-black font-bold'
                : 'bg-mono-900 border border-mono-800 text-mono-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" /> SPECTRUM
          </button>
          <button
            onClick={() => {
              audio.playClick('tick');
              setVisualMode('oscilloscope');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition ${
              visualMode === 'oscilloscope'
                ? 'bg-white text-black font-bold'
                : 'bg-mono-900 border border-mono-800 text-mono-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" /> OSCILLOSCOPE
          </button>
          <button
            onClick={() => {
              audio.playClick('tick');
              setVisualMode('vumeter');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition ${
              visualMode === 'vumeter'
                ? 'bg-white text-black font-bold'
                : 'bg-mono-900 border border-mono-800 text-mono-400 hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3" /> VU METER
          </button>
        </div>
      </div>

      <div className="relative w-full h-[100px] rounded-lg overflow-hidden border border-mono-800 bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
