/**
 * FBX avatar controller using Three.js FBXLoader.
 * Provides a basic IAvatarController implementation for FBX avatars.
 * Morph targets named "MouthOpen" (or similar) are driven for lip sync.
 */

import type { IAvatarController } from "./avatar-controller.js";

type ThreeModule = typeof import("three");

/** Common FBX morph target names for mouth open (checked in order). */
const MOUTH_OPEN_KEYS = [
  "MouthOpen",
  "mouthOpen",
  "Mouth_Open",
  "mouth_open",
  "jawOpen",
  "JawOpen",
];

export class FbxController implements IAvatarController {
  readonly avatarType = "fbx" as const;

  private three: ThreeModule | null = null;

  private renderer: import("three").WebGLRenderer | null = null;
  private scene: import("three").Scene | null = null;
  private camera: import("three").PerspectiveCamera | null = null;
  private mixer: import("three").AnimationMixer | null = null;
  private clock: import("three").Clock | null = null;
  private model: import("three").Group | null = null;
  private rafId: number | null = null;

  /** Mesh/skinned-mesh nodes that carry lip-sync morph targets */
  private lipMeshes: Array<import("three").SkinnedMesh | import("three").Mesh> = [];
  /** Resolved morph target index for lip sync */
  private lipMorphIdx: number | null = null;
  private clips: import("three").AnimationClip[] = [];
  /** Fallback avatar references (when no FBX model is loaded) */
  private _fallbackMouth: import("three").Mesh | null = null;
  private _fallbackGroup: import("three").Group | null = null;
  private _fallbackEyes: import("three").Mesh[] | null = null;

