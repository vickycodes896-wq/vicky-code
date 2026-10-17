export interface SimulationState {
  heartRate: number; // BPM (40 - 180, default 72)
  strokeVolume: number; // mL/beat (40 - 140, default 70)
  systolicBP: number; // mmHg (80 - 220, default 120)
  diastolicBP: number; // mmHg (40 - 130, default 80)
  bloodVolume: number; // L (3.0 - 7.0, default 5.0)

  // Calculated hemodynamics
  cardiacOutput: number; // L/min (HR * SV / 1000)
  pulsePressure: number; // mmHg (SBP - DBP)
  meanArterialPressure: number; // mmHg (DBP + PP / 3)

  // Interactive controls
  isPlaying: boolean;
  bloodFlowVisible: boolean;
  bloodFlowSpeed: number; // 0.5x to 2.5x
  showLabels: boolean;
  viewMode: 'standard' | 'xray' | 'flowOnly';
  activeChamber: string | null;
  audioBeepEnabled: boolean;
}

export interface BaselineState {
  heartRate: number;
  strokeVolume: number;
  systolicBP: number;
  diastolicBP: number;
  bloodVolume: number;
  cardiacOutput: number;
  pulsePressure: number;
  meanArterialPressure: number;
  savedAt: string;
}

export interface HistoryDataPoint {
  time: string;
  timestamp: number;
  heartRate: number;
  cardiacOutput: number;
  systolicBP: number;
  diastolicBP: number;
  pulsePressure: number;
  meanArterialPressure: number;
}

export interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface AnatomicalStructure {
  id: string;
  name: string;
  latinName: string;
  oxygenation: 'oxygenated' | 'deoxygenated' | 'mixed' | 'conduction';
  pressureProfile: string;
  description: string;
  keyRole: string;
  position: [number, number, number];
}

