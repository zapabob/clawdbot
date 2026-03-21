/**
 * VRM avatar controller using Three.js + @pixiv/three-vrm.
 * Implements IAvatarController so it is interchangeable with Live2DController.
 *
 * VRM viseme BlendShape keys (VRM 1.0 Unified Expression):
 *   aa, ih, ou, ee, oh  (maps from VOICEVOX vowels a/i/u/e/o)
 */

import type { IAvatarController } from "./avatar-controller.js";

// Three.js + three-vrm are loaded as ESM from node_modules at build time.
// We use dynamic imports so the bundle is not pulled in when Live2D is active.

type ThreeModule = typeof import("three");
type VrmModule = typeof import("@pixiv/three-vrm");

// VOICEVOX vowel → VRM viseme expression name
const VOWEL_TO_VISEME: Record<string, string> = {
  a: "aa",
  i: "ih",
  u: "ou",
  e: "ee",
  o: "oh",
};

export class VrmController implements IAvatarController {
  readonly avatarType = "vrm" as const;

  private three: ThreeModule | null = null;
  private vrmMod: VrmModule | null = null;

  private renderer: import("three").WebGLRenderer | null = null;
  private scene: import("three").Scene | null = null;
  private camera: import("three").PerspectiveCamera | null = null;
  private vrm: import("@pixiv/three-vrm").VRM | null = null;
  private clock: import("three").Clock | null = null;
  private rafId: number | null = null;

  /** Current lip-sync mouth open value [0,1] */
  private lipValue = 0;
  /** Current active viseme key (VRM 1.0) */
  private activeViseme: string | null = null;

  async init(container: HTMLElement): Promise<void> {
    this.three = await import("three");
    this.vrmMod = await import("@pixiv/three-vrm");
    const THREE = this.three;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth || 380, container.clientHeight || 480);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera — slight upward tilt to show character from torso up
    this.camera = new THREE.PerspectiveCamera(
      30,
      (container.clientWidth || 380) / (container.clientHeight || 480),
      0.01,
      20,
    );
    this.camera.position.set(0, 1.3, 2.8);
    this.camera.lookAt(0, 1.0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 2);
    this.scene.add(dirLight);

    this.clock = new THREE.Clock();
    this.startRenderLoop();
  }

  async reloadModel(pathOrUrl: string): Promise<void> {
    if (!this.three || !this.vrmMod || !this.scene) return;
    // Try ArrayBuffer approach first (more reliable in Electron renderer)
    try {
      const url = pathOrUrl.startsWith("file://")
        ? pathOrUrl
        : "file:///" + pathOrUrl.replace(/\\/g, "/");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const resourcePath = url.replace(/\/[^/]+$/, "/");
      await this._loadFromBuffer(buffer, resourcePath);
      return;
    } catch (_fetchErr) {
      // Fall through to URL loader
    }
    // Remove previous VRM
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      this.vrmMod.VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const { VRMLoaderPlugin } = this.vrmMod;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const url = pathOrUrl.startsWith("file://")
      ? pathOrUrl
      : "file:///" + pathOrUrl.replace(/\\/g, "/");
    const gltf = await loader.loadAsync(url);
    const vrm = gltf.userData["vrm"] as import("@pixiv/three-vrm").VRM | undefined;
    if (!vrm) {
      console.error("[VrmController] VRM data not found in GLTF");
      return;
    }
    this.vrmMod.VRMUtils.removeUnnecessaryVertices(gltf.scene);
    vrm.scene.rotation.y = Math.PI;
    this.scene.add(vrm.scene);
    this.vrm = vrm;
  }

  /** Load VRM from an ArrayBuffer — works reliably without URL/XHR restrictions. */
  async reloadModelFromBuffer(buffer: ArrayBuffer, filePath?: string): Promise<void> {
    if (!this.three || !this.vrmMod || !this.scene) return;
    const resourcePath = filePath
      ? "file:///" + filePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "/")
      : "./";
    await this._loadFromBuffer(buffer, resourcePath);
  }

  private async _loadFromBuffer(buffer: ArrayBuffer, resourcePath: string): Promise<void> {
    if (!this.three || !this.vrmMod || !this.scene) return;
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      this.vrmMod.VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const { VRMLoaderPlugin } = this.vrmMod;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await new Promise<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>(
      (resolve, reject) => {
        loader.parse(buffer, resourcePath, resolve, reject);
      },
    );
    const vrm = gltf.userData["vrm"] as import("@pixiv/three-vrm").VRM | undefined;
    if (!vrm) {
      console.error("[VrmController] VRM data not found in GLTF");
      return;
    }
    this.vrmMod.VRMUtils.removeUnnecessaryVertices(gltf.scene);
    vrm.scene.rotation.y = Math.PI;
    this.scene.add(vrm.scene);
    this.vrm = vrm;
  }

  playMotion(_group: string, _index = 0, _loop = false): void {
    // VRM animation clips can be layered via THREE.AnimationMixer.
    // Basic stub: reset expression to neutral on motion change.
    this.clearExpression();
  }

  playExpression(expressionId: string): void {
    if (!this.vrm) return;
    this.clearExpression();
    try {
      this.vrm.expressionManager?.setValue(expressionId, 1.0);
    } catch {
      // Expression not found – ignore
    }
  }

  setLipSyncValue(value: number): void {
    this.lipValue = Math.max(0, Math.min(1, value));
    // Drive the generic "aa" viseme unless a specific vowel viseme is active
    if (!this.activeViseme && this.vrm) {
      try {
        this.vrm.expressionManager?.setValue("aa", this.lipValue);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Set an exact VOICEVOX vowel for phoneme-accurate lip sync.
   * Called by VrmLipSyncController instead of setLipSyncValue.
   */
  setViseme(vowel: string, value: number): void {
    if (!this.vrm) return;
    const key = VOWEL_TO_VISEME[vowel] ?? "aa";
    if (value > 0 && key !== this.activeViseme) {
      if (this.activeViseme) {
        try {
          this.vrm.expressionManager?.setValue(this.activeViseme, 0);
        } catch {
          // ignore
        }
      }
      this.activeViseme = key;
    }
    try {
      this.vrm.expressionManager?.setValue(key, value);
    } catch {
      // ignore
    }
    if (value === 0) this.activeViseme = null;
  }

  lookAt(x: number, y: number): void {
    if (!this.vrm?.lookAt) return;
    // three-vrm lookAt target in world space
    const dist = 2;
    this.vrm.lookAt.target = {
      getWorldPosition: (v: import("three").Vector3) => {
        v.set(x * dist, 1.3 - y * 0.3, -1);
        return v;
      },
    } as unknown as import("three").Object3D;
  }

  destroy(): void {
    this.stopRenderLoop();
    if (this.vrm && this.vrmMod) {
      this.vrmMod.VRMUtils.deepDispose(this.vrm.scene);
    }
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.vrm = null;
    this.clock = null;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private clearExpression(): void {
    if (!this.vrm) return;
    for (const key of ["happy", "sad", "surprised", "angry", "relaxed", "neutral"]) {
      try {
        this.vrm.expressionManager?.setValue(key, 0);
      } catch {
        // ignore
      }
    }
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      const delta = this.clock?.getDelta() ?? 0;
      this.vrm?.update(delta);
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
