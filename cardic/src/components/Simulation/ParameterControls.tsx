import React, { useState } from 'react';
import { SimulationState, PRESET_SCENARIOS } from '../../types/cardiac';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Gauge, 
  Heart, 
  Droplets, 
  BookOpen, 
  Plus, 
  Minus, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ParameterControlsProps {
  state: SimulationState;
  onUpdateParam: (key: keyof SimulationState, value: number) => void;
  onResetParam: (key: keyof SimulationState) => void;
  onResetAll: () => void;
  onLoadScenario: (scenarioState: Partial<SimulationState>) => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  isDark?: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  state,
  onUpdateParam,
  onResetParam,
  onResetAll,
  onLoadScenario,
  onNotify,
  isDark = true,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const C = {
    bgCard: isDark ? '#0D1C1A' : '#FFFFFF',
    bgInput: isDark ? '#081514' : '#F4F7F6',
    bgNested: isDark ? '#081514' : '#F8FAF9',
    border: isDark ? '#183834' : '#E2E8E5',
    borderSubtle: isDark ? '#142B28' : '#EDF2F0',
    textPrimary: isDark ? '#F0FDF4' : '#0F172A',
    textSecondary: isDark ? '#8DA9A5' : '#475569',
    textMuted: isDark ? '#5B7773' : '#8A9FA8',
    accent: isDark ? '#10B981' : '#059669',
    mint: isDark ? '#2ED89B' : '#10B981',
    coral: isDark ? '#F43F5E' : '#E11D48',
  };

  const defaultValues = {
    heartRate: 72,
    strokeVolume: 70,
    systolicBP: 120,
    diastolicBP: 80,
    bloodVolume: 5.0,
  };

  const handleSystolicChange = (val: number) => {
    const clamped = Math.max(80, Math.min(220, val));
    onUpdateParam('systolicBP', clamped);
    if (clamped <= state.diastolicBP + 10) {
      onUpdateParam('diastolicBP', Math.max(40, clamped - 15));
    }
  };

  const handleDiastolicChange = (val: number) => {
    const clamped = Math.max(40, Math.min(130, val));
    onUpdateParam('diastolicBP', clamped);
    if (clamped >= state.systolicBP - 10) {
      onUpdateParam('systolicBP', Math.min(220, clamped + 15));
    }
  };

  const stepParam = (key: keyof SimulationState, delta: number, min: number, max: number) => {
    const current = Number(state[key]);
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 10) / 10));
    if (key === 'systolicBP') {
      handleSystolicChange(next);
    } else if (key === 'diastolicBP') {
      handleDiastolicChange(next);
    } else {
      onUpdateParam(key, next);
    }
  };

  // Helper to determine clinical status of current values
  const getHRStatus = (bpm: number) => {
    if (bpm < 60) return { label: 'Sinus Bradycardia (<60)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (bpm > 100) return { label: 'Sinus Tachycardia (>100)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    return { label: 'Normal Sinus Rhythm (60–100)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const getBPStatus = (sbp: number, dbp: number) => {
    if (sbp < 90 || dbp < 60) return { label: 'Hypotension (<90/<60)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (sbp >= 140 || dbp >= 90) return { label: 'Stage 2 Hypertension (≥140/90)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (sbp >= 130 || dbp >= 80) return { label: 'Stage 1 Hypertension (130–139)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (sbp >= 120 && dbp < 80) return { label: 'Elevated Systolic (120–129)', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    return { label: 'Optimal Normotensive (<120/<80)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const hrStatus = getHRStatus(state.heartRate);
  const bpStatus = getBPStatus(state.systolicBP, state.diastolicBP);

  return (
    <div
      style={{ backgroundColor: C.bgCard, borderColor: C.border }}
      className="p-5 rounded-2xl border border-b-[4px] border-b-[#07251f] card-3d shadow-xl space-y-6 transition-colors duration-300"
    >
      {/* Header with Global Reset */}
      <div
        style={{ borderBottomColor: C.border }}
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
      >
        <div>
          <h3
            style={{ color: C.textPrimary }}
            className="text-base font-tech font-bold tracking-wide flex items-center gap-2"
          >
            <Activity className="w-4 h-4" style={{ color: C.accent }} />
            Cardiovascular Parameter Controls
          </h3>
          <p style={{ color: C.textSecondary }} className="text-xs">
            Interactive slider & direct numeric controls with real-time hemodynamic calculation
          </p>
        </div>
        <Button
          onClick={() => {
            onResetAll();
            if (onNotify) onNotify('Restored all parameters to baseline physiological defaults (72 BPM, 120/80 mmHg)', 'info');
          }}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" style={{ color: C.accent }} />
          Reset Defaults
        </Button>
      </div>

      {/* Preset Scenarios selector */}
      <div className="space-y-2">
        <label
          style={{ color: C.textSecondary }}
          className="text-xs font-mono uppercase tracking-wider flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" style={{ color: C.accent }} />
            Quick Clinical & Physiological Scenarios:
          </span>
          <span style={{ color: C.textMuted }} className="text-[11px] font-normal">
            Click to load scenario
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_SCENARIOS.map((scenario) => {
            const isMatch =
              state.heartRate === scenario.state.heartRate &&
              state.strokeVolume === scenario.state.strokeVolume &&
              state.systolicBP === scenario.state.systolicBP &&
              state.diastolicBP === scenario.state.diastolicBP;

            return (
              <button
                key={scenario.name}
                onClick={() => {
                  onLoadScenario(scenario.state);
                  if (onNotify) onNotify(`Loaded scenario: ${scenario.name}`, 'success');
                }}
                style={{
                  backgroundColor: isMatch ? (isDark ? 'rgba(16,185,129,0.18)' : '#E6F7F0') : C.bgNested,
                  borderColor: isMatch ? C.accent : C.border,
                }}
                className={`text-left p-3 rounded-xl border border-b-[3px] border-b-[#07241e] card-3d h-[74px] flex flex-col justify-between transition cursor-pointer group relative ${isMatch ? 'ring-1 ring-emerald-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div
                    style={{ color: isMatch ? C.accent : C.textPrimary }}
                    className="text-[11px] font-semibold leading-tight line-clamp-1"
                  >
                    {scenario.name.split(' (')[0]}
                  </div>
                  {isMatch && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: C.accent }} />}
                </div>
                <div style={{ color: C.textMuted }} className="text-[10px] font-mono">
                  {scenario.state.heartRate} BPM · {scenario.state.systolicBP}/{scenario.state.diastolicBP} mmHg
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders & Numeric Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Heart Rate */}
        <div
          style={{ backgroundColor: C.bgNested, borderColor: C.border }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d p-4 rounded-xl h-full min-h-[175px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textPrimary }} className="text-xs font-semibold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" style={{ color: C.coral }} />
              Heart Rate (HR)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${hrStatus.color}`}>
              {hrStatus.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="40"
              max="180"
              step="1"
              value={state.heartRate}
              onChange={(e) => onUpdateParam('heartRate', parseInt(e.target.value, 10))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: C.coral }}
            />
            {/* Direct Numeric Input with Step Buttons */}
            <div
              style={{ backgroundColor: C.bgInput, borderColor: C.border }}
              className="flex items-center gap-1 border rounded-lg p-0.5"
            >
              <button
                onClick={() => stepParam('heartRate', -5, 40, 180)}
                title="Decrease 5 BPM"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="40"
                max="180"
                value={state.heartRate}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) onUpdateParam('heartRate', Math.max(40, Math.min(180, val)));
                }}
                style={{ color: C.coral }}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm outline-none"
              />
              <button
                onClick={() => stepParam('heartRate', 5, 40, 180)}
                title="Increase 5 BPM"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span style={{ color: C.textSecondary }} className="text-[11px] font-mono w-8">BPM</span>
          </div>

          <div
            style={{ borderTopColor: C.borderSubtle, color: C.textMuted }}
            className="flex justify-between items-center text-[10px] font-mono border-t pt-1.5"
          >
            <span>Range: 40–180 BPM</span>
            {state.heartRate !== defaultValues.heartRate && (
              <button
                onClick={() => onResetParam('heartRate')}
                style={{ color: C.accent }}
                className="flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset (72)
              </button>
            )}
          </div>
        </div>

        {/* Stroke Volume */}
        <div
          style={{ backgroundColor: C.bgNested, borderColor: C.border }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d p-4 rounded-xl h-full min-h-[175px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textPrimary }} className="text-xs font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" style={{ color: C.accent }} />
              Stroke Volume (SV)
            </span>
            <span
              style={{
                borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
                backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
                color: C.accent,
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
            >
              {state.strokeVolume >= 65 && state.strokeVolume <= 85 ? 'Standard Ejection (70 mL)' : 'Dynamic Adjusted'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="40"
              max="140"
              step="1"
              value={state.strokeVolume}
              onChange={(e) => onUpdateParam('strokeVolume', parseInt(e.target.value, 10))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: C.accent }}
            />
            <div
              style={{ backgroundColor: C.bgInput, borderColor: C.border }}
              className="flex items-center gap-1 border rounded-lg p-0.5"
            >
              <button
                onClick={() => stepParam('strokeVolume', -5, 40, 140)}
                title="Decrease 5 mL"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="40"
                max="140"
                value={state.strokeVolume}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) onUpdateParam('strokeVolume', Math.max(40, Math.min(140, val)));
                }}
                style={{ color: C.accent }}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm outline-none"
              />
              <button
                onClick={() => stepParam('strokeVolume', 5, 40, 140)}
                title="Increase 5 mL"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span style={{ color: C.textSecondary }} className="text-[11px] font-mono w-8">mL</span>
          </div>

          <div
            style={{ borderTopColor: C.borderSubtle, color: C.textMuted }}
            className="flex justify-between items-center text-[10px] font-mono border-t pt-1.5"
          >
            <span>Range: 40–140 mL/beat</span>
            {state.strokeVolume !== defaultValues.strokeVolume && (
              <button
                onClick={() => onResetParam('strokeVolume')}
                style={{ color: C.accent }}
                className="flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset (70)
              </button>
            )}
          </div>
        </div>

        {/* Systolic Blood Pressure */}
        <div
          style={{ backgroundColor: C.bgNested, borderColor: C.border }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d p-4 rounded-xl h-full min-h-[175px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textPrimary }} className="text-xs font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" style={{ color: C.coral }} />
              Systolic Blood Pressure (SBP)
            </span>
            <span style={{ color: C.textMuted }} className="text-[10px] font-mono">
              Peak Ventricular Ejection
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="80"
              max="220"
              step="1"
              value={state.systolicBP}
              onChange={(e) => handleSystolicChange(parseInt(e.target.value, 10))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: C.coral }}
            />
            <div
              style={{ backgroundColor: C.bgInput, borderColor: C.border }}
              className="flex items-center gap-1 border rounded-lg p-0.5"
            >
              <button
                onClick={() => stepParam('systolicBP', -5, 80, 220)}
                title="Decrease 5 mmHg"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="80"
                max="220"
                value={state.systolicBP}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleSystolicChange(val);
                }}
                style={{ color: C.coral }}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm outline-none"
              />
              <button
                onClick={() => stepParam('systolicBP', 5, 80, 220)}
                title="Increase 5 mmHg"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span style={{ color: C.textSecondary }} className="text-[11px] font-mono w-8">mmHg</span>
          </div>

          <div
            style={{ borderTopColor: C.borderSubtle, color: C.textMuted }}
            className="flex justify-between items-center text-[10px] font-mono border-t pt-1.5"
          >
            <span>Range: 80–220 mmHg</span>
            {state.systolicBP !== defaultValues.systolicBP && (
              <button
                onClick={() => onResetParam('systolicBP')}
                style={{ color: C.accent }}
                className="flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset (120)
              </button>
            )}
          </div>
        </div>

        {/* Diastolic Blood Pressure */}
        <div
          style={{ backgroundColor: C.bgNested, borderColor: C.border }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d p-4 rounded-xl h-full min-h-[175px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textPrimary }} className="text-xs font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" style={{ color: C.mint }} />
              Diastolic Blood Pressure (DBP)
            </span>
            <span style={{ color: C.textMuted }} className="text-[10px] font-mono">
              Resting Vascular Runoff
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="40"
              max="130"
              step="1"
              value={state.diastolicBP}
              onChange={(e) => handleDiastolicChange(parseInt(e.target.value, 10))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: C.mint }}
            />
            <div
              style={{ backgroundColor: C.bgInput, borderColor: C.border }}
              className="flex items-center gap-1 border rounded-lg p-0.5"
            >
              <button
                onClick={() => stepParam('diastolicBP', -5, 40, 130)}
                title="Decrease 5 mmHg"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="40"
                max="130"
                value={state.diastolicBP}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleDiastolicChange(val);
                }}
                style={{ color: C.mint }}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm outline-none"
              />
              <button
                onClick={() => stepParam('diastolicBP', 5, 40, 130)}
                title="Increase 5 mmHg"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span style={{ color: C.textSecondary }} className="text-[11px] font-mono w-8">mmHg</span>
          </div>

          <div
            style={{ borderTopColor: C.borderSubtle, color: C.textMuted }}
            className="flex justify-between items-center text-[10px] font-mono border-t pt-1.5"
          >
            <span>Range: 40–130 mmHg</span>
            {state.diastolicBP !== defaultValues.diastolicBP && (
              <button
                onClick={() => onResetParam('diastolicBP')}
                style={{ color: C.accent }}
                className="flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset (80)
              </button>
            )}
          </div>
        </div>

        {/* Blood Volume */}
        <div
          style={{ backgroundColor: C.bgNested, borderColor: C.border }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d p-4 rounded-xl md:col-span-2 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: C.textPrimary }} className="text-xs font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" style={{ color: C.accent }} />
              Circulating Blood Volume (Illustrative)
            </span>
            <span
              style={{
                borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
                backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
                color: C.accent,
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
            >
              {state.bloodVolume < 4.2 ? 'Hypovolemic' : state.bloodVolume > 5.8 ? 'Hypervolemic' : 'Euvolemic (Standard 5.0 L)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="3.0"
              max="7.0"
              step="0.1"
              value={state.bloodVolume}
              onChange={(e) => onUpdateParam('bloodVolume', parseFloat(e.target.value))}
              className="flex-1 cursor-pointer"
              style={{ accentColor: C.accent }}
            />
            <div
              style={{ backgroundColor: C.bgInput, borderColor: C.border }}
              className="flex items-center gap-1 border rounded-lg p-0.5"
            >
              <button
                onClick={() => stepParam('bloodVolume', -0.2, 3.0, 7.0)}
                title="Decrease 0.2 L"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="3.0"
                max="7.0"
                step="0.1"
                value={state.bloodVolume.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onUpdateParam('bloodVolume', Math.max(3.0, Math.min(7.0, val)));
                }}
                style={{ color: C.accent }}
                className="w-14 bg-transparent text-center font-mono font-bold text-sm outline-none"
              />
              <button
                onClick={() => stepParam('bloodVolume', 0.2, 3.0, 7.0)}
                title="Increase 0.2 L"
                style={{ color: C.textSecondary }}
                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80 cursor-pointer text-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span style={{ color: C.textSecondary }} className="text-[11px] font-mono w-8">Liters</span>
          </div>

          <div
            style={{ borderTopColor: C.borderSubtle, color: C.textMuted }}
            className="flex justify-between items-center text-[10px] font-mono border-t pt-1.5"
          >
            <span>Illustrative range: 3.0–7.0 L (approx. 7% of total adult body weight)</span>
            {state.bloodVolume !== defaultValues.bloodVolume && (
              <button
                onClick={() => onResetParam('bloodVolume')}
                style={{ color: C.accent }}
                className="flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset (5.0 L)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calculated Hemodynamics Output Bar */}
      <div
        style={{
          backgroundColor: C.bgNested,
          borderColor: C.border,
        }}
        className="border border-b-[3.5px] border-b-[#07251f] card-3d rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h4
            style={{ color: C.accent }}
            className="text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Automatic Hemodynamic Calculations
          </h4>
          <span style={{ color: C.textMuted }} className="text-[10px] font-mono">
            Live Mathematical Outputs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center items-stretch">
          <div
            style={{ backgroundColor: C.bgCard, borderColor: C.border }}
            className="border border-b-[3px] border-b-[#07251f] card-3d rounded-xl p-3.5 h-full flex flex-col justify-between shadow-sm"
          >
            <div style={{ color: C.textSecondary }} className="text-[11px] font-mono">Cardiac Output (CO)</div>
            <div style={{ color: C.textPrimary }} className="text-2xl font-mono font-bold my-1">
              {state.cardiacOutput.toFixed(2)}{' '}
              <span style={{ color: C.textMuted }} className="text-xs font-normal">L/min</span>
            </div>
            <div style={{ color: C.textMuted }} className="text-[10px] font-mono">
              HR ({state.heartRate}) × SV ({state.strokeVolume}) ÷ 1000
            </div>
          </div>

          <div
            style={{ backgroundColor: C.bgCard, borderColor: C.border }}
            className="border border-b-[3px] border-b-[#07251f] card-3d rounded-xl p-3.5 h-full flex flex-col justify-between shadow-sm"
          >
            <div style={{ color: C.textSecondary }} className="text-[11px] font-mono">Pulse Pressure (PP)</div>
            <div style={{ color: C.coral }} className="text-2xl font-mono font-bold my-1">
              {state.pulsePressure}{' '}
              <span style={{ color: C.textMuted }} className="text-xs font-normal">mmHg</span>
            </div>
            <div style={{ color: C.textMuted }} className="text-[10px] font-mono">
              SBP ({state.systolicBP}) − DBP ({state.diastolicBP})
            </div>
          </div>

          <div
            style={{ backgroundColor: C.bgCard, borderColor: C.border }}
            className="border border-b-[3px] border-b-[#07251f] card-3d rounded-xl p-3.5 h-full flex flex-col justify-between shadow-sm"
          >
            <div style={{ color: C.textSecondary }} className="text-[11px] font-mono">Mean Arterial Pressure (MAP)</div>
            <div style={{ color: C.accent }} className="text-2xl font-mono font-bold my-1">
              {state.meanArterialPressure.toFixed(1)}{' '}
              <span style={{ color: C.textMuted }} className="text-xs font-normal">mmHg</span>
            </div>
            <div style={{ color: C.textMuted }} className="text-[10px] font-mono">
              DBP ({state.diastolicBP}) + (PP ({state.pulsePressure}) ÷ 3)
            </div>
          </div>
        </div>
      </div>

      {/* Educational Disclaimer Footer */}
      <div
        style={{
          backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)',
          borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.3)',
        }}
        className="flex items-start gap-2.5 text-[11px] rounded-xl p-3 border"
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p style={{ color: C.textSecondary }}>
          <span className="font-semibold text-amber-400">Educational Simulation Disclaimer:</span> These calculations implement foundational physiological formulas for interactive study. Circulating blood volume is illustrative. This system does not model individual patient clinical complexities or provide diagnostic predictions.
        </p>
      </div>
    </div>
  );
};
