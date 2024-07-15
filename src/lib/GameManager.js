import { sortTokensByName } from '../utils.js';

export class GameManager {
  getScene() {
    if (!canvas || !canvas.scene) {
      return;
    }

    return canvas.scene;
  }

  getSceneTokens() {
    if (!canvas || !canvas.scene || !canvas.scene.tokens || !canvas.scene.tokens.contents) {
      return [];
    }

    return canvas.scene.tokens.contents.slice().sort(sortTokensByName);
  }

  getToken(tokenId) {
    if (!canvas || !canvas.tokens || !canvas.tokens.objects || !canvas.tokens.objects.children) {
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
}