  async init(container: HTMLElement): Promise<void> {
    this.three = await import("three");
    const THREE = this.three;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth || 380, container.clientHeight || 480);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      30,
      (container.clientWidth || 380) / (container.clientHeight || 480),
      0.01,
      200,
    );
    this.camera.position.set(0, 130, 280);
    this.camera.lookAt(0, 100, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 2);
    this.scene.add(dirLight);

    this.clock = new THREE.Clock();
    this.startRenderLoop();

    // Auto-discover and load a model; if none found, render fallback avatar
    const modelPath = await window.companionBridge?.discoverModel?.();
    if (modelPath) {
      try {
        await this.reloadModel(modelPath);
      } catch (err) {
        console.warn("[FbxController] Auto-discover model load failed:", err);
        this.renderFallbackAvatar();
      }
    } else {
      this.renderFallbackAvatar();
    }
  }

  /** Render a simple Three.js avatar (head + eyes + mouth) when no FBX model is available */
  private renderFallbackAvatar(): void {
    const THREE = this.three;
    if (!THREE || !this.scene) return;

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(35, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xffe0d0 }),
    );
    head.position.set(0, 120, 0);

    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(37, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x3a1a5c }),
    );
    hair.position.set(0, 128, -4);
    hair.scale.set(1, 1.08, 1);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(5, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a1a4a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-12, 124, 30);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(12, 124, 30);

    // Eye highlights
    const hlGeo = new THREE.SphereGeometry(1.8, 8, 8);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftHl = new THREE.Mesh(hlGeo, hlMat);
    leftHl.position.set(-10, 126, 33);
    const rightHl = new THREE.Mesh(hlGeo, hlMat);
    rightHl.position.set(14, 126, 33);

    // Mouth (lip sync target)
    const mouth = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xe06080 }),
    );
    mouth.position.set(0, 106, 30);
    mouth.scale.set(1.2, 0.3, 0.5);

    // Blush
    const blushGeo = new THREE.CircleGeometry(6, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff8090,
      transparent: true,
      opacity: 0.3,
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-20, 114, 32);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(20, 114, 32);

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 25, 60, 16),
      new THREE.MeshPhongMaterial({ color: 0x6040a0 }),
    );
    body.position.set(0, 60, 0);

    const group = new THREE.Group();
    group.add(head, hair, leftEye, rightEye, leftHl, rightHl, mouth);
    group.add(leftBlush, rightBlush, body);
    this.scene.add(group);

    this._fallbackGroup = group;
    this._fallbackMouth = mouth;
    this._fallbackEyes = [leftEye, rightEye];
    console.log("[FbxController] Fallback avatar rendered — drag a .fbx to load a real model");
  }

  async reloadModel(pathOrUrl: string): Promise<void> {
    if (!this.three || !this.scene) return;
    // Try ArrayBuffer approach first (more reliable in Electron renderer)
    try {
      const url = pathOrUrl.startsWith("file://")
        ? pathOrUrl
        : "file:///" + pathOrUrl.replace(/\\/g, "/");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const resourceDir = url.replace(/\/[^/]+$/, "/");
      await this._loadFromBuffer(buffer, resourceDir);
      return;
    } catch (_fetchErr) {
      // Fall through to XHR-based loader
    }
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
      this.lipMeshes = [];
      this.lipMorphIdx = null;
    }
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    const url = pathOrUrl.startsWith("file://")
      ? pathOrUrl
      : "file:///" + pathOrUrl.replace(/\\/g, "/");
    const fbx = await new Promise<import("three").Group>((resolve, reject) => {
      new FBXLoader().load(url, resolve, undefined, reject);
    });
    this.scene.add(fbx);
    this.model = fbx;
    this.mixer = new this.three.AnimationMixer(fbx);
    this.clips = fbx.animations ?? [];
    this.resolveLipMeshes(fbx);
    this.playDefaultMotion();
  }

  /** Load FBX from an ArrayBuffer — works reliably without URL/XHR restrictions. */
  async reloadModelFromBuffer(buffer: ArrayBuffer, filePath?: string): Promise<void> {
    if (!this.three || !this.scene) return;
    const resourceDir = filePath
      ? "file:///" + filePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "/")
      : "./";
    await this._loadFromBuffer(buffer, resourceDir);
  }

  private async _loadFromBuffer(buffer: ArrayBuffer, resourceDir: string): Promise<void> {
    if (!this.three || !this.scene) return;
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
      this.lipMeshes = [];
      this.lipMorphIdx = null;
    }
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    const loader = new FBXLoader();
    // parse() accepts ArrayBuffer and skips XHR entirely
    const fbx = loader.parse(buffer, resourceDir) as import("three").Group;
    this.scene.add(fbx);
    this.model = fbx;
    this.mixer = new this.three.AnimationMixer(fbx);
    this.clips = fbx.animations ?? [];
    this.resolveLipMeshes(fbx);
    this.playDefaultMotion();
  }

  playMotion(group: string, index = 0, loop = false): void {
    if (!this.mixer || !this.clips.length || !this.three) return;
    const groupLower = group.toLowerCase();
    let clip = this.clips.find((c) => c.name.toLowerCase().includes(groupLower));
    if (!clip) clip = this.clips[index] ?? this.clips[0];
    if (!clip) return;
    this.mixer.stopAllAction();
    const action = this.mixer.clipAction(clip);
    action.setLoop(loop ? this.three.LoopRepeat : this.three.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.reset().play();
  }

  playExpression(expressionId: string): void {
    // Drive a morph target by expression name directly
    this.setMorphTarget(expressionId, 1.0);
    setTimeout(() => this.setMorphTarget(expressionId, 0), 800);
  }

  setLipSyncValue(value: number): void {
    const v = Math.max(0, Math.min(1, value));
    // Fallback avatar: drive mouth scaleY
    if (this._fallbackMouth) {
      this._fallbackMouth.scale.y = 0.3 + v * 1.2;
    }
    if (this.lipMorphIdx !== null) {
      for (const mesh of this.lipMeshes) {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[this.lipMorphIdx] = v;
        }
      }
    }
  }

  lookAt(x: number, y: number): void {
    if (!this.camera) return;
    // Tilt camera slightly towards gaze direction
    this.camera.position.set(x * 0.1, this.camera.position.y, this.camera.position.z);
    this.camera.lookAt(x * 0.05, 100 + y * 5, 0);
  }

  destroy(): void {
    this.stopRenderLoop();
    this.clips = [];
    this.mixer?.stopAllAction();
    if (this._fallbackGroup && this.scene) {
      this.scene.remove(this._fallbackGroup);
    }
    this._fallbackGroup = null;
    this._fallbackMouth = null;
    this._fallbackEyes = null;
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.model = null;
    this.mixer = null;
    this.clock = null;
    this.lipMeshes = [];
    this.lipMorphIdx = null;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private resolveLipMeshes(root: import("three").Group): void {
    root.traverse((child) => {
      const mesh = child as import("three").SkinnedMesh;
      if (!mesh.isMesh || !mesh.morphTargetDictionary) return;

      for (const key of MOUTH_OPEN_KEYS) {
        if (key in mesh.morphTargetDictionary) {
          this.lipMorphIdx = mesh.morphTargetDictionary[key]!;
          this.lipMeshes.push(mesh);
          return;
        }
      }
    });
  }

  private setMorphTarget(name: string, value: number): void {
    if (!this.model) return;
    this.model.traverse((child) => {
      const mesh = child as import("three").SkinnedMesh;
      if (!mesh.isMesh || !mesh.morphTargetDictionary) return;
      const idx = mesh.morphTargetDictionary[name];
      if (idx !== undefined && mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[idx] = value;
      }
    });
  }

  private playDefaultMotion(): void {
    if (!this.mixer || !this.three || this.clips.length === 0) {
      return;
    }
    const preferredClip =
      this.clips.find((clip) => /idle|stand|breath/i.test(clip.name)) ?? this.clips[0];
    if (!preferredClip) {
      return;
    }
    this.mixer.stopAllAction();
    const action = this.mixer.clipAction(preferredClip);
    action.setLoop(this.three.LoopRepeat, Infinity);
    action.reset().play();
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      const delta = this.clock?.getDelta() ?? 0;
      this.mixer?.update(delta);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
