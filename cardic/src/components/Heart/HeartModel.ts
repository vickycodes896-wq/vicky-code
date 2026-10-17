import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface HeartModelOptions {
  viewMode?: 'standard' | 'xray' | 'flowOnly';
  activeChamber?: string | null;
}

/**
 * Reusable Anatomical Heart Model.
 * Built with modular procedural anatomical components (Left/Right Ventricles,
 * Left/Right Atria, Aorta with branches, Pulmonary Trunk, Vena Cava, and Coronary Vessels).
 * Supports drop-in replacement with real GLB models via GLTFLoader.
 */
export class HeartModel {
  public group: THREE.Group;
  public proceduralGroup: THREE.Group;
  public glbGroup: THREE.Group | null = null;
  public materials: Map<string, THREE.Material> = new Map();
  public parts: Map<string, THREE.Object3D> = new Map();
  private baseScales: Map<string, THREE.Vector3> = new Map();
  public isGlbLoaded: boolean = false;
  private glbBaseScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AnatomicalHeart';

    this.proceduralGroup = new THREE.Group();
    this.proceduralGroup.name = 'ProceduralHeart';
    this.group.add(this.proceduralGroup);

    this.buildProceduralHeart();
  }

  private buildProceduralHeart() {
    // 1. Materials with realistic organic PBR finishes
    const myocardialMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9e2a2b, // Deep cardiac muscle crimson
      roughness: 0.45,
      metalness: 0.1,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      reflectivity: 0.5,
    });
    this.materials.set('myocardium', myocardialMaterial);

    const leftVentricleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb23a48, // Muscular red
      roughness: 0.4,
      metalness: 0.08,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
    });
    this.materials.set('leftVentricle', leftVentricleMaterial);

    const rightVentricleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8a2838, // Slightly darker deoxygenated venous hue tint
      roughness: 0.48,
      metalness: 0.05,
      clearcoat: 0.35,
    });
    this.materials.set('rightVentricle', rightVentricleMaterial);

    const leftAtriumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa83244,
      roughness: 0.52,
      metalness: 0.05,
      clearcoat: 0.3,
    });
    this.materials.set('leftAtrium', leftAtriumMaterial);

    const rightAtriumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x6b2d40, // Venous-tinged atrium
      roughness: 0.55,
      metalness: 0.05,
      clearcoat: 0.3,
    });
    this.materials.set('rightAtrium', rightAtriumMaterial);

    const aortaMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdf3b3b, // Bright oxygen-rich arterial red
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15,
    });
    this.materials.set('aorta', aortaMaterial);

    const pulmonaryArteryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x227093, // Cyan/Blue deoxygenated pulmonary artery
      roughness: 0.3,
      metalness: 0.12,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    });
    this.materials.set('pulmonary', pulmonaryArteryMaterial);

    const venaCavaMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1b4965, // Deep venous blue
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });
    this.materials.set('venaCava', venaCavaMaterial);

    const coronaryArteryMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3344,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x550011,
      emissiveIntensity: 0.3,
    });
    this.materials.set('coronaryArtery', coronaryArteryMaterial);

    const coronaryVeinMaterial = new THREE.MeshStandardMaterial({
      color: 0x3388ee,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x002255,
      emissiveIntensity: 0.2,
    });
    this.materials.set('coronaryVein', coronaryVeinMaterial);

    const fatGrooveMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Epicardial adipose tissue in sulci
      roughness: 0.8,
      metalness: 0.0,
    });
    this.materials.set('adipose', fatGrooveMaterial);

    // ==========================================
    // 2. Anatomical Sub-Assemblies (3-12 parts)
    // ==========================================

    // PART 1: Left Ventricle (LV) - dominant conical pump tapering down to apex
    const lvGroup = new THREE.Group();
    lvGroup.name = 'left_ventricle';
    const lvGeo = new THREE.SphereGeometry(0.85, 32, 28);
    lvGeo.scale(0.85, 1.35, 0.95);
    const lvMesh = new THREE.Mesh(lvGeo, leftVentricleMaterial);
    lvMesh.position.set(0.35, -0.25, 0.15);
    lvMesh.rotation.set(0.15, 0, -0.25);
    lvMesh.castShadow = true;
    lvMesh.receiveShadow = true;
    lvGroup.add(lvMesh);
    this.proceduralGroup.add(lvGroup);
    this.parts.set('left_ventricle', lvGroup);

    // PART 2: Right Ventricle (RV) - crescent anterior wrapping around LV
    const rvGroup = new THREE.Group();
    rvGroup.name = 'right_ventricle';
    const rvGeo = new THREE.SphereGeometry(0.75, 32, 24);
    rvGeo.scale(0.85, 1.15, 0.7);
    const rvMesh = new THREE.Mesh(rvGeo, rightVentricleMaterial);
    rvMesh.position.set(-0.35, -0.2, 0.4);
    rvMesh.rotation.set(0.2, 0.1, 0.2);
    rvMesh.castShadow = true;
    rvMesh.receiveShadow = true;
    rvGroup.add(rvMesh);
    this.proceduralGroup.add(rvGroup);
    this.parts.set('right_ventricle', rvGroup);

    // PART 3: Left Atrium (LA) & Auricle - posterior superior
    const laGroup = new THREE.Group();
    laGroup.name = 'left_atrium';
    const laGeo = new THREE.SphereGeometry(0.55, 24, 20);
    laGeo.scale(0.9, 0.85, 0.85);
    const laMesh = new THREE.Mesh(laGeo, leftAtriumMaterial);
    laMesh.position.set(0.45, 0.65, -0.3);
    laMesh.castShadow = true;
    laMesh.receiveShadow = true;
    laGroup.add(laMesh);

    // 4 Pulmonary vein stubs entering LA
    const pvGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16);
    const pv1 = new THREE.Mesh(pvGeo, aortaMaterial);
    pv1.position.set(0.65, 0.75, -0.55);
    pv1.rotation.set(0.8, 0.3, 0);
    laGroup.add(pv1);

    const pv2 = new THREE.Mesh(pvGeo, aortaMaterial);
    pv2.position.set(0.3, 0.75, -0.55);
    pv2.rotation.set(0.8, -0.3, 0);
    laGroup.add(pv2);

    this.proceduralGroup.add(laGroup);
    this.parts.set('left_atrium', laGroup);

    // PART 4: Right Atrium (RA) & Auricle - lateral right superior
    const raGroup = new THREE.Group();
    raGroup.name = 'right_atrium';
    const raGeo = new THREE.SphereGeometry(0.6, 24, 20);
    raGeo.scale(0.8, 1.0, 0.85);
    const raMesh = new THREE.Mesh(raGeo, rightAtriumMaterial);
    raMesh.position.set(-0.65, 0.45, 0.1);
    raMesh.castShadow = true;
    raMesh.receiveShadow = true;
    raGroup.add(raMesh);
    this.proceduralGroup.add(raGroup);
    this.parts.set('right_atrium', raGroup);

    // PART 5: Ascending Aorta, Aortic Arch, and Brachiocephalic/Carotid/Subclavian Branches
    const aortaGroup = new THREE.Group();
    aortaGroup.name = 'aorta';

    // Elegant curved aorta tube arching over heart
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.4, 0.15),   // Emerging from aortic valve in LV base
      new THREE.Vector3(0.05, 1.1, 0.1),   // Ascending aorta
      new THREE.Vector3(-0.05, 1.55, 0.0), // Peak of aortic arch
      new THREE.Vector3(0.2, 1.5, -0.25),  // Transverse arch
      new THREE.Vector3(0.35, 1.05, -0.4), // Descending thoracic aorta begins
      new THREE.Vector3(0.4, 0.1, -0.45),  // Posterior descending trunk
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 40, 0.22, 20, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMaterial);
    aortaMesh.castShadow = true;
    aortaMesh.receiveShadow = true;
    aortaGroup.add(aortaMesh);

    // 3 Aortic Arch Branches:
    // 1) Brachiocephalic artery trunk
    const branch1Geo = new THREE.CylinderGeometry(0.08, 0.09, 0.45, 16);
    const branch1 = new THREE.Mesh(branch1Geo, aortaMaterial);
    branch1.position.set(-0.15, 1.72, 0.02);
    branch1.rotation.set(0.1, 0, 0.25);
    aortaGroup.add(branch1);

    // 2) Left common carotid artery
    const branch2Geo = new THREE.CylinderGeometry(0.065, 0.075, 0.4, 16);
    const branch2 = new THREE.Mesh(branch2Geo, aortaMaterial);
    branch2.position.set(0.02, 1.74, -0.06);
    branch2.rotation.set(0.05, 0, 0.1);
    aortaGroup.add(branch2);

    // 3) Left subclavian artery
    const branch3Geo = new THREE.CylinderGeometry(0.065, 0.075, 0.38, 16);
    const branch3 = new THREE.Mesh(branch3Geo, aortaMaterial);
    branch3.position.set(0.18, 1.7, -0.15);
    branch3.rotation.set(-0.05, 0, -0.15);
    aortaGroup.add(branch3);

    this.proceduralGroup.add(aortaGroup);
    this.parts.set('aorta', aortaGroup);

    // PART 6: Pulmonary Trunk & Left/Right Pulmonary Arteries
    const pulmonaryGroup = new THREE.Group();
    pulmonaryGroup.name = 'pulmonary_trunk';

    // Trunk arising from right ventricle infundibulum crossing in front of aorta
    const ptCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.35, 0.45), // Right ventricular outflow tract
      new THREE.Vector3(-0.15, 0.85, 0.4),  // Mid pulmonary trunk
      new THREE.Vector3(0.0, 1.15, 0.25),   // Bifurcation point beneath aortic arch
    ]);
    const ptGeo = new THREE.TubeGeometry(ptCurve, 24, 0.2, 18, false);
    const ptMesh = new THREE.Mesh(ptGeo, pulmonaryArteryMaterial);
    ptMesh.castShadow = true;
    ptMesh.receiveShadow = true;
    pulmonaryGroup.add(ptMesh);

    // Right pulmonary artery (courses rightward under aorta)
    const rpaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 1.15, 0.25),
      new THREE.Vector3(-0.4, 1.1, -0.05),
      new THREE.Vector3(-0.85, 1.05, -0.2),
    ]);
    const rpaGeo = new THREE.TubeGeometry(rpaCurve, 16, 0.13, 14, false);
    const rpaMesh = new THREE.Mesh(rpaGeo, pulmonaryArteryMaterial);
    pulmonaryGroup.add(rpaMesh);

    // Left pulmonary artery (courses leftward toward left lung)
    const lpaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 1.15, 0.25),
      new THREE.Vector3(0.35, 1.15, 0.1),
      new THREE.Vector3(0.75, 1.12, -0.15),
    ]);
    const lpaGeo = new THREE.TubeGeometry(lpaCurve, 16, 0.13, 14, false);
    const lpaMesh = new THREE.Mesh(lpaGeo, pulmonaryArteryMaterial);
    pulmonaryGroup.add(lpaMesh);

    this.proceduralGroup.add(pulmonaryGroup);
    this.parts.set('pulmonary_trunk', pulmonaryGroup);

    // PART 7: Superior Vena Cava (SVC) & Inferior Vena Cava (IVC)
    const svcGroup = new THREE.Group();
    svcGroup.name = 'superior_vena_cava';

    // SVC entering RA from above
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.75, 0.8, -0.05),
      new THREE.Vector3(-0.8, 1.35, -0.15),
      new THREE.Vector3(-0.82, 1.7, -0.25),
    ]);
    const svcGeo = new THREE.TubeGeometry(svcCurve, 20, 0.17, 16, false);
    const svcMesh = new THREE.Mesh(svcGeo, venaCavaMaterial);
    svcMesh.castShadow = true;
    svcGroup.add(svcMesh);

    // IVC entering RA from below
    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.65, 0.1, -0.1),
      new THREE.Vector3(-0.7, -0.4, -0.15),
      new THREE.Vector3(-0.72, -0.85, -0.2),
    ]);
    const ivcGeo = new THREE.TubeGeometry(ivcCurve, 16, 0.16, 16, false);
    const ivcMesh = new THREE.Mesh(ivcGeo, venaCavaMaterial);
    svcGroup.add(ivcMesh);

    this.proceduralGroup.add(svcGroup);
    this.parts.set('superior_vena_cava', svcGroup);

    // PART 8: Coronary Sulcus, Anterior Interventricular Arteries and Veins (LAD & Great Cardiac Vein)
    const coronaryGroup = new THREE.Group();
    coronaryGroup.name = 'coronary_arteries';

    // Left Anterior Descending (LAD) Artery (The "Widowmaker" clinical branch)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.35, 0.65),
      new THREE.Vector3(0.0, 0.05, 0.72),
      new THREE.Vector3(0.08, -0.35, 0.68),
      new THREE.Vector3(0.2, -0.75, 0.52),
      new THREE.Vector3(0.3, -1.05, 0.3),
    ]);
    const ladGeo = new THREE.TubeGeometry(ladCurve, 28, 0.04, 10, false);
    const ladMesh = new THREE.Mesh(ladGeo, coronaryArteryMaterial);
    coronaryGroup.add(ladMesh);

    // Great Cardiac Vein alongside LAD
    const gcvCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, 0.35, 0.63),
      new THREE.Vector3(-0.06, 0.05, 0.7),
      new THREE.Vector3(0.02, -0.35, 0.67),
      new THREE.Vector3(0.14, -0.75, 0.5),
    ]);
    const gcvGeo = new THREE.TubeGeometry(gcvCurve, 20, 0.035, 10, false);
    const gcvMesh = new THREE.Mesh(gcvGeo, coronaryVeinMaterial);
    coronaryGroup.add(gcvMesh);

    // Right Coronary Artery (RCA) curving in right coronary sulcus
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.45, 0.35),
      new THREE.Vector3(-0.55, 0.25, 0.45),
      new THREE.Vector3(-0.7, 0.0, 0.35),
      new THREE.Vector3(-0.6, -0.3, 0.2),
    ]);
    const rcaGeo = new THREE.TubeGeometry(rcaCurve, 24, 0.042, 10, false);
    const rcaMesh = new THREE.Mesh(rcaGeo, coronaryArteryMaterial);
    coronaryGroup.add(rcaMesh);

    this.proceduralGroup.add(coronaryGroup);
    this.parts.set('coronary_arteries', coronaryGroup);

    // Cache initial scales for cardiac cycle biomechanical deformation
    for (const [key, part] of this.parts.entries()) {
      this.baseScales.set(key, part.scale.clone());
    }

    // Set origin pivot so the apex and base balance naturally
    this.group.position.set(0, 0.1, 0);
  }

  /**
   * Parse an ArrayBuffer directly as GLB.
   * Useful for drag-and-drop and local file uploads without needing server-side uploads.
   */
  public loadGLBFromBuffer(
    arrayBuffer: ArrayBuffer,
    sourceName: string = 'model.glb',
    onSuccess?: (gltf: any) => void,
    onProgress?: (percent: number) => void,
    onError?: (error: Error) => void
  ) {
    try {
      if (onProgress) onProgress(20);

      // Guard against empty files (e.g. 0-byte placeholders)
      if (!arrayBuffer || arrayBuffer.byteLength < 12) {
        throw new Error(
          `The selected file (${sourceName}) is empty or too small (${arrayBuffer?.byteLength || 0} bytes). Please choose a valid 3D .glb model.`
        );
      }

      if (onProgress) onProgress(50);

      // Validate binary glTF magic header: 0x46546C67 ('glTF')
      const dataView = new DataView(arrayBuffer);
      const magic = dataView.getUint32(0, true);
      if (magic !== 0x46546c67) {
        throw new Error(
          `Invalid file format for "${sourceName}": Header magic mismatch (expected binary glTF/GLB).`
        );
      }

      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          try {
            if (this.glbGroup) {
              this.group.remove(this.glbGroup);
            }

            const model = gltf.scene;
            this.glbGroup = model;

            // Compute accurate bounding box
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Scale model uniformly so it comfortably occupies the scene (normalized size ~2.6)
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = maxDim > 0 ? 2.6 / maxDim : 1;

            model.scale.setScalar(targetScale);
            this.glbBaseScale.setScalar(targetScale);

            // Center model at origin with slight Y offset for viewing
            model.position.x = -center.x * targetScale;
            model.position.y = -center.y * targetScale + 0.1;
            model.position.z = -center.z * targetScale;

            // Traverse meshes and configure shadow + material finishes
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material.side = THREE.DoubleSide;
                }
              }
            });

            // Replace procedural heart with loaded GLB model
            this.proceduralGroup.visible = false;
            this.group.add(model);
            this.isGlbLoaded = true;

            if (onProgress) onProgress(100);
            console.log(`Successfully loaded and parsed GLB model from ${sourceName}`, gltf);
            if (onSuccess) onSuccess(gltf);
          } catch (err: any) {
            console.warn('Error post-processing loaded GLB model:', err);
            this.proceduralGroup.visible = true;
            this.isGlbLoaded = false;
            if (onError) onError(err instanceof Error ? err : new Error(String(err)));
          }
        },
        (parseErr) => {
          this.proceduralGroup.visible = true;
          this.isGlbLoaded = false;
          const errObj = parseErr instanceof Error ? parseErr : new Error(`Failed to parse GLB: ${String(parseErr)}`);
          if (onError) onError(errObj);
        }
      );
    } catch (err: any) {
      this.proceduralGroup.visible = true;
      this.isGlbLoaded = false;
      const errObj = err instanceof Error ? err : new Error(String(err?.message || err));
      if (onError) onError(errObj);
    }
  }

  /**
   * Load an external 3D GLB model and replace the procedural placeholder.
   * Performs pre-flight buffer and header magic checks to safely handle empty or corrupt files.
   */
  public async loadGLB(
    url: string,
    onSuccess?: (gltf: any) => void,
    onProgress?: (percent: number) => void,
    onError?: (error: Error) => void
  ) {
    try {
      if (onProgress) onProgress(10);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Model asset not found at ${url} (${response.status} ${response.statusText})`);
      }

      if (onProgress) onProgress(40);
      const arrayBuffer = await response.arrayBuffer();

      // If placeholder or empty file, notify gracefully without crash
      if (!arrayBuffer || arrayBuffer.byteLength < 12) {
        throw new Error(
          `GLB asset at ${url} is empty (${arrayBuffer?.byteLength || 0} bytes). Using procedural anatomical heart.`
        );
      }

      this.loadGLBFromBuffer(arrayBuffer, url, onSuccess, onProgress, onError);
    } catch (err: any) {
      this.proceduralGroup.visible = true;
      this.isGlbLoaded = false;
      const errObj = err instanceof Error ? err : new Error(String(err?.message || err));
      if (onError) onError(errObj);
    }
  }

  /**
   * Toggle between custom GLB model and procedural anatomical heart
   */
  public setModelSource(source: 'procedural' | 'glb') {
    if (source === 'glb' && this.glbGroup) {
      this.proceduralGroup.visible = false;
      this.glbGroup.visible = true;
      this.isGlbLoaded = true;
    } else {
      this.proceduralGroup.visible = true;
      if (this.glbGroup) {
        this.glbGroup.visible = false;
      }
      this.isGlbLoaded = false;
    }
  }

  /**
   * Update biomechanics based on cardiac cycle phase.
   * @param phase 0.0 to 1.0 (normalized time in cardiac cycle: 0 = start of atrial systole)
   * @param isPlaying whether heart simulation is actively beating
   */
  public update(phase: number, isPlaying: boolean) {
    if (!isPlaying) return;

    // If external GLB is loaded, apply pulse/systole deformation to the GLB model root
    if (this.isGlbLoaded && this.glbGroup) {
      let vSqueeze = 0;
      if (phase >= 0.15 && phase < 0.48) {
        const vT = (phase - 0.15) / 0.33;
        vSqueeze = Math.sin(vT * Math.PI);
      }
      const scaleMultiplier = 1.0 - vSqueeze * 0.07;
      this.glbGroup.scale.set(
        this.glbBaseScale.x * scaleMultiplier,
        this.glbBaseScale.y * (1.0 - vSqueeze * 0.035),
        this.glbBaseScale.z * scaleMultiplier
      );
      return;
    }

    // Cardiac cycle physiology for procedural model:
    const lv = this.parts.get('left_ventricle');
    const rv = this.parts.get('right_ventricle');
    const la = this.parts.get('left_atrium');
    const ra = this.parts.get('right_atrium');
    const aorta = this.parts.get('aorta');
    const pulmonary = this.parts.get('pulmonary_trunk');

    let vSqueeze = 0;
    if (phase >= 0.15 && phase < 0.48) {
      const vT = (phase - 0.15) / 0.33;
      vSqueeze = Math.sin(vT * Math.PI);
    }

    let aSqueeze = 0;
    if (phase < 0.18) {
      const aT = phase / 0.18;
      aSqueeze = Math.sin(aT * Math.PI);
    }

    if (lv) {
      const scaleXZ = 1.0 - vSqueeze * 0.14;
      const scaleY = 1.0 - vSqueeze * 0.06;
      lv.scale.set(scaleXZ, scaleY, scaleXZ);
      lv.rotation.z = -0.25 - vSqueeze * 0.06;
    }

    if (rv) {
      const scaleXZ = 1.0 - vSqueeze * 0.16;
      const scaleY = 1.0 - vSqueeze * 0.05;
      rv.scale.set(scaleXZ, scaleY, scaleXZ);
    }

    if (la) {
      const aScale = 1.0 - aSqueeze * 0.12;
      la.scale.set(aScale, aScale, aScale);
    }

    if (ra) {
      const aScale = 1.0 - aSqueeze * 0.12;
      ra.scale.set(aScale, aScale, aScale);
    }

    if (aorta) {
      const aPulse = 1.0 + vSqueeze * 0.09;
      aorta.scale.set(aPulse, 1.0, aPulse);
    }

    if (pulmonary) {
      const pPulse = 1.0 + vSqueeze * 0.08;
      pulmonary.scale.set(pPulse, 1.0, pPulse);
    }
  }

  /**
   * Set rendering style (standard, x-ray wireframe, or highlights)
   */
  public setStyle(options: HeartModelOptions) {
    const { viewMode = 'standard', activeChamber = null } = options;

    if (this.isGlbLoaded && this.glbGroup) {
      this.glbGroup.traverse((child: any) => {
        if (child.isMesh && child.material) {
          if (viewMode === 'xray') {
            child.material.wireframe = true;
            child.material.transparent = true;
            child.material.opacity = 0.65;
          } else if (viewMode === 'flowOnly') {
            child.material.wireframe = false;
            child.material.transparent = true;
            child.material.opacity = 0.25;
          } else {
            child.material.wireframe = false;
            child.material.transparent = false;
            child.material.opacity = 1.0;
          }
        }
      });
      return;
    }

    for (const [key, material] of this.materials.entries()) {
      const isHighlighted = activeChamber ? key.toLowerCase().includes(activeChamber.toLowerCase()) : false;

      if (material instanceof THREE.MeshPhysicalMaterial || material instanceof THREE.MeshStandardMaterial) {
        if (viewMode === 'xray') {
          material.wireframe = true;
          material.opacity = 0.65;
          material.transparent = true;
        } else if (viewMode === 'flowOnly') {
          material.wireframe = false;
          material.opacity = 0.22;
          material.transparent = true;
        } else {
          material.wireframe = false;
          material.opacity = 1.0;
          material.transparent = false;
        }

        if (isHighlighted) {
          material.emissive.setHex(0x37d6f5);
          material.emissiveIntensity = 0.5;
        } else if (key !== 'coronaryArtery' && key !== 'coronaryVein') {
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0.0;
        }
      }
    }
  }

  /**
   * Memory cleanup
   */
  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
      }
    });

    if (this.glbGroup) {
      this.glbGroup.traverse((child: any) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    }

    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
    this.parts.clear();
    this.baseScales.clear();
  }
}
