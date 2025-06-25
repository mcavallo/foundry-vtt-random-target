import type { CategoryItemImage } from '#/types/module.ts';
import { EMPTY_IMAGE, PREFERRED_IMAGE, SETTING_IDS } from '@/constants';
import {
  $M,
  formatActorTypeId,
  formatDispositionId,
  getIsAnimatedImage,
  isTokenDefeated,
  sortByName,
} from '@/lib/utils.ts';

export class GameManager {
  getScene() {
    if (!canvas || !canvas.scene) {
      return;
    }

    return canvas.scene;
  }

  getSceneTokens() {
    if (
      !canvas ||
      !canvas.scene ||
      !canvas.scene.tokens ||
      !canvas.scene.tokens.contents
    ) {
      return [];
    }

    return canvas.scene.tokens.contents
      .slice()
      .filter((token) => token.id !== null)
      .sort(sortByName);
  }

  getToken(tokenId: string) {
    if (
      !canvas ||
      !canvas.tokens ||
      !canvas.tokens.objects ||
      !canvas.tokens.objects.children
    ) {
      return;
    }

    return (canvas.tokens.objects.children as Token[]).find(
      (token) => token.id === tokenId
    );
  }

  getSceneSelectedTokens() {
    if (!canvas || !canvas.tokens || !canvas.tokens.controlled) {
      return [];
    }

    return canvas.tokens.controlled.map((token) => token.id);
  }

  getSceneTargetedTokens() {
    if (!game || !game.user || !game.user.targets) {
      return [];
    }

    return game.user.targets.map((token) => token.id);
  }

  panToPosition(position: Canvas.ViewPosition) {
    if (!canvas) {
      return;
    }

    return canvas.animatePan(position);
  }

  targetToken(tokenId: string) {
    const target = this.getToken(tokenId);

    if (!target) {
      return;
    }

    target.setTarget(true, { releaseOthers: true });
    this.panToPosition(target.position);
    return target;
  }

  getTokenDocumentDisposition(token: TokenDocument) {
    if (!token.disposition) {
      return;
    }

    return formatDispositionId(token.disposition);
  }

  getTokenDocumentType(token: TokenDocument) {
    if (!token.actor || !token.actor.type) {
      return;
    }

    return formatActorTypeId(token.actor.type);
  }

  getTokenDocumentImage(token: TokenDocument): CategoryItemImage {
    if (!token) {
      return EMPTY_IMAGE;
    }

    const preferredImage = $M().settings.get(SETTING_IDS.PREFERRED_IMAGE);
    const actorImage = token?.actor?.img;
    let image = token?.texture?.src || EMPTY_IMAGE.src;

    // Attempt to use the actor image if the user preferred that
    if (preferredImage === PREFERRED_IMAGE.ACTOR && actorImage) {
      image = actorImage;
    }

    // Attempt to use the actor image as a fallback
    if (!image && actorImage) {
      image = actorImage;
    }

    return {
      src: image,
      animated: getIsAnimatedImage(image),
    };
  }

  getTokenDocumentName(token: TokenDocument) {
    return token.name || `Unnamed token (${token.id})`;
  }

  getTokenDocumentComputedProps(token: TokenDocument) {
    return {
      defeated: isTokenDefeated(token),
      disposition: this.getTokenDocumentDisposition(token),
      image: this.getTokenDocumentImage(token),
      name: this.getTokenDocumentName(token),
      type: this.getTokenDocumentType(token),
    };
  }
}
