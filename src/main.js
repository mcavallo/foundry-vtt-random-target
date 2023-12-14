import { run } from './apps/RandomTarget.js';
import { MODULE } from './constants.js';
import { MacroMigration } from './lib/MacroMigration.js';
import { registerSettings, saveSetting } from './settings.js';

import './styles/module.scss';

Hooks.once('init', function () {
  const initialSettings = registerSettings();
  const seed = Math.floor(Math.random() * 100000);

  window[MODULE.NAMESPACE] = {
    run: run, // Avoid using object property shorthand
    saveSetting: saveSetting, // Avoid using object property shorthand
    settings: initialSettings,
    mt: new MersenneTwister(seed),
  };
});

Hooks.once('ready', function () {
  const migration = new MacroMigration();
  migration.run();
});
