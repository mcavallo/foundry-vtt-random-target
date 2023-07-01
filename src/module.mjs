import { run } from './apps/RandomTarget.js';
import { MODULE } from './constants.js';
import { MacroMigration } from './lib/MacroMigration.js';
import { registerSettings, saveSetting } from './settings.js';

Hooks.once('init', function () {
  const initialSettings = registerSettings();

  window[MODULE.NAMESPACE] = {
    run,
    saveSetting,
    settings: initialSettings,
  };
});

Hooks.once('ready', function () {
  const migration = new MacroMigration();
  migration.run();
});
