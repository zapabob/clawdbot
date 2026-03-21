/**
 * VRM avatar controller using Three.js + @pixiv/three-vrm.
 * Implements IAvatarController so it is interchangeable with Live2DController.
 *
 * VRM viseme BlendShape keys (VRM 1.0 Unified Expression):
 *   aa, ih, ou, ee, oh  (maps from VOICEVOX vowels a/i/u/e/o)
 */
// VOICEVOX vowel → VRM viseme expression name
const VOWEL_TO_VISEME = {
  a: "aa",
  i: "ih",
  u: "ou",
  e: "ee",
  o: "oh",
};
export class VrmController {
  three = null;
  vrmMod = null;
  renderer = null;
  scene = null;
  camera = null;
  vrm = null;
  clock = null;
  rafId = null;
  /** Current lip-sync mouth open value [0,1] */
  lipValue = 0;
  /** Current active viseme key (VRM 1.0) */
  activeViseme = null;
  async init(container) {
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
  async reloadModel(pathOrUrl) {
    if (!this.three || !this.vrmMod || !this.scene) return;
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
    const vrm = gltf.userData["vrm"];
    if (!vrm) {
      console.error("[VrmController] VRM data not found in GLTF");
      return;
    }
    this.vrmMod.VRMUtils.removeUnnecessaryVertices(gltf.scene);
    // combineSkeletons was removed in @pixiv/three-vrm v2; removeUnnecessaryVertices is sufficient
    vrm.scene.rotation.y = Math.PI; // face the camera
    this.scene.add(vrm.scene);
    this.vrm = vrm;
  }
  playMotion(_group, _index = 0, _loop = false) {
    // VRM animation clips can be layered via THREE.AnimationMixer.
    // Basic stub: reset expression to neutral on motion change.
    this.clearExpression();
  }
  playExpression(expressionId) {
    if (!this.vrm) return;
    this.clearExpression();
    try {
      this.vrm.expressionManager?.setValue(expressionId, 1.0);
    } catch {
      // Expression not found – ignore
    }
  }
  setLipSyncValue(value) {
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
  setViseme(vowel, value) {
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
  lookAt(x, y) {
    if (!this.vrm?.lookAt) return;
    // three-vrm lookAt target in world space
    const dist = 2;
    this.vrm.lookAt.target = {
      getWorldPosition: (v) => {
        v.set(x * dist, 1.3 - y * 0.3, -1);
        return v;
      },
    };
  }
  destroy() {
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
  clearExpression() {
    if (!this.vrm) return;
    for (const key of ["happy", "sad", "surprised", "angry", "relaxed", "neutral"]) {
      try {
        this.vrm.expressionManager?.setValue(key, 0);
      } catch {
        // ignore
      }
    }
  }
  startRenderLoop() {
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
  stopRenderLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
