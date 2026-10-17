import React from 'react';
import { SimulationState, BaselineState } from '../../types/cardiac';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Bookmark, 
  RotateCcw, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Trash2,
  Sliders,
  Scale
} from 'lucide-react';

interface BaselineComparisonProps {
  currentState: SimulationState;
  baseline: BaselineState | null;
  onSaveBaseline: () => void;
  onRestoreBaseline: () => void;
  onClearBaseline?: () => void;
  onResetToDefaults: () => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  isDark?: boolean;
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({
  currentState,
  baseline,
  onSaveBaseline,
  onRestoreBaseline,
  onClearBaseline,
  onResetToDefaults,
  onNotify,
  isDark = true,
}) => {
  // Delta calculations
  const hrDiff = baseline ? currentState.heartRate - baseline.heartRate : 0;
  const svDiff = baseline ? currentState.strokeVolume - baseline.strokeVolume : 0;
  const coDiff = baseline ? currentState.cardiacOutput - baseline.cardiacOutput : 0;
  const coPct = baseline && baseline.cardiacOutput > 0 ? (coDiff / baseline.cardiacOutput) * 100 : 0;
  const sbpDiff = baseline ? currentState.systolicBP - baseline.systolicBP : 0;
  const dbpDiff = baseline ? currentState.diastolicBP - baseline.diastolicBP : 0;
  const ppDiff = baseline ? currentState.pulsePressure - baseline.pulsePressure : 0;
  const mapDiff = baseline ? currentState.meanArterialPressure - baseline.meanArterialPressure : 0;

  const renderDeltaBadge = (diff: number, unit: string) => {
    if (Math.abs(diff) < 0.01) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <Minus className="w-3 h-3" /> Baseline Level
        </span>
      );
    }
    const isUp = diff > 0;
    const sign = isUp ? '+' : '';
    const color = isUp ? 'text-cyan-400' : 'text-amber-400';

