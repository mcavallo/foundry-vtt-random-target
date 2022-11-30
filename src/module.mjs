import { run } from './apps/random-target.js';
import { MODULE, SYSTEM_IDS } from './constants.js';

function computeSettings() {
  const baseSettings = {};

  switch (game.system.id) {
    case SYSTEM_IDS.FL:
      return {
        ...baseSettings,
        formSettings: {
          width: 500,
          height: 362,
        },
      };
    case SYSTEM_IDS.WFRP4E:
      return {
        ...baseSettings,
        formSettings: {
          width: 500,
          height: 380,
        },
      };
    default:
      return {
        ...baseSettings,
        formSettings: {
          width: 500,
          height: 352,
        },
      };
  }
}

Hooks.once('init', function () {
  game[MODULE.NAMESPACE] = {
    run: run,
    settings: computeSettings(),
  };
});
