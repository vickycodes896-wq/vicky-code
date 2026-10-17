import * as THREE from 'three';

export interface BloodParticle {
  pathIndex: number;
  t: number; // 0 to 1 along curve
  speed: number;
  offset: THREE.Vector3;
}

/**
 * Procedural Blood Flow Particle Simulation.
 * Renders moving oxygenated (red) and deoxygenated (blue) blood particles along
 * anatomical curves through cardiac chambers and great vessels.
 */
export class BloodFlowSystem {
  public group: THREE.Group;
  private oxygenatedPoints: THREE.Points;
  private deoxygenatedPoints: THREE.Points;
  private oxygenatedParticles: BloodParticle[] = [];
  private deoxygenatedParticles: BloodParticle[] = [];

  private oxygenatedCurves: THREE.CatmullRomCurve3[] = [];
  private deoxygenatedCurves: THREE.CatmullRomCurve3[] = [];

  private oxyPositions: Float32Array;
  private deoxyPositions: Float32Array;

  private oxyCount = 280;
  private deoxyCount = 280;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'BloodFlowSystem';

    this.setupCurves();
    const { oxyPoints, deoxyPoints, oxyPos, deoxyPos } = this.createParticleMeshes();
    this.oxygenatedPoints = oxyPoints;
    this.deoxygenatedPoints = deoxyPoints;
    this.oxyPositions = oxyPos;
    this.deoxyPositions = deoxyPos;

