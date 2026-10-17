import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Activity, 
  Info, 
  ZoomIn, 
  ZoomOut,
  Radio,
  Sliders
} from 'lucide-react';

interface ECGMonitorProps {
  heartRate: number;
  isPlaying: boolean;
  onTogglePlay?: () => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  compact?: boolean;
  isDark?: boolean;
}

export const ECGMonitor: React.FC<ECGMonitorProps> = ({
  heartRate,
  isPlaying,
  onTogglePlay,
  onNotify,
  compact = false,
  isDark = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [speed, setSpeed] = useState<25 | 50>(25); // mm/s
  const [gain, setGain] = useState<0.5 | 1.0 | 2.0>(1.0); // mm/mV
  const [lead, setLead] = useState<'Lead I' | 'Lead II' | 'Lead III' | 'V1' | 'V5'>('Lead II');
  const [selectedWave, setSelectedWave] = useState<'p' | 'qrs' | 't' | 'pr' | 'qt' | null>(null);

  // Audio Context for synthetic QRS beep
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Animation & buffer state
  const bufferRef = useRef<{ y: number }[]>([]);
  const sweepXRef = useRef(0);
  const phaseRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());

  // Trigger web audio beep on R wave
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio autoplay permission fallback
    }
  }, [soundEnabled]);

  // Synthetic P-QRS-T complex mathematically synchronized to heart rate and lead orientation
  const getECGValueAtPhase = (t: number, leadType: string): number => {
    const pStart = 0.02;
    const pEnd = 0.12;
    const qrsStart = 0.16;
    const qrsEnd = 0.24;
    const tStart = 0.28;
    const tEnd = 0.44;

    // Lead vector polarity adjustments
    const leadMultiplier = leadType === 'V1' ? 0.7 : leadType === 'Lead III' ? 0.85 : 1.0;
    const invertT = leadType === 'V1';

    if (t >= pStart && t < pEnd) {
      // P wave: atrial depolarization
      const pt = (t - pStart) / (pEnd - pStart);
      return 0.18 * Math.sin(pt * Math.PI) * leadMultiplier;
    } else if (t >= qrsStart && t < qrsEnd) {
      // QRS Complex: ventricular depolarization
      const qt = (t - qrsStart) / (qrsEnd - qrsStart);
      if (qt < 0.2) {
        return -0.15 * Math.sin((qt / 0.2) * Math.PI) * leadMultiplier;
      } else if (qt < 0.65) {
        const rt = (qt - 0.2) / 0.45;
        return 1.35 * Math.sin(rt * Math.PI) * leadMultiplier;
      } else {
        const st = (qt - 0.65) / 0.35;
        return -0.32 * Math.sin(st * Math.PI) * leadMultiplier;
      }
    } else if (t >= tStart && t < tEnd) {
      // T wave: ventricular repolarization
      const tt = (t - tStart) / (tEnd - tStart);
      const val = 0.38 * Math.sin(tt * Math.PI) * (1.1 - 0.3 * tt) * leadMultiplier;
      return invertT ? -val * 0.5 : val;
    }

    // Isoelectric baseline with tiny physiological micro-variation
    return Math.sin(t * 80) * 0.008;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 340);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 340;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        const cycleFreq = heartRate / 60;
        const prevPhase = phaseRef.current;
        phaseRef.current = (phaseRef.current + dt * cycleFreq) % 1.0;

        // Beep detection at R-peak (~phase 0.2)
        if (prevPhase < 0.2 && phaseRef.current >= 0.2) {
          playBeep();
        }

        const pxPerSec = speed === 25 ? 140 : 260;
        const advancePx = dt * pxPerSec;
        sweepXRef.current = (sweepXRef.current + advancePx) % width;

        const mv = getECGValueAtPhase(phaseRef.current, lead);
        const baselineY = height * 0.62;
        const scaleY = height * 0.28 * gain;
        const sampleY = baselineY - mv * scaleY;

        const xInt = Math.floor(sweepXRef.current);
        bufferRef.current[xInt] = { y: sampleY };

        // Erase zone ahead of phosphor sweep
        const eraseWidth = 24;
        for (let i = 0; i < eraseWidth; i++) {
          const eraseX = (xInt + i) % width;
          delete bufferRef.current[eraseX];
        }
      }

      // Draw Grid & Background
      ctx.fillStyle = isDark ? '#040B07' : '#04140D';
      ctx.fillRect(0, 0, width, height);

      // Minor grid (1mm squares: ~7px)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      for (let x = 0; x < width; x += 7) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 7) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid (5mm squares: ~35px)
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.3)';
      ctx.beginPath();
      for (let x = 0; x < width; x += 35) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 35) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw Waveform from buffer (Phosphor Emerald Glow)
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#34D399';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      let isDrawing = false;
      for (let x = 0; x < width; x++) {
        const point = bufferRef.current[x];
        if (point) {
          if (!isDrawing) {
            ctx.moveTo(x, point.y);
            isDrawing = true;
          } else {
            ctx.lineTo(x, point.y);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Phosphor Beam Head (Sweeping Cursor)
      const curX = sweepXRef.current;
      const curSample = bufferRef.current[Math.floor(curX)];
      if (curSample) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, curSample.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
        ctx.beginPath();
        ctx.arc(curX, curSample.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [heartRate, isPlaying, speed, gain, lead, playBeep]);

  const handleClearBuffer = () => {
    bufferRef.current = [];
    sweepXRef.current = 0;
    if (onNotify) onNotify('ECG waveform buffer cleared and reset.', 'info');
  };

  // Physiological Interval Calculations
  const rrIntervalMs = Math.round(60000 / heartRate);
  const prIntervalMs = Math.round(160 * (72 / heartRate) ** 0.3);
  const qrsDurationMs = 88;
  const qtcMs = Math.round(390 / Math.sqrt(rrIntervalMs / 1000));

  const rhythmDiagnosis =
    heartRate < 60
      ? 'Sinus Bradycardia'
      : heartRate > 100
      ? 'Sinus Tachycardia'
      : 'Normal Sinus Rhythm';

  return (
    <div
      style={{
        backgroundColor: isDark ? '#0D1C1A' : '#FFFFFF',
        borderColor: isDark ? '#183834' : '#E2E8E5',
      }}
      className={`shadow-xl border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl transition-all ${compact ? 'p-3.5 space-y-3' : 'p-5 space-y-4'}`}
    >
      {/* Top Header & Telemetry Bar */}
      <div
        style={{ borderColor: isDark ? '#183834' : '#EDF2F0' }}
        className="flex flex-wrap items-center justify-between gap-2.5 border-b pb-3"
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.4)',
            }}
            className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-sm"
          >
            <Activity className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                style={{ color: isDark ? '#F0FDF4' : '#0F172A' }}
                className="text-sm sm:text-base font-sans font-bold tracking-wide"
              >
                Live ECG Monitor
              </h3>
              <Badge variant="emerald" className="text-[10px] py-0 px-2">
                {rhythmDiagnosis.toUpperCase()}
              </Badge>
            </div>
            {!compact && (
              <p style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="text-xs font-mono">
                Lead: {lead} · Speed: {speed} mm/s · Gain: {gain}x · RR: {rrIntervalMs} ms
              </p>
            )}
          </div>
        </div>

        {/* Live BPM Badge & Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div
            style={{
              backgroundColor: isDark ? '#06110B' : '#F0FDF4',
              borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.3)',
            }}
            className="border px-2.5 py-1 rounded-xl flex items-baseline gap-1 shadow-inner"
          >
            <span style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="text-[11px] font-mono">HR:</span>
            <span className="text-base sm:text-lg font-mono font-bold text-[#F43F5E]">{heartRate}</span>
            <span style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="text-[9px] font-mono">BPM</span>
          </div>

          {/* Lead Selector Buttons */}
          <div
            style={{
              backgroundColor: isDark ? '#06110B' : '#F0FDF4',
              borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)',
            }}
            className="flex items-center p-0.5 rounded-xl border text-xs font-mono"
          >
            {(['Lead I', 'Lead II', 'Lead III', 'V1', 'V5'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLead(l)}
                style={
                  lead === l
                    ? { backgroundColor: '#10B981', color: '#FFFFFF' }
                    : { color: isDark ? '#94A3B8' : '#64748B' }
                }
                className="px-2 py-0.5 rounded-lg transition cursor-pointer text-[10px] font-medium"
              >
                {l}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (onNotify) onNotify(!soundEnabled ? 'ECG QRS audio blip enabled.' : 'ECG audio muted.', 'info');
            }}
            title={soundEnabled ? 'Mute QRS Blip' : 'Enable QRS Beep'}
            style={
              soundEnabled
                ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.4)' }
                : { backgroundColor: isDark ? '#06110B' : '#F0FDF4', color: isDark ? '#94A3B8' : '#64748B', borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)' }
            }
            className="p-1.5 rounded-xl border transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => {
              const next = speed === 25 ? 50 : 25;
              setSpeed(next);
              if (onNotify) onNotify(`ECG sweep speed set to ${next} mm/s`, 'info');
            }}
            title="Toggle paper sweep speed (25 or 50 mm/s)"
            style={{
              backgroundColor: isDark ? '#06110B' : '#F0FDF4',
              color: isDark ? '#E2E8F0' : '#0F172A',
              borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)',
            }}
            className="px-2 py-1 rounded-xl border text-[10px] font-mono transition cursor-pointer"
          >
            {speed} mm/s
          </button>

          {/* Gain Toggle */}
          <button
            onClick={() => {
              const next = gain === 1.0 ? 2.0 : gain === 2.0 ? 0.5 : 1.0;
              setGain(next);
              if (onNotify) onNotify(`ECG voltage gain set to ${next}x (${next * 10} mm/mV)`, 'info');
            }}
            title="Toggle voltage amplitude gain (0.5x, 1x, 2x)"
            style={{
              backgroundColor: isDark ? '#06110B' : '#F0FDF4',
              color: isDark ? '#E2E8F0' : '#0F172A',
              borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)',
            }}
            className="px-2 py-1 rounded-xl border text-[10px] font-mono transition cursor-pointer"
          >
            {gain}x
          </button>

          {/* Reset / Clear */}
          <button
            onClick={handleClearBuffer}
            title="Clear Waveform Buffer"
            style={{
              backgroundColor: isDark ? '#06110B' : '#F0FDF4',
              color: isDark ? '#94A3B8' : '#64748B',
              borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)',
            }}
            className="p-1.5 rounded-xl border transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        style={{
          height: compact ? '180px' : '280px',
          borderColor: isDark ? 'rgba(23, 61, 44, 0.85)' : 'rgba(16, 185, 129, 0.25)',
        }}
        className="relative w-full rounded-xl overflow-hidden border shadow-inner bg-[#040B07]"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Lead Calibration Voltage Marker on Left Edge */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(5, 11, 8, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
          }}
          className="absolute left-2.5 top-2.5 pointer-events-none text-[9px] font-mono px-2 py-0.5 rounded-lg border shadow-sm"
        >
          <div className="font-bold text-[#10B981]">{lead.toUpperCase()}</div>
          <div style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{(1.0 * gain).toFixed(1)} mV/cm</div>
        </div>

        {/* Real-time Physiological Interval Badges */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(5, 11, 8, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.3)',
          }}
          className="absolute right-2.5 top-2.5 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-0.5 rounded-lg border shadow-sm"
        >
          <span>RR: <strong className="text-[#34D399]">{rrIntervalMs}ms</strong></span>
          <span style={{ color: isDark ? '#334155' : '#CBD5E1' }}>|</span>
          <span>PR: <strong className="text-white">{prIntervalMs}ms</strong></span>
          <span style={{ color: isDark ? '#334155' : '#CBD5E1' }}>|</span>
          <span>QRS: <strong className="text-white">{qrsDurationMs}ms</strong></span>
          <span style={{ color: isDark ? '#334155' : '#CBD5E1' }}>|</span>
          <span>QTc: <strong className="text-[#34D399]">{qtcMs}ms</strong></span>
        </div>

        {/* Bottom Status Marker */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(5, 11, 8, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            borderColor: isDark ? 'rgba(23, 61, 44, 0.6)' : 'rgba(16, 185, 129, 0.2)',
          }}
          className="absolute right-2.5 bottom-2 pointer-events-none text-[9px] font-mono text-emerald-400/80 px-2 py-0.5 rounded-lg border"
        >
          Clinical Rhythm Sim
        </div>
      </div>

      {/* Interactive Wave Caliper & Electrophysiology Guide (shown in full view only) */}
      {!compact && (
        <div
          style={{
            backgroundColor: isDark ? '#06110B' : '#F7FCF9',
            borderColor: isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.25)',
          }}
          className="border rounded-xl p-3 space-y-2"
        >
          <div className="text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}>
            <span>Electrophysiological Complex Wave Guide:</span>
            <span className="text-[10px] font-mono text-emerald-400 font-normal">Click any component for breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* P Wave */}
            <button
              onClick={() => setSelectedWave(selectedWave === 'p' ? null : 'p')}
              style={{
                backgroundColor: selectedWave === 'p' ? 'rgba(245, 158, 11, 0.2)' : isDark ? '#0B1913' : '#FFFFFF',
                borderColor: selectedWave === 'p' ? '#F59E0B' : isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.2)',
              }}
              className="p-2.5 rounded-lg border text-left transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>P Wave (Atrial Depol.)</span>
                <span className="font-mono text-[10px] text-amber-400">~0.08–0.12s</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Sinoatrial (SA) node triggers wave of depolarization across both atria, causing atrial contraction.
              </p>
            </button>

            {/* QRS Complex */}
            <button
              onClick={() => setSelectedWave(selectedWave === 'qrs' ? null : 'qrs')}
              style={{
                backgroundColor: selectedWave === 'qrs' ? 'rgba(16, 185, 129, 0.2)' : isDark ? '#0B1913' : '#FFFFFF',
                borderColor: selectedWave === 'qrs' ? '#10B981' : isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.2)',
              }}
              className="p-2.5 rounded-lg border text-left transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>QRS Complex (Ventricular)</span>
                <span className="font-mono text-[10px] text-[#10B981]">~0.08–0.10s</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Rapid conduction down Bundle of His & Purkinje fibers triggers ventricular systole and blood ejection.
              </p>
            </button>

            {/* T Wave */}
            <button
              onClick={() => setSelectedWave(selectedWave === 't' ? null : 't')}
              style={{
                backgroundColor: selectedWave === 't' ? 'rgba(168, 85, 247, 0.2)' : isDark ? '#0B1913' : '#FFFFFF',
                borderColor: selectedWave === 't' ? '#A855F7' : isDark ? 'rgba(23, 61, 44, 0.8)' : 'rgba(16, 185, 129, 0.2)',
              }}
              className="p-2.5 rounded-lg border text-left transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>T Wave (Repol.)</span>
                <span className="font-mono text-[10px] text-purple-400">~0.16s</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Ventricular cardiomyocytes repolarize, restoring baseline resting potential for next cycle.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
