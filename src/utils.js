import { SYSTEM_IDS } from './constants.js';

export function isTokenDefeated(token) {
  try {
    switch (game.system.id) {
      case SYSTEM_IDS.CONAN:
        return token.overlayEffect.match('skull.svg');
      default:
        return token._actor.effects.some(effect => effect._statusId === 'dead');
    }
  } catch (_) {
    return false;
  }
}

export function sortTokensByName(a, b) {
  if (a.name > b.name) {
    return 1;
  } else if (b.name > a.name) {
    return -1;
  } else {
    return 0;
  }
}
