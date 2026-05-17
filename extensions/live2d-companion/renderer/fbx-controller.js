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
const AVATAR_RIG_BONES = [
  "head",
  "neck",
  "chest",
  "spine",
  "hips",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "rightUpperLeg",
  "rightLowerLeg",
];
const RIG_BONE_MATCHERS = {
  head: [/j[_-]?bip[_-]?c[_-]?head/i, /(^|[_\-.])head($|[_\-.])/i, /頭|atama/i],
  neck: [/j[_-]?bip[_-]?c[_-]?neck/i, /neck/i, /首|kubi/i],
  chest: [/upper.?chest/i, /j[_-]?bip[_-]?c[_-]?chest/i, /chest|bust/i, /胸/i],
  spine: [/j[_-]?bip[_-]?c[_-]?spine/i, /spine/i, /上半身|body/i],
  hips: [/j[_-]?bip[_-]?c[_-]?hips/i, /hips|pelvis/i, /腰/i],
  leftUpperArm: [
    /j[_-]?bip[_-]?l[_-]?upper.?arm/i,
    /mixamorigleftarm/i,
    /left.*upper.*arm/i,
    /left.*arm/i,
    /(^|[_\-.])l[_\-.].*upper.?arm/i,
  ],
  leftLowerArm: [
    /j[_-]?bip[_-]?l[_-]?lower.?arm/i,
    /mixamorigleftforearm/i,
    /left.*(?:lower|fore).*arm/i,
    /(^|[_\-.])l[_\-.].*(?:lower|fore).*arm/i,
  ],
  leftHand: [
    /j[_-]?bip[_-]?l[_-]?hand/i,
    /mixamoriglefthand/i,
    /left.*hand/i,
    /(^|[_\-.])l[_\-.].*hand/i,
  ],
  rightUpperArm: [
    /j[_-]?bip[_-]?r[_-]?upper.?arm/i,
    /mixamorigrightarm/i,
    /right.*upper.*arm/i,
    /right.*arm/i,
    /(^|[_\-.])r[_\-.].*upper.?arm/i,
  ],
  rightLowerArm: [
    /j[_-]?bip[_-]?r[_-]?lower.?arm/i,
    /mixamorigrightforearm/i,
    /right.*(?:lower|fore).*arm/i,
    /(^|[_\-.])r[_\-.].*(?:lower|fore).*arm/i,
  ],
  rightHand: [
    /j[_-]?bip[_-]?r[_-]?hand/i,
    /mixamorigthand/i,
    /mixamorigrighthand/i,
    /right.*hand/i,
    /(^|[_\-.])r[_\-.].*hand/i,
  ],
  leftUpperLeg: [
    /j[_-]?bip[_-]?l[_-]?upper.?leg/i,
    /mixamorigleftupleg/i,
    /left.*upper.*leg/i,
    /left.*thigh/i,
  ],
  leftLowerLeg: [
    /j[_-]?bip[_-]?l[_-]?lower.?leg/i,
    /mixamorigleftleg/i,
    /left.*(?:lower.*leg|calf|shin)/i,
  ],
  rightUpperLeg: [
    /j[_-]?bip[_-]?r[_-]?upper.?leg/i,
    /mixamorigrightupleg/i,
    /right.*upper.*leg/i,
    /right.*thigh/i,
  ],
  rightLowerLeg: [
    /j[_-]?bip[_-]?r[_-]?lower.?leg/i,
    /mixamorigrightleg/i,
    /right.*(?:lower.*leg|calf|shin)/i,
  ],
};
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
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function buildTextureResourceDirs(resourceDir) {
  const normalized = ensureTrailingSlash(resourceDir.replace(/\\/g, "/"));
  const dirs = [normalized, `${normalized}Textures/`];
  if (/\/FBX\/FBX\/$/i.test(normalized)) {
    const parentFbxDir = normalized.replace(/\/FBX\/FBX\/$/i, "/FBX/");
    dirs.push(parentFbxDir, `${parentFbxDir}Textures/`);
  }
  return Array.from(new Set(dirs));
}
function rewriteTextureUrl(assetUrl, resourceDirs) {
  const normalized = assetUrl.replace(/\\/g, "/");
  if (!/\.(?:png|jpe?g|webp|bmp|gif|tga)(?:[?#].*)?$/i.test(normalized)) {
    return assetUrl;
  }
  if (!resourceDirs.length || !/\/FBX\/FBX\//i.test(resourceDirs[0])) {
    return assetUrl;
  }
  const fileName = normalized.split("/").pop()?.split("?")[0]?.split("#")[0];
  if (!fileName) {
    return assetUrl;
  }
  return `${resourceDirs[2] ?? resourceDirs[0]}${fileName}`;
}
function normalizeMotionName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}
function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}
function clampRadians(value) {
  return Math.max(-Math.PI, Math.min(Math.PI, value));
}
function toPoseRadians(value, radians) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return clampRadians(radians ? value : degreesToRadians(value));
}
function addTarget(targets, bone, patch) {
  const current = targets.get(bone) ?? { x: 0, y: 0, z: 0 };
  targets.set(bone, {
    x: current.x + (patch.x ?? 0),
    y: current.y + (patch.y ?? 0),
    z: current.z + (patch.z ?? 0),
  });
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
  baseModelY = 0;
  baseModelScale = 1;
  idleTime = 0;
  expressionPulse = 0;
  gaze = { x: 0, y: 0 };
  rigBones = new Map();
  poseTargets = new Map();
  proceduralGesture = null;
  async init(container) {
    this.three = await import("three");
    const THREE = this.three;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth || 380, container.clientHeight || 480);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      30,
      (container.clientWidth || 380) / (container.clientHeight || 480),
      0.01,
      10000,
    );
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
    } catch (error) {
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
    } catch (fetchError) {
      console.warn(
        "[FbxController] fetch load failed; falling back to FBXLoader URL mode:",
        fetchError,
      );
    }
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    const manager = this.createTextureLoadingManager(resourceDirFromFileUrl(url));
    const fbx = await new Promise((resolve, reject) => {
      new FBXLoader(manager).load(url, resolve, undefined, reject);
    });
    this.prepareLoadedModel(fbx);
  }
  async reloadModelFromBuffer(buffer, filePath) {
    const resourceDir = filePath ? resourceDirFromFileUrl(toFileUrl(filePath)) : "./";
    await this.loadFromBuffer(buffer, resourceDir);
  }
  playMotion(group, index = 0, loop = false) {
    const requestedMotion = group.trim() || "idle";
    if (!this.mixer || !this.clips.length || !this.three) {
      this.startProceduralGesture(requestedMotion, loop);
      return;
    }
    const groupLower = requestedMotion.toLowerCase();
    const matchedClip = this.clips.find((candidate) =>
      candidate.name.toLowerCase().includes(groupLower),
    );
    const indexedClip = this.clips[index];
    const clip =
      matchedClip ??
      (/idle|stand|breath/i.test(requestedMotion) ? (indexedClip ?? this.clips[0]) : indexedClip);
    if (!clip) {
      this.startProceduralGesture(requestedMotion, loop);
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
    this.startProceduralGesture(expressionId, false);
    window.setTimeout(() => this.setMorphTarget(expressionId, 0), 800);
  }
  applyPose(pose) {
    if (pose.reset) {
      this.poseTargets.clear();
    }
    const radians = pose.radians === true;
    for (const bone of AVATAR_RIG_BONES) {
      const rotation = pose[bone];
      if (!rotation) {
        continue;
      }
      this.poseTargets.set(
        bone,
        this.mergePoseTarget(this.poseTargets.get(bone), rotation, radians),
      );
    }
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
    this.rigBones.clear();
    this.poseTargets.clear();
    this.proceduralGesture = null;
  }
  renderFallbackAvatar() {
    const THREE = this.three;
    if (!THREE || !this.scene) {
      return;
    }
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(35, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xffe0d0 }),
    );
    head.position.set(0, 120, 0);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(37, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x3a1a5c }),
    );
    hair.position.set(0, 128, -4);
    hair.scale.set(1, 1.08, 1);
    const eyeGeo = new THREE.SphereGeometry(5, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a1a4a });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-12, 124, 30);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(12, 124, 30);
    const mouth = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xe06080 }),
    );
    mouth.position.set(0, 106, 30);
    mouth.scale.set(1.2, 0.3, 0.5);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 25, 60, 16),
      new THREE.MeshPhongMaterial({ color: 0x6040a0 }),
    );
    body.position.set(0, 60, 0);
    const group = new THREE.Group();
    group.add(head, hair, leftEye, rightEye, mouth, body);
    this.scene.add(group);
    this.fallbackGroup = group;
    this.fallbackMouth = mouth;
    console.log("[FbxController] Fallback avatar rendered; load a local .fbx for the real model.");
  }
  async loadFromBuffer(buffer, resourceDir) {
    if (!this.three || !this.scene) {
      return;
    }
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    const manager = this.createTextureLoadingManager(resourceDir);
    const fbx = new FBXLoader(manager).parse(buffer, resourceDir);
    this.prepareLoadedModel(fbx);
  }
  createTextureLoadingManager(resourceDir) {
    if (!this.three) {
      return undefined;
    }
    const manager = new this.three.LoadingManager();
    const resourceDirs = buildTextureResourceDirs(resourceDir);
    manager.setURLModifier((assetUrl) => rewriteTextureUrl(assetUrl, resourceDirs));
    return manager;
  }
  mergePoseTarget(current, rotation, radians) {
    const next = current ?? { x: 0, y: 0, z: 0 };
    return {
      x: toPoseRadians(rotation.x, radians) ?? next.x,
      y: toPoseRadians(rotation.y, radians) ?? next.y,
      z: toPoseRadians(rotation.z, radians) ?? next.z,
    };
  }
  startProceduralGesture(name, loop) {
    const normalized = normalizeMotionName(name);
    if (normalized === "idle" || normalized === "stand" || normalized === "reset") {
      this.proceduralGesture = null;
      if (normalized === "reset") {
        this.poseTargets.clear();
      }
      return;
    }
    this.proceduralGesture = {
      name: normalized,
      startedAt: this.idleTime,
      loop,
      duration: loop ? 2.4 : 1.6,
    };
    this.expressionPulse = Math.max(this.expressionPulse, 0.8);
  }
  resolveRigBones(root) {
    this.rigBones.clear();
    const objects = [];
    root.traverse((child) => {
      const candidate = child;
      if (candidate.isBone || candidate.type === "Bone") {
        objects.push(candidate);
      }
    });
    for (const bone of AVATAR_RIG_BONES) {
      const object = objects.find((candidate) =>
        RIG_BONE_MATCHERS[bone].some((matcher) => matcher.test(candidate.name)),
      );
      if (!object) {
        continue;
      }
      this.rigBones.set(bone, {
        object,
        baseRotation: object.rotation.clone(),
      });
    }
    if (this.rigBones.size > 0) {
      console.info(
        `[FbxController] Procedural rig enabled: ${Array.from(this.rigBones.keys()).join(", ")}`,
      );
    }
  }
  buildProceduralTargets() {
    const targets = new Map();
    const idleSway = Math.sin(this.idleTime * 1.35);
    const idleBreath = Math.sin(this.idleTime * 2.0);
    addTarget(targets, "spine", { x: degreesToRadians(idleBreath * 1.1) });
    addTarget(targets, "chest", { z: degreesToRadians(idleSway * 1.2) });
    addTarget(targets, "head", {
      x: degreesToRadians(this.gaze.y * 6 + idleBreath * 1.2),
      y: degreesToRadians(this.gaze.x * 11 + idleSway * 1.8),
    });
    addTarget(targets, "neck", {
      x: degreesToRadians(this.gaze.y * 3),
      y: degreesToRadians(this.gaze.x * 5),
    });
    this.applyGestureTargets(targets);
    for (const [bone, target] of this.poseTargets) {
      addTarget(targets, bone, target);
    }
    return targets;
  }
  applyGestureTargets(targets) {
    const gesture = this.proceduralGesture;
    if (!gesture) {
      return;
    }
    const elapsed = Math.max(0, this.idleTime - gesture.startedAt);
    const progress = gesture.loop
      ? (elapsed % gesture.duration) / gesture.duration
      : Math.min(1, elapsed / gesture.duration);
    const fade = gesture.loop ? 1 : Math.sin(Math.PI * progress);
    const wave = Math.sin(progress * Math.PI * 2);
    const snap = Math.sin(progress * Math.PI);
    if (!gesture.loop && elapsed > gesture.duration) {
      this.proceduralGesture = null;
      return;
    }
    switch (gesture.name) {
      case "wave":
      case "hello":
      case "greet":
        addTarget(targets, "rightUpperArm", {
          x: degreesToRadians(-24 * fade),
          z: degreesToRadians(-34 * fade),
        });
        addTarget(targets, "rightLowerArm", {
          y: degreesToRadians(28 * wave * fade),
          z: degreesToRadians(-54 * fade),
        });
        addTarget(targets, "rightHand", { y: degreesToRadians(35 * wave * fade) });
        break;
      case "happy":
      case "cheer":
        addTarget(targets, "head", { z: degreesToRadians(6 * wave * fade) });
        addTarget(targets, "leftUpperArm", {
          x: degreesToRadians(-10 * fade),
          z: degreesToRadians(26 * fade),
        });
        addTarget(targets, "rightUpperArm", {
          x: degreesToRadians(-10 * fade),
          z: degreesToRadians(-26 * fade),
        });
        addTarget(targets, "leftLowerArm", { z: degreesToRadians(22 * snap) });
        addTarget(targets, "rightLowerArm", { z: degreesToRadians(-22 * snap) });
        break;
      case "surprised":
      case "surprise":
        addTarget(targets, "head", { x: degreesToRadians(-8 * fade) });
        addTarget(targets, "spine", { x: degreesToRadians(-5 * fade) });
        addTarget(targets, "leftUpperArm", { z: degreesToRadians(34 * fade) });
        addTarget(targets, "rightUpperArm", { z: degreesToRadians(-34 * fade) });
        break;
      case "bow":
        addTarget(targets, "spine", { x: degreesToRadians(24 * fade) });
        addTarget(targets, "chest", { x: degreesToRadians(14 * fade) });
        addTarget(targets, "head", { x: degreesToRadians(10 * fade) });
        break;
      case "nod":
        addTarget(targets, "head", { x: degreesToRadians(14 * wave * fade) });
        break;
      case "shake":
      case "no":
        addTarget(targets, "head", { y: degreesToRadians(18 * wave * fade) });
        break;
      case "point-left":
      case "left":
        addTarget(targets, "leftUpperArm", {
          y: degreesToRadians(-24 * fade),
          z: degreesToRadians(36 * fade),
        });
        addTarget(targets, "leftLowerArm", { z: degreesToRadians(14 * fade) });
        addTarget(targets, "head", { y: degreesToRadians(-8 * fade) });
        break;
      case "point-right":
      case "right":
        addTarget(targets, "rightUpperArm", {
          y: degreesToRadians(24 * fade),
          z: degreesToRadians(-36 * fade),
        });
        addTarget(targets, "rightLowerArm", { z: degreesToRadians(-14 * fade) });
        addTarget(targets, "head", { y: degreesToRadians(8 * fade) });
        break;
      case "dance":
      case "sway":
        addTarget(targets, "hips", {
          y: degreesToRadians(5 * snap),
          z: degreesToRadians(7 * wave),
        });
        addTarget(targets, "spine", { z: degreesToRadians(-5 * wave) });
        addTarget(targets, "leftUpperArm", { z: degreesToRadians(18 * wave) });
        addTarget(targets, "rightUpperArm", { z: degreesToRadians(18 * wave) });
        break;
      default:
        addTarget(targets, "head", { z: degreesToRadians(5 * wave * fade) });
        addTarget(targets, "chest", { z: degreesToRadians(4 * wave * fade) });
        break;
    }
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
    }
    this.model = fbx;
    this.scene.add(fbx);
    this.mixer = new this.three.AnimationMixer(fbx);
    this.clips = fbx.animations ?? [];
    this.lipMeshes = [];
    this.lipMorphIdx = null;
    this.frameLoadedModel(fbx);
    this.resolveLipMeshes(fbx);
    this.resolveRigBones(fbx);
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
  applyProceduralRig(delta) {
    if (this.rigBones.size === 0) {
      return;
    }
    const targets = this.buildProceduralTargets();
    const alpha = Math.min(1, Math.max(0.08, delta * 10));
    for (const [bone, binding] of this.rigBones) {
      const target = targets.get(bone) ?? { x: 0, y: 0, z: 0 };
      binding.object.rotation.x +=
        (binding.baseRotation.x + target.x - binding.object.rotation.x) * alpha;
      binding.object.rotation.y +=
        (binding.baseRotation.y + target.y - binding.object.rotation.y) * alpha;
      binding.object.rotation.z +=
        (binding.baseRotation.z + target.z - binding.object.rotation.z) * alpha;
    }
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
    this.applyProceduralRig(delta);
    if (this.expressionPulse > 0) {
      this.expressionPulse = Math.max(0, this.expressionPulse - delta * 2.4);
      const pulseScale =
        this.baseModelScale * (1 + Math.sin(this.expressionPulse * Math.PI) * 0.025);
      this.model.scale.setScalar(pulseScale);
    } else if (this.model.scale.x !== this.baseModelScale) {
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
