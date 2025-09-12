'use strict';

var BatchableSprite = require('../../sprite/BatchableSprite.js');

"use strict";
class BatchableText extends BatchableSprite.BatchableSprite {
  constructor(renderer) {
    super();
    this._renderer = renderer;
    renderer.runners.resolutionChange.add(this);
  }
  resolutionChange() {
    const text = this.renderable;
    if (text._autoResolution) {
      text.onViewUpdate();
    }
  }
  destroy() {
    const { canvasText } = this._renderer;
    const refCount = canvasText.getReferenceCount(this.currentKey);
    if (refCount > 0) {
      canvasText.decreaseReferenceCount(this.currentKey);
    } else if (this.texture) {
      canvasText.returnTexture(this.texture);
    }
    this._renderer.runners.resolutionChange.remove(this);
    this._renderer = null;
  }
}

exports.BatchableText = BatchableText;
//# sourceMappingURL=BatchableText.js.map
