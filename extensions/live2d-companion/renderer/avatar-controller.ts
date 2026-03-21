/**
 * Common interface for all avatar backends (Live2D / VRM / FBX).
 * Concrete controllers implement this so lip-sync, emotion-mapper,
 * and app.ts can work with any avatar type.
 */
export interface IAvatarController {
  /** Mount the rendering canvas into the given DOM container and load the default model. */
  init(container: HTMLElement): Promise<void>;

  /** Hot-swap the avatar model at runtime. Accepts a file-system path or file:// URL. */
  reloadModel(pathOrUrl: string): Promise<void>;

  /**
   * Trigger a named motion/animation.
   * @param group  Motion group name (e.g. "Idle", "TapBody")
   * @param index  Index within the group
   * @param loop   Whether to loop the animation
   */
  playMotion(group: string, index?: number, loop?: boolean): void;

  /**
   * Apply a named expression/blend-shape preset.
   * @param expressionId  Expression name or blend-shape preset key
   */
  playExpression(expressionId: string): void;

  /**
   * Set the mouth-open amount for lip sync (0 = closed, 1 = fully open).
   */
  setLipSyncValue(value: number): void;

  /**
   * Make the avatar's eyes look towards a normalised viewport position.
   * (-1,-1) = top-left, (0,0) = centre, (1,1) = bottom-right
   */
  lookAt(x: number, y: number): void;

  /** Clean up all GPU / audio resources and remove the canvas. */
  destroy(): void;
}
