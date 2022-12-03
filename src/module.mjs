import { run } from './apps/random-target.js';
import { MODULE } from './constants.js';
import { registerSettings } from './settings.js';

Hooks.once('init', function () {
  const initialSettings = registerSettings();

  game[MODULE.NAMESPACE] = {
    run: run,
    settings: initialSettings,
  };
});
