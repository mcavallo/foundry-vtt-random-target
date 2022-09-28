import { run } from './apps/random-target.js';

function computeSettings() {
  switch (game.system.id) {
    case 'forbidden-lands':
      return {
        formSettings: {
          width: 500,
          height: 372,
        },
      };
    case 'wfrp4e':
      return {
        formSettings: {
          width: 500,
          height: 388,
        },
      };
    default:
      return {
        formSettings: {
          width: 500,
          height: 359,
        },
      };
  }
}

function isTokenDefeated(token) {
  try {
    switch (game.system.id) {
      case 'conan2d20':
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
