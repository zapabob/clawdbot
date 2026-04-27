/**
 * FBX avatar controller using Three.js FBXLoader.
 * Keeps model loading local while making repo-scale FBX files visible and animated.
 */
const MOUTH_OPEN_KEYS = [
    "MouthOpen",
    "mouthOpen",
    "Mouth_Open",
    "mouth_open",
    "jawOpen",
    "JawOpen",
];
function toFileUrl(pathOrUrl) {
    if (pathOrUrl.startsWith("file://")) {
        return pathOrUrl;
    }
    const normalized = pathOrUrl.replace(/\\/g, "/");
    const prefixed = normalized.startsWith("/") ? `file://${normalized}` : `file:///${normalized}`;
    return encodeURI(prefixed);
}
function resourceDirFromFileUrl(url) {
    return url.replace(/\/[^/]*$/, "/");
}
export class FbxController {
    avatarType = "fbx";
    three = null;
    renderer = null;
    scene = null;
    camera = null;
    mixer = null;
    clock = null;
    model = null;
    rafId = null;
    lipMeshes = [];
    lipMorphIdx = null;
    clips = [];
    fallbackMouth = null;
    fallbackGroup = null;
    fallbackEyes = null;
    baseModelY = 0;
    baseModelScale = 1;
    idleTime = 0;
    expressionPulse = 0;
    gaze = { x: 0, y: 0 };
    async init(container) {
        this.three = await import("three");
        const THREE = this.three;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.clientWidth || 380, container.clientHeight || 480);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, (container.clientWidth || 380) / (container.clientHeight || 480), 0.01, 10000);
        this.camera.position.set(0, 130, 320);
        this.camera.lookAt(0, 100, 0);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.68));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(1, 2, 2);
        this.scene.add(dirLight);
        this.clock = new THREE.Clock();
        this.startRenderLoop();
        const modelPath = await window.companionBridge?.discoverModel?.();
        if (!modelPath) {
            this.renderFallbackAvatar();
            return;
        }
        try {
            await this.reloadModel(modelPath);
        }
        catch (error) {
            console.warn("[FbxController] Auto-discovered FBX load failed:", error);
            this.renderFallbackAvatar();
        }
    }
    async reloadModel(pathOrUrl) {
        if (!this.three || !this.scene) {
            return;
        }
        const url = toFileUrl(pathOrUrl);
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`fetch failed: ${res.status}`);
            }
            await this.loadFromBuffer(await res.arrayBuffer(), resourceDirFromFileUrl(url));
            return;
        }
        catch (fetchError) {
            console.warn("[FbxController] fetch load failed; falling back to FBXLoader URL mode:", fetchError);
        }
        const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
        const fbx = await new Promise((resolve, reject) => {
            new FBXLoader().load(url, resolve, undefined, reject);
        });
        this.prepareLoadedModel(fbx);
    }
    async reloadModelFromBuffer(buffer, filePath) {
        const resourceDir = filePath ? resourceDirFromFileUrl(toFileUrl(filePath)) : "./";
        await this.loadFromBuffer(buffer, resourceDir);
    }
    playMotion(group, index = 0, loop = false) {
        if (!this.mixer || !this.clips.length || !this.three) {
            this.expressionPulse = 1;
            return;
        }
        const groupLower = group.toLowerCase();
        const clip = this.clips.find((candidate) => candidate.name.toLowerCase().includes(groupLower)) ??
            this.clips[index] ??
            this.clips[0];
        if (!clip) {
            return;
        }
        this.mixer.stopAllAction();
        const action = this.mixer.clipAction(clip);
        action.setLoop(loop ? this.three.LoopRepeat : this.three.LoopOnce, Infinity);
        action.clampWhenFinished = !loop;
        action.reset().play();
    }
    playExpression(expressionId) {
        this.setMorphTarget(expressionId, 1);
        this.expressionPulse = 1;
        window.setTimeout(() => this.setMorphTarget(expressionId, 0), 800);
    }
    setLipSyncValue(value) {
        const v = Math.max(0, Math.min(1, value));
        if (this.fallbackMouth) {
            this.fallbackMouth.scale.y = 0.3 + v * 1.2;
        }
        if (this.lipMorphIdx === null) {
            this.expressionPulse = Math.max(this.expressionPulse, v * 0.55);
            return;
        }
        for (const mesh of this.lipMeshes) {
            if (mesh.morphTargetInfluences) {
                mesh.morphTargetInfluences[this.lipMorphIdx] = v;
            }
        }
    }
    lookAt(x, y) {
        this.gaze = {
            x: Math.max(-1, Math.min(1, x)),
            y: Math.max(-1, Math.min(1, y)),
        };
        this.updateCameraLookAt();
    }
    destroy() {
        this.stopRenderLoop();
        this.clips = [];
        this.mixer?.stopAllAction();
        if (this.fallbackGroup && this.scene) {
            this.scene.remove(this.fallbackGroup);
        }
        this.fallbackGroup = null;
        this.fallbackMouth = null;
        this.fallbackEyes = null;
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
    renderFallbackAvatar() {
        const THREE = this.three;
        if (!THREE || !this.scene) {
            return;
        }
        const head = new THREE.Mesh(new THREE.SphereGeometry(35, 32, 32), new THREE.MeshPhongMaterial({ color: 0xffe0d0 }));
        head.position.set(0, 120, 0);
        const hair = new THREE.Mesh(new THREE.SphereGeometry(37, 32, 32), new THREE.MeshPhongMaterial({ color: 0x3a1a5c }));
        hair.position.set(0, 128, -4);
        hair.scale.set(1, 1.08, 1);
        const eyeGeo = new THREE.SphereGeometry(5, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a1a4a });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-12, 124, 30);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(12, 124, 30);
        const mouth = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({ color: 0xe06080 }));
        mouth.position.set(0, 106, 30);
        mouth.scale.set(1.2, 0.3, 0.5);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(20, 25, 60, 16), new THREE.MeshPhongMaterial({ color: 0x6040a0 }));
        body.position.set(0, 60, 0);
        const group = new THREE.Group();
        group.add(head, hair, leftEye, rightEye, mouth, body);
        this.scene.add(group);
        this.fallbackGroup = group;
        this.fallbackMouth = mouth;
        this.fallbackEyes = [leftEye, rightEye];
        console.log("[FbxController] Fallback avatar rendered; load a local .fbx for the real model.");
    }
    async loadFromBuffer(buffer, resourceDir) {
        if (!this.three || !this.scene) {
            return;
        }
        const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
        const fbx = new FBXLoader().parse(buffer, resourceDir);
        this.prepareLoadedModel(fbx);
    }
    prepareLoadedModel(fbx) {
        if (!this.three || !this.scene) {
            return;
        }
        if (this.model) {
            this.scene.remove(this.model);
        }
        if (this.fallbackGroup) {
            this.scene.remove(this.fallbackGroup);
            this.fallbackGroup = null;
            this.fallbackMouth = null;
            this.fallbackEyes = null;
        }
        this.model = fbx;
        this.scene.add(fbx);
        this.mixer = new this.three.AnimationMixer(fbx);
        this.clips = fbx.animations ?? [];
        this.lipMeshes = [];
        this.lipMorphIdx = null;
        this.frameLoadedModel(fbx);
        this.resolveLipMeshes(fbx);
        this.playDefaultMotion();
    }
    frameLoadedModel(root) {
        if (!this.three || !this.camera) {
            return;
        }
        root.updateMatrixWorld(true);
        const box = new this.three.Box3().setFromObject(root);
        const size = box.getSize(new this.three.Vector3());
        const center = box.getCenter(new this.three.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxAxis) || maxAxis <= 0) {
            this.camera.position.set(0, 130, 360);
            this.camera.lookAt(0, 100, 0);
            return;
        }
        const targetHeight = 170;
        const scale = targetHeight / Math.max(size.y, maxAxis * 0.65);
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -box.min.y * scale + 4, -center.z * scale);
        root.updateMatrixWorld(true);
        const framedBox = new this.three.Box3().setFromObject(root);
        const framedSize = framedBox.getSize(new this.three.Vector3());
        this.baseModelY = root.position.y;
        this.baseModelScale = scale;
        const targetY = Math.max(72, framedSize.y * 0.6);
        const distance = Math.max(300, Math.max(framedSize.x, framedSize.y, framedSize.z) * 2.7);
        this.camera.near = 0.01;
        this.camera.far = Math.max(10000, distance * 6);
        this.camera.position.set(0, targetY, distance);
        this.camera.updateProjectionMatrix();
        this.updateCameraLookAt(targetY);
    }
    resolveLipMeshes(root) {
        root.traverse((child) => {
            const mesh = child;
            if (!mesh.isMesh || !mesh.morphTargetDictionary) {
                return;
            }
            for (const key of MOUTH_OPEN_KEYS) {
                if (key in mesh.morphTargetDictionary) {
                    this.lipMorphIdx = mesh.morphTargetDictionary[key];
                    this.lipMeshes.push(mesh);
                    return;
                }
            }
        });
    }
    setMorphTarget(name, value) {
        if (!this.model) {
            return;
        }
        this.model.traverse((child) => {
            const mesh = child;
            if (!mesh.isMesh || !mesh.morphTargetDictionary) {
                return;
            }
            const idx = mesh.morphTargetDictionary[name];
            if (idx !== undefined && mesh.morphTargetInfluences) {
                mesh.morphTargetInfluences[idx] = value;
            }
        });
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
    applyFallbackMotion(delta) {
        if (!this.model) {
            this.animateFallbackFace(delta);
            return;
        }
        this.idleTime += delta;
        if (this.clips.length === 0) {
            this.model.rotation.y = Math.sin(this.idleTime * 0.75) * 0.045 + this.gaze.x * 0.08;
            this.model.rotation.x = this.gaze.y * 0.035;
            this.model.position.y = this.baseModelY + Math.sin(this.idleTime * 1.8) * 1.4;
        }
        if (this.expressionPulse > 0) {
            this.expressionPulse = Math.max(0, this.expressionPulse - delta * 2.4);
            const pulseScale = this.baseModelScale * (1 + Math.sin(this.expressionPulse * Math.PI) * 0.025);
            this.model.scale.setScalar(pulseScale);
        }
        else if (this.model.scale.x !== this.baseModelScale) {
            this.model.scale.setScalar(this.baseModelScale);
        }
    }
    animateFallbackFace(delta) {
        if (!this.fallbackGroup) {
            return;
        }
        this.idleTime += delta;
        this.fallbackGroup.rotation.y = Math.sin(this.idleTime * 0.75) * 0.04 + this.gaze.x * 0.08;
        this.fallbackGroup.position.y = Math.sin(this.idleTime * 1.8) * 1.2;
    }
    updateCameraLookAt(defaultTargetY = 100) {
        if (!this.camera) {
            return;
        }
        this.camera.lookAt(this.gaze.x * 30, defaultTargetY + this.gaze.y * 22, 0);
    }
    startRenderLoop() {
        const loop = () => {
            this.rafId = requestAnimationFrame(loop);
            const delta = this.clock?.getDelta() ?? 0;
            this.mixer?.update(delta);
            this.applyFallbackMotion(delta);
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