export const ANATOMICAL_STRUCTURES: Record<string, AnatomicalStructure> = {
  aorta: {
    id: 'aorta',
    name: 'Ascending Aorta & Arch',
    latinName: 'Aorta ascendens et arcus aortae',
    oxygenation: 'oxygenated',
    pressureProfile: 'Highest systemic pressure (approx. 120/80 mmHg)',
    description: 'The largest arterial trunk carrying high-pressure oxygen-rich blood from the left ventricle to systemic organ circulation via brachiocephalic, carotid, and subclavian branches.',
    keyRole: 'Systemic high-pressure distribution with elastic recoil (Windkessel effect).',
    position: [0, 1.4, 0.1],
  },
  left_ventricle: {
    id: 'left_ventricle',
    name: 'Left Ventricle (LV)',
    latinName: 'Ventriculus sinister',
    oxygenation: 'oxygenated',
    pressureProfile: 'Peak systolic ~120 mmHg, end-diastolic ~8-12 mmHg',
    description: 'Thick muscular pump (3x thicker than right ventricle) generating powerful pressure gradients to overcome systemic vascular resistance.',
    keyRole: 'Pumping oxygenated blood into the aorta during ventricular systole.',
    position: [0.5, -0.4, 0.4],
  },
  right_ventricle: {
    id: 'right_ventricle',
    name: 'Right Ventricle (RV)',
    latinName: 'Ventriculus dexter',
    oxygenation: 'deoxygenated',
    pressureProfile: 'Low-pressure pump (~25/4 mmHg)',
    description: 'Crescent-shaped anterior chamber that pumps venous blood through the pulmonary semilunar valve into the pulmonary arterial trunk toward lungs.',
    keyRole: 'Powering low-resistance pulmonary circulation for alveoli gas exchange.',
    position: [-0.4, -0.3, 0.6],
  },
  left_atrium: {
    id: 'left_atrium',
    name: 'Left Atrium (LA)',
    latinName: 'Atrium sinistrum',
    oxygenation: 'oxygenated',
    pressureProfile: 'Mean pressure ~8-10 mmHg',
    description: 'Posterior superior chamber receiving oxygenated pulmonary venous return from the lungs via four pulmonary veins.',
    keyRole: 'Receives pulmonary venous return and primes the left ventricle (atrial kick).',
    position: [0.6, 0.6, -0.4],
  },
  right_atrium: {
    id: 'right_atrium',
    name: 'Right Atrium (RA)',
    latinName: 'Atrium dextrum',
    oxygenation: 'deoxygenated',
    pressureProfile: 'Central Venous Pressure (CVP: 2-6 mmHg)',
    description: 'Thin-walled receiving chamber collecting deoxygenated systemic venous return from the superior and inferior vena cava and coronary sinus.',
    keyRole: 'Contains the Sinoatrial (SA) node pacemaker and fills the right ventricle.',
    position: [-0.8, 0.5, 0.1],
  },
  pulmonary_trunk: {
    id: 'pulmonary_trunk',
    name: 'Pulmonary Trunk & Arteries',
    latinName: 'Truncus pulmonalis',
    oxygenation: 'deoxygenated',
    pressureProfile: 'Mean pulmonary arterial pressure ~14 mmHg',
    description: 'Artery emerging from the right ventricle that bifurcates into the left and right pulmonary arteries to deliver deoxygenated blood to lung capillary beds.',
    keyRole: 'Carries deoxygenated blood from right ventricle to lungs (unique for arteries).',
    position: [-0.1, 1.0, 0.7],
  },
  superior_vena_cava: {
    id: 'superior_vena_cava',
    name: 'Superior Vena Cava (SVC)',
    latinName: 'Vena cava superior',
    oxygenation: 'deoxygenated',
    pressureProfile: 'Central venous pressure (2-6 mmHg)',
    description: 'Large vein formed by junction of left and right brachiocephalic veins, carrying deoxygenated blood from upper body, head, neck, and arms.',
    keyRole: 'Drains upper systemic venous blood into right atrium.',
    position: [-0.9, 1.3, -0.2],
  },
  coronary_arteries: {
    id: 'coronary_arteries',
    name: 'Coronary Arteries & Veins',
    latinName: 'Arteriae coronariae',
    oxygenation: 'oxygenated',
    pressureProfile: 'Diastolic perfusion pressure dominant (~80 mmHg)',
    description: 'Vascular network branching directly from the aortic sinuses to supply oxygen and nutrients to the beating myocardium.',
    keyRole: 'Perfuses the cardiac muscle during ventricular diastole.',
    position: [0.1, -0.1, 0.9],
  },
};

export const PRESET_SCENARIOS = [
  {
    name: 'Resting Baseline (Normal)',
    description: 'Healthy adult at rest with standard physiological hemodynamics.',
    state: { heartRate: 72, strokeVolume: 70, systolicBP: 120, diastolicBP: 80, bloodVolume: 5.0 },
  },
  {
    name: 'Moderate Aerobic Exercise',
    description: 'Sympathetic activation increases heart rate and stroke volume to meet muscular oxygen demand.',
    state: { heartRate: 135, strokeVolume: 105, systolicBP: 155, diastolicBP: 78, bloodVolume: 5.0 },
  },
  {
    name: 'Athletic Bradycardia',
    description: 'Endurance athlete with ventricular hypertrophy, high stroke volume, and low resting heart rate.',
    state: { heartRate: 48, strokeVolume: 110, systolicBP: 110, diastolicBP: 70, bloodVolume: 5.3 },
  },
  {
    name: 'Stage 1 Essential Hypertension',
    description: 'Elevated peripheral vascular resistance with increased cardiac afterload and pulse pressure.',
    state: { heartRate: 78, strokeVolume: 65, systolicBP: 148, diastolicBP: 94, bloodVolume: 5.0 },
  },
  {
    name: 'Hypovolemic Hypotension (Volume Loss)',
    description: 'Reduced effective circulating blood volume triggers compensatory reflex tachycardia.',
    state: { heartRate: 118, strokeVolume: 42, systolicBP: 90, diastolicBP: 58, bloodVolume: 3.6 },
  },
];
