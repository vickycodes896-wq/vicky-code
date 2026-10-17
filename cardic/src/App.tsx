import React, { useState, useEffect, useRef } from 'react';
import { SimulationState, BaselineState, HistoryDataPoint } from './types/cardiac';
import { OverviewTab } from './components/Dashboard/OverviewTab';
import { HeartScene } from './components/Heart/HeartScene';
import { ParameterControls } from './components/Simulation/ParameterControls';
import { BaselineComparison } from './components/Simulation/BaselineComparison';
import { ECGMonitor } from './components/ECG/ECGMonitor';
import { CardiovascularCharts } from './components/Charts/CardiovascularCharts';
import { BloodFlowDiagram } from './components/BloodFlow/BloodFlowDiagram';
import { CardioAIAssistant } from './components/AI/CardioAIAssistant';
import { AboutSection } from './components/About/AboutSection';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from './components/ui/sidebar';
import { cn } from './lib/utils';

import {
  Heart,
  Activity,
  Layers,
  HelpCircle,
  RotateCcw,
  Play,
  Pause,
  Bookmark,
  TrendingUp,
  Droplets,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  MessageCircle,
  Sun,
  Moon,
} from 'lucide-react';

const INITIAL_SIMULATION_STATE: SimulationState = {
  heartRate: 72,
  strokeVolume: 70,
  systolicBP: 120,
  diastolicBP: 80,
  bloodVolume: 5.0,
  cardiacOutput: (72 * 70) / 1000,
  pulsePressure: 120 - 80,
  meanArterialPressure: 80 + (120 - 80) / 3,
  isPlaying: true,
  bloodFlowVisible: true,
  bloodFlowSpeed: 1.0,
  showLabels: true,
  viewMode: 'standard',
  activeChamber: null,
  audioBeepEnabled: false,
};

