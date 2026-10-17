import React from 'react';
import { SimulationState, BaselineState, PRESET_SCENARIOS } from '../../types/cardiac';
import { HeartScene } from '../Heart/HeartScene';
import { ECGMonitor } from '../ECG/ECGMonitor';
import { BaselineComparison } from '../Simulation/BaselineComparison';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Heart,
  Droplets,
  Activity,
  Gauge,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  BookOpen,
  Zap,
  RotateCcw
} from 'lucide-react';

interface OverviewTabProps {
  state: SimulationState;
  baseline: BaselineState | null;
  onUpdateParam: (key: keyof SimulationState, value: number) => void;
  onResetParam: (key: keyof SimulationState) => void;
  onResetAll: () => void;
  onLoadScenario: (scenario: Partial<SimulationState>) => void;
  onSaveBaseline: () => void;
  onRestoreBaseline: () => void;
  onNavigateTab: (tabId: string) => void;
  onTogglePlay: () => void;
  onToggleBloodFlow: () => void;
  onChangeBloodFlowSpeed: (speed: number) => void;
  onToggleLabels: () => void;
  onChangeViewMode: (mode: 'standard' | 'xray' | 'flowOnly') => void;
  onSelectChamber: (id: string | null) => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  isDark?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  state,
  baseline,
  onUpdateParam,
  onResetParam,
  onResetAll,
  onLoadScenario,
  onSaveBaseline,
  onRestoreBaseline,
  onNavigateTab,
  onTogglePlay,
  onToggleBloodFlow,
  onChangeBloodFlowSpeed,
  onToggleLabels,
  onChangeViewMode,
  onSelectChamber,
  onNotify,
  isDark = true,
}) => {
  const C = {
    bgCard: isDark ? '#0D1C1A' : '#FFFFFF',
    bgInner: isDark ? '#081514' : '#F4F7F6',
    text: isDark ? '#F0FDF4' : '#0F172A',
    textSec: isDark ? '#8DA9A5' : '#475569',
    textMuted: isDark ? '#5B7773' : '#8A9FA8',
    border: isDark ? '#183834' : '#E2E8E5',
    borderHr: isDark ? 'rgba(244,63,94,0.35)' : 'rgba(225,29,72,0.25)',
    borderSv: isDark ? 'rgba(16,185,129,0.35)' : 'rgba(5,150,105,0.25)',
    borderCo: isDark ? 'rgba(46,216,155,0.35)' : 'rgba(16,185,129,0.25)',
    borderBp: isDark ? 'rgba(56,189,248,0.35)' : 'rgba(2,132,199,0.25)',
    accent: isDark ? '#10B981' : '#059669',
    coral: isDark ? '#F43F5E' : '#E11D48',
    green: isDark ? '#2ED89B' : '#10B981',
    barBg: isDark ? '#142B28' : '#EDF2F0',
  };
  // Clamp helpers for micro-step adjustments
  const stepHR = (delta: number) => {
    const next = Math.max(40, Math.min(180, state.heartRate + delta));
    onUpdateParam('heartRate', next);
  };

  const stepSV = (delta: number) => {
    const next = Math.max(40, Math.min(140, state.strokeVolume + delta));
    onUpdateParam('strokeVolume', next);
  };

  const stepBP = (delta: number) => {
    const nextSys = Math.max(80, Math.min(220, state.systolicBP + delta));
    onUpdateParam('systolicBP', nextSys);
    if (nextSys <= state.diastolicBP + 10) {
      onUpdateParam('diastolicBP', Math.max(40, nextSys - 15));
    }
  };

  // Classifications
  const hrClassification =
    state.heartRate < 60 ? { label: 'Bradycardia (<60)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' } :
      state.heartRate > 100 ? { label: 'Tachycardia (>100)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' } :
        { label: 'Normal Sinus Rhythm', color: 'text-[#10B981] bg-emerald-500/10 border-emerald-500/30' };

  const bpClassification =
    state.systolicBP >= 140 || state.diastolicBP >= 90 ? { label: 'Stage 2 Hypertension', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' } :
      state.systolicBP >= 130 || state.diastolicBP >= 80 ? { label: 'Stage 1 Hypertension', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' } :
        state.systolicBP >= 120 ? { label: 'Elevated Systolic', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' } :
          state.systolicBP < 90 ? { label: 'Hypotension (<90)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' } :
            { label: 'Optimal Normotensive', color: 'text-[#10B981] bg-emerald-500/10 border-emerald-500/30' };

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div
          style={{ backgroundColor: C.bgCard, borderColor: C.borderHr }}
          className="p-4 rounded-2xl border border-b-[4px] border-b-rose-950/90 hover:border-b-rose-500 shadow-md card-3d relative overflow-hidden transition-all duration-200 h-[178px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textSec }} className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" style={{ color: C.coral }} />
              Heart Rate (HR)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepHR(-5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Decrease 5 BPM"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepHR(5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Increase 5 BPM"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span style={{ color: C.text }} className="text-3xl font-mono font-bold tracking-tight">{state.heartRate}</span>
              <span style={{ color: C.textSec }} className="text-xs font-mono">BPM</span>
            </div>

            <div className="mt-2">
              <div style={{ backgroundColor: C.barBg }} className="h-1.5 w-full rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, ((state.heartRate - 40) / 140) * 100))}%`, background: 'linear-gradient(to right, #F59E0B, #10B981, #EF4444)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                <span>40</span>
                <span style={{ color: C.green }}>60–100 (Normal)</span>
                <span>180</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2" style={{ borderColor: C.border }}>
            <span style={{ color: C.textSec }}>Status:</span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${hrClassification.color}`}>
              {hrClassification.label}
            </span>
          </div>
        </div>

        {/* Stroke Volume */}
        <div
          style={{ backgroundColor: C.bgCard, borderColor: C.borderSv }}
          className="p-4 rounded-2xl border border-b-[4px] border-b-emerald-950/90 hover:border-b-emerald-500 shadow-md card-3d relative overflow-hidden transition-all duration-200 h-[178px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textSec }} className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" style={{ color: C.accent }} />
              Stroke Volume (SV)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepSV(-5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Decrease 5 mL"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepSV(5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Increase 5 mL"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span style={{ color: C.text }} className="text-3xl font-mono font-bold tracking-tight">{state.strokeVolume}</span>
              <span style={{ color: C.textSec }} className="text-xs font-mono">mL/beat</span>
            </div>

            <div className="mt-2">
              <div style={{ backgroundColor: C.barBg }} className="h-1.5 w-full rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, ((state.strokeVolume - 40) / 100) * 100))}%`, backgroundColor: C.accent }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                <span>40</span>
                <span style={{ color: C.accent }}>65–85 (Normal)</span>
                <span>140</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2" style={{ borderColor: C.border }}>
            <span style={{ color: C.textSec }}>Ejection Index:</span>
            <span style={{ color: C.accent }} className="font-semibold text-[10px]">
              {(state.strokeVolume / 1.2).toFixed(0)}% Eff. Fraction
            </span>
          </div>
        </div>

        {/* Cardiac Output */}
        <div
          style={{ backgroundColor: C.bgCard, borderColor: C.borderCo }}
          className="p-4 rounded-2xl border border-b-[4px] border-b-teal-950/90 hover:border-b-teal-500 shadow-md card-3d relative overflow-hidden transition-all duration-200 h-[178px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textSec }} className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" style={{ color: C.green }} />
              Cardiac Output (CO)
            </span>
            <span style={{ color: C.green, borderColor: `${C.green}40`, backgroundColor: `${C.green}15` }} className="text-[10px] font-mono border px-1.5 py-0.5 rounded">
              HR × SV
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span style={{ color: C.green }} className="text-3xl font-mono font-bold tracking-tight">{state.cardiacOutput.toFixed(2)}</span>
              <span style={{ color: C.textSec }} className="text-xs font-mono">L/min</span>
            </div>

            <div className="mt-2">
              <div style={{ backgroundColor: C.barBg }} className="h-1.5 w-full rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, ((state.cardiacOutput - 2.0) / 14.0) * 100))}%`, background: `linear-gradient(to right, ${C.accent}, ${C.green})` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                <span>2.0</span>
                <span style={{ color: C.green }}>4.5–7.0 (Resting)</span>
                <span>16.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2" style={{ borderColor: C.border }}>
            <span style={{ color: C.textSec }}>Total per Hour:</span>
            <span style={{ color: C.green }} className="font-semibold text-[10px]">{(state.cardiacOutput * 60).toFixed(0)} L/hour</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div
          style={{ backgroundColor: C.bgCard, borderColor: C.borderBp }}
          className="p-4 rounded-2xl border border-b-[4px] border-b-indigo-950/90 hover:border-b-indigo-500 shadow-md card-3d relative overflow-hidden transition-all duration-200 h-[178px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textSec }} className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" style={{ color: '#818CF8' }} />
              Blood Pressure (BP)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepBP(-5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Decrease 5 mmHg"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => stepBP(5)}
                style={{ backgroundColor: C.bgInner, color: C.textSec }}
                className="w-6 h-6 rounded-md cursor-pointer hover:opacity-80"
                title="Increase 5 mmHg"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span style={{ color: C.text }} className="text-3xl font-mono font-bold tracking-tight">{state.systolicBP}/{state.diastolicBP}</span>
              <span style={{ color: C.textSec }} className="text-xs font-mono">mmHg</span>
            </div>

            <div className="mt-2">
              <div style={{ backgroundColor: C.barBg }} className="h-1.5 w-full rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, ((state.systolicBP - 80) / 140) * 100))}%`, background: 'linear-gradient(to right, #10B981, #F59E0B, #EF4444)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                <span>80</span>
                <span style={{ color: '#818CF8' }}>MAP {state.meanArterialPressure.toFixed(0)}</span>
                <span>220</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono border-t pt-2" style={{ borderColor: C.border }}>
            <span style={{ color: C.textSec }}>Category:</span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${bpClassification.color}`}>
              {bpClassification.label}
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Presets */}
      <div
        style={{ backgroundColor: C.bgCard, borderColor: C.border }}
        className="p-3.5 rounded-2xl border border-b-[4px] border-b-[#07251f] card-3d shadow-sm flex flex-wrap items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: C.textSec }}>
          <Zap className="w-4 h-4" style={{ color: C.accent }} />
          <span className="font-semibold" style={{ color: C.text }}>Preset Scenarios:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_SCENARIOS.map((sc) => {
            const isSelected =
              state.heartRate === sc.state.heartRate &&
              state.strokeVolume === sc.state.strokeVolume &&
              state.systolicBP === sc.state.systolicBP;

            return (
              <Button
                key={sc.name}
                size="sm"
                variant={isSelected ? 'pill-active' : 'pill'}
                onClick={() => {
                  onLoadScenario(sc.state);
                  if (onNotify) onNotify(`Loaded scenario: ${sc.name}`, 'success');
                }}
                className="text-xs font-sans"
              >
                {sc.name.split(' (')[0]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Visualization Arena & Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive 3D Heart Scene */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[520px]">
          <HeartScene
            heartRate={state.heartRate}
            isPlaying={state.isPlaying}
            bloodFlowVisible={state.bloodFlowVisible}
            bloodFlowSpeed={state.bloodFlowSpeed}
            showLabels={state.showLabels}
            viewMode={state.viewMode}
            activeChamber={state.activeChamber}
            onTogglePlay={onTogglePlay}
            onToggleBloodFlow={onToggleBloodFlow}
            onChangeBloodFlowSpeed={onChangeBloodFlowSpeed}
            onToggleLabels={onToggleLabels}
            onChangeViewMode={onChangeViewMode}
            onSelectChamber={onSelectChamber}
          />
        </div>

        {/* Right Column: Mini ECG & Quick Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 h-full">
          {/* Mini ECG */}
          <ECGMonitor
            heartRate={state.heartRate}
            isPlaying={state.isPlaying}
            onTogglePlay={onTogglePlay}
            onNotify={onNotify}
            compact={true}
            isDark={isDark}
          />

          {/* Quick Controls Panel */}
          <div
            style={{ backgroundColor: C.bgCard, borderColor: C.border }}
            className="p-4 rounded-2xl border border-b-[4px] border-b-[#07251f] card-3d shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 style={{ color: C.text }} className="text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: C.accent }} />
                Quick Controls
              </h4>
              <button
                onClick={() => onNavigateTab('simulation')}
                style={{ color: C.accent }}
                className="text-xs font-mono hover:underline flex items-center gap-1 cursor-pointer transition hover:text-emerald-400"
              >
                All Controls <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span style={{ color: C.textSec }}>Heart Rate:</span>
                <span style={{ color: C.coral }} className="font-bold">{state.heartRate} BPM</span>
              </div>
              <input
                type="range" min="40" max="180"
                value={state.heartRate}
                onChange={(e) => onUpdateParam('heartRate', parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
                style={{ accentColor: C.coral }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span style={{ color: C.textSec }}>Stroke Volume:</span>
                <span style={{ color: C.accent }} className="font-bold">{state.strokeVolume} mL</span>
              </div>
              <input
                type="range" min="40" max="140"
                value={state.strokeVolume}
                onChange={(e) => onUpdateParam('strokeVolume', parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
                style={{ accentColor: C.accent }}
              />
            </div>

            <div
              style={{ backgroundColor: C.bgInner, borderColor: C.border }}
              className="p-2.5 rounded-xl border text-[11px] font-mono flex flex-wrap items-center justify-between gap-1"
            >
              <span style={{ color: C.textSec }}>CO:</span>
              <span style={{ color: C.green }} className="font-bold">{state.cardiacOutput.toFixed(2)} L/min</span>
              <span style={{ color: C.textMuted }}>|</span>
              <span style={{ color: C.textSec }}>Pulse P:</span>
              <span style={{ color: C.coral }} className="font-bold">{state.pulsePressure} mmHg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline Scenario Quick Comparison */}
      <div className="pt-2">
        <BaselineComparison
          currentState={state}
          baseline={baseline}
          onSaveBaseline={onSaveBaseline}
          onRestoreBaseline={onRestoreBaseline}
          onResetToDefaults={onResetAll}
          onNotify={onNotify}
          isDark={isDark}
        />
      </div>
    </div>
  );
};
