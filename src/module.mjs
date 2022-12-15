import { run } from './apps/RandomTarget.js';
import { MODULE } from './constants.js';
import { registerSettings, saveSetting } from './settings.js';

Hooks.once('init', function () {
  const initialSettings = registerSettings();

  game[MODULE.NAMESPACE] = {
    run,
    saveSetting,
    settings: initialSettings,
  };
});