// ─── Theme Toggle Component (Magic UI style) ──────────────────────────────────
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="theme-toggle-btn"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      id="theme-toggle"
    >
      <span className="theme-toggle-thumb">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'heart' | 'simulation' | 'ecg' | 'flow' | 'qa' | 'about'>('overview');
  const [simulationState, setSimulationState] = useState<SimulationState>(INITIAL_SIMULATION_STATE);
  const [baseline, setBaseline] = useState<BaselineState | null>(null);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);
  const [isDark, setIsDark] = useState(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Apply theme to <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const notify = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const updateSimulationParam = (key: keyof SimulationState, value: any) => {
    setSimulationState((prev) => {
      const next = { ...prev, [key]: value };
      const co = (next.heartRate * next.strokeVolume) / 1000;
      const pp = next.systolicBP - next.diastolicBP;
      const map = next.diastolicBP + pp / 3;
      next.cardiacOutput = co;
      next.pulsePressure = pp;
      next.meanArterialPressure = map;
      return next;
    });
  };

  const resetSingleParam = (key: keyof SimulationState) => {
    const defaults: Record<string, number> = {
      heartRate: 72,
      strokeVolume: 70,
      systolicBP: 120,
      diastolicBP: 80,
      bloodVolume: 5.0,
    };
    if (key in defaults) {
      updateSimulationParam(key, defaults[key]);
      notify(`Reset ${String(key)} to normal baseline.`, 'info');
    }
  };

  const resetAllToDefaults = () => {
    setSimulationState((prev) => ({
      ...prev,
      heartRate: 72,
      strokeVolume: 70,
      systolicBP: 120,
      diastolicBP: 80,
      bloodVolume: 5.0,
      cardiacOutput: 5.04,
      pulsePressure: 40,
      meanArterialPressure: 93.33,
      isPlaying: true,
      bloodFlowVisible: true,
      bloodFlowSpeed: 1.0,
      viewMode: 'standard',
      activeChamber: null,
    }));
    notify('Reset to normal values: 72 BPM, 120/80 mmHg.', 'success');
  };

  const loadScenario = (scenarioState: Partial<SimulationState>) => {
    setSimulationState((prev) => {
      const next = { ...prev, ...scenarioState };
      const co = (next.heartRate * next.strokeVolume) / 1000;
      const pp = next.systolicBP - next.diastolicBP;
      const map = next.diastolicBP + pp / 3;
      next.cardiacOutput = co;
      next.pulsePressure = pp;
      next.meanArterialPressure = map;
      return next;
    });
  };

  const saveBaseline = () => {
    setBaseline({
      heartRate: simulationState.heartRate,
      strokeVolume: simulationState.strokeVolume,
      systolicBP: simulationState.systolicBP,
      diastolicBP: simulationState.diastolicBP,
      bloodVolume: simulationState.bloodVolume,
      cardiacOutput: simulationState.cardiacOutput,
      pulsePressure: simulationState.pulsePressure,
      meanArterialPressure: simulationState.meanArterialPressure,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    notify('Saved current readings as baseline for comparison.', 'success');
  };

  const restoreBaseline = () => {
    if (!baseline) return;
    setSimulationState((prev) => ({
      ...prev,
      heartRate: baseline.heartRate,
      strokeVolume: baseline.strokeVolume,
      systolicBP: baseline.systolicBP,
      diastolicBP: baseline.diastolicBP,
      bloodVolume: baseline.bloodVolume,
      cardiacOutput: baseline.cardiacOutput,
      pulsePressure: baseline.pulsePressure,
      meanArterialPressure: baseline.meanArterialPressure,
    }));
    notify('Restored values from saved baseline.', 'info');
  };

  useEffect(() => {
    const point: HistoryDataPoint = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: Date.now(),
      heartRate: simulationState.heartRate,
      cardiacOutput: simulationState.cardiacOutput,
      systolicBP: simulationState.systolicBP,
      diastolicBP: simulationState.diastolicBP,
      pulsePressure: simulationState.pulsePressure,
      meanArterialPressure: simulationState.meanArterialPressure,
    };
    setHistory((prev) => [...prev.slice(-49), point]);
  }, [
    simulationState.heartRate,
    simulationState.strokeVolume,
    simulationState.systolicBP,
    simulationState.diastolicBP,
  ]);

  interface NavItem {
    id: 'overview' | 'heart' | 'simulation' | 'ecg' | 'flow' | 'qa' | 'about';
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    description: string;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Heart, description: 'Live readings & 3D view', badge: 'Live' },
    { id: 'heart', label: '3D Heart', icon: Layers, description: 'Explore heart anatomy', badge: '3D' },
    { id: 'simulation', label: 'Simulation', icon: Activity, description: 'Adjust heart parameters' },
    { id: 'ecg', label: 'ECG Monitor', icon: TrendingUp, description: 'Real-time ECG waveform', badge: 'Wave' },
    { id: 'flow', label: 'Blood Flow', icon: Droplets, description: 'Circulation walkthrough' },
    { id: 'qa', label: 'Learn & Ask', icon: MessageCircle, description: 'Ask about heart health', badge: 'AI' },
    { id: 'about', label: 'About', icon: HelpCircle, description: 'Project info & formulas' },
  ];

  const currentTabItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  // Theme-aware color tokens for inline styles (Matching user reference theme)
  const colors = {
    bgPrimary: isDark ? '#07100F' : '#F8FAF9',
    bgSecondary: isDark ? '#0D1C1A' : '#FFFFFF',
    bgTertiary: isDark ? '#081514' : '#F4F7F6',
    textPrimary: isDark ? '#F0FDF4' : '#0F172A',
    textSecondary: isDark ? '#8DA9A5' : '#475569',
    textMuted: isDark ? '#5B7773' : '#8A9FA8',
    borderDefault: isDark ? '#183834' : '#E2E8E5',
    borderSubtle: isDark ? '#142B28' : '#EDF2F0',
    borderHover: isDark ? '#10B981' : '#059669',
    accent: isDark ? '#10B981' : '#059669',
    coral: isDark ? '#F43F5E' : '#E11D48',
    green: isDark ? '#2ED89B' : '#10B981',
    navActive: isDark ? 'rgba(16, 185, 129, 0.12)' : '#FFFFFF',
    navActiveBorder: isDark ? '#10B981' : '#059669',
    navActiveTxt: isDark ? '#10B981' : '#059669',
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div
        style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
        className="min-h-screen w-full flex font-sans transition-colors duration-300"
      >
        {/* ── shadcn Sidebar ─────────────────────────────── */}
        <Sidebar collapsible="icon" className="border-r border-[var(--border-default)]">
          {/* Header Brand */}
          <SidebarHeader className="h-14 justify-center border-b border-[var(--border-default)] px-3">
            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-3 cursor-pointer group select-none overflow-hidden"
              title="CardioSim"
            >
              <span className="font-sans font-bold text-3xl tracking-tight text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors leading-none truncate group-data-[collapsible=icon]:hidden">
                CardioSim
              </span>
            </div>
          </SidebarHeader>

          {/* Navigation Items */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setActiveTab(item.id)}
                          tooltip={`${item.label} — ${item.description}`}
                          size="default"
                          className="gap-3"
                        >
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-transform group-hover/btn:scale-110',
                              isActive ? 'text-emerald-400' : 'text-[var(--text-secondary)]'
                            )}
                          />
                          <div className="flex flex-col overflow-hidden text-left leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="text-xs font-semibold">{item.label}</span>
                            <span className="text-[10px] text-[var(--text-muted)] truncate">{item.description}</span>
                          </div>
                          {item.badge && (
                            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer Telemetry Widget */}
          <SidebarFooter className="border-t border-[var(--border-subtle)] p-2.5">
            <div className="group-data-[collapsible=icon]:hidden p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[11px] font-mono space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Heart Rate:
                </span>
                <span className="font-bold text-emerald-400">{simulationState.heartRate} BPM</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">Cardiac Output:</span>
                <span className="font-bold text-emerald-400">{simulationState.cardiacOutput.toFixed(2)} L/min</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">BP:</span>
                <span className="font-bold text-rose-400">
                  {simulationState.systolicBP}/{simulationState.diastolicBP} mmHg
                </span>
              </div>
            </div>
            <div
              className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center py-2 text-center"
              title={`Heart Rate: ${simulationState.heartRate} BPM | BP: ${simulationState.systolicBP}/${simulationState.diastolicBP}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">{simulationState.heartRate}</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* ── shadcn Inset (Top Bar + Main Content Area) ──── */}
        <SidebarInset className="flex flex-col min-h-screen flex-1 overflow-x-hidden">
          {/* ── shadcn Top Bar ─────────────────────────────── */}
          <header
            style={{
              backgroundColor: isDark ? 'rgba(11,25,19,0.92)' : 'rgba(255,255,255,0.92)',
              borderBottomColor: colors.borderDefault,
            }}
            className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6 backdrop-blur-md shadow-xs transition-colors"
          >
            {/* Left: Trigger + Separator + Breadcrumb + Status */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4 hidden sm:block bg-[var(--border-default)]" />
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => setActiveTab('overview')} className="font-medium text-xs">
                      CardioSim
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-semibold text-emerald-400">
                      {currentTabItem.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Badge variant="emerald" className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] py-0.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Simulation
              </Badge>
            </div>

            {/* Right: Live Telemetry + Action Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Live status badge */}
              <div
                style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono"
              >
                <span
                  className={cn('w-2 h-2 rounded-full', simulationState.isPlaying ? 'animate-pulse' : '')}
                  style={{ backgroundColor: simulationState.isPlaying ? colors.green : '#F59E0B' }}
                />
                <span style={{ color: colors.textSecondary }}>
                  {simulationState.isPlaying ? 'RUNNING' : 'PAUSED'}
                </span>
                <span style={{ color: colors.textMuted }}>|</span>
                <span style={{ color: colors.accent }} className="font-bold">{simulationState.heartRate} BPM</span>
                <span style={{ color: colors.textMuted }}>|</span>
                <span style={{ color: colors.coral }} className="font-bold">
                  {simulationState.systolicBP}/{simulationState.diastolicBP} mmHg
                </span>
              </div>

              {/* Play / Pause */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = !simulationState.isPlaying;
                  updateSimulationParam('isPlaying', next);
                  notify(next ? 'Simulation resumed.' : 'Simulation paused.', 'info');
                }}
                className="h-8 gap-1.5 text-xs font-mono"
                title={simulationState.isPlaying ? 'Pause' : 'Resume'}
              >
                {simulationState.isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span className="hidden md:inline">Play</span>
                  </>
                )}
              </Button>

              {/* Reset Defaults */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllToDefaults}
                className="h-8 gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 hover:border-rose-500/40"
                title="Reset all values to baseline defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>
          </header>

          {/* Main Content */}
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                state={simulationState}
                baseline={baseline}
                onUpdateParam={updateSimulationParam}
                onResetParam={resetSingleParam}
                onResetAll={resetAllToDefaults}
                onLoadScenario={loadScenario}
                onSaveBaseline={saveBaseline}
                onRestoreBaseline={restoreBaseline}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
                onTogglePlay={() => updateSimulationParam('isPlaying', !simulationState.isPlaying)}
                onToggleBloodFlow={() => updateSimulationParam('bloodFlowVisible', !simulationState.bloodFlowVisible)}
                onChangeBloodFlowSpeed={(s) => updateSimulationParam('bloodFlowSpeed', s)}
                onToggleLabels={() => updateSimulationParam('showLabels', !simulationState.showLabels)}
                onChangeViewMode={(m) => updateSimulationParam('viewMode', m)}
                onSelectChamber={(id) => updateSimulationParam('activeChamber', id)}
                onNotify={notify}
                isDark={isDark}
              />
            )}

            {activeTab === 'heart' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 style={{ color: colors.textPrimary }} className="text-xl font-tech font-bold tracking-wide">
                      3D Heart — Anatomy Lab
                    </h2>
                    <p style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                      Drag to rotate • Scroll to zoom • Click chambers to learn more • Drop a .glb file to replace the model
                    </p>
                  </div>
                  <div
                    style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }}
                    className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border"
                  >
                    <span style={{ color: colors.textSecondary }}>Beat frequency:</span>
                    <span style={{ color: colors.accent }} className="font-bold">{(simulationState.heartRate / 60).toFixed(2)} Hz</span>
                    <span style={{ color: colors.textMuted }}>·</span>
                    <span style={{ color: colors.textSecondary }}>Period:</span>
                    <span style={{ color: colors.coral }} className="font-bold">{(60 / simulationState.heartRate).toFixed(2)} s</span>
                  </div>
                </div>
                <div className="h-[650px] w-full">
                  <HeartScene
                    heartRate={simulationState.heartRate}
                    isPlaying={simulationState.isPlaying}
                    bloodFlowVisible={simulationState.bloodFlowVisible}
                    bloodFlowSpeed={simulationState.bloodFlowSpeed}
                    showLabels={simulationState.showLabels}
                    viewMode={simulationState.viewMode}
                    activeChamber={simulationState.activeChamber}
                    onTogglePlay={() => updateSimulationParam('isPlaying', !simulationState.isPlaying)}
                    onToggleBloodFlow={() => updateSimulationParam('bloodFlowVisible', !simulationState.bloodFlowVisible)}
                    onChangeBloodFlowSpeed={(s) => updateSimulationParam('bloodFlowSpeed', s)}
                    onToggleLabels={() => updateSimulationParam('showLabels', !simulationState.showLabels)}
                    onChangeViewMode={(m) => updateSimulationParam('viewMode', m)}
                    onSelectChamber={(id) => updateSimulationParam('activeChamber', id)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="space-y-6">
                <ParameterControls
                  state={simulationState}
                  onUpdateParam={updateSimulationParam}
                  onResetParam={resetSingleParam}
                  onResetAll={resetAllToDefaults}
                  onLoadScenario={loadScenario}
                  onNotify={notify}
                  isDark={isDark}
                />
                <BaselineComparison
                  currentState={simulationState}
                  baseline={baseline}
                  onSaveBaseline={saveBaseline}
                  onRestoreBaseline={restoreBaseline}
                  onResetToDefaults={resetAllToDefaults}
                  onNotify={notify}
                  isDark={isDark}
                />
                <CardiovascularCharts
                  history={history}
                  currentHR={simulationState.heartRate}
                  currentCO={simulationState.cardiacOutput}
                  currentSBP={simulationState.systolicBP}
                  currentDBP={simulationState.diastolicBP}
                  onClearHistory={() => setHistory([])}
                  onNotify={notify}
                  isDark={isDark}
                />
              </div>
            )}

            {activeTab === 'ecg' && (
              <div className="space-y-6">
                <ECGMonitor
                  heartRate={simulationState.heartRate}
                  isPlaying={simulationState.isPlaying}
                  onTogglePlay={() => updateSimulationParam('isPlaying', !simulationState.isPlaying)}
                  onNotify={notify}
                  isDark={isDark}
                />
                <CardiovascularCharts
                  history={history}
                  currentHR={simulationState.heartRate}
                  currentCO={simulationState.cardiacOutput}
                  currentSBP={simulationState.systolicBP}
                  currentDBP={simulationState.diastolicBP}
                  onClearHistory={() => setHistory([])}
                  onNotify={notify}
                  isDark={isDark}
                />
              </div>
            )}

            {activeTab === 'flow' && (
              <div className="space-y-6">
                <div className="h-[530px] w-full">
                  <HeartScene
                    heartRate={simulationState.heartRate}
                    isPlaying={simulationState.isPlaying}
                    bloodFlowVisible={simulationState.bloodFlowVisible}
                    bloodFlowSpeed={simulationState.bloodFlowSpeed}
                    showLabels={simulationState.showLabels}
                    viewMode={simulationState.viewMode}
                    activeChamber={simulationState.activeChamber}
                    onTogglePlay={() => updateSimulationParam('isPlaying', !simulationState.isPlaying)}
                    onToggleBloodFlow={() => updateSimulationParam('bloodFlowVisible', !simulationState.bloodFlowVisible)}
                    onChangeBloodFlowSpeed={(s) => updateSimulationParam('bloodFlowSpeed', s)}
                    onToggleLabels={() => updateSimulationParam('showLabels', !simulationState.showLabels)}
                    onChangeViewMode={(m) => updateSimulationParam('viewMode', m)}
                    onSelectChamber={(id) => updateSimulationParam('activeChamber', id)}
                  />
                </div>
                <BloodFlowDiagram
                  heartRate={simulationState.heartRate}
                  bloodFlowSpeed={simulationState.bloodFlowSpeed}
                  onChangeSpeed={(s) => updateSimulationParam('bloodFlowSpeed', s)}
                  onSelectChamber={(id) => updateSimulationParam('activeChamber', id)}
                  isDark={isDark}
                />
              </div>
            )}

            {activeTab === 'qa' && (
              <CardioAIAssistant simulationState={simulationState} isDark={isDark} />
            )}

            {activeTab === 'about' && (
              <AboutSection isDark={isDark} />
            )}
          </main>

          {/* ── Footer ──────────────────────────────────────── */}
          <footer
            style={{ borderTopColor: colors.borderSubtle, backgroundColor: colors.bgSecondary, color: colors.textMuted }}
            className="border-t py-3 px-6 text-center text-xs font-mono mt-auto"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.green }} />
                <span>CardioSim 3D — Syntax Squad</span>
              </div>
              <span style={{ color: colors.textMuted }}>
                Educational Cardiovascular Simulator · Not for Clinical Diagnosis
              </span>
            </div>
          </footer>
        </SidebarInset>

        {/* ── Toast Notification ───────────────────────────── */}
        {toast && (
          <div
            style={{
              backgroundColor: isDark ? 'rgba(16,29,45,0.96)' : 'rgba(255,255,255,0.97)',
              borderColor: colors.borderDefault,
              color: colors.textPrimary,
            }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border animate-slideUp text-xs font-mono"
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: colors.green }} />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ color: colors.textMuted }}
              className="ml-2 hover:opacity-70 transition text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
