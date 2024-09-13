import { MODULE, SYSTEM_IDS } from './constants.js';

export function isTokenDefeated(token) {
  try {
    switch (game.system.id) {
      case SYSTEM_IDS.CONAN:
        return token.overlayEffect.match('skull.svg');
      default:
        return token._actor && token._actor.effects
          ? token._actor.effects.some(effect => effect._statusId === 'dead')
          : false;
    }
  } catch (_) {
    return false;
  }
}

export function sortAlphabetically(a, b) {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

export function sortTokensByName(a, b) {
  return sortAlphabetically(a.name, b.name);
}

export function getDispositionName(num) {
  const disposition = Object.entries(CONST.TOKEN_DISPOSITIONS).filter(pair => pair[1] === num);

  if (!disposition || disposition.length === 0) {
    return;
  }

  return disposition[0][0].toLowerCase();
}

export function getIsAnimatedImage(src) {
  return src && src.toLowerCase().match(/(?:mp4|ogv|webm)$/);
}

export function $M() {
  return window[MODULE.NAMESPACE];
}
