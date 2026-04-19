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
    avatarType = "vrm";
    three = null;
    vrmMod = null;
    renderer = null;
    scene = null;
    camera = null;
    vrm = null;
    clock = null;
    rafId = null;
    mixer = null;
    clips = [];
    /** Current lip-sync mouth open value [0,1] */
    lipValue = 0;
    /** Current active viseme key (VRM 1.0) */
    activeViseme = null;
    /** Fallback avatar references (when no VRM model is loaded) */
    _fallbackMouth = null;
    _fallbackGroup = null;
    _fallbackEyes = null;
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
        this.camera = new THREE.PerspectiveCamera(30, (container.clientWidth || 380) / (container.clientHeight || 480), 0.01, 20);
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
        // Auto-discover and load a model; if none found, render fallback avatar
        const modelPath = await window.companionBridge?.discoverModel?.();
        if (modelPath) {
            try {
                await this.reloadModel(modelPath);
            }
            catch (err) {
                console.warn("[VrmController] Auto-discover model load failed:", err);
                this.renderFallbackAvatar();
            }
        }
        else {
            this.renderFallbackAvatar();
        }
    }
    /** Render a simple Three.js avatar (head + eyes + mouth) when no VRM model is available */
    renderFallbackAvatar() {
        const THREE = this.three;
        if (!THREE || !this.scene)
            return;
        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), new THREE.MeshPhongMaterial({ color: 0xffe0d0 }));
        head.position.set(0, 1.2, 0);
        // Hair
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.37, 32, 32), new THREE.MeshPhongMaterial({ color: 0x3a1a5c }));
        hair.position.set(0, 1.28, -0.04);
        hair.scale.set(1, 1.08, 1);
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a1a4a });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.12, 1.24, 0.3);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.12, 1.24, 0.3);
        // Eye highlights
        const hlGeo = new THREE.SphereGeometry(0.018, 8, 8);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftHl = new THREE.Mesh(hlGeo, hlMat);
        leftHl.position.set(-0.1, 1.26, 0.33);
        const rightHl = new THREE.Mesh(hlGeo, hlMat);
        rightHl.position.set(0.14, 1.26, 0.33);
        // Mouth (lip sync target)
        const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8), new THREE.MeshBasicMaterial({ color: 0xe06080 }));
        mouth.position.set(0, 1.06, 0.3);
        mouth.scale.set(1.2, 0.3, 0.5);
        // Blush
        const blushGeo = new THREE.CircleGeometry(0.06, 16);
        const blushMat = new THREE.MeshBasicMaterial({
            color: 0xff8090,
            transparent: true,
            opacity: 0.3,
        });
        const leftBlush = new THREE.Mesh(blushGeo, blushMat);
        leftBlush.position.set(-0.2, 1.14, 0.32);
        const rightBlush = new THREE.Mesh(blushGeo, blushMat);
        rightBlush.position.set(0.2, 1.14, 0.32);
        // Body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 16), new THREE.MeshPhongMaterial({ color: 0x6040a0 }));
        body.position.set(0, 0.6, 0);
        const group = new THREE.Group();
        group.add(head, hair, leftEye, rightEye, leftHl, rightHl, mouth);
        group.add(leftBlush, rightBlush, body);
        this.scene.add(group);
        this._fallbackGroup = group;
        this._fallbackMouth = mouth;
        this._fallbackEyes = [leftEye, rightEye];
        console.log("[VrmController] Fallback avatar rendered — drag a .vrm to load a real model");
    }
    async reloadModel(pathOrUrl) {
        if (!this.three || !this.vrmMod || !this.scene)
            return;
        // Try ArrayBuffer approach first (more reliable in Electron renderer)
        try {
            const url = pathOrUrl.startsWith("file://")
                ? pathOrUrl
                : "file:///" + pathOrUrl.replace(/\\/g, "/");
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`fetch failed: ${res.status}`);
            const buffer = await res.arrayBuffer();
            const resourcePath = url.replace(/\/[^/]+$/, "/");
            await this._loadFromBuffer(buffer, resourcePath);
            return;
        }
        catch (_fetchErr) {
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
        const vrm = gltf.userData["vrm"];
        if (!vrm) {
            console.error("[VrmController] VRM data not found in GLTF");
            return;
        }
        this.vrmMod.VRMUtils.removeUnnecessaryVertices(gltf.scene);
        vrm.scene.rotation.y = Math.PI;
        this.scene.add(vrm.scene);
        this.vrm = vrm;
        if (this.mixer)
            this.mixer.stopAllAction();
        this.mixer = new this.three.AnimationMixer(vrm.scene);
        this.clips = gltf.animations ?? [];
        this.playDefaultMotion();
    }
    /** Load VRM from an ArrayBuffer — works reliably without URL/XHR restrictions. */
    async reloadModelFromBuffer(buffer, filePath) {
        if (!this.three || !this.vrmMod || !this.scene)
            return;
        const resourcePath = filePath
            ? "file:///" + filePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "/")
            : "./";
        await this._loadFromBuffer(buffer, resourcePath);
    }
    async _loadFromBuffer(buffer, resourcePath) {
        if (!this.three || !this.vrmMod || !this.scene)
            return;
        if (this.vrm) {
            this.scene.remove(this.vrm.scene);
            this.vrmMod.VRMUtils.deepDispose(this.vrm.scene);
            this.vrm = null;
        }
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { VRMLoaderPlugin } = this.vrmMod;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        const gltf = await new Promise((resolve, reject) => {
            loader.parse(buffer, resourcePath, resolve, reject);
        });
        const vrm = gltf.userData["vrm"];
        if (!vrm) {
            console.error("[VrmController] VRM data not found in GLTF");
            return;
        }
        this.vrmMod.VRMUtils.removeUnnecessaryVertices(gltf.scene);
        vrm.scene.rotation.y = Math.PI;
        this.scene.add(vrm.scene);
        this.vrm = vrm;
        if (this.mixer)
            this.mixer.stopAllAction();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.mixer = new this.three.AnimationMixer(vrm.scene);
        this.clips = gltf.animations ?? [];
        this.playDefaultMotion();
    }
    playMotion(group, index = 0, loop = false) {
        if (!this.mixer || !this.clips.length || !this.three)
            return;
        // Prefer a clip whose name contains the group name; fall back to positional index.
        const groupLower = group.toLowerCase();
        let clip = this.clips.find((c) => c.name.toLowerCase().includes(groupLower));
        if (!clip)
            clip = this.clips[index] ?? this.clips[0];
        if (!clip)
            return;
        this.mixer.stopAllAction();
        const action = this.mixer.clipAction(clip);
        action.setLoop(loop ? this.three.LoopRepeat : this.three.LoopOnce, Infinity);
        action.clampWhenFinished = !loop;
        action.reset().play();
    }
    playDefaultMotion() {
        if (!this.mixer || !this.three || this.clips.length === 0) {
            return;
        }
        const preferredClip = this.clips.find((clip) => /idle|stand|breath/i.test(clip.name)) ?? this.clips[0];
        if (!preferredClip) {
            return;
        }
        this.mixer.stopAllAction();
        const action = this.mixer.clipAction(preferredClip);
        action.setLoop(this.three.LoopRepeat, Infinity);
        action.reset().play();
    }
    playExpression(expressionId) {
        if (!this.vrm)
            return;
        this.clearExpression();
        try {
            this.vrm.expressionManager?.setValue(expressionId, 1.0);
        }
        catch {
            // Expression not found – ignore
        }
    }
    setLipSyncValue(value) {
        this.lipValue = Math.max(0, Math.min(1, value));
        // Fallback avatar: drive mouth scaleY
        if (this._fallbackMouth) {
            this._fallbackMouth.scale.y = 0.3 + this.lipValue * 1.2;
        }
        // Drive the generic "aa" viseme unless a specific vowel viseme is active
        if (!this.activeViseme && this.vrm) {
            try {
                this.vrm.expressionManager?.setValue("aa", this.lipValue);
            }
            catch {
                // ignore
            }
        }
    }
    /**
     * Set an exact VOICEVOX vowel for phoneme-accurate lip sync.
     * Called by VrmLipSyncController instead of setLipSyncValue.
     */
    setViseme(vowel, value) {
        if (!this.vrm)
            return;
        const key = VOWEL_TO_VISEME[vowel] ?? "aa";
        if (value > 0 && key !== this.activeViseme) {
            if (this.activeViseme) {
                try {
                    this.vrm.expressionManager?.setValue(this.activeViseme, 0);
                }
                catch {
                    // ignore
                }
            }
            this.activeViseme = key;
        }
        try {
            this.vrm.expressionManager?.setValue(key, value);
        }
        catch {
            // ignore
        }
        if (value === 0)
            this.activeViseme = null;
    }
    lookAt(x, y) {
        if (!this.vrm?.lookAt)
            return;
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
        this.mixer?.stopAllAction();
        this.mixer = null;
        this.clips = [];
        if (this.vrm && this.vrmMod) {
            this.vrmMod.VRMUtils.deepDispose(this.vrm.scene);
        }
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
        this.vrm = null;
        this.clock = null;
    }
    // ── Private helpers ──────────────────────────────────────────────────────
    clearExpression() {
        if (!this.vrm)
            return;
        for (const key of ["happy", "sad", "surprised", "angry", "relaxed", "neutral"]) {
            try {
                this.vrm.expressionManager?.setValue(key, 0);
            }
            catch {
                // ignore
            }
        }
    }
    startRenderLoop() {
        const loop = () => {
            this.rafId = requestAnimationFrame(loop);
            const delta = this.clock?.getDelta() ?? 0;
            this.mixer?.update(delta);
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
