import React from 'react';
import { ShieldAlert, Users, Award, BookOpen, Heart, Code, Cpu, Layers, Activity, Droplets, TrendingUp } from 'lucide-react';

interface AboutSectionProps {
  isDark?: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isDark = true }) => {
  const colors = {
    bgPrimary:   isDark ? '#07100F' : '#F8FAF9',
    bgSecondary: isDark ? '#0D1C1A' : '#FFFFFF',
    bgTertiary:  isDark ? '#081514' : '#F4F7F6',
    textPrimary: isDark ? '#F0FDF4' : '#0F172A',
    textSecondary: isDark ? '#8DA9A5' : '#475569',
    textMuted:   isDark ? '#5B7773' : '#8A9FA8',
    border:      isDark ? '#183834' : '#E2E8E5',
    borderSubtle: isDark ? '#142B28' : '#EDF2F0',
    accent:      isDark ? '#10B981' : '#059669',
    coral:       isDark ? '#F43F5E' : '#E11D48',
    green:       isDark ? '#2ED89B' : '#10B981',
  };

  const features = [
    {
      icon: Layers,
      title: '3D Heart Model',
      desc: 'Explore a detailed 3D heart built with Three.js. All chambers, vessels, and anatomical parts are labelled. You can drag and drop your own .glb model onto the canvas.',
      color: colors.accent,
    },
    {
      icon: Activity,
      title: 'Live ECG Waveform',
      desc: 'See a real-time Lead II ECG wave drawn on a canvas element. The waveform speed and shape update with your heart rate slider.',
      color: colors.coral,
    },
    {
      icon: Droplets,
      title: 'Blood Flow Simulation',
      desc: 'Animated particles travel through pulmonary and systemic circuits. Red particles carry oxygen, blue carry CO₂ — just like real blood.',
      color: colors.green,
    },
    {
      icon: TrendingUp,
      title: 'Trend Charts',
      desc: 'As you adjust values, charts automatically record and display how heart rate, blood pressure, and cardiac output have changed over time.',
      color: colors.accent,
    },
  ];

  const formulas = [
    {
      title: 'Cardiac Output (CO)',
      formula: 'CO = HR × SV ÷ 1000',
      desc: 'Volume of blood pumped per minute. Normal resting adult range is 4.0 – 8.0 L/min.',
      color: colors.accent,
    },
    {
      title: 'Pulse Pressure (PP)',
      formula: 'PP = Systolic BP − Diastolic BP',
      desc: 'Difference between the top and bottom blood pressure numbers. Reflects how much the heart stretches arteries with each beat.',
      color: colors.coral,
    },
    {
      title: 'Mean Arterial Pressure (MAP)',
      formula: 'MAP ≈ DBP + (PP ÷ 3)',
      desc: 'Average pressure in arteries during one heartbeat. Target for healthy organ perfusion is ≥ 65 mmHg.',
      color: colors.green,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Card */}
      <div
        style={{ borderColor: colors.border, backgroundColor: colors.bgSecondary }}
        className="border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: colors.accent }} />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: colors.coral }} />

        <div className="relative z-10 space-y-4">
          <div
            style={{ color: colors.accent, borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}15` }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono"
          >
            <Award className="w-3.5 h-3.5" />
            HACKATHON PROJECT — SYNTAX SQUAD
          </div>

          <h2 style={{ color: colors.textPrimary }} className="text-2xl sm:text-3xl font-tech font-bold tracking-wide">
            CardioSim 3D
          </h2>

          <p style={{ color: colors.textSecondary }} className="text-sm sm:text-base leading-relaxed max-w-2xl">
            CardioSim 3D is an interactive learning tool that helps students and curious people understand how the heart works. 
            It shows a 3D model of the heart, animates blood flow, and displays a live ECG — all connected to sliders 
            you can adjust to see what happens when heart rate or blood pressure changes.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono" style={{ color: colors.textSecondary }}>
            <span className="flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
              <Users className="w-4 h-4" style={{ color: colors.coral }} />
              Built by <strong>Syntax Squad</strong>
            </span>
            <span style={{ color: colors.textMuted }}>·</span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4" style={{ color: colors.accent }} />
              Three.js · React · TypeScript
            </span>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div
        style={{ backgroundColor: isDark ? 'rgba(159,18,57,0.12)' : '#FFF1F2', borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECDD3' }}
        className="border border-b-[3.5px] border-b-rose-950/70 card-3d rounded-2xl p-5 space-y-2"
      >
        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: isDark ? '#F87171' : '#BE123C' }}>
          <ShieldAlert className="w-5 h-5 shrink-0" />
          Important Disclaimer
        </div>
        <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          This is an <strong>educational prototype</strong> only. All values, visualizations, and calculations are 
          simplified for learning purposes and have not been validated for medical use. Do not use this app for 
          any clinical or diagnostic decisions.
        </p>
        <p className="text-xs font-mono" style={{ color: colors.textMuted }}>
          If you or someone nearby is experiencing chest pain, difficulty breathing, or a medical emergency — call emergency services immediately.
        </p>
      </div>

      {/* Features Grid - Equal Heights */}
      <div style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }} className="border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl p-6 shadow-lg space-y-4">
        <h3 style={{ color: colors.textPrimary }} className="text-base font-tech font-bold tracking-wide flex items-center gap-2">
          <Code className="w-4 h-4" style={{ color: colors.accent }} />
          What's Inside
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }}
                className="p-4 rounded-xl border border-b-[3px] border-b-[#07241e] card-3d h-full flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: f.color }} />
                    <h4 style={{ color: colors.textPrimary }} className="text-sm font-semibold">{f.title}</h4>
                  </div>
                  <p style={{ color: colors.textSecondary }} className="text-xs leading-relaxed mt-2">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physiology Formulas - Equal Heights */}
      <div style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }} className="border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl p-6 shadow-lg space-y-4">
        <h3 style={{ color: colors.textPrimary }} className="text-base font-tech font-bold tracking-wide flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: colors.coral }} />
          Key Formulas Used in This Simulator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {formulas.map((fm) => (
            <div
              key={fm.title}
              style={{ backgroundColor: colors.bgTertiary, borderColor: colors.borderSubtle }}
              className="p-4 rounded-xl border border-b-[3px] border-b-[#07241e] card-3d h-full flex flex-col justify-between space-y-2.5 shadow-sm"
            >
              <div className="text-xs font-mono font-bold" style={{ color: fm.color }}>{fm.title}</div>
              <div
                style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }}
                className="text-sm font-mono font-bold px-3 py-2 rounded-lg border text-center"
              >
                {fm.formula}
              </div>
              <p style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">{fm.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }} className="border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl p-6 shadow-lg">
        <h3 style={{ color: colors.textPrimary }} className="text-base font-tech font-bold tracking-wide flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4" style={{ color: colors.coral }} />
          How It Was Built
        </h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Three.js', 'Vite', 'TailwindCSS', 'Canvas API', 'Express.js', 'Node.js'].map((tech) => (
            <span
              key={tech}
              style={{ backgroundColor: `${colors.accent}12`, borderColor: `${colors.accent}30`, color: colors.accent }}
              className="px-3 py-1 rounded-full border text-xs font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
        <p style={{ color: colors.textSecondary }} className="text-xs mt-4 leading-relaxed">
          The 3D heart model is procedurally generated using Three.js geometry. Blood flow is simulated with particles 
          animated along CatmullRom spline paths. The ECG waveform is rendered on an HTML5 Canvas element. 
          All parameters update in real time as you move the sliders.
        </p>
      </div>
    </div>
  );
};
