import React, { useState } from 'react';
import { HistoryDataPoint } from '../../types/cardiac';
import { LineChart, BarChart2, TrendingUp, Clock, Info, Download, Copy, Check, RotateCcw } from 'lucide-react';

interface CardiovascularChartsProps {
  history: HistoryDataPoint[];
  currentHR: number;
  currentCO: number;
  currentSBP: number;
  currentDBP: number;
  onClearHistory: () => void;
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning') => void;
  isDark?: boolean;
}

export const CardiovascularCharts: React.FC<CardiovascularChartsProps> = ({
  history,
  currentHR,
  currentCO,
  currentSBP,
  currentDBP,
  onClearHistory,
  onNotify,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<'bp' | 'co' | 'hr'>('bp');
  const [hoveredPoint, setHoveredPoint] = useState<HistoryDataPoint | null>(null);
  const [copied, setCopied] = useState(false);

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
    gridLine: isDark ? '#142B28' : '#E2E8E5',
  };

  // Take the most recent 35 history points
  const points = history.slice(-35);

  // Chart Dimensions
  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Statistical calculations for active metric
  const getStats = () => {
    if (points.length === 0) return { min: 0, max: 0, avg: 0 };
    let values: number[] = [];
    if (activeTab === 'bp') {
      values = points.map((p) => p.systolicBP);
    } else if (activeTab === 'co') {
      values = points.map((p) => p.cardiacOutput);
    } else {
      values = points.map((p) => p.heartRate);
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg };
  };

  const stats = getStats();

  const handleExportCSV = () => {
    if (points.length === 0) return;
    const header = 'Timestamp,Time,HeartRate_BPM,CardiacOutput_Lmin,SystolicBP_mmHg,DiastolicBP_mmHg,PulsePressure_mmHg,MAP_mmHg\n';
    const rows = points
      .map(
        (p) =>
          `${p.timestamp},"${p.time}",${p.heartRate},${p.cardiacOutput.toFixed(2)},${p.systolicBP},${p.diastolicBP},${p.pulsePressure},${p.meanArterialPressure.toFixed(1)}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardiac_simulation_telemetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Exported telemetry dataset to CSV file.', 'success');
  };

  const handleCopySummary = () => {
    const text = `Cardiac AI 3D Simulation Summary:
Current HR: ${currentHR} BPM
Current CO: ${currentCO.toFixed(2)} L/min
Current BP: ${currentSBP}/${currentDBP} mmHg (Pulse Pressure: ${currentSBP - currentDBP} mmHg, MAP: ${(currentDBP + (currentSBP - currentDBP) / 3).toFixed(1)} mmHg)
Captured History Samples: ${points.length}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onNotify) onNotify('Copied telemetry summary to clipboard.', 'success');
  };

  // Render SVG Paths
  const renderBPChart = () => {
    if (points.length < 2) return null;
    const minVal = 40;
    const maxVal = 220;

    const getY = (val: number) =>
      padding.top + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    const getX = (idx: number) =>
      padding.left + (idx / (points.length - 1)) * graphWidth;

    const sysPath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.systolicBP)}`)
      .join(' ');

    const diaPath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.diastolicBP)}`)
      .join(' ');

    const reverseDia = [...points]
      .reverse()
      .map((p, i) => `L ${getX(points.length - 1 - i)} ${getY(p.diastolicBP)}`)
      .join(' ');
    const areaPath = `${sysPath} ${reverseDia} Z`;

    return (
      <g>
        <path d={areaPath} fill={isDark ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.06)'} />
        <path d={sysPath} fill="none" stroke={C.coral} strokeWidth="2.5" />
        <path d={diaPath} fill="none" stroke={C.mint} strokeWidth="2.5" />

        {points.map((p, i) => (
          <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(p)}>
            <circle cx={getX(i)} cy={getY(p.systolicBP)} r="3" fill={C.coral} />
            <circle cx={getX(i)} cy={getY(p.diastolicBP)} r="3" fill={C.mint} />
          </g>
        ))}
      </g>
    );
  };

  const renderCOChart = () => {
    if (points.length < 2) return null;
    const minVal = 2.0;
    const maxVal = 16.0;

    const getY = (val: number) =>
      padding.top + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    const getX = (idx: number) =>
      padding.left + (idx / (points.length - 1)) * graphWidth;

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.cardiacOutput)}`)
      .join(' ');

    const areaPath = `${linePath} L ${getX(points.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`;

    return (
      <g>
        <path d={areaPath} fill={isDark ? 'rgba(39,176,125,0.14)' : 'rgba(39,176,125,0.08)'} />
        <path d={linePath} fill="none" stroke={C.accent} strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(p.cardiacOutput)}
            r="3"
            fill={C.accent}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(p)}
          />
        ))}
      </g>
    );
  };

  const renderHRChart = () => {
    if (points.length < 2) return null;
    const minVal = 40;
    const maxVal = 190;

    const getY = (val: number) =>
      padding.top + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    const getX = (idx: number) =>
      padding.left + (idx / (points.length - 1)) * graphWidth;

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.heartRate)}`)
      .join(' ');

    const areaPath = `${linePath} L ${getX(points.length - 1)} ${padding.top + graphHeight} L ${getX(0)} ${padding.top + graphHeight} Z`;

    return (
      <g>
        <path d={areaPath} fill={isDark ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.07)'} />
        <path d={linePath} fill="none" stroke={C.coral} strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(p.heartRate)}
            r="3"
            fill={C.coral}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(p)}
          />
        ))}
      </g>
    );
  };

  return (
    <div
      style={{ backgroundColor: C.bgCard, borderColor: C.border }}
      className="border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl p-5 shadow-xl space-y-4 transition-colors duration-300"
    >
      {/* Header and selector */}
      <div
        style={{ borderBottomColor: C.borderSubtle }}
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: C.accent }} />
          <div>
            <h3 style={{ color: C.textPrimary }} className="text-base font-tech font-bold tracking-wide">
              Hemodynamic Trend Monitors
            </h3>
            <p style={{ color: C.textSecondary }} className="text-xs">
              Live parameter tracking over simulation adjustments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab buttons */}
          <div
            style={{ backgroundColor: C.bgInput, borderColor: C.border }}
            className="flex items-center p-1 rounded-xl border text-xs font-mono"
          >
            <button
              onClick={() => setActiveTab('bp')}
              style={{
                backgroundColor: activeTab === 'bp' ? (isDark ? 'rgba(244,63,94,0.2)' : '#FFE4E6') : 'transparent',
                color: activeTab === 'bp' ? C.coral : C.textSecondary,
                borderColor: activeTab === 'bp' ? C.coral : 'transparent',
              }}
              className="px-3 py-1 rounded-lg border transition cursor-pointer font-bold"
            >
              BP Trend
            </button>
            <button
              onClick={() => setActiveTab('co')}
              style={{
                backgroundColor: activeTab === 'co' ? (isDark ? 'rgba(39,176,125,0.2)' : '#E6F7F0') : 'transparent',
                color: activeTab === 'co' ? C.accent : C.textSecondary,
                borderColor: activeTab === 'co' ? C.accent : 'transparent',
              }}
              className="px-3 py-1 rounded-lg border transition cursor-pointer font-bold"
            >
              Cardiac Output
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              style={{
                backgroundColor: activeTab === 'hr' ? (isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7') : 'transparent',
                color: activeTab === 'hr' ? '#F59E0B' : C.textSecondary,
                borderColor: activeTab === 'hr' ? '#F59E0B' : 'transparent',
              }}
              className="px-3 py-1 rounded-lg border transition cursor-pointer font-bold"
            >
              Heart Rate
            </button>
          </div>

          {/* Action buttons: Export CSV, Copy Summary, Clear */}
          <button
            onClick={handleExportCSV}
            title="Download Telemetry History as CSV"
            style={{ backgroundColor: C.bgInput, borderColor: C.border, color: C.textSecondary }}
            className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-xl border hover:opacity-80 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handleCopySummary}
            title="Copy Telemetry Summary to Clipboard"
            style={{ backgroundColor: C.bgInput, borderColor: C.border, color: C.textSecondary }}
            className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-xl border hover:opacity-80 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: C.mint }} /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            onClick={() => {
              onClearHistory();
              if (onNotify) onNotify('Historical trend buffer cleared.', 'info');
            }}
            title="Clear Historical Tracking Buffer"
            style={{ backgroundColor: C.bgInput, borderColor: C.border, color: C.textMuted }}
            className="text-xs font-mono px-2 py-1.5 rounded-xl border hover:opacity-80 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Statistical Summary Bar */}
      <div
        style={{ backgroundColor: C.bgNested, borderColor: C.border }}
        className="border rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
      >
        <div className="flex items-center gap-4" style={{ color: C.textSecondary }}>
          <span>
            Min: <strong style={{ color: C.textPrimary }}>{stats.min.toFixed(activeTab === 'co' ? 2 : 0)}</strong>
          </span>
          <span style={{ color: C.borderSubtle }}>|</span>
          <span>
            Avg: <strong style={{ color: C.accent }}>{stats.avg.toFixed(activeTab === 'co' ? 2 : 0)}</strong>
          </span>
          <span style={{ color: C.borderSubtle }}>|</span>
          <span>
            Max: <strong style={{ color: C.coral }}>{stats.max.toFixed(activeTab === 'co' ? 2 : 0)}</strong>
          </span>
        </div>
        <div style={{ color: C.textMuted }} className="text-[11px]">
          Tracking interval: ~1 sample / parameter update
        </div>
      </div>

      {/* Main Chart SVG */}
      <div
        style={{ backgroundColor: C.bgInput, borderColor: C.border }}
        className="relative border rounded-xl p-2 overflow-x-auto"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines and Y-axis marks */}
          {activeTab === 'bp' && (
            <>
              {[60, 100, 140, 180, 220].map((v) => {
                const y = padding.top + graphHeight - ((v - 40) / (220 - 40)) * graphHeight;
                return (
                  <g key={v}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={C.gridLine} strokeDasharray="3 3" />
                    <text x={padding.left - 8} y={y + 3} textAnchor="end" fill={C.textMuted} fontSize="9" fontFamily="monospace">
                      {v}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {activeTab === 'co' && (
            <>
              {[3, 6, 9, 12, 15].map((v) => {
                const y = padding.top + graphHeight - ((v - 2.0) / (16.0 - 2.0)) * graphHeight;
                return (
                  <g key={v}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={C.gridLine} strokeDasharray="3 3" />
                    <text x={padding.left - 8} y={y + 3} textAnchor="end" fill={C.textMuted} fontSize="9" fontFamily="monospace">
                      {v} L
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {activeTab === 'hr' && (
            <>
              {[60, 90, 120, 150, 180].map((v) => {
                const y = padding.top + graphHeight - ((v - 40) / (190 - 40)) * graphHeight;
                return (
                  <g key={v}>
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={C.gridLine} strokeDasharray="3 3" />
                    <text x={padding.left - 8} y={y + 3} textAnchor="end" fill={C.textMuted} fontSize="9" fontFamily="monospace">
                      {v}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Active Chart Line */}
          {activeTab === 'bp' && renderBPChart()}
          {activeTab === 'co' && renderCOChart()}
          {activeTab === 'hr' && renderHRChart()}

          {/* X Axis Time Labels */}
          {points.length > 0 && (
            <>
              <text x={padding.left} y={height - 10} fill={C.textMuted} fontSize="9" fontFamily="monospace">
                {points[0].time}
              </text>
              <text x={width - padding.right} y={height - 10} textAnchor="end" fill={C.textMuted} fontSize="9" fontFamily="monospace">
                {points[points.length - 1].time}
              </text>
            </>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            style={{ backgroundColor: C.bgCard, borderColor: C.accent, color: C.textPrimary }}
            className="absolute top-4 right-4 border rounded-xl p-3 shadow-2xl text-xs font-mono space-y-1"
          >
            <div
              style={{ borderBottomColor: C.borderSubtle, color: C.textMuted }}
              className="text-[10px] flex items-center gap-1 border-b pb-1"
            >
              <Clock className="w-3 h-3" style={{ color: C.accent }} />
              Time: {hoveredPoint.time}
            </div>
            <div className="font-bold">
              HR: <span style={{ color: C.coral }}>{hoveredPoint.heartRate} BPM</span>
            </div>
            <div>
              CO: <span style={{ color: C.accent }}>{hoveredPoint.cardiacOutput.toFixed(2)} L/min</span>
            </div>
            <div>
              BP: <span style={{ color: C.coral }}>{hoveredPoint.systolicBP}</span> / <span style={{ color: C.mint }}>{hoveredPoint.diastolicBP} mmHg</span>
            </div>
            <div style={{ color: C.textMuted }} className="text-[10px]">
              Pulse Pressure: {hoveredPoint.pulsePressure} mmHg
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary Info */}
      <div
        style={{ color: C.textSecondary }}
        className="flex flex-wrap items-center justify-between text-xs font-mono pt-1"
      >
        {activeTab === 'bp' && (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full" style={{ backgroundColor: C.coral }} />
              Systolic Pressure (Current: {currentSBP} mmHg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full" style={{ backgroundColor: C.mint }} />
              Diastolic Pressure (Current: {currentDBP} mmHg)
            </span>
            <span className="flex items-center gap-1.5" style={{ color: C.textMuted }}>
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.1)' }}
              />
              Pulse Pressure Envelope
            </span>
          </div>
        )}

        {activeTab === 'co' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full" style={{ backgroundColor: C.accent }} />
            <span>Cardiac Output (L/min) · Current: {currentCO.toFixed(2)} L/min</span>
          </div>
        )}

        {activeTab === 'hr' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded-full" style={{ backgroundColor: C.coral }} />
            <span>Heart Rate (BPM) · Current: {currentHR} BPM</span>
          </div>
        )}

        <div style={{ color: C.textMuted }} className="text-[11px]">
          Showing {points.length} captured snapshots
        </div>
      </div>
    </div>
  );
};
