import { BatchableSprite } from '../sprite/BatchableSprite.mjs';

"use strict";
class BatchableHTMLText extends BatchableSprite {
  /**
   * Creates an instance of BatchableHTMLText.
   * @param renderer - The renderer instance to be used.
   */
  constructor(renderer) {
    super();
    this.generatingTexture = false;
    this.currentKey = "--";
    this._renderer = renderer;
    renderer.runners.resolutionChange.add(this);
  }
  /** Handles resolution changes for the HTML text. If the text has auto resolution enabled, it triggers a view update. */
  resolutionChange() {
    const text = this.renderable;
    if (text._autoResolution) {
      text.onViewUpdate();
    }
  }
  /** Destroys the BatchableHTMLText instance. Returns the texture promise to the renderer and cleans up references. */
  destroy() {
    const { htmlText } = this._renderer;
    htmlText.getReferenceCount(this.currentKey) === null ? htmlText.returnTexturePromise(this.texturePromise) : htmlText.decreaseReferenceCount(this.currentKey);
    this._renderer.runners.resolutionChange.remove(this);
    this.texturePromise = null;
    this._renderer = null;
  }
}

export { BatchableHTMLText };
//# sourceMappingURL=BatchableHTMLText.mjs.map
