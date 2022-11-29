import { run } from './apps/random-target.js';

const SYSTEM_IDS = {
  WFRP4E: 'wfrp4e',
  FL: 'forbidden-lands',
  CONAN: 'conan2d20',
};

function computeSettings() {
  switch (game.system.id) {
    case SYSTEM_IDS.FL:
      return {
        formSettings: {
          width: 500,
          height: 362,
        },
      };
    case SYSTEM_IDS.WFRP4E:
      return {
        formSettings: {
          width: 500,
          height: 380,
        },
      };
    default:
      return {
        formSettings: {
          width: 500,
          height: 352,
        },
      };
  }
}

function isTokenDefeated(token) {
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

function sortTokensByName(a, b) {
  if (a.name > b.name) {
    return 1;
  } else if (b.name > a.name) {
    return -1;
  } else {
    return 0;
  }
}

Hooks.once('init', function () {
  game.randomTarget = {
    run: run,
    settings: computeSettings(),
    utils: {
      isTokenDefeated,
      sortTokensByName,
    },
  };
});
