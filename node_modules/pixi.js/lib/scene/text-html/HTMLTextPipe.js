'use strict';

var Extensions = require('../../extensions/Extensions.js');
var Texture = require('../../rendering/renderers/shared/texture/Texture.js');
var updateTextBounds = require('../text/utils/updateTextBounds.js');
var BatchableHTMLText = require('./BatchableHTMLText.js');

"use strict";
class HTMLTextPipe {
  constructor(renderer) {
    this._renderer = renderer;
  }
  validateRenderable(htmlText) {
    const gpuText = this._getGpuText(htmlText);
    const newKey = htmlText.styleKey;
    if (gpuText.currentKey !== newKey) {
      return true;
    }
    return false;
  }
  addRenderable(htmlText, instructionSet) {
    const batchableHTMLText = this._getGpuText(htmlText);
    if (htmlText._didTextUpdate) {
      const resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
      if (batchableHTMLText.currentKey !== htmlText.styleKey || htmlText.resolution !== resolution) {
        this._updateGpuText(htmlText).catch((e) => {
          console.error(e);
        });
      }
      htmlText._didTextUpdate = false;
      updateTextBounds.updateTextBounds(batchableHTMLText, htmlText);
    }
    this._renderer.renderPipes.batch.addToBatch(batchableHTMLText, instructionSet);
  }
  updateRenderable(htmlText) {
    const batchableHTMLText = this._getGpuText(htmlText);
    batchableHTMLText._batcher.updateElement(batchableHTMLText);
  }
  async _updateGpuText(htmlText) {
    htmlText._didTextUpdate = false;
    const batchableHTMLText = this._getGpuText(htmlText);
    if (batchableHTMLText.generatingTexture)
      return;
    const oldTexturePromise = batchableHTMLText.texturePromise;
    batchableHTMLText.texturePromise = null;
    batchableHTMLText.generatingTexture = true;
    htmlText._resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
    let texturePromise = this._renderer.htmlText.getTexturePromise(htmlText);
    if (oldTexturePromise) {
      texturePromise = texturePromise.finally(() => {
        this._renderer.htmlText.decreaseReferenceCount(batchableHTMLText.currentKey);
        this._renderer.htmlText.returnTexturePromise(oldTexturePromise);
      });
    }
    batchableHTMLText.texturePromise = texturePromise;
    batchableHTMLText.currentKey = htmlText.styleKey;
    batchableHTMLText.texture = await texturePromise;
    const renderGroup = htmlText.renderGroup || htmlText.parentRenderGroup;
    if (renderGroup) {
      renderGroup.structureDidChange = true;
    }
    batchableHTMLText.generatingTexture = false;
    updateTextBounds.updateTextBounds(batchableHTMLText, htmlText);
  }
  _getGpuText(htmlText) {
    return htmlText._gpuData[this._renderer.uid] || this.initGpuText(htmlText);
  }
  initGpuText(htmlText) {
    const batchableHTMLText = new BatchableHTMLText.BatchableHTMLText(this._renderer);
    batchableHTMLText.renderable = htmlText;
    batchableHTMLText.transform = htmlText.groupTransform;
    batchableHTMLText.texture = Texture.Texture.EMPTY;
    batchableHTMLText.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 };
    batchableHTMLText.roundPixels = this._renderer._roundPixels | htmlText._roundPixels;
    htmlText._resolution = htmlText._autoResolution ? this._renderer.resolution : htmlText.resolution;
    htmlText._gpuData[this._renderer.uid] = batchableHTMLText;
    return batchableHTMLText;
  }
  destroy() {
    this._renderer = null;
  }
}
/** @ignore */
HTMLTextPipe.extension = {
  type: [
    Extensions.ExtensionType.WebGLPipes,
    Extensions.ExtensionType.WebGPUPipes,
    Extensions.ExtensionType.CanvasPipes
  ],
  name: "htmlText"
};

exports.HTMLTextPipe = HTMLTextPipe;
//# sourceMappingURL=HTMLTextPipe.js.map