    return (
      <span className={`flex items-center gap-1 text-[11px] font-mono font-bold ${color}`}>
        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {sign}{diff.toFixed(diff % 1 === 0 ? 0 : 2)} {unit}
      </span>
    );
  };

  const C = {
    bgCard:      isDark ? '#0D1C1A' : '#FFFFFF',
    bgInner:     isDark ? '#081514' : '#F4F7F6',
    bgNested:    isDark ? '#0A1816' : '#FFFFFF',
    text:        isDark ? '#F0FDF4' : '#0F172A',
    textSec:     isDark ? '#8DA9A5' : '#475569',
    textMuted:   isDark ? '#5B7773' : '#8A9FA8',
    border:      isDark ? '#183834' : '#E2E8E5',
    borderSubtle:isDark ? '#142B28' : '#EDF2F0',
    accent:      isDark ? '#10B981' : '#059669',
    green:       isDark ? '#2ED89B' : '#10B981',
    coral:       isDark ? '#F43F5E' : '#E11D48',
  };

  return (
    <div
      style={{
        backgroundColor: C.bgCard,
        borderColor: C.border,
      }}
      className="p-5 rounded-2xl border border-b-[4px] border-b-[#07251f] card-3d shadow-xl space-y-5"
    >
      {/* Top action row */}
      <div
        style={{ borderColor: C.border }}
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
      >
        <div>
          <h3
            style={{ color: C.text }}
            className="text-base font-tech font-bold tracking-wide flex items-center gap-2"
          >
            <Scale className="w-4 h-4" style={{ color: C.accent }} />
            Baseline Scenario Comparison
          </h3>
          <p style={{ color: C.textSec }} className="text-xs">
            Compare hemodynamic modifications against a captured physiological baseline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              onSaveBaseline();
              if (onNotify) onNotify('Saved current simulation state as active baseline snapshot.', 'success');
            }}
            variant="default"
            size="sm"
            className="gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {baseline ? 'Update Baseline' : 'Save As Baseline'}
          </Button>

          {baseline && (
            <>
              <Button
                onClick={() => {
                  onRestoreBaseline();
                  if (onNotify) onNotify('Restored simulation parameters from saved baseline.', 'info');
                }}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" style={{ color: C.accent }} />
                Restore Baseline
              </Button>

              {onClearBaseline && (
                <Button
                  onClick={() => {
                    onClearBaseline();
                    if (onNotify) onNotify('Baseline snapshot cleared.', 'info');
                  }}
                  variant="destructive"
                  size="sm"
                  className="gap-1 h-8 px-2.5"
                  title="Clear baseline snapshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </>
          )}

          <Button
            onClick={() => {
              onResetToDefaults();
              if (onNotify) onNotify('Reset all parameters to physiological defaults (72 BPM, 120/80 mmHg).', 'info');
            }}
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs font-mono"
          >
            Reset Defaults
          </Button>
        </div>
      </div>

      {!baseline ? (
        <div
          style={{
            backgroundColor: C.bgInner,
            borderColor: C.border,
          }}
          className="text-center py-8 border border-dashed rounded-xl p-6"
        >
          <Bookmark className="w-8 h-8 text-emerald-500/70 mx-auto mb-2" />
          <h4 style={{ color: C.text }} className="text-sm font-semibold">No Baseline Snapshot Saved</h4>
          <p style={{ color: C.textSec }} className="text-xs max-w-md mx-auto mt-1 mb-4">
            Click "Save As Baseline" above to bookmark the current heart parameters ({currentState.heartRate} BPM, {currentState.systolicBP}/{currentState.diastolicBP} mmHg), then adjust the sliders to analyze physiological deltas in real-time.
          </p>
          <Button
            onClick={() => {
              onSaveBaseline();
              if (onNotify) onNotify(`Saved baseline snapshot at ${new Date().toLocaleTimeString()}`, 'success');
            }}
            variant="default"
            size="sm"
          >
            Save Current ({currentState.heartRate} BPM / {currentState.systolicBP}/{currentState.diastolicBP} mmHg) as Baseline
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status banner */}
          <div
            style={{
              backgroundColor: C.bgInner,
              borderColor: C.border,
            }}
            className="flex flex-wrap items-center justify-between gap-2 border rounded-xl px-4 py-2.5 text-xs font-mono"
          >
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Baseline Snapshot Active (Saved at {baseline.savedAt})
            </span>
            <span style={{ color: C.textSec }}>
              Baseline: {baseline.heartRate} BPM · SV: {baseline.strokeVolume} mL · CO: {baseline.cardiacOutput.toFixed(2)} L/min · BP: {baseline.systolicBP}/{baseline.diastolicBP}
            </span>
          </div>

          {/* Comparison Matrix Cards - Equal Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cardiac Output Delta */}
            <div
              style={{
                backgroundColor: C.bgInner,
                borderColor: C.border,
              }}
              className="border border-b-[3.5px] border-b-[#07251f] rounded-xl p-4 space-y-2 card-3d h-full flex flex-col justify-between"
            >
              <div className="text-xs font-medium" style={{ color: C.textSec }}>Cardiac Output (CO)</div>
              <div className="flex items-baseline justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono" style={{ color: C.textMuted }}>Baseline: {baseline.cardiacOutput.toFixed(2)} L/min</div>
                  <div className="text-lg font-mono font-bold" style={{ color: C.green }}>
                    {currentState.cardiacOutput.toFixed(2)}{' '}
                    <span className="text-xs font-normal" style={{ color: C.textSec }}>L/min</span>
                  </div>
                </div>
                <div>{renderDeltaBadge(coDiff, 'L/min')}</div>
              </div>
              <div
                style={{ borderColor: C.borderSubtle }}
                className="text-[11px] font-mono border-t pt-2 flex justify-between"
              >
                <span style={{ color: C.textSec }}>Percentage Change:</span>
                <span className={coPct >= 0 ? 'text-[#34D399] font-semibold' : 'text-amber-400 font-semibold'}>
                  {coPct >= 0 ? '+' : ''}{coPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Pulse Pressure Delta */}
            <div
              style={{
                backgroundColor: C.bgInner,
                borderColor: C.border,
              }}
              className="border border-b-[3.5px] border-b-[#07251f] rounded-xl p-4 space-y-2 card-3d h-full flex flex-col justify-between"
            >
              <div className="text-xs font-medium" style={{ color: C.textSec }}>Pulse Pressure (PP)</div>
              <div className="flex items-baseline justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono" style={{ color: C.textMuted }}>Baseline: {baseline.pulsePressure} mmHg</div>
                  <div className="text-lg font-mono font-bold text-[#F43F5E]">
                    {currentState.pulsePressure}{' '}
                    <span className="text-xs font-normal" style={{ color: C.textSec }}>mmHg</span>
                  </div>
                </div>
                <div>{renderDeltaBadge(ppDiff, 'mmHg')}</div>
              </div>
              <div
                style={{ borderColor: C.borderSubtle }}
                className="text-[11px] font-mono border-t pt-2 flex justify-between"
              >
                <span style={{ color: C.textSec }}>Vascular Index:</span>
                <span style={{ color: C.text }} className="font-mono">
                  {currentState.pulsePressure > 50 ? 'Stiff / Elevated' : 'Optimal Elasticity'}
                </span>
              </div>
            </div>

            {/* Mean Arterial Pressure Delta */}
            <div
              style={{
                backgroundColor: C.bgInner,
                borderColor: C.border,
              }}
              className="border border-b-[3.5px] border-b-[#07251f] rounded-xl p-4 space-y-2 card-3d h-full flex flex-col justify-between"
            >
              <div className="text-xs font-medium" style={{ color: C.textSec }}>Mean Arterial Pressure (MAP)</div>
              <div className="flex items-baseline justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono" style={{ color: C.textMuted }}>Baseline: {baseline.meanArterialPressure.toFixed(1)} mmHg</div>
                  <div className="text-lg font-mono font-bold text-[#34D399]">
                    {currentState.meanArterialPressure.toFixed(1)}{' '}
                    <span className="text-xs font-normal" style={{ color: C.textSec }}>mmHg</span>
                  </div>
                </div>
                <div>{renderDeltaBadge(mapDiff, 'mmHg')}</div>
              </div>
              <div
                style={{ borderColor: C.borderSubtle }}
                className="text-[11px] font-mono border-t pt-2 flex justify-between"
              >
                <span style={{ color: C.textSec }}>Perfusion Target:</span>
                <span className="text-emerald-400 font-mono">
                  {currentState.meanArterialPressure >= 65 && currentState.meanArterialPressure <= 105 ? 'Adequate (65-105)' : 'Out of Normal Range'}
                </span>
              </div>
            </div>
          </div>

          {/* Mathematical Step-by-Step Breakdown */}
          <div
            style={{
              backgroundColor: C.bgInner,
              borderColor: C.border,
            }}
            className="border border-b-[3.5px] border-b-[#07251f] rounded-xl p-4 space-y-3 card-3d"
          >
            <h5 className="text-xs font-tech font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Transparent Mathematical Calculations
            </h5>
            <div className="space-y-2 text-xs font-mono" style={{ color: C.text }}>
              <div
                style={{
                  backgroundColor: C.bgNested,
                  borderColor: C.borderSubtle,
                }}
                className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2"
              >
                <span>Cardiac Output Formula:</span>
                <span style={{ color: C.textSec }}>
                  CO = {currentState.heartRate} BPM × {currentState.strokeVolume} mL ÷ 1000 = <strong className="text-emerald-400">{currentState.cardiacOutput.toFixed(2)} L/min</strong>
                  {' '}(vs Baseline {baseline.cardiacOutput.toFixed(2)} L/min &rarr; {coDiff >= 0 ? '+' : ''}{coDiff.toFixed(2)} L/min)
                </span>
              </div>

              <div
                style={{
                  backgroundColor: C.bgNested,
                  borderColor: C.borderSubtle,
                }}
                className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2"
              >
                <span>Pulse Pressure Formula:</span>
                <span style={{ color: C.textSec }}>
                  PP = {currentState.systolicBP} mmHg − {currentState.diastolicBP} mmHg = <strong className="text-[#F43F5E]">{currentState.pulsePressure} mmHg</strong>
                  {' '}(vs Baseline {baseline.pulsePressure} mmHg &rarr; {ppDiff >= 0 ? '+' : ''}{ppDiff} mmHg)
                </span>
              </div>

              <div
                style={{
                  backgroundColor: C.bgNested,
                  borderColor: C.borderSubtle,
                }}
                className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2"
              >
                <span>Mean Arterial Pressure (MAP):</span>
                <span style={{ color: C.textSec }}>
                  MAP = {currentState.diastolicBP} + ({currentState.pulsePressure} ÷ 3) = <strong className="text-[#34D399]">{currentState.meanArterialPressure.toFixed(1)} mmHg</strong>
                  {' '}(vs Baseline {baseline.meanArterialPressure.toFixed(1)} mmHg &rarr; {mapDiff >= 0 ? '+' : ''}{mapDiff.toFixed(1)} mmHg)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
