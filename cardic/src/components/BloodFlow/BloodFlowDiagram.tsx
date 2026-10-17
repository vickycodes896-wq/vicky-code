import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Droplets, ArrowRight, ShieldCheck, Heart, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface BloodFlowDiagramProps {
  heartRate: number;
  bloodFlowSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onSelectChamber?: (chamberId: string) => void;
  isDark?: boolean;
}

export const BloodFlowDiagram: React.FC<BloodFlowDiagramProps> = ({
  heartRate,
  bloodFlowSpeed,
  onChangeSpeed,
  onSelectChamber,
  isDark = true,
}) => {
  const [activeStep, setActiveStep] = useState(0);

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
    blue: isDark ? '#38BDF8' : '#0284C7',
  };

  const circulationSteps = [
    {
      step: 1,
      title: 'Venous Return to Right Atrium',
      circuit: 'pulmonary',
      oxygenation: 'deoxygenated',
      chamber: 'right_atrium',
      vessels: 'Superior Vena Cava (SVC) & Inferior Vena Cava (IVC)',
      description:
        'Deoxygenated, carbon dioxide-rich blood returns from upper body (head, neck, arms via SVC) and lower body (trunk, viscera, legs via IVC) into the Right Atrium.',
      pressure: '2 - 6 mmHg (Central Venous Pressure)',
    },
    {
      step: 2,
      title: 'Tricuspid Inflow to Right Ventricle',
      circuit: 'pulmonary',
      oxygenation: 'deoxygenated',
      chamber: 'right_ventricle',
      vessels: 'Tricuspid Atrioventricular (AV) Valve',
      description:
        'During ventricular diastole, the tricuspid valve opens. Atrial contraction ("atrial kick") provides the final 20% filling into the compliant Right Ventricle.',
      pressure: 'End-diastolic ~4 mmHg, peak systolic ~25 mmHg',
    },
    {
      step: 3,
      title: 'Pulmonary Ejection into Lungs',
      circuit: 'pulmonary',
      oxygenation: 'deoxygenated',
      chamber: 'pulmonary_trunk',
      vessels: 'Pulmonary Valve & Pulmonary Arteries',
      description:
        'Right ventricular systole forces open the pulmonary valve. Deoxygenated blood surges through the pulmonary trunk into left and right pulmonary arteries toward the pulmonary capillary beds.',
      pressure: 'Pulmonary artery ~25/10 mmHg (Mean: 14 mmHg)',
    },
    {
      step: 4,
      title: 'Alveolar Gas Exchange in Lungs',
      circuit: 'pulmonary',
      oxygenation: 'transition',
      chamber: 'lungs',
      vessels: 'Pulmonary Alveolar Capillaries',
      description:
        'Blood passes single-file through delicate alveolar capillaries. CO2 diffuses across thin respiratory membranes into alveoli for exhalation, and inhaled O2 binds to hemoglobin, transforming blood to bright scarlet oxygenated blood.',
      pressure: 'Microvascular capillary pressure ~7 mmHg',
    },
    {
      step: 5,
      title: 'Pulmonary Venous Return to Left Atrium',
      circuit: 'systemic',
      oxygenation: 'oxygenated',
      chamber: 'left_atrium',
      vessels: '4 Pulmonary Veins (2 Left, 2 Right)',
      description:
        'Freshly oxygenated blood returns from the lungs through four pulmonary veins directly into the high-compliance Left Atrium.',
      pressure: 'Mean Left Atrial Pressure ~8 - 10 mmHg',
    },
    {
      step: 6,
      title: 'Mitral Inflow into Left Ventricle',
      circuit: 'systemic',
      oxygenation: 'oxygenated',
      chamber: 'left_ventricle',
      vessels: 'Bicuspid / Mitral Atrioventricular Valve',
      description:
        'Mitral valve opens under LA-to-LV pressure gradient. The thick-walled Left Ventricle fills with oxygenated blood, primed for high-pressure systemic ejection.',
      pressure: 'End-diastolic ~8 - 12 mmHg',
    },
    {
      step: 7,
      title: 'Aortic High-Pressure Ejection',
      circuit: 'systemic',
      oxygenation: 'oxygenated',
      chamber: 'aorta',
      vessels: 'Aortic Semilunar Valve & Aorta',
      description:
        'Powerful left ventricular contraction generates ~120 mmHg, flinging open the aortic valve. Blood surges into the ascending aorta, aortic arch, and branches.',
      pressure: '120/80 mmHg (Systemic Arterial Pressure)',
    },
    {
      step: 8,
      title: 'Systemic Perfusion & Tissue Capillaries',
      circuit: 'systemic',
      oxygenation: 'transition',
      chamber: 'systemic_organs',
      vessels: 'Brachiocephalic, Carotid, Subclavian & Systemic Arterioles',
      description:
        'Oxygenated blood perfuses the brain, heart (via coronary arteries), kidneys, digestive organs, and working skeletal muscles before returning as venous blood to step 1.',
      pressure: 'Mean Arterial Pressure (MAP) ~93 mmHg',
    },
  ];

  const current = circulationSteps[activeStep];

  return (
    <div
      style={{ backgroundColor: C.bgCard, borderColor: C.border }}
      className="p-5 rounded-2xl border border-b-[4px] border-b-[#07251f] card-3d shadow-xl space-y-6 transition-colors duration-300"
    >
      {/* Header */}
      <div
        style={{ borderBottomColor: C.border }}
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
      >
        <div>
          <h3 style={{ color: C.textPrimary }} className="text-base font-tech font-bold tracking-wide flex items-center gap-2">
            <Droplets className="w-4 h-4" style={{ color: C.coral }} />
            Dual-Circuit Blood Flow & Hemodynamic Pathway
          </h3>
          <p style={{ color: C.textSecondary }} className="text-xs">
            Interactive educational walkthrough of systemic and pulmonary circulation
          </p>
        </div>

        {/* Legend */}
        <div
          style={{ backgroundColor: C.bgInput, borderColor: C.border }}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border text-xs font-mono"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.coral }} />
            <span style={{ color: C.textSecondary }}>Oxygen-Rich (Arterial Systemic)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.blue }} />
            <span style={{ color: C.textSecondary }}>Oxygen-Poor (Venous Pulmonary)</span>
          </div>
        </div>
      </div>

      {/* Step Pills Navigation - Equal Heights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-stretch">
        {circulationSteps.map((s, idx) => {
          const isActive = idx === activeStep;
          const isOxy = s.oxygenation === 'oxygenated';
          const isDeoxy = s.oxygenation === 'deoxygenated';

          return (
            <button
              key={s.step}
              onClick={() => {
                setActiveStep(idx);
                if (onSelectChamber && s.chamber) onSelectChamber(s.chamber);
              }}
              style={{
                backgroundColor: isActive ? C.accent : C.bgNested,
                color: isActive ? '#FFFFFF' : C.textPrimary,
                borderColor: isActive ? C.accent : C.border,
              }}
              className={`p-2.5 rounded-xl text-left border border-b-[3px] border-b-[#07241e] card-3d h-[68px] flex flex-col justify-between transition cursor-pointer hover:opacity-90 ${
                isActive ? 'font-bold ring-2 ring-emerald-500 shadow-md' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono" style={{ color: isActive ? '#FFFFFF' : C.textMuted }}>
                  0{s.step}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isOxy ? C.coral : isDeoxy ? C.blue : C.mint,
                  }}
                />
              </div>
              <div className="text-[11px] leading-tight mt-1 line-clamp-2">
                {s.title.split(' to ')[0].split(' in ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Active Step Card */}
      <div
        style={{ backgroundColor: C.bgNested, borderColor: C.border }}
        className="border border-b-[3.5px] border-b-[#07251f] card-3d rounded-xl p-5 space-y-4"
      >
        <div
          style={{ borderBottomColor: C.borderSubtle }}
          className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: current.oxygenation === 'oxygenated'
                  ? (isDark ? 'rgba(244,63,94,0.18)' : '#FFE4E6')
                  : (isDark ? 'rgba(56,189,248,0.18)' : '#E0F2FE'),
                color: current.oxygenation === 'oxygenated' ? C.coral : C.blue,
                borderColor: current.oxygenation === 'oxygenated'
                  ? (isDark ? 'rgba(244,63,94,0.35)' : '#FECDD3')
                  : (isDark ? 'rgba(56,189,248,0.35)' : '#BAE6FD'),
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border"
            >
              STEP 0{current.step} OF 08 · {current.circuit.toUpperCase()} CIRCUIT
            </span>
            <h4 style={{ color: C.textPrimary }} className="text-base font-tech font-bold tracking-wide">
              {current.title}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(activeStep - 1)}
              variant="outline"
              size="sm"
              className="gap-1 h-8 px-2.5 font-mono text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <Button
              disabled={activeStep === circulationSteps.length - 1}
              onClick={() => setActiveStep(activeStep + 1)}
              variant="default"
              size="sm"
              className="gap-1 h-8 px-2.5 font-mono text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <p style={{ color: C.textPrimary }} className="text-sm leading-relaxed">
          {current.description}
        </p>

        <div
          style={{ borderTopColor: C.borderSubtle }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2 border-t items-stretch"
        >
          <div style={{ backgroundColor: C.bgCard, borderColor: C.border }} className="p-3 rounded-lg border border-b-[3px] border-b-[#07241e] card-3d h-full flex flex-col justify-between">
            <span style={{ color: C.textMuted }} className="block mb-1">Key Anatomic Vessels & Valves:</span>
            <span style={{ color: C.textPrimary }} className="font-medium">{current.vessels}</span>
          </div>
          <div style={{ backgroundColor: C.bgCard, borderColor: C.border }} className="p-3 rounded-lg border border-b-[3px] border-b-[#07241e] card-3d h-full flex flex-col justify-between">
            <span style={{ color: C.textMuted }} className="block mb-1">Physiological Pressure Range:</span>
            <span style={{ color: C.accent }} className="font-medium">{current.pressure}</span>
          </div>
        </div>
      </div>

      {/* Dual Circuit Summary Comparison - Equal Heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs items-stretch">
        {/* Pulmonary Circuit */}
        <div
          style={{
            backgroundColor: C.bgNested,
            borderColor: isDark ? 'rgba(56,189,248,0.25)' : '#BAE6FD',
          }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d rounded-xl p-4 space-y-2 h-full flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider" style={{ color: C.blue }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.blue }} />
            Pulmonary Circuit (Low Pressure / Low Resistance)
          </div>
          <p style={{ color: C.textSecondary }} className="text-xs leading-relaxed">
            Pumps deoxygenated blood from the right ventricle into the pulmonary capillary bed of the lungs for carbon dioxide release and oxygen uptake. Mean pressures are low (~14 mmHg) to prevent alveolar pulmonary edema.
          </p>
        </div>

        {/* Systemic Circuit */}
        <div
          style={{
            backgroundColor: C.bgNested,
            borderColor: isDark ? 'rgba(244,63,94,0.25)' : '#FECDD3',
          }}
          className="border border-b-[3.5px] border-b-[#07251f] card-3d rounded-xl p-4 space-y-2 h-full flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider" style={{ color: C.coral }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.coral }} />
            Systemic Circuit (High Pressure / High Resistance)
          </div>
          <p style={{ color: C.textSecondary }} className="text-xs leading-relaxed">
            Pumps oxygen-saturated blood from the thick left ventricle into the entire body via the aorta and arterial tree. Requires high pressures (~120/80 mmHg) to overcome systemic vascular resistance (SVR) and ensure capillary perfusion.
          </p>
        </div>
      </div>
    </div>
  );
};
