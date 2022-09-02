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

Hooks.once('init', function () {
  game.randomTarget = {
    run: run,
    settings: computeSettings(),
  };
});
