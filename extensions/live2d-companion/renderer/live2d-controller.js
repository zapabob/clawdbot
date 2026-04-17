import { Live2DModel } from "pixi-live2d-display";
import * as PIXI from "pixi.js";
import companionConfig from "../companion.config.json" with { type: "json" };
// Bind PIXI ticker for pixi-live2d-display
Live2DModel.registerTicker(PIXI.Ticker);
export class Live2DController {
    avatarType = "live2d";
    app = null;
    model = null;
    lipSyncValue = 0;
    async init(container) {
        this.app = new PIXI.Application({
            width: companionConfig.window.width,
            height: companionConfig.window.height,
            backgroundAlpha: 0,
            antialias: true,
            resizeTo: container,
        });
        container.appendChild(this.app.view);
        let modelPath = companionConfig.modelPath;
        if (modelPath === "auto") {
            const found = await window.companionBridge?.discoverModel?.();
            modelPath = found ?? "./models/placeholder/placeholder.model3.json";
        }
        await this.loadModel(modelPath);
        // Lip-sync update loop
        this.app.ticker.add(() => {
            if (this.model) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.model.internalModel?.coreModel?.setParameterValueById?.("ParamMouthOpenY", this.lipSyncValue);
            }
        });
    }
    /**
     * Hot-swap the Live2D model at runtime (used by DD drop handler).
     * Accepts an absolute file-system path or a file:// URL.
     */
    async reloadModel(pathOrUrl) {
        if (this.model) {
            this.app?.stage.removeChild(this.model);
            this.model.destroy();
            this.model = null;
        }
        // Convert Windows absolute path → file:// URL
        const url = pathOrUrl.startsWith("file://")
            ? pathOrUrl
            : "file:///" + pathOrUrl.replace(/\\/g, "/");
        await this.loadModel(url);
        // Resume idle after swap
        this.playMotion("Idle", 0, true);
    }
    async loadModel(modelPath) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const model = await Live2DModel.from(modelPath, {
                autoHitTest: true,
                autoFocus: true,
            });
            const cfg = companionConfig.live2d;
            model.scale.set(cfg.scale);
            model.anchor.set(cfg.anchorX, cfg.anchorY);
            model.position.set(cfg.positionX, cfg.positionY);
            this.app.stage.addChild(model);
            this.model = model;
            // Play idle animation
            this.playMotion("Idle", 0, true);
        }
        catch (err) {
            console.warn("[Live2DController] Model load failed:", err);
            // Render placeholder text when no model is present
            this.renderPlaceholder();
        }
    }
    renderPlaceholder() {
        if (!this.app)
            return;
        const text = new PIXI.Text("Hakua\n(モデル未配置)", {
            fill: 0xffc0cb,
            fontSize: 18,
            align: "center",
            fontFamily: "sans-serif",
        });
        text.anchor.set(0.5);
        text.position.set(companionConfig.live2d.positionX, companionConfig.live2d.positionY - 60);
        this.app.stage.addChild(text);
    }
    playMotion(group, index = 0, loop = false) {
        if (!this.model)
            return;
        try {
            void this.model.motion(group, index, loop ? 3 : 2);
        }
        catch {
            // Motion not found – silently ignore
        }
    }
    playExpression(expressionId) {
        if (!this.model)
            return;
        try {
            void this.model.expression(expressionId);
        }
        catch {
            // Expression not found – silently ignore
        }
    }
    setLipSyncValue(value) {
        this.lipSyncValue = Math.max(0, Math.min(1, value));
    }
    lookAt(_x, _y) {
        // Live2D eye-tracking is handled internally by pixi-live2d-display focus
    }
    destroy() {
        this.app?.destroy(true);
        this.app = null;
        this.model = null;
    }
}
