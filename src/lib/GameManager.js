import { PREFERRED_IMAGE, SETTING_IDS } from '../constants.js';
import { $M, getIsAnimatedImage, sortTokensByName } from '../utils.js';
import { CategoryList } from './CategoryList.js';

const EMPTY_IMAGE = {
  src: '',
  animated: false,
};

export class GameManager {
  getScene() {
    if (!canvas || !canvas.scene) {
      return;
    }

    return canvas.scene;
  }

  /**
   * @returns {TokenDocument[]}
   */
  getSceneTokens() {
    if (
      !canvas ||
      !canvas.scene ||
      !canvas.scene.tokens ||
      !canvas.scene.tokens.contents
    ) {
      return [];
    }

    return canvas.scene.tokens.contents.slice().sort(sortTokensByName);
  }

  getToken(tokenId) {
    if (
      !canvas ||
      !canvas.tokens ||
      !canvas.tokens.objects ||
      !canvas.tokens.objects.children
    ) {
      return;
    }

    return canvas.tokens.objects.children.find(token => token.id === tokenId);
  }

  getSelectedTokens() {
    if (!canvas || !canvas.tokens || !canvas.tokens.controlled) {
      return [];
    }

    return canvas.tokens.controlled.map(token => token.id);
  }

  getTargetedTokens() {
    if (!game || !game.user || !game.user.targets) {
      return [];
    }

    return game.user.targets.map(token => token.id);
  }

  panToPosition(position) {
    if (!canvas) {
      return;
    }

    canvas.animatePan(position);
  }

  targetToken(tokenId) {
    const target = this.getToken(tokenId);

    if (!target) {
      return;
    }

    target.setTarget(true, { releaseOthers: true });
    this.panToPosition(target.position);
    return target;
  }

  /**
   * @param token TokenDocument
   * @returns string | undefined
   */
  getTokenDocumentDisposition(token) {
    if (!token.disposition) {
      return;
    }

    return CategoryList.formatDispositionId(token.disposition);
  }

  /**
   * @param token TokenDocument
   * @returns string | undefined
   */
  getTokenDocumentType(token) {
    if (!token.actor || !token.actor.type) {
      return;
    }

    return CategoryList.formatTypeId(token.actor.type);
  }

  /**
   * @param token TokenDocument
   * @returns {{ src: string; animated: boolean }}
   */
  getTokenDocumentImage(token) {
    if (!token) {
      return EMPTY_IMAGE;
    }

    const preferredImage = $M().settings.get(SETTING_IDS.PREFERRED_IMAGE);
    const actorImage = token?.actor?.img;
    let image = token?.texture?.src;

    if (
      (preferredImage === PREFERRED_IMAGE.ACTOR && actorImage) ||
      (!image && actorImage)
    ) {
      image = actorImage;
    }

    return {
      src: image ?? '',
      animated: getIsAnimatedImage(image),
    };
  }

  /**
   * @param token TokenDocument
   * @returns {{ disposition?: string }}
   */
  getTokenDocumentComputedProps(token) {
    if (!token) {
      return {};
    }

    return {
      disposition: this.getTokenDocumentDisposition(token),
      image: this.getTokenDocumentImage(token),
      type: this.getTokenDocumentType(token),
    };
  }
}