    this.group.add(this.oxygenatedPoints);
    this.group.add(this.deoxygenatedPoints);
  }

  private setupCurves() {
    // ========================================================
    // OXYGENATED BLOOD (RED) CIRCUITS
    // Pulmonary Veins -> Left Atrium -> Left Ventricle -> Aorta
    // ========================================================
    // Curve 1: Right pulmonary vein -> LA -> LV -> Aortic Arch -> Brachiocephalic branch
    this.oxygenatedCurves.push(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.65, 0.75, -0.55),  // Pulmonary vein entrance
        new THREE.Vector3(0.45, 0.65, -0.3),   // Left Atrium cavity
        new THREE.Vector3(0.4, 0.25, -0.05),   // Mitral Valve plane
        new THREE.Vector3(0.42, -0.3, 0.2),    // Left Ventricle cavity
        new THREE.Vector3(0.35, -0.65, 0.25),  // Near LV Apex
        new THREE.Vector3(0.2, -0.2, 0.15),    // LV outflow tract
        new THREE.Vector3(0.1, 0.4, 0.15),     // Aortic Valve
        new THREE.Vector3(0.05, 1.1, 0.1),     // Ascending Aorta
        new THREE.Vector3(-0.05, 1.55, 0.0),   // Peak of Aortic Arch
        new THREE.Vector3(-0.15, 1.85, 0.02),  // Brachiocephalic trunk exit
      ])
    );

    // Curve 2: Left pulmonary vein -> LA -> LV -> Aortic Arch -> Descending Aorta
    this.oxygenatedCurves.push(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.3, 0.75, -0.55),   // Left pulmonary vein
        new THREE.Vector3(0.42, 0.62, -0.28),  // Left Atrium
        new THREE.Vector3(0.36, 0.2, 0.0),     // Mitral Valve
        new THREE.Vector3(0.38, -0.4, 0.18),   // Left Ventricle
        new THREE.Vector3(0.18, 0.45, 0.12),   // Aortic Valve
        new THREE.Vector3(0.02, 1.2, 0.08),    // Ascending Aorta
        new THREE.Vector3(0.2, 1.5, -0.25),    // Transverse Arch
        new THREE.Vector3(0.38, 0.95, -0.42),  // Descending Thoracic Aorta
        new THREE.Vector3(0.4, 0.05, -0.48),   // Abdominal Aorta heading
      ])
    );

    // ========================================================
    // DEOXYGENATED BLOOD (BLUE) CIRCUITS
    // SVC / IVC -> Right Atrium -> Right Ventricle -> Pulmonary Trunk
    // ========================================================
    // Curve 3: Superior Vena Cava -> RA -> RV -> Pulmonary Trunk -> Left Pulmonary Artery
    this.deoxygenatedCurves.push(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.82, 1.7, -0.25),  // Superior Vena Cava inlet
        new THREE.Vector3(-0.75, 0.8, -0.05),  // Lower SVC
        new THREE.Vector3(-0.65, 0.45, 0.1),   // Right Atrium
        new THREE.Vector3(-0.5, 0.1, 0.25),    // Tricuspid Valve plane
        new THREE.Vector3(-0.35, -0.2, 0.4),   // Right Ventricle cavity
        new THREE.Vector3(-0.25, 0.35, 0.45),  // Pulmonary Semilunar Valve
        new THREE.Vector3(-0.15, 0.85, 0.4),   // Pulmonary Trunk
        new THREE.Vector3(0.0, 1.15, 0.25),    // Bifurcation
        new THREE.Vector3(0.4, 1.15, 0.1),     // Left Pulmonary Artery
        new THREE.Vector3(0.85, 1.1, -0.15),   // Left Lung direction
      ])
    );

    // Curve 4: Inferior Vena Cava -> RA -> RV -> Pulmonary Trunk -> Right Pulmonary Artery
    this.deoxygenatedCurves.push(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.72, -0.85, -0.2), // Inferior Vena Cava inlet
        new THREE.Vector3(-0.65, 0.1, -0.1),   // IVC into RA
        new THREE.Vector3(-0.62, 0.42, 0.12),  // Right Atrium
        new THREE.Vector3(-0.48, 0.05, 0.28),  // Tricuspid Valve
        new THREE.Vector3(-0.38, -0.25, 0.38), // Right Ventricle
        new THREE.Vector3(-0.25, 0.35, 0.45),  // Pulmonary Valve
        new THREE.Vector3(-0.15, 0.85, 0.4),   // Pulmonary Trunk
        new THREE.Vector3(0.0, 1.15, 0.25),    // Bifurcation
        new THREE.Vector3(-0.4, 1.1, -0.05),   // Right Pulmonary Artery
        new THREE.Vector3(-0.9, 1.05, -0.2),   // Right Lung direction
      ])
    );
  }

  private createParticleMeshes() {
    const oxyGeo = new THREE.BufferGeometry();
    const deoxyGeo = new THREE.BufferGeometry();

    const oxyPos = new Float32Array(this.oxyCount * 3);
    const deoxyPos = new Float32Array(this.deoxyCount * 3);

    // Initialize random distributions
    for (let i = 0; i < this.oxyCount; i++) {
      const pathIdx = i % this.oxygenatedCurves.length;
      const t = Math.random();
      const p = this.oxygenatedCurves[pathIdx].getPoint(t);
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08
      );

      oxyPos[i * 3] = p.x + jitter.x;
      oxyPos[i * 3 + 1] = p.y + jitter.y;
      oxyPos[i * 3 + 2] = p.z + jitter.z;

      this.oxygenatedParticles.push({
        pathIndex: pathIdx,
        t,
        speed: 0.18 + Math.random() * 0.12,
        offset: jitter,
      });
    }

    for (let i = 0; i < this.deoxyCount; i++) {
      const pathIdx = i % this.deoxygenatedCurves.length;
      const t = Math.random();
      const p = this.deoxygenatedCurves[pathIdx].getPoint(t);
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08
      );

      deoxyPos[i * 3] = p.x + jitter.x;
      deoxyPos[i * 3 + 1] = p.y + jitter.y;
      deoxyPos[i * 3 + 2] = p.z + jitter.z;

      this.deoxygenatedParticles.push({
        pathIndex: pathIdx,
        t,
        speed: 0.18 + Math.random() * 0.12,
        offset: jitter,
      });
    }

    oxyGeo.setAttribute('position', new THREE.BufferAttribute(oxyPos, 3));
    deoxyGeo.setAttribute('position', new THREE.BufferAttribute(deoxyPos, 3));

    // Glow dot particle texture generated procedurally
    const dotTexture = this.createDotTexture();

    const oxyMat = new THREE.PointsMaterial({
      color: 0xff385c, // Vibrant oxygen-rich coral red
      size: 0.09,
      map: dotTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const deoxyMat = new THREE.PointsMaterial({
      color: 0x00d4ff, // Vibrant deoxygenated cyan blue
      size: 0.09,
      map: dotTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const oxyPoints = new THREE.Points(oxyGeo, oxyMat);
    const deoxyPoints = new THREE.Points(deoxyGeo, deoxyMat);

    return { oxyPoints, deoxyPoints, oxyPos, deoxyPos };
  }

  private createDotTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Update particle positions along splines.
   * @param delta frame delta time in seconds
   * @param speedMultiplier user controlled flow speed
   * @param heartRate BPM (higher BPM accelerates circulation)
   * @param isPlaying simulation state
   */
  public update(delta: number, speedMultiplier: number, heartRate: number, isPlaying: boolean) {
    if (!isPlaying) return;

    // Modulate velocity with heart rate factor (72 BPM = baseline 1.0)
    const bpmFactor = heartRate / 72;
    const effectiveSpeed = delta * speedMultiplier * bpmFactor * 0.75;

    // Advance oxygenated particles
    for (let i = 0; i < this.oxyCount; i++) {
      const p = this.oxygenatedParticles[i];
      p.t += p.speed * effectiveSpeed;
      if (p.t > 1.0) {
        p.t -= 1.0;
      }

      const curve = this.oxygenatedCurves[p.pathIndex];
      const point = curve.getPoint(p.t);

      this.oxyPositions[i * 3] = point.x + p.offset.x;
      this.oxyPositions[i * 3 + 1] = point.y + p.offset.y;
      this.oxyPositions[i * 3 + 2] = point.z + p.offset.z;
    }
    this.oxygenatedPoints.geometry.attributes.position.needsUpdate = true;

    // Advance deoxygenated particles
    for (let i = 0; i < this.deoxyCount; i++) {
      const p = this.deoxygenatedParticles[i];
      p.t += p.speed * effectiveSpeed;
      if (p.t > 1.0) {
        p.t -= 1.0;
      }

      const curve = this.deoxygenatedCurves[p.pathIndex];
      const point = curve.getPoint(p.t);

      this.deoxyPositions[i * 3] = point.x + p.offset.x;
      this.deoxyPositions[i * 3 + 1] = point.y + p.offset.y;
      this.deoxyPositions[i * 3 + 2] = point.z + p.offset.z;
    }
    this.deoxygenatedPoints.geometry.attributes.position.needsUpdate = true;
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public dispose() {
    this.oxygenatedPoints.geometry.dispose();
    this.deoxygenatedPoints.geometry.dispose();
    (this.oxygenatedPoints.material as THREE.Material).dispose();
    (this.deoxygenatedPoints.material as THREE.Material).dispose();
  }
}
